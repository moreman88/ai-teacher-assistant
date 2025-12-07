const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schema
const taskSchema = z.object({
  title: z.string().min(3, 'Название минимум 3 символа'),
  subject: z.enum(['SEWING', 'HAIRDRESSING', 'OFFICE_WORK', 'SHOEMAKING', 'ELECTRONICS']),
  topic: z.string().min(3, 'Тема минимум 3 символа'),
  difficultyLevel: z.enum(['BASIC', 'MEDIUM', 'ADVANCED']),
  description: z.string().min(10, 'Описание минимум 10 символов'),
  criteria: z.array(z.object({
    name: z.string(),
    maxScore: z.number(),
    description: z.string().optional()
  })),
  aiGenerated: z.boolean().optional()
});

// Get all tasks for current user
router.get('/', async (req, res) => {
  try {
    const { subject, difficulty, search } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        teacherId: req.user.id,
        ...(subject && { subject }),
        ...(difficulty && { difficultyLevel: difficulty }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { topic: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { assessments: true }
        }
      }
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Ошибка получения заданий' });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        teacherId: req.user.id
      },
      include: {
        assessments: {
          include: {
            student: {
              include: {
                group: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Ошибка получения задания' });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const data = taskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        ...data,
        teacherId: req.user.id
      }
    });

    res.status(201).json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Ошибка создания задания' });
  }
});

// Update task
router.patch('/:id', async (req, res) => {
  try {
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        teacherId: req.user.id
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Ошибка обновления задания' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        teacherId: req.user.id
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    await prisma.task.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Задание удалено' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Ошибка удаления задания' });
  }
});

module.exports = router;
