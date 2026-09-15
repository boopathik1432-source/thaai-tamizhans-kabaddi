/* 🏆 தாய் தமிழன்ஸ் (THAAI TAMIZHANS) - MULTI-THEME & CRUD CONTROLLER */

// Global Error & Promise Boundaries for bulletproof stability
window.addEventListener('error', (event) => {
  console.warn('Recovered from global error event:', event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Recovered from unhandled promise rejection:', event.reason);
});

let appData = getAppData();
let currentView = localStorage.getItem('thaai_tamizhans_current_view') || 'coach-dashboard';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuth();
  renderAppShell();
  renderCurrentView();
  renderNotifications();
  setupGlobalPasteHandler();
});

// ----------------------------------------------------
// 0. AUTHENTICATION & LOGIN SCREEN SYSTEM
// ----------------------------------------------------
function initAuth() {
  populatePlayerLoginDropdown();
  
  const loginScreen = document.getElementById('loginScreen');
  let savedSession = localStorage.getItem('thaai_tamizhans_auth_session');
  const isExplicitLogout = localStorage.getItem('thaai_tamizhans_logged_out') === 'true';

  // Seamless auto-restore default coach session if not explicitly logged out
  if (!savedSession && !isExplicitLogout) {
    const defaultSession = {
      role: 'coach',
      name: (appData.coachProfile && appData.coachProfile.name) ? appData.coachProfile.name : 'Coach Arun',
      loginTime: Date.now()
    };
    try {
      localStorage.setItem('thaai_tamizhans_auth_session', JSON.stringify(defaultSession));
      savedSession = JSON.stringify(defaultSession);
    } catch(e) {}
  }

  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      if (session && session.role) {
        appData.activeRole = session.role;
        const savedView = localStorage.getItem('thaai_tamizhans_current_view');

        if (session.role === 'player' && session.playerId) {
          appData.activePlayerId = session.playerId;
        }
        if (savedView) {
          currentView = savedView;
        }

        if (loginScreen) {
          loginScreen.classList.add('hidden');
        }
        return;
      }
    } catch (e) {
      console.error('Session parse error:', e);
    }
  }

  // If explicit logout or invalid session, display Login Screen
  if (loginScreen) {
    loginScreen.classList.remove('hidden');
  }
}

function populatePlayerLoginDropdown() {
  const select = document.getElementById('playerLoginSelect');
  if (!select) return;

  select.innerHTML = (appData.players || []).map(p => `
    <option value="${p.id}" ${p.id === appData.activePlayerId ? 'selected' : ''}>
      ${p.name} (Jersey #${p.jersey} • ${p.position})
    </option>
  `).join('');
}

function switchLoginTab(role) {
  const tabCoach = document.getElementById('tabLoginCoach');
  const tabPlayer = document.getElementById('tabLoginPlayer');
  const formCoach = document.getElementById('formCoachLogin');
  const formPlayer = document.getElementById('formPlayerLogin');

  if (role === 'coach') {
    if (tabCoach) tabCoach.classList.add('active');
    if (tabPlayer) tabPlayer.classList.remove('active');
    if (formCoach) formCoach.style.display = 'block';
    if (formPlayer) formPlayer.style.display = 'none';
  } else {
    if (tabPlayer) tabPlayer.classList.add('active');
    if (tabCoach) tabCoach.classList.remove('active');
    if (formPlayer) formPlayer.style.display = 'block';
    if (formCoach) formCoach.style.display = 'none';
    populatePlayerLoginDropdown();
  }
}

function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (btnEl) btnEl.innerHTML = '<i class="ri-eye-off-line"></i>';
  } else {
    input.type = 'password';
    if (btnEl) btnEl.innerHTML = '<i class="ri-eye-line"></i>';
  }
}

function onPlayerLoginSelected(playerId) {
  // Can be used for custom player hints or avatar previews if needed
}

function handleAuthLogin(e, role) {
  if (e) e.preventDefault();

  const loginScreen = document.getElementById('loginScreen');

  if (role === 'coach') {
    const username = document.getElementById('coachLoginUsername')?.value.trim() || 'Coach Arun';
    const pin = document.getElementById('coachLoginPin')?.value.trim();

    if (pin && pin !== '1234' && pin.length < 3) {
      showToast('⚠️ Please enter valid 4-digit PIN (default: 1234)', 'ri-error-warning-line');
      return;
    }

    const sessionData = {
      role: 'coach',
      name: username,
      loginTime: Date.now()
    };
    localStorage.setItem('thaai_tamizhans_auth_session', JSON.stringify(sessionData));
    localStorage.removeItem('thaai_tamizhans_logged_out');

    if (loginScreen) loginScreen.classList.add('hidden');
    switchRole('coach');
    showToast(`🎉 Welcome back, ${username}! (தலைமை பயிற்சியாளர்)`);
  } else {
    const playerSelect = document.getElementById('playerLoginSelect');
    const playerId = parseInt(playerSelect ? playerSelect.value : (appData.players[0] ? appData.players[0].id : 1));
    const player = appData.players.find(p => p.id === playerId) || appData.players[0];
    const pin = document.getElementById('playerLoginPin')?.value.trim();

    if (pin && pin !== '1234' && pin.length < 3) {
      showToast('⚠️ Please enter valid 4-digit PIN (default: 1234)', 'ri-error-warning-line');
      return;
    }

    const sessionData = {
      role: 'player',
      playerId: player.id,
      name: player.name,
      jersey: player.jersey,
      loginTime: Date.now()
    };
    localStorage.setItem('thaai_tamizhans_auth_session', JSON.stringify(sessionData));
    localStorage.removeItem('thaai_tamizhans_logged_out');

    appData.activePlayerId = player.id;
    if (loginScreen) loginScreen.classList.add('hidden');
    switchRole('player');
    showToast(`🎉 Welcome, ${player.name} (Jersey #${player.jersey})!`);
  }
}

function quickLogin(role, targetPlayerId) {
  const loginScreen = document.getElementById('loginScreen');

  if (role === 'coach') {
    const sessionData = {
      role: 'coach',
      name: 'Coach Arun',
      loginTime: Date.now()
    };
    localStorage.setItem('thaai_tamizhans_auth_session', JSON.stringify(sessionData));
    localStorage.removeItem('thaai_tamizhans_logged_out');

    if (loginScreen) loginScreen.classList.add('hidden');
    switchRole('coach');
    showToast('⚡ Quick Login Successful: Logged in as Head Coach Arun!');
  } else {
    let player = appData.players.find(p => p.id === targetPlayerId);
    if (!player) {
      player = appData.players[0];
    }

    const sessionData = {
      role: 'player',
      playerId: player.id,
      name: player.name,
      jersey: player.jersey,
      loginTime: Date.now()
    };
    localStorage.setItem('thaai_tamizhans_auth_session', JSON.stringify(sessionData));
    localStorage.removeItem('thaai_tamizhans_logged_out');

    appData.activePlayerId = player.id;
    if (loginScreen) loginScreen.classList.add('hidden');
    switchRole('player');
    showToast(`⚡ Quick Login: Welcome, ${player.name} (Jersey #${player.jersey})!`);
  }
}

function handleUserLogout() {
  if (confirm('Are you sure you want to log out from தாய் தமிழன்ஸ் Portal?')) {
    localStorage.removeItem('thaai_tamizhans_auth_session');
    localStorage.setItem('thaai_tamizhans_logged_out', 'true');
    
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.classList.remove('hidden');
      switchLoginTab(appData.activeRole || 'coach');
      populatePlayerLoginDropdown();
    }
    showToast('👋 Logged out successfully! Sign in to continue.', 'ri-logout-circle-line');
  }
}

// ----------------------------------------------------
// THEME SWITCHER LOGIC (2 CLASSIC + 7 3D KABADDI THEMES)
// ----------------------------------------------------
const VALID_THEMES = [
  'cyber-neon', 
  'royal-gold', 
  '3d-kabaddi-arena', 
  '3d-super-raider', 
  '3d-tackle-shield',
  '3d-frog-jump',
  '3d-thigh-hold',
  '3d-toe-touch',
  '3d-thalaivas-roar'
];

function initTheme() {
  let savedTheme = localStorage.getItem('thaai_tamizhans_theme') || '3d-kabaddi-arena';
  if (!VALID_THEMES.includes(savedTheme)) {
    savedTheme = '3d-kabaddi-arena';
  }
  setAppTheme(savedTheme, false);
}

function setAppTheme(themeName, showToastMsg = true) {
  if (!VALID_THEMES.includes(themeName)) {
    themeName = '3d-kabaddi-arena';
  }

  document.documentElement.setAttribute('data-theme', themeName);
  document.body.setAttribute('data-theme', themeName);
  localStorage.setItem('thaai_tamizhans_theme', themeName);
  
  const labels = {
    'cyber-neon': '💎 Cyber Neon Glass',
    'royal-gold': '👑 Royal Tamizhan Gold',
    '3d-kabaddi-arena': '🔥 3D Pro Kabaddi Arena',
    '3d-super-raider': '⚡ 3D Super Raider Lightning',
    '3d-tackle-shield': '🛡️ 3D Ankle Lock Defence',
    '3d-frog-jump': '🦘 3D Frog Jump Super Raid',
    '3d-thigh-hold': '🦵 3D Thigh Hold Iron Grip',
    '3d-toe-touch': '🎯 3D Toe Touch Laser Raid',
    '3d-thalaivas-roar': '🦁 3D Tamil Thalaivas Mass'
  };
  
  const labelEl = document.getElementById('activeThemeLabel');
  if (labelEl) {
    labelEl.innerText = labels[themeName] || '🔥 3D Pro Kabaddi Arena';
  }

  // Switch Real-time 3D Scene Engine
  switch3DThemeScene(themeName);

  const menu = document.getElementById('themeMenu');
  if (menu) menu.classList.remove('active');
  
  if (currentView === 'settings') {
    renderCurrentView();
  }

  if (showToastMsg) {
    showToast(`Theme changed to ${labels[themeName] || themeName}!`, 'ri-palette-fill');
  }
}

// ====================================================
// 🚀 REAL-TIME 3D ANIMATION ENGINE (CANVAS 60FPS)
// ====================================================
let scene3D = {
  canvas: null,
  ctx: null,
  animId: null,
  theme: null,
  width: 0,
  height: 0,
  time: 0,
  // 1. Kabaddi Arena
  arenaSparks: [],
  // 2. Super Raider
  raiderStreaks: [],
  raiderShockwaves: [],
  lightningArcs: [],
  lastRaidStrike: 0,
  // 3. Tackle Shield
  hexNodes: [],
  defenceChains: [],
  // 4. Frog Jump Super Raid
  frogShockwaves: [],
  frogSpeedLines: [],
  // 5. Thigh Hold Iron Grip
  thighSparks: [],
  fissureCracks: [],
  // 6. Toe Touch Laser Raid
  toeLasers: [],
  targetFlashes: [],
  lastToeStrike: 0,
  // 7. Tamil Thalaivas Mass
  thalaivaStrobes: [],
  thalaivaGoldDust: []
};

let scene3DInitialized = false;

function init3DSceneEngine() {
  if (scene3DInitialized && scene3D.canvas) return;
  scene3D.canvas = document.getElementById('canvas3DScene');
  if (!scene3D.canvas) return;
  scene3D.ctx = scene3D.canvas.getContext('2d');
  scene3DInitialized = true;
  
  let resizeTimeout;
  function resize() {
    if (!scene3D.canvas) return;
    scene3D.width = scene3D.canvas.width = window.innerWidth;
    scene3D.height = scene3D.canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 100);
  });
  resize();

  // Handle Tab Visibility Changes to prevent background CPU/memory drain
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (scene3D.animId) {
        cancelAnimationFrame(scene3D.animId);
        scene3D.animId = null;
      }
    } else {
      if (scene3D.theme && scene3D.theme.startsWith('3d-') && !scene3D.animId) {
        switch3DThemeScene(scene3D.theme);
      }
    }
  });

  const w = scene3D.width || window.innerWidth;
  const h = scene3D.height || window.innerHeight;

  // 1. Kabaddi Arena 3D Embers & Sparks
  scene3D.arenaSparks = [];
  for (let i = 0; i < 90; i++) {
    scene3D.arenaSparks.push({
      x: (Math.random() - 0.5) * 1600,
      y: Math.random() * 800,
      z: Math.random() * 800 + 100,
      vy: Math.random() * 1.5 + 0.8,
      vx: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 3 + 1.5,
      alpha: Math.random() * 0.8 + 0.2
    });
  }

  // 2. Super Raider 3D Velocity Streaks
  scene3D.raiderStreaks = [];
  for (let i = 0; i < 110; i++) {
    scene3D.raiderStreaks.push({
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 1200 + (h * 0.15),
      z: Math.random() * 1000 + 1,
      speed: Math.random() * 22 + 18,
      color: Math.random() > 0.4 ? '#00f0ff' : (Math.random() > 0.5 ? '#8b5cf6' : '#00ff88')
    });
  }
  scene3D.raiderShockwaves = [];

  // 3. Tackle Shield Hexagonal Nodes & Links
  scene3D.hexNodes = [];
  const rows = 5, cols = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      scene3D.hexNodes.push({
        gridX: (c - cols / 2) * 180 + (r % 2 === 0 ? 90 : 0),
        gridY: (r - rows / 2) * 130,
        baseZ: 400 + r * 100,
        phase: (r * 0.8 + c * 0.6)
      });
    }
  }

  // 4. Frog Jump Airborne Velocity Streaks & Shockwaves
  scene3D.frogSpeedLines = [];
  for (let i = 0; i < 90; i++) {
    scene3D.frogSpeedLines.push({
      x: (Math.random() - 0.5) * 1600,
      y: Math.random() * 800,
      z: Math.random() * 800 + 50,
      speed: Math.random() * 16 + 12,
      color: Math.random() > 0.4 ? '#00ff88' : '#facc15'
    });
  }
  scene3D.frogShockwaves = [];

  // 5. Thigh Hold Fissure Sparks
  scene3D.thighSparks = [];
  for (let i = 0; i < 100; i++) {
    scene3D.thighSparks.push({
      x: (Math.random() - 0.5) * 1400,
      y: Math.random() * 800,
      z: Math.random() * 700 + 50,
      vy: -(Math.random() * 2 + 1),
      vx: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 3 + 1.2,
      color: Math.random() > 0.4 ? '#ff4500' : (Math.random() > 0.3 ? '#ff7700' : '#dc2626')
    });
  }

  // 6. Toe Touch Laser Reticles & Sparks
  scene3D.targetFlashes = [];
  scene3D.toeLasers = [];

  // 7. Tamil Thalaivas Gold & Royal Blue Dust
  scene3D.thalaivaGoldDust = [];
  for (let i = 0; i < 110; i++) {
    scene3D.thalaivaGoldDust.push({
      x: (Math.random() - 0.5) * 1600,
      y: Math.random() * 900,
      z: Math.random() * 800 + 50,
      vy: Math.random() * 1.4 + 0.6,
      vx: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 3 + 1.5,
      color: Math.random() > 0.45 ? '#ffd700' : (Math.random() > 0.5 ? '#2563eb' : '#ff6b00')
    });
  }
}

function switch3DThemeScene(themeName) {
  if (!scene3D.canvas) {
    init3DSceneEngine();
  }
  if (scene3D.canvas) {
    scene3D.width = scene3D.canvas.width = window.innerWidth;
    scene3D.height = scene3D.canvas.height = window.innerHeight;
  }
  
  scene3D.theme = themeName;
  if (scene3D.animId) {
    cancelAnimationFrame(scene3D.animId);
    scene3D.animId = null;
  }

  if (!themeName || !themeName.startsWith('3d-')) {
    if (scene3D.ctx && scene3D.width) {
      scene3D.ctx.clearRect(0, 0, scene3D.width, scene3D.height);
    }
    return;
  }

  // If tab is currently hidden, don't start RAF until tab is active again
  if (document.hidden) return;

  // Start 60fps render loop
  function loop() {
    scene3D.time += 0.016;
    renderCurrent3DScene();
    scene3D.animId = requestAnimationFrame(loop);
  }
  scene3D.animId = requestAnimationFrame(loop);
}

function renderCurrent3DScene() {
  const ctx = scene3D.ctx;
  const w = scene3D.width;
  const h = scene3D.height;
  if (!ctx || !w || !h) return;

  ctx.clearRect(0, 0, w, h);

  if (scene3D.theme === '3d-kabaddi-arena') {
    render3DKabaddiArena(ctx, w, h);
  } else if (scene3D.theme === '3d-super-raider') {
    render3DSuperRaider(ctx, w, h);
  } else if (scene3D.theme === '3d-tackle-shield') {
    render3DTackleShield(ctx, w, h);
  } else if (scene3D.theme === '3d-frog-jump') {
    render3DFrogJump(ctx, w, h);
  } else if (scene3D.theme === '3d-thigh-hold') {
    render3DThighHold(ctx, w, h);
  } else if (scene3D.theme === '3d-toe-touch') {
    render3DToeTouch(ctx, w, h);
  } else if (scene3D.theme === '3d-thalaivas-roar') {
    render3DThalaivasRoar(ctx, w, h);
  }
}

