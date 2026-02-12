'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Key, Server, Sparkles, Check, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { providerPresets, type AIProvider } from '@/lib/ai-client'

interface ApiConfig {
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model: string
  isActive: boolean
  hasApiKey: boolean
}

export default function ApiSettingsPage() {
  const [config, setConfig] = useState<ApiConfig>({
    provider: 'kimi',
    apiKey: '',
    baseUrl: '',
    model: '',
    isActive: false,
    hasApiKey: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/user/api-config')
      if (response.ok) {
        const data = await response.json()
        setConfig({
          ...data,
          apiKey: data.hasApiKey ? '' : '', // 不显示真实的 API Key
        })
      }
    } catch (error) {
      console.error('Failed to fetch API config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config.apiKey && !config.hasApiKey) {
      toast.error('请输入 API Key')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/api-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey || undefined, // 如果为空，后端保留原值
          baseUrl: config.baseUrl,
          model: config.model,
        }),
      })

      if (response.ok) {
        toast.success('API 配置已保存')
        setIsEditing(false)
        fetchConfig()
      } else {
        const data = await response.json()
        throw new Error(data.error || '保存失败')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除 API 配置吗？')) return

    try {
      const response = await fetch('/api/user/api-config', {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('API 配置已删除')
        setConfig({
          provider: 'kimi',
          apiKey: '',
          baseUrl: '',
          model: '',
          isActive: false,
          hasApiKey: false,
        })
        setIsEditing(true)
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleProviderChange = (provider: AIProvider) => {
    const preset = providerPresets[provider]
    setConfig({
      ...config,
      provider,
      baseUrl: preset.baseUrl,
      model: preset.models[0],
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-gray-400 py-8 text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <Link href="/settings">
        <Button variant="ghost" className="text-gray-500 hover:text-gray-700 -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回设置
        </Button>
      </Link>

      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">AI API 配置</h1>
        <p className="text-gray-500 mt-1">配置您自己的 AI API，支持多种服务商</p>
      </div>

      {/* API 配置卡片 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
            <Key className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">API 设置</h2>
            <p className="text-sm text-gray-500">配置您的 AI 服务提供商</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 服务商选择 */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">选择服务商</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(providerPresets) as AIProvider[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => handleProviderChange(provider)}
                  disabled={!isEditing && config.hasApiKey}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    config.provider === provider
                      ? 'border-cyan-400 bg-cyan-50/50'
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                  } ${!isEditing && config.hasApiKey ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium text-gray-800">
                    {providerPresets[provider].name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {providerPresets[provider].models.length} 个可用模型
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-gray-700 font-medium">
              API Key
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder={config.hasApiKey ? '已配置 ••••••••' : '输入您的 API Key'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                disabled={!isEditing && config.hasApiKey}
                className="h-12 pr-10 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              您的 API Key 将被加密存储，仅用于生成内容
            </p>
          </div>

          {/* 自定义 API 地址（仅自定义时显示） */}
          {config.provider === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="baseUrl" className="text-gray-700 font-medium">
                API 地址
              </Label>
              <Input
                id="baseUrl"
                placeholder="https://api.example.com/v1"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                disabled={!isEditing && config.hasApiKey}
                className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-cyan-400"
              />
            </div>
          )}

          {/* 模型选择 */}
          <div className="space-y-2">
            <Label htmlFor="model" className="text-gray-700 font-medium">
              模型
            </Label>
            {config.provider === 'custom' ? (
              <Input
                id="model"
                placeholder="输入模型名称"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                disabled={!isEditing && config.hasApiKey}
                className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-cyan-400"
              />
            ) : (
              <select
                id="model"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                disabled={!isEditing && config.hasApiKey}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                {providerPresets[config.provider].models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 状态显示 */}
          {config.hasApiKey && !isEditing && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl">
              <Check className="h-5 w-5 text-emerald-500" />
              <span className="text-emerald-600 text-sm">
                API 已配置，当前使用 {providerPresets[config.provider].name} 的 {config.model} 模型
              </span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            {config.hasApiKey && !isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200"
                >
                  <Key className="h-4 w-4 mr-2" />
                  修改配置
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="h-12 px-6 rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                >
                  删除
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200"
                >
                  {isSaving ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      保存配置
                    </>
                  )}
                </Button>
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      fetchConfig()
                    }}
                    className="h-12 px-6 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    取消
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800 mb-2">使用说明</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 配置您自己的 API Key 后，系统将使用您的 API 进行 AI 生成</li>
              <li>• 支持的 API 格式：OpenAI 兼容格式、Anthropic Claude 格式</li>
              <li>• API Key 将被加密存储，我们不会记录或使用您的 Key 进行其他操作</li>
              <li>• 如需使用中转 API，请选择"自定义 API"并填写中转地址</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
