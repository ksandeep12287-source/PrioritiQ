const conversationSessions = new Map();
const { analyzeTask, ai } = require('../services/geminiService');
const Task = require('../models/Task');
const logger = require('../utils/logger');

// 👇 LOCAL FALLBACK PARSER - Fixed
function localTaskParser(message, state) {
  const text = message.toLowerCase();
  let updatedTask = {...state.task};
  let status = 'question';
  let reply = '';

  // Step 1: Title extract - kal/parso hata diya
  if (!updatedTask.title || updatedTask.title === '') {
    updatedTask.title = message
   .replace(/today|tomorrow|high|medium|low|urgent|jaldi|hi|rakho/gi, '')
   .replace(/subah|shaam|baje|ko|me|deadline|priority|date/gi, '')
   .replace(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g, '') // dates hatao
   .replace(/\d{1,2}/g, '')
   .trim();
    if (!updatedTask.title) updatedTask.title = message;
  }

  // Step 2: Deadline extract - only today/tomorrow/date
  if (!updatedTask.deadline) {
    if (text.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0);
      updatedTask.deadline = tomorrow.toISOString();
    } else if (text.includes('today')) {
      const today = new Date();
      today.setHours(17, 0, 0, 0);
      updatedTask.deadline = today.toISOString();
    } else {
      // Try to parse date like 30/06/2026 or 30-06-2026
      const dateMatch = message.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        const fullYear = year.length === 2 ? '20' + year : year;
        const parsedDate = new Date(`${fullYear}-${month}-${day}`);
        if (!isNaN(parsedDate)) {
          parsedDate.setHours(17, 0, 0, 0);
          updatedTask.deadline = parsedDate.toISOString();
        }
      }
    }
  }

  // Step 3: Priority - same as before
  const userSaidPriority = text.includes('high') || text.includes('low') || text.includes('medium') || 
                          text.includes('urgent') || text.includes('jaldi') || text.includes('hi ') || 
                          text.includes('tez') || text.includes('important');

  if (userSaidPriority) {
    if (text.includes('high') || text.includes('urgent') || text.includes('jaldi') || 
        text.includes('hi ') || text.includes('tez') || text.includes('important')) {
      updatedTask.priority = 'high';
    } else if (text.includes('low')) {
      updatedTask.priority = 'low';
    } else {
      updatedTask.priority = 'medium';
    }
  }

  // Step 4: Decide next question - 👈 CHANGED
  if (!updatedTask.deadline) {
    reply = 'Deadline kab tak? today/tomorrow ya date batao'; // 👈 Better
    status = 'question';
  } else if (!updatedTask.priority) {
    reply = 'Priority kya rakhu? high/medium/low';
    status = 'question';
  } else {
    status = 'complete';
    reply = `Done: ${updatedTask.title} create kar diya.`;
  }

  return {
    status,
    reply,
    updatedTask,
    nextStep: status === 'complete'? 'completed' : 'collecting'
  };
}

exports.analyzeTaskController = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required' });
    }
    const result = await analyzeTask(text);
    res.status(200).json(result);
  } catch (err) {
    logger.error('Controller error:', err.message);
    if (err.status === 503 || err.code === 'GEMINI_OVERLOAD') {
      return res.status(503).json({
        error: 'AI model overloaded. Try again in 30 seconds.',
        code: 'GEMINI_OVERLOAD'
      });
    }
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};

