const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Validation schema
const studentSchema = z.object({
  fullName: z.string().min(2, 'ФИО минимум 2 символа'),
  groupId: z.string().uuid('Неверный ID группы')
});

const bulkStudentSchema = z.object({
  groupId: z.string().uuid('Неверный ID группы'),
  students: z.array(z.string().min(2)).min(1, 'Добавьте хотя бы одного студента')
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        group: true,
        assessments: {
          include: {
            task: true
          },
          orderBy: { submittedAt: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Студент не найден' });
    }

    // Verify the student belongs to teacher's group
    if (student.group.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    res.json({ student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Ошибка получения студента' });
  }
});

// Add single student
router.post('/', async (req, res) => {
  try {
    const data = studentSchema.parse(req.body);

    // Verify group belongs to teacher
    const group = await prisma.studentGroup.findFirst({
      where: {
        id: data.groupId,
        teacherId: req.user.id
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    const student = await prisma.student.create({
      data: {
        fullName: data.fullName,
        groupId: data.groupId
      }
    });

    res.status(201).json({ student });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Ошибка добавления студента' });
  }
});

// Add multiple students at once
router.post('/bulk', async (req, res) => {
  try {
    const data = bulkStudentSchema.parse(req.body);

    // Verify group belongs to teacher
    const group = await prisma.studentGroup.findFirst({
      where: {
        id: data.groupId,
        teacherId: req.user.id
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    const students = await prisma.student.createMany({
      data: data.students.map(fullName => ({
        fullName,
        groupId: data.groupId
      }))
    });

    res.status(201).json({
      message: `Добавлено ${students.count} студентов`,
      count: students.count
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Bulk create students error:', error);
    res.status(500).json({ error: 'Ошибка добавления студентов' });
  }
});

// Update student
router.patch('/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { group: true }
    });

    if (!student || student.group.teacherId !== req.user.id) {
      return res.status(404).json({ error: 'Студент не найден' });
    }

    const updated = await prisma.student.update({
      where: { id: req.params.id },
      data: { fullName: req.body.fullName }
    });

    res.json({ student: updated });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Ошибка обновления студента' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { group: true }
    });

    if (!student || student.group.teacherId !== req.user.id) {
      return res.status(404).json({ error: 'Студент не найден' });
    }

    await prisma.student.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Студент удалён' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Ошибка удаления студента' });
  }
});

module.exports = router;
