#!/usr/bin/env node
/**
 * LiveKit Agent Dispatch Test
 * Atlas Technical Director - March 4, 2026
 * 
 * Test agent dispatch functionality to identify "last 5%" blocker
 */

const { AgentDispatchClient } = require('livekit-server-sdk')

// Configuration
const LIVEKIT_URL = 'wss://localhost:7880'
const LIVEKIT_API_KEY = 'ATLAS_TEST_KEY'
const LIVEKIT_API_SECRET = 'ATLAS_TEST_SECRET_2026'

async function testAgentDispatch() {
  console.log('🧪 Testing LiveKit Agent Dispatch...')
  
  try {
    // Create agent dispatch client
    const dispatchClient = new AgentDispatchClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    
    console.log('✅ AgentDispatchClient created successfully')
    
    // Test creating an agent dispatch
    const dispatchRequest = {
      room: 'test-room-' + Date.now(),
      agentName: 'ATLAS-TEST-AGENT',
      metadata: JSON.stringify({
        agentType: 'voice-assistant',
        capabilities: ['speech-to-text', 'text-to-speech', 'voice-commands'],
        priority: 'high'
      })
    }
    
    console.log('🚀 Attempting to dispatch agent:', dispatchRequest)
    
    // This is likely where the "last 5%" blocker occurs
    const dispatch = await dispatchClient.createDispatch(dispatchRequest)
    
    console.log('✅ Agent dispatch successful!', dispatch)
    console.log('🎯 MISSION 2 RESOLVED: Agent dispatch working')
    
    return { success: true, dispatch }
    
  } catch (error) {
    console.error('❌ Agent dispatch failed:', error.message)
    console.error('📋 Error details:', error)
    
    // Analyze the specific error to understand the blocker
    if (error.message.includes('authentication')) {
      console.log('🔑 BLOCKER IDENTIFIED: Authentication issue with agent dispatch')
      console.log('💡 SOLUTION: Configure agent dispatch credentials properly')
    } else if (error.message.includes('connection')) {
      console.log('🌐 BLOCKER IDENTIFIED: Connection issue to LiveKit server')
      console.log('💡 SOLUTION: Verify LiveKit server is running and accessible')
    } else if (error.message.includes('not supported') || error.message.includes('not implemented')) {
      console.log('🚧 BLOCKER IDENTIFIED: Agent dispatch not supported in current LiveKit version')
      console.log('💡 SOLUTION: Upgrade LiveKit or implement custom agent connection logic')
    } else {
      console.log('❓ BLOCKER IDENTIFIED: Unknown agent dispatch issue')
      console.log('💡 SOLUTION: Further investigation needed')
    }
    
    return { success: false, error: error.message }
  }
}

async function testBasicLiveKitConnection() {
  console.log('🔍 Testing basic LiveKit server connection...')
  
  try {
    const { RoomServiceClient } = require('livekit-server-sdk')
    
    const roomClient = new RoomServiceClient('ws://localhost:7880', LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    
    // Test listing rooms (basic connectivity test)
    const rooms = await roomClient.listRooms()
    console.log('✅ Basic LiveKit connection successful')
    console.log('📊 Active rooms:', rooms.length)
    
    return { success: true, rooms }
    
  } catch (error) {
    console.error('❌ Basic LiveKit connection failed:', error.message)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🏗️ LiveKit Agent Dispatch Investigation - Atlas')
  console.log('=' .repeat(60))
  
  // Test 1: Basic connectivity
  const basicTest = await testBasicLiveKitConnection()
  
  if (!basicTest.success) {
    console.log('❌ Basic LiveKit connectivity failed - cannot proceed with agent dispatch test')
    return
  }
  
  // Test 2: Agent dispatch functionality
  const dispatchTest = await testAgentDispatch()
  
  console.log('=' .repeat(60))
  console.log('🎯 MISSION 2 STATUS:')
  
  if (dispatchTest.success) {
    console.log('✅ Agent dispatch working - Mission 2 COMPLETE')
  } else {
    console.log('❌ Agent dispatch blocked - identified "last 5%" issue')
    console.log('🔧 Next steps: Implement solution for identified blocker')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testAgentDispatch, testBasicLiveKitConnection }