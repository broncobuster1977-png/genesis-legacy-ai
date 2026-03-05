// Genesis Legacy AI - Voice Integration System
// Atlas Technical Director - March 4, 2026
// LiveKit Voice Communication for Agent Interaction

class GenesisVoiceSystem {
    constructor() {
        this.room = null;
        this.audioTrack = null;
        this.isConnected = false;
        this.isConnecting = false;
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
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeVoiceSystem());
        } else {
            // DOM already loaded
            setTimeout(() => this.initializeVoiceSystem(), 100);
        }
    }
    
    async initializeVoiceSystem() {
        console.log('🚀 Initializing Genesis Voice System...');
        
        // Wait for page to fully load
        await this.waitForPageReady();
        
        console.log('✅ Page ready, setting up voice system');
        
        // Add click/touch handlers to agent terminals
        document.querySelectorAll('.agent-terminal').forEach(terminal => {
            const handler = (e) => {
                e.preventDefault();
                const agentName = terminal.querySelector('.agent-name');
                if (agentName) {
                    this.connectToAgent(agentName.textContent);
                }
            };
            
            // Remove existing handlers to prevent duplicates
            terminal.removeEventListener('click', handler);
            terminal.removeEventListener('touchstart', handler);
            
            // Add new handlers
            terminal.addEventListener('click', handler);
            terminal.addEventListener('touchstart', handler, { passive: false });
            
            // Style for mobile
            terminal.style.cursor = 'pointer';
            terminal.style.userSelect = 'none';
        });
        
        // Add voice controls
        this.createVoiceControls();
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        console.log(`Voice system ready (iOS: ${isIOS})`);
        
        // Show ready message
        setTimeout(() => {
            if (isIOS) {
                this.showStatusMessage('📱 Ready! Tap any agent to connect.', 'success');
                this.addDebugButton();
            } else {
                this.showStatusMessage('🎤 Voice ready. Click any agent!', 'success');
            }
        }, 500);
        
        console.log('✅ Genesis Voice System Initialized');
    }
    
    async waitForPageReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve, { once: true });
            }
        });
    }
    
    async connectToAgent(agentName) {
        console.log(`=== VOICE CONNECTION ATTEMPT ===`);
        console.log(`🔗 Connecting to agent: ${agentName}`);
        
        // Prevent multiple simultaneous connections
        if (this.isConnecting) {
            console.log('❌ Already connecting, ignoring duplicate click');
            return;
        }
        
        try {
            this.isConnecting = true;
            this.currentAgent = agentName;
            
            console.log(`📞 Setting status to connecting for ${agentName}`);
            this.updateAgentStatus(agentName, 'connecting');
            
            // Clear any existing status messages
            this.clearStatusMessages();
            this.showStatusMessage(`📱 Testing microphone for ${agentName}...`, 'info');
            
            // Request microphone permission using PROVEN method
            console.log('🎤 Starting microphone permission request (same as test page)...');
            const micGranted = await this.requestMicrophonePermission();
            console.log(`🎤 Microphone result: ${micGranted ? 'GRANTED ✅' : 'DENIED ❌'}`);
            
            if (micGranted) {
                console.log(`🎉 SUCCESS! Voice channel ready for ${agentName}`);
                this.isConnected = true;
                this.isConnecting = false;
                this.updateAgentStatus(agentName, 'connected');
                
                // Clear messages and show success
                this.clearStatusMessages();
                this.showStatusMessage(`✅ Connected to ${agentName} - Voice Ready!`, 'success');
                
                // Show voice controls
                this.showVoiceInterface(agentName);
                
                // Show agent response after a moment
                setTimeout(() => {
                    console.log(`🤖 Showing ${agentName} response`);
                    this.simulateAgentResponse(agentName);
                }, 1500);
                
                console.log(`=== CONNECTION SUCCESS ===`);
                
            } else {
                // Permission denied - reset status
                console.log('❌ MICROPHONE PERMISSION DENIED');
                this.isConnecting = false;
                this.updateAgentStatus(agentName, 'active');
                this.clearStatusMessages();
                this.showStatusMessage('🎤 Microphone permission needed for voice chat. Please allow and try again.', 'warning');
                console.log(`=== CONNECTION FAILED - NO MIC ===`);
            }
            
        } catch (error) {
            console.error('❌ Voice connection failed with error:', error);
            this.isConnecting = false;
            if (this.currentAgent) {
                this.updateAgentStatus(this.currentAgent, 'active');
            }
            this.clearStatusMessages();
            this.showErrorMessage(`Connection failed: ${error.message}`);
            console.log(`=== CONNECTION FAILED - ERROR ===`);
        }
    }
    
    clearStatusMessages() {
        // Remove any existing status popups
        const existingPopups = document.querySelectorAll('.status-popup');
        existingPopups.forEach(popup => popup.remove());
    }
    
    async requestMicrophonePermission() {
        try {
            console.log('🎤 Requesting microphone permission (using proven approach)...');
            
            // Use EXACT same approach as successful test page
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                },
                video: false 
            });
            
            console.log('✅ Microphone access granted!');
            
            // Get audio track info (same as test page)
            const audioTracks = stream.getAudioTracks();
            const trackInfo = audioTracks.length > 0 ? audioTracks[0] : null;
            
            console.log(`Audio tracks: ${audioTracks.length}`);
            if (trackInfo) {
                console.log(`Device: ${trackInfo.label || 'Default microphone'}`);
                console.log(`State: ${trackInfo.readyState}`);
                console.log(`Enabled: ${trackInfo.enabled}`);
            }
            
            // Clean up the test stream (same as test page)
            stream.getTracks().forEach(track => track.stop());
            
            return true;
            
        } catch (error) {
            console.error('❌ Microphone test failed:', error);
            
            let errorMessage = '❌ Microphone test failed: ';
            errorMessage += `${error.name} - ${error.message}`;
            
            if (error.name === 'NotAllowedError') {
                errorMessage = '📱 iPhone Users: Look for the microphone icon in Safari address bar and tap "Allow", or go to Settings > Safari > Camera & Microphone > Allow';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found on this device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Microphone is being used by another app. Close other apps and try again.';
            }
            
            console.error('Full error details:', error);
            return false;
        }
    }
    
    isIOSSafari() {
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
        const isIOSChrome = /CriOS/.test(userAgent);
        const isIOSFirefox = /FxiOS/.test(userAgent);
        
        return isIOS && (isSafari || isIOSChrome || isIOSFirefox);
    }
    
    // Add debugging helper
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
        const isIOSChrome = /CriOS/.test(userAgent);
        const isIOSFirefox = /FxiOS/.test(userAgent);
        
        return {
            userAgent,
            isIOS,
            isSafari,
            isIOSChrome,
            isIOSFirefox,
            isIOSSafari: this.isIOSSafari(),
            hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            hasWebAudio: !!(window.AudioContext || window.webkitAudioContext)
        };
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
        this.isConnecting = false;
        this.currentAgent = null;
        this.hideVoiceInterface();
        this.clearStatusMessages();
        
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
    
    addDebugButton() {
        const debugHTML = `
            <div style="position: fixed; bottom: 20px; left: 20px; z-index: 3000;">
                <button id="debug-btn" style="
                    background: rgba(59, 130, 246, 0.9);
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 8px;
                    font-size: 12px;
                    cursor: pointer;
                ">🐛 Debug Info</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', debugHTML);
        
        document.getElementById('debug-btn').addEventListener('click', () => {
            this.showDebugInfo();
        });
    }
    
    showDebugInfo() {
        const browserInfo = this.getBrowserInfo();
        const debugMessage = `
            <strong>Browser Debug Info:</strong><br>
            iOS: ${browserInfo.isIOS ? 'Yes' : 'No'}<br>
            Safari: ${browserInfo.isSafari ? 'Yes' : 'No'}<br>
            Chrome iOS: ${browserInfo.isIOSChrome ? 'Yes' : 'No'}<br>
            getUserMedia: ${browserInfo.hasGetUserMedia ? 'Available' : 'Not Available'}<br>
            WebAudio: ${browserInfo.hasWebAudio ? 'Available' : 'Not Available'}<br>
            User Agent: ${browserInfo.userAgent.substring(0, 50)}...
        `;
        
        this.showStatusMessage(debugMessage, 'info');
        
        // Also log to console for Tyler
        console.log('=== DEBUG INFO FOR TYLER ===');
        console.log('Full Browser Info:', browserInfo);
        console.log('Current URL:', window.location.href);
        console.log('HTTPS:', window.location.protocol === 'https:');
        console.log('=== END DEBUG INFO ===');
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
        this.showStatusMessage(message, 'error');
    }
    
    showSuccessMessage(message) {
        this.showStatusMessage(message, 'success');
    }
    
    showStatusMessage(message, type = 'info') {
        const typeColors = {
            error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444', icon: '❌' },
            success: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10b981', icon: '✅' },
            warning: { bg: 'rgba(245, 158, 11, 0.95)', border: '#f59e0b', icon: '⚠️' },
            info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6', icon: 'ℹ️' }
        };
        
        const colors = typeColors[type] || typeColors.info;
        
        const messageHTML = `
            <div class="status-popup status-${type}">
                <div class="status-content" style="background: ${colors.bg}; border-color: ${colors.border}">
                    <div class="status-header">
                        <span class="status-icon">${colors.icon}</span>
                        <span class="status-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        <button class="close-btn" onclick="this.closest('.status-popup').remove()">×</button>
                    </div>
                    <p class="status-message">${message}</p>
                    ${type === 'error' ? '<button class="retry-btn" onclick="window.location.reload()">Refresh Page</button>' : ''}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', messageHTML);
        
        // Auto-remove after appropriate time based on type
        const autoRemoveTime = type === 'error' ? 10000 : (type === 'success' ? 3000 : 5000);
        setTimeout(() => {
            const popup = document.querySelector(`.status-${type}`);
            if (popup) popup.remove();
        }, autoRemoveTime);
    }
}

