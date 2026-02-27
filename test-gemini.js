const https = require('https');
const prompt = `напиши слово "привет"`;
const GEMINI_API_KEY = "AIzaSyAFD7EEsp_dwB1_B8jDqnLGhjeMWMUzxGY";

const data = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
        temperature: 0.4
    }
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: '/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, res => {
    let responseData = '';
    res.on('data', chunk => {
        responseData += chunk;
    });
    res.on('end', () => {
        const parsed = JSON.parse(responseData);
        if (parsed.error) {
           console.log("Error:", parsed.error.message);
        } else {
           console.log("Result:", parsed.candidates[0].content.parts[0].text);
        }
    });
});
req.on('error', error => {
    console.error(error);
});
req.write(data);
req.end();
