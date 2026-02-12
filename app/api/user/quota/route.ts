import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/user/quota - Get user's quota information
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        dailyQuota: true,
        quotaResetAt: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if quota needs to be reset (new day)
    const now = new Date()
    const resetAt = new Date(userData.quotaResetAt)
    const isNewDay = now.getDate() !== resetAt.getDate() ||
                     now.getMonth() !== resetAt.getMonth() ||
                     now.getFullYear() !== resetAt.getFullYear()

    if (isNewDay) {
      await prisma.user.update({
        where: { id: user.userId },
        data: {
          quotaResetAt: now,
        },
      })
    }

    // Calculate used tokens today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const usageToday = await prisma.usageLog.aggregate({
      where: {
        userId: user.userId,
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        totalTokens: true,
      },
    })

    const usedToday = usageToday._sum.totalTokens || 0
    const dailyQuota = userData.dailyQuota

    return NextResponse.json({
      dailyQuota,
      usedToday,
      remaining: Math.max(0, dailyQuota - usedToday),
      resetAt: userData.quotaResetAt.toISOString(),
    })
  } catch (error) {
    console.error('Get quota error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
