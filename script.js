/* ================================================================
   FELIPE CARRERO · DEMO V0 · script.js
   Lenis smooth scroll + GSAP scroll triggers + reveals
   Mobile-first · cinematográfico · low-key · sin Three.js
   ================================================================ */

(() => {
  'use strict';

  // ---------------------------------------------
  // Hero video · graceful load/fail handling
  // ---------------------------------------------
  const heroVideo = document.querySelector('[data-hero-video]');
  const heroSection = document.querySelector('.hero');
  if (heroVideo && heroSection) {
    heroVideo.addEventListener('loadeddata', () => {
      heroSection.setAttribute('data-video-loaded', '');
    });
    heroVideo.addEventListener('error', () => {
      heroSection.setAttribute('data-video-failed', '');
    });
    // Si tras 3s no cargó, marcar como failed (red lenta o file missing)
    setTimeout(() => {
      if (!heroSection.hasAttribute('data-video-loaded')) {
        heroSection.setAttribute('data-video-failed', '');
      }
    }, 3500);

    // Respect prefers-reduced-motion: pause video
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroVideo.pause();
      heroVideo.removeAttribute('autoplay');
    }
  }

  // ---------------------------------------------
  // Boot loader · remove .loading class
  // ---------------------------------------------
  const removeLoading = () => {
    document.body.classList.remove('loading');
  };

  // Esperar a fonts + paint + libs (max 1.8s) antes de quitar loader
  Promise.race([
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    ]),
    new Promise(r => setTimeout(r, 1800))
  ]).then(removeLoading);

  // ---------------------------------------------
  // Lenis smooth scroll (CDN ESM, loaded async)
  // ---------------------------------------------
  let lenis = null;

  const initLenis = () => {
    if (!window.__Lenis) {
      // Lenis ESM aún cargando; retry breve
      setTimeout(initLenis, 80);
      return;
    }
    const Lenis = window.__Lenis;
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,        // mobile: no smooth touch (perf + native feel)
      touchMultiplier: 1.2,
      wheelMultiplier: 1.0,
      autoResize: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Integración con GSAP ScrollTrigger
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  };
  initLenis();

  // ---------------------------------------------
  // IntersectionObserver reveals · data-reveal
  // ---------------------------------------------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.revealDelay || '0', 10);
          setTimeout(() => entry.target.classList.add('is-visible'), delay);
          io.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.15
    });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ---------------------------------------------
  // Split words reveal · data-split
  // ---------------------------------------------
  const splitEls = document.querySelectorAll('[data-split]');
  if (splitEls.length && 'IntersectionObserver' in window) {
    const parents = new Map();
    splitEls.forEach((el) => {
      const p = el.parentElement;
      if (!parents.has(p)) parents.set(p, []);
      parents.get(p).push(el);
    });

    const splitIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const words = parents.get(entry.target);
          if (words) {
            words.forEach((word, idx) => {
              setTimeout(() => word.classList.add('is-visible'), idx * 70);
            });
          }
          splitIO.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -15% 0px',
      threshold: 0.2
    });
    parents.forEach((_, parent) => splitIO.observe(parent));
  }

  // ---------------------------------------------
  // Piece cards · zoom-in on enter
  // ---------------------------------------------
  const pieces = document.querySelectorAll('[data-piece]');
  if (pieces.length && 'IntersectionObserver' in window) {
    const pieceIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          pieceIO.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -20% 0px',
      threshold: 0.1
    });
    pieces.forEach((el) => pieceIO.observe(el));
  }

  // ---------------------------------------------
  // Sticky CTA · aparece después de scroll del hero
  // ---------------------------------------------
  const stickyCta = document.querySelector('[data-sticky-cta]');
  const hero = document.querySelector('.hero');
  if (stickyCta && hero && 'IntersectionObserver' in window) {
    const stickyIO = new IntersectionObserver((entries) => {
      const heroEntry = entries[0];
      if (!heroEntry.isIntersecting && heroEntry.boundingClientRect.bottom < 0) {
        // hero está arriba del viewport → mostrar sticky
        stickyCta.classList.add('is-visible');
      } else if (heroEntry.isIntersecting) {
        // hero visible → ocultar sticky
        stickyCta.classList.remove('is-visible');
      }
    }, {
      threshold: [0, 0.5, 1]
    });
    stickyIO.observe(hero);
  }

  // ---------------------------------------------
  // GSAP ScrollTrigger storytelling
  // ---------------------------------------------
  const initScrollStorytelling = () => {
    if (!window.gsap || !window.ScrollTrigger) {
      setTimeout(initScrollStorytelling, 120);
      return;
    }
    gsap.registerPlugin(window.ScrollTrigger);

    // Hero image · parallax sutil (mobile-friendly, sin overload)
    const heroVideo = document.querySelector('.hero__video');
    if (heroVideo) {
      gsap.to(heroVideo, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
      });
    }

    // Statement title · word reveals con stagger brutal (GSAP fromTo · no choca con [data-split] CSS)
    const statementWords = document.querySelectorAll('.statement__title [data-split]');
    if (statementWords.length) {
      // Mark visible immediately so CSS doesn't keep opacity 0 forever
      statementWords.forEach((word) => word.classList.add('is-visible'));
      gsap.fromTo(statementWords,
        { yPercent: 110, opacity: 0, skewY: 4 },
        {
          yPercent: 0,
          opacity: 1,
          skewY: 0,
          duration: 1.4,
          stagger: 0.12,
          ease: 'expo.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: '.statement',
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    document.querySelectorAll('.piece').forEach((piece) => {
      const img = piece.querySelector('img');
      if (!img) return;
      gsap.from(img, {
        scale: 1.18,
        duration: 1.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: piece,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });
      gsap.to(img, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: piece, start: 'top 90%', end: 'bottom 10%', scrub: 1.2 }
      });
    });

  };
  initScrollStorytelling();

  // ---------------------------------------------
  // Howler.js ambient track + localStorage preference
  // ---------------------------------------------
  const initAmbient = () => {
    if (!window.Howl) {
      setTimeout(initAmbient, 80);
      return;
    }
    const sound = new Howl({
      src: ['assets/ambient.mp3'],
      loop: true,
      volume: 0.18,
      autoplay: false,
      preload: true,
      onloaderror: () => {
        console.warn('[ambient] track not available - skip');
        const toggle = document.querySelector('[data-audio-toggle]');
        if (toggle) toggle.setAttribute('hidden', '');
      }
    });

    const toggle = document.querySelector('[data-audio-toggle]');
    if (!toggle) return;

    let preference = null;
    try {
      preference = localStorage.getItem('audioPreference');
    } catch {
      preference = null;
    }
    let isPlaying = false;

    const updateToggleUI = () => {
      toggle.setAttribute('data-playing', isPlaying ? 'true' : 'false');
    };

    if (preference === 'on') {
      toggle.setAttribute('data-pending', 'true');
    }
    updateToggleUI();

    toggle.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) sound.play(); else sound.pause();
      try {
        localStorage.setItem('audioPreference', isPlaying ? 'on' : 'off');
      } catch {
        // Ignore storage failures; audio still works for the session.
      }
      toggle.removeAttribute('data-pending');
      updateToggleUI();
      if ('vibrate' in navigator) navigator.vibrate(8);
    });
  };
  initAmbient();

  // ---------------------------------------------
  // State persistence: visited sections + scroll position
  // ---------------------------------------------
  const STATE_KEY = 'felipecarrero_state_v1';
  const loadState = () => {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); }
    catch { return {}; }
  };
  const saveState = (patch) => {
    try {
      const state = { ...loadState(), ...patch };
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      // State persistence is progressive enhancement.
    }
  };

  if ('IntersectionObserver' in window) {
    const sectionsIO = new IntersectionObserver((entries) => {
      const visited = new Set(loadState().visitedSections || []);
      let changed = false;
      entries.forEach((entry) => {
        const id = entry.target.dataset.scene;
        if (!id) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          if (!visited.has(id)) {
            visited.add(id);
            changed = true;
          }
          entry.target.setAttribute('data-visited', 'true');
        } else if (visited.has(id)) {
          entry.target.setAttribute('data-visited', 'true');
        }
      });
      if (changed) saveState({ visitedSections: [...visited], lastVisit: Date.now() });
    }, { threshold: [0.5, 0.75] });

    document.querySelectorAll('[data-scene]').forEach((el) => {
      sectionsIO.observe(el);
      const visited = new Set(loadState().visitedSections || []);
      if (visited.has(el.dataset.scene)) {
        el.setAttribute('data-visited', 'true');
      }
    });
  }

  window.addEventListener('load', () => {
    const state = loadState();
    if (state.scrollY && state.lastVisit && (Date.now() - state.lastVisit) < 30 * 60 * 1000) {
      document.body.setAttribute('data-returning', 'true');
    }
  });

  let scrollSaveTimer = null;
  window.addEventListener('scroll', () => {
    if (scrollSaveTimer) return;
    scrollSaveTimer = setTimeout(() => {
      saveState({ scrollY: window.scrollY, lastVisit: Date.now() });
      scrollSaveTimer = null;
    }, 800);
  }, { passive: true });

  // ---------------------------------------------
  // Touch ripple · presence on tap (mobile + click desktop)
  // ---------------------------------------------
  const spawnRipple = (x, y) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);
  };
  document.addEventListener('pointerdown', (e) => {
    // Skip si el target es un control interactivo (evitar doble feedback)
    const interactive = e.target.closest('button, a, input, textarea, select, [role="button"]');
    if (interactive) return;
    spawnRipple(e.clientX, e.clientY);
  }, { passive: true });

  // ---------------------------------------------
  // Tap haptics on iOS (subtle feedback en CTA)
  // ---------------------------------------------
  if (stickyCta && 'vibrate' in navigator) {
    stickyCta.addEventListener('click', () => {
      navigator.vibrate(10);
    });
  }
  const ctaBtn = document.querySelector('.cta__button');
  if (ctaBtn && 'vibrate' in navigator) {
    ctaBtn.addEventListener('click', () => {
      navigator.vibrate(15);
    });
  }

  // ---------------------------------------------
  // Pause transition video when offscreen (battery)
  // ---------------------------------------------
  const transitionVideo = document.querySelector('[data-transition-video]');
  const transitionSection = document.querySelector('.transition');
  if (transitionVideo && transitionSection && 'IntersectionObserver' in window) {
    const tIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          transitionVideo.play().catch(() => {});
        } else {
          transitionVideo.pause();
        }
      });
    }, { threshold: 0.15 });
    tIO.observe(transitionSection);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      transitionVideo.pause();
      transitionVideo.removeAttribute('autoplay');
    }
  }

  // ---------------------------------------------
  // Pause hero animation when offscreen (battery)
  // ---------------------------------------------
  if (hero && 'IntersectionObserver' in window) {
    const heroImage = hero.querySelector('.hero__image');
    const heroPause = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!heroImage) return;
        if (entry.isIntersecting) {
          heroImage.style.animationPlayState = 'running';
        } else {
          heroImage.style.animationPlayState = 'paused';
        }
      });
    }, { threshold: 0 });
    heroPause.observe(hero);
  }

  // ---------------------------------------------
  // PORTFOLIO FILTER · v3 · 4 categorías + Todas
  // ---------------------------------------------
  const filter = document.querySelector('.filter');
  const emptyNote = document.querySelector('[data-empty-note]');
  if (filter) {
    const pills = filter.querySelectorAll('.filter__pill');
    const pieces = document.querySelectorAll('.portfolio__list .piece');

    const applyFilter = (style) => {
      let visibleCount = 0;
      pieces.forEach((piece) => {
        const pieceStyle = piece.getAttribute('data-style');
        const matches = style === 'all' || pieceStyle === style;
        if (matches) {
          piece.hidden = false;
          piece.classList.remove('is-filtering-out');
          visibleCount++;
        } else {
          piece.classList.add('is-filtering-out');
          setTimeout(() => { piece.hidden = true; }, 280);
        }
      });
      // Empty-state note (e.g. "Minimalista" tiene 0 piezas)
      if (emptyNote) {
        emptyNote.hidden = visibleCount !== 0;
      }
      // Refresh ScrollTrigger after layout change
      if (window.ScrollTrigger) {
        setTimeout(() => window.ScrollTrigger.refresh(), 320);
      }
    };

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const style = pill.getAttribute('data-filter');
        pills.forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        applyFilter(style);
      });
    });
  }

  // ---------------------------------------------
  // FEATURE PIECE · v3 · pause video off-viewport
  // ---------------------------------------------
  const featureVideo = document.querySelector('.feature__video');
  if (featureVideo && 'IntersectionObserver' in window) {
    const featureObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          featureVideo.play().catch(() => {});
        } else {
          featureVideo.pause();
        }
      });
    }, { threshold: 0.25 });
    featureObserver.observe(featureVideo);
  }

  // ---------------------------------------------
  // Hint console (for Juan dev) — solo en localhost
  // ---------------------------------------------
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:') {
    console.log(
      '%c• FELIPE CARRERO · DEMO V0 •',
      'font-family: monospace; font-size: 14px; color: #f3ede8; background: #0a0a0a; padding: 8px 16px; letter-spacing: 0.25em;'
    );
    console.log('VISIONARIES STUDIO · 2026-05-20');
    console.log('Brand intelligence: 01-discovery/brand-intelligence/brand-intelligence-felipe-v0.1.md');
  }
})();
