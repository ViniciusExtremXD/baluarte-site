/* Baluarte Extintores: menu, topo, carrossel, itens que aparecem ao rolar, números, formulário e rolagem suave. */
(function () {
  var root = document.documentElement;
  var anim = root.classList.contains('anim');
  var full = anim && !root.classList.contains('calm');
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lenisSrc = document.currentScript.src.replace('site.js', 'lenis.min.js');

  // Menu do celular
  var btn = document.querySelector('[data-menu-btn]');
  var nav = document.getElementById('nav');
  var setMenu = function (open) {
    nav.classList.toggle('is-open', open);
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  btn.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });

  // Topo e barra de progresso
  var hdr = document.querySelector('.hdr');
  var bar = document.querySelector('.progress span');
  var ticking = false;
  var onScroll = function () {
    ticking = false;
    hdr.classList.toggle('is-scrolled', scrollY > 8);
    var max = root.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
  };
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Formulário: abre o WhatsApp com a mensagem pronta
  document.querySelectorAll('[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lines = ['Olá! Vim pelo site e quero um orçamento.'];
      form.querySelectorAll('[data-l]').forEach(function (el) {
        if (el.value.trim()) lines.push(el.dataset.l + ': ' + el.value.trim());
      });
      // Um clique em link de verdade: os acionadores de wa.me do GTM também enxergam este envio.
      var a = document.createElement('a');
      a.href = form.action + '?text=' + encodeURIComponent(lines.join('\n'));
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  });

  // Carrossel da primeira dobra
  var hero = document.querySelector('.hero');
  if (hero) slider(hero);

  function slider(box) {
    var slides = box.querySelectorAll('.slide');
    var dots = box.querySelectorAll('.hero-dot');
    var pause = box.querySelector('.hero-pause');
    var dur = 6500, cur = 0, timer = null, paused = false;
    function go(i) {
      slides[cur].classList.remove('is-active');
      dots[cur].classList.remove('is-active');
      dots[cur].removeAttribute('aria-current');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('is-active');
      dots[cur].classList.add('is-active');
      dots[cur].setAttribute('aria-current', 'true');
      box.classList.toggle('on-light', slides[cur].classList.contains('slide-light'));
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (!paused && !document.hidden) timer = setTimeout(function () { go(cur + 1); }, dur);
    }
    function setPaused(on) {
      paused = on;
      box.classList.toggle('is-paused', on);
      pause.classList.toggle('is-paused', on);
      pause.setAttribute('aria-pressed', on ? 'true' : 'false');
      pause.setAttribute('aria-label', on ? 'Retomar a troca automática' : 'Pausar a troca automática');
      schedule();
    }
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    pause.addEventListener('click', function () { setPaused(!paused); });
    document.addEventListener('visibilitychange', schedule);
    var startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
    schedule();
  }

  // Menu acompanha a seção visível (só na página inicial)
  if (hero && 'IntersectionObserver' in window) {
    var links = nav.querySelectorAll('a[href^="#"]');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.hash === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var el = document.querySelector(a.hash);
      if (el) spy.observe(el);
    });
  }

  // Brilho que segue o mouse nos cartões
  if (fine) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.glow');
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', e.clientX - r.left + 'px');
      c.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true });
  }

  if (full && fine) smoothScroll();
  if (!anim || !('IntersectionObserver' in window)) return;

  // Itens que entram juntos aparecem um depois do outro
  var io = new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.style.transitionDelay = Math.min(n++, 6) * 80 + 'ms';
      el.classList.add('in');
      el.classList.remove('pre');
      io.unobserve(el);
      setTimeout(function () { el.classList.remove('in'); el.style.transitionDelay = ''; }, 1500);
    });
  }, { rootMargin: '0px 0px -7% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) {
    if (el.getBoundingClientRect().bottom > 0) { el.classList.add('pre'); io.observe(el); }
  });

  // Números que contam ao aparecer
  var stats = document.querySelector('.stats');
  if (stats) {
    var nums = stats.querySelectorAll('[data-n]');
    nums.forEach(function (el) { el.textContent = '0'; });
    var so = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      so.disconnect();
      nums.forEach(function (el) {
        var end = +el.dataset.n, t0 = performance.now();
        requestAnimationFrame(function tick(t) {
          var p = Math.min(Math.max(t - t0, 0) / 1800, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))).toLocaleString('pt-BR');
          if (p < 1) requestAnimationFrame(tick);
        });
      });
    }, { threshold: 0.4 });
    so.observe(stats);
  }

  function smoothScroll() {
    var s = document.createElement('script');
    s.src = lenisSrc;
    s.onload = function () {
      var lenis = new Lenis({ lerp: 0.12 });
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
      document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href*="#"]:not(.skip)');
        if (!a || !a.hash || a.pathname !== location.pathname) return;
        var el = document.querySelector(a.hash);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(a.hash === '#home' ? 0 : el.getBoundingClientRect().top + scrollY - 60);
        history.pushState(null, '', a.hash);
      });
    };
    document.head.appendChild(s);
  }
})();
