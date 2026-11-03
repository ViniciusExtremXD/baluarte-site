/* Baluarte Extintores · site.js
   Motion: GSAP + ScrollTrigger + Lenis. Tudo é progressivo: sem JS ou com
   "reduzir movimento" o conteúdo aparece normal, só sem as animações. */
(function () {
  'use strict';
  var d = document, h = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  var forcedFull = h.classList.contains('motion-full');
  var liteCls = h.classList.contains('motion-lite');
  var motion = h.classList.contains('motion') && !!G && !!ST;
  var lite = motion && liteCls;          // "reduzir movimento": só fades suaves
  var full = motion && !liteCls;         // experiência completa
  var calm = liteCls || (reduce && !forcedFull);
  if (!motion) h.classList.remove('motion');
  if (!G && !calm) h.classList.add('css-mq');
  var lenis = null;
  var safe = function (fn) { try { fn(); } catch (e) { if (window.console) console.warn('[baluarte]', e); } };

  /* ---------- utilidades ---------- */
  function fmt(n, dec, suffix) {
    var s = Number(n).toLocaleString('pt-BR', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
    return s + (suffix || '');
  }
  function splitWords(el) {
    if (el.__split) return el.__split;
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = d.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            var w = d.createElement('span'); w.className = 'w';
            var wi = d.createElement('span'); wi.className = 'wi'; wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w); words.push(wi);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    })(el);
    el.__split = words;
    return words;
  }

  /* ---------- recursos que funcionam sempre ---------- */
  safe(function header() {
    var hdr = $('[data-hdr]'), bar = $('[data-progress]');
    if (!hdr) return;
    var last = 0;
    function onScroll() {
      var y = window.scrollY || h.scrollTop;
      hdr.classList.toggle('is-solid', y > 30);
      var menuOpen = $('[data-burger]') && $('[data-burger]').getAttribute('aria-expanded') === 'true';
      if (!menuOpen) hdr.classList.toggle('is-hidden', y > 640 && y > last + 2);
      if (y < last - 2) hdr.classList.remove('is-hidden');
      last = y;
      if (bar) {
        var max = h.scrollHeight - innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      }
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });

  safe(function menu() {
    var b = $('[data-burger]'), m = $('[data-menu]');
    if (!b || !m) return;
    function set(open) {
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      if (open) {
        m.hidden = false;
        if (lenis) lenis.stop();
        h.style.overflow = 'hidden';
        if (motion) G.fromTo($$('.menu-in > *', m), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .05, ease: 'expo.out' });
      } else {
        m.hidden = true; h.style.overflow = '';
        if (lenis) lenis.start();
      }
    }
    b.addEventListener('click', function () { set(b.getAttribute('aria-expanded') !== 'true'); });
    m.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && b.getAttribute('aria-expanded') === 'true') { set(false); b.focus(); } });
  });

  safe(function faq() {
    $$('.faq-item').forEach(function (det) {
      var sum = $('summary', det), ans = $('.faq-a', det);
      sum.addEventListener('click', function (e) {
        if (!motion) return;
        e.preventDefault();
        if (det.open) {
          G.to(ans, { height: 0, duration: .45, ease: 'power3.inOut', onComplete: function () { det.open = false; ans.style.height = ''; } });
        } else {
          det.open = true;
          var hgt = ans.scrollHeight;
          G.fromTo(ans, { height: 0 }, { height: hgt, duration: .55, ease: 'expo.out', onComplete: function () { ans.style.height = ''; if (ST) ST.refresh(); } });
        }
      });
    });
  });

  safe(function quoteBuilder() {
    $$('[data-qb]').forEach(function (f) {
      var link = $('[data-qb-link]', f), out = $('output', f), range = $('input[type=range]', f);
      function build() {
        var cidade = f.cidade.value, imovel = f.imovel.value;
        var serv = $$('input[name=s]:checked', f).map(function (i) { return i.value; });
        var q = range.value;
        out.textContent = q >= 100 ? '100+' : q;
        var msg = 'Olá! Vim pelo site e quero orçamento grátis.\n' +
          'Cidade: ' + cidade + '\nTipo de imóvel: ' + imovel +
          (serv.length ? '\nPreciso de: ' + serv.join(', ') : '') +
          '\nQuantidade aproximada de extintores: ' + (q >= 100 ? 'mais de 100' : q);
        link.href = 'https://wa.me/5513997401621?text=' + encodeURIComponent(msg);
      }
      f.addEventListener('input', build); f.addEventListener('change', build); build();
    });
  });

  safe(function mobileBar() {
    var bar = $('[data-mbar]'), hero = $('[data-hero]');
    if (!bar) return;
    if (!hero || !('IntersectionObserver' in window)) { bar.classList.add('is-on'); return; }
    new IntersectionObserver(function (es) { bar.classList.toggle('is-on', !es[0].isIntersecting); }, { threshold: 0.05 }).observe(hero);
  });

  safe(function readProgress() {
    var bar = $('[data-read-progress]'), prose = $('[data-prose]');
    if (!bar || !prose) return;
    function up() {
      var r = prose.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (innerHeight * .35 - r.top) / (r.height - innerHeight * .35)));
      bar.style.transform = 'scaleX(' + p + ')';
    }
    addEventListener('scroll', up, { passive: true }); up();
  });

  safe(function spotlight() {
    $$('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  });

  safe(function motionToggle() {
    var b = $('[data-motion-toggle]'); if (!b) return;
    b.textContent = liteCls ? 'Ativar animações completas' : 'Reduzir animações';
    b.addEventListener('click', function () {
      try { localStorage.setItem('blt-motion', liteCls ? 'full' : 'lite'); } catch (e) {}
      location.reload();
    });
  });

  safe(function embers() {
    if (calm) return;
    $$('[data-embers]').forEach(function (cv) {
      var ctx = cv.getContext('2d'), parts = [], W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), raf = 0, on = false;
      function size() {
        var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
        cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.round(Math.min(70, W / 22));
        parts = []; for (var i = 0; i < n; i++) parts.push(spawn(true));
      }
      function spawn(init) {
        return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: Math.random() * 1.8 + .4, vy: Math.random() * .6 + .25, vx: (Math.random() - .5) * .3, life: Math.random() * 1, hue: 15 + Math.random() * 25, fl: Math.random() * 6.28 };
      }
      function tick() {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y -= p.vy; p.x += p.vx + Math.sin(p.fl += .03) * .25; p.life += .002;
          var a = Math.max(0, Math.min(1, (p.y / H))) * (.55 + Math.sin(p.fl * 3) * .25);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fillStyle = 'hsla(' + p.hue + ',100%,60%,' + a + ')';
          ctx.shadowBlur = 8; ctx.shadowColor = 'hsla(' + p.hue + ',100%,55%,' + a + ')';
          ctx.fill();
          if (p.y < -10) parts[i] = spawn(false);
        }
        raf = requestAnimationFrame(tick);
      }
      size(); addEventListener('resize', size);
      new IntersectionObserver(function (es) {
        var vis = es[0].isIntersecting;
        if (vis && !on) { on = true; raf = requestAnimationFrame(tick); }
        else if (!vis && on) { on = false; cancelAnimationFrame(raf); }
      }).observe(cv);
    });
  });

  safe(function heroGlow() {
    if (!fine || calm) return;
    $$('[data-hero],[data-final]').forEach(function (s) {
      s.addEventListener('pointermove', function (e) {
        var r = s.getBoundingClientRect();
        s.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
        s.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  });

  if (!motion) {
    var ld = $('[data-loader]'); if (ld) ld.classList.remove('is-on');
    return;
  }

  /* ================= MOTION ================= */
  G.registerPlugin(ST);
  G.defaults({ ease: 'expo.out', duration: 1 });

  safe(function smooth() {
    if (!window.Lenis || !fine || lite) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    h.classList.add('lenis');
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  });

  function hdrOffset() { return -((parseInt(getComputedStyle(h).getPropertyValue('--hdr')) || 76) + 8); }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: hdrOffset(), duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  }

  /* links internos: âncoras suaves e cortina entre páginas */
  safe(function links() {
    var curtain = $('[data-curtain]'), spans = curtain ? $$('span', curtain) : [];
    try {
      if (sessionStorage.getItem('blt-trans')) {
        sessionStorage.removeItem('blt-trans');
        G.set(spans, { scaleY: 1 });
        G.to(spans, { scaleY: 0, transformOrigin: function (i) { return i ? 'top' : 'bottom'; }, duration: .9, stagger: .08, ease: 'expo.inOut', delay: .05 });
      }
    } catch (e) {}
    addEventListener('pageshow', function (e) { if (e.persisted) G.set(spans, { scaleY: 0 }); });
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
      var url; try { url = new URL(a.href, location.href); } catch (er) { return; }
      if (url.origin !== location.origin || /^(tel|mailto):/.test(a.href)) return;
      var samePage = url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
      if (samePage && url.hash) {
        var t = d.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (t) { e.preventDefault(); scrollToEl(t); history.pushState(null, '', url.hash); }
        return;
      }
      if (samePage || lite) return;
      e.preventDefault();
      try { sessionStorage.setItem('blt-trans', '1'); } catch (er) {}
      G.to(spans, { scaleY: 1, transformOrigin: function (i) { return i ? 'bottom' : 'top'; }, duration: .6, stagger: .06, ease: 'expo.inOut', onComplete: function () { location.href = url.href; } });
    });
    if (location.hash) {
      var t = d.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) setTimeout(function () { scrollToEl(t); }, 900);
    }
  });

  /* split + reveal de títulos */
  safe(function titles() {
    $$('[data-split]').forEach(function (el) {
      if (lite) { G.from(el, { opacity: 0, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%' } }); return; }
      var w = splitWords(el);
      G.from(w, { yPercent: 115, rotate: 4, duration: 1.1, stagger: .04, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
  });

  safe(function reveals() {
    ST.batch('[data-reveal]:not([data-reveal="clip"])', {
      start: 'top 90%', once: true,
      onEnter: function (els) { G.fromTo(els, { y: lite ? 0 : 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: .08 }); }
    });
    $$('[data-reveal="clip"]').forEach(function (el) {
      var img = $('img', el);
      if (lite) { G.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 88%' } }); return; }
      var tl = G.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } });
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 22px)', opacity: 1 }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.4, ease: 'expo.inOut' });
      if (img) tl.from(img, { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0);
    });
    $$('[data-stagger]').forEach(function (g) {
      G.fromTo(g.children, { y: lite ? 0 : 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: .08, scrollTrigger: { trigger: g, start: 'top 88%' } });
    });
  });

  safe(function counters() {
    $$('[data-count]').forEach(function (el) {
      if (el.closest('[data-hero]')) return; // hero anima na intro
      var to = parseFloat(el.getAttribute('data-count')), dec = +el.getAttribute('data-decimals') || 0, suf = el.getAttribute('data-suffix') || '';
      var o = { v: 0 };
      G.to(o, { v: to, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: function () { el.textContent = fmt(o.v, dec, suf); } });
    });
  });

  /* intro do hero (depois do preloader) */
  function heroIntro() {
    var hero = $('[data-hero]'); if (!hero) return;
    var title = $('[data-hero-title]', hero);
    if (lite) {
      var g0 = $('[data-gauge]', hero);
      if (g0) { G.set($('.g-needle', g0), { rotation: 48, svgOrigin: '110 120' }); G.set($('.g-arc', g0), { strokeDashoffset: 0 }); }
      var lt = G.timeline({ defaults: { ease: 'power2.out', duration: 1 } });
      lt.to(title, { opacity: 1, duration: 1.2 }, 0)
        .fromTo($$('[data-hero-in]', hero), { opacity: 0 }, { opacity: 1, stagger: .1 }, .2)
        .fromTo($$('[data-hero-visual] > *', hero), { opacity: 0 }, { opacity: 1, stagger: .15 }, .3);
      $$('[data-count]', hero).forEach(function (el) {
        var to = parseFloat(el.getAttribute('data-count')), dec = +el.getAttribute('data-decimals') || 0, suf = el.getAttribute('data-suffix') || '', o = { v: 0 };
        lt.to(o, { v: to, duration: 1.8, onUpdate: function () { el.textContent = fmt(o.v, dec, suf); } }, .4);
      });
      return;
    }
    var tl = G.timeline({ defaults: { ease: 'expo.out' } });
    if (title) {
      var w = splitWords(title);
      tl.from(w, { yPercent: 120, rotate: 6, duration: 1.3, stagger: .055 }, 0);
      G.set(title, { opacity: 1 });
    }
    tl.fromTo($$('[data-hero-in]', hero), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: .09 }, .25);
    var vis = $('[data-hero-visual]', hero);
    if (vis) {
      var photo = $('.hero-photo', vis), gauge = $('[data-gauge]', vis), ficha = $('[data-ficha]', vis), word = $('[data-city-word]', vis), route = $('[data-route]', vis);
      if (photo) tl.fromTo(photo, { opacity: 1, clipPath: 'polygon(100% 0,100% 0,100% 100%,100% 100%)' }, { clipPath: 'polygon(14% 0,100% 0,100% 100%,0 100%)', duration: 1.6, ease: 'expo.inOut' }, .1)
        .from($('img', photo), { scale: 1.35, duration: 2.2 }, .1);
      if (word) tl.fromTo(word, { opacity: 0, xPercent: 12 }, { opacity: 1, xPercent: 0, duration: 1.8 }, .1);
      if (route) tl.fromTo(route, { opacity: 0 }, { opacity: 1, duration: .4 }, .2).from($$('li', route), { x: -30, opacity: 0, stagger: .07, duration: 1 }, .3);
      if (gauge) {
        tl.fromTo(gauge, { opacity: 0, scale: .85, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 1 }, .6)
          .to($('.g-arc', gauge), { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, .8)
          .fromTo($('.g-needle', gauge), { rotation: -90, svgOrigin: '110 120' }, { rotation: 48, svgOrigin: '110 120', duration: 2.2, ease: 'elastic.out(1,.35)' }, .9)
          .call(function () {
            G.to($('.g-needle', gauge), { rotation: '+=3', svgOrigin: '110 120', duration: .12, repeat: -1, yoyo: true, ease: 'sine.inOut', repeatDelay: 1.6 });
          });
      }
      if (ficha) {
        tl.fromTo(ficha, { opacity: 0, y: 60, rotate: 3 }, { opacity: 1, y: 0, rotate: 0, duration: 1.2 }, .75)
          .from($$('li', ficha), { x: 24, opacity: 0, stagger: .08, duration: .8 }, 1)
          .from($$('li b', ficha), { scale: 0, stagger: .1, duration: .7, ease: 'back.out(3)' }, 1.25)
          .from($('.stamp', ficha), { scale: 0, rotate: -180, duration: 1.2, ease: 'back.out(1.6)' }, 1.4);
      }
    }
    $$('[data-count]', hero).forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count')), dec = +el.getAttribute('data-decimals') || 0, suf = el.getAttribute('data-suffix') || '';
      var o = { v: 0 };
      tl.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v, dec, suf); } }, .8);
    });
    // parallax do hero ao rolar
    var heroIn = hero.querySelector('.hero-in');
    if (heroIn) G.to(heroIn, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  safe(function preloader() {
    var ld = $('[data-loader]');
    if (ld && ld.classList.contains('is-on')) {
      var img = $('img', ld), bar = $('.loader-bar i', ld);
      var tl = G.timeline({ onComplete: function () { ld.classList.remove('is-on'); try { sessionStorage.setItem('blt-seen', '1'); } catch (e) {} } });
      tl.to(img, { opacity: 1, y: 0, duration: .7 })
        .to(bar, { width: '100%', duration: 1, ease: 'power2.inOut' }, .1)
        .to(ld, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, '+=.1')
        .add(heroIntro, '-=.55');
    } else {
      heroIntro();
    }
  });

  /* marquees reagindo à velocidade do scroll */
  function velocityMarquee(track, dur, dir) {
    var tw = G.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: dur, ease: 'none', repeat: -1 });
    ST.create({
      trigger: track, start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var v = self.getVelocity();
        G.to(tw, { timeScale: (1 + Math.min(Math.abs(v) / 300, 5)) * (v < 0 ? -1 : 1), duration: .2, overwrite: true });
        G.to(tw, { timeScale: v < 0 ? -1 : 1, duration: 1.2, delay: .25, ease: 'power2.out' });
      }
    });
    track.addEventListener('mouseenter', function () { G.to(tw, { timeScale: .15, duration: .6, overwrite: true }); });
    track.addEventListener('mouseleave', function () { G.to(tw, { timeScale: 1, duration: .6, overwrite: true }); });
    return tw;
  }
  safe(function marquees() {
    if (lite) return;
    $$('[data-marquee] .marquee-track').forEach(function (t) { velocityMarquee(t, 55, 1); });
    $$('[data-rev-marquee] .rev-row').forEach(function (row, i) { velocityMarquee($('.rev-track', row), 70, i ? -1 : 1); });
  });

  safe(function kinetic() {
    if (lite) return;
    $$('[data-kinetic] .kinetic-row').forEach(function (row) {
      G.fromTo(row, { xPercent: 0 }, { xPercent: -33.33, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: .6 } });
    });
  });

  safe(function risks() {
    var demo = $('[data-label-demo]');
    if (lite) {
      ST.batch('[data-risk]', { start: 'top 90%', once: true, onEnter: function (els) { G.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 1, stagger: .12 }); els.forEach(function (el) { el.classList.add('is-in'); }); } });
      return;
    }
    if (demo) {
      var stamp = $('.label-stamp', demo);
      G.timeline({ scrollTrigger: { trigger: demo, start: 'top 80%' } })
        .from($('.label-tag', demo), { y: 40, opacity: 0, rotate: -4, duration: 1 })
        .fromTo(stamp, { scale: 2.6, opacity: 0, rotate: 8 }, { scale: 1, opacity: 1, rotate: -12, duration: .5, ease: 'power4.in' }, '+=.2')
        .to(demo, { x: 6, duration: .06, repeat: 5, yoyo: true, ease: 'none' });
    }
    ST.batch('[data-risk]', {
      start: 'top 88%', once: true,
      onEnter: function (els) {
        G.fromTo(els, { y: 60, opacity: 0, rotateX: -25 }, { y: 0, opacity: 1, rotateX: 0, duration: 1.2, stagger: .12, transformPerspective: 800 });
        els.forEach(function (el, i) { setTimeout(function () { el.classList.add('is-in'); }, 300 + i * 120); });
      }
    });
  });

  safe(function included() {
    ST.batch('[data-inc]', {
      start: 'top 90%', once: true,
      onEnter: function (els) {
        G.fromTo(els, { x: lite ? 0 : 50, opacity: 0 }, { x: 0, opacity: 1, duration: 1, stagger: .09 });
        if (lite) return;
        G.fromTo(els.map(function (e) { return $('.ck', e); }), { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: .8, stagger: .09, delay: .35, ease: 'power2.out' });
        G.from(els.map(function (e) { return $('.inc-tag', e); }), { scale: 0, duration: .7, stagger: .09, delay: .45, ease: 'back.out(3)' });
      }
    });
  });

  safe(function steps() {
    var mm = G.matchMedia();
    $$('[data-steps]').forEach(function (sec) {
      var track = $('[data-steps-track]', sec), line = $('[data-steps-line]', sec), rail = $('.steps-rail', sec), pin = $('.steps-pin', sec);
      var items = $$('.step', sec);
      if (lite) {
        G.set(line, { scaleX: 1 }); items.forEach(function (it) { it.classList.add('is-on'); });
        G.fromTo(items, { opacity: 0 }, { opacity: 1, duration: 1, stagger: .12, scrollTrigger: { trigger: sec, start: 'top 75%' } });
        return;
      }
      mm.add('(min-width: 901px)', function () {
        var dist = function () { return Math.max(0, track.scrollWidth - rail.clientWidth + 40); };
        G.timeline({
          scrollTrigger: {
            trigger: sec, start: 'top top', end: function () { return '+=' + (dist() + innerHeight * .6); },
            pin: pin, scrub: .8, invalidateOnRefresh: true,
            onUpdate: function (self) {
              var p = self.progress;
              items.forEach(function (it, i) { it.classList.toggle('is-on', p >= i / (items.length - 1) - .02); });
            }
          }
        }).to(track, { x: function () { return -dist(); }, ease: 'none' }, 0)
          .fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);
      });
      mm.add('(max-width: 900px)', function () {
        items.forEach(function (it) {
          G.fromTo(it, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: it, start: 'top 88%', onEnter: function () { it.classList.add('is-on'); } } });
        });
      });
    });
  });

  safe(function guarantee() {
    $$('[data-dial]').forEach(function (dial) {
      var arc = $('.g-dial-arc', dial), num = $('[data-dial-num]', dial), o = { v: 0 };
      G.timeline({ scrollTrigger: { trigger: dial, start: 'top 80%' } })
        .to(arc, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' })
        .to(o, { v: 7, duration: 2, ease: 'power2.inOut', onUpdate: function () { num.textContent = Math.round(o.v); } }, 0);
      if (full) G.from(dial, { rotate: -60, scale: .8, duration: 2, scrollTrigger: { trigger: dial, start: 'top 80%' } });
    });
    if (lite) return;
    $$('[data-g-big]').forEach(function (b) {
      G.fromTo(b, { xPercent: 20 }, { xPercent: -10, ease: 'none', scrollTrigger: { trigger: b.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  safe(function stats() {
    ST.batch('[data-stat]', { start: 'top 90%', once: true, onEnter: function (els) { G.fromTo(els, { y: lite ? 0 : 50, opacity: 0, scale: lite ? 1 : .94 }, { y: 0, opacity: 1, scale: 1, duration: 1.1, stagger: .1 }); } });
    if (lite) return;
    $$('[data-spin]').forEach(function (s) { G.to(s, { rotate: 360, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: 1 } }); });
    $$('[data-stars]').forEach(function (s) { G.from(s.children, { scale: 0, rotate: -90, stagger: .08, duration: .8, ease: 'back.out(3)', scrollTrigger: { trigger: s, start: 'top 90%' } }); });
  });

  safe(function svcIcons() {
    $$('.svc .draw, .ico-lg .draw').forEach(function (p) {
      var len = 200; try { len = Math.ceil(p.getTotalLength()); } catch (e) {}
      p.style.setProperty('--len', len);
      G.fromTo(p, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: p.closest('.svc') || p, start: 'top 85%' } });
    });
  });

  safe(function chips() {
    if (lite) return;
    $$('[data-chips]').forEach(function (c) { G.from(c.children, { scale: .6, opacity: 0, duration: .7, stagger: .035, ease: 'back.out(2.5)', scrollTrigger: { trigger: c, start: 'top 88%' } }); });
  });

  safe(function parallax() {
    if (lite) return;
    $$('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-parallax')) || 6;
      G.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-city-word]').forEach(function (w) { G.to(w, { xPercent: -14, ease: 'none', scrollTrigger: { trigger: w.closest('section'), start: 'top top', end: 'bottom top', scrub: true } }); });
    var big = $('[data-ftr-big]');
    if (big) G.fromTo(big, { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: big.parentNode, start: 'top bottom', end: 'bottom 70%', scrub: true } });
  });

  /* interações de ponteiro fino */
  safe(function pointer() {
    if (!fine || lite) return;
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = G.quickTo(el, 'x', { duration: .5, ease: 'power3.out' }), yTo = G.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .25); yTo((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
    $$('[data-tilt]').forEach(function (el) {
      var rx = G.quickTo(el, 'rotationX', { duration: .6, ease: 'power3.out' }), ry = G.quickTo(el, 'rotationY', { duration: .6, ease: 'power3.out' });
      G.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 8); rx(-((e.clientY - r.top) / r.height - .5) * 8);
      });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
    var cur = $('[data-cursor]');
    if (cur) {
      var cx = G.quickTo(cur, 'x', { duration: .25, ease: 'power3.out' }), cy = G.quickTo(cur, 'y', { duration: .25, ease: 'power3.out' });
      addEventListener('pointermove', function (e) { cur.classList.add('is-on'); cx(e.clientX); cy(e.clientY); });
      d.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
      d.addEventListener('pointerover', function (e) { cur.classList.toggle('is-hover', !!e.target.closest('a,button,summary,label,select,input')); });
    }
  });

  /* recalcula posições quando fontes e imagens terminam de carregar */
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
  addEventListener('load', function () { ST.refresh(); });
})();
