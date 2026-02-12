import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const createNovelSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  genre: z.string().optional(),
  synopsis: z.string().optional(),
  settings: z.any().optional(),
})

// GET /api/novels - Get all novels for current user
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const novels = await prisma.novel.findMany({
      where: { userId: user.userId },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ novels })
  } catch (error) {
    console.error('Get novels error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/novels - Create a new novel
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, genre, synopsis, settings } = createNovelSchema.parse(body)

    const novel = await prisma.novel.create({
      data: {
        userId: user.userId,
        title,
        genre,
        synopsis,
        settings: settings ? JSON.stringify(settings) : null,
        status: 'draft',
      },
    })

    return NextResponse.json({ novel }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Create novel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
