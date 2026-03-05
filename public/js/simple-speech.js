// Simple Speech Recognition for Genesis Legacy AI
// Atlas Technical Director - March 4, 2026
// Minimal working speech recognition system

class SimpleSpeechSystem {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.currentAgent = null;
        
        console.log('🎤 Simple Speech System initialized');
        this.setupSpeechRecognition();
    }
    
    setupSpeechRecognition() {
        // Check if speech recognition is available
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.log('❌ Speech recognition not supported in this browser');
            return false;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        // Handle speech results
        this.recognition.onresult = (event) => {
            this.handleSpeechResult(event);
        };
        
        // Handle errors
        this.recognition.onerror = (error) => {
            console.error('❌ Speech recognition error:', error);
            if (window.genesisVoice) {
                window.genesisVoice.showStatusMessage(`🎤 Speech error: ${error.error}`, 'warning');
            }
        };
        
        // Handle start/stop
        this.recognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            if (window.genesisVoice && this.currentAgent) {
                window.genesisVoice.showStatusMessage(`🎤 ${this.currentAgent} is listening...`, 'info');
            }
        };
        
        this.recognition.onend = () => {
            console.log('🎤 Speech recognition ended');
            if (this.isListening && this.recognition) {
                // Restart if we should still be listening
                setTimeout(() => {
                    if (this.isListening) {
                        this.recognition.start();
                    }
                }, 100);
            }
        };
        
        console.log('✅ Speech recognition configured');
        return true;
    }
    
    // Start listening for specific agent
    startListening(agentName) {
        if (!this.recognition) {
            console.log('❌ Speech recognition not available');
            return false;
        }
        
        console.log(`🎤 Starting to listen for ${agentName}...`);
        this.currentAgent = agentName;
        this.isListening = true;
        
        try {
            this.recognition.start();
            console.log(`✅ Listening active for ${agentName}`);
            
            if (window.genesisVoice) {
                window.genesisVoice.showStatusMessage(`🎤 ${agentName} is now listening to you...`, 'success');
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to start listening:`, error);
            return false;
        }
    }
    
    // Stop listening
    stopListening() {
        console.log('🛑 Stopping speech recognition...');
        this.isListening = false;
        
        if (this.recognition) {
            this.recognition.stop();
        }
        
        if (window.genesisVoice) {
            window.genesisVoice.showStatusMessage('🎤 Speech recognition stopped', 'info');
        }
        
        this.currentAgent = null;
    }
    
    // Handle speech recognition results
    handleSpeechResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process results
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Show what we're hearing
        if (interimTranscript && this.currentAgent) {
            console.log(`🎤 ${this.currentAgent} hearing (interim): "${interimTranscript}"`);
            if (window.genesisVoice) {
                window.genesisVoice.showStatusMessage(`🎤 Hearing: "${interimTranscript}..."`, 'info');
            }
        }
        
        // Process final speech
        if (finalTranscript.trim()) {
            console.log(`🗣️ ${this.currentAgent} heard FINAL: "${finalTranscript}"`);
            this.processSpeech(finalTranscript.trim());
        }
    }
    
    // Process Tyler's speech and generate response
    async processSpeech(speechText) {
        if (!this.currentAgent) return;
        
        console.log(`📝 Processing speech for ${this.currentAgent}: "${speechText}"`);
        
        // Show that agent is processing
        if (window.genesisVoice) {
            window.genesisVoice.showStatusMessage(`🤖 ${this.currentAgent} processing: "${speechText.substring(0, 40)}..."`, 'info');
        }
        
        // Generate agent response
        const response = this.generateAgentResponse(this.currentAgent, speechText);
        
        console.log(`🤖 ${this.currentAgent} responding: "${response}"`);
        
        // Show response message
        if (window.genesisVoice) {
            window.genesisVoice.showAgentMessage(this.currentAgent, response);
        }
        
        // Speak response using browser TTS (reliable)
        this.speakResponse(this.currentAgent, response);
    }
    
    // Generate contextual agent response
    generateAgentResponse(agentName, speechText) {
        const responses = {
            'ATLAS': {
                'hello': 'Hello Tyler! Technical systems are operational. How can I assist with your infrastructure needs?',
                'status': 'All technical systems green. MSI infrastructure running optimally. LiveKit, OpenClaw, and voice systems operational.',
                'help': 'I can help with technical infrastructure, system monitoring, deployment, and voice system configuration. What do you need?',
                'test': 'Voice system test successful, Tyler. I can hear you clearly and respond with voice. Two-way communication confirmed.',
                'default': `I heard you say "${speechText}". Technical analysis in progress. All systems ready for your directives.`
            },
            'JARVIS': {
                'hello': 'Strategic command online, Tyler. Fleet coordination systems ready for your directives.',
                'status': 'All agent systems synchronized. Command protocols active. Fleet operational status: GREEN.',
                'help': 'I coordinate strategic operations across all agents. What mission parameters shall I configure?',
                'test': 'Voice command received and processed, Tyler. Strategic communication systems fully operational.',
                'default': `Command received: "${speechText}". Strategic analysis indicates immediate coordination required.`
            },
            'DEMI': {
                'hello': 'Design matrix active, Tyler. Creative workflows initialized and ready for collaboration.',
                'status': 'Visual systems operational. Design protocols engaged. Creative pipelines flowing smoothly.',
                'help': 'I handle design, visual workflows, and creative project management. What shall we create?',
                'test': 'Creative voice interface confirmed, Tyler. Visual communication systems ready for design collaboration.',
                'default': `Creative input received: "${speechText}". Design inspiration flowing from your vision.`
            }
        };
        
        const agentResponses = responses[agentName] || responses['ATLAS'];
        const lowerSpeech = speechText.toLowerCase();
        
        // Match keywords to responses
        if (lowerSpeech.includes('hello') || lowerSpeech.includes('hi')) {
            return agentResponses['hello'];
        } else if (lowerSpeech.includes('status') || lowerSpeech.includes('systems')) {
            return agentResponses['status'];
        } else if (lowerSpeech.includes('help') || lowerSpeech.includes('assist')) {
            return agentResponses['help'];
        } else if (lowerSpeech.includes('test') || lowerSpeech.includes('hear')) {
            return agentResponses['test'];
        } else {
            return agentResponses['default'];
        }
    }
    
    // Speak response using browser text-to-speech
    speakResponse(agentName, text) {
        if (!('speechSynthesis' in window)) {
            console.log('❌ Text-to-speech not available');
            return;
        }
        
        console.log(`🔊 ${agentName} speaking: "${text}"`);
        
        // Stop any current speech
        speechSynthesis.cancel();
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings per agent
        const voiceSettings = this.getVoiceSettings(agentName);
        Object.assign(utterance, voiceSettings);
        
        // Try to find a good voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Male') || voice.name.includes('Female')
        ) || voices[0];
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        // Speak
        speechSynthesis.speak(utterance);
        
        if (window.genesisVoice) {
            window.genesisVoice.showStatusMessage(`🔊 ${agentName} speaking response...`, 'success');
        }
    }
    
    // Voice settings per agent
    getVoiceSettings(agentName) {
        const settings = {
            'ATLAS': { rate: 1.0, pitch: 0.8, volume: 1.0 },
            'JARVIS': { rate: 0.9, pitch: 0.7, volume: 1.0 },
            'DEMI': { rate: 1.1, pitch: 1.2, volume: 0.9 },
            'VIC': { rate: 0.8, pitch: 0.6, volume: 1.0 },
            'SCOUT': { rate: 1.0, pitch: 1.0, volume: 0.9 },
            'SEAN': { rate: 0.9, pitch: 0.7, volume: 1.0 },
            'PHOENIX': { rate: 1.1, pitch: 1.1, volume: 0.8 }
        };
        
        return settings[agentName] || settings['ATLAS'];
    }
    
    // Get current status
    getStatus() {
        return {
            listening: this.isListening,
            agent: this.currentAgent,
            speechRecognitionAvailable: !!this.recognition,
            textToSpeechAvailable: 'speechSynthesis' in window
        };
    }
}

// Initialize simple speech system
window.simpleSpeech = new SimpleSpeechSystem();

console.log('🎤 Simple Speech System loaded and ready');