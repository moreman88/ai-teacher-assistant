const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Validation schema
const assessmentSchema = z.object({
  taskId: z.string().uuid('Неверный ID задания'),
  studentId: z.string().uuid('Неверный ID студента'),
  scores: z.record(z.number().min(0).max(100)),
  totalScore: z.number().min(0).max(100),
  maxScore: z.number().min(1).default(100),
  comments: z.string().optional()
});

// Get assessments for a task
router.get('/task/:taskId', async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.taskId,
        teacherId: req.user.id
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    const assessments = await prisma.assessment.findMany({
      where: { taskId: req.params.taskId },
      include: {
        student: {
          include: { group: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ assessments });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Ошибка получения оценок' });
  }
});

// Get assessments for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      include: { group: true }
    });

    if (!student || student.group.teacherId !== req.user.id) {
      return res.status(404).json({ error: 'Студент не найден' });
    }

    const assessments = await prisma.assessment.findMany({
      where: { studentId: req.params.studentId },
      include: { task: true },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ assessments });
  } catch (error) {
    console.error('Get student assessments error:', error);
    res.status(500).json({ error: 'Ошибка получения оценок' });
  }
});

// Get journal view (all assessments for a group)
router.get('/journal/:groupId', async (req, res) => {
  try {
    const group = await prisma.studentGroup.findFirst({
      where: {
        id: req.params.groupId,
        teacherId: req.user.id
      },
      include: {
        students: {
          orderBy: { fullName: 'asc' },
          include: {
            assessments: {
              include: {
                task: {
                  select: { id: true, title: true, subject: true }
                }
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    // Get all tasks for this subject
    const tasks = await prisma.task.findMany({
      where: {
        teacherId: req.user.id,
        subject: group.subject
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, createdAt: true }
    });

    res.json({ group, tasks });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({ error: 'Ошибка получения журнала' });
  }
});

// Create or update assessment
router.post('/', async (req, res) => {
  try {
    const data = assessmentSchema.parse(req.body);

    // Verify task belongs to teacher
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        teacherId: req.user.id
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    // Verify student exists in teacher's group
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { group: true }
    });

    if (!student || student.group.teacherId !== req.user.id) {
      return res.status(404).json({ error: 'Студент не найден' });
    }

    // Upsert assessment
    const assessment = await prisma.assessment.upsert({
      where: {
        taskId_studentId: {
          taskId: data.taskId,
          studentId: data.studentId
        }
      },
      update: {
        scores: data.scores,
        totalScore: data.totalScore,
        maxScore: data.maxScore,
        comments: data.comments
      },
      create: {
        taskId: data.taskId,
        studentId: data.studentId,
        scores: data.scores,
        totalScore: data.totalScore,
        maxScore: data.maxScore,
        comments: data.comments
      },
      include: {
        student: true,
        task: true
      }
    });

    res.json({ assessment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Ошибка сохранения оценки' });
  }
});

// Bulk create assessments
router.post('/bulk', async (req, res) => {
  try {
    const { taskId, assessments } = req.body;

    // Verify task belongs to teacher
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        teacherId: req.user.id
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    const results = [];
    for (const a of assessments) {
      const assessment = await prisma.assessment.upsert({
        where: {
          taskId_studentId: {
            taskId,
            studentId: a.studentId
          }
        },
        update: {
          scores: a.scores,
          totalScore: a.totalScore,
          comments: a.comments
        },
        create: {
          taskId,
          studentId: a.studentId,
          scores: a.scores,
          totalScore: a.totalScore,
          comments: a.comments
        }
      });
      results.push(assessment);
    }

    res.json({
      message: `Сохранено ${results.length} оценок`,
      assessments: results
    });
  } catch (error) {
    console.error('Bulk assessment error:', error);
    res.status(500).json({ error: 'Ошибка сохранения оценок' });
  }
});

// Delete assessment
router.delete('/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        task: true
      }
    });

    if (!assessment || assessment.task.teacherId !== req.user.id) {
      return res.status(404).json({ error: 'Оценка не найдена' });
    }

    await prisma.assessment.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Оценка удалена' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Ошибка удаления оценки' });
  }
});

module.exports = router;
