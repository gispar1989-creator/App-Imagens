/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Clock, 
  Layout, 
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Constants & Types ---

const ENVIRONMENTS = [
  { id: 'modern-living', label: 'Sala Moderna', description: 'Ambiente clean com móveis contemporâneos', prompt: 'a modern minimalist living room background with soft natural light and blurred furniture' },
  { id: 'rustic-kitchen', label: 'Cozinha Rústica', description: 'Madeira quente e iluminação aconchegante', prompt: 'a cozy rustic kitchen background with warm wood textures and soft ambient lighting' },
  { id: 'office-desk', label: 'Escritório Minimalista', description: 'Mesa de trabalho organizada e profissional', prompt: 'a clean, organized minimalist office desk background with professional studio lighting' },
  { id: 'luxury-wall', label: 'Parede de Luxo', description: 'Texturas premium e iluminação de destaque', prompt: 'a luxury textured wall background with dramatic spotlighting and high-end decor' },
  { id: 'garden-patio', label: 'Pátio/Jardim', description: 'Ambiente externo com luz do dia', prompt: 'a beautiful outdoor patio garden background with bright natural sunlight and soft bokeh' },
];

const ENHANCEMENTS = [
  { id: 'lighting', label: 'Melhorar Iluminação', prompt: 'Enhance the lighting to be more professional and dramatic, highlighting the resin textures.' },
  { id: 'sharpness', label: 'Nitidez Extra', prompt: 'Sharpen the details of the resin clock to make it extremely clear and high-definition.' },
  { id: 'color', label: 'Cores Vibrantes', prompt: 'Make the colors of the resin more vibrant, saturated, and translucent where applicable.' },
];

