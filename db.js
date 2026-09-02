/* ============================================================
   SushiЮ — звʼязок з адмінкою arawebsite (Supabase)

   Меню, розділи, заклади й дрібні тексти власник міняє в адмінці,
   сайт тягне їх звідти й перемальовується.

   Якщо база недоступна — нічого страшного: усе вбудоване в data.js
   уже на екрані, сайт працює далі. Тому цей файл підключається
   ОСТАННІМ і нічого не ламає, якщо не завантажиться.
   ============================================================ */
(function () {
'use strict';

const DB_URL  = 'https://ortiatyxntdikaldepbp.supabase.co/rest/v1';
const DB_KEY  = 'sb_publishable_UW1Z8ukEU1XWVCdQxIGkDw_firK4hpO'; // публічний ключ лише на читання
const SITE_ID = 101;                                              // SushiЮ у базі платформи

const str  = v => (v == null ? '' : String(v).trim());
const num  = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
const tel  = d => { const x = str(d).replace(/\D/g, ''); return x ? '+38' + x.replace(/^38/, '') : ''; };

Promise.all([
  fetch(DB_URL + '/items?site_id=eq.' + SITE_ID +
        '&collection=in.(menu,cats,points,site_photos)&order=sort_order' +
        '&select=id,collection,title,price,image_url,extra,sort_order', {headers:{apikey:DB_KEY}}),
  fetch(DB_URL + '/texts?site_id=eq.' + SITE_ID + '&select=key,value', {headers:{apikey:DB_KEY}})
])
.then(rs => Promise.all(rs.map(r => r.ok ? r.json() : [])))
.then(([items, texts]) => {
  if (!Array.isArray(items) || !items.length) return;   // база порожня — лишаємо вбудоване

  const T = {};
  (texts || []).forEach(t => { T[t.key] = str(t.value); });

  const of = c => items.filter(i => i.collection === c);

  /* ---------- розділи ---------- */
  const cats = of('cats')
    .map(i => {
      const c = {id: str((i.extra || {}).catkey), n: str(i.title)};
      if (str(i.image_url)) c.img = str(i.image_url);   /* фото для банера на головній */
      return c;
    })
    .filter(c => c.id && c.n);
  if (cats.length){
    CATS.length = 0;
    cats.forEach(c => CATS.push(c));
  }

  /* ---------- страви ---------- */
  const rows = of('menu');
  const menu = rows.map((i, k) => {
    const e = i.extra || {};
    const m = {
      id:  'db' + i.id,
      c:   str(e.cat),
      n:   str(i.title),
      p:   num(i.price),
      ing: str(e.d),
      w:   str(e.w),          /* вага чи кількість — необовʼязково */
      /* порядок — той, у якому картки стоять в адмінці (перетягуванням) */
      pop: rows.length - k
    };
    if (e.neu === true || e.neu === 'true') m.b = 'Новинка';
    if (str(i.image_url)) m.img = str(i.image_url);
    return m;
  }).filter(m => m.n && m.p);
  if (menu.length){
    MENU.length = 0;
    menu.forEach(m => MENU.push(m));

    /* У кошику могли лишитись позиції зі старого меню — їхні номери вже
       нічому не відповідають. Прибираємо, інакше лічильник блимав би
       на кожному оновленні: спершу рахує старе, потім бачить, що його нема. */
    if (typeof cart === 'object' && cart){
      let changed = false;
      Object.keys(cart).forEach(id => {
        if (!MENU.filter(m => m.id === id)[0]){ delete cart[id]; changed = true; }
      });
      if (changed && typeof saveCart === 'function') saveCart();
    }
  }

  /* ---------- заклади ---------- */
  const pts = of('points').map(i => {
    const e = i.extra || {};
    const name = str(i.title);
    const addr = str(e.addr);
    const tels = [];
    if (str(e.tel1)) tels.push({d: str(e.tel1), t: tel(e.tel1)});
    if (str(e.tel2)) tels.push({d: str(e.tel2), t: tel(e.tel2)});

    /* пороги доставки: три щаблі, як і у вбудованих даних */
    const free = num(e.free_from), mid = num(e.mid_from);
    const midP = num(e.mid_price), lowP = num(e.low_price);
    const money = v => v.toLocaleString('uk-UA') + ' ₴';
    const delivery = [];
    /* кожен рядок зʼявляється, тільки якщо його суми заповнені в адмінці:
       порожні поля означають «такого порогу немає», а не нульову доставку */
    if (free > 0) delivery.push({from: free, price: 0, t: 'Сума від ' + money(free) + ' — доставка безкоштовна'});
    if (mid > 0 && midP > 0) delivery.push({from: mid + 1, price: midP, t: 'Сума від ' + money(mid) + ' — доставка ' + money(midP)});
    if (lowP > 0) delivery.push({from: 0, price: lowP, t: mid > 0
      ? 'Сума до ' + money(mid) + ' — доставка ' + money(lowP)
      : 'Доставка ' + money(lowP)});

    return {
      id:    str(e.pkey) || 'p' + i.id,
      n:     name,
      addr:  addr,
      full:  addr ? name + ', ' + addr : name,
      map:   str(e.map) || 'https://maps.google.com/?q=' + encodeURIComponent(name + ' ' + addr),
      hours: str(e.hours),
      tels:  tels.length ? tels : [{d: '', t: ''}],
      delivery: delivery,
      note:  str(e.note)
    };
  }).filter(p => p.n && p.tels[0].d);
  if (pts.length){
    POINTS.length = 0;
    pts.forEach(p => POINTS.push(p));
  }

  /* ---------- фото плиток на головній ---------- */
  /* слот bnr-phil → розділ phil; фото лягає на плитку під заголовком */
  of('site_photos').forEach(i => {
    const slot = str((i.extra || {}).slot);
    const url  = str(i.image_url);
    if (slot.indexOf('bnr-') !== 0 || !url) return;
    const cat = CATS.filter(c => c.id === slot.slice(4))[0];
    if (cat) cat.img = url;
  });

  /* ---------- дрібні тексти ---------- */
  const lead = document.querySelector('.hero .lead');
  if (lead && T.slogan) lead.textContent = T.slogan;

  const tick = document.querySelector('.ticker-in');
  if (tick && T.ticker){
    const parts = T.ticker.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    if (parts.length){
      const row = parts.map(s => '<span>' + s + '</span>').join('');
      tick.innerHTML = row + row;   /* другий прохід — щоб стрічка їхала без розриву */
    }
  }

  const payCard = [].slice.call(document.querySelectorAll('.icard')).filter(
    c => c.querySelector('h3') && c.querySelector('h3').textContent.trim() === 'Оплата')[0];
  if (payCard && T.pay){
    /* кожен спосіб — з нового рядка або через кому */
    const rows = T.pay.split(/[\n,;]/).map(s => s.trim()).filter(Boolean);
    if (rows.length) payCard.querySelector('ul').innerHTML = rows.map(s => '<li>' + s + '</li>').join('');
  }

  /* ---------- посилання на соцмережі ---------- */
  [['ig', 'Instagram'], ['tt', 'TikTok']].forEach(function (pair) {
    const url = T[pair[0]];
    if (!url) return;
    [].slice.call(document.querySelectorAll('a[aria-label="' + pair[1] + '"]'))
      .forEach(function (a) { a.href = url; });
  });

  /* ---------- перемалювати ---------- */
  try { if (typeof renderPickTiles === 'function') renderPickTiles(); } catch (e) {}
  try { if (typeof applyPoint === 'function') applyPoint(); } catch (e) {}
  try { if (typeof refreshMenu === 'function') refreshMenu(); } catch (e) {}
  try { if (typeof renderCart === 'function') renderCart(); } catch (e) {}
})
.catch(() => { /* база не відповіла — сайт лишається на вбудованих даних */ });

})();
