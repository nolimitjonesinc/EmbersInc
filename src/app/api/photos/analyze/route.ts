import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai/client'
import { requireAuth } from '@/lib/auth/getAuthContext'

export const runtime = 'nodejs'

const MAX_BASE64_SIZE = 10 * 1024 * 1024 // 10MB

interface AnalyzeRequest {
  imageBase64: string
  previousContext?: string
}

export async function POST(request: NextRequest) {
  try {
    // Strict auth — photo analysis is expensive (GPT-4o vision)
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    const body: AnalyzeRequest = await request.json()
    const { imageBase64, previousContext } = body

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    // Size limit for base64 data
    if (imageBase64.length > MAX_BASE64_SIZE) {
      return NextResponse.json(
        { error: 'Image is too large. Please use a smaller photo.' },
        { status: 400 }
      )
    }

    // Build the system prompt for photo analysis
    const systemPrompt = `You are a warm, curious companion helping someone explore their old photographs to unlock memories. You're like a family historian sitting beside them, genuinely interested in their stories.

Your approach:
1. First, describe what you observe in the photo in a warm, conversational way (not clinical)
2. Then, ask 2-3 thoughtful questions that might spark memories
3. Focus on details that could trigger personal stories: clothing, expressions, setting, era indicators

Question style:
- Be specific: Instead of "Tell me about this", ask "That coat looks like it has a story - was it special to you?"
- Be curious: "I notice everyone is dressed up - was this a special occasion?"
- Be gentle: These might bring up emotional memories

If there are era clues (cars, fashion, technology), mention what decade this might be from.

${previousContext ? `Previous context about this photo: ${previousContext}` : ''}

Keep your response conversational and warm, like a friend looking through photos together.`

    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: 'Please look at this photo and help me remember the stories behind it.',
            },
          ],
        },
      ],
      max_tokens: 500,
    })

    const analysis = response.choices[0]?.message?.content

    if (!analysis) {
      return NextResponse.json(
        { error: 'We could not analyze this photo right now. Please try again.' },
        { status: 502 }
      )
    }

    // Extract potential tags from the analysis
    const tags = extractTagsFromAnalysis(analysis)

    // Estimate era from the analysis
    const eraMatch = analysis.match(/(\d{4}s?|\d{2}s)/i)
    const estimatedEra = eraMatch ? eraMatch[0] : null

    return NextResponse.json({
      analysis,
      tags,
      estimatedEra,
    })
  } catch (error) {
    console.error('Photo analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    )
  }
}

function extractTagsFromAnalysis(analysis: string): string[] {
  const tags: Set<string> = new Set()

  // Common photo-related keywords to look for
  const keywords = [
    'wedding', 'birthday', 'christmas', 'graduation', 'vacation',
    'family', 'children', 'parents', 'grandparents', 'siblings',
    'school', 'work', 'military', 'church', 'holiday',
    'summer', 'winter', 'spring', 'fall',
    'car', 'house', 'garden', 'beach', 'mountains',
  ]

  const lowerAnalysis = analysis.toLowerCase()

  keywords.forEach(keyword => {
    if (lowerAnalysis.includes(keyword)) {
      tags.add(keyword)
    }
  })

  return Array.from(tags).slice(0, 5)
}
