(function () {
  'use strict';

  /* ---------- БУРГЕР / DRAWER ---------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var overlay = document.getElementById('overlay');
  var closeBtn = document.getElementById('closeBtn');

  function openMenu() {
    if (!burger || !drawer || !overlay) return;
    burger.classList.add('open');
    drawer.classList.add('show');
    overlay.classList.add('show');
    drawer.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('locked');
  }
  function closeMenu() {
    if (!burger || !drawer || !overlay) return;
    burger.classList.remove('open');
    drawer.classList.remove('show');
    overlay.classList.remove('show');
    drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    if (!anyModalOpen() && !cookieVisible()) document.body.classList.remove('locked');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      drawer.classList.contains('show') ? closeMenu() : openMenu();
    });
  }
  if (overlay) overlay.addEventListener('click', closeMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (drawer) {
    drawer.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== drawer) {
        if (t.tagName === 'A') { closeMenu(); return; }
        t = t.parentNode;
      }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(); closeModals(); }
  });

  /* ---------- ПРОГРЕСС СКРОЛЛА ---------- */
  var progress = document.getElementById('progress');
  var ticking = false;
  if (progress) {
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- REVEAL ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('active'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    for (var i = 0; i < reveals.length; i++) io.observe(reveals[i]);
  } else {
    for (var j = 0; j < reveals.length; j++) reveals[j].classList.add('active');
  }
  document.documentElement.classList.add('js');

  /* ---------- МОДАЛКИ (политика / cookie / оферта) ---------- */
  function anyModalOpen() {
    var list = document.querySelectorAll('.modal:not([hidden])');
    return list.length > 0;
  }
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    document.body.classList.add('locked');
    var btn = m.querySelector('.modal-close');
    if (btn) btn.focus();
  }
  function closeModal(m) {
    m.hidden = true;
    if (!anyModalOpen() && !drawerVisible()) document.body.classList.remove('locked');
  }
  function closeModals() {
    var list = document.querySelectorAll('.modal:not([hidden])');
    for (var i = 0; i < list.length; i++) closeModal(list[i]);
  }
  function drawerVisible() { return drawer && drawer.classList.contains('show'); }
  function cookieVisible() { return banner && !banner.hidden; }

  var triggers = document.querySelectorAll('[data-modal]');
  for (var k = 0; k < triggers.length; k++) {
    (function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openModal(el.getAttribute('data-modal'));
      });
    })(triggers[k]);
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains('modal-close')) {
      var box = t.closest ? t.closest('.modal') : null;
      if (box) closeModal(box);
      return;
    }
    if (t.classList && t.classList.contains('modal')) closeModal(t);
  });

  /* ---------- COOKIE БАННЕР ---------- */
  var KEY = 'cookieChoice';
  var banner = document.getElementById('cookieBanner');
  var acceptBtn = document.getElementById('cookieAccept');

  function storeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* noop */ } }

  if (banner) {
    if (storeGet(KEY) === 'accepted') {
      banner.hidden = true;
    } else {
      banner.hidden = false;
      if (acceptBtn) {
        acceptBtn.addEventListener('click', function () {
          storeSet(KEY, 'accepted');
          banner.hidden = true;
          document.body.classList.remove('locked');
        });
      }
    }
  }

  /* ---------- ГОД В ПОДВАЛЕ ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
