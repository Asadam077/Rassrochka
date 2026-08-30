(function () {
  'use strict';

  /* ==========================================================
     AS PAY — installment calculator
     Trade markup logic: months * 5% of retail price.
     No compound interest, no interest-on-balance, no accrual.
     ========================================================== */

  var MARKUP_PER_MONTH = 5;      // percent per month
  var MIN_MONTHS = 3;
  var MAX_MONTHS = 12;
  var MIN_DOWN_PERCENT = 25;     // minimum down payment, % of retail price (when a down payment is made)
  var NO_DOWN_MAX_PRICE = 50000; // 0 ₽ down payment is only allowed at or below this retail price
  var CUSTOM_TERMS_THRESHOLD = 40; // percent of price — above this, individual conditions apply

  // Company WhatsApp number for the individual-conditions CTA.
  // Digits only, with country code, no "+", spaces or dashes.
  var WHATSAPP_NUMBER = '79290930303';

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
  // Follows this order strictly:
  // 1. retail price  2. term (months)  3. trade markup (5% × months)
  // 4. total cost with markup  5. zero-down-payment mode?
  // 6. zero down is only allowed at retail price <= 50 000 ₽
  // 7. a non-zero down payment must be at least 25% of retail price
  // 8. down payment as % of retail price
  // 9. >40% of retail price -> individual conditions (WhatsApp)
  // 10. 0/25%..40% -> standard calculation
  // 11. monthly payment  12. round displayed monthly payment up to nearest 100 ₽
  function calculate() {
    var price = state.price;
    var down = Math.min(state.down, price);
    var months = state.months;
    var downPercent = price > 0 ? (down / price) * 100 : 0;

    var markupPercent = months * MARKUP_PER_MONTH;
    var markupAmount = Math.round(price * (markupPercent / 100));
    var totalCost = price + markupAmount;

    var result = {
      price: price,
      down: down,
      downPercent: downPercent,
      months: months,
      markupPercent: markupPercent,
      markupAmount: markupAmount,
      totalCost: totalCost,
      isEmpty: price <= 0,
      isNotice: false,
      noticeText: '',
      isCustom: false
    };

    if (result.isEmpty) return result;

    if (down === 0) {
      if (price > NO_DOWN_MAX_PRICE) {
        result.isNotice = true;
        result.noticeText = 'Для товаров стоимостью свыше ' + formatMoney(NO_DOWN_MAX_PRICE) + ' необходим первоначальный взнос.';
        return result;
      }
    } else if (down * 100 < price * MIN_DOWN_PERCENT) {
      var minDown = Math.ceil(price * MIN_DOWN_PERCENT / 100);
      result.isNotice = true;
      result.noticeText = 'Минимальный первоначальный взнос — ' + formatMoney(minDown) + '.';
      return result;
    }

    if (down * 100 > price * CUSTOM_TERMS_THRESHOLD) {
      result.isCustom = true;
      return result;
    }

    var remaining = totalCost - down;
    var schedule = buildSchedule(remaining, months);
    result.remaining = remaining;
    result.schedule = schedule;
    result.monthlyPayment = schedule.regular;
    result.lastPayment = schedule.last;
    result.hasDifferentLast = schedule.last !== schedule.regular;

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
    resultNotice: document.getElementById('resultNotice'),
    noticeText: document.getElementById('noticeText'),
    emptyState: document.getElementById('emptyState'),

    monthlyPaymentValue: document.getElementById('monthlyPaymentValue'),
    lastPaymentNote: document.getElementById('lastPaymentNote'),

    sumPrice: document.getElementById('sumPrice'),
    sumDown: document.getElementById('sumDown'),
    sumMonths: document.getElementById('sumMonths'),
    sumMarkupPercent: document.getElementById('sumMarkupPercent'),
    sumTotal: document.getElementById('sumTotal'),
    sumRemaining: document.getElementById('sumRemaining'),

    scheduleToggle: document.getElementById('scheduleToggle'),
    schedulePanel: document.getElementById('schedulePanel'),
    scheduleList: document.getElementById('scheduleList'),

    copyButton: document.getElementById('copyButton'),
    copyButtonLabel: document.getElementById('copyButtonLabel'),

    customPrice: document.getElementById('customPrice'),
    customDown: document.getElementById('customDown'),
    customMonths: document.getElementById('customMonths'),
    customOfferButton: document.getElementById('customOfferButton'),

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

    // Reset all result sections, then reveal exactly the one that applies.
    els.emptyState.hidden = true;
    els.resultNotice.hidden = true;
    els.resultCustom.hidden = true;
    els.resultStandard.hidden = true;

    if (r.isEmpty) {
      els.emptyState.hidden = false;
      return;
    }

    if (r.isNotice) {
      els.noticeText.textContent = r.noticeText;
      els.resultNotice.hidden = false;
      return;
    }

    if (r.isCustom) {
      els.customPrice.textContent = formatMoney(r.price);
      els.customDown.textContent = formatMoney(r.down) + ' · ' + downPct + '%';
      els.customMonths.textContent = formatMonthsWord(r.months);
      els.resultCustom.hidden = false;
      return;
    }

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
    els.sumTotal.textContent = formatMoney(r.totalCost);
    els.sumRemaining.textContent = formatMoney(r.remaining);

    renderSchedule(r);
    els.resultStandard.hidden = false;
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
    if (!lastResult || lastResult.isEmpty || lastResult.isNotice || lastResult.isCustom) return;
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

  /* ---------------- individual conditions -> WhatsApp ---------------- */

  function buildWhatsAppUrl(r) {
    var lines = [
      'Здравствуйте! Хочу узнать индивидуальные условия AS PAY.',
      'Стоимость товара: ' + formatMoney(r.price),
      'Первоначальный взнос: ' + formatMoney(r.down),
      'Размер взноса: ' + Math.round(r.downPercent) + '%',
      'Срок рассрочки: ' + formatMonthsWord(r.months)
    ];
    var text = lines.join('\n');
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
  }

  els.customOfferButton.addEventListener('click', function () {
    if (!lastResult || !lastResult.isCustom) return;
    var win = window.open(buildWhatsAppUrl(lastResult), '_blank');
    if (win) win.opener = null;
  });

  /* ---------------- init ---------------- */

  buildMonthButtons();
  setActiveChip(0);
  render();

})();
