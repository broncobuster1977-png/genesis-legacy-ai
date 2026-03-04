// Genesis Legacy AI - Voice Integration System
// Atlas Technical Director - March 4, 2026
// LiveKit Voice Communication for Agent Interaction

class GenesisVoiceSystem {
    constructor() {
        this.room = null;
        this.audioTrack = null;
        this.isConnected = false;
        this.currentAgent = null;
        
        // LiveKit Configuration - Using LiveKit Cloud Demo
        this.config = {
            url: 'wss://atlas-demo-livekit.livekit.cloud',
            apiKey: 'lk_atlas_c0f4baaa4dcb95547cb5318a6fdb60f4',
            roomPrefix: 'genesis-voice-'
        };
        
        this.agents = {
            'JARVIS': { role: 'Command Protocol', voice: 'professional-male-1' },
            'ATLAS': { role: 'Tech Infrastructure', voice: 'technical-male-1' },
            'DEMI': { role: 'Design Matrix', voice: 'creative-female-1' },
            'SCOUT': { role: 'Intelligence Hub', voice: 'analyst-female-1' },
            'VIC': { role: 'Financial Systems', voice: 'advisor-male-1' },
            'SEAN': { role: 'Legal Framework', voice: 'authoritative-male-1' },
            'PHOENIX': { role: 'Recovery Systems', voice: 'system-alert-1' }
        };
        
        this.initializeVoiceSystem();
    }
    
    async initializeVoiceSystem() {
        console.log('🚀 Initializing Genesis Voice System...');
        
        // Check if LiveKit SDK is loaded
        if (typeof LiveKitJS === 'undefined') {
            console.error('❌ LiveKit SDK not loaded. Retrying in 2 seconds...');
            setTimeout(() => this.initializeVoiceSystem(), 2000);
            return;
        }
        
        console.log('✅ LiveKit SDK loaded successfully');
        
        // Add click handlers to agent terminals
        document.querySelectorAll('.agent-terminal').forEach(terminal => {
            terminal.addEventListener('click', (e) => {
                const agentName = terminal.querySelector('.agent-name').textContent;
                this.connectToAgent(agentName);
            });
        });
        
        // Add voice controls
        this.createVoiceControls();
        
        console.log('✅ Genesis Voice System Initialized');
    }
    
