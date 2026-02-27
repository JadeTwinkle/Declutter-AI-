import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Trash2,
  LayoutGrid,
  Palette,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  X,
  SlidersHorizontal,
  ListChecks,
  Compass,
  BookOpen,
  ExternalLink,
  Target,
} from 'lucide-react';
import {
  analyzeRoom,
  AnalysisResult,
  Suggestion,
  OptimizationDirection,
  OptimizationPlan,
} from './services/geminiService';

type TabKey = 'process' | 'inspiration' | 'about';

interface InspirationArticle {
  title: string;
  source: string;
  summary: string;
  href: string;
  tags: string[];
  fitDirection: OptimizationDirection | 'Both';
}

const DIRECTION_OPTIONS: {
  value: OptimizationDirection;
  title: string;
  subtitle: string;
}[] = [
  {
    value: 'Simple',
    title: '更简洁 (Simple)',
    subtitle: '优先快速清理、低成本、易执行。',
  },
  {
    value: 'Rich',
    title: '更繁复 (Rich)',
    subtitle: '增加层次感、细节布置和风格升级。',
  },
];

const CURATED_ARTICLES: InspirationArticle[] = [
  {
    title: 'Small Space, Big Calm: 15-Minute Reset Method',
    source: 'Apartment Therapy',
    summary: '适合日常快速复位，强调“看得见的整洁感”与可持续习惯。',
    href: 'https://www.apartmenttherapy.com/',
    tags: ['Declutter', 'Organize', 'Habit'],
    fitDirection: 'Simple',
  },
  {
    title: 'Layering Texture for a Warm Minimal Living Room',
    source: 'Dezeen',
    summary: '在极简基底上增加材质层次，兼顾秩序感与空间温度。',
    href: 'https://www.dezeen.com/interiors/',
    tags: ['Style', 'Palette', 'Texture'],
    fitDirection: 'Rich',
  },
  {
    title: 'Storage That Disappears: Built-in Organization Ideas',
    source: 'ArchDaily',
    summary: '通过隐藏式收纳与分区策略，减少视觉噪音并提升动线效率。',
    href: 'https://www.archdaily.com/search/projects/categories/interior-design',
    tags: ['Organize', 'Flow', 'Storage'],
    fitDirection: 'Both',
  },
  {
    title: 'Color Mapping for Cohesive Home Styling',
    source: 'Houzz',
    summary: '围绕主色/辅助色做空间配比，让色板建议可落地执行。',
    href: 'https://www.houzz.com/magazine',
    tags: ['Style', 'Palette'],
    fitDirection: 'Rich',
  },
  {
    title: 'The One-Basket Rule for Daily Decluttering',
    source: 'The Spruce',
    summary: '低门槛方法，帮助用户快速开始并降低整理心理负担。',
    href: 'https://www.thespruce.com/',
    tags: ['Declutter', 'Habit'],
    fitDirection: 'Simple',
  },
  {
    title: 'Scandinavian Entryway Systems That Actually Work',
    source: 'Domino',
    summary: '针对玄关、过道等高频区域提供模块化组织灵感。',
    href: 'https://www.domino.com/',
    tags: ['Organize', 'Style', 'Flow'],
    fitDirection: 'Both',
  },
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [direction, setDirection] = useState<OptimizationDirection>('Simple');
  const [activeTab, setActiveTab] = useState<TabKey>('process');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeRoom(image, direction);
      setResult(analysis);
      setActiveTab('inspiration');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  const recommendedArticles = useMemo(() => {
    const categorySignals = new Set(result?.suggestions.map((item) => item.category) ?? []);

    return [...CURATED_ARTICLES]
      .map((article) => {
        let score = 0;
        if (article.fitDirection === direction) score += 3;
        if (article.fitDirection === 'Both') score += 1;
        article.tags.forEach((tag) => {
          if (categorySignals.has(tag as Suggestion['category'])) score += 2;
        });
        return { ...article, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [result, direction]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <header className="px-6 py-8 md:px-12 flex justify-between items-center border-b border-black/5 bg-white/70 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <h1 className="text-2xl font-serif italic tracking-tight">DeclutterAI</h1>
        </div>
        <nav className="hidden md:flex gap-3 text-sm font-medium uppercase tracking-widest">
          <TabButton label="Process" tab="process" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Inspiration" tab="inspiration" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="About" tab="about" activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'process' && (
            <motion.div key="process" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProcessPanel
                image={image}
                direction={direction}
                setDirection={setDirection}
                onDrop={onDrop}
                handleImageUpload={handleImageUpload}
                reset={reset}
                handleAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                error={error}
                result={result}
              />
            </motion.div>
          )}

          {activeTab === 'inspiration' && (
            <motion.div key="inspiration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InspirationPanel
                recommendedArticles={recommendedArticles}
                direction={direction}
                hasAnalysis={Boolean(result)}
              />
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AboutPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="px-6 py-12 md:px-12 border-t border-black/5 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] opacity-30">
          DeclutterAI &copy; 2024 &mdash; Crafted for Clarity
        </p>
      </footer>
    </div>
  );
}

function ProcessPanel({
  image,
  direction,
  setDirection,
  onDrop,
  handleImageUpload,
  reset,
  handleAnalyze,
  isAnalyzing,
  error,
  result,
}: {
  image: string | null;
  direction: OptimizationDirection;
  setDirection: React.Dispatch<React.SetStateAction<OptimizationDirection>>;
  onDrop: (e: React.DragEvent) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
  handleAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
  result: AnalysisResult | null;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-16 items-start">
      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-5xl md:text-6xl font-light tracking-tighter leading-[0.9]">
            Transform your <br />
            <span className="font-serif italic">living space.</span>
          </h2>
          <p className="text-lg text-black/60 max-w-md leading-relaxed">
            Upload a photo of any room. Our AI will analyze the layout and generate personalized
            organization strategies.
          </p>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`relative aspect-[4/3] rounded-3xl border-2 border-dashed transition-all duration-500 overflow-hidden flex flex-col items-center justify-center group
            ${image ? 'border-transparent' : 'border-black/10 hover:border-black/30 bg-black/[0.02]'}
          `}
        >
          {image ? (
            <>
              <img src={image} alt="Room to analyze" className="w-full h-full object-cover" />
              <button
                onClick={reset}
                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <div className="text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                <Camera className="text-black/40" size={32} />
              </div>
              <div>
                <p className="font-medium">Drop your photo here</p>
                <p className="text-sm text-black/40">or click to browse files</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>

        {image && !result && !isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-4 rounded-2xl border border-black/10 bg-black/[0.02] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/50">
                <SlidersHorizontal size={14} /> 优化方向
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {DIRECTION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDirection(option.value)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      direction === option.value
                        ? 'border-black bg-black text-white shadow-lg shadow-black/10'
                        : 'border-black/10 hover:border-black/30 bg-white'
                    }`}
                  >
                    <p className="text-sm font-medium">{option.title}</p>
                    <p className={`text-xs mt-1 ${direction === option.value ? 'text-white/70' : 'text-black/50'}`}>
                      {option.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              onClick={handleAnalyze}
              className="w-full py-6 bg-black text-white rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-neutral-800 transition-colors shadow-xl shadow-black/10"
            >
              Analyze Room <ArrowRight size={20} />
            </motion.button>
          </motion.div>
        )}

        {isAnalyzing && (
          <div className="w-full py-12 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 size={40} className="animate-spin text-black/40" />
            <div>
              <p className="font-medium">Analyzing your room...</p>
              <p className="text-sm text-black/40 italic">Matching recommendations to your style direction.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
      </section>

      <section className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/40">
                  <Sparkles size={14} /> AI Analysis
                </div>
                <p className="text-2xl font-light leading-snug text-black/80">{result.overview}</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Key Suggestions</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-black/5 rounded-full">{result.suggestions.length} items</span>
                </div>

                <div className="space-y-4">
                  {result.suggestions.map((suggestion, idx) => (
                    <SuggestionCard key={idx} suggestion={suggestion} index={idx} />
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Optimization Plans</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-black/5 rounded-full">{result.optimizationPlans.length} plans</span>
                </div>
                <div className="space-y-4">
                  {result.optimizationPlans.map((plan, idx) => (
                    <OptimizationPlanCard key={idx} plan={plan} index={idx} selectedDirection={direction} />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Recommended Palette</h3>
                <div className="flex gap-3">
                  {result.colorPalette.map((color, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      className="group relative"
                    >
                      <div
                        className="w-12 h-12 rounded-full shadow-inner border border-black/5 cursor-help"
                        style={{ backgroundColor: color }}
                      />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {color}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : !isAnalyzing && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20 py-20"
            >
              <LayoutGrid size={80} strokeWidth={0.5} />
              <p className="max-w-xs text-sm uppercase tracking-[0.2em]">Your analysis will appear here once you upload a photo.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function InspirationPanel({
  recommendedArticles,
  direction,
  hasAnalysis,
}: {
  recommendedArticles: (InspirationArticle & { score: number })[];
  direction: OptimizationDirection;
  hasAnalysis: boolean;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
            <Compass size={14} /> Inspiration Browser
          </p>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight">精准推荐灵感文章</h2>
          <p className="text-black/60 max-w-2xl">
            根据你的优化方向{direction === 'Simple' ? '（更简洁）' : '（更繁复）'}
            与空间分析结果，自动筛选最匹配的设计阅读内容。
          </p>
        </div>
        <div className="px-4 py-3 rounded-xl border border-black/10 bg-white text-sm">
          <p className="font-semibold flex items-center gap-2">
            <Target size={14} /> Recommendation Mode
          </p>
          <p className="text-black/60 mt-1">{hasAnalysis ? 'AI-Enhanced Matching' : 'Direction-Only Matching'}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {recommendedArticles.map((article, index) => (
          <motion.a
            href={article.href}
            target="_blank"
            rel="noreferrer"
            key={article.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="p-6 bg-white rounded-2xl border border-black/5 hover:border-black/20 transition-all group"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-xs uppercase tracking-widest text-black/40">{article.source}</p>
              <ExternalLink size={14} className="opacity-40 group-hover:opacity-100" />
            </div>
            <h3 className="text-xl font-medium mb-2 leading-snug">{article.title}</h3>
            <p className="text-sm text-black/60 mb-4">{article.summary}</p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-black/5">
                  {tag}
                </span>
              ))}
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
          <BookOpen size={14} /> About DeclutterAI
        </p>
        <h2 className="text-4xl md:text-5xl font-light tracking-tight">从整理建议进化到设计决策助手</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: 'Process',
            content: '上传空间图片，识别问题区域并生成可执行建议。',
          },
          {
            title: 'Inspiration',
            content: '结合优化方向与分析信号，推荐更精准的设计灵感文章。',
          },
          {
            title: 'About',
            content: '建立个人空间偏好档案，持续优化推荐质量与风格一致性。',
          },
        ].map((item) => (
          <div key={item.title} className="p-6 rounded-2xl bg-white border border-black/5">
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-black/60">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabButton({
  label,
  tab,
  activeTab,
  setActiveTab,
}: {
  label: string;
  tab: TabKey;
  activeTab: TabKey;
  setActiveTab: React.Dispatch<React.SetStateAction<TabKey>>;
}) {
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1.5 rounded-full transition-all ${
        activeTab === tab ? 'bg-black text-white' : 'opacity-60 hover:opacity-100'
      }`}
    >
      {label}
    </button>
  );
}

function SuggestionCard({ suggestion, index }: { suggestion: Suggestion; index: number; key?: any }) {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Declutter':
        return <Trash2 size={16} />;
      case 'Organize':
        return <LayoutGrid size={16} />;
      case 'Style':
        return <Palette size={16} />;
      default:
        return <CheckCircle2 size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Low':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-6 rounded-2xl border border-black/5 bg-white hover:border-black/10 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40">
          {getCategoryIcon(suggestion.category)}
          {suggestion.category}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getPriorityColor(
            suggestion.priority,
          )}`}
        >
          {suggestion.priority} Priority
        </span>
      </div>
      <h4 className="text-lg font-serif italic mb-2 group-hover:translate-x-1 transition-transform">{suggestion.title}</h4>
      <p className="text-sm text-black/60 leading-relaxed">{suggestion.description}</p>
    </motion.div>
  );
}

function OptimizationPlanCard({
  plan,
  index,
  selectedDirection,
}: {
  plan: OptimizationPlan;
  index: number;
  selectedDirection: OptimizationDirection;
}) {
  const isSelectedPlan = plan.direction === selectedDirection;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      className={`p-6 rounded-2xl border transition-all ${
        isSelectedPlan ? 'border-black/20 bg-black/[0.03]' : 'border-black/5 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-base font-semibold flex items-center gap-2">
          <ListChecks size={16} /> {plan.title}
        </h4>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-black/10 bg-white">
          {plan.direction === 'Simple' ? '简洁导向' : '繁复导向'}
        </span>
      </div>
      <p className="text-sm text-black/60 mb-4">{plan.summary}</p>
      <ul className="space-y-2 text-sm text-black/75 list-disc pl-5">
        {plan.actions.map((action, actionIndex) => (
          <li key={actionIndex}>{action}</li>
        ))}
      </ul>
    </motion.div>
  );
}
