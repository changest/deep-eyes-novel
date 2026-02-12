import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { streamGenerate, systemPrompt, type Message } from '@/lib/kimi'

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  genre: z.string().optional(),
  style: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  previousContext: z.string().optional(),
})

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { id: novelId } = await params

    // Check user's quota
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const usageToday = await prisma.usageLog.aggregate({
      where: {
        userId: user.userId,
        createdAt: { gte: today },
      },
      _sum: { totalTokens: true },
    })

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { dailyQuota: true },
    })

    const usedToday = usageToday._sum.totalTokens || 0
    const dailyQuota = userData?.dailyQuota || 50000

    if (usedToday >= dailyQuota) {
      return new Response(
        JSON.stringify({ error: 'Daily quota exceeded' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify novel ownership
    const novel = await prisma.novel.findFirst({
      where: { id: novelId, userId: user.userId },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'desc' },
          take: 3,
          select: { content: true, chapterNumber: true },
        },
      },
    })

    if (!novel) {
      return new Response(
        JSON.stringify({ error: 'Novel not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { prompt, genre, style, temperature, previousContext } = generateSchema.parse(body)

    // Build messages
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Add genre and style context
    let contextPrompt = `小说类型：${genre || '未指定'}\n`
    if (style) contextPrompt += `写作风格：${style}\n`
    if (novel.synopsis) contextPrompt += `小说简介：${novel.synopsis}\n`

    // Add previous chapters as context
    if (novel.chapters.length > 0) {
      contextPrompt += '\n前文概要：\n'
      novel.chapters.reverse().forEach((chapter, idx) => {
        const preview = chapter.content.substring(0, 500)
        contextPrompt += `第${novel.chapters.length - idx}章：${preview}...\n`
      })
    }

    if (previousContext) {
      contextPrompt += `\n续写要求：${previousContext}\n`
    }

    messages.push({
      role: 'user',
      content: `${contextPrompt}\n请根据以下要求创作新章节：\n${prompt}`,
    })

    // Create stream
    const encoder = new TextEncoder()
    let fullContent = ''
    let inputTokens = 0
    let outputTokens = 0

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'start' }) + '\n'))

          for await (const chunk of streamGenerate(messages, { temperature })) {
            fullContent += chunk
            outputTokens += Math.ceil(chunk.length / 2) // Rough estimation
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'chunk', content: chunk }) + '\n'))
          }

          // Estimate input tokens
          inputTokens = messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 2), 0)
          const totalTokens = inputTokens + outputTokens

          // Save chapter to database
          const lastChapter = await prisma.chapter.findFirst({
            where: { novelId },
            orderBy: { chapterNumber: 'desc' },
          })
          const chapterNumber = (lastChapter?.chapterNumber || 0) + 1

          await prisma.chapter.create({
            data: {
              novelId,
              chapterNumber,
              content: fullContent,
              promptUsed: prompt,
              tokensUsed: totalTokens,
              temperature,
            },
          })

          // Log usage
          await prisma.usageLog.create({
            data: {
              userId: user.userId,
              novelId,
              requestType: 'generate',
              inputTokens,
              outputTokens,
              totalTokens,
            },
          })

          // Send completion
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'done',
            tokensUsed: totalTokens,
            chapterNumber,
          }) + '\n'))

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Generation failed',
          }) + '\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: error.issues[0].message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.error('Generate error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
