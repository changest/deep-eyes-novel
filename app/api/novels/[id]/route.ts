import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const updateNovelSchema = z.object({
  title: z.string().min(1).optional(),
  genre: z.string().optional(),
  synopsis: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  settings: z.any().optional(),
})

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/novels/[id] - Get a single novel
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const novel = await prisma.novel.findFirst({
      where: {
        id,
        userId: user.userId,
      },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            tokensUsed: true,
            createdAt: true,
          },
        },
      },
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    return NextResponse.json({ novel })
  } catch (error) {
    console.error('Get novel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/novels/[id] - Update a novel
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateNovelSchema.parse(body)

    const existingNovel = await prisma.novel.findFirst({
      where: { id, userId: user.userId },
    })

    if (!existingNovel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const novel = await prisma.novel.update({
      where: { id },
      data: {
        ...data,
        settings: data.settings ? JSON.stringify(data.settings) : undefined,
      },
    })

    return NextResponse.json({ novel })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Update novel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/novels/[id] - Delete a novel
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingNovel = await prisma.novel.findFirst({
      where: { id, userId: user.userId },
    })

    if (!existingNovel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    await prisma.novel.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete novel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
