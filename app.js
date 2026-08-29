/* =========================================================
   SushiЮ — спільна логіка головної та сторінки меню
   ========================================================= */
const $  = s => document.querySelector(s);
const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
const money = v => v.toLocaleString('uk-UA') + ' ₴';
const byId  = id => MENU.filter(m => m.id === id)[0];

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

/* ---------- обрана точка ---------- */
let pointId = POINTS[0].id;
try {
  const saved = localStorage.getItem('sushiu_point');
  if (saved && POINTS.some(p => p.id === saved)) pointId = saved;
} catch (e) {}
const POINT = () => POINTS.filter(p => p.id === pointId)[0] || POINTS[0];
function setPoint(id, remember){
  if (!POINTS.some(p => p.id === id)) return;
  pointId = id;
  if (remember !== false) { try { localStorage.setItem('sushiu_point', id); } catch (e) {} }
  applyPoint();
  renderCart();
}
function pointChosen(){
  try { return !!localStorage.getItem('sushiu_point'); } catch (e) { return false; }
}

/* Підставляє дані точки в усі елементи з data-pt / data-pt-href */
function applyPoint(){
  const p = POINT();
  const val = {
    name: p.n, addr: p.addr, full: p.full, hours: p.hours,
    cityAddr: p.n + ', ' + p.addr,
    tel1: p.tels[0].d, tel2: p.tels[1] ? p.tels[1].d : '', note: p.note
  };
  $$('[data-pt]').forEach(el => {
    const k = el.dataset.pt;
    if (k === 'tel2' && !p.tels[1]) { el.style.display = 'none'; return; }
    el.style.removeProperty('display');
    if (val[k] !== undefined) el.textContent = val[k];
  });
  $$('[data-pt-href]').forEach(el => {
    const k = el.dataset.ptHref;
    if (k === 'map')  el.href = p.map;
    if (k === 'tel1') el.href = 'tel:' + p.tels[0].t;
    if (k === 'tel2'){
      if (!p.tels[1]) { el.style.display = 'none'; return; }
      el.style.removeProperty('display');
      el.href = 'tel:' + p.tels[1].t;
    }
  });
  const dl = $('#delivList');
  if (dl) dl.innerHTML = p.delivery.map(d => '<li>' + d.t + '</li>').join('') + '<li>' + p.note + '</li>';
  $$('[data-point-pick]').forEach(el => el.classList.toggle('on', el.dataset.pointPick === pointId));
}

/* ---------- кошик ---------- */
let cart = {};
try { cart = JSON.parse(localStorage.getItem('sushiu_cart') || '{}'); } catch (e) { cart = {}; }
const saveCart = () => { try { localStorage.setItem('sushiu_cart', JSON.stringify(cart)); } catch (e) {} };

let lastCount = -1;   /* щоб лічильник підстрибував лише коли додали */

function cartLines(){
  return Object.keys(cart).filter(id => cart[id] > 0 && byId(id));
}
function cartSum(){
  let total = 0, count = 0;
  cartLines().forEach(id => { const m = byId(id); total += m.p * cart[id]; count += cart[id]; });
  return {total: total, count: count};
}
function deliveryFor(total){
  const d = POINT().delivery;
  for (let i = 0; i < d.length; i++) if (total >= d[i].from) return d[i];
  return d[d.length - 1];
}

