const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kktis.edu.kz' },
    update: {},
    create: {
      email: 'admin@kktis.edu.kz',
      passwordHash: adminPassword,
      fullName: 'Администратор ККТиС',
      role: 'ADMIN',
      subject: null
    }
  });

  console.log('✅ Admin user created:', admin.email);

  // Create demo teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@kktis.edu.kz' },
    update: {},
    create: {
      email: 'teacher@kktis.edu.kz',
      passwordHash: teacherPassword,
      fullName: 'Преподаватель Демо',
      role: 'TEACHER',
      subject: 'SEWING'
    }
  });

  console.log('✅ Demo teacher created:', teacher.email);

  // Create demo group
  const group = await prisma.studentGroup.upsert({
    where: { id: 'demo-group-1' },
    update: {},
    create: {
      id: 'demo-group-1',
      teacherId: teacher.id,
      name: 'Швея-2024',
      subject: 'SEWING',
      year: 2024
    }
  });

  console.log('✅ Demo group created:', group.name);

  // Create demo students
  const studentNames = [
    'Иванова Анна',
    'Петрова Мария',
    'Сидорова Елена',
    'Козлова Ольга',
    'Новикова Татьяна'
  ];

  for (const name of studentNames) {
    await prisma.student.create({
      data: {
        groupId: group.id,
        fullName: name
      }
    });
  }

  console.log('✅ Demo students created');

  // Create demo task
  const task = await prisma.task.create({
    data: {
      teacherId: teacher.id,
      title: 'Пошив прямой юбки',
      subject: 'SEWING',
      topic: 'Конструирование одежды',
      difficultyLevel: 'BASIC',
      description: 'Выполнить раскрой и пошив прямой юбки по готовой выкройке. Изделие должно соответствовать размерным признакам и иметь качественную обработку швов.',
      criteria: [
        { name: 'Точность раскроя', maxScore: 20, description: 'Соответствие деталей выкройке' },
        { name: 'Качество швов', maxScore: 25, description: 'Ровность и прочность машинных строчек' },
        { name: 'Обработка пояса', maxScore: 20, description: 'Правильность втачивания пояса' },
        { name: 'Обработка низа', maxScore: 15, description: 'Аккуратность подгибки низа' },
        { name: 'Общий вид изделия', maxScore: 20, description: 'Соответствие готового изделия образцу' }
      ],
      aiGenerated: false
    }
  });

  console.log('✅ Demo task created:', task.title);

  console.log('\n📋 Demo credentials:');
  console.log('   Admin: admin@kktis.edu.kz / admin123');
  console.log('   Teacher: teacher@kktis.edu.kz / teacher123');
  console.log('\n🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
