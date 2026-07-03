// 1. Capturar los elementos del DOM (HTML) usando selectores estándar de JS
const btnLinear = document.getElementById('btn-linear');
const btnTransport = document.getElementById('btn-transport');
const btnNetworks = document.getElementById('btn-networks');

const appTitle = document.getElementById('app-title');
const appContent = document.getElementById('app-content');

// Almacén temporal en memoria para el algoritmo CPM
let listaActividadesProyecto = [];

// ==========================================
// LÓGICA DE TU MÓDULO DE REDES (CPM)
// ==========================================
function inicializarModuloCPM() {
  const inputId = document.getElementById('actividadId');
  const inputDuracion = document.getElementById('actividadDuracion');
  const inputPredecesores = document.getElementById('actividadPredecesores');
  const botonAgregar = document.getElementById('btnAgregarActividad');
  const botonCalcular = document.getElementById('btnCalcularCPM');
  const areaVisualizacion = document.getElementById('visualizacionActividades');
  const areaResultados = document.getElementById('resultadoCPM');

  if (botonAgregar) {
    const nuevoBotonAgregar = botonAgregar.cloneNode(true);
    botonAgregar.replaceWith(nuevoBotonAgregar);

    nuevoBotonAgregar.addEventListener('click', () => {
      const idVal = inputId?.value.trim().toUpperCase() || '';
      const duracionVal = Number.parseInt(inputDuracion?.value || '', 10);
      const predVal = inputPredecesores?.value.trim().toUpperCase() || '';

      if (!idVal) {
        alert('Por favor, ingresa un ID válido.');
        return;
      }

      if (Number.isNaN(duracionVal) || duracionVal < 0) {
        alert('Por favor, ingresa una duración válida.');
        return;
      }

      const predecesoresLimpios = predVal ? predVal.split(',').map((p) => p.trim()).filter(Boolean) : [];
      listaActividadesProyecto.push({
        id: idVal,
        duracion: duracionVal,
        predecesores: predecesoresLimpios
      });

      if (inputId) inputId.value = '';
      if (inputDuracion) inputDuracion.value = '';
      if (inputPredecesores) inputPredecesores.value = '';

      if (areaVisualizacion) {
        let textoLista = '';
        listaActividadesProyecto.forEach((act) => {
          const cadenaPred = act.predecesores.length > 0 ? act.predecesores.join(', ') : 'Ninguno';
          textoLista += `• Actividad [${act.id}] ➔ Duración: ${act.duracion} d | Predecesores: [${cadenaPred}]\n`;
        });
        areaVisualizacion.textContent = textoLista;
      }
    });
  }

  if (botonCalcular) {
    botonCalcular.addEventListener('click', () => {
      if (listaActividadesProyecto.length === 0) {
        alert('Añade al menos una actividad primero.');
        return;
      }

      const resultados = [];
      listaActividadesProyecto.forEach((act) => {
        const predecesores = act.predecesores || [];
        const es = predecesores.length > 0
          ? Math.max(...resultados.filter((p) => predecesores.includes(p.id)).map((p) => p.ef || 0))
          : 0;
        const ef = es + act.duracion;
        resultados.push({ ...act, es, ef, ls: 0, lf: 0, holgura: 0 });
      });

      const tiempoTotal = resultados.length > 0 ? Math.max(...resultados.map((a) => a.ef)) : 0;
      for (let i = resultados.length - 1; i >= 0; i -= 1) {
        const act = resultados[i];
        const sucesores = resultados.filter((s) => s.predecesores.includes(act.id));
        act.lf = sucesores.length > 0 ? Math.min(...sucesores.map((s) => s.ls)) : tiempoTotal;
        act.ls = act.lf - act.duracion;
        act.holgura = act.ls - act.es;
      }

      if (areaResultados) {
        const rutaCritica = resultados.filter((act) => act.holgura === 0).map((act) => act.id).join(' ➔ ');
        areaResultados.textContent = [
          '=== RESULTADOS CPM ===',
          '',
          ...resultados.map((act) => `• Actividad [${act.id}]: ES:${act.es} | EF:${act.ef} | LS:${act.ls} | LF:${act.lf} | Holgura: ${act.holgura}`),
          '',
          `➔ RUTA CRÍTICA: ${rutaCritica || 'No definida'}`,
          `➔ DURACIÓN TOTAL: ${tiempoTotal} días.`
        ].join('\n');
      }
    });
  }
}

// ==========================================
// ENRUTADOR DE VISTAS (MENÚ GLOBAL)
// ==========================================
if (btnLinear && appTitle && appContent) {
  btnLinear.addEventListener('click', () => {
    appTitle.innerText = "Módulo I: Programación Lineal";
    appContent.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-teal-500 text-gray-800">
        <h3 class="text-lg font-bold mb-4">Método Simplex & Gráfico</h3>
        <p class="text-sm text-gray-600 mb-4">Aquí configurarás tu Función Objetivo y Restricciones.</p>
        <div class="p-4 bg-gray-50 rounded border border-dashed text-center text-gray-400">
          Área de carga de variables matemáticas...
        </div>
      </div>
    `;
  });
}

if (btnTransport && appTitle && appContent) {
  btnTransport.addEventListener('click', () => {
    appTitle.innerText = "Módulo II: Modelos de Transporte y Asignación";
    appContent.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500 text-gray-800">
        <h3 class="text-lg font-bold mb-4">Esquina Noroeste, Costo Mínimo y Vogel</h3>
        <div id="transport-matrix-container" class="p-4 bg-gray-50 text-center text-gray-400">
          Matriz de costos de transporte...
        </div>
      </div>
    `;
  });
}

if (btnNetworks && appTitle && appContent) {
  btnNetworks.addEventListener('click', () => {
    appTitle.innerText = "Módulo III: Optimización de Redes";
    
    // Inyección de tu layout de CPM
    appContent.innerHTML = `
      <div class="grid-layout">
        <section>
          <h2>1. Registrar Actividad</h2>
          <div class="row">
            <input type="text" id="actividadId" placeholder="ID (ej. A)">
            <input type="number" id="actividadDuracion" placeholder="Duración (días)">
            <input type="text" id="actividadPredecesores" placeholder="Predecesores (ej. B,C)">
          </div>
          <button id="btnAgregarActividad" class="btn-secondary">Añadir Actividad</button>
          <hr>
          <h2>2. Calcular Ruta Crítica</h2>
          <button id="btnCalcularCPM" class="btn-primary">Calcular Tiempos y Holguras</button>
        </section>

        <section>
          <h2>Lista de Actividades Registradas</h2>
          <pre id="visualizacionActividades">Ninguna actividad añadida aún.</pre>
          <h2>Resultados del Análisis CPM</h2>
          <div id="resultadoCPM" class="resultado-box">
            Los tiempos tempranos, tardíos y la ruta crítica aparecerán aquí...
          </div>
        </section>
      </div>
    `;

    // Encendemos los escuchadores del botón recién creado
    inicializarModuloCPM();
  });
}