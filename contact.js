// راه‌های ارتباط با فروشگاه (سفارش و مشاوره)
// ⚙️ فقط همین دو خط را تغییر دهید. آیدی‌ها هیچ‌جای سایت نمایش داده نمی‌شوند.
// اگر telegram خالی باشد، دکمه‌ها مستقیم چت بله را باز می‌کنند.
window.SW_CONTACT = (() => {
  'use strict';
  const CFG = {
    bale: 'mehii773',
    telegram: '',
  };

  const APPS = {
    bale: {
      name: 'بله',
      url: () => `https://ble.ir/${CFG.bale}`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#00A884"/><path d="M7 7.2h5.1c2 0 3.2 1 3.2 2.5 0 1-.6 1.8-1.5 2.1 1.2.3 2 1.2 2 2.4 0 1.8-1.4 2.9-3.6 2.9H7z" fill="#fff"/></svg>',
    },
    telegram: {
      name: 'تلگرام',
      url: text => `https://t.me/${CFG.telegram}${text ? `?text=${encodeURIComponent(text)}` : ''}`,
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

  function go(app, text) {
    const a = APPS[app];
    const copied = text ? copySync(text) : false;
    window.open(a.url(text), '_blank', 'noopener');
    close();
    if (text) toast(copied ? `متن پیام کپی شد؛ اگر در چت ${a.name} نوشته نشده بود، «جای‌گذاری» و ارسال کنید` : `چت ${a.name} باز شد؛ پیامتان را بنویسید`);
  }

  let sheet, pending = '';
  function build() {
    sheet = document.createElement('div');
    sheet.className = 'contact-sheet'; sheet.hidden = true;
    sheet.innerHTML = `<div class="cs-backdrop" data-cs-close></div>
      <div class="cs-card" role="dialog" aria-modal="true" aria-labelledby="csTitle">
        <button class="cs-x" type="button" data-cs-close aria-label="بستن">×</button>
        <p class="cs-title" id="csTitle">ارسال پیام از طریق</p>
        <div class="cs-apps">${enabled().map(k => `<button type="button" class="cs-app cs-${k}" data-cs-app="${k}">${APPS[k].icon}<span>${APPS[k].name}</span></button>`).join('')}</div>
        <p class="cs-hint">متن پیام آماده و کپی می‌شود و چت فروشگاه باز می‌شود.</p>
      </div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-cs-app]');
      if (b) return go(b.dataset.csApp, pending);
      if (e.target.closest('[data-cs-close]')) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
  function close() { if (sheet) sheet.hidden = true; }

  // باز کردن انتخاب پیام‌رسان (یا مستقیم بله اگر فقط بله تنظیم شده باشد)
  function open(text = '') {
    const apps = enabled();
    if (apps.length === 1) return go(apps[0], text);
    if (!sheet) build();
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
