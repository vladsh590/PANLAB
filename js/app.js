/* ═══════════════════════════════════════════════════
   ПАНЛАБ — логика макета главной
   Меню берётся из js/menu-data.js (реальные данные с Яндекс Еды)
   ═══════════════════════════════════════════════════ */

const INK = '#F6F0E0', YEL = '#FFDD59', MUS = '#F0C020', COR = '#FC5D3D', GRN = '#13BF6D';

/* Заглушка для позиций, у которых на Яндексе нет фото (напитки, соусы) */
const ART_FALLBACK = `<svg viewBox="0 0 160 130" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M40 66 30 14M52 66 74 16" stroke="${COR}" stroke-width="7"/>
  <path d="M30 30h68" stroke="${COR}" stroke-width="7"/>
  <circle cx="70" cy="52" r="15" stroke="${INK}"/><circle cx="70" cy="52" r="6" stroke="${INK}"/>
  <circle cx="100" cy="56" r="12" stroke="${INK}"/>
  <path d="M46 60c-8-8-6-18 2-24 4 8 8 10 12 8-2 10-8 16-14 16z" fill="${GRN}" stroke="${GRN}"/>
  <path d="M24 68h112c3 0 5 2 4 5l-8 34c-2 9-10 15-19 15H47c-9 0-17-6-19-15l-8-34c-1-3 1-5 4-5z" fill="${YEL}" stroke="${INK}"/>
  <path d="M118 76l-7 32" stroke="${MUS}" stroke-width="6"/>
  <path d="M46 126h68" stroke="${INK}"/>
</svg>`;

/* состояние корзины объявляем до первого render() — control() его читает */
const cart = { count:0, sum:0, items:{} };

const grid    = document.getElementById('dishes');
const tabsEl  = document.getElementById('tabs');
const qInput  = document.getElementById('q');
const qWrap   = qInput.closest('.search');

/* ── табы из реальных категорий ────────────── */
tabsEl.innerHTML =
  `<button class="tab is-on" data-cat="hits" role="tab">Хиты</button>` +
  CATS.map(c => `<button class="tab" data-cat="${c.id}" role="tab">${c.name}</button>`).join('');

/* ── состояние каталога ────────────────────── */
let activeCat = 'hits';
let query = '';

/* ── карточка ──────────────────────────────── */
function tags(d){
  const t = [];
  if (d.hit)   t.push('<span class="tag tag--hit">Хит</span>');
  if (d.hot)   t.push('<span class="tag tag--hot">Остро</span>');
  if (d.veg)   t.push('<span class="tag tag--veg">Вег</span>');
  if (d.light) t.push('<span class="tag tag--light">Мало калорий</span>');
  return t.length ? `<div class="card__tags">${t.join('')}</div>` : '';
}

function control(d){
  const n = cart.items[d.name] || 0;
  if (!n) return `<button class="card__add" type="button" data-name="${d.name}" aria-label="Добавить «${d.name}» в корзину">
      <svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></button>`;
  return `<div class="card__count">
      <button type="button" data-dec="${d.name}" aria-label="Убрать одну порцию «${d.name}»">
        <svg class="ico" aria-hidden="true"><use href="#${n === 1 ? 'i-trash' : 'i-minus'}"/></svg></button>
      <span>${n}</span>
      <button type="button" data-name="${d.name}" aria-label="Добавить ещё «${d.name}»">
        <svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></button>
    </div>`;
}

function cardHTML(d, i){
  const meta = [d.weight, d.kcal ? d.kcal + ' ккал' : null].filter(Boolean).join(' · ');
  const media = d.img
    ? `<img src="${d.img}" alt="${d.name}" loading="lazy" width="400" height="300">`
    : ART_FALLBACK;

  return `
  <article class="card" data-dish="${d.name}" style="animation-delay:${Math.min(i,11)*35}ms">
    <div class="card__ph${d.img ? ' card__ph--photo' : ''}">
      ${tags(d)}
      ${media}
    </div>
    <div class="card__body">
      <h3 class="card__name">${d.name}</h3>
      <p class="card__desc">${d.desc}</p>
      <span class="card__meta">${meta}</span>
      <div class="card__foot">
        <span class="card__price">${d.price} ₽</span>
        ${control(d)}
      </div>
    </div>
  </article>`;
}

function visible(){
  if (query){
    const q = query.toLowerCase();
    return MENU.filter(d => (d.name + ' ' + d.desc).toLowerCase().includes(q));
  }
  if (activeCat === 'hits'){
    return MENU.filter(d => d.hit || d.hot)
      .concat(MENU.filter(d => !d.hit && !d.hot).slice(0, 4))
      .slice(0, 12);
  }
  return MENU.filter(d => d.cat === activeCat);
}

function render(){
  const list = visible();
  grid.innerHTML = list.length
    ? list.map(cardHTML).join('')
    : `<div class="empty"><b>Ничего не нашлось</b>Попробуйте другое слово — например, «бао» или «лапша».</div>`;
}
render();

/* обновляем только счётчик у одной карточки, без перерисовки всей сетки */
function refreshCard(name){
  const card = grid.querySelector(`.card[data-dish="${CSS.escape(name)}"]`);
  const dish = MENU.find(d => d.name === name);
  if (card && dish) card.querySelector('.card__foot').lastElementChild.outerHTML = control(dish);
}

