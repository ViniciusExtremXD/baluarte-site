/* Baluarte Extintores: menu, topo, carrossel, mapa das unidades, itens que aparecem ao rolar, números, formulário e rolagem suave. */
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

  // Mapa das unidades: o primeiro clique mostra a unidade, o segundo abre a página dela
  var units = document.querySelector('[data-units]');
  if (units) unitsMap(units);

  function unitsMap(box) {
    var rows = box.querySelectorAll('.city-row');
    var wrap = box.querySelector('.map-wrap');
    var canvas = box.querySelector('.map-canvas');
    var name = box.querySelector('.map-name');
    var short = box.querySelector('.map-short');
    var addr = box.querySelector('.map-addr');
    var go = box.querySelector('.map-go');
    var map = null, pins = [], sel = -1;

    function select(i) {
      if (sel > -1) { rows[sel].classList.remove('is-sel'); pins[sel].getElement().classList.remove('is-sel'); }
      sel = i;
      var d = rows[i].dataset;
      rows[i].classList.add('is-sel');
      pins[i].getElement().classList.add('is-sel');
      name.textContent = d.name;
      short.textContent = d.short;
      addr.textContent = d.addr;
      addr.hidden = !d.addr;
      go.href = rows[i].href;
      wrap.classList.add('has-sel');
      // No celular o cartão cobre a parte de baixo do mapa: o ponto fica mais acima
      var center = map.unproject(map.project([+d.lat, +d.lng], 12).add([0, canvas.clientWidth < 600 ? 130 : 0]), 12);
      if (full) map.flyTo(center, 12, { duration: 0.9 });
      else map.setView(center, 12);
    }

    rows.forEach(function (row, i) {
      row.addEventListener('click', function (e) {
        if (!map || sel === i) return; // sem mapa ou segundo clique: segue o link
        e.preventDefault();
        select(i);
      });
    });

    function draw() {
      map = L.map(canvas, { scrollWheelZoom: false, dragging: fine, tap: false, attributionControl: true });
      map.fitBounds(L.latLngBounds(Array.prototype.map.call(rows, function (r) { return [+r.dataset.lat, +r.dataset.lng]; })), { padding: [70, 70] });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
      map.attributionControl.setPrefix(false);
      rows.forEach(function (row, i) {
        var d = row.dataset;
        var html = '<i></i><b>' + d.name + (d.tag ? '<small>' + d.tag + '</small>' : '') + '</b>';
        var pin = L.marker([+d.lat, +d.lng], {
          icon: L.divIcon({ className: 'pin pin-' + d.side + (d.tag ? ' pin-unit' : ''), html: html, iconSize: [16, 16], iconAnchor: [8, 8] }),
          title: d.name, alt: d.name
        }).addTo(map);
        pin.getElement().style.setProperty('--n', i);
        pin.on('click', function () {
          if (sel === i) location.href = row.href;
          else select(i);
        });
        pins.push(pin);
      });
      new IntersectionObserver(function (en, o) {
        if (en[0].isIntersecting) { canvas.classList.add('on'); o.disconnect(); }
      }, { threshold: 0.35 }).observe(canvas);
    }

    function load() {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      var js = document.createElement('script');
      js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      js.onload = draw;
      document.head.appendChild(js);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en, o) {
        if (en[0].isIntersecting) { o.disconnect(); load(); }
      }, { rootMargin: '600px 0px' }).observe(wrap);
    } else load();
  }

  // Faixa de clientes: anda sozinha, e dá para arrastar e usar as setas nos dois sentidos
  var strip = document.querySelector('.marquee');
  if (strip && anim) clientStrip(strip);

  function clientStrip(box) {
    var shell = box.parentNode;
    var track = box.querySelector('.marquee-track');
    var group = track.firstElementChild;
    var speed = 28, x = 0, v = 0, nudge = 0, resume = 0, hover = false, drag = null, raf = 0, last = 0;
    var width = group.offsetWidth;
    addEventListener('resize', function () { width = group.offsetWidth; });
    box.classList.add('is-live');

    function tick(t) {
      raf = requestAnimationFrame(tick);
      var dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      if (!drag) {
        if (Math.abs(nudge) > 0.5) {
          var step = nudge * Math.min(1, dt * 7);
          x += step;
          nudge -= step;
        } else if (Math.abs(v) > 12) {
          x += v * dt;
          v *= Math.pow(0.04, dt);
        } else if (!hover && t > resume) {
          x += speed * dt;
        }
      }
      if (width) x = ((x % width) + width) % width;
      track.style.transform = 'translate3d(' + -x + 'px,0,0)';
    }
    function wait() { resume = performance.now() + 2500; }
    function move(by) { v = 0; nudge += by; wait(); }

    box.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      drag = { x: e.clientX, t: e.timeStamp };
      v = 0;
      nudge = 0;
      box.setPointerCapture(e.pointerId);
      box.classList.add('is-drag');
    });
    box.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      x -= dx;
      v = Math.max(-2500, Math.min(2500, -dx / Math.max(e.timeStamp - drag.t, 1) * 1000));
      drag.x = e.clientX;
      drag.t = e.timeStamp;
    });
    function end(e) {
      if (!drag) return;
      if (e.timeStamp - drag.t > 80) v = 0; // parou antes de soltar: sem embalo
      drag = null;
      box.classList.remove('is-drag');
      wait();
    }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    box.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      x += e.deltaX;
      wait();
    }, { passive: false });

    shell.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    shell.addEventListener('pointerleave', function () { hover = false; });
    shell.querySelector('.mq-prev').addEventListener('click', function () { move(-box.clientWidth * 0.6); });
    shell.querySelector('.mq-next').addEventListener('click', function () { move(box.clientWidth * 0.6); });

    // Só anima enquanto a faixa está na tela
    function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { (en[0].isIntersecting ? start : stop)(); }).observe(box);
    } else start();
  }

  if (full && fine) smoothScroll();
  if (!anim || !('IntersectionObserver' in window)) return;

  // Títulos: cada palavra entra em cascata
  document.querySelectorAll('.title,.how h2,.cta-band h2').forEach(function (t) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { if (n.tagName !== 'BR') walk(n); return; }
        if (n.nodeType !== 3 || !n.nodeValue.trim()) return;
        var frag = document.createDocumentFragment();
        n.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span');
          w.className = 'w';
          w.style.setProperty('--i', i++);
          w.textContent = part;
          frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      });
    })(t);
    t.classList.add('split', 'reveal');
  });

  // Todo componente aparece ao rolar; itens que entram juntos vêm um depois do outro
  var kinds = {
    '': '.clients-head,.marquee,.mq-btn,.kicker,.lead,.stats>li,.text>p,.sub,.checks>li,.how-side>*,.how-steps>li,.svc-inc h3,.svc-inc li,.units-list>li,.also,.city-links>li,.cta-band p,.cta-band .btn,.review,.faq-head .btn,.faq-item,.field,.form-submit,.form-hint,.info-card h3,.info-list>li,.bairros>li,.local-card>h3,.local-note,.local-addr,.prose>*,.post-cta>*,.ftr-grid>div,.ftr-legal,.gmaps-card,.how .kicker,.how h2',
    'reveal-s': '.svc,.svc-inc,.prova,.review-score,.post-card,.local-card,.form,.empresa-mini',
    'wipe': '.empresa-photo,.map-wrap'
  };
  Object.keys(kinds).forEach(function (k) {
    document.querySelectorAll(kinds[k]).forEach(function (el) {
      el.classList.add('reveal');
      if (k) el.classList.add(k);
    });
  });

  var show = function (entries, obs) {
    var n = 0;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.style.transitionDelay = Math.min(n++, 7) * 75 + 'ms';
      el.classList.add('in');
      el.classList.remove('pre');
      obs.unobserve(el);
      setTimeout(function () { el.classList.remove('in'); el.style.transitionDelay = ''; }, 1900);
    });
  };
  var io = new IntersectionObserver(show, { rootMargin: '0px 0px -7% 0px' });
  var ioEnd = new IntersectionObserver(show); // o rodapé nunca passa da margem acima: ele é o fim da página
  document.querySelectorAll('.reveal').forEach(function (el) {
    if (el.getBoundingClientRect().bottom > 0) {
      el.classList.add('pre');
      (el.closest('.ftr') ? ioEnd : io).observe(el);
    }
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
