/* =========================================================
   SushiЮ — спільна логіка головної та сторінки меню
   ========================================================= */
const $  = s => document.querySelector(s);
const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
const money = v => v.toLocaleString('uk-UA') + ' ₴';
const byId  = id => MENU.filter(m => m.id === id)[0];

/* ---------- малюнок страви для позицій без фото ---------- */
const PAL = {
  'лосос':'#E2724F','тунец':'#B0402F','тунц':'#B0402F','креветк':'#E58A5E','краб':'#E0A06A',
  'вугор':'#8A5A38','вугр':'#8A5A38','авокадо':'#8FA870','огірок':'#9DB57E','огірк':'#9DB57E',
  'чука':'#6F8E5A','сир':'#EFE6D6','крем':'#EFE6D6','ікра':'#E08A3C','масаго':'#E08A3C',
  'тобіко':'#D96A2E','кети':'#E0552E','перець':'#C7523E','салат':'#7E9B63','імбир':'#E4B39A',
  'васабі':'#8FA870','соус':'#A9754A','кола':'#7A4A33','лимонад':'#D9C7AE'
};
const FALLBACK = {
  set:['#E2724F','#EFE6D6','#8FA870','#E08A3C'], phil:['#E2724F','#EFE6D6','#9DB57E'],
  cal:['#E0A06A','#8FA870','#E08A3C'],           bake:['#EFE6D6','#E2724F','#E0A06A'],
  hand:['#E2724F','#7E9B63','#EFE6D6'],          maki:['#E2724F','#9DB57E'],
  nig:['#E2724F','#EDE6DA'],                     add:['#A9754A','#D9C7AE']
};
let artN = 0;
function art(item){
  const ing = ((item.ing || '') + ' ' + item.n).toLowerCase();
  let cols = [];
  for (const k in PAL) if (ing.indexOf(k) > -1 && cols.indexOf(PAL[k]) < 0) cols.push(PAL[k]);
  (FALLBACK[item.c] || ['#E2724F','#EFE6D6']).forEach(c => { if (cols.indexOf(c) < 0) cols.push(c); });
  cols = cols.slice(0, 5);

  const gid  = 'g' + (++artN);
  const seed = item.id.charCodeAt(0) * 7 + item.id.length * 13 + item.p;
  const open = '<svg class="art" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<defs><radialGradient id="' + gid + '" cx="50%" cy="38%" r="62%">' +
    '<stop offset="0" stop-color="#242629"/><stop offset="1" stop-color="#131415"/></radialGradient></defs>' +
    '<rect width="100" height="100" fill="url(#' + gid + ')"/>' +
    '<ellipse cx="50" cy="74" rx="36" ry="7" fill="rgba(0,0,0,.34)"/>';

  if (item.c === 'add'){
    return open +
      '<ellipse cx="50" cy="56" rx="30" ry="18" fill="#EDE6DA"/>' +
      '<ellipse cx="50" cy="55" rx="21" ry="12" fill="' + cols[0] + '"/>' +
      '<ellipse cx="50" cy="56" rx="30" ry="18" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.6"/>' +
      '<ellipse cx="43" cy="50" rx="5" ry="2.4" fill="rgba(255,255,255,.20)"/></svg>';
  }

  const rolls = [[30,62,16.5],[50,45,20],[70,63,15.5]];
  let out = '';
  rolls.forEach((r, i) => {
    const cx = r[0], cy = r[1], rad = r[2];
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="#1A1C1E"/>' +
           '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rad - 2.6).toFixed(1) + '" fill="#EDE6DA"/>';
    const n = 1 + ((seed + i) % 3);
    for (let k = 0; k < n; k++){
      const ang = ((seed * 29 + i * 111 + k * (360 / n)) % 360) * Math.PI / 180;
      const off = n === 1 ? 0 : rad * 0.30;
      out += '<circle cx="' + (cx + Math.cos(ang) * off).toFixed(1) +
             '" cy="' + (cy + Math.sin(ang) * off).toFixed(1) +
             '" r="' + (n === 1 ? rad * 0.46 : rad * 0.30).toFixed(1) +
             '" fill="' + cols[(i + k) % cols.length] + '"/>';
    }
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rad - 1.3).toFixed(1) +
           '" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="1"/>';
  });
  return open + out + '</svg>';
}

