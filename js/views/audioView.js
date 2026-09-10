/* ==========================================
   SERAJ AL-AHSA - MVC AUDIO VIEW LAYER
   ========================================== */

window.App = window.App || {};

App.AudioView = class {
  constructor() {
    this.audioCtx = null;
    this.soundNodes = {
      wind: null,
      water: null,
      chimes: null,
      hologramHum: null,
      masterGain: null,
    };
    this.isAudioPlaying = false;
    this.melodyTimer = null;
  }

  // Set up Audio Context and Synthesizer Nodes
  setupAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    
    // Master Gain
    this.soundNodes.masterGain = this.audioCtx.createGain();
    this.soundNodes.masterGain.gain.setValueAtTime(0.3, this.audioCtx.currentTime); // Low global volume
    this.soundNodes.masterGain.connect(this.audioCtx.destination);
    
    // 1. Water flowing node
    this.soundNodes.water = this.createWaterNode();
    if (this.soundNodes.water) {
      this.soundNodes.water.gainNode.connect(this.soundNodes.masterGain);
    }

    // 2. Wind blowing node
    this.soundNodes.wind = this.createWindNode();
    if (this.soundNodes.wind) {
      this.soundNodes.wind.gainNode.connect(this.soundNodes.masterGain);
    }

    // 3. Hologram synth hum
    this.soundNodes.hologramHum = this.createHoloHumNode();
    if (this.soundNodes.hologramHum) {
      this.soundNodes.hologramHum.gainNode.connect(this.soundNodes.masterGain);
    }
  }

  // Toggle active play state
  toggleAudioEngine() {
    if (!this.audioCtx) {
      this.setupAudioContext();
    }

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    this.isAudioPlaying = !this.isAudioPlaying;

    if (this.isAudioPlaying) {
      this.soundNodes.masterGain.gain.linearRampToValueAtTime(0.4, this.audioCtx.currentTime + 0.3);
    } else {
      this.soundNodes.masterGain.gain.linearRampToValueAtTime(0.0, this.audioCtx.currentTime + 0.3);
    }
    
    return this.isAudioPlaying;
  }

  // Helper to synthesize white noise buffer
  createNoiseBuffer() {
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  // Build Water Synthesizer Nodes
  createWaterNode() {
    try {
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;
      
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);
      filter.Q.setValueAtTime(1.5, this.audioCtx.currentTime);
      
      const gainNode = this.audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
      
      noise.connect(filter);
      filter.connect(gainNode);
      noise.start();
      
      // Modulate water amplitude randomly using LFO
      const lfo = this.audioCtx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.3, this.audioCtx.currentTime); // 0.3Hz
      
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain); // Modulate water flow volume
      lfo.start();
      
      return { noise, filter, gainNode, lfo };
    } catch (err) {
      console.error("Water synth failed", err);
      return null;
    }
  }

  // Build Wind Synthesizer Nodes
  createWindNode() {
    try {
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      noise.loop = true;
      
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, this.audioCtx.currentTime);
      
      const gainNode = this.audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
      
      noise.connect(filter);
      filter.connect(gainNode);
      noise.start();
      
      // Modulate wind cutoff filter randomly to sound like howling wind
      const lfo = this.audioCtx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.08, this.audioCtx.currentTime); // Very slow
      
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(150, this.audioCtx.currentTime); // modulate up to 150hz
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      
      return { noise, filter, gainNode, lfo };
    } catch (err) {
      console.error("Wind synth failed", err);
      return null;
    }
  }

  // Build sci-fi hologram hum synthesizer (Station 3)
  createHoloHumNode() {
    try {
      const osc = this.audioCtx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(95, this.audioCtx.currentTime); // Low hum
      
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, this.audioCtx.currentTime);
      
      const gainNode = this.audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
      
      osc.connect(filter);
      filter.connect(gainNode);
      osc.start();
      
      return { osc, filter, gainNode };
    } catch (err) {
      console.error("Hum synth failed", err);
      return null;
    }
  }

  // Adjust Synth parameters based on currently selected station and slider parameters
  adjustSoundParams(currentStation, appState) {
    if (!this.audioCtx || !this.isAudioPlaying) return;
    
    // Fade everything down first
    const t = this.audioCtx.currentTime;
    this.soundNodes.water.gainNode.gain.linearRampToValueAtTime(0.01, t + 0.4);
    this.soundNodes.wind.gainNode.gain.linearRampToValueAtTime(0.01, t + 0.4);
    this.soundNodes.hologramHum.gainNode.gain.linearRampToValueAtTime(0.005, t + 0.4);

    // Activate specific synths depending on station
    if (currentStation === 1) {
      // Water curtain flowing volume
      const vol = (appState.water_flow / 100) * 0.35;
      this.soundNodes.water.gainNode.gain.linearRampToValueAtTime(vol, t + 0.3);
      this.soundNodes.water.filter.frequency.linearRampToValueAtTime(500, t + 0.3);
    } 
    else if (currentStation === 2) {
      // Slow wind / Trade routes breeze
      const vol = (appState.scent_flow / 100) * 0.15;
      this.soundNodes.wind.gainNode.gain.linearRampToValueAtTime(vol, t + 0.3);
      this.soundNodes.wind.filter.frequency.linearRampToValueAtTime(250, t + 0.3);
    }
    else if (currentStation === 3) {
      // Holographic hum active
      const vol = (appState.holo_speed / 100) * 0.25;
      this.soundNodes.hologramHum.gainNode.gain.linearRampToValueAtTime(vol, t + 0.3);
      
      // Adjust cutoff based on isolation slider
      const cut = 120 + (appState.audio_isolation * 4);
      this.soundNodes.hologramHum.filter.frequency.linearRampToValueAtTime(cut, t + 0.3);
    }
    else if (currentStation === 4) {
      // Soft wind for nature ambience
      this.soundNodes.wind.gainNode.gain.linearRampToValueAtTime(0.08, t + 0.3);
      this.soundNodes.wind.filter.frequency.linearRampToValueAtTime(320, t + 0.3);
    }
    else if (currentStation === 5) {
      // Water chimes and flowing streams depending on density
      const density = appState.visitor_density;
      const waterVol = 0.1 + (density / 100) * 0.3;
      this.soundNodes.water.gainNode.gain.linearRampToValueAtTime(waterVol, t + 0.3);
      
      // Higher density = water flows faster (higher filter frequency)
      this.soundNodes.water.filter.frequency.linearRampToValueAtTime(450 + density * 3, t + 0.3);
      
      // Schedule a random melody note periodically
      this.triggerGenerativeMelody(appState.visitor_density);
    }
    else if (currentStation === 6) {
      // Powerful 4D wind howling
      const windSpeed = appState.wind_speed;
      const windVol = (windSpeed / 100) * 0.45;
      this.soundNodes.wind.gainNode.gain.linearRampToValueAtTime(windVol, t + 0.3);
      this.soundNodes.wind.filter.frequency.linearRampToValueAtTime(250 + windSpeed * 4, t + 0.3);
    }
  }

  // Generate Hijaz Arabian Pentatonic notes dynamically based on Oasis density
  triggerGenerativeMelody(density) {
    if (this.melodyTimer) clearTimeout(this.melodyTimer);
    
    if (!this.isAudioPlaying) return;
    
    // Pentatonic scale of Hijaz (Frequencies)
    const hijazNotes = [
      440.00,  // A4
      466.16,  // Bb4
      554.37,  // C#5
      587.33,  // D5
      659.25,  // E5
      698.46,  // F5
      830.61   // G#5
    ];
    
    // Pick a random frequency
    const randomFreq = hijazNotes[Math.floor(Math.random() * hijazNotes.length)];
    this.playChime(randomFreq);

    // Schedule next note based on density (more visitors = faster melody interaction)
    const delay = Math.max(1200, 4500 - (density * 35));
    this.melodyTimer = setTimeout(() => {
      this.triggerGenerativeMelody(density);
    }, delay);
  }

  // Play custom synth chime note (Aflaj musical notes)
  playChime(freq) {
    if (!this.audioCtx || !this.isAudioPlaying) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      // Envelope attack/decay
      gainNode.gain.linearRampToValueAtTime(0.08, this.audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.8);
      
      osc.connect(gainNode);
      gainNode.connect(this.soundNodes.masterGain);
      
      osc.start();
      osc.stop(this.audioCtx.currentTime + 1.9);
    } catch (err) {
      console.error("Chime play error", err);
    }
  }

  stopMelody() {
    if (this.melodyTimer) clearTimeout(this.melodyTimer);
  }
};
