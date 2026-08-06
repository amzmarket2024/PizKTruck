// PizKTruck — Lógica del panel admin

let restaurantes = [];
let restauranteSeleccionado = null;
let categoriasDelRestaurante = [];
let categoriaSeleccionadaId = null;
let platillosDeCategoria = [];

async function iniciarPanel(){
  const { data } = await supabaseClient.auth.getSession();
  if(!data.session){ window.location.href = "index.html"; return; }
  await cargarRestaurantes();
}

async function cerrarSesion(){
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// ---------- RESTAURANTES ----------

async function cargarRestaurantes(){
  const { data, error } = await supabaseClient.from('restaurantes').select('*').order('nombre');
  restaurantes = data || [];
  renderListaRestaurantes();
}

function renderListaRestaurantes(){
  const cont = document.getElementById('listaRestaurantes');
  cont.innerHTML = "";
  if(restaurantes.length === 0){
    cont.innerHTML = '<div class="empty-note">Todavía no hay restaurantes.</div>';
    return;
  }
  restaurantes.forEach(r => {
    const div = document.createElement('div');
    div.className = "rest-item" + (restauranteSeleccionado && restauranteSeleccionado.id === r.id ? " active" : "");
    div.textContent = r.nombre + (r.activo ? "" : " (pausado)");
    div.onclick = () => seleccionarRestaurante(r.id);
    cont.appendChild(div);
  });
}

async function crearRestaurante(){
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const slug = document.getElementById('nuevoSlug').value.trim();
  const whatsapp = document.getElementById('nuevoWhatsapp').value.trim();
  if(!nombre || !slug || !whatsapp){ alert("Completa nombre, slug y whatsapp."); return; }

  const { error } = await supabaseClient.from('restaurantes').insert({
    nombre, slug, whatsapp_numero: whatsapp
  });
  if(error){ alert("Error: " + error.message); return; }

  document.getElementById('nuevoNombre').value = "";
  document.getElementById('nuevoSlug').value = "";
  document.getElementById('nuevoWhatsapp').value = "";
  await cargarRestaurantes();
}

async function seleccionarRestaurante(id){
  restauranteSeleccionado = restaurantes.find(r => r.id === id);
  categoriaSeleccionadaId = null;
  renderListaRestaurantes();
  await cargarCategorias();
  renderContenidoRestaurante();
}

function renderContenidoRestaurante(){
  const r = restauranteSeleccionado;
  const cont = document.getElementById('contenidoRestaurante');
  cont.innerHTML = `
    <div class="card">
      <h3>Datos del restaurante</h3>
      <div class="grid-2">
        <div><label>Nombre</label><input type="text" id="editNombre" value="${r.nombre}"></div>
        <div><label>Slug (para la URL)</label><input type="text" id="editSlug" value="${r.slug}"></div>
      </div>
      <div class="grid-2">
        <div><label>Whatsapp</label><input type="text" id="editWhatsapp" value="${r.whatsapp_numero}"></div>
        <div><label>Descripción corta</label><input type="text" id="editDesc" value="${r.descripcion_corta || ''}"></div>
      </div>
      <div class="grid-2">
        <div>
          <label>Color primario</label>
          <div class="color-row">
            <input type="color" id="editColorPrimario" value="${r.color_primario || '#F2A623'}">
            <span style="font-size:12px; color:var(--muted)">Precios y acentos</span>
          </div>
        </div>
        <div>
          <label>Color secundario</label>
          <div class="color-row">
            <input type="color" id="editColorSecundario" value="${r.color_secundario || '#D85A30'}">
            <span style="font-size:12px; color:var(--muted)">Botón de pedido</span>
          </div>
        </div>
      </div>
      <label>URL del logo</label>
      <input type="text" id="editLogo" value="${r.logo_url || ''}" placeholder="https://...">
      <label>URL del banner (opcional)</label>
      <input type="text" id="editBanner" value="${r.banner_url || ''}" placeholder="https://...">
      <label><input type="checkbox" id="editActivo" ${r.activo ? 'checked' : ''} style="width:auto; display:inline; margin-right:6px;">Restaurante activo (visible al público)</label>
      <div style="display:flex; gap:8px; margin-top:10px;">
        <button class="btn-primary" style="width:auto;" onclick="guardarRestaurante()">Guardar cambios</button>
        <button class="btn-danger" onclick="eliminarRestaurante()">Eliminar restaurante</button>
      </div>
      <p style="margin-top:12px; font-size:12px; color:var(--muted)">
        Menú: /menu.html?slug=${r.slug} &nbsp;·&nbsp; Pedido: /pedido.html?slug=${r.slug}
      </p>
    </div>

    <div class="card">
      <h3>Códigos QR</h3>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">
        QR 1 — pedido remoto con carrito y WhatsApp &nbsp;·&nbsp; QR 2 — solo ver el menú en el truck
      </p>
      <div style="display:flex; gap:24px; flex-wrap:wrap;">
        <div style="text-align:center;">
          <canvas id="qrPedido"></canvas>
          <div style="font-size:12px; margin-top:6px;">QR 1 · Pedido</div>
          <button class="btn-secondary btn-small" style="margin-top:6px;" onclick="descargarQR('qrPedido','qr-pedido-${r.slug}')">Descargar</button>
        </div>
        <div style="text-align:center;">
          <canvas id="qrMenu"></canvas>
          <div style="font-size:12px; margin-top:6px;">QR 2 · Solo ver</div>
          <button class="btn-secondary btn-small" style="margin-top:6px;" onclick="descargarQR('qrMenu','qr-menu-${r.slug}')">Descargar</button>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Categorías</h3>
      <div id="listaCategorias"></div>
      <div class="inline-form">
        <input type="text" id="nuevaCategoriaNombre" placeholder="Nombre de la categoría">
        <input type="number" id="nuevaCategoriaOrden" placeholder="Orden" style="max-width:80px;">
        <button class="btn-secondary btn-small" onclick="crearCategoria()">+ Agregar</button>
      </div>
    </div>

    <div class="card" id="cardPlatillos" style="display:none;">
      <h3>Platillos — <span id="nombreCategoriaActiva"></span></h3>
      <div id="listaPlatillos"></div>
      <div class="inline-form" style="flex-direction:column;">
        <input type="text" id="nuevoPlatilloNombre" placeholder="Nombre del platillo">
        <input type="text" id="nuevoPlatilloDesc" placeholder="Descripción">
        <input type="number" id="nuevoPlatilloPrecio" placeholder="Precio" step="0.01">
        <input type="text" id="nuevoPlatilloFoto" placeholder="URL de la foto (opcional)">
        <button class="btn-secondary btn-small" onclick="crearPlatillo()">+ Agregar platillo</button>
      </div>
    </div>
  `;
  renderListaCategorias();
  generarQRs(r.slug);
}

function generarQRs(slug){
  const urlMenu = `${window.location.origin}${window.location.pathname.replace('admin/panel.html','')}menu.html?slug=${slug}`;
  const urlPedido = `${window.location.origin}${window.location.pathname.replace('admin/panel.html','')}pedido.html?slug=${slug}`;

  QRCode.toCanvas(document.getElementById('qrMenu'), urlMenu, { width: 160, margin: 1 });
  QRCode.toCanvas(document.getElementById('qrPedido'), urlPedido, { width: 160, margin: 1 });
}

function descargarQR(canvasId, nombreArchivo){
  const canvas = document.getElementById(canvasId);
  const link = document.createElement('a');
  link.download = nombreArchivo + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function guardarRestaurante(){
  const r = restauranteSeleccionado;
  const updates = {
    nombre: document.getElementById('editNombre').value.trim(),
    slug: document.getElementById('editSlug').value.trim(),
    whatsapp_numero: document.getElementById('editWhatsapp').value.trim(),
    descripcion_corta: document.getElementById('editDesc').value.trim(),
    color_primario: document.getElementById('editColorPrimario').value,
    color_secundario: document.getElementById('editColorSecundario').value,
    logo_url: document.getElementById('editLogo').value.trim(),
    banner_url: document.getElementById('editBanner').value.trim(),
    activo: document.getElementById('editActivo').checked,
  };
  const { error } = await supabaseClient.from('restaurantes').update(updates).eq('id', r.id);
  if(error){ alert("Error: " + error.message); return; }
  await cargarRestaurantes();
  restauranteSeleccionado = restaurantes.find(x => x.id === r.id);
  alert("Guardado.");
}

async function eliminarRestaurante(){
  if(!confirm("Esto elimina el restaurante y TODAS sus categorías y platillos. ¿Continuar?")) return;
  const { error } = await supabaseClient.from('restaurantes').delete().eq('id', restauranteSeleccionado.id);
  if(error){ alert("Error: " + error.message); return; }
  restauranteSeleccionado = null;
  document.getElementById('contenidoRestaurante').innerHTML = '<div class="empty-note">Selecciona un restaurante de la izquierda, o crea uno nuevo.</div>';
  await cargarRestaurantes();
}

// ---------- CATEGORIAS ----------

async function cargarCategorias(){
  const { data } = await supabaseClient.from('categorias')
    .select('*').eq('restaurante_id', restauranteSeleccionado.id).order('orden');
  categoriasDelRestaurante = data || [];
}

function renderListaCategorias(){
  const cont = document.getElementById('listaCategorias');
  cont.innerHTML = "";
  if(categoriasDelRestaurante.length === 0){
    cont.innerHTML = '<div class="empty-note">Sin categorías todavía.</div>';
    return;
  }
  categoriasDelRestaurante.forEach(c => {
    const div = document.createElement('div');
    div.className = "list-row" + (categoriaSeleccionadaId === c.id ? " selected" : "");
    div.innerHTML = `
      <span class="name" onclick="verPlatillos('${c.id}')">${c.nombre} <span style="color:var(--muted); font-size:12px;">(orden ${c.orden})</span></span>
      <button class="btn-danger" onclick="eliminarCategoria('${c.id}')">Eliminar</button>
    `;
    cont.appendChild(div);
  });
}

async function crearCategoria(){
  const nombre = document.getElementById('nuevaCategoriaNombre').value.trim();
  const orden = parseInt(document.getElementById('nuevaCategoriaOrden').value) || 0;
  if(!nombre){ alert("Escribe un nombre de categoría."); return; }

  const { error } = await supabaseClient.from('categorias').insert({
    restaurante_id: restauranteSeleccionado.id, nombre, orden
  });
  if(error){ alert("Error: " + error.message); return; }

  document.getElementById('nuevaCategoriaNombre').value = "";
  document.getElementById('nuevaCategoriaOrden').value = "";
  await cargarCategorias();
  renderListaCategorias();
}

async function eliminarCategoria(id){
  if(!confirm("Esto elimina la categoría y sus platillos. ¿Continuar?")) return;
  const { error } = await supabaseClient.from('categorias').delete().eq('id', id);
  if(error){ alert("Error: " + error.message); return; }
  if(categoriaSeleccionadaId === id){
    categoriaSeleccionadaId = null;
    document.getElementById('cardPlatillos').style.display = "none";
  }
  await cargarCategorias();
  renderListaCategorias();
}

// ---------- PLATILLOS ----------

async function verPlatillos(categoriaId){
  categoriaSeleccionadaId = categoriaId;
  renderListaCategorias();
  const cat = categoriasDelRestaurante.find(c => c.id === categoriaId);
  document.getElementById('nombreCategoriaActiva').textContent = cat.nombre;
  document.getElementById('cardPlatillos').style.display = "block";

  const { data } = await supabaseClient.from('platillos')
    .select('*').eq('categoria_id', categoriaId).order('orden');
  platillosDeCategoria = data || [];
  renderListaPlatillos();
}

function renderListaPlatillos(){
  const cont = document.getElementById('listaPlatillos');
  cont.innerHTML = "";
  if(platillosDeCategoria.length === 0){
    cont.innerHTML = '<div class="empty-note">Sin platillos en esta categoría.</div>';
    return;
  }
  platillosDeCategoria.forEach(p => {
    const div = document.createElement('div');
    div.className = "list-row";
    div.innerHTML = `
      <span class="name ${p.disponible ? '' : 'disponible-off'}">${p.nombre} — $${Number(p.precio).toFixed(2)}</span>
      <label style="display:flex; align-items:center; gap:4px; font-size:12px; color:var(--muted);">
        <input type="checkbox" ${p.disponible ? 'checked' : ''} onchange="cambiarDisponibilidad('${p.id}', this.checked)" style="width:auto; margin:0;">
        Disponible
      </label>
      <button class="btn-danger" onclick="eliminarPlatillo('${p.id}')">Eliminar</button>
    `;
    cont.appendChild(div);
  });
}

async function crearPlatillo(){
  const nombre = document.getElementById('nuevoPlatilloNombre').value.trim();
  const descripcion = document.getElementById('nuevoPlatilloDesc').value.trim();
  const precio = parseFloat(document.getElementById('nuevoPlatilloPrecio').value);
  const foto_url = document.getElementById('nuevoPlatilloFoto').value.trim();

  if(!nombre || isNaN(precio)){ alert("Completa al menos el nombre y el precio."); return; }

  const { error } = await supabaseClient.from('platillos').insert({
    categoria_id: categoriaSeleccionadaId, nombre, descripcion, precio, foto_url
  });
  if(error){ alert("Error: " + error.message); return; }

  document.getElementById('nuevoPlatilloNombre').value = "";
  document.getElementById('nuevoPlatilloDesc').value = "";
  document.getElementById('nuevoPlatilloPrecio').value = "";
  document.getElementById('nuevoPlatilloFoto').value = "";
  await verPlatillos(categoriaSeleccionadaId);
}

async function cambiarDisponibilidad(id, disponible){
  const { error } = await supabaseClient.from('platillos').update({ disponible }).eq('id', id);
  if(error){ alert("Error: " + error.message); return; }
  await verPlatillos(categoriaSeleccionadaId);
}

async function eliminarPlatillo(id){
  if(!confirm("¿Eliminar este platillo?")) return;
  const { error } = await supabaseClient.from('platillos').delete().eq('id', id);
  if(error){ alert("Error: " + error.message); return; }
  await verPlatillos(categoriaSeleccionadaId);
}
