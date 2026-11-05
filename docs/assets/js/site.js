/* Baluarte Extintores: menu, topo, carrossel, mapa das unidades, itens que aparecem ao rolar, números, formulário e rolagem suave. */
(function () {
  var root = document.documentElement;
  var anim = root.classList.contains('anim');
  var full = anim && !root.classList.contains('calm');
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lenisSrc = document.currentScript.src.replace('site.js', 'lenis.min.js');
  var idle = window.requestIdleCallback ? function (f) { requestIdleCallback(f, { timeout: 1500 }); } : function (f) { setTimeout(f, 300); };

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
  var ticking = false, maxScroll = 0;
  var onScroll = function () {
    ticking = false;
    var y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 8);
    bar.style.transform = 'scaleX(' + (maxScroll > 0 ? Math.min(y / maxScroll, 1) : 0) + ')';
  };
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  // A altura da página só é lida quando muda, e não a cada passo da rolagem
  var measurePage = function () { maxScroll = root.scrollHeight - innerHeight; onScroll(); };
  addEventListener('resize', measurePage);
  if ('ResizeObserver' in window) new ResizeObserver(measurePage).observe(document.body);
  else requestAnimationFrame(measurePage);

  // Fora da tela, as animações da peça ficam paradas
  function pauseAway(el) {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) { el.classList.toggle('is-away', !en[0].isIntersecting); }).observe(el);
  }
  var heroPage = document.querySelector('.hero-page');
  if (heroPage) pauseAway(heroPage);

  // Formulário: abre o WhatsApp com a mensagem pronta
  document.querySelectorAll('[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lines = ['Olá! Vim pelo site e quero um orçamento.'];
      form.querySelectorAll('[data-l]').forEach(function (el) {
        if (el.value.trim()) lines.push(el.dataset.l + ': ' + el.value.trim());
      });
      // O GTM conta o envio por este evento. Sem clique em link: o que a pessoa digitou não vai para o Analytics.
      (window.dataLayer = window.dataLayer || []).push({ event: 'orcamento_enviado' });
      var url = form.action + '?text=' + encodeURIComponent(lines.join('\n'));
      var w = window.open(url, '_blank');
      if (w) w.opener = null;
      else location.href = url;
    });
  });

  // Carrossel da primeira dobra
  var hero = document.querySelector('.hero');
  if (hero) slider(hero);

  function slider(box) {
    var slides = box.querySelectorAll('.slide');
    var dots = box.querySelectorAll('.hero-dot');
    var dur = 6500, left = dur, t0 = 0, away = false, cur = 0, timer = null, leaving = null;
    // Deixa a foto do próximo destaque pronta, para a troca não mostrar o fundo vazio
    function prepare(i) {
      var img = slides[(i + slides.length) % slides.length].querySelector('img');
      idle(function () { if (img && img.decode) img.decode().catch(function () {}); });
    }
    function go(i) {
      i = (i + slides.length) % slides.length;
      if (i === cur) return;
      // O destaque que sai fica por baixo até o novo cobrir a tela
      slides.forEach(function (s) { s.classList.remove('was-active'); });
      var out = slides[cur];
      out.classList.remove('is-active');
      out.classList.add('was-active');
      clearTimeout(leaving);
      leaving = setTimeout(function () { out.classList.remove('was-active'); }, 1300);
      dots[cur].classList.remove('is-active');
      dots[cur].removeAttribute('aria-current');
      cur = i;
      slides[cur].classList.add('is-active');
      dots[cur].classList.add('is-active');
      dots[cur].setAttribute('aria-current', 'true');
      box.classList.toggle('on-light', slides[cur].classList.contains('slide-light'));
      left = dur;
      t0 = 0;
      sync();
      prepare(cur + 1);
    }
    // Fora da tela ou com a aba escondida, o tempo e a barrinha ficam parados e continuam de onde pararam
    function sync() {
      var off = away || document.hidden;
      box.classList.toggle('is-away', off);
      clearTimeout(timer);
      if (t0) left = Math.max(left - (performance.now() - t0), 0);
      t0 = 0;
      if (!off) {
        t0 = performance.now();
        timer = setTimeout(function () { go(cur + 1); }, left);
      }
    }
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { away = !en[0].isIntersecting; sync(); }).observe(box);
    }
    var startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
    sync();
    prepare(1);
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
    var map = null, pins = [], sel = -1, here = -1;
    rows.forEach(function (r, i) { if (r.dataset.here) here = i; });
    // A linha da cidade já nasce marcada: se esperasse o mapa carregar, a página pularia na frente de quem lê
    if (here > -1) rows[here].classList.add('is-sel');

    function select(i, stay) {
      if (sel > -1) { rows[sel].classList.remove('is-sel'); pins[sel].getElement().classList.remove('is-sel'); }
      sel = i;
      var d = rows[i].dataset;
      rows[i].classList.add('is-sel');
      pins[i].getElement().classList.add('is-sel');
      name.textContent = d.name;
      short.textContent = d.short;
      addr.textContent = d.addr;
      addr.hidden = !d.addr;
      // Na cidade da página, o botão leva ao Google Maps; nas outras, à página da cidade
      go.href = i === here ? d.maps : rows[i].href;
      if (i === here) { go.target = '_blank'; go.rel = 'noopener'; }
      else { go.removeAttribute('target'); go.removeAttribute('rel'); }
      go.querySelector('span').textContent = i === here ? 'Como chegar' : 'Abrir a página';
      wrap.classList.add('has-sel');
      if (stay) return; // a unidade da página aparece em destaque com o mapa inteiro
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
      map.fitBounds(L.latLngBounds(Array.prototype.map.call(rows, function (r) { return [+r.dataset.lat, +r.dataset.lng]; })), canvas.clientWidth < 600 ? { paddingTopLeft: [34, 70], paddingBottomRight: [34, 250] } : { padding: [70, 70] });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap', updateWhenZooming: false }).addTo(map);
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
          if (sel === i) location.href = row.href; // na cidade da página, leva ao endereço dela
          else select(i);
        });
        pins.push(pin);
      });
      if (here > -1) select(here, true);
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
      js.onload = function () { idle(draw); }; // monta o mapa numa folga, sem travar quem está rolando
      document.head.appendChild(js);
    }

    pauseAway(wrap);
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
    var speed = 28, x = 0, painted = -1, v = 0, nudge = 0, resume = 0, hover = false, drag = null, raf = 0, last = 0;
    var width = 0;
    addEventListener('resize', function () { width = 0; });
    box.classList.add('is-live');

    function tick(t) {
      raf = requestAnimationFrame(tick);
      var dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      if (!width) width = group.offsetWidth;
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
      if (x !== painted) {
        painted = x;
        track.style.transform = 'translate3d(' + -x + 'px,0,0)';
      }
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

  // Avaliações: desliza com o dedo, arrasta com o mouse, usa as setas e avança sozinho
  var rv = document.querySelector('[data-rv]');
  if (rv) reviewsCarousel(rv);

  function reviewsCarousel(box) {
    var track = box.querySelector('.rv-track');
    var items = track.children;
    var bar = box.querySelector('.rv-bar span');
    var count = box.querySelector('.rv-count');
    var total = items.length;
    var pauseUntil = 0, hover = false, inView = true, drag = null;
    var stepW = 1, vis = 1, shown = '';
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var cur = function () { return Math.round(track.scrollLeft / stepW); };
    var wait = function (ms) { pauseUntil = performance.now() + ms; };

    function go(i, behavior) {
      var last = total - vis;
      if (i < 0) i = last;
      if (i > last) i = 0;
      track.scrollTo({ left: i * stepW, behavior: behavior || 'smooth' });
    }
    // As medidas só mudam com a janela; durante o deslize o contador só é escrito quando troca
    function measure() {
      stepW = total > 1 ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth;
      vis = Math.max(1, Math.round((track.clientWidth + stepW - items[0].offsetWidth) / stepW));
      shown = '';
      paint();
    }
    function paint() {
      var i = cur(), label = pad(Math.min(total, i + vis)) + ' / ' + pad(total);
      if (label === shown) return;
      shown = label;
      bar.style.transform = 'scaleX(' + Math.min(1, (i + vis) / total) + ')';
      count.textContent = label;
    }
    track.addEventListener('scroll', function () { requestAnimationFrame(paint); }, { passive: true });
    addEventListener('resize', measure);
    requestAnimationFrame(measure);

    box.querySelector('.rv-prev').addEventListener('click', function () { wait(9000); go(cur() - 1); });
    box.querySelector('.rv-next').addEventListener('click', function () { wait(9000); go(cur() + 1); });
    box.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    box.addEventListener('pointerleave', function () { hover = false; });
    track.addEventListener('touchstart', function () { wait(9000); }, { passive: true });
    box.querySelectorAll('.rv-photo').forEach(function (img) {
      img.addEventListener('error', function () {
        var s = document.createElement('span');
        s.className = 'rv-photo rv-ini';
        s.textContent = img.dataset.ini;
        img.replaceWith(s);
      });
    });

    // Arrastar com o mouse (no toque, a própria rolagem do aparelho já desliza)
    if (fine) {
      track.classList.add('is-mouse');
      track.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button) return;
        drag = { x: e.clientX, left: track.scrollLeft, start: e.clientX };
        track.setPointerCapture(e.pointerId);
        track.classList.add('is-drag');
        wait(9000);
      });
      track.addEventListener('pointermove', function (e) {
        if (drag) track.scrollLeft = drag.left - (e.clientX - drag.x);
      });
      var endDrag = function (e) {
        if (!drag) return;
        var moved = drag.start - e.clientX, i = cur();
        // Um arraste curto já conta como trocar de avaliação
        if (Math.abs(moved) > 40 && Math.round(drag.left / stepW) === i) i += moved > 0 ? 1 : -1;
        drag = null;
        i = Math.max(0, Math.min(total - vis, i));
        track.scrollTo({ left: i * stepW, behavior: 'smooth' });
        setTimeout(function () { track.classList.remove('is-drag'); }, 450);
        wait(9000);
      };
      track.addEventListener('pointerup', endDrag);
      track.addEventListener('pointercancel', endDrag);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.3 }).observe(box);
    }
    setInterval(function () {
      if (hover || drag || !inView || document.hidden || performance.now() < pauseUntil) return;
      go(cur() + 1);
    }, 5500);
  }

  // Bairros: o nome em destaque troca sozinho. Só quem escolhe um bairro muda o botão do WhatsApp,
  // para o botão não pular a cada troca nem mandar um bairro que a pessoa não escolheu.
  var bb = document.querySelector('[data-bairros]');
  if (bb && anim) bairros(bb);

  function bairros(box) {
    var chips = box.querySelectorAll('.bairros button');
    var names = box.querySelectorAll('.bairro-now span');
    var cta = box.querySelector('.bairro-cta');
    var label = cta.querySelector('span');
    var plain = { text: label.textContent, href: cta.href };
    var base = cta.href.split('?')[0];
    var msg = decodeURIComponent(cta.href.split('text=')[1] || '');
    var cur = 0, picked = false, hover = false, until = 0, inView = !('IntersectionObserver' in window);

    function point(i) {
      show(i);
      var n = chips[i].textContent;
      label.textContent = 'Orçamento: ' + n;
      cta.href = base + '?text=' + encodeURIComponent(msg + ' Local: ' + n + '.');
    }
    function show(i) {
      if (i === cur) return;
      var out = names[cur];
      out.classList.remove('on');
      out.classList.add('was');
      setTimeout(function () { out.classList.remove('was'); }, 650);
      chips[cur].classList.remove('on');
      cur = i;
      names[cur].classList.remove('was');
      names[cur].classList.add('on');
      chips[cur].classList.add('on');
    }
    chips.forEach(function (chip, i) {
      chip.addEventListener('click', function () { picked = true; point(i); });
      chip.addEventListener('focus', function () { picked = true; point(i); });
      chip.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') point(i); });
    });
    box.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    box.addEventListener('pointerleave', function () {
      hover = false;
      until = performance.now() + 1500;
      if (!picked) { label.textContent = plain.text; cta.href = plain.href; } // só passou o mouse: o botão volta ao normal
    });
    if (!inView) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.3 }).observe(box);
    }
    setInterval(function () {
      if (picked || hover || !inView || document.hidden || performance.now() < until) return;
      show((cur + 1) % chips.length);
    }, 2400);
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
    '': '.clients-head,.marquee,.mq-btn,.kicker,.lead,.stats>li,.text>p,.sub,.checks>li,.how-side>*,.how-steps>li,.svc-inc h3,.svc-inc li,.units-list>li,.also,.cta-band p,.cta-band .btn,.rv,.faq-head .btn,.faq-item,.field,.form-submit,.form-hint,.info-card h3,.info-list>li,.bairros>li,.bairros-box>h3,.bairro-now,.bairro-cta,.local-note,.local-addr,.prose>*,.post-cta>*,.ftr-grid>div,.ftr-legal,.how .kicker,.how h2',
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
  // Primeiro mede tudo, depois escreve: alternar os dois faria o navegador recalcular a página a cada item
  Array.prototype.filter.call(document.querySelectorAll('.reveal'), function (el) {
    return el.getBoundingClientRect().bottom > 0;
  }).forEach(function (el) {
    el.classList.add('pre');
    (el.closest('.ftr') ? ioEnd : io).observe(el);
  });

  // Números que contam ao aparecer
  var stats = document.querySelector('.stats');
  if (stats) {
    var nums = stats.querySelectorAll('[data-n]');
    nums.forEach(function (el) { el.textContent = '0'; });
    var so = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      so.disconnect();
      // toLocaleString trava o primeiro quadro em aparelhos lentos; o ponto de milhar é simples de colocar
      var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+$)/g, '.'); };
      nums.forEach(function (el) {
        var end = +el.dataset.n, t0 = performance.now(), prev = 0;
        requestAnimationFrame(function tick(t) {
          var p = Math.min(Math.max(t - t0, 0) / 1800, 1);
          var n = Math.round(end * (1 - Math.pow(1 - p, 4)));
          if (n !== prev) { prev = n; el.textContent = fmt(n); }
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
