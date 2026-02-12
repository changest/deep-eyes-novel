const KIMI_API_KEY = process.env.KIMI_API_KEY
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateOptions {
  temperature?: number
  max_tokens?: number
  model?: string
}

export const systemPrompt = `你是一位专业网络小说作家，擅长创作吸引读者的长篇连载小说。
要求：
- 情节紧凑，每章都有冲突或转折
- 人物对话生动自然
- 环境描写细腻但不拖沓
- 根据指定风格调整文笔 (玄幻/科幻/言情/悬疑等)
- 每章字数控制在3000-5000字

请直接输出小说内容，不要包含任何解释性文字。`

export async function* streamGenerate(
  messages: Message[],
  options: GenerateOptions = {}
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || 'moonshot-v1-128k',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens || 4096,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Kimi API error: ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) yield content
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function generateNonStream(
  messages: Message[],
  options: GenerateOptions = {}
): Promise<string> {
  const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || 'moonshot-v1-128k',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens || 4096,
      stream: false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Kimi API error: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}
