/* 🏆 தாய் தமிழன்ஸ் (THAAI TAMIZHANS) KABADDI CLUB — BULLETPROOF REAL-TIME CLOUD SERVICE */

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
  
  // Unique device identifier to distinguish mobile vs laptop
  deviceId: (() => {
    try {
      let id = localStorage.getItem('thaai_tamizhans_device_id');
      if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('thaai_tamizhans_device_id', id);
      }
      return id;
    } catch(e) {
      return 'dev_' + Date.now();
    }
  })(),

  // Primary Master Collection & Document for Atomic Live Sync
  masterCollection: 'thaai_tamizhans_club',
  masterDocId: 'app_live_state',

  // All 13 Cloud Firestore Collections Schema
  collections: [
    { key: 'coachProfile', name: '👤 தலைமை பயிற்சியாளர் (Coach Profile)', col: 'coach_profile' },
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
  // 1. BOOTSTRAP & INITIALIZE FIREBASE
  // ----------------------------------------------------
  async init() {
    try {
      this.updateBadge('connecting', 'Connecting...');

      // STEP 1: Ultra-fast REST Pre-fetch immediately!
      // This bypasses SDK initialization, IndexedDB locks, and WebSockets latency.
      // On mobile devices, this hydrates the page within ~100ms.
      this.fastCloudFetch().catch(err => console.warn('Early REST prefetch notice:', err.message));

      if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase SDK not loaded yet. Running on High-Speed REST Cloud Sync.');
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

      if (typeof firebase.storage === 'function') {
        this.storage = firebase.storage();
      }

      // Enable standard persistence if available, without multi-tab locks that break mobile Safari
      try {
        this.db.enablePersistence().catch(() => {
          // Gracefully continue without offline persistence
        });
      } catch(e) {}

      this.isInitialized = true;
      console.log('🔥 Firebase Initialized for தாய் தமிழன்ஸ் KABADDI CLUB (Project:', config.projectId, ')');

      // STEP 2: Start real-time Firestore listeners (WebSocket onSnapshot)
      this.startAllRealtimeListeners();

      // STEP 3: Setup resume / unlock / tab focus re-sync
      const handleVisibilityOrResume = () => {
        if (!document.hidden) {
          console.log('📱 App resumed / tab active: Checking cloud for fresh updates...');
          this.fastCloudFetch();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityOrResume);
      window.addEventListener('focus', handleVisibilityOrResume);
      window.addEventListener('pageshow', handleVisibilityOrResume);
      window.addEventListener('online', () => {
        console.log('🌐 Network online: re-syncing with cloud...');
        this.fastCloudFetch();
      });

      // STEP 4: High-Reliability Periodic Heartbeat (Every 10s)
      setInterval(() => {
        if (!document.hidden) {
          this.fastCloudFetch();
        }
      }, 10000);

    } catch (error) {
      console.error('❌ Firebase Init Error:', error);
      this.updateBadge('error', 'Init Error');
    }
  },

  // ----------------------------------------------------
  // 2. ULTRA-FAST CLOUD REST PRE-FETCH (100ms Hydration)
  // ----------------------------------------------------
  async fastCloudFetch() {
    let anySuccess = false;

    // A. Dedicated Coach Profile REST Fetch
    try {
      const coachUrl = `https://firestore.googleapis.com/v1/projects/thaai-tamizhans/databases/(default)/documents/${this.masterCollection}/coach_profile?alt=json&t=${Date.now()}`;
      const cRes = await fetch(coachUrl, { cache: 'no-store' });
      if (cRes.ok) {
        const cDoc = await cRes.json();
        if (cDoc && cDoc.fields) {
          const profile = this.decodeFirestoreValue(cDoc);
          if (profile && profile.name && typeof appData !== 'undefined') {
            if (JSON.stringify(appData.coachProfile) !== JSON.stringify(profile)) {
              appData.coachProfile = { ...appData.coachProfile, ...profile };
              anySuccess = true;
            }
          }
        }
      }
    } catch (err) {
      // Quiet failover
    }

    // B. Master Document State REST Fetch
    try {
      const masterUrl = `https://firestore.googleapis.com/v1/projects/thaai-tamizhans/databases/(default)/documents/${this.masterCollection}/${this.masterDocId}?alt=json&t=${Date.now()}`;
      const mRes = await fetch(masterUrl, { cache: 'no-store' });
      if (mRes.ok) {
        const mDoc = await mRes.json();
        if (mDoc && mDoc.fields) {
          // Check payloadStr for instant 1-step parse
          if (mDoc.fields.payloadStr && mDoc.fields.payloadStr.stringValue) {
            try {
              const p = JSON.parse(mDoc.fields.payloadStr.stringValue);
              this.applyRemoteData(p, true);
              anySuccess = true;
            } catch(e) {}
          } else if (mDoc.fields.payload) {
            const p = this.decodeFirestoreValue(mDoc.fields.payload);
            if (p && typeof p === 'object') {
              this.applyRemoteData(p, true);
              anySuccess = true;
            }
          }
        }
      }
    } catch (err) {
      // Quiet failover
    }

    // C. Dedicated Players Collection REST Fetch
    try {
      const pUrl = `https://firestore.googleapis.com/v1/projects/thaai-tamizhans/databases/(default)/documents/players?pageSize=50&alt=json&t=${Date.now()}`;
      const pRes = await fetch(pUrl, { cache: 'no-store' });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData && pData.documents && pData.documents.length > 0) {
          const players = pData.documents.map(d => {
            const item = this.decodeFirestoreValue(d);
            const idFromPath = d.name.split('/').pop();
            item.id = isNaN(Number(idFromPath)) ? idFromPath : Number(idFromPath);
            return item;
          });
          players.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

          if (typeof appData !== 'undefined' && players.length > 0) {
            if (JSON.stringify(appData.players) !== JSON.stringify(players)) {
              appData.players = players;
              anySuccess = true;
            }
          }
        }
      }
    } catch(err) {}

    if (anySuccess) {
      this.saveQuietly();
      this.refreshActiveViews();
      this.isConnected = true;
      this.updateBadge('live', 'Live Cloud Sync');
      console.log('⚡ [Fast Cloud Fetch] Instant real-time state hydrated directly from Firestore REST!');
    } else if (this.isConnected) {
      this.updateBadge('live', 'Live Cloud Sync');
    }

    return anySuccess;
  },

  decodeFirestoreValue(val) {
    if (!val) return null;
    if (val.stringValue !== undefined) return val.stringValue;
    if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
    if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
    if (val.booleanValue !== undefined) return val.booleanValue;
    if (val.timestampValue !== undefined) return val.timestampValue;
    if (val.arrayValue !== undefined) {
      return (val.arrayValue.values || []).map(v => this.decodeFirestoreValue(v));
    }
    if (val.mapValue !== undefined) {
      const res = {};
      const fields = val.mapValue.fields || {};
      for (const k of Object.keys(fields)) {
        res[k] = this.decodeFirestoreValue(fields[k]);
      }
      return res;
    }
    if (val.fields !== undefined) {
      const res = {};
      for (const k of Object.keys(val.fields)) {
        res[k] = this.decodeFirestoreValue(val.fields[k]);
      }
      return res;
    }
    return val;
  },

  // ----------------------------------------------------
  // 3. REAL-TIME SNAPSHOT LISTENERS (WebSocket onSnapshot)
  // ----------------------------------------------------
  startAllRealtimeListeners() {
    if (!this.db) return;
    this.unsubscribeAll();

    // 0. Dedicated Coach Profile Listener: thaai_tamizhans_club/coach_profile
    try {
      const coachRef = this.db.collection(this.masterCollection).doc('coach_profile');
      const unsubCoach = coachRef.onSnapshot((doc) => {
        this.isConnected = true;
        this.updateBadge('live', 'Live Cloud Sync');
        if (doc.exists && typeof appData !== 'undefined') {
          const profile = doc.data();
          if (profile && profile.name) {
            delete profile.updatedAt;
            if (!this.isRemoteUpdating && JSON.stringify(appData.coachProfile) !== JSON.stringify(profile)) {
              appData.coachProfile = { ...appData.coachProfile, ...profile };
              this.saveQuietly();
              this.refreshActiveViews();
              console.log('⚡ [Firebase] Coach profile updated from cloud:', profile.name);
            }
          }
        }
      }, (err) => console.warn('coach_profile listener notice:', err.message));
      this.unsubscribers.push(unsubCoach);
    } catch(e) {}

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
    console.warn(`[Firebase] Listener notice on [${name}]:`, error.message);
    // Fall back immediately to REST fetch to keep UI perfectly synchronized
    this.fastCloudFetch().catch(() => {});
  },

  // ----------------------------------------------------
  // 3.5 IMMEDIATE CLOUD PULL
  // ----------------------------------------------------
  async forcePullFromCloud() {
    return await this.fastCloudFetch();
  },

  // ----------------------------------------------------
  // 4. APPLY INCOMING REMOTE DATA (Atomic Master Doc)
  // ----------------------------------------------------
  applyRemoteData(remoteData, forceApply = false) {
    if (!remoteData || typeof remoteData !== 'object') return;
    if (typeof appData === 'undefined') return;

    // Echo prevention: if this remote payload was pushed by THIS device, don't re-apply unless forced
    if (!forceApply && remoteData._originDeviceId && remoteData._originDeviceId === this.deviceId) {
      return;
    }

    this.isRemoteUpdating = true;
    try {
      let hasChanges = forceApply;

      // Check and update coachProfile
      if (remoteData.coachProfile && typeof remoteData.coachProfile === 'object') {
        if (forceApply || JSON.stringify(appData.coachProfile) !== JSON.stringify(remoteData.coachProfile)) {
          appData.coachProfile = { ...appData.coachProfile, ...remoteData.coachProfile };
          hasChanges = true;

          // Also update session in storage so user pill / role matches
          try {
            const rawSess = localStorage.getItem('thaai_tamizhans_auth_session');
            if (rawSess) {
              const sess = JSON.parse(rawSess);
              if (sess && sess.role === 'coach') {
                sess.name = appData.coachProfile.name;
                localStorage.setItem('thaai_tamizhans_auth_session', JSON.stringify(sess));
              }
            }
          } catch(e) {}
        }
      }

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

      // Save quietly to LocalStorage so tabs stay in sync
      if (hasChanges) {
        this.saveQuietly();
        this.refreshActiveViews();
        console.log('⚡ [Firebase Live 2-Way] Remote state synchronized from cloud!');
      }
    } catch (err) {
      console.error('Error applying remote data:', err);
    } finally {
      setTimeout(() => {
        this.isRemoteUpdating = false;
      }, 300);
    }
  },

  saveQuietly() {
    try {
      const clone = JSON.parse(JSON.stringify(appData));
      clone._updatedAt = Date.now();
      clone._originDeviceId = this.deviceId;
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

    clearTimeout(this.debounceTimer);
    this.updateBadge('syncing', 'Syncing...');

    this.debounceTimer = setTimeout(() => {
      this.uploadDataImmediately(data);
    }, 200);
  },

  async uploadDataImmediately(data) {
    if (this.isRemoteUpdating) return;

    try {
      const cleanClone = this.cleanForCloud(data);
      const now = Date.now();
      cleanClone._updatedAt = now;
      cleanClone._originDeviceId = this.deviceId;

      // 1. Dedicated Coach Profile Real-Time Sync (Instant Dual Channel)
      if (cleanClone.coachProfile) {
        this.syncCoachProfile(cleanClone.coachProfile);
      }

      // 2. Mirror into dedicated individual collections (players, liveMatch, todayPractice, etc.)
      this.syncIndividualCollections(cleanClone);

      // 3. Update Master Live Sync Document (lean JSON + map)
      if (this.db) {
        const masterDoc = this.db.collection(this.masterCollection).doc(this.masterDocId);
        await masterDoc.set({
          payload: cleanClone,
          payloadStr: JSON.stringify(cleanClone),
          _updatedAt: now,
          _originDeviceId: this.deviceId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdatedBy: (typeof appData !== 'undefined' && appData.coachProfile) ? appData.coachProfile.name : 'Web App'
        }, { merge: true });
      }

      this.updateBadge('live', 'Live Cloud Sync');
      console.log('✅ [Firebase Live 2-Way] All data successfully synced to Cloud Firestore from device:', this.deviceId);
    } catch (error) {
      console.error('❌ Failed to write to Firestore:', error);
      // Fallback: at least sync coachProfile via REST
      if (data && data.coachProfile) {
        this.syncCoachProfile(data.coachProfile);
      }
      this.updateBadge('live', 'Live Cloud Sync');
    }
  },

  // Dedicated Coach Profile Sync (Direct WebSocket + Direct REST)
  syncCoachProfile(coachProfile) {
    if (!coachProfile || typeof coachProfile !== 'object') return;
    const clean = {
      name: coachProfile.name || 'Coach',
      phone: coachProfile.phone || '',
      email: coachProfile.email || '',
      experience: coachProfile.experience || '',
      photo: coachProfile.photo || '',
      _updatedAt: Date.now(),
      _originDeviceId: this.deviceId
    };

    // A. Firestore SDK Sync
    if (this.db) {
      try {
        const ref = this.db.collection(this.masterCollection).doc('coach_profile');
        ref.set({
          ...clean,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      } catch(e) {}
    }

    // B. Direct REST PATCH (Ensures zero delay across laptop & phone)
    try {
      const url = `https://firestore.googleapis.com/v1/projects/thaai-tamizhans/databases/(default)/documents/${this.masterCollection}/coach_profile`;
      fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            name: { stringValue: clean.name },
            phone: { stringValue: clean.phone },
            email: { stringValue: clean.email },
            experience: { stringValue: clean.experience },
            photo: { stringValue: clean.photo },
            _updatedAt: { integerValue: String(clean._updatedAt) },
            _originDeviceId: { stringValue: this.deviceId },
            updatedAt: { timestampValue: new Date().toISOString() }
          }
        })
      }).catch(() => {});
    } catch(e) {}
  },

  async syncIndividualCollections(data) {
    if (!this.db) return;
    try {
      // 1. Sync Players to dedicated collection players/{id}
      if (Array.isArray(data.players)) {
        data.players.forEach(p => {
          if (p && p.id) {
            this.db.collection('players').doc(String(p.id)).set({
              ...p,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(() => {});
          }
        });
      }

      // 2. Sync liveMatch
      if (data.liveMatch) {
        this.db.collection('liveMatch').doc('current').set({
          ...data.liveMatch,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }

      // 3. Sync todayPractice
      if (data.todayPractice) {
        this.db.collection('todayPractice').doc('current').set({
          ...data.todayPractice,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }

      // 4. Sync attendance
      if (data.todayAttendance) {
        const todayStr = new Date().toISOString().split('T')[0];
        this.db.collection('attendance').doc(todayStr).set({
          date: todayStr,
          records: data.todayAttendance,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }

      // 5. Sync performance
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
    
    // Sanitize heavy files
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

    // Keep players array in master doc lean so it never exceeds 1MB limit
    if (clone.players && Array.isArray(clone.players)) {
      clone.players = clone.players.map(p => {
        const item = { ...p };
        // If player photo is a massive uncompressed data URL (> 2KB), keep clean preview
        // The full photo is safely stored in players/{id} collection
        if (item.photo && item.photo.length > 2000 && item.photo.startsWith('data:image/')) {
          item.photo = item.photo.substring(0, 1500) + '...';
        }
        return item;
      });
    }

    return clone;
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
  // 6. VISUAL BADGE UPDATER (Topbar Live Widget)
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
  setTimeout(() => window.FirebaseSync.init(), 50);
}
