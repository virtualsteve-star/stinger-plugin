/**
 * Conversation Tracking Utilities
 */

import type { ConversationContext, ParticipantType } from '../types/api';
import { storageService } from '../storage/StorageService';

/**
 * Generate a session ID for tracking related checks
 */
function generateSessionId(): string {
  return `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Detect the current AI system based on the URL
 */
export function detectAISystem(url: string): { 
  id: string; 
  name: string; 
  model?: string;
  type: ParticipantType;
} {
  const hostname = new URL(url).hostname;
  
  // Standard AI models
  if (hostname.includes('chat.openai.com')) {
    return {
      id: 'chatgpt',
      name: 'ChatGPT',
      model: detectChatGPTModel(),
      type: 'ai_model'
    };
  }
  
  // AI agents
  if (hostname.includes('autogpt.') || hostname.includes('agent.')) {
    return {
      id: 'autogpt',
      name: 'AutoGPT Agent',
      type: 'agent'
    };
  }
  
  // Customer service bots
  if (hostname.includes('support.') || hostname.includes('help.')) {
    return {
      id: 'support-bot',
      name: 'Support Bot',
      type: 'bot'
    };
  }
  
  // Future: Add detection for other AI systems
  // if (hostname.includes('claude.ai')) {
  //   return { id: 'claude', name: 'Claude', type: 'ai_model' };
  // }
  
  return {
    id: 'unknown',
    name: 'Unknown AI',
    type: 'ai_model' // Default to ai_model
  };
}

/**
 * Detect the ChatGPT model from the page
 */
function detectChatGPTModel(): string {
  // Look for model selector button
  const modelButton = document.querySelector('button[aria-haspopup="menu"]');
  if (modelButton) {
    const text = modelButton.textContent || '';
    if (text.includes('GPT-4')) return 'gpt-4';
    if (text.includes('GPT-3.5')) return 'gpt-3.5-turbo';
  }
  
  // Default to GPT-4 if we can't detect
  return 'gpt-4';
}

/**
 * Detect if the current user is automated (bot/agent)
 */
function detectUserType(): ParticipantType {
  // Check for automation indicators
  if (window.location.search.includes('automated=true')) {
    return 'bot';
  }
  
  // Check for automation banners or indicators in the DOM
  if (document.querySelector('[data-testid="automation-banner"]') ||
      document.querySelector('.automation-indicator') ||
      document.querySelector('[data-automated="true"]')) {
    return 'bot';
  }
  
  // Check for agent indicators
  if (window.location.search.includes('agent=true') ||
      document.querySelector('[data-agent="true"]')) {
    return 'agent';
  }
  
  // Default to human
  return 'human';
}

/**
 * Get or create user identification
 */
export async function getUserIdentification(): Promise<{ 
  userId: string; 
  userName?: string;
  userType: ParticipantType;
}> {
  const config = await storageService.getConfig();
  const userType = detectUserType();
  
  // Check if user has configured their identity
  if (config.userId) {
    return {
      userId: config.userId,
      userName: config.userName,
      userType
    };
  }
  
  // Try to get from Chrome identity API if available
  if (chrome.identity && chrome.identity.getProfileUserInfo) {
    return new Promise((resolve) => {
      chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' }, (userInfo) => {
        if (userInfo.email) {
          resolve({
            userId: userInfo.email,
            userName: userInfo.email.split('@')[0],
            userType
          });
        } else {
          // Generate anonymous ID
          const anonymousId = `anonymous-${generateSessionId()}`;
          resolve({ userId: anonymousId, userType });
        }
      });
    });
  }
  
  // Fallback to anonymous ID
  const anonymousId = `anonymous-${generateSessionId()}`;
  return { userId: anonymousId, userType };
}

/**
 * Build conversation context for API requests
 */
export async function buildConversationContext(url: string): Promise<ConversationContext> {
  const [userInfo, aiSystem] = await Promise.all([
    getUserIdentification(),
    Promise.resolve(detectAISystem(url))
  ]);
  
  const manifest = chrome.runtime.getManifest();
  
  // Get browser info
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  return {
    // Required
    userId: userInfo.userId,
    botId: aiSystem.id,
    
    // Participant types
    userType: userInfo.userType,
    botType: aiSystem.type,
    
    // Optional but recommended
    userName: userInfo.userName,
    botName: aiSystem.name,
    botModel: aiSystem.model,
    sessionId: await getOrCreateSessionId(),
    
    // Additional context
    browser,
    extensionVersion: manifest.version,
    url: new URL(url).hostname
  };
}

/**
 * Get or create a session ID for this tab
 */
let sessionId: string | null = null;
async function getOrCreateSessionId(): Promise<string> {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  return sessionId;
}