function cardHTML(m){
  const qty = cart[m.id] || 0;
  return '<article class="card' + (qty ? ' in' : '') + '" data-id="' + m.id + '">' +
    '<div class="ph">' +
      (m.b ? '<span class="badge' + (m.b === 'Хіт' || m.b === 'Топ' ? ' hit' : '') + '">' + m.b + '</span>' : '') +
      (m.img ? '<img src="' + m.img + '" alt="' + m.n + '" loading="lazy">' : '') +
    '</div>' +
    '<h3>' + m.n + '</h3>' +
    '<p class="ing">' + (m.ing || '') + '</p>' +
    '<div class="card-f"><span class="wt">' + (m.wt || '') + '</span>' +
      '<span class="price"><i>₴</i>' + m.p + '</span></div>' +
    '<button class="add" data-add="' + m.id + '">Вибрати</button>' +
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
        '<p>Тут зʼявиться те, що ви виберете<br>в меню. Потім просто зателефонуйте.</p>' +
        '<a class="btn btn-p" href="menu.html">Відкрити меню</a></div>';
    } else {
      body.innerHTML = ids.map(id => {
        const m = byId(id);
        return '<div class="ci"><div class="ci-ph">' + (m.img ? '<img src="' + m.img + '" alt="">' : '') + '</div>' +
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
  const hc = $('#hdrCount'); if (hc) hc.textContent = s.count;
  const bc = $('#bCount'), bt = $('#bCart');
  if (bc && bt){
    bc.textContent = s.count;
    bt.classList.toggle('has', s.count > 0);
    if (lastCount >= 0 && s.count > lastCount){
      bc.classList.remove('bump');
      void bc.offsetWidth;            /* перезапуск анімації */
      bc.classList.add('bump');
    }
    lastCount = s.count;
  }

  $$('[data-qty]').forEach(el => {
    const c = el.closest('.card, .prod-add');
    el.textContent = cart[el.dataset.qty] || 0;
    if (c) c.classList.toggle('in', !!cart[el.dataset.qty]);
  });
  saveCart();

  const ch = $('#check');
  if (ch && ch.classList.contains('on')){
    if (!ids.length) closeSheet('#check'); else renderCheck();
  }
}

/* ---------- чек ---------- */
function renderCheck(){
  const paper = $('#checkPaper');
  if (!paper) return;
  const ids = cartLines(), s = cartSum(), d = deliveryFor(s.total), p = POINT();
  paper.innerHTML =
    '<div class="check-top"><div class="n">SushiЮ</div>' +
      '<div class="m">' + p.n + ' · ' + p.addr + '</div></div>' +
    ids.map(id => {
      const m = byId(id);
      return '<div class="check-li"><div class="l"><b>' + m.n + '</b>' +
        '<span>' + cart[id] + ' × ' + m.p + ' ₴' + (m.wt ? ' · ' + m.wt : '') + '</span></div>' +
        '<div class="r">' + money(m.p * cart[id]) + '</div></div>';
    }).join('') +
    '<div class="check-sum"><span>Сума</span><b>' + money(s.total) + '</b></div>' +
    '<div class="check-sum' + (d.price === 0 ? ' free' : '') + '"><span>Доставка</span><b>' +
      (d.price === 0 ? 'безкоштовно' : money(d.price)) + '</b></div>' +
    '<div class="check-total"><span>Разом</span><b>' + money(s.total + d.price) + '</b></div>' +
    '<p class="check-note">Продиктуйте цей список менеджеру<br>' + p.n + ' · щодня ' + p.hours + '</p>';
}

function receiptText(){
  const ids = cartLines();
  if (!ids.length) return '';
  const s = cartSum(), d = deliveryFor(s.total), p = POINT();
  return 'Замовлення SushiЮ (' + p.n + ')\n' +
    ids.map(id => { const m = byId(id); return '• ' + m.n + ' — ' + cart[id] + ' × ' + m.p + ' ₴'; }).join('\n') +
    '\n\nСума: ' + money(s.total) +
    '\nДоставка: ' + (d.price === 0 ? 'безкоштовно' : money(d.price)) +
    '\nРазом: ' + money(s.total + d.price);
}

/* ---------- сторінка позиції ---------- */
function openProd(id){
  const m = byId(id);
  if (!m) return;
  const cat = (CATS.filter(c => c.id === m.c)[0] || {}).n || 'Позиція';
  const also = MENU.filter(x => x.c === m.c && x.id !== m.id)
    .concat(MENU.filter(x => x.c !== m.c).slice().sort((a, b) => b.pop - a.pop))
    .slice(0, 6);

  $('#prodCat').textContent = cat;
  $('#prodBody').innerHTML =
    '<div class="prod-ph">' + (m.b ? '<span class="badge' + (m.b === 'Хіт' || m.b === 'Топ' ? ' hit' : '') + '">' + m.b + '</span>' : '') + '</div>' +
    '<h2 class="prod-n">' + m.n + '</h2>' +
    '<p class="prod-ing">' + (m.ing || '') + '</p>' +
    '<div class="prod-meta"><span class="wt">' + (m.wt || '') + '</span>' +
      '<span class="price"><i>₴</i>' + m.p + '</span></div>' +
    '<h3 class="also-h">Спробуйте також</h3>' +
    '<div class="rail">' + also.map(cardHTML).join('') + '</div>';

  const qty = cart[m.id] || 0;
  $('#prodFoot').innerHTML =
    '<div class="prod-add' + (qty ? ' in' : '') + '">' +
      '<button class="add" data-add="' + m.id + '">Вибрати · ' + m.p + ' ₴</button>' +
      '<div class="step"><button data-dec="' + m.id + '">&minus;</button>' +
      '<b data-qty="' + m.id + '">' + qty + '</b>' +
      '<button data-inc="' + m.id + '">+</button></div>' +
    '</div>';

  $('#prod').querySelector('.sheet-body').scrollTop = 0;
  $('#prod').classList.add('on');
  lockScroll();
}

function lockScroll(){
  const open = ['#cart', '#check', '#prod'].some(s => $(s) && $(s).classList.contains('on'));
  document.body.style.overflow = open ? 'hidden' : '';
}

/* ---------- поява при скролі ---------- */
const io = new IntersectionObserver(en => {
  en.forEach(x => { if (x.isIntersecting){ x.target.classList.add('on'); io.unobserve(x.target); } });
}, {rootMargin:'0px 0px -6% 0px', threshold:.05});
function revealScan(){
  $$('.rv:not(.on)').forEach(el => io.observe(el));
  $$('.card:not(.rv)').filter(el => !el.closest('.sheet')).forEach((el, i) => {
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
    return;
  }
  /* клік по картці — відкрити позицію на весь екран */
  const card = e.target.closest('.card[data-id]');
  if (card) openProd(card.dataset.id);
});

const openCart  = () => { $('#cart').classList.add('on');    $('#scrim').classList.add('on');    lockScroll(); };
const closeCart = () => { $('#cart').classList.remove('on'); $('#scrim').classList.remove('on'); lockScroll(); };
const openCheck = () => {
  if (!cartLines().length) return;
  renderCheck();
  $('#check').querySelector('.sheet-body').scrollTop = 0;
  $('#check').classList.add('on');
  lockScroll();
};
const closeSheet = sel => { $(sel).classList.remove('on'); lockScroll(); };

/* ---------- модалка вибору точки ---------- */
const openPick  = () => { $('#pick').classList.add('on'); document.body.style.overflow = 'hidden'; };
const closePick = () => { $('#pick').classList.remove('on'); document.body.style.overflow = ''; };

function initShell(){
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* плитки вибору точки — і в модалці, і в секції «Наші заклади» */
  const tilesHTML = POINTS.map(p =>
    '<button class="pt-tile" data-point-pick="' + p.id + '">' +
      '<span class="pt-city">' + p.n + '</span>' +
      '<span class="pt-addr">' + p.addr + '</span>' +
      '<span class="pt-hours">щодня ' + p.hours + '</span>' +
    '</button>').join('');
  const pg = $('#pickGrid'); if (pg) pg.innerHTML = tilesHTML;

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-point-pick]');
    if (t){ setPoint(t.dataset.pointPick); closePick(); return; }
    if (e.target.closest('#pointBtn')) { openPick(); return; }
    if (e.target.closest('#pickClose') || e.target === $('#pick')) closePick();
  });

  const bc = $('#bCount');
  if (bc) bc.addEventListener('animationend', () => bc.classList.remove('bump'));

  const hCart = $('#hdrCart');
  if (hCart) hCart.addEventListener('click', openCart);

  const hSearch = $('#hdrSearch');
  if (hSearch) hSearch.addEventListener('click', () => {
    const inp = $('#q') || document.querySelector('#homeSearch input');
    if (!inp) { location.href = 'menu.html'; return; }
    inp.scrollIntoView({block:'center', behavior:'smooth'});
    setTimeout(() => inp.focus(), 340);
  });

  $('#bCart').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  $('#scrim').addEventListener('click', closeCart);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#prod').classList.contains('on')) closeSheet('#prod');
    else if ($('#check').classList.contains('on')) closeSheet('#check');
    else closeCart();
    closePick();
  });

  $('#toCheck').addEventListener('click', openCheck);
  $('#checkBack').addEventListener('click', () => closeSheet('#check'));
  $('#checkClose').addEventListener('click', () => { closeSheet('#check'); closeCart(); });
  $('#prodBack').addEventListener('click', () => closeSheet('#prod'));
  $('#prodClose').addEventListener('click', () => closeSheet('#prod'));

  $('#shareBtn').addEventListener('click', async () => {
    const t = receiptText();
    if (!t) return;
    try {
      if (navigator.share) { await navigator.share({title: 'Замовлення SushiЮ', text: t}); return; }
      await navigator.clipboard.writeText(t);
      $('#hint').textContent = 'Чек скопійовано — вставте його в будь-який месенджер.';
      $('#hint').style.color = 'var(--ok)';
    } catch (err) { /* користувач скасував — нічого не робимо */ }
  });

  applyPoint();
  if (!pointChosen() && $('#pick')) openPick();

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
