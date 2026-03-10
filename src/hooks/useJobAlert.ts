import { useEffect, useRef, useCallback } from "react";

// Classic phone ringtone using Web Audio API
const createRingtone = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = "sine";
  oscillator.frequency.value = 440; // A4 note
  gainNode.gain.value = 0.3;
  
  return { oscillator, gainNode };
};

export const useJobAlert = (hasIncomingJob: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  const playRingPattern = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;
    
    // Ring pattern: two short tones, pause, repeat
    const playTone = (frequency: number, duration: number, startTime: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      
      // Envelope for smoother sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.02);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + startTime + duration - 0.02);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + duration);
      
      oscillator.start(ctx.currentTime + startTime);
      oscillator.stop(ctx.currentTime + startTime + duration);
    };

    // Classic phone ring pattern
    playTone(440, 0.15, 0);      // First beep
    playTone(480, 0.15, 0);      // Dual tone
    playTone(440, 0.15, 0.2);    // Second beep
    playTone(480, 0.15, 0.2);    // Dual tone
  }, []);

  const startRinging = useCallback(() => {
    if (isPlayingRef.current) return;
    
    isPlayingRef.current = true;
    
    // Play immediately
    playRingPattern();
    
    // Then repeat every 1.5 seconds
    intervalRef.current = setInterval(() => {
      if (isPlayingRef.current) {
        playRingPattern();
      }
    }, 1500);
  }, [playRingPattern]);

  const stopRinging = useCallback(() => {
    isPlayingRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      oscillatorRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (hasIncomingJob) {
      startRinging();
    } else {
      stopRinging();
    }

    return () => {
      stopRinging();
    };
  }, [hasIncomingJob, startRinging, stopRinging]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRinging();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [stopRinging]);

  return { stopRinging };
};
