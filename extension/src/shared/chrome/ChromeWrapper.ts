/**
 * Chrome API Wrapper for Better Type Safety and Error Handling
 */

export class ChromeWrapper {
  /**
   * Safe wrapper for chrome.runtime.sendMessage
   */
  static async sendMessage<T = any>(message: any): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Safe wrapper for chrome.tabs.sendMessage
   */
  static async sendMessageToTab<T = any>(tabId: number, message: any): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Safe wrapper for chrome.storage.local operations
   */
  static storage = {
    async get<T>(keys: string | string[]): Promise<T> {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(result as T);
        });
      });
    },

    async set(items: Record<string, any>): Promise<void> {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      });
    },

    async remove(keys: string | string[]): Promise<void> {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      });
    },

    async clear(): Promise<void> {
      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      });
    },

    async getBytesInUse(keys?: string | string[] | null): Promise<number> {
      return new Promise((resolve, reject) => {
        chrome.storage.local.getBytesInUse(keys || null, (bytesInUse) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(bytesInUse);
        });
      });
    },
  };

  /**
   * Safe wrapper for chrome.alarms
   */
  static alarms = {
    async create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void> {
      return new Promise((resolve, reject) => {
        chrome.alarms.create(name, alarmInfo, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      });
    },

    async get(name: string): Promise<chrome.alarms.Alarm | undefined> {
      return new Promise((resolve, reject) => {
        chrome.alarms.get(name, (alarm) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(alarm);
        });
      });
    },

    async clear(name?: string): Promise<boolean> {
      return new Promise((resolve, reject) => {
        if (name) {
          chrome.alarms.clear(name, (wasCleared) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(wasCleared);
          });
        } else {
          chrome.alarms.clearAll((wasCleared) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(wasCleared);
          });
        }
      });
    },

    async getAll(): Promise<chrome.alarms.Alarm[]> {
      return new Promise((resolve, reject) => {
        chrome.alarms.getAll((alarms) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(alarms);
        });
      });
    },
  };

  /**
   * Get current tab
   */
  static async getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(tabs[0]);
      });
    });
  }

  /**
   * Get extension URL
   */
  static getURL(path: string): string {
    return chrome.runtime.getURL(path);
  }

  /**
   * Check if running in extension context
   */
  static isExtensionContext(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      chrome.runtime !== undefined &&
      typeof chrome.runtime.id === 'string'
    );
  }
}
