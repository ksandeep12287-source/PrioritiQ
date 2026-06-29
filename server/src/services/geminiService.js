const { GoogleGenAI } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY Missing');
    throw new Error('GEMINI_API_KEY environment variable is required');
}
console.log('✅ Gemini API Key Loaded');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// currentDate parameter add kiya
const analyzeTask = async (text, currentDate) => {
    try {
        const now = currentDate ? new Date(currentDate) : new Date();
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `You are PrioritiQ AI. Extract task details from Hindi/Hinglish text.
            Return ONLY valid JSON. No markdown, no explanation.
            
            Current Date/Time: ${now.toISOString()}
            Today is: ${now.toDateString()}
            
            Schema:
            {
              "title": "string, max 5 words",
              "description": "string or empty",
              "deadline": "ISO 8601 string or null",
              "priority": "low" | "medium" | "high"
            }

            DEADLINE RULES - VERY IMPORTANT:
            1. "kal 5 baje" / "tomorrow 5 PM" = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T17:00:00.000Z
            2. "parso subah 10 baje" = Add 2 days to current date, time 10:00:00.000Z
            3. "agla monday" = Calculate next Monday from current date
            4. "30 june 6 baje" = 2026-06-30T18:00:00.000Z
            5. If only date given, use 23:59:00.000Z
            6. If no date/time mentioned, deadline: null
            
            PRIORITY RULES:
            1. "urgent", "jaldi", "important", "assignment", "exam" → "high"
            2. "jab time mile", "aaram se" → "low"  
            3. Default → "medium"
            
            TITLE RULES:
            Extract main action, max 5 words. Example: "Client ko call karna hai" → "Client Call"
            
            User Text: "${text}"`,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        const parsedData = JSON.parse(response.text);
        return { data: parsedData, fallback: false };

    } catch (error) {
        console.error('Gemini Error:', error.message);
        
        if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded') || error.message?.includes('UNAVAILABLE')) {
            const err = new Error('AI model overloaded. Try again in 30 seconds.');
            err.status = 503;
            err.code = 'GEMINI_OVERLOAD';
            throw err;
        }
        
        return {
            data: {
                title: text,
                description: "",
                deadline: null,
                priority: "medium"
            },
            error: "AI parsing failed",
            fallback: true
        };
    }
};

module.exports = { analyzeTask, ai };