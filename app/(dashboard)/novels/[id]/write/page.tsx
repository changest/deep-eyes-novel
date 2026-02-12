'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Pause, Play, Save, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Novel, Chapter } from '@/types'
import ReactMarkdown from 'react-markdown'

export default function WritePage() {
  const params = useParams()
  const novelId = params.id as string
  const [novel, setNovel] = useState<Novel | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Generation state
  const [prompt, setPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [style, setStyle] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [tokensUsed, setTokensUsed] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetchNovelData()
  }, [novelId])

  const fetchNovelData = async () => {
    try {
      const [novelRes, chaptersRes] = await Promise.all([
        fetch(`/api/novels/${novelId}`),
        fetch(`/api/novels/${novelId}/chapters`),
      ])

      if (novelRes.ok) {
        const novelData = await novelRes.json()
        setNovel(novelData.novel)
      }

      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json()
        setChapters(chaptersData.chapters || [])
      }
    } catch (error) {
      console.error('Failed to fetch novel data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入生成提示')
      return
    }

    setIsGenerating(true)
    setIsPaused(false)
    setGeneratedContent('')
    setTokensUsed(0)

    try {
      const response = await fetch(`/api/novels/${novelId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          genre: novel?.genre,
          style,
          temperature,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '生成失败')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()

      while (true) {
        if (isPaused) {
          await new Promise(resolve => setTimeout(resolve, 100))
          continue
        }

        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)

            if (data.type === 'chunk') {
              setGeneratedContent(prev => prev + data.content)
            } else if (data.type === 'done') {
              setTokensUsed(data.tokensUsed)
              toast.success(`生成完成！使用了 ${data.tokensUsed} tokens`)
              fetchNovelData() // Refresh chapters
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
          } catch {
            // Ignore parse errors for individual lines
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePauseResume = () => {
    setIsPaused(!isPaused)
  }

  const handleSave = async () => {
    if (!generatedContent.trim()) {
      toast.error('没有内容可保存')
      return
    }

    try {
      const response = await fetch(`/api/novels/${novelId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedContent,
          promptUsed: prompt,
          tokensUsed,
          temperature,
        }),
      })

      if (response.ok) {
        toast.success('章节已保存')
        fetchNovelData()
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    }
  }

  const handleExport = (format: 'markdown' | 'txt') => {
    const content = generatedContent
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${novel?.title || 'novel'}_chapter.${format === 'markdown' ? 'md' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`已导出为 ${format.toUpperCase()}`)
  }

  if (isLoading) {
    return <div className="text-gray-400 py-8 text-center">加载中...</div>
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/novels/${novelId}`}>
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">AI写作助手</h1>
            <p className="text-gray-500 text-sm">{novel?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generatedContent && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl"
                onClick={() => handleExport('markdown')}
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-cyan-200"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                保存到章节
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Panel - Settings */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:col-span-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">生成设置</h2>
                <p className="text-sm text-gray-500">配置AI写作参数</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5 flex-1 overflow-auto">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">写作提示</Label>
              <Textarea
                placeholder="描述您想要生成的内容...&#10;例如：主角在森林中遇到了神秘老人"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="bg-gray-50/50 border-gray-200 text-gray-800 rounded-xl resize-none focus:bg-white focus:border-cyan-400 focus:ring-cyan-400/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">写作风格</Label>
              <Textarea
                placeholder="如：细腻的、紧凑的、悬疑的..."
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                rows={2}
                className="bg-gray-50/50 border-gray-200 text-gray-800 rounded-xl resize-none focus:bg-white focus:border-cyan-400 focus:ring-cyan-400/20 transition-all"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 font-medium">创意度</Label>
                <span className="text-cyan-600 text-sm font-medium bg-cyan-50 px-2 py-1 rounded-lg">{temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
                min={0}
                max={2}
                step={0.1}
                className="py-2"
              />
              <p className="text-xs text-gray-400">
                较低值生成更确定的内容，较高值更具创造性
              </p>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200 hover:shadow-cyan-300 transition-all duration-300"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  开始生成
                </>
              )}
            </Button>

            {isGenerating && (
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={handlePauseResume}
              >
                {isPaused ? (
                  <><Play className="h-4 w-4 mr-2" /> 继续</>
                ) : (
                  <><Pause className="h-4 w-4 mr-2" /> 暂停</>
                )}
              </Button>
            )}

            {tokensUsed > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  本次消耗:
                  <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0">
                    {tokensUsed} tokens
                  </Badge>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">生成预览</h2>
                <p className="text-sm text-gray-500">实时查看AI创作内容</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {generatedContent ? (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{generatedContent}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-cyan-400" />
                  </div>
                  <p className="text-gray-500">在左侧设置生成参数并点击"开始生成"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