exports.chatController = async (req, res) => {
  try {
    const { message, sessionId = 'default_user', currentDate } = req.body; // ← CHANGE 1: currentDate ADD KIYA
    console.log('SessionID:', sessionId, 'Message:', message, 'Date:', currentDate);

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        status: "error",
        reply: "Message empty hai bhai"
      });
    }

    let state = conversationSessions.get(sessionId) || {
      step: "collecting",
      task: { title: "", description: "", deadline: null, priority: null }
    };

    console.log('Current State Before:', state.task);
    const now = currentDate ? new Date(currentDate) : new Date();
    const todayISO = now.toISOString();
    const currentState = JSON.stringify(state.task);

    let parsed;

    try {
      // TRY GEMINI FIRST
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: `User said: "${message}".`,
        config: {
          systemInstruction: `You are PrioritiQ Agent. You MUST respond with valid JSON only.

HARD RULES:
1. If CURRENT STATE has title:"something" then NEVER output "title kya hai"
2. If CURRENT STATE has deadline:"2026-06-30T17:00:00.000Z" then NEVER output "Deadline kya hai"
3. If title+deadline+priority sab hai = status:"complete"
4. User "haan/yes/correct/thik hai/ok" bole = status:"complete"

CURRENT STATE: ${currentState}
TODAY: ${todayISO}
CURRENT DATE: ${now.toDateString()}

DEADLINE PARSING - CRITICAL:
1. "kal" / "tomorrow" = ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}T17:00:00.000Z
2. "Date"/parso" = ${new Date(now.getTime() + 172800000).toISOString().split('T')[0]}T17:00:00.000Z  
3. "aaj" / "today" = ${todayISO.split('T')[0]}T17:00:00.000Z
4. "subah 10 baje" = 10:00:00.000Z, "shaam 6 baje" = 18:00:00.000Z
5. Time na bole to 17:00:00 use kar
6. Date na samjhe to deadline: null

FLOW:
- title empty → ask title
- title has value + deadline null → ask deadline: "Deadline kab tak? today/tomorrow/Date"
- title+deadline has value + priority null → ask priority: "Priority kya rakhu? high/medium/low"
- title+deadline+priority has value → status:"complete"

OUTPUT ONLY THIS JSON:
{"status":"question|complete","reply":"Hinglish me 1 line","updatedTask":{"title":"string","description":"string","deadline":"ISO or null","priority":"low/medium/high or null"},"nextStep":"collecting|completed"}`
        }
      });

      let text = result.text.replace(/```json|```/g, '').trim();
      logger.info('Agent raw response:', text);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Gemini did not return JSON');
      parsed = JSON.parse(jsonMatch[0]);

    } catch (geminiErr) {
      if (geminiErr.status === 429 || geminiErr.error?.code === 429 || geminiErr.message?.includes("RESOURCE_EXHAUSTED")) {
        logger.warn('Gemini quota exceeded. Using local parser.');
        parsed = localTaskParser(message, state);
      } else {
        throw geminiErr;
      }
    }

    // SMART MERGE
    state.task = {
      title: parsed.updatedTask.title || state.task.title,
      description: parsed.updatedTask.description || state.task.description,
      deadline: parsed.updatedTask.deadline || state.task.deadline,
      priority: parsed.updatedTask.priority || state.task.priority
    };

    // AUTO COMPLETE
    if (state.task.title && state.task.deadline && state.task.priority && parsed.status!== 'complete') {
      parsed.status = 'complete';
      parsed.reply = `Done: ${state.task.title} create kar diya.`;
      parsed.nextStep = 'completed';
    }

    state.step = parsed.nextStep;
    console.log('Updated State After:', state.task);
    conversationSessions.set(sessionId, state);

    let createdTask = null;
    if (parsed.status === 'complete') {
      createdTask = await Task.create({
        title: state.task.title,
        description: state.task.description || '',
        deadline: state.task.deadline? new Date(state.task.deadline) : null,
        priority: state.task.priority || 'medium',
        status: 'pending'
      });
      conversationSessions.delete(sessionId);
    }

    setTimeout(() => conversationSessions.delete(sessionId), 5 * 60 * 1000);

    res.json({
      success: true,
      status: parsed.status,
      reply: parsed.reply,
      sessionId,
      task: createdTask
    });

  } catch (err) {
    console.log('FULL ERROR:', err.message, err);
    logger.error('Chat controller error:', err.message);

    if (err.status === 429 || err.error?.code === 429 || err.message?.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        reply: "AI busy hai, smart offline parser use kiya gaya. Phir se try karo."
      });
    }

    res.status(500).json({
      success: false,
      status: "error",
      reply: "Sorry yaar, samajh nahi paya. Phir se bolo."
    });
  }
};