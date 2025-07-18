/**
 * Conversation Store - Persists conversation state in Chrome storage
 */

import { ChromeWrapper } from '../../shared/chrome/ChromeWrapper';

export interface StoredConversation {
  conversationId: string;
  userId: string;
  botName: string;
  lastPrompt?: string;
  lastPromptTime?: number;
  tabId?: number;
}

const STORAGE_KEY = 'current_conversation';
const CONVERSATION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export class ConversationStore {
  /**
   * Get current conversation from storage
   */
  async getCurrentConversation(): Promise<StoredConversation | null> {
    try {
      const result = await ChromeWrapper.storage.get(STORAGE_KEY);
      const conversation = result[STORAGE_KEY] as StoredConversation | undefined;
      
      if (!conversation) {
        return null;
      }

      // Check if conversation is expired
      if (conversation.lastPromptTime) {
        const age = Date.now() - conversation.lastPromptTime;
        if (age > CONVERSATION_TIMEOUT) {
          await this.clearConversation();
          return null;
        }
      }

      return conversation;
    } catch {
      return null;
    }
  }

  /**
   * Save conversation to storage
   */
  async saveConversation(conversation: StoredConversation): Promise<void> {
    try {
      await ChromeWrapper.storage.set({
        [STORAGE_KEY]: conversation
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  /**
   * Update conversation with prompt
   */
  async updateWithPrompt(prompt: string): Promise<void> {
    const conversation = await this.getCurrentConversation();
    if (conversation) {
      conversation.lastPrompt = prompt;
      conversation.lastPromptTime = Date.now();
      await this.saveConversation(conversation);
    }
  }

  /**
   * Clear conversation
   */
  async clearConversation(): Promise<void> {
    try {
      await ChromeWrapper.storage.remove(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  }
}

export const conversationStore = new ConversationStore();