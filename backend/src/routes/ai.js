const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const aiService = require('../services/aiService');
const { SUBJECTS, DIFFICULTY_LEVELS } = require('../config/subjects');

const router = express.Router();

router.use(authenticate);

// Validation schemas
const generateTaskSchema = z.object({
  subject: z.enum(['SEWING', 'HAIRDRESSING', 'OFFICE_WORK', 'SHOEMAKING', 'ELECTRONICS']),
  topic: z.string().min(3, 'Тема минимум 3 символа'),
  difficulty: z.enum(['BASIC', 'MEDIUM', 'ADVANCED']),
  language: z.enum(['ru', 'kz']).default('ru')
});

const evaluateWorkSchema = z.object({
  taskId: z.string().uuid('Неверный ID задания'),
  studentWork: z.string().min(10, 'Описание работы минимум 10 символов'),
  language: z.enum(['ru', 'kz']).default('ru')
});

// Get subjects and topics
router.get('/subjects', (req, res) => {
  res.json({
    subjects: SUBJECTS,
    difficultyLevels: DIFFICULTY_LEVELS
  });
});

// Get AI usage stats
router.get('/usage', async (req, res) => {
  try {
    const stats = aiService.getUsageStats();

    // Get user's AI history count
    const historyCount = await prisma.aIHistory.count({
      where: { userId: req.user.id }
    });

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage = await prisma.aIHistory.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: today }
      }
    });

    res.json({
      ...stats,
      userTotalRequests: historyCount,
      userTodayRequests: todayUsage
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Generate task with AI
router.post('/generate-task', async (req, res) => {
  try {
    const data = generateTaskSchema.parse(req.body);

    console.log(`Generating task: ${data.subject} / ${data.topic} / ${data.difficulty}`);

    const result = await aiService.generateTask({
      subject: data.subject,
      topic: data.topic,
      difficulty: data.difficulty,
      language: data.language
    });

    // Save to AI history
    await prisma.aIHistory.create({
      data: {
        userId: req.user.id,
        prompt: `Generate task: ${data.subject} - ${data.topic} - ${data.difficulty}`,
        response: JSON.stringify(result.task),
        aiModel: result.model,
        tokensUsed: result.tokensUsed
      }
    });

    res.json({
      task: result.task,
      model: result.model,
      tokensUsed: result.tokensUsed
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Generate task error:', error);
    res.status(500).json({ error: 'Ошибка генерации задания: ' + error.message });
  }
});

// Save generated task
router.post('/save-task', async (req, res) => {
  try {
    const { task, subject, topic, difficulty } = req.body;

    const savedTask = await prisma.task.create({
      data: {
        teacherId: req.user.id,
        title: task.title,
        subject,
        topic,
        difficultyLevel: difficulty,
        description: task.description,
        criteria: task.criteria,
        aiGenerated: true
      }
    });

    res.status(201).json({ task: savedTask });
  } catch (error) {
    console.error('Save task error:', error);
    res.status(500).json({ error: 'Ошибка сохранения задания' });
  }
});

// Evaluate student work with AI
router.post('/evaluate', async (req, res) => {
  try {
    const data = evaluateWorkSchema.parse(req.body);

    // Get task details
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        teacherId: req.user.id
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    const result = await aiService.evaluateWork({
      taskDescription: task.description,
      criteria: task.criteria,
      studentWork: data.studentWork,
      language: data.language
    });

    // Save to AI history
    await prisma.aIHistory.create({
      data: {
        userId: req.user.id,
        prompt: `Evaluate work for task: ${task.title}`,
        response: JSON.stringify(result.evaluation),
        aiModel: result.model,
        tokensUsed: result.tokensUsed
      }
    });

    res.json({
      evaluation: result.evaluation,
      model: result.model,
      tokensUsed: result.tokensUsed
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Evaluate work error:', error);
    res.status(500).json({ error: 'Ошибка оценивания: ' + error.message });
  }
});

// Get AI history
router.get('/history', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const history = await prisma.aIHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.aIHistory.count({
      where: { userId: req.user.id }
    });

    res.json({ history, total });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Ошибка получения истории' });
  }
});

module.exports = router;
