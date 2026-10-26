/**
 * Club de Futsal · Panel administrativo
 * Jugadores, pensiones y estadísticas, con alta, edición y eliminación.
 * Los datos se guardan en localStorage (sin servidor).
 */
(() => {
  'use strict';

  /* ========== Constantes ========== */
  const STORAGE_KEY = 'futsal-club';
  const CURRENT_MONTH = new Date().toISOString().slice(0, 7); // AAAA-MM
  const MESSAGE_MS = 3000;
  const CONFIRM_MS = 3000;

  /**
   * @typedef {{id:string, nombre:string, doc:string, nac:string, cat:string, acu:string, tel:string}} Jugador
   * @typedef {{id:string, jug:string, mes:string, val:number, fec:string, med:string}} Pago
   * @typedef {{id:string, jug:string, fec:string, g:number, a:number, r:number, s:number, m:number}} Estadistica
   * @typedef {{jugadores:Jugador[], pagos:Pago[], stats:Estadistica[]}} Estado
   */

  /** @returns {Estado} Datos de ejemplo para el primer uso. */
  const createSeedState = () => ({
    jugadores: [
      { id: 'a1', nombre: 'Santiago Ramírez', doc: '1020304050', nac: '2014-03-12', cat: 'Sub-12', acu: 'Laura Gómez', tel: '3001234567' },
      { id: 'a2', nombre: 'Mateo Rojas', doc: '1098765432', nac: '2012-07-21', cat: 'Sub-14', acu: 'Carlos Rojas', tel: '3109876543' },
    ],
    pagos: [],
    stats: [],
  });

  /* ========== Referencias al DOM ========== */
  const $ = (selector) => document.querySelector(selector);

  const dom = {
    main: $('main'),
    cards: $('#cards'),
    categoryFilter: $('#fcat'),
    playersBody: $('#t-jug-b'),
    paymentsBody: $('#t-pag-b'),
    statsBody: $('#t-est-b'),
    matchesBody: $('#t-par-b'),
    matchBar: $('#par-filtro'),
    matchName: $('#par-nombre'),
    showAllMatches: $('#par-todos'),
    paymentSelect: $('#s-pag'),
    statSelect: $('#s-est'),
    playerForm: $('#f-jug'),
    paymentForm: $('#f-pag'),
    statForm: $('#f-est'),
  };

  /* ========== Estado y persistencia ========== */
  /** @type {Estado} */
  let state = loadState();
  /** Jugador cuyos partidos se muestran en el historial (null = todos). */
  let matchFilter = null;

  /** @returns {Estado} */
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.jugadores)) return saved;
    } catch (error) {
      console.warn('No se pudo leer el almacenamiento local:', error);
    }
    return createSeedState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('No se pudo guardar en el almacenamiento local:', error);
    }
  }

  /* ========== Utilidades ========== */
  const newId = () => Math.random().toString(36).slice(2, 9);

  /** Escapa texto del usuario antes de insertarlo como HTML (evita XSS). */
  const escapeHtml = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const formatCop = (value) => `$${value.toLocaleString('es-CO')}`;
  const readForm = (form) => Object.fromEntries(new FormData(form));
  const playerName = (id) => state.jugadores.find((j) => j.id === id)?.nombre ?? '(eliminado)';
  const isPaidUp = (id) => state.pagos.some((p) => p.jug === id && p.mes === CURRENT_MONTH);
  const emptyRow = (cols, text) => `<tr><td colspan="${cols}">${text}</td></tr>`;

  /** Muestra un mensaje temporal en el elemento indicado. */
  function flash(selector, text) {
    const el = $(selector);
    el.textContent = text;
    setTimeout(() => { el.textContent = ''; }, MESSAGE_MS);
  }

  /** Botones Editar / Eliminar de una fila. `kind` indica la tabla de origen. */
  const rowActions = (kind, id, label) => `<div class="acc">
    <button type="button" class="ed" data-kind="${kind}" data-action="edit" data-id="${id}" aria-label="Editar ${escapeHtml(label)}">Editar</button>
    <button type="button" class="sec" data-kind="${kind}" data-action="delete" data-id="${id}" aria-label="Eliminar ${escapeHtml(label)}">Eliminar</button>
  </div>`;

  /** Confirmación en dos pasos dentro del propio botón (sin cuadros emergentes). */
  function confirmed(button) {
    if (button.dataset.armed) return true;
    button.dataset.armed = '1';
    button.textContent = '¿Seguro?';
    setTimeout(() => {
      if (!button.isConnected) return;
      delete button.dataset.armed;
      button.textContent = 'Eliminar';
    }, CONFIRM_MS);
    return false;
  }

  /* ========== Renderizado ========== */
  function renderSummary() {
    const total = state.jugadores.length;
    const paid = state.jugadores.filter((j) => isPaidUp(j.id)).length;
    const goals = state.stats.reduce((sum, e) => sum + e.g, 0);
    const items = [[total, 'Jugadores'], [paid, 'Pensión al día'], [total - paid, 'En mora'], [goals, 'Goles del club']];
    dom.cards.innerHTML = items.map(([n, label]) => `<div class="dato"><b>${n}</b><span>${label}</span></div>`).join('');
  }

  function renderPlayers() {
    const category = dom.categoryFilter.value;
    const players = state.jugadores.filter((j) => !category || j.cat === category);
    dom.playersBody.innerHTML = players.length
      ? players.map((j) => {
          const paid = isPaidUp(j.id);
          return `<tr>
            <td>${escapeHtml(j.nombre)}</td>
            <td>${j.cat}</td>
            <td>${escapeHtml(j.acu)}<br><small>${escapeHtml(j.tel)}</small></td>
            <td><span class="pill ${paid ? 'ok' : 'mora'}">${paid ? 'Al día' : 'Pendiente'}</span></td>
            <td>${rowActions('player', j.id, j.nombre)}</td>
          </tr>`;
        }).join('')
      : emptyRow(5, 'No hay jugadores en esta categoría. Registre el primero.');
  }

  function renderPlayerSelects() {
    const options = state.jugadores.map((j) => `<option value="${j.id}">${escapeHtml(j.nombre)} (${j.cat})</option>`).join('');
    [dom.paymentSelect, dom.statSelect].forEach((select) => {
      const previous = select.value;
      select.innerHTML = options;
      if (previous) select.value = previous;
    });
  }

  function renderPayments() {
    dom.paymentsBody.innerHTML = state.pagos.length
      ? [...state.pagos].reverse().map((p) => `<tr>
          <td>${escapeHtml(playerName(p.jug))}</td><td>${p.mes}</td><td>${formatCop(p.val)}</td><td>${p.fec}</td><td>${p.med}</td>
          <td>${rowActions('payment', p.id, `pago de ${playerName(p.jug)} (${p.mes})`)}</td>
        </tr>`).join('')
      : emptyRow(6, 'Aún no hay pagos registrados.');
  }

  /** Suma las estadísticas de cada jugador. */
  function aggregateStats() {
    const totals = {};
    state.stats.forEach((e) => {
      const t = (totals[e.jug] ??= { pj: 0, g: 0, a: 0, r: 0, s: 0, m: 0 });
      t.pj += 1;
      ['g', 'a', 'r', 's', 'm'].forEach((key) => { t[key] += e[key]; });
    });
    return totals;
  }

  function renderStats() {
    const entries = Object.entries(aggregateStats());
    dom.statsBody.innerHTML = entries.length
      ? entries.map(([id, t]) => `<tr>
          <td>${escapeHtml(playerName(id))}</td><td>${t.pj}</td><td>${t.g}</td><td>${t.a}</td><td>${t.r}</td><td>${t.s}</td><td>${t.m}</td>
          <td>${rowActions('agg', id, `estadísticas de ${playerName(id)}`)}</td>
        </tr>`).join('')
      : emptyRow(8, 'Aún no hay estadísticas. Registre el primer partido.');
  }

  /** Historial partido a partido; cada fila se puede editar o eliminar. */
  function renderMatches() {
    const matches = state.stats
      .filter((e) => !matchFilter || e.jug === matchFilter)
      .sort((x, y) => y.fec.localeCompare(x.fec));
    dom.matchBar.hidden = !matchFilter;
    if (matchFilter) dom.matchName.textContent = `Partidos de ${playerName(matchFilter)}`;
    dom.matchesBody.innerHTML = matches.length
      ? matches.map((e) => `<tr>
          <td>${escapeHtml(playerName(e.jug))}</td><td>${e.fec}</td><td>${e.g}</td><td>${e.a}</td><td>${e.r}</td><td>${e.s}</td><td>${e.m}</td>
          <td>${rowActions('stat', e.id, `partido de ${playerName(e.jug)} (${e.fec})`)}</td>
        </tr>`).join('')
      : emptyRow(8, 'No hay partidos registrados.');
  }

  function render() {
    renderSummary();
    renderPlayers();
    renderPlayerSelects();
    renderPayments();
    renderStats();
    renderMatches();
  }

  /* ========== Edición de formularios ========== */
  const submitButton = (form) => form.querySelector('[type="submit"]');

  /** Carga un registro en su formulario y activa el modo edición. */
  function startEdit(form, record) {
    Object.entries(record).forEach(([key, value]) => {
      const field = form.elements[key];
      if (field && key !== 'id') field.value = value;
    });
    form.dataset.editId = record.id;
    submitButton(form).textContent = 'Guardar cambios';
    form.querySelector('[data-cancel]').hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.querySelector('input, select').focus({ preventScroll: true });
  }

  /** Vuelve el formulario a modo "nuevo registro". */
  function resetForm(form) {
    form.reset();
    delete form.dataset.editId;
    submitButton(form).textContent = submitButton(form).dataset.label;
    form.querySelector('[data-cancel]').hidden = true;
    if (form === dom.paymentForm) form.elements.mes.value = CURRENT_MONTH;
  }

  /** Cancela la edición de formularios cuyo registro ya no existe. */
  function syncEdits() {
    [[dom.playerForm, state.jugadores], [dom.paymentForm, state.pagos], [dom.statForm, state.stats]].forEach(([form, list]) => {
      if (form.dataset.editId && !list.some((item) => item.id === form.dataset.editId)) resetForm(form);
    });
  }

  /** Crea el registro o, si hay `editId`, actualiza el existente. */
  function upsert(list, fields, editId) {
    if (editId) Object.assign(list.find((item) => item.id === editId), fields);
    else list.push({ id: newId(), ...fields });
  }

  function finishSave(form, messageSelector, text) {
    saveState();
    resetForm(form);
    render();
    flash(messageSelector, text);
  }

  /* ========== Envío de formularios ========== */
  // La validación HTML (required, pattern, min, max) se ejecuta antes de "submit".
  function onPlayerSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = readForm(form);
    const editId = form.dataset.editId;
    if (state.jugadores.some((j) => j.doc === data.doc && j.id !== editId)) {
      flash('#m-jug', 'Ya existe un jugador con ese documento.');
      return;
    }
    upsert(state.jugadores, {
      nombre: data.nombre.trim(), doc: data.doc, nac: data.nac, cat: data.cat, acu: data.acu.trim(), tel: data.tel,
    }, editId);
    finishSave(form, '#m-jug', editId ? 'Jugador actualizado.' : 'Jugador registrado.');
  }

  function onPaymentSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = readForm(form);
    const editId = form.dataset.editId;
    if (state.pagos.some((p) => p.jug === data.jug && p.mes === data.mes && p.id !== editId)) {
      flash('#m-pag', 'Ese mes ya está pagado.');
      return;
    }
    upsert(state.pagos, { jug: data.jug, mes: data.mes, val: Number(data.val), fec: data.fec, med: data.med }, editId);
    finishSave(form, '#m-pag', editId ? 'Pago actualizado.' : 'Pago guardado.');
  }

  function onStatSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = readForm(form);
    const editId = form.dataset.editId;
    upsert(state.stats, {
      jug: data.jug, fec: data.fec,
      g: Number(data.g), a: Number(data.a), r: Number(data.r), s: Number(data.s), m: Number(data.m),
    }, editId);
    finishSave(form, '#m-est', editId ? 'Estadística actualizada.' : 'Estadística guardada.');
  }

  /* ========== Acciones de las tablas (editar / eliminar) ========== */
  const findById = (list, id) => list.find((item) => item.id === id);

  const actionHandlers = {
    player: {
      edit: (id) => startEdit(dom.playerForm, findById(state.jugadores, id)),
      delete: (id) => {
        state.jugadores = state.jugadores.filter((j) => j.id !== id);
        state.pagos = state.pagos.filter((p) => p.jug !== id);
        state.stats = state.stats.filter((s) => s.jug !== id);
        if (matchFilter === id) matchFilter = null;
      },
    },
    payment: {
      edit: (id) => startEdit(dom.paymentForm, findById(state.pagos, id)),
      delete: (id) => { state.pagos = state.pagos.filter((p) => p.id !== id); },
    },
    stat: {
      edit: (id) => startEdit(dom.statForm, findById(state.stats, id)),
      delete: (id) => { state.stats = state.stats.filter((s) => s.id !== id); },
    },
    // Fila acumulada: "editar" abre sus partidos; "eliminar" borra todos sus partidos.
    agg: {
      edit: (id) => {
        matchFilter = id;
        renderMatches();
        dom.matchBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      delete: (id) => {
        state.stats = state.stats.filter((s) => s.jug !== id);
        if (matchFilter === id) matchFilter = null;
      },
    },
  };

  function onActionClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const { kind, action, id } = button.dataset;
    if (action === 'delete') {
      if (!confirmed(button)) return;
      actionHandlers[kind].delete(id);
      saveState();
      syncEdits();
      render();
    } else {
      actionHandlers[kind].edit(id);
    }
  }

  /* ========== Inicio ========== */
  function init() {
    [dom.playerForm, dom.paymentForm, dom.statForm].forEach((form) => {
      submitButton(form).dataset.label = submitButton(form).textContent;
      form.addEventListener('click', (event) => { if (event.target.matches('[data-cancel]')) resetForm(form); });
    });
    dom.paymentForm.elements.mes.value = CURRENT_MONTH;
    dom.playerForm.addEventListener('submit', onPlayerSubmit);
    dom.paymentForm.addEventListener('submit', onPaymentSubmit);
    dom.statForm.addEventListener('submit', onStatSubmit);
    dom.categoryFilter.addEventListener('change', renderPlayers);
    dom.showAllMatches.addEventListener('click', () => { matchFilter = null; renderMatches(); });
    dom.main.addEventListener('click', onActionClick);
    render();
  }

  init();
})();
