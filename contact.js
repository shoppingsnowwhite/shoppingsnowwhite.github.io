// راه‌های ارتباط با فروشگاه (سفارش و مشاوره)
// ⚙️ فقط همین دو خط را تغییر دهید. آیدی‌ها هیچ‌جای سایت نمایش داده نمی‌شوند.
// اگر telegram خالی باشد، دکمه‌ها مستقیم چت بله را باز می‌کنند.
window.SW_CONTACT = (() => {
  'use strict';
  const CFG = {
    bale: 'mehii773',
    telegram: 'mehii773',
  };

  const APPS = {
    bale: {
      name: 'بله',
      url: () => `https://ble.ir/${CFG.bale}`,
      prefill: false,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#00A884"/><path d="M7 7.2h5.1c2 0 3.2 1 3.2 2.5 0 1-.6 1.8-1.5 2.1 1.2.3 2 1.2 2 2.4 0 1.8-1.4 2.9-3.6 2.9H7z" fill="#fff"/></svg>',
    },
    telegram: {
      name: 'تلگرام',
      url: text => `https://t.me/${CFG.telegram}${text ? `?text=${encodeURIComponent(text)}` : ''}`,
      prefill: true,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#2AABEE"/><path d="m5.6 11.7 11-4.3c.5-.2 1 .1.8.9l-1.9 8.8c-.1.6-.5.8-1 .5l-2.8-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-2.9 5.2-4.7c.2-.2 0-.3-.3-.1l-6.4 4-2.7-.9c-.6-.2-.6-.6.1-.8z" fill="#fff"/></svg>',
    },
  };
  const enabled = () => Object.keys(APPS).filter(k => CFG[k]);

  let tt;
  function toast(m) {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = m; t.classList.add('show'); clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove('show'), 3800);
  }
  // کپی همزمان (داخل همان کلیک) تا مرورگر اجازه دهد
  function copySync(text) {
    let ok = false;
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;opacity:0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      ok = document.execCommand('copy'); ta.remove();
    } catch {}
    if (!ok && navigator.clipboard) { navigator.clipboard.writeText(text).catch(() => {}); ok = true; }
    return ok;
  }

  function launch(app, text, copied) {
    const a = APPS[app];
    window.open(a.url(text), '_blank', 'noopener');
    close();
    if (text) toast(a.prefill ? `پیام آماده در ${a.name} نوشته شده؛ در صورت تمایل چیزی اضافه کنید و ارسال بزنید` : `در چت ${a.name}، کادر پیام را نگه دارید و «چسباندن» را بزنید`);
  }
  function go(app, text) {
    const a = APPS[app];
    const copied = text ? copySync(text) : false;
    // پیام‌رسانی که متن آماده را در کادر نمی‌گذارد (بله): اول راهنما، بعد باز کردن چت
    if (text && !a.prefill && text !== GREETING) return showSteps(app, text, copied);
    launch(app, text, copied);
  }
  function showSteps(app, text, copied) {
    const a = APPS[app];
    if (!sheet) build();
    pending = text;
    sheet.querySelector('.cs-card').innerHTML = `
      <button class="cs-x" type="button" data-cs-close aria-label="بستن">×</button>
      <div class="cs-ok">${a.icon}<span>${copied ? 'متن پیام کپی شد ✓' : 'متن پیام آماده است'}</span></div>
      <ol class="cs-steps">
        <li>روی «باز کردن ${a.name}» بزنید.</li>
        <li>در چت، <b>انگشتتان را روی کادر پیام نگه دارید</b> و <b>«چسباندن»</b> را بزنید.</li>
        <li>اگر خواستید چیزی اضافه کنید و <b>ارسال</b> را بزنید.</li>
      </ol>
      <pre class="cs-preview" dir="rtl">${text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</pre>
      <button class="cs-go cs-go-${app}" type="button" data-cs-go="${app}">باز کردن ${a.name}</button>`;
    sheet.hidden = false;
    const btn = sheet.querySelector('[data-cs-go]'); btn && btn.focus();
  }


  let sheet, pending = '';
  function build() {
    sheet = document.createElement('div');
    sheet.className = 'contact-sheet'; sheet.hidden = true;
    sheet.innerHTML = `<div class="cs-backdrop" data-cs-close></div>
      <div class="cs-card" role="dialog" aria-modal="true" aria-labelledby="csTitle"></div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => {
      const g = e.target.closest('[data-cs-go]');
      if (g) { const c = pending ? copySync(pending) : false; return launch(g.dataset.csGo, pending, c); }
      const b = e.target.closest('[data-cs-app]');
      if (b) return go(b.dataset.csApp, pending);
      if (e.target.closest('[data-cs-close]')) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
  function chooser() {
    sheet.querySelector('.cs-card').innerHTML = `
        <button class="cs-x" type="button" data-cs-close aria-label="بستن">×</button>
        <p class="cs-title" id="csTitle">ارسال پیام از طریق</p>
        <div class="cs-apps">${enabled().map(k => `<button type="button" class="cs-app cs-${k}" data-cs-app="${k}">${APPS[k].icon}<span>${APPS[k].name}</span></button>`).join('')}</div>
        <p class="cs-hint">متن پیام آماده می‌شود و چت فروشگاه باز می‌شود.</p>`;
  }
  function close() { if (sheet) sheet.hidden = true; }

  // باز کردن انتخاب پیام‌رسان (یا مستقیم بله اگر فقط بله تنظیم شده باشد)
  function open(text = '') {
    const apps = enabled();
    if (apps.length === 1) return go(apps[0], text);
    if (!sheet) build();
    chooser();
    pending = text; sheet.hidden = false;
    const first = sheet.querySelector('[data-cs-app]'); first && first.focus();
  }

  // هر لینک/دکمه‌ای با data-contact این پنجره را باز می‌کند
  const GREETING = 'سلام، وقت بخیر 🤍';
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-contact]');
    if (!el) return;
    e.preventDefault();
    open(el.dataset.contact || GREETING);
  });

  return { open, toast };
})();
