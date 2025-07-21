/**
 * Conversation Manager - Tracks conversation context between prompts and responses
 */

import { StorageService } from '../../shared/storage/StorageService';
import { loggers } from '../../shared/logging/Logger';
import { conversationStore } from './conversation-store';

const logger = loggers.content;

export interface ConversationContext {
  conversationId: string;
  userId: string;
  botName: string;
  lastPrompt?: string;
  lastPromptTime?: number;
  responseCount: number;
}

export class ConversationManager {
  private static instance: ConversationManager;
  private currentConversation: ConversationContext | null = null;
  private storage = new StorageService();

  private constructor() {}

  static getInstance(): ConversationManager {
    if (!ConversationManager.instance) {
      ConversationManager.instance = new ConversationManager();
    }
    return ConversationManager.instance;
  }

  /**
   * Initialize or get current conversation
   */
  async getCurrentConversation(): Promise<ConversationContext> {
    // Check if we already have a conversation in memory
    if (this.currentConversation) {
      // Using existing conversation from memory
      return this.currentConversation;
    }

    // Try to get conversation from persistent storage
    const storedConversation = await conversationStore.getCurrentConversation();

    if (storedConversation) {
      // Restoring conversation from storage
      // Restore conversation from storage
      this.currentConversation = {
        conversationId: storedConversation.conversationId,
        userId: storedConversation.userId,
        botName: storedConversation.botName,
        lastPrompt: storedConversation.lastPrompt,
        lastPromptTime: storedConversation.lastPromptTime,
        responseCount: 0,
      };
      return this.currentConversation;
    }

    // Get user ID from storage
    const config = await this.storage.getConfig();
    const userId = config.userId || 'anonymous';

    // Create new conversation
    const newConversationId = `chrome_ext_${Date.now()}`;
    // Removed debug log for production

    this.currentConversation = {
      conversationId: newConversationId,
      userId,
      botName: 'ChatGPT',
      responseCount: 0,
    };

    // Save to persistent storage
    await conversationStore.saveConversation({
      conversationId: this.currentConversation.conversationId,
      userId: this.currentConversation.userId,
      botName: this.currentConversation.botName,
    });

    return this.currentConversation;
  }

  /**
   * Record a user prompt
   */
  async recordPrompt(prompt: string): Promise<ConversationContext> {
    const conversation = await this.getCurrentConversation();

    conversation.lastPrompt = prompt;
    conversation.lastPromptTime = Date.now();

    logger.debug('Recording prompt in conversation', {
      conversationId: conversation.conversationId,
      userId: conversation.userId,
      promptLength: prompt.length,
    });

    // Update persistent storage
    await conversationStore.updateWithPrompt(prompt);

    return conversation;
  }

  /**
   * Record a response
   */
  async recordResponse(): Promise<ConversationContext> {
    const conversation = await this.getCurrentConversation();

    conversation.responseCount++;

    logger.debug('Recording response in conversation', {
      conversationId: conversation.conversationId,
      userId: conversation.userId,
      responseCount: conversation.responseCount,
    });

    return conversation;
  }

  /**
   * Get formatted context for API
   */
  async getApiContext(): Promise<{
    conversation_id: string;
    userId: string;
    botId: string;
    sessionId: string;
    metadata?: {
      bot_name: string;
      conversation_type: string;
      last_prompt?: string;
    };
  }> {
    const conversation = await this.getCurrentConversation();

    const context = {
      conversation_id: conversation.conversationId,
      userId: conversation.userId,
      botId: 'ChatGPT', // For Core Engineering management console
      sessionId: conversation.conversationId, // Use same as conversation ID for now
      metadata: {
        bot_name: conversation.botName,
        conversation_type: 'human_bot',
        last_prompt: conversation.lastPrompt,
      },
    };

    logger.debug('Generated API context', {
      conversationId: context.conversation_id,
      userId: context.userId,
      hasPrompt: !!conversation.lastPrompt,
    });

    return context;
  }

  /**
   * Reset conversation (e.g., on page refresh or new chat)
   */
  async reset(): Promise<void> {
    this.currentConversation = null;
    await conversationStore.clearConversation();
  }

  /**
   * Check if we should start a new conversation
   * (e.g., if too much time has passed since last interaction)
   */
  shouldStartNewConversation(): boolean {
    if (!this.currentConversation || !this.currentConversation.lastPromptTime) {
      return true;
    }

    // Start new conversation after 30 minutes of inactivity
    const thirtyMinutes = 30 * 60 * 1000;
    const timeSinceLastPrompt = Date.now() - this.currentConversation.lastPromptTime;

    return timeSinceLastPrompt > thirtyMinutes;
  }

  /**
   * Check if there's an active conversation with at least one prompt
   * This prevents response checking from creating orphaned anonymous conversations
   */
  hasActiveConversation(): boolean {
    return (
      this.currentConversation !== null && this.currentConversation.lastPromptTime !== undefined
    );
  }
}

export const conversationManager = ConversationManager.getInstance();