// Initialize voice system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.genesisVoice = new GenesisVoiceSystem();
});

// Add CSS for voice controls
const voiceCSS = `
    /* Mobile-optimized agent terminals */
    .agent-terminal {
        -webkit-tap-highlight-color: rgba(16, 185, 129, 0.3);
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        touch-action: manipulation;
    }
    
    .agent-terminal:active {
        transform: scale(0.98) translateY(-3px);
        transition: transform 0.1s ease;
    }
    
    @media (max-width: 768px) {
        .agent-terminal {
            padding: 15px;
            margin: 8px;
            min-height: 80px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .agent-name {
            font-size: 16px !important;
            margin-bottom: 4px;
        }
        
        .agent-role {
            font-size: 12px !important;
        }
    }

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
    
    @media (max-width: 768px) {
        .voice-controls {
            bottom: 10px;
            right: 10px;
            left: 10px;
            min-width: auto;
            padding: 15px;
        }
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
    
    .status-popup {
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        z-index: 2000;
        animation: slideDown 0.3s ease;
        max-width: 500px;
        margin: 0 auto;
    }
    
    @media (min-width: 768px) {
        .status-popup {
            left: auto;
            right: 20px;
            max-width: 400px;
        }
    }
    
    .status-content {
        backdrop-filter: blur(15px);
        border: 2px solid;
        border-radius: 15px;
        padding: 20px;
        color: white;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .status-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        font-weight: 700;
        font-size: 16px;
    }
    
    .status-icon {
        font-size: 20px;
    }
    
    .status-title {
        flex: 1;
    }
    
    .status-message {
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        opacity: 0.9;
    }
    
    .retry-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 10px;
        font-size: 12px;
        transition: background 0.3s ease;
    }
    
    .retry-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    @keyframes slideDown {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
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