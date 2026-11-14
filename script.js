// The Nursery Garden — Lenis smooth scroll + GSAP ScrollTrigger motion
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reservation builder: menu + guests -> total + prefilled email
  var form = document.getElementById('reserveForm');
  var totalEl = document.getElementById('reserveTotal');
  var mailEl = document.getElementById('reserveMail');
  var guestsEl = document.getElementById('guestCount');
  var PRICE = 95;
  function updateReserve() {
    var guests = parseInt(guestsEl.value, 10) || 1;
    var menu = form.querySelector('input[name="menu"]:checked').value;
    totalEl.textContent = '$' + (guests * PRICE).toLocaleString('en-US');
    var subject = 'Garden Table Reservation — Sunday, November 22';
    var body = 'Hello The Nursery Garden,\n\nI would like to reserve The Garden Table on Sunday, November 22 at 4 PM.\n\nMenu: ' + menu + '\nGuests: ' + guests + '\nTotal: $' + (guests * PRICE) + '\n\nName:\nPhone:\n\nThank you!';
    mailEl.href = 'mailto:contact@OnPointttt.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  if (form) {
    form.addEventListener('change', updateReserve);
    updateReserve();
  }

  // Mobile menu
  var menuBtn = document.getElementById('menuBtn');
  var overlay = document.getElementById('menuOverlay');
  function closeMenu() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menu';
    document.body.style.overflow = '';
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = overlay.classList.toggle('open');
      overlay.setAttribute('aria-hidden', String(!open));
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Close' : 'Menu';
      document.body.style.overflow = open ? 'hidden' : '';
    });
    overlay.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  // ---- 3D coverflow carousel (21st.dev coverflow effect, own code) ----
  var stage = document.getElementById('flowStage');
  if (stage) {
    var cards = Array.prototype.slice.call(stage.querySelectorAll('.flow-card'));
    var dotsWrap = document.getElementById('flowDots');
    var active = 0, timer = null, idleTimer = null;
    cards.forEach(function (_, i) {
      var d = document.createElement('button');
      d.className = 'flow-dot';
      d.setAttribute('aria-label', 'Photo ' + (i + 1));
      d.addEventListener('click', function () { go(i); restartIdle(); });
      dotsWrap.appendChild(d);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);
    function render() {
      var n = cards.length;
      cards.forEach(function (card, i) {
        var off = i - active;
        if (off > n / 2) off -= n;
        if (off < -n / 2) off += n;
        var abs = Math.abs(off);
        var x = off * 58;               // % of card width per step
        var rot = off === 0 ? 0 : (off > 0 ? -42 : 42);
        var scale = Math.max(0.62, 1 - abs * 0.16);
        var z = -abs * 190;
        card.style.transform = 'translateX(calc(-50% + ' + x + '%)) translateZ(' + z + 'px) rotateY(' + rot + 'deg) scale(' + scale + ')';
        card.style.zIndex = String(20 - abs);
        card.style.opacity = abs > 3 ? '0' : String(1 - abs * 0.18);
        card.style.filter = 'brightness(' + (1 - abs * 0.22) + ')';
        card.style.pointerEvents = abs > 3 ? 'none' : 'auto';
        card.classList.toggle('is-active', off === 0);
      });
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i === active); });
    }
    function go(i) { active = (i + cards.length) % cards.length; render(); }
    function next() { go(active + 1); }
    function prev() { go(active - 1); }
    document.getElementById('flowNext').addEventListener('click', function () { next(); restartIdle(); });
    document.getElementById('flowPrev').addEventListener('click', function () { prev(); restartIdle(); });
    // drag / swipe
    var dragX = null, dragMoved = false;
    stage.addEventListener('pointerdown', function (e) { dragX = e.clientX; dragMoved = false; stopAuto(); });
    stage.addEventListener('pointermove', function (e) {
      if (dragX === null) return;
      var dx = e.clientX - dragX;
      if (Math.abs(dx) > 46 && !dragMoved) { dragMoved = true; if (dx < 0) next(); else prev(); dragX = e.clientX; }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      stage.addEventListener(ev, function () { dragX = null; restartIdle(); });
    });
    cards.forEach(function (card, i) { card.addEventListener('click', function () { if (i !== active) { go(i); restartIdle(); } }); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { next(); restartIdle(); }
      if (e.key === 'ArrowLeft') { prev(); restartIdle(); }
    });
    stage.setAttribute('tabindex', '0');
    function startAuto() { if (reduceMotion || timer) return; timer = setInterval(next, 4200); }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    function restartIdle() { stopAuto(); clearTimeout(idleTimer); idleTimer = setTimeout(startAuto, 6000); }
    stage.addEventListener('mouseenter', stopAuto);
    stage.addEventListener('mouseleave', restartIdle);
    render(); startAuto();
  }

  // Back to top
  var toTop = document.getElementById('toTop');
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  if (reduceMotion || !window.gsap) return;

  gsap.registerPlugin(ScrollTrigger);

  // Lenis + ScrollTrigger sync
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  // Anchor links through Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        if (lenis) lenis.scrollTo(id, { offset: -70 });
        else document.querySelector(id).scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Hero entrance: headline lines rise, arch photo scales in
  var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl.from('.hero-copy h1', { y: 70, opacity: 0, duration: 1.05 })
    .from('.hero-sub', { y: 34, opacity: 0, duration: .8 }, '-=.6')
    .from('.hero-actions', { y: 26, opacity: 0, duration: .7 }, '-=.55')
    .from('.hero-facts', { opacity: 0, duration: .7 }, '-=.4')
    .from('.hero-leaf', { y: 90, opacity: 0, duration: 1.1 }, .15)
    .from('.hero-leaf img', { scale: 1.18, duration: 1.4, ease: 'power2.out' }, .15)

  // Slow drift on the hero photo while scrolling away
  gsap.to('.hero-leaf img', {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // Statement: thumbnails pop as the sentence arrives
  gsap.from('.statement', {
    y: 50, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.intro', start: 'top 72%' }
  });
  gsap.from('.statement .thumb', {
    scaleX: 0, opacity: 0, duration: .7, stagger: .18, ease: 'back.out(2)', delay: .25,
    scrollTrigger: { trigger: '.intro', start: 'top 72%' }
  });

  // Section headings: rise + fade, staggered parts
  document.querySelectorAll('.sec-head, .table-copy h2').forEach(function (head) {
    gsap.from(head, {
      y: 44, opacity: 0, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: head, start: 'top 82%' }
    });
  });

  // Walk photos: rise in with a gentle parallax on the image inside
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    gsap.from(el, {
      y: 64, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
    var img = el.querySelector('img');
    if (img) {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  });

  // Menu dishes stagger in
  gsap.from('.dish-list li', {
    x: -34, opacity: 0, duration: .6, stagger: .06, ease: 'power2.out',
    scrollTrigger: { trigger: '.dish-list', start: 'top 80%' }
  });
  gsap.from('.courses li', {
    x: 34, opacity: 0, duration: .6, stagger: .1, ease: 'power2.out',
    scrollTrigger: { trigger: '.courses', start: 'top 82%' }
  });

  // FAQ tiles
  gsap.from('.faq-item', {
    y: 36, opacity: 0, duration: .7, stagger: .09, ease: 'power3.out',
    scrollTrigger: { trigger: '.faq-list', start: 'top 84%' }
  });

  // Footer columns rise as the page closes
  gsap.from('.footer-cols > *', {
    y: 40, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out',
    scrollTrigger: { trigger: '.footer', start: 'top 85%' }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
