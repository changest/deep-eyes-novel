import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const createChapterSchema = z.object({
  title: z.string().optional(),
  content: z.string(),
  promptUsed: z.string(),
  tokensUsed: z.number().default(0),
  model: z.string().default('moonshot-v1-128k'),
  temperature: z.number().default(0.7),
})

const updateChapterSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
})

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/novels/[id]/chapters - Get all chapters for a novel
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: novelId } = await params

    const novel = await prisma.novel.findFirst({
      where: { id: novelId, userId: user.userId },
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const chapters = await prisma.chapter.findMany({
      where: { novelId },
      orderBy: { chapterNumber: 'asc' },
    })

    return NextResponse.json({ chapters })
  } catch (error) {
    console.error('Get chapters error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/novels/[id]/chapters - Create a new chapter
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: novelId } = await params

    const novel = await prisma.novel.findFirst({
      where: { id: novelId, userId: user.userId },
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = createChapterSchema.parse(body)

    // Get the next chapter number
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId },
      orderBy: { chapterNumber: 'desc' },
    })
    const chapterNumber = (lastChapter?.chapterNumber || 0) + 1

    const chapter = await prisma.chapter.create({
      data: {
        novelId,
        chapterNumber,
        ...data,
      },
    })

    return NextResponse.json({ chapter }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Create chapter error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/novels/[id]/chapters - Update a chapter
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: novelId } = await params
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID required' }, { status: 400 })
    }

    const novel = await prisma.novel.findFirst({
      where: { id: novelId, userId: user.userId },
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = updateChapterSchema.parse(body)

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data,
    })

    return NextResponse.json({ chapter })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Update chapter error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
