/**
 * Unified AI Provider Orchestrator (The "Brain")
 * Handles automatic fallback across multiple providers.
 */

import { askDeepSeek } from './deepseek'
import { askOpenRouter } from './openrouter'
import { askPerplexity } from './perplexity'
import { askAnthropic } from './anthropic'

interface GeminiResponse {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>
}

const MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'openrouter',
    'anthropic',
    'perplexity',
    'moonshot',
    'openai',
    'deepseek'
]

async function fetchGemini(model: string, apiKey: string, prompt: string, isJson: boolean = false) {
    const config: any = {
        contents: [{ role: 'user' as const, parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
        }
    }

    if (isJson) {
        config.generationConfig.responseMimeType = "application/json"
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        }
    )
    return response
}


/**
 * Main entry point for AI queries with automatic fallback.
 */
export async function askAI(prompt: string, options: { json?: boolean } = {}): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    let lastError: any = null

    for (const model of MODELS) {
        try {
            console.log(`🤖 [Orchestrator] Trying ${model}...`)

            // 1. Google Gemini Models
            if (model.startsWith('gemini')) {
                if (!geminiKey) continue
                const response = await fetchGemini(model, geminiKey, prompt, options.json)

                if (response.ok) {
                    const data: GeminiResponse = await response.json()
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
                    if (text) return text
                }

                if (response.status === 429 || response.status === 503 || response.status === 404) {
                    console.warn(`⚠️ ${model} issue (${response.status}). Rotating...`)
                    continue
                }
            }

            // 2. OpenRouter (Aggregator)
            else if (model === 'openrouter') {
                if (!process.env.OPENROUTER_API_KEY) continue
                try {
                    return await askOpenRouter(prompt)
                } catch (e) {
                    console.warn('OpenRouter failed, rotating...')
                    continue
                }
            }

            // 3. Anthropic
            else if (model === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
                try {
                    return await askAnthropic(prompt)
                } catch (e) {
                    console.warn('Anthropic failed, rotating...')
                    continue
                }
            }

            // 4. Perplexity
            else if (model === 'perplexity' && process.env.PERPLEXITY_API_KEY) {
                try {
                    return await askPerplexity([{ role: 'user', content: prompt }])
                } catch (e) {
                    console.warn('Perplexity failed, rotating...')
                    continue
                }
            }

            // 5. OpenAI Fallback
            else if (model === 'openai') {
                if (!openaiKey) continue
                try {
                    const res = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openaiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o-mini',
                            messages: [{ role: 'user', content: prompt }],
                            response_format: options.json ? { type: "json_object" } : undefined
                        })
                    })
                    if (res.ok) {
                        const data = await res.json()
                        return data.choices[0].message.content
                    }
                } catch (e) {
                    console.warn('OpenAI failed, rotating...')
                }
                continue
            }

            // 4. Moonshot direct
            else if (model === 'moonshot') {
                if (!process.env.MOONSHOT_API_KEY) continue
                try {
                    const { askMoonshot } = await import('./moonshot')
                    return await askMoonshot(prompt)
                } catch (e) {
                    console.warn('Moonshot failed, rotating...')
                    continue
                }
            }

            // 5. DeepSeek direct
            else if (model === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
                return await askDeepSeek(prompt)
            }

        } catch (e) {
            console.error(`❌ Provider ${model} error:`, e)
            lastError = e
        }
    }

    throw new Error(lastError?.message || 'All AI providers failed. Quota reached everywhere.')
}

// Keep askGemini for backward compatibility but route to askAI
export const askGemini = (prompt: string) => askAI(prompt)
