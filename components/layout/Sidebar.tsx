'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, Settings, PenTool, LogOut, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/novels', label: '作品', icon: BookOpen },
  { href: '/novels/new', label: '创作', icon: PenTool },
  { href: '/settings', label: '设置', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('已退出登录')
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('退出失败')
    }
  }

  return (
    <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-gray-100 min-h-screen flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Logo区域 - 魅族风格 */}
      <div className="p-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-200 group-hover:shadow-cyan-300 transition-shadow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">深瞳</span>
            <span className="text-[10px] text-gray-400 tracking-widest">SHENTONG</span>
          </div>
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          // 精确匹配路径，/novels 只匹配作品列表，不匹配 /novels/new 或 /novels/123
          const isActive = pathname === item.href || pathname === `${item.href}/`
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group',
                isActive
                  ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-700'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
                isActive
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-md shadow-cyan-200'
                  : 'bg-gray-100 group-hover:bg-white group-hover:shadow-sm'
              )}>
                <Icon className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-cyan-500'
                )} />
              </div>
              <span className="font-medium text-[15px]">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 底部区域 */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">每日配额</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
            </div>
            <span className="text-xs font-medium text-gray-600">75%</span>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          退出登录
        </Button>
      </div>
    </aside>
  )
}
