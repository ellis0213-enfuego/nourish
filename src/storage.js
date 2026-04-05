// Drop-in replacement for window.storage (Claude artifact) → localStorage (PWA)
// All DB.get/set/del calls in App.jsx stay identical — only this file changes.

export const DB = {
  async get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  },

  async del(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
