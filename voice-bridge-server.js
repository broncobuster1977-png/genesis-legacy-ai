#!/usr/bin/env node
/**
 * Genesis Legacy AI - Voice Bridge Server
 * Connects web voice system to real OpenClaw agents
 * Atlas Technical Director - March 4, 2026
 * 
 * Based on Elvis architecture - real agent bridge implementation
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

// Enable CORS for Vercel deployment
app.use(cors({
  origin: [
    'https://genesislegacyai.com',
    'https://genesis-deployment.vercel.app', 
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Store active agent sessions
const agentSessions = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    bridge: 'Genesis Voice Bridge v1.0',
    timestamp: new Date().toISOString(),
    activeSessions: agentSessions.size,
    uptime: process.uptime()
  });
});

// Main voice-to-agent endpoint
app.post('/api/agent/speak', async (req, res) => {
  const { agent, message } = req.body;
  
  console.log(`🎤 Voice request: ${agent} <- "${message}"`);
  
  if (!agent || !message) {
    return res.status(400).json({ error: 'Missing agent or message' });
  }

  try {
    // Get or create agent session
    let sessionKey = agentSessions.get(agent);
    if (!sessionKey) {
      sessionKey = await createAgentSession(agent);
      if (sessionKey) {
        agentSessions.set(agent, sessionKey);
        console.log(`📱 Created session for ${agent}: ${sessionKey}`);
      }
    }

    // Send message to real OpenClaw agent
    const response = await sendToOpenClawAgent(agent, sessionKey, message);
    
    console.log(`🤖 ${agent} response: "${response.substring(0, 100)}..."`);
    
    res.json({ 
      success: true,
      agent,
      response,
      sessionKey: sessionKey || 'fallback'
    });

  } catch (error) {
    console.error(`❌ Agent ${agent} error:`, error.message);
    
    // Return fallback response
    const fallbackResponse = generateFallbackResponse(agent, message);
    res.json({
      success: true,
      agent,
      response: fallbackResponse,
      fallback: true
    });
  }
});

// Create OpenClaw agent session
async function createAgentSession(agentName) {
  try {
    // Use OpenClaw CLI to spawn agent session
    const agentId = agentName.toLowerCase();
    const task = `Voice conversation session for ${agentName}. Ready for voice communication with Tyler.`;
    
    const cmd = 'openclaw';
    const args = [
      'sessions', 'spawn',
      '--agent-id', agentId,
      '--mode', 'session', 
      '--task', task,
      '--cleanup', 'keep',
      '--json'
    ];

    console.log(`📞 Spawning ${agentName} session: ${cmd} ${args.join(' ')}`);

    return new Promise((resolve) => {
      const proc = spawn(cmd, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result.sessionKey || result.session_key);
          } catch (e) {
            console.log(`⚠️ JSON parse failed, extracting session key from: ${stdout}`);
            // Try to extract session key from text output
            const match = stdout.match(/session[_\s]*key[:\s]+([a-zA-Z0-9\-_]+)/i);
            resolve(match ? match[1] : null);
          }
        } else {
          console.log(`⚠️ Session spawn failed (code ${code}): ${stderr}`);
          resolve(null);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        proc.kill();
        resolve(null);
      }, 10000);
    });

  } catch (error) {
    console.error(`❌ Failed to create session for ${agentName}:`, error);
    return null;
  }
}

// Send message to real OpenClaw agent
async function sendToOpenClawAgent(agentName, sessionKey, message) {
  if (!sessionKey) {
    throw new Error('No session key available');
  }

  try {
    const cmd = 'openclaw';
    const args = [
      'sessions', 'send',
      '--session-key', sessionKey,
      '--message', message,
      '--timeout', '25',
      '--json'
    ];

    console.log(`📤 Sending to ${agentName}: ${message.substring(0, 50)}...`);

    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim());
            const response = result.response || result.message || stdout.trim();
            resolve(cleanAgentResponse(response));
          } catch (e) {
            // If JSON parsing fails, use raw stdout
            resolve(cleanAgentResponse(stdout.trim()));
          }
        } else {
          reject(new Error(`Agent communication failed (code ${code}): ${stderr}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        proc.kill();
        reject(new Error('Agent response timeout'));
      }, 30000);
    });

  } catch (error) {
    console.error(`❌ Failed to send to ${agentName}:`, error);
    throw error;
  }
}

// Clean agent response for voice output
function cleanAgentResponse(response) {
  if (!response || typeof response !== 'string') {
    return 'I apologize, but I did not receive a clear response. Please try again.';
  }

  // Remove excessive technical formatting that doesn't work well in voice
  return response
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/#{1,6}\s+/g, '')      // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1')    // Remove italic markdown
    .replace(/`([^`]+)`/g, '$1')    // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/^\s*[-*+]\s+/gm, '')  // Remove bullet points
    .replace(/^\s*\d+\.\s+/gm, '')  // Remove numbered lists
    .replace(/\n{3,}/g, '\n\n')     // Limit consecutive newlines
    .replace(/\s{2,}/g, ' ')        // Normalize whitespace
    .trim();
}

// Generate fallback responses when agent unavailable
function generateFallbackResponse(agentName, message) {
  const responses = {
    'JARVIS': 'Strategic Command online, Tyler. I heard your directive but I am currently experiencing connection issues with the main coordination systems. Please ensure the bridge server is running properly.',
    
    'ATLAS': 'Technical Director here, Tyler. I received your communication but I am unable to connect to the main infrastructure systems right now. Please check the voice bridge server status.',
    
    'DEMI': 'Creative Director online, Tyler. I caught your message but the design matrix connection seems to be interrupted. The voice bridge may need to be restarted.',
    
    'SEAN': 'Sean Archer here. I heard you but the legal framework systems are not responding properly. There appears to be a bridge connectivity issue.',
    
    'VIC': 'Vic reporting. Your message was received but I cannot access the financial analysis systems at the moment. Please verify the bridge server is operational.',
    
    'SCOUT': 'Scout Delgado here. Message received but intelligence networks are offline. The voice bridge connection appears to be down.'
  };

  return responses[agentName.toUpperCase()] || 
    `${agentName} received your message: "${message.substring(0, 30)}..." but cannot connect to the main agent systems right now. Please check that the OpenClaw agents are running properly.`;
}

// Cleanup sessions periodically  
setInterval(() => {
  console.log(`🧹 Active sessions: ${agentSessions.size}`);
}, 300000); // 5 minutes

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌉 Genesis Voice Bridge running on port ${PORT}`);
  console.log(`🎤 Ready for voice connections from GenesisLegacyAI.com`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down voice bridge server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Voice bridge server terminated');
  process.exit(0);
});