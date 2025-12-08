const Groq = require('groq-sdk');
const { SUBJECTS, DIFFICULTY_LEVELS } = require('../config/subjects');

// Lazy initialization
let groqClient = null;

const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groqClient;
};

// Track daily usage
let claudeUsageToday = 0;
let lastResetDate = new Date().toDateString();
const CLAUDE_DAILY_LIMIT = 45;

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

  if (process.env.GROQ_API_KEY) {
    try {
      const result = await generateWithGroq(prompt);
      claudeUsageToday++;
      return { ...result, model: 'groq-llama' };
    } catch (error) {
      console.error('Groq error:', error.message);
      throw new Error('Ошибка генерации: ' + error.message);
    }
  }

  throw new Error('Нет доступных AI провайдеров. Добавьте GROQ_API_KEY.');
};

const createTaskPrompt = (subjectInfo, topic, difficultyInfo, language) => {
  const langInstruction = language === 'kz' 
    ? 'Ответ должен быть на казахском языке.'
    : 'Ответ должен быть на русском языке.';

  return `Ты - опытный преподаватель колледжа ККТиС (Караганда, Казахстан).
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
  "steps": ["Шаг 1", "Шаг 2", "Шаг 3"],
  "criteria": [
    {"name": "Критерий 1", "maxScore": 20, "description": "Описание"},
    {"name": "Критерий 2", "maxScore": 20, "description": "Описание"},
    {"name": "Критерий 3", "maxScore": 20, "description": "Описание"},
    {"name": "Критерий 4", "maxScore": 20, "description": "Описание"},
    {"name": "Критерий 5", "maxScore": 20, "description": "Описание"}
  ],
  "timeLimit": "Рекомендуемое время выполнения",
  "safetyNotes": "Правила техники безопасности"
}

ВАЖНО: Критерии должны в сумме давать 100 баллов.`;
};

const generateWithGroq = async (prompt) => {
  const groq = getGroqClient();
  if (!groq) throw new Error('Groq client not available');
  
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
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
    tokensUsed: response.usage?.total_tokens || 0
  };
};

const evaluateWork = async ({ taskDescription, criteria, studentWork, language = 'ru' }) => {
  checkAndResetUsage();

  const prompt = createEvaluationPrompt(taskDescription, criteria, studentWork, language);

  if (process.env.GROQ_API_KEY) {
    try {
      const result = await evaluateWithGroq(prompt);
      claudeUsageToday++;
      return { ...result, model: 'groq-llama' };
    } catch (error) {
      console.error('Groq error:', error.message);
      throw new Error('Ошибка оценивания: ' + error.message);
    }
  }

  throw new Error('Нет доступных AI провайдеров');
};

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
  "scores": {"Критерий 1": оценка, "Критерий 2": оценка},
  "totalScore": общий_балл,
  "feedback": "Развёрнутый комментарий к работе",
  "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
  "improvements": ["Что улучшить 1", "Что улучшить 2"]
}`;
};

const evaluateWithGroq = async (prompt) => {
  const groq = getGroqClient();
  if (!groq) throw new Error('Groq client not available');
  
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
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
    tokensUsed: response.usage?.total_tokens || 0,
    model: 'groq-llama'
  };
};

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
