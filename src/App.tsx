import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Sparkles, 
  Trash2, 
  LayoutGrid, 
  Palette, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Camera,
  X
} from 'lucide-react';
import { analyzeRoom, AnalysisResult, Suggestion } from './services/geminiService';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
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
      const analysis = await analyzeRoom(image);
      setResult(analysis);
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-8 md:px-12 flex justify-between items-center border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <h1 className="text-2xl font-serif italic tracking-tight">DeclutterAI</h1>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest opacity-60">
          <a href="#" className="hover:opacity-100 transition-opacity">Process</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Inspiration</a>
          <a href="#" className="hover:opacity-100 transition-opacity">About</a>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Upload & Image */}
          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-light tracking-tighter leading-[0.9]">
                Transform your <br />
                <span className="font-serif italic">living space.</span>
              </h2>
              <p className="text-lg text-black/60 max-w-md leading-relaxed">
                Upload a photo of any room. Our AI will analyze the layout and provide professional decluttering and organization strategies.
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
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleAnalyze}
                className="w-full py-6 bg-black text-white rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-neutral-800 transition-colors shadow-xl shadow-black/10"
              >
                Analyze Room <ArrowRight size={20} />
              </motion.button>
            )}

            {isAnalyzing && (
              <div className="w-full py-12 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="animate-spin text-black/20" size={48} />
                <div className="space-y-1">
                  <p className="font-medium">Analyzing your space...</p>
                  <p className="text-sm text-black/40 italic">Finding the hidden potential in your room</p>
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

          {/* Right Column: Results */}
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
                  {/* Overview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/40">
                      <Sparkles size={14} /> AI Analysis
                    </div>
                    <p className="text-2xl font-light leading-snug text-black/80">
                      {result.overview}
                    </p>
                  </div>

                  {/* Suggestions Grid */}
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

                  {/* Color Palette */}
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
                  <p className="max-w-xs text-sm uppercase tracking-[0.2em]">
                    Your analysis will appear here once you upload a photo.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <footer className="px-6 py-12 md:px-12 border-t border-black/5 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] opacity-30">
          DeclutterAI &copy; 2024 &mdash; Crafted for Clarity
        </p>
      </footer>
    </div>
  );
}

function SuggestionCard({ suggestion, index }: { suggestion: Suggestion; index: number; key?: any }) {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Declutter': return <Trash2 size={16} />;
      case 'Organize': return <LayoutGrid size={16} />;
      case 'Style': return <Palette size={16} />;
      default: return <CheckCircle2 size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-600 border-red-100';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Low': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-neutral-50 text-neutral-600 border-neutral-100';
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
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getPriorityColor(suggestion.priority)}`}>
          {suggestion.priority} Priority
        </span>
      </div>
      <h4 className="text-lg font-serif italic mb-2 group-hover:translate-x-1 transition-transform">{suggestion.title}</h4>
      <p className="text-sm text-black/60 leading-relaxed">
        {suggestion.description}
      </p>
    </motion.div>
  );
}
