import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { PhoneOff, Mic, Grid3X3, Volume2, Plus, Video, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InCall() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');
  const caller = urlParams.get('caller') || 'Unknown';
  
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    if (sessionId) {
      await base44.entities.Session.update(sessionId, { 
        status: 'ended',
        endedTime: new Date().toISOString()
      });
    }
    navigate(createPageUrl('Home'));
  };

  const controls = [
    { icon: Mic, label: 'mute', active: muted, onPress: () => setMuted(!muted) },
    { icon: Grid3X3, label: 'keypad', active: false, onPress: () => {} },
    { icon: Volume2, label: 'speaker', active: speaker, onPress: () => setSpeaker(!speaker) },
    { icon: Plus, label: 'add call', active: false, onPress: () => {} },
    { icon: Video, label: 'FaceTime', active: false, onPress: () => {} },
    { icon: UserPlus, label: 'contacts', active: false, onPress: () => {} },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-8 font-[-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center w-full flex-1"
      >
        {/* Avatar */}
        <div className="w-32 h-32 rounded-full bg-slate-600 flex items-center justify-center mb-6 mt-8">
          <span className="text-6xl font-light text-white">
            {caller.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Caller name */}
        <h1 className="text-3xl font-light tracking-tight mb-2">
          {caller}
        </h1>
        
        {/* Call timer */}
        <motion.p
          key={seconds}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="text-base text-neutral-400 mb-16 font-normal"
        >
          {formatTime(seconds)}
        </motion.p>

        {/* Controls - 2 rows of 3 */}
        <div className="grid grid-cols-3 gap-x-16 gap-y-8 mt-auto mb-12">
          {controls.map(({ icon: Icon, label, active, onPress }) => (
            <motion.button
              key={label}
              onClick={onPress}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-3"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors
                ${active ? 'bg-white' : 'bg-neutral-800'}`}
              >
                <Icon className={`w-6 h-6 ${active ? 'text-black' : 'text-white'}`} strokeWidth={1.5} />
              </div>
              <span className="text-xs text-neutral-400 font-normal whitespace-nowrap">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* End call button */}
        <motion.button
          onClick={handleEndCall}
          whileTap={{ scale: 0.9 }}
          className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl mb-12"
        >
          <PhoneOff className="w-7 h-7 text-white" strokeWidth={1.5} />
        </motion.button>
      </motion.div>
    </div>
  );
}