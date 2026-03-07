import { ArrowRight, Brain, Clock, Code, ExternalLink, FileText, Filter, Heart, Layers, Lightbulb, Loader2, MessageCircle, Plus, Search, Sparkles, Terminal, TrendingUp, Wrench, X, Youtube, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getClient } from './lib/supabase/client';
import { cn } from './utils/cn';
import { ToolDetailModal } from './components/Modals/ToolDetailModal';
// Unused component imports removed — feed/archive/insights rendered inline in App

// Types
interface Post {
  id: number;
  title: string;
  summary: string;
  source: string;
  channel: string;
  date: string;
  tags: string[];
  mentions: string[];
  views: string;
  image: string;
  url: string;
  detailedUsage: string;
  usageTips: string[];
  content?: string;
  supabaseId?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  isAnalyzed?: boolean;
}

// Mock data
const mockPosts: Post[] = [
  {
    id: 1,
    title: "5 AI Tools That Will Change Your Workflow in 2024",
    summary: "Обзор инновационных AI-инструментов для автоматизации рутинных задач и повышения продуктивности. Включает анализ текста, генерацию изображений и автоматизацию продаж.",
    source: "YouTube",
    channel: "AI Academy",
    date: "2 hours ago",
    tags: ["AI", "Automation", "Productivity"],
    mentions: ["Vercel", "Tailwind CSS"],
    views: "12.5K",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400&h=200",
    url: "https://youtube.com/watch?v=5-ai-tools-2024",
    detailedUsage: "В этом ролике подробно разбирается, как внедрить AI-инструменты в повседневный рабочий процесс. Автор делает акцент на автоматизации рутины через связку Vercel для деплоя и кастомных промптов. Особое внимание уделяется интеграции LLM-моделей в CLI-инструменты и созданию автоматизированных пайплайнов для контент-менеджмента. Также рассматриваются методы оптимизации затрат на API ключевых провайдеров и стратегии кэширования ответов для снижения задержек в пользовательских интерфейсах.",
    usageTips: [
      "Используйте Vercel AI SDK для быстрого построения стриминговых ответов",
      "Настройте Tailwind пресеты для единообразия стилей во всех AI-генерациях",
      "Автоматизируйте код-ревью через AI агентов с использованием GitHub Actions",
      "Интегрируйте векторные базы данных для создания RAG-систем на лету",
      "Применяйте Prompt Engineering паттерны для повышения точности ответов"
    ]
  },
  {
    id: 2,
    title: "Building Scalable APIs with Next.js 15 Server Components",
    summary: "Полное руководство по созданию высоконагруженных API с использованием современных подходов и лучших практик Next.js 15.",
    source: "Telegram",
    channel: "Dev Community",
    date: "5 hours ago",
    tags: ["Next.js", "API", "Backend"],
    mentions: ["Next.js", "Prisma", "Supabase"],
    views: "8.2K",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200",
    url: "https://t.me/dev_community/nextjs15",
    detailedUsage: "Пост описывает переход на Next.js 15 и Prisma для работы с БД. Основная идея — перенос бизнес-логики в Server Components для уменьшения клиентского бандла и повышения безопасности. Подробно разбирается жизненный цикл Server Actions, способы обработки ошибок на сервере без лишних ререндеров на клиенте, а также механизмы кэширования данных на уровне fetch и unstable_cache. Рассматривается архитектура shared layout и параллельных роутов для создания сложных дэшбордов.",
    usageTips: [
      "Используйте Server Actions для всех мутаций данных вместо API маршрутов",
      "Настройте Prisma Acceleration для быстрого доступа к БД в Edge-средах",
      "Supabase Auth идеально подходит для Middlewares и защиты Server Components",
      "Выносите тяжелые библиотеки (date-fns, lodash) только в серверные файлы",
      "Ревалидируйте данные точечно через revalidatePath для мгновенных обновлений"
    ]
  },
  {
    id: 3,
    title: "Design Systems: From Zero to Production",
    summary: "Как создать и масштабировать дизайн-систему для крупных проектов с учётом доступности и производительности.",
    source: "YouTube",
    channel: "Design Masters",
    date: "1 day ago",
    tags: ["Design", "UI/UX", "Figma"],
    mentions: ["Figma", "Tailwind CSS"],
    views: "24.1K",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=400&h=200",
    url: "https://youtube.com/watch?v=design-systems-guide",
    detailedUsage: "Мастер-класс по созданию атомарного дизайна в Figma и его автоматической синхронизации с проектом на React через токены дизайна. Разбираются продвинутые техники использования переменных в Figma для управления темами (Dark/Light mode) и плотностью интерфейса. Показывается процесс создания npm-пакета с базовыми компонентами, которые автоматически получают стили из Tailwind конфига, обеспечивая идеальное соответствие макету и коду.",
    usageTips: [
      "Создавайте компоненты в Figma с использованием Slots для максимальной гибкости",
      "Экспортируйте токены напрямую в Tailwind конфиг через плагины в CI/CD",
      "Используйте библиотеку clsx или tailwind-merge для управления классами",
      "Обязательно тестируйте доступность (A11Y) на ранних этапах через ролевую модель",
      "Документируйте каждый компонент в Storybook с примерами реального использования"
    ]
  },
  {
    id: 4,
    title: "State Management in 2024: Complete Overview",
    summary: "Сравнение современных подходов к управлению состоянием в React-приложениях: от Context API до Zustand и Jotai.",
    source: "Telegram",
    channel: "React Daily",
    date: "1 day ago",
    tags: ["React", "State", "Architecture"],
    mentions: ["Zustand", "Stripe"],
    views: "15.8K",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400&h=200",
    url: "https://t.me/react_daily/state2024",
    detailedUsage: "Обзор того, как Zustand практически захватил рынок стейт-менеджмента благодаря своей минималистичности и отсутствии бойлерплейта. В посте сравниваются атомарные стейты (Jotai) с селектор-базированными (Zustand). Большой раздел посвящен интеграции со сторонними сервисами, такими как Stripe Checkout, где глобальный стор используется для синхронизации статуса платежа между модальными окнами, хэдером корзины и страницей подтверждения заказа.",
    usageTips: [
      "Zustand — лучший выбор для большинства современных SPA и Next.js приложений",
      "Храните в глобальном сторе только то, что действительно нужно разным веткам дерева",
      "Реализуйте Stripe-интеграцию через кастомные хуки, вызываемые внутри экшенов стора",
      "Используйте persist middleware для сохранения состояния корзины в LocalStorage",
      "Для сложных форм комбинируйте локальный стейт (React Hook Form) с глобальным"
    ]
  }
];

