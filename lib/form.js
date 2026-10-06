/*
 * Форма заявки: маска телефона, проверка полей, защита от ботов (honeypot),
 * защита от двойной отправки.
 *
 * Куда отправлять — атрибут data-endpoint у <form>.
 * Пусто → демо-режим: заявка никуда не уходит, показываем успех через ~1 с.
 * Для боевого режима укажите адрес функции из проекта landing-demo
 * (заявка → Telegram, запасной канал — почта).
 *
 * После успеха форме ставится класс is-sent и вызывается событие formsent —
 * анимацию «отправлено» каждый сайт рисует сам.
 */
(function () {
  'use strict';

  // +7 (999) 123-45-67
  function maskPhone(value) {
    var d = value.replace(/\D/g, '');
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ') ' + d.slice(4, 7);
    if (d.length >= 7) out += '-' + d.slice(7, 9);
    if (d.length >= 9) out += '-' + d.slice(9, 11);
    return out;
  }

  function phoneDigits(value) {
    return value.replace(/\D/g, '');
  }

  function setError(field, message) {
    var wrap = field.closest('.field');
    var hint = wrap && wrap.querySelector('.field-error');
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (wrap) wrap.classList.toggle('has-error', !!message);
    if (hint) hint.textContent = message || '';
  }

  function validate(form) {
    var ok = true;
    var name = form.elements.name;
    var phone = form.elements.phone;
    if (name && name.value.trim().length < 2) {
      setError(name, 'Напишите, как к вам обращаться');
      ok = false;
    } else if (name) {
      setError(name, '');
    }
    if (phone && phoneDigits(phone.value).length !== 11) {
      setError(phone, 'Нужен номер из 10 цифр после +7');
      ok = false;
    } else if (phone) {
      setError(phone, '');
    }
    return ok;
  }

  function send(form, data) {
    var endpoint = form.dataset.endpoint;
    if (!endpoint) {
      // Демо-режим: имитируем сеть
      return new Promise(function (resolve) { setTimeout(resolve, 900); });
    }
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
    });
  }

  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    var phone = form.elements.phone;
    var status = form.querySelector('.form-status');
    var button = form.querySelector('[type=submit]');

    if (phone) {
      phone.addEventListener('focus', function () {
        if (!phone.value) phone.value = '+7 (';
      });
      phone.addEventListener('input', function () {
        phone.value = maskPhone(phone.value);
      });
      phone.addEventListener('blur', function () {
        if (phoneDigits(phone.value).length <= 1) phone.value = '';
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.classList.contains('is-sending')) return;
      // honeypot: людям поле не видно, боты его заполняют
      if (form.elements.website && form.elements.website.value) return;
      if (!validate(form)) {
        var bad = form.querySelector('[aria-invalid=true]');
        if (bad) bad.focus();
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) {
        if (k !== 'website') data[k] = String(v).trim();
      });
      data.page = location.pathname;

      form.classList.add('is-sending');
      button.disabled = true;
      if (status) status.textContent = 'Отправляем заявку…';

      send(form, data).then(function () {
        form.classList.remove('is-sending');
        form.classList.add('is-sent');
        if (status) status.textContent = 'Заявка отправлена. Перезвоним в течение 15 минут в рабочее время.';
        form.dispatchEvent(new CustomEvent('formsent', { detail: data }));
      }).catch(function () {
        form.classList.remove('is-sending');
        button.disabled = false;
        if (status) status.textContent = 'Заявка не ушла: нет связи с сервером. Попробуйте ещё раз или позвоните нам.';
      });
    });
  });
})();
