import fs from 'fs';
import path from 'path';

/**
 * AI Cascade Validator
 * Тестирует все настроенные API ключи и выводит их статус.
 */

function getEnv(key) {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
        if (match) return match[1].trim();
    }
    return process.env[key];
}

async function testProvider(name, url, headers, body) {
    try {
        const start = Date.now();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(body)
        });
        const duration = Date.now() - start;

        if (res.ok) {
            console.log(`✅ ${name.padEnd(12)}: OK (${duration}ms)`);
            return true;
        } else {
            const err = await res.text();
            console.error(`❌ ${name.padEnd(12)}: Error ${res.status} - ${err.substring(0, 100)}...`);
            return false;
        }
    } catch (e) {
        console.error(`❌ ${name.padEnd(12)}: Failed - ${e.message}`);
        return false;
    }
}

async function main() {
    console.log('--- AI Cascade Health Check ---\n');

    // 1. Gemini
    const geminiKey = getEnv('GEMINI_API_KEY');
    if (geminiKey) {
        await testProvider('Gemini-Flash',
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {}, { contents: [{ parts: [{ text: 'hi' }] }] }
        );
    } else console.log('⚪ Gemini-Flash: No key');

    // 2. OpenRouter
    const orKey = getEnv('OPENROUTER_API_KEY');
    if (orKey) {
        await testProvider('OpenRouter',
            'https://openrouter.ai/api/v1/chat/completions',
            { 'Authorization': `Bearer ${orKey}` },
            { model: 'google/gemini-2.0-flash-001', messages: [{ role: 'user', content: 'hi' }] }
        );
    } else console.log('⚪ OpenRouter: No key');

    // 3. Moonshot
    const msKey = getEnv('MOONSHOT_API_KEY');
    if (msKey) {
        await testProvider('Moonshot',
            'https://api.moonshot.cn/v1/chat/completions',
            { 'Authorization': `Bearer ${msKey}` },
            { model: 'moonshot-v1-8k', messages: [{ role: 'user', content: 'hi' }] }
        );
    } else console.log('⚪ Moonshot: No key');

    // 4. OpenAI
    const oaKey = getEnv('OPENAI_API_KEY');
    if (oaKey) {
        await testProvider('OpenAI',
            'https://api.openai.com/v1/chat/completions',
            { 'Authorization': `Bearer ${oaKey}` },
            { model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'hi' }] }
        );
    } else console.log('⚪ OpenAI: No key');

    console.log('\n--- End of Check ---');
}

main();
