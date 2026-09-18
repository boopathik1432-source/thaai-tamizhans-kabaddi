// 🏆 தாய் தமிழன்ஸ் (THAAI TAMIZHANS) — PWA & Mobile Add to Home Screen Manager
(function() {
  'use strict';

  let deferredPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // Detect and handle beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar on Chrome Mobile
    e.preventDefault();
    deferredPrompt = e;
    window.deferredPWAInstallPrompt = e;
    console.log('[PWA] beforeinstallprompt captured');

    // Show Install UI if not already dismissed today and not standalone
    if (!isStandalone) {
      showInstallBanners();
    }
  });

  // Handle successful installation
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App successfully installed on device!');
    deferredPrompt = null;
    window.deferredPWAInstallPrompt = null;
    hideInstallBanners();

    if (window.showAppToast) {
      window.showAppToast('🎉 தாய் தமிழன்ஸ் ஆப் முகப்புத் திரையில் (Home Screen) வெற்றிகரமாக சேர்க்கப்பட்டது!', 'success');
    } else {
      alert('🎉 தாய் தமிழன்ஸ் ஆப் முகப்புத் திரையில் (Home Screen) வெற்றிகரமாக சேர்க்கப்பட்டது!');
    }
  });

  function showInstallBanners() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        banner.classList.add('visible');
      }
    }

    // Also reveal header install button and sidebar install button
    const headerBtn = document.getElementById('btnHeaderPwaInstall');
    if (headerBtn) headerBtn.style.display = 'inline-flex';

    const sidebarBtns = document.querySelectorAll('.pwa-sidebar-install-item');
    sidebarBtns.forEach(el => el.style.display = 'block');

    const loginInstallBtn = document.getElementById('btnLoginPwaInstall');
    if (loginInstallBtn) loginInstallBtn.style.display = 'inline-flex';
  }

  function hideInstallBanners() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.remove('visible');

    const headerBtn = document.getElementById('btnHeaderPwaInstall');
    if (headerBtn) headerBtn.style.display = 'none';

    const sidebarBtns = document.querySelectorAll('.pwa-sidebar-install-item');
    sidebarBtns.forEach(el => el.style.display = 'none');

    const loginInstallBtn = document.getElementById('btnLoginPwaInstall');
    if (loginInstallBtn) loginInstallBtn.style.display = 'none';
  }

  // Global trigger function called when user taps any "Install" or "Add to Home Screen" button
  window.triggerPWAInstall = async function() {
    if (deferredPrompt) {
      // Chrome/Edge/Samsung Internet standard prompt
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', choiceResult.outcome);
      if (choiceResult.outcome === 'accepted') {
        hideInstallBanners();
      }
      deferredPrompt = null;
    } else if (isIOS) {
      // iOS Safari manual instructions
      openPwaIosModal();
    } else {
      // Fallback modal for browsers that don't support or haven't yet fired beforeinstallprompt
      openPwaAndroidModal();
    }
  };

  // Close floating banner
  window.dismissPwaBanner = function() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.remove('visible');
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // Open iOS Guide Modal
  window.openPwaIosModal = function() {
    const modal = document.getElementById('modalPwaIosGuide');
    if (modal) {
      modal.classList.add('active');
    }
  };

  // Close iOS Guide Modal
  window.closePwaIosModal = function() {
    const modal = document.getElementById('modalPwaIosGuide');
    if (modal) {
      modal.classList.remove('active');
    }
  };

  // Open Android/General Guide Modal
  window.openPwaAndroidModal = function() {
    const modal = document.getElementById('modalPwaAndroidGuide');
    if (modal) {
      modal.classList.add('active');
    }
  };

  // Close Android Guide Modal
  window.closePwaAndroidModal = function() {
    const modal = document.getElementById('modalPwaAndroidGuide');
    if (modal) {
      modal.classList.remove('active');
    }
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    if (isStandalone) {
      console.log('[PWA] Running in Standalone App Mode.');
      document.body.classList.add('pwa-standalone-mode');
      return;
    }

    // Always show install options on mobile devices (iOS or Android)
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobileDevice) {
      setTimeout(() => {
        showInstallBanners();
      }, 1500);
    }
  });

})();
