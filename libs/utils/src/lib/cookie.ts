/**
 * Cookie utility functions
 */

const CHAT_ID_COOKIE_NAME = 'chatId';

/**
 * Set a cookie
 */
export function setCookie(name: string, value: string, days: number = 365): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * Get a cookie value
 */
export function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Set chat ID in cookie
 */
export function setChatId(chatId: string): void {
  setCookie(CHAT_ID_COOKIE_NAME, chatId);
}

/**
 * Get chat ID from cookie
 */
export function getChatId(): string | null {
  return getCookie(CHAT_ID_COOKIE_NAME);
}

/**
 * Clear chat ID from cookie
 */
export function clearChatId(): void {
  deleteCookie(CHAT_ID_COOKIE_NAME);
}