const mockTools = [
  {
    id: 1,
    name: "Vercel",
    category: "Deployment",
    description: "Ведущая платформа для деплоя и хостинга Frontend-приложений с автоматическим CI/CD и глобальным CDN.",
    icon: "🚀",
    rating: 4.8,
    dailyCredits: "100GB",
    monthlyCredits: "3TB",
    minPrice: "$0",
    hasApi: true,
    hasMcp: false,
    details: [
      { title: "Авто-деплой из Git", description: "Автоматическое развертывание вашего приложения при каждом пуше в репозиторий GitHub, GitLab или Bitbucket." },
      { title: "Serverless Functions", description: "Масштабируемые серверные функции, которые запускаются по требованию и не требуют управления сервером." },
      { title: "Edge Middleware", description: "Код, работающий на граничных серверах, позволяющий выполнять логику до того, как запрос дойдет до основного сервера, для сверхбыстрых редиректов или персонализации." },
      { title: "Аналитика в реальном времени", description: "Мониторинг трафика и производительности вашего приложения в режиме реального времени без настройки базы данных." }
    ],
    pros: ["Быстрый ТТFB", "Zero Config", "Preview Deployment"],
    docsUrl: "https://vercel.com/docs",
    useCases: [
      {
        title: "AI-сервисы со стримингом ответов",
        description: "Реализация интерфейса чата с мгновенным отображением ответов от LLM через Vercel AI SDK.",
        steps: [
          "Установите библиотеки: npm install ai openai",
          "Создайте Route Handler в Next.js для обработки потока",
          "Используйте хук useChat на фронтенде для связи с API",
          "Настройте Edge Runtime для минимальной задержки"
        ],
        complexity: "Medium"
      },
      {
        title: "Высоконагруженные E-commerce платформы",
        description: "Масштабируемая архитектура для онлайн-магазинов с миллионами товаров.",
        steps: [
          "Настройка Incremental Static Regeneration (ISR)",
          "Оптимизация изображений через Vercel Image Optimization",
          "Интеграция системы аналитики для отслеживания конверсий"
        ],
        complexity: "Hard"
      }
    ]
  },
  {
    id: 2,
    name: "Supabase",
    category: "Database",
    description: "Open-source альтернатива Firebase на базе PostgreSQL с поддержкой Realtime и Auth.",
    icon: "⚡",
    rating: 4.7,
    dailyCredits: "500MB",
    monthlyCredits: "15GB",
    minPrice: "$0",
    hasApi: true,
    hasMcp: true,
    details: [
      { title: "PostgreSQL БД", description: "Полноценная реляционная база данных с поддержкой расширений, например pgvector для AI." },
      { title: "Realtime подписки", description: "Слушайте изменения в базе данных на клиенте в реальном времени через WebSockets." },
      { title: "Storage для файлов", description: "Надежное хранилище для медиа-файлов, изображений и документов с автоматическим CDN." },
      { title: "Edge Functions", description: "Серверный код на TypeScript/Deno, который запускается в дата-центре ближе всего к пользователю." }
    ],
    pros: ["SQL доступ", "Open Source", "Быстрый старт"],
    docsUrl: "https://supabase.com/docs",
    useCases: [
      {
        title: "SaaS приложения с авторизацией",
        description: "Быстрая настройка входа через соцсети и управления профилями пользователей.",
        steps: [
          "Включите провайдеров (Google, GitHub) в консоли Supabase",
          "Настройте Row Level Security (RLS) для защиты данных",
          "Используйте @supabase/auth-helpers для Next.js"
        ],
        complexity: "Simple"
      },
      {
        title: "Real-time аналитические дашборды",
        description: "Создание графиков, которые обновляются мгновенно при изменении данных в БД.",
        steps: [
          "Подпишитесь на изменения таблицы через supabase.channel()",
          "Настройте репликацию для нужных таблиц",
          "Обновляйте локальный стейт при получении INSERT/UPDATE событий"
        ],
        complexity: "Medium"
      }
    ]
  },
  {
    id: 3,
    name: "Figma",
    category: "Design",
    description: "Профессиональный инструмент для совместного проектирования интерфейсов и прототипирования в реальном времени.",
    icon: "🎨",
    rating: 4.9,
    dailyCredits: "Unlimited",
    monthlyCredits: "Unlimited",
    minPrice: "$12",
    hasApi: true,
    hasMcp: false,
    details: [
      { title: "Командная работа", description: "Совместное редактирование макетов несколькими дизайнерами одновременно в реальном времени." },
      { title: "Auto Layout", description: "Умные фреймы, которые автоматически адаптируются под контент (аналог Flexbox в вебе)." },
      { title: "Плагины и виджеты", description: "Огромная экосистема расширений для автоматизации задач и интеграции с другими инструментами." },
      { title: "Dev Mode", description: "Специальный режим для разработчиков, позволяющий легко получать CSS, ассеты и спецификации." }
    ],
    pros: ["Лучший UX", "Огромное комьюнити", "В браузере"],
    docsUrl: "https://help.figma.com/hc/en-us",
    useCases: [
      {
        title: "Создание дизайн-систем",
        description: "Методология разработки масштабируемой библиотеки компонентов.",
        steps: [
          "Определите палитру и типографику через Variables",
          "Создайте атомарные компоненты (кнопки, инпуты)",
          "Настройте Variants для различных состояний"
        ],
        complexity: "Medium"
      }
    ]
  },
  {
    id: 4,
    name: "Prisma",
    category: "ORM",
    description: "Современная ORM для Node.js и TypeScript, которая делает работу с БД безопасной и приятной.",
    icon: "💎",
    rating: 4.6,
    dailyCredits: "Unlimited",
    monthlyCredits: "Unlimited",
    minPrice: "$0",
    hasApi: true,
    hasMcp: true,
    details: [
      { title: "Type-safe запросы", description: "Автоматическая генерация типов TypeScript на основе вашей схемы БД, предотвращающая 99% ошибок." },
      { title: "Авто-миграции", description: "Prisma Migrate автоматически создает SQL-файлы миграций при изменении схемы данных." },
      { title: "Prisma Studio", description: "Красивый веб-интерфейс для просмотра и редактирования данных в вашей базе напрямую." },
      { title: "Поддержка всех SQL БД", description: "Работайте с PostgreSQL, MySQL, SQLite и даже MongoDB через единый интерфейс." }
    ],
    pros: ["DX на высоте", "Автозаполнение", "Надежность"],
    docsUrl: "https://www.prisma.io/docs",
    useCases: [
      {
        title: "API для фронтенда с автогенерацией типов",
        description: "Синхронизация схемы БД с типами TypeScript на клиенте.",
        steps: [
          "Опишите модели в schema.prisma",
          "Запустите npx prisma generate",
          "Используйте PrismaClient в контроллерах для подсказок IDE"
        ],
        complexity: "Simple"
      }
    ]
  },
  {
    id: 5,
    name: "Tailwind CSS",
    category: "CSS",
    description: "Utility-first CSS фреймворк для быстрой верстки современных интерфейсов прямо в HTML/JSX.",
    icon: "🎯",
    rating: 4.8,
    dailyCredits: "Unlimited",
    monthlyCredits: "Unlimited",
    minPrice: "$0",
    hasApi: false,
    hasMcp: false,
    details: [
      { title: "JIT компилятор", description: "Генерация CSS стилей 'на лету', что позволяет использовать любые значения без увеличения размера бандла." },
      { title: "Гибкая кастомизация", description: "Настройка любых цветов, отступов и шрифтов через файл tailwind.config.ts." },
      { title: "Container Queries", description: "Возможность стилизовать элементы в зависимости от размера их родительского контейнера." },
      { title: "Dark Mode", description: "Простая поддержка темной темы через префикс dark: для любого класса." }
    ],
    pros: ["Маленький бандл", "Скорость верстки", "Понятно"],
    docsUrl: "https://tailwindcss.com/docs",
    useCases: [
      {
        title: "Разработка Landing-страниц",
        description: "Быстрое создание адаптивных и производительных промо-страниц.",
        steps: [
          "Настройте тему в tailwind.config.ts",
          "Используйте Grid/Flex для компоновки блоков",
          "Оптимизируйте бандл через PurgeCSS (встроено)"
        ],
        complexity: "Simple"
      }
    ]
  },
  {
    id: 6,
    name: "Zustand",
    category: "State",
    description: "Минималистичный, быстрый и масштабируемый менеджер состояния для React приложений.",
    icon: "🐻",
    rating: 4.7,
    dailyCredits: "Unlimited",
    monthlyCredits: "Unlimited",
    minPrice: "$0",
    hasApi: false,
    hasMcp: false,
    details: [
      { title: "Без провайдеров", description: "Не нужно оборачивать приложение в Provider, состояние доступно везде через простые хуки." },
      { title: "Redux Devtools", description: "Поддержка расширений браузера для отладки состояния проекта." },
      { title: "Persistence", description: "Автоматическое сохранение стейта в LocalStorage или SessionStorage через встроенную обертку." },
      { title: "Оптимизация рендеров", description: "Компоненты перерисовываются только тогда, когда меняются именно те поля, которые они используют." }
    ],
    pros: ["Очень легкий", "Нет boilerplate", "Flexibility"],
    docsUrl: "https://docs.pmnd.rs/zustand",
    useCases: [
      {
        title: "Глобальное состояние корзины покупок",
        description: "Синхронизация данных корзины между всеми страницами без лишних ререндеров.",
        steps: [
          "Создайте стор через create()",
          "Добавьте экшены для add/remove товаров",
          "Используйте селекторы для получения данных"
        ],
        complexity: "Simple"
      }
    ]
  },
  {
    id: 7,
    name: "Next.js",
    category: "Framework",
    description: "Мощный React фреймворк от Vercel для создания производительных веб-приложений с SSR и RSC.",
    icon: "▲",
    rating: 4.9,
    dailyCredits: "Unlimited",
    monthlyCredits: "Unlimited",
    minPrice: "$0",
    hasApi: true,
    hasMcp: false,
    details: [
      { title: "App Router", description: "Современная файловая система роутинга с поддержкой Layouts и параллельных путей." },
      { title: "Server Components", description: "Компоненты, которые рендерятся на сервере, что уменьшает объем JS на клиенте." },
      { title: "Streaming SSR", description: "Потоковая передача HTML позволяет пользователю видеть часть страницы до полной загрузки данных." },
      { title: "Image Optimization", description: "Автоматическое изменение размеров изображений и конвертация в современные форматы (WebP)." }
    ],
    pros: ["SEO friendly", "Производительность", "Экосистема"],
    docsUrl: "https://nextjs.org/docs"
  },
  {
    id: 8,
    name: "Stripe",
    category: "Payments",
    description: "Универсальная платежная инфраструктура для обработки транзакций и управления подписками по всему миру.",
    icon: "💳",
    rating: 4.8,
    dailyCredits: "100K",
    monthlyCredits: "3M",
    minPrice: "2.9%",
    hasApi: true,
    hasMcp: true,
    details: [
      { title: "Прием всех карт", description: "Интеграция с Visa, Mastercard, AMEX и локальными платежными системами по всему миру." },
      { title: "Checkout готовый", description: "Высококонверсионная платежная страница, которая хостится на стороне Stripe." },
      { title: "Dashboard аналитика", description: "Полноценный бэк-офис для мониторинга выплат, возвратов и жизненного цикла клиентов." },
      { title: "Apple/Google Pay", description: "Поддержка мобильных кошельков в один клик для повышения конверсии." }
    ],
    pros: ["Безопасность", "API-first", "Глобальность"],
    docsUrl: "https://stripe.com/docs"
  },
  {
    id: 9,
    name: "Kimi",
    category: "AI",
    description: "Умный помощник для дизайнеров и разработчиков, способный генерировать полноценные проекты, макеты и код по текстовому описанию.",
    icon: "🤖",
    rating: 4.9,
    dailyCredits: "Free",
    monthlyCredits: "Pro",
    minPrice: "$0",
    hasApi: true,
    hasMcp: false,
    details: [
      { title: "Генерация проектов", description: "Создание комплексных решений и прототипов с нуля за считанные секунды." },
      { title: "Умный контекст", description: "Понимание сложных инструкций и удержание огромного окна контекста для масштабных задач." },
      { title: "Помощь в дизайне", description: "Разработка структуры, архитектуры и визуального стиля различных типов проектов." }
    ],
    pros: ["Огромный контекст", "Высокое качество", "Универсальность"],
    docsUrl: "https://kimi.moonshot.cn"
  }
];


