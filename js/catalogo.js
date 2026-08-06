// PizKTruck — Lógica compartida del catálogo
// Se usa en menu.html (modoCarrito=false) y pedido.html (modoCarrito=true)

let categorias = [];
let platillos = [];
let categoriaActivaIdx = 0;
let carrito = {};
let restauranteActual = null;
let modoCarritoGlobal = false;

async function initCatalogo(modoCarrito){
  modoCarritoGlobal = modoCarrito;
  const slug = new URLSearchParams(window.location.search).get('slug');

  if(!slug){
    document.getElementById('catalogo').innerHTML =
      '<div class="msg-center">Falta el restaurante en el link.<br>Agrega ?slug=nombre-del-truck a la URL.</div>';
    return;
  }

  const { data: restaurante, error: errR } = await supabaseClient
    .from('restaurantes').select('*').eq('slug', slug).eq('activo', true).single();

  if(errR || !restaurante){
    document.getElementById('catalogo').innerHTML =
      '<div class="msg-center">No encontramos este restaurante.</div>';
    return;
  }

  restauranteActual = restaurante;
  aplicarPersonalizacion(restaurante);

  const { data: catsData } = await supabaseClient
    .from('categorias').select('id, nombre, orden').eq('restaurante_id', restaurante.id).order('orden');
  categorias = catsData || [];

  if(categorias.length === 0){
    document.getElementById('catalogo').innerHTML = '<div class="msg-center">Este menú todavía no tiene categorías.</div>';
    return;
  }

  const { data: platData } = await supabaseClient
    .from('platillos').select('*').in('categoria_id', categorias.map(c => c.id)).order('orden');
  platillos = platData || [];

  renderNav();
  render();
}

function aplicarPersonalizacion(r){
  document.documentElement.style.setProperty('--accent', r.color_primario || '#F2A623');
  document.documentElement.style.setProperty('--accent2', r.color_secundario || '#D85A30');
  document.title = r.nombre;
  const nombreEl = document.getElementById('restNombre');
  const subEl = document.getElementById('restSub');
  const logoEl = document.getElementById('restLogo');
  if(nombreEl) nombreEl.textContent = r.nombre;
  if(subEl) subEl.textContent = r.descripcion_corta || '';
  if(logoEl && r.logo_url) logoEl.innerHTML = `<img src="${r.logo_url}" alt="${r.nombre}">`;
}

function seleccionarCategoria(idx){
  categoriaActivaIdx = idx;
  document.querySelectorAll('.pill').forEach((p,i)=>p.classList.toggle('active', i===idx));
  render();
}

function renderNav(){
  const nav = document.getElementById('catNav');
  nav.innerHTML = "";
  categorias.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.className = "pill" + (idx===0 ? " active" : "");
    btn.textContent = cat.nombre;
    btn.onclick = () => seleccionarCategoria(idx);
    nav.appendChild(btn);
  });
}

function render(){
  const cont = document.getElementById('catalogo');
  cont.innerHTML = "";
  const cat = categorias[categoriaActivaIdx];
  const platillosCat = platillos.filter(p => p.categoria_id === cat.id);

  const titulo = document.createElement('div');
  titulo.className = "cat-title display";
  titulo.textContent = cat.nombre;
  cont.appendChild(titulo);

  if(platillosCat.length === 0){
    const vacio = document.createElement('div');
    vacio.className = "msg-center";
    vacio.textContent = "Sin platillos en esta categoría todavía.";
    cont.appendChild(vacio);
    return;
  }

  platillosCat.forEach(p => {
    const div = document.createElement('div');
    div.className = "dish" + (p.disponible ? "" : " unavailable");
    const cantidad = carrito[p.id] || 0;

    let controlHtml = "";
    if(modoCarritoGlobal){
      controlHtml = p.disponible
        ? (cantidad > 0
            ? `<div class="qty-pill"><button onclick="cambiarCantidad('${p.id}',-1)">−</button><span>${cantidad}</span><button onclick="cambiarCantidad('${p.id}',1)">+</button></div>`
            : `<button class="add-btn" onclick="cambiarCantidad('${p.id}',1)">+</button>`)
        : `<button class="add-btn" disabled>+</button>`;
    }

    const fotoHtml = p.foto_url ? `<img src="${p.foto_url}" alt="${p.nombre}">` : '🌯';

    div.innerHTML = `
      <div class="dish-photo">${fotoHtml}</div>
      <div class="dish-info">
        <div class="dish-name">${p.nombre}</div>
        <div class="dish-desc">${p.descripcion || ''}</div>
        ${!p.disponible ? '<div class="dish-tag">AGOTADO HOY</div>' : ''}
        <div class="dish-bottom">
          <div class="dish-price">$${Number(p.precio).toFixed(2)}</div>
          ${controlHtml}
        </div>
      </div>`;
    cont.appendChild(div);
  });
}

// --- Lógica de carrito (solo se usa en pedido.html) ---

function cambiarCantidad(id, delta){
  const actual = carrito[id] || 0;
  const nuevo = Math.max(0, actual + delta);
  if(nuevo === 0) delete carrito[id]; else carrito[id] = nuevo;
  actualizarCartBar();
  render();
}

function actualizarCartBar(){
  const cartBar = document.getElementById('cartBar');
  if(!cartBar) return;
  const totalItems = Object.values(carrito).reduce((a,b)=>a+b,0);
  let totalPrecio = 0;
  platillos.forEach(p => { if(carrito[p.id]) totalPrecio += Number(p.precio) * carrito[p.id]; });
  document.getElementById('cartCount').textContent = totalItems + (totalItems===1 ? " item" : " items");
  document.getElementById('cartTotal').textContent = "$" + totalPrecio.toFixed(2);
  cartBar.classList.toggle('show', totalItems>0);
  validarEnvio();
}

function validarEnvio(){
  const nameInput = document.getElementById('nameInput');
  const sendBtn = document.getElementById('sendBtn');
  if(!nameInput || !sendBtn) return;
  const nombre = nameInput.value.trim();
  const totalItems = Object.values(carrito).reduce((a,b)=>a+b,0);
  sendBtn.disabled = !(nombre.length>0 && totalItems>0);
}

function enviarWhatsapp(){
  const nombre = document.getElementById('nameInput').value.trim();
  let lineas = [];
  platillos.forEach(p => { if(carrito[p.id]) lineas.push(`${carrito[p.id]}x ${p.nombre}`); });
  const mensaje = `Hola, soy ${nombre} y quiero: ${lineas.join(", ")}`;
  const url = `https://wa.me/${restauranteActual.whatsapp_numero}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}
