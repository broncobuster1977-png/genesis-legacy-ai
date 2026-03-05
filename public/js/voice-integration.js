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
    
    // Conversation modes
    this.conversationMode = 'DIRECT'; // DIRECT, MEETING, BRIEFING
    this.silenceTimer = null;
    this.speechEndBuffer = 800; // 800ms silence before processing
    this.isBuffering = false;
    this.bufferedTranscript = '';

    console.log(`🎤 Genesis Voice System initializing...`);
    console.log(`🌉 Bridge URL: ${this.bridgeUrl}`);
    console.log(`🗣️ Mode: ${this.conversationMode}`);

    this.setupSpeechRecognition();
    this.checkBridgeConnection();
    this.createModeSelector();
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
    this.recognition.continuous = true; // Continuous listening with silence buffer
    this.recognition.interimResults = true; // Need interim results for silence detection
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Handle speech with 800ms silence buffer
      if (finalTranscript.trim()) {
        this.bufferedTranscript = finalTranscript.trim();
        this.startSilenceBuffer();
        console.log(`🎤 Speech buffered: "${this.bufferedTranscript}"`);
      } else if (interimTranscript.trim()) {
        // Reset silence buffer on active speech
        this.clearSilenceBuffer();
        this.showStatusMessage(`🎤 Listening: "${interimTranscript}..."`, 'info');
      }
    };

    this.recognition.onerror = (error) => {
      console.error('Speech error:', error.error);
      if (error.error !== 'no-speech') {
        this.showStatusMessage(`⚠️ Mic error: ${error.error}`, 'warning');
      }
      this.clearSilenceBuffer();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.clearSilenceBuffer();
      // Auto-restart based on conversation mode
      if (this.conversationMode === 'DIRECT' && !this.isSpeaking) {
        setTimeout(() => {
          if (this.currentAgent && !this.isSpeaking) {
            this.startListening(this.currentAgent);
          }
        }, 500);
      }
      this.updateAgentUI();
    };

    this.recognition.onspeechstart = () => {
      this.clearSilenceBuffer();
      this.showStatusMessage(`🎤 Listening...`, 'info');
    };

    this.recognition.onspeechend = () => {
      // Speech ended, start silence buffer
      this.startSilenceBuffer();
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

  // Silence buffer management
  startSilenceBuffer() {
    this.clearSilenceBuffer();
    this.isBuffering = true;
    this.silenceTimer = setTimeout(() => {
      if (this.bufferedTranscript && this.isBuffering) {
        console.log(`🔄 Processing after ${this.speechEndBuffer}ms silence: "${this.bufferedTranscript}"`);
        this.handleUserSpeech(this.bufferedTranscript);
        this.bufferedTranscript = '';
        this.isBuffering = false;
      }
    }, this.speechEndBuffer);
  }

  clearSilenceBuffer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.isBuffering = false;
  }

  async handleUserSpeech(transcript) {
    if (!this.currentAgent) return;

    // Handle different conversation modes
    switch (this.conversationMode) {
      case 'MEETING':
        const detectedAgent = this.detectAgentInSpeech(transcript);
        if (!detectedAgent) {
          this.showStatusMessage('📢 Say agent name first (e.g. "JARVIS, what\'s the status?")', 'warning');
          return;
        }
        this.currentAgent = detectedAgent;
        // Remove agent name from transcript
        transcript = transcript.replace(new RegExp(`^${detectedAgent}[,:]?\\s*`, 'i'), '').trim();
        break;
        
      case 'BRIEFING':
        // In briefing mode, only process if not currently speaking
        if (this.isSpeaking) {
          console.log('🎙️ Agent is briefing, ignoring user speech');
          return;
        }
        break;
        
      case 'DIRECT':
      default:
        // Stop agent if user interrupts
        if (this.isSpeaking) {
          console.log('🛑 User interrupted agent speech');
          this.stopSpeaking();
        }
        break;
    }

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

  // Detect agent name at start of speech for MEETING mode
  detectAgentInSpeech(transcript) {
    const agentNames = ['JARVIS', 'ATLAS', 'DEMI', 'SEAN', 'VIC', 'SCOUT'];
    const words = transcript.trim().split(' ');
    const firstWord = words[0]?.toUpperCase();
    
    return agentNames.find(name => name === firstWord) || null;
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
        
        // Re-enable listening based on conversation mode
        if (this.conversationMode === 'DIRECT') {
          // Auto reopen mic after agent finishes
          setTimeout(() => {
            if (this.currentAgent === agentName) {
              this.startListening(agentName);
            }
          }, 500);
        } else if (this.conversationMode === 'BRIEFING') {
          // Manual button press required - don't auto reopen
          this.showStatusMessage(`🎤 Press agent to respond`, 'info');
        } else if (this.conversationMode === 'MEETING') {
          // Reopen for next agent command
          setTimeout(() => {
            if (this.currentAgent === agentName) {
              this.startListening(agentName);
            }
          }, 500);
        }
        
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

  // Create conversation mode selector UI
  createModeSelector() {
    const selectorHTML = `
      <div id="voice-mode-selector" style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.9));
        border: 2px solid rgba(16, 185, 129, 0.6);
        border-radius: 12px;
        padding: 12px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        z-index: 3000;
        color: white;
        font-family: 'Orbitron', monospace;
        font-size: 12px;
        min-width: 140px;
      ">
        <div style="font-weight: 600; margin-bottom: 8px; color: #10b981;">
          🎙️ Voice Mode
        </div>
        <select id="conversation-mode" style="
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(16, 185, 129, 0.5);
          border-radius: 6px;
          color: white;
          padding: 6px 8px;
          width: 100%;
          font-size: 11px;
          font-family: inherit;
        ">
          <option value="DIRECT">DIRECT (1-on-1)</option>
          <option value="MEETING">MEETING (Multi-agent)</option>
          <option value="BRIEFING">BRIEFING (Uninterrupted)</option>
        </select>
        <div id="mode-description" style="
          font-size: 9px;
          opacity: 0.7;
          margin-top: 6px;
          line-height: 1.3;
        ">
          800ms silence buffer, auto mic reopen
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', selectorHTML);

    const modeSelect = document.getElementById('conversation-mode');
    const modeDescription = document.getElementById('mode-description');

    const modeDescriptions = {
      'DIRECT': '800ms silence buffer, auto mic reopen',
      'MEETING': 'Say agent name first, multi-agent',
      'BRIEFING': 'Agent speaks uninterrupted'
    };

    modeSelect.value = this.conversationMode;
    modeDescription.textContent = modeDescriptions[this.conversationMode];

    modeSelect.addEventListener('change', (e) => {
      this.conversationMode = e.target.value;
      modeDescription.textContent = modeDescriptions[this.conversationMode];
      console.log(`🎙️ Voice mode changed to: ${this.conversationMode}`);
      
      // Update status message
      this.showStatusMessage(`🎙️ Mode: ${this.conversationMode}`, 'info');
      
      // If currently listening, restart with new mode behavior
      if (this.isListening && this.currentAgent) {
        this.stopListening();
        setTimeout(() => {
          this.startListening(this.currentAgent);
        }, 200);
      }
    });
  }

  // Set conversation mode programmatically
  setConversationMode(mode) {
    const validModes = ['DIRECT', 'MEETING', 'BRIEFING'];
    if (validModes.includes(mode)) {
      this.conversationMode = mode;
      const selector = document.getElementById('conversation-mode');
      if (selector) {
        selector.value = mode;
        const descriptions = {
          'DIRECT': '800ms silence buffer, auto mic reopen',
          'MEETING': 'Say agent name first, multi-agent', 
          'BRIEFING': 'Agent speaks uninterrupted'
        };
        const descEl = document.getElementById('mode-description');
        if (descEl) descEl.textContent = descriptions[mode];
      }
      console.log(`🎙️ Voice mode set to: ${mode}`);
    }
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
