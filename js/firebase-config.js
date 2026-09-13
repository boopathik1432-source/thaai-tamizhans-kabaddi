/* 🏆 THAAI TAMIZHANS (தாய் தமிழன்ஸ்) KABADDI CLUB — FIREBASE CONFIGURATION */

// Firebase Project Credentials for Thaai Tamizhans
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDK3fUCYkdCZnQhu8AW3teWdXM5ZvW6POw",
  authDomain: "thaai-tamizhans.firebaseapp.com",
  projectId: "thaai-tamizhans",
  storageBucket: "thaai-tamizhans.firebasestorage.app",
  messagingSenderId: "685067889091",
  appId: "1:685067889091:web:4f439d73fc8749c9deb576",
  measurementId: "G-NJFGLVPR9D"
};

function getActiveFirebaseConfig() {
  // 1. Environment injection from Vercel / serverless build
  if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__ && window.__FIREBASE_CONFIG__.projectId) {
    return window.__FIREBASE_CONFIG__;
  }
  // 2. Custom local override if configured
  try {
    const custom = localStorage.getItem('thaai_tamizhans_custom_firebase_config');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && parsed.projectId) return parsed;
    }
  } catch (e) {
    console.warn('Could not read custom firebase config from storage:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

const activeFirebaseConfig = getActiveFirebaseConfig();

// Expose globally for browser runtime
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = activeFirebaseConfig;
  window.getActiveFirebaseConfig = getActiveFirebaseConfig;
}

// Export for ES modules / tooling
if (typeof exports !== 'undefined') {
  exports.FIREBASE_CONFIG = activeFirebaseConfig;
  exports.getActiveFirebaseConfig = getActiveFirebaseConfig;
}
