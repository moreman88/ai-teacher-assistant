import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wand2, 
  Bot, 
  Save, 
  RotateCcw, 
  Loader2,
  CheckCircle,
  Target,
  Wrench,
  Star,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiAPI, tasksAPI } from '../services/api';

const SUBJECTS = {
  SEWING: { name: 'Швейное дело', emoji: '🧵' },
  HAIRDRESSING: { name: 'Парикмахерское искусство', emoji: '💇' },
  OFFICE_WORK: { name: 'Делопроизводство', emoji: '📋' },
  SHOEMAKING: { name: 'Обувное дело', emoji: '👞' },
  ELECTRONICS: { name: 'Ремонт аппаратуры', emoji: '📺' }
};

const DIFFICULTIES = {
  BASIC: { name: 'Базовый', color: 'green', emoji: '🟢' },
  MEDIUM: { name: 'Средний', color: 'yellow', emoji: '🟡' },
  ADVANCED: { name: 'Продвинутый', color: 'red', emoji: '🔴' }
};

export default function Generator() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('SEWING');
  const [difficulty, setDifficulty] = useState('BASIC');
  const [topic, setTopic] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [language, setLanguage] = useState('ru');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedTask, setGeneratedTask] = useState(null);
  const [aiModel, setAiModel] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Введите тему задания');
      return;
    }

    setIsGenerating(true);
    setGeneratedTask(null);

    try {
      const { data } = await aiAPI.generateTask({
        subject,
        topic: topic.trim(),
        difficulty,
        language
      });

      setGeneratedTask(data.task);
      setAiModel(data.model);
      toast.success('Задание сгенерировано!');
    } catch (error) {
      console.error('Generate error:', error);
      toast.error(error.response?.data?.error || 'Ошибка генерации');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedTask) return;

    setIsSaving(true);

    try {
      await aiAPI.saveTask({
        task: generatedTask,
        subject,
        topic,
        difficulty
      });

      toast.success('Задание сохранено!');
      navigate('/tasks');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setGeneratedTask(null);
  };

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Генератор заданий</h2>
            <p className="text-sm text-gray-500">ИИ создаст практическое задание по вашим параметрам</p>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Form */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Параметры задания</h3>
                  <p className="text-gray-500">Выберите специальность, тему и уровень сложности</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Специальность
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  >
                    {Object.entries(SUBJECTS).map(([key, { name, emoji }]) => (
                      <option key={key} value={key}>
                        {emoji} {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Уровень сложности
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  >
                    {Object.entries(DIFFICULTIES).map(([key, { name, emoji }]) => (
                      <option key={key} value={key}>
                        {emoji} {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тема задания
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  placeholder="Введите тему урока, например: Обработка накладного кармана"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Напишите любую тему — ИИ сгенерирует задание по ней
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дополнительные требования (опционально)
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  rows={3}
                  placeholder="Например: задание для группы первого курса, акцент на технику безопасности..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Язык задания
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value="ru"
                      checked={language === 'ru'}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span>🇷🇺 Русский</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value="kz"
                      checked={language === 'kz'}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span>🇰🇿 Қазақша</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                  className="flex-1 gradient-bg text-white px-6 py-4 rounded-xl font-medium hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Сгенерировать задание
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">~10 сек</span>
                </div>
              </div>
            </div>

            {/* Loading */}
            {isGenerating && (
              <div className="border-t border-gray-100 p-8 bg-gray-50">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mb-4 ai-glow">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-gray-600 font-medium">ИИ создаёт задание...</p>
                  <p className="text-gray-400 text-sm">Это займёт несколько секунд</p>
                </div>
              </div>
            )}

            {/* Result */}
            {generatedTask && !isGenerating && (
              <div className="border-t border-gray-100 p-8 bg-gray-50 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-800">Задание сгенерировано!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Перегенерировать
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 gradient-bg text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Сохранить
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4">
                    {generatedTask.title}
                  </h4>

                  <div className="prose max-w-none text-gray-600 mb-6">
                    <p>{generatedTask.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {generatedTask.objectives && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary-500" />
                          Цели задания
                        </h5>
                        <ul className="space-y-2 text-gray-600">
                          {generatedTask.objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {generatedTask.materials && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-orange-500" />
                          Материалы
                        </h5>
                        <ul className="space-y-2 text-gray-600">
                          {generatedTask.materials.map((mat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              <span>{mat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {generatedTask.criteria && (
                    <div className="mb-6">
                      <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Критерии оценивания (100 баллов)
                      </h5>
                      <div className="grid grid-cols-5 gap-3">
                        {generatedTask.criteria.map((criterion, i) => (
                          <div key={i} className="bg-primary-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-primary-600">
                              {criterion.maxScore}
                            </p>
                            <p className="text-xs text-gray-600">{criterion.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {generatedTask.timeLimit || '2 академических часа'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bot className="w-4 h-4" />
                      Сгенерировано {aiModel === 'claude' ? 'Claude AI' : 'GPT-3.5'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
