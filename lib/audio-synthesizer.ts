'use client';

class ResonantEngine {
  private audioCtx: AudioContext | null = null;
  private carrierOsc: OscillatorNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  init() {
    if (this.audioCtx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.audioCtx = new AudioContextClass();
  }

  start110HzCarrier(volume = 0.15) {
    try {
      this.init();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Stop previous if running
      this.stop110HzCarrier();

      // Create a 110 Hz oscillator (grounding resonant frequency)
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, this.audioCtx.currentTime);

      // Low pass filter to make it a deep, non-harsh, safe hum
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, this.audioCtx.currentTime);

      // Gain node for smooth fade-in
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, this.audioCtx.currentTime + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();

      this.carrierOsc = osc;
      this.filterNode = filter;
      this.gainNode = gain;
    } catch (e) {
      console.error("Web Audio Init failed:", e);
    }
  }

  stop110HzCarrier() {
    try {
      if (this.gainNode && this.audioCtx) {
        const curTime = this.audioCtx.currentTime;
        this.gainNode.gain.cancelScheduledValues(curTime);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, curTime);
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, curTime + 0.8);
      }
      setTimeout(() => {
        if (this.carrierOsc) {
          this.carrierOsc.stop();
          this.carrierOsc.disconnect();
          this.carrierOsc = null;
        }
        if (this.filterNode) {
          this.filterNode.disconnect();
          this.filterNode = null;
        }
        if (this.gainNode) {
          this.gainNode.disconnect();
          this.gainNode = null;
        }
      }, 900);
    } catch (e) {
      console.warn("Error stopping audio:", e);
    }
  }

  speakWithHum(text: string, voiceAlias: string, onEnd?: () => void) {
    if (typeof window === 'undefined') return;

    // Stop current speech
    window.speechSynthesis.cancel();
    this.start110HzCarrier(0.2);

    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance;

    // Try to find a lower, more resonant voice or one matching gender/accent
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google US English'));
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en'));
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Adjust rate and pitch to be slower/deeper ("wounded/rasp" somatic style)
    utterance.rate = 0.85;
    utterance.pitch = 0.8;

    utterance.onend = () => {
      this.stop110HzCarrier();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.stop110HzCarrier();
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  stopAll() {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    this.stop110HzCarrier();
  }
}

export const resonantEngine = new ResonantEngine();