/* ── табы ──────────────────────────────────── */
function openCat(id){
  activeCat = id;
  query = '';
  qInput.value = '';
  qWrap.classList.remove('is-filled');
  tabsEl.querySelector('.tab.is-on')?.classList.remove('is-on');
  const tab = tabsEl.querySelector(`.tab[data-cat="${id}"]`);
  if (tab){
    tab.classList.add('is-on');
    tab.scrollIntoView({ block:'nearest', inline:'center' });
  }
  render();
  syncNav();
}

tabsEl.addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (tab) openCat(tab.dataset.cat);
});

/* ── слайдер категорий: стрелки + перетаскивание ── */
const prevBtn = document.querySelector('.tabs-nav--prev');
const nextBtn = document.querySelector('.tabs-nav--next');

/* Замер синхронный: в фоновых вкладках rAF и ResizeObserver замораживаются,
   и стрелки залипали бы в состоянии «скрыты». */
function syncNav(){
  const max = tabsEl.scrollWidth - tabsEl.clientWidth;
  const noScroll = max < 4;
  prevBtn.hidden = noScroll || tabsEl.scrollLeft < 4;
  nextBtn.hidden = noScroll || tabsEl.scrollLeft > max - 4;
}

function slide(dir){
  tabsEl.scrollBy({ left: dir * Math.round(tabsEl.clientWidth * 0.7), behavior: 'smooth' });
}
prevBtn.addEventListener('click', () => slide(-1));
nextBtn.addEventListener('click', () => slide(1));
tabsEl.addEventListener('scroll', syncNav, { passive: true });
addEventListener('resize', syncNav);
syncNav();
/* и пересчитываем при любом изменении раскладки */
new ResizeObserver(syncNav).observe(tabsEl);
addEventListener('load', syncNav);
document.fonts?.ready.then(syncNav);

/* колесо мыши прокручивает ленту по горизонтали */
tabsEl.addEventListener('wheel', e => {
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  const max = tabsEl.scrollWidth - tabsEl.clientWidth;
  if (max < 4) return;
  e.preventDefault();
  tabsEl.scrollLeft += e.deltaY;
}, { passive: false });

/* перетаскивание мышью — на тач-экранах работает нативный скролл */
let drag = null;
tabsEl.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') return;
  drag = { x: e.clientX, left: tabsEl.scrollLeft, moved: false };
});
tabsEl.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) < 4) return;
  if (!drag.moved){
    drag.moved = true;
    tabsEl.classList.add('is-dragging');
    tabsEl.setPointerCapture(e.pointerId);
  }
  tabsEl.scrollLeft = drag.left - dx;
});
function endDrag(e){
  if (!drag) return;
  if (drag.moved){
    tabsEl.classList.remove('is-dragging');
    try { tabsEl.releasePointerCapture(e.pointerId); } catch {}
  }
  drag = null;
}
tabsEl.addEventListener('pointerup', endDrag);
tabsEl.addEventListener('pointercancel', endDrag);

/* ── поиск по меню ─────────────────────────── */
let qTimer;
qInput.addEventListener('input', () => {
  qWrap.classList.toggle('is-filled', !!qInput.value);
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    query = qInput.value.trim();
    if (query) tabsEl.querySelector('.tab.is-on')?.classList.remove('is-on');
    else openCat(activeCat);
    render();
  }, 160);
});

document.getElementById('qclear').addEventListener('click', () => {
  qInput.value = '';
  openCat(activeCat);
  qInput.focus();
});

/* ── корзина ───────────────────────────────── */

/* «1 позиция / 2 позиции / 5 позиций» */
function plural(n, forms){
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

function paint(){
  document.querySelectorAll('.js-cart-count').forEach(el => el.textContent = cart.count);
  document.querySelectorAll('.js-cart-word').forEach(el => el.textContent = plural(cart.count, ['позиция','позиции','позиций']));
  document.querySelectorAll('.js-cart-sum').forEach(el => el.textContent = cart.sum.toLocaleString('ru-RU'));
  document.getElementById('cartbar').classList.toggle('is-on', cart.count > 0);
  const btn = document.querySelector('.btn--cart');
  btn.classList.remove('is-bump');
  void btn.offsetWidth;
  btn.classList.add('is-bump');
}

let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
}

function change(name, delta){
  const dish = MENU.find(d => d.name === name);
  if (!dish) return;
  const was = cart.items[name] || 0;
  const now = Math.max(0, was + delta);
  if (now === was) return;
  cart.items[name] = now;
  if (!now) delete cart.items[name];
  cart.count += delta;
  cart.sum += dish.price * delta;
  refreshCard(name);
  paint();
  toast(delta > 0 ? `«${name}» — в корзине` : `«${name}» — убрали`);
}

grid.addEventListener('click', e => {
  const add = e.target.closest('[data-name]');
  if (add) return change(add.dataset.name, +1);
  const dec = e.target.closest('[data-dec]');
  if (dec) return change(dec.dataset.dec, -1);
});

document.querySelectorAll('.js-cart-open').forEach(b => {
  b.addEventListener('click', () => {
    toast(cart.count
      ? 'В макете корзина не открывается — она будет отдельной страницей'
      : 'Корзина пуста. Добавьте что-нибудь из меню');
  });
});

document.getElementById('login').addEventListener('click', () => {
  toast('Вход по SMS-коду — будет отдельной страницей');
});

/* ── мобильное меню ────────────────────────── */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  const on = nav.classList.toggle('is-on');
  burger.setAttribute('aria-expanded', on);
});
nav.addEventListener('click', e => {
  if (e.target.tagName === 'A'){
    nav.classList.remove('is-on');
    burger.setAttribute('aria-expanded', false);
  }
});

/* ── появление блоков при скролле ──────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting){
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 60}ms`;
  io.observe(el);
});
