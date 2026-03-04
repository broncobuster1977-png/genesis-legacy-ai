// Genesis Legacy AI - Voice Integration System
// Atlas Technical Director - March 4, 2026
// LiveKit Voice Communication for Agent Interaction

class GenesisVoiceSystem {
    constructor() {
        this.room = null;
        this.audioTrack = null;
        this.isConnected = false;
        this.currentAgent = null;
        
        // LiveKit Configuration - Using production LiveKit Cloud
        this.config = {
            url: 'wss://genesis-legacy-ai-demo-livekit.vercel.app',
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
            
            // Generate access token for agent room
            const roomName = `${this.config.roomPrefix}${agentName.toLowerCase()}`;
            const token = await this.generateAccessToken(roomName);
            
            // Initialize LiveKit room connection
            const { Room, RoomEvent, Track } = await import('livekit-client');
            
            this.room = new Room({
                adaptiveStream: true,
                dynacast: true,
            });
            
            // Set up room event listeners
            this.room.on(RoomEvent.Connected, () => {
                console.log(`✅ Connected to ${agentName}'s voice channel`);
                this.isConnected = true;
                this.updateAgentStatus(agentName, 'connected');
                this.showVoiceInterface(agentName);
            });
            
            this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === Track.Kind.Audio) {
                    console.log(`🔊 Receiving audio from ${participant.identity}`);
                    const audioElement = document.createElement('audio');
                    audioElement.autoplay = true;
                    track.attach(audioElement);
                    document.body.appendChild(audioElement);
                }
            });
            
            this.room.on(RoomEvent.Disconnected, () => {
                console.log(`❌ Disconnected from ${agentName}'s voice channel`);
                this.isConnected = false;
                this.updateAgentStatus(agentName, 'active');
                this.hideVoiceInterface();
            });
            
            // Connect to room
            await this.room.connect(token);
            
            // Start audio capture
            await this.startAudioCapture();
            
        } catch (error) {
            console.error('❌ Voice connection failed:', error);
            this.showErrorMessage(`Failed to connect to ${agentName}: ${error.message}`);
        }
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
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: false 
            });
            
            const { LocalAudioTrack } = await import('livekit-client');
            this.audioTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);
            await this.room.localParticipant.publishTrack(this.audioTrack);
            
            console.log('🎤 Audio capture started');
        } catch (error) {
            console.error('❌ Failed to start audio capture:', error);
            this.showErrorMessage('Microphone access denied. Please enable microphone permissions.');
        }
    }
    
    async disconnect() {
        if (this.room && this.isConnected) {
            await this.room.disconnect();
        }
        
        if (this.audioTrack) {
            this.audioTrack.stop();
            this.audioTrack = null;
        }
        
        this.isConnected = false;
        this.currentAgent = null;
        this.hideVoiceInterface();
    }
    
    updateAgentStatus(agentName, status) {
        const terminals = document.querySelectorAll('.agent-terminal');
        terminals.forEach(terminal => {
            const name = terminal.querySelector('.agent-name').textContent;
            if (name === agentName) {
                const statusIndicator = terminal.querySelector('.terminal-status');
                statusIndicator.className = `terminal-status status-${status}`;
                
                if (status === 'connected') {
                    terminal.classList.add('voice-active');
                } else {
                    terminal.classList.remove('voice-active');
                }
            }
        });
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
    
    @keyframes voice-active {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
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
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = voiceCSS;
document.head.appendChild(styleSheet);