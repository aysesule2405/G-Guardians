import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, User, Sparkles, ChevronDown, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendChatMessage, ChatMessage, getElevenLabsTTS } from '../api';
import { playAudio } from '../audio';

const CHARACTERS = [
  { 
    id: 'totoro', 
    name: 'Totoro', 
    color: 'bg-[#e2e8f0]', 
    text: 'text-[#475569]', 
    image: '/assets/totoro.png',
    bgImage: 'https://picsum.photos/seed/ghibli-forest/800/600?blur=2',
    voiceId: 'pNInz6obpg8nEmeWscDJ',
    isSilent: true,
    soundUrl: 'https://www.myinstants.com/media/sounds/totoro-growl.mp3'
  },
  { 
    id: 'noface', 
    name: 'No-Face', 
    color: 'bg-[#1e293b]', 
    text: 'text-[#f1f5f9]', 
    image: '/assets/noface.png',
    bgImage: 'https://picsum.photos/seed/ghibli-bathhouse/800/600?blur=2',
    voiceId: 'onwK4e9ZLuTAKqWW03F9',
    isSilent: true,
    soundUrl: 'https://www.myinstants.com/media/sounds/no-face-ah.mp3'
  },
  { 
    id: 'eboshi', 
    name: 'Eboshi', 
    color: 'bg-[#450a0a]', 
    text: 'text-[#fef2f2]', 
    image: '/assets/eboshi.png',
    bgImage: 'https://picsum.photos/seed/ghibli-irontown/800/600?blur=2',
    voiceId: 'MF3mGyEYCl7XYW7Jscj5',
    isSilent: false
  },
  { 
    id: 'howl', 
    name: 'Howl&Sophie', 
    color: 'bg-[#fffbeb]', 
    text: 'text-[#92400e]', 
    image: '/assets/howl.png',
    bgImage: 'https://picsum.photos/seed/ghibli-meadow/800/600?blur=2',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    isSilent: false
  },
  { 
    id: 'chihiro', 
    name: 'Chihiro&Haku', 
    color: 'bg-[#ecfdf5]', 
    text: 'text-[#065f46]', 
    image: '/assets/chihiro.png',
    bgImage: 'https://picsum.photos/seed/ghibli-spirit/800/600?blur=2',
    voiceId: 'AZnzlk1XhkDvOVfIUCvO',
    isSilent: false
  }
];

