const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalTasks,
      totalGroups,
      totalStudents,
      totalAssessments,
      aiRequestsToday
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.studentGroup.count(),
      prisma.student.count(),
      prisma.assessment.count(),
      prisma.aIHistory.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    // Get AI usage by model
    const aiUsageByModel = await prisma.aIHistory.groupBy({
      by: ['aiModel'],
      _count: true,
      _sum: { tokensUsed: true }
    });

    // Get recent activity
    const recentTasks = await prisma.task.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          select: { fullName: true }
        }
      }
    });

    res.json({
      stats: {
        totalUsers,
        totalTasks,
        totalGroups,
        totalStudents,
        totalAssessments,
        aiRequestsToday
      },
      aiUsageByModel,
      recentTasks
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        subject: true,
        createdAt: true,
        _count: {
          select: {
            tasks: true,
            groups: true,
            aiHistory: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// Create user (admin can create other admins)
router.post('/users', async (req, res) => {
  try {
    const { email, password, fullName, role, subject } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: role || 'TEACHER',
        subject
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        subject: true
      }
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Ошибка создания пользователя' });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['ADMIN', 'TEACHER'].includes(role)) {
      return res.status(400).json({ error: 'Неверная роль' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Ошибка обновления роли' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Нельзя удалить себя' });
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
});

// Get AI usage report
router.get('/ai-report', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Daily usage
    const dailyUsage = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as requests,
        SUM(tokens_used) as tokens
      FROM "AIHistory"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Usage by user
    const usageByUser = await prisma.aIHistory.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true,
      _sum: { tokensUsed: true }
    });

    // Get user names
    const userIds = usageByUser.map(u => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true }
    });

    const usageWithNames = usageByUser.map(u => ({
      ...u,
      userName: users.find(user => user.id === u.userId)?.fullName || 'Unknown'
    }));

    res.json({
      dailyUsage,
      usageByUser: usageWithNames
    });
  } catch (error) {
    console.error('Get AI report error:', error);
    res.status(500).json({ error: 'Ошибка получения отчёта' });
  }
});

module.exports = router;
