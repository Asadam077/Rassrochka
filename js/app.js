(function () {
  'use strict';

  /* ==========================================================
     AS PAY — installment calculator
     Trade markup logic: months * 5% of retail price.
     No compound interest, no interest-on-balance, no accrual.
     ========================================================== */

  var MARKUP_PER_MONTH = 5;   // percent per month
  var MIN_MONTHS = 3;
  var MAX_MONTHS = 12;
  var CUSTOM_TERMS_THRESHOLD = 40; // percent of price

  var state = {
    price: 0,
    down: 0,
    months: 3
  };

  var activeDownPercent = 0; // which quick chip is active, -1 = custom

  /* ---------------- helpers ---------------- */

  function formatMoney(n) {
    var rounded = Math.round(n || 0);
    return rounded.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
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

  /* ---------------- schedule builder ---------------- */
  // Builds a payment schedule for `remaining` rubles over `months`
  // installments. All installments equal, rounded UP to nearest 100,
  // except the last one which absorbs the rounding difference so the
  // sum always equals `remaining` exactly. Falls back to a safe
  // distribution when the amount is too small for 100-ruble rounding.
  function buildSchedule(remaining, months) {
    remaining = Math.round(remaining);
    if (months <= 0) return { regular: 0, last: remaining, payments: [remaining] };

    var exact = remaining / months;
    var regular = Math.ceil(exact / 100) * 100;
    var last = remaining - regular * (months - 1);

    if (last < 0) {
      // Fallback 1: round down to nearest 100
      regular = Math.floor(exact / 100) * 100;
      last = remaining - regular * (months - 1);
    }

    if (last < 0 || regular <= 0) {
      // Fallback 2: whole-ruble even split, no artificial rounding
      regular = Math.round(exact);
      last = remaining - regular * (months - 1);
      var guard = 0;
      while (last < 0 && regular > 0 && guard < 100000) {
        regular -= 1;
        last = remaining - regular * (months - 1);
        guard++;
      }
      if (regular <= 0) {
        // Degenerate case (e.g. remaining is 0): everything in the last payment
        regular = 0;
        last = remaining;
      }
    }

    var payments = [];
    for (var i = 0; i < months - 1; i++) payments.push(regular);
    payments.push(last);
    return { regular: regular, last: last, payments: payments };
  }

  /* ---------------- core calculation ---------------- */

  function calculate() {
    var price = state.price;
    var down = Math.min(state.down, price);
    var months = state.months;

    var downPercent = price > 0 ? (down / price) * 100 : 0;
    var markupPercent = months * MARKUP_PER_MONTH;
    var markupAmount = Math.round(price * (markupPercent / 100));
    var totalCost = price + markupAmount;
    var isCustom = price > 0 && downPercent > CUSTOM_TERMS_THRESHOLD;

    var result = {
      price: price,
      down: down,
      downPercent: downPercent,
      months: months,
      markupPercent: markupPercent,
      markupAmount: markupAmount,
      totalCost: totalCost,
      isCustom: isCustom,
      isEmpty: price <= 0
    };

    if (!isCustom && !result.isEmpty) {
      var remaining = totalCost - down;
      var schedule = buildSchedule(remaining, months);
      result.remaining = remaining;
      result.schedule = schedule;
      result.monthlyPayment = schedule.regular;
      result.lastPayment = schedule.last;
      result.hasDifferentLast = schedule.last !== schedule.regular;
    }

    return result;
  }

  /* ---------------- rendering ---------------- */

  var els = {
    priceInput: document.getElementById('priceInput'),
    downInput: document.getElementById('downInput'),
    downPercentHint: document.getElementById('downPercentHint'),
    downQuick: document.getElementById('downQuick'),
    monthsGrid: document.getElementById('monthsGrid'),
    markupHint: document.getElementById('markupHint'),

    resultStandard: document.getElementById('resultStandard'),
    resultCustom: document.getElementById('resultCustom'),
    emptyState: document.getElementById('emptyState'),

    monthlyPaymentValue: document.getElementById('monthlyPaymentValue'),
    lastPaymentNote: document.getElementById('lastPaymentNote'),

    sumPrice: document.getElementById('sumPrice'),
    sumDown: document.getElementById('sumDown'),
    sumMonths: document.getElementById('sumMonths'),
    sumMarkupPercent: document.getElementById('sumMarkupPercent'),
    sumMarkupAmount: document.getElementById('sumMarkupAmount'),
    sumTotal: document.getElementById('sumTotal'),

    scheduleToggle: document.getElementById('scheduleToggle'),
    schedulePanel: document.getElementById('schedulePanel'),
    scheduleList: document.getElementById('scheduleList'),

    copyButton: document.getElementById('copyButton'),
    copyButtonLabel: document.getElementById('copyButtonLabel'),

    customPrice: document.getElementById('customPrice'),
    customDown: document.getElementById('customDown'),
    customMonths: document.getElementById('customMonths'),
    customOfferButton: document.getElementById('customOfferButton'),

    leadModalOverlay: document.getElementById('leadModalOverlay'),
    leadModalClose: document.getElementById('leadModalClose'),
    leadModalForm: document.getElementById('leadModalForm'),
    leadModalSuccess: document.getElementById('leadModalSuccess'),
    leadModalDone: document.getElementById('leadModalDone'),
    leadName: document.getElementById('leadName'),
    leadPhone: document.getElementById('leadPhone'),
    leadSubmit: document.getElementById('leadSubmit'),

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

  function render() {
    var r = calculate();
    lastResult = r;

    // month buttons active state
    var monthBtns = els.monthsGrid.querySelectorAll('.month-btn');
    monthBtns.forEach(function (b) {
      var active = parseInt(b.getAttribute('data-months'), 10) === state.months;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    els.markupHint.textContent = 'Торговая наценка: ' + r.markupPercent + '%';

    var downPct = r.price > 0 ? Math.round(r.downPercent) : 0;
    els.downPercentHint.textContent = formatMoney(r.down) + ' · ' + downPct + '%';

    if (r.isEmpty) {
      els.resultStandard.hidden = true;
      els.resultCustom.hidden = true;
      els.emptyState.hidden = false;
      return;
    }

    els.emptyState.hidden = true;

    if (r.isCustom) {
      els.resultStandard.hidden = true;
      els.resultCustom.hidden = false;

      els.customPrice.textContent = formatMoney(r.price);
      els.customDown.textContent = formatMoney(r.down) + ' · ' + Math.round(r.downPercent) + '%';
      els.customMonths.textContent = formatMonthsWord(r.months);
      return;
    }

    els.resultCustom.hidden = true;
    els.resultStandard.hidden = false;

    els.monthlyPaymentValue.textContent = formatMoney(r.monthlyPayment);

    if (r.hasDifferentLast) {
      els.lastPaymentNote.hidden = false;
      els.lastPaymentNote.textContent = 'Последний платёж: ' + formatMoney(r.lastPayment);
    } else {
      els.lastPaymentNote.hidden = true;
    }

    els.sumPrice.textContent = formatMoney(r.price);
    els.sumDown.textContent = formatMoney(r.down) + ' · ' + downPct + '%';
    els.sumMonths.textContent = formatMonthsWord(r.months);
    els.sumMarkupPercent.textContent = r.markupPercent + '%';
    els.sumMarkupAmount.textContent = formatMoney(r.markupAmount);
    els.sumTotal.textContent = formatMoney(r.totalCost);

    renderSchedule(r);
  }

  function renderSchedule(r) {
    els.scheduleList.innerHTML = '';
    var payments = r.schedule.payments;
    for (var i = 0; i < payments.length; i++) {
      var li = document.createElement('li');
      var isLast = i === payments.length - 1;
      if (isLast && r.hasDifferentLast) li.className = 'is-last-payment';
      var monthLabel = document.createElement('span');
      monthLabel.textContent = 'Месяц ' + (i + 1);
      var valueLabel = document.createElement('span');
      valueLabel.textContent = formatMoney(payments[i]);
      li.appendChild(monthLabel);
      li.appendChild(valueLabel);
      els.scheduleList.appendChild(li);
    }
  }

  /* ---------------- input wiring ---------------- */

  function setActiveChip(percent) {
    activeDownPercent = percent;
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
    activeDownPercent = -1;
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
    if (!btn) return;
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
      'Торговая наценка: ' + r.markupPercent + '%',
      'Ежемесячный платёж: ' + formatMoney(r.monthlyPayment),
      'Количество платежей: ' + r.months
    ];
    if (r.hasDifferentLast) {
      lines.push('Последний платёж: ' + formatMoney(r.lastPayment));
    }
    lines.push('Итоговая стоимость: ' + formatMoney(r.totalCost));
    lines.push('');
    lines.push('Итоговая стоимость фиксируется при оформлении рассрочки.');
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
    if (!lastResult || lastResult.isEmpty || lastResult.isCustom) return;
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

  /* ---------------- lead modal (individual conditions) ---------------- */

  function openModal() {
    els.leadModalForm.hidden = false;
    els.leadModalSuccess.hidden = true;
    els.leadName.value = '';
    els.leadPhone.value = '';
    els.leadModalOverlay.hidden = false;
  }
  function closeModal() {
    els.leadModalOverlay.hidden = true;
  }

  els.customOfferButton.addEventListener('click', openModal);
  els.leadModalClose.addEventListener('click', closeModal);
  els.leadModalOverlay.addEventListener('click', function (e) {
    if (e.target === els.leadModalOverlay) closeModal();
  });
  els.leadModalDone.addEventListener('click', closeModal);

  els.leadSubmit.addEventListener('click', function () {
    // NOTE: no backend is wired up here — this is a UI placeholder.
    // Connect this to your CRM / Telegram bot / API endpoint to receive real leads.
    els.leadModalForm.hidden = true;
    els.leadModalSuccess.hidden = false;
  });

  /* ---------------- init ---------------- */

  buildMonthButtons();
  setActiveChip(0);
  render();

})();
