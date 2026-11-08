(function () {
  'use strict';

/* ---------- ЗАПИСЬ: квиз → WhatsApp ---------- */
  var quiz = document.getElementById('quiz');
  if (quiz) {
    var qzSteps = quiz.querySelectorAll('.quiz-step');
    var qzTotal = qzSteps.length;
    var qzBar = document.getElementById('quizBar');
    var qzStepNum = document.getElementById('quizStepNum');
    var qzNext = document.getElementById('quizNext');
    var qzBack = document.getElementById('quizBack');
    var qzDate = document.getElementById('qzDate');
    var qzCur = 1;
    var qzAnswers = { service: [], size: '', contact: '' };
    var qzDraftKey = 'quizDraft';

    /* --- черновик квиза: сохранение и восстановление после перезагрузки --- */
    function qzFieldVal(id) {
      var el = document.getElementById(id);
      return el ? el.value : '';
    }
    function qzSaveDraft() {
      try {
        window.sessionStorage.setItem(qzDraftKey, JSON.stringify({
          step: qzCur,
          service: qzAnswers.service,
          size: qzAnswers.size,
          contact: qzAnswers.contact,
          date: qzDate ? qzDate.value : '',
          time: qzFieldVal('qzTime'),
          phone: qzFieldVal('qzPhone'),
          name: qzFieldVal('qzName'),
          comment: qzFieldVal('qzComment'),
          other: qzFieldVal('qzOther'),
          consent: !!(document.getElementById('qzConsent') && document.getElementById('qzConsent').checked)
        }));
      } catch (e) { /* noop */ }
    }
    function qzClearDraft() {
      try { window.sessionStorage.removeItem(qzDraftKey); } catch (e) { /* noop */ }
    }
    function qzLoadDraft() {
      try {
        var raw = window.sessionStorage.getItem(qzDraftKey);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }

    if (qzDate) {
      var qzToday = new Date();
      qzDate.min = qzToday.getFullYear() + '-' +
        ('0' + (qzToday.getMonth() + 1)).slice(-2) + '-' +
        ('0' + qzToday.getDate()).slice(-2);
    }

    function qzAnswered(n) {
      if (n === 1) return qzAnswers.service.length > 0;
      if (n === 2) return !!qzAnswers.size;
      if (n === 3) return !!qzAnswers.contact;
      return true;
    }

    function qzSyncNav() {
      if (qzNext && qzCur < qzTotal) qzNext.disabled = !qzAnswered(qzCur);
    }

    function qzPhoneDigits() {
      var p = document.getElementById('qzPhone');
      if (!p) return '';
      var d = p.value.replace(/\D/g, '');
      if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1); /* 8… → 7… */
      if (d.length === 10) d = '7' + d; /* без кода страны → +7 */
      if (d.length > 11) d = d.slice(0, 11);
      return d;
    }

    function qzPhoneOk() {
      var d = qzPhoneDigits();
      return d.length === 11 && d[0] === '7';
    }

    function qzLastFilled() {
      var qzTime = document.getElementById('qzTime');
      var qzConsent = document.getElementById('qzConsent');
      var qzOther = document.getElementById('qzOther');
      /* быстрый звонок: дата и время не обязательны — клиент оставляет телефон,
         мы перезваниваем и согласуем удобное время голосом */
      var callMode = (qzAnswers.contact === 'Позвоните мне');
      var okD = callMode || !!(qzDate && qzDate.value);
      var okT = callMode || !!(qzTime && qzTime.value);
      var okP = qzPhoneOk();
      var qzNameEl = document.getElementById('qzName');
      var okN = !!(qzNameEl && qzNameEl.value.trim());
      var needOther = qzAnswers.service.indexOf('Другое') !== -1;
      var okO = !needOther || !!(qzOther && qzOther.value.trim());
      var okC = !!(qzConsent && qzConsent.checked);
      return okD && okT && okP && okN && okO && okC;
    }

    function qzText() {
      var qzTime = document.getElementById('qzTime');
      var qzName = document.getElementById('qzName');
      var qzComment = document.getElementById('qzComment');
      var qzPhoneEl = document.getElementById('qzPhone');
      var otherInput = document.getElementById('qzOther');
      return '🔧 Заявка с сайта «Шиномонтаж у Диего»\n\n' +
        '🛞 Услуга: ' + (qzAnswers.service.length ? qzAnswers.service.join(', ') : '—') + '\n' +
        (otherInput && otherInput.value.trim() ? '📝 Описание: ' + otherInput.value.trim() + '\n' : '') +
        '⚙️ Диаметр колёс: ' + (qzAnswers.size || '—') + '\n' +
        '💬 Связь: ' + (qzAnswers.contact || '—') + '\n' +
        '📅 Дата: ' + (qzDate.value ? qzDate.value.split('-').reverse().join('.') : '—') + '\n' +
        '⏰ Время: ' + (qzTime && qzTime.value ? qzTime.value : '—') + '\n' +
        '📱 Телефон: ' + (qzPhoneEl && qzPhoneEl.value.trim() ? qzPhoneEl.value.trim() : '—') + '\n' +
        '👤 Имя: ' + (qzName && qzName.value.trim() ? qzName.value.trim() : '—') + '\n' +
        '🚗 Авто/комментарий: ' + (qzComment && qzComment.value.trim() ? qzComment.value.trim() : '—');
    }

    function qzSetDis(el, dis) {
      if (!el) return;
      if (dis) { el.setAttribute('aria-disabled', 'true'); el.classList.add('btn-dis'); }
      else { el.removeAttribute('aria-disabled'); el.classList.remove('btn-dis'); }
    }

    function qzSyncSend() {
      var wa = document.getElementById('quizSend');
      var tg = document.getElementById('quizSendTg');
      var copy = document.getElementById('quizCopy');
      if (!wa || !tg || !copy) return;
      /* на последнем шаге кнопки отправки всегда видны, но неактивны,
         пока не заполнены все обязательные поля */
      var last = (qzCur === qzTotal);
      var ready = (last && qzLastFilled());
      var callMode = (qzAnswers.contact === 'Позвоните мне');
      /* показываем только канал, который выбрал клиент:
         WhatsApp → «В WhatsApp», Telegram → «В Telegram»,
         «Позвоните мне» → кнопка «Заказать звонок» (заявка уходит в WhatsApp магазина) */
      var wantWa = (qzAnswers.contact === 'WhatsApp') || callMode;
      var wantTg = (qzAnswers.contact === 'Telegram');
      wa.hidden = !last || !wantWa;
      tg.hidden = !last || !wantTg;
      copy.hidden = !last;
      if (last) wa.textContent = callMode ? 'Заказать звонок' : 'В WhatsApp';
      /* в режиме звонка форма короче: дату, время и комментарий прячем */
      var callHide = [qzDate, document.getElementById('qzTime'), document.getElementById('qzComment')];
      for (var chI = 0; chI < callHide.length; chI++) {
        if (callHide[chI]) callHide[chI].parentNode.hidden = !!(last && callMode);
      }
      var lastTitle = quiz.querySelector('.quiz-step[data-step="4"] h3');
      if (lastTitle) lastTitle.textContent = callMode ? 'Куда перезвонить?' : 'Когда вам удобно?';
      qzSetDis(wa, !ready);
      qzSetDis(tg, !ready);
      qzSetDis(copy, !ready);
      if (ready) {
        var text = qzText();
        if (wantWa) wa.href = 'https://wa.me/79888992235?text=' + encodeURIComponent(text);
        if (wantTg) tg.href = 'https://t.me/share/url?url=%20&text=' + encodeURIComponent(text);
      }
      /* динамическая подсказка: перечисляем, чего именно не хватает */
      var hintEl = document.getElementById('qzHintLast');
      if (hintEl) {
        if (!last || ready) {
          hintEl.hidden = true;
        } else {
          var callMode2 = (qzAnswers.contact === 'Позвоните мне');
          var miss = [];
          if (!callMode2 && !(qzDate && qzDate.value)) miss.push('дату');
          var tEl = document.getElementById('qzTime');
          if (!callMode2 && !(tEl && tEl.value)) miss.push('время');
          if (!qzPhoneOk()) miss.push('телефон');
          var nEl = document.getElementById('qzName');
          if (!(nEl && nEl.value.trim())) miss.push('имя');
          if (qzAnswers.service.indexOf('Другое') !== -1) {
            var oEl = document.getElementById('qzOther');
            if (!(oEl && oEl.value.trim())) miss.push('описание услуги');
          }
          var cEl = document.getElementById('qzConsent');
          if (!(cEl && cEl.checked)) miss.push('галочку согласия');
          var actionName = (qzAnswers.contact === 'Позвоните мне') ? 'кнопка «Заказать звонок» станет активной' : 'кнопка отправки станет активной';
          hintEl.textContent = 'Осталось указать: ' + miss.join(', ') + ' — после этого ' + actionName;
          hintEl.hidden = false;
        }
      }
    }

    function qzShow(n) {
      qzCur = n;
      for (var i = 0; i < qzSteps.length; i++) {
        qzSteps[i].hidden = (Number(qzSteps[i].getAttribute('data-step')) !== n);
      }
      if (qzBar) qzBar.style.width = (n / qzTotal * 100) + '%';
      if (qzStepNum) qzStepNum.textContent = 'Шаг ' + n + ' из ' + qzTotal;
      if (qzBack) qzBack.hidden = (n === 1);
      var isLast = (n === qzTotal);
      if (qzNext) qzNext.hidden = isLast;
      qzSyncNav();
      qzSyncSend();
      var stepEl = quiz.querySelector('.quiz-step[data-step="' + n + '"]');
      if (stepEl) {
        stepEl.classList.remove('qz-in');
        void stepEl.offsetWidth; /* перезапуск CSS-анимации */
        stepEl.classList.add('qz-in');
      }
      qzSaveDraft();
    }

    var qzOpts = quiz.querySelectorAll('.quiz-opt');
    for (var q = 0; q < qzOpts.length; q++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var box = btn.parentNode;
          var key = box.getAttribute('data-quiz');
          var sp = btn.querySelector('span');
          var label = (sp ? sp.textContent : btn.textContent).trim();
          if (key === 'service') {
            /* мультивыбор: клик переключает вариант */
            var wasSel = btn.classList.contains('sel');
            var otherBox = document.getElementById('qzOtherBox');
            if (label === 'Другое') {
              /* «Другое» — эксклюзивный вариант: снимает все остальные услуги */
              var allBtns = box.querySelectorAll('.quiz-opt');
              for (var b = 0; b < allBtns.length; b++) allBtns[b].classList.remove('sel');
              if (!wasSel) {
                btn.classList.add('sel');
                if (otherBox) {
                  otherBox.hidden = false;
                  var oi = document.getElementById('qzOther');
                  if (oi) { oi.classList.remove('err'); oi.focus(); }
                }
              } else {
                if (otherBox) otherBox.hidden = true;
                var oc = document.getElementById('qzOther');
                if (oc) oc.value = ''; /* сбрасываем описание, чтобы оно не попало в заявку */
              }
            } else {
              btn.classList.toggle('sel');
              /* «4 колёса» и «1 колесо» взаимоисключающие */
              if (!wasSel && (label === 'Комплексная замена 4 колёс' || label === 'Замена 1 колеса')) {
                var pair = label === 'Комплексная замена 4 колёс' ? 'Замена 1 колеса' : 'Комплексная замена 4 колёс';
                var pairBtns = box.querySelectorAll('.quiz-opt');
                for (var p = 0; p < pairBtns.length; p++) {
                  var psp = pairBtns[p].querySelector('span');
                  if (psp && psp.textContent.trim() === pair) pairBtns[p].classList.remove('sel');
                }
              }
              /* любая услуга снимает «Другое» */
              var ob = box.querySelectorAll('.quiz-opt');
              for (var d = 0; d < ob.length; d++) {
                var dsp = ob[d].querySelector('span');
                if (dsp && dsp.textContent.trim() === 'Другое' && ob[d].classList.contains('sel')) {
                  ob[d].classList.remove('sel');
                  if (otherBox) otherBox.hidden = true;
                  var oc2 = document.getElementById('qzOther');
                  if (oc2) oc2.value = '';
                }
              }
            }
            var chosen = [];
            var sel = box.querySelectorAll('.quiz-opt.sel');
            for (var s = 0; s < sel.length; s++) {
              var tsp = sel[s].querySelector('span');
              chosen.push((tsp ? tsp.textContent : sel[s].textContent).trim());
            }
            qzAnswers.service = chosen;
          } else {
            /* одиночный выбор */
            var sibs = box.querySelectorAll('.quiz-opt');
            for (var s2 = 0; s2 < sibs.length; s2++) sibs[s2].classList.remove('sel');
            btn.classList.add('sel');
            qzAnswers[key] = label;
          }
          qzSyncNav();
          qzSaveDraft();
        });
      })(qzOpts[q]);
    }

    if (qzNext) qzNext.addEventListener('click', function () {
      if (qzCur < qzTotal) qzShow(qzCur + 1);
    });

    /* живая проверка последнего шага: кнопки активны, когда всё заполнено */
    var qzLive = [document.getElementById('qzTime'), document.getElementById('qzConsent'), document.getElementById('qzOther'), document.getElementById('qzPhone'), document.getElementById('qzName')];
    for (var lv = 0; lv < qzLive.length; lv++) {
      if (qzLive[lv]) {
        qzLive[lv].addEventListener('input', qzSyncSend);
        qzLive[lv].addEventListener('change', qzSyncSend);
        qzLive[lv].addEventListener('input', qzSaveDraft);
        qzLive[lv].addEventListener('change', qzSaveDraft);
      }
    }
    if (qzDate) {
      qzDate.addEventListener('input', qzSyncSend);
      qzDate.addEventListener('change', qzSyncSend);
      qzDate.addEventListener('input', qzSaveDraft);
      qzDate.addEventListener('change', qzSaveDraft);
    }

    /* надёжное переключение согласия тапом в любом месте подписи:
       на iOS/Android клик по label с чекбоксом срабатывает нестабильно */
    var qzConsentLabel = quiz.querySelector('.quiz-consent');
    var qzConsentBox = document.getElementById('qzConsent');
    if (qzConsentLabel && qzConsentBox) {
      qzConsentLabel.addEventListener('click', function (e) {
        /* клик по самому чекбоксу или кнопке «политика» — стандартное поведение */
        if (e.target === qzConsentBox || (e.target.closest && e.target.closest('button, a, input'))) return;
        e.preventDefault(); /* гасим стандартную активацию label, чтобы не было двойного переключения */
        qzConsentBox.checked = !qzConsentBox.checked;
        qzSyncSend();
        qzSaveDraft();
      });
    }

    /* автоформат телефона: +7 900 123-45-67 (без скобок). Пользователь вводит
       только 10 цифр, «7»/«8» в начале игнорируются. Курсор сохраняется. */
    var qzPhoneEl = document.getElementById('qzPhone');
    if (qzPhoneEl) {
      var qzFormatPhone = function (value, digitsBefore) {
        var raw = value.replace(/\D/g, '');
        var d = '';
        if (raw.length === 1 && (raw.charAt(0) === '7' || raw.charAt(0) === '8')) {
          d = '7'; /* одна 7/8 — это код страны: поле не очищается, остаётся «+7» */
        } else if (raw.length > 1 && (raw.charAt(0) === '7' || raw.charAt(0) === '8')) {
          raw = raw.slice(1);
          if (raw.length > 10) raw = raw.slice(0, 10);
          d = raw.length ? '7' + raw : '7';
        } else if (raw.length) {
          if (raw.length > 10) raw = raw.slice(0, 10);
          d = '7' + raw;
        }
        var out = '';
        if (d.length) {
          out = '+7';
          if (d.length > 1) out += ' ' + d.slice(1, 4);
          if (d.length > 4) out += ' ' + d.slice(4, 7);
          if (d.length > 7) out += '-' + d.slice(7, 9);
          if (d.length > 9) out += '-' + d.slice(9, 11);
        }
        var pos = 0, seen = 0;
        while (pos < out.length && seen < digitsBefore) {
          var ch = out.charAt(pos);
          if (ch >= '0' && ch <= '9') seen++;
          pos++;
        }
        return { out: out, pos: pos };
      };
      var qzPhoneClear = document.getElementById('qzPhoneClear');
      var qzApplyPhone = function (value, digitsBefore) {
        /* «+7» — автопрефикс: если пользователь его не вводил сам
           (значение не начинается с 7/8), сдвигаем курсор на одну цифру
           вправо, иначе новые цифры вставляются ПЕРЕД уже набранными
           и последовательность номера портится (900 → 090) */
        var rawFull = value.replace(/\D/g, '');
        if (rawFull.length && !(rawFull.charAt(0) === '7' || rawFull.charAt(0) === '8')) digitsBefore += 1;
        var r = qzFormatPhone(value, digitsBefore);
        qzPhoneEl.value = r.out;
        try { qzPhoneEl.setSelectionRange(r.pos, r.pos); } catch (err) { /* noop */ }
        if (qzPhoneClear) qzPhoneClear.hidden = !r.out;
        qzSyncSend();
        qzSaveDraft();
      };
      /* при фокусе на почти пустом телефоне выделяем всё — можно сразу печатать поверх */
      qzPhoneEl.addEventListener('focus', function () {
        if (qzPhoneEl.value.replace(/\D/g, '').length <= 1) qzPhoneEl.select();
      });

    /* кнопки «×» — очистка любого поля формы одним тапом, без долбания по Backspace */
    var qzClearBtns = quiz.querySelectorAll('.phone-clear[data-clear]');
    for (var ci = 0; ci < qzClearBtns.length; ci++) {
      (function (btn) {
        var inp = document.getElementById(btn.getAttribute('data-clear'));
        if (!inp) return;
        var syncClear = function () { btn.hidden = !inp.value; };
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          inp.value = '';
          syncClear();
          qzSyncSend();
          qzSaveDraft();
          inp.focus();
        });
        inp.addEventListener('input', syncClear);
        inp.addEventListener('change', syncClear);
        syncClear();
      })(qzClearBtns[ci]);
    }
      qzPhoneEl.addEventListener('input', function () {
        var caret = qzPhoneEl.selectionStart || 0;
        var digitsBefore = qzPhoneEl.value.slice(0, caret).replace(/\D/g, '').length;
        qzApplyPhone(qzPhoneEl.value, digitsBefore);
      });
      /* Backspace/Delete рядом с разделителем «( ) -» сносит ближайшую ЦИФРУ,
         а не воскрешённый маской разделитель — иначе порядок цифр ломается */
      qzPhoneEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Backspace' && e.key !== 'Delete') return;
        var v = qzPhoneEl.value;
        /* Backspace при 3 оставшихся цифрах и меньше сносит весь номер сразу */
        if (e.key === 'Backspace') {
          var rf = v.replace(/\D/g, '');
          var sub = (rf.length > 1 && (rf.charAt(0) === '7' || rf.charAt(0) === '8')) ? rf.slice(1) : rf;
          if (sub.length <= 3) {
            e.preventDefault();
            qzApplyPhone('', 0);
            return;
          }
        }
        var s = qzPhoneEl.selectionStart;
        var en = qzPhoneEl.selectionEnd;
        if (s === null || s !== en || !v) return;
        var idx = (e.key === 'Backspace') ? s - 1 : s;
        if (idx < 0 || idx >= v.length) return;
        var isDig = function (c) { return c >= '0' && c <= '9'; };
        if (isDig(v.charAt(idx))) return; /* удаляется цифра — обычное поведение браузера */
        var i = idx;
        if (e.key === 'Backspace') {
          while (i >= 0 && !isDig(v.charAt(i))) i--;
          if (i < 0) { e.preventDefault(); return; }
        } else {
          while (i < v.length && !isDig(v.charAt(i))) i++;
          if (i >= v.length) { e.preventDefault(); return; }
        }
        e.preventDefault();
        var nv = v.slice(0, i) + v.slice(i + 1);
        var keep = (e.key === 'Backspace') ? i : s;
        if (keep > nv.length) keep = nv.length;
        qzApplyPhone(nv, nv.slice(0, keep).replace(/\D/g, '').length);
      });
    }
    if (qzBack) qzBack.addEventListener('click', function () {
      if (qzCur > 1) qzShow(qzCur - 1);
    });

    /* «Очистить» — полный сброс формы: ответы, поля, согласие, черновик */
    var qzReset = document.getElementById('quizReset');
    if (qzReset) qzReset.addEventListener('click', function () {
      qzAnswers.service = [];
      qzAnswers.size = '';
      qzAnswers.contact = '';
      var selOpts = quiz.querySelectorAll('.quiz-opt.sel');
      for (var i = 0; i < selOpts.length; i++) selOpts[i].classList.remove('sel');
      var otherBox = document.getElementById('qzOtherBox');
      if (otherBox) otherBox.hidden = true;
      var fieldIds = ['qzDate', 'qzTime', 'qzPhone', 'qzName', 'qzComment', 'qzOther'];
      for (var f = 0; f < fieldIds.length; f++) {
        var fe = document.getElementById(fieldIds[f]);
        if (fe) fe.value = '';
      }
      var cb = document.getElementById('qzConsent');
      if (cb) cb.checked = false;
      /* все значения пустые — прячем все кнопки «×» */
      var allClears = quiz.querySelectorAll('.phone-clear[data-clear]');
      for (var ac = 0; ac < allClears.length; ac++) allClears[ac].hidden = true;
      qzClearDraft();
      qzShow(1);
    });

    /* «Скопировать заявку» — работает на любом ПК, даже без WhatsApp/Telegram */
    var qzCopy = document.getElementById('quizCopy');
    if (qzCopy) {
      qzCopy.addEventListener('click', function () {
        var btn = this;
        if (btn.classList.contains('btn-dis')) return; /* кнопка неактивна — ничего не копируем */
        var text = qzText();
        var done = function () {
          btn.textContent = 'Скопировано ✓';
          window.setTimeout(function () { btn.textContent = 'Скопировать заявку'; }, 2200);
        };
        var fallback = function () {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); } catch (err) { /* noop */ }
          document.body.removeChild(ta);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else {
          fallback();
        }
      });
    }

    /* восстановление черновика после перезагрузки страницы */
    var qzDraft = qzLoadDraft();
    var qzStart = 1;
    if (qzDraft) {
      if (qzDraft.service && qzDraft.service.length) {
        qzAnswers.service = qzDraft.service;
        for (var r1 = 0; r1 < qzOpts.length; r1++) {
          var rs = qzOpts[r1].querySelector('span');
          var rl = rs ? rs.textContent.trim() : '';
          if (qzOpts[r1].parentNode.getAttribute('data-quiz') === 'service' && qzDraft.service.indexOf(rl) !== -1) {
            qzOpts[r1].classList.add('sel');
            if (rl === 'Другое') {
              var ob2 = document.getElementById('qzOtherBox');
              if (ob2) ob2.hidden = false;
            }
          }
        }
      }
      if (qzDraft.size) {
        qzAnswers.size = qzDraft.size;
        for (var r2 = 0; r2 < qzOpts.length; r2++) {
          var rs2 = qzOpts[r2].querySelector('span');
          if (qzOpts[r2].parentNode.getAttribute('data-quiz') === 'size' && rs2 && rs2.textContent.trim() === qzDraft.size) qzOpts[r2].classList.add('sel');
        }
      }
      if (qzDraft.contact) {
        /* режим «Позвоните мне» временно скрыт — старый черновик не должен его включать */
        if (qzDraft.contact === 'Позвоните мне') qzDraft.contact = '';
        qzAnswers.contact = qzDraft.contact;
        for (var r3 = 0; r3 < qzOpts.length; r3++) {
          var rs3 = qzOpts[r3].querySelector('span');
          if (qzOpts[r3].parentNode.getAttribute('data-quiz') === 'contact' && rs3 && rs3.textContent.trim() === qzDraft.contact) qzOpts[r3].classList.add('sel');
        }
      }
      if (qzDate && qzDraft.date) qzDate.value = qzDraft.date;
      var rEl;
      rEl = document.getElementById('qzTime'); if (rEl && qzDraft.time) rEl.value = qzDraft.time;
      rEl = document.getElementById('qzPhone'); if (rEl && qzDraft.phone) rEl.value = qzDraft.phone;
      if (qzPhoneClear) qzPhoneClear.hidden = !(rEl && rEl.value);
      rEl = document.getElementById('qzName'); if (rEl && qzDraft.name) rEl.value = qzDraft.name;
      rEl = document.getElementById('qzComment'); if (rEl && qzDraft.comment) rEl.value = qzDraft.comment;
      rEl = document.getElementById('qzOther'); if (rEl && qzDraft.other) rEl.value = qzDraft.other;
      rEl = document.getElementById('qzConsent'); if (rEl && qzDraft.consent) rEl.checked = true;
      /* значения выставлены программно (без input-события) — синхронизируем кнопки «×» */
      var draftClears = quiz.querySelectorAll('.phone-clear[data-clear]');
      for (var dc = 0; dc < draftClears.length; dc++) {
        var dInp = document.getElementById(draftClears[dc].getAttribute('data-clear'));
        if (dInp) draftClears[dc].hidden = !dInp.value;
      }
      qzStart = Math.min(Math.max(1, qzDraft.step || 1), qzTotal);
    }

    /* черновик больше не нужен после отправки заявки */
    var waBtn = document.getElementById('quizSend');
    var tgBtn = document.getElementById('quizSendTg');
    /* черновик чистим только при реальной отправке (кнопка активна);
       переход по неактивной ссылке блокируем */
    if (waBtn) waBtn.addEventListener('click', function (e) {
      if (waBtn.classList.contains('btn-dis')) { e.preventDefault(); return; }
      qzClearDraft();
    });
    if (tgBtn) tgBtn.addEventListener('click', function (e) {
      if (tgBtn.classList.contains('btn-dis')) { e.preventDefault(); return; }
      qzClearDraft();
    });

    qzShow(qzStart);
  }
})();