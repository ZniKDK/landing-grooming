/* «Чистый хвост»: пёс, которого можно помыть, глаза следят за курсором,
   цены по размеру питомца, выбор дня и времени, сердечки после записи. */
(function () {
  'use strict';

  var M = window.Motion;

  // ---------- Пёс ----------
  var dog = document.querySelector('.dog');
  var stage = document.querySelector('.dog-stage');
  var bubbles = stage.querySelector('.bubbles');
  var bark = stage.querySelector('.bark');
  var washBtn = document.querySelector('[data-wash]');
  var pupils = dog.querySelectorAll('.pupil');
  var washing = false;

  // Зрачки смотрят на курсор (сдвиг не больше 6 единиц)
  if (matchMedia('(pointer: fine)').matches && !M.reduced()) {
    addEventListener('pointermove', function (e) {
      pupils.forEach(function (p) {
        var r = p.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        var d = Math.hypot(dx, dy) || 1;
        var k = Math.min(d / 40, 6);
        p.style.transform = 'translate(' + (dx / d * k).toFixed(1) + 'px,' + (dy / d * k).toFixed(1) + 'px)';
      });
    }, { passive: true });
  }

  function jump() {
    dog.classList.remove('is-jump');
    void dog.getBoundingClientRect();
    dog.classList.add('is-jump');
  }

  function sayBark() {
    bark.classList.remove('is-on');
    void bark.offsetWidth;
    bark.classList.add('is-on');
  }

  // Клик по псу: прыжок и «Гав!»
  dog.addEventListener('click', function () {
    if (M.reduced()) return;
    jump();
    sayBark();
  });

  function blowBubbles(count, spread) {
    for (var i = 0; i < count; i++) {
      var b = document.createElement('span');
      var size = 14 + Math.random() * 36;
      b.className = 'bubble';
      b.style.width = b.style.height = size + 'px';
      b.style.left = (50 + (Math.random() - 0.5) * spread) + '%';
      bubbles.appendChild(b);
      var drift = (Math.random() - 0.5) * 120;
      b.animate([
        { transform: 'translate(-50%, 0) scale(.2)', opacity: 0 },
        { opacity: 1, offset: 0.15 },
        { transform: 'translate(calc(-50% + ' + drift.toFixed(0) + 'px), -' + (180 + Math.random() * 160).toFixed(0) + 'px) scale(1)', opacity: 0 }
      ], { duration: 1400 + Math.random() * 1200, delay: Math.random() * 900, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'both' })
        .onfinish = (function (el) { return function () { el.remove(); }; })(b);
    }
  }

  washBtn.addEventListener('click', function () {
    if (washing) return;
    var toClean = dog.classList.contains('is-dirty');
    if (!toClean) {
      dog.classList.remove('is-clean');
      dog.classList.add('is-dirty');
      washBtn.textContent = 'Помыть Бусю';
      return;
    }
    washing = true;
    washBtn.disabled = true;
    washBtn.textContent = 'Моем…';
    if (!M.reduced()) blowBubbles(34, 70);
    setTimeout(function () {
      dog.classList.remove('is-dirty');
      dog.classList.add('is-clean');
      if (!M.reduced()) {
        jump();
        sayBark();
      }
      washBtn.textContent = 'Испачкать обратно';
      washBtn.disabled = false;
      washing = false;
    }, M.reduced() ? 0 : 1500);
  });

  // ---------- Цены по размеру ----------
  var SIZES = window.SIZES;
  var SERVICES = window.SERVICES;
  var sizesBox = document.querySelector('.sizes');
  var list = document.querySelector('.price-list');
  var serviceSelect = document.getElementById('f-service');
  var current = SIZES[0].id;

  var thumb = document.createElement('span');
  thumb.className = 'size-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  sizesBox.appendChild(thumb);

  var tabs = SIZES.map(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'size';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', 'price-panel');
    b.setAttribute('aria-selected', i === 0);
    b.tabIndex = i === 0 ? 0 : -1;
    b.dataset.size = s.id;
    b.innerHTML = s.name + '<small>' + s.hint + '</small>';
    sizesBox.appendChild(b);
    return b;
  });

  // Строки прайса создаём один раз, при смене размера меняем только цены
  var rows = SERVICES.map(function (s, i) {
    var li = document.createElement('li');
    li.className = 'price';
    li.style.setProperty('--i', i);
    li.innerHTML = '<h3>' + s.name + '</h3><p>' + s.about + '</p>' +
      '<p class="price-sum"><span data-price>0</span> ₽<small>' + s.time + '</small></p>' +
      '<a href="#book">Записаться на эту услугу</a>';
    li.querySelector('a').addEventListener('click', function () {
      serviceSelect.value = s.name;
    });
    list.appendChild(li);
    return li;
  });

  function showSize(id, animate) {
    current = id;
    var idx = SIZES.findIndex(function (s) { return s.id === id; });
    thumb.style.setProperty('--k', idx);
    tabs.forEach(function (t, i) {
      t.setAttribute('aria-selected', i === idx);
      t.tabIndex = i === idx ? 0 : -1;
    });
    rows.forEach(function (li, i) {
      M.tweenNumber(li.querySelector('[data-price]'), SERVICES[i].price[id], { duration: animate ? 500 : 900 });
      if (animate && !M.reduced()) {
        li.classList.remove('is-enter');
        void li.offsetWidth;
        li.classList.add('is-enter');
      }
    });
  }

  sizesBox.addEventListener('click', function (e) {
    var b = e.target.closest('.size');
    if (b) showSize(b.dataset.size, true);
  });
  sizesBox.addEventListener('keydown', function (e) {
    var idx = SIZES.findIndex(function (s) { return s.id === current; });
    var next = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % SIZES.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + SIZES.length) % SIZES.length;
    if (next !== null) {
      e.preventDefault();
      showSize(SIZES[next].id, true);
      tabs[next].focus();
    }
  });
  M.onVisible(list, function () { showSize(current, false); }, 0.2);

  // ---------- Запись: услуги, дни, время ----------
  SERVICES.forEach(function (s) {
    var o = document.createElement('option');
    o.textContent = s.name;
    serviceSelect.appendChild(o);
  });

  var daysBox = document.querySelector('.days');
  var timesBox = document.querySelector('.times');

  function chip(name, value, label, sub, checked, disabled) {
    var l = document.createElement('label');
    l.className = 'chip';
    l.innerHTML = '<input type="radio" name="' + name + '" value="' + value + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
      '<span>' + label + (sub ? '<small>' + sub + '</small>' : '') + '</span>';
    return l;
  }

  function renderTimes(dayIndex) {
    var busy = window.BUSY[dayIndex] || [];
    timesBox.innerHTML = '';
    var firstFree = true;
    window.SLOTS.forEach(function (t) {
      var isBusy = busy.indexOf(t) >= 0;
      timesBox.appendChild(chip('time', t, t, isBusy ? 'занято' : '', !isBusy && firstFree, isBusy));
      if (!isBusy) firstFree = false;
    });
  }

  var today = new Date();
  for (var i = 0; i < 6; i++) {
    var d = new Date(today.getTime() + i * 86400000);
    var label = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : d.toLocaleDateString('ru-RU', { weekday: 'short' });
    var value = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    daysBox.appendChild(chip('day', value, label, d.getDate() + ' ' + d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''), i === 0, false));
  }
  renderTimes(0);

  daysBox.addEventListener('change', function () {
    var idx = Array.from(daysBox.querySelectorAll('input')).findIndex(function (x) { return x.checked; });
    renderTimes(idx);
  });

  // ---------- Сердечки после записи ----------
  var form = document.querySelector('form[data-lead-form]');
  var hearts = form.querySelector('.hearts');
  form.addEventListener('formsent', function () {
    if (M.reduced()) return;
    var colors = ['var(--coral)', 'var(--lilac)', 'var(--sun)'];
    for (var k = 0; k < 14; k++) {
      var h = document.createElement('span');
      h.className = 'heart';
      h.style.left = (10 + Math.random() * 80) + '%';
      h.style.background = colors[k % 3];
      hearts.appendChild(h);
      h.animate([
        { transform: 'translateY(0) rotate(45deg) scale(.3)', opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: 'translateY(-' + (220 + Math.random() * 200).toFixed(0) + 'px) rotate(45deg) scale(1)', opacity: 0 }
      ], { duration: 1600 + Math.random() * 900, delay: k * 60, easing: 'ease-out', fill: 'both' })
        .onfinish = (function (el) { return function () { el.remove(); }; })(h);
    }
  });
})();
