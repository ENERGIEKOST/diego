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
  /* на десктопе бургер-меню скрыто — закрываем открытый drawer */
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024 && drawer && drawer.classList.contains('show')) closeMenu();
  });

  /* ---------- ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ ПРИ СКРОЛЛЕ ---------- */
  var navLinks = document.querySelectorAll('.top-nav a');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var spyCurrent = '';
    var spy = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        if (entries[e].isIntersecting) spyCurrent = '#' + entries[e].target.id;
      }
      if (window.scrollY < 250) spyCurrent = ''; /* на первом экране подсветки нет */
      for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].classList.toggle('active', navLinks[i].getAttribute('href') === spyCurrent);
      }
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    for (var s = 0; s < navLinks.length; s++) {
      var sec = document.querySelector(navLinks[s].getAttribute('href'));
      if (sec) spy.observe(sec);
    }
  }

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

  /* ---------- ПЛАВНЫЕ ЯКОРЯ (только по клику, без дёргания при загрузке) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.length < 2) return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    if (history.replaceState) history.replaceState(null, '', href);
  });

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

  /* ---------- FAQ: плавный аккордеон (анимация высоты в обе стороны) ---------- */
  var faqItems = document.querySelectorAll('.faq details');
  for (var f = 0; f < faqItems.length; f++) {
    (function (d) {
      var body = d.querySelector('.faq-body');
      var sum = d.querySelector('summary');
      if (!body || !sum) return;
      sum.addEventListener('click', function (e) {
        e.preventDefault(); /* убираем мгновенное раскрытие details */
        var opening = !d.open;
        /* открытый вопрос закрывает остальные */
        for (var n = 0; n < faqItems.length; n++) {
          if (faqItems[n] !== d && faqItems[n].open) faqItems[n].open = false;
        }
        if (opening) {
          d.open = true;
          body.style.height = '0px';
          window.requestAnimationFrame(function () {
            body.style.height = body.scrollHeight + 'px';
          });
          window.setTimeout(function () {
            if (d.open) body.style.height = 'auto'; /* корректный resize окна */
          }, 380);
        } else {
          body.style.height = body.scrollHeight + 'px';
          window.requestAnimationFrame(function () {
            body.style.height = '0px';
          });
          window.setTimeout(function () { d.open = false; }, 370);
        }
      });
    })(faqItems[f]);
  }

  /* ---------- ЛЕНИВАЯ КАРТА ЯНДЕКС (PageSpeed) ---------- */
  var mapFacade = document.getElementById('mapFacade');
  if (mapFacade) {
    var loadMap = function () {
      var f = document.createElement('iframe');
      f.src = 'https://yandex.ru/map-widget/v1/?ll=39.759887%2C47.152253&z=16&pt=39.759887,47.152253,pm2rdm';
      f.title = 'Шиномонтаж у Диего на карте';
      f.loading = 'lazy';
      f.allowFullscreen = true;
      mapFacade.parentNode.replaceChild(f, mapFacade);
    };
    mapFacade.addEventListener('click', loadMap);
    mapFacade.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadMap(); }
    });
  }
})();