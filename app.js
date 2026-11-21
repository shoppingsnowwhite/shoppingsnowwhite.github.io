(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fa = n => Number(n).toLocaleString('fa-IR');
  const faD = s => String(s ?? '').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let config = {
    shopName: 'سفیدبرفی', channelUrl: 'https://ble.ir/shopping_snowwhite',
    city: 'بابل',
  };
  let products = [];
  let isStatic = !!document.querySelector('meta[name="sw-static"]'); // روی گیت‌هاب پیجز API نداریم
  const SW = window.SW_CATS;
  const state = { group: 'all', cat: '', q: '', sort: 'new', inStock: false };
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('sw-cart') || '{}'); } catch {}

  const catName = id => SW.cat(id).name;
  const groupName = id => (SW.group(SW.groupOf(id)) || {}).name || '';
  const placeholder = p => `img/cat-${SW.cat(p.category).icon}.svg`;
  const cover = p => (p.images && p.images[0]) || placeholder(p);
  // نام فارسی و برند (برای محصولاتی که ربات از کانال اضافه کرده)
  const faTitle = p => (p.title || '').split('|').map(s => s.trim()).find(s => /[\u0600-\u06FF]/.test(s)) || p.title;
  const enName = p => p.nameEn || (p.title || '').split('|').map(s => s.trim()).find(s => /^[A-Za-z0-9]/.test(s)) || '';
  const brandOf = p => p.brand || (enName(p).match(/^[A-Z0-9][A-Z0-9 &.-]+(?=\s|$)/) || [''])[0].trim();

  // ---------- Toast & clipboard ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3400);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch {}
      ta.remove(); return ok;
    }
  }
  // سفارش و مشاوره: انتخاب بله یا تلگرام (contact.js)
  const sendToBale = text => window.SW_CONTACT.open(text);

  // ---------- Price ----------
  const discount = p => (p.price && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
  const isNew = p => Date.now() - new Date(p.postDate || p.createdAt || 0).getTime() < 10 * 864e5;
  function priceHTML(p) {
    if (p.soldOut) return `<p class="price ask">ناموجود</p>`;
    if (!p.price) return `<p class="price ask">استعلام قیمت</p>`;
    return `<p class="price">${fa(p.price)} <small>تومان</small>${p.oldPrice ? `<del>${fa(p.oldPrice)}</del>` : ''}</p>`;
  }

  // ---------- Render ----------
  function renderTabs() {
    const base = products.filter(p => !state.inStock || !p.soldOut);
    const counts = base.reduce((m, p) => (m[p.category] = (m[p.category] || 0) + 1, m), {});
    const gCount = g => base.filter(p => SW.groupOf(p.category) === g).length;
    const groups = SW.GROUPS.filter(g => gCount(g.id) || state.group === g.id);
    const tab = (id, name, n) => `<button class="tab ${state.group === id ? 'active' : ''}" data-group="${id}" role="tab" aria-selected="${state.group === id}">${esc(name)}<span class="n">${fa(n)}</span></button>`;
    $('#chips').innerHTML = tab('all', 'همه محصولات', base.length) + groups.map(g => tab(g.id, g.name, gCount(g.id))).join('');
    const sub = $('#subchips');
    const subs = state.group === 'all' ? [] : SW.CATEGORIES.filter(c => c.group === state.group && (counts[c.id] || state.cat.split(',').includes(c.id)));
    sub.hidden = subs.length < 1;
    sub.innerHTML = `<button class="chip ${!state.cat ? 'on' : ''}" data-sub="">همه</button>` +
      subs.map(c => `<button class="chip ${state.cat === c.id ? 'on' : ''}" data-sub="${c.id}">${esc(c.name)}<span class="n">${fa(counts[c.id] || 0)}</span></button>`).join('');
    const on = sub.querySelector('.chip.on[data-sub]:not([data-sub=""])');
    if (on && sub.scrollWidth > sub.clientWidth) sub.scrollLeft += on.getBoundingClientRect().left - sub.getBoundingClientRect().left - (sub.clientWidth - on.offsetWidth) / 2;
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    const cats = state.cat ? state.cat.split(',') : null;
    let list = products.filter(p => (!state.inStock || !p.soldOut) &&
      (cats ? cats.includes(p.category) : state.group === 'all' || SW.groupOf(p.category) === state.group) &&
      (!q || [p.title, p.nameEn, p.brand, p.summary, p.description, catName(p.category), groupName(p.category)].join(' ').toLowerCase().includes(q)));
    const by = {
      new: (a, b) => new Date(b.postDate || b.createdAt || 0) - new Date(a.postDate || a.createdAt || 0),
      cheap: (a, b) => (a.price || 9e15) - (b.price || 9e15),
      expensive: (a, b) => (b.price || 0) - (a.price || 0),
      discount: (a, b) => discount(b) - discount(a) || Number(!!b.badge) - Number(!!a.badge),
    }[state.sort];
    return list.sort(by).sort((a, b) => Number(!!a.soldOut) - Number(!!b.soldOut));
  }

  function cardHTML(p, i) {
    const d = discount(p);
    const badges = [
      p.soldOut && `<span class="badge out">ناموجود</span>`,
      d && `<span class="badge off">${fa(d)}٪ تخفیف</span>`,
      p.badge && `<span class="badge">${esc(p.badge)}</span>`,
      !p.soldOut && !p.badge && !d && isNew(p) && `<span class="badge">جدید</span>`,
    ].filter(Boolean).join('');
    const inCart = cart[p.id];
    const brand = brandOf(p);
    return `
      <article class="card ${p.soldOut ? 'soldout' : ''}" data-id="${esc(p.id)}" style="animation-delay:${Math.min(i, 12) * 60}ms">
        <div class="card-media">
          <img src="${esc(cover(p))}" alt="${esc(faTitle(p))}" loading="lazy" data-fallback="${placeholder(p)}" />
          <div class="badges">${badges}</div>
          ${p.soldOut ? '' : `<button class="quick ${inCart ? 'in' : ''}" data-add="${esc(p.id)}">${inCart ? 'در سبد شما ✓' : 'افزودن به سبد'}</button>`}
        </div>
        <div class="card-body">
          ${brand ? `<span class="c-brand">${esc(brand)}</span>` : ''}
          <h3>${p.url ? `<a href="${esc(p.url)}">${esc(faTitle(p))}</a>` : esc(faTitle(p))}</h3>
          <span class="c-cat">${esc(catName(p.category))}${p.volume ? ' · ' + esc(faD(p.volume)) : ''}</span>
          ${priceHTML(p)}
        </div>
      </article>`;
  }

  function renderGrid() {
    const list = filtered();
    $('#grid').innerHTML = list.map(cardHTML).join('');
    $('#empty').hidden = list.length > 0;
    $('#resultCount').textContent = `${fa(list.length)} محصول${state.inStock ? ' موجود' : ''}`;
    $('#empty p').textContent = state.inStock && !state.q ? 'در این دسته فعلاً محصول موجودی نداریم — برای اطلاع از شارژ بعدی پیام دهید.' : 'محصولی با این مشخصات پیدا نشد.';
  }

  // تصویر خراب → جایگزین
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.dataset.fallback && !img.src.includes(img.dataset.fallback)) img.src = img.dataset.fallback;
  }, true);
  // تصاویر خارجی که بارگذاری نمی‌شوند → جایگزین بعد از چند ثانیه
  setInterval(() => {
    $$('img[data-fallback]').forEach(img => {
      if (img.src.startsWith(location.origin) || img.src.startsWith('data:')) return;
      const t = Number(img.dataset.t || 0) || (img.dataset.t = Date.now());
      if ((!img.complete || !img.naturalWidth) && Date.now() - t > 5000) img.src = img.dataset.fallback;
    });
  }, 1500);

  // ---------- Modal ----------
  let current = null;
  function openModal(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    current = p;
    const imgs = p.images && p.images.length ? p.images : [placeholder(p)];
    const main = $('#mImg');
    main.src = imgs[0]; main.alt = faTitle(p); main.dataset.fallback = placeholder(p); delete main.dataset.t;
    $('#mThumbs').innerHTML = imgs.length > 1
      ? imgs.map((src, i) => `<img src="${esc(src)}" class="${i ? '' : 'on'}" data-fallback="${placeholder(p)}" alt="" />`).join('') : '';
    $('#mBrand').textContent = brandOf(p);
    $('#mTitle').textContent = faTitle(p);
    $('#mEn').textContent = enName(p);
    $('#mPrice').innerHTML = priceHTML(p);
    $('#mMeta').innerHTML = [groupName(p.category), catName(p.category), p.volume && faD(p.volume), p.origin && `ساخت ${p.origin}`, p.badge, discount(p) && `${fa(discount(p))}٪ تخفیف`]
      .filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('');
    const feats = p.features || [];
    $('#mFeatures').innerHTML = feats.map(f => `<li>${esc(f)}</li>`).join('');
    $('#mFeatures').closest('details').hidden = !feats.length;
    const usage = p.usage || [];
    $('#mUsage').innerHTML = usage.map(u => `<li>${esc(u)}</li>`).join('');
    $('#mUsage').closest('details').hidden = !usage.length;
    $('#mDesc').innerHTML = String(p.description || p.summary || '').split(/\n+/).filter(Boolean).map(x => `<p>${esc(x)}</p>`).join('');
    const post = $('#mPost');
    post.href = p.postUrl || config.channelUrl;
    post.innerHTML = (/instagram\.com/.test(post.href) ? 'مشاهده پست در اینستاگرام' : 'مشاهده در کانال بله') + ' <span>←</span>';
    const full = $('#mFull'); if (full) { full.hidden = !p.url; if (p.url) full.href = p.url; }
    $('#mOrder').textContent = p.soldOut ? 'خبرم کن وقتی موجود شد' : 'ثبت سفارش';
    $('#mAdd').hidden = !!p.soldOut;
    $('#mAdd').textContent = cart[p.id] ? 'در سبد شما ✓' : 'افزودن به سبد';
    $('#modal').hidden = false;
    $('.modal-card').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    history.replaceState(null, '', '#p=' + encodeURIComponent(p.id));
  }
  function closeModal() {
    if ($('#modal').hidden) return;
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    if (location.hash.startsWith('#p=')) history.replaceState(null, '', location.pathname + location.search);
  }

  // ---------- Cart ----------
  function saveCart() {
    try { localStorage.setItem('sw-cart', JSON.stringify(cart)); } catch {}
    const n = Object.keys(cart).filter(id => !products.length || products.some(p => p.id === id)).reduce((a, id) => a + cart[id], 0);
    const el = $('#cartCount');
    el.textContent = fa(n);
    el.hidden = n === 0;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }
  function addToCart(id) {
    const p = products.find(x => x.id === id);
    if (!p || p.soldOut) return;
    cart[id] = (cart[id] || 0) + 1;
    saveCart(); renderGrid();
    toast(`«${faTitle(p)}» به سبد اضافه شد`);
  }
  function renderCart() {
    const ids = Object.keys(cart).filter(id => products.some(p => p.id === id));
    const box = $('#cartItems');
    if (!ids.length) {
      box.innerHTML = `<div class="cart-empty"><svg viewBox="0 0 24 24"><path d="M5.5 8h13l-1 12h-11z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg><p>سبد سفارش شما خالی است.</p><a href="#shop" class="link-arrow" data-close-drawer>مشاهده محصولات <span>←</span></a></div>`;
      $('#cartTotal').textContent = '—'; $('#cartNote').textContent = ''; $('#checkout').disabled = true;
      return;
    }
    $('#checkout').disabled = false;
    let total = 0, unpriced = 0;
    box.innerHTML = ids.map(id => {
      const p = products.find(x => x.id === id);
      if (p.price) total += p.price * cart[id]; else unpriced++;
      return `<div class="ci">
        <span class="ci-img"><img src="${esc(cover(p))}" data-fallback="${placeholder(p)}" alt="" /></span>
        <div class="ci-info">${brandOf(p) ? `<em>${esc(brandOf(p))}</em>` : ''}<b>${esc(faTitle(p))}</b><small>${p.price ? fa(p.price) + ' تومان' : 'استعلام قیمت'}</small></div>
        <div class="qty"><button data-inc="${esc(id)}" aria-label="افزایش">+</button><span>${fa(cart[id])}</span><button data-dec="${esc(id)}" aria-label="کاهش">−</button></div>
      </div>`;
    }).join('');
    $('#cartTotal').textContent = total ? `${fa(total)} تومان` : 'استعلامی';
    $('#cartNote').textContent = unpriced ? `قیمت ${fa(unpriced)} محصول پس از استعلام اعلام می‌شود. هزینه ارسال جداگانه است.` : 'هزینه ارسال پس از ثبت سفارش اعلام می‌شود.';
  }
  function openDrawer() { renderCart(); $('#drawer').hidden = false; document.body.style.overflow = 'hidden'; }
  function closeDrawer() { $('#drawer').hidden = true; document.body.style.overflow = ''; }
  function cartMessage() {
    const lines = Object.keys(cart).map(id => products.find(x => x.id === id)).filter(Boolean)
      .map((p, i) => `${fa(i + 1)}. ${faTitle(p)}${brandOf(p) ? ` (${brandOf(p)})` : ''} — ${fa(cart[p.id])} عدد${p.price ? ` — ${fa(p.price)} تومان` : ''}`);
    return `سلام، وقت بخیر\nمی‌خواستم این محصولات رو از سایت سفیدبرفی سفارش بدم:\n\n${lines.join('\n')}\n\nلطفاً قیمت نهایی و هزینه ارسال رو اعلام کنید. ممنون 🤍`;
  }

  // ---------- Events ----------
  // فیلتر: cat = یک یا چند زیردسته (با کاما)، group = گروه اصلی
  function setFilter(cat, group) {
    cat = (cat || '').split(',').filter(Boolean).map(SW.norm).join(',');
    state.cat = cat;
    state.group = group || (cat ? SW.groupOf(cat.split(',')[0]) || 'all' : 'all');
    renderTabs(); renderGrid();
  }
  function goShop(cat, group) {
    setFilter(cat, group);
    $('#shop').scrollIntoView({ behavior: 'smooth' });
  }
  document.addEventListener('click', e => {
    const t = e.target;
    const add = t.closest('[data-add]');
    if (add) { e.stopPropagation(); return addToCart(add.dataset.add); }
    const tab = t.closest('.tab[data-group]');
    if (tab) return setFilter('', tab.dataset.group);
    const chip = t.closest('.chip[data-sub]');
    if (chip) return setFilter(chip.dataset.sub === state.cat ? '' : chip.dataset.sub, state.group);
    const step = t.closest('.steps li');
    if (step) {
      const c = step.dataset.cat;
      const has = products.some(p => c.split(',').includes(p.category));
      if (!has) { toast(`محصولات «${step.querySelector('b').textContent}» به‌زودی — برای مشاوره پیام دهید`); return goShop(''); }
      return goShop(c);
    }
    const card = t.closest('.card');
    if (card) { e.preventDefault(); return openModal(card.dataset.id); }
    if (t.closest('[data-close]')) return closeModal();
    if (t.closest('[data-close-drawer]')) return closeDrawer();
    const thumb = t.closest('.m-thumbs img');
    if (thumb) { $('#mImg').src = thumb.src; $$('.m-thumbs img').forEach(i => i.classList.toggle('on', i === thumb)); return; }
    const inc = t.closest('[data-inc]'), dec = t.closest('[data-dec]');
    if (inc) { cart[inc.dataset.inc]++; saveCart(); renderGrid(); return renderCart(); }
    if (dec) { const id = dec.dataset.dec; if (--cart[id] <= 0) delete cart[id]; saveCart(); renderGrid(); return renderCart(); }
    if (t.closest('.mobile-menu a')) $('#mobileMenu').hidden = true;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });

  $('#cartBtn').addEventListener('click', openDrawer);
  $('#menuBtn').addEventListener('click', () => { $('#mobileMenu').hidden = !$('#mobileMenu').hidden; });
  $('#searchBtn').addEventListener('click', () => { $('#shop').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#search').focus(), 500); });
  $('#checkout').addEventListener('click', () => sendToBale(cartMessage()));
  $('#mAdd').addEventListener('click', () => { if (current) { addToCart(current.id); $('#mAdd').textContent = 'در سبد شما ✓'; } });
  $('#mOrder').addEventListener('click', () => {
    if (!current) return;
    const name = `${faTitle(current)}${brandOf(current) ? ` (${brandOf(current)})` : ''}`;
    sendToBale(current.soldOut
      ? `سلام، وقت بخیر\nلطفاً وقتی «${name}» موجود شد به من خبر بدید. ممنون 🤍`
      : `سلام، وقت بخیر\nمی‌خواستم «${name}» رو سفارش بدم.\nلطفاً قیمت و شرایط ارسال رو بفرمایید. ممنون 🤍`);
  });

  let qTimer;
  $('#search').addEventListener('input', e => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; renderGrid(); }, 150); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
  $('#inStock').addEventListener('change', e => { state.inStock = e.target.checked; renderTabs(); renderGrid(); });

  $$('.opts').forEach(group => group.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (!group.classList.contains('multi')) $$('button', group).forEach(x => x !== b && x.classList.remove('on'));
    b.classList.toggle('on');
  }));
  $('#consultForm').addEventListener('submit', e => {
    e.preventDefault();
    const skin = $$('[data-name="skin"] .on').map(b => b.textContent)[0];
    const concerns = $$('[data-name="concern"] .on').map(b => b.textContent);
    const note = $('#consultNote').value.trim();
    if (!skin && !concerns.length && !note) return toast('لطفاً نوع پوست یا دغدغه‌تان را انتخاب کنید');
    sendToBale(['سلام، وقت بخیر 🤍 برای انتخاب محصول مشاوره می‌خواستم.',
      skin && `نوع پوست: ${skin}`, concerns.length && `دغدغه‌ها: ${concerns.join('، ')}`, note && `توضیح: ${note}`]
      .filter(Boolean).join('\n'));
  });

  // نمایش تدریجی بخش‌ها هنگام اسکرول
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .12 }) : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  function handleHash() {
    const h = decodeURIComponent(location.hash);
    if (h.startsWith('#p=')) openModal(h.slice(3));
    else if (h === '#cart') { history.replaceState(null, '', location.pathname); closeModal(); openDrawer(); }
    else if (h.startsWith('#cat=')) { history.replaceState(null, '', location.pathname); closeModal(); closeDrawer(); goShop(h.slice(5)); }
    else if (h.startsWith('#group=')) { history.replaceState(null, '', location.pathname); closeModal(); closeDrawer(); goShop('', h.slice(7)); }
  }
  window.addEventListener('hashchange', () => { if (products.length) handleHash(); });

  // ---------- Load ----------
  function applyConfig() {
    $('#cityName').textContent = config.city;
    ['#joinBtn', '#footChannel'].forEach(s => $(s).href = config.channelUrl);
    $('#year').textContent = new Date().toLocaleDateString('fa-IR', { year: 'numeric' });
  }

  async function loadProducts(first) {
    try {
      let data;
      if (!isStatic) {
        try {
          const res = await fetch('api/products', { cache: 'no-store' });
          if (!res.ok) throw 0;
          data = await res.json();
        } catch { isStatic = true; }
      }
      if (isStatic) {
        const res = await fetch('products.json', { cache: 'no-store' });
        data = await res.json();
      }
      const before = new Set(products.map(p => p.id));
      const added = !first && data.filter(p => !before.has(p.id));
      products = data.map(p => ({ ...p, category: SW.norm(p.category) }));
      renderTabs(); renderGrid(); saveCart();
      if (added && added.length) toast(`${fa(added.length)} محصول جدید اضافه شد`);
      if (first) handleHash();
    } catch {
      if (first) $('#grid').innerHTML = '<p class="empty">خطا در بارگذاری محصولات. لطفاً صفحه را دوباره باز کنید.</p>';
    }
  }

  if (!$('#grid').children.length) $('#grid').innerHTML = Array.from({ length: 4 }, () => '<div class="card skeleton"><div class="card-media"></div><div class="bar"></div><div class="bar" style="width:40%"></div></div>').join('');
  applyConfig();
  if (!isStatic) fetch('api/config').then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(c => { config = { ...config, ...c }; applyConfig(); renderTabs(); renderGrid(); })
    .catch(() => {});
  loadProducts(true);
  setInterval(() => loadProducts(false), 90000);
})();