// 1. 🔥 3D PRO KABADDI ARENA (Perspective Court, Glowing Baulk/Bonus Lines, Arena Dust Embers & Stadium Floodlights)
function render3DKabaddiArena(ctx, w, h) {
  const cx = w / 2;
  const horizonY = h * 0.26;
  const t = scene3D.time;

  // Stadium Ambient Floodlight Cones from Top
  ctx.save();
  const floodlights = [
    { x: w * 0.15, angle: Math.sin(t * 0.7) * 0.22 + 0.35, color: 'rgba(255, 140, 0, 0.18)' },
    { x: w * 0.85, angle: -Math.sin(t * 0.7 + 1) * 0.22 - 0.35, color: 'rgba(255, 183, 0, 0.18)' },
    { x: cx, angle: Math.sin(t * 1.1) * 0.15, color: 'rgba(255, 85, 0, 0.15)' }
  ];

  floodlights.forEach(fl => {
    ctx.save();
    ctx.translate(fl.x, 0);
    ctx.rotate(fl.angle);
    const grad = ctx.createRadialGradient(0, 0, 10, 0, h * 0.9, w * 0.5);
    grad.addColorStop(0, fl.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-70, 0);
    ctx.lineTo(70, 0);
    ctx.lineTo(w * 0.5, h * 1.3);
    ctx.lineTo(-w * 0.5, h * 1.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();

  // Perspective 3D Kabaddi Court
  ctx.save();
  const maxCourtWidth = Math.min(w * 1.1, 1400);

  // 1. Ground Mat Floor Polygon
  const topW = maxCourtWidth * 0.32;
  const botW = maxCourtWidth * 0.96;
  const topY = horizonY;
  const botY = h;

  const matGrad = ctx.createLinearGradient(cx, topY, cx, botY);
  matGrad.addColorStop(0, 'rgba(255, 85, 0, 0.04)');
  matGrad.addColorStop(0.5, 'rgba(255, 50, 0, 0.12)');
  matGrad.addColorStop(1, 'rgba(255, 85, 0, 0.04)');

  ctx.fillStyle = matGrad;
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, topY);
  ctx.lineTo(cx + topW / 2, topY);
  ctx.lineTo(cx + botW / 2, botY);
  ctx.lineTo(cx - botW / 2, botY);
  ctx.closePath();
  ctx.fill();

  // 2. Longitudinal Lines (Outer Boundaries, Lobbies, Midline)
  const ratios = [-1.0, -0.7, 0, 0.7, 1.0];
  ratios.forEach((r, idx) => {
    const isEdge = idx === 0 || idx === ratios.length - 1;
    const isMid = idx === 2;

    ctx.beginPath();
    ctx.strokeStyle = isMid ? 'rgba(255, 183, 0, 0.65)' : (isEdge ? 'rgba(255, 85, 0, 0.55)' : 'rgba(255, 140, 0, 0.32)');
    ctx.lineWidth = isEdge || isMid ? 2.2 : 1.4;
    if (isMid || isEdge) {
      ctx.shadowColor = '#ff5500';
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.moveTo(cx + (topW / 2) * r, topY);
    ctx.lineTo(cx + (botW / 2) * r, botY);
    ctx.stroke();
  });

  // 3. Transverse Court Lines (Baulk Line, Bonus Line, Midline)
  const transverseLines = [
    { pos: 0.18, name: 'Midline', color: 'rgba(255, 140, 0, 0.45)', width: 1.6, blur: 4 },
    { pos: 0.45, name: 'Baulk Line', color: 'rgba(255, 183, 0, 0.95)', width: 3.2, blur: 20, pulse: true },
    { pos: 0.72, name: 'Bonus Line', color: 'rgba(255, 85, 0, 0.95)', width: 3.0, blur: 18 },
    { pos: 0.94, name: 'End Line', color: 'rgba(255, 140, 0, 0.55)', width: 2.0, blur: 6 }
  ];

  transverseLines.forEach(line => {
    const py = topY + (botY - topY) * line.pos;
    const currentW = topW + (botW - topW) * line.pos;
    const leftX = cx - currentW / 2;
    const rightX = cx + currentW / 2;

    ctx.beginPath();
    if (line.pulse) {
      const glow = Math.sin(t * 3.5) * 0.25 + 0.75;
      ctx.strokeStyle = `rgba(255, 183, 0, ${glow})`;
      ctx.shadowColor = '#ffb700';
      ctx.shadowBlur = line.blur * glow;
    } else {
      ctx.strokeStyle = line.color;
      ctx.shadowColor = '#ff5500';
      ctx.shadowBlur = line.blur;
    }

    ctx.lineWidth = line.width;
    ctx.moveTo(leftX, py);
    ctx.lineTo(rightX, py);
    ctx.stroke();
  });
  ctx.restore();

  // Floating 3D Golden Arena Sand Embers
  ctx.save();
  scene3D.arenaSparks.forEach(sp => {
    sp.y -= sp.vy;
    sp.x += sp.vx + Math.sin(t * 1.5 + sp.z) * 0.6;

    if (sp.y < 0) {
      sp.y = h;
      sp.x = (Math.random() - 0.5) * w * 1.2;
    }

    const py = sp.y;
    const px = cx + sp.x;

    if (px < 0 || px > w || py < 0 || py > h) return;

    const alpha = Math.min(0.9, sp.alpha * (sp.y / h));
    ctx.fillStyle = `rgba(255, ${Math.floor(130 + alpha * 120)}, 0, ${alpha})`;
    ctx.shadowColor = '#ffb700';
    ctx.shadowBlur = sp.size * 3;
    ctx.beginPath();
    ctx.arc(px, py, sp.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// 2. ⚡ 3D SUPER RAIDER LIGHTNING (3D High-Velocity Raid Streaks & Explosive Ground Toe-Touch Shockwaves)
function render3DSuperRaider(ctx, w, h) {
  const cx = w / 2;
  const cy = h * 0.35;
  const t = scene3D.time;

  // Trigger Raider Shockwave Step periodically
  if (t - scene3D.lastRaidStrike > 1.4) {
    scene3D.lastRaidStrike = t;
    const groundX = (Math.random() - 0.5) * (w * 0.7) + cx;
    scene3D.raiderShockwaves.push({
      x: groundX,
      y: h * 0.78 + (Math.random() - 0.5) * 80,
      r: 10,
      maxR: Math.random() * 180 + 140,
      alpha: 1,
      col: Math.random() > 0.5 ? '#00f0ff' : '#8b5cf6'
    });
  }

  // 3D Velocity Raid Streaks Zooming towards viewer
  ctx.save();
  ctx.lineCap = 'round';
  scene3D.raiderStreaks.forEach(s => {
    s.z -= s.speed;
    if (s.z <= 1) {
      s.z = 1000;
      s.x = (Math.random() - 0.5) * 1800;
      s.y = (Math.random() - 0.5) * 1000;
    }

    const fov = 400;
    const k = fov / s.z;
    const px = cx + s.x * k;
    const py = cy + s.y * k + (h * 0.15);

    const prevK = fov / (s.z + s.speed * 2.5);
    const ppx = cx + s.x * prevK;
    const ppy = cy + s.y * prevK + (h * 0.15);

    if (px < -100 || px > w + 100 || py < -100 || py > h + 100) {
      s.z = 1000;
      return;
    }

    const alpha = Math.min(0.95, (1 - s.z / 1000) * 1.5);
    const width = Math.max(1.5, (1 - s.z / 1000) * 4.5);

    ctx.strokeStyle = s.color;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 14;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(ppx, ppy);
    ctx.lineTo(px, py);
    ctx.stroke();
  });
  ctx.restore();

  // Expanding Ground Toe-Touch Shockwaves
  ctx.save();
  for (let i = scene3D.raiderShockwaves.length - 1; i >= 0; i--) {
    const sw = scene3D.raiderShockwaves[i];
    sw.r += 5;
    sw.alpha -= 0.028;

    if (sw.alpha <= 0 || sw.r >= sw.maxR) {
      scene3D.raiderShockwaves.splice(i, 1);
      continue;
    }

    ctx.strokeStyle = sw.col;
    ctx.shadowColor = sw.col;
    ctx.shadowBlur = 24;
    ctx.lineWidth = 3.2;
    ctx.globalAlpha = sw.alpha;

    ctx.beginPath();
    ctx.ellipse(sw.x, sw.y, sw.r * 2.2, sw.r * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Dynamic Electric Lightning Arcs
  if (Math.sin(t * 7) > 0.8) {
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 28;
    ctx.lineWidth = 2.8;

    const startX = Math.random() > 0.5 ? 60 : w - 60;
    const startY = Math.random() * (h * 0.35);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let lx = startX, ly = startY;
    for (let seg = 0; seg < 6; seg++) {
      lx += (Math.random() - 0.5) * 90 + (startX < cx ? 45 : -45);
      ly += Math.random() * 70 + 20;
      ctx.lineTo(lx, ly);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// 3. 🛡️ 3D ANKLE LOCK DEFENCE (3D Hexagonal Defence Energy Grid, Chain Tackle Laser Beams & Trophy Constellation)
function render3DTackleShield(ctx, w, h) {
  const cx = w / 2;
  const cy = h * 0.46;
  const fov = 420;
  const t = scene3D.time;

  // 3D Hexagonal Defence Fortress Surface
  ctx.save();
  const projectedNodes = [];
  scene3D.hexNodes.forEach(node => {
    const waveY = Math.sin(t * 2.2 + node.phase) * 40;
    const z = node.baseZ + Math.cos(t * 1.8 + node.phase) * 70;
    const k = fov / z;

    const px = cx + node.gridX * k;
    const py = cy + (node.gridY + waveY) * k + 80 * k;

    if (px > -100 && px < w + 100 && py > -100 && py < h + 100) {
      projectedNodes.push({ px, py, z, k });

      // Draw glowing defense nodes
      const alpha = Math.min(0.9, (1 - z / 1000) * 1.3);
      ctx.fillStyle = 'rgba(0, 255, 136, ' + alpha + ')';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2.5, 5 * k), 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Connect Interlocking Defence Chain Links
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.35)';
  ctx.lineWidth = 1.6;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 8;
  for (let i = 0; i < projectedNodes.length; i++) {
    for (let j = i + 1; j < projectedNodes.length; j++) {
      const dx = projectedNodes[i].px - projectedNodes[j].px;
      const dy = projectedNodes[i].py - projectedNodes[j].py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        ctx.beginPath();
        ctx.moveTo(projectedNodes[i].px, projectedNodes[i].py);
        ctx.lineTo(projectedNodes[j].px, projectedNodes[j].py);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // Central Holographic Defence Shield Aura
  ctx.save();
  const shieldR = 100 + Math.sin(t * 3) * 12;
  ctx.translate(cx, cy - 50);
  ctx.rotate(t * 0.35);

  // Hexagon Outline
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const hx = Math.cos(a) * shieldR;
    const hy = Math.sin(a) * shieldR;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
  ctx.lineWidth = 2.8;
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 30;
  ctx.stroke();

  // Inner Rotating Star
  ctx.rotate(-t * 0.7);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const inA = a + Math.PI / 6;
    const ox = Math.cos(a) * (shieldR * 0.65);
    const oy = Math.sin(a) * (shieldR * 0.65);
    const ix = Math.cos(inA) * (shieldR * 0.32);
    const iy = Math.sin(inA) * (shieldR * 0.32);
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.9)';
  ctx.lineWidth = 2.2;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.restore();
}

// 4. 🦘 3D FROG JUMP SUPER RAID (Airborne Jump Trajectory Arc, Defender Chain & Ground Impact Shockwaves)
function render3DFrogJump(ctx, w, h) {
  const cx = w / 2;
  const horizonY = h * 0.28;
  const fov = 460;
  const t = scene3D.time;

  // 1. Perspective 3D Mat Floor
  ctx.save();
  const matTopW = w * 0.36;
  const matBotW = w * 0.95;
  const matGrad = ctx.createLinearGradient(cx, horizonY, cx, h);
  matGrad.addColorStop(0, 'rgba(0, 255, 136, 0.05)');
  matGrad.addColorStop(0.6, 'rgba(250, 204, 21, 0.12)');
  matGrad.addColorStop(1, 'rgba(0, 255, 136, 0.04)');

  ctx.fillStyle = matGrad;
  ctx.beginPath();
  ctx.moveTo(cx - matTopW / 2, horizonY);
  ctx.lineTo(cx + matTopW / 2, horizonY);
  ctx.lineTo(cx + matBotW / 2, h);
  ctx.lineTo(cx - matBotW / 2, h);
  ctx.closePath();
  ctx.fill();

  // Court Lines (Baulk & Bonus Lines)
  const courtLines = [0.45, 0.65, 0.85];
  courtLines.forEach((frac, idx) => {
    const ly = horizonY + (h - horizonY) * frac;
    const lw = matTopW + (matBotW - matTopW) * frac;
    ctx.strokeStyle = idx === 1 ? 'rgba(250, 204, 21, 0.7)' : 'rgba(0, 255, 136, 0.5)';
    ctx.lineWidth = idx === 1 ? 2.5 : 1.5;
    ctx.shadowColor = idx === 1 ? '#facc15' : '#00ff88';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx - lw / 2, ly);
    ctx.lineTo(cx + lw / 2, ly);
    ctx.stroke();
  });
  ctx.restore();

  // 2. High-speed Aerodynamic Jump Wind Streaks
  ctx.save();
  scene3D.frogSpeedLines.forEach(l => {
    l.y += l.speed;
    l.z -= 1.2;
    if (l.y > h + 50) { l.y = -50; l.x = (Math.random() - 0.5) * 1600; }
    if (l.z <= 10) l.z = 800;

    const k = fov / l.z;
    const px = cx + l.x * k;
    const py = horizonY + (l.y - horizonY) * k;

    if (px > 0 && px < w && py > 0 && py < h) {
      const alpha = Math.min(0.85, (1 - l.z / 850) * 1.2);
      ctx.strokeStyle = l.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.8 * k;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py + 24 * k);
      ctx.stroke();
    }
  });
  ctx.restore();

  // 3. Defender Chain Tackle Silhouette on Mat
  ctx.save();
  const chainY = horizonY + (h - horizonY) * 0.58;
  const chainW = matTopW + (matBotW - matTopW) * 0.58;
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  for (let d = -3; d <= 3; d++) {
    const dx = cx + (d / 3.5) * (chainW * 0.45);
    const dy = chainY + Math.sin(t * 3 + d) * 6;
    ctx.arc(dx, dy, 7, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.restore();

  // 4. 🦘 High Airborne Frog Jump Arc Animation
  ctx.save();
  const jumpCycle = (t * 1.2) % 2.5; // 2.5s cycle
  const jumpNorm = Math.min(1, jumpCycle / 1.8);
  const startJumpX = cx - chainW * 0.4;
  const endJumpX = cx + chainW * 0.4;
  const currentJumpX = startJumpX + (endJumpX - startJumpX) * jumpNorm;
  
  // Parabolic Elevation Jump Arc (High in air over defenders)
  const jumpHeight = Math.sin(jumpNorm * Math.PI) * 160;
  const currentJumpY = chainY - jumpHeight + 20;

  // Draw Jump Trajectory Glow Arc
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.moveTo(startJumpX, chainY + 20);
  ctx.quadraticCurveTo(cx, chainY - 160, endJumpX, chainY + 20);
  ctx.stroke();
  ctx.setLineDash([]);

  // Glowing Airborne Super Raider
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(currentJumpX, currentJumpY, 9, 0, Math.PI * 2);
  ctx.fill();

  // Golden Airborne Energy Aura
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(currentJumpX, currentJumpY, 16 + Math.sin(t * 6) * 3, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Landing Ground Zero Impact Shockwaves
  if (jumpNorm > 0.9) {
    if (scene3D.frogShockwaves.length < 2) {
      scene3D.frogShockwaves.push({ r: 5, alpha: 1.0 });
    }
  }

  for (let i = scene3D.frogShockwaves.length - 1; i >= 0; i--) {
    const sw = scene3D.frogShockwaves[i];
    sw.r += 4.5;
    sw.alpha -= 0.035;
    if (sw.alpha <= 0) {
      scene3D.frogShockwaves.splice(i, 1);
      continue;
    }
    ctx.strokeStyle = 'rgba(0, 255, 136, ' + sw.alpha + ')';
    ctx.lineWidth = 3.5 * sw.alpha;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(endJumpX, chainY + 20, sw.r * 1.6, sw.r * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 5. 🦵 3D THIGH HOLD IRON GRIP (3D Clamping Jaws, Mat Fissure Cracks & Magma Ground Sparks)
function render3DThighHold(ctx, w, h) {
  const cx = w / 2;
  const cy = h * 0.48;
  const fov = 480;
  const t = scene3D.time;

  // 1. Rising Fiery Magma Sparks from Fissure Zone
  ctx.save();
  scene3D.thighSparks.forEach(s => {
    s.y += s.vy;
    s.x += s.vx;
    s.z -= 1.0;
    if (s.y < -50) { s.y = h + 50; s.x = (Math.random() - 0.5) * 1400; }
    if (s.z <= 10) s.z = 700;

    const k = fov / s.z;
    const px = cx + s.x * k;
    const py = cy + (s.y - cy) * k;

    if (px > 0 && px < w && py > 0 && py < h) {
      const alpha = Math.min(0.9, (1 - s.z / 750) * 1.2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1.2, s.size * k), 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  // 2. Mat Seismic Ground Fissure Cracks
  ctx.save();
  const crackPulse = (Math.sin(t * 3.5) * 0.3 + 0.7);
  ctx.strokeStyle = 'rgba(255, 69, 0, ' + (0.7 * crackPulse) + ')';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ff4500';
  ctx.shadowBlur = 20;

  const fissureNodes = [
    [-180, 80], [-110, 40], [-60, 60], [0, 20], [70, 50], [130, 30], [200, 70],
    [-40, 25], [-80, -20], [-140, -50],
    [50, 25], [100, -20], [160, -45]
  ];

  ctx.beginPath();
  ctx.moveTo(cx + fissureNodes[0][0], cy + fissureNodes[0][1]);
  for (let i = 1; i <= 6; i++) {
    ctx.lineTo(cx + fissureNodes[i][0], cy + fissureNodes[i][1]);
  }
  ctx.stroke();

  // Branch 1
  ctx.beginPath();
  ctx.moveTo(cx + fissureNodes[7][0], cy + fissureNodes[7][1]);
  ctx.lineTo(cx + fissureNodes[8][0], cy + fissureNodes[8][1]);
  ctx.lineTo(cx + fissureNodes[9][0], cy + fissureNodes[9][1]);
  ctx.stroke();

  // Branch 2
  ctx.beginPath();
  ctx.moveTo(cx + fissureNodes[10][0], cy + fissureNodes[10][1]);
  ctx.lineTo(cx + fissureNodes[11][0], cy + fissureNodes[11][1]);
  ctx.lineTo(cx + fissureNodes[12][0], cy + fissureNodes[12][1]);
  ctx.stroke();
  ctx.restore();

  // 3. 3D Interlocking Iron Grip Clamps / Jaws
  ctx.save();
  ctx.translate(cx, cy);
  const clampCycle = (t * 2) % 2;
  const clampDist = Math.max(15, (1 - Math.min(1, clampCycle * 2)) * 120);

  // Left Iron Clamp Jaw
  ctx.save();
  ctx.translate(-clampDist, 0);
  ctx.strokeStyle = 'rgba(255, 119, 0, 0.95)';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff7700';
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.moveTo(-60, -70);
  ctx.bezierCurveTo(-10, -50, 20, -20, 20, 0);
  ctx.bezierCurveTo(20, 20, -10, 50, -60, 70);
  ctx.stroke();

  // Inner Teeth
  for (let tooth = -40; tooth <= 40; tooth += 20) {
    ctx.beginPath();
    ctx.moveTo(15, tooth);
    ctx.lineTo(32, tooth + 10);
    ctx.lineTo(15, tooth + 20);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();

  // Right Iron Clamp Jaw
  ctx.save();
  ctx.translate(clampDist, 0);
  ctx.strokeStyle = 'rgba(255, 69, 0, 0.95)';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff4500';
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.moveTo(60, -70);
  ctx.bezierCurveTo(10, -50, -20, -20, -20, 0);
  ctx.bezierCurveTo(-20, 20, 10, 50, 60, 70);
  ctx.stroke();

  // Inner Teeth
  for (let tooth = -40; tooth <= 40; tooth += 20) {
    ctx.beginPath();
    ctx.moveTo(-15, tooth);
    ctx.lineTo(-32, tooth + 10);
    ctx.lineTo(-15, tooth + 20);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();

  // Central Locked Energy Core
  if (clampDist <= 20) {
    const burstR = 35 + Math.sin(t * 10) * 8;
    const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, burstR);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.5, '#ff7700');
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, burstR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 6. 🎯 3D TOE TOUCH LASER RAID (Targeting Reticle HUD, Lightning Strike Beam & Bonus Line Impact)
function render3DToeTouch(ctx, w, h) {
  const cx = w / 2;
  const horizonY = h * 0.28;
  const t = scene3D.time;

  // 1. Perspective 3D Mat with Bonus Line Marked
  ctx.save();
  const matTopW = w * 0.38;
  const matBotW = w * 0.95;
  const bonusLineY = horizonY + (h - horizonY) * 0.68;
  const bonusLineW = matTopW + (matBotW - matTopW) * 0.68;

  // Draw Glowing Bonus Line
  ctx.strokeStyle = '#ffe600';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffe600';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(cx - bonusLineW / 2, bonusLineY);
  ctx.lineTo(cx + bonusLineW / 2, bonusLineY);
  ctx.stroke();

  // Baulk Line
  const baulkLineY = horizonY + (h - horizonY) * 0.48;
  const baulkLineW = matTopW + (matBotW - matTopW) * 0.48;
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(cx - baulkLineW / 2, baulkLineY);
  ctx.lineTo(cx + baulkLineW / 2, baulkLineY);
  ctx.stroke();
  ctx.restore();

  // 2. Corner Defender Target Position
  const cornerX = cx + bonusLineW * 0.38;
  const cornerY = bonusLineY;

  // Tactical HUD Targeting Reticle over Defender
  ctx.save();
  ctx.translate(cornerX, cornerY);
  const reticleR = 28 + Math.sin(t * 4) * 4;
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 15;

  // Rotating Crosshair Ring
  ctx.rotate(t * 1.5);
  ctx.beginPath();
  ctx.arc(0, 0, reticleR, 0, Math.PI * 0.4);
  ctx.arc(0, 0, reticleR, Math.PI * 0.5, Math.PI * 0.9);
  ctx.arc(0, 0, reticleR, Math.PI * 1.0, Math.PI * 1.4);
  ctx.arc(0, 0, reticleR, Math.PI * 1.5, Math.PI * 1.9);
  ctx.stroke();

  // Center Target Lock Dot
  ctx.fillStyle = '#ffe600';
  ctx.shadowColor = '#ffe600';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // HUD Distance Label
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillStyle = '#00e5ff';
  ctx.fillText('TARGET LOCK: 0.8m', -45, -34);
  ctx.restore();

  // 3. 🎯 Lightning Raider Surgical Toe Touch Strike Beam
  ctx.save();
  const strikeCycle = (t * 1.5) % 2.0; // strikes every 2s
  const raiderX = cx - 180;
  const raiderY = baulkLineY;

  // Raider Position Indicator
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(raiderX, raiderY, 8, 0, Math.PI * 2);
  ctx.fill();

  if (strikeCycle < 0.6) {
    const beamProg = Math.min(1, strikeCycle / 0.25);
    const targetX = raiderX + (cornerX - raiderX) * beamProg;
    const targetY = raiderY + (cornerY - raiderY) * beamProg;

    // Laser Beam
    const laserGrad = ctx.createLinearGradient(raiderX, raiderY, cornerX, cornerY);
    laserGrad.addColorStop(0, '#ffffff');
    laserGrad.addColorStop(0.5, '#00e5ff');
    laserGrad.addColorStop(1, '#ffe600');

    ctx.strokeStyle = laserGrad;
    ctx.lineWidth = 4.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.moveTo(raiderX, raiderY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Toe Contact Spark Flash at Corner
    if (beamProg >= 0.95) {
      const flashR = 25 + Math.random() * 15;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(cornerX, cornerY, flashR, 0, Math.PI * 2);
      ctx.fill();

      // Contact Spark Rays
      for (let p = 0; p < 8; p++) {
        const ang = (p / 8) * Math.PI * 2;
        const sparkLen = 35 + Math.random() * 20;
        ctx.strokeStyle = '#ffe600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cornerX, cornerY);
        ctx.lineTo(cornerX + Math.cos(ang) * sparkLen, cornerY + Math.sin(ang) * sparkLen);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// 7. 🦁 3D TAMIL THALAIVAS MASS (Yellow & Blue Arena Mat, Dual Strobes, Thalaiva Star Shield & Gold Waves)
function render3DThalaivasRoar(ctx, w, h) {
  const cx = w / 2;
  const horizonY = h * 0.26;
  const fov = 480;
  const t = scene3D.time;

  // 1. Dual Tamil Thalaivas Yellow & Royal Blue Arena Strobes
  ctx.save();
  const strobes = [
    { x: w * 0.14, angle: Math.sin(t * 0.9) * 0.2 + 0.35, color: 'rgba(255, 215, 0, 0.2)' },
    { x: w * 0.86, angle: -Math.sin(t * 0.9 + 1) * 0.2 - 0.35, color: 'rgba(37, 99, 235, 0.22)' },
    { x: cx, angle: Math.sin(t * 1.3) * 0.15, color: 'rgba(255, 107, 0, 0.15)' }
  ];

  strobes.forEach(s => {
    ctx.save();
    ctx.translate(s.x, 0);
    ctx.rotate(s.angle);
    const grad = ctx.createRadialGradient(0, 0, 10, 0, h * 0.9, w * 0.45);
    grad.addColorStop(0, s.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(60, 0);
    ctx.lineTo(w * 0.45, h * 1.3);
    ctx.lineTo(-w * 0.45, h * 1.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();

  // 2. 3D Perspective Stadium Mat in Tamil Thalaivas Glory
  ctx.save();
  const matTopW = w * 0.34;
  const matBotW = w * 0.96;
  const matGrad = ctx.createLinearGradient(cx, horizonY, cx, h);
  matGrad.addColorStop(0, 'rgba(37, 99, 235, 0.08)');
  matGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.14)');
  matGrad.addColorStop(1, 'rgba(37, 99, 235, 0.08)');

  ctx.fillStyle = matGrad;
  ctx.beginPath();
  ctx.moveTo(cx - matTopW / 2, horizonY);
  ctx.lineTo(cx + matTopW / 2, horizonY);
  ctx.lineTo(cx + matBotW / 2, h);
  ctx.lineTo(cx - matBotW / 2, h);
  ctx.closePath();
  ctx.fill();

  // Glowing Royal Blue & Gold Outer Boundaries
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(cx - matTopW / 2, horizonY);
  ctx.lineTo(cx - matBotW / 2, h);
  ctx.moveTo(cx + matTopW / 2, horizonY);
  ctx.lineTo(cx + matBotW / 2, h);
  ctx.stroke();

  // Midline
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#2563eb';
  ctx.shadowBlur = 15;
  const midY = horizonY + (h - horizonY) * 0.5;
  const midW = matTopW + (matBotW - matTopW) * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - midW / 2, midY);
  ctx.lineTo(cx + midW / 2, midY);
  ctx.stroke();
  ctx.restore();

  // 3. Rising Cheering Stadium Gold & Blue Dust
  ctx.save();
  scene3D.thalaivaGoldDust.forEach(d => {
    d.y -= d.vy;
    d.x += d.vx;
    d.z -= 0.8;
    if (d.y < -50) { d.y = h + 50; d.x = (Math.random() - 0.5) * 1600; }
    if (d.z <= 10) d.z = 800;

    const k = fov / d.z;
    const px = cx + d.x * k;
    const py = horizonY + (d.y - horizonY) * k;

    if (px > 0 && px < w && py > 0 && py < h) {
      const alpha = Math.min(1, (1 - d.z / 850) * 1.2);
      ctx.fillStyle = d.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1.2, d.size * k), 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  // 4. Central 3D Rotating Tamil Thalaivas Champion Star Shield
  ctx.save();
  ctx.translate(cx, horizonY + (h - horizonY) * 0.42);
  const rot = t * 0.4;
  ctx.rotate(rot);

  // Outer Golden Star Ring (8 points)
  const starR = 75 + Math.sin(t * 3) * 6;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const midA = a + Math.PI / 8;
    const ox = Math.cos(a) * starR;
    const oy = Math.sin(a) * starR;
    const ix = Math.cos(midA) * (starR * 0.55);
    const iy = Math.sin(midA) * (starR * 0.55);
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 3.2;
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 25;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
  ctx.fill();
  ctx.stroke();

  // Inner Royal Blue Shield
  ctx.rotate(-rot * 2);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const hx = Math.cos(a) * (starR * 0.4);
    const hy = Math.sin(a) * (starR * 0.4);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.8;
  ctx.shadowColor = '#2563eb';
  ctx.shadowBlur = 20;
  ctx.fillStyle = 'rgba(37, 99, 235, 0.3)';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function toggleThemeMenu() {
  const menu = document.getElementById('themeMenu');
  if (menu) menu.classList.toggle('active');
}

// Close theme menu if clicked outside
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.theme-picker-wrap');
  const menu = document.getElementById('themeMenu');
  if (wrap && menu && !wrap.contains(e.target)) {
    menu.classList.remove('active');
  }
});

function showToast(msg, icon = 'ri-checkbox-circle-fill') {
  const existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `<i class="${icon}" style="color:var(--accent-green); font-size:1.3rem;"></i> <span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function persistData() {
  saveAppData(appData);
  renderNotifications();
  renderAppShell();
}

function switchRole(role) {
  appData.activeRole = role;
  persistData();
  renderAppShell();
  
  if (role === 'coach') {
    navigateTo('coach-dashboard');
  } else {
    navigateTo('player-dashboard');
  }
}

function syncSidebarActiveState() {
  const isCoach = appData.activeRole === 'coach';
  const activeSidebarId = isCoach ? 'coachSidebar' : 'playerSidebar';
  const sidebar = document.getElementById(activeSidebarId);
  if (!sidebar) return;

  const buttons = sidebar.querySelectorAll('.nav-item button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    const onclickStr = btn.getAttribute('onclick') || '';
    if (onclickStr.includes(`'${currentView}'`) || onclickStr.includes(`"${currentView}"`)) {
      btn.classList.add('active');
    }
  });
}

function renderAppShell() {
  const isCoach = appData.activeRole === 'coach';
  
  const coachSidebar = document.getElementById('coachSidebar');
  const playerSidebar = document.getElementById('playerSidebar');
  if (coachSidebar) coachSidebar.style.display = isCoach ? 'flex' : 'none';
  if (playerSidebar) playerSidebar.style.display = isCoach ? 'none' : 'flex';

  if (isCoach) {
    const topName = document.getElementById('topUserName');
    const topRole = document.getElementById('topUserRole');
    const topAvatar = document.getElementById('topUserAvatar');
    if (topName) topName.innerText = (appData.coachProfile && appData.coachProfile.name) ? appData.coachProfile.name : 'Coach Arun';
    if (topRole) topRole.innerText = 'Head Coach';
    if (topAvatar) topAvatar.src = (appData.coachProfile && appData.coachProfile.photo) ? appData.coachProfile.photo : 'assets/thaai_tamizhans_logo.jpg';
  } else {
    const activePlayer = appData.players.find(p => p.id === appData.activePlayerId) || appData.players[0];
    const topName = document.getElementById('topUserName');
    const topRole = document.getElementById('topUserRole');
    const topAvatar = document.getElementById('topUserAvatar');
    if (topName) topName.innerText = `${activePlayer.name} (${activePlayer.jersey})`;
    if (topRole) topRole.innerText = `${activePlayer.position}`;
    if (topAvatar) topAvatar.src = activePlayer.photo;
  }

  syncSidebarActiveState();
}

function navigateTo(viewKey) {
  currentView = viewKey;
  localStorage.setItem('thaai_tamizhans_current_view', viewKey);
  
  syncSidebarActiveState();
  renderCurrentView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentView() {
  const container = document.getElementById('mainViewContainer');
  if (!container) return;

  const isPlayer = appData.activeRole === 'player';

  // Role Route Guarding: Auto-correct view according to active role
  if (isPlayer) {
    if (currentView === 'coach-dashboard') currentView = 'player-dashboard';
    else if (currentView === 'attendance') currentView = 'my-attendance';
    else if (currentView === 'performance') currentView = 'my-performance';
    else if (currentView === 'practice') currentView = 'my-practice';
    else if (currentView === 'players') currentView = 'team-members';
  } else {
    if (currentView === 'player-dashboard') currentView = 'coach-dashboard';
    else if (currentView === 'my-attendance') currentView = 'attendance';
    else if (currentView === 'my-performance') currentView = 'performance';
    else if (currentView === 'my-practice') currentView = 'practice';
    else if (currentView === 'my-instructions') currentView = 'coach-dashboard';
  }
  
  // Persist validated current view so refreshing page ALWAYS stays on the same page
  localStorage.setItem('thaai_tamizhans_current_view', currentView);
  syncSidebarActiveState();
  
  switch(currentView) {
    case 'coach-dashboard': container.innerHTML = renderCoachDashboardHTML(); break;
    case 'player-dashboard': container.innerHTML = renderPlayerDashboardHTML(); break;
    case 'live-scoreboard': container.innerHTML = renderLiveScoreboardHTML(); break;
    case 'players': container.innerHTML = renderPlayersHTML(); break;
    case 'practice': container.innerHTML = renderPracticeHTML(); break;
    case 'my-practice': container.innerHTML = renderMyPracticeHTML(); break;
    case 'match-notices': container.innerHTML = renderMatchNoticesHTML(); break;
    case 'performance': container.innerHTML = renderPerformanceHTML(); break;
    case 'my-performance': container.innerHTML = renderMyPerformanceHTML(); break;
    case 'attendance': container.innerHTML = renderAttendanceHTML(); break;
    case 'my-attendance': container.innerHTML = renderMyAttendanceHTML(); break;
    case 'communication': container.innerHTML = renderCommunicationHTML(); break;
    case 'team-members': container.innerHTML = renderTeamMembersHTML(); break;
    case 'files': container.innerHTML = renderFilesHTML(); break;
    case 'profile': container.innerHTML = renderProfileHTML(); break;
    case 'settings': container.innerHTML = renderSettingsHTML(); break;
    case 'my-instructions': container.innerHTML = renderMyInstructionsHTML(); break;
    default: container.innerHTML = isPlayer ? renderPlayerDashboardHTML() : renderCoachDashboardHTML(); break;
  }
}

// ----------------------------------------------------
// IMAGE PASTE & FILE UPLOAD HANDLER (REAL PHOTO COPIED/PASTED)
// ----------------------------------------------------
// ----------------------------------------------------
// IMAGE PASTE & FILE UPLOAD HANDLER (WITH AUTO-ADJUSTER)
// ----------------------------------------------------
function handleFileChoose(fileInput, targetInputId, previewImgId) {
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      const targetInput = document.getElementById(targetInputId);
      if (targetInput) targetInput.value = dataUrl;
      const preview = document.getElementById(previewImgId);
      if (preview) preview.src = dataUrl;
      
      // Auto-open interactive photo adjuster so user can frame face & zoom properly!
      if (targetInputId === 'newPlayerPhoto') {
        const jersey = document.getElementById('newPlayerJersey')?.value || '#18';
        showToast('Photo loaded! Opening adjuster to frame properly...', 'ri-crop-line');
        openPhotoAdjuster({
          imageUrl: dataUrl,
          targetType: 'playerModal',
          targetInputId: targetInputId,
          targetPreviewId: previewImgId,
          jersey: jersey
        });
      } else if (targetInputId === 'profilePhotoInput') {
        showToast('Profile photo loaded! Opening adjuster...', 'ri-crop-line');
        openPhotoAdjuster({
          imageUrl: dataUrl,
          targetType: 'coachProfile',
          targetInputId: targetInputId,
          targetPreviewId: previewImgId,
          jersey: appData.activeRole === 'coach' ? 'COACH' : '#07'
        });
      } else {
        showToast('Real Image loaded from file!');
      }
    };
    reader.readAsDataURL(file);
  }
}

function setupGlobalPasteHandler() {
  document.addEventListener('paste', function(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let imageItem = null;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageItem = items[i];
        break;
      }
    }

    if (imageItem) {
      const blob = imageItem.getAsFile();
      const reader = new FileReader();
      reader.onload = function(event) {
        const dataUrl = event.target.result;

        const playerModal = document.getElementById('modalAddPlayer');
        const noticeModal = document.getElementById('modalNotice');
        const profileInput = document.getElementById('profilePhotoInput');

        if (playerModal && playerModal.classList.contains('active')) {
          document.getElementById('newPlayerPhoto').value = dataUrl;
          document.getElementById('playerPhotoPreview').src = dataUrl;
          showToast('Copied photo pasted! Opening Adjuster...', 'ri-crop-line');
          openPhotoAdjuster({
            imageUrl: dataUrl,
            targetType: 'playerModal',
            targetInputId: 'newPlayerPhoto',
            targetPreviewId: 'playerPhotoPreview',
            jersey: document.getElementById('newPlayerJersey')?.value || '#18'
          });
        } else if (noticeModal && noticeModal.classList.contains('active')) {
          document.getElementById('noticeImage').value = dataUrl;
          document.getElementById('noticePreview').src = dataUrl;
          showToast('Copied real image pasted to Match Notice!');
        } else if (profileInput) {
          profileInput.value = dataUrl;
          const prev = document.getElementById('profileAvatarPreview');
          if (prev) prev.src = dataUrl;
          showToast('Copied photo pasted! Opening Adjuster...', 'ri-crop-line');
          openPhotoAdjuster({
            imageUrl: dataUrl,
            targetType: 'coachProfile',
            targetInputId: 'profilePhotoInput',
            targetPreviewId: 'profileAvatarPreview',
            jersey: appData.activeRole === 'coach' ? 'COACH' : '#07'
          });
        }
      };
      reader.readAsDataURL(blob);
    }
  });
}

function updatePlayerAvatarPreview(url) {
  if (url && url.length > 5) {
    document.getElementById('playerPhotoPreview').src = url;
  }
}

function updateNoticePreview(url) {
  if (url && url.length > 5) {
    document.getElementById('noticePreview').src = url;
  }
}

function updateProfileAvatarPreview(url) {
  if (url && url.length > 5) {
    const prev = document.getElementById('profileAvatarPreview');
    if (prev) prev.src = url;
  }
}

// ====================================================
// INTERACTIVE PHOTO ADJUSTER & CROPPER ENGINE
// ====================================================
let cropperState = {
  img: null,
  imgSrc: '',
  scale: 1.0,
  baseScale: 1.0,
  minScale: 0.4,
  maxScale: 4.5,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  touchStartDist: null,
  targetType: null, // 'playerModal' | 'playerById' | 'coachProfile'
  targetPlayerId: null,
  targetInputId: null,
  targetPreviewId: null,
  jersey: '#18',
  apertureRadius: 105 // 210px diameter inside 290x290 canvas
};

function openPhotoAdjuster(opts) {
  cropperState.imgSrc = opts.imageUrl;
  cropperState.targetType = opts.targetType;
  cropperState.targetPlayerId = opts.targetPlayerId || null;
  cropperState.targetInputId = opts.targetInputId || null;
  cropperState.targetPreviewId = opts.targetPreviewId || null;
  cropperState.jersey = opts.jersey || '#18';
  cropperState.rotation = 0;
  cropperState.offsetX = 0;
  cropperState.offsetY = 0;

  const jerseyTag = document.getElementById('cropperJerseyTag');
  if (jerseyTag) jerseyTag.innerText = cropperState.jersey;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    cropperState.img = img;
    const apertureDiameter = cropperState.apertureRadius * 2;
    
    // Scale image so minimum dimension covers circular aperture
    cropperState.baseScale = Math.max(apertureDiameter / img.naturalWidth, apertureDiameter / img.naturalHeight);

    // If standing/full-height vertical image (naturalHeight > naturalWidth * 1.2)
    // Auto-focus the top 20% (face/chest area) by default so it's not showing knees/table!
    const isTallPortrait = img.naturalHeight > (img.naturalWidth * 1.15);
    if (isTallPortrait) {
      applyCropperPreset('face', false);
    } else {
      cropperState.scale = 1.0;
      cropperState.offsetX = 0;
      cropperState.offsetY = 0;
      updatePresetChips('full');
    }

    updateZoomSliderUI();
    renderCropperCanvas();
    initCropperEvents();

    const modal = document.getElementById('modalPhotoAdjuster');
    if (modal) modal.classList.add('active');
  };
  img.onerror = function() {
    // If external cross-origin blocked, create canvas proxy
    showToast('Loading image for adjuster...', 'ri-image-line');
  };
  img.src = opts.imageUrl;
}

function openPhotoAdjusterFromPlayerModal() {
  const currentPhoto = document.getElementById('newPlayerPhoto')?.value || document.getElementById('playerPhotoPreview')?.src;
  const jersey = document.getElementById('newPlayerJersey')?.value || '#18';
  if (!currentPhoto) {
    showToast('Please choose or upload a photo first!');
    return;
  }
  openPhotoAdjuster({
    imageUrl: currentPhoto,
    targetType: 'playerModal',
    targetInputId: 'newPlayerPhoto',
    targetPreviewId: 'playerPhotoPreview',
    jersey: jersey
  });
}

function openPhotoAdjusterForPlayer(playerId) {
  const player = appData.players.find(p => p.id === playerId);
  if (!player) return;
  openPhotoAdjuster({
    imageUrl: player.photo,
    targetType: 'playerById',
    targetPlayerId: playerId,
    jersey: player.jersey
  });
}

function openPhotoAdjusterForCurrentProfile() {
  const isCoach = appData.activeRole === 'coach';
  const profile = isCoach ? appData.coachProfile : (appData.players.find(p => p.id === appData.activePlayerId) || appData.coachProfile);
  const currentPhoto = document.getElementById('profilePhotoInput')?.value || profile.photo;
  openPhotoAdjuster({
    imageUrl: currentPhoto,
    targetType: 'coachProfile',
    targetInputId: 'profilePhotoInput',
    targetPreviewId: 'profileAvatarPreview',
    jersey: isCoach ? 'COACH' : profile.jersey
  });
}

function closePhotoAdjuster() {
  const modal = document.getElementById('modalPhotoAdjuster');
  if (modal) modal.classList.remove('active');
}

function renderCropperCanvas() {
  const canvas = document.getElementById('cropperCanvas');
  if (!canvas || !cropperState.img) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#060d19';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2 + cropperState.offsetX, h / 2 + cropperState.offsetY);
  ctx.rotate((cropperState.rotation * Math.PI) / 180);

  const currentScale = cropperState.baseScale * cropperState.scale;
  ctx.scale(currentScale, currentScale);

  ctx.drawImage(cropperState.img, -cropperState.img.naturalWidth / 2, -cropperState.img.naturalHeight / 2);
  ctx.restore();

  renderCropperMiniPreviews();
}

function renderCropperMiniPreviews() {
  if (!cropperState.img) return;
  
  const mainCanvas = document.getElementById('cropperCanvas');
  const cx = mainCanvas.width / 2;
  const cy = mainCanvas.height / 2;
  const r = cropperState.apertureRadius;
  const srcX = cx - r;
  const srcY = cy - r;
  const srcSize = r * 2;

  // Mini Preview Large (64x64)
  const miniL = document.getElementById('cropperMiniPreviewLarge');
  if (miniL) {
    const ctxL = miniL.getContext('2d');
    ctxL.clearRect(0, 0, miniL.width, miniL.height);
    ctxL.save();
    ctxL.beginPath();
    ctxL.arc(miniL.width / 2, miniL.height / 2, miniL.width / 2, 0, Math.PI * 2);
    ctxL.clip();
    ctxL.drawImage(mainCanvas, srcX, srcY, srcSize, srcSize, 0, 0, miniL.width, miniL.height);
    ctxL.restore();
  }

  // Mini Preview Small (36x36)
  const miniS = document.getElementById('cropperMiniPreviewSmall');
  if (miniS) {
    const ctxS = miniS.getContext('2d');
    ctxS.clearRect(0, 0, miniS.width, miniS.height);
    ctxS.save();
    ctxS.beginPath();
    ctxS.arc(miniS.width / 2, miniS.height / 2, miniS.width / 2, 0, Math.PI * 2);
    ctxS.clip();
    ctxS.drawImage(mainCanvas, srcX, srcY, srcSize, srcSize, 0, 0, miniS.width, miniS.height);
    ctxS.restore();
  }
}

function applyCropperPreset(type, render = true) {
  if (!cropperState.img) return;
  const img = cropperState.img;
  const isRotated = (cropperState.rotation % 180 !== 0);
  const effectiveHeight = isRotated ? img.naturalWidth : img.naturalHeight;
  const scaledH = effectiveHeight * cropperState.baseScale;

  if (type === 'face') {
    // Face & Head focus: Zoom in ~2.2x and bring top area to center of circle
    cropperState.scale = 2.2;
    cropperState.offsetX = 0;
    cropperState.offsetY = Math.round(scaledH * 0.28);
  } else if (type === 'full') {
    // Full view fit
    cropperState.scale = 1.0;
    cropperState.offsetX = 0;
    cropperState.offsetY = 0;
  }

  updatePresetChips(type);
  updateZoomSliderUI();
  if (render) renderCropperCanvas();
}

function updatePresetChips(activeType) {
  ['face', 'full'].forEach(t => {
    const chip = document.getElementById(`chipPreset${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (chip) {
      if (t === activeType) chip.classList.add('active');
      else chip.classList.remove('active');
    }
  });
}

function onCropperZoomChange(val) {
  cropperState.scale = parseFloat(val);
  const valLabel = document.getElementById('cropperZoomValue');
  if (valLabel) valLabel.innerText = cropperState.scale.toFixed(2) + 'x';
  renderCropperCanvas();
}

function stepCropperZoom(delta) {
  let newScale = Math.min(cropperState.maxScale, Math.max(cropperState.minScale, cropperState.scale + delta));
  cropperState.scale = Math.round(newScale * 100) / 100;
  updateZoomSliderUI();
  renderCropperCanvas();
}

function updateZoomSliderUI() {
  const range = document.getElementById('cropperZoomRange');
  const valLabel = document.getElementById('cropperZoomValue');
  if (range) range.value = cropperState.scale;
  if (valLabel) valLabel.innerText = cropperState.scale.toFixed(2) + 'x';
}

function nudgeCropper(dx, dy) {
  cropperState.offsetX += dx;
  cropperState.offsetY += dy;
  renderCropperCanvas();
}

function resetCropperPosition() {
  cropperState.offsetX = 0;
  cropperState.offsetY = 0;
  renderCropperCanvas();
}

function rotateCropperImage(deg) {
  cropperState.rotation = (cropperState.rotation + deg) % 360;
  renderCropperCanvas();
}

let cropperEventsInitialized = false;
function initCropperEvents() {
  if (cropperEventsInitialized) return;
  cropperEventsInitialized = true;

  const canvas = document.getElementById('cropperCanvas');
  if (!canvas) return;

  // Mouse Dragging
  canvas.addEventListener('mousedown', (e) => {
    cropperState.isDragging = true;
    cropperState.dragStartX = e.clientX - cropperState.offsetX;
    cropperState.dragStartY = e.clientY - cropperState.offsetY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!cropperState.isDragging) return;
    cropperState.offsetX = e.clientX - cropperState.dragStartX;
    cropperState.offsetY = e.clientY - cropperState.dragStartY;
    renderCropperCanvas();
  });

  window.addEventListener('mouseup', () => {
    cropperState.isDragging = false;
  });

  // Mouse Wheel Zooming
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.12 : -0.12;
    stepCropperZoom(zoomFactor);
  }, { passive: false });

  // Touch Drag & Pinch-Zoom
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      cropperState.isDragging = true;
      cropperState.dragStartX = e.touches[0].clientX - cropperState.offsetX;
      cropperState.dragStartY = e.touches[0].clientY - cropperState.offsetY;
      cropperState.touchStartDist = null;
    } else if (e.touches.length === 2) {
      cropperState.isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      cropperState.touchStartDist = Math.hypot(dx, dy);
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (cropperState.isDragging && e.touches.length === 1) {
      e.preventDefault();
      cropperState.offsetX = e.touches[0].clientX - cropperState.dragStartX;
      cropperState.offsetY = e.touches[0].clientY - cropperState.dragStartY;
      renderCropperCanvas();
    } else if (e.touches.length === 2 && cropperState.touchStartDist) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const ratio = newDist / cropperState.touchStartDist;
      cropperState.scale = Math.min(cropperState.maxScale, Math.max(cropperState.minScale, cropperState.scale * ratio));
      cropperState.touchStartDist = newDist;
      updateZoomSliderUI();
      renderCropperCanvas();
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    cropperState.isDragging = false;
    cropperState.touchStartDist = null;
  });
}

function saveAndApplyCroppedPhoto() {
  if (!cropperState.img) return;

  // High-Resolution Export Canvas (400x400)
  const exportCanvas = document.createElement('canvas');
  const exportSize = 400;
  exportCanvas.width = exportSize;
  exportCanvas.height = exportSize;
  const ctx = exportCanvas.getContext('2d');

  const mainCanvas = document.getElementById('cropperCanvas');
  const cx = mainCanvas.width / 2;
  const cy = mainCanvas.height / 2;
  const r = cropperState.apertureRadius;
  const srcX = cx - r;
  const srcY = cy - r;
  const srcSize = r * 2;

  // Crop exact circular aperture region
  ctx.drawImage(mainCanvas, srcX, srcY, srcSize, srcSize, 0, 0, exportSize, exportSize);

  const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.93);

  // Apply to destination
  if (cropperState.targetType === 'playerModal') {
    const input = document.getElementById(cropperState.targetInputId || 'newPlayerPhoto');
    const preview = document.getElementById(cropperState.targetPreviewId || 'playerPhotoPreview');
    if (input) input.value = croppedDataUrl;
    if (preview) preview.src = croppedDataUrl;
    showToast('🎉 போட்டோ சரியாக அட்ஜஸ்ட் செய்யப்பட்டது! (Photo adjusted!)', 'ri-check-double-line');
  } else if (cropperState.targetType === 'playerById') {
    const player = appData.players.find(p => p.id === cropperState.targetPlayerId);
    if (player) {
      player.photo = croppedDataUrl;
      persistData();
      renderCurrentView();

      const profileImg = document.querySelector('#modalPlayerProfile img');
      if (profileImg) profileImg.src = croppedDataUrl;
      showToast(`🎉 ${player.name}'s photo adjusted & saved!`, 'ri-check-double-line');
    }
  } else if (cropperState.targetType === 'coachProfile') {
    const input = document.getElementById('profilePhotoInput');
    const preview = document.getElementById('profileAvatarPreview');
    if (input) input.value = croppedDataUrl;
    if (preview) preview.src = croppedDataUrl;

    if (appData.activeRole === 'coach') {
      appData.coachProfile.photo = croppedDataUrl;
    } else {
      const activeP = appData.players.find(p => p.id === appData.activePlayerId);
      if (activeP) activeP.photo = croppedDataUrl;
    }
    persistData();
    renderCurrentView();
    showToast('🎉 Profile photo adjusted & saved!', 'ri-check-double-line');
  }

  closePhotoAdjuster();
}

// ----------------------------------------------------
// 3. COACH DASHBOARD VIEW
// ----------------------------------------------------
function renderCoachDashboardHTML() {
  const totalPlayers = appData.players.length;
  const presentToday = appData.todayAttendance.filter(a => a.status === 'Present').length;
  const pendingInst = appData.instructions.filter(i => i.status !== 'Completed').length;
  const latestNotice = appData.matchNotices[0] || {};

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 28px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span class="kabaddi-chip lion"><i class="ri-fire-fill"></i> தாய் தமிழன்ஸ்</span>
          <span class="kabaddi-chip raid"><i class="ri-flashlight-fill"></i> KABADDI COURT ACTIVE</span>
          <span class="kabaddi-chip bonus"><i class="ri-trophy-fill"></i> PRO MAT ARENA</span>
        </div>
        <h2 style="font-size: 1.8rem; font-weight:800;" class="text-gradient-orange">Good Morning, ${appData.coachProfile.name} 👋</h2>
      </div>
      <button class="btn btn-court" onclick="openModalInstruction()">
        <i class="ri-file-add-line"></i> Give Player Instruction
      </button>
    </div>

    <!-- Metrics -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom:32px;">
      <div class="glass-card" style="display:flex; align-items:center; gap:16px;">
        <div class="icon-3d cyan"><i class="ri-group-fill"></i></div>
        <div>
          <div style="font-size:0.8rem; color:#94a3b8; font-weight:700;">TOTAL PLAYERS</div>
          <div style="font-size:1.8rem; font-weight:900; color:#fff;">${totalPlayers}</div>
        </div>
      </div>
      <div class="glass-card" style="display:flex; align-items:center; gap:16px;">
        <div class="icon-3d green"><i class="ri-checkbox-circle-fill"></i></div>
        <div>
          <div style="font-size:0.8rem; color:#94a3b8; font-weight:700;">PRESENT TODAY</div>
          <div style="font-size:1.8rem; font-weight:900; color:var(--accent-green);">${presentToday} / ${totalPlayers}</div>
        </div>
      </div>
      <div class="glass-card" style="display:flex; align-items:center; gap:16px;">
        <div class="icon-3d orange"><i class="ri-run-fill"></i></div>
        <div>
          <div style="font-size:0.8rem; color:#94a3b8; font-weight:700;">TODAY'S PRACTICE</div>
          <div style="font-size:1.1rem; font-weight:800; color:#fff;">${appData.todayPractice.time}</div>
          <div style="font-size:0.75rem; color:var(--accent-orange);">${appData.todayPractice.location}</div>
        </div>
      </div>
      <div class="glass-card" style="display:flex; align-items:center; gap:16px;">
        <div class="icon-3d purple"><i class="ri-fire-fill"></i></div>
        <div>
          <div style="font-size:0.8rem; color:#94a3b8; font-weight:700;">PENDING INSTRUCTIONS</div>
          <div style="font-size:1.8rem; font-weight:900; color:var(--accent-purple);">${pendingInst}</div>
        </div>
      </div>
    </div>

    <!-- Practice & Notice -->
    <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:24px; margin-bottom:32px;">
      <div class="glass-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 class="text-gradient-cyan"><i class="ri-calendar-event-fill"></i> Today's Practice — ${appData.todayPractice.title}</h3>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-sm btn-outline" onclick="openModalPractice()"><i class="ri-edit-line"></i> Edit Schedule</button>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:12px;">
          ${appData.todayPractice.sections.map(sec => `
            <div style="background:rgba(255,255,255,0.03); padding:12px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-weight:800; font-size:0.9rem; color:var(--accent-orange);">${sec.name}</div>
              <div style="font-size:0.8rem; color:#94a3b8;">${sec.detail}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="glass-card" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 class="text-gradient-orange"><i class="ri-megaphone-fill"></i> Latest Match Notice</h3>
            ${latestNotice.id ? `<button class="btn btn-sm btn-outline" onclick="editMatchNotice(${latestNotice.id})"><i class="ri-edit-line"></i> Edit</button>` : ''}
          </div>
          <div style="position:relative; height:140px; border-radius:14px; overflow:hidden; margin-bottom:12px; border:1px solid var(--border-color);">
            <img src="${latestNotice.image || 'assets/match_notice_poster.jpg'}" alt="Match Notice Poster" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <div style="font-size:0.9rem; font-weight:800; color:#fff;">${latestNotice.title || 'Pro Kabaddi Match'}</div>
          <div style="font-size:0.78rem; color:#94a3b8;">📅 ${latestNotice.date} | 📍 ${latestNotice.location}</div>
        </div>
        <button class="btn btn-outline btn-sm" style="margin-top:16px; width:100%;" onclick="navigateTo('match-notices')">
          View Notice Details
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <h3 style="font-size:1.1rem; margin-bottom:16px;" class="text-gradient-cyan"><i class="ri-flashlight-fill"></i>⚡ Quick Actions (விரைவுச் செயல்கள்)</h3>
    <div class="quick-actions-grid">
      <div class="quick-action-card" onclick="navigateTo('live-scoreboard')" style="border-top-color:var(--accent-orange); background:rgba(255, 85, 0, 0.08);">
        <div class="icon-3d orange"><i class="ri-broadcast-fill"></i></div>
        <div class="quick-action-title">Live Scoreboard</div>
        <div style="font-size:0.72rem; color:var(--accent-orange); font-weight:700;">நேரலை ஸ்கோர்போர்டு & 30s டைமர்</div>
      </div>
      <div class="quick-action-card" onclick="openModalAddPlayer()">
        <div class="icon-3d cyan"><i class="ri-user-add-line"></i></div>
        <div class="quick-action-title">Add Player</div>
        <div style="font-size:0.72rem; color:#94a3b8;">வீரர் சேர்த்தல்</div>
      </div>
      <div class="quick-action-card" onclick="openModalPractice()">
        <div class="icon-3d orange"><i class="ri-calendar-check-line"></i></div>
        <div class="quick-action-title">Practice Schedule</div>
        <div style="font-size:0.72rem; color:#94a3b8;">பயிற்சி அட்டவணை</div>
      </div>
      <div class="quick-action-card" onclick="openModalNotice()">
        <div class="icon-3d green"><i class="ri-megaphone-line"></i></div>
        <div class="quick-action-title">Match Notice</div>
        <div style="font-size:0.72rem; color:#94a3b8;">போட்டி அறிவிப்பு</div>
      </div>
      <div class="quick-action-card" onclick="openModalInstruction()">
        <div class="icon-3d purple"><i class="ri-edit-box-line"></i></div>
        <div class="quick-action-title">Give Instruction</div>
        <div style="font-size:0.72rem; color:#94a3b8;">வீரர் குறிப்புகள்</div>
      </div>
      <div class="quick-action-card" onclick="navigateTo('attendance')">
        <div class="icon-3d cyan"><i class="ri-checkbox-circle-line"></i></div>
        <div class="quick-action-title">Mark Attendance</div>
        <div style="font-size:0.72rem; color:#94a3b8;">வருகை பதிவு</div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// 16. PLAYER DASHBOARD VIEW
// ----------------------------------------------------
function renderPlayerDashboardHTML() {
  const activePlayer = appData.players.find(p => p.id === appData.activePlayerId) || appData.players[0];
  const myInst = appData.instructions.filter(i => i.playerId === activePlayer.id);
  const topInst = myInst.find(i => i.status !== 'Completed') || myInst[0] || {};
  const myPerf = appData.performance[activePlayer.id] || { raid: 84, defence: 76, fitness: 88 };
  const latestNotice = appData.matchNotices[0] || {};

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 28px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span class="kabaddi-chip lion"><i class="ri-fire-fill"></i> தாய் தமிழன்ஸ்</span>
          <span class="kabaddi-chip raid"><i class="ri-run-line"></i> SQUAD MEMBER</span>
          <span class="kabaddi-chip bonus">JERSEY ${activePlayer.jersey}</span>
        </div>
        <h2 style="font-size: 1.8rem; font-weight:800;" class="text-gradient-cyan">Welcome back, ${activePlayer.name} 👋</h2>
        <p style="color:#94a3b8; font-size:0.9rem;">Jersey ${activePlayer.jersey} • ${activePlayer.position} • தாய் தமிழன்ஸ் (THAAI TAMIZHANS)</p>
      </div>
      <button class="btn btn-outline" onclick="navigateTo('my-instructions')">
        <i class="ri-file-list-3-line"></i> View All Instructions (${myInst.length})
      </button>
    </div>

    <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:24px; margin-bottom:32px;">
      <div class="glass-card" style="border:1px solid rgba(255,94,0,0.4); box-shadow:var(--glow-orange);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 class="text-gradient-orange"><i class="ri-fire-fill"></i> 🔥 My Instruction (From Coach)</h3>
          <span class="badge-priority high">${topInst.priority || 'High'}</span>
        </div>
        ${topInst.title ? `
          <h4 style="font-size:1.1rem; color:#fff; margin-bottom:8px;">${topInst.title}</h4>
          <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:16px;">"${topInst.instruction}"</p>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.78rem; color:#94a3b8;">📅 Date: ${topInst.date}</span>
            ${topInst.status === 'Completed' ? `
              <span style="color:var(--accent-green); font-size:0.85rem; font-weight:800;"><i class="ri-check-double-line"></i> Completed</span>
            ` : `
              <button class="btn btn-green btn-sm" onclick="completeInstruction(${topInst.id})">
                <i class="ri-check-line"></i> Mark as Completed
              </button>
            `}
          </div>
        ` : `
          <p style="color:#94a3b8; font-size:0.9rem; padding:20px 0;">No active instructions right now.</p>
        `}
      </div>

      <div class="glass-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 class="text-gradient-cyan"><i class="ri-run-fill"></i> Today's Practice</h3>
          <span style="font-size:0.8rem; color:var(--accent-cyan); font-weight:800;">⏰ ${appData.todayPractice.time}</span>
        </div>
        <div style="font-size:0.85rem; color:#94a3b8; margin-bottom:12px;">📍 ${appData.todayPractice.location}</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${(appData.todayPractice.sections || []).slice(0, 4).map(sec => `
            <div style="display:flex; align-items:center; gap:8px; font-size:0.88rem;">
              <i class="ri-checkbox-circle-fill" style="color:var(--accent-green);"></i>
              <span style="font-weight:700; color:#fff;">${sec.name}:</span>
              <span style="color:#cbd5e1; font-size:0.82rem;">${sec.detail}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// 4. PLAYERS VIEW (WITH COACH WORKING CRUD)
// ----------------------------------------------------
function renderPlayersHTML() {
  const isCoach = appData.activeRole === 'coach';

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-cyan">👥 Team Players</h2>
      </div>
      ${isCoach ? `
        <button class="btn btn-primary" onclick="openModalAddPlayer()">
          <i class="ri-user-add-line"></i> Add New Player (Create)
        </button>
      ` : ''}
    </div>

    <div class="cards-grid">
      ${appData.players.map(p => {
        const perf = getOrInitPlayerPerformance(p.id);
        const pos = (p.position || '').toLowerCase();
        let roleClass = 'role-raider';
        let roleIcon = 'ri-flashlight-fill';
        if (pos.includes('defend') || pos.includes('corner') || pos.includes('cover')) {
          roleClass = 'role-defender';
          roleIcon = 'ri-shield-fill';
        } else if (pos.includes('all')) {
          roleClass = 'role-allrounder';
          roleIcon = 'ri-vip-crown-fill';
        }

        const jerseyDisplay = (p.jersey && p.jersey.toString().startsWith('#')) ? p.jersey : ('#' + (p.jersey || '00'));

        return `
          <div class="player-card dynamic-card ${roleClass}" onclick="viewPlayerProfile(${p.id})">
            <!-- Dynamic Top Badge Strip -->
            <div class="player-card-top-strip">
              <span class="player-role-badge ${roleClass}">
                <i class="${roleIcon}"></i> ${p.position}
              </span>
              <span class="player-jersey-shield">${jerseyDisplay}</span>
            </div>

            <!-- Avatar with Dynamic Glow Ring -->
            <div class="player-photo-wrap" onclick="event.stopPropagation(); openPhotoAdjusterForPlayer(${p.id});" title="Click to Adjust Photo">
              <div class="avatar-glow-ring"></div>
              <img src="${p.photo}" alt="${p.name}" class="player-photo">
              <div class="player-photo-overlay-btn">
                <i class="ri-crop-line"></i>
                <span>Adjust</span>
              </div>
            </div>

            <!-- Player Name & Details -->
            <div class="player-card-info">
              <div class="player-name">${p.name}</div>
              <div class="player-pos-tag">${p.position}</div>
            </div>

            <!-- Dynamic Quick Mini-Stats Bar -->
            <div class="player-mini-stats">
              <div class="mini-stat-item">
                <span class="stat-label">Rating</span>
                <span class="stat-val rating-val"><i class="ri-star-fill"></i> ${perf?.starRating || 4}.0</span>
              </div>
              <div class="mini-stat-divider"></div>
              <div class="mini-stat-item">
                <span class="stat-label">Attendance</span>
                <span class="stat-val attendance-val">${p.attendance?.percentage || 90}%</span>
              </div>
              <div class="mini-stat-divider"></div>
              <div class="mini-stat-item">
                <span class="stat-label">Squad</span>
                <span class="stat-val squad-val"><span class="pulse-dot"></span> Active</span>
              </div>
            </div>

            <!-- Action Controls (Coach Mode) vs Player View -->
            ${isCoach ? `
              <div class="card-actions-bar">
                <button class="btn btn-sm card-action-btn edit-btn" onclick="event.stopPropagation(); editPlayer(${p.id});">
                  <i class="ri-edit-line"></i> Edit
                </button>
                <button class="btn btn-sm card-action-btn photo-btn" onclick="event.stopPropagation(); openPhotoAdjusterForPlayer(${p.id});" title="Adjust Photo">
                  <i class="ri-crop-line"></i> Photo
                </button>
                <button class="btn btn-sm card-action-btn delete-btn" onclick="event.stopPropagation(); deletePlayer(${p.id});">
                  <i class="ri-delete-bin-line"></i> Delete
                </button>
              </div>
            ` : `
              <div class="card-footer-view-btn">
                <span>View Full Profile <i class="ri-arrow-right-line"></i></span>
              </div>
            `}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openModalAddPlayer() {
  document.getElementById('playerEditId').value = '';
  document.getElementById('modalPlayerHeader').innerHTML = '<i class="ri-user-add-line"></i> Add New Player';
  document.getElementById('newPlayerName').value = '';
  document.getElementById('newPlayerJersey').value = '';
  document.getElementById('newPlayerPos').value = 'Raider';
  document.getElementById('newPlayerContact').value = '';
  document.getElementById('newPlayerPhoto').value = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';
  document.getElementById('playerPhotoPreview').src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';
  openModal('modalAddPlayer');
}

function editPlayer(id) {
  const p = appData.players.find(item => item.id === id);
  if (!p) return;

  document.getElementById('playerEditId').value = p.id;
  document.getElementById('modalPlayerHeader').innerHTML = `<i class="ri-edit-line"></i> Edit Player — ${p.name}`;
  document.getElementById('newPlayerName').value = p.name;
  document.getElementById('newPlayerJersey').value = p.jersey;
  document.getElementById('newPlayerPos').value = p.position;
  document.getElementById('newPlayerContact').value = p.contact || '';
  document.getElementById('newPlayerPhoto').value = p.photo;
  document.getElementById('playerPhotoPreview').src = p.photo;
  openModal('modalAddPlayer');
}

function deletePlayer(id) {
  const p = appData.players.find(item => item.id === id);
  if (!p) return;

  if (confirm(`Are you sure you want to delete ${p.name} (${p.jersey}) from the squad?`)) {
    appData.players = appData.players.filter(item => item.id !== id);
    persistData();
    renderCurrentView();
    showToast(`Player ${p.name} deleted!`, 'ri-delete-bin-fill');
  }
}

function handleSavePlayer(e) {
  e.preventDefault();
  const editId = document.getElementById('playerEditId').value;
  const name = document.getElementById('newPlayerName').value;
  const jersey = document.getElementById('newPlayerJersey').value;
  const position = document.getElementById('newPlayerPos').value;
  const contact = document.getElementById('newPlayerContact').value;
  const photo = document.getElementById('newPlayerPhoto').value;

  if (editId) {
    const player = appData.players.find(p => p.id === parseInt(editId));
    if (player) {
      player.name = name;
      player.jersey = jersey;
      player.position = position;
      player.contact = contact;
      player.photo = photo;
    }
    showToast(`Player ${name} updated successfully!`);
  } else {
    const newPlayer = {
      id: Date.now(),
      name,
      jersey,
      position,
      status: 'Active',
      contact: contact || '+91 98000 00000',
      photo: photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      attendance: { present: 0, absent: 0, late: 0, percentage: 100 }
    };
    appData.players.push(newPlayer);
    showToast(`New player ${name} added to squad!`);
  }

  persistData();
  closeModal('modalAddPlayer');
  renderCurrentView();
}

function selectPlayerPreset(url) {
  document.getElementById('newPlayerPhoto').value = url;
  document.getElementById('playerPhotoPreview').src = url;
}

// ----------------------------------------------------
// INTERACTIVE TRAINING & PRACTICE CALENDAR SYSTEM
// ----------------------------------------------------
let calYear = 2026;
let calMonth = 8; // September (0-indexed: 8 = Sep)
let selectedCalDate = '2026-09-09';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function changeCalendarMonth(delta) {
  calMonth += delta;
  if (calMonth < 0) {
    calMonth = 11;
    calYear--;
  } else if (calMonth > 11) {
    calMonth = 0;
    calYear++;
  }
  renderCurrentView();
}

function resetCalendarToToday() {
  calYear = 2026;
  calMonth = 8;
  selectedCalDate = '2026-09-09';
  renderCurrentView();
}

function selectCalendarDate(dateStr) {
  selectedCalDate = dateStr;
  renderCurrentView();
}

function renderPracticeCalendarHTML(isCoach) {
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(calYear, calMonth, 0).getDate();
  const todayStr = '2026-09-09';

  const monthPractices = (appData.practiceCalendar || []).filter(p => {
    if (!p.date) return false;
    const parts = p.date.split('-');
    return parseInt(parts[0]) === calYear && (parseInt(parts[1]) - 1) === calMonth;
  });

  // Selected Day Practice Data
  const selectedPractice = (appData.practiceCalendar || []).find(p => p.date === selectedCalDate);
  const selectedDateObj = new Date(selectedCalDate);
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Build Day Cells
  let daysHtml = '';

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    daysHtml += `
      <div class="calendar-day-cell other-month">
        <div class="calendar-cell-top">
          <span class="calendar-date-num muted">${prevDay}</span>
        </div>
      </div>
    `;
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(calMonth + 1).padStart(2, '0');
    const dateStr = `${calYear}-${monthStr}-${dayStr}`;

    const isToday = (dateStr === todayStr);
    const isSelected = (dateStr === selectedCalDate);
    const session = (appData.practiceCalendar || []).find(p => p.date === dateStr);

    daysHtml += `
      <div class="calendar-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${session ? 'has-practice' : ''}" onclick="selectCalendarDate('${dateStr}')">
        <div class="calendar-cell-top">
          <span class="calendar-date-num">${day}</span>
          ${isToday ? `<span class="calendar-today-badge">TODAY</span>` : ''}
        </div>
        ${session ? `
          <div class="calendar-practice-badge" title="${session.title} (${session.time})">
            <span>🏋️ ${session.time.split('-')[0].trim()}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Next month leading days to complete row grid cleanly
  const totalRendered = firstDayIndex + totalDays;
  const remainingSlots = (totalRendered % 7 === 0) ? 0 : (7 - (totalRendered % 7));
  for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
    daysHtml += `
      <div class="calendar-day-cell other-month">
        <div class="calendar-cell-top">
          <span class="calendar-date-num muted">${nextDay}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="calendar-layout">
      <!-- Calendar Grid Side -->
      <div class="calendar-card">
        <div class="calendar-header">
          <div class="calendar-month-title">
            <i class="ri-calendar-todo-fill text-gradient-orange" style="font-size:1.4rem;"></i>
            <span>${MONTH_NAMES[calMonth]} ${calYear}</span>
          </div>
          <div class="calendar-nav-btns">
            <button class="calendar-today-btn" onclick="resetCalendarToToday()">Today</button>
            <button class="calendar-nav-btn" onclick="changeCalendarMonth(-1)" title="Previous Month"><i class="ri-arrow-left-s-line"></i></button>
            <button class="calendar-nav-btn" onclick="changeCalendarMonth(1)" title="Next Month"><i class="ri-arrow-right-s-line"></i></button>
          </div>
        </div>

        <div class="calendar-weekdays">
          <div class="calendar-weekday">Sun</div>
          <div class="calendar-weekday">Mon</div>
          <div class="calendar-weekday">Tue</div>
          <div class="calendar-weekday">Wed</div>
          <div class="calendar-weekday">Thu</div>
          <div class="calendar-weekday">Fri</div>
          <div class="calendar-weekday">Sat</div>
        </div>

        <div class="calendar-grid">
          ${daysHtml}
        </div>
      </div>

      <!-- Selected Day Inspector Panel -->
      <div class="day-inspector-card">
        <div class="inspector-header">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
            <span class="inspector-date-label">📅 SELECTED DATE</span>
            ${selectedCalDate === todayStr ? `<span class="badge-priority normal">TODAY</span>` : ''}
          </div>
          <h3 class="inspector-title">${formattedSelectedDate}</h3>
        </div>

        ${selectedPractice ? `
          <!-- Practice Scheduled on this Date -->
          <div style="flex:1; display:flex; flex-direction:column; gap:14px;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:14px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:0.75rem; background:var(--grad-orange); color:#fff; padding:3px 8px; border-radius:6px; font-weight:800;">SCHEDULED PRACTICE</span>
                <span class="badge-priority important">${selectedPractice.intensity || 'Medium'}</span>
              </div>
              <h4 style="font-size:1.15rem; font-weight:800; color:#fff; margin-bottom:6px;">${selectedPractice.title}</h4>
              <div style="font-size:0.85rem; color:var(--accent-cyan); font-weight:700; margin-bottom:4px;">
                <i class="ri-time-line"></i> ${selectedPractice.time}
              </div>
              <div style="font-size:0.82rem; color:#94a3b8;">
                <i class="ri-map-pin-line"></i> ${selectedPractice.location}
              </div>
            </div>

            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:14px; padding:14px;">
              <div style="font-size:0.78rem; font-weight:800; color:var(--accent-gold); margin-bottom:6px; text-transform:uppercase;">
                <i class="ri-focus-2-line"></i> Training Focus
              </div>
              <p style="font-size:0.85rem; color:#e2e8f0; line-height:1.4;">${selectedPractice.focus}</p>
            </div>

            ${selectedPractice.drills ? `
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:14px; padding:14px;">
                <div style="font-size:0.78rem; font-weight:800; color:var(--accent-green); margin-bottom:6px; text-transform:uppercase;">
                  <i class="ri-list-check-2"></i> Specific Drills Routine
                </div>
                <p style="font-size:0.82rem; color:#cbd5e1; line-height:1.4;">${selectedPractice.drills}</p>
              </div>
            ` : ''}

            ${selectedPractice.coachNotes ? `
              <div style="background:rgba(255,85,0,0.08); border:1px solid rgba(255,85,0,0.3); border-radius:14px; padding:14px;">
                <div style="font-size:0.75rem; font-weight:800; color:var(--accent-orange); margin-bottom:4px;">
                  <i class="ri-message-3-line"></i> COACH INSTRUCTION / வீரர்களுக்கான குறிப்பு
                </div>
                <p style="font-size:0.82rem; color:#fff; font-style:italic;">"${selectedPractice.coachNotes}"</p>
              </div>
            ` : ''}

            ${isCoach ? `
              <div style="display:flex; gap:10px; margin-top:auto; padding-top:14px;">
                <button class="btn btn-outline" style="flex:1; font-size:0.82rem;" onclick="openSchedulePracticeModal('${selectedPractice.date}', ${selectedPractice.id})">
                  <i class="ri-edit-line"></i> Edit Session
                </button>
                <button class="btn btn-red" style="font-size:0.82rem;" onclick="deleteScheduledPractice(${selectedPractice.id})">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            ` : `
              <div style="margin-top:auto; padding:12px; background:rgba(0,242,254,0.08); border:1px solid rgba(0,242,254,0.25); border-radius:12px; text-align:center;">
                <span style="font-size:0.8rem; color:var(--accent-cyan); font-weight:700;">
                  <i class="ri-checkbox-circle-fill"></i> Assigned to All Squad Players by Coach
                </span>
              </div>
            `}
          </div>
        ` : `
          <!-- No Practice on this Date -->
          <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:30px 10px;">
            <div class="icon-3d cyan" style="margin-bottom:14px;"><i class="ri-calendar-event-line"></i></div>
            <h4 style="font-size:1.05rem; font-weight:700; color:#fff; margin-bottom:6px;">No Practice Scheduled</h4>
            <p style="font-size:0.82rem; color:#94a3b8; margin-bottom:20px;">
              ${isCoach ? 'Intha date-ku innum training session assign aagala.' : 'Intha date-la practice illa. Rest Day / ஓய்வு நாள்.'}
            </p>
            ${isCoach ? `
              <button class="btn btn-orange" onclick="openSchedulePracticeModal('${selectedCalDate}')">
                <i class="ri-add-line"></i> Schedule Practice for ${selectedCalDate.split('-')[2]} ${MONTH_NAMES[calMonth].substring(0, 3)}
              </button>
            ` : ''}
          </div>
        `}
      </div>
    </div>
  `;
}

function renderPracticeHTML() {
  const isCoach = true;
  const todaySession = (appData.practiceCalendar || []).find(p => p.date === '2026-09-09');

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-orange">🏋️ Interactive Training & Practice Calendar</h2>
      </div>
      <button class="btn btn-orange" onclick="openSchedulePracticeModal('${selectedCalDate}')">
        <i class="ri-calendar-event-line"></i> Schedule Practice Session
      </button>
    </div>

    <!-- Calendar View Component -->
    ${renderPracticeCalendarHTML(isCoach)}

    <!-- Scheduled Practices List Table -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
      <h3 style="font-size:1.15rem; font-weight:800;" class="text-gradient-cyan">
        <i class="ri-calendar-schedule-fill" style="color:var(--accent-cyan); margin-right:4px;"></i> All Scheduled Sessions (${(appData.practiceCalendar || []).length})
      </h3>
      <span style="font-size:0.78rem; color:#94a3b8;">Coach schedule list with live squad synchronization</span>
    </div>

    <div class="table-responsive" style="overflow-x:auto;">
      <table class="att-table-compact">
        <thead>
          <tr>
            <th style="width:14%; text-align:left; padding-left:16px;">DATE</th>
            <th style="width:24%; text-align:left;">TITLE & TIMING</th>
            <th style="width:18%; text-align:left;">LOCATION</th>
            <th style="width:20%; text-align:left;">TRAINING FOCUS</th>
            <th style="width:12%; text-align:center;">INTENSITY</th>
            <th style="width:12%; text-align:center; padding-right:16px;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          ${(appData.practiceCalendar || []).map(p => `
            <tr>
              <td style="vertical-align:middle; text-align:left; padding-left:16px; font-weight:700; color:#fff; white-space:nowrap;">
                <div style="display:inline-flex; align-items:center; gap:6px;">
                  <i class="ri-calendar-event-fill" style="color:var(--accent-orange);"></i>
                  <span>${p.date}</span>
                </div>
              </td>
              <td style="vertical-align:middle; text-align:left;">
                <div style="font-weight:800; color:#fff; font-size:0.86rem; line-height:1.2;">${p.title}</div>
                <div style="font-size:0.72rem; color:var(--accent-cyan); font-weight:700; margin-top:2px;">
                  <i class="ri-time-line"></i> ${p.time}
                </div>
              </td>
              <td style="vertical-align:middle; text-align:left; color:#cbd5e1; font-size:0.82rem;">
                <i class="ri-map-pin-line" style="color:var(--accent-gold); margin-right:2px;"></i> ${p.location}
              </td>
              <td style="vertical-align:middle; text-align:left; color:#94a3b8; font-size:0.80rem; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${p.focus}">
                ${p.focus}
              </td>
              <td style="vertical-align:middle; text-align:center; white-space:nowrap;">
                <span class="badge-priority ${p.intensity.includes('High') ? 'high' : (p.intensity.includes('Competition') ? 'competition' : (p.intensity.includes('Medium') ? 'important' : 'normal'))}" style="font-size:0.70rem; padding:3px 8px; border-radius:12px;">
                  ${p.intensity}
                </span>
              </td>
              <td style="vertical-align:middle; text-align:center; padding-right:16px; white-space:nowrap;">
                <div style="display:inline-flex; gap:6px; justify-content:center; align-items:center;">
                  <button class="btn btn-sm att-btn-compact btn-outline" style="color:var(--accent-cyan); border-color:rgba(0,242,254,0.35);" onclick="openSchedulePracticeModal('${p.date}', ${p.id})" title="Edit Session">
                    <i class="ri-edit-line"></i> Edit
                  </button>
                  <button class="btn btn-sm att-btn-compact btn-red" onclick="deleteScheduledPractice(${p.id})" title="Delete Session">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderMyPracticeHTML() {
  const isCoach = false;
  const todaySession = (appData.practiceCalendar || []).find(p => p.date === '2026-09-09');

  return `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-cyan">🏋️ My Practice Calendar</h2>
    </div>

    ${todaySession ? `
      <!-- Prominent Today's Practice Banner for Players -->
      <div class="glass-card" style="border-left:4px solid var(--accent-orange); margin-bottom:24px; background:linear-gradient(135deg, rgba(255,85,0,0.12) 0%, rgba(10,16,32,0.65) 100%);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:0.75rem; background:var(--grad-orange); color:#fff; padding:4px 10px; border-radius:8px; font-weight:800;">
            🔥 INAIYA PAYIRCHI / TODAY'S SCHEDULED PRACTICE
          </span>
          <span class="badge-priority high">${todaySession.intensity}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
          <div>
            <h3 style="font-size:1.4rem; font-weight:900; color:#fff; margin-bottom:6px;">${todaySession.title}</h3>
            <div style="display:flex; gap:16px; font-size:0.88rem; color:#cbd5e1; margin-bottom:10px;">
              <span><i class="ri-time-line" style="color:var(--accent-cyan);"></i> ${todaySession.time}</span>
              <span><i class="ri-map-pin-line" style="color:var(--accent-orange);"></i> ${todaySession.location}</span>
            </div>
            <div style="font-size:0.85rem; color:#e2e8f0; margin-bottom:8px;">
              <strong style="color:var(--accent-gold);">Focus:</strong> ${todaySession.focus}
            </div>
            ${todaySession.drills ? `
              <div style="font-size:0.82rem; color:#94a3b8; margin-bottom:8px;">
                <strong style="color:var(--accent-green);">Routine Drills:</strong> ${todaySession.drills}
              </div>
            ` : ''}
            ${todaySession.coachNotes ? `
              <div style="font-size:0.82rem; color:#ffedd5; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:8px; border-left:3px solid var(--accent-orange);">
                <strong>Coach Note:</strong> "${todaySession.coachNotes}"
              </div>
            ` : ''}
          </div>
          <button class="btn btn-green" onclick="selectCalendarDate('2026-09-09')">
            <i class="ri-focus-3-line"></i> View on Calendar
          </button>
        </div>
      </div>
    ` : ''}

    <!-- Interactive Calendar Component for Player -->
    ${renderPracticeCalendarHTML(isCoach)}
  `;
}

// ----------------------------------------------------
// TODAY'S PRACTICE SCHEDULE MODAL HANDLERS
// ----------------------------------------------------
function openModalEditTodayPractice() {
  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Only Coach can edit the practice schedule!', 'ri-lock-fill');
    return;
  }

  const prac = appData.todayPractice || {
    title: 'Kabaddi Maalai Payirchi',
    time: 'Maalai 5:00 PM',
    location: 'Home Ground (Namma Ground)',
    sections: [
      { name: 'Warm-up', detail: '15 Mins dynamic stretching matrum leg drills' },
      { name: 'Raid Practice', detail: 'Toe touch & hand touch speed reps' },
      { name: 'Defence Practice', detail: 'Ankle hold & thigh hold grip tactics' },
      { name: 'Fitness Drill', detail: 'High intensity shuttle runs & stamina' },
      { name: 'Team Match Drill', detail: '7v7 match simulation strategy' },
      { name: 'Cool Down', detail: 'Light jogging & foam rolling recovery' }
    ]
  };

  const titleInput = document.getElementById('todayPracTitle');
  const timeInput = document.getElementById('todayPracTime');
  const locInput = document.getElementById('todayPracLocation');

  if (titleInput) titleInput.value = prac.title || 'Kabaddi Maalai Payirchi';
  if (timeInput) timeInput.value = prac.time || 'Maalai 5:00 PM';
  if (locInput) locInput.value = prac.location || 'Home Ground (Namma Ground)';

  const container = document.getElementById('todayPracSectionsContainer');
  if (container) {
    const defaultSections = [
      { name: 'Warm-up', detail: '15 Mins dynamic stretching matrum leg drills' },
      { name: 'Raid Practice', detail: 'Toe touch & hand touch speed reps' },
      { name: 'Defence Practice', detail: 'Ankle hold & thigh hold grip tactics' },
      { name: 'Fitness Drill', detail: 'High intensity shuttle runs & stamina' },
      { name: 'Team Match Drill', detail: '7v7 match simulation strategy' },
      { name: 'Cool Down', detail: 'Light jogging & foam rolling recovery' }
    ];
    const sections = (prac.sections && prac.sections.length === 6) ? prac.sections : defaultSections;

    container.innerHTML = sections.map((sec, idx) => `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px 14px; display:grid; grid-template-columns: 1fr 2fr; gap:10px; align-items:center;">
        <input type="text" class="form-control" style="font-weight:700; color:var(--accent-orange);" id="todaySecName_${idx}" value="${sec.name}" required>
        <input type="text" class="form-control" id="todaySecDetail_${idx}" value="${sec.detail}" placeholder="Drill details..." required>
      </div>
    `).join('');
  }

  openModal('modalEditTodayPractice');
}

// Global alias so any Edit Schedule / Practice button works seamlessly
function openModalPractice() {
  openModalEditTodayPractice();
}

function handleSaveTodayPractice(e) {
  e.preventDefault();

  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Only Coach can edit the practice schedule!', 'ri-lock-fill');
    return;
  }

  const title = document.getElementById('todayPracTitle')?.value?.trim() || 'Kabaddi Practice';
  const time = document.getElementById('todayPracTime')?.value?.trim() || 'Maalai 5:00 PM';
  const location = document.getElementById('todayPracLocation')?.value?.trim() || 'Home Ground';

  const sections = [];
  for (let i = 0; i < 6; i++) {
    const nameInput = document.getElementById(`todaySecName_${i}`);
    const detailInput = document.getElementById(`todaySecDetail_${i}`);
    if (nameInput && detailInput) {
      sections.push({
        name: nameInput.value.trim(),
        detail: detailInput.value.trim()
      });
    }
  }

  appData.todayPractice = {
    title,
    date: 'Inaiku — ' + new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
    time,
    location,
    sections: sections.length === 6 ? sections : (appData.todayPractice?.sections || [])
  };

  // Broadcast automated notification to players
  addAppNotification({
    title: `⚡ Today's Practice Updated: ${title}`,
    desc: `Coach இன்றைய பயிற்சி திட்டத்தை (${time} @ ${location}) புதுப்பித்துள்ளார்.`,
    target: 'all',
    type: 'practice',
    icon: 'ri-calendar-event-line',
    actionView: 'my-practice'
  });

  persistData();
  closeModal('modalEditTodayPractice');
  renderCurrentView();
  showToast("✅ Today's Practice Schedule updated successfully!", 'ri-checkbox-circle-fill');
}

function openSchedulePracticeModal(dateStr = '', editId = null) {
  const modalTitle = document.getElementById('modalPracticeTitle');
  const editIdInput = document.getElementById('pracEditId');
  const dateInput = document.getElementById('pracDate');
  const titleInput = document.getElementById('pracTitle');
  const timeInput = document.getElementById('pracTime');
  const intensityInput = document.getElementById('pracIntensity');
  const locInput = document.getElementById('pracLocation');
  const focusInput = document.getElementById('pracFocus');
  const drillsInput = document.getElementById('pracDrills');
  const notesInput = document.getElementById('pracCoachNotes');

  if (editId) {
    const session = (appData.practiceCalendar || []).find(p => p.id === editId);
    if (session) {
      if (modalTitle) modalTitle.innerText = 'Edit Practice Session';
      if (editIdInput) editIdInput.value = session.id;
      if (dateInput) dateInput.value = session.date;
      if (titleInput) titleInput.value = session.title;
      if (timeInput) timeInput.value = session.time;
      if (intensityInput) intensityInput.value = session.intensity || 'High Intensity';
      if (locInput) locInput.value = session.location;
      if (focusInput) focusInput.value = session.focus;
      if (drillsInput) drillsInput.value = session.drills || '';
      if (notesInput) notesInput.value = session.coachNotes || '';
    }
  } else {
    if (modalTitle) modalTitle.innerText = 'Schedule Practice on Calendar';
    if (editIdInput) editIdInput.value = '';
    if (dateInput) dateInput.value = dateStr || selectedCalDate || '2026-09-09';
    if (titleInput) titleInput.value = 'Kabaddi Training Session';
    if (timeInput) timeInput.value = '5:00 PM - 7:00 PM';
    if (intensityInput) intensityInput.value = 'High Intensity';
    if (locInput) locInput.value = 'Home Ground (Mat Court)';
    if (focusInput) focusInput.value = 'Raid Footwork & Defense Combination';
    if (drillsInput) drillsInput.value = '15 Mins warm-up stretching, 30 Mins Toe-touch reps, 30 Mins Chain tackle...';
    if (notesInput) notesInput.value = 'All players assemble 15 mins early.';
  }

  openModal('modalPractice');
}

function handleSavePractice(e) {
  e.preventDefault();
  const editId = document.getElementById('pracEditId').value;
  const dateVal = document.getElementById('pracDate').value;
  const titleVal = document.getElementById('pracTitle').value;
  const timeVal = document.getElementById('pracTime').value;
  const intensityVal = document.getElementById('pracIntensity').value;
  const locVal = document.getElementById('pracLocation').value;
  const focusVal = document.getElementById('pracFocus').value;
  const drillsVal = document.getElementById('pracDrills').value;
  const notesVal = document.getElementById('pracCoachNotes').value;

  if (!appData.practiceCalendar) {
    appData.practiceCalendar = [];
  }

  if (editId) {
    const session = appData.practiceCalendar.find(p => p.id === parseInt(editId));
    if (session) {
      session.date = dateVal;
      session.title = titleVal;
      session.time = timeVal;
      session.intensity = intensityVal;
      session.location = locVal;
      session.focus = focusVal;
      session.drills = drillsVal;
      session.coachNotes = notesVal;
    }
    showToast(`Practice session on ${dateVal} updated!`);
  } else {
    const newSession = {
      id: Date.now(),
      date: dateVal,
      title: titleVal,
      time: timeVal,
      intensity: intensityVal,
      location: locVal,
      focus: focusVal,
      drills: drillsVal,
      coachNotes: notesVal
    };
    appData.practiceCalendar.push(newSession);

    // Broadcast automated notification to players
    addAppNotification({
      title: `🏋️ New Practice Scheduled: ${titleVal}`,
      desc: `Coach ${dateVal} (${timeVal}) அன்று புதிய பயிற்சி திட்டமிட்டுள்ளார் (${locVal}).`,
      target: 'all',
      type: 'practice',
      icon: 'ri-calendar-schedule-line',
      actionView: 'my-practice'
    });

    showToast(`Practice for ${dateVal} scheduled successfully!`);
  }

  // Set selected date to this date so inspector opens it
  selectedCalDate = dateVal;
  const dateParts = dateVal.split('-');
  calYear = parseInt(dateParts[0]);
  calMonth = parseInt(dateParts[1]) - 1;

  persistData();
  closeModal('modalPractice');
  renderCurrentView();
}

function deleteScheduledPractice(id) {
  if (confirm('Are you sure you want to delete this scheduled practice session?')) {
    appData.practiceCalendar = (appData.practiceCalendar || []).filter(p => p.id !== id);
    persistData();
    renderCurrentView();
    showToast('Practice session removed from calendar!', 'ri-delete-bin-fill');
  }
}

// ----------------------------------------------------
// 7. MATCH NOTICES CRUD (COACH UPLOAD & PLAYER VIEW-ONLY)
// ----------------------------------------------------
function renderMatchNoticesHTML() {
  const isCoach = appData.activeRole === 'coach';

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="kabaddi-chip lion"><i class="ri-megaphone-fill"></i> TOURNAMENT BULLETIN</span>
          <span class="kabaddi-chip bonus">${(appData.matchNotices || []).length} NOTICES</span>
        </div>
        <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-cyan">📢 Match Notices (போட்டி அறிவிப்புகள்)</h2>
      </div>
      ${isCoach ? `
        <button class="btn btn-primary" onclick="openModalNotice()">
          <i class="ri-upload-cloud-line"></i> Upload / Create Match Notice (பதிவேற்றம்)
        </button>
      ` : ''}
    </div>

    ${(!appData.matchNotices || appData.matchNotices.length === 0) ? `
      <div class="glass-card" style="text-align:center; padding:40px;">
        <i class="ri-megaphone-line" style="font-size:3rem; color:var(--accent-orange); margin-bottom:12px; display:inline-block;"></i>
        <h3 class="text-gradient-orange">No Match Notices Published Yet</h3>
        <p style="color:#94a3b8; margin:8px 0 16px 0;">New match notices from Coach will appear here.</p>
        ${isCoach ? `<button class="btn btn-primary btn-sm" onclick="openModalNotice()">Create First Match Notice</button>` : ''}
      </div>
    ` : `
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap:24px;">
        ${appData.matchNotices.map(notice => `
          <div class="glass-card" style="display:flex; flex-direction:column; justify-content:space-between; border:1px solid rgba(0, 242, 254, 0.2); transition:transform 0.2s ease, box-shadow 0.2s ease;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='none'">
            <div>
              <!-- Poster Image Preview (Clickable for full view) -->
              <div style="position:relative; height:200px; border-radius:14px; overflow:hidden; margin-bottom:16px; border:1px solid var(--border-color); cursor:pointer; background:#000;" onclick="viewNoticeDetails(${notice.id})" title="Click to view full poster">
                <img src="${notice.image || 'assets/match_notice_poster.jpg'}" alt="Match Poster" style="width:100%; height:100%; object-fit:cover; transition:transform 0.3s ease;">
                <div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); padding:4px 10px; border-radius:20px; font-size:0.75rem; color:#fff; border:1px solid rgba(255,255,255,0.2);">
                  <i class="ri-zoom-in-line"></i> View Poster
                </div>
                <span class="kabaddi-chip lion" style="position:absolute; bottom:10px; left:10px; font-size:0.75rem;">
                  <i class="ri-trophy-fill"></i> MATCH DAY
                </span>
              </div>

              <h3 style="font-size:1.2rem; font-weight:800; margin-bottom:8px; color:#fff; cursor:pointer;" onclick="viewNoticeDetails(${notice.id})">
                ${notice.title}
              </h3>

              <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:0.85rem; color:var(--accent-orange); font-weight:700; margin-bottom:10px;">
                <span><i class="ri-calendar-event-fill"></i> ${notice.date}</span>
                <span><i class="ri-time-fill"></i> ${notice.time}</span>
              </div>

              <div style="font-size:0.85rem; color:#94a3b8; margin-bottom:12px;">
                <i class="ri-map-pin-2-fill" style="color:var(--accent-cyan);"></i> Location: <b style="color:#fff;">${notice.location}</b>
              </div>

              <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:12px 14px; border-radius:10px; font-size:0.85rem; color:#cbd5e1; margin-bottom:16px; line-height:1.5;">
                <i class="ri-chat-quote-line" style="color:var(--accent-orange); margin-right:4px;"></i> "${notice.message}"
              </div>
            </div>

            <!-- Action Controls based on Role -->
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px; margin-top:8px;">
              <button class="btn btn-sm btn-outline" style="color:var(--accent-cyan); border-color:rgba(0,242,254,0.4);" onclick="viewNoticeDetails(${notice.id})">
                <i class="ri-eye-line"></i> View Details
              </button>

              ${isCoach ? `
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-sm btn-outline" onclick="editMatchNotice(${notice.id})" title="Edit Notice">
                    <i class="ri-edit-line"></i> Edit
                  </button>
                  <button class="btn btn-sm btn-red" onclick="deleteMatchNotice(${notice.id})" title="Delete Notice">
                    <i class="ri-delete-bin-line"></i> Delete
                  </button>
                </div>
              ` : `
                <span style="font-size:0.75rem; color:var(--accent-green); font-weight:700;">
                  <i class="ri-checkbox-circle-fill"></i> Official Notice
                </span>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

function viewNoticeDetails(id) {
  const notice = (appData.matchNotices || []).find(n => n.id === id) || (appData.matchNotices ? appData.matchNotices[0] : null);
  if (!notice) return;

  const isCoach = appData.activeRole === 'coach';

  const modalHtml = `
    <div class="modal-overlay active" id="modalNoticeLightbox" onclick="if(event.target===this) closeModal('modalNoticeLightbox')">
      <div class="modal-card" style="max-width:680px; max-height:92vh; overflow-y:auto; padding:24px;">
        <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px;">
          <div>
            <span class="kabaddi-chip lion"><i class="ri-trophy-fill"></i> MATCH NOTICE</span>
            <h3 class="text-gradient-orange" style="margin-top:6px; font-size:1.3rem;">${notice.title}</h3>
          </div>
          <button class="modal-close" onclick="closeModal('modalNoticeLightbox')">&times;</button>
        </div>

        <div style="margin:16px 0; border-radius:14px; overflow:hidden; border:2px solid var(--accent-cyan); box-shadow:0 0 25px rgba(0,242,254,0.3); max-height:380px; text-align:center; background:#000;">
          <img src="${notice.image || 'assets/match_notice_poster.jpg'}" alt="${notice.title}" style="width:100%; max-height:380px; object-fit:contain;">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 16px;">
            <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">📅 DATE & TIME</div>
            <div style="font-size:0.95rem; font-weight:800; color:#fff; margin-top:2px;">${notice.date}</div>
            <div style="font-size:0.85rem; color:var(--accent-orange); font-weight:700;">⏰ ${notice.time}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 16px;">
            <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">📍 MATCH VENUE / GROUND</div>
            <div style="font-size:0.95rem; font-weight:800; color:#fff; margin-top:2px;">${notice.location}</div>
            <div style="font-size:0.8rem; color:var(--accent-cyan);">Official Match Arena</div>
          </div>
        </div>

        <div style="background:linear-gradient(135deg, rgba(255,94,0,0.08), rgba(0,242,254,0.04)); border:1px solid rgba(255,94,0,0.3); border-radius:14px; padding:16px; margin-bottom:20px;">
          <div style="font-size:0.82rem; color:var(--accent-orange); font-weight:800; margin-bottom:6px;">
            <i class="ri-megaphone-fill"></i> COACH MATCH-DAY INSTRUCTIONS (பயிற்சியாளர் அறிவிப்பு):
          </div>
          <div style="font-size:0.95rem; color:#e2e8f0; line-height:1.6;">
            "${notice.message}"
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <span style="font-size:0.8rem; color:#94a3b8;">
            <i class="ri-shield-check-fill" style="color:var(--accent-green);"></i> Head Coach: ${appData.coachProfile.name}
          </span>
          <div style="display:flex; gap:10px;">
            ${isCoach ? `
              <button class="btn btn-outline btn-sm" onclick="closeModal('modalNoticeLightbox'); editMatchNotice(${notice.id})">
                <i class="ri-edit-line"></i> Edit Notice
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" onclick="closeModal('modalNoticeLightbox'); showToast('👍 Match Notice acknowledged!', 'ri-checkbox-circle-fill')">
              <i class="ri-check-line"></i> Got It (புரிந்தது)
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById('modalNoticeLightbox');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function openModalNotice() {
  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Coach mattum thaan notice upload panna mudiyum!', 'ri-lock-fill');
    return;
  }
  document.getElementById('noticeEditId').value = '';
  document.getElementById('modalNoticeHeader').innerHTML = '<i class="ri-megaphone-fill"></i> Upload / Create Match Notice';
  document.getElementById('noticePreview').src = 'assets/match_notice_poster.jpg';
  document.getElementById('noticeTitle').value = 'Pro Kabaddi Championship Match Day Notice';
  document.getElementById('noticeDate').value = 'Saturday, October 26, 2026';
  document.getElementById('noticeTime').value = '7:30 PM IST';
  document.getElementById('noticeLocation').value = 'Home Arena Stadium';
  document.getElementById('noticeMessage').value = 'All players must report at 5:30 PM in team jersey kit.';
  openModal('modalNotice');
}

function editMatchNotice(id) {
  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Coach mattum thaan notice edit panna mudiyum!', 'ri-lock-fill');
    return;
  }
  const n = appData.matchNotices.find(item => item.id === id);
  if (!n) return;
  document.getElementById('noticeEditId').value = n.id;
  document.getElementById('modalNoticeHeader').innerHTML = '<i class="ri-edit-line"></i> Edit Match Notice';
  document.getElementById('noticeTitle').value = n.title;
  document.getElementById('noticeImage').value = n.image;
  document.getElementById('noticePreview').src = n.image;
  document.getElementById('noticeDate').value = n.date;
  document.getElementById('noticeTime').value = n.time;
  document.getElementById('noticeLocation').value = n.location;
  document.getElementById('noticeMessage').value = n.message;
  openModal('modalNotice');
}

function deleteMatchNotice(id) {
  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Coach mattum thaan notice delete panna mudiyum!', 'ri-lock-fill');
    return;
  }
  if (confirm('Are you sure you want to delete this match notice poster?')) {
    appData.matchNotices = appData.matchNotices.filter(item => item.id !== id);
    persistData();
    renderCurrentView();
    showToast('🗑️ Match Notice deleted successfully!', 'ri-delete-bin-fill');
  }
}

function handleCreateNotice(e) {
  e.preventDefault();

  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Coach mattum thaan notice save panna mudiyum!', 'ri-lock-fill');
    return;
  }

  const editId = document.getElementById('noticeEditId').value;
  const title = document.getElementById('noticeTitle').value.trim();
  const image = document.getElementById('noticeImage').value.trim();
  const date = document.getElementById('noticeDate').value.trim();
  const time = document.getElementById('noticeTime').value.trim();
  const location = document.getElementById('noticeLocation').value.trim();
  const message = document.getElementById('noticeMessage').value.trim();

  if (editId) {
    const notice = appData.matchNotices.find(n => n.id === parseInt(editId));
    if (notice) {
      notice.title = title;
      notice.image = image;
      notice.date = date;
      notice.time = time;
      notice.location = location;
      notice.message = message;
    }
    showToast('✅ Match Notice updated successfully!', 'ri-checkbox-circle-fill');
  } else {
    const newNotice = {
      id: Date.now(),
      title,
      image,
      date,
      time,
      location,
      message,
      status: 'Published'
    };
    if (!appData.matchNotices) appData.matchNotices = [];
    appData.matchNotices.unshift(newNotice);

    // Broadcast automated notification to players
    addAppNotification({
      title: `🏆 New Match Notice: ${title}`,
      desc: `Coach புதிய போட்டி அறிவிப்பு (${date} @ ${time}) வெளியிட்டுள்ளார்: ${location}`,
      target: 'all',
      type: 'notice',
      icon: 'ri-megaphone-fill',
      actionView: 'match-notices'
    });

    showToast('📢 New Match Notice published successfully!', 'ri-megaphone-fill');
  }

  persistData();
  closeModal('modalNotice');
  renderCurrentView();
}

// ----------------------------------------------------
// 5. INSTRUCTIONS CRUD FOR COACH
// ----------------------------------------------------
function openModalInstruction() {
  const select = document.getElementById('instPlayerSelect');
  select.innerHTML = appData.players.map(p => `<option value="${p.id}">${p.name} (${p.jersey} - ${p.position})</option>`).join('');
  document.getElementById('instEditId').value = '';
  document.getElementById('modalInstHeader').innerHTML = '<i class="ri-file-add-line"></i> Give Player Instruction';
  openModal('modalInstruction');
}

function editInstruction(id) {
  const inst = appData.instructions.find(i => i.id === id);
  if (!inst) return;

  openModalInstruction();
  document.getElementById('instEditId').value = inst.id;
  document.getElementById('modalInstHeader').innerHTML = `<i class="ri-edit-line"></i> Edit Instruction — ${inst.playerName}`;
  document.getElementById('instPlayerSelect').value = inst.playerId;
  document.getElementById('instTitle').value = inst.title;
  document.getElementById('instBody').value = inst.instruction;
  document.getElementById('instPriority').value = inst.priority;
  document.getElementById('instDate').value = inst.date;
}

function deleteInstruction(id) {
  if (confirm('Delete this player instruction?')) {
    appData.instructions = appData.instructions.filter(i => i.id !== id);
    persistData();
    renderCurrentView();
    showToast('Instruction deleted!');
  }
}

function handleSendInstruction(e) {
  e.preventDefault();
  const editId = document.getElementById('instEditId').value;
  const playerId = parseInt(document.getElementById('instPlayerSelect').value);
  const player = appData.players.find(p => p.id === playerId);
  const title = document.getElementById('instTitle').value;
  const instruction = document.getElementById('instBody').value;
  const priority = document.getElementById('instPriority').value;
  const date = document.getElementById('instDate').value;

  if (editId) {
    const inst = appData.instructions.find(i => i.id === parseInt(editId));
    if (inst) {
      inst.playerId = playerId;
      inst.playerName = player.name;
      inst.title = title;
      inst.instruction = instruction;
      inst.priority = priority;
      inst.date = date;
    }
    showToast('Instruction updated!');
  } else {
    const newInst = {
      id: Date.now(),
      playerId,
      playerName: player.name,
      title,
      instruction,
      priority,
      date,
      status: 'Active'
    };
    appData.instructions.unshift(newInst);

    // Send target player notification
    addAppNotification({
      title: `🎯 புது Instruction: ${title}`,
      desc: `Coach ${player.name}-க்கு "${title}" instruction assign பண்ணியுள்ளார்: ${instruction.substring(0, 75)}...`,
      target: 'player',
      playerId: playerId,
      type: 'instruction',
      icon: 'ri-file-list-3-line',
      actionView: 'my-instructions'
    });

    showToast(`Instruction sent to ${player.name}!`);
  }

  persistData();
  closeModal('modalInstruction');
  renderCurrentView();
}

// ----------------------------------------------------
// 8. PERFORMANCE TRACKING & COACH RATING ENGINE
// ----------------------------------------------------
let selectedPerformancePlayerId = null;

function getOrInitPlayerPerformance(playerId) {
  if (!appData.performance) {
    appData.performance = {};
  }
  
  if (!appData.performance[playerId]) {
    const player = appData.players.find(p => p.id === playerId);
    const pos = (player?.position || '').toLowerCase();
    
    let raid = 82;
    let defence = 78;
    let fitness = 85;
    let discipline = 92;
    let starRating = 4;
    let notes = 'Practice-la footwork nalla maintain pannu. Team match drills-la active-aa iru.';

    if (pos.includes('raider')) {
      raid = 88;
      defence = 72;
      fitness = 90;
      discipline = 94;
      starRating = 4;
      notes = 'Raid timing-la semma improvement. Bonus line attempt mattum innum konjam practice pannu.';
    } else if (pos.includes('defender')) {
      raid = 68;
      defence = 92;
      fitness = 88;
      discipline = 95;
      starRating = 4;
      notes = 'Ankle lock & thigh hold grip tactics strong-aa irukku. Chain tackle coordination super!';
    } else if (pos.includes('all')) {
      raid = 85;
      defence = 84;
      fitness = 89;
      discipline = 96;
      starRating = 5;
      notes = 'Super All-Round performance! Both raiding and defence contribution mass-aa irukku.';
    }

    appData.performance[playerId] = {
      raid,
      defence,
      fitness,
      discipline,
      starRating,
      notes,
      history: [
        { date: 'Sep 09', raid, defence, fitness }
      ]
    };
  }
  
  return appData.performance[playerId];
}

function selectPerformancePlayer(playerId) {
  selectedPerformancePlayerId = playerId;
  renderCurrentView();
}

function setCoachStarRating(playerId, rating) {
  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Coach mattum thaan rating poda mudiyum! (Only Coach can rate)', 'ri-lock-fill');
    return;
  }

  const perf = getOrInitPlayerPerformance(playerId);
  perf.starRating = rating;

  const container = document.getElementById('coachStarRatingContainer');
  if (container) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((s, idx) => {
      s.classList.toggle('filled', idx < rating);
    });
  }
  
  const ratingTexts = [
    '',
    '⭐ (1/5) - Needs Heavy Practice / கவனிக்க வேண்டும்',
    '⭐⭐ (2/5) - Average Form / சுமாரான ஆட்டம்',
    '⭐⭐⭐ (3/5) - Good Performer / நல்ல ஆட்டம்',
    '⭐⭐⭐⭐ (4/5) - Outstanding Form / சிறந்த ஆட்டம்',
    '⭐⭐⭐⭐⭐ (5/5) - Pro Star / Match Winner 🏆'
  ];
  const label = document.getElementById('coachStarRatingLabel');
  if (label) {
    label.innerText = ratingTexts[rating] || `${rating}/5 Stars`;
  }
}

function previewStarRating(rating) {
  if (appData.activeRole !== 'coach') return;
  const container = document.getElementById('coachStarRatingContainer');
  if (container) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((s, idx) => {
      s.classList.toggle('filled', idx < rating);
    });
  }
}

function resetPreviewStarRating(playerId) {
  if (appData.activeRole !== 'coach') return;
  const perf = getOrInitPlayerPerformance(playerId);
  const currentRating = perf.starRating || 4;
  previewStarRating(currentRating);
}

function updatePerfMetric(metricKey, val) {
  if (appData.activeRole !== 'coach') return;
  const numVal = parseInt(val, 10) || 0;
  const valBadge = document.getElementById(`perfVal_${metricKey}`);
  if (valBadge) valBadge.innerText = `${numVal}%`;
  const bar = document.getElementById(`perfBar_${metricKey}`);
  if (bar) bar.style.width = `${numVal}%`;
}

function addFeedbackSnippet(text) {
  if (appData.activeRole !== 'coach') return;
  const textarea = document.getElementById('coachPerfNotes');
  if (!textarea) return;
  if (textarea.value.trim().length > 0) {
    textarea.value = textarea.value.trim() + ' ' + text;
  } else {
    textarea.value = text;
  }
  textarea.focus();
}

function savePerformanceRecord(playerId) {
  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Coach mattum thaan save panna mudiyum!', 'ri-lock-fill');
    return;
  }

  const perf = getOrInitPlayerPerformance(playerId);
  const player = appData.players.find(p => p.id === playerId) || { name: 'Player' };
  
  const raid = parseInt(document.getElementById('perfRaidSlider')?.value, 10);
  const defence = parseInt(document.getElementById('perfDefenceSlider')?.value, 10);
  const fitness = parseInt(document.getElementById('perfFitnessSlider')?.value, 10);
  const discipline = parseInt(document.getElementById('perfDisciplineSlider')?.value, 10);
  const notes = document.getElementById('coachPerfNotes')?.value || '';
  
  if (!isNaN(raid)) perf.raid = raid;
  if (!isNaN(defence)) perf.defence = defence;
  if (!isNaN(fitness)) perf.fitness = fitness;
  if (!isNaN(discipline)) perf.discipline = discipline;
  perf.notes = notes;

  if (!perf.history) perf.history = [];
  perf.history.unshift({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    raid: perf.raid,
    defence: perf.defence,
    fitness: perf.fitness
  });
  if (perf.history.length > 5) perf.history.pop();

  persistData();

  // Send performance notification to target player
  addAppNotification({
    title: `⭐ Performance Score Updated: ${perf.starRating || 4}★ Rating`,
    desc: `Coach உங்கள் புதிய செயல்திறன் மதிப்பீட்டை (Raid: ${perf.raid}%, Defence: ${perf.defence}%, Fitness: ${perf.fitness}%) பதிவு செய்துள்ளார்.`,
    target: 'player',
    playerId: playerId,
    type: 'performance',
    icon: 'ri-star-smile-fill',
    actionView: 'my-performance'
  });

  showToast(`⭐ ${player.name}-oda Performance & ${perf.starRating}★ Rating Save aagiruchu!`, 'ri-star-smile-fill');
  renderCurrentView();
}

function renderPerformanceHTML() {
  if (!appData.players || appData.players.length === 0) {
    return `
      <div class="glass-card" style="text-align:center; padding:40px;">
        <h3 class="text-gradient-orange">No Players Found</h3>
        <p style="color:#94a3b8; margin:12px 0;">Please add players in the Players section first.</p>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('players')">Go to Players</button>
      </div>
    `;
  }

  const isCoach = appData.activeRole === 'coach';

  // If player role, prioritize active player
  if (!isCoach && appData.activePlayerId) {
    if (selectedPerformancePlayerId === null || !appData.players.some(p => p.id === selectedPerformancePlayerId)) {
      selectedPerformancePlayerId = appData.activePlayerId;
    }
  } else {
    if (selectedPerformancePlayerId === null || !appData.players.some(p => p.id === selectedPerformancePlayerId)) {
      selectedPerformancePlayerId = appData.players[0].id;
    }
  }

  const activePlayer = appData.players.find(p => p.id === selectedPerformancePlayerId) || appData.players[0];
  const perf = getOrInitPlayerPerformance(activePlayer.id);

  const starCount = Math.max(1, Math.min(5, perf.starRating || 4));
  const ratingTexts = [
    '',
    '⭐ (1/5) - Needs Heavy Practice',
    '⭐⭐ (2/5) - Average Form',
    '⭐⭐⭐ (3/5) - Good Performer',
    '⭐⭐⭐⭐ (4/5) - Outstanding Form',
    '⭐⭐⭐⭐⭐ (5/5) - Pro Star / Match Winner 🏆'
  ];

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="kabaddi-chip lion"><i class="ri-star-fill"></i> ${isCoach ? 'COACH EVALUATION PANEL' : 'MY PERFORMANCE & STATS'}</span>
          <span class="kabaddi-chip bonus">${isCoach ? `${appData.players.length} SQUAD PLAYERS` : `JERSEY ${activePlayer.jersey}`}</span>
        </div>
        <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-orange">
          📊 ${isCoach ? 'Player Performance Tracking' : `${activePlayer.name}'s Performance Card`}
        </h2>
      </div>
      <div>
        <span class="badge" style="background:rgba(0,242,254,0.1); color:var(--accent-cyan); border:1px solid rgba(0,242,254,0.3); padding:8px 14px; border-radius:20px; font-size:0.85rem;">
          <i class="ri-shield-user-fill"></i> Viewing: <b>${activePlayer.name} (${activePlayer.jersey})</b>
        </span>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:24px;" class="perf-grid-layout">
      <!-- Player Selection Column -->
      <div class="glass-card" style="padding:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="font-size:1rem; font-weight:700;" class="text-gradient-cyan">
            <i class="ri-user-search-line"></i> ${isCoach ? 'Select Player' : 'Team Squad'}
          </h3>
          <span style="font-size:0.75rem; color:#94a3b8;">${appData.players.length} Players</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; max-height:560px; overflow-y:auto; padding-right:4px;">
          ${appData.players.map(p => {
            const isSelected = p.id === activePlayer.id;
            const pPerf = getOrInitPlayerPerformance(p.id);
            const stars = '★'.repeat(pPerf.starRating || 4);
            const isMe = !isCoach && p.id === appData.activePlayerId;
            return `
              <div class="perf-player-item ${isSelected ? 'active' : ''}" onclick="selectPerformancePlayer(${p.id})">
                <img src="${p.photo}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid ${isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}; flex-shrink:0;">
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:700; font-size:0.92rem; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      ${p.name} ${isMe ? '<span style="color:var(--accent-green); font-size:0.75rem;">(You)</span>' : ''}
                    </span>
                    <span style="color:var(--accent-orange); font-size:0.8rem; font-weight:800; margin-left:6px;">${p.jersey}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                    <span style="font-size:0.75rem; color:#94a3b8;">${p.position}</span>
                    <span style="font-size:0.75rem; color:#fbbf24; font-weight:700;">${stars}</span>
                  </div>
                </div>
                ${isSelected ? `<i class="ri-checkbox-circle-fill" style="color:var(--accent-cyan); font-size:1.1rem;"></i>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Performance & Rating Details Column -->
      <div class="glass-card" style="padding:24px; border:1px solid rgba(0, 242, 254, 0.25); box-shadow:0 10px 30px rgba(0,0,0,0.5);">
        <!-- Top Header Card with Player Details & Star Rating -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:18px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="position:relative;">
              <img src="${activePlayer.photo}" style="width:68px; height:68px; border-radius:50%; object-fit:cover; border:3px solid var(--accent-cyan); box-shadow:0 0 15px rgba(0,242,254,0.4);">
              <span class="kabaddi-chip bonus" style="position:absolute; bottom:-6px; right:-6px; font-size:0.68rem; padding:2px 6px;">${activePlayer.jersey}</span>
            </div>
            <div>
              <h3 style="font-size:1.35rem; font-weight:800; color:#fff; margin-bottom:4px;">
                ${activePlayer.name} — <span class="text-gradient-orange">${activePlayer.position}</span>
              </h3>
              <div style="display:flex; align-items:center; gap:10px; font-size:0.82rem; color:#94a3b8;">
                <span><i class="ri-phone-line"></i> ${activePlayer.contact || 'N/A'}</span>
                <span>•</span>
                <span class="status-pill active" style="font-size:0.75rem; padding:2px 8px;">● Active Squad</span>
              </div>
            </div>
          </div>

          <!-- Coach Interactive or Read-Only Rating Section -->
          <div style="background:rgba(255,255,255,0.04); padding:12px 18px; border-radius:16px; border:1px solid rgba(255,183,3,0.25); text-align:right;">
            <div style="font-size:0.72rem; color:#fbbf24; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">
              <i class="ri-award-fill"></i> ${isCoach ? 'COACH RATING (ஸ்டார் ரேட்டிங்)' : 'COACH RATING GIVEN TO YOU'}
            </div>
            <div class="star-rating" id="coachStarRatingContainer" 
                 ${isCoach ? `onmouseleave="resetPreviewStarRating(${activePlayer.id})" title="Click to rate this player"` : `style="cursor:default;" title="Official Coach Rating"`}>
              ${[1, 2, 3, 4, 5].map(starNum => `
                <span class="star ${starNum <= starCount ? 'filled' : ''}" 
                      ${isCoach ? `onmouseenter="previewStarRating(${starNum})" onclick="setCoachStarRating(${activePlayer.id}, ${starNum})"` : ''}>★</span>
              `).join('')}
            </div>
            <div id="coachStarRatingLabel" style="font-size:0.78rem; color:#fef08a; font-weight:700; margin-top:4px;">
              ${ratingTexts[starCount] || `${starCount}/5 Stars`}
            </div>
          </div>
        </div>

        <!-- Metric Bars & Sliders -->
        <div style="margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <h4 style="font-size:0.95rem; font-weight:800;" class="text-gradient-cyan">
              <i class="ri-sound-module-fill"></i> Skill Performance Evaluation
            </h4>
            <span style="font-size:0.75rem; color:#94a3b8;">
              ${isCoach ? 'Move slider to adjust live %' : 'Coach evaluated skill scores'}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;" class="perf-metrics-grid">
            <!-- Raid Performance -->
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:14px;">
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700; margin-bottom:6px;">
                <span style="color:#fff;"><i class="ri-flashlight-fill" style="color:var(--accent-orange);"></i> Raid Performance</span>
                <span id="perfVal_raid" style="color:var(--accent-orange); font-weight:800; font-size:0.95rem;">${perf.raid}%</span>
              </div>
              <div style="height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; margin-bottom:${isCoach ? '8px' : '0'};">
                <div id="perfBar_raid" style="width:${perf.raid}%; height:100%; background:var(--grad-orange); transition:width 0.15s ease;"></div>
              </div>
              ${isCoach ? `<input type="range" class="perf-slider" id="perfRaidSlider" min="0" max="100" value="${perf.raid}" oninput="updatePerfMetric('raid', this.value)">` : ''}
            </div>

            <!-- Defence Performance -->
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:14px;">
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700; margin-bottom:6px;">
                <span style="color:#fff;"><i class="ri-shield-fill" style="color:var(--accent-cyan);"></i> Defence Performance</span>
                <span id="perfVal_defence" style="color:var(--accent-cyan); font-weight:800; font-size:0.95rem;">${perf.defence}%</span>
              </div>
              <div style="height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; margin-bottom:${isCoach ? '8px' : '0'};">
                <div id="perfBar_defence" style="width:${perf.defence}%; height:100%; background:var(--grad-cyan); transition:width 0.15s ease;"></div>
              </div>
              ${isCoach ? `<input type="range" class="perf-slider" id="perfDefenceSlider" min="0" max="100" value="${perf.defence}" oninput="updatePerfMetric('defence', this.value)">` : ''}
            </div>

            <!-- Fitness & Agility -->
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:14px;">
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700; margin-bottom:6px;">
                <span style="color:#fff;"><i class="ri-heart-pulse-fill" style="color:var(--accent-green);"></i> Fitness & Agility</span>
                <span id="perfVal_fitness" style="color:var(--accent-green); font-weight:800; font-size:0.95rem;">${perf.fitness}%</span>
              </div>
              <div style="height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; margin-bottom:${isCoach ? '8px' : '0'};">
                <div id="perfBar_fitness" style="width:${perf.fitness}%; height:100%; background:var(--grad-green); transition:width 0.15s ease;"></div>
              </div>
              ${isCoach ? `<input type="range" class="perf-slider" id="perfFitnessSlider" min="0" max="100" value="${perf.fitness}" oninput="updatePerfMetric('fitness', this.value)">` : ''}
            </div>

            <!-- Discipline & Temperament -->
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:14px;">
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700; margin-bottom:6px;">
                <span style="color:#fff;"><i class="ri-trophy-fill" style="color:var(--accent-purple);"></i> Discipline & Focus</span>
                <span id="perfVal_discipline" style="color:var(--accent-purple); font-weight:800; font-size:0.95rem;">${perf.discipline}%</span>
              </div>
              <div style="height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; margin-bottom:${isCoach ? '8px' : '0'};">
                <div id="perfBar_discipline" style="width:${perf.discipline}%; height:100%; background:var(--grad-purple); transition:width 0.15s ease;"></div>
              </div>
              ${isCoach ? `<input type="range" class="perf-slider" id="perfDisciplineSlider" min="0" max="100" value="${perf.discipline}" oninput="updatePerfMetric('discipline', this.value)">` : ''}
            </div>
          </div>
        </div>

        <!-- Coach Feedback Notes -->
        <div class="form-group" style="margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <label style="font-weight:700; color:#fff; font-size:0.9rem;">
              <i class="ri-chat-voice-fill" style="color:var(--accent-orange);"></i> Coach Feedback Notes (பயிற்சியாளர் குறிப்பு)
            </label>
            <span style="font-size:0.75rem; color:#94a3b8;">
              ${isCoach ? 'Tanglish / Tamil tips' : `From Head Coach: ${appData.coachProfile.name}`}
            </span>
          </div>

          ${isCoach ? `
            <!-- Quick Template Pills for Coach -->
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
              <span class="perf-tag-pill" onclick="addFeedbackSnippet('⚡ Raid footwork semma speed!')">+ ⚡ Raid Footwork</span>
              <span class="perf-tag-pill" onclick="addFeedbackSnippet('🛡️ Ankle lock timing super perfection!')">+ 🛡️ Ankle Lock Timing</span>
              <span class="perf-tag-pill" onclick="addFeedbackSnippet('🏃 Bonus line attempt innum fast-aa pannu.')">+ 🏃 Bonus Attempt</span>
              <span class="perf-tag-pill" onclick="addFeedbackSnippet('💪 Stamina drills 15 mins daily practice pannu.')">+ 💪 Stamina Drill</span>
              <span class="perf-tag-pill" onclick="addFeedbackSnippet('🎯 Do-or-die raid-la calm-aa iru.')">+ 🎯 Do-or-Die Calm</span>
            </div>

            <textarea class="form-control" id="coachPerfNotes" rows="3" placeholder="Player performance patri feedback and coach advice eluthunga...">${perf.notes || ''}</textarea>
          ` : `
            <!-- Read-Only Feedback Box for Player -->
            <div style="background:linear-gradient(135deg, rgba(255,255,255,0.03), rgba(0,242,254,0.04)); border:1px solid rgba(0,242,254,0.25); border-radius:14px; padding:16px 20px; color:#e2e8f0; font-size:0.95rem; line-height:1.6; display:flex; gap:12px; align-items:flex-start;">
              <i class="ri-double-quotes-l" style="font-size:1.6rem; color:var(--accent-orange); flex-shrink:0; line-height:1;"></i>
              <div>
                <div style="font-style:italic; margin-bottom:6px;">"${perf.notes || 'No specific feedback notes added yet. Keep giving your best in daily practice!'}"</div>
                <div style="font-size:0.75rem; color:var(--accent-cyan); font-weight:700;">— Coach ${appData.coachProfile.name}</div>
              </div>
            </div>
          `}
        </div>

        <!-- Action Controls -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-top:1px solid rgba(255,255,255,0.06); padding-top:16px;">
          <div style="font-size:0.8rem; color:#94a3b8;">
            <i class="ri-history-line"></i> Last updated: ${perf.history && perf.history[0] ? perf.history[0].date : 'Inaiku'}
          </div>

          ${isCoach ? `
            <!-- Coach Action Buttons -->
            <div style="display:flex; gap:10px;">
              <button class="btn btn-outline btn-sm" onclick="selectPerformancePlayer(${activePlayer.id})">
                <i class="ri-refresh-line"></i> Reset
              </button>
              <button class="btn btn-primary" style="padding:10px 24px; font-weight:800; box-shadow:0 0 15px rgba(0, 242, 254, 0.4);" onclick="savePerformanceRecord(${activePlayer.id})">
                <i class="ri-save-fill"></i> Save Record (சேமி)
              </button>
            </div>
          ` : `
            <!-- Player Motivation & Status Badge -->
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="kabaddi-chip lion" style="font-size:0.8rem;">
                <i class="ri-fire-fill"></i> Hard Work Pays Off!
              </span>
              <span style="color:var(--accent-green); font-size:0.82rem; font-weight:700;">
                <i class="ri-checkbox-circle-fill"></i> Verified by Coach
              </span>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderMyPerformanceHTML() { 
  if (appData.activePlayerId) {
    selectedPerformancePlayerId = appData.activePlayerId;
  }
  return renderPerformanceHTML(); 
}

// ----------------------------------------------------
// 9. DAILY CALENDAR ATTENDANCE & ₹10 FINE ENGINE
// ----------------------------------------------------
let selectedAttendanceDate = new Date().toISOString().split('T')[0];

function getOrInitAttendanceByDate() {
  if (!appData.attendanceByDate) {
    appData.attendanceByDate = {};
  }
  
  // Seed today's date if not present
  const todayStr = new Date().toISOString().split('T')[0];
  if (!appData.attendanceByDate[todayStr]) {
    appData.attendanceByDate[todayStr] = {};
    if (appData.todayAttendance && Array.isArray(appData.todayAttendance)) {
      appData.todayAttendance.forEach(a => {
        appData.attendanceByDate[todayStr][a.playerId] = a.status;
      });
    }
  }

  // Seed sample past dates if empty so calendar has instant historical records
  if (Object.keys(appData.attendanceByDate).length <= 1) {
    const d1 = '2026-09-08';
    const d2 = '2026-09-09';
    if (!appData.attendanceByDate[d1]) {
      appData.attendanceByDate[d1] = { 1: 'Present', 2: 'Present', 3: 'Absent', 4: 'Present', 5: 'Present' };
    }
    if (!appData.attendanceByDate[d2]) {
      appData.attendanceByDate[d2] = { 1: 'Present', 2: 'Absent', 3: 'Present', 4: 'Present', 5: 'Present' };
    }
  }

  if (!appData.playerFines) {
    appData.playerFines = {};
  }

  return appData.attendanceByDate;
}

function getPlayerAttendanceRecord(playerId, dateStr) {
  const attByDate = getOrInitAttendanceByDate();
  if (!attByDate[dateStr]) {
    attByDate[dateStr] = {};
  }
  if (!attByDate[dateStr][playerId]) {
    attByDate[dateStr][playerId] = 'Present'; // Default to Present
  }
  return attByDate[dateStr][playerId];
}

function calculatePlayerFines(playerId) {
  const attByDate = getOrInitAttendanceByDate();
  let absentDays = 0;
  let presentDays = 0;
  let lateDays = 0;
  let historyList = [];

  const sortedDates = Object.keys(attByDate).sort().reverse();
  sortedDates.forEach(dateKey => {
    const status = attByDate[dateKey][playerId] || 'Present';
    if (status === 'Absent') {
      absentDays++;
      historyList.push({ date: dateKey, status: 'Absent', fine: 10 });
    } else if (status === 'Present') {
      presentDays++;
      historyList.push({ date: dateKey, status: 'Present', fine: 0 });
    } else if (status === 'Late') {
      lateDays++;
      historyList.push({ date: dateKey, status: 'Late', fine: 0 });
    }
  });

  const player = appData.players.find(p => p.id === playerId);
  const baseAbsent = (player?.attendance?.absent || 0);
  const totalAbsentDays = Math.max(absentDays, baseAbsent);
  const totalFineAmount = totalAbsentDays * 10; // ₹10 per absent day!
  const paidFine = appData.playerFines?.[playerId]?.paidFine || 0;
  const dueFine = Math.max(0, totalFineAmount - paidFine);

  const totalTracked = presentDays + totalAbsentDays + lateDays;
  const attendancePct = totalTracked > 0 ? Math.round((presentDays / totalTracked) * 100) : (player?.attendance?.percentage || 90);

  return {
    absentDays: totalAbsentDays,
    presentDays,
    lateDays,
    totalFine: totalFineAmount,
    paidFine,
    dueFine,
    attendancePct,
    historyList
  };
}

function toggleAttendance(playerId, newStatus, dateStr = null) {
  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Coach mattum thaan Attendance mark panna mudiyum!', 'ri-lock-fill');
    return;
  }

  const targetDate = dateStr || selectedAttendanceDate || new Date().toISOString().split('T')[0];
  const attByDate = getOrInitAttendanceByDate();
  if (!attByDate[targetDate]) {
    attByDate[targetDate] = {};
  }
  attByDate[targetDate][playerId] = newStatus;

  // Sync today's array
  const todayStr = new Date().toISOString().split('T')[0];
  if (targetDate === todayStr) {
    if (!appData.todayAttendance) appData.todayAttendance = [];
    const rec = appData.todayAttendance.find(a => a.playerId === playerId);
    if (rec) rec.status = newStatus;
    else appData.todayAttendance.push({ playerId, status: newStatus });
  }

  const player = appData.players.find(p => p.id === playerId) || { name: 'Player' };
  
  if (newStatus === 'Absent' || newStatus === 'Late') {
    addAppNotification({
      title: `📋 Attendance Update: ${newStatus}`,
      desc: `Coach ${targetDate} தேதிக்கான உங்கள் வருகையை "${newStatus}" என பதிவு செய்துள்ளார்.${newStatus === 'Absent' ? ' (₹10 Fine சேர்க்கப்பட்டது)' : ''}`,
      target: 'player',
      playerId: playerId,
      type: 'attendance',
      icon: newStatus === 'Absent' ? 'ri-close-circle-line' : 'ri-time-line',
      actionView: 'my-attendance'
    });
  }

  persistData();
  renderCurrentView();

  if (newStatus === 'Absent') {
    showToast(`❌ ${player.name} Marked Absent (+₹10 Fine Added!)`, 'ri-money-rupee-circle-fill');
  } else if (newStatus === 'Present') {
    showToast(`✅ ${player.name} Marked Present (₹0 Fine)`, 'ri-checkbox-circle-fill');
  } else {
    showToast(`⏰ ${player.name} Marked Late`, 'ri-time-fill');
  }
}

function markAllPresentForDate(dateStr = null) {
  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Coach mattum thaan mark panna mudiyum!', 'ri-lock-fill');
    return;
  }

  const targetDate = dateStr || selectedAttendanceDate || new Date().toISOString().split('T')[0];
  const attByDate = getOrInitAttendanceByDate();
  if (!attByDate[targetDate]) {
    attByDate[targetDate] = {};
  }
  appData.players.forEach(p => {
    attByDate[targetDate][p.id] = 'Present';
  });

  const todayStr = new Date().toISOString().split('T')[0];
  if (targetDate === todayStr) {
    appData.todayAttendance = appData.players.map(p => ({ playerId: p.id, status: 'Present' }));
  }

  persistData();
  renderCurrentView();
  showToast(`⚡ All ${appData.players.length} players marked Present for ${targetDate}!`, 'ri-checkbox-circle-fill');
}

function setAttendanceDate(newDate) {
  selectedAttendanceDate = newDate;
  renderCurrentView();
}

function stepAttendanceDate(deltaDays) {
  const parts = selectedAttendanceDate.split('-').map(Number);
  const curr = new Date(parts[0], parts[1] - 1, parts[2]);
  curr.setDate(curr.getDate() + deltaDays);
  
  const y = curr.getFullYear();
  const m = String(curr.getMonth() + 1).padStart(2, '0');
  const d = String(curr.getDate()).padStart(2, '0');
  selectedAttendanceDate = `${y}-${m}-${d}`;
  renderCurrentView();
}

function collectPlayerFine(playerId) {
  if (appData.activeRole !== 'coach') {
    showToast('⚠️ Only Coach can collect/settle fines!', 'ri-lock-fill');
    return;
  }

  const player = appData.players.find(p => p.id === playerId) || { name: 'Player' };
  const fineInfo = calculatePlayerFines(playerId);

  if (fineInfo.dueFine <= 0) {
    showToast(`✅ ${player.name}-kku entha fine balance-um illa! (₹0 Fine Due)`, 'ri-check-line');
    return;
  }

  const payAmount = prompt(`${player.name}-oda Due Fine: ₹${fineInfo.dueFine} (${fineInfo.absentDays} Days Absent × ₹10)\n\nEvlo amount settle pannanum? (Enter amount to clear):`, fineInfo.dueFine);
  if (payAmount !== null) {
    const num = parseInt(payAmount, 10);
    if (!isNaN(num) && num > 0) {
      if (!appData.playerFines) appData.playerFines = {};
      if (!appData.playerFines[playerId]) appData.playerFines[playerId] = { paidFine: 0 };
      appData.playerFines[playerId].paidFine += num;

      persistData();
      renderCurrentView();
      showToast(`💰 ₹${num} Fine payment cleared for ${player.name}!`, 'ri-hand-coin-fill');
    }
  }
}

function renderAttendanceHTML() {
  const isCoach = appData.activeRole === 'coach';
  getOrInitAttendanceByDate();

  if (!isCoach) {
    return renderMyAttendanceHTML();
  }

  const targetDate = selectedAttendanceDate || new Date().toISOString().split('T')[0];
  const dateObj = new Date(targetDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

  // Calculate stats for selected date
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let totalTeamDueFine = 0;
  let totalTeamPaidFine = 0;

  appData.players.forEach(p => {
    const status = getPlayerAttendanceRecord(p.id, targetDate);
    if (status === 'Present') presentCount++;
    else if (status === 'Absent') absentCount++;
    else if (status === 'Late') lateCount++;

    const fines = calculatePlayerFines(p.id);
    totalTeamDueFine += fines.dueFine;
    totalTeamPaidFine += fines.paidFine;
  });

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="kabaddi-chip lion"><i class="ri-calendar-check-fill"></i> DAILY ATTENDANCE & FINE LEDGER</span>
          <span class="kabaddi-chip bonus">₹10 FINE / ABSENT DAY</span>
        </div>
        <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-cyan">
          ✅ Team Attendance & ₹10 Absent Fine Tracking
        </h2>
      </div>

      <div style="display:flex; gap:10px;">
        <button class="btn btn-green btn-sm" onclick="markAllPresentForDate('${targetDate}')">
          <i class="ri-checkbox-multiple-fill"></i> Mark All Present (அனைவரும் வருகை)
        </button>
      </div>
    </div>

    <!-- Calendar Date Switcher Bar -->
    <div class="att-date-bar">
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="stepAttendanceDate(-1)" title="Previous Day">
          <i class="ri-arrow-left-s-line"></i> Prev Day
        </button>

        <div style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.3); padding:6px 14px; border-radius:12px; border:1px solid var(--border-color);">
          <i class="ri-calendar-event-fill" style="color:var(--accent-cyan); font-size:1.1rem;"></i>
          <input type="date" value="${targetDate}" style="background:transparent; border:none; color:#fff; font-weight:700; font-size:0.92rem; outline:none; cursor:pointer;" onchange="setAttendanceDate(this.value)">
        </div>

        <button class="btn btn-outline btn-sm" onclick="stepAttendanceDate(1)" title="Next Day">
          Next Day <i class="ri-arrow-right-s-line"></i>
        </button>

        <button class="btn btn-sm ${targetDate === new Date().toISOString().split('T')[0] ? 'btn-primary' : 'btn-outline'}" onclick="setAttendanceDate(new Date().toISOString().split('T')[0])">
          📅 Today (இன்று)
        </button>
      </div>

      <div style="font-weight:800; font-size:0.95rem; color:#fff; display:flex; align-items:center; gap:8px;">
        <span class="text-gradient-orange">${formattedDate}</span>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="glass-card" style="display:flex; align-items:center; gap:14px; padding:16px;">
        <div class="icon-3d green"><i class="ri-checkbox-circle-fill"></i></div>
        <div>
          <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">PRESENT TODAY</div>
          <div style="font-size:1.6rem; font-weight:900; color:var(--accent-green);">${presentCount} / ${appData.players.length}</div>
        </div>
      </div>

      <div class="glass-card" style="display:flex; align-items:center; gap:14px; padding:16px;">
        <div class="icon-3d red" style="background:rgba(239,68,68,0.2); color:#f87171;"><i class="ri-close-circle-fill"></i></div>
        <div>
          <div style="font-size:0.75rem; color:#f87171; font-weight:700;">ABSENT (₹10/DAY)</div>
          <div style="font-size:1.6rem; font-weight:900; color:#f87171;">${absentCount} (${absentCount * 10 > 0 ? `+₹${absentCount * 10} Fine` : '₹0'})</div>
        </div>
      </div>

      <div class="glass-card" style="display:flex; align-items:center; gap:14px; padding:16px;">
        <div class="icon-3d orange"><i class="ri-money-rupee-circle-fill"></i></div>
        <div>
          <div style="font-size:0.75rem; color:var(--accent-orange); font-weight:700;">TOTAL DUE FINE POOL</div>
          <div style="font-size:1.6rem; font-weight:900; color:#fff;">₹${totalTeamDueFine}</div>
        </div>
      </div>

      <div class="glass-card" style="display:flex; align-items:center; gap:14px; padding:16px;">
        <div class="icon-3d cyan"><i class="ri-hand-coin-fill"></i></div>
        <div>
          <div style="font-size:0.75rem; color:var(--accent-cyan); font-weight:700;">TOTAL FINE COLLECTED</div>
          <div style="font-size:1.6rem; font-weight:900; color:var(--accent-cyan);">₹${totalTeamPaidFine}</div>
        </div>
      </div>
    </div>

    <!-- Attendance Roster Sheet -->
    <div class="glass-card" style="margin-bottom:32px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
        <h3 style="font-size:1.1rem; font-weight:800;" class="text-gradient-orange">
          <i class="ri-file-list-3-fill"></i> Attendance & Fine Roster — ${formattedDate}
        </h3>
        <span style="font-size:0.78rem; color:#94a3b8;">Click Present / Absent to automatically calculate fines</span>
      </div>

      <div class="table-responsive" style="overflow-x:auto;">
        <table class="att-table-compact">
          <thead>
            <tr>
              <th style="width:23%; text-align:left; padding-left:16px;">PLAYER</th>
              <th style="width:10%; text-align:center;">JERSEY</th>
              <th style="width:15%; text-align:center;">TODAY STATUS</th>
              <th style="width:12%; text-align:center;">ABSENTS</th>
              <th style="width:12%; text-align:center;">FINE (₹10/D)</th>
              <th style="width:18%; text-align:center;">MARK ATTENDANCE</th>
              <th style="width:10%; text-align:center; padding-right:16px;">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${appData.players.map(p => {
              const status = getPlayerAttendanceRecord(p.id, targetDate);
              const fineInfo = calculatePlayerFines(p.id);

              return `
                <tr>
                  <td style="vertical-align:middle; text-align:left; padding-left:16px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <img src="${p.photo}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1.5px solid var(--accent-cyan); flex-shrink:0;">
                      <div style="min-width:0;">
                        <div style="font-weight:700; color:#fff; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                        <div style="font-size:0.70rem; color:#94a3b8; white-space:nowrap;">${p.contact || 'No phone'}</div>
                      </div>
                    </div>
                  </td>
                  <td style="vertical-align:middle; text-align:center; white-space:nowrap;">
                    <span style="color:var(--accent-orange); font-weight:800; font-size:0.85rem;">${p.jersey}</span>
                    <div style="font-size:0.70rem; color:#94a3b8;">${p.position}</div>
                  </td>
                  <td style="vertical-align:middle; text-align:center; white-space:nowrap;">
                    ${status === 'Present' ? `
                      <span class="att-status-badge present att-badge-compact"><i class="ri-checkbox-circle-fill"></i> Present (₹0)</span>
                    ` : (status === 'Absent' ? `
                      <span class="att-status-badge absent att-badge-compact"><i class="ri-close-circle-fill"></i> Absent (+₹10)</span>
                    ` : `
                      <span class="att-status-badge late att-badge-compact"><i class="ri-time-fill"></i> Late</span>
                    `)}
                  </td>
                  <td style="vertical-align:middle; text-align:center; white-space:nowrap;">
                    <div style="font-weight:800; color:${fineInfo.absentDays > 0 ? '#f87171' : '#34d399'}; font-size:0.82rem; line-height:1.1;">
                      ${fineInfo.absentDays} Days
                    </div>
                    <div style="font-size:0.70rem; color:#94a3b8;">${fineInfo.attendancePct}% Disc</div>
                  </td>
                  <td style="vertical-align:middle; text-align:center; white-space:nowrap;">
                    ${fineInfo.dueFine > 0 ? `
                      <span class="fine-pill-due att-badge-compact">
                        <i class="ri-error-warning-fill"></i> ₹${fineInfo.dueFine} Due
                      </span>
                    ` : `
                      <span class="fine-pill-clean att-badge-compact">
                        <i class="ri-checkbox-circle-fill"></i> ₹0 Clean
                      </span>
                    `}
                  </td>
                  <td style="vertical-align:middle; text-align:center; white-space:nowrap;">
                    <div style="display:inline-flex; gap:4px; justify-content:center; align-items:center;">
                      <button class="btn btn-sm att-btn-compact ${status === 'Present' ? 'btn-primary' : 'btn-outline'}"
                              style="${status === 'Present' ? 'background:#10b981; border-color:#10b981; color:#fff;' : 'color:#34d399; border-color:rgba(16,185,129,0.4);'}"
                              onclick="toggleAttendance(${p.id}, 'Present', '${targetDate}')">
                        Present
                      </button>
                      <button class="btn btn-sm att-btn-compact ${status === 'Absent' ? 'btn-danger' : 'btn-outline'}"
                              style="${status === 'Absent' ? 'background:#ef4444; border-color:#ef4444; color:#fff;' : 'color:#f87171; border-color:rgba(239,68,68,0.4);'}"
                              onclick="toggleAttendance(${p.id}, 'Absent', '${targetDate}')">
                        Absent
                      </button>
                      <button class="btn btn-sm att-btn-compact ${status === 'Late' ? 'btn-warning' : 'btn-outline'}"
                              style="${status === 'Late' ? 'background:#f59e0b; border-color:#f59e0b; color:#fff;' : 'color:#fbbf24; border-color:rgba(245,158,11,0.4);'}"
                              onclick="toggleAttendance(${p.id}, 'Late', '${targetDate}')">
                        Late
                      </button>
                    </div>
                  </td>
                  <td style="vertical-align:middle; text-align:center; padding-right:16px; white-space:nowrap;">
                    ${fineInfo.dueFine > 0 ? `
                      <button class="btn btn-sm att-btn-compact btn-outline" style="color:#fbbf24; border-color:rgba(251,191,36,0.45); display:inline-flex; align-items:center; gap:4px;" onclick="collectPlayerFine(${p.id})">
                        <i class="ri-hand-coin-line"></i> Settle
                      </button>
                    ` : `
                      <span style="font-size:0.74rem; color:#94a3b8; display:inline-flex; align-items:center; gap:3px;">
                        <i class="ri-check-line" style="color:var(--accent-green); font-weight:800;"></i> Clear
                      </span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMyAttendanceHTML() {
  getOrInitAttendanceByDate();
  const activePlayer = appData.players.find(p => p.id === appData.activePlayerId) || appData.players[0];
  const fineInfo = calculatePlayerFines(activePlayer.id);

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="kabaddi-chip lion"><i class="ri-calendar-check-fill"></i> MY ATTENDANCE & FINE STATUS</span>
          <span class="kabaddi-chip bonus">JERSEY ${activePlayer.jersey}</span>
        </div>
        <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-cyan">
          📋 ${activePlayer.name}'s Attendance & Fine Statement
        </h2>
      </div>
    </div>

    <!-- Player Fine Summary Cards -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:18px; margin-bottom:28px;">
      <div class="glass-card" style="padding:18px; border:1px solid ${fineInfo.dueFine > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)'};">
        <div style="font-size:0.78rem; color:#94a3b8; font-weight:700; margin-bottom:4px;">CURRENT FINE DUE (செலுத்த வேண்டிய அபராதம்)</div>
        <div style="font-size:2rem; font-weight:900; color:${fineInfo.dueFine > 0 ? '#f87171' : 'var(--accent-green)'};">
          ₹${fineInfo.dueFine}
        </div>
        <div style="font-size:0.78rem; color:#cbd5e1; margin-top:4px;">
          ${fineInfo.dueFine > 0 ? `⚠️ ${fineInfo.absentDays} Absents × ₹10 = ₹${fineInfo.totalFine} (Paid: ₹${fineInfo.paidFine})` : '🎉 No fine pending! All clear.'}
        </div>
      </div>

      <div class="glass-card" style="padding:18px;">
        <div style="font-size:0.78rem; color:#94a3b8; font-weight:700; margin-bottom:4px;">ABSENT DAYS (விடுப்பு நாட்கள்)</div>
        <div style="font-size:2rem; font-weight:900; color:#f87171;">${fineInfo.absentDays} Days</div>
        <div style="font-size:0.78rem; color:#94a3b8; margin-top:4px;">Penalty rate: ₹10 / day</div>
      </div>

      <div class="glass-card" style="padding:18px;">
        <div style="font-size:0.78rem; color:#94a3b8; font-weight:700; margin-bottom:4px;">ATTENDANCE PERCENTAGE</div>
        <div style="font-size:2rem; font-weight:900; color:var(--accent-green);">${fineInfo.attendancePct}%</div>
        <div style="font-size:0.78rem; color:#94a3b8; margin-top:4px;">${fineInfo.presentDays} Sessions Present</div>
      </div>
    </div>

    <!-- Attendance History Table -->
    <div class="glass-card">
      <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:16px;" class="text-gradient-orange">
        <i class="ri-history-fill"></i> Recent Practice Attendance Log
      </h3>
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Fine Penalty</th>
              <th>Remarks / Coach Note</th>
            </tr>
          </thead>
          <tbody>
            ${fineInfo.historyList.length === 0 ? `
              <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:20px;">No attendance records found yet.</td></tr>
            ` : fineInfo.historyList.map(h => `
              <tr>
                <td style="font-weight:700; color:#fff;">📅 ${h.date}</td>
                <td>
                  ${h.status === 'Present' ? `
                    <span class="att-status-badge present"><i class="ri-checkbox-circle-fill"></i> Present</span>
                  ` : (h.status === 'Absent' ? `
                    <span class="att-status-badge absent"><i class="ri-close-circle-fill"></i> Absent</span>
                  ` : `
                    <span class="att-status-badge late"><i class="ri-time-fill"></i> Late</span>
                  `)}
                </td>
                <td>
                  ${h.fine > 0 ? `<span style="color:#f87171; font-weight:800;">+₹${h.fine} Fine</span>` : `<span style="color:var(--accent-green); font-weight:700;">₹0</span>`}
                </td>
                <td style="color:#94a3b8; font-size:0.85rem;">
                  ${h.status === 'Absent' ? 'Practice session miss aanathu - ₹10 fine applied' : 'Regular practice attended'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCommunicationHTML() {
  const isCoach = appData.activeRole === 'coach';

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-cyan">💬 Team Communication</h2>
      </div>
      ${isCoach ? `
        <button class="btn btn-orange" onclick="openModal('modalAnnouncement')">
          <i class="ri-broadcast-line"></i> Broadcast Announcement
        </button>
      ` : ''}
    </div>

    <div style="display:flex; flex-direction:column; gap:16px;">
      ${appData.messages.map(msg => `
        <div class="glass-card" style="border-left: 4px solid ${msg.type.includes('General') ? 'var(--accent-cyan)' : 'var(--accent-orange)'}; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
              <span style="font-size:0.8rem; font-weight:800; color:var(--accent-cyan);">${msg.type}</span>
              <span style="font-size:0.75rem; color:#94a3b8;">${msg.date}</span>
            </div>
            <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin-bottom:6px;">${msg.title}</h3>
            <p style="font-size:0.9rem; color:#cbd5e1;">${msg.content}</p>
          </div>
          ${isCoach ? `
            <button class="btn btn-sm btn-red" onclick="deleteAnnouncement(${msg.id})"><i class="ri-delete-bin-line"></i> Delete</button>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function deleteAnnouncement(id) {
  if (confirm('Delete this announcement message?')) {
    appData.messages = appData.messages.filter(m => m.id !== id);
    persistData();
    renderCurrentView();
    showToast('Announcement deleted!');
  }
}

// ----------------------------------------------------
// 11. TEAM MEMBERS & 12. FILES
// ----------------------------------------------------
function renderTeamMembersHTML() {
  const raiders = appData.players.filter(p => p.position.includes('Raider'));
  const defenders = appData.players.filter(p => p.position.includes('Defender'));
  const allrounders = appData.players.filter(p => p.position.includes('All-Rounder'));

  return `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-orange">👥 Team Members Overview</h2>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
      <div class="glass-card">
        <h3 class="text-gradient-orange" style="margin-bottom:16px;"><i class="ri-run-fill"></i> Raiders (${raiders.length})</h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${raiders.map(p => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <img src="${p.photo}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                <span style="font-weight:700; color:#fff;">${p.name}</span>
              </div>
              <span style="color:var(--accent-orange); font-weight:900;">${p.jersey}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="glass-card">
        <h3 class="text-gradient-cyan" style="margin-bottom:16px;"><i class="ri-shield-user-fill"></i> Defenders (${defenders.length})</h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${defenders.map(p => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <img src="${p.photo}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                <span style="font-weight:700; color:#fff;">${p.name}</span>
              </div>
              <span style="color:var(--accent-cyan); font-weight:900;">${p.jersey}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="glass-card">
        <h3 class="text-gradient-purple" style="margin-bottom:16px;"><i class="ri-flashlight-fill"></i> All-Rounders (${allrounders.length})</h3>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${allrounders.map(p => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <img src="${p.photo}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                <span style="font-weight:700; color:#fff;">${p.name}</span>
              </div>
              <span style="color:var(--accent-purple); font-weight:900;">${p.jersey}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ===================================================
// INDEXEDDB MEDIA BLOB STORAGE (FOR LARGE VIDEOS & ASSETS)
// ===================================================
const MEDIA_DB_NAME = 'ThaaiTamizhansMediaDB';
const MEDIA_DB_VERSION = 1;
const MEDIA_STORE_NAME = 'media_blobs';
const activeMediaObjectUrls = new Map();

function openMediaDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
          db.createObjectStore(MEDIA_STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function saveMediaBlobToDB(fileId, fileBlob) {
  try {
    const db = await openMediaDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      const store = tx.objectStore(MEDIA_STORE_NAME);
      store.put({ id: fileId, blob: fileBlob, name: fileBlob.name, type: fileBlob.type });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.error('Failed to save to IndexedDB:', e);
  }
}

async function getMediaBlobFromDB(fileId) {
  try {
    const db = await openMediaDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(MEDIA_STORE_NAME, 'readonly');
      const store = tx.objectStore(MEDIA_STORE_NAME);
      const req = store.get(fileId);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function deleteMediaBlobFromDB(fileId) {
  try {
    const db = await openMediaDB();
    if (!db) return;
    const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
    tx.objectStore(MEDIA_STORE_NAME).delete(fileId);
  } catch (e) {}
}

let uploadedFileTempData = null;
let selectedFileCategoryFilter = 'All';

function handleTeamFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const fileName = file.name;
  let fileSize = '1.0 MB';
  if (file.size < 1024 * 1024) {
    fileSize = (file.size / 1024).toFixed(1) + ' KB';
  } else {
    fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Detect File Type & Category
  let fileType = 'Document';
  let category = 'Tactics & Strategy';
  if (file.type.startsWith('image/')) {
    fileType = 'Image';
    category = 'Jersey & Media';
  } else if (file.type.startsWith('video/') || fileName.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
    fileType = 'Video';
    category = 'Practice Video';
  } else if (fileName.match(/\.(pdf)$/i)) {
    fileType = 'Document';
    category = 'Tactics & Strategy';
  }

  // Populate Input Fields
  const nameInput = document.getElementById('fileNameInput');
  const sizeInput = document.getElementById('fileSizeInput');
  const typeInput = document.getElementById('fileTypeInput');
  const catInput = document.getElementById('fileCategoryInput');

  if (nameInput) nameInput.value = fileName;
  if (sizeInput) sizeInput.value = fileSize;
  if (typeInput) typeInput.value = fileType;
  if (catInput) catInput.value = category;

  // Create an instantaneous Object URL (zero-delay preview without memory freezing)
  const objectUrl = URL.createObjectURL(file);

  uploadedFileTempData = {
    file: file,
    objectUrl: objectUrl,
    name: fileName,
    type: fileType,
    size: fileSize,
    mimeType: file.type
  };

  // Update Dropzone Preview UI
  const emptyState = document.getElementById('dropzoneEmptyState');
  const previewState = document.getElementById('dropzonePreviewState');
  const mediaContainer = document.getElementById('dropzoneMediaPreview');
  const nameBadge = document.getElementById('dropzoneFileName');
  const sizeBadge = document.getElementById('dropzoneFileSizeBadge');

  if (emptyState) emptyState.style.display = 'none';
  if (previewState) previewState.style.display = 'block';
  if (nameBadge) nameBadge.textContent = fileName;
  if (sizeBadge) sizeBadge.textContent = `File Size: ${fileSize} • Type: ${fileType}`;

  if (mediaContainer) {
    if (fileType === 'Image') {
      mediaContainer.innerHTML = `<img src="${objectUrl}" style="max-height:130px; border-radius:10px; border:1px solid var(--border-color); object-fit:cover; box-shadow:0 4px 15px rgba(0,0,0,0.5);">`;
    } else if (fileType === 'Video') {
      mediaContainer.innerHTML = `<video src="${objectUrl}" controls style="max-height:140px; border-radius:10px; border:1px solid var(--border-color); background:#000; box-shadow:0 4px 15px rgba(0,0,0,0.5);"></video>`;
    } else {
      mediaContainer.innerHTML = `<div class="icon-3d cyan" style="margin:0 auto; width:52px; height:52px; font-size:1.5rem;"><i class="ri-file-pdf-2-line"></i></div>`;
    }
  }
}

function openModalUploadFile() {
  uploadedFileTempData = null;
  const form = document.getElementById('formUploadFile');
  if (form) form.reset();
  const fileInput = document.getElementById('teamFileInput');
  if (fileInput) fileInput.value = '';

  const emptyState = document.getElementById('dropzoneEmptyState');
  const previewState = document.getElementById('dropzonePreviewState');
  if (emptyState) emptyState.style.display = 'block';
  if (previewState) previewState.style.display = 'none';

  openModal('modalUploadFile');
}

function filterFilesByCategory(cat) {
  selectedFileCategoryFilter = cat;
  renderCurrentView();
}

function renderFilesHTML() {
  const isCoach = appData.activeRole === 'coach';
  const allFiles = appData.files || [];

  const filteredFiles = allFiles.filter(f => {
    if (selectedFileCategoryFilter === 'All') return true;
    if (selectedFileCategoryFilter === 'Image') return f.type === 'Image';
    if (selectedFileCategoryFilter === 'Video') return f.type === 'Video';
    if (selectedFileCategoryFilter === 'Document') return f.type === 'Document';
    return true;
  });

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="kabaddi-chip lion"><i class="ri-folder-shared-fill"></i> SQUAD REPOSITORY</span>
          <span class="badge" style="background:rgba(0,242,254,0.15); color:var(--accent-cyan); border:1px solid rgba(0,242,254,0.35); padding:3px 10px; border-radius:12px; font-size:0.75rem;">
            ${allFiles.length} Total Files
          </span>
        </div>
        <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-cyan">📁 Team Files, Videos & Documents</h2>
      </div>
      ${isCoach ? `
        <button class="btn btn-primary" onclick="openModalUploadFile()" style="box-shadow:var(--theme-glow);">
          <i class="ri-upload-cloud-2-line"></i> Upload New File (Create)
        </button>
      ` : ''}
    </div>

    <!-- Category Filter Tabs -->
    <div style="display:flex; gap:10px; margin-bottom:24px; flex-wrap:wrap;">
      <button class="btn btn-sm ${selectedFileCategoryFilter === 'All' ? 'btn-primary' : 'btn-outline'}" onclick="filterFilesByCategory('All')">
        All Files (${allFiles.length})
      </button>
      <button class="btn btn-sm ${selectedFileCategoryFilter === 'Image' ? 'btn-primary' : 'btn-outline'}" onclick="filterFilesByCategory('Image')">
        🖼️ Photos & Images (${allFiles.filter(f => f.type === 'Image').length})
      </button>
      <button class="btn btn-sm ${selectedFileCategoryFilter === 'Video' ? 'btn-primary' : 'btn-outline'}" onclick="filterFilesByCategory('Video')">
        🎬 Practice Videos (${allFiles.filter(f => f.type === 'Video').length})
      </button>
      <button class="btn btn-sm ${selectedFileCategoryFilter === 'Document' ? 'btn-primary' : 'btn-outline'}" onclick="filterFilesByCategory('Document')">
        📄 Tactics & Documents (${allFiles.filter(f => f.type === 'Document').length})
      </button>
    </div>

    <!-- File Grid -->
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:22px;">
      ${filteredFiles.map(f => {
        let typeIcon = 'ri-file-text-line';
        if (f.type === 'Image') typeIcon = 'ri-image-line';
        else if (f.type === 'Video') typeIcon = 'ri-video-line';
        else if (f.type === 'Document') typeIcon = 'ri-file-pdf-2-line';

        return `
          <div class="glass-card file-card-box">
            <div>
              <!-- Media Thumbnail Banner -->
              <div class="file-card-thumb-wrap" onclick="previewFileItem(${f.id})" style="cursor:pointer;">
                ${f.type === 'Image' ? `
                  <img src="${f.url || f.thumbnail || 'assets/thaai_tamizhans_logo.jpg'}" alt="${f.name}">
                ` : (f.type === 'Video' ? `
                  <img src="${f.thumbnail || 'assets/kabaddi_arena_bg.jpg'}" alt="${f.name}">
                  <div class="file-play-overlay"><i class="ri-play-fill"></i></div>
                ` : `
                  <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;">
                    <div class="icon-3d cyan" style="width:54px; height:54px; font-size:1.6rem;"><i class="${typeIcon}"></i></div>
                    <span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">PDF / Tactical Document</span>
                  </div>
                `)}
              </div>

              <!-- Top Badges Row -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span class="file-type-pill">
                  <i class="${typeIcon}"></i> ${f.type.toUpperCase()}
                </span>
                <span class="file-size-pill">
                  <i class="ri-hard-drive-2-line"></i> ${f.size}
                </span>
              </div>

              <h4 style="font-weight:800; font-size:0.95rem; color:#fff; margin-bottom:4px; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${f.name}">
                ${f.name}
              </h4>
              <p style="font-size:0.80rem; color:#94a3b8; line-height:1.4; margin-bottom:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                ${f.description || (f.category ? `Category: ${f.category}` : 'Squad tactic & strategy document')}
              </p>
            </div>

            <!-- Card Bottom Meta & Actions -->
            <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:12px; margin-top:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="font-size:0.74rem; color:#64748b;">📅 ${f.date}</span>
                <span style="font-size:0.74rem; color:var(--accent-cyan); font-weight:700;">${f.category || f.type}</span>
              </div>

              <div style="display:flex; gap:8px; align-items:center;">
                <button class="btn btn-sm btn-outline" style="flex:1; font-size:0.78rem; gap:4px; color:var(--accent-cyan); border-color:rgba(0,242,254,0.35);" onclick="previewFileItem(${f.id})">
                  <i class="ri-eye-line"></i> ${f.type === 'Video' ? 'Watch Video' : 'View / Preview'}
                </button>
                <button class="btn btn-sm btn-primary" style="flex:1; font-size:0.78rem; gap:4px;" onclick="downloadFileItem(${f.id})">
                  <i class="ri-download-2-line"></i> Download (${f.size})
                </button>
                ${isCoach ? `
                  <button class="btn btn-sm btn-red" style="padding:6px 10px;" onclick="deleteFile(${f.id})" title="Delete File">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function handleUploadFile(e) {
  e.preventDefault();
  const name = document.getElementById('fileNameInput').value.trim();
  const type = document.getElementById('fileTypeInput').value;
  const category = document.getElementById('fileCategoryInput').value;
  const size = document.getElementById('fileSizeInput').value.trim() || '2.0 MB';
  const desc = document.getElementById('fileDescInput').value.trim();

  const newFileId = Date.now();
  let fileUrl = '';
  let fileThumbnail = (type === 'Video') ? 'assets/kabaddi_arena_bg.jpg' : 'assets/thaai_tamizhans_logo.jpg';

  if (uploadedFileTempData && uploadedFileTempData.file) {
    const rawFile = uploadedFileTempData.file;
    // Store binary file in IndexedDB so large videos never exceed LocalStorage quota
    await saveMediaBlobToDB(newFileId, rawFile);
    
    // Register active object URL for immediate playback in current tab
    const objUrl = URL.createObjectURL(rawFile);
    activeMediaObjectUrls.set(newFileId, objUrl);
    fileUrl = objUrl;
    if (type === 'Image') {
      fileThumbnail = objUrl;
    }
  } else {
    // Default preset fallback
    if (type === 'Image') {
      fileUrl = 'assets/thaai_tamizhans_logo.jpg';
      fileThumbnail = 'assets/thaai_tamizhans_logo.jpg';
    } else if (type === 'Video') {
      fileUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      fileThumbnail = 'assets/kabaddi_arena_bg.jpg';
    } else {
      fileUrl = 'assets/match_notice_poster.jpg';
      fileThumbnail = 'assets/match_notice_poster.jpg';
    }
  }

  const newFile = {
    id: newFileId,
    name,
    type,
    category,
    size,
    description: desc || `${category} - shared with players and coach.`,
    date: 'Inaiku — ' + new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
    url: fileUrl,
    hasIndexedDB: !!(uploadedFileTempData && uploadedFileTempData.file),
    thumbnail: fileThumbnail
  };

  if (!appData.files) appData.files = [];
  appData.files.unshift(newFile);

  // Broadcast file upload notification to players
  addAppNotification({
    title: `📁 புதிய File Upload: ${name}`,
    desc: `Coach ${category} பகுதியில் (${size}) புதிய ${type}-ஐ பதிவேற்றியுள்ளார். உடனே பார்க்கவும் / Download செய்யவும்.`,
    target: 'all',
    type: 'file',
    icon: (type === 'Video' ? 'ri-video-line' : (type === 'Image' ? 'ri-image-line' : 'ri-file-text-line')),
    actionView: 'files'
  });

  persistData();
  closeModal('modalUploadFile');
  renderCurrentView();
  showToast(`📁 "${name}" (${size}) வெற்றிகரமாக சேமிக்கப்பட்டது!`, 'ri-checkbox-circle-fill');
}

async function previewFileItem(id) {
  const file = (appData.files || []).find(f => f.id === id);
  if (!file) return;

  const typeIcon = document.getElementById('previewTypeIcon');
  const title = document.getElementById('previewFileTitle');
  const body = document.getElementById('previewModalBody');
  const meta = document.getElementById('previewMetaDetails');
  const downloadBtn = document.getElementById('previewDownloadBtn');

  if (typeIcon) typeIcon.textContent = file.type.toUpperCase();
  if (title) title.textContent = file.name;
  if (meta) meta.innerHTML = `📅 Uploaded: <b>${file.date}</b> • 🏷️ Category: <b>${file.category || file.type}</b> • 💾 Size: <b style="color:#34d399;">${file.size}</b>`;

  if (downloadBtn) {
    downloadBtn.setAttribute('onclick', `downloadFileItem(${file.id})`);
    downloadBtn.innerHTML = `<i class="ri-download-2-line"></i> Download File (${file.size})`;
  }

  // Resolve media URL (from active Object URL cache, IndexedDB blob, or static URL)
  let resolvedUrl = activeMediaObjectUrls.get(file.id) || file.url;
  if (!resolvedUrl || resolvedUrl === '') {
    const blob = await getMediaBlobFromDB(file.id);
    if (blob) {
      resolvedUrl = URL.createObjectURL(blob);
      activeMediaObjectUrls.set(file.id, resolvedUrl);
    } else {
      if (file.type === 'Video') {
        resolvedUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      } else if (file.type === 'Image') {
        resolvedUrl = 'assets/thaai_tamizhans_logo.jpg';
      } else {
        resolvedUrl = 'assets/match_notice_poster.jpg';
      }
    }
  }

  if (body) {
    if (file.type === 'Image') {
      body.innerHTML = `
        <div style="text-align:center; background:rgba(0,0,0,0.5); border-radius:14px; padding:12px; border:1px solid var(--border-color);">
          <img src="${resolvedUrl}" style="max-width:100%; max-height:460px; object-fit:contain; border-radius:10px;">
          ${file.description ? `<p style="margin-top:12px; font-size:0.85rem; color:#cbd5e1; text-align:left;"><b>Description:</b> ${file.description}</p>` : ''}
        </div>
      `;
    } else if (file.type === 'Video') {
      body.innerHTML = `
        <div style="background:#000; border-radius:14px; overflow:hidden; border:1px solid var(--border-color); box-shadow:0 8px 30px rgba(0,0,0,0.7);">
          <video src="${resolvedUrl}" controls autoplay playsinline style="width:100%; max-height:460px; display:block; outline:none;"></video>
          ${file.description ? `<div style="padding:14px; background:rgba(255,255,255,0.03);"><p style="font-size:0.85rem; color:#cbd5e1; margin:0;"><b>Coach Note / Drill:</b> ${file.description}</p></div>` : ''}
        </div>
      `;
    } else {
      body.innerHTML = `
        <div style="text-align:center; padding:36px 20px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:16px;">
          <div class="icon-3d cyan" style="width:68px; height:68px; font-size:2.2rem; margin:0 auto 16px;">
            <i class="ri-file-pdf-2-fill" style="color:#f87171;"></i>
          </div>
          <h3 style="color:#fff; font-size:1.25rem; font-weight:800; margin-bottom:8px;">${file.name}</h3>
          <p style="color:#94a3b8; font-size:0.88rem; max-width:500px; margin:0 auto 16px; line-height:1.5;">
            ${file.description || 'Official squad tactic playbook, defense charts & match guidelines.'}
          </p>
          <div style="display:inline-flex; align-items:center; gap:8px; margin-bottom:16px;">
            <span class="file-size-pill" style="font-size:0.85rem; padding:6px 14px;">
              <i class="ri-hard-drive-2-line"></i> File Size: ${file.size}
            </span>
            <span class="file-type-pill" style="font-size:0.85rem; padding:6px 14px;">
              <i class="ri-check-double-line"></i> Ready for Offline Study
            </span>
          </div>
        </div>
      `;
    }
  }

  openModal('modalFilePreview');
}

async function downloadFileItem(id) {
  const file = (appData.files || []).find(f => f.id === id);
  if (!file) return;

  let downloadUrl = activeMediaObjectUrls.get(file.id) || file.url;
  if (!downloadUrl || downloadUrl === '') {
    const blob = await getMediaBlobFromDB(file.id);
    if (blob) {
      downloadUrl = URL.createObjectURL(blob);
      activeMediaObjectUrls.set(file.id, downloadUrl);
    } else {
      downloadUrl = file.thumbnail || 'assets/thaai_tamizhans_logo.jpg';
    }
  }

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = file.name || 'kabaddi_team_file';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast(`⬇️ "${file.name}" (${file.size}) Download started!`);
}

async function deleteFile(id) {
  const file = (appData.files || []).find(f => f.id === id);
  const name = file ? file.name : 'this file';
  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    appData.files = appData.files.filter(f => f.id !== id);
    activeMediaObjectUrls.delete(id);
    await deleteMediaBlobFromDB(id);
    persistData();
    renderCurrentView();
    showToast(`🗑️ "${name}" deleted!`);
  }
}

// ----------------------------------------------------
// 17. MY INSTRUCTIONS (PLAYER VIEW WITH COACH EDIT/DELETE)
// ----------------------------------------------------
function renderMyInstructionsHTML() {
  const isCoach = appData.activeRole === 'coach';
  const activePlayer = appData.players.find(p => p.id === appData.activePlayerId) || appData.players[0];
  const list = isCoach ? appData.instructions : appData.instructions.filter(i => i.playerId === activePlayer.id);

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-orange">${isCoach ? '📋 All Player Instructions (Coach View)' : '📝 My Instructions'}</h2>
      </div>
      ${isCoach ? `
        <button class="btn btn-orange" onclick="openModalInstruction()"><i class="ri-file-add-line"></i> Give New Instruction</button>
      ` : ''}
    </div>

    <div style="display:flex; flex-direction:column; gap:16px;">
      ${list.length > 0 ? list.map(inst => `
        <div class="glass-card" style="border-left: 4px solid ${inst.priority.includes('High') ? 'var(--accent-red)' : 'var(--accent-cyan)'}; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
              <span class="badge-priority high">${inst.priority}</span>
              <span style="font-size:0.82rem; font-weight:800; color:var(--accent-orange);">Player: ${inst.playerName}</span>
              <span style="font-size:0.78rem; color:#94a3b8;">📅 Date: ${inst.date}</span>
            </div>
            <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin-bottom:6px;">${inst.title}</h3>
            <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:14px;">"${inst.instruction}"</p>
          </div>

          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:10px;">
            ${inst.status === 'Completed' ? `
              <span style="color:var(--accent-green); font-weight:800; font-size:0.88rem;"><i class="ri-check-double-line"></i> Completed</span>
            ` : `
              ${!isCoach ? `
                <button class="btn btn-green btn-sm" onclick="completeInstruction(${inst.id})">
                  <i class="ri-check-line"></i> Mark as Completed
                </button>
              ` : ''}
            `}
            ${isCoach ? `
              <div style="display:flex; gap:8px;">
                <button class="btn btn-sm btn-outline" style="color:var(--accent-cyan);" onclick="editInstruction(${inst.id})"><i class="ri-edit-line"></i> Edit</button>
                <button class="btn btn-sm btn-red" onclick="deleteInstruction(${inst.id})"><i class="ri-delete-bin-line"></i> Delete</button>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('') : '<p style="color:#94a3b8;">No instructions currently assigned.</p>'}
    </div>
  `;
}

function completeInstruction(id) {
  const inst = appData.instructions.find(i => i.id === id);
  if (inst) {
    inst.status = 'Completed';
    const activePlayer = (appData.players || []).find(p => p.id === inst.playerId) || { name: 'Player', jersey: '#07' };
    
    // Notify Coach that Player has completed the instruction
    addAppNotification({
      title: `🎯 ${activePlayer.name} (${activePlayer.jersey}) Instruction முடித்தார்`,
      desc: `${activePlayer.name} "${inst.title}" பயிற்சியை வெற்றிகரமாக முடித்தார் (Completed).`,
      target: 'coach',
      playerId: inst.playerId,
      type: 'ack',
      icon: 'ri-checkbox-circle-fill',
      actionView: 'players',
      senderRole: 'player',
      senderName: `${activePlayer.name} (${activePlayer.jersey})`
    });

    persistData();
    renderCurrentView();
    showToast('✅ Instruction completed! Confirmation sent to Coach.');
  }
}

// ----------------------------------------------------
// PROFILE & MODALS HELPERS
// ----------------------------------------------------
function viewPlayerProfile(playerId) {
  const player = appData.players.find(p => p.id === playerId);
  if (!player) return;

  const perf = appData.performance[playerId] || { raid: 80, defence: 75, fitness: 85, notes: 'Consistent performer.' };
  const insts = appData.instructions.filter(i => i.playerId === playerId);

  const modalHtml = `
    <div class="modal-overlay active" id="modalPlayerProfile">
      <div class="modal-card" style="max-width:650px;">
        <div class="modal-header">
          <h3 class="text-gradient-orange"><i class="ri-user-3-fill"></i> ${player.name}'s Profile</h3>
          <button class="modal-close" onclick="closeModal('modalPlayerProfile')">&times;</button>
        </div>
        
        <div style="display:flex; gap:20px; align-items:center; margin-bottom:24px; background:rgba(255,255,255,0.03); padding:16px; border-radius:16px; border:1px solid var(--border-color);">
          <div style="position:relative; width:84px; height:84px; flex-shrink:0;">
            <img src="${player.photo}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; object-position:center 20%; border:3px solid var(--accent-cyan); box-shadow:0 0 16px var(--glow-accent);">
            <button class="btn btn-sm btn-outline" onclick="openPhotoAdjusterForPlayer(${player.id})" title="Adjust Photo" style="position:absolute; bottom:-6px; right:-6px; padding:3px 8px; font-size:0.75rem; border-radius:10px; background:var(--bg-secondary); color:var(--accent-cyan); border-color:var(--accent-cyan);">
              <i class="ri-crop-line"></i>
            </button>
          </div>
          <div>
            <h3 style="font-size:1.3rem;">${player.name} <span style="color:var(--accent-orange);">${player.jersey}</span></h3>
            <p style="color:#94a3b8; font-size:0.85rem;">Position: <b>${player.position}</b> • Contact: <b>${player.contact}</b></p>
            <div style="margin-top:8px; display:flex; gap:10px; align-items:center;">
              <span class="status-pill active">● Active Squad</span>
              <button class="btn btn-sm btn-outline" style="color:var(--accent-cyan); border-color:var(--accent-cyan); padding:3px 10px; font-size:0.78rem;" onclick="openPhotoAdjusterForPlayer(${player.id})">
                <i class="ri-crop-line"></i> ✂️ Adjust Photo
              </button>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px; margin-bottom:20px;">
          <div style="background:rgba(0,0,0,0.3); padding:14px; border-radius:12px;">
            <div style="font-size:0.75rem; color:#94a3b8; font-weight:800;">ATTENDANCE</div>
            <div style="font-size:1.25rem; font-weight:900; color:var(--accent-green);">${player.attendance?.percentage || 100}%</div>
            <div style="font-size:0.72rem; color:#94a3b8; margin-top:2px;">${player.attendance?.present || 0} Present • ${player.attendance?.absent || 0} Absent</div>
          </div>
          <div style="background:rgba(0,0,0,0.3); padding:14px; border-radius:12px;">
            <div style="font-size:0.75rem; color:#94a3b8; font-weight:800;">COACH RATING</div>
            <div style="font-size:1.1rem; color:var(--accent-yellow); font-weight:800;">
              ${'⭐'.repeat(perf.starRating || 4)}
            </div>
            <div style="font-size:0.72rem; color:#94a3b8; margin-top:2px;">Active Squad Performer</div>
          </div>
        </div>

        <h4 style="font-size:0.95rem; margin-bottom:10px; color:var(--accent-cyan);">Coach Notes</h4>
        <p style="font-size:0.88rem; color:#cbd5e1; background:rgba(255,255,255,0.03); padding:12px; border-radius:10px; margin-bottom:20px;">
          "${perf.notes}"
        </p>

        <h4 style="font-size:0.95rem; margin-bottom:10px; color:var(--accent-orange);">Assigned Instructions (${insts.length})</h4>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:160px; overflow-y:auto;">
          ${insts.map(i => `
            <div style="background:rgba(0,0,0,0.2); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:700; font-size:0.85rem; color:#fff;">${i.title}</div>
                <div style="font-size:0.75rem; color:#94a3b8;">${i.instruction}</div>
              </div>
              <span class="badge-priority high">${i.priority}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalHtml;
  document.body.appendChild(tempDiv.firstElementChild);
}

function openModal(modalId) {
  if (modalId === 'modalInstruction') {
    const select = document.getElementById('instPlayerSelect');
    select.innerHTML = appData.players.map(p => `<option value="${p.id}">${p.name} (${p.jersey} - ${p.position})</option>`).join('');
  }
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.classList.remove('active');
    if (modalId === 'modalPlayerProfile') {
      setTimeout(() => el.remove(), 300);
    }
    // Clean up media video/audio to prevent background execution & audio leaks
    if (modalId === 'modalFilePreview') {
      const body = document.getElementById('previewModalBody');
      if (body) {
        const videos = body.querySelectorAll('video');
        videos.forEach(v => {
          try {
            v.pause();
            v.src = '';
            v.load();
          } catch(e) {}
        });
      }
    }
  }
}

// Global Backdrop Click & ESC Key Modal Dismissal
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
    if (e.target.id === 'modalPhotoAdjuster') {
      closePhotoAdjuster();
    } else {
      closeModal(e.target.id);
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    activeModals.forEach(m => {
      if (m.id === 'modalPhotoAdjuster') {
        closePhotoAdjuster();
      } else {
        closeModal(m.id);
      }
    });
    const drawer = document.getElementById('notifDrawer');
    if (drawer) drawer.classList.remove('active');
    const themeMenu = document.getElementById('themeMenu');
    if (themeMenu) themeMenu.classList.remove('active');
    const searchDropdown = document.getElementById('searchResultsDropdown');
    if (searchDropdown) searchDropdown.classList.remove('active');
  }
});

function renderProfileHTML() {
  const isCoach = appData.activeRole === 'coach';
  const profile = isCoach ? appData.coachProfile : (appData.players.find(p => p.id === appData.activePlayerId) || appData.players[0]);

  return `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-cyan">👤 ${isCoach ? 'Coach Profile' : 'My Player Profile'}</h2>
    </div>

    <div class="glass-card" style="max-width:640px;">
      <form onsubmit="handleSaveProfile(event)">
        
        <div style="display:flex; align-items:center; gap:20px; margin-bottom:24px; background:rgba(0,0,0,0.3); padding:16px; border-radius:16px; border:1px solid var(--border-color);">
          <div style="position:relative; width:90px; height:90px; flex-shrink:0;">
            <img src="${profile.photo}" id="profileAvatarPreview" style="width:100%; height:100%; border-radius:50%; object-fit:cover; object-position:center 20%; border:3px solid var(--accent-orange); box-shadow:var(--glow-orange);">
          </div>
          <div>
            <h3 style="font-size:1.3rem; font-weight:800; color:#fff;">${profile.name}</h3>
            <p style="color:var(--accent-cyan); font-weight:700; font-size:0.85rem;">${isCoach ? profile.experience : profile.position + ' (' + profile.jersey + ')'}</p>
            <div style="margin-top:6px; display:flex; gap:8px; align-items:center;">
              <button type="button" class="btn btn-sm btn-outline" style="color:var(--accent-cyan); border-color:var(--accent-cyan);" onclick="openPhotoAdjusterForCurrentProfile()">
                <i class="ri-crop-line"></i> ✂️ Adjust / Crop Photo
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Upload Photo</label>
          <input type="hidden" id="profilePhotoInput" value="${profile.photo}">
          
          <input type="file" id="profileFilePicker" accept="image/*" style="display:none;" onchange="handleFileChoose(this, 'profilePhotoInput', 'profileAvatarPreview')">
          
          <div class="image-upload-dropzone" onclick="document.getElementById('profileFilePicker').click()">
            <i class="ri-image-add-line" style="font-size:1.4rem; color:var(--accent-cyan);"></i>
            <div style="font-size:0.85rem; font-weight:700; color:#fff;">Upload Photo</div>
          </div>
        </div>


        <div class="form-group">
          <label>Full Name</label>
          <input type="text" class="form-control" id="profileNameInput" value="${profile.name}" required>
        </div>

        <div class="form-group">
          <label>Phone Contact</label>
          <input type="text" class="form-control" id="profilePhoneInput" value="${profile.phone || profile.contact || '+91 98765 43210'}">
        </div>

        <div class="form-group">
          <label>Email Address</label>
          <input type="email" class="form-control" id="profileEmailInput" value="${profile.email || 'coach@kabaddi.com'}">
        </div>

        ${isCoach ? `
          <div class="form-group">
            <label>Coaching Experience / Certification</label>
            <input type="text" class="form-control" id="profileExpInput" value="${profile.experience}">
          </div>
        ` : ''}

        <button type="submit" class="btn btn-primary"><i class="ri-check-double-line"></i> Save Profile</button>
      </form>
    </div>
  `;
}

function selectCoachPresetPhoto(url) {
  document.getElementById('profilePhotoInput').value = url;
  document.getElementById('profileAvatarPreview').src = url;
}

function handleSaveProfile(e) {
  e.preventDefault();
  const isCoach = appData.activeRole === 'coach';
  const newPhoto = document.getElementById('profilePhotoInput').value;
  const newName = document.getElementById('profileNameInput').value;
  const newPhone = document.getElementById('profilePhoneInput').value;
  const newEmail = document.getElementById('profileEmailInput').value;

  if (isCoach) {
    appData.coachProfile.photo = newPhoto;
    appData.coachProfile.name = newName;
    appData.coachProfile.phone = newPhone;
    appData.coachProfile.email = newEmail;
    appData.coachProfile.experience = document.getElementById('profileExpInput').value;
  } else {
    const activePlayer = appData.players.find(p => p.id === appData.activePlayerId) || appData.players[0];
    activePlayer.photo = newPhoto;
    activePlayer.name = newName;
    activePlayer.contact = newPhone;
    activePlayer.email = newEmail;
  }

  persistData();
  renderAppShell();
  renderCurrentView();
  showToast('Profile photo and details saved!');
}

function renderSettingsHTML() {
  const currentTheme = localStorage.getItem('thaai_tamizhans_theme') || 'cyber-neon';

  return `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 1.6rem; font-weight:800;" class="text-gradient-orange">⚙️ Settings & Theme Customization</h2>
    </div>

    <!-- Theme Customizer Section -->
    <div class="glass-card" style="max-width:920px; margin-bottom:24px;">
      <h3 style="font-size:1.15rem; font-weight:800; margin-bottom:6px;" class="text-gradient-cyan"><i class="ri-palette-fill"></i> Visual Theme Selection (2 Classic + 7 Mass 3D Kabaddi Themes)</h3>
      <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:18px;">Pick your favorite visual style for தாய் தமிழன்ஸ் portal (Sidebar & Content synchronizes with real-time 3D motion):</p>
      
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:14px;">
        <div onclick="setAppTheme('cyber-neon')" style="cursor:pointer; padding:16px 12px; border-radius:16px; border:2px solid ${currentTheme === 'cyber-neon' ? 'var(--accent-cyan)' : 'var(--glass-border)'}; background:rgba(0,242,254,0.08); text-align:center; transition:all 0.2s ease; box-shadow:${currentTheme === 'cyber-neon' ? '0 0 20px rgba(0,242,254,0.35)' : 'none'};">
          <div style="width:28px; height:28px; border-radius:50%; background:#00f2fe; margin:0 auto 8px; box-shadow:0 0 14px #00f2fe;"></div>
          <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">💎 Cyber Neon</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Cyan & Magenta Glass</div>
        </div>

        <div onclick="setAppTheme('royal-gold')" style="cursor:pointer; padding:16px 12px; border-radius:16px; border:2px solid ${currentTheme === 'royal-gold' ? 'var(--accent-gold)' : 'var(--glass-border)'}; background:rgba(251,191,36,0.08); text-align:center; transition:all 0.2s ease; box-shadow:${currentTheme === 'royal-gold' ? '0 0 20px rgba(251,191,36,0.35)' : 'none'};">
          <div style="width:28px; height:28px; border-radius:50%; background:#fbbf24; margin:0 auto 8px; box-shadow:0 0 14px #fbbf24;"></div>
          <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">👑 Royal Gold</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">24K Gold & Onyx</div>
        </div>

        <div onclick="setAppTheme('3d-kabaddi-arena')" style="cursor:pointer; padding:16px 12px; border-radius:16px; border:2px solid ${currentTheme === '3d-kabaddi-arena' ? '#ff5500' : 'var(--glass-border)'}; background:rgba(255,85,0,0.08); text-align:center; transition:all 0.2s ease; box-shadow:${currentTheme === '3d-kabaddi-arena' ? '0 0 20px rgba(255,85,0,0.45)' : 'none'};">
          <div style="width:28px; height:28px; border-radius:50%; background:#ff5500; margin:0 auto 8px; box-shadow:0 0 14px #ff5500, 0 0 22px #ffb700;"></div>
          <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">🔥 3D Arena</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Pro Kabaddi Court</div>
        </div>

        <div onclick="setAppTheme('3d-super-raider')" style="cursor:pointer; padding:16px 12px; border-radius:16px; border:2px solid ${currentTheme === '3d-super-raider' ? '#00f0ff' : 'var(--glass-border)'}; background:rgba(0,240,255,0.08); text-align:center; transition:all 0.2s ease; box-shadow:${currentTheme === '3d-super-raider' ? '0 0 20px rgba(0,240,255,0.45)' : 'none'};">
          <div style="width:28px; height:28px; border-radius:50%; background:#00f0ff; margin:0 auto 8px; box-shadow:0 0 14px #00f0ff, 0 0 22px #8b5cf6;"></div>
          <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">⚡ 3D Raider</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Velocity Streaks</div>
        </div>

        <div onclick="setAppTheme('3d-tackle-shield')" style="cursor:pointer; padding:16px 12px; border-radius:16px; border:2px solid ${currentTheme === '3d-tackle-shield' ? '#00ff88' : 'var(--glass-border)'}; background:rgba(0,255,136,0.08); text-align:center; transition:all 0.2s ease; box-shadow:${currentTheme === '3d-tackle-shield' ? '0 0 20px rgba(0,255,136,0.45)' : 'none'};">
          <div style="width:28px; height:28px; border-radius:50%; background:#00ff88; margin:0 auto 8px; box-shadow:0 0 14px #00ff88, 0 0 22px #ffd700;"></div>
          <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">🛡️ 3D Defence</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Ankle Lock Energy Web</div>
        </div>

        <div onclick="setAppTheme('3d-frog-jump')" style="cursor:pointer; padding:16px 12px; border-radius:16px; border:2px solid ${currentTheme === '3d-frog-jump' ? '#00ff88' : 'var(--glass-border)'}; background:rgba(0,255,136,0.08); text-align:center; transition:all 0.2s ease; box-shadow:${currentTheme === '3d-frog-jump' ? '0 0 20px rgba(0,255,136,0.45)' : 'none'};">
          <div style="width:28px; height:28px; border-radius:50%; background:#00ff88; margin:0 auto 8px; box-shadow:0 0 14px #00ff88, 0 0 22px #facc15;"></div>
          <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">🦘 3D Frog Jump</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Airborne Arc & Shockwave</div>
        </div>

        <div onclick="setAppTheme('3d-thigh-hold')" style="cursor:pointer; padding:16px 12px; border-radius:16px; border:2px solid ${currentTheme === '3d-thigh-hold' ? '#ff4500' : 'var(--glass-border)'}; background:rgba(255,69,0,0.08); text-align:center; transition:all 0.2s ease; box-shadow:${currentTheme === '3d-thigh-hold' ? '0 0 20px rgba(255,69,0,0.45)' : 'none'};">
          <div style="width:28px; height:28px; border-radius:50%; background:#ff4500; margin:0 auto 8px; box-shadow:0 0 14px #ff4500, 0 0 22px #dc2626;"></div>
          <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">🦵 3D Thigh Hold</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Iron Grip & Ground Cracks</div>
        </div>

        <div onclick="setAppTheme('3d-toe-touch')" style="cursor:pointer; padding:16px 12px; border-radius:16px; border:2px solid ${currentTheme === '3d-toe-touch' ? '#00e5ff' : 'var(--glass-border)'}; background:rgba(0,229,255,0.08); text-align:center; transition:all 0.2s ease; box-shadow:${currentTheme === '3d-toe-touch' ? '0 0 20px rgba(0,229,255,0.45)' : 'none'};">
          <div style="width:28px; height:28px; border-radius:50%; background:#00e5ff; margin:0 auto 8px; box-shadow:0 0 14px #00e5ff, 0 0 22px #ffe600;"></div>
          <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">🎯 3D Toe Touch</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Target Lock & Bonus Laser</div>
        </div>

        <div onclick="setAppTheme('3d-thalaivas-roar')" style="cursor:pointer; padding:16px 12px; border-radius:16px; border:2px solid ${currentTheme === '3d-thalaivas-roar' ? '#ffd700' : 'var(--glass-border)'}; background:rgba(255,215,0,0.08); text-align:center; transition:all 0.2s ease; box-shadow:${currentTheme === '3d-thalaivas-roar' ? '0 0 20px rgba(255,215,0,0.45)' : 'none'};">
          <div style="width:28px; height:28px; border-radius:50%; background:#ffd700; margin:0 auto 8px; box-shadow:0 0 14px #ffd700, 0 0 22px #2563eb;"></div>
          <div style="font-weight:800; font-size:0.88rem; color:var(--text-main);">🦁 3D Thalaivas</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Gold & Blue Mass Arena</div>
        </div>
      </div>
    </div>

    <!-- Firebase Real-Time Cloud Sync Card -->
    <div class="glass-card" style="max-width:920px; margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
        <div>
          <h3 style="font-size:1.15rem; font-weight:800; margin:0;" class="text-gradient-orange">
            <i class="ri-cloud-line"></i> Firebase Real-Time Cloud Database Sync (நேரலை டேட்டா சின்க்)
          </h3>
          <p style="font-size:0.82rem; color:var(--text-muted); margin:4px 0 0 0;">
            Mobile & Laptop Live Sync: Scores, attendance, practice routines and instructions sync automatically across all devices.
          </p>
        </div>
        <div id="settingsSyncStatusPill">
          ${(window.FirebaseSync && window.FirebaseSync.isConnected) 
            ? '<span class="badge-role coach" style="background:rgba(0,255,136,0.15); border-color:#00ff88; color:#00ff88;"><i class="ri-check-double-line"></i> 🟢 Connected to Cloud</span>' 
            : '<span class="badge-role player" style="background:rgba(250,204,21,0.15); border-color:#facc15; color:#facc15;"><i class="ri-wifi-off-line"></i> 💾 Local Cache Active</span>'}
        </div>
      </div>

      <div style="background:rgba(0,0,0,0.25); border:1px solid var(--glass-border); border-radius:14px; padding:16px; margin-bottom:18px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; font-size:0.82rem;">
          <div>
            <span style="color:#94a3b8;">Active Project ID:</span>
            <div style="font-weight:800; color:var(--accent-cyan); font-size:0.95rem; margin-top:2px;">
              ${(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.projectId) ? window.FIREBASE_CONFIG.projectId : 'thaai-tamizhans'}
            </div>
          </div>
          <div>
            <span style="color:#94a3b8;">Sync Engine:</span>
            <div style="font-weight:800; color:#34d399; font-size:0.95rem; margin-top:2px;">
              WebSocket onSnapshot (13 Collections)
            </div>
          </div>
          <div>
            <span style="color:#94a3b8;">Local Fallback:</span>
            <div style="font-weight:800; color:#fbbf24; font-size:0.95rem; margin-top:2px;">
              IndexedDB & LocalStorage Engine
            </div>
          </div>
        </div>
      </div>

      <!-- Cloud Actions -->
      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
        <button type="button" class="btn btn-sm btn-orange" onclick="triggerCloudSyncNow()">
          <i class="ri-upload-cloud-2-line"></i> ⚡ Push Squad Data to Cloud
        </button>
        <button type="button" class="btn btn-sm btn-outline" style="color:var(--accent-cyan); border-color:var(--accent-cyan);" onclick="triggerCloudSeed()">
          <i class="ri-database-2-line"></i> 🔄 Re-seed Cloud Collections
        </button>
        <button type="button" class="btn btn-sm btn-outline" onclick="testCloudConnection()">
          <i class="ri-wifi-line"></i> 🧪 Test Connection
        </button>
      </div>
    </div>

    <!-- Security & Password -->
    <div class="glass-card" style="max-width:700px;">
      <h3 style="font-size:1rem; margin-bottom:16px;" class="text-gradient-cyan">Security & Password</h3>
      <div class="form-group">
        <label>Current Password</label>
        <input type="password" class="form-control" value="••••••••">
      </div>
      <div class="form-group">
        <label>New Password</label>
        <input type="password" class="form-control" placeholder="Enter new password">
      </div>
      <button class="btn btn-court btn-sm" onclick="showToast('Password updated!')">Update Password</button>
    </div>
  `;
}

function triggerCloudSyncNow() {
  if (window.FirebaseSync && typeof window.FirebaseSync.forceSyncNow === 'function') {
    window.FirebaseSync.forceSyncNow();
    showToast('Pushing latest squad data to Firebase Cloud...', 'ri-upload-cloud-2-line');
  } else {
    showToast('Cloud Sync engine initializing...', 'ri-time-line');
  }
}

function triggerCloudSeed() {
  if (window.FirebaseSync && typeof window.FirebaseSync.seedAll11Collections === 'function') {
    window.FirebaseSync.seedAll11Collections();
    showToast('Seeding all 13 cloud collections with local data...', 'ri-database-2-line');
  } else {
    showToast('Cloud Sync engine initializing...', 'ri-time-line');
  }
}

function testCloudConnection() {
  if (window.FirebaseSync && window.FirebaseSync.db) {
    showToast('Testing Firebase Cloud connection...', 'ri-wifi-line');
    window.FirebaseSync.db.collection('thaai_tamizhans_club').doc('app_live_state').get()
      .then(() => {
        showToast('🟢 Cloud Connection Success! Firebase Firestore is live.', 'ri-checkbox-circle-fill');
        window.FirebaseSync.updateBadge('live', 'Live Cloud Sync');
      })
      .catch((err) => {
        console.warn('Connection test notice:', err.message);
        showToast('⚠️ Cloud status: ' + err.message, 'ri-error-warning-line');
      });
  } else {
    showToast('Firebase SDK offline or connecting...', 'ri-information-line');
  }
}

function handleSendAnnouncement(e) {
  e.preventDefault();
  const annType = document.getElementById('annType').value;
  const annTitle = document.getElementById('annTitle').value;
  const annContent = document.getElementById('annContent').value;

  const newMsg = {
    id: Date.now(),
    sender: 'Coach Rajan',
    type: annType,
    title: annTitle,
    content: annContent,
    date: 'Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: true
  };

  appData.messages.unshift(newMsg);

  // Broadcast announcement notification to players
  addAppNotification({
    title: `📢 Announcement: ${annTitle}`,
    desc: `${annContent.substring(0, 80)}...`,
    target: 'all',
    type: 'announcement',
    icon: 'ri-broadcast-line',
    actionView: 'coach-dashboard'
  });

  persistData();
  closeModal('modalAnnouncement');
  renderCurrentView();
  showToast('Announcement broadcasted to team!');
}

// ===================================================
// NOTIFICATIONS & PLAYER CONFIRMATION / ACK SYSTEM
// ===================================================

function addAppNotification({
  title,
  desc,
  target = 'all', // 'all' (all players) | 'player' (specific player) | 'coach'
  playerId = null, // specific target or source player id
  type = 'general', // 'instruction' | 'practice' | 'notice' | 'file' | 'attendance' | 'performance' | 'announcement' | 'ack'
  icon = 'ri-notification-3-line',
  actionView = null,
  senderRole = 'coach',
  senderName = 'Coach Rajan'
}) {
  if (!appData.notifications) appData.notifications = [];

  const notif = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title,
    desc,
    target,
    playerId: playerId ? parseInt(playerId) : null,
    type,
    icon,
    actionView,
    senderRole,
    senderName,
    time: 'Just now',
    createdAt: new Date().toISOString(),
    read: false,
    readByPlayers: [] // Array of player IDs who clicked Mark as Read
  };

  appData.notifications.unshift(notif);
  if (appData.notifications.length > 50) {
    appData.notifications = appData.notifications.slice(0, 50);
  }

  persistData();
  renderNotifications();
}

function toggleNotifications() {
  const drawer = document.getElementById('notifDrawer');
  if (drawer) {
    drawer.classList.toggle('active');
  }
}

function renderNotifications() {
  if (!appData.notifications) appData.notifications = [];

  const isPlayer = appData.activeRole === 'player';
  const activePlayerId = parseInt(appData.activePlayerId || 1);
  const activePlayer = (appData.players || []).find(p => p.id === activePlayerId) || { id: activePlayerId, name: 'Player', jersey: '#00' };

  // Filter notifications based on role
  let visibleNotifs = [];
  let unreadCount = 0;

  if (isPlayer) {
    // Player sees: broadcasts ('all') OR direct notifications targeted to them ('player' && playerId === activePlayerId)
    visibleNotifs = appData.notifications.filter(n => {
      if (n.target === 'coach') return false; // Coach-only receipts/logs are hidden from players
      if (n.target === 'player') return n.playerId === activePlayerId;
      return true; // 'all' or default
    });

    // Unread count for player:
    unreadCount = visibleNotifs.filter(n => {
      if (n.target === 'player') return !n.read;
      // For broadcast: unread if active player hasn't marked it as read
      return !(n.readByPlayers && n.readByPlayers.includes(activePlayerId));
    }).length;

  } else {
    // Coach sees all notifications (broadcasts sent, instructions, player acknowledgments/read receipts)
    visibleNotifs = appData.notifications;

    // Unread count for coach: unread player acknowledgments / receipts
    unreadCount = visibleNotifs.filter(n => {
      if (n.target === 'coach') return !n.read;
      return false;
    }).length;
  }

  // Update Topbar Bell Badge
  const badgeEl = document.getElementById('notifBadge');
  if (badgeEl) {
    badgeEl.innerText = unreadCount;
    badgeEl.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
  }

  // Update Drawer Heading & Pill
  const headingEl = document.getElementById('notifDrawerHeading');
  const pillEl = document.getElementById('notifUnreadPill');
  if (headingEl) {
    headingEl.innerText = isPlayer ? 'Player Notifications' : 'Coach Notification Centre';
  }
  if (pillEl) {
    pillEl.innerText = `${unreadCount} New`;
    pillEl.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }

  const container = document.getElementById('notifListContainer');
  if (!container) return;

  if (visibleNotifs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:32px 16px; color:#64748b;">
        <i class="ri-notification-off-line" style="font-size:2.2rem; opacity:0.6; display:block; margin-bottom:8px;"></i>
        <div style="font-size:0.85rem; font-weight:600; color:#94a3b8;">No notifications yet</div>
        <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">${isPlayer ? 'Coach assignments and updates will appear here.' : 'Player acknowledgments and team notices will appear here.'}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = visibleNotifs.map(n => {
    const isAck = n.type === 'ack';
    let isUnread = false;
    let hasPlayerRead = false;

    if (isPlayer) {
      if (n.target === 'player') {
        isUnread = !n.read;
        hasPlayerRead = n.read;
      } else {
        hasPlayerRead = n.readByPlayers && n.readByPlayers.includes(activePlayerId);
        isUnread = !hasPlayerRead;
      }
    } else {
      isUnread = n.target === 'coach' && !n.read;
    }

    // Determine color icon
    let iconClass = n.icon || 'ri-notification-3-line';
    let iconColor = isAck ? 'green' : (n.type === 'instruction' ? 'purple' : (n.type === 'practice' ? 'orange' : (n.type === 'file' ? 'gold' : (n.type === 'attendance' ? 'red' : 'cyan'))));

    // Get list of players who saw this notification (for Coach view)
    let seenPlayersText = '';
    if (!isPlayer && n.readByPlayers && n.readByPlayers.length > 0) {
      const names = n.readByPlayers.map(pid => {
        const p = (appData.players || []).find(pl => pl.id === pid);
        return p ? p.name : `Player #${pid}`;
      });
      seenPlayersText = names.join(', ');
    }

    return `
      <div class="notification-item ${isUnread ? 'unread' : ''} ${isAck ? 'ack-item' : ''}" onclick="handleNotifItemClick(${n.id})">
        <div class="icon-3d ${iconColor}" style="width:34px; height:34px; font-size:0.95rem; flex-shrink:0;">
          <i class="${iconClass}"></i>
        </div>
        
        <div class="notif-content-col">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-desc">${n.desc}</div>
          
          <div class="notif-item-meta">
            <span class="notif-item-time"><i class="ri-time-line"></i> ${n.time || 'Just now'}</span>
            ${n.actionView ? `<span class="notif-action-link" onclick="event.stopPropagation(); navigateTo('${n.actionView}'); toggleNotifications();">Open View →</span>` : ''}
          </div>

          ${isPlayer ? `
            ${!hasPlayerRead ? `
              <button class="btn-notif-ack" onclick="event.stopPropagation(); playerMarkNotificationAsRead(${n.id})">
                <i class="ri-check-line"></i> Mark as Read (பார்த்தேன்)
              </button>
            ` : `
              <div class="badge-seen">
                <i class="ri-check-double-line"></i> பார்த்தாச்சு (Confirmed)
              </div>
            `}
          ` : `
            ${isAck ? `
              <div class="badge-seen">
                <i class="ri-checkbox-circle-fill"></i> Player Confirmed Receipt
              </div>
            ` : (seenPlayersText ? `
              <div class="badge-seen-coach" title="Seen by players">
                <i class="ri-eye-line"></i> பார்த்தவர்கள்: <strong>${seenPlayersText}</strong>
              </div>
            ` : `
              <div style="font-size:0.67rem; color:#64748b; margin-top:4px;">
                <i class="ri-hourglass-line"></i> Waiting for player confirmation
              </div>
            `)}
          `}
        </div>
      </div>
    `;
  }).join('');
}

function handleNotifItemClick(notifId) {
  const notif = (appData.notifications || []).find(n => n.id === notifId);
  if (!notif) return;

  if (appData.activeRole === 'coach' && notif.target === 'coach') {
    notif.read = true;
    persistData();
    renderNotifications();
  }

  if (notif.actionView) {
    navigateTo(notif.actionView);
    toggleNotifications();
  }
}

function playerMarkNotificationAsRead(notifId) {
  if (!appData.notifications) return;
  const notif = appData.notifications.find(n => n.id === notifId);
  if (!notif) return;

  const activePlayerId = parseInt(appData.activePlayerId || 1);
  const activePlayer = (appData.players || []).find(p => p.id === activePlayerId) || { id: activePlayerId, name: 'Player', jersey: '#07' };

  if (!notif.readByPlayers) notif.readByPlayers = [];
  if (!notif.readByPlayers.includes(activePlayerId)) {
    notif.readByPlayers.push(activePlayerId);
  }

  if (notif.target === 'player' && notif.playerId === activePlayerId) {
    notif.read = true;
  }

  // ✨ CRITICAL REQUIREMENT: Send Read Receipt Notification to COACH!
  // "Player Atha Paathutta Mark As Read Click Panna Paathutan nu Solli Coach Ku Notification Varanum"
  addAppNotification({
    title: `✅ ${activePlayer.name} (${activePlayer.jersey || '#07'}) பார்த்தார்`,
    desc: `${activePlayer.name} notification-ஐ பார்த்து உறுதி செய்தார்: "${notif.title}"`,
    target: 'coach',
    playerId: activePlayer.id,
    type: 'ack',
    icon: 'ri-checkbox-circle-fill',
    actionView: notif.actionView || 'coach-dashboard',
    senderRole: 'player',
    senderName: `${activePlayer.name} (${activePlayer.jersey || '#07'})`
  });

  persistData();
  renderNotifications();
  showToast(`✅ "${notif.title}" பார்த்து உறுதி செய்யப்பட்டது! Coach-க்கு notification அனுப்பியாச்சு.`, 'ri-check-double-fill');
}

function markAllNotificationsRead() {
  if (!appData.notifications) return;
  const isPlayer = appData.activeRole === 'player';
  const activePlayerId = parseInt(appData.activePlayerId || 1);
  const activePlayer = (appData.players || []).find(p => p.id === activePlayerId) || { id: activePlayerId, name: 'Player', jersey: '#07' };

  if (isPlayer) {
    let newlyAcknowledged = 0;
    appData.notifications.forEach(n => {
      if (n.target === 'player' && n.playerId === activePlayerId) {
        if (!n.read) newlyAcknowledged++;
        n.read = true;
      }
      if (!n.readByPlayers) n.readByPlayers = [];
      if (!n.readByPlayers.includes(activePlayerId)) {
        newlyAcknowledged++;
        n.readByPlayers.push(activePlayerId);
      }
    });

    if (newlyAcknowledged > 0) {
      // Send summary ack to Coach
      addAppNotification({
        title: `✅ ${activePlayer.name} (${activePlayer.jersey || '#07'}) அனைத்து அறிவிப்புகளையும் பார்த்தார்`,
        desc: `${activePlayer.name} தனக்கான அனைத்து notification-களையும் பார்த்து உறுதி செய்தார்.`,
        target: 'coach',
        playerId: activePlayer.id,
        type: 'ack',
        icon: 'ri-checkbox-circle-fill',
        actionView: 'coach-dashboard',
        senderRole: 'player',
        senderName: `${activePlayer.name} (${activePlayer.jersey || '#07'})`
      });
    }

    showToast('All notifications marked as read! Confirmation sent to Coach.');
  } else {
    appData.notifications.forEach(n => {
      n.read = true;
    });
    showToast('All notifications cleared!');
  }

  persistData();
  renderNotifications();
}

// ===================================================
// GLOBAL SEARCH FUNCTIONALITY
// ===================================================
function handleGlobalSearch(query) {
  const dropdown = document.getElementById('searchResultsDropdown');
  const clearBtn = document.getElementById('searchClearBtn');
  if (!dropdown) return;

  const q = (query || '').trim().toLowerCase();
  if (!q) {
    dropdown.classList.remove('active');
    dropdown.innerHTML = '';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  if (clearBtn) clearBtn.style.display = 'flex';

  // Search across Players, Practice, Notices, Instructions
  const matchedPlayers = (appData.players || []).filter(p => 
    p.name.toLowerCase().includes(q) || 
    (p.position && p.position.toLowerCase().includes(q)) || 
    (p.jersey && p.jersey.toString().includes(q))
  ).slice(0, 4);

  const matchedPractices = (appData.practiceCalendar || []).filter(p => 
    p.title.toLowerCase().includes(q) || 
    (p.focus && p.focus.toLowerCase().includes(q)) ||
    (p.date && p.date.includes(q))
  ).slice(0, 3);

  const matchedNotices = (appData.matchNotices || []).filter(m => 
    m.title.toLowerCase().includes(q) || 
    (m.opponent && m.opponent.toLowerCase().includes(q))
  ).slice(0, 3);

  const matchedInstructions = (appData.instructions || []).filter(i => 
    i.title.toLowerCase().includes(q) || 
    (i.category && i.category.toLowerCase().includes(q))
  ).slice(0, 3);

  let html = '';

  if (matchedPlayers.length > 0) {
    html += `<div class="search-group-title">👥 PLAYERS / வீரர்கள் (${matchedPlayers.length})</div>`;
    matchedPlayers.forEach(p => {
      html += `
        <div class="search-item" onclick="selectSearchResult('players', ${p.id})">
          <img src="${p.photo}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1.5px solid var(--accent-cyan); flex-shrink:0;">
          <div>
            <div class="search-item-title">${p.name} <span style="color:var(--accent-gold); font-size:0.75rem;">#${p.jersey}</span></div>
            <div class="search-item-sub">${p.position} • Raid: ${p.raidPoints || 0} pts • Tackle: ${p.tacklePoints || 0} pts</div>
          </div>
        </div>
      `;
    });
  }

  if (matchedPractices.length > 0) {
    html += `<div class="search-group-title">🏋️ SCHEDULED PRACTICE (${matchedPractices.length})</div>`;
    matchedPractices.forEach(pr => {
      html += `
        <div class="search-item" onclick="selectSearchResult('practice', ${pr.id}, '${pr.date}')">
          <div class="search-item-badge" style="background:rgba(255,183,3,0.15); color:var(--accent-gold);"><i class="ri-calendar-event-line"></i></div>
          <div>
            <div class="search-item-title">${pr.title} <span style="font-size:0.72rem; color:var(--accent-cyan); font-weight:700;">(${pr.date})</span></div>
            <div class="search-item-sub">${pr.time} • ${pr.focus}</div>
          </div>
        </div>
      `;
    });
  }

  if (matchedNotices.length > 0) {
    html += `<div class="search-group-title">📢 MATCH NOTICES (${matchedNotices.length})</div>`;
    matchedNotices.forEach(mn => {
      html += `
        <div class="search-item" onclick="selectSearchResult('match-notices', ${mn.id})">
          <div class="search-item-badge" style="background:rgba(255,85,0,0.15); color:var(--accent-orange);"><i class="ri-megaphone-line"></i></div>
          <div>
            <div class="search-item-title">${mn.title}</div>
            <div class="search-item-sub">${mn.date} • ${mn.venue || 'Mat Court'}</div>
          </div>
        </div>
      `;
    });
  }

  if (matchedInstructions.length > 0) {
    html += `<div class="search-group-title">📝 INSTRUCTIONS (${matchedInstructions.length})</div>`;
    matchedInstructions.forEach(ins => {
      html += `
        <div class="search-item" onclick="selectSearchResult('instructions', ${ins.id})">
          <div class="search-item-badge" style="background:rgba(0,242,254,0.15); color:var(--accent-cyan);"><i class="ri-file-list-3-line"></i></div>
          <div>
            <div class="search-item-title">${ins.title}</div>
            <div class="search-item-sub">${ins.category} • Target: ${ins.target}</div>
          </div>
        </div>
      `;
    });
  }

  if (!html) {
    html = `<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:0.85rem;">
      <i class="ri-search-eye-line" style="font-size:1.8rem; display:block; margin-bottom:6px; opacity:0.6;"></i>
      No results found for "${query}"<br><span style="font-size:0.75rem;">முடிவுகள் எதுவும் கிடைக்கவில்லை</span>
    </div>`;
  }

  dropdown.innerHTML = html;
  dropdown.classList.add('active');
}

function clearGlobalSearch() {
  const input = document.getElementById('globalSearchInput');
  const dropdown = document.getElementById('searchResultsDropdown');
  const clearBtn = document.getElementById('searchClearBtn');
  if (input) input.value = '';
  if (dropdown) {
    dropdown.classList.remove('active');
    dropdown.innerHTML = '';
  }
  if (clearBtn) clearBtn.style.display = 'none';
}

function selectSearchResult(view, id, dateStr) {
  clearGlobalSearch();
  if (view === 'players') {
    navigateTo('players');
    setTimeout(() => {
      if (typeof selectPlayer === 'function') selectPlayer(id);
    }, 150);
  } else if (view === 'practice') {
    if (dateStr) selectCalendarDate(dateStr);
    navigateTo(appData.activeRole === 'coach' ? 'practice' : 'my-practice');
  } else if (view === 'match-notices') {
    navigateTo('match-notices');
  } else if (view === 'instructions') {
    navigateTo(appData.activeRole === 'coach' ? 'coach-dashboard' : 'my-instructions');
  }
}

// Close search dropdown when clicking outside
document.addEventListener('click', (e) => {
  const searchWrap = document.querySelector('.topbar-search-wrap');
  const dropdown = document.getElementById('searchResultsDropdown');
  if (dropdown && searchWrap && !searchWrap.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

// ====================================================
// 🏆 PRO KABADDI LIVE MATCH SCOREBOARD & 30s RAID TIMER
// ====================================================

let raidTimerInterval = null;
let matchClockInterval = null;
let soundEffectsEnabled = true;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playMatchSound(type) {
  if (!soundEffectsEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'buzzer') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(260, now);
      osc2.frequency.setValueAtTime(280, now);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } else if (type === 'whistle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.linearRampToValueAtTime(2800, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'doodie') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.2);
      osc.frequency.linearRampToValueAtTime(520, now + 0.4);
      osc.frequency.linearRampToValueAtTime(880, now + 0.6);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (type === 'super') {
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + (idx * 0.08));
        gain.gain.setValueAtTime(0.28, now + (idx * 0.08));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.08) + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + (idx * 0.08));
        osc.stop(now + (idx * 0.08) + 0.35);
      });
    } else if (type === 'fanfare') {
      const fanfareNotes = [
        { f: 523.25, t: 0.0, d: 0.2 },
        { f: 659.25, t: 0.15, d: 0.2 },
        { f: 783.99, t: 0.3, d: 0.2 },
        { f: 1046.50, t: 0.45, d: 0.5 },
        { f: 1318.51, t: 0.6, d: 0.8 }
      ];
      fanfareNotes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.35, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });
    } else if (type === 'referee-long') {
      // Powerful umpire double-blast whistle
      [0, 0.28].forEach(startT => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2600, now + startT);
        osc.frequency.linearRampToValueAtTime(3200, now + startT + 0.12);
        osc.frequency.linearRampToValueAtTime(2800, now + startT + 0.22);
        gain.gain.setValueAtTime(0.48, now + startT);
        gain.gain.exponentialRampToValueAtTime(0.01, now + startT + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startT);
        osc.stop(now + startT + 0.24);
      });
    } else if (type === 'bell') {
      // Last 5 minutes warning alert chime
      [0, 0.22, 0.44].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now + offset);
        gain.gain.setValueAtTime(0.4, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.35);
      });
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

function checkCoachScoreboardPermission() {
  if (appData.activeRole !== 'coach') {
    showToast('Player-kku scoreboard control permission illai! View mattumthaan panna mudiyum.', 'ri-lock-2-line');
    return false;
  }
  return true;
}

function blastRefereeWhistle() {
  if (!checkCoachScoreboardPermission()) return;
  playMatchSound('referee-long');
  showToast('📢 Naduvar Whistle Saththam Oliththathu! (Referee Whistle Blown!)', 'ri-volume-up-fill');
  addMatchEventLog('📢 Naduvar Whistle: Aattam Nirutham / Thodakkam', 'system');
}

function announceLast5Minutes() {
  if (!checkCoachScoreboardPermission()) return;
  playMatchSound('bell');
  showToast('⏱️ Kadaisi 5 Mins Aattam! (Official Last 5 Minutes Call!)', 'ri-alarm-warning-fill');
  addMatchEventLog('⏱️ Naduvar Arivippu: Kadaisi 5 Nimidam Aattam Thodangiyathu!', 'warning');
}

function ensureLiveMatchData() {
  if (!appData.liveMatch) {
    appData.liveMatch = {
      teamA: {
        name: 'Thaai Tamizhans (Valayapatti)',
        shortName: 'TTKC',
        score: 0,
        playersOnCourt: 7,
        totalPlayers: 7,
        raidPoints: 0,
        tacklePoints: 0,
        allOutPoints: 0,
        bonusPoints: 0
      },
      teamB: {
        name: 'Madurai Veeran (Melur)',
        shortName: 'OPP',
        score: 0,
        playersOnCourt: 7,
        totalPlayers: 7,
        raidPoints: 0,
        tacklePoints: 0,
        allOutPoints: 0,
        bonusPoints: 0
      },
      currentHalf: '1st Half',
      matchDurationMinutes: 40,
      matchTimeRemaining: 1200,
      isMatchClockRunning: false,
      raidTimeRemaining: 30,
      isRaidRunning: false,
      isDoOrDie: false,
      activeRaidingTeam: 'teamA',
      actionLog: [
        { time: '00:00', text: '🏆 Live Match Scoreboard Ready: Thaai Tamizhans vs Madurai Veeran', type: 'system' }
      ],
      historyStack: []
    };
    saveAppData(appData);
  }
  if (appData.liveMatch && appData.liveMatch.teamB && appData.liveMatch.teamB.name && (appData.liveMatch.teamB.name.includes('எதிரணி') || appData.liveMatch.teamB.name.includes('மதுரை வீரன்'))) {
    appData.liveMatch.teamB.name = 'Madurai Veeran (Melur)';
  }
  if (appData.liveMatch && appData.liveMatch.teamA && appData.liveMatch.teamA.name && appData.liveMatch.teamA.name.includes('தாய் தமிழன்ஸ்')) {
    appData.liveMatch.teamA.name = 'Thaai Tamizhans (Valayapatti)';
  }
  return appData.liveMatch;
}

// ----------------------------------------------------
// RAID TIMER CONTROLS
// ----------------------------------------------------
function toggleRaidTimer() {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  if (lm.isRaidRunning) {
    pauseRaidTimer();
  } else {
    startRaidTimer();
  }
}

function startRaidTimer() {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  if (lm.raidTimeRemaining <= 0) {
    lm.raidTimeRemaining = 30;
  }
  lm.isRaidRunning = true;
  clearInterval(raidTimerInterval);
  
  playMatchSound('whistle');

  raidTimerInterval = setInterval(() => {
    if (lm.raidTimeRemaining > 0) {
      lm.raidTimeRemaining--;
      if (lm.raidTimeRemaining <= 5 && lm.raidTimeRemaining > 0) {
        playMatchSound('tick');
      }
      updateRaidDisplayDOM();
    } else {
      pauseRaidTimer();
      playMatchSound('buzzer');
      showToast('⚠️ 30-Second Raid Time Expired!', 'ri-alarm-warning-line');
      addMatchEventLog(`⏱️ 30s Raid Time Expired for ${lm.activeRaidingTeam === 'teamA' ? lm.teamA.name : lm.teamB.name}`, 'warning');
    }
  }, 1000);

  updateRaidDisplayDOM();
}

function pauseRaidTimer() {
  const lm = ensureLiveMatchData();
  lm.isRaidRunning = false;
  clearInterval(raidTimerInterval);
  updateRaidDisplayDOM();
}

function resetRaidTimer(secs = 30) {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  clearInterval(raidTimerInterval);
  lm.isRaidRunning = false;
  lm.raidTimeRemaining = secs;
  updateRaidDisplayDOM();
}

function updateLiveScoreboardDOM() {
  const container = document.getElementById('mainViewContainer');
  if (container && currentView === 'live-scoreboard') {
    container.innerHTML = renderLiveScoreboardHTML();
  }
}

function toggleDoOrDie() {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  lm.isDoOrDie = !lm.isDoOrDie;
  if (lm.isDoOrDie) {
    playMatchSound('doodie');
    showToast('⚡ DO OR DIE RAID ACTIVATED! Must score a point!', 'ri-fire-fill');
    addMatchEventLog(`⚡ DO OR DIE RAID triggered for ${lm.activeRaidingTeam === 'teamA' ? lm.teamA.name : lm.teamB.name}!`, 'doodie');
  }
  saveAppData(appData);
  updateLiveScoreboardDOM();
}

function setRaidingTeam(teamKey) {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  lm.activeRaidingTeam = teamKey;
  resetRaidTimer(30);
  showToast(`🎯 Raiding Team: ${teamKey === 'teamA' ? lm.teamA.name : lm.teamB.name}`, 'ri-run-line');
  saveAppData(appData);
  updateLiveScoreboardDOM();
}

function updateRaidDisplayDOM() {
  const lm = ensureLiveMatchData();
  const digitEl = document.getElementById('raidTimerSeconds');
  const ringEl = document.getElementById('raidTimerRing');
  const btnEl = document.getElementById('raidTimerToggleBtn');
  
  if (digitEl) {
    digitEl.innerText = lm.raidTimeRemaining;
    if (lm.raidTimeRemaining <= 5) {
      digitEl.className = 'raid-seconds-num critical-pulse';
    } else if (lm.raidTimeRemaining <= 10) {
      digitEl.className = 'raid-seconds-num warning-yellow';
    } else {
      digitEl.className = 'raid-seconds-num normal';
    }
  }

  if (ringEl) {
    // Circumference = 2 * PI * 54 ≈ 339.29
    const maxOffset = 339.29;
    const progress = Math.max(0, lm.raidTimeRemaining / 30);
    const strokeDash = maxOffset * (1 - progress);
    ringEl.style.strokeDashoffset = strokeDash;
    if (lm.raidTimeRemaining <= 5) {
      ringEl.style.stroke = 'var(--accent-red)';
    } else if (lm.raidTimeRemaining <= 10) {
      ringEl.style.stroke = '#f59e0b';
    } else {
      ringEl.style.stroke = 'var(--accent-orange)';
    }
  }

  if (btnEl) {
    btnEl.innerHTML = lm.isRaidRunning
      ? '<i class="ri-pause-fill"></i> <span>Pause Raid</span>'
      : '<i class="ri-play-fill"></i> <span>Start Raid</span>';
    btnEl.className = lm.isRaidRunning ? 'raid-btn pause' : 'raid-btn start';
  }
}

// ----------------------------------------------------
// 20-MINUTE MATCH CLOCK CONTROLS
// ----------------------------------------------------
function toggleMatchClock() {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  if (lm.isMatchClockRunning) {
    pauseMatchClock();
  } else {
    startMatchClock();
  }
}

function startMatchClock() {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  lm.isMatchClockRunning = true;
  clearInterval(matchClockInterval);
  
  matchClockInterval = setInterval(() => {
    if (lm.matchTimeRemaining > 0) {
      lm.matchTimeRemaining--;
      updateMatchClockDOM();
    } else {
      pauseMatchClock();
      playMatchSound('buzzer');
      showToast(`🏁 ${lm.currentHalf} Time Up!`, 'ri-flag-line');
      addMatchEventLog(`🏁 ${lm.currentHalf} Time Over!`, 'system');
    }
  }, 1000);
  
  updateMatchClockDOM();
}

function pauseMatchClock() {
  const lm = ensureLiveMatchData();
  lm.isMatchClockRunning = false;
  clearInterval(matchClockInterval);
  updateMatchClockDOM();
}

function resetMatchClock() {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  clearInterval(matchClockInterval);
  lm.isMatchClockRunning = false;
  lm.matchTimeRemaining = 1200; // 20 mins
  updateMatchClockDOM();
}

function setMatchHalf(halfStr) {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  lm.currentHalf = halfStr;
  resetMatchClock();
  addMatchEventLog(`📢 Match Segment Changed: ${halfStr}`, 'system');
  saveAppData(appData);
  updateLiveScoreboardDOM();
}

function formatClockTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateMatchClockDOM() {
  const lm = ensureLiveMatchData();
  const el = document.getElementById('matchClockDisplay');
  const btn = document.getElementById('matchClockToggleBtn');
  if (el) el.innerText = formatClockTime(lm.matchTimeRemaining);
  if (btn) {
    btn.innerHTML = lm.isMatchClockRunning
      ? '<i class="ri-pause-circle-fill"></i>'
      : '<i class="ri-play-circle-fill"></i>';
    btn.title = lm.isMatchClockRunning ? 'Pause Match Clock' : 'Start Match Clock';
  }
}

// ----------------------------------------------------
// PRO KABADDI POINT & COURT ENGINE
// ----------------------------------------------------
function pushHistorySnapshot() {
  const lm = ensureLiveMatchData();
  if (!lm.historyStack) lm.historyStack = [];
  // Keep last 15 actions for undo
  const snapshot = {
    teamA: JSON.parse(JSON.stringify(lm.teamA)),
    teamB: JSON.parse(JSON.stringify(lm.teamB)),
    currentHalf: lm.currentHalf,
    raidTimeRemaining: lm.raidTimeRemaining,
    matchTimeRemaining: lm.matchTimeRemaining,
    isDoOrDie: lm.isDoOrDie,
    activeRaidingTeam: lm.activeRaidingTeam,
    actionLog: JSON.parse(JSON.stringify(lm.actionLog))
  };
  lm.historyStack.push(snapshot);
  if (lm.historyStack.length > 20) lm.historyStack.shift();
}

function undoLastMatchAction() {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  if (!lm.historyStack || lm.historyStack.length === 0) {
    showToast('⚠️ No actions left to undo!', 'ri-information-line');
    return;
  }
  const lastState = lm.historyStack.pop();
  lm.teamA = lastState.teamA;
  lm.teamB = lastState.teamB;
  lm.currentHalf = lastState.currentHalf;
  lm.raidTimeRemaining = lastState.raidTimeRemaining;
  lm.matchTimeRemaining = lastState.matchTimeRemaining;
  lm.isDoOrDie = lastState.isDoOrDie;
  lm.activeRaidingTeam = lastState.activeRaidingTeam;
  lm.actionLog = lastState.actionLog;

  saveAppData(appData);
  showToast('↩️ Last action undone successfully', 'ri-arrow-go-back-line');
  updateLiveScoreboardDOM();
}

function addMatchEventLog(text, type = 'normal') {
  const lm = ensureLiveMatchData();
  if (!lm.actionLog) lm.actionLog = [];
  const timeStr = formatClockTime(1200 - lm.matchTimeRemaining);
  lm.actionLog.unshift({ time: timeStr, text, type, ts: Date.now() });
  if (lm.actionLog.length > 50) lm.actionLog.pop();
}

function syncCurrentScheduledMatchScores() {
  const lm = ensureLiveMatchData();
  const currentSched = (appData.scheduledMatches || []).find(m => m.id === lm.activeScheduledMatchId);
  if (currentSched) {
    currentSched.scoreA = lm.teamA.score;
    currentSched.scoreB = lm.teamB.score;
    if (currentSched.status === 'Scheduled') {
      currentSched.status = 'Live';
    }
  }
}

function scoreRaidPoint(teamKey, points, isBonus = false) {
  if (!checkCoachScoreboardPermission()) return;
  pushHistorySnapshot();
  const lm = ensureLiveMatchData();
  const scoringTeam = teamKey === 'teamA' ? lm.teamA : lm.teamB;
  const opposingTeam = teamKey === 'teamA' ? lm.teamB : lm.teamA;
  
  scoringTeam.score += points;

  if (isBonus) {
    scoringTeam.bonusPoints += points;
    scoringTeam.raidPoints += points;
    playMatchSound('whistle');
    addMatchEventLog(`⭐ +${points} BONUS Point scored by ${scoringTeam.name}!`, 'bonus');
    showToast(`⭐ +${points} Bonus Point for ${scoringTeam.name}!`, 'ri-star-fill');
  } else {
    scoringTeam.raidPoints += points;
    
    // Revive players for scoring team
    if (scoringTeam.playersOnCourt < 7) {
      const revived = Math.min(points, 7 - scoringTeam.playersOnCourt);
      scoringTeam.playersOnCourt += revived;
    }

    // Put opposing players OUT
    opposingTeam.playersOnCourt = Math.max(0, opposingTeam.playersOnCourt - points);

    if (points >= 3) {
      playMatchSound('super');
      showToast(`🔥💥 SUPER RAID! +${points} Points for ${scoringTeam.name}!`, 'ri-fire-fill');
      addMatchEventLog(`🔥💥 SUPER RAID: +${points} Touch Points by ${scoringTeam.name}! (${opposingTeam.name} court: ${opposingTeam.playersOnCourt}/7)`, 'super');
    } else {
      playMatchSound('whistle');
      showToast(`⚡ +${points} Touch Point(s) for ${scoringTeam.name}`, 'ri-run-line');
      addMatchEventLog(`⚡ +${points} Touch Point by ${scoringTeam.name} (${opposingTeam.name} players: ${opposingTeam.playersOnCourt}/7)`, 'touch');
    }

    // Auto-check All-Out
    if (opposingTeam.playersOnCourt === 0) {
      scoreAllOut(teamKey);
    }
  }

  // Turn off do-or-die and switch raid team
  lm.isDoOrDie = false;
  lm.activeRaidingTeam = (teamKey === 'teamA') ? 'teamB' : 'teamA';
  resetRaidTimer(30);

  syncCurrentScheduledMatchScores();
  saveAppData(appData);
  updateLiveScoreboardDOM();
}

function scoreTacklePoint(defendingTeamKey, isSuperTackle = false) {
  if (!checkCoachScoreboardPermission()) return;
  pushHistorySnapshot();
  const lm = ensureLiveMatchData();
  const defendingTeam = defendingTeamKey === 'teamA' ? lm.teamA : lm.teamB;
  const raidingTeam = defendingTeamKey === 'teamA' ? lm.teamB : lm.teamA;

  // If super tackle (defenders <= 3) -> 2 points
  const points = (isSuperTackle || defendingTeam.playersOnCourt <= 3) ? 2 : 1;
  defendingTeam.score += points;
  defendingTeam.tacklePoints += points;

  // Revive 1 defender
  if (defendingTeam.playersOnCourt < 7) {
    defendingTeam.playersOnCourt += 1;
  }

  // Raiding player is out
  raidingTeam.playersOnCourt = Math.max(0, raidingTeam.playersOnCourt - 1);

  if (points === 2) {
    playMatchSound('super');
    showToast(`🛡️💥 SUPER TACKLE! +2 Points for ${defendingTeam.name}!`, 'ri-shield-flash-fill');
    addMatchEventLog(`🛡️💥 SUPER TACKLE: +2 Points by ${defendingTeam.name}! Raider is OUT.`, 'super');
  } else {
    playMatchSound('whistle');
    showToast(`🛡️ +1 Tackle Point for ${defendingTeam.name}`, 'ri-shield-line');
    addMatchEventLog(`🛡️ +1 Tackle Point by ${defendingTeam.name}. Raider is OUT.`, 'tackle');
  }

  // Auto-check All-Out for raiding team
  if (raidingTeam.playersOnCourt === 0) {
    scoreAllOut(defendingTeamKey);
  }

  // Next raid switches to defending team
  lm.isDoOrDie = false;
  lm.activeRaidingTeam = defendingTeamKey;
  resetRaidTimer(30);

  syncCurrentScheduledMatchScores();
  saveAppData(appData);
  updateLiveScoreboardDOM();
}

function scoreAllOut(inflictingTeamKey) {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  const inflictingTeam = inflictingTeamKey === 'teamA' ? lm.teamA : lm.teamB;
  const victimTeam = inflictingTeamKey === 'teamA' ? lm.teamB : lm.teamA;

  inflictingTeam.score += 2;
  inflictingTeam.allOutPoints += 2;
  
  // Revive all 7 players of victim team
  victimTeam.playersOnCourt = 7;

  playMatchSound('super');
  showToast(`👑 ALL-OUT! +2 Extra Points for ${inflictingTeam.name}! All 7 players revived!`, 'ri-trophy-fill');
  addMatchEventLog(`👑 ALL-OUT inflicted on ${victimTeam.name}! +2 All-Out Points for ${inflictingTeam.name}. All 7 players back on mat.`, 'super');

  syncCurrentScheduledMatchScores();
  saveAppData(appData);
  updateLiveScoreboardDOM();
}

function recordEmptyRaid() {
  if (!checkCoachScoreboardPermission()) return;
  pushHistorySnapshot();
  const lm = ensureLiveMatchData();
  const raidingTeamName = lm.activeRaidingTeam === 'teamA' ? lm.teamA.name : lm.teamB.name;
  
  playMatchSound('whistle');
  addMatchEventLog(`⚪ Empty Raid by ${raidingTeamName} (0 Pts)`, 'empty');
  showToast(`⚪ Empty Raid completed by ${raidingTeamName}`, 'ri-checkbox-blank-circle-line');

  // Switch raid team
  lm.isDoOrDie = false;
  lm.activeRaidingTeam = (lm.activeRaidingTeam === 'teamA') ? 'teamB' : 'teamA';
  resetRaidTimer(30);

  saveAppData(appData);
  updateLiveScoreboardDOM();
}

function addTechnicalPoint(teamKey) {
  if (!checkCoachScoreboardPermission()) return;
  pushHistorySnapshot();
  const lm = ensureLiveMatchData();
  const team = teamKey === 'teamA' ? lm.teamA : lm.teamB;
  team.score += 1;
  
  playMatchSound('whistle');
  showToast(`⚖️ +1 Technical Point for ${team.name}`, 'ri-scales-3-line');
  addMatchEventLog(`⚖️ +1 Technical Point awarded to ${team.name}`, 'technical');

  syncCurrentScheduledMatchScores();
  saveAppData(appData);
  updateLiveScoreboardDOM();
}

function editOpponentTeamName() {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  const current = lm.teamB.name;
  const input = prompt('Enter Opponent Team Name:', current);
  if (input && input.trim()) {
    lm.teamB.name = input.trim();
    const currentSched = (appData.scheduledMatches || []).find(m => m.id === lm.activeScheduledMatchId);
    if (currentSched) {
      currentSched.teamB = input.trim();
    }
    saveAppData(appData);
    updateLiveScoreboardDOM();
    showToast(`✅ Opponent name updated: ${input.trim()}`, 'ri-check-line');
  }
}

function toggleSoundEffects() {
  soundEffectsEnabled = !soundEffectsEnabled;
  if (soundEffectsEnabled) playMatchSound('whistle');
  showToast(soundEffectsEnabled ? '🔊 Match Sounds & Buzzer: ON' : '🔇 Match Sounds: MUTED', 'ri-volume-up-line');
  updateLiveScoreboardDOM();
}

function shareMatchToWhatsApp() {
  const lm = ensureLiveMatchData();
  const tA = lm.teamA;
  const tB = lm.teamB;
  const currentSched = (appData.scheduledMatches || []).find(m => m.id === lm.activeScheduledMatchId);
  const tournName = currentSched ? currentSched.tournament : 'Oor Thiruvizha Kabaddi Potti';
  const groundInfo = currentSched ? (currentSched.groundType + ' • ' + currentSched.venue) : 'Semmann Kalam';
  const prizeInfo = currentSched ? currentSched.firstPrize : 'Rs.25,000 + Suzhar Koppai 🏆';

  let leading = '';
  if (tA.score > tB.score) {
    leading = `🔥 ${tA.name} ${tA.score - tB.score} Pulligal Munnilaiyil Vetri Nadai!`;
  } else if (tB.score > tA.score) {
    leading = `⚡ ${tB.name} ${tB.score - tA.score} Pulligal Munnilaiyil Ullathu!`;
  } else {
    leading = `🤝 Samanilai Aattam (${tA.score} - ${tB.score})! Paraparappana Aattam!`;
  }

  const text = `🌾 *${tournName}* 🌾\n` +
    `🏆 *LIVE MATCH SCOREBOARD (Nerlai Nilavaram)* 🏆\n\n` +
    `📍 *Aadukalam*: ${groundInfo}\n` +
    `🥇 *1st Prize*: ${prizeInfo}\n\n` +
    `🔴 *${tA.name}*: ${tA.score} Pulligal (Pts)\n` +
    `🔵 *${tB.name}*: ${tB.score} Pulligal (Pts)\n\n` +
    `⏱️ *Match Nilai*: ${lm.currentHalf} (Meetham Ulla Neram: ${formatClockTime(lm.matchTimeRemaining)})\n` +
    `📊 *Tharpothaiya Mudivu*: ${leading}\n` +
    `⚖️ *Naduvar Rule*: Naduvar theerpe iruthiyanathu!\n\n` +
    `⚔️ *${tA.name} Pulli Vivaram*:\n` +
    `• Raid Pulligal: ${tA.raidPoints}\n` +
    `• Tackle / Pidi Pulligal: ${tA.tacklePoints}\n` +
    `• Bonus Pulligal: ${tA.bonusPoints}\n` +
    `• Lona / All-Out: ${tA.allOutPoints}\n` +
    `• Kalam Irangiya Veerargal: ${tA.playersOnCourt}/7\n\n` +
    `Vaazhthukkal! #LocalKabaddi #TamilNaduKabaddi #OorThiruvizhaKabaddi`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function finishAndSaveMatch() {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  const tA = lm.teamA;
  const tB = lm.teamB;

  if (!confirm(`Are you sure you want to finish and archive this match?\n${tA.name}: ${tA.score} vs ${tB.name}: ${tB.score}`)) {
    return;
  }

  let resultStr = '';
  let winKey = null;
  if (tA.score > tB.score) {
    resultStr = `${tA.name} Won by ${tA.score - tB.score} Points 🏆`;
    winKey = 'teamA';
  } else if (tB.score > tA.score) {
    resultStr = `${tB.name} Won by ${tB.score - tA.score} Points 🏆`;
    winKey = 'teamB';
  } else {
    resultStr = `Match Tied (${tA.score} - ${tB.score}) 🤝`;
  }

  // Sync with active scheduled match if present
  const scheduledMatches = appData.scheduledMatches || [];
  const currentSched = scheduledMatches.find(m => m.id === lm.activeScheduledMatchId);
  if (currentSched) {
    currentSched.status = 'Completed';
    currentSched.winner = winKey;
    currentSched.scoreA = tA.score;
    currentSched.scoreB = tB.score;
    currentSched.result = resultStr;
  }

  const newSaved = {
    id: Date.now(),
    scheduledMatchId: lm.activeScheduledMatchId || null,
    date: currentSched ? currentSched.date : new Date().toISOString().split('T')[0],
    tournament: currentSched ? currentSched.tournament : 'State / Local Match',
    venue: currentSched ? currentSched.venue : 'Home Arena Stadium',
    teamA: tA.name,
    teamB: tB.name,
    scoreA: tA.score,
    scoreB: tB.score,
    result: resultStr,
    winner: winKey,
    bestRaider: `${appData.players && appData.players[0] ? appData.players[0].name : 'Raider'} - ${tA.raidPoints} Pts`,
    bestDefender: `${appData.players && appData.players[1] ? appData.players[1].name : 'Defender'} - ${tA.tacklePoints} Pts`
  };

  if (!appData.savedMatches) appData.savedMatches = [];
  appData.savedMatches = appData.savedMatches.filter(m => m.scheduledMatchId !== lm.activeScheduledMatchId);
  appData.savedMatches.unshift(newSaved);

  // Push notification for the team
  if (!appData.notifications) appData.notifications = [];
  appData.notifications.unshift({
    id: Date.now(),
    title: `🏆 Match Result: ${tA.name} ${tA.score} - ${tB.score} ${tB.name}`,
    desc: `Match concluded: ${resultStr}. Congratulations!`,
    time: 'Just now',
    target: 'all',
    type: 'notice',
    icon: 'ri-trophy-fill',
    actionView: 'live-scoreboard',
    senderRole: 'coach',
    senderName: 'Coach Rajan',
    read: false,
    readByPlayers: []
  });

  saveAppData(appData);
  showToast(`🎉 Match archived successfully! (${resultStr})`, 'ri-award-fill');
  updateLiveScoreboardDOM();
}

function resetLiveMatchScores() {
  if (!checkCoachScoreboardPermission()) return;
  pauseRaidTimer();
  pauseMatchClock();
  const lm = ensureLiveMatchData();
  const currentTeamA = lm.teamA.name || 'Thaai Tamizhans (Valayapatti)';
  const currentTeamB = lm.teamB.name || 'Madurai Veeran (Melur)';
  const currentSchedId = lm.activeScheduledMatchId || 'match-1';

  appData.liveMatch = {
    activeScheduledMatchId: currentSchedId,
    teamA: {
      name: currentTeamA,
      shortName: 'TTKC',
      score: 0,
      playersOnCourt: 7,
      totalPlayers: 7,
      raidPoints: 0,
      tacklePoints: 0,
      allOutPoints: 0,
      bonusPoints: 0
    },
    teamB: {
      name: currentTeamB,
      shortName: 'OPP',
      score: 0,
      playersOnCourt: 7,
      totalPlayers: 7,
      raidPoints: 0,
      tacklePoints: 0,
      allOutPoints: 0,
      bonusPoints: 0
    },
    currentHalf: '1st Half',
    matchDurationMinutes: 40,
    matchTimeRemaining: 1200,
    isMatchClockRunning: false,
    raidTimeRemaining: 30,
    isRaidRunning: false,
    isDoOrDie: false,
    activeRaidingTeam: 'teamA',
    actionLog: [
      { time: '00:00', text: `🏆 Match Scoreboard Ready: ${currentTeamA} vs ${currentTeamB}`, type: 'system' }
    ],
    historyStack: []
  };

  // If active scheduled match, reset its scores
  const currentSched = (appData.scheduledMatches || []).find(m => m.id === currentSchedId);
  if (currentSched) {
    currentSched.scoreA = 0;
    currentSched.scoreB = 0;
    currentSched.status = 'Live';
    currentSched.winner = null;
  }

  saveAppData(appData);
  updateLiveScoreboardDOM();
}

// ----------------------------------------------------
// MATCH SCHEDULE STATE & TAB CONTROLS
// ----------------------------------------------------
let scoreboardTab = localStorage.getItem('thaai_tamizhans_scoreboard_tab') || 'schedule'; // 'schedule' | 'arena'
let scheduleFilterTab = 'all'; // 'all' | 'live' | 'scheduled' | 'completed'

function switchScoreboardTab(tab) {
  scoreboardTab = tab;
  localStorage.setItem('thaai_tamizhans_scoreboard_tab', tab);
  updateLiveScoreboardDOM();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setScheduleFilter(filter) {
  scheduleFilterTab = filter;
  updateLiveScoreboardDOM();
}

function openScheduledMatch(matchId) {
  const matches = appData.scheduledMatches || [];
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const lm = ensureLiveMatchData();
  lm.activeScheduledMatchId = match.id;
  lm.teamA.name = match.teamA;
  lm.teamB.name = match.teamB;

  // Load scores if match has recorded score
  if (match.status === 'Completed' || (match.scoreA > 0 || match.scoreB > 0)) {
    lm.teamA.score = match.scoreA || 0;
    lm.teamB.score = match.scoreB || 0;
  }

  // If match was upcoming, set to Live
  if (match.status === 'Scheduled') {
    match.status = 'Live';
    addMatchEventLog(`⚡ Live Scoreboard started for Match #${match.matchNumber || ''}: ${match.teamA} vs ${match.teamB}`, 'system');
  }

  saveAppData(appData);
  switchScoreboardTab('arena');
  showToast(`⚡ Loaded: ${match.teamA} vs ${match.teamB}`, 'ri-broadcast-fill');
}

function openScheduleMatchModal(editId = null) {
  const form = document.getElementById('formScheduleMatch');
  if (form) form.reset();

  const idInput = document.getElementById('matchSchedEditId');
  const dateInput = document.getElementById('matchSchedDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  if (editId) {
    const match = (appData.scheduledMatches || []).find(m => m.id === editId);
    if (match) {
      if (idInput) idInput.value = match.id;
      document.getElementById('matchSchedTournament').value = match.tournament || '';
      document.getElementById('matchSchedTeamA').value = match.teamA || '';
      document.getElementById('matchSchedTeamB').value = match.teamB || '';
      document.getElementById('matchSchedDate').value = match.date || '';
      document.getElementById('matchSchedTime').value = match.time || '';
      document.getElementById('matchSchedVenue').value = match.venue || '';
      document.getElementById('matchSchedRound').value = match.round || 'Round 1 (Mudhal Sutru)';
      document.getElementById('matchSchedNotes').value = match.notes || '';
      if (document.getElementById('matchSchedFirstPrize')) document.getElementById('matchSchedFirstPrize').value = match.firstPrize || 'Rs.25,000 + Suzhar Koppai 🏆';
      if (document.getElementById('matchSchedWeight')) document.getElementById('matchSchedWeight').value = match.weightCategory || '65 Kg Weight (Standard)';
      if (document.getElementById('matchSchedGroundType')) document.getElementById('matchSchedGroundType').value = match.groundType || 'Semmann Kalam (Red Soil)';
      if (document.getElementById('matchSchedEntryFee')) document.getElementById('matchSchedEntryFee').value = match.entryFee || 'Rs.500';
      if (document.getElementById('matchSchedRefereeRule')) document.getElementById('matchSchedRefereeRule').value = match.refereeRule || 'Naduvar theerpe iruthiyanathu! Koopidum podhu udane kalam iranga vendum.';
      const posterVal = match.posterImage || 'assets/match_notice_poster.jpg';
      if (document.getElementById('matchSchedPoster')) document.getElementById('matchSchedPoster').value = posterVal;
      if (document.getElementById('matchSchedPreview')) document.getElementById('matchSchedPreview').src = posterVal;
    }
  } else {
    if (idInput) idInput.value = '';
    document.getElementById('matchSchedTeamA').value = 'Thaai Tamizhans (Valayapatti)';
    if (document.getElementById('matchSchedFirstPrize')) document.getElementById('matchSchedFirstPrize').value = 'Rs.25,000 + Suzhar Koppai 🏆';
    if (document.getElementById('matchSchedWeight')) document.getElementById('matchSchedWeight').value = '65 Kg Weight (Standard)';
    if (document.getElementById('matchSchedGroundType')) document.getElementById('matchSchedGroundType').value = 'Semmann Kalam (Red Soil)';
    if (document.getElementById('matchSchedEntryFee')) document.getElementById('matchSchedEntryFee').value = 'Rs.500';
    if (document.getElementById('matchSchedRefereeRule')) document.getElementById('matchSchedRefereeRule').value = 'Naduvar theerpe iruthiyanathu! Koopidum podhu udane kalam iranga vendum.';
    if (document.getElementById('matchSchedPoster')) document.getElementById('matchSchedPoster').value = 'assets/match_notice_poster.jpg';
    if (document.getElementById('matchSchedPreview')) document.getElementById('matchSchedPreview').src = 'assets/match_notice_poster.jpg';
  }

  openModal('modalScheduleMatch');
}

function handleSaveScheduledMatch(event) {
  event.preventDefault();
  const editId = document.getElementById('matchSchedEditId').value;
  const tournament = document.getElementById('matchSchedTournament').value.trim();
  const teamA = document.getElementById('matchSchedTeamA').value.trim();
  const teamB = document.getElementById('matchSchedTeamB').value.trim();
  const date = document.getElementById('matchSchedDate').value;
  const time = document.getElementById('matchSchedTime').value.trim();
  const venue = document.getElementById('matchSchedVenue').value.trim();
  const round = document.getElementById('matchSchedRound').value;
  const notes = document.getElementById('matchSchedNotes').value.trim();
  const firstPrize = (document.getElementById('matchSchedFirstPrize') ? document.getElementById('matchSchedFirstPrize').value.trim() : '') || 'Rs.25,000 + Suzhar Koppai 🏆';
  const weightCategory = (document.getElementById('matchSchedWeight') ? document.getElementById('matchSchedWeight').value : '') || '65 Kg Weight (Standard)';
  const groundType = (document.getElementById('matchSchedGroundType') ? document.getElementById('matchSchedGroundType').value : '') || 'Semmann Kalam (Red Soil)';
  const entryFee = (document.getElementById('matchSchedEntryFee') ? document.getElementById('matchSchedEntryFee').value.trim() : '') || 'Rs.500';
  const refereeRule = (document.getElementById('matchSchedRefereeRule') ? document.getElementById('matchSchedRefereeRule').value.trim() : '') || 'Naduvar theerpe iruthiyanathu! Koopidum podhu udane kalam iranga vendum.';
  const posterImage = (document.getElementById('matchSchedPoster') ? document.getElementById('matchSchedPoster').value : '') || 'assets/match_notice_poster.jpg';

  if (!appData.scheduledMatches) appData.scheduledMatches = [];

  if (editId) {
    const idx = appData.scheduledMatches.findIndex(m => m.id === editId);
    if (idx !== -1) {
      appData.scheduledMatches[idx] = Object.assign(appData.scheduledMatches[idx], {
        tournament, teamA, teamB, date, time, venue, round, notes, posterImage,
        firstPrize, weightCategory, groundType, entryFee, refereeRule
      });
      showToast('Local Match schedule maatrapattathu!', 'ri-check-line');
    }
  } else {
    const newId = 'match-' + Date.now();
    const newMatch = {
      id: newId,
      matchNumber: appData.scheduledMatches.length + 1,
      tournament,
      round,
      teamA,
      teamB,
      date,
      time,
      venue,
      groundType,
      weightCategory,
      firstPrize,
      entryFee,
      refereeRule,
      posterImage,
      status: 'Scheduled',
      winner: null,
      scoreA: 0,
      scoreB: 0,
      notes
    };
    appData.scheduledMatches.unshift(newMatch);

    // Push notification for team
    if (!appData.notifications) appData.notifications = [];
    appData.notifications.unshift({
      id: Date.now(),
      title: `📅 Pudhu Kabaddi Potti: ${teamA} vs ${teamB}`,
      desc: `${tournament} (${round}) • ${date} ${time} @ ${venue} [${groundType}]`,
      time: 'Just now',
      target: 'all',
      type: 'notice',
      icon: 'ri-calendar-event-fill',
      actionView: 'live-scoreboard',
      senderRole: 'coach',
      senderName: 'Coach Rajan',
      read: false,
      readByPlayers: []
    });

    showToast('Pudhiya match vetrikalamaaga schedule seiyyappattathu!', 'ri-calendar-check-line');
  }

  saveAppData(appData);
  closeModal('modalScheduleMatch');
  updateLiveScoreboardDOM();
}

function deleteScheduledMatch(matchId) {
  if (!confirm('Are you sure you want to remove this match from schedule?')) return;
  appData.scheduledMatches = (appData.scheduledMatches || []).filter(m => m.id !== matchId);
  saveAppData(appData);
  showToast('Match removed from schedule', 'ri-delete-bin-line');
  updateLiveScoreboardDOM();
}

// ----------------------------------------------------
// WINNER DECLARATION & CONFETTI CELEBRATION
// ----------------------------------------------------
let confettiAnimationId = null;

function startConfettiAnimation() {
  const canvas = document.getElementById('winnerConfettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : 520;
  canvas.height = canvas.parentElement ? canvas.parentElement.offsetHeight : 460;

  const colors = ['#ff5500', '#00f2fe', '#ffd700', '#10b981', '#ec4899', '#ffffff'];
  const pieces = [];
  for (let i = 0; i < 70; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 6 - 3
    });
  }

  cancelAnimationFrame(confettiAnimationId);
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();

      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;

      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
    });
    confettiAnimationId = requestAnimationFrame(draw);
  }
  draw();
}

function stopConfettiAnimation() {
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
  }
}

function declareTeamWinner(teamKey) {
  if (!checkCoachScoreboardPermission()) return;
  const lm = ensureLiveMatchData();
  const tA = lm.teamA;
  const tB = lm.teamB;
  const isTeamA = teamKey === 'teamA';
  const winningTeam = isTeamA ? tA : tB;
  const losingTeam = isTeamA ? tB : tA;

  if (!confirm(`🏆 Declare ${winningTeam.name} as the OFFICIAL WINNER of this match?\n\nScore: ${tA.name} ${tA.score} - ${tB.score} ${tB.name}`)) {
    return;
  }

  // Pause clocks
  pauseRaidTimer();
  pauseMatchClock();

  // Determine margin & result string
  const scoreDiff = Math.abs(tA.score - tB.score);
  let resultStr = '';
  if (scoreDiff === 0) {
    resultStr = `Match Tied (${tA.score} - ${tB.score}) — ${winningTeam.name} Declared Winner by Coach! 🏆`;
  } else {
    resultStr = `${winningTeam.name} Won by ${scoreDiff} Points! 🏆`;
  }

  // Find active scheduled match
  const scheduledMatches = appData.scheduledMatches || [];
  let currentSched = scheduledMatches.find(m => m.id === lm.activeScheduledMatchId);
  if (!currentSched && scheduledMatches.length > 0) {
    currentSched = scheduledMatches[0];
    lm.activeScheduledMatchId = currentSched.id;
  }

  if (currentSched) {
    currentSched.status = 'Completed';
    currentSched.winner = teamKey;
    currentSched.scoreA = tA.score;
    currentSched.scoreB = tB.score;
    currentSched.result = resultStr;
  }

  // Add or update savedMatches
  const newSaved = {
    id: Date.now(),
    scheduledMatchId: lm.activeScheduledMatchId || null,
    date: currentSched ? currentSched.date : new Date().toISOString().split('T')[0],
    tournament: currentSched ? currentSched.tournament : 'Kabaddi League Match',
    venue: currentSched ? currentSched.venue : 'Home Arena Stadium',
    teamA: tA.name,
    teamB: tB.name,
    scoreA: tA.score,
    scoreB: tB.score,
    result: resultStr,
    winner: teamKey,
    bestRaider: `${appData.players && appData.players[0] ? appData.players[0].name : 'Raider'} - ${tA.raidPoints} Pts`,
    bestDefender: `${appData.players && appData.players[1] ? appData.players[1].name : 'Defender'} - ${tA.tacklePoints} Pts`
  };

  if (!appData.savedMatches) appData.savedMatches = [];
  appData.savedMatches = appData.savedMatches.filter(m => m.scheduledMatchId !== lm.activeScheduledMatchId);
  appData.savedMatches.unshift(newSaved);

  // Add match action log
  addMatchEventLog(`🏆 OFFICIAL WINNER DECLARED: ${winningTeam.name} (${resultStr})`, 'super');

  // Push squad notification
  if (!appData.notifications) appData.notifications = [];
  appData.notifications.unshift({
    id: Date.now(),
    title: `🏆 ${winningTeam.name} WINNER! (${tA.score} - ${tB.score})`,
    desc: `Official match concluded! Result: ${resultStr}`,
    time: 'Just now',
    target: 'all',
    type: 'notice',
    icon: 'ri-trophy-fill',
    actionView: 'live-scoreboard',
    senderRole: 'coach',
    senderName: 'Coach Rajan',
    read: false,
    readByPlayers: []
  });

  saveAppData(appData);

  // Play fanfare victory sound!
  playMatchSound('fanfare');

  // Populate Winner Celebration Modal
  const modalEl = document.getElementById('modalDeclareWinner');
  const teamTitleEl = document.getElementById('winnerDeclaredTeamName');
  const cardNameA = document.getElementById('winnerCardNameA');
  const cardNameB = document.getElementById('winnerCardNameB');
  const cardScoreA = document.getElementById('winnerCardScoreA');
  const cardScoreB = document.getElementById('winnerCardScoreB');
  const marginTag = document.getElementById('winnerMarginTag');

  if (teamTitleEl) teamTitleEl.textContent = winningTeam.name;
  if (cardNameA) cardNameA.textContent = tA.name;
  if (cardNameB) cardNameB.textContent = tB.name;
  if (cardScoreA) cardScoreA.textContent = tA.score;
  if (cardScoreB) cardScoreB.textContent = tB.score;
  if (marginTag) marginTag.innerHTML = `🎉 ${resultStr}`;

  // Highlight winning card in modal
  const boxA = document.getElementById('winnerBoxTeamA');
  const boxB = document.getElementById('winnerBoxTeamB');
  if (boxA && boxB) {
    if (isTeamA) {
      boxA.classList.add('winner-box-active');
      boxB.classList.remove('winner-box-active');
    } else {
      boxB.classList.add('winner-box-active');
      boxA.classList.remove('winner-box-active');
    }
  }

  // Show modal & start confetti
  if (modalEl) {
    modalEl.classList.add('active');
    setTimeout(() => startConfettiAnimation(), 60);
  }

  // Refresh scoreboard DOM
  updateLiveScoreboardDOM();
}

function closeWinnerModalAndReturnSchedule() {
  stopConfettiAnimation();
  closeModal('modalDeclareWinner');
  switchScoreboardTab('schedule');
}

function openPosterLightbox(imgUrl, title = 'Match Notice Poster') {
  const modalBody = document.getElementById('previewModalBody');
  const modalTitle = document.getElementById('previewFileTitle');
  const typeIcon = document.getElementById('previewTypeIcon');
  const metaEl = document.getElementById('previewMetaDetails');
  const downloadBtn = document.getElementById('previewDownloadBtn');

  if (modalTitle) modalTitle.textContent = title;
  if (typeIcon) {
    typeIcon.textContent = 'NOTICE POSTER';
    typeIcon.className = 'badge-priority high';
  }
  if (metaEl) {
    metaEl.innerHTML = `<span><i class="ri-image-line"></i> Official Tournament Notice Poster</span>`;
  }
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = imgUrl;
      a.download = 'Match_Notice_Poster.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  }
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="text-align:center; padding: 12px; background:rgba(0,0,0,0.6); border-radius:16px;">
        <img src="${imgUrl}" alt="${title}" style="max-width:100%; max-height:68vh; object-fit:contain; border-radius:12px; box-shadow:0 0 35px rgba(255,85,0,0.35); border:1px solid rgba(255,255,255,0.15);">
      </div>
    `;
  }
  openModal('modalFilePreview');
}

// ----------------------------------------------------
// KEYBOARD SHORTCUTS FOR SCOREKEEPER (COACH ONLY)
// ----------------------------------------------------
document.addEventListener('keydown', (e) => {
  if (currentView !== 'live-scoreboard') return;
  if (appData.activeRole !== 'coach') return;
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  if (e.code === 'Space') {
    e.preventDefault();
    toggleRaidTimer();
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    resetRaidTimer(30);
  } else if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    toggleDoOrDie();
  } else if (e.key === 'u' || e.key === 'U') {
    e.preventDefault();
    undoLastMatchAction();
  }
});

function renderSavedMatchesTableRows() {
  const savedMatches = appData.savedMatches || [];
  if (savedMatches.length === 0) {
    return `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:16px;">No previous matches recorded</td></tr>`;
  }
  let rows = '';
  savedMatches.forEach(m => {
    rows += `
      <tr class="history-row">
        <td><span class="match-date-badge">${m.date}</span></td>
        <td><b>${m.teamA}</b> <span class="vs-pill">vs</span> <b>${m.teamB}</b></td>
        <td><span class="score-pill-bold">${m.scoreA} - ${m.scoreB}</span></td>
        <td><span class="result-badge ${m.result && m.result.includes('Won') ? 'won' : 'lost'}">${m.result || 'Finished'}</span></td>
        <td class="desktop-only"><small style="color:var(--accent-cyan);">${m.bestRaider || 'N/A'}</small></td>
      </tr>
    `;
  });
  return rows;
}

// ----------------------------------------------------
// MATCH SCHEDULE VIEW HTML RENDERER
// ----------------------------------------------------
function renderMatchScheduleViewHTML() {
  const matches = appData.scheduledMatches || [];
  const lm = ensureLiveMatchData();
  const isCoach = appData.activeRole === 'coach';

  let filtered = matches;
  if (scheduleFilterTab === 'live') {
    filtered = matches.filter(m => m.status === 'Live');
  } else if (scheduleFilterTab === 'scheduled') {
    filtered = matches.filter(m => m.status === 'Scheduled');
  } else if (scheduleFilterTab === 'completed') {
    filtered = matches.filter(m => m.status === 'Completed');
  }

  const countAll = matches.length;
  const countLive = matches.filter(m => m.status === 'Live').length;
  const countSched = matches.filter(m => m.status === 'Scheduled').length;
  const countComp = matches.filter(m => m.status === 'Completed').length;

  let cardsHtml = '';
  if (filtered.length > 0) {
    filtered.forEach(m => {
      const isCurrentActive = lm.activeScheduledMatchId === m.id;
      const posterImg = m.posterImage || 'assets/match_notice_poster.jpg';
      let statusBadge = '';
      if (m.status === 'Live') {
        statusBadge = `<span class="fixture-status-pill live"><span class="pulse-dot"></span> LIVE (Nerlai)</span>`;
      } else if (m.status === 'Completed') {
        statusBadge = `<span class="fixture-status-pill completed"><i class="ri-check-double-line"></i> Mudinthavai (Completed)</span>`;
      } else {
        statusBadge = `<span class="fixture-status-pill scheduled"><i class="ri-calendar-line"></i> Adutha Potti (Upcoming)</span>`;
      }

      let winnerTag = '';
      if (m.status === 'Completed') {
        const winTeamName = m.winner === 'teamB' ? m.teamB : m.teamA;
        winnerTag = `
          <div class="fixture-winner-badge">
            <i class="ri-trophy-fill" style="color:var(--accent-gold);"></i>
            <span>Vetriyalar (Winner): <b>${winTeamName}</b> (${m.scoreA} - ${m.scoreB})</span>
          </div>
        `;
      }

      cardsHtml += `
        <div class="match-fixture-card ${m.status.toLowerCase()} ${isCurrentActive ? 'active-arena-border' : ''}" onclick="openScheduledMatch('${m.id}')">
          
          <!-- NOTICE IMAGE POSTER (FRONT BANNER) -->
          <div class="fixture-poster-banner-wrap" onclick="event.stopPropagation(); openPosterLightbox('${posterImg}', '${m.tournament} - Notice Poster')">
            <img src="${posterImg}" alt="${m.tournament} Notice Poster" class="fixture-poster-banner-img">
            <div class="fixture-poster-overlay">
              <span class="poster-notice-chip"><i class="ri-megaphone-fill"></i> Oor Match Notice Poster</span>
              <button type="button" class="btn-poster-view-chip" title="Notice poster mulumaiya paaru">
                <i class="ri-zoom-in-line"></i> View Poster
              </button>
            </div>
          </div>

          <div class="fixture-card-header">
            <div class="fixture-meta-left">
              <span class="tournament-tag">${m.tournament || 'Local Kabaddi Potti'}</span>
              <span class="round-tag">${m.round || 'Round 1'}</span>
            </div>
            ${statusBadge}
          </div>

          <!-- LOCAL TOURNAMENT SPECS STRIP (PRIZES, WEIGHT, SURFACE) -->
          <div class="local-specs-strip">
            <span class="local-spec-badge gold" title="Mudhal Parisu"><i class="ri-medal-fill"></i> ${m.firstPrize || 'Rs.25,000 + Suzhar Koppai 🏆'}</span>
            <span class="local-spec-badge cyan" title="Weight Category (48kg to Open)"><i class="ri-scales-3-line"></i> ${m.weightCategory || '65 Kg Weight'}</span>
            <span class="local-spec-badge soil" title="Aadukalam Surface"><i class="ri-landscape-line"></i> ${m.groundType || 'Semmann Kalam'}</span>
            ${m.entryFee ? `<span class="local-spec-badge fee" title="Entry Fee"><i class="ri-coupon-3-line"></i> ${m.entryFee}</span>` : ''}
          </div>

          <!-- Teams Versus Graphic Area -->
          <div class="fixture-teams-row">
            <div class="fixture-team-col team-a">
              <div class="fixture-team-icon orange-glow">
                <i class="ri-shield-star-fill"></i>
              </div>
              <div class="fixture-team-name">${m.teamA}</div>
              ${m.status !== 'Scheduled' ? `<div class="fixture-team-score orange-pts">${m.scoreA || 0}</div>` : ''}
            </div>

            <div class="fixture-vs-divider">
              <span class="vs-circle">VS</span>
              <span class="vs-match-no">#${m.matchNumber || 1}</span>
            </div>

            <div class="fixture-team-col team-b">
              <div class="fixture-team-icon cyan-glow">
                <i class="ri-shield-user-fill"></i>
              </div>
              <div class="fixture-team-name">${m.teamB}</div>
              ${m.status !== 'Scheduled' ? `<div class="fixture-team-score cyan-pts">${m.scoreB || 0}</div>` : ''}
            </div>
          </div>

          ${winnerTag}

          <!-- Date, Time & Venue Bar -->
          <div class="fixture-info-bar">
            <span><i class="ri-calendar-event-line"></i> ${m.date}</span>
            <span><i class="ri-time-line"></i> ${m.time}</span>
            <span><i class="ri-map-pin-line"></i> ${m.venue}</span>
          </div>

          <!-- Local Referee Rule Strip -->
          <div class="local-referee-rule-strip">
            <i class="ri-scales-3-line"></i>
            <span>${m.refereeRule || 'Naduvar theerpe iruthiyanathu! Koopidum podhu udane kalam iranga vendum.'}</span>
          </div>

          ${m.notes ? `<div class="fixture-notes-row"><i class="ri-information-line"></i> ${m.notes}</div>` : ''}

          <!-- Action Footer -->
          <div class="fixture-actions-row">
            <button class="btn-fixture-launch" onclick="event.stopPropagation(); openScheduledMatch('${m.id}')">
              <i class="${m.status === 'Completed' ? 'ri-bar-chart-box-line' : 'ri-broadcast-fill'}"></i>
              <span>${m.status === 'Completed' ? '📊 Scoreboard Paaru (View)' : (m.status === 'Live' ? '⚡ Live Scoreboard Thodaru' : '⚡ Live Scoreboard Arambi')}</span>
            </button>
            ${isCoach ? `
              <div class="fixture-admin-btns" onclick="event.stopPropagation()">
                <button class="btn-icon-fixture" onclick="openScheduleMatchModal('${m.id}')" title="Edit Match Schedule"><i class="ri-edit-line"></i></button>
                <button class="btn-icon-fixture danger" onclick="deleteScheduledMatch('${m.id}')" title="Delete Match"><i class="ri-delete-bin-line"></i></button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  } else {
    cardsHtml = `
      <div class="no-matches-state card-glass" style="grid-column: 1 / -1; text-align:center; padding: 40px 20px;">
        <div class="icon-3d orange" style="margin:0 auto 16px; width:64px; height:64px; font-size:2rem;"><i class="ri-calendar-todo-line"></i></div>
        <h3 style="margin-bottom:8px;">Intha Pirivil Pottigal Yedhum Illai (No Matches)</h3>
        <p style="color:#94a3b8; font-size:0.88rem; margin:0 0 20px;">"+ Pudhiya Match Schedule" buttonai use panni oor thiruvizha pottiyai serkkavum.</p>
        ${isCoach ? `<button class="btn btn-orange" onclick="openScheduleMatchModal()"><i class="ri-add-line"></i> + Pudhiya Match Serkkavum (New Match)</button>` : ''}
      </div>
    `;
  }

  return `
    <div class="match-schedule-container animate-fade-in">
      <!-- SCHEDULE TOPBAR -->
      <div class="schedule-header-card card-glass">
        <div class="schedule-title-block">
          <div class="live-pulse-badge"><span class="pulse-dot"></span> Local & Gramiya Kabaddi Attavanai</div>
          <h2 class="text-gradient-orange" style="margin: 8px 0 4px; font-size: 1.6rem; font-weight: 900;">
            🌾 Oor Thiruvizha Kabaddi Pottigal (Local Kabaddi Fixtures)
          </h2>
        </div>

        <div class="schedule-top-actions">
          ${isCoach ? `
            <button class="btn btn-orange" onclick="openScheduleMatchModal()">
              <i class="ri-calendar-check-fill"></i> + Pudhiya Match Schedule (New Match)
            </button>
          ` : ''}
          <button class="btn btn-primary" onclick="switchScoreboardTab('arena')" style="background:var(--grad-cyan); color:#000;">
            <i class="ri-broadcast-line"></i> ⚡ Live Arena Thira (Live Scoreboard)
          </button>
        </div>
      </div>

      <!-- FILTER TABS ROW -->
      <div class="schedule-filter-bar">
        <div class="filter-chips-wrap">
          <button class="filter-chip-btn ${scheduleFilterTab === 'all' ? 'active' : ''}" onclick="setScheduleFilter('all')">
            <span>🔥 Ellaa Pottigalum (All Matches)</span>
            <span class="count-pill">${countAll}</span>
          </button>
          <button class="filter-chip-btn ${scheduleFilterTab === 'live' ? 'active' : ''}" onclick="setScheduleFilter('live')">
            <span>🔴 Live Aattam (Live Now)</span>
            <span class="count-pill live">${countLive}</span>
          </button>
          <button class="filter-chip-btn ${scheduleFilterTab === 'scheduled' ? 'active' : ''}" onclick="setScheduleFilter('scheduled')">
            <span>🕒 Adutha Pottigal (Upcoming)</span>
            <span class="count-pill">${countSched}</span>
          </button>
          <button class="filter-chip-btn ${scheduleFilterTab === 'completed' ? 'active' : ''}" onclick="setScheduleFilter('completed')">
            <span>🏆 Mudinthavai (Completed)</span>
            <span class="count-pill">${countComp}</span>
          </button>
        </div>
      </div>

      <!-- MATCHES GRID -->
      <div class="match-fixtures-grid">
        ${cardsHtml}
      </div>

      <!-- RECENT SAVED MATCHES QUICK ARCHIVE -->
      <div class="card-glass" style="margin-top: 24px; padding: 20px;">
        <div class="section-card-header" style="margin-bottom: 14px;">
          <div class="card-title-wrap">
            <i class="ri-history-line text-gradient-cyan"></i>
            <span>Kadantha Kaala Kabaddi Vetrigal & Koppaigal (Past Matches Archive)</span>
          </div>
          <span style="font-size:0.80rem; color:#94a3b8;">${(appData.savedMatches || []).length} Pottigal Pathivu</span>
        </div>
        <div class="history-table-wrap">
          <table class="scoreboard-history-table">
            <thead>
              <tr>
                <th>Thethi (Date)</th>
                <th>Potti & Aadukalam (Match)</th>
                <th>Score</th>
                <th>Mudivu (Result)</th>
                <th class="desktop-only">Sirandha Aattakkaaran (Best Player)</th>
              </tr>
            </thead>
            <tbody>
              ${renderSavedMatchesTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// LIVE SCOREBOARD HTML RENDERER
// ----------------------------------------------------
function renderLiveScoreboardHTML() {
  if (scoreboardTab === 'schedule') {
    return renderMatchScheduleViewHTML();
  }

  const lm = ensureLiveMatchData();
  const tA = lm.teamA;
  const tB = lm.teamB;
  const isCoach = appData.activeRole === 'coach';

  // Find active scheduled match info
  const scheduledMatches = appData.scheduledMatches || [];
  let activeSched = scheduledMatches.find(m => m.id === lm.activeScheduledMatchId);
  if (!activeSched && scheduledMatches.length > 0) {
    activeSched = scheduledMatches[0];
    lm.activeScheduledMatchId = activeSched.id;
  }
  const activePoster = activeSched ? (activeSched.posterImage || 'assets/match_notice_poster.jpg') : 'assets/match_notice_poster.jpg';

  // Active Players Court Dots (7 circles)
  const renderCourtDots = (count, max = 7, colorClass = 'orange') => {
    let dots = '';
    for (let i = 1; i <= max; i++) {
      const active = i <= count;
      dots += `<span class="court-dot ${active ? colorClass : 'bench'}" title="${active ? 'Kalam Irangiyavar (On Mat)' : 'Out Aana Veerargal (Out)'}"></span>`;
    }
    return dots;
  };

  // Action Log items
  let logHtml = '';
  (lm.actionLog || []).slice(0, 15).forEach(item => {
    let badgeClass = 'normal';
    if (item.type === 'super') badgeClass = 'super-badge';
    else if (item.type === 'bonus') badgeClass = 'bonus-badge';
    else if (item.type === 'doodie') badgeClass = 'doodie-badge';
    else if (item.type === 'warning') badgeClass = 'warning-badge';

    logHtml += `
      <div class="match-log-entry ${badgeClass}">
        <span class="log-time">${item.time}</span>
        <span class="log-text">${item.text}</span>
      </div>
    `;
  });

  return `
    <div class="scoreboard-container animate-fade-in ${lm.isDoOrDie ? 'do-or-die-active' : ''}">

      <!-- ARENA TOP BAR: BREADCRUMB & ACTIVE LOCAL MATCH INFO -->
      <div class="arena-match-header-bar card-glass">
        <!-- TOP NAV ROW: Back Navigation & Action Controls -->
        <div class="arena-header-nav-row">
          <button class="btn btn-sm btn-outline arena-back-btn" onclick="switchScoreboardTab('schedule')">
            <i class="ri-arrow-left-line"></i> Match Schedule
          </button>

          <div class="arena-header-actions">
            ${isCoach ? `
              <!-- Referee Sound Triggers (Coach Only) -->
              <button class="btn btn-sm btn-local-whistle" onclick="blastRefereeWhistle()" title="Naduvar Whistle Olika">
                <i class="ri-volume-up-fill"></i> Whistle
              </button>
              <button class="btn btn-sm btn-local-bell" onclick="announceLast5Minutes()" title="Kadaisi 5 Nimidam Warning Bell">
                <i class="ri-timer-line"></i> 5 Mins
              </button>
            ` : ''}
            ${activeSched && activeSched.status === 'Completed' ? `
              <span class="result-badge won" style="font-size:0.82rem; padding:4px 10px;">
                🏆 Winner: ${activeSched.winner === 'teamB' ? tB.name : tA.name}
              </span>
            ` : ''}
            ${isCoach ? `
              <button class="btn btn-sm btn-primary" onclick="openScheduleMatchModal()" title="Schedule Another Match" style="white-space:nowrap;">
                <i class="ri-calendar-check-line"></i> + New Match
              </button>
            ` : ''}
          </div>
        </div>

        <!-- MATCH TITLE & TOURNAMENT INFO ROW -->
        <div class="arena-header-match-info-row">
          <div class="arena-match-title-block">
            <div class="arena-tournament-pill">
              <span class="pulse-dot"></span>
              <span class="tourney-name">🌾 ${activeSched ? activeSched.tournament : 'Oor Kabaddi Potti'}</span>
            </div>
            <div class="arena-teams-versus">
              <span class="round-tag">${activeSched && activeSched.round ? activeSched.round : 'Potti'}</span>
              <span class="team-tag team-a-tag"><i class="ri-shield-star-fill"></i> ${tA.name}</span>
              <span class="vs-text">VS</span>
              <span class="team-tag team-b-tag"><i class="ri-shield-user-fill"></i> ${tB.name}</span>
            </div>
          </div>

          <!-- Badges & Poster -->
          <div class="arena-header-badges-wrap">
            <div class="arena-match-poster-chip" onclick="openPosterLightbox('${activePoster}', '${activeSched ? activeSched.tournament : 'Match Notice'}')" title="Match Notice Poster Paaru">
              <img src="${activePoster}" class="arena-poster-thumb-mini" alt="Notice Poster">
              <span><i class="ri-image-line"></i> Notice Poster</span>
            </div>
            <div class="arena-local-spec-strip">
              <span class="local-spec-badge soil"><i class="ri-landscape-line"></i> ${activeSched && activeSched.groundType ? activeSched.groundType : 'Semmann Kalam'}</span>
              <span class="local-spec-badge gold"><i class="ri-medal-fill"></i> ${activeSched && activeSched.firstPrize ? activeSched.firstPrize : 'Rs.25,000 + Koppai 🏆'}</span>
              <span class="local-spec-badge cyan"><i class="ri-scales-3-line"></i> ${activeSched && activeSched.weightCategory ? activeSched.weightCategory : '65 Kg Weight'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- COMPLETED MATCH CELEBRATORY BANNER (IF ALREADY FINISHED) -->
      ${activeSched && activeSched.status === 'Completed' ? `
        <div class="arena-winner-banner animate-fade-in">
          <i class="ri-trophy-fill" style="color:var(--accent-gold); font-size:1.8rem;"></i>
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#fbbf24; font-weight:800;">
              👑 OFFICIAL MATCH RESULT
            </div>
            <div style="font-size:1.2rem; font-weight:900; color:#fff;">
              Winner: <span class="text-gradient-orange">${activeSched.winner === 'teamB' ? tB.name : tA.name}</span> — ${activeSched.result || 'Champion!'}
            </div>
          </div>
          <button class="btn btn-sm btn-outline" style="margin-left:auto;" onclick="switchScoreboardTab('schedule')">
            Back to Schedule →
          </button>
        </div>
      ` : ''}

      <!-- TOP STATUS & MATCH CLOCK BAR -->
      <div class="scoreboard-topbar">
        <div class="topbar-left">
          <span class="live-pulse-badge"><span class="pulse-dot"></span> LIVE</span>
          
          <!-- Segment Selector -->
          <div class="segment-picker">
            ${isCoach ? `
              <select class="half-select" onchange="setMatchHalf(this.value)">
                <option value="1st Half" ${lm.currentHalf === '1st Half' ? 'selected' : ''}>1st Half</option>
                <option value="Halftime" ${lm.currentHalf === 'Halftime' ? 'selected' : ''}>Halftime</option>
                <option value="2nd Half" ${lm.currentHalf === '2nd Half' ? 'selected' : ''}>2nd Half</option>
                <option value="Extra Time" ${lm.currentHalf === 'Extra Time' ? 'selected' : ''}>Extra Time</option>
              </select>
            ` : `
              <span class="half-viewer-badge"><i class="ri-flag-line"></i> ${lm.currentHalf || '1st Half'}</span>
            `}
          </div>
        </div>

        <!-- 20-Min Match Clock -->
        <div class="topbar-clock-wrap">
          <div class="clock-label"><i class="ri-timer-line"></i> MATCH CLOCK</div>
          <div class="clock-display" id="matchClockDisplay">${formatClockTime(lm.matchTimeRemaining)}</div>
          ${isCoach ? `
            <button class="clock-control-btn" id="matchClockToggleBtn" onclick="toggleMatchClock()" title="Start / Pause Clock">
              <i class="${lm.isMatchClockRunning ? 'ri-pause-circle-fill' : 'ri-play-circle-fill'}"></i>
            </button>
            <button class="clock-control-btn" onclick="resetMatchClock()" title="Reset 20 Mins">
              <i class="ri-refresh-line"></i>
            </button>
          ` : ''}
        </div>

        <div class="topbar-actions">
          <button class="topbar-tool-btn" onclick="toggleSoundEffects()" title="Toggle Sound">
            <i class="${soundEffectsEnabled ? 'ri-volume-up-fill' : 'ri-volume-mute-fill'}"></i>
            <span>${soundEffectsEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>
          <button class="topbar-tool-btn whatsapp-btn" onclick="shareMatchToWhatsApp()" title="WhatsAppil Pagir" style="background:#25D366; color:#000; font-weight:700;">
            <i class="ri-whatsapp-fill"></i>
            <span>WhatsApp</span>
          </button>
          ${isCoach ? `
            <button class="topbar-tool-btn undo-btn" onclick="undoLastMatchAction()" title="Undo Last Point (Key: U)">
              <i class="ri-arrow-go-back-line"></i>
              <span>Undo</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- MAIN 3-COLUMN ARENA SCOREBOARD -->
      <div class="scoreboard-main-grid">
        
        <!-- TEAM A: THAAI TAMIZHANS -->
        <div class="team-score-card team-thaai ${lm.activeRaidingTeam === 'teamA' ? 'raiding-active' : ''}">
          <div class="team-header">
            <img src="assets/kabaddi_logo.jpg" alt="Thaai Tamizhans Logo" class="team-logo-badge">
            <div>
              <div class="team-name text-gradient-orange">${tA.name}</div>
            </div>
            ${lm.activeRaidingTeam === 'teamA' ? '<span class="raiding-tag">Raid Selgirathu 🔥</span>' : ''}
          </div>

          <div class="score-display-huge text-gradient-orange">${tA.score}</div>

          <!-- Court 7-man visual tracker -->
          <div class="court-status-wrap">
            <div class="court-label">
              <span>Kalam Irangiya Veerargal (On Mat):</span>
              <b style="color:var(--accent-orange); font-size:1.1rem;">${tA.playersOnCourt} / 7</b>
            </div>
            <div class="court-dots-row">
              ${renderCourtDots(tA.playersOnCourt, 7, 'orange')}
            </div>
          </div>

          <!-- Points Breakdown -->
          <div class="points-breakdown-grid">
            <div class="stat-pill"><span class="lbl">Raid Pulli</span><span class="val">${tA.raidPoints}</span></div>
            <div class="stat-pill"><span class="lbl">Pidi / Tackle</span><span class="val">${tA.tacklePoints}</span></div>
            <div class="stat-pill"><span class="lbl">Bonus Pulli</span><span class="val">${tA.bonusPoints}</span></div>
            <div class="stat-pill"><span class="lbl">Lona (+2)</span><span class="val">${tA.allOutPoints}</span></div>
          </div>

          <!-- TEAM A WIN BUTTON (DECLARE WINNER - COACH ONLY) -->
          ${isCoach ? `
            <div class="team-winner-action-bar">
              <button class="btn-declare-winner btn-declare-winner-a ${activeSched && activeSched.winner === 'teamA' ? 'winner-active' : ''}" onclick="declareTeamWinner('teamA')" title="Declare ${tA.name} as Winner">
                <i class="ri-trophy-fill"></i>
                <span>Win</span>
              </button>
            </div>
          ` : ''}

          <!-- Action Buttons (Coach Mode) vs Spectator Lock (Player Mode) -->
          ${isCoach ? `
            <div class="point-actions-group">
              <div class="group-title">⚡ RAID PULLIGAL (RAID POINTS)</div>
              <div class="btn-row">
                <button class="pt-btn orange" onclick="scoreRaidPoint('teamA', 1, false)">
                  <span class="pt-num">+1</span>
                  <span class="pt-label">Thodu Pulli</span>
                </button>
                <button class="pt-btn orange" onclick="scoreRaidPoint('teamA', 2, false)">
                  <span class="pt-num">+2</span>
                  <span class="pt-label">2 Pulligal</span>
                </button>
                <button class="pt-btn super-glow" onclick="scoreRaidPoint('teamA', 3, false)">
                  <span class="pt-num">⚡ +3</span>
                  <span class="pt-label">Super Raid</span>
                </button>
                <button class="pt-btn gold" onclick="scoreRaidPoint('teamA', 1, true)">
                  <span class="pt-num">⭐ +1</span>
                  <span class="pt-label">Bonus Pulli</span>
                </button>
              </div>

              <div class="group-title" style="margin-top:12px;">🛡️ PIDI / DEFENCE PULLIGAL (TACKLE POINTS)</div>
              <div class="btn-row">
                <button class="pt-btn cyan" onclick="scoreTacklePoint('teamA', false)">
                  <span class="pt-num">🛡️ +1</span>
                  <span class="pt-label">Tackle Pulli</span>
                </button>
                <button class="pt-btn super-cyan" onclick="scoreTacklePoint('teamA', true)">
                  <span class="pt-num">💥 +2</span>
                  <span class="pt-label">Super Tackle</span>
                </button>
                <button class="pt-btn purple" onclick="scoreAllOut('teamA')">
                  <span class="pt-num">👑 +2</span>
                  <span class="pt-label">Lona (All-Out)</span>
                </button>
                <button class="pt-btn outline" onclick="addTechnicalPoint('teamA')">
                  <span class="pt-num">⚖️ +1</span>
                  <span class="pt-label">Naduvar Pulli</span>
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- CENTER CONSOLE: 30-SEC RAID TIMER -->
        <div class="center-timer-card">
          <div class="timer-card-title">
            <i class="ri-timer-flash-fill text-gradient-orange"></i>
            <span>30s RAID TIMER</span>
          </div>

          <!-- Raiding Team Switcher Pills -->
          <div class="raiding-team-toggle">
            ${isCoach ? `
              <button class="raid-team-chip ${lm.activeRaidingTeam === 'teamA' ? 'active-a' : ''}" onclick="setRaidingTeam('teamA')">
                🔴 ${tA.name} Raid
              </button>
              <button class="raid-team-chip ${lm.activeRaidingTeam === 'teamB' ? 'active-b' : ''}" onclick="setRaidingTeam('teamB')">
                🔵 ${tB.name} Raid
              </button>
            ` : `
              <div class="raid-team-chip-view ${lm.activeRaidingTeam === 'teamA' ? 'active-a' : 'active-b'}">
                <i class="ri-flashlight-fill"></i> ${lm.activeRaidingTeam === 'teamA' ? ('🔴 ' + tA.name + ' Raid Selgiraar') : ('🔵 ' + tB.name + ' Raid Selgiraar')}
              </div>
            `}
          </div>

          <!-- Animated Raid Dial -->
          <div class="raid-dial-wrap">
            <svg class="raid-svg" viewBox="0 0 120 120">
              <circle class="raid-bg-circle" cx="60" cy="60" r="54"></circle>
              <circle class="raid-progress-circle" id="raidTimerRing" cx="60" cy="60" r="54"></circle>
            </svg>
            <div class="raid-seconds-inner">
              <div id="raidTimerSeconds" class="raid-seconds-num ${lm.raidTimeRemaining <= 5 ? 'critical-pulse' : (lm.raidTimeRemaining <= 10 ? 'warning-yellow' : 'normal')}">
                ${lm.raidTimeRemaining}
              </div>
              <div class="raid-seconds-lbl">Vinaadigal (Secs)</div>
            </div>
          </div>

          <!-- Do or Die Alert Badge -->
          <div class="do-or-die-banner ${lm.isDoOrDie ? 'active' : ''}">
            <i class="ri-alarm-warning-fill"></i>
            <span>${lm.isDoOrDie ? '⚡ Do-Or-Die Raid! Pulli Kattayam!' : 'Sadharana Raid (Normal Raid)'}</span>
          </div>

          ${isCoach ? `
            <!-- Timer Buttons (Coach Only) -->
            <div class="raid-controls-row">
              <button id="raidTimerToggleBtn" class="raid-btn ${lm.isRaidRunning ? 'pause' : 'start'}" onclick="toggleRaidTimer()" title="Shortcut: Spacebar">
                <i class="${lm.isRaidRunning ? 'ri-pause-fill' : 'ri-play-fill'}"></i>
                <span>${lm.isRaidRunning ? 'Niruthu (Pause)' : 'Raid Arambi (Start)'}</span>
              </button>
              <button class="raid-btn reset" onclick="resetRaidTimer(30)" title="Shortcut: R">
                <i class="ri-restart-line"></i>
                <span>Meettamai (Reset 30s)</span>
              </button>
            </div>

            <!-- Quick Action Toggles (Coach Only) -->
            <div class="raid-sub-actions">
              <button class="sub-act-btn dod-btn ${lm.isDoOrDie ? 'active' : ''}" onclick="toggleDoOrDie()" title="Shortcut: D">
                <i class="ri-fire-fill"></i> Do-Or-Die Maatru
              </button>
              <button class="sub-act-btn" onclick="recordEmptyRaid()">
                <i class="ri-indeterminate-circle-line"></i> Vettru Raid (0 Pt)
              </button>
            </div>

            <!-- Scorekeeper Shortcuts Guide (Coach Only) -->
            <div class="keyboard-hints desktop-only">
              <span>⌨️ Kurukkuvazhigal: [Space] Arambi/Niruthu | [R] 30s | [D] Do-Or-Die | [U] Undo</span>
            </div>
          ` : `
            <div class="raid-viewer-indicator">
              <div class="raid-viewer-text"><i class="ri-timer-line"></i> 30s Raid Clock Live Timing</div>
              <div class="raid-viewer-sub">Clock & Do-Or-Die are controlled live by Coach Rajan</div>
            </div>
          `}
        </div>

        <!-- TEAM B: OPPONENT TEAM -->
        <div class="team-score-card team-opponent ${lm.activeRaidingTeam === 'teamB' ? 'raiding-active' : ''}">
          <div class="team-header">
            <div class="team-logo-badge opp-badge"><i class="ri-shield-user-fill"></i></div>
            <div style="flex:1;">
              <div class="team-name" style="color:var(--accent-cyan); display:flex; align-items:center; gap:6px;">
                <span>${tB.name}</span>
                ${isCoach ? `
                  <button class="edit-name-btn" onclick="editOpponentTeamName()" title="Ethirani Peyar Maatru">
                    <i class="ri-edit-line"></i>
                  </button>
                ` : ''}
              </div>
            </div>
            ${lm.activeRaidingTeam === 'teamB' ? '<span class="raiding-tag opp">Raid Selgirathu ⚡</span>' : ''}
          </div>

          <div class="score-display-huge text-gradient-cyan">${tB.score}</div>

          <!-- Court 7-man visual tracker -->
          <div class="court-status-wrap">
            <div class="court-label">
              <span>Kalam Irangiya Veerargal (On Mat):</span>
              <b style="color:var(--accent-cyan); font-size:1.1rem;">${tB.playersOnCourt} / 7</b>
            </div>
            <div class="court-dots-row">
              ${renderCourtDots(tB.playersOnCourt, 7, 'cyan')}
            </div>
          </div>

          <!-- Points Breakdown -->
          <div class="points-breakdown-grid">
            <div class="stat-pill"><span class="lbl">Raid Pulli</span><span class="val">${tB.raidPoints}</span></div>
            <div class="stat-pill"><span class="lbl">Pidi / Tackle</span><span class="val">${tB.tacklePoints}</span></div>
            <div class="stat-pill"><span class="lbl">Bonus Pulli</span><span class="val">${tB.bonusPoints}</span></div>
            <div class="stat-pill"><span class="lbl">Lona (+2)</span><span class="val">${tB.allOutPoints}</span></div>
          </div>

          <!-- TEAM B WIN BUTTON (DECLARE WINNER - COACH ONLY) -->
          ${isCoach ? `
            <div class="team-winner-action-bar">
              <button class="btn-declare-winner btn-declare-winner-b ${activeSched && activeSched.winner === 'teamB' ? 'winner-active' : ''}" onclick="declareTeamWinner('teamB')" title="Declare ${tB.name} as Winner">
                <i class="ri-trophy-fill"></i>
                <span>Win</span>
              </button>
            </div>
          ` : ''}

          <!-- Action Buttons for Opponent (Coach Mode) vs Spectator Lock (Player Mode) -->
          ${isCoach ? `
            <div class="point-actions-group">
              <div class="group-title">⚡ RAID PULLIGAL (ETHIRANI)</div>
              <div class="btn-row">
                <button class="pt-btn cyan" onclick="scoreRaidPoint('teamB', 1, false)">
                  <span class="pt-num">+1</span>
                  <span class="pt-label">Thodu Pulli</span>
                </button>
                <button class="pt-btn cyan" onclick="scoreRaidPoint('teamB', 2, false)">
                  <span class="pt-num">+2</span>
                  <span class="pt-label">2 Pulligal</span>
                </button>
                <button class="pt-btn super-cyan" onclick="scoreRaidPoint('teamB', 3, false)">
                  <span class="pt-num">⚡ +3</span>
                  <span class="pt-label">Super Raid</span>
                </button>
                <button class="pt-btn gold" onclick="scoreRaidPoint('teamB', 1, true)">
                  <span class="pt-num">⭐ +1</span>
                  <span class="pt-label">Bonus Pulli</span>
                </button>
              </div>

              <div class="group-title" style="margin-top:12px;">🛡️ PIDI / DEFENCE PULLIGAL (ETHIRANI)</div>
              <div class="btn-row">
                <button class="pt-btn orange" onclick="scoreTacklePoint('teamB', false)">
                  <span class="pt-num">🛡️ +1</span>
                  <span class="pt-label">Tackle Pulli</span>
                </button>
                <button class="pt-btn super-glow" onclick="scoreTacklePoint('teamB', true)">
                  <span class="pt-num">💥 +2</span>
                  <span class="pt-label">Super Tackle</span>
                </button>
                <button class="pt-btn purple" onclick="scoreAllOut('teamB')">
                  <span class="pt-num">👑 +2</span>
                  <span class="pt-label">Lona (All-Out)</span>
                </button>
                <button class="pt-btn outline" onclick="addTechnicalPoint('teamB')">
                  <span class="pt-num">⚖️ +1</span>
                  <span class="pt-label">Naduvar Pulli</span>
                </button>
              </div>
            </div>
          ` : ''}
        </div>

      </div>

      <!-- LOWER SECTION: LIVE COMMENTARY & MATCH ARCHIVE -->
      <div class="scoreboard-lower-grid">
        
        <!-- Live Action Commentary Log -->
        <div class="card-glass commentary-card">
          <div class="section-card-header">
            <div class="card-title-wrap">
              <i class="ri-broadcast-line text-gradient-orange"></i>
              <span>Live Match Commentary & Action Log</span>
            </div>
            <span class="log-count-badge">${(lm.actionLog || []).length} Events</span>
          </div>

          <div class="commentary-scroll-box" id="matchCommentaryBox">
            ${logHtml}
          </div>
        </div>

        <!-- Finish Match & Saved Matches Table -->
        <div class="card-glass history-card">
          <div class="section-card-header">
            <div class="card-title-wrap">
              <i class="ri-history-line text-gradient-cyan"></i>
              <span>Saved Matches History</span>
            </div>
            ${isCoach ? `
              <div style="display:flex; gap:8px;">
                <button class="btn-sm btn-primary-gradient" onclick="finishAndSaveMatch()">
                  <i class="ri-save-3-line"></i> Finish & Save Match
                </button>
                <button class="btn-sm btn-outline-danger" onclick="if(confirm('Reset match scores to 0-0?')) resetLiveMatchScores()">
                  <i class="ri-refresh-line"></i> Reset 0-0
                </button>
              </div>
            ` : ''}
          </div>

          <div class="history-table-wrap">
            <table class="scoreboard-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Match</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th class="desktop-only">Top Performer</th>
                </tr>
              </thead>
              <tbody>
                ${renderSavedMatchesTableRows()}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `;
}

