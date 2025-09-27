
// This file uses the Web Audio API to generate simple sounds programmatically.
// This avoids the need for external audio files.

let audioContext: AudioContext | null = null;

const initializeAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
    }
  }
  return audioContext;
};


type SfxType = 'click' | 'win' | 'lose' | 'start' | 'dino-jump' | 'dino-land' | 'snake-eat' | 'collision' | 'tile-merge';

// A helper to ensure the audio context is running, as browsers may suspend it.
const getAudioContext = () => {
  const ctx = initializeAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}


export const playSfx = (type: SfxType) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const now = ctx.currentTime;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);

  switch (type) {
    case 'click':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(880, now);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.1);
      break;
      
    case 'start':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(261.63, now); // C4
      oscillator.frequency.exponentialRampToValueAtTime(523.25, now + 0.1); // C5
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.2);
      break;
      
    case 'win':
      oscillator.type = 'triangle';
      gainNode.gain.setValueAtTime(0.1, now);
      oscillator.frequency.setValueAtTime(523.25, now + 0.0); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
      oscillator.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);
      break;
      
    case 'lose':
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.15, now);
      oscillator.frequency.setValueAtTime(220, now);
      oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);
      break;
      
    case 'dino-jump':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(500, now);
      oscillator.frequency.linearRampToValueAtTime(700, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.1);
      break;
      
    case 'dino-land':
       oscillator.type = 'square';
       gainNode.gain.setValueAtTime(0.05, now);
       oscillator.frequency.setValueAtTime(150, now);
       gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.08);
       break;
       
    case 'snake-eat':
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, now);
      oscillator.frequency.setValueAtTime(900, now);
      oscillator.frequency.exponentialRampToValueAtTime(450, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.1);
      break;
      
    case 'collision':
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.2, now);
      oscillator.frequency.setValueAtTime(110, now); // A2
      oscillator.frequency.exponentialRampToValueAtTime(55, now + 0.15); // A1
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.2);
      break;
      
    case 'tile-merge':
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.02);
      oscillator.frequency.setValueAtTime(440.00, now); // A4
      oscillator.frequency.linearRampToValueAtTime(523.25, now + 0.1); // C5
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);
      break;
  }

  oscillator.start(now);
  oscillator.stop(now + 1);
};
