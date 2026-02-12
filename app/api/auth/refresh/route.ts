import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, generateTokens, setAuthCookies } from '@/lib/auth'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      )
    }

    const { userId } = verifyRefreshToken(refreshToken)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        dailyQuota: user.dailyQuota,
        quotaResetAt: user.quotaResetAt.toISOString(),
        isPremium: user.isPremium,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    )
  }
}
