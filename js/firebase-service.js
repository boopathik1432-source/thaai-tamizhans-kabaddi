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

  // All 13 Cloud Firestore Collections Schema
  collections: [
    { key: 'users', name: '👤 பயனர்கள் (Users)', col: 'users' },
    { key: 'players', name: '👥 வீரர்கள் (Players)', col: 'players' },
    { key: 'liveMatch', name: '⚡ நேரலை ஆடுகளம் (Live Scoreboard)', col: 'liveMatch' },
    { key: 'scheduledMatches', name: '🏆 போட்டி அட்டவணை (Scheduled Matches)', col: 'scheduledMatches' },
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

      // 1. Immediately force pull the freshest cloud snapshot on startup
      this.forcePullFromCloud();

      // 2. Start real-time listeners
      this.startAllRealtimeListeners();

      // 3. Automatic re-sync whenever mobile wakes up, unlocks, or user switches back to browser tab
      const handleVisibilityOrResume = () => {
        if (!document.hidden) {
          console.log('📱 App resumed / tab active: Checking cloud for fresh updates...');
          this.forcePullFromCloud();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityOrResume);
      window.addEventListener('focus', handleVisibilityOrResume);
      window.addEventListener('pageshow', handleVisibilityOrResume);

      // 4. Periodic background heartbeat every 20s to ensure mobile stays perfectly updated
      setInterval(() => {
        if (!document.hidden && this.isConnected) {
          this.forcePullFromCloud();
        }
      }, 20000);

    } catch (error) {
      console.error('❌ Firebase Init Error:', error);
      this.updateBadge('error', 'Init Error');
    }
  },

  // ----------------------------------------------------
  // 2. AUTHENTICATION (Coach & Player Anonymous Auth)
  // ----------------------------------------------------
  setupAuthListener() {
    if (!this.auth) return;
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      if (user) {
        console.log('👤 Firebase Auth active user:', user.uid);
      } else {
        // Auto sign in anonymously so Firestore security rules permit access
        this.auth.signInAnonymously().catch(e => {
          console.warn('Anonymous sign-in skipped (offline mode active):', e.message);
        });
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
        const userRef = this.db.collection('users').doc(user.uid);
        await userRef.set({
          uid: user.uid,
          name: sessionData.name || (role === 'coach' ? 'Coach Arun' : 'Player'),
          role: role,
          playerId: sessionData.playerId || null,
          phone: sessionData.phone || '',
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Auth session sync warning:', err.message);
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
    this.updateBadge('offline', 'Offline');
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
        this.updateBadge('live', 'Live Cloud Sync');

        if (doc.exists) {
          const remote = doc.data();
          if (remote && remote.payload) {
            let p = remote.payload;
            if (typeof p === 'string') {
              try { p = JSON.parse(p); } catch (err) {}
            }
            this.applyRemoteData(p);
          }
        } else {
          console.log('📝 Initial cloud document not found. Auto-seeding initial collections...');
          this.seedAll11Collections();
        }
      }, (err) => this.handleListenerError('master', err));
      this.unsubscribers.push(unsubMaster);
    } catch (e) {
      console.warn('Master listener error:', e);
    }

    // 2. Live Match Listener: liveMatch/current
    try {
      const unsubLiveMatch = this.db.collection('liveMatch').doc('current').onSnapshot((doc) => {
        if (doc.exists && typeof appData !== 'undefined') {
          const matchData = doc.data();
          if (!this.isRemoteUpdating && matchData && matchData.teamA && matchData.teamB) {
            // Update liveMatch state
            appData.liveMatch = matchData;
            this.saveQuietly();
            if (typeof currentView !== 'undefined' && currentView === 'live-scoreboard') {
              this.refreshActiveViews();
            }
          }
        }
      }, (err) => this.handleListenerError('liveMatch', err));
      this.unsubscribers.push(unsubLiveMatch);
    } catch (e) {}

    // 3. Scheduled Matches Collection: scheduledMatches/{id}
    try {
      const unsubSched = this.db.collection('scheduledMatches').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          if (!this.isRemoteUpdating && list.length > 0) {
            appData.scheduledMatches = list;
            this.saveQuietly();
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('scheduledMatches', err));
      this.unsubscribers.push(unsubSched);
    } catch (e) {}

    // 4. Players Collection: players/{playerId}
    try {
      const unsubPlayers = this.db.collection('players').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const players = [];
          snapshot.forEach(doc => players.push({ id: doc.id, ...doc.data() }));
          players.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
          if (!this.isRemoteUpdating && JSON.stringify(appData.players) !== JSON.stringify(players)) {
            appData.players = players;
            this.saveQuietly();
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('players', err));
      this.unsubscribers.push(unsubPlayers);
    } catch (e) {}

    // 5. Today Practice: todayPractice/current
    try {
      const unsubPractice = this.db.collection('todayPractice').doc('current').onSnapshot((doc) => {
        if (doc.exists && typeof appData !== 'undefined') {
          const data = doc.data();
          if (!this.isRemoteUpdating && data && data.title) {
            appData.todayPractice = data;
            this.saveQuietly();
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('todayPractice', err));
      this.unsubscribers.push(unsubPractice);
    } catch (e) {}

    // 6. Practice Calendar: practiceCalendar/{sessionId}
    try {
      const unsubCalendar = this.db.collection('practiceCalendar').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          if (!this.isRemoteUpdating && list.length > 0) {
            appData.practiceCalendar = list;
            this.saveQuietly();
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('practiceCalendar', err));
      this.unsubscribers.push(unsubCalendar);
    } catch (e) {}

    // 7. Match Notices: matchNotices/{noticeId}
    try {
      const unsubNotices = this.db.collection('matchNotices').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const notices = [];
          snapshot.forEach(doc => notices.push({ id: doc.id, ...doc.data() }));
          if (!this.isRemoteUpdating && notices.length > 0) {
            appData.matchNotices = notices;
            this.saveQuietly();
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('matchNotices', err));
      this.unsubscribers.push(unsubNotices);
    } catch (e) {}

    // 8. Instructions: instructions/{instructionId}
    try {
      const unsubInstructions = this.db.collection('instructions').onSnapshot((snapshot) => {
        if (!snapshot.empty && typeof appData !== 'undefined') {
          const list = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          if (!this.isRemoteUpdating && list.length > 0) {
            appData.instructions = list;
            this.saveQuietly();
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('instructions', err));
      this.unsubscribers.push(unsubInstructions);
    } catch (e) {}

    // 9. Performance Matrix: performance/{playerId}
    try {
      const unsubPerf = this.db.collection('performance').doc('ratings').onSnapshot((doc) => {
        if (doc.exists && typeof appData !== 'undefined') {
          const perfData = doc.data();
          if (!this.isRemoteUpdating && perfData) {
            delete perfData.updatedAt;
            appData.performance = perfData;
            this.saveQuietly();
            this.refreshActiveViews();
          }
        }
      }, (err) => this.handleListenerError('performance', err));
      this.unsubscribers.push(unsubPerf);
    } catch (e) {}

    // 10. Attendance: attendance/{dateString}
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
          this.saveQuietly();
          this.refreshActiveViews();
        }
      }, (err) => this.handleListenerError('attendance', err));
      this.unsubscribers.push(unsubAttendance);
    } catch (e) {}
  },

  unsubscribeAll() {
    this.unsubscribers.forEach(unsub => {
      try { if (typeof unsub === 'function') unsub(); } catch (e) {}
    });
    this.unsubscribers = [];
  },

  handleListenerError(name, error) {
    console.warn(`[Firebase] Listener error on [${name}]:`, error.message);
    if (error.code === 'permission-denied') {
      this.updateBadge('warning', 'Rules Denied');
    } else if (error.code === 'unavailable') {
      this.updateBadge('offline', 'Offline Mode');
    } else {
      this.updateBadge('connecting', 'Reconnecting...');
    }
  },

  // ----------------------------------------------------
  // 3.5 IMMEDIATE CLOUD PULL (Bypasses stale caches on mobile)
  // ----------------------------------------------------
  async forcePullFromCloud() {
    if (!this.db) return false;
    try {
      const masterRef = this.db.collection(this.masterCollection).doc(this.masterDocId);
      
      // Force get from server directly so mobile gets fresh cloud changes immediately
      let doc = null;
      try {
        doc = await masterRef.get({ source: 'server' });
      } catch (err) {
        doc = await masterRef.get();
      }

      if (doc && doc.exists) {
        const remote = doc.data();
        if (remote && remote.payload) {
          let p = remote.payload;
          if (typeof p === 'string') {
            try { p = JSON.parse(p); } catch (err) {}
          }
          this.applyRemoteData(p, true);
          this.isConnected = true;
          this.updateBadge('live', 'Live Cloud Sync');
          return true;
        }
      }
    } catch (e) {
      console.warn('forcePullFromCloud warning:', e.message);
    }
    return false;
  },

  // ----------------------------------------------------
  // 4. APPLY INCOMING REMOTE DATA (Atomic Master Doc)
  // ----------------------------------------------------
  applyRemoteData(remoteData, forceApply = false) {
    if (!remoteData || typeof remoteData !== 'object') return;
    if (typeof appData === 'undefined') return;

    this.isRemoteUpdating = true;
    try {
      let hasChanges = forceApply;

      // Check and update players
      if (Array.isArray(remoteData.players) && remoteData.players.length > 0) {
        if (forceApply || JSON.stringify(appData.players) !== JSON.stringify(remoteData.players)) {
          appData.players = remoteData.players;
          hasChanges = true;
        }
      }

      // Check and update liveMatch
      if (remoteData.liveMatch && typeof remoteData.liveMatch === 'object') {
        if (forceApply || JSON.stringify(appData.liveMatch) !== JSON.stringify(remoteData.liveMatch)) {
          appData.liveMatch = remoteData.liveMatch;
          hasChanges = true;
        }
      }

      // Check and update scheduledMatches
      if (Array.isArray(remoteData.scheduledMatches)) {
        if (forceApply || JSON.stringify(appData.scheduledMatches) !== JSON.stringify(remoteData.scheduledMatches)) {
          appData.scheduledMatches = remoteData.scheduledMatches;
          hasChanges = true;
        }
      }

      // Check and update todayPractice
      if (remoteData.todayPractice && typeof remoteData.todayPractice === 'object') {
        if (forceApply || JSON.stringify(appData.todayPractice) !== JSON.stringify(remoteData.todayPractice)) {
          appData.todayPractice = remoteData.todayPractice;
          hasChanges = true;
        }
      }

      // Check and update practiceCalendar
      if (Array.isArray(remoteData.practiceCalendar)) {
        if (forceApply || JSON.stringify(appData.practiceCalendar) !== JSON.stringify(remoteData.practiceCalendar)) {
          appData.practiceCalendar = remoteData.practiceCalendar;
          hasChanges = true;
        }
      }

      // Check and update instructions
      if (Array.isArray(remoteData.instructions)) {
        if (forceApply || JSON.stringify(appData.instructions) !== JSON.stringify(remoteData.instructions)) {
          appData.instructions = remoteData.instructions;
          hasChanges = true;
        }
      }

      // Check and update matchNotices
      if (Array.isArray(remoteData.matchNotices)) {
        if (forceApply || JSON.stringify(appData.matchNotices) !== JSON.stringify(remoteData.matchNotices)) {
          appData.matchNotices = remoteData.matchNotices;
          hasChanges = true;
        }
      }

      // Check and update attendance
      if (Array.isArray(remoteData.todayAttendance)) {
        if (forceApply || JSON.stringify(appData.todayAttendance) !== JSON.stringify(remoteData.todayAttendance)) {
          appData.todayAttendance = remoteData.todayAttendance;
          hasChanges = true;
        }
      }

      // Check and update performance
      if (remoteData.performance && typeof remoteData.performance === 'object') {
        if (forceApply || JSON.stringify(appData.performance) !== JSON.stringify(remoteData.performance)) {
          appData.performance = remoteData.performance;
          hasChanges = true;
        }
      }

      // Check and update messages / announcements
      if (Array.isArray(remoteData.messages)) {
        if (forceApply || JSON.stringify(appData.messages) !== JSON.stringify(remoteData.messages)) {
          appData.messages = remoteData.messages;
          hasChanges = true;
        }
      }

      // Check and update notifications
      if (Array.isArray(remoteData.notifications)) {
        if (forceApply || JSON.stringify(appData.notifications) !== JSON.stringify(remoteData.notifications)) {
          appData.notifications = remoteData.notifications;
          hasChanges = true;
        }
      }

      // Check and update coachProfile
      if (remoteData.coachProfile && typeof remoteData.coachProfile === 'object') {
        if (forceApply || JSON.stringify(appData.coachProfile) !== JSON.stringify(remoteData.coachProfile)) {
          appData.coachProfile = remoteData.coachProfile;
          hasChanges = true;
        }
      }

      // Save quietly to LocalStorage so tabs stay in sync
      if (hasChanges) {
        this.saveQuietly();
        this.refreshActiveViews();
        console.log('⚡ [Firebase Live] Remote state synchronized from cloud!');
      }
    } catch (err) {
      console.error('Error applying remote data:', err);
    } finally {
      setTimeout(() => {
        this.isRemoteUpdating = false;
      }, 400);
    }
  },

  saveQuietly() {
    try {
      const clone = JSON.parse(JSON.stringify(appData));
      clone._updatedAt = Date.now();
      const str = JSON.stringify(clone);
      localStorage.setItem('HOME_KABADDI_APP_DATA_TANGLISH_V2', str);
      localStorage.setItem('HOME_KABADDI_APP_DATA_TANGLISH_V1', str);
    } catch (e) {}
  },

  refreshActiveViews() {
    if (typeof renderAppShell === 'function') renderAppShell();
    if (typeof renderCurrentView === 'function') renderCurrentView();
    if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
    if (typeof renderNotifications === 'function') renderNotifications();
    if (typeof populatePlayerLoginDropdown === 'function') populatePlayerLoginDropdown();
  },

  // ----------------------------------------------------
  // 5. DEBOUNCED SYNC & AUTO-UPLOAD (All Collections)
  // ----------------------------------------------------
  scheduleSync(data) {
    if (this.isRemoteUpdating) return;
    if (!this.isInitialized || !this.db) return;

    // Guard: Only Coach or specific authorized action can overwrite the master squad state in the cloud.
    // If a player device opens, it must NEVER overwrite the cloud with old cached squad data!
    if (typeof appData !== 'undefined' && appData.activeRole === 'player') {
      return;
    }

    clearTimeout(this.debounceTimer);
    this.updateBadge('syncing', 'Syncing...');

    this.debounceTimer = setTimeout(() => {
      this.uploadDataImmediately(data);
    }, 450);
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

      // 2. Mirror into dedicated individual collections
      this.syncIndividualCollections(cleanClone);

      this.updateBadge('live', 'Live Cloud Sync');
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
      // Sync liveMatch
      if (data.liveMatch) {
        this.db.collection('liveMatch').doc('current').set({
          ...data.liveMatch,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }

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

      // Sync performance
      if (data.performance) {
        this.db.collection('performance').doc('ratings').set({
          ...data.performance,
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
  // 6. SEED INITIAL CLOUD FIRESTORE COLLECTIONS
  // ----------------------------------------------------
  async seedAll11Collections() {
    if (!this.db) return;

    try {
      this.updateBadge('syncing', 'Seeding Tables...');
      console.log('🚀 Seeding Cloud Firestore Collections...');

      const sourceData = (typeof appData !== 'undefined' && appData) ? appData : INITIAL_KABADDI_DATA;
      const batch = this.db.batch();

      // 1. Players
      if (sourceData.players && Array.isArray(sourceData.players)) {
        sourceData.players.forEach(p => {
          const ref = this.db.collection('players').doc(String(p.id));
          batch.set(ref, { ...p, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 2. Live Match
      if (sourceData.liveMatch) {
        const ref = this.db.collection('liveMatch').doc('current');
        batch.set(ref, { ...sourceData.liveMatch, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }

      // 3. Scheduled Matches
      if (sourceData.scheduledMatches && Array.isArray(sourceData.scheduledMatches)) {
        sourceData.scheduledMatches.forEach(m => {
          const ref = this.db.collection('scheduledMatches').doc(String(m.id));
          batch.set(ref, { ...m, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 4. Today Practice
      if (sourceData.todayPractice) {
        const ref = this.db.collection('todayPractice').doc('current');
        batch.set(ref, { ...sourceData.todayPractice, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }

      // 5. Practice Calendar
      if (sourceData.practiceCalendar && Array.isArray(sourceData.practiceCalendar)) {
        sourceData.practiceCalendar.forEach(item => {
          const ref = this.db.collection('practiceCalendar').doc(String(item.id));
          batch.set(ref, { ...item, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 6. Instructions
      if (sourceData.instructions && Array.isArray(sourceData.instructions)) {
        sourceData.instructions.forEach(ins => {
          const ref = this.db.collection('instructions').doc(String(ins.id));
          batch.set(ref, { ...ins, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 7. Match Notices
      if (sourceData.matchNotices && Array.isArray(sourceData.matchNotices)) {
        sourceData.matchNotices.forEach(notice => {
          const ref = this.db.collection('matchNotices').doc(String(notice.id));
          batch.set(ref, { ...notice, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 8. Performance
      if (sourceData.performance && typeof sourceData.performance === 'object') {
        const ref = this.db.collection('performance').doc('ratings');
        batch.set(ref, { ...sourceData.performance, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }

      // 9. Attendance
      if (sourceData.todayAttendance) {
        const todayStr = new Date().toISOString().split('T')[0];
        const ref = this.db.collection('attendance').doc(todayStr);
        batch.set(ref, {
          date: todayStr,
          records: sourceData.todayAttendance,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // 10. Announcements
      if (sourceData.messages && Array.isArray(sourceData.messages)) {
        sourceData.messages.forEach(msg => {
          const ref = this.db.collection('announcements').doc(String(msg.id));
          batch.set(ref, { ...msg, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 11. Files
      if (sourceData.files && Array.isArray(sourceData.files)) {
        sourceData.files.forEach(f => {
          const cleanF = { ...f };
          if (cleanF.url && (cleanF.url.startsWith('blob:') || cleanF.url.startsWith('data:video/'))) cleanF.url = '';
          const ref = this.db.collection('files').doc(String(f.id));
          batch.set(ref, { ...cleanF, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 12. Notifications
      if (sourceData.notifications && Array.isArray(sourceData.notifications)) {
        sourceData.notifications.forEach(n => {
          const ref = this.db.collection('notifications').doc(String(n.id));
          batch.set(ref, { ...n, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
      }

      // 13. Master State Document
      const masterDoc = this.db.collection(this.masterCollection).doc(this.masterDocId);
      const cleanClone = this.cleanForCloud(sourceData);
      batch.set(masterDoc, {
        payload: cleanClone,
        seededAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: 'System Auto-Seed'
      }, { merge: true });

      await batch.commit();
      this.updateBadge('live', 'Live Cloud Sync');
      console.log('✅ Initial Cloud Seeding completed successfully!');
    } catch (err) {
      console.warn('⚠️ Seeding error (offline fallback active):', err.message);
      this.updateBadge('offline', 'Offline Mode');
    }
  },

  forceSyncNow() {
    if (typeof appData !== 'undefined') {
      this.uploadDataImmediately(appData);
      if (typeof showToast === 'function') {
        showToast('Pushing latest squad data to Firebase Cloud...', 'ri-cloud-line');
      }
    }
  },

  // ----------------------------------------------------
  // 7. VISUAL BADGE UPDATER (Topbar Live Widget)
  // ----------------------------------------------------
  updateBadge(status, label) {
    const badge = document.getElementById('firebaseLiveBadge');
    if (!badge) return;

    badge.className = 'firebase-live-badge status-' + status;
    badge.innerHTML = `
      <span class="pulse-dot"></span>
      <span class="badge-label">${label || 'Cloud Sync'}</span>
    `;

    if (status === 'live') {
      badge.title = '🔥 Cloud Live Sync Active: Mobile & Laptop in Real-time Sync';
    } else if (status === 'syncing') {
      badge.title = '⚡ Syncing data with Cloud Firestore...';
    } else if (status === 'warning') {
      badge.title = '⚠️ Firestore Security Rules: Test mode / authentication required';
    } else {
      badge.title = '💾 Local Storage / Offline Mode Active';
    }
  }
};

// Auto-initialize when window loads or DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.FirebaseSync.init());
} else {
  setTimeout(() => window.FirebaseSync.init(), 100);
}
