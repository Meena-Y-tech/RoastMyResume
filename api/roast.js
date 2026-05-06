export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { resume } = req.body;

    if (!resume) {
        return res.status(400).json({ error: 'No resume provided' });
    }

    const prompt = `You are an expert career coach with 20 years of experience. 
    
Analyze the following resume and provide:
1. A score from 0-100
2. A witty but constructive "roast" (1-2 paragraphs) about what needs improvement
3. A list of 5-6 specific fixes they should make
4. A list of 5-6 pro tips for resume success

Format your response as JSON with these keys: score, roast, fixes (array), tips (array)

Resume:
${resume}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        return res.status(500).json({ error: 'Claude API request failed' });
    }

    const data = await response.json();
    const content = data.content[0].text;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return res.status(500).json({ error: 'Could not parse response' });
    }

    const results = JSON.parse(jsonMatch[0]);
    return res.status(200).json(results);
}