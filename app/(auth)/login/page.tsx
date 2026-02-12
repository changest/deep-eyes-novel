'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      toast.success('欢迎回来')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo区域 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-xl shadow-cyan-200 mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
          深瞳
        </h1>
        <p className="text-sm text-gray-400 tracking-widest uppercase">Shentong AI</p>
      </div>

      {/* 登录卡片 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/50 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">欢迎回来</h2>
          <p className="text-sm text-gray-500">登录您的深瞳账号继续创作</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              邮箱地址
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-cyan-400 focus:ring-cyan-400/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              密码
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="输入您的密码"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-cyan-400 focus:ring-cyan-400/20 transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200 hover:shadow-cyan-300 transition-all duration-300 group"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                登录
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            还没有账号？{' '}
            <Link
              href="/register"
              className="text-cyan-500 hover:text-cyan-600 font-medium transition-colors"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
        <div className="w-2 h-2 rounded-full bg-blue-400/60" />
        <div className="w-2 h-2 rounded-full bg-purple-400/60" />
      </div>
    </div>
  )
}
