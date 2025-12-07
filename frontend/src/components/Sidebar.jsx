import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Wand2, 
  ClipboardList, 
  BookOpen, 
  Users, 
  CheckCircle,
  Settings,
  LogOut,
  Bot
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const navigation = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Генератор заданий', href: '/generator', icon: Wand2 },
  { name: 'Мои задания', href: '/tasks', icon: ClipboardList },
  { name: 'Журнал', href: '/journal', icon: BookOpen },
  { name: 'Группы', href: '/groups', icon: Users },
  { name: 'Оценивание с ИИ', href: '/evaluate', icon: CheckCircle },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">AI Assistant</h1>
            <p className="text-xs text-gray-500">ККТиС</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.fullName || 'Пользователь'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role === 'ADMIN' ? 'Администратор' : 'Преподаватель'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <NavLink
            to="/settings"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Настройки</span>
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center justify-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
