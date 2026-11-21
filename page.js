// اسکریپت سبک صفحات محصول (نسخه استاتیک)
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const P = window.__P || {};
  const fa = n => Number(n).toLocaleString('fa-IR');
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('sw-cart') || '{}'); } catch {}
  const save = () => { try { localStorage.setItem('sw-cart', JSON.stringify(cart)); } catch {} count(); };
  function count() {
    const el = $('#cartCount'); if (!el) return;
    const n = Object.values(cart).reduce((a, b) => a + b, 0);
    el.textContent = fa(n); el.hidden = n === 0;
  }
  let tt;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3400); }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); return ok;
    }
  }
  const home = document.baseURI;
  $('#menuBtn') && $('#menuBtn').addEventListener('click', () => { const m = $('#mobileMenu'); m.hidden = !m.hidden; });
  $('#searchBtn') && $('#searchBtn').addEventListener('click', () => { location.href = home + '#shop'; });
  $('#cartBtn') && $('#cartBtn').addEventListener('click', () => { location.href = home + '#cart'; });

  const add = $('#pAdd');
  if (add) {
    if (cart[P.id]) add.textContent = 'در سبد شما ✓';
    add.addEventListener('click', () => {
      cart[P.id] = (cart[P.id] || 0) + 1; save();
      add.textContent = 'در سبد شما ✓';
      toast(`«${P.title}» به سبد اضافه شد — برای ثبت، سبد بالای صفحه را باز کنید`);
    });
  }
  $('#pOrder') && $('#pOrder').addEventListener('click', () => {
    const name = `${P.title}${P.brand ? ` (${P.brand})` : ''}`;
    const text = P.soldOut
      ? `سلام، وقت بخیر\nلطفاً وقتی «${name}» موجود شد به من خبر بدید. ممنون 🤍`
      : `سلام، وقت بخیر\nمی‌خواستم «${name}» رو سفارش بدم.\nلطفاً قیمت و شرایط ارسال رو بفرمایید. ممنون 🤍\n${location.href}`;
    window.SW_CONTACT.open(text);
  });
  // اشتراک‌گذاری محصول (منوی اشتراک گوشی یا کپی لینک)
  $('#pShare') && $('#pShare').addEventListener('click', async () => {
    const url = location.href.split('#')[0];
    if (navigator.share) { try { await navigator.share({ title: P.title, text: `${P.title} — سفیدبرفی`, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    toast(await copy(url) ? 'لینک محصول کپی شد' : url);
  });
  // نوار خرید چسبان در موبایل: وقتی دکمه‌های اصلی از دید خارج شدند
  const acts = $('.pdp .m-actions'), bar = $('#buyBar');
  if (acts && bar && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => bar.classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(acts);
    bar.querySelector('button').addEventListener('click', () => $('#pOrder').click());
  }
  document.addEventListener('click', e => {
    const th = e.target.closest('.m-thumbs img');
    if (th) { $('#pImg').src = th.src; document.querySelectorAll('.m-thumbs img').forEach(i => i.classList.toggle('on', i === th)); return; }
    const card = e.target.closest('.card');
    if (card && !e.target.closest('a')) { const a = card.querySelector('h3 a'); if (a) location.href = a.href; }
  });
  count();
})();