// --- Components ---

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState(ENVIRONMENTS[0].id);
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: false,
  } as any);

  const toggleEnhancement = (id: string) => {
    setSelectedEnhancements(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (mode: 'normal' | 'subtle' | 'random' = 'normal') => {
    if (!image) return;
    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      let targetEnvId = selectedEnv;
      if (mode === 'random') {
        const otherEnvs = ENVIRONMENTS.filter(e => e.id !== selectedEnv);
        const randomEnv = otherEnvs[Math.floor(Math.random() * otherEnvs.length)];
        targetEnvId = randomEnv.id;
        setSelectedEnv(randomEnv.id);
      }

      const env = ENVIRONMENTS.find(e => e.id === targetEnvId);
      const enhancements = ENHANCEMENTS.filter(e => selectedEnhancements.includes(e.id)).map(e => e.prompt).join(' ');

      let variantInstruction = '';
      if (mode === 'subtle') {
        variantInstruction = 'Create a subtle variation of the background. Keep the same color tones and general composition as a professional studio shot, but adjust minor details and lighting placement slightly for a fresh look.';
      }

      const prompt = `
        Create a professional product photography shot. 
        The resin clock from the uploaded image must be the HERO of the image, appearing LARGE and in the FOREGROUND.
        Place the clock in ${env?.prompt}. 
        The clock should occupy a significant portion of the frame, appearing as a close-up shot.
        Keep the resin clock's original shape, colors, and details perfectly intact.
        ${enhancements} ${variantInstruction}
        The background should be slightly out of focus (bokeh effect) to ensure the clock is the absolute primary focus.
      `;

      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/png' } },
            { text: prompt },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResultImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error('Não foi possível gerar a imagem. Tente novamente.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao processar a imagem.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'relogio-resina-estudio.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-900/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col items-center justify-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter bg-gradient-to-b from-white to-amber-200 bg-clip-text text-transparent uppercase">
            Oficina de Relógios Lucrativos
          </h1>
          <img 
            src="https://i.ibb.co/fYWfNNLn/Logotipo-feminino-esmalteria-delicado-rosa-1.png" 
            alt="Logo" 
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Upload Section */}
            <section className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-white/5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400/80 mb-4 flex items-center gap-2">
                <Upload size={14} /> 1. Upload da Foto
              </h2>
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3",
                  isDragActive ? "border-amber-500 bg-amber-500/5" : "border-white/10 hover:border-amber-500/50 hover:bg-white/5",
                  image ? "py-4" : "py-12"
                )}
              >
                <input {...getInputProps()} />
                {image ? (
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-white/10">
                    <img src={image} alt="Original" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-medium">Trocar Imagem</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-500">
                      <ImageIcon size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">Clique ou arraste a foto</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG até 10MB</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Environment Selection */}
            <section className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-white/5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400/80 mb-4 flex items-center gap-2">
                <Layout size={14} /> 2. Escolha o Ambiente
              </h2>
              <div className="space-y-2">
                {ENVIRONMENTS.map((env) => (
                  <button
                    key={env.id}
                    onClick={() => setSelectedEnv(env.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                      selectedEnv === env.id 
                        ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50" 
                        : "border-white/5 hover:border-white/10 hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      selectedEnv === env.id ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-zinc-700"
                    )} />
                    <div>
                      <p className="text-sm font-medium text-gray-200">{env.label}</p>
                      <p className="text-[10px] text-gray-500 leading-tight">{env.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Enhancements */}
            <section className="bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-white/5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400/80 mb-4 flex items-center gap-2">
                <Sparkles size={14} /> 3. Ajustes Extras
              </h2>
              <div className="flex flex-wrap gap-2">
                {ENHANCEMENTS.map((enh) => (
                  <button
                    key={enh.id}
                    onClick={() => toggleEnhancement(enh.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      selectedEnhancements.includes(enh.id)
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-transparent text-gray-400 border-white/10 hover:border-white/20"
                    )}
                  >
                    {enh.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Action Button */}
            <div className="space-y-3">
              <button
                onClick={() => handleGenerate('normal')}
                disabled={!image || isGenerating}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-xl",
                  !image || isGenerating 
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                    : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-[0.98] shadow-amber-900/20"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    <span>{resultImage ? 'Gerar Novamente' : 'Gerar Foto Profissional'}</span>
                  </>
                )}
              </button>

              {resultImage && !isGenerating && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleGenerate('subtle')}
                    className="py-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-300 text-xs font-bold hover:bg-amber-500/10 transition-all flex flex-col items-center gap-1"
                  >
                    <Sparkles size={16} />
                    <span>Variação Sutil</span>
                  </button>
                  <button
                    onClick={() => handleGenerate('random')}
                    className="py-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-blue-300 text-xs font-bold hover:bg-blue-500/10 transition-all flex flex-col items-center gap-1"
                  >
                    <Layout size={16} />
                    <span>Mudar Ambiente</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl flex items-start gap-3 text-red-400">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-8">
            <div className="bg-zinc-900 rounded-3xl p-4 md:p-8 shadow-2xl border border-white/5 min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Resultado <span className="text-xs font-normal text-zinc-500">Visualização em tempo real</span>
                </h2>
                {resultImage && (
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <Download size={16} /> Baixar Imagem
                  </button>
                )}
              </div>

              <div className="flex-1 relative bg-black/40 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center group">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin" />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-200">Criando seu ambiente...</p>
                        <p className="text-xs text-gray-500 mt-1">A IA está ajustando iluminação e texturas</p>
                      </div>
                    </motion.div>
                  ) : resultImage ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full relative"
                    >
                      <img 
                        src={resultImage} 
                        alt="Resultado" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-4 text-zinc-600"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full shadow-inner flex items-center justify-center">
                        <Camera size={32} />
                      </div>
                      <p className="text-sm font-medium">Faça o upload e clique em gerar</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Result Actions Footer */}
              {resultImage && !isGenerating && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex flex-wrap items-center justify-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleGenerate('subtle')}
                      className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 border border-amber-500/20 rounded-xl hover:bg-zinc-700 text-amber-300 transition-all text-sm font-bold shadow-sm"
                    >
                      <Sparkles size={18} />
                      <span>Variação Sutil</span>
                    </button>
                    <button 
                      onClick={() => handleGenerate('random')}
                      className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 border border-blue-500/20 rounded-xl hover:bg-zinc-700 text-blue-300 transition-all text-sm font-bold shadow-sm"
                    >
                      <Layout size={18} />
                      <span>Mudar Ambiente</span>
                    </button>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-white/10 mx-2" />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-500 transition-all text-sm font-bold shadow-lg shadow-amber-900/20"
                    >
                      <Download size={18} />
                      <span>Baixar Foto</span>
                    </button>
                    <button 
                      onClick={() => setResultImage(null)}
                      className="p-2.5 bg-zinc-800 border border-white/10 rounded-xl hover:bg-zinc-700 text-gray-400 transition-all shadow-sm"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Tips/Info */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-amber-900/10 rounded-2xl border border-amber-900/20">
                  <div className="w-8 h-8 bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-400 mb-3">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">Qualidade</h3>
                  <p className="text-[11px] text-amber-200/60 leading-relaxed">Use fotos com boa iluminação inicial para melhores resultados.</p>
                </div>
                <div className="p-4 bg-blue-900/10 rounded-2xl border border-blue-900/20">
                  <div className="w-8 h-8 bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-400 mb-3">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1">IA Avançada</h3>
                  <p className="text-[11px] text-blue-200/60 leading-relaxed">Nossa tecnologia preserva os detalhes únicos da sua resina.</p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 mb-3">
                    <Download size={18} />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">Pronto para Uso</h3>
                  <p className="text-[11px] text-zinc-400/60 leading-relaxed">Imagens otimizadas para Instagram e lojas virtuais.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-white/5 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <img 
              src="https://i.ibb.co/fYWfNNLn/Logotipo-feminino-esmalteria-delicado-rosa-1.png" 
              alt="Logo" 
              className="h-10 w-auto opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all"
              referrerPolicy="no-referrer"
            />
            <span className="text-sm font-medium text-zinc-600">Oficina de Relógios Lucrativos &copy; 2026</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
            <a href="#" className="hover:text-amber-400 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-amber-400 transition-colors">Termos</a>
            <a href="#" className="hover:text-amber-400 transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
