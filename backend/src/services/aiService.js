const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { SUBJECTS, DIFFICULTY_LEVELS } = require('../config/subjects');

// Lazy initialization - create clients only when needed
let anthropicClient = null;
let openaiClient = null;

const getAnthropicClient = () => {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return anthropicClient;
};

const getOpenAIClient = () => {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
};

// Track daily usage for Claude free tier
let claudeUsageToday = 0;
let lastResetDate = new Date().toDateString();

const CLAUDE_DAILY_LIMIT = 45; // Keep some buffer from 50

// Reset counter daily
const checkAndResetUsage = () => {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    claudeUsageToday = 0;
    lastResetDate = today;
  }
};

// Generate task using AI
const generateTask = async ({ subject, topic, difficulty, language = 'ru' }) => {
  checkAndResetUsage();

  const subjectInfo = SUBJECTS[subject];
  const difficultyInfo = DIFFICULTY_LEVELS[difficulty];

  if (!subjectInfo || !difficultyInfo) {
    throw new Error('Неверная специальность или уровень сложности');
  }

  const prompt = createTaskPrompt(subjectInfo, topic, difficultyInfo, language);

  // Try Claude first if under limit
  if (claudeUsageToday < CLAUDE_DAILY_LIMIT && process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await generateWithClaude(prompt);
      claudeUsageToday++;
      return { ...result, model: 'claude' };
    } catch (error) {
      console.error('Claude error, falling back to OpenAI:', error.message);
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    const result = await generateWithOpenAI(prompt);
    return { ...result, model: 'gpt-3.5' };
  }

  throw new Error('Нет доступных AI провайдеров');
};

// Create prompt for task generation
const createTaskPrompt = (subjectInfo, topic, difficultyInfo, language) => {
  const langInstruction = language === 'kz' 
    ? 'Ответ должен быть на казахском языке.'
    : 'Ответ должен быть на русском языке.';

  return `Ты - опытный преподаватель колледжа ККИТИС (Караганда, Казахстан).
Создай практическое задание для студентов.

СПЕЦИАЛЬНОСТЬ: ${subjectInfo.nameRu} (${subjectInfo.nameKz})
ТЕМА: ${topic}
УРОВЕНЬ СЛОЖНОСТИ: ${difficultyInfo.nameRu} - ${difficultyInfo.description}

${langInstruction}

Создай задание в формате JSON:
{
  "title": "Название задания",
  "description": "Подробное описание задания (минимум 3 абзаца)",
  "objectives": ["Цель 1", "Цель 2", "Цель 3"],
  "materials": ["Материал/инструмент 1", "Материал 2"],
  "steps": ["Шаг 1", "Шаг 2", "Шаг 3", ...],
  "criteria": [
    {"name": "Критерий 1", "maxScore": 20, "description": "Описание критерия"},
    {"name": "Критерий 2", "maxScore": 20, "description": "Описание критерия"},
    {"name": "Критерий 3", "maxScore": 20, "description": "Описание критерия"},
    {"name": "Критерий 4", "maxScore": 20, "description": "Описание критерия"},
    {"name": "Критерий 5", "maxScore": 20, "description": "Описание критерия"}
  ],
  "timeLimit": "Рекомендуемое время выполнения",
  "safetyNotes": "Правила техники безопасности (если применимо)"
}

ВАЖНО:
- Задание должно быть практическим и реалистичным для колледжа
- Критерии оценивания должны быть чёткими и измеримыми
- Общая сумма баллов критериев = 100
- Учитывай уровень сложности при составлении задания`;
};

// Generate with Claude
const generateWithClaude = async (prompt) => {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error('Anthropic client not available');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Не удалось извлечь JSON из ответа');
  }

  return {
    task: JSON.parse(jsonMatch[0]),
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens
  };
};

// Generate with OpenAI
const generateWithOpenAI = async (prompt) => {
  const openai = getOpenAIClient();
  if (!openai) throw new Error('OpenAI client not available');
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.7
  });

  const text = response.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Не удалось извлечь JSON из ответа');
  }

  return {
    task: JSON.parse(jsonMatch[0]),
    tokensUsed: response.usage.total_tokens
  };
};

// Evaluate student work
const evaluateWork = async ({ taskDescription, criteria, studentWork, language = 'ru' }) => {
  checkAndResetUsage();

  const prompt = createEvaluationPrompt(taskDescription, criteria, studentWork, language);

  // Try Claude first
  if (claudeUsageToday < CLAUDE_DAILY_LIMIT && process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await evaluateWithClaude(prompt);
      claudeUsageToday++;
      return { ...result, model: 'claude' };
    } catch (error) {
      console.error('Claude error, falling back to OpenAI:', error.message);
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    return await evaluateWithOpenAI(prompt);
  }

  throw new Error('Нет доступных AI провайдеров');
};

// Create evaluation prompt
const createEvaluationPrompt = (taskDescription, criteria, studentWork, language) => {
  const langInstruction = language === 'kz' 
    ? 'Ответ должен быть на казахском языке.'
    : 'Ответ должен быть на русском языке.';

  return `Ты - опытный преподаватель колледжа. Оцени работу студента.

ЗАДАНИЕ:
${taskDescription}

КРИТЕРИИ ОЦЕНИВАНИЯ:
${JSON.stringify(criteria, null, 2)}

РАБОТА СТУДЕНТА:
${studentWork}

${langInstruction}

Оцени работу в формате JSON:
{
  "scores": {
    "Критерий 1": оценка,
    "Критерий 2": оценка,
    ...
  },
  "totalScore": общий_балл,
  "feedback": "Развёрнутый комментарий к работе",
  "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
  "improvements": ["Что улучшить 1", "Что улучшить 2"]
}

ВАЖНО: Оценивай справедливо и конструктивно. Давай полезную обратную связь.`;
};

// Evaluate with Claude
const evaluateWithClaude = async (prompt) => {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error('Anthropic client not available');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Не удалось извлечь JSON из ответа');
  }

  return {
    evaluation: JSON.parse(jsonMatch[0]),
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    model: 'claude'
  };
};

// Evaluate with OpenAI
const evaluateWithOpenAI = async (prompt) => {
  const openai = getOpenAIClient();
  if (!openai) throw new Error('OpenAI client not available');
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.5
  });

  const text = response.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Не удалось извлечь JSON из ответа');
  }

  return {
    evaluation: JSON.parse(jsonMatch[0]),
    tokensUsed: response.usage.total_tokens,
    model: 'gpt-3.5'
  };
};

// Get AI usage stats
const getUsageStats = () => {
  checkAndResetUsage();
  return {
    claudeUsedToday: claudeUsageToday,
    claudeRemainingToday: CLAUDE_DAILY_LIMIT - claudeUsageToday,
    claudeDailyLimit: CLAUDE_DAILY_LIMIT
  };
};

module.exports = {
  generateTask,
  evaluateWork,
  getUsageStats
};
