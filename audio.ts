import React from 'react';

// This file uses the Web Audio API to generate simple sounds programmatically.
// This avoids the need for external audio files.

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

type SfxType = 'click' | 'win' | 'lose' | 'start' | 'dino-jump' | 'dino-land';

export const playSfx = (type: SfxType) => {
  if (!audioContext || audioContext.state === 'suspended') {
    audioContext.resume();
  }
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);

  switch (type) {
    case 'click':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.15);
      break;
    case 'start':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
      oscillator.frequency.exponentialRampToValueAtTime(523.25, audioContext.currentTime + 0.1); // C5
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2);
      break;
    case 'win':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.linearRampToValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.linearRampToValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
      break;
    case 'lose':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.4);
      break;
    case 'dino-jump':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(700, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);
      break;
    case 'dino-land':
       oscillator.type = 'square';
       gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
       oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
       gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.08);
       break;
  }

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};