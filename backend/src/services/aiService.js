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
let usageToday = 0;
let lastResetDate = new Date().toDateString();
const DAILY_LIMIT = 1000;

const checkAndResetUsage = () => {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    usageToday = 0;
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
    const result = await generateWithGroq(prompt);
    usageToday++;
    return { ...result, model: 'groq-llama' };
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

Ответь ТОЛЬКО валидным JSON без markdown, без комментариев:
{"title":"Название задания","description":"Подробное описание задания","objectives":["Цель 1","Цель 2","Цель 3"],"materials":["Материал 1","Материал 2"],"steps":["Шаг 1","Шаг 2","Шаг 3"],"criteria":[{"name":"Критерий 1","maxScore":20,"description":"Описание"},{"name":"Критерий 2","maxScore":20,"description":"Описание"},{"name":"Критерий 3","maxScore":20,"description":"Описание"},{"name":"Критерий 4","maxScore":20,"description":"Описание"},{"name":"Критерий 5","maxScore":20,"description":"Описание"}],"timeLimit":"60 минут","safetyNotes":"Правила безопасности"}

ВАЖНО: Критерии должны в сумме давать 100 баллов. Только JSON, без лишнего текста.`;
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

  let cleanJson = jsonMatch[0]
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ');

  try {
    return {
      task: JSON.parse(cleanJson),
      tokensUsed: response.usage?.total_tokens || 0
    };
  } catch (parseError) {
    console.error('JSON parse error:', parseError.message);
    console.error('Raw text:', text.substring(0, 500));
    throw new Error('Ошибка разбора ответа ИИ. Попробуйте ещё раз.');
  }
};

// Evaluate student work
const evaluateWork = async ({ taskDescription, criteria, studentWork, language = 'ru' }) => {
  checkAndResetUsage();

  const prompt = createEvaluationPrompt(taskDescription, criteria, studentWork, language);

  if (process.env.GROQ_API_KEY) {
    const result = await evaluateWithGroq(prompt);
    usageToday++;
    return { ...result, model: 'groq-llama' };
  }

  throw new Error('Нет доступных AI провайдеров');
};

const createEvaluationPrompt = (taskDescription, criteria, studentWork, language) => {
  const langInstruction = language === 'kz' 
    ? 'Ответ должен быть на казахском языке.'
    : 'Ответ должен быть на русском языке.';

  return `Ты - опытный преподаватель колледжа. Оцени работу студента.

ЗАДАНИЕ: ${taskDescription}

КРИТЕРИИ: ${JSON.stringify(criteria)}

РАБОТА СТУДЕНТА: ${studentWork}

${langInstruction}

Ответь ТОЛЬКО валидным JSON:
{"scores":{"Критерий 1":15,"Критерий 2":18},"totalScore":85,"feedback":"Комментарий","strengths":["Плюс 1","Плюс 2"],"improvements":["Улучшить 1","Улучшить 2"]}`;
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

  let cleanJson = jsonMatch[0]
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ');

  try {
    return {
      evaluation: JSON.parse(cleanJson),
      tokensUsed: response.usage?.total_tokens || 0,
      model: 'groq-llama'
    };
  } catch (parseError) {
    console.error('JSON parse error:', parseError.message);
    throw new Error('Ошибка разбора ответа ИИ. Попробуйте ещё раз.');
  }
};

const getUsageStats = () => {
  checkAndResetUsage();
  return {
    usedToday: usageToday,
    remainingToday: DAILY_LIMIT - usageToday,
    dailyLimit: DAILY_LIMIT
  };
};

module.exports = {
  generateTask,
  evaluateWork,
  getUsageStats
};
