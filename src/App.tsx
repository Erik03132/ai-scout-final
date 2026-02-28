import { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, TrendingUp, Youtube, MessageCircle, Wrench, Heart, Clock, Filter, ArrowRight, Zap, Brain, ExternalLink, X, FileText, Lightbulb, Code, Terminal, Layers } from 'lucide-react';
import { cn } from './utils/cn';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getClient } from './lib/supabase/client';
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

const categories = ["All", "AI", "Deployment", "Database", "Design", "ORM", "CSS", "State", "Framework", "Payments"];

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'insights' | 'archive' | 'favorites'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useLocalStorage<string[]>('ai-scout-favorites', []);
  const [isSearching, setIsSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [selectedTool, setSelectedTool] = useState<typeof mockTools[0] | null>(null);
  const [selectedPost, setSelectedPost] = useState<typeof mockPosts[0] | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<{ tool: string, case: any } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<{ title: string, description: string } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [channels, setChannels] = useState<Array<{ id: string, url: string, source: 'YouTube' | 'Telegram', name: string }>>([]);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [tools, setTools] = useState<typeof mockTools>(mockTools);
  const [cachedDynamicTools, setCachedDynamicTools] = useLocalStorage<typeof mockTools>('ai-scout-dynamic-tools', []);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [archivedPostIds, setArchivedPostIds] = useLocalStorage<number[]>('ai-scout-archived-posts', []);
  const [dismissedPostIds, setDismissedPostIds] = useLocalStorage<number[]>('ai-scout-dismissed-posts', []);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterMention, setFilterMention] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<'all' | 'YouTube' | 'Telegram'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    setCachedDynamicTools(prev => {
      const allMentions = Array.from(new Set(posts.flatMap(p => p.mentions || [])));
      const newDynamicTools = [...prev];
      let hasChanges = false;

      allMentions.forEach(mention => {
        const existsInTools = tools.some(t => t.name.toLowerCase() === mention.toLowerCase() || mention.toLowerCase().includes(t.name.toLowerCase()));
        const existsInCached = newDynamicTools.some(t => t.name.toLowerCase() === mention.toLowerCase() || mention.toLowerCase().includes(t.name.toLowerCase()));

        if (!existsInTools && !existsInCached) {
          newDynamicTools.push({
            id: `dyn-${mention}` as any,
            name: mention,
            category: "AI/Tech",
            description: `Инструмент ${mention} был упомянут в этом посте. Детальная информация и обзоры для него пока собираются нашей системой.`,
            icon: "⚙️",
            rating: 4.5,
            dailyCredits: "Н/Д",
            monthlyCredits: "Н/Д",
            minPrice: "Н/Д",
            hasApi: false,
            hasMcp: false,
            details: [],
            pros: ["Упоминается экспертами"],
            docsUrl: `https://www.google.com/search?q=${encodeURIComponent(mention + ' AI tool')}`
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
        // Параллельные запросы вместо последовательных для оптимизации загрузки
        const [toolsResult, postsResult, channelsResult] = await Promise.all([
          supabase.from('tools').select('*').order('rating', { ascending: false }),
          supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20),
          supabase.from('channels').select('*').order('created_at', { ascending: false })
        ]);

        // Обрабатываем инструменты
        if (toolsResult.data && toolsResult.data.length > 0) {
          const formattedTools = toolsResult.data.map(t => ({
            id: t.id,
            name: t.name,
            category: t.category,
            description: t.description,
            icon: t.icon || '🔧',
            rating: t.rating || 0,
            dailyCredits: t.daily_credits,
            monthlyCredits: t.monthly_credits,
            minPrice: t.min_price,
            hasApi: t.has_api,
            hasMcp: t.has_mcp,
            details: [],
            pros: t.pros || [],
            docsUrl: t.docs_url
          }));
          setTools(formattedTools);
        }

        // Обрабатываем посты
        if (postsResult.data && postsResult.data.length > 0) {
          const formattedPosts = postsResult.data.map(p => ({
            id: typeof p.id === 'string' ? parseInt(p.id.slice(0, 8), 16) : p.id,
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
            usageTips: p.usage_tips || []
          }));
          setPosts(formattedPosts);
        }

        // Обрабатываем каналы
        if (channelsResult.data && channelsResult.data.length > 0) {
          const formattedChannels = channelsResult.data.map(c => ({
            id: c.id,
            url: c.url,
            source: c.source as 'YouTube' | 'Telegram',
            name: c.name
          }));
          setChannels(formattedChannels);
        }
      } catch (err) {
        console.error('Error loading from Supabase:', err);
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
          image: `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`,
          channel: video.channelTitle || channel.name,
          source: 'YouTube',
          date: video.publishedAt,
          content: video.description,
          summary: video.summary // Используем саммари из API
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
      return {
        titleRu: title,
        summary: content.substring(0, 200) || title || 'Контент недоступен',
        tags: ['Tech'],
        mentions: [],
        detailedUsage: '',
        usageTips: [
          'Изучите официальную документацию',
          'Попробуйте на практике',
          'Следите за обновлениями'
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

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));

    setAiResponse(`🔍 Анализ по запросу: "${searchQuery}"\n\nНа основе последних данных и трендов я могу сообщить:\n\n• Этот инструмент показывает рост популярности на +35% за последний месяц\n• Основные преимущества: скорость разработки, отличная документация, активная поддержка сообщества\n• Рекомендуется для проектов любого масштаба от стартапов до корпоративных решений\n• Отлично интегрируется с современным стеком технологий\n\n💡 Совет: Попробуйте комбинировать с TypeScript для максимальной эффективности.`);

    setIsSearching(false);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };


  const favoriteTools = useMemo(() =>
    allTools.filter(tool => favorites.includes(`tool-${tool.id}`)),
    [allTools, favorites]
  );
  const favoritePosts = posts.filter(post => favorites.includes(`post-${post.id}`));

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
  const archivePost = (postId: number) => {
    setArchivedPostIds(prev => prev.includes(postId) ? prev : [...prev, postId]);
    setSelectedPost(null);
  };

  const dismissPost = (postId: number) => {
    setDismissedPostIds(prev => prev.includes(postId) ? prev : [...prev, postId]);
    setSelectedPost(null);
  };

  const removeFromArchive = (postId: number) => {
    setArchivedPostIds(prev => prev.filter(id => id !== postId));
  };

  // Посты для архива и ленты
  const archivedPosts = useMemo(() => posts.filter(p => archivedPostIds.includes(p.id)), [posts, archivedPostIds]);

  // Отфильтрованные посты (без удалённых и архивированных)
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (dismissedPostIds.includes(p.id)) return false;
      if (archivedPostIds.includes(p.id)) return false;
      if (filterSource !== 'all' && p.source !== filterSource) return false;
      if (filterTag && !(p.tags || []).includes(filterTag)) return false;
      if (filterMention && !(p.mentions || []).map(m => m.toLowerCase()).includes(filterMention.toLowerCase())) return false;
      return true;
    });
  }, [posts, filterSource, filterTag, filterMention, dismissedPostIds, archivedPostIds]);

  const activeFiltersCount = [filterSource !== 'all', filterTag, filterMention].filter(Boolean).length;

  // Фильтрация инструментов для Archive tab
  const filteredTools = useMemo(() =>
    allTools.filter(tool => selectedCategory === 'All' || tool.category === selectedCategory),
    [allTools, selectedCategory]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 premium-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-500 group-hover:rotate-6 will-change-transform">
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase tracking-tighter leading-none">AI Scout</span>
                <span className="text-[8px] md:text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] leading-none mt-1 opacity-70">Intelligence</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/30 p-1.5 rounded-2xl border border-white/5">
              {[
                { id: 'feed', label: 'Лента', icon: TrendingUp },
                { id: 'insights', label: 'AI Insight', icon: Brain },
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


            {/* Mobile Header Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setActiveTab('favorites')}
                className={cn(
                  "p-2.5 rounded-xl border transition-all duration-300",
                  activeTab === 'favorites' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-slate-800/50 border-white/5 text-slate-400"
                )}
              >
                <Heart size={20} className={cn(favorites.length > 0 && activeTab !== 'favorites' && "animate-pulse")} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-2.5 flex items-center justify-around shadow-2xl shadow-black/50 premium-blur">
        {[
          { id: 'feed', label: 'Лента', icon: TrendingUp },
          { id: 'insights', label: 'Analysis', icon: Brain },
          { id: 'archive', label: 'Архив', icon: Wrench },
          { id: 'favorites', label: 'Saved', icon: Heart },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if ('vibrate' in navigator) navigator.vibrate(5);
            }}
            className={cn(
              "relative flex flex-col items-center gap-1 p-3 min-w-[4rem] transition-all duration-500 rounded-2xl",
              activeTab === tab.id ? "text-cyan-400 bg-cyan-500/10" : "text-slate-500 active:scale-90"
            )}
          >
            <tab.icon size={22} className={cn("transition-all duration-500", activeTab === tab.id && "scale-110 -translate-y-0.5")} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute -top-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
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
              <button
                type="submit"
                disabled={isSearching}
                className="ml-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Спросить
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
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
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
                      className="w-full sm:w-40 h-48 sm:h-28 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          post.source === 'YouTube'
                            ? "bg-red-500/10 text-red-400"
                            : "bg-sky-500/10 text-sky-400"
                        )}>
                          {post.source === 'YouTube' ? <Youtube className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                          {post.source}
                        </span>
                        <span className="text-xs text-slate-500">{post.channel}</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.date}
                        </span>
                        <span className="text-xs text-slate-500 ml-auto">{post.views} просмотров</span>
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
                        {post.mentions.length > 0 && (
                          <>
                            <span className="text-slate-600">|</span>
                            <div className="flex flex-wrap gap-1">
                              {post.mentions
                                .filter((m: string) => !['react', 'python', 'go', 'javascript', 'typescript', 'java', 'c++', 'c#', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'vue', 'angular', 'svelte', 'html', 'css', 'node.js', 'nodejs', 'express', 'fullstack', 'frontend', 'backend', 'developer', 'engineer', 'api', 'database', 'cloud', 'deployment'].some(word => m.trim().toLowerCase().includes(word)))
                                .map((toolName: string) => {
                                  const existingToolObj = allTools.find((t) =>
                                    t.name.toLowerCase() === toolName.toLowerCase() ||
                                    toolName.toLowerCase().includes(t.name.toLowerCase())
                                  );

                                  const toolObj = existingToolObj || {
                                    id: `dyn-${toolName}`,
                                    name: toolName,
                                    category: "AI Service",
                                    description: `Интеллектуальный анализ применения ${toolName} в современных рабочих процессах. Сейчас наша система собирает подробные данные об API, тарифах и реальных кейсах.`,
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

                                  const displayName = existingToolObj ? existingToolObj.name : toolName;

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
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
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
                          "p-2 rounded-xl transition-all duration-200 border",
                          favorites.includes(`post-${post.id}`)
                            ? "text-red-400 bg-red-500/10 border-red-500/20"
                            : "text-slate-500 hover:text-red-400 hover:bg-slate-700/50 border-transparent"
                        )}
                      >
                        <Heart className={cn("w-5 h-5", favorites.includes(`post-${post.id}`) && "fill-current")} />
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
                <h2 className="text-2xl font-bold text-white">AI Аналитика</h2>
                <p className="text-slate-400 text-sm mt-1">Интеллектуальный анализ трендов и инструментов</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  { label: "Рост AI-инструментов", value: "+234%", change: "+12% за месяц", color: "from-cyan-500 to-blue-600" },
                  { label: "Анализировано контента", value: "1.2K", change: "за последние 7 дней", color: "from-emerald-500 to-teal-600" },
                  { label: "Найдено инструментов", value: "847", change: "32 новых за неделю", color: "from-amber-500 to-orange-600" },
                ].map((stat, index) => (
                  <div key={index} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400 text-sm">{stat.label}</span>
                      <div className={cn("w-10 h-10 bg-gradient-to-br", stat.color, "rounded-xl flex items-center justify-center")}>
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.change}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-4">🔥 Тренды недели</h3>
                  <div className="space-y-3">
                    {[
                      { rank: 1, name: "AI Agents", growth: "+45%" },
                      { rank: 2, name: "Rust in Web", growth: "+38%" },
                      { rank: 3, name: "Edge Computing", growth: "+32%" },
                      { rank: 4, name: "WebGPU", growth: "+28%" },
                      { rank: 5, name: "Microfrontends", growth: "+24%" },
                    ].map(trend => (
                      <div key={trend.rank} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-700/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                            trend.rank === 1 ? "bg-amber-500/20 text-amber-400" :
                              trend.rank === 2 ? "bg-slate-400/20 text-slate-300" :
                                trend.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                                  "bg-slate-700 text-slate-500"
                          )}>
                            {trend.rank}
                          </span>
                          <span className="text-sm text-white">{trend.name}</span>
                        </div>
                        <span className="text-xs text-emerald-400 font-medium">{trend.growth}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-4">💡 AI Рекомендации</h3>
                  <div className="space-y-3">
                    {[
                      { title: "Обратите внимание на Bun", desc: "Замена Node.js с 5x ускорением" },
                      { title: "Попробуйте htmx", desc: "Без JS фреймворков для простых проектов" },
                      { title: "Изучите SQL", desc: "Основа для работы с любыми БД" },
                    ].map((rec, index) => (
                      <div key={index} className="p-3 bg-slate-700/30 rounded-xl border border-slate-600/30 cursor-pointer hover:border-cyan-500/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ArrowRight className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-sm">{rec.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{rec.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      <div className="flex gap-4">
                        <img
                          src={post.image}
                          alt={post.title}
                          loading="lazy"
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            if (!t.src.includes('unsplash.com')) t.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200';
                          }}
                          className="w-32 h-20 object-cover rounded-xl flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              post.source === 'YouTube' ? "bg-red-500/10 text-red-400" : "bg-sky-500/10 text-sky-400"
                            )}>
                              {post.source === 'YouTube' ? <Youtube className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                              {post.source}
                            </span>
                            <span className="text-xs text-slate-500">{post.channel}</span>
                            <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                              <Clock className="w-3 h-3" />{post.date}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2">{post.summary}</p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
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

        {/* Favorites Tab */}
        {
          activeTab === 'favorites' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Ваше избранное</h2>
                <p className="text-slate-400 text-sm mt-1">Сохраненные новости и инструменты</p>
              </div>

              {favoriteTools.length === 0 && favoritePosts.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-400">Список пуст</h3>
                  <p className="text-slate-500 text-sm mt-2">Добавляйте инструменты и новости в избранное, чтобы они появились здесь</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {favoriteTools.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-cyan-400" />
                        Инструменты
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favoriteTools.map(tool => (
                          <div
                            key={tool.id}
                            className="group bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-[2.5rem] p-7 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                          >
                            <div className="flex items-start justify-between mb-6">
                              <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                {tool.icon}
                              </div>
                              <button
                                onClick={() => toggleFavorite(`tool-${tool.id}`)}
                                className="p-3 rounded-2xl text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 border border-red-500/20 shadow-lg shadow-red-500/5"
                              >
                                <Heart className="w-5 h-5 fill-current" />
                              </button>
                            </div>
                            <h3 className="font-black text-xl text-white mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{tool.name}</h3>
                            <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg uppercase tracking-widest mb-4 inline-block border border-cyan-500/20">
                              {tool.category}
                            </span>
                            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-6 font-medium">{tool.description}</p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                              <div className="bg-slate-900/40 rounded-xl p-3 border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Zap size={10} /> {tool.dailyCredits}</p>
                              </div>
                              <div className="bg-slate-900/40 rounded-xl p-3 border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> {tool.monthlyCredits}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-700/50 mt-auto">
                              <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-slate-500 uppercase">Tariff</p>
                                <p className="text-lg font-black text-emerald-400">{tool.minPrice}</p>
                              </div>
                              <div className="flex gap-1.5">
                                {tool.hasApi && <span className="bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-blue-500/20">API</span>}
                                {tool.hasMcp && <span className="bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-emerald-500/20">MCP</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {favoritePosts.length > 0 && (
                    <section>
                      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Новости и посты
                      </h3>
                      <div className="grid gap-4">
                        {favoritePosts.map(post => (
                          <div
                            key={post.id}
                            className="group bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm border-2 border-slate-700 rounded-2xl p-6"
                          >
                            <div className="flex flex-col sm:flex-row gap-4">
                              <img src={post.image} alt={post.title} loading="lazy" onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src.includes('maxresdefault.jpg')) {
                                  target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                                } else if (target.src.includes('hqdefault.jpg')) {
                                  target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                                } else if (!target.src.includes('unsplash.com')) {
                                  target.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200';
                                }
                              }} className="w-full sm:w-32 h-40 sm:h-20 object-cover rounded-xl flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3
                                  onClick={() => setSelectedPost(post)}
                                  className="font-semibold text-white mb-1 cursor-pointer hover:text-cyan-400 transition-colors"
                                >
                                  {post.title}
                                </h3>
                                <p className="text-sm text-slate-400 line-clamp-1">{post.summary}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs text-slate-500">{post.channel}</span>
                                  <div className="flex items-center gap-2 ml-auto">
                                    <a
                                      href={post.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-amber-500 hover:text-amber-400 transition-colors"
                                    >
                                      <ExternalLink size={14} />
                                    </a>
                                    <button
                                      onClick={() => toggleFavorite(`post-${post.id}`)}
                                      className="text-red-400 text-xs font-medium hover:underline"
                                    >
                                      Удалить
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )
        }
      </main >


      {/* Tool Detail Modal */}
      {
        selectedTool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setSelectedTool(null)}
            />
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-300 custom-scrollbar">
              <div className="absolute top-6 right-6 z-10">
                <button
                  onClick={() => setSelectedTool(null)}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 sm:p-10">
                <div className="flex items-start gap-6 mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 shadow-xl rounded-[1.5rem] flex items-center justify-center text-5xl">
                    {selectedTool.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                        {selectedTool.category}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                        ★ {selectedTool.rating}
                      </div>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-4">
                      {selectedTool.name}
                    </h2>
                    <div className="flex gap-2">
                      {selectedTool.hasApi && (
                        <div className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-black uppercase">API Access</div>
                      )}
                      {selectedTool.hasMcp && (
                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-black uppercase">MCP Ready</div>
                      )}
                      {(selectedTool as any).useCases && (
                        <button
                          onClick={() => document.getElementById('use-cases-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-black uppercase hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                        >
                          <Lightbulb size={12} /> Кейсы
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">Описание</h4>
                    <p className="text-slate-300 leading-relaxed font-medium text-lg">
                      {selectedTool.description}
                    </p>
                  </section>

                  {selectedTool.id.toString().startsWith('dyn-') ? (
                    <div className="bg-[#172033] border border-slate-700/50 rounded-3xl p-10 text-center relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <Sparkles size={120} className="text-cyan-400" />
                      </div>
                      <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
                          <Zap className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Новый инструмент</h3>
                        <p className="text-lg text-slate-300 max-w-md mx-auto mb-8 leading-relaxed font-medium">
                          Искусственный интеллект автоматически распознал <b>{selectedTool.name}</b>. Этого инструмента пока нет в нашем каталоге, но вы можете изучить его самостоятельно.
                        </p>
                        <button
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedTool.name + ' AI tool')}`, '_blank')}
                          className="inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-200 text-black px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] active:scale-95 w-full sm:w-auto"
                        >
                          Поискать в Google <ExternalLink size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-[1.5rem] p-5 border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Zap size={14} className="text-cyan-400" /> Daily Limit
                          </p>
                          <p className="text-lg font-black text-white">{selectedTool.dailyCredits}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-[1.5rem] p-5 border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Clock size={14} className="text-blue-400" /> Monthly Credits
                          </p>
                          <p className="text-lg font-black text-white">{selectedTool.monthlyCredits}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[1.5rem] p-6 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Минимальный тариф</p>
                          <p className="text-3xl font-black text-emerald-400 tracking-tighter">{selectedTool.minPrice}</p>
                        </div>
                        <button className="h-14 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                          Подписаться
                        </button>
                      </div>

                      <section>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 ml-1">Ключевые особенности (кликабельно)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedTool.details?.map((detail: any, i: number) => (
                            <button
                              key={i}
                              onClick={() => setSelectedFeature(detail)}
                              className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-white/5 text-sm text-slate-300 font-semibold hover:text-white hover:border-cyan-500/30 transition-all text-left group/feature"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 group-hover/feature:shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all" />
                              {detail.title}
                            </button>
                          ))}
                        </div>
                      </section>
                    </>
                  )}

                  {(selectedTool as any).useCases && (
                    <section id="use-cases-section" className="scroll-mt-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                          <Lightbulb size={20} className="text-amber-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Популярные бизнес-кейсы</h3>
                      </div>
                      <div className="space-y-3">
                        {(selectedTool as any).useCases.map((useCase: any, i: number) => (
                          <div
                            key={i}
                            onClick={() => setSelectedUseCase({ tool: selectedTool.name, case: useCase })}
                            className="group flex flex-col p-5 bg-gradient-to-r from-slate-800/50 to-slate-800/20 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-amber-500/50 group-hover:bg-amber-400 transition-colors" />
                                <p className="text-slate-200 font-bold group-hover:text-white transition-colors">{useCase.title}</p>
                              </div>
                              <span className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider",
                                useCase.complexity === 'Simple' && "bg-emerald-500/10 text-emerald-500",
                                useCase.complexity === 'Medium' && "bg-amber-500/10 text-amber-500",
                                useCase.complexity === 'Hard' && "bg-red-500/10 text-red-500"
                              )}>
                                {useCase.complexity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 ml-6 line-clamp-1 group-hover:text-slate-300 transition-colors">
                              {useCase.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="mt-10 flex gap-4">
                  <button
                    onClick={() => toggleFavorite(`tool-${selectedTool.id}`)}
                    className={cn(
                      "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                      favorites.includes(`tool-${selectedTool.id}`)
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", favorites.includes(`tool-${selectedTool.id}`) && "fill-current")} />
                    {favorites.includes(`tool-${selectedTool.id}`) ? "В избранном" : "В избранное"}
                  </button>
                  <button
                    onClick={() => window.open(selectedTool.docsUrl, '_blank')}
                    className="flex-1 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Документация <ExternalLink size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

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
                <div className="flex gap-6 mb-8 items-start">
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
                    className="w-48 h-32 object-cover rounded-2xl shadow-xl border-2 border-slate-800"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest",
                        selectedPost.source === 'YouTube' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {selectedPost.source === 'YouTube' ? <Youtube size={14} /> : <MessageCircle size={14} />}
                        {selectedPost.source}
                      </span>
                      <span className="text-sm font-bold text-slate-500">@{selectedPost.channel}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight mb-4 uppercase tracking-tight">
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
                    <div className="bg-slate-850 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles size={120} />
                      </div>
                      <div className="text-slate-300 leading-relaxed text-lg font-medium relative z-10">
                        {selectedPost.detailedUsage?.split('\n').map((paragraph, idx) => (
                          <span key={idx} className="block mb-3 last:mb-0">
                            {paragraph}
                          </span>
                        ))}
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

                  <div className="flex items-center justify-between p-8 bg-gradient-to-r from-slate-800 to-slate-800/40 rounded-[2rem] border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase">Views</p>
                        <p className="text-xl font-black text-white tracking-widest leading-none mt-1">{selectedPost.views}</p>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase">Released</p>
                        <p className="text-lg font-black text-slate-300 leading-none mt-1">{selectedPost.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => dismissPost(selectedPost.id)}
                        title="Удалить из ленты"
                        className="h-14 px-5 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all"
                      >
                        <X size={16} /> Удалить
                      </button>
                      <button
                        onClick={() => archivePost(selectedPost.id)}
                        title="Сохранить в архив"
                        className={cn(
                          "h-14 px-5 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all border",
                          archivedPostIds.includes(selectedPost.id)
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-slate-800 border-slate-700 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400"
                        )}
                      >
                        {archivedPostIds.includes(selectedPost.id) ? '✓ В архиве' : '📁 В архив'}
                      </button>
                      <a
                        href={selectedPost.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 hover:bg-cyan-400 transition-all hover:shadow-xl hover:shadow-cyan-400/20"
                      >
                        Источник <ExternalLink size={18} />
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
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black">
                      <Layers size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Реализация кейса</p>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{selectedUseCase.case.title}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUseCase(null)}
                    className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
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
                    <a
                      href={allTools.find(t => t.name === selectedUseCase.tool)?.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 px-6 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center"
                    >
                      Открыть документацию
                    </a>
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
              onClick={() => setIsAddModalOpen(false)}
            />
            <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setIsAddModalOpen(false)}
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
                  const url = formData.get('channelUrl') as string;
                  const source = formData.get('source') as 'YouTube' | 'Telegram';

                  if (url.trim()) {
                    // Extract channel name from URL or @username
                    let name = url.trim();
                    if (url.startsWith('@')) {
                      // Telegram @username format
                      name = url.substring(1);
                    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      const match = url.match(/@([^/?]+)/) || url.match(/channel\/([^/?]+)/);
                      if (match) name = match[1];
                    } else if (url.includes('t.me')) {
                      const match = url.match(/t\.me\/([^/?]+)/);
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
                        const { data: insertedChannel, error: channelError } = await supabase.from('channels').upsert([{
                          name: newChannel.name,
                          source: newChannel.source,
                          url: newChannel.url
                        }], { onConflict: 'url' }).select().single();

                        if (!channelError && insertedChannel) {
                          newChannel.id = insertedChannel.id;
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
                          const { data: insertedPost, error } = await supabase.from('posts').upsert([{
                            title: newPost.title,
                            summary: newPost.summary,
                            source: newPost.source,
                            channel: newPost.channel,
                            date: new Date().toISOString(), // Используем ISO формат для БД
                            tags: newPost.tags,
                            mentions: newPost.mentions,
                            views: newPost.views || '0',
                            image: newPost.image,
                            url: newPost.url,
                            detailed_usage: newPost.detailedUsage,
                            usage_tips: newPost.usageTips,
                            is_analyzed: true
                          }], { onConflict: 'url' }).select().single();

                          if (error) {
                            console.error('Error saving post to Supabase:', error);
                          } else if (insertedPost) {
                            // Используем ID из базы для корректного отображения и хранения
                            newPost.id = typeof insertedPost.id === 'string' ? parseInt(insertedPost.id.slice(0, 8), 16) : insertedPost.id;
                          }
                        } catch (dbError) {
                          console.error('Exception saving to DB:', dbError);
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Платформа</label>
                  <div className="flex gap-3">
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
