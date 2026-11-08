(function () {
  'use strict';

/* ---------- ОТЗЫВЫ: карусель ---------- */
  var track = document.getElementById('revTrack');
  if (track) {
    var prevBtn = document.getElementById('revPrev');
    var nextBtn = document.getElementById('revNext');
    var dotsBox = document.getElementById('revDots');
    var cards = track.children;
    var dots = [];

    function revStep() {
      return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    }
    function revMax() { return track.scrollWidth - track.clientWidth; }
    function revIndex() { return Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / revStep()))); }

    function buildDots() {
      if (!dotsBox) return;
      dotsBox.innerHTML = '';
      dots = [];
      for (var d = 0; d < cards.length; d++) {
        (function (i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Отзыв ' + (i + 1));
          b.addEventListener('click', function () {
            revGoTo(i);
          });
          dotsBox.appendChild(b);
          dots.push(b);
        })(d);
      }
    }

    function revUpdate() {
      var idx = revIndex();
      for (var d = 0; d < dots.length; d++) dots[d].classList.toggle('on', d === idx);
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
      if (nextBtn) nextBtn.disabled = track.scrollLeft >= revMax() - 2;
    }

    function revGoTo(i) {
      var left = Math.max(0, Math.min(revMax(), i * revStep()));
      try {
        track.scrollTo({ left: left, behavior: 'smooth' });
      } catch (e) {
        track.scrollLeft = left;
      }
    }

    buildDots();
    if (prevBtn) prevBtn.addEventListener('click', function () { revGoTo(revIndex() - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { revGoTo(revIndex() + 1); });
    track.addEventListener('scroll', function () {
      if (!track._ticking) {
        track._ticking = true;
        window.requestAnimationFrame(function () { revUpdate(); track._ticking = false; });
      }
    }, { passive: true });
    window.addEventListener('resize', revUpdate);
    window.addEventListener('load', revUpdate); /* пересчёт после загрузки шрифтов/контента */
    revUpdate();
  }

  /* ---------- ГОД В ПОДВАЛЕ ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();