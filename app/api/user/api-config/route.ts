import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { encryptApiKey, decryptApiKey, type AIProvider, providerPresets } from '@/lib/ai-client'

const apiConfigSchema = z.object({
  provider: z.enum(['openai', 'kimi', 'anthropic', 'custom']),
  apiKey: z.string().min(1, 'API Key 不能为空'),
  baseUrl: z.string().optional(),
  model: z.string().min(1, '模型名称不能为空'),
})

// GET - 获取用户的 API 配置
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const config = await prisma.userApiConfig.findUnique({
      where: { userId: user.userId },
    })

    if (!config) {
      // 返回默认配置
      return new Response(
        JSON.stringify({
          provider: 'kimi',
          apiKey: '',
          baseUrl: providerPresets.kimi.baseUrl,
          model: providerPresets.kimi.models[2], // moonshot-v1-128k
          isActive: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 返回配置（隐藏完整的 API Key）
    return new Response(
      JSON.stringify({
        provider: config.provider,
        apiKey: config.apiKey ? '••••••••' + config.apiKey.slice(-4) : '',
        baseUrl: config.baseUrl || providerPresets[config.provider as AIProvider].baseUrl,
        model: config.model,
        isActive: config.isActive,
        hasApiKey: !!config.apiKey,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get API config error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// POST - 保存用户的 API 配置
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { provider, apiKey, baseUrl, model } = apiConfigSchema.parse(body)

    // 加密 API Key
    const encryptedKey = encryptApiKey(apiKey)

    // 使用 upsert 保存或更新配置
    await prisma.userApiConfig.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        provider,
        apiKey: encryptedKey,
        baseUrl: baseUrl || null,
        model,
        isActive: true,
      },
      update: {
        provider,
        apiKey: encryptedKey,
        baseUrl: baseUrl || null,
        model,
        isActive: true,
      },
    })

    return new Response(
      JSON.stringify({ message: 'API 配置已保存' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: error.issues[0].message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.error('Save API config error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// DELETE - 删除用户的 API 配置
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await prisma.userApiConfig.deleteMany({
      where: { userId: user.userId },
    })

    return new Response(
      JSON.stringify({ message: 'API 配置已删除' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete API config error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
