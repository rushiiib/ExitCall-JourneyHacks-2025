import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Phone, PhoneOff, Clock, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function IncomingCall() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');
  const caller = urlParams.get('caller') || 'Unknown';
  const ringtoneUrl = urlParams.get('ringtoneUrl');
  
  const [isPulsing, setIsPulsing] = useState(true);
  const [audio] = useState(() => {
    const audioElement = new Audio(ringtoneUrl || 'https://www.soundjay.com/phone/sounds/telephone-ring-01a.mp3');
    audioElement.loop = true;
    audioElement.volume = 0.5;
    return audioElement;
  });

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setIsPulsing(prev => !prev);
    }, 1000);
    return () => clearInterval(pulseInterval);
  }, []);

  useEffect(() => {
    audio.play().catch(err => console.log('Audio play failed:', err));
    
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  const handleAccept = async () => {
    audio.pause();
    if (sessionId) {
      await base44.entities.Session.update(sessionId, { status: 'active' });
    }
    navigate(createPageUrl('InCall') + `?sessionId=${sessionId}&caller=${caller}`);
  };

  const handleDecline = async () => {
    audio.pause();
    if (sessionId) {
      await base44.entities.Session.update(sessionId, { 
        status: 'ended',
        endedTime: new Date().toISOString()
      });
    }
    navigate(createPageUrl('Home'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-between py-20 px-8 font-[-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center flex-1 justify-center"
      >
        {/* Incoming call indicator */}
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-neutral-400 text-sm mb-12"
        >
          Incoming call…
        </motion.p>

        {/* Avatar */}
        <motion.div
          animate={{ 
            scale: isPulsing ? 1 : 1.02,
            opacity: isPulsing ? 0.9 : 1
          }}
          transition={{ duration: 0.5 }}
          className="w-32 h-32 rounded-full bg-slate-600 flex items-center justify-center mb-10"
        >
          <span className="text-6xl font-light text-white">
            {caller.charAt(0).toUpperCase()}
          </span>
        </motion.div>

        {/* Caller name */}
        <h1 className="text-5xl font-light tracking-tight mb-3">
          {caller}
        </h1>
        
        <p className="text-lg text-neutral-400 mb-12">
          mobile
        </p>

        {/* Quick actions */}
        <div className="flex items-center gap-12 mb-8">
          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-neutral-400">Remind Me</span>
          </button>
          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-neutral-400">Message</span>
          </button>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex items-center justify-center gap-24"
      >
        {/* Decline button */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={handleDecline}
            whileTap={{ scale: 0.9 }}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl"
          >
            <PhoneOff className="w-7 h-7 text-white" strokeWidth={1.5} />
          </motion.button>
          <span className="text-sm text-white font-normal">Decline</span>
        </div>

        {/* Accept button */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={handleAccept}
            whileTap={{ scale: 0.9 }}
            className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-2xl"
          >
            <Phone className="w-7 h-7 text-white" strokeWidth={1.5} />
          </motion.button>
          <span className="text-sm text-white font-normal">Accept</span>
        </div>
      </motion.div>
    </div>
  );
}