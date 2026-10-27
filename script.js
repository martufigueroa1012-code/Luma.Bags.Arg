const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  toggle.textContent = open ? '×' : '☰';
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menú');
  toggle.textContent = '☰';
}));
document.querySelector('#year').textContent = new Date().getFullYear();

// Carrito local: guarda la selección en este navegador, sin servicios pagos.
const stock = {
  'tote-roma': { max: 2, colors: 'Gris topo' },
  'cartera-mila': { max: 2, colors: 'Chocolate (1) · Gris claro (1)' },
  'mini-bags-paris': { max: 2, colors: 'Cherry (1) · Negra (1)' },
  'mini-bag-luna': { max: 1, colors: 'Blanco' },
  'mini-bag-y2k': { max: 1, colors: 'Negro' }
};
let cart = {};
try { cart = JSON.parse(localStorage.getItem('lumaCart') || '{}') || {}; } catch { cart = {}; }
const money = amount => '$' + Number(amount).toLocaleString('es-AR');
const safe = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function saveCart() { localStorage.setItem('lumaCart', JSON.stringify(cart)); renderCart(); }
function addProduct(button) {
  const id = button.dataset.id;
  const existing = cart[id]?.qty || 0;
  if (existing >= stock[id].max) { alert('Ya agregaste todas las unidades disponibles de este modelo.'); return; }
  cart[id] = { id, name: button.dataset.name, price: Number(button.dataset.price), qty: existing + 1 };
  saveCart();
  const original = button.textContent;
  button.textContent = '¡Agregado! ✓';
  setTimeout(() => button.textContent = original, 1000);
}
document.querySelectorAll('.add-to-cart').forEach(button => button.addEventListener('click', () => addProduct(button)));
function changeQty(id, delta) {
  if (!cart[id]) return;
  const next = cart[id].qty + delta;
  if (next <= 0) delete cart[id];
  else if (next <= stock[id].max) cart[id].qty = next;
  else { alert('No hay más unidades disponibles de este modelo.'); return; }
  saveCart();
}
function renderCart() {
  const container = document.querySelector('#cart-items');
  const items = Object.values(cart);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  document.querySelector('#cart-count').textContent = count;
  document.querySelector('#cart-total').textContent = money(total);
  if (!items.length) { container.innerHTML = '<p class="empty-cart">Todavía no agregaste productos.</p>'; return; }
  container.innerHTML = items.map(item => `<div class="cart-item"><div><h4>${safe(item.name)}</h4><p>${money(item.price)} por unidad</p><div class="cart-item-controls"><button class="qty-btn" type="button" data-action="minus" data-id="${safe(item.id)}" aria-label="Restar una unidad">−</button><span class="qty-label">Cantidad: ${item.qty}</span><button class="qty-btn" type="button" data-action="plus" data-id="${safe(item.id)}" aria-label="Sumar una unidad">+</button><button class="remove-btn" type="button" data-action="remove" data-id="${safe(item.id)}">Quitar</button></div></div><div class="cart-item-price">${money(item.price * item.qty)}</div></div>`).join('');
  container.querySelectorAll('button[data-action]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.id;
    if (button.dataset.action === 'minus') changeQty(id, -1);
    if (button.dataset.action === 'plus') changeQty(id, 1);
    if (button.dataset.action === 'remove') { delete cart[id]; saveCart(); }
  }));
}
const delivery = document.querySelector('#delivery-type');
const addressWrap = document.querySelector('#address-wrap');
const addressInput = document.querySelector('#customer-address');
function updateAddressField() {
  const needsAddress = delivery.value.startsWith('Envío a domicilio');
  addressWrap.hidden = !needsAddress;
  addressInput.required = needsAddress;
}
delivery.addEventListener('change', updateAddressField);
updateAddressField();
document.querySelector('#checkout-form').addEventListener('submit', event => {
  event.preventDefault();
  const items = Object.values(cart);
  if (!items.length) { alert('Primero agregá al menos un producto al carrito.'); return; }
  const form = new FormData(event.currentTarget);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const lines = items.map(item => `• ${item.name} x ${item.qty} — ${money(item.price * item.qty)}`);
  const deliveryText = form.get('delivery');
  const address = deliveryText.startsWith('Envío a domicilio') ? `\nDirección: ${form.get('address')}` : '';
  const notes = form.get('notes') ? `\nNotas: ${form.get('notes')}` : '';
  const message = `¡Hola, Luma.Bags.Arg! Quiero hacer este pedido:\n\n${lines.join('\n')}\n\nSubtotal de productos: ${money(subtotal)}\nEnvío/entrega: ${deliveryText}${address}\n\nNombre: ${form.get('name')}\nTeléfono: ${form.get('phone')}${notes}\n\n¿Me confirman stock, costo de envío (si corresponde) y opciones para pagar? Entiendo que este mensaje es una solicitud de pedido y que el pago todavía no está realizado.`;
  window.open(`https://wa.me/5491154647877?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});
renderCart();