export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'insights' | 'archive' | 'favorites'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  // favorites: список ID постов/инструментов в избранном (string[]) — будем хранить в localStorage для инструментов
  // но для постов — будем писать в Supabase через поле is_favorite
  const [favorites, setFavorites] = useLocalStorage<string[]>('ai-scout-favorites', []);
  const [isSearching, setIsSearching] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [selectedTool, setSelectedTool] = useState<typeof mockTools[0] | null>(null);
  const [selectedPost, setSelectedPost] = useState<typeof mockPosts[0] | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<{ tool: string, case: any } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<{ title: string, description: string } | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingToolNames, setEnrichingToolNames] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [channels, setChannels] = useState<Array<{ id: string, url: string, source: 'YouTube' | 'Telegram', name: string, last_fetched_at?: string }>>([]);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [tools, setTools] = useState<typeof mockTools>(mockTools);
  const [cachedDynamicTools, setCachedDynamicTools] = useLocalStorage<typeof mockTools>('ai-scout-dynamic-tools', []);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [addChannelError, setAddChannelError] = useState<string | null>(null);
  const [enrichmentError, setEnrichmentError] = useState<{ name: string, message: string, details?: string } | null>(null);
  const [failedEnrichmentNames, setFailedEnrichmentNames] = useState<Set<string>>(new Set());
  const [dismissedPostIds, setDismissedPostIds] = useLocalStorage<number[]>('ai-scout-dismissed-posts', []);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterMention, setFilterMention] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<'all' | 'YouTube' | 'Telegram'>('all');
  const [favoriteCategory, setFavoriteCategory] = useState<'all' | 'model' | 'web' | 'voice' | 'design' | 'other'>('all');
  const [selectedModel, setSelectedModel] = useLocalStorage<string>('ai-scout-selected-model', 'perplexity/llama-3.1-sonar-large-128k-online');

  const availableModels = [
    { id: 'perplexity/llama-3.1-sonar-large-128k-online', name: 'Sonar (Поиск)', provider: 'Perplexity', icon: '🌐' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0', provider: 'Google', icon: '✨' },
    { id: 'qwen/qwen3.5-flash', name: 'Qwen 3.5 Flash', provider: 'Alibaba', icon: '🏮' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🧠' },
  ];

  // Группировка инструментов по типам (для фильтрации в избранном)
  const getToolGroup = (category: string): string => {
    const cat = (category || '').toLowerCase();
    if (['ai', 'llm', 'language', 'языков', 'модел', 'gpt', 'claude', 'gemini', 'интеллект'].some(word => cat.includes(word))) return 'model';
    if (['web', 'deploy', 'host', 'back', 'front', 'framework', 'database', 'dev', 'разработ', 'api', 'builder'].some(word => cat.includes(word))) return 'web';
    if (['voice', 'audio', 'speech', 'голос', 'звук', 'транскрип', 'диктор'].some(word => cat.includes(word))) return 'voice';
    if (['design', 'ui', 'ux', 'video', 'дизайн', 'видео', 'image', 'график', 'рисова', 'генерация'].some(word => cat.includes(word))) return 'design';
    return 'other';
  };

  useEffect(() => {
    setCachedDynamicTools(prev => {
      const allMentions = Array.from(new Set(posts.flatMap(p => p.mentions || [])));
      const newDynamicTools = [...prev];
      let hasChanges = false;

      allMentions.forEach(mention => {
        // Очищаем упоминание для сопоставления (#N8N -> N8N)
        const cleanMention = mention.replace(/[#+@]/g, '').trim();
        if (!cleanMention) return;

        const existsInTools = tools.some(t =>
          t.name.toLowerCase() === cleanMention.toLowerCase() ||
          cleanMention.toLowerCase().includes(t.name.toLowerCase())
        );
        const existsInCached = newDynamicTools.some(t =>
          t.name.toLowerCase() === cleanMention.toLowerCase() ||
          cleanMention.toLowerCase().includes(t.name.toLowerCase())
        );

        if (!existsInTools && !existsInCached) {
          newDynamicTools.push({
            id: `dyn-${cleanMention}` as any,
            name: cleanMention, // Используем ОЧИЩЕННОЕ имя
            category: "AI/Tech",
            description: `Инструмент ${cleanMention} был упомянут в этом посте. Детальная информация и обзоры для него пока собираются нашей системой.`,
            icon: "✨",
            rating: 4.5,
            dailyCredits: "Н/Д",
            monthlyCredits: "Н/Д",
            minPrice: "Н/Д",
            hasApi: false,
            hasMcp: false,
            details: [],
            pros: ["Упоминается экспертами"],
            docsUrl: `https://www.google.com/search?q=${encodeURIComponent(cleanMention + ' AI tool')}`
          });
          hasChanges = true;
        }
      });
      return hasChanges ? newDynamicTools : prev;
    });
  }, [posts, tools, setCachedDynamicTools]);

  const allTools = [...tools, ...cachedDynamicTools];

  // Загрузка данных из Supabase
  useEffect(() => {
    const loadFromSupabase = async () => {
      const supabase = getClient();
      if (!supabase) return;

      try {
        // Выполняем запросы независимо, чтобы ошибка в одном не блокировала остальные
        const fetchTools = async () => {
          try {
            const { data } = await supabase.from('tools').select('*').order('rating', { ascending: false });
            if (data && data.length > 0) return data;
          } catch (e) { console.error('Error fetching tools:', e); }
          return null;
        };

        const fetchPosts = async () => {
          try {
            const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
            if (data && data.length > 0) return data;
          } catch (e) { console.error('Error fetching posts:', e); }
          return null;
        };

        const fetchChannels = async () => {
          try {
            const { data } = await supabase.from('channels').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) return data;
          } catch (e) { console.error('Error fetching channels:', e); }
          return null;
        };

        const fetchDetails = async () => {
          try {
            const { data } = await supabase.from('tool_details').select('*');
            return data || [];
          } catch (e) { console.error('Error fetching details:', e); return []; }
        };

        const [toolsData, postsData, channelsData, detailsData] = await Promise.all([
          fetchTools(),
          fetchPosts(),
          fetchChannels(),
          fetchDetails()
        ]);

        // Группируем детали
        const detailsByTool: Record<string, any[]> = {};
        if (detailsData) {
          detailsData.forEach(d => {
            if (!detailsByTool[d.tool_id]) detailsByTool[d.tool_id] = [];
            detailsByTool[d.tool_id].push(d);
          });
        }

        // Инструменты
        if (toolsData) {
          const formattedTools = toolsData.map(t => ({
            id: t.id,
            name: t.name,
            category: t.category,
            description: t.description,
            icon: t.icon || '🔧',
            rating: parseFloat(t.rating) || 0,
            dailyCredits: t.daily_credits,
            monthlyCredits: t.monthly_credits,
            minPrice: String(t.min_price || ''), // Превращаем в строку для безопасности
            hasApi: t.has_api,
            hasMcp: t.has_mcp,
            details: detailsByTool[t.id] || [],
            pros: t.pros || [],
            docsUrl: t.docs_url
          }));
          setTools(formattedTools);
        }

        // Посты
        if (postsData) {
          const formattedPosts = postsData.map(p => ({
            id: typeof p.id === 'string' ? parseInt(p.id.slice(0, 8), 16) : p.id,
            supabaseId: p.id,
            title: p.title,
            summary: p.summary || '',
            source: p.source,
            channel: p.channel,
            date: p.date ? new Date(p.date).toLocaleDateString() : '',
            tags: p.tags || [],
            mentions: p.mentions || [],
            views: p.views || '0',
            image: p.image || '',
            url: p.url,
            detailedUsage: p.detailed_usage || '',
            usageTips: p.usage_tips || [],
            isFavorite: p.is_favorite || false,
            isArchived: p.is_archived || false,
            isAnalyzed: p.is_analyzed ?? true, // если нет поля, считаем что проанализировано, чтоб не ломать моки
          }));
          setPosts(formattedPosts);
        }

        // Каналы
        if (channelsData) {
          const formattedChannels = channelsData.map(c => ({
            id: c.id,
            url: c.url,
            source: c.source as 'YouTube' | 'Telegram',
            name: c.name,
            last_fetched_at: c.last_fetched_at
          }));
          setChannels(formattedChannels);
        }

        // Favorites
        try {
          const { data: favoritesResult } = await supabase.from('favorites').select('item_id');
          if (favoritesResult && favoritesResult.length > 0) {
            const dbFavIds = favoritesResult.map(f => f.item_id);
            setFavorites(prev => Array.from(new Set([...prev, ...dbFavIds])));
          } else if (toolsData || postsData) {
            const dbFavToolIds = (toolsData as any[])?.filter(t => t.is_favorite).map(t => `tool-${t.id}`) || [];
            const dbFavPostIds = (postsData as any[])?.filter(p => p.is_favorite).map(p => `post-${p.id}`) || [];
            if (dbFavToolIds.length > 0 || dbFavPostIds.length > 0) {
              setFavorites(prev => Array.from(new Set([...prev, ...dbFavToolIds, ...dbFavPostIds])));
            }
          }
        } catch (e) { console.error('Error fetching favorites:', e); }

      } catch (err) {
        console.error('Fatal error in loadFromSupabase:', err);
      }
    };

    loadFromSupabase();
  }, []);

  // Функция для извлечения идентификатора канала из URL
  const extractChannelIdOrHandle = (url: string): string => {
    // @handle формат
    if (url.includes('/@')) {
      return url.split('/@')[1]?.split('/')[0] || url;
    }
    // /channel/ID формат
    if (url.includes('/channel/')) {
      return url.split('/channel/')[1]?.split('/')[0] || url;
    }
    // /c/name формат
    if (url.includes('/c/')) {
      return url.split('/c/')[1]?.split('/')[0] || url;
    }
    // /user/name формат
    if (url.includes('/user/')) {
      return url.split('/user/')[1]?.split('/')[0] || url;
    }
    // Если передан просто handle или ID
    return url.replace('https://www.youtube.com/', '').replace('youtube.com/', '');
  };

  // Функция для извлечения имени Telegram канала из URL
  const extractTelegramChannel = (url: string): string => {
    if (url.includes('t.me/')) {
      return url.split('t.me/')[1]?.split('/')[0].replace('@', '') || url;
    }
    if (url.startsWith('@')) {
      return url.substring(1);
    }
    return url.replace('https://t.me/', '').replace('@', '');
  };

  // Функция для получения случайного AI-изображения
  const getRandomAiImage = (): string => {
    const aiImages = [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
      'https://images.unsplash.com/photo-1655720828018-edd2daec9349',
      'https://images.unsplash.com/photo-1655635949384-f737c5133dfe'
    ];
    const random = aiImages[Math.floor(Math.random() * aiImages.length)];
    return `${random}?auto=format&fit=crop&q=80&w=400&h=200`;
  };

  // Функция для получения последней новости с канала
  const fetchLatestPost = async (channel: { url: string, source: 'YouTube' | 'Telegram', name: string }): Promise<Partial<Post>> => {
    // Fallback данные при ошибке
    const getFallbackData = () => ({
      title: `Новый контент из ${channel.name}`,
      url: channel.url,
      image: getRandomAiImage(),
      channel: channel.name,
      source: channel.source,
      date: new Date().toISOString(),
      content: ''
    });

    if (channel.source === 'YouTube') {
      try {
        // Извлекаем идентификатор канала
        const channelId = extractChannelIdOrHandle(channel.url);

        // Вызываем API для получения последнего видео
        const response = await fetch(`/api/youtube-latest?channel=${encodeURIComponent(channelId)}`);

        if (!response.ok) {
          console.error('YouTube API error:', response.status);
          return getFallbackData();
        }

        const video = await response.json();

        return {
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          image: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
          channel: video.channelTitle || channel.name,
          source: 'YouTube',
          date: video.publishedAt,
          content: video.description,
          summary: video.summary
        };
      } catch (error) {
        console.error('Error fetching YouTube video:', error);
        return getFallbackData();
      }
    }

    if (channel.source === 'Telegram') {
      try {
        // Извлекаем имя канала
        const channelName = extractTelegramChannel(channel.url);

        // Вызываем API для получения последнего поста
        const response = await fetch(`/api/telegram-latest?channel=${encodeURIComponent(channelName)}`);

        if (!response.ok) {
          console.error('Telegram API error:', response.status);
          return getFallbackData();
        }

        const post = await response.json();

        return {
          title: post.title || `Новый пост в канале ${channel.name}`,
          url: post.link,
          image: getRandomAiImage(),
          channel: channel.name,
          source: 'Telegram',
          date: post.date,
          content: post.text,
          summary: post.summary // Используем саммари из API
        };
      } catch (error) {
        console.error('Error fetching Telegram post:', error);
        return getFallbackData();
      }
    }

    return getFallbackData();
  };

  // Функция для создания AI-саммари новости через API
  const generateAISummary = async (post: Partial<Post>): Promise<{ titleRu: string; summary: string; mentions: string[]; tags: string[]; detailedUsage: string; usageTips: string[] }> => {
    const title = post.title || '';
    const content = post.content || '';
    const fullText = `Заголовок: ${title}\n\nОписание: ${content}`;

    // Fallback функция при ошибке API
    const getFallbackSummary = (_post: Partial<Post>) => {
      const summary = content.substring(0, 250) || title || 'Описание отсутствует';
      return {
        titleRu: title,
        summary: summary.length > 250 ? summary.substring(0, 247) + '...' : summary,
        tags: ['Tech', 'AI'],
        mentions: [],
        detailedUsage: '⚠️ ИИ-анализ на стороне сервера не удался. Пожалуйста, проверьте консоль или статус API ключей на Vercel.',
        usageTips: [
          'Проверьте наличие GEMINI_API_KEY на Vercel',
          'Убедитесь, что лимиты API не превышены',
          'Попробуйте еще раз позже'
        ]
      };
    };

    // Проверяем, что есть хоть какой-то текст
    if (!fullText.trim()) {
      return getFallbackSummary(post);
    }

    try {
      // Вызываем backend API для генерации саммари
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fullText }),
      });

      if (!response.ok) {
        console.error('Summarize API error:', response.status);
        return getFallbackSummary(post);
      }

      const result = await response.json();

      return {
        titleRu: result.titleRu || title,
        summary: result.summary || content.substring(0, 200),
        tags: Array.isArray(result.tags) ? result.tags : [],
        mentions: Array.isArray(result.mentions) ? result.mentions : [],
        detailedUsage: result.detailedUsage || '',
        usageTips: Array.isArray(result.usageTips) ? result.usageTips : [],
      };
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return getFallbackSummary(post);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setAiResponse('');

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error('AI search failed');
      }

      const data = await response.json();
      setAiResponse(data.text);
    } catch (err) {
      console.error('AI search error:', err);
      setAiResponse('❌ К сожалению, произошла ошибка при поиске. Пожалуйста, попробуйте другую модель или повторите запрос позже.');
    } finally {
      setIsSearching(false);
    }
  };


  // Функция для обогащения данных об инструменте через ИИ
  const enrichToolData = async (toolId: string, toolName: string) => {
    const cleanName = toolName.replace(/[#+@]/g, '').trim();
    console.log(`Enriching data for: ${cleanName} (ID: ${toolId})...`);

    setEnrichingToolNames(prev => [...prev, toolName]);

    // Тайм-аут для защиты от бесконечного колесика
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000); // 45 секунд

    try {
      console.log(`[Enrichment] Fetching for ${cleanName}...`);
      const response = await fetch('/api/enrich-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName }),
        signal: ctrl.signal
      });
      clearTimeout(timer);

      if (!response.ok) {
        let errorMessage = 'Enrichment API failed';
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details || '';
        } catch (e) {
          errorMessage = `Server Error (${response.status})`;
        }
        throw { message: errorMessage, details: errorDetails };
      }
      const enriched = await response.json();

      const supabase = getClient();
      if (!supabase) {
        return enriched;
      }

      console.log(`[Enrichment] Saving tool to DB: ${cleanName}`);

      let toolData: any = null;

      // Ручной UPSERT: сначала ищем по имени
      const { data: existingTool } = await supabase
        .from('tools')
        .select('*')
        .eq('name', cleanName)
        .maybeSingle();

      if (existingTool) {
        console.log(`[Enrichment] Updating existing tool: ${existingTool.id}`);
        const { data: updated, error: updateError } = await supabase
          .from('tools')
          .update({
            category: enriched.category,
            description: enriched.description,
            icon: enriched.icon,
            daily_credits: enriched.dailyCredits,
            monthly_credits: enriched.monthlyCredits,
            min_price: enriched.minPrice,
            has_api: enriched.hasApi,
            has_mcp: enriched.hasMcp,
            docs_url: enriched.docsUrl,
            pros: enriched.pros || []
          })
          .eq('id', existingTool.id)
          .select()
          .single();

        if (updateError) throw updateError;
        toolData = updated;
      } else {
        console.log(`[Enrichment] Inserting new tool...`);
        const { data: inserted, error: insertError } = await supabase
          .from('tools')
          .insert([{
            name: cleanName,
            category: enriched.category,
            description: enriched.description,
            icon: enriched.icon,
            daily_credits: enriched.dailyCredits,
            monthly_credits: enriched.monthlyCredits,
            min_price: enriched.minPrice,
            has_api: enriched.hasApi,
            has_mcp: enriched.hasMcp,
            docs_url: enriched.docsUrl,
            pros: enriched.pros || []
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        toolData = inserted;
      }

      console.log(`[Enrichment] Saving tool details for ID: ${toolData.id}`);
      if (enriched.features && enriched.features.length > 0) {
        const featuresToInsert = enriched.features.map((f: any) => ({
          tool_id: toolData.id,
          title: f.title,
          description: f.description,
          type: 'detail'
        }));
        await supabase.from('tool_details').delete().eq('tool_id', toolData.id);
        const { error: detailsError } = await supabase.from('tool_details').insert(featuresToInsert);
        if (detailsError) console.error('[Enrichment] Details insert failed:', detailsError);
      }

      const finalTool = {
        id: toolData.id,
        name: toolData.name,
        category: toolData.category,
        description: toolData.description,
        icon: toolData.icon,
        rating: 4.5,
        dailyCredits: toolData.daily_credits,
        monthlyCredits: toolData.monthly_credits,
        minPrice: toolData.min_price,
        hasApi: toolData.has_api,
        hasMcp: toolData.has_mcp,
        pros: toolData.pros,
        docsUrl: toolData.docs_url,
        details: enriched.features || [],
        useCases: enriched.useCases || []
      };

      // КРИТИЧЕСКИЙ ШАГ: Переносим "Избранное" со старого ID на новый (UUID)
      setFavorites(prev => {
        const baseId = toolId.startsWith('tool-') ? toolId : `tool-${toolId}`;
        const newId = `tool-${toolData.id}`;

        console.log(`Migrating favorites: ${baseId} -> ${newId}`);

        // Обновляем в Supabase таблице favorites
        if (baseId !== newId && supabase) {
          supabase.from('favorites').update({ item_id: newId }).eq('item_id', baseId).then(({ error }) => {
            if (error) console.error('Error migrating favorite in DB:', error);
          });
        }

        if (prev.includes(baseId) && !prev.includes(newId)) {
          return prev.map(id => id === baseId ? newId : id);
        }
        return prev;
      });

      setTools(prev => {
        const exists = prev.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
        if (exists) return prev.map(t => t.name.toLowerCase() === cleanName.toLowerCase() ? finalTool : t);
        return [...prev, finalTool as any];
      });

      setCachedDynamicTools(prev => {
        return prev.filter(t => t.name.toLowerCase() !== cleanName.toLowerCase());
      });

      setEnrichingToolNames(prev => prev.filter(n => n !== toolName));
      return finalTool;
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.warn(`[Enrichment] Request for ${cleanName} timed out (45s).`);
        setEnrichmentError({ name: toolName, message: 'Превышено время ожидания ИИ (45с)' });
      } else {
        console.error('Failed to enrich tool:', e);
        setEnrichmentError({ name: toolName, message: e.message || 'Ошибка сервера', details: e.details });
        setFailedEnrichmentNames(prev => new Set(prev).add(toolName));
      }
      return null;
    } finally {
      setEnrichingToolNames(prev => prev.filter(n => n !== toolName));
      // Очищаем ошибку через 5 секунд
      setTimeout(() => setEnrichmentError(null), 5000);
    }
  };

  // Функция для ручного обновления категории инструмента
  const updateToolCategory = async (toolId: string | number, newCategory: string) => {
    // Оптимистичное обновление UI
    const updateInList = (list: any[]) => list.map(t => t.id === toolId ? { ...t, category: newCategory } : t);
    setTools(updateInList);
    setCachedDynamicTools(updateInList);
    if (selectedTool && selectedTool.id === toolId) {
      setSelectedTool({ ...selectedTool, category: newCategory });
    }

    // Сохранение в Supabase
    const supabase = getClient();
    if (supabase) {
      // Если ID цифровой (из mock) — мы не можем обновить БД, но для реальных UUID — обновляем
      const idStr = toolId.toString();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(idStr);

      if (isUUID) {
        const { error } = await supabase.from('tools').update({ category: newCategory }).eq('id', toolId);
        if (error) console.error('Error updating category in Supabase:', error);
      }
    }
  };

  // toggleFavorite — работает ТОЛЬКО для инструментов
  const toggleFavorite = async (id: string) => {
    const isCurrentlyFav = favorites.includes(id);
    const newFav = isCurrentlyFav
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(newFav);

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(str);
    const supabase = getClient();

    if (supabase) {
      if (isCurrentlyFav) {
        // Удаляем из таблицы favorites
        await supabase.from('favorites').delete().eq('item_id', id);

        // Обновляем колонку для обратной совместимости
        if (id.startsWith('tool-')) {
          const toolId = id.replace('tool-', '');
          if (isUUID(toolId)) await supabase.from('tools').update({ is_favorite: false }).eq('id', toolId);
        } else if (id.startsWith('post-')) {
          // Для постов тоже обновляем флаг, если это UUID
          // Примечание: post-id может быть цифровым из-за Date.now()
        }
      } else {
        // Добавляем в таблицу favorites
        await supabase.from('favorites').upsert({
          user_id: 'public_user',
          item_id: id,
          item_type: id.startsWith('tool-') ? 'tool' : 'post'
        });

        // Обновляем колонку для обратной совместимости
        if (id.startsWith('tool-')) {
          const toolId = id.replace('tool-', '');
          if (isUUID(toolId)) await supabase.from('tools').update({ is_favorite: true }).eq('id', toolId);
        }
      }
    }
  };

  const favoriteTools = useMemo(() =>
    allTools.filter(tool =>
      favorites.includes(`tool-${tool.id}`) &&
      (favoriteCategory === 'all' || getToolGroup(tool.category) === favoriteCategory)
    ),
    [allTools, favorites, favoriteCategory]
  );
  // Посты в избранном больше не используем — посты идут в Архив

  // Уникальные теги и упоминания для фильтров
  const uniqueTags = useMemo(() => {
    const allTags = posts.flatMap(p => p.tags || []);
    return Array.from(new Set(allTags)).sort();
  }, [posts]);

  const uniqueMentions = useMemo(() => {
    const excludeList = ['react', 'python', 'go', 'javascript', 'typescript', 'java', 'c++', 'c#', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'vue', 'angular', 'svelte', 'html', 'css', 'node.js', 'nodejs', 'express'];
    const allMentions = posts.flatMap(p => (p.mentions || []).filter(m => !excludeList.includes(m.trim().toLowerCase())));
    return Array.from(new Set(allMentions)).sort();
  }, [posts]);

  // Архивирование и удаление
  const archivePost = async (postId: number) => {
    console.log('Attempting to archive post:', postId);
    // Находим пост для получения его Supabase ID
    const post = posts.find(p => p.id === postId);
    const dbId = post?.supabaseId;

    // Оптимистичное обновление UI
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isArchived: true } : p));
    setSelectedPost(null);

    // Синхронизируем с Supabase
    if (dbId) {
      const supabase = getClient();
      if (supabase) {
        const { error } = await supabase.from('posts').update({ is_archived: true }).eq('id', dbId);
        if (error) console.error('Supabase Archive Error:', error);
        else console.log('Successfully archived in DB');
      }
    } else {
      console.warn('Cannot archive: No Supabase ID found for post', postId);
    }
  };

  const dismissPost = (postId: number) => {
    setDismissedPostIds(prev => prev.includes(postId) ? prev : [...prev, postId]);
    setSelectedPost(null);
  };

  const removeFromArchive = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    const dbId = post?.supabaseId;

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isArchived: false } : p));

    if (dbId) {
      const supabase = getClient();
      if (supabase) {
        const { error } = await supabase.from('posts').update({ is_archived: false }).eq('id', dbId);
        if (error) console.error('Supabase Unarchive Error:', error);
      }
    }
  };

  // Посты для архива — читаем поле isArchived из Supabase
  const archivedPosts = useMemo(() => posts.filter(p => (p as any).isArchived), [posts]);

  // Отфильтрованные посты (без удалённых и архивированных)
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (dismissedPostIds.includes(p.id)) return false;
      if ((p as any).isArchived) return false;
      if (filterSource !== 'all' && p.source !== filterSource) return false;
      if (filterTag && !(p.tags || []).includes(filterTag)) return false;
      if (filterMention && !(p.mentions || []).map(m => m.toLowerCase()).includes(filterMention.toLowerCase())) return false;
      return true;
    });
  }, [posts, filterSource, filterTag, filterMention, dismissedPostIds]);

  const activeFiltersCount = [filterSource !== 'all', filterTag, filterMention].filter(Boolean).length;

  // При выборе инструмента — если он пустой, запускаем обогащение
  useEffect(() => {
    const isPlaceholder = selectedTool && (
      selectedTool.description?.includes('был упомянут') ||
      selectedTool.description?.includes('собираются нашей системой')
    );

    if (isPlaceholder && !isEnriching) {
      console.log('Triggering enrichment for placeholder tool:', selectedTool.name);
      setIsEnriching(true);
      enrichToolData(selectedTool.id.toString(), selectedTool.name).then((enriched) => {
        if (enriched) setSelectedTool(enriched);
        setIsEnriching(false);
      });
    }
  }, [selectedTool?.name, isEnriching]);

  // АВТО-ОБОГАЩЕНИЕ всех избранных инструментов
  useEffect(() => {
    const placeholders = favoriteTools.filter(t =>
      (t.description?.includes('был упомянут') ||
        t.description?.includes('собираются нашей системой')) &&
      !failedEnrichmentNames.has(t.name)
    );

    if (placeholders.length > 0 && !isEnriching) {
      const first = placeholders[0];
      console.log('Auto-enriching favorite:', first.name);
      setIsEnriching(true);
      enrichToolData(first.id.toString(), first.name).finally(() => setIsEnriching(false));
    }
  }, [favoriteTools, isEnriching]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 premium-blur">
        {/* Enrichment Error Toast */}
        {enrichmentError && (
          <div className="absolute top-full left-0 right-0 bg-red-500/90 text-white text-center py-2 text-xs font-black uppercase tracking-widest animate-in slide-in-from-top duration-300">
            Ошибка обновления {enrichmentError.name}: {enrichmentError.message}
            {enrichmentError.details && <span className="ml-2 opacity-50 lowercase">({enrichmentError.details})</span>}
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('feed')}>
              <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-xl md:rounded-[1.25rem] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-500 group-hover:rotate-6 will-change-transform relative">
                <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white animate-pulse" />
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 shadow-lg",
                  (window as any)._supabaseMissing ? "bg-red-500" : (getClient() ? "bg-emerald-500" : "bg-amber-500")
                )} title={(window as any)._supabaseMissing ? "Supabase не настроен" : "Подключено к БД"} />
              </div>
              <div className="flex flex-col">
                <span className="text-base md:text-xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase tracking-tighter leading-none">AI Scout</span>
                <span className="text-[7px] md:text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] leading-none mt-1 opacity-70">Intelligence</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/30 p-1.5 rounded-2xl border border-white/5">
              {[
                { id: 'feed', label: 'Лента', icon: TrendingUp },
                { id: 'insights', label: 'История', icon: Clock },
                { id: 'archive', label: 'Архив', icon: Wrench },
                { id: 'favorites', label: 'Избранное', icon: Heart },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-500 flex items-center gap-2",
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_8px_20px_rgba(6,182,212,0.25)] scale-105"
                      : "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95"
                  )}
                >
                  <tab.icon size={16} className={cn("transition-transform duration-500", activeTab === tab.id && "scale-110 rotate-3")} />
                  {tab.label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="hidden md:flex items-center gap-2 bg-white text-black hover:bg-cyan-400 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all duration-500 shadow-xl hover:shadow-cyan-500/20 active:scale-95 will-change-transform">
              <Plus size={16} />
              Добавить
            </button>

            {/* Mobile Header Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setActiveTab('favorites')}
                className={cn(
                  "p-2 rounded-xl border transition-all duration-300",
                  activeTab === 'favorites' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-slate-800/50 border-white/5 text-slate-400"
                )}
              >
                <Heart size={18} className={cn(favorites.length > 0 && activeTab !== 'favorites' && "animate-pulse")} />
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-2 bg-cyan-500 rounded-xl text-black shadow-lg shadow-cyan-500/20 active:scale-90 transition-all">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-1.5 flex items-center justify-around shadow-2xl shadow-black/50 premium-blur">
        {[
          { id: 'feed', label: 'Лента', icon: TrendingUp },
          { id: 'insights', label: 'История', icon: Clock },
          { id: 'archive', label: 'Архив', icon: Wrench },
          { id: 'favorites', label: 'Списки', icon: Heart },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if ('vibrate' in navigator) navigator.vibrate(5);
            }}
            className={cn(
              "relative flex flex-col items-center gap-1 p-2.5 min-w-[3.5rem] transition-all duration-500 rounded-2xl",
              activeTab === tab.id ? "text-cyan-400 bg-cyan-500/10" : "text-slate-500 active:scale-90"
            )}
          >
            <tab.icon size={20} className={cn("transition-all duration-500", activeTab === tab.id && "scale-110 -translate-y-0.5")} />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute -top-1 w-1 w-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            )}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-32 md:pb-10 will-change-opacity">

        {/* AI Search Section - Always visible */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-cyan-500/50 transition-all duration-200">
              <Zap className="w-5 h-5 text-cyan-400 mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Спросите AI о инструментах, трендах или технологиях..."
                className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 text-sm"
              />

              {/* Model Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-xs text-slate-300 rounded-lg transition-all border border-white/5 active:scale-95"
                  title="Сменить модель ИИ"
                >
                  <span>{availableModels.find(m => m.id === selectedModel)?.icon}</span>
                  <span className="hidden lg:inline">{availableModels.find(m => m.id === selectedModel)?.name}</span>
                </button>

                {isModelMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-bottom-2">
                    <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 mb-1">Выберите модель</p>
                    {availableModels.map(model => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsModelMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all mb-1 last:mb-0",
                          selectedModel === model.id ? "bg-cyan-500/10 text-cyan-400 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <span className="text-base">{model.icon}</span>
                        <div className="text-left">
                          <div className="leading-tight">{model.name}</div>
                          <div className="text-[9px] opacity-50 uppercase tracking-tighter">{model.provider}</div>
                        </div>
                        {selectedModel === model.id && <div className="ml-auto w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="ml-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Спросить</span>
              </button>
            </div>
          </form>

          {/* AI Response */}
          {aiResponse && (
            <div className="mt-4 bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{aiResponse}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white">Последние новости</h2>
                <p className="text-slate-400 text-sm mt-1">AI-анализ контента из ваших источников</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const btn = document.getElementById('refresh-news-btn');
                    if (btn) btn.classList.add('animate-spin');
                    try {
                      const res = await fetch('/api/cron/fetch-news');
                      if (res.ok) {
                        // Перезагружаем страницу или стейт (для простоты — страницу)
                        window.location.reload();
                      }
                    } catch (e) {
                      console.error('Refresh failed:', e);
                    } finally {
                      if (btn) btn.classList.remove('animate-spin');
                    }
                  }}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                  title="Запустить принудительное обновление всех каналов"
                >
                  <Zap id="refresh-news-btn" className="w-4 h-4 text-amber-500" />
                  Обновить
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all",
                    showFilters || activeFiltersCount > 0
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "text-slate-400 border-slate-700 hover:text-white hover:border-slate-600"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  Фильтры
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 w-5 h-5 bg-cyan-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Панель фильтров */}
            {showFilters && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Источник */}
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Источник</span>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'YouTube', 'Telegram'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterSource(s)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                          filterSource === s
                            ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        {s === 'all' ? '📋 Все' : s === 'YouTube' ? '🎬 YouTube' : '📱 Telegram'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Теги */}
                {uniqueTags.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Хештеги / Теги</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setFilterTag(null)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                          !filterTag
                            ? "bg-blue-500 text-white"
                            : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        Все
                      </button>
                      {uniqueTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                            filterTag === tag
                              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                              : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
                          )}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Упомянутые сервисы */}
                {uniqueMentions.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Сервисы / Программы</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setFilterMention(null)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                          !filterMention
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        Все
                      </button>
                      {uniqueMentions.map(mention => (
                        <button
                          key={mention}
                          onClick={() => setFilterMention(filterMention === mention ? null : mention)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1",
                            filterMention === mention
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
                          )}
                        >
                          ⚡ {mention}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Сброс фильтров */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => { setFilterSource('all'); setFilterTag(null); setFilterMention(null); }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Сбросить все фильтры
                  </button>
                )}
              </div>
            )}

            {/* Счётчик результатов */}
            {activeFiltersCount > 0 && (
              <div className="text-xs text-slate-500">
                Найдено: {filteredPosts.length} из {posts.length} новостей
              </div>
            )}

            <div className="grid gap-4">
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  className="group bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm border-2 border-slate-700 rounded-2xl p-6 mb-4 hover:border-cyan-500/50 hover:bg-slate-800/90 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img
                      src={post.image || 'https://placehold.co/400x200/1e293b/38bdf8?text=NO+IMAGE'}
                      alt={post.title}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallbackUrl = 'https://placehold.co/400x200/1e293b/38bdf8?text=NO+IMAGE';
                        if (target.src === fallbackUrl) return;

                        if (target.src.includes('maxresdefault.jpg')) {
                          target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                        } else if (target.src.includes('hqdefault.jpg')) {
                          target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                        } else {
                          // For any other broken image (including broken unsplash placeholder from supabase)
                          target.src = fallbackUrl;
                        }
                      }}
                      className="w-full sm:w-40 h-48 sm:h-28 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium",
                          post.source === 'YouTube'
                            ? "bg-red-500/10 text-red-400"
                            : "bg-sky-500/10 text-sky-400"
                        )}>
                          {post.source === 'YouTube' ? <Youtube className="w-2.5 h-2.5 sm:w-3 h-3" /> : <MessageCircle className="w-2.5 h-2.5 sm:w-3 h-3" />}
                          {post.source}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500">{post.channel}</span>
                        <span className="text-slate-600 hidden sm:inline">•</span>
                        <div className="flex items-center gap-3 ml-auto sm:ml-0">
                          <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 sm:w-3 h-3" />
                            {post.date}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-500 hidden md:inline">{post.views} просмотров</span>
                        </div>
                      </div>

                      <h3
                        onClick={() => setSelectedPost(post)}
                        className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{post.summary}</p>

                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {post.isAnalyzed === false ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-medium ml-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            AI-Анализ в очереди...
                          </div>
                        ) : post.mentions && post.mentions.length > 0 ? (
                          <>
                            <span className="text-slate-600">|</span>
                            <div className="flex flex-wrap gap-1">
                              {post.mentions
                                .filter((m: string) => !['react', 'python', 'go', 'javascript', 'typescript', 'java', 'c++', 'c#', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'vue', 'angular', 'svelte', 'html', 'css', 'node.js', 'nodejs', 'express', 'fullstack', 'frontend', 'backend', 'developer', 'engineer', 'api', 'database', 'cloud', 'deployment'].some(word => m.trim().toLowerCase().includes(word)))
                                .map((toolName: string) => {
                                  const cleanMention = toolName.replace(/[#+@]/g, '').trim();
                                  const existingToolObj = allTools.find((t) =>
                                    t.name.toLowerCase() === cleanMention.toLowerCase() ||
                                    cleanMention.toLowerCase().includes(t.name.toLowerCase())
                                  );

                                  const getToolIcon = (name: string): string => {
                                    const n = name.toLowerCase();
                                    if (n.includes('gemini')) return '♊';
                                    if (n.includes('gpt') || n.includes('chatgpt') || n.includes('openai')) return '🤖';
                                    if (n.includes('claude') || n.includes('anthropic')) return '🎭';
                                    if (n.includes('midjourney')) return '🎨';
                                    if (n.includes('flux') || n.includes('stable diffusion')) return '🖼️';
                                    if (n.includes('cursor')) return '🖥️';
                                    if (n.includes('bolt') || n.includes('lovable')) return '⚡';
                                    if (n.includes('v0')) return '🚀';
                                    if (n.includes('perplexity')) return '🔍';
                                    if (n.includes('notebooklm')) return '📓';
                                    return '✨';
                                  };

                                  const toolObj = existingToolObj || {
                                    id: `dyn-${cleanMention}`,
                                    name: cleanMention,
                                    category: "AI Service",
                                    description: `Интеллектуальный анализ применения ${cleanMention} в современных рабочих процессах. Сейчас наша система собирает подробные данные об API, тарифах и реальных кейсах.`,
                                    icon: getToolIcon(cleanMention),
                                    rating: 4.8,
                                    dailyCredits: "Уточняется",
                                    monthlyCredits: "Уточняется",
                                    minPrice: "По запросу",
                                    hasApi: false,
                                    hasMcp: false,
                                    details: [],
                                    pros: ["Перспективно", "Упоминается экспертами", "Тренд"],
                                    docsUrl: `https://www.google.com/search?q=${encodeURIComponent(cleanMention + ' AI')}`
                                  };

                                  const displayName = toolObj.name;

                                  return (
                                    <button
                                      key={toolName}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedTool(toolObj as any);
                                      }}
                                      className={cn(
                                        "px-2 py-0.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-medium transition-all flex items-center gap-1 hover:border-cyan-400 hover:scale-105 cursor-pointer"
                                      )}
                                      title="Нажмите для подробностей"
                                    >
                                      <span>{toolObj.icon}</span>
                                      {displayName}
                                    </button>
                                  );
                                })}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 mt-4 sm:mt-0">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-amber-500 hover:text-amber-400 hover:bg-slate-700/50 transition-all border border-transparent hover:border-amber-500/20"
                        title="Открыть источник"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 transition-all border border-transparent hover:border-blue-500/20"
                        title="Подробный саммари"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(`post-${post.id}`)}
                        className={cn(
                          "p-2 rounded-xl transition-all border border-transparent",
                          favorites.includes(`post-${post.id}`) || post.isFavorite
                            ? "text-red-500 bg-red-500/10 border-red-500/20"
                            : "text-slate-500 hover:text-red-400 hover:bg-slate-700/50 hover:border-red-500/20"
                        )}
                        title="В избранное"
                      >
                        <Heart className={cn("w-5 h-5", (favorites.includes(`post-${post.id}`) || post.isFavorite) && "fill-current")} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
        }

        {/* Insights Tab */}
        {
          activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">История обновлений</h2>
                <p className="text-slate-400 text-sm mt-1">Список каналов и время последней синхронизации контента</p>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/50 bg-slate-800/50">
                        <th className="p-4 text-sm font-semibold text-slate-300">Канал</th>
                        <th className="p-4 text-sm font-semibold text-slate-300 w-32">Источник</th>
                        <th className="p-4 text-sm font-semibold text-slate-300">Последнее обновление</th>
                        <th className="p-4 text-sm font-semibold text-slate-300 w-24 text-right">Ссылка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channels.map((channel, i) => (
                        <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                          <td className="p-4 text-sm text-white font-medium">{channel.name}</td>
                          <td className="p-4 text-sm">
                            <span className={cn(
                              "px-2 py-1 flex w-fit justify-center items-center rounded-lg text-xs font-bold border",
                              channel.source === 'YouTube' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            )}>
                              {channel.source}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-400 font-mono">
                            {channel.last_fetched_at
                              ? new Date(channel.last_fetched_at).toLocaleString('ru-RU')
                              : 'Ожидает...'}
                          </td>
                          <td className="p-4 text-sm text-right">
                            <a href={channel.url} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 transition-colors inline-block bg-slate-800 p-2 rounded-lg hover:bg-slate-700">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                      {channels.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-slate-400">
                            <div className="flex flex-col flex-center items-center justify-center space-y-3">
                              <Clock className="w-8 h-8 opacity-20" />
                              <p>Нет добавленных каналов для мониторинга</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        }

        {/* Archive Tab */}
        {
          activeTab === 'archive' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">📁 Мой архив</h2>
                  <p className="text-slate-400 text-sm mt-1">Новости, которые вы сохранили как важные</p>
                </div>
                <span className="text-sm text-slate-400">{archivedPosts.length} сохранено</span>
              </div>

              {archivedPosts.length === 0 ? (
                <div className="text-center py-24 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-semibold text-slate-400 mb-2">Архив пуст</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">
                    Откройте любую новость в ленте и нажмите <strong className="text-emerald-400">«В архив»</strong> — она появится здесь.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">

                  {archivedPosts.map(post => (
                    <div
                      key={post.id}
                      className="group bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm border-2 border-emerald-900/30 rounded-2xl p-5 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        <img
                          src={post.image}
                          alt={post.title}
                          loading="lazy"
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            if (!t.src.includes('unsplash.com')) t.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200';
                          }}
                          className="w-full sm:w-32 h-40 sm:h-20 object-cover rounded-xl flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                              post.source === 'YouTube' ? "bg-red-500/10 text-red-400" : "bg-sky-500/10 text-sky-400"
                            )}>
                              {post.source === 'YouTube' ? <Youtube className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                              {post.source}
                            </span>
                            <span className="text-[10px] text-slate-500">{post.channel}</span>
                            <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1">
                              <Clock className="w-3 h-3" />{post.date}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2">{post.summary}</p>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-stretch gap-2 flex-shrink-0">
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 transition-all border border-transparent hover:border-blue-500/20"
                            title="Открыть"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-2 rounded-xl text-slate-500 hover:text-amber-400 hover:bg-slate-700/50 transition-all border border-transparent hover:border-amber-500/20"
                            title="Источник"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => removeFromArchive(post.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-700/50 transition-all border border-transparent hover:border-red-500/20"
                            title="Убрать из архива"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-700/30">
                          {post.tags.slice(0, 5).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full text-xs">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }

        {/* Favorites Tab — Только Инструменты/Приложения */}
        {
          activeTab === 'favorites' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">❤️ Мои инструменты</h2>
                <p className="text-slate-400 text-sm mt-1">AI-приложения, которые вы отметили в развёрнутых карточках новостей</p>
              </div>

              {/* Фильтры категорий — Компактная премиальная панель */}
              <div className="flex flex-wrap gap-2 mb-10 bg-slate-900/40 p-1.5 rounded-[2.5rem] border border-white/5 w-fit backdrop-blur-md">
                {[
                  { id: 'all', name: 'Все', icon: '📋' },
                  { id: 'model', name: 'Языковые модели', icon: '🧠' },
                  { id: 'web', name: 'Веб-разработка', icon: '🌐' },
                  { id: 'voice', name: 'Голос и Аудио', icon: '🎙️' },
                  { id: 'design', name: 'Дизайн и Видео', icon: '🎨' },
                  { id: 'other', name: 'Разное', icon: '📦' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFavoriteCategory(cat.id as any)}
                    className={cn(
                      "flex items-center gap-2.5 px-5 py-2.5 rounded-[1.8rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300",
                      favoriteCategory === cat.id
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_8px_30px_rgb(6,182,212,0.3)] scale-105"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className={cn(
                      "transition-all duration-300",
                      favoriteCategory === cat.id ? "opacity-100 max-w-[200px]" : "sm:opacity-100 opacity-0 max-w-0 sm:max-w-[200px] overflow-hidden"
                    )}>{cat.name}</span>
                  </button>
                ))}
              </div>

              {favoriteTools.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-400">Избранное пусто</h3>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                    Откройте любую новость, найдите упомянутое приложение и нажмите <strong className="text-red-400">«В избранное»</strong> — оно появится здесь.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {favoriteTools.map(tool => (
                    <div
                      key={tool.id}
                      className="group bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-7 hover:shadow-2xl transition-all duration-300 relative overflow-hidden cursor-pointer"
                      onClick={() => setSelectedTool(tool)}
                    >
                      {/* Фоновое свечение */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-all"></div>

                      <div className="flex items-start justify-between mb-6 relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl flex items-center justify-center text-4xl shadow-xl group-hover:scale-110 transition-transform duration-500 relative">
                          {enrichingToolNames.includes(tool.name) ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-3xl">
                              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                            </div>
                          ) : tool.icon}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(`tool-${tool.id}`); }}
                          className="p-3 rounded-2xl text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 border border-red-500/20 shadow-lg shadow-red-500/5"
                          title="Убрать из избранного"
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </button>
                      </div>

                      <div className="relative">
                        <h3 className="font-black text-2xl text-white mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{tool.name}</h3>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-cyan-500/20">
                            {tool.category}
                          </span>
                          <div className="flex items-center gap-1 text-amber-400 text-[10px] font-black">
                            ★ {tool.rating}
                          </div>
                        </div>

                        <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed mb-6 font-medium bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-all">
                          {tool.description}
                        </p>

                        {/* Кредиты и Тариф */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 hover:border-cyan-500/30 transition-colors">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2 text-cyan-400/80">
                              <Zap size={12} /> Ежедневно
                            </p>
                            <p className="text-xs font-black text-white">{tool.dailyCredits || 'Limited'}</p>
                          </div>
                          <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 hover:border-cyan-500/30 transition-colors">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2 text-indigo-400/80">
                              <Clock size={12} /> Ежемесячно
                            </p>
                            <p className="text-xs font-black text-white">{tool.monthlyCredits || 'Flexible'}</p>
                          </div>
                        </div>

                        {/* Features / Details */}
                        {tool.details && tool.details.length > 0 && (
                          <div className="space-y-2 mb-6">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Ключевые функции</p>
                            {tool.details.slice(0, 2).map((detail: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-slate-300 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50"></div>
                                <span className="font-bold">{detail.title}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Особенности / Плюсы */}
                        {tool.pros && tool.pros.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {tool.pros.slice(0, 3).map((pro, idx) => (
                              <span key={idx} className="bg-sky-500/5 text-sky-400 px-2 py-1 rounded-lg text-[8px] font-black uppercase border border-sky-500/10">
                                {pro}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-auto">
                          <div className="flex flex-col">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Тариф</p>
                            <p className={cn(
                              "text-sm font-black tracking-tight",
                              tool.minPrice?.includes('Нуждается') ? "text-slate-500 italic" : "text-cyan-400"
                            )}>
                              {tool.minPrice}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); enrichToolData(tool.id.toString(), tool.name); }}
                              className={cn(
                                "h-9 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all",
                                tool.description?.includes('собираются нашей системой')
                                  ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5"
                              )}
                              title={tool.description?.includes('собираются нашей системой') ? "Запустить исследование ИИ" : "Обновить данные через ИИ"}
                            >
                              {enrichingToolNames.includes(tool.name)
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Zap size={12} />
                              }
                              {tool.description?.includes('собираются нашей системой') ? 'Исследовать' : 'Обновить'}
                            </button>
                            {tool.docsUrl && (
                              <a
                                href={tool.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-9 h-9 bg-slate-700/50 text-slate-300 rounded-xl flex items-center justify-center border border-white/5 hover:bg-slate-700 hover:text-white transition-all"
                                title="Открыть сайт"
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}
                            {tool.hasMcp && (
                              <div className="w-9 h-9 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner" title="Поддержка MCP">
                                <Terminal size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }
      </main >


      {/* Tool Detail Modal */}
      <ToolDetailModal
        tool={selectedTool as any}
        isOpen={!!selectedTool}
        onClose={() => setSelectedTool(null)}
      />

      {/* Post Detail Modal (Summary & Guide) */}
      {
        selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setSelectedPost(null)}
            />
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="absolute top-6 right-6 z-10">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 sm:p-12 overflow-y-auto max-h-[90vh]">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8 items-center sm:items-start text-center sm:text-left">
                  <img
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('maxresdefault.jpg')) {
                        target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                      } else if (target.src.includes('hqdefault.jpg')) {
                        target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                      } else if (!target.src.includes('unsplash.com')) {
                        target.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200';
                      }
                    }}
                    className="w-full sm:w-48 h-48 sm:h-32 object-cover rounded-2xl shadow-xl border-2 border-slate-800"
                  />
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <span className={cn(
                        "flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest",
                        selectedPost.source === 'YouTube' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {selectedPost.source === 'YouTube' ? <Youtube size={12} /> : <MessageCircle size={12} />}
                        {selectedPost.source}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-500">@{selectedPost.channel}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-4 uppercase tracking-tight">
                      {selectedPost.title}
                    </h2>
                  </div>
                </div>

                {/* Mentions Section - Tools mentioned in this post */}
                {selectedPost.mentions.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <Sparkles size={20} className="text-purple-400" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Упомянутые инструменты</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedPost.mentions
                        .filter((m: string) => !['react', 'python', 'go', 'javascript', 'typescript', 'java', 'c++', 'c#', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'vue', 'angular', 'svelte', 'html', 'css', 'node.js', 'nodejs', 'express', 'fullstack', 'frontend', 'backend', 'developer', 'engineer', 'api', 'database', 'cloud', 'deployment'].some(word => m.trim().toLowerCase().includes(word)))
                        .map(toolName => {
                          const existingToolObj = allTools.find(t => t.name.toLowerCase() === toolName.toLowerCase() || toolName.toLowerCase().includes(t.name.toLowerCase()));
                          const toolObj = existingToolObj || {
                            id: `dyn-${toolName}`,
                            name: toolName,
                            category: "AI Service",
                            description: `Инструмент был определен искусственным интеллектом в одном из материалов, но еще не занесен в нашу основную базу каталога.`,
                            icon: "✨",
                            rating: 4.8,
                            dailyCredits: "Уточняется",
                            monthlyCredits: "Уточняется",
                            minPrice: "По запросу",
                            hasApi: false,
                            hasMcp: false,
                            details: [],
                            pros: ["Перспективно", "Упоминается экспертами", "Тренд"],
                            docsUrl: `https://www.google.com/search?q=${encodeURIComponent(toolName + ' AI')}`
                          };

                          return (
                            <button
                              key={toolName}
                              onClick={() => setSelectedTool(toolObj as any)}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-2xl border transition-all group",
                                "border-white/10 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
                              )}
                            >
                              <span className="text-xl">{toolObj.icon}</span>
                              <div className="text-left">
                                <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                                  {toolObj.name}
                                </p>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                  {toolObj.category}
                                </p>
                              </div>
                              <ArrowRight size={14} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all ml-2" />
                            </button>
                          );
                        })}
                    </div>
                  </section>
                )}

                <div className="space-y-10">
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                        <Brain size={20} className="text-cyan-400" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">AI Анализ контента</h3>
                    </div>
                    <div className="bg-slate-850 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles size={120} />
                      </div>
                      <div className="text-slate-300 leading-relaxed text-base sm:text-lg font-medium relative z-10 space-y-4">
                        {(() => {
                          let content = selectedPost.detailedUsage || '';
                          let paragraphs: string[] = [];

                          // Если контент пришел как строковое представление массива JSON...
                          if (typeof content === 'string' && content.trim().startsWith('[') && content.trim().endsWith(']')) {
                            try {
                              const parsed = JSON.parse(content);
                              if (Array.isArray(parsed)) {
                                paragraphs = parsed;
                              } else {
                                paragraphs = content.split('\n');
                              }
                            } catch {
                              paragraphs = content.split('\n');
                            }
                          } else {
                            paragraphs = content.split('\n');
                          }

                          return paragraphs.filter(p => p.trim()).map((paragraph, idx) => (
                            <p key={idx} className="mb-3 last:mb-0">
                              {paragraph.replace(/^["']|["']$/g, '')}
                            </p>
                          ));
                        })()}
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <Zap size={20} className="text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Как использовать эффективнее</h3>
                    </div>
                    <div className="grid gap-4">
                      {selectedPost.usageTips?.map((tip, i) => (
                        <div key={i} className="flex items-start gap-4 p-5 bg-slate-800/40 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all group">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-sm group-hover:bg-emerald-500 group-hover:text-black transition-all">
                            {i + 1}
                          </div>
                          <p className="text-slate-200 font-semibold pt-1">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 bg-gradient-to-r from-slate-800 to-slate-800/40 rounded-2xl sm:rounded-[2rem] border border-white/10 gap-6 sm:gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
                      <div className="text-center">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase">Views</p>
                        <p className="text-lg sm:text-xl font-black text-white tracking-widest leading-none mt-1">{selectedPost.views}</p>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-center">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase">Released</p>
                        <p className="text-base sm:text-lg font-black text-slate-300 leading-none mt-1">{selectedPost.date}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => dismissPost(selectedPost.id)}
                        className="h-12 sm:h-14 px-4 sm:px-5 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all flex-1 sm:flex-none"
                      >
                        <X size={14} /> Удалить
                      </button>
                      <button
                        onClick={() => archivePost(selectedPost.id)}
                        className={cn(
                          "h-12 sm:h-14 px-4 sm:px-5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all border flex-1 sm:flex-none",
                          (selectedPost as any).isArchived
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-slate-800 border-slate-700 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400"
                        )}
                      >
                        {(selectedPost as any).isArchived ? '✓ В архиве' : '📁 В архив'}
                      </button>
                      <a
                        href={selectedPost.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-12 sm:h-14 px-6 sm:px-8 bg-white text-black font-black uppercase tracking-widest rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all hover:shadow-xl hover:shadow-cyan-400/20 w-full sm:w-auto"
                      >
                        Источник <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Use Case Implementation Modal */}
      {
        selectedUseCase && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300"
              onClick={() => setSelectedUseCase(null)}
            />
            <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/20 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-8 gap-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-lg">
                      <Layers size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Реализация кейса</p>
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">{selectedUseCase.case.title}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUseCase(null)}
                    className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all self-end sm:self-auto"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Brain size={16} className="text-amber-400" /> Концепция
                    </h3>
                    <p className="text-slate-300 text-lg leading-relaxed font-medium bg-slate-800/50 p-6 rounded-3xl border border-white/5">
                      {selectedUseCase.case.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Terminal size={16} className="text-amber-400" /> Шаги реализации
                    </h3>
                    <div className="grid gap-3">
                      {selectedUseCase.case.steps.map((step: string, i: number) => (
                        <div key={i} className="flex items-start gap-4 p-5 bg-slate-800/30 rounded-2xl border border-white/5 group hover:bg-slate-800/50 transition-all">
                          <div className="min-w-[2rem] h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black text-sm">
                            {i + 1}
                          </div>
                          <p className="text-slate-200 font-bold pt-1">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 rounded-[2rem] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Code size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-300 uppercase leading-none mb-1 text-left">Технологии</p>
                        <p className="text-white font-black uppercase text-sm">{selectedUseCase.tool}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={allTools.find(t => t.name === selectedUseCase.tool)?.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-4 bg-slate-800 text-white font-black uppercase text-[9px] tracking-widest rounded-xl hover:bg-slate-700 transition-all border border-white/5 flex items-center gap-2"
                      >
                        Документация <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => {
                          const url = selectedUseCase.case.url || `https://www.google.com/search?q=${encodeURIComponent(selectedUseCase.tool + ' ' + selectedUseCase.case.title + ' real world example case study')}`;
                          window.open(url, '_blank');
                        }}
                        className="h-10 px-4 bg-white hover:bg-slate-200 text-black font-black uppercase text-[9px] tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 group/btn"
                      >
                        Оригинал <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Feature Info Modal (Tooltip substitute) */}
      {
        selectedFeature && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setSelectedFeature(null)}
            />
            <div className="relative w-full max-w-sm bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400">
                      <Sparkles size={16} />
                    </div>
                    <h3 className="font-black text-white text-sm uppercase tracking-wider">{selectedFeature.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedFeature(null)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  {selectedFeature.description}
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedFeature(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase rounded-lg transition-all"
                  >
                    Понятно
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      {/* Add Channel Modal */}
      {
        isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => { setIsAddModalOpen(false); setAddChannelError(null); }}
            />
            <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => { setIsAddModalOpen(false); setAddChannelError(null); }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-white mb-2">Добавить канал</h2>
              <p className="text-slate-400 text-sm mb-6">Добавьте @username или URL канала YouTube/Telegram</p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  let url = (formData.get('channelUrl') as string).trim();
                  const source = formData.get('source') as 'YouTube' | 'Telegram';

                  setAddChannelError(null);

                  if (url) {
                    // Нормализация Telegram @username -> https://t.me/username
                    if (source === 'Telegram' && url.startsWith('@')) {
                      url = `https://t.me/${url.substring(1)}`;
                    }

                    // Проверка на дубликат в стейте (после нормализации)
                    const normalizedUrl = url.toLowerCase();
                    const exists = channels.some(c => c.url.toLowerCase() === normalizedUrl);
                    if (exists) {
                      setAddChannelError('Этот канал уже добавлен в ваш список!');
                      return;
                    }

                    // Extract channel name from URL
                    let name = url;
                    if (url.includes('t.me/')) {
                      name = url.split('t.me/')[1];
                    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      const match = url.match(/@([^/?]+)/) || url.match(/channel\/([^/?]+)/);
                      if (match) name = match[1];
                    }

                    const newChannel = {
                      id: `channel-${Date.now()}`,
                      url: url.trim(),
                      source,
                      name
                    };

                    setIsLoadingChannel(true);

                    try {
                      // Сохраняем канал в БД
                      const supabase = getClient();
                      if (supabase) {
                        try {
                          console.log('Sending channel to Supabase:', newChannel);

                          // Сначала пробуем найти, есть ли такой канал (чтобы не зависеть от UNIQUE индекса в upsert)
                          const { data: existing } = await supabase
                            .from('channels')
                            .select('id')
                            .eq('url', newChannel.url)
                            .maybeSingle();

                          if (existing) {
                            console.log('Channel already exists in DB with ID:', existing.id);
                            newChannel.id = existing.id;
                          } else {
                            // Если нет — вставляем новый
                            const { data: insertedChannel, error: channelError } = await supabase
                              .from('channels')
                              .insert([{
                                name: newChannel.name,
                                source: newChannel.source,
                                url: newChannel.url,
                                is_active: true
                              }])
                              .select()
                              .single();

                            if (channelError) {
                              console.error('Error inserting channel to Supabase:', channelError);
                              // Если произошла ошибка "No index/unique constraint found" или подобные
                              setAddChannelError(`Ошибка БД при сохранении канала: ${channelError.message}`);
                            } else if (insertedChannel) {
                              console.log('Successfully saved channel to DB:', insertedChannel.id);
                              newChannel.id = insertedChannel.id;
                            }
                          }
                        } catch (e) {
                          console.error('Exception during channel persistence:', e);
                        }
                      }

                      // Получаем последнюю новость с канала через API
                      const latestPost = await fetchLatestPost(newChannel);

                      // Всегда генерируем полное AI-саммари через API, чтобы получить теги и упомянутые сервисы
                      const aiSummary = await generateAISummary(latestPost);

                      // Если API канала уже вернуло хорошее саммари, а у нас заглушка, берем API саммари
                      if (latestPost.summary && aiSummary.summary === 'Контент недоступен') {
                        aiSummary.summary = latestPost.summary;
                      }

                      // Форматируем дату
                      const formatDate = (dateStr: string): string => {
                        if (!dateStr) return 'Только что';
                        try {
                          const date = new Date(dateStr);
                          const now = new Date();
                          const diffMs = now.getTime() - date.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMins / 60);
                          const diffDays = Math.floor(diffHours / 24);

                          if (diffMins < 1) return 'Только что';
                          if (diffMins < 60) return `${diffMins} мин. назад`;
                          if (diffHours < 24) return `${diffHours} ч. назад`;
                          if (diffDays < 7) return `${diffDays} дн. назад`;
                          return date.toLocaleDateString('ru-RU');
                        } catch {
                          return 'Только что';
                        }
                      };

                      // Создаем новый пост с реальными данными
                      const newPost: Post = {
                        id: Date.now(),
                        title: aiSummary.titleRu || latestPost.title || 'Без названия',
                        summary: aiSummary.summary,
                        source: source,
                        channel: latestPost.channel || name,
                        date: formatDate(latestPost.date || ''),
                        tags: aiSummary.tags,
                        mentions: aiSummary.mentions,
                        views: '0',
                        image: latestPost.image || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400&h=200',
                        url: latestPost.url || url.trim(),
                        detailedUsage: aiSummary.detailedUsage,
                        usageTips: aiSummary.usageTips
                      };

                      // Сохраняем в Supabase
                      if (supabase) {
                        try {
                          console.log('Sending post to Supabase:', newPost.title);

                          // Проверяем существование поста по URL
                          const { data: existingPost } = await supabase
                            .from('posts')
                            .select('id')
                            .eq('url', newPost.url)
                            .maybeSingle();

                          if (existingPost) {
                            console.log('Post already exists in DB with ID:', existingPost.id);
                            // Обновляем id в объекте (для корректной работы Избранного)
                            newPost.id = typeof existingPost.id === 'string' ? parseInt(existingPost.id.slice(0, 8), 16) : existingPost.id;
                          } else {
                            const { data: insertedPost, error } = await supabase.from('posts').insert([{
                              title: newPost.title,
                              summary: newPost.summary,
                              source: newPost.source,
                              channel: newPost.channel,
                              date: new Date(latestPost.date || Date.now()).toISOString(),
                              tags: newPost.tags,
                              mentions: newPost.mentions,
                              views: newPost.views || '0',
                              image: newPost.image,
                              url: newPost.url,
                              detailed_usage: typeof newPost.detailedUsage === 'string' ? newPost.detailedUsage : JSON.stringify(newPost.detailedUsage),
                              usage_tips: newPost.usageTips,
                              is_analyzed: true
                            }]).select().single();

                            if (error) {
                              console.error('Error inserting post to Supabase:', error);
                            } else if (insertedPost) {
                              console.log('Successfully saved post to DB:', insertedPost.id);
                              newPost.id = typeof insertedPost.id === 'string' ? parseInt(insertedPost.id.slice(0, 8), 16) : insertedPost.id;
                            }
                          }
                        } catch (dbError) {
                          console.error('Exception saving post to DB:', dbError);
                        }
                      }

                      // Добавляем канал и новую новость в начало списка
                      setChannels(prev => [newChannel, ...prev]);
                      setPosts(prev => [newPost, ...prev]);
                    } catch (error) {
                      console.error('Error fetching channel data:', error);
                      // Добавляем канал даже если произошла ошибка
                      setChannels(prev => [newChannel, ...prev]);
                    } finally {
                      setIsLoadingChannel(false);
                      setIsAddModalOpen(false);
                    }
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL канала</label>
                  <input
                    name="channelUrl"
                    type="text"
                    placeholder="@channel или https://t.me/channel"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                {addChannelError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-xs font-bold flex items-center gap-2">
                      <X size={14} /> {addChannelError}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Платформа</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-800 border border-white/10 rounded-xl cursor-pointer hover:border-red-500/50 transition-colors has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10">
                      <input type="radio" name="source" value="YouTube" className="sr-only" defaultChecked />
                      <Youtube className="w-5 h-5 text-red-400" />
                      <span className="text-sm font-medium">YouTube</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-800 border border-white/10 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10">
                      <input type="radio" name="source" value="Telegram" className="sr-only" />
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                      <span className="text-sm font-medium">Telegram</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoadingChannel}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingChannel ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    'Добавить канал'
                  )}
                </button>
              </form>

              {channels.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Добавленные каналы</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {channels.map(channel => (
                      <div key={channel.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {channel.source === 'YouTube'
                            ? <Youtube className="w-4 h-4 text-red-400" />
                            : <MessageCircle className="w-4 h-4 text-blue-400" />
                          }
                          <span className="text-sm text-white truncate max-w-[150px]">{channel.name}</span>
                        </div>
                        <button
                          onClick={() => setChannels(prev => prev.filter(c => c.id !== channel.id))}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
}
