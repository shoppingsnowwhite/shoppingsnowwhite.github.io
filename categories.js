// دسته‌بندی دو سطحی محصولات — منبع واحد برای سایت، ربات بله و ساخت نسخه استاتیک
// برای افزودن دسته جدید فقط همین فایل را ویرایش کنید.
(function (root) {
  'use strict';
  // گروه‌های اصلی
  const GROUPS = [
    { id: 'skincare', name: 'مراقبت پوست', en: 'Skincare' },
    { id: 'haircare', name: 'مراقبت مو', en: 'Haircare' },
    { id: 'cosmetics', name: 'آرایشی', en: 'Makeup' },
  ];

  // زیردسته‌ها (به ترتیب نمایش در سایت)
  // icon: تصویر جایگزین وقتی محصول عکس ندارد (img/cat-*.svg)
  const CATEGORIES = [
    { id: 'cleanser', group: 'skincare', name: 'شوینده', icon: 'cleanser', words: ['شوینده', 'فوم', 'ژل شستشو', 'cleanser', 'cleansing', 'پاک‌کننده', 'پاک کننده', 'میسلار'] },
    { id: 'peeling', group: 'skincare', name: 'لایه‌بردار', icon: 'peeling', words: ['پیلینگ', 'لایه‌بردار', 'لایه بردار', 'peeling', 'exfol', 'اسکراب', 'scrub'] },
    { id: 'toner', group: 'skincare', name: 'تونر', icon: 'serum', words: ['تونر', 'toner'] },
    { id: 'serum', group: 'skincare', name: 'سرم و اسنس', icon: 'serum', words: ['سرم', 'آمپول', 'اسنس', 'serum', 'essence', 'ampoule'] },
    { id: 'eye', group: 'skincare', name: 'دور چشم', icon: 'cream', words: ['دور چشم', 'دورچشم', 'زیر چشم', 'eye cream', 'eye serum'] },
    { id: 'cream', group: 'skincare', name: 'کرم و مرطوب‌کننده', icon: 'cream', words: ['کرم', 'مرطوب‌کننده', 'مرطوب کننده', 'cream', 'moistur', 'لوسیون'] },
    { id: 'mask', group: 'skincare', name: 'ماسک صورت', icon: 'mask', words: ['ماسک صورت', 'شیت ماسک', 'sheet mask', 'ماسک', 'mask'] },
    { id: 'sunscreen', group: 'skincare', name: 'ضدآفتاب', icon: 'sunscreen', words: ['ضدآفتاب', 'ضد آفتاب', 'spf', 'sun stick', 'sun serum', 'sun cream'] },
    { id: 'lip-care', group: 'skincare', name: 'مراقبت لب', icon: 'cream', words: ['بالم لب', 'لیپ بالم', 'مراقبت لب', 'ماسک لب', 'ترک لب', 'lip balm', 'lip mask', 'lip care', 'medicated lip', 'lipstick xd'] },
    { id: 'hair-oil', group: 'haircare', name: 'روغن و سرم مو', icon: 'hair', words: ['روغن آرگان', 'روغن مو', 'سرم مو', 'hair oil', 'argan'] },
    { id: 'hair-treatment', group: 'haircare', name: 'ترینتمنت و ماسک مو', icon: 'hair', words: ['ترینتمنت', 'هدسپا', 'ماسک مو', 'hair treatment', 'hair mask', 'headspa'] },
    { id: 'shampoo', group: 'haircare', name: 'شامپو و نرم‌کننده', icon: 'hair', words: ['شامپو', 'نرم‌کننده مو', 'نرم کننده مو', 'shampoo', 'conditioner'] },
    { id: 'makeup-eye', group: 'cosmetics', name: 'آرایش چشم', icon: 'makeup', words: ['پلت', 'سایه چشم', 'پالت', 'ریمل', 'خط چشم', 'palette', 'eyeshadow', 'mascara', 'eyeliner'] },
    { id: 'makeup-lip', group: 'cosmetics', name: 'آرایش لب', icon: 'makeup', words: ['رژ لب', 'رژلب', 'تینت', 'lip tint', 'lipstick', 'lip gloss'] },
    { id: 'makeup-face', group: 'cosmetics', name: 'آرایش صورت', icon: 'makeup', words: ['کوشن', 'کرم پودر', 'کانسیلر', 'پنکک', 'رژگونه', 'cushion', 'foundation', 'concealer', 'blush'] },
    { id: 'other', group: null, name: 'سایر محصولات', icon: 'other', words: [] },
  ];

  // ترتیب تشخیص خودکار از متن پست (دقیق‌ترها اول؛ مثلاً «کرم دور چشم» قبل از «کرم»)
  const DETECT_ORDER = ['lip-care', 'makeup-eye', 'eye', 'hair-treatment', 'hair-oil', 'shampoo', 'sunscreen', 'peeling', 'cleanser',
    'toner', 'serum', 'mask', 'makeup-lip', 'makeup-face', 'cream'];

  // شناسه‌های قدیمی → جدید
  const ALIASES = { hair: 'hair-oil', makeup: 'makeup-face' };

  const byId = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
  const norm = id => (byId[id] ? id : byId[ALIASES[id]] ? ALIASES[id] : 'other');
  const cat = id => byId[norm(id)];
  const group = id => GROUPS.find(g => g.id === id) || null;
  const groupOf = id => cat(id).group;

  const api = { GROUPS, CATEGORIES, DETECT_ORDER, ALIASES, norm, cat, group, groupOf };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SW_CATS = api;
})(typeof window !== 'undefined' ? window : globalThis);
