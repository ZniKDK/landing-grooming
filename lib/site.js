/*
 * Подстановка данных клиента из config.js сайта (window.SITE).
 * Чтобы перенастроить шаблон под нового заказчика, достаточно поменять config.js:
 *   <a data-site-href="tel" data-site="phone"></a> → телефон из конфига
 *   <form data-lead-form> → получает endpoint из конфига
 */
(function () {
  'use strict';

  var site = window.SITE || {};

  document.querySelectorAll('[data-site]').forEach(function (el) {
    var value = site[el.dataset.site];
    if (value) el.textContent = value;
  });

  document.querySelectorAll('[data-site-href]').forEach(function (el) {
    var kind = el.dataset.siteHref;
    if (kind === 'tel' && site.phone) el.href = 'tel:' + site.phone.replace(/[^\d+]/g, '');
    if (kind === 'mail' && site.email) el.href = 'mailto:' + site.email;
    if (kind === 'telegram' && site.telegram) el.href = 'https://t.me/' + site.telegram;
  });

  if (site.endpoint) {
    document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
      form.dataset.endpoint = site.endpoint;
    });
  }
})();
