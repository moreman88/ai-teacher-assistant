import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Users, 
  CheckCircle, 
  Bot, 
  Wand2, 
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Bell
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { tasksAPI, groupsAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    tasks: 0,
    students: 0,
    assessments: 0,
    aiUsage: '0/50'
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, groupsRes, aiRes] = await Promise.all([
        tasksAPI.getAll(),
        groupsAPI.getAll(),
        aiAPI.getUsage()
      ]);

      const totalStudents = groupsRes.data.groups.reduce(
        (sum, g) => sum + (g._count?.students || 0), 0
      );

      setStats({
        tasks: tasksRes.data.tasks.length,
        students: totalStudents,
        assessments: 0, // Will be loaded separately if needed
        aiUsage: `${aiRes.data.claudeUsedToday}/${aiRes.data.claudeDailyLimit}`
      });

      setRecentTasks(tasksRes.data.tasks.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const subjectIcons = {
    SEWING: '🧵',
    HAIRDRESSING: '💇',
    OFFICE_WORK: '📋',
    SHOEMAKING: '👞',
    ELECTRONICS: '📺'
  };

  const difficultyColors = {
    BASIC: 'text-green-600 bg-green-100',
    MEDIUM: 'text-yellow-600 bg-yellow-100',
    ADVANCED: 'text-red-600 bg-red-100'
  };

  const difficultyLabels = {
    BASIC: 'Базовый',
    MEDIUM: 'Средний',
    ADVANCED: 'Продвинутый'
  };

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Главная</h2>
            <p className="text-sm text-gray-500">
              Добро пожаловать, {user?.fullName}!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700">ИИ активен</span>
            </div>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 card-hover transition shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-green-500 text-sm font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.tasks}</p>
            <p className="text-gray-500 text-sm">Заданий создано</p>
          </div>

          <div className="bg-white rounded-2xl p-6 card-hover transition shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.students}</p>
            <p className="text-gray-500 text-sm">Студентов</p>
          </div>

          <div className="bg-white rounded-2xl p-6 card-hover transition shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.assessments}</p>
            <p className="text-gray-500 text-sm">Оценок выставлено</p>
          </div>

          <div className="bg-white rounded-2xl p-6 card-hover transition shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.aiUsage}</p>
            <p className="text-gray-500 text-sm">ИИ запросов сегодня</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Link
            to="/generator"
            className="gradient-bg rounded-2xl p-6 text-white card-hover transition block"
          >
            <Wand2 className="w-8 h-8 mb-4 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">Создать задание с ИИ</h3>
            <p className="text-sm opacity-80">
              Генерация практических заданий для любой специальности
            </p>
          </Link>

          <Link
            to="/journal"
            className="bg-white rounded-2xl p-6 card-hover transition shadow-sm border border-gray-100 block"
          >
            <BookOpen className="w-8 h-8 mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Открыть журнал</h3>
            <p className="text-sm text-gray-500">
              Просмотр и выставление оценок студентам
            </p>
          </Link>

          <Link
            to="/evaluate"
            className="bg-white rounded-2xl p-6 card-hover transition shadow-sm border border-gray-100 block"
          >
            <ClipboardCheck className="w-8 h-8 mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Оценить работу</h3>
            <p className="text-sm text-gray-500">
              ИИ поможет оценить работу студента по критериям
            </p>
          </Link>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Последние задания</h3>
            <Link to="/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Все задания →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Загрузка...</div>
            ) : recentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Пока нет заданий</p>
                <Link to="/generator" className="text-primary-600 hover:underline text-sm">
                  Создать первое задание
                </Link>
              </div>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                      {subjectIcons[task.subject] || '📄'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.topic}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${difficultyColors[task.difficultyLevel]}`}>
                      {difficultyLabels[task.difficultyLevel]}
                    </span>
                    {task.aiGenerated && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                        <Bot className="w-3 h-3" /> ИИ
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