    async connectToAgent(agentName) {
        console.log(`🔗 Connecting to agent: ${agentName}`);
        
        try {
            // Disconnect from current agent if connected
            if (this.isConnected) {
                await this.disconnect();
            }
            
            this.currentAgent = agentName;
            
            // Demo Mode: Show UI working without real connection
            console.log(`📞 Initiating voice connection to ${agentName}...`);
            this.updateAgentStatus(agentName, 'connecting');
            
            // Show connecting state for 2 seconds, then success
            setTimeout(() => {
                console.log(`✅ Voice channel established with ${agentName}`);
                this.isConnected = true;
                this.updateAgentStatus(agentName, 'connected');
                this.showVoiceInterface(agentName);
                
                // Simulate agent response after 3 seconds
                setTimeout(() => {
                    this.simulateAgentResponse(agentName);
                }, 3000);
            }, 2000);
            
            // Request microphone permission (real)
            await this.requestMicrophonePermission();
            
        } catch (error) {
            console.error('❌ Voice connection failed:', error);
            this.showErrorMessage(`Failed to connect to ${agentName}: ${error.message}`);
        }
    }
    
    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: false 
            });
            console.log('🎤 Microphone access granted');
            // Stop the test stream
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.error('❌ Microphone access denied:', error);
            this.showErrorMessage('Microphone access denied. Please enable microphone permissions.');
        }
    }
    
    simulateAgentResponse(agentName) {
        const responses = {
            'JARVIS': 'Strategic command online. Fleet coordination systems ready for your directives.',
            'ATLAS': 'Technical infrastructure operational. All systems green. How may I assist with your technical requirements?',
            'DEMI': 'Design matrix active. Creative workflows initialized. Ready for visual collaboration.',
            'SCOUT': 'Intelligence networks engaged. Data streams flowing. What research can I provide?',
            'VIC': 'Financial systems synchronized. Tax and entity protocols ready for analysis.',
            'SEAN': 'Legal framework activated. Contract and compliance systems standing by.',
            'PHOENIX': 'System monitoring active. All agents healthy. Recovery protocols ready.'
        };
        
        const message = responses[agentName] || `${agentName} voice system activated and ready for communication.`;
        
        // Show response in console and UI
        console.log(`🤖 ${agentName}: ${message}`);
        this.showAgentMessage(agentName, message);
    }
    
    async generateAccessToken(roomName) {
        // For demo purposes, using a simple token generation
        // In production, this should be done server-side
        const tokenPayload = {
            room: roomName,
            identity: 'user-' + Date.now(),
            ttl: 3600 // 1 hour
        };
        
        // This is a mock token - in production, call your token endpoint
        return btoa(JSON.stringify(tokenPayload));
    }
    
    async startAudioCapture() {
        // Demo mode - just log that we would start audio
        console.log('🎤 Audio capture would start here (demo mode)');
        return true;
    }
    
    async disconnect() {
        console.log('🔌 Disconnecting from voice session...');
        
        if (this.currentAgent) {
            this.updateAgentStatus(this.currentAgent, 'active');
        }
        
        this.isConnected = false;
        this.currentAgent = null;
        this.hideVoiceInterface();
        
        console.log('✅ Voice session ended');
    }
    
    updateAgentStatus(agentName, status) {
        const terminals = document.querySelectorAll('.agent-terminal');
        terminals.forEach(terminal => {
            const name = terminal.querySelector('.agent-name').textContent;
            if (name === agentName) {
                const statusIndicator = terminal.querySelector('.terminal-status');
                statusIndicator.className = `terminal-status status-${status}`;
                
                if (status === 'connected' || status === 'connecting') {
                    terminal.classList.add('voice-active');
                } else {
                    terminal.classList.remove('voice-active');
                }
            }
        });
    }
    
    showAgentMessage(agentName, message) {
        // Create temporary message overlay
        const messageHTML = `
            <div class="agent-message-popup">
                <div class="message-content">
                    <div class="message-header">
                        <span class="agent-name">${agentName}</span>
                        <button class="close-btn" onclick="this.closest('.agent-message-popup').remove()">×</button>
                    </div>
                    <div class="message-text">${message}</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', messageHTML);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            const popup = document.querySelector('.agent-message-popup');
            if (popup) popup.remove();
        }, 8000);
    }
    
    createVoiceControls() {
        const controlsHTML = `
            <div id="voice-controls" class="voice-controls hidden">
                <div class="voice-header">
                    <span id="voice-agent-name">Voice Connection</span>
                    <button id="voice-disconnect" class="disconnect-btn">Disconnect</button>
                </div>
                <div class="voice-status">
                    <div class="audio-visualizer">
                        <div class="audio-bar"></div>
                        <div class="audio-bar"></div>
                        <div class="audio-bar"></div>
                        <div class="audio-bar"></div>
                    </div>
                    <span id="voice-status-text">Connected</span>
                </div>
                <div class="voice-actions">
                    <button id="mute-btn" class="voice-btn">🎤 Mute</button>
                    <button id="speaker-btn" class="voice-btn">🔊 Speaker</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', controlsHTML);
        
        // Add event listeners
        document.getElementById('voice-disconnect').addEventListener('click', () => {
            this.disconnect();
        });
        
        document.getElementById('mute-btn').addEventListener('click', () => {
            this.toggleMute();
        });
    }
    
    showVoiceInterface(agentName) {
        const controls = document.getElementById('voice-controls');
        const agentNameEl = document.getElementById('voice-agent-name');
        
        agentNameEl.textContent = `Connected to ${agentName}`;
        controls.classList.remove('hidden');
        
        // Start audio visualization
        this.startAudioVisualization();
    }
    
    hideVoiceInterface() {
        const controls = document.getElementById('voice-controls');
        controls.classList.add('hidden');
        this.stopAudioVisualization();
    }
    
    startAudioVisualization() {
        const bars = document.querySelectorAll('.audio-bar');
        this.audioVisualizationInterval = setInterval(() => {
            bars.forEach(bar => {
                bar.style.height = Math.random() * 100 + '%';
            });
        }, 100);
    }
    
    stopAudioVisualization() {
        if (this.audioVisualizationInterval) {
            clearInterval(this.audioVisualizationInterval);
        }
    }
    
    toggleMute() {
        if (this.audioTrack) {
            this.audioTrack.muted = !this.audioTrack.muted;
            const muteBtn = document.getElementById('mute-btn');
            muteBtn.textContent = this.audioTrack.muted ? '🔇 Unmute' : '🎤 Mute';
        }
    }
    
    showErrorMessage(message) {
        const errorHTML = `
            <div class="error-popup">
                <div class="error-content">
                    <h3>Voice Connection Error</h3>
                    <p>${message}</p>
                    <button onclick="this.closest('.error-popup').remove()">OK</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const popup = document.querySelector('.error-popup');
            if (popup) popup.remove();
        }, 5000);
    }
}

// Initialize voice system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.genesisVoice = new GenesisVoiceSystem();
});

// Add CSS for voice controls
const voiceCSS = `
    .voice-controls {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.9));
        border: 2px solid rgba(16, 185, 129, 0.6);
        border-radius: 15px;
        padding: 20px;
        min-width: 300px;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        z-index: 1000;
    }
    
    .voice-controls.hidden {
        display: none;
    }
    
    .voice-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        font-weight: 600;
        color: #10b981;
    }
    
    .disconnect-btn {
        background: #ef4444;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .voice-status {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        gap: 15px;
    }
    
    .audio-visualizer {
        display: flex;
        gap: 3px;
        align-items: end;
    }
    
    .audio-bar {
        width: 4px;
        background: #10b981;
        height: 20px;
        border-radius: 2px;
        transition: height 0.1s ease;
    }
    
    .voice-actions {
        display: flex;
        gap: 10px;
    }
    
    .voice-btn {
        flex: 1;
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.5);
        color: white;
        padding: 10px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .voice-btn:hover {
        background: rgba(59, 130, 246, 0.4);
        border-color: rgba(59, 130, 246, 0.8);
    }
    
    .agent-terminal.voice-active {
        border-color: #10b981 !important;
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.6) !important;
        animation: voice-pulse 1.5s infinite;
    }
    
    @keyframes voice-pulse {
        0%, 100% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.6); }
        50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.8); }
    }
    
    .status-connected {
        background: #10b981;
        animation: voice-active 1s infinite;
    }
    
    .status-connecting {
        background: #f59e0b;
        animation: connecting-pulse 0.8s infinite;
    }
    
    @keyframes voice-active {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    
    @keyframes connecting-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
    }
    
    .error-popup {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }
    
    .error-content {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.9));
        border: 2px solid rgba(239, 68, 68, 0.6);
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        max-width: 400px;
        color: white;
    }
    
    .error-content h3 {
        color: #ef4444;
        margin-bottom: 15px;
    }
    
    .error-content button {
        background: #ef4444;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 15px;
    }
    
    .agent-message-popup {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(59, 130, 246, 0.9));
        border: 2px solid rgba(16, 185, 129, 0.8);
        border-radius: 15px;
        min-width: 350px;
        max-width: 500px;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .message-content {
        padding: 20px;
        color: white;
    }
    
    .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        font-weight: 700;
        font-size: 18px;
    }
    
    .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s ease;
    }
    
    .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .message-text {
        font-size: 16px;
        line-height: 1.5;
        font-weight: 400;
    }
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = voiceCSS;
document.head.appendChild(styleSheet);