/**
 * Genesis Legacy AI - Real Voice Integration
 * Replaces mock simulation with real OpenClaw agent bridge
 * 
 * Drop this file into: public/js/voice-integration.js
 * Requires: voice-bridge-server.js running on MSI port 3001
 */

class GenesisVoiceSystem {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.currentAgent = null;
    this.isSpeaking = false;
    this.bridgeUrl = this.detectBridgeUrl();
    this.speechQueue = [];
    this.currentUtterance = null;

    console.log(`🎤 Genesis Voice System initializing...`);
    console.log(`🌉 Bridge URL: ${this.bridgeUrl}`);

    this.setupSpeechRecognition();
    this.checkBridgeConnection();
  }

  // Auto-detect bridge server location
  detectBridgeUrl() {
    // If running locally, use localhost
    // If on Vercel, use MSI's Tailscale IP or DigitalOcean
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // Production: use MSI Tailscale address or configure via env
    return window.GENESIS_BRIDGE_URL || 'http://100.118.154.45:3001'; // MSI Tailscale IP
  }

  async checkBridgeConnection() {
    try {
      const res = await fetch(`${this.bridgeUrl}/health`, { 
        signal: AbortSignal.timeout(3000) 
      });
      const data = await res.json();
      console.log('✅ Voice bridge connected:', data);
      this.showStatusMessage('🟢 Agent bridge connected', 'success');
    } catch (err) {
      console.warn('⚠️ Voice bridge offline - using fallback mode:', err.message);
      this.showStatusMessage('⚠️ Bridge offline - limited mode', 'warning');
    }
  }

  setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('❌ Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false; // Single utterance - prevents looping
    this.recognition.interimResults = false; // Only final results
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript && transcript.length > 0) {
        console.log(`🎤 Heard: "${transcript}"`);
        this.handleUserSpeech(transcript);
      }
    };

    this.recognition.onerror = (error) => {
      console.error('Speech error:', error.error);
      if (error.error !== 'no-speech') {
        this.showStatusMessage(`⚠️ Mic error: ${error.error}`, 'warning');
      }
      this.isListening = false;
      this.updateAgentUI();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Don't auto-restart - wait for agent to finish responding
      this.updateAgentUI();
    };

    this.recognition.onspeechstart = () => {
      this.showStatusMessage(`🎤 Listening...`, 'info');
    };
  }

  async startListening(agentName) {
    if (this.isSpeaking) {
      // Stop current speech before switching
      this.stopSpeaking();
      return;
    }

    if (this.isListening && this.currentAgent === agentName) {
      this.stopListening();
      return;
    }

    this.currentAgent = agentName;
    this.isListening = true;

    try {
      if (this.recognition) {
        this.recognition.stop(); // Stop any existing session
        setTimeout(() => {
          this.recognition.start();
          this.showStatusMessage(`🎤 Speak to ${agentName}...`, 'info');
        }, 100);
      }
    } catch (err) {
      console.error('Recognition start error:', err);
      this.isListening = false;
    }

    this.updateAgentUI();
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.updateAgentUI();
  }

  stopSpeaking() {
    this.isSpeaking = false;
    window.speechSynthesis.cancel();
    if (this.currentUtterance) {
      this.currentUtterance = null;
    }
    this.updateAgentUI();
  }

  async handleUserSpeech(transcript) {
    if (!this.currentAgent) return;

    this.showStatusMessage(`💭 ${this.currentAgent} thinking...`, 'info');
    this.setAgentWorking(this.currentAgent, true);

    try {
      const response = await this.queryAgent(this.currentAgent, transcript);
      await this.speakResponse(this.currentAgent, response);
    } catch (err) {
      console.error('Query failed:', err);
      this.showStatusMessage(`❌ Connection error`, 'error');
      await this.speakFallback(this.currentAgent);
    } finally {
      this.setAgentWorking(this.currentAgent, false);
    }
  }

  async queryAgent(agentName, message) {
    try {
      const res = await fetch(`${this.bridgeUrl}/api/agent/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName, message }),
        signal: AbortSignal.timeout(35000)
      });

      if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
      
      const data = await res.json();
      return data.response;
    } catch (err) {
      console.error('Bridge query failed:', err);
      throw err;
    }
  }

  async speakResponse(agentName, text) {
    this.isSpeaking = true;
    this.showStatusMessage(`🔊 ${agentName} responding...`, 'info');

    // Clean the text for speech
    const cleanText = text
      .replace(/#{1,6}\s/g, '')     // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1')   // Remove italic
      .replace(/`(.*?)`/g, '$1')    // Remove code
      .replace(/\n+/g, '. ')        // Replace newlines with pauses
      .replace(/[✅❌⚠️🎯🔴🟢🟡]/g, '') // Remove emoji
      .trim();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;

      // Set unique voice per agent
      this.setAgentVoice(agentName, utterance);

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.updateAgentUI();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.showStatusMessage(`✅ ${agentName} ready`, 'success');
        this.updateAgentUI();
        // Re-enable listening after agent finishes speaking
        setTimeout(() => {
          if (this.currentAgent === agentName) {
            this.startListening(agentName);
          }
        }, 500);
        resolve();
      };

      utterance.onerror = (err) => {
        console.error('Speech synthesis error:', err);
        this.isSpeaking = false;
        resolve();
      };

      window.speechSynthesis.cancel(); // Clear queue
      window.speechSynthesis.speak(utterance);
    });
  }

  // Assign distinct voice characteristics per agent using browser voices
  setAgentVoice(agentName, utterance) {
    const voices = window.speechSynthesis.getVoices();
    
    const voiceProfiles = {
      'JARVIS': { rate: 0.9, pitch: 0.8, volume: 1.0 },   // Deep, authoritative
      'ATLAS':  { rate: 1.0, pitch: 0.9, volume: 0.95 },  // Precise, technical
      'DEMI':   { rate: 1.1, pitch: 1.2, volume: 1.0 },   // Energetic, higher
      'SEAN':   { rate: 0.85, pitch: 0.85, volume: 0.9 }, // Measured, deliberate
      'VIC':    { rate: 1.0, pitch: 1.0, volume: 0.95 },  // Neutral, analytical
      'SCOUT':  { rate: 1.15, pitch: 1.1, volume: 1.0 }   // Quick, sharp
    };

    const profile = voiceProfiles[agentName.toUpperCase()] || 
                    { rate: 1.0, pitch: 1.0, volume: 1.0 };

    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = profile.volume;

    // Try to assign gender-appropriate voices
    if (voices.length > 0) {
      const femaleAgents = ['DEMI'];
      const isFemale = femaleAgents.includes(agentName.toUpperCase());
      
      const matchingVoices = voices.filter(v => {
        const name = v.name.toLowerCase();
        if (isFemale) return name.includes('female') || name.includes('samantha') || name.includes('victoria');
        return name.includes('male') || name.includes('daniel') || name.includes('alex');
      });

      if (matchingVoices.length > 0) {
        // Pick different voice per agent by index
        const agentIndex = Object.keys({ JARVIS:0, ATLAS:1, DEMI:2, SEAN:3, VIC:4, SCOUT:5 })
          .indexOf(agentName.toUpperCase());
        utterance.voice = matchingVoices[agentIndex % matchingVoices.length];
      }
    }
  }

  async speakFallback(agentName) {
    const fallbacks = {
      'JARVIS': 'Strategic Command online. Bridge connection interrupted. Reconnecting.',
      'ATLAS': 'Technical Director here. Experiencing connectivity issues. Standing by.',
      'DEMI': 'Creative Director online. Having trouble reaching the server right now.',
      'SEAN': 'Sean Archer. Unable to reach the bridge server at this time.',
      'VIC': 'Vic here. Connection to the agent bridge is down. Please check the server.',
      'SCOUT': 'Scout Delgado. Bridge offline. Running in limited mode.'
    };
    
    const text = fallbacks[agentName.toUpperCase()] || 'Agent unavailable. Please check the bridge server.';
    await this.speakResponse(agentName, text);
  }

  updateAgentUI() {
    // Update agent cards based on state
    document.querySelectorAll('.agent-terminal').forEach(el => {
      const name = el.dataset.agent?.toUpperCase();
      if (name === this.currentAgent?.toUpperCase()) {
        el.classList.toggle('active', this.isListening || this.isSpeaking);
        el.classList.toggle('working', this.isSpeaking);
      } else {
        el.classList.remove('active', 'working');
      }
    });
  }

  setAgentWorking(agentName, working) {
    const card = document.querySelector(`[data-agent="${agentName}"]`);
    if (card) {
      card.classList.toggle('working', working);
    }
  }

  showStatusMessage(message, type = 'info') {
    // Update status bar if exists
    const statusEl = document.getElementById('voice-status') || 
                     document.querySelector('.voice-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `voice-status ${type}`;
    }
    console.log(`[Voice] ${message}`);
  }
}

// Initialize on page load
window.addEventListener('load', () => {
  window.genesisVoice = new GenesisVoiceSystem();
  
  // Wire up agent cards - add data-agent attributes and click handlers
  document.querySelectorAll('.agent-terminal').forEach(card => {
    const nameEl = card.querySelector('.agent-name');
    if (nameEl) {
      const agentName = nameEl.textContent.trim().split(' ')[0].toUpperCase();
      card.dataset.agent = agentName;
      
      card.addEventListener('click', () => {
        window.genesisVoice.startListening(agentName);
      });
    }
  });

  console.log('✅ Genesis Voice System ready - click any agent to speak');
});
