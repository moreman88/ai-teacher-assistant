const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Validation schema
const groupSchema = z.object({
  name: z.string().min(2, 'Название минимум 2 символа'),
  subject: z.enum(['SEWING', 'HAIRDRESSING', 'OFFICE_WORK', 'SHOEMAKING', 'ELECTRONICS']),
  year: z.number().int().min(2020).max(2030).optional()
});

// Get all groups
router.get('/', async (req, res) => {
  try {
    const groups = await prisma.studentGroup.findMany({
      where: { teacherId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Ошибка получения групп' });
  }
});

// Get single group with students
router.get('/:id', async (req, res) => {
  try {
    const group = await prisma.studentGroup.findFirst({
      where: {
        id: req.params.id,
        teacherId: req.user.id
      },
      include: {
        students: {
          orderBy: { fullName: 'asc' },
          include: {
            assessments: {
              include: {
                task: {
                  select: { title: true, subject: true }
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

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Ошибка получения группы' });
  }
});

// Create group
router.post('/', async (req, res) => {
  try {
    const data = groupSchema.parse(req.body);

    const group = await prisma.studentGroup.create({
      data: {
        ...data,
        teacherId: req.user.id
      }
    });

    res.status(201).json({ group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Ошибка создания группы' });
  }
});

// Update group
router.patch('/:id', async (req, res) => {
  try {
    const existingGroup = await prisma.studentGroup.findFirst({
      where: {
        id: req.params.id,
        teacherId: req.user.id
      }
    });

    if (!existingGroup) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    const group = await prisma.studentGroup.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json({ group });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Ошибка обновления группы' });
  }
});

// Delete group
router.delete('/:id', async (req, res) => {
  try {
    const existingGroup = await prisma.studentGroup.findFirst({
      where: {
        id: req.params.id,
        teacherId: req.user.id
      }
    });

    if (!existingGroup) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }

    await prisma.studentGroup.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Группа удалена' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Ошибка удаления группы' });
  }
});

module.exports = router;
