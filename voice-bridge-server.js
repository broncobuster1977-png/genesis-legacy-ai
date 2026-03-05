#!/usr/bin/env node
/**
 * Genesis Legacy AI - Voice Bridge Server
 * Connects genesislegacyai.com voice UI to real OpenClaw agent sessions
 * 
 * Architecture:
 * Browser Web Speech API → POST /api/agent/speak → OpenClaw CLI → Agent response → JSON back to browser
 * Browser then speaks response via ElevenLabs TTS (or browser TTS fallback)
 * 
 * Deploy on MSI: node voice-bridge-server.js
 * Port: 3001 (separate from Vercel static site on 3000)
 */

const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const PORT = 3001;
const OPENCLAW_PATH = '/home/bronc/.openclaw';

// Agent configuration - maps website agent names to OpenClaw session names
const AGENT_CONFIG = {
  'JARVIS': {
    session: 'agent:main:main',
    openclaw_agent: 'jarvis',
    personality: 'Strategic Command',
    voice_description: 'commanding, authoritative, precise',
    // ElevenLabs voice ID - Atlas to fill in after setup
    elevenlabs_voice_id: process.env.ELEVENLABS_JARVIS_VOICE || null,
    color: '#00d4ff'
  },
  'ATLAS': {
    session: 'agent:atlas:main', 
    openclaw_agent: 'atlas',
    personality: 'Technical Director',
    voice_description: 'precise, technical, confident',
    elevenlabs_voice_id: process.env.ELEVENLABS_ATLAS_VOICE || null,
    color: '#00ff88'
  },
  'DEMI': {
    session: 'agent:demi-voss:main',
    openclaw_agent: 'demi-voss', 
    personality: 'Creative Director',
    voice_description: 'energetic, creative, enthusiastic',
    elevenlabs_voice_id: process.env.ELEVENLABS_DEMI_VOICE || null,
    color: '#ff6b9d'
  },
  'SEAN': {
    session: 'agent:sean-archer:main',
    openclaw_agent: 'sean-archer',
    personality: 'Legal Counsel',
    voice_description: 'measured, professional, deliberate',
    elevenlabs_voice_id: process.env.ELEVENLABS_SEAN_VOICE || null,
    color: '#ffd700'
  },
  'VIC': {
    session: 'agent:vic:main',
    openclaw_agent: 'vic',
    personality: 'Tax & Entity Expert',
    voice_description: 'analytical, confident, thorough',
    elevenlabs_voice_id: process.env.ELEVENLABS_VIC_VOICE || null,
    color: '#ff8c00'
  },
  'SCOUT': {
    session: 'agent:scout:main',
    openclaw_agent: 'scout',
    personality: 'Intelligence Agent',
    voice_description: 'sharp, quick, direct',
    elevenlabs_voice_id: process.env.ELEVENLABS_SCOUT_VOICE || null,
    color: '#9b59b6'
  }
};

