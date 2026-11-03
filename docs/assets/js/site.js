/* Baluarte Extintores: menu do celular, topo, itens que aparecem ao rolar, números e rolagem suave. */
(function () {
  var root = document.documentElement;
  var full = root.classList.contains('anim') && !root.classList.contains('calm');
  var lenisSrc = document.currentScript.src.replace('site.js', 'lenis.min.js');

  var btn = document.querySelector('[data-menu-btn]');
  var menu = document.getElementById('menu');
  if (btn && menu) {
    var set = function (open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', function () { set(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  }

  var hdr = document.querySelector('.hdr');
  var onScroll = function () { hdr.classList.toggle('stuck', scrollY > 8); };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (full && matchMedia('(hover: hover) and (pointer: fine)').matches) smoothScroll();
  if (!root.classList.contains('anim') || !('IntersectionObserver' in window)) return;

  // Itens que entram juntos aparecem um depois do outro. O primeiro lote espera a primeira dobra começar.
  var base = 220;
  var io = new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.style.transitionDelay = base + Math.min(n++, 6) * 70 + 'ms';
      en.target.classList.add('in');
      en.target.classList.remove('pre');
      io.unobserve(en.target);
    });
    base = 0;
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.stats>li,.row>h2,.row>div>p,.row>div>h3,.row>div>.actions,.text>p,.svc>li,.steps>li,.inc>li,.logos>li,.photos>figure,.seal,.quotes>*,.cities>li,.faq>details,.contact-info>div,.post-list>li,.post-cta,.more-title,.more').forEach(function (el) {
    if (el.getBoundingClientRect().bottom > 0) { el.classList.add('pre'); io.observe(el); }
  });

  var stats = document.querySelector('.stats');
  if (stats && full) countUp(stats);

  function countUp(box) {
    var nums = box.querySelectorAll('[data-n]');
    box.classList.add('arm');
    nums.forEach(function (el) { el.textContent = '0'; });
    var so = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      so.disconnect();
      box.classList.add('on');
      nums.forEach(function (el) {
        var end = +el.dataset.n, t0 = performance.now();
        requestAnimationFrame(function tick(t) {
          var p = Math.min(Math.max(t - t0, 0) / 1600, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))).toLocaleString('pt-BR');
          if (p < 1) requestAnimationFrame(tick);
        });
      });
    }, { threshold: 0.35 });
    so.observe(box);
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
        lenis.scrollTo(el.getBoundingClientRect().top + scrollY - 72);
        history.pushState(null, '', a.hash);
      });
    };
    document.head.appendChild(s);
  }
})();
