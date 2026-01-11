import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Phone, User, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const callers = ['Mom', 'Dad', 'Yamini'];
const delays = [2, 5, 10];
const ringtones = ['Classic iPhone', 'Urgent', 'Vibration Only'];

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedCaller, setSelectedCaller] = useState('Mom');
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [ringtone, setRingtone] = useState('Classic iPhone');
  const [isStarting, setIsStarting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const list = await base44.entities.Settings.list();
      return list[0] || null;
    }
  });

  useEffect(() => {
    if (settings) {
      setSelectedCaller(settings.selectedCaller || 'Mom');
      setDelaySeconds(settings.delaySeconds || 5);
      setRingtone(settings.ringtone || 'Classic iPhone');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.entities.Settings.update(settings.id, data);
      } else {
        return base44.entities.Settings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const handleCallerSelect = (caller) => {
    setSelectedCaller(caller);
    saveMutation.mutate({ selectedCaller: caller, delaySeconds, ringtone });
  };

  const handleDelaySelect = (delay) => {
    setDelaySeconds(delay);
    saveMutation.mutate({ selectedCaller, delaySeconds: delay, ringtone });
  };

  const handleRingtoneSelect = (tone) => {
    setRingtone(tone);
    saveMutation.mutate({ selectedCaller, delaySeconds, ringtone: tone });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await saveMutation.mutateAsync({ 
        selectedCaller, 
        delaySeconds, 
        ringtone, 
        customRingtoneUrl: file_url 
      });
      toast.success('Custom ringtone uploaded!');
    } catch (error) {
      toast.error('Failed to upload ringtone');
    } finally {
      setUploading(false);
    }
  };

  const handleStartCall = async () => {
    setIsStarting(true);
    
    const session = await base44.entities.Session.create({
      startTime: new Date().toISOString(),
      caller: selectedCaller,
      status: 'incoming'
    });

    setTimeout(() => {
      const ringtoneParam = settings?.customRingtoneUrl ? `&ringtoneUrl=${encodeURIComponent(settings.customRingtoneUrl)}` : '';
      navigate(createPageUrl('IncomingCall') + `?sessionId=${session.id}&caller=${selectedCaller}${ringtoneParam}`);
    }, delaySeconds * 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 pb-24 font-[-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          ExitCall
        </h1>

        {/* Who's calling section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Who's calling?
          </p>
          <div className="bg-neutral-900 rounded-2xl overflow-hidden">
            {callers.map((caller, index) => (
              <button
                key={caller}
                onClick={() => handleCallerSelect(caller)}
                className={`w-full flex items-center justify-between px-4 py-4 text-left transition-colors
                  ${index !== callers.length - 1 ? 'border-b border-neutral-800' : ''}
                  ${selectedCaller === caller ? 'bg-neutral-800/30' : 'active:bg-neutral-800'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-[17px] font-normal">{caller}</span>
                </div>
                {selectedCaller === caller ? (
                  <Check className="w-5 h-5 text-blue-500" strokeWidth={3} />
                ) : (
                  <ChevronRight className="w-5 h-5 text-neutral-600" strokeWidth={2} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Call starts in section */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            When should the call happen?
          </p>
          <div className="bg-neutral-900 rounded-2xl overflow-hidden">
            {delays.map((delay, index) => (
              <button
                key={delay}
                onClick={() => handleDelaySelect(delay)}
                className={`w-full flex items-center justify-between px-4 py-4 text-left transition-colors
                  ${index !== delays.length - 1 ? 'border-b border-neutral-800' : ''}
                  ${delaySeconds === delay ? 'bg-neutral-800/30' : 'active:bg-neutral-800'}`}
              >
                <span className="text-[17px] font-normal">{delay} seconds</span>
                {delaySeconds === delay ? (
                  <Check className="w-5 h-5 text-blue-500" strokeWidth={3} />
                ) : (
                  <ChevronRight className="w-5 h-5 text-neutral-600" strokeWidth={2} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Ringtone Upload */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Custom Ringtone
          </p>
          <label className="block">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="bg-neutral-900 rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer active:bg-neutral-800 transition-colors">
              <span className="text-[17px] font-normal">
                {uploading ? 'Uploading...' : settings?.customRingtoneUrl ? 'Change ringtone' : 'Upload ringtone'}
              </span>
              <Upload className="w-5 h-5 text-blue-500" strokeWidth={2} />
            </div>
          </label>
          {settings?.customRingtoneUrl && (
            <p className="text-xs text-green-500 mt-2 ml-1">✓ Custom ringtone uploaded</p>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-sm text-neutral-500 leading-relaxed mb-8">
          ExitCall helps you safely exit uncomfortable situations. When activated, you'll receive a realistic incoming call.
        </p>

        {/* Start button */}
        <motion.button
          onClick={handleStartCall}
          disabled={isStarting}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 rounded-2xl text-[17px] font-semibold transition-all duration-300 shadow-lg
            ${isStarting 
              ? 'bg-neutral-800 text-neutral-500' 
              : 'bg-blue-500 text-white active:bg-blue-600 shadow-blue-500/30'}`}
        >
          {isStarting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse" />
              Starting in {delaySeconds}s...
            </span>
          ) : (
            'Start Emergency Call'
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}