export default function ChatBot() {
  const [selectedChar, setSelectedChar] = useState(CHARACTERS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`chat_history_${CHARACTERS[0].id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`chat_history_${selectedChar.id}`);
    setMessages(saved ? JSON.parse(saved) : []);
  }, [selectedChar]);

  useEffect(() => {
    localStorage.setItem(`chat_history_${selectedChar.id}`, JSON.stringify(messages));
  }, [messages, selectedChar]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(selectedChar.id, input, messages);
      const botMsg: ChatMessage = { role: 'bot', text: response };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, I'm having trouble connecting right now. *gentle sigh*" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeak = async (text: string, index: number) => {
    setSpeakingId(index);
    try {
      if (selectedChar.isSilent && selectedChar.soundUrl) {
        const audio = new Audio(selectedChar.soundUrl);
        await audio.play();
      } else {
        const audioBlob = await getElevenLabsTTS(text, selectedChar.voiceId);
        await playAudio(audioBlob);
      }
    } catch (err) {
      console.error("Voice playback failed:", err);
      alert("Playback failed. Check your configuration.");
    } finally {
      setSpeakingId(null);
    }
  };

  return (
    <div className="glass-card flex flex-col h-[600px] overflow-hidden relative">
      {/* Thematic Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedChar.bgImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${selectedChar.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </AnimatePresence>

      {/* Header */}
      <div className="p-4 border-b border-white/20 bg-white/40 backdrop-blur-md flex items-center justify-between relative z-20">
        <button 
          onClick={() => setShowSelector(!showSelector)}
          className="flex items-center gap-3 hover:bg-white/40 p-2 rounded-2xl transition-all active:scale-95 group"
        >
          <div className={`w-14 h-14 ${selectedChar.color} rounded-full overflow-hidden shadow-inner border-2 border-white/50`}>
            <img 
              src={selectedChar.image} 
              alt={selectedChar.name} 
              className="w-full h-full object-cover transform scale-110"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <h3 className="font-display font-bold text-earth-deep leading-tight">{selectedChar.name}</h3>
              <ChevronDown className={`w-4 h-4 text-earth-sage transition-transform ${showSelector ? 'rotate-180' : ''}`} />
            </div>
            <p className="text-[10px] text-earth-moss/60 uppercase tracking-widest font-bold">Spirit Companion</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-earth-sage rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-earth-sage uppercase tracking-tighter">Connected</span>
        </div>
        
        <AnimatePresence>
          {showSelector && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSelector(false)}
                className="fixed inset-0 z-10"
              />
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-4 top-20 w-64 glass-card p-3 z-20 shadow-2xl border border-white/60 bg-white/80 backdrop-blur-xl"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Choose your companion</p>
                <div className="grid gap-2">
                  {CHARACTERS.map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setSelectedChar(char);
                        setShowSelector(false);
                        setMessages([]);
                      }}
                      className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95 ${
                        selectedChar.id === char.id ? 'bg-earth-sage/10 ring-1 ring-earth-sage/30 shadow-sm' : 'hover:bg-earth-sage/5'
                      }`}
                    >
                      <div className={`w-10 h-10 ${char.color} rounded-full overflow-hidden shadow-sm border border-white/50`}>
                        <img 
                          src={char.image} 
                          alt={char.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-sm font-bold text-earth-deep">{char.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth relative z-10"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
            <Sparkles className="w-12 h-12 mb-4 text-earth-sage animate-pulse" />
            <p className="text-sm font-medium text-earth-moss">Say hello to {selectedChar.name}. They are here to listen and comfort you.</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end gap-3'}`}
          >
            {msg.role === 'bot' && (
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className={`w-10 h-10 ${selectedChar.color} rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md`}
              >
                <img 
                  src={selectedChar.image} 
                  alt={selectedChar.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            )}
            <div className={`max-w-[75%] p-4 rounded-[2rem] text-sm leading-relaxed shadow-sm relative group transition-all duration-300 ${
              msg.role === 'user' 
                ? 'bg-earth-moss text-earth-cream rounded-tr-none backdrop-blur-sm' 
                : `${selectedChar.color}/90 ${selectedChar.text} rounded-bl-none backdrop-blur-sm border border-white/30`
            }`}>
              {msg.text}
              
              {msg.role === 'bot' && (
                <button
                  onClick={() => handleSpeak(msg.text, i)}
                  disabled={speakingId !== null}
                  className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-earth-sage hover:text-earth-moss hover:bg-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 shadow-sm"
                >
                  {speakingId === i ? (
                    <div className="w-4 h-4 border-2 border-earth-moss/30 border-t-earth-moss rounded-full animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start items-end gap-3">
            <div className={`w-10 h-10 ${selectedChar.color} rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md opacity-50`}>
              <img src={selectedChar.image} alt={selectedChar.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className={`${selectedChar.color}/80 p-4 rounded-[2rem] rounded-bl-none flex gap-1.5 backdrop-blur-sm border border-white/30`}>
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-current rounded-full opacity-60" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-current rounded-full opacity-60" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-current rounded-full opacity-60" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white/40 backdrop-blur-md border-t border-white/20 relative z-20">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${selectedChar.name}...`}
            className="flex-1 bg-white/80 backdrop-blur-sm border border-earth-sage/30 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-earth-sage/30 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 bg-earth-moss text-earth-cream rounded-2xl flex items-center justify-center hover:bg-earth-deep transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-earth-moss/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