// Send message to real OpenClaw agent and get response
async function queryAgent(agentName, userMessage) {
  const agent = AGENT_CONFIG[agentName.toUpperCase()];
  if (!agent) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  console.log(`[${new Date().toISOString()}] Routing to ${agentName}: "${userMessage}"`);

  // Write message to agent inbox for processing
  const timestamp = Date.now();
  const inboxFile = `${OPENCLAW_PATH}/workspace/agents/${agent.openclaw_agent}/inbox/voice-${timestamp}.md`;
  const messageContent = `# Voice Query - ${new Date().toISOString()}\n\nFrom: Tyler (Voice Interface)\nTo: ${agentName}\n\n${userMessage}\n\nRespond briefly (2-3 sentences max for voice). Be direct.`;

  // Write to inbox
  await execAsync(`echo '${messageContent.replace(/'/g, "'\\''")}' > "${inboxFile}"`);

  // Use OpenClaw CLI to query the agent directly
  // This sends the message to the agent's active session
  const clawCommand = `cd ${OPENCLAW_PATH} && echo '${userMessage.replace(/'/g, "'\\''")}' | timeout 30 openclaw --agent ${agent.openclaw_agent} --no-interactive 2>/dev/null | tail -20`;
  
  try {
    const { stdout, stderr } = await execAsync(clawCommand, { timeout: 35000 });
    
    if (stdout && stdout.trim().length > 0) {
      // Clean up the response - remove ANSI codes, prompts, etc.
      const cleanResponse = stdout
        .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI color codes
        .replace(/^[>\$#]\s*/gm, '')     // Remove prompt characters
        .replace(/^\s*\n/gm, '')          // Remove empty lines
        .trim();
      
      if (cleanResponse.length > 0) {
        return cleanResponse;
      }
    }
  } catch (err) {
    console.log(`CLI query failed, falling back to session file: ${err.message}`);
  }

  // Fallback: Check agent outbox for recent responses
  try {
    const outboxCheck = await execAsync(
      `ls -t ${OPENCLAW_PATH}/workspace/agents/${agent.openclaw_agent}/outbox/ 2>/dev/null | head -1`
    );
    
    if (outboxCheck.stdout.trim()) {
      const latestFile = outboxCheck.stdout.trim();
      const { stdout: fileContent } = await execAsync(
        `cat "${OPENCLAW_PATH}/workspace/agents/${agent.openclaw_agent}/outbox/${latestFile}" 2>/dev/null | tail -10`
      );
      if (fileContent.trim()) {
        return fileContent.trim();
      }
    }
  } catch (err) {
    console.log(`Outbox check failed: ${err.message}`);
  }

  // Last fallback: Agent is not in an active session, return routing message
  return `${agentName} here. I received your message but my session needs to be opened in OpenClaw to respond in real time. Ask JARVIS to activate me.`;
}

// Optional: ElevenLabs TTS
async function textToSpeech(text, voiceId) {
  if (!process.env.ELEVENLABS_API_KEY || !voiceId) {
    return null; // Browser will use built-in TTS
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  // Use curl for the ElevenLabs API call
  const curlCmd = `curl -s -X POST "${url}" \
    -H "xi-api-key: ${apiKey}" \
    -H "Content-Type: application/json" \
    -d '{"text":"${text.replace(/'/g, "'\\''")}","model_id":"eleven_monolingual_v1","voice_settings":{"stability":0.5,"similarity_boost":0.75}}' \
    --output /tmp/voice-${Date.now()}.mp3 && echo "success"`;
  
  try {
    const { stdout } = await execAsync(curlCmd, { timeout: 10000 });
    if (stdout.includes('success')) {
      return true;
    }
  } catch (err) {
    console.log(`ElevenLabs TTS failed: ${err.message}`);
  }
  return null;
}

// CORS headers
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Main server
const server = http.createServer(async (req, res) => {
  setCORSHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'online', 
      agents: Object.keys(AGENT_CONFIG),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Agent list
  if (url.pathname === '/api/agents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      agents: Object.entries(AGENT_CONFIG).map(([name, config]) => ({
        name,
        personality: config.personality,
        voice_description: config.voice_description,
        has_elevenlabs: !!config.elevenlabs_voice_id,
        color: config.color
      }))
    }));
    return;
  }

  // Main voice endpoint - POST /api/agent/speak
  if (url.pathname === '/api/agent/speak' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { agent, message } = body;

      if (!agent || !message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing agent or message' }));
        return;
      }

      // Query the real agent
      const response = await queryAgent(agent, message);

      // Try ElevenLabs TTS if configured
      const agentConfig = AGENT_CONFIG[agent.toUpperCase()];
      const hasElevenLabs = agentConfig?.elevenlabs_voice_id && process.env.ELEVENLABS_API_KEY;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        agent,
        response,
        use_elevenlabs: hasElevenLabs,
        voice_id: agentConfig?.elevenlabs_voice_id || null,
        personality: agentConfig?.personality || 'Agent'
      }));

    } catch (err) {
      console.error('Voice bridge error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     Genesis Legacy AI - Voice Bridge Server       ║
║     Port: ${PORT}                                    ║
║     Status: ONLINE                                ║
╚═══════════════════════════════════════════════════╝

Agents configured: ${Object.keys(AGENT_CONFIG).join(', ')}
OpenClaw path: ${OPENCLAW_PATH}
ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? 'CONFIGURED' : 'Not configured (using browser TTS)'}

Waiting for voice queries...
  `);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
