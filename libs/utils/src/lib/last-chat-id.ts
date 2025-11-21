/**
 * Last Chat ID utility functions for localStorage
 */

const LAST_CHAT_ID_KEY = 'lastChatId';

/**
 * Set last opened chat ID in localStorage
 */
export function setLastChatId(chatId: string): void {
  try {
    localStorage.setItem(LAST_CHAT_ID_KEY, chatId);
  } catch (error) {
    console.error('Failed to save last chat ID to localStorage:', error);
  }
}

/**
 * Get last opened chat ID from localStorage
 */
export function getLastChatId(): string | null {
  try {
    return localStorage.getItem(LAST_CHAT_ID_KEY);
  } catch (error) {
    console.error('Failed to get last chat ID from localStorage:', error);
    return null;
  }
}

/**
 * Clear last opened chat ID from localStorage
 */
export function clearLastChatId(): void {
  try {
    localStorage.removeItem(LAST_CHAT_ID_KEY);
  } catch (error) {
    console.error('Failed to clear last chat ID from localStorage:', error);
  }
}

