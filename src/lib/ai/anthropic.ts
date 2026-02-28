
/**
 * Anthropic API клиент (Claude)
 */

export async function askAnthropic(prompt: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-latest',
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }]
            })
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`Anthropic API error: ${response.status} - ${err}`)
        }

        const data: any = await response.json()
        return data.content[0].text
    } catch (error) {
        console.error('Anthropic Call Failed:', error)
        throw error
    }
}
