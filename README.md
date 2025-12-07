# 🤖 AI Teacher Assistant - ККТиС

Веб-приложение с искусственным интеллектом для помощи преподавателям Карагандинского колледжа технологий и сервиса.

![AI Teacher Assistant](https://img.shields.io/badge/AI-Teacher%20Assistant-6366f1?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

## ✨ Возможности

- 🎯 **Генерация заданий с ИИ** — Claude/GPT создаёт практические задания по любой теме
- 📋 **5 специальностей** — Швейное дело, Парикмахерское искусство, Делопроизводство, Обувное дело, Ремонт аппаратуры
- 📊 **3 уровня сложности** — Базовый, Средний, Продвинутый
- 📖 **Журнал оценок** — Ведение успеваемости студентов
- ✅ **Оценивание с ИИ** — Автоматическая оценка работ по критериям
- 🌐 **Двуязычность** — Русский и Казахский языки

## 🛠️ Технологии

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT авторизация
- Claude API + OpenAI API

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Zustand (state management)
- React Router

## 📁 Структура проекта

```
ai-teacher-assistant/
├── backend/                 # Express API
│   ├── prisma/             # Схема БД и seed
│   ├── src/
│   │   ├── config/         # Настройки
│   │   ├── middleware/     # JWT auth
│   │   ├── routes/         # API endpoints
│   │   └── services/       # AI сервис
│   └── package.json
├── frontend/               # React приложение
│   ├── src/
│   │   ├── components/     # UI компоненты
│   │   ├── pages/          # Страницы
│   │   ├── services/       # API клиент
│   │   └── store/          # Zustand stores
│   └── package.json
└── README.md
```

## 🚀 Быстрый старт

### 1. Клонирование

```bash
git clone https://github.com/YOUR_USERNAME/ai-teacher-assistant.git
cd ai-teacher-assistant
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Отредактируйте .env (добавьте DATABASE_URL, JWT_SECRET, API ключи)

npm run db:generate
npm run db:push
node prisma/seed.js
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Отредактируйте .env (укажите VITE_API_URL)

npm run dev
```

## 🌐 Деплой на Render

### Backend (Web Service)

1. Создайте PostgreSQL базу на Render
2. Создайте Web Service:
   - **Build Command:** `npm install && npm run db:generate && npm run db:push`
   - **Start Command:** `npm start`
3. Добавьте Environment Variables:
   - `DATABASE_URL` — из PostgreSQL
   - `JWT_SECRET` — случайная строка
   - `ANTHROPIC_API_KEY` — ключ Claude
   - `OPENAI_API_KEY` — ключ OpenAI
   - `FRONTEND_URL` — URL фронтенда

### Frontend (Static Site)

1. Создайте Static Site на Render
2. Настройки:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Environment Variables:
   - `VITE_API_URL` — URL бэкенда

## 🔑 Демо доступ

После запуска seed:
- **Admin:** admin@kktis.edu.kz / admin123
- **Teacher:** teacher@kktis.edu.kz / teacher123

## 📝 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | /api/auth/login | Вход |
| POST | /api/auth/register | Регистрация |
| GET | /api/tasks | Список заданий |
| POST | /api/ai/generate-task | Генерация задания |
| POST | /api/ai/evaluate | Оценка работы |
| GET | /api/groups | Список групп |
| GET | /api/assessments/journal/:groupId | Журнал группы |

## 💰 Бюджет

- **Claude API:** Бесплатный tier (50 запросов/день)
- **OpenAI GPT-3.5:** ~$5/месяц (резервный)
- **Render:** Бесплатный tier
- **Итого:** ~$5/месяц

## 📄 Лицензия

MIT License

---

Разработано для ККТиС, Караганда 🇰🇿
