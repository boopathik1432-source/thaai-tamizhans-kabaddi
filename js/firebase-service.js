/* 🏆 தாய் தமிழன்ஸ் (THAAI TAMIZHANS) KABADDI CLUB — COMPLETE FIREBASE REAL-TIME SERVICE */

window.FirebaseSync = {
  app: null,
  auth: null,
  db: null,
  storage: null,
  analytics: null,
  isInitialized: false,
  isConnected: false,
  isRemoteUpdating: false,
  debounceTimer: null,
  unsubscribers: [],
  currentUser: null,
  
  // Primary Master Collection & Document for Atomic Live Sync
  masterCollection: 'thaai_tamizhans_club',
  masterDocId: 'app_live_state',

  // All 11 Cloud Firestore Collections Schema
  collections: [
    { key: 'users', name: '👤 பயனர்கள் (Users)', col: 'users' },
    { key: 'players', name: '👥 வீரர்கள் (Players)', col: 'players' },
    { key: 'instructions', name: '🎯 வீரர் பயிற்சிக் குறிப்புகள் (Instructions)', col: 'instructions' },
    { key: 'todayPractice', name: '📋 இன்றைய பயிற்சி (Today Practice)', col: 'todayPractice' },
    { key: 'practiceCalendar', name: '📅 பயிற்சி அட்டவணை (Practice Calendar)', col: 'practiceCalendar' },
    { key: 'matchNotices', name: '📢 போட்டி அறிவிப்புகள் (Match Notices)', col: 'matchNotices' },
    { key: 'performance', name: '📊 செயல்திறன் மேட்ரிக்ஸ் (Performance)', col: 'performance' },
    { key: 'attendance', name: '✅ வருகைப் பதிவு (Attendance)', col: 'attendance' },
    { key: 'announcements', name: '💬 பொது அறிவிப்புகள் (Announcements)', col: 'announcements' },
    { key: 'files', name: '📁 அணி ஆவணங்கள் & வீடியோ (Files Vault)', col: 'files' },
    { key: 'notifications', name: '🔔 அறிவிப்புகள் (Notifications)', col: 'notifications' }
  ],

  // ----------------------------------------------------
  // 1. BOOTSTRAP & INITIALIZE FIREBASE SDK
  // ----------------------------------------------------
  init() {
    try {
      if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase SDK not loaded yet. Waiting...');
        this.updateBadge('offline', 'SDK Missing');
        return;
      }

      const config = (typeof window.getActiveFirebaseConfig === 'function') 
        ? window.getActiveFirebaseConfig() 
        : (window.FIREBASE_CONFIG || {
            apiKey: "AIzaSyDK3fUCYkdCZnQhu8AW3teWdXM5ZvW6POw",
            authDomain: "thaai-tamizhans.firebaseapp.com",
            projectId: "thaai-tamizhans",
            storageBucket: "thaai-tamizhans.firebasestorage.app",
            messagingSenderId: "685067889091",
            appId: "1:685067889091:web:4f439d73fc8749c9deb576",
            measurementId: "G-NJFGLVPR9D"
          });

      if (!firebase.apps.length) {
        this.app = firebase.initializeApp(config);
      } else {
        this.app = firebase.app();
      }

      // Core Services
      this.db = firebase.firestore();
      
      if (typeof firebase.auth === 'function') {
        this.auth = firebase.auth();
        this.setupAuthListener();
      }

      if (typeof firebase.storage === 'function') {
        this.storage = firebase.storage();
      }

      if (typeof firebase.analytics === 'function') {
        try { this.analytics = firebase.analytics(); } catch (e) {}
      }

      // Multi-tab offline persistence
      this.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.info('Firestore: multi-tab persistence shared across tabs.');
        } else if (err.code === 'unimplemented') {
          console.info('Firestore: offline persistence not supported in this browser.');
        }
      });

      this.isInitialized = true;
      this.updateBadge('connecting', 'Connecting...');
      console.log('🔥 Firebase Initialized for தாய் தமிழன்ஸ் KABADDI CLUB (Project:', config.projectId, ')');

      // Start all real-time listeners
      this.startAllRealtimeListeners();

      // Listen for tab visibility changes to preserve battery/CPU
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          console.log('⚡ Tab hidden: background mode');
        } else {
          console.log('⚡ Tab active: resuming real-time check');
        }
      });

    } catch (error) {
      console.error('❌ Firebase Init Error:', error);
      this.updateBadge('error', 'Init Error');
    }
  },

  // ----------------------------------------------------
  // 2. AUTHENTICATION (Coach & Player Session Integration)
  // ----------------------------------------------------
  setupAuthListener() {
    if (!this.auth) return;
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      if (user) {
        console.log('👤 Firebase Auth User active:', user.uid);
      }
    });
  },

  async authenticateUser(role, sessionData) {
    if (!this.auth || !this.db) return;
    try {
      let user = this.auth.currentUser;
      if (!user) {
        const credential = await this.auth.signInAnonymously();
        user = credential.user;
      }

      if (user) {
        // Upsert users/{uid} document
        const userRef = this.db.collection('users').doc(user.uid);
        await userRef.set({
          uid: user.uid,
          name: sessionData.name || (role === 'coach' ? 'Coach Arun' : 'Player'),
          role: role,
          playerId: sessionData.playerId || null,
          phone: sessionData.phone || '',
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('✅ Synced user session to users/' + user.uid);
      }
    } catch (err) {
      console.warn('Auth session sync warning (offline fallback active):', err.message);
    }
  },

  async logout() {
    this.unsubscribeAll();
    if (this.auth && this.auth.currentUser) {
      try {
        await this.auth.signOut();
      } catch (e) {
        console.warn('SignOut error:', e);
      }
    }
    this.currentUser = null;
    this.updateBadge('offline', 'Logged Out');
  },

  // ----------------------------------------------------
  // 3. REAL-TIME SNAPSHOT LISTENERS (onSnapshot)
  // ----------------------------------------------------
  startAllRealtimeListeners() {
    if (!this.db) return;
    this.unsubscribeAll();

    // 1. Master State Listener (Atomic Live Sync across devices)
    try {
      const masterRef = this.db.collection(this.masterCollection).doc(this.masterDocId);
      const unsubMaster = masterRef.onSnapshot((doc) => {
        this.isConnected = true;
        this.updateBadge('live', 'Live Sync Active');

        if (doc.exists) {
          const remote = doc.data();
          if (remote && remote.payload) {
            this.applyRemoteData(remote.payload);
          }
        } else {
          console.log('📝 Initial cloud document not found. Auto-seeding all 11 collections...');
          this.seedAll11Collections();
        }
      }, (err) => this.handleListenerError('master', err));
      this.unsubscribers.push(unsubMaster);
    } catch (e) {
      console.warn('Master listener error:', e);
    }

    // 2. Players Collection: players/{playerId}
    try {
      const unsubPlayers = this.db.collection('players').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const players = [];
          snapshot.forEach(doc => players.push({ id: doc.id, ...doc.data() }));
          players.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
          if (!this.isRemoteUpdating && JSON.stringify(appData.players) !== JSON.stringify(players)) {
            appData.players = players;
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('players', err));
      this.unsubscribers.push(unsubPlayers);
    } catch (e) {}

    // 3. Today Practice Singleton: todayPractice/current
    try {
      const unsubPractice = this.db.collection('todayPractice').doc('current').onSnapshot((doc) => {
        if (doc.exists && typeof appData !== 'undefined') {
          const data = doc.data();
          if (!this.isRemoteUpdating && data && data.title) {
            appData.todayPractice = data;
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('todayPractice', err));
      this.unsubscribers.push(unsubPractice);
    } catch (e) {}

    // 4. Practice Calendar: practiceCalendar/{sessionId}
    try {
      const unsubCalendar = this.db.collection('practiceCalendar').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          if (!this.isRemoteUpdating) {
            appData.practiceCalendar = list;
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('practiceCalendar', err));
      this.unsubscribers.push(unsubCalendar);
    } catch (e) {}

    // 5. Match Notices: matchNotices/{noticeId}
    try {
      const unsubNotices = this.db.collection('matchNotices').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const notices = [];
          snapshot.forEach(doc => notices.push({ id: doc.id, ...doc.data() }));
          if (!this.isRemoteUpdating) {
            appData.matchNotices = notices;
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('matchNotices', err));
      this.unsubscribers.push(unsubNotices);
    } catch (e) {}

    // 6. Instructions: instructions/{instructionId}
    try {
      const unsubInstructions = this.db.collection('instructions').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          if (!this.isRemoteUpdating) {
            appData.instructions = list;
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('instructions', err));
      this.unsubscribers.push(unsubInstructions);
    } catch (e) {}

    // 7. Performance Matrix: performance/{playerId}
    try {
      const unsubPerf = this.db.collection('performance').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const perfMap = {};
          snapshot.forEach(doc => { perfMap[doc.id] = doc.data(); });
          if (!this.isRemoteUpdating) {
            appData.performance = perfMap;
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('performance', err));
      this.unsubscribers.push(unsubPerf);
    } catch (e) {}

    // 8. Attendance: attendance/{dateString}
    try {
      const unsubAttendance = this.db.collection('attendance').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const todayStr = new Date().toISOString().split('T')[0];
          snapshot.forEach(doc => {
            if (doc.id === todayStr || doc.id === 'today') {
              const data = doc.data();
              if (data && Array.isArray(data.records)) {
                appData.todayAttendance = data.records;
              }
            }
          });
          this.refreshActiveViews();
        }
      }, (err) => this.handleListenerError('attendance', err));
      this.unsubscribers.push(unsubAttendance);
    } catch (e) {}

    // 9. Announcements: announcements/{messageId}
    try {
      const unsubAnnounce = this.db.collection('announcements').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const msgs = [];
          snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
          if (!this.isRemoteUpdating) {
            appData.messages = msgs;
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('announcements', err));
      this.unsubscribers.push(unsubAnnounce);
    } catch (e) {}

    // 10. Squad Vault Files: files/{fileId}
    try {
      const unsubFiles = this.db.collection('files').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const files = [];
          snapshot.forEach(doc => files.push({ id: doc.id, ...doc.data() }));
          if (!this.isRemoteUpdating) {
            appData.files = files;
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('files', err));
      this.unsubscribers.push(unsubFiles);
    } catch (e) {}

    // 11. Notifications: notifications/{notificationId}
    try {
      const unsubNotifs = this.db.collection('notifications').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const notifs = [];
          snapshot.forEach(doc => notifs.push({ id: doc.id, ...doc.data() }));
          if (!this.isRemoteUpdating) {
            appData.notifications = notifs;
            if (typeof renderNotifications === 'function') renderNotifications();
          }
        }
      }, (err) => this.handleListenerError('notifications', err));
      this.unsubscribers.push(unsubNotifs);
    } catch (e) {}
  },

  handleListenerError(source, error) {
    console.warn(`⚠️ [Firebase ${source}] Listener Warning:`, error);
    if (error.code === 'permission-denied') {
      this.updateBadge('warning', 'Rules Denied');
    } else if (error.code === 'unavailable' || error.message.includes('offline')) {
      this.updateBadge('offline', 'Offline Mode');
    }
  },

  unsubscribeAll() {
    if (this.unsubscribers && this.unsubscribers.length) {
      this.unsubscribers.forEach(unsub => {
        try { if (typeof unsub === 'function') unsub(); } catch (e) {}
      });
      this.unsubscribers = [];
    }
  },

  // ----------------------------------------------------
  // 4. APPLY REMOTE INCOMING DATA & REFRESH UI
  // ----------------------------------------------------
  applyRemoteData(incoming) {
    if (!incoming || typeof incoming !== 'object') return;

    this.isRemoteUpdating = true;
    try {
      const currentRole = (typeof appData !== 'undefined' && appData.activeRole) ? appData.activeRole : 'coach';
      const currentPlayerId = (typeof appData !== 'undefined' && appData.activePlayerId) ? appData.activePlayerId : 1;

      if (typeof appData !== 'undefined') {
        Object.assign(appData, incoming);
        // Preserve local session role & active player
        appData.activeRole = currentRole;
        appData.activePlayerId = currentPlayerId;
      }

      // Backup to local storage
      try {
        localStorage.setItem('HOME_KABADDI_APP_DATA_TANGLISH_V1', JSON.stringify(incoming));
      } catch (e) {}

      this.refreshActiveViews();
    } catch (err) {
      console.error('Error applying remote data:', err);
    } finally {
      setTimeout(() => {
        this.isRemoteUpdating = false;
      }, 500);
    }
  },

  refreshActiveViews() {
    if (typeof renderAppShell === 'function') renderAppShell();
    if (typeof renderCurrentView === 'function') renderCurrentView();
    if (typeof renderNotifications === 'function') renderNotifications();
    if (typeof populatePlayerLoginDropdown === 'function') populatePlayerLoginDropdown();
  },

  // ----------------------------------------------------
  // 5. DEBOUNCED SYNC & AUTO-UPLOAD (All 11 Collections)
  // ----------------------------------------------------
  uploadData(data) {
    if (this.isRemoteUpdating) return;
    if (!this.isInitialized || !this.db) return;

    clearTimeout(this.debounceTimer);
    this.updateBadge('syncing', 'Syncing...');

    this.debounceTimer = setTimeout(() => {
      this.uploadDataImmediately(data);
    }, 500);
  },

  async uploadDataImmediately(data) {
    if (!this.db) return;

    try {
      const cleanClone = this.cleanForCloud(data);

      // 1. Update Master Live Sync Doc
      const masterDoc = this.db.collection(this.masterCollection).doc(this.masterDocId);
      await masterDoc.set({
        payload: cleanClone,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: (typeof appData !== 'undefined' && appData.coachProfile) ? appData.coachProfile.name : 'Web App'
      }, { merge: true });

      // 2. Mirror into dedicated individual collections in background
      this.syncIndividualCollections(cleanClone);

      this.updateBadge('live', 'Live Sync Active');
      console.log('✅ [Firebase Live] All data successfully synced to Cloud Firestore!');
    } catch (error) {
      console.error('❌ Failed to write to Firestore:', error);
      if (error.code === 'permission-denied') {
        this.updateBadge('warning', 'Rules Denied');
      } else {
        this.updateBadge('error', 'Sync Failed');
      }
    }
  },

  async syncIndividualCollections(data) {
    if (!this.db) return;
    try {
      // Sync todayPractice
      if (data.todayPractice) {
        this.db.collection('todayPractice').doc('current').set({
          ...data.todayPractice,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }

      // Sync attendance
      if (data.todayAttendance) {
        const todayStr = new Date().toISOString().split('T')[0];
        this.db.collection('attendance').doc(todayStr).set({
          date: todayStr,
          records: data.todayAttendance,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }
    } catch (e) {}
  },

  cleanForCloud(data) {
    const clone = JSON.parse(JSON.stringify(data));
    if (clone.files && Array.isArray(clone.files)) {
      clone.files = clone.files.map(f => {
        const item = { ...f };
        if (item.url && (item.url.startsWith('blob:') || item.url.startsWith('data:video/'))) item.url = '';
        if (item.thumbnail && (item.thumbnail.startsWith('blob:') || item.thumbnail.startsWith('data:video/'))) {
          item.thumbnail = item.type === 'Video' ? 'assets/kabaddi_arena_bg.jpg' : 'assets/thaai_tamizhans_logo.jpg';
        }
        return item;
      });
    }
    return clone;
  },

  // ----------------------------------------------------
  // 6. SEED ALL 11 CLOUD FIRESTORE COLLECTIONS
  // ----------------------------------------------------
  async seedAll11Collections() {
    if (!this.db) return;

    try {
      this.updateBadge('syncing', 'Seeding 11 Tables...');
      console.log('🚀 Seeding all 11 Cloud Firestore Collections...');

      const sourceData = (typeof appData !== 'undefined' && appData) ? appData : INITIAL_KABADDI_DATA;
      const batch = this.db.batch();

      // 1. Players
      if (sourceData.players && Array.isArray(sourceData.players)) {
        sourceData.players.forEach(p => {
          const ref = this.db.collection('players').doc(String(p.id));
          batch.set(ref, { ...p, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 2. Today Practice
      if (sourceData.todayPractice) {
        const ref = this.db.collection('todayPractice').doc('current');
        batch.set(ref, { ...sourceData.todayPractice, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }

      // 3. Practice Calendar
      if (sourceData.practiceCalendar && Array.isArray(sourceData.practiceCalendar)) {
        sourceData.practiceCalendar.forEach(item => {
          const ref = this.db.collection('practiceCalendar').doc(String(item.id));
          batch.set(ref, { ...item, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 4. Instructions
      if (sourceData.instructions && Array.isArray(sourceData.instructions)) {
        sourceData.instructions.forEach(ins => {
          const ref = this.db.collection('instructions').doc(String(ins.id));
          batch.set(ref, { ...ins, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 5. Match Notices
      if (sourceData.matchNotices && Array.isArray(sourceData.matchNotices)) {
        sourceData.matchNotices.forEach(notice => {
          const ref = this.db.collection('matchNotices').doc(String(notice.id));
          batch.set(ref, { ...notice, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 6. Performance Matrix
      if (sourceData.performance && typeof sourceData.performance === 'object') {
        Object.keys(sourceData.performance).forEach(playerId => {
          const ref = this.db.collection('performance').doc(String(playerId));
          batch.set(ref, {
            playerId: playerId,
            ...sourceData.performance[playerId],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });
      }

      // 7. Attendance
      if (sourceData.todayAttendance) {
        const todayStr = new Date().toISOString().split('T')[0];
        const ref = this.db.collection('attendance').doc(todayStr);
        batch.set(ref, {
          date: todayStr,
          records: sourceData.todayAttendance,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // 8. Announcements
      if (sourceData.messages && Array.isArray(sourceData.messages)) {
        sourceData.messages.forEach(msg => {
          const ref = this.db.collection('announcements').doc(String(msg.id));
          batch.set(ref, { ...msg, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 9. Files
      if (sourceData.files && Array.isArray(sourceData.files)) {
        sourceData.files.forEach(f => {
          const cleanF = { ...f };
          if (cleanF.url && (cleanF.url.startsWith('blob:') || cleanF.url.startsWith('data:video/'))) cleanF.url = '';
          const ref = this.db.collection('files').doc(String(f.id));
          batch.set(ref, { ...cleanF, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 10. Notifications
      if (sourceData.notifications && Array.isArray(sourceData.notifications)) {
        sourceData.notifications.forEach(n => {
          const ref = this.db.collection('notifications').doc(String(n.id));
          batch.set(ref, { ...n, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 11. Master State Doc
      const masterDoc = this.db.collection(this.masterCollection).doc(this.masterDocId);
      const cleanClone = this.cleanForCloud(sourceData);
      batch.set(masterDoc, {
        payload: cleanClone,
        seededAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: 'Admin Seeder'
      }, { merge: true });

      await batch.commit();

      console.log('✅ ALL 11 Database Collections populated in Firestore!');
      this.updateBadge('live', 'Live Sync Active');
      this.isConnected = true;

      if (typeof showToast === 'function') {
        showToast('🏆 11 கிளவுட் டேபிள்களும் Firebase-ல் வெற்றிகரமாக இணைக்கப்பட்டது!', 'ri-database-2-line');
      }
    } catch (error) {
      console.error('❌ Error seeding collections:', error);
      if (error.code === 'permission-denied') {
        this.updateBadge('warning', 'Rules Denied');
        if (typeof showToast === 'function') {
          showToast('Firebase Rules-ல் allow read, write: if true; அமைக்கவும்.', 'ri-alert-line');
        }
      } else {
        this.updateBadge('error', 'Seed Error');
      }
    }
  },

  // ----------------------------------------------------
  // 7. FIREBASE STORAGE MEDIA UPLOAD HELPER
  // ----------------------------------------------------
  async uploadFileToStorage(fileOrBlob, storagePath) {
    if (!this.storage) {
      console.warn('Firebase Storage not initialized, returning local data URL');
      return null;
    }

    try {
      this.updateBadge('syncing', 'Uploading Media...');
      const storageRef = this.storage.ref().child(storagePath);
      
      let snapshot;
      if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
        // Base64 data URL
        snapshot = await storageRef.putString(fileOrBlob, 'data_url');
      } else {
        // File or Blob
        snapshot = await storageRef.put(fileOrBlob);
      }

      const downloadUrl = await snapshot.ref.getDownloadURL();
      console.log('✅ Media uploaded to Firebase Storage:', downloadUrl);
      this.updateBadge('live', 'Live Sync Active');
      return downloadUrl;
    } catch (err) {
      console.error('❌ Firebase Storage Upload Error:', err);
      this.updateBadge('error', 'Upload Failed');
      return null;
    }
  },

  // ----------------------------------------------------
  // 8. MANUAL FORCE SYNC & UI BADGE
  // ----------------------------------------------------
  async forceSyncNow() {
    if (typeof appData !== 'undefined') {
      this.updateBadge('syncing', 'Syncing Cloud...');
      await this.uploadDataImmediately(appData);
      if (typeof showToast === 'function') {
        showToast('🔥 Firebase Live Cloud-ல் உடனடியாக புதுப்பிக்கப்பட்டது!', 'ri-cloud-line');
      }
    }
  },

  updateBadge(status, label) {
    const badge = document.getElementById('firebaseLiveBadge');
    if (!badge) return;

    badge.className = `firebase-live-badge status-${status}`;
    const dot = badge.querySelector('.fb-dot');
    const text = badge.querySelector('.fb-label');
    
    if (dot) {
      dot.className = `fb-dot ${status === 'live' ? 'pulse-green' : (status === 'syncing' ? 'spin-sync' : '')}`;
    }
    if (text) {
      text.textContent = label;
    }
  }
};

// Cleanup on beforeunload
window.addEventListener('beforeunload', () => {
  if (window.FirebaseSync && typeof window.FirebaseSync.unsubscribeAll === 'function') {
    window.FirebaseSync.unsubscribeAll();
  }
});

// Auto-boot Firebase Sync on window load
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.FirebaseSync.init();
  }, 250);
});
