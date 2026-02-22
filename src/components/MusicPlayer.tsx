import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music as MusicIcon, Volume2, ListMusic, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMusicTracks, Track } from '../api';

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getMusicTracks()
      .then(setTracks)
      .finally(() => setLoading(false));
  }, []);

  const currentTrack = tracks[currentTrackIndex];

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrackIndex]);

  if (loading) return (
    <div className="p-8 text-center">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="inline-block"
      >
        <MusicIcon className="w-8 h-8 text-earth-sage" />
      </motion.div>
      <p className="text-xs font-bold text-earth-sage mt-2 uppercase tracking-widest">Gathering Melodies...</p>
    </div>
  );

  return (
    <div className="glass-card p-6 flex flex-col gap-6 relative overflow-hidden bg-white/60 backdrop-blur-md border border-earth-sage/20">
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-earth-sage/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          <h2 className="text-xs font-bold text-earth-moss uppercase tracking-[0.2em] mb-1">Calm Melodies</h2>
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 bg-earth-cream/50 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm overflow-hidden relative group">
              <motion.div
                animate={isPlaying ? { rotate: 360 } : {}}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="relative z-10"
              >
                <MusicIcon className="w-8 h-8 text-earth-moss" />
              </motion.div>
              <div className="absolute inset-0 bg-earth-moss/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-earth-deep truncate text-lg leading-tight">{currentTrack?.title}</h3>
              <p className="text-xs font-medium text-earth-moss/60 truncate italic">{currentTrack?.movie}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowPlaylist(!showPlaylist)}
          className={`p-2 rounded-xl transition-all self-end mb-1 ${showPlaylist ? 'bg-earth-sage/20 text-earth-moss' : 'text-earth-sage hover:bg-white/50'}`}
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onEnded={nextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-center gap-8">
          <button 
            onClick={prevTrack} 
            className="text-earth-sage hover:text-earth-moss transition-all active:scale-90"
          >
            <SkipBack className="w-7 h-7" />
          </button>
          
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-earth-moss text-earth-cream rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-earth-moss/20 hover:bg-earth-deep transition-all active:scale-95 group"
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div key="pause" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  <Pause className="w-8 h-8" />
                </motion.div>
              ) : (
                <motion.div key="play" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                  <Play className="w-8 h-8 ml-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          
          <button 
            onClick={nextTrack} 
            className="text-earth-sage hover:text-earth-moss transition-all active:scale-90"
          >
            <SkipForward className="w-7 h-7" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-earth-sage font-bold uppercase tracking-tighter">
          <Volume2 className="w-4 h-4 shrink-0" />
          <div className="flex-1 h-1.5 bg-earth-sage/20 rounded-full overflow-hidden border border-white/20">
            <motion.div 
              className="h-full bg-earth-sage shadow-[0_0_10px_rgba(163,177,138,0.5)]" 
              animate={{ width: isPlaying ? '100%' : '30%' }}
              transition={{ duration: 2 }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/20 pt-4"
          >
            <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {tracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(index);
                    setIsPlaying(true);
                  }}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all group ${
                    currentTrackIndex === index 
                      ? 'bg-earth-sage/20 text-earth-moss shadow-sm' 
                      : 'hover:bg-white/40 text-earth-moss/60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{track.title}</p>
                    <p className="text-[10px] opacity-60 truncate">{track.movie}</p>
                  </div>
                  {currentTrackIndex === index && isPlaying ? (
                    <div className="flex gap-0.5 items-end h-3">
                      <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-earth-sage rounded-full" />
                      <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 bg-earth-sage rounded-full" />
                      <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1 bg-earth-sage rounded-full" />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-earth-cream/50 rounded-xl border border-earth-sage/20">
              <p className="text-[10px] text-earth-moss/60 font-medium leading-tight">
                <span className="font-bold text-earth-moss">Note:</span> Place your Ghibli .mp3 files in <code className="bg-white px-1 rounded">/public/music/</code> to listen to them here.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
