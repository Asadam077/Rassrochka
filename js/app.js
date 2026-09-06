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
  var GUARANTOR_REMAINDER_THRESHOLD = 50000; // guarantor rule threshold on (price - down)
  var POPULAR_MONTHS = 7;             // optional "Популярный вариант" badge

  var state = {
    price: 0,
    down: 0,
    months: null // currently selected term in the payments table; null = nothing selectable yet
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
  // Order of checks, applied once per (price, down) pair, independent
  // of any particular term:
  // 1. retail price
  // 2. zero-down-payment mode? -> allowed only at retail price <= 50 000 ₽
  //    (the 3..8 month restriction is a per-term check, see evaluateTerm);
  //    otherwise show a notice, no calculation for any term.
  // 3. a non-zero down payment must be at least 20% of retail price;
  //    below that, show a notice with the exact minimum amount.
  function getGlobalStatus(price, down) {
    var result = {
      isEmpty: price <= 0,
      isNotice: false,
      noticeText: '',
      noticeMinDownText: ''
    };
    if (result.isEmpty) return result;

    var downPercent = (down / price) * 100;

    if (down === 0) {
      if (price > ZERO_DOWN_MAX_PRICE) {
        result.isNotice = true;
        var minDownForZero = Math.ceil(price * STANDARD_MIN_DOWN_PERCENT / 100);
        result.noticeText = 'Для товаров стоимостью более ' + formatMoney(ZERO_DOWN_MAX_PRICE) + ' минимальный первоначальный взнос составляет 20%.';
        result.noticeMinDownText = 'Минимальный взнос: ' + formatMoney(minDownForZero);
      }
    } else if (downPercent < STANDARD_MIN_DOWN_PERCENT) {
      result.isNotice = true;
      var minDown = Math.ceil(price * STANDARD_MIN_DOWN_PERCENT / 100);
      result.noticeText = 'Минимальный первоначальный взнос — 20%.';
      result.noticeMinDownText = 'Минимальный взнос: ' + formatMoney(minDown);
    }

    return result;
  }

  // Per-term evaluation used to build the 3..12 month payments table.
  // Reuses the same formula for every term, unchanged:
  // the down payment (0 ₽ included) is always subtracted from the
  // retail price first; the 6%-per-month markup is then computed only
  // on that remaining balance. The exact monthly payment is rounded UP
  // to the nearest 100 ₽ — that rounded amount is charged every month,
  // all payments equal. The trading markup absorbs the rounding
  // difference (not a separate final payment), so
  // monthlyPayment * months === finalInstallmentAmount always holds.
  function evaluateTerm(price, down, months, globalStatus) {
    var out = { months: months, available: false, reason: '' };

    if (globalStatus.isEmpty) return out;

    if (globalStatus.isNotice) {
      out.reason = globalStatus.noticeText;
      return out;
    }

    if (down === 0 && months > ZERO_DOWN_MAX_MONTHS) {
      out.reason = 'Без взноса — доступно на срок до ' + ZERO_DOWN_MAX_MONTHS + ' мес.';
      return out;
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

    out.available = true;
    out.price = price;
    out.down = down;
    out.downPercent = price > 0 ? (down / price) * 100 : 0;
    out.baseMarkupRate = baseMarkupRate;
    out.monthlyPayment = monthlyPayment;
    out.finalInstallmentAmount = finalInstallmentAmount;
    out.finalTotalPrice = finalTotalPrice;
    out.finalMarkup = finalMarkup;
    out.finalMarkupPercent = finalMarkupPercent;

    return out;
  }

  // New business rule, independent of the chosen term — based only on
  // the down payment and the remainder (price - down):
  // 1. no down payment (0 ₽)              -> guarantor always required
  // 2. down payment made, remainder < 50 000 ₽ -> guarantor not required
  // 3. down payment made, remainder >= 50 000 ₽ -> guarantor required
  function getGuarantorStatus(price, down) {
    if (price <= 0) return null;
    var remainder = price - down;
    if (down === 0) return { required: true, remainder: remainder };
    if (remainder < GUARANTOR_REMAINDER_THRESHOLD) return { required: false, remainder: remainder };
    return { required: true, remainder: remainder };
  }

  // Keeps the previously selected term if it is still available;
  // otherwise prefers the popular term, then the first available one.
  function pickDefaultMonths(terms) {
    var byMonths = {};
    terms.forEach(function (t) { byMonths[t.months] = t; });

    if (state.months !== null && byMonths[state.months] && byMonths[state.months].available) {
      return state.months;
    }
    if (byMonths[POPULAR_MONTHS] && byMonths[POPULAR_MONTHS].available) {
      return POPULAR_MONTHS;
    }
    for (var i = 0; i < terms.length; i++) {
      if (terms[i].available) return terms[i].months;
    }
    return null;
  }

  /* ---------------- rendering ---------------- */

  var els = {
    priceInput: document.getElementById('priceInput'),
    downInput: document.getElementById('downInput'),
    downPercentHint: document.getElementById('downPercentHint'),
    downQuick: document.getElementById('downQuick'),
    downNoteMin: document.getElementById('downNoteMin'),
    downNoteFree: document.getElementById('downNoteFree'),

    resultNotice: document.getElementById('resultNotice'),
    noticeText: document.getElementById('noticeText'),
    noticeMinDown: document.getElementById('noticeMinDown'),
    emptyState: document.getElementById('emptyState'),

    paymentsSection: document.getElementById('paymentsSection'),
    termsList: document.getElementById('termsList'),

    resultStandard: document.getElementById('resultStandard'),
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

    eligibilitySection: document.getElementById('eligibilitySection'),
    eligibilitySummary: document.getElementById('eligibilitySummary'),

    conditionsToggle: document.getElementById('conditionsToggle'),
    conditionsPanel: document.getElementById('conditionsPanel'),
    ageYes: document.getElementById('ageYes'),
    ageNo: document.getElementById('ageNo'),
    ageNote: document.getElementById('ageNote'),

    toast: document.getElementById('toast')
  };

  var lastSelectedResult = null;
  var termRowEls = {};

  function buildTermRows() {
    var frag = document.createDocumentFragment();
    for (var m = MIN_MONTHS; m <= MAX_MONTHS; m++) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'term-row';
      row.setAttribute('data-months', m);
      row.setAttribute('aria-pressed', 'false');

      var monthly = document.createElement('div');
      monthly.className = 'term-row__monthly';
      var monthlyValue = document.createElement('span');
      monthlyValue.className = 'term-row__monthly-value';
      monthlyValue.textContent = '—';
      var monthlyCaption = document.createElement('span');
      monthlyCaption.className = 'term-row__monthly-caption';
      monthlyCaption.textContent = '₽ / мес.';
      monthly.appendChild(monthlyValue);
      monthly.appendChild(monthlyCaption);

      var meta = document.createElement('div');
      meta.className = 'term-row__meta';

      var monthsItem = document.createElement('div');
      monthsItem.className = 'term-row__meta-item';
      var monthsLabel = document.createElement('span');
      monthsLabel.className = 'term-row__col-label';
      monthsLabel.textContent = 'Срок';
      var monthsValue = document.createElement('span');
      monthsValue.className = 'term-row__months-value';
      monthsValue.textContent = m + ' мес.';
      var badge = document.createElement('span');
      badge.className = 'term-row__badge';
      badge.textContent = 'Популярный вариант';
      badge.hidden = true;
      monthsItem.appendChild(monthsLabel);
      monthsItem.appendChild(monthsValue);
      monthsItem.appendChild(badge);

      var markupItem = document.createElement('div');
      markupItem.className = 'term-row__meta-item';
      var markupLabel = document.createElement('span');
      markupLabel.className = 'term-row__col-label';
      markupLabel.textContent = 'Наценка';
      var markupValue = document.createElement('span');
      markupValue.className = 'term-row__markup-value';
      markupValue.textContent = '—';
      markupItem.appendChild(markupLabel);
      markupItem.appendChild(markupValue);

      var totalItem = document.createElement('div');
      totalItem.className = 'term-row__meta-item';
      var totalLabel = document.createElement('span');
      totalLabel.className = 'term-row__col-label';
      totalLabel.textContent = 'Итоговая сумма';
      var totalValue = document.createElement('span');
      totalValue.className = 'term-row__total-value';
      totalValue.textContent = '—';
      totalItem.appendChild(totalLabel);
      totalItem.appendChild(totalValue);

      meta.appendChild(monthsItem);
      meta.appendChild(markupItem);
      meta.appendChild(totalItem);

      var reason = document.createElement('div');
      reason.className = 'term-row__unavailable-reason';

      row.appendChild(monthly);
      row.appendChild(meta);
      row.appendChild(reason);

      termRowEls[m] = row;
      frag.appendChild(row);
    }
    els.termsList.appendChild(frag);
  }

  function renderTermsList(terms, selectedMonths) {
    terms.forEach(function (t) {
      var row = termRowEls[t.months];
      var isSelected = t.available && t.months === selectedMonths;
      row.classList.toggle('is-active', isSelected);
      row.classList.toggle('is-unavailable', !t.available);
      row.disabled = !t.available;
      row.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

      var badgeEl = row.querySelector('.term-row__badge');
      badgeEl.hidden = !(t.available && t.months === POPULAR_MONTHS);

      var reasonEl = row.querySelector('.term-row__unavailable-reason');
      if (t.available) {
        row.querySelector('.term-row__markup-value').textContent = formatPercent(t.finalMarkupPercent);
        row.querySelector('.term-row__total-value').textContent = formatMoney(t.finalTotalPrice);
        row.querySelector('.term-row__monthly-value').textContent = formatMoney(t.monthlyPayment).replace(' ₽', '');
        reasonEl.textContent = '';
      } else {
        reasonEl.textContent = 'Недоступно — ' + t.reason;
      }
    });
  }

  function renderSelectedDetail(r) {
    lastSelectedResult = r;
    if (!r) {
      els.resultStandard.hidden = true;
      return;
    }
    els.resultStandard.hidden = false;

    var downPct = Math.round(r.downPercent);
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

  function renderEligibilitySummary(price, down, globalStatus, hasAvailableTerm) {
    var container = els.eligibilitySummary;
    container.innerHTML = '';

    if (globalStatus.isNotice || !hasAvailableTerm) {
      var unavailable = document.createElement('p');
      unavailable.className = 'eligibility__line eligibility__line--warn';
      unavailable.textContent = '⚠ По указанным параметрам стандартные условия рассрочки недоступны';
      container.appendChild(unavailable);

      if (globalStatus.noticeText) {
        var reasonP = document.createElement('p');
        reasonP.className = 'eligibility__reason';
        reasonP.textContent = globalStatus.noticeText;
        container.appendChild(reasonP);
      }
      return;
    }

    var guarantor = getGuarantorStatus(price, down);
    var lines = [
      { ok: true, text: 'Доступна рассрочка' },
      { ok: true, text: 'Первоначальный взнос: ' + formatMoney(down) },
      { ok: true, text: 'Сумма в рассрочку: ' + formatMoney(price - down) },
      { ok: !guarantor.required, text: guarantor.required ? 'Требуется поручитель' : 'Поручитель не требуется' }
    ];
    lines.forEach(function (line) {
      var p = document.createElement('p');
      p.className = 'eligibility__line' + (line.ok ? '' : ' eligibility__line--warn');
      p.textContent = (line.ok ? '✓ ' : '⚠ ') + line.text;
      container.appendChild(p);
    });
  }

  function render() {
    var price = state.price;
    var down = Math.min(state.down, price);
    var globalStatus = getGlobalStatus(price, down);

    var downPct = price > 0 ? Math.round((down / price) * 100) : 0;
    els.downPercentHint.textContent = formatMoney(down) + ' · ' + downPct + '%';
    els.downNoteMin.hidden = price <= 0 || (down === 0 && price <= ZERO_DOWN_MAX_PRICE);
    els.downNoteFree.hidden = !(price > 0 && price <= ZERO_DOWN_MAX_PRICE);

    // Reset all result sections, then reveal exactly the ones that apply.
    els.emptyState.hidden = true;
    els.resultNotice.hidden = true;
    els.paymentsSection.hidden = true;
    els.eligibilitySection.hidden = true;

    if (globalStatus.isEmpty) {
      els.emptyState.hidden = false;
      state.months = null;
      lastSelectedResult = null;
      return;
    }

    if (globalStatus.isNotice) {
      els.noticeText.textContent = globalStatus.noticeText;
      if (globalStatus.noticeMinDownText) {
        els.noticeMinDown.hidden = false;
        els.noticeMinDown.textContent = globalStatus.noticeMinDownText;
      } else {
        els.noticeMinDown.hidden = true;
      }
      els.resultNotice.hidden = false;
    }

    // Build the full 3..12 month table regardless of the notice above,
    // so unavailable terms are always shown (muted) with a reason,
    // never silently hidden.
    var terms = [];
    for (var m = MIN_MONTHS; m <= MAX_MONTHS; m++) {
      terms.push(evaluateTerm(price, down, m, globalStatus));
    }

    state.months = pickDefaultMonths(terms);
    renderTermsList(terms, state.months);
    els.paymentsSection.hidden = false;

    var selected = state.months !== null ? terms[state.months - MIN_MONTHS] : null;
    renderSelectedDetail(selected);

    renderEligibilitySummary(price, down, globalStatus, state.months !== null);
    els.eligibilitySection.hidden = false;
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

  els.termsList.addEventListener('click', function (e) {
    var row = e.target.closest('.term-row');
    if (!row || row.disabled) return;
    state.months = parseInt(row.getAttribute('data-months'), 10);
    render();
  });

  els.scheduleToggle.addEventListener('click', function () {
    var expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    els.schedulePanel.hidden = expanded;
  });

  els.conditionsToggle.addEventListener('click', function () {
    var expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    els.conditionsPanel.hidden = expanded;
  });

  els.ageYes.addEventListener('click', function () {
    els.ageYes.classList.add('is-active');
    els.ageNo.classList.remove('is-active');
    els.ageNote.hidden = true;
  });

  els.ageNo.addEventListener('click', function () {
    els.ageNo.classList.add('is-active');
    els.ageYes.classList.remove('is-active');
    els.ageNote.hidden = false;
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
    if (!lastSelectedResult) return;
    var text = buildCopyText(lastSelectedResult);

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

  buildTermRows();
  setActiveChip(0);
  render();

})();
