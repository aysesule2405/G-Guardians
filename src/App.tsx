/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  MapPin, 
  Car, 
  Moon, 
  Music, 
  Volume2, 
  Heart,
  Sparkles,
  ChevronRight,
  MessageCircle,
  Headphones,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { assessRisk, getTTSAudio, AssessResponse } from './api';
import { playAudio } from './audio';
import MusicPlayer from './components/MusicPlayer';
import ChatBot from './components/ChatBot';
import SafetyPassage from './components/SafetyPassage';

const SCENARIOS = [
  { id: 'late-night-walk', label: 'Late Night Walk', icon: Moon, color: 'text-earth-moss' },
  { id: 'rideshare', label: 'Rideshare Trip', icon: Car, color: 'text-earth-moss' },
  { id: 'party', label: 'Social Event / Party', icon: Music, color: 'text-earth-moss' },
  { id: 'campus', label: 'Campus Navigation', icon: MapPin, color: 'text-earth-moss' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const [assessment, setAssessment] = useState<AssessResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssess = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await assessRisk(scenario);
      setAssessment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (!assessment?.guardianMessage) return;
    setSpeaking(true);
    setError(null);
    try {
      const audioData = await getTTSAudio(assessment.guardianMessage);
      await playAudio(audioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice failed');
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 font-sans">
      <header className="mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-earth-sage/10 backdrop-blur-sm border border-earth-sage/20 mb-4"
        >
          <Sparkles className="w-4 h-4 text-earth-clay" />
          <span className="text-xs font-bold uppercase tracking-widest text-earth-moss">Ghibli Guardians</span>
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-earth-deep mb-4 tracking-tight">
          Ghibli <span className="text-earth-moss">Guardians</span>
        </h1>
        <p className="text-xl text-earth-moss/70 max-w-xl mx-auto leading-relaxed font-medium">
          Your gentle spirit companion for every journey. Soft guidance, firm protection.
        </p>
      </header>

      {/* Navigation Bar */}
      <nav className="sticky top-4 z-[50] mb-12 px-2">
        <div className="max-w-fit mx-auto glass-card p-1.5 flex items-center gap-1 bg-white/80 backdrop-blur-xl border-earth-sage/20 shadow-lg">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
            { id: 'risk', label: 'Risk', icon: Shield },
            { id: 'safety', label: 'Safety', icon: ShieldAlert },
            { id: 'chat', label: 'Chat', icon: MessageCircle },
            { id: 'music', label: 'Music', icon: Headphones },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                activeTab === tab.id 
                  ? 'text-earth-deep' 
                  : 'text-earth-sage hover:text-earth-moss hover:bg-earth-sage/10'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-earth-cream rounded-2xl shadow-sm border border-earth-sage/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? 'text-earth-moss' : ''}`} />
              <span className="relative z-10 hidden md:block">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Assessment & Spirit */}
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8"
                  >
                    <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2 text-earth-deep">
                      <Shield className="w-6 h-6 text-earth-moss" />
                      Risk Assessment
                    </h2>
                    
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-bold text-earth-sage ml-1 uppercase tracking-widest">Current Situation</span>
                        <select 
                          value={scenario}
                          onChange={(e) => setScenario(e.target.value)}
                          className="mt-1 block w-full glass-button text-left appearance-none cursor-pointer focus:ring-2 focus:ring-earth-sage/30 outline-none"
                        >
                          {SCENARIOS.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </label>

                      <button 
                        onClick={handleAssess}
                        disabled={loading}
                        className="w-full primary-button flex items-center justify-center gap-2 text-lg"
                      >
                        {loading ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Assess Risk <ChevronRight className="w-5 h-5" /></>
                        )}
                      </button>
                      
                      {error && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-rose-500 text-sm font-medium text-center"
                        >
                          {error}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                  >
                    <div className="glass-card p-0 h-full flex flex-col justify-center overflow-hidden">
                      <MusicPlayer />
                    </div>
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  {assessment && (
                    <motion.div 
                      key="assessment-result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-card p-8 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Heart className="w-24 h-24 text-pink-500" />
                      </div>
                      
                      <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-full bg-earth-cream flex items-center justify-center shrink-0 border-4 border-white shadow-inner">
                          <motion.div
                            animate={{ 
                              y: [0, -5, 0],
                              scale: [1, 1.05, 1]
                            }}
                            transition={{ 
                              duration: 4, 
                              repeat: Infinity,
                              ease: "easeInOut" 
                            }}
                          >
                            <Sparkles className="w-10 h-10 text-earth-moss" />
                          </motion.div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-display font-bold text-earth-deep">Spirit Companion</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              assessment.riskLevel === 'Low' ? 'bg-earth-sage/20 text-earth-moss' :
                              assessment.riskLevel === 'Medium' ? 'bg-earth-clay/20 text-earth-clay' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {assessment.riskLevel} Risk
                            </span>
                          </div>
                          
                          <p className="text-earth-moss/80 italic leading-relaxed mb-6 font-medium text-lg">
                            "{assessment.guardianMessage}"
                          </p>
                          
                          <button 
                            onClick={handleSpeak}
                            disabled={speaking}
                            className="glass-button flex items-center gap-2 text-sm py-2"
                          >
                            {speaking ? (
                              <div className="w-4 h-4 border-2 border-earth-moss/30 border-t-earth-moss rounded-full animate-spin" />
                            ) : (
                              <Volume2 className="w-4 h-4 text-earth-moss" />
                            )}
                            Speak Guidance
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-2xl font-display font-bold mb-4 flex items-center gap-2 px-2 text-earth-deep">
                    <MessageCircle className="w-6 h-6 text-earth-moss" />
                    Chat with a Friend
                  </h3>
                  <ChatBot />
                </motion.div>
              </div>

              {/* Right Column: Safety Passage */}
              <div className="space-y-8">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2 px-2 text-earth-deep">
                    <ShieldAlert className="w-6 h-6 text-earth-moss" />
                    Safety Passage
                  </h2>
                  <SafetyPassage />
                </motion.div>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="max-w-3xl mx-auto space-y-8">
              <motion.div className="glass-card p-8">
                <h2 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-emerald-600" />
                  Risk Assessment
                </h2>
                <div className="space-y-6">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-500 ml-1 uppercase tracking-widest">Current Situation</span>
                    <select 
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      className="mt-2 block w-full glass-button text-left appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-300 outline-none text-lg"
                    >
                      {SCENARIOS.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </label>
                  <button 
                    onClick={handleAssess}
                    disabled={loading}
                    className="w-full primary-button flex items-center justify-center gap-3 py-4 text-xl"
                  >
                    {loading ? (
                      <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Assess Risk <ChevronRight className="w-6 h-6" /></>
                    )}
                  </button>
                </div>
              </motion.div>

              {assessment && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-8 relative overflow-hidden"
                >
                  <div className="flex items-start gap-8">
                    <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border-4 border-white shadow-inner">
                      <Sparkles className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-display font-bold">Spirit Companion</h3>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                          assessment.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                          assessment.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {assessment.riskLevel} Risk
                        </span>
                      </div>
                      <p className="text-xl text-slate-600 italic leading-relaxed mb-8">
                        "{assessment.guardianMessage}"
                      </p>
                      <button 
                        onClick={handleSpeak}
                        disabled={speaking}
                        className="glass-button flex items-center gap-3 text-lg py-3"
                      >
                        <Volume2 className="w-6 h-6 text-emerald-600" />
                        Listen to Guidance
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-display font-bold mb-8 flex items-center gap-3 px-2">
                <ShieldAlert className="w-8 h-8 text-emerald-600" />
                Safety Passage
              </h2>
              <SafetyPassage />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-display font-bold mb-8 flex items-center gap-3 px-2">
                <MessageCircle className="w-8 h-8 text-emerald-600" />
                Chat with a Friend
              </h2>
              <ChatBot />
            </div>
          )}

          {activeTab === 'music' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-display font-bold mb-8 flex items-center gap-3 px-2">
                <Headphones className="w-8 h-8 text-emerald-600" />
                Calm Melodies
              </h2>
              <div className="glass-card p-0 overflow-hidden">
                <MusicPlayer />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>


      <footer className="mt-20 text-center text-earth-sage text-sm pb-12">
        <p className="font-medium tracking-wide">© 2026 Ghibli Guardians • Crafted with care for your safety.</p>
      </footer>
    </div>
  );
}