/* ---------- пошук: кирилиця ↔ латиниця ---------- */
const FOLD = [
  ['sh','ш'],['ch','ч'],['zh','ж'],['kh','х'],['ts','ц'],['ya','я'],['yu','ю'],['ph','ф'],
  ['a','а'],['b','б'],['c','ц'],['d','д'],['e','е'],['f','ф'],['g','г'],['h','х'],['i','і'],
  ['j','й'],['k','к'],['l','л'],['m','м'],['n','н'],['o','о'],['p','п'],['q','к'],['r','р'],
  ['s','с'],['t','т'],['u','у'],['v','в'],['w','в'],['x','кс'],['y','и'],['z','з']
];
function fold(s){
  s = (s || '').toLowerCase().replace(/[’'`ʼ]/g, '');
  for (let i = 0; i < FOLD.length; i++) s = s.split(FOLD[i][0]).join(FOLD[i][1]);
  s = s.replace(/[ыийї]/g, 'и').replace(/[щш]/g, 'ш').replace(/[еэє]/g, 'е')
       .replace(/[ґг]/g, 'г').replace(/ь/g, '').replace(/я/g, 'а').replace(/ю/g, 'у')
       .replace(/ц/g, 'с').replace(/ч/g, 'с');
  return s.replace(/(.)\1+/g, '$1').replace(/[^а-яa-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function matches(item, query){
  if (!query) return true;
  const hay = fold(item.n + ' ' + (item.ing || '')).split(' ');
  return fold(query).split(' ').filter(Boolean).every(w =>
    hay.some(t => t.indexOf(w) === 0 || (w.length >= 4 && t.indexOf(w) > -1))
  );
}

/* ---------- кошик ---------- */
let cart = {};
try { cart = JSON.parse(localStorage.getItem('sushiu_cart') || '{}'); } catch (e) { cart = {}; }
const saveCart = () => { try { localStorage.setItem('sushiu_cart', JSON.stringify(cart)); } catch (e) {} };

function cartLines(){
  return Object.keys(cart).filter(id => cart[id] > 0 && byId(id));
}
function cartSum(){
  let total = 0, count = 0;
  cartLines().forEach(id => { const m = byId(id); total += m.p * cart[id]; count += cart[id]; });
  return {total: total, count: count};
}
function deliveryFor(total){
  for (let i = 0; i < SHOP.delivery.length; i++)
    if (total >= SHOP.delivery[i].from) return SHOP.delivery[i];
  return SHOP.delivery[SHOP.delivery.length - 1];
}

function cardHTML(m){
  const qty = cart[m.id] || 0;
  return '<article class="card' + (qty ? ' in' : '') + '" data-id="' + m.id + '">' +
    '<div class="ph">' +
      (m.b ? '<span class="badge' + (m.b === 'Хіт' || m.b === 'Топ' ? ' hit' : '') + '">' + m.b + '</span>' : '') +
      (m.img ? '<img src="' + m.img + '" alt="' + m.n + '" loading="lazy">' : art(m)) +
    '</div>' +
    '<h3>' + m.n + '</h3>' +
    '<p class="ing">' + (m.ing || '') + '</p>' +
    '<div class="card-f"><span class="wt">' + (m.wt || '') + '</span>' +
      '<span class="price"><i>₴</i>' + m.p + '</span></div>' +
    '<button class="add" data-add="' + m.id + '">Обрати</button>' +
    '<div class="step"><button data-dec="' + m.id + '" aria-label="Менше">&minus;</button>' +
    '<b data-qty="' + m.id + '">' + qty + '</b>' +
    '<button data-inc="' + m.id + '" aria-label="Більше">+</button></div>' +
  '</article>';
}

function renderCart(){
  const ids = cartLines();
  const s = cartSum();

  const body = $('#cartBody');
  if (body){
    if (!ids.length){
      body.innerHTML = '<div class="cart-empty"><svg class="ico"><use href="#i-bag"/></svg>' +
        '<p>Кошик поки порожній.<br>Оберіть щось смачне з меню.</p>' +
        '<a class="btn btn-p" href="menu.html">Відкрити меню</a></div>';
    } else {
      body.innerHTML = ids.map(id => {
        const m = byId(id);
        return '<div class="ci"><div class="ci-ph">' + (m.img ? '<img src="' + m.img + '" alt="">' : art(m)) + '</div>' +
          '<div class="ci-b"><h4>' + m.n + '</h4>' +
          '<div class="m">' + (m.wt || '') + ' · ' + m.p + ' ₴</div>' +
          '<div class="ci-r"><button data-dec="' + id + '">&minus;</button><b>' + cart[id] + '</b>' +
          '<button data-inc="' + id + '">+</button>' +
          '<span class="ci-price">' + money(m.p * cart[id]) + '</span></div></div></div>';
      }).join('');
    }
  }

  const d = deliveryFor(s.total);
  const fd = $('#fDeliv');
  if (fd){
    fd.parentElement.classList.toggle('free', d.price === 0);
    fd.textContent = s.count ? (d.price === 0 ? 'безкоштовно' : money(d.price)) : '—';
  }
  const fs = $('#fSub');   if (fs) fs.textContent = money(s.total);
  const fc = $('#fCount'); if (fc) fc.textContent = s.count;
  const ft = $('#fTotal'); if (ft) ft.textContent = money(s.total + (s.count ? d.price : 0));
  const bc = $('#bCount'); if (bc) bc.textContent = s.count;
  const bt = $('#bCart');  if (bt) bt.classList.toggle('has', s.count > 0);

  $$('[data-qty]').forEach(el => {
    const c = el.closest('.card');
    el.textContent = cart[el.dataset.qty] || 0;
    if (c) c.classList.toggle('in', !!cart[el.dataset.qty]);
  });
  saveCart();
}

function orderText(){
  const ids = cartLines();
  if (!ids.length) return '';
  const s = cartSum();
  const d = deliveryFor(s.total);
  const lines = ids.map(id => {
    const m = byId(id);
    return '• ' + m.n + ' — ' + cart[id] + ' × ' + m.p + ' ₴';
  });
  return 'Замовлення з сайту SushiЮ:\n' + lines.join('\n') +
    '\n\nСума: ' + money(s.total) +
    '\nДоставка: ' + (d.price === 0 ? 'безкоштовно' : money(d.price)) +
    '\nРазом: ' + money(s.total + d.price) +
    '\n\nІмʼя:\nТелефон:\nАдреса / самовиніс:';
}

/* ---------- поява при скролі ---------- */
const io = new IntersectionObserver(en => {
  en.forEach(x => { if (x.isIntersecting){ x.target.classList.add('on'); io.unobserve(x.target); } });
}, {rootMargin:'0px 0px -6% 0px', threshold:.05});
function revealScan(){
  $$('.rv:not(.on)').forEach(el => io.observe(el));
  $$('.card:not(.rv)').forEach((el, i) => {
    el.classList.add('rv');
    el.style.transitionDelay = Math.min(i, 8) * 45 + 'ms';
    io.observe(el);
  });
}

/* ---------- спільні події ---------- */
document.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add){ const id = add.dataset.add; cart[id] = (cart[id] || 0) + 1; renderCart(); return; }
  const inc = e.target.closest('[data-inc]');
  if (inc){ const id = inc.dataset.inc; cart[id] = (cart[id] || 0) + 1; renderCart(); return; }
  const dec = e.target.closest('[data-dec]');
  if (dec){
    const id = dec.dataset.dec;
    cart[id] = Math.max(0, (cart[id] || 0) - 1);
    if (!cart[id]) delete cart[id];
    renderCart();
  }
});

const openCart  = () => { $('#cart').classList.add('on');    $('#scrim').classList.add('on');    document.body.style.overflow = 'hidden'; };
const closeCart = () => { $('#cart').classList.remove('on'); $('#scrim').classList.remove('on'); document.body.style.overflow = ''; };

function initShell(){
  const igg = $('#igGrid');
  if (igg) igg.innerHTML = IG_POSTS.map(src =>
    '<a href="' + SHOP.ig + '" target="_blank" rel="noopener"><img src="' + src + '" alt="Допис SushiЮ" loading="lazy"></a>').join('');

  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  $('#bCart').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  $('#scrim').addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

  $('#sendIg').addEventListener('click', () => {
    const t = orderText();
    if (!t) return;
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => {
      $('#hint').textContent = 'Замовлення скопійовано — вставте його в Direct.';
      $('#hint').style.color = 'var(--ok)';
    }).catch(() => {});
  });

  const hdr = $('#hdr');
  addEventListener('scroll', () => {
    const y = scrollY;
    hdr.classList.toggle('small', y > 60);
    const h = document.documentElement.scrollHeight - innerHeight;
    const p = $('#prog');
    if (p) p.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    const bg = $('#heroBg');
    if (bg && y < innerHeight) bg.style.transform = 'translate3d(0,' + (y * 0.22) + 'px,0)';
    if (typeof spyScroll === 'function') spyScroll();
  }, {passive:true});

  renderCart();
  revealScan();
}
