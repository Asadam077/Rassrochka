(function () {
  'use strict';

  /* ==========================================================
     AS PAY — installment calculator
     Trade markup logic: months * 6% is the formula used once to
     determine a fixed trading markup and a fixed sale price. No
     compound interest, no interest-on-balance, no accrual over time.
     ========================================================== */

  var MARKUP_PER_MONTH = 6;          // percent per month
  var MIN_MONTHS = 3;
  var MAX_MONTHS = 12;
  var STANDARD_MIN_DOWN_PERCENT = 20; // minimum down payment, % of retail price (when a down payment is made)
  var ZERO_DOWN_MAX_PRICE = 50000;    // 0 ₽ down payment is only allowed at or below this retail price
  var ZERO_DOWN_MAX_MONTHS = 8;       // ...and only for terms up to this many months (3..8)

  var state = {
    price: 0,
    down: 0,
    months: 3
  };

  /* ---------------- helpers ---------------- */

  function formatMoney(n) {
    var rounded = Math.round(n || 0);
    return rounded.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
  }

  // Russian-style percent formatting: one decimal place with a comma,
  // trailing ",0" dropped (e.g. 27.4 -> "27,4%", 36 -> "36%").
  function formatPercent(value) {
    var fixed = value.toFixed(1);
    if (fixed.slice(-2) === '.0') fixed = fixed.slice(0, -2);
    return fixed.replace('.', ',') + '%';
  }

  function formatMonthsWord(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    var word;
    if (mod100 >= 11 && mod100 <= 14) {
      word = 'месяцев';
    } else if (mod10 === 1) {
      word = 'месяц';
    } else if (mod10 >= 2 && mod10 <= 4) {
      word = 'месяца';
    } else {
      word = 'месяцев';
    }
    return n + ' ' + word;
  }

  function digitsOnly(str) {
    return (str || '').replace(/[^\d]/g, '');
  }

  function parseMoneyInput(str) {
    var digits = digitsOnly(str);
    if (!digits) return 0;
    var n = parseInt(digits, 10);
    if (!isFinite(n) || n < 0) return 0;
    return n;
  }

  function formatInputDisplay(n) {
    if (!n) return '';
    return n.toLocaleString('ru-RU').replace(/ /g, ' ');
  }

  /* ---------------- core calculation ---------------- */
  // Order of checks:
  // 1. retail price  2. term (months)
  // 3. zero-down-payment mode? -> allowed only at retail price <= 50 000 ₽
  //    AND term 3..8 months; otherwise show a notice, no calculation.
  // 4. a non-zero down payment must be at least 20% of retail price;
  //    below that, show a notice with the exact minimum amount.
  // 5. the down payment (0 ₽ included) is always subtracted from the
  //    retail price first; the 6%-per-month markup is then computed
  //    only on that remaining balance. Same single rule regardless of
  //    how large the down payment is — no separate bracket above any
  //    threshold.
  // 6. the exact monthly payment is rounded UP to the nearest 100 ₽ —
  //    that rounded amount is charged every month, all payments equal.
  //    The trading markup is adjusted (not a separate final payment) to
  //    absorb the rounding difference, so months * monthlyPayment is
  //    always exactly the future-payments total.
  function calculate() {
    var price = state.price;
    var down = Math.min(state.down, price);
    var months = state.months;
    var downPercent = price > 0 ? (down / price) * 100 : 0;

    var result = {
      price: price,
      down: down,
      downPercent: downPercent,
      months: months,
      isEmpty: price <= 0,
      isNotice: false,
      noticeText: '',
      noticeMinDownText: ''
    };

    if (result.isEmpty) return result;

    if (down === 0) {
      var zeroDownValid = price <= ZERO_DOWN_MAX_PRICE && months <= ZERO_DOWN_MAX_MONTHS;
      if (!zeroDownValid) {
        result.isNotice = true;
        var minDownForZero = Math.ceil(price * STANDARD_MIN_DOWN_PERCENT / 100);
        if (price > ZERO_DOWN_MAX_PRICE) {
          result.noticeText = 'Для товаров стоимостью более ' + formatMoney(ZERO_DOWN_MAX_PRICE) + ' минимальный первоначальный взнос составляет 20%.';
          result.noticeMinDownText = 'Минимальный взнос: ' + formatMoney(minDownForZero);
        } else {
          // Reachable only if months got out of sync with the UI's
          // zero-down lock (defensive; the UI itself caps the term at 8).
          result.noticeText = 'Без первоначального взноса рассрочка доступна на срок от ' + MIN_MONTHS + ' до ' + ZERO_DOWN_MAX_MONTHS + ' месяцев.';
        }
        return result;
      }
    } else if (downPercent < STANDARD_MIN_DOWN_PERCENT) {
      result.isNotice = true;
      var minDown = Math.ceil(price * STANDARD_MIN_DOWN_PERCENT / 100);
      result.noticeText = 'Минимальный первоначальный взнос — 20%.';
      result.noticeMinDownText = 'Минимальный взнос: ' + formatMoney(minDown);
      return result;
    }

    var baseMarkupRate = months * MARKUP_PER_MONTH; // percent
    var remainingRetail = price - down;
    var markupOnRemainder = remainingRetail * (baseMarkupRate / 100);
    var baseRemaining = remainingRetail + markupOnRemainder;

    var rawMonthlyPayment = baseRemaining / months;
    var monthlyPayment = Math.ceil(rawMonthlyPayment / 100) * 100;
    var finalInstallmentAmount = monthlyPayment * months;
    var finalTotalPrice = down + finalInstallmentAmount;
    var finalMarkup = finalTotalPrice - price;
    // Shown to the client relative to the full retail price (final
    // price vs retail price), not the reduced balance the markup was
    // actually computed on.
    var finalMarkupPercent = price > 0 ? (finalMarkup / price) * 100 : 0;

    result.baseMarkupRate = baseMarkupRate;
    result.monthlyPayment = monthlyPayment;
    result.finalInstallmentAmount = finalInstallmentAmount;
    result.finalTotalPrice = finalTotalPrice;
    result.finalMarkup = finalMarkup;
    result.finalMarkupPercent = finalMarkupPercent;

    return result;
  }

  /* ---------------- rendering ---------------- */

  var els = {
    priceInput: document.getElementById('priceInput'),
    downInput: document.getElementById('downInput'),
    downPercentHint: document.getElementById('downPercentHint'),
    downQuick: document.getElementById('downQuick'),
    downNoteMin: document.getElementById('downNoteMin'),
    downNoteFree: document.getElementById('downNoteFree'),
    monthsGrid: document.getElementById('monthsGrid'),

    resultStandard: document.getElementById('resultStandard'),
    resultNotice: document.getElementById('resultNotice'),
    noticeText: document.getElementById('noticeText'),
    noticeMinDown: document.getElementById('noticeMinDown'),
    emptyState: document.getElementById('emptyState'),

    monthlyPaymentValue: document.getElementById('monthlyPaymentValue'),

    sumPrice: document.getElementById('sumPrice'),
    sumDown: document.getElementById('sumDown'),
    sumMonths: document.getElementById('sumMonths'),
    sumMarkupPercent: document.getElementById('sumMarkupPercent'),
    sumMarkupAmount: document.getElementById('sumMarkupAmount'),
    sumPaymentsCount: document.getElementById('sumPaymentsCount'),
    sumInstallmentAmount: document.getElementById('sumInstallmentAmount'),
    sumTotal: document.getElementById('sumTotal'),

    scheduleToggle: document.getElementById('scheduleToggle'),
    schedulePanel: document.getElementById('schedulePanel'),
    scheduleList: document.getElementById('scheduleList'),

    copyButton: document.getElementById('copyButton'),
    copyButtonLabel: document.getElementById('copyButtonLabel'),

    toast: document.getElementById('toast')
  };

  var lastResult = null;

  function buildMonthButtons() {
    var frag = document.createDocumentFragment();
    for (var m = MIN_MONTHS; m <= MAX_MONTHS; m++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'month-btn';
      btn.textContent = m;
      btn.setAttribute('data-months', m);
      btn.setAttribute('aria-pressed', m === state.months ? 'true' : 'false');
      if (m === state.months) btn.classList.add('is-active');
      frag.appendChild(btn);
    }
    els.monthsGrid.appendChild(frag);
  }

  // True while the zero-down exception is in force: the term is capped
  // at ZERO_DOWN_MAX_MONTHS and longer terms are disabled.
  function isZeroDownLockActive() {
    return state.down === 0 && state.price > 0 && state.price <= ZERO_DOWN_MAX_PRICE;
  }

  function render() {
    var r = calculate();
    lastResult = r;

    var zeroDownLock = isZeroDownLockActive();
    if (zeroDownLock && state.months > ZERO_DOWN_MAX_MONTHS) {
      state.months = ZERO_DOWN_MAX_MONTHS;
      r = calculate();
      lastResult = r;
    }

    // month buttons: active state + zero-down lock (terms beyond
    // ZERO_DOWN_MAX_MONTHS are disabled; 3..8 stay freely selectable)
    var monthBtns = els.monthsGrid.querySelectorAll('.month-btn');
    monthBtns.forEach(function (b) {
      var m = parseInt(b.getAttribute('data-months'), 10);
      var active = m === state.months;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      b.disabled = zeroDownLock && m > ZERO_DOWN_MAX_MONTHS;
    });

    var downPct = r.price > 0 ? Math.round(r.downPercent) : 0;
    els.downPercentHint.textContent = formatMoney(r.down) + ' · ' + downPct + '%';

    els.downNoteMin.hidden = r.price <= 0 || zeroDownLock;
    els.downNoteFree.hidden = !(r.price > 0 && r.price <= ZERO_DOWN_MAX_PRICE);

    // Reset all result sections, then reveal exactly the one that applies.
    els.emptyState.hidden = true;
    els.resultNotice.hidden = true;
    els.resultStandard.hidden = true;

    if (r.isEmpty) {
      els.emptyState.hidden = false;
      return;
    }

    if (r.isNotice) {
      els.noticeText.textContent = r.noticeText;
      if (r.noticeMinDownText) {
        els.noticeMinDown.hidden = false;
        els.noticeMinDown.textContent = r.noticeMinDownText;
      } else {
        els.noticeMinDown.hidden = true;
      }
      els.resultNotice.hidden = false;
      return;
    }

    els.monthlyPaymentValue.textContent = formatMoney(r.monthlyPayment);

    els.sumPrice.textContent = formatMoney(r.price);
    els.sumDown.textContent = formatMoney(r.down) + ' · ' + downPct + '%';
    els.sumMonths.textContent = formatMonthsWord(r.months);
    els.sumMarkupPercent.textContent = formatPercent(r.finalMarkupPercent);
    els.sumMarkupAmount.textContent = formatMoney(r.finalMarkup);
    els.sumPaymentsCount.textContent = r.months;
    els.sumInstallmentAmount.textContent = formatMoney(r.finalInstallmentAmount);
    els.sumTotal.textContent = formatMoney(r.finalTotalPrice);

    renderSchedule(r);
    els.resultStandard.hidden = false;
  }

  function renderSchedule(r) {
    els.scheduleList.innerHTML = '';
    for (var i = 0; i < r.months; i++) {
      var li = document.createElement('li');
      var monthLabel = document.createElement('span');
      monthLabel.textContent = 'Месяц ' + (i + 1);
      var valueLabel = document.createElement('span');
      valueLabel.textContent = formatMoney(r.monthlyPayment);
      li.appendChild(monthLabel);
      li.appendChild(valueLabel);
      els.scheduleList.appendChild(li);
    }
  }

  /* ---------------- input wiring ---------------- */

  function setActiveChip(percent) {
    var chips = els.downQuick.querySelectorAll('.chip[data-percent]');
    chips.forEach(function (c) {
      var p = parseInt(c.getAttribute('data-percent'), 10);
      c.classList.toggle('is-active', p === percent);
    });
    var customChip = els.downQuick.querySelector('.chip[data-custom]');
    if (customChip) customChip.classList.toggle('is-active', percent === -1);
  }

  els.priceInput.addEventListener('input', function () {
    var n = parseMoneyInput(this.value);
    state.price = n;
    this.value = formatInputDisplay(n);
    if (state.down > state.price) {
      state.down = state.price;
      els.downInput.value = formatInputDisplay(state.down);
    }
    render();
  });

  els.downInput.addEventListener('input', function () {
    var n = parseMoneyInput(this.value);
    if (n > state.price) n = state.price;
    state.down = n;
    this.value = formatInputDisplay(n);
    setActiveChip(-1);
    render();
  });

  els.downQuick.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    if (chip.hasAttribute('data-custom')) {
      setActiveChip(-1);
      els.downInput.focus();
      return;
    }
    var percent = parseInt(chip.getAttribute('data-percent'), 10);
    state.down = Math.round(state.price * (percent / 100));
    els.downInput.value = formatInputDisplay(state.down);
    setActiveChip(percent);
    render();
  });

  els.monthsGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.month-btn');
    if (!btn || btn.disabled) return;
    state.months = parseInt(btn.getAttribute('data-months'), 10);
    render();
  });

  els.scheduleToggle.addEventListener('click', function () {
    var expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    els.schedulePanel.hidden = expanded;
  });

  /* ---------------- copy to clipboard ---------------- */

  function buildCopyText(r) {
    var lines = [
      'AS PAY',
      'Рассрочка по нормам Шариата',
      '',
      'Стоимость товара: ' + formatMoney(r.price),
      'Первоначальный взнос: ' + formatMoney(r.down),
      'Срок: ' + formatMonthsWord(r.months),
      'Торговая наценка: ' + formatMoney(r.finalMarkup),
      'Ежемесячный платёж: ' + formatMoney(r.monthlyPayment),
      'Количество платежей: ' + r.months,
      'Итоговая стоимость: ' + formatMoney(r.finalTotalPrice),
      '',
      'Стоимость фиксируется при оформлении рассрочки.'
    ];
    return lines.join('\n');
  }

  function showToast(text) {
    els.toast.textContent = text;
    els.toast.hidden = false;
    requestAnimationFrame(function () {
      els.toast.classList.add('is-visible');
    });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      els.toast.classList.remove('is-visible');
      setTimeout(function () { els.toast.hidden = true; }, 220);
    }, 2200);
  }

  els.copyButton.addEventListener('click', function () {
    if (!lastResult || lastResult.isEmpty || lastResult.isNotice) return;
    var text = buildCopyText(lastResult);

    function done(ok) {
      showToast(ok ? 'Расчёт скопирован' : 'Не удалось скопировать');
      if (ok) {
        var originalLabel = els.copyButtonLabel.textContent;
        els.copyButton.classList.add('is-copied');
        els.copyButtonLabel.textContent = 'Скопировано';
        setTimeout(function () {
          els.copyButton.classList.remove('is-copied');
          els.copyButtonLabel.textContent = originalLabel;
        }, 1800);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done(true);
      } catch (err) {
        done(false);
      }
    }
  });

  /* ---------------- init ---------------- */

  buildMonthButtons();
  setActiveChip(0);
  render();

})();
