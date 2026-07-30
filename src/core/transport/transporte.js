// @ts-nocheck

export function cargarModuloTransporte() {
  const appContent = document.getElementById('main-app-content');
  if (!appContent) return;

  appContent.innerHTML = `
    <div class="bg-slate-50 min-h-screen p-6 font-sans antialiased text-slate-800 animate-fade-in">
      <div class="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-6 shadow-md mb-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Modelos de Transporte</h2>
          <p class="text-xs text-purple-200 mt-1 font-medium">Métodos de Distribución Logística con Auto-Balanceo • Hamdy A. Taha</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-purple-100 uppercase tracking-wider">Fuentes:</span>
            <input type="number" id="input-fuentes" min="2" max="5" value="3" class="w-14 bg-white text-purple-950 font-bold border border-purple-300 rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-purple-400">
          </div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-purple-100 uppercase tracking-wider">Destinos:</span>
            <input type="number" id="input-destinos" min="2" max="5" value="3" class="w-14 bg-white text-purple-950 font-bold border border-purple-300 rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-purple-400">
          </div>
          <button id="btn-generar-matriz" class="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-all shadow-md cursor-pointer text-xs">Generar Tablero</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span class="bg-purple-100 text-purple-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">1</span>
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Matriz de Costos, Oferta y Demanda</h3>
          </div>
          <div id="contenedor-matriz" class="w-full overflow-x-auto p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 min-h-[200px] flex items-center justify-center">
            <p class="text-slate-400 text-xs font-medium">Genera el tablero para ingresar costos y parámetros.</p>
          </div>
        </div>

        <div class="lg:col-span-5 space-y-4">
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-h-[300px]">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
              <span class="bg-purple-100 text-purple-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">2</span>
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Solución y Criterio Analítico</h3>
            </div>
            <div id="secuencia-pasos" class="space-y-4 text-slate-600 text-xs">
              <div class="text-center py-12 text-slate-400"><p>Completa la matriz y procesa el auto-balanceo Taha.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('btn-generar-matriz')?.addEventListener('click', generarMatrizTransporte);
}

function generarMatrizTransporte() {
  const f = parseInt(document.getElementById('input-fuentes').value) || 3;
  const d = parseInt(document.getElementById('input-destinos').value) || 3;
  const contenedor = document.getElementById('contenedor-matriz');
  if (!contenedor) return;

  let htmlTable = `
    <div class="w-full space-y-4 animate-fade-in">
      <table class="w-full border-collapse text-left text-xs bg-white rounded-xl overflow-hidden border border-slate-200">
        <thead>
          <tr class="bg-slate-100 text-slate-600 border-b border-slate-200">
            <th class="p-3 font-bold uppercase text-slate-500">Orígenes \\ Destinos</th>
  `;
  for (let j = 1; j <= d; j++) htmlTable += `<th class="p-3 font-bold text-center text-purple-700">Destino ${j}</th>`;
  htmlTable += `<th class="p-3 font-bold text-center bg-purple-50 text-purple-800">Oferta</th></tr></thead><tbody>`;

  for (let i = 1; i <= f; i++) {
    htmlTable += `<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"><td class="p-3 font-bold text-slate-700">Fuente ${i}</td>`;
    for (let j = 1; j <= d; j++) {
      htmlTable += `
        <td class="p-2 text-center">
          <input type="number" placeholder="0" min="0" data-row="${i-1}" data-col="${j-1}" class="input-costo w-20 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center focus:ring-2 focus:ring-purple-400 focus:bg-white font-semibold text-xs">
        </td>`;
    }
    htmlTable += `
      <td class="p-2 bg-purple-50/30">
        <input type="number" placeholder="0" min="0" data-oferta="${i-1}" class="input-oferta w-20 bg-white border border-purple-200 rounded-lg p-2 text-center text-purple-900 font-bold focus:ring-2 focus:ring-purple-500 text-xs">
      </td></tr>`;
  }

  htmlTable += `<tr class="bg-purple-50/20 font-bold"><td class="p-3 text-purple-800">Demanda</td>`;
  for (let j = 0; j < d; j++) {
    htmlTable += `
      <td class="p-2 text-center">
        <input type="number" placeholder="0" min="0" data-demanda="${j}" class="input-demanda w-20 bg-white border border-purple-200 rounded-lg p-2 text-center text-purple-900 font-bold focus:ring-2 focus:ring-purple-500 text-xs">
      </td>`;
  }
  htmlTable += `
      <td class="bg-purple-100/40 p-2 text-center text-purple-900 font-mono text-[11px] flex items-center justify-center h-12">Σ Balance</td>
    </tr></tbody></table>

    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-100/60 p-4 rounded-xl border border-slate-200">
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-slate-600 uppercase tracking-wider">Algoritmo:</span>
        <select id="select-metodo" class="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-semibold focus:ring-2 focus:ring-purple-400">
          <option value="esquina-noroeste">Esquina Noroeste</option>
          <option value="costo-minimo">Costo Mínimo</option>
          <option value="vogel">Aproximación de Vogel (VAM)</option>
        </select>
      </div>
      <button id="btn-resolver" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer w-full sm:w-auto">Calcular Solución Inicial</button>
    </div>
  </div>`;

  contenedor.innerHTML = htmlTable;
  contenedor.className = "w-full p-0 bg-transparent border-none text-left block";
  document.getElementById('btn-resolver')?.addEventListener('click', ejecutarProcesamientoTaha);
}

function ejecutarProcesamientoTaha() {
  const pasosContainer = document.getElementById('secuencia-pasos');
  if (!pasosContainer) return;

  const inputsCosto = Array.from(document.querySelectorAll('.input-costo'));
  const inputsOferta = Array.from(document.querySelectorAll('.input-oferta'));
  const inputsDemanda = Array.from(document.querySelectorAll('.input-demanda'));
  const metodo = document.getElementById('select-metodo').value;

  let fOriginal = inputsOferta.length;
  let dOriginal = inputsDemanda.length;

  let costosBase = Array(fOriginal).fill(0).map(() => Array(dOriginal).fill(0));
  let ofertaBase = inputsOferta.map(i => parseInt(i.value) || 0);
  let demandaBase = inputsDemanda.map(i => parseInt(i.value) || 0);

  inputsCosto.forEach(inp => {
    costosBase[parseInt(inp.dataset.row)][parseInt(inp.dataset.col)] = parseInt(inp.value) || 0;
  });

  let totalOferta = ofertaBase.reduce((a, b) => a + b, 0);
  let totalDemanda = demandaBase.reduce((a, b) => a + b, 0);

  if (totalOferta === 0 || totalDemanda === 0) {
    pasosContainer.innerHTML = `<div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">⚠️ Error: La oferta y la demanda deben ser mayores a cero.</div>`;
    return;
  }

  // LOGICA DE AUTO-BALANCEO INTEGRADA (Criterio Canónico de Hamdy A. Taha)
  let costos = costosBase.map(row => [...row]);
  let oferta = [...ofertaBase];
  let demanda = [...demandaBase];
  let f = fOriginal;
  let d = dOriginal;
  let bitacoraBalanceoHtml = "";

  if (totalOferta > totalDemanda) {
    let diff = totalOferta - totalDemanda;
    d = dOriginal + 1;
    demanda.push(diff);
    for (let i = 0; i < f; i++) costos[i].push(0); // Destino Ficticio con Costo 0
    bitacoraBalanceoHtml = `
      <div class="p-3 bg-purple-50 border border-purple-100 rounded-xl text-[11px] mb-3">
        <span class="font-bold text-purple-800">⚙️ Auto-Balanceo Activado:</span> Oferta (${totalOferta}) > Demanda (${totalDemanda}). Se añade el <b class="text-purple-900">Destino Ficticio ${d}</b> con demanda de <b>${diff}</b> y costo $0.
      </div>`;
  } else if (totalDemanda > totalOferta) {
    let diff = totalDemanda - totalOferta;
    f = fOriginal + 1;
    oferta.push(diff);
    let nuevaFila = Array(dOriginal).fill(0);
    costos.push(nuevaFila); // Fuente Ficticia con Costo 0
    bitacoraBalanceoHtml = `
      <div class="p-3 bg-purple-50 border border-purple-100 rounded-xl text-[11px] mb-3">
        <span class="font-bold text-purple-800">⚙️ Auto-Balanceo Activado:</span> Demanda (${totalDemanda}) > Oferta (${totalOferta}). Se añade la <b class="text-purple-900">Fuente Ficticia ${f}</b> con oferta de <b>${diff}</b> y costo $0.
      </div>`;
  }

  // Inicialización de asignaciones sobre la matriz balanceada resultante
  let asignaciones = Array(f).fill(0).map(() => Array(d).fill(0));
  let ofRestante = [...oferta];
  let demRestante = [...demanda];

  if (metodo === 'esquina-noroeste') {
    let i = 0, j = 0;
    while (i < f && j < d) {
      let cant = Math.min(ofRestante[i], demRestante[j]);
      asignaciones[i][j] = cant;
      ofRestante[i] -= cant; demRestante[j] -= cant;
      if (ofRestante[i] === 0) i++; else j++;
    }
  } else if (metodo === 'costo-minimo') {
    while (ofRestante.reduce((a, b) => a + b, 0) > 0) {
      let minCosto = Infinity, rSel = -1, cSel = -1;
      for (let i = 0; i < f; i++) {
        if (ofRestante[i] === 0) continue;
        for (let j = 0; j < d; j++) {
          if (demRestante[j] === 0) continue;
          if (costos[i][j] < minCosto) { minCosto = costos[i][j]; rSel = i; cSel = j; }
        }
      }
      if (rSel === -1) break;
      let cant = Math.min(ofRestante[rSel], demRestante[cSel]);
      asignaciones[rSel][cSel] = cant;
      ofRestante[rSel] -= cant; demRestante[cSel] -= cant;
    }
  } else if (metodo === 'vogel') {
    while (ofRestante.reduce((a, b) => a + b, 0) > 0 && demRestante.reduce((a, b) => a + b, 0) > 0) {
      let maxPenalizacion = -1, filaOSegmentos = true, indiceSel = -1;

      for (let i = 0; i < f; i++) {
        if (ofRestante[i] === 0) continue;
        let cFila = [];
        for (let j = 0; j < d; j++) if (demRestante[j] > 0) cFila.push(costos[i][j]);
        cFila.sort((a, b) => a - b);
        let pen = cFila.length > 1 ? cFila[1] - cFila[0] : (cFila[0] || 0);
        if (pen > maxPenalizacion) { maxPenalizacion = pen; filaOSegmentos = true; indiceSel = i; }
      }

      for (let j = 0; j < d; j++) {
        if (demRestante[j] === 0) continue;
        let cCol = [];
        for (let i = 0; i < f; i++) if (ofRestante[i] > 0) cCol.push(costos[i][j]);
        cCol.sort((a, b) => a - b);
        let pen = cCol.length > 1 ? cCol[1] - cCol[0] : (cCol[0] || 0);
        if (pen > maxPenalizacion) { maxPenalizacion = pen; filaOSegmentos = false; indiceSel = j; }
      }

      if (indiceSel === -1) break;

      let rSel = -1, cSel = -1;
      if (filaOSegmentos) {
        rSel = indiceSel; let minC = Infinity;
        for (let j = 0; j < d; j++) {
          if (demRestante[j] > 0 && costos[rSel][j] < minC) { minC = costos[rSel][j]; cSel = j; }
        }
      } else {
        cSel = indiceSel; let minC = Infinity;
        for (let i = 0; i < f; i++) {
          if (ofRestante[i] > 0 && costos[i][cSel] < minC) { minC = costos[i][cSel]; rSel = i; }
        }
      }

      let cant = Math.min(ofRestante[rSel], demRestante[cSel]);
      asignaciones[rSel][cSel] = cant;
      ofRestante[rSel] -= cant; demRestante[cSel] -= cant;
    }
  }

  let z = 0, desglose = [];
  for (let i = 0; i < f; i++) {
    for (let j = 0; j < d; j++) {
      if (asignaciones[i][j] > 0) {
        let p = asignaciones[i][j] * costos[i][j]; z += p;
        let labelF = (i >= fOriginal) ? `Ficticia ${i+1}` : `Fuente ${i+1}`;
        let labelD = (j >= dOriginal) ? `Ficticio ${j+1}` : `Destino ${j+1}`;
        desglose.push(`${labelF} ➔ ${labelD}: ${asignaciones[i][j]} uds × $${costos[i][j]} = $${p}`);
      }
    }
  }

  pasosContainer.innerHTML = `
    <div class="space-y-4 animate-fade-in">
      ${bitacoraBalanceoHtml}
      
      <div class="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase font-mono">Factible</span>
        <h4 class="text-sm font-bold mt-1">Solución Inicial Procesada</h4>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1">
        ${desglose.map(line => `<p>• ${line}</p>`).join('')}
      </div>
      <div class="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
        <div>
          <span class="text-[10px] font-bold text-purple-600 uppercase tracking-widest block">Costo Base Obtenido</span>
          <span class="text-2xl font-extrabold text-purple-900 font-mono">Z = $${z}</span>
        </div>
        <button id="btn-optimizar-modi" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all">Optimizar MODI</button>
      </div>
      <div id="contenedor-modi-resultados" class="mt-4 hidden"></div>
    </div>
  `;

  document.getElementById('btn-optimizar-modi')?.addEventListener('click', () => {
    calcularMetodoMODI(f, d, costos, asignaciones);
  });
}

function calcularMetodoMODI(f, d, costos, asignaciones) {
  const modiContainer = document.getElementById('contenedor-modi-resultados');
  if (!modiContainer) return;
  modiContainer.classList.remove('hidden');

  let u = Array(f).fill(0), v = Array(d).fill(0);
  let uAsp = Array(f).fill(false), vAsp = Array(d).fill(false);
  u[0] = 0; uAsp[0] = true;

  for (let it = 0; it < f + d; it++) {
    for (let i = 0; i < f; i++) {
      for (let j = 0; j < d; j++) {
        if (asignaciones[i][j] > 0) {
          if (uAsp[i] && !vAsp[j]) { v[j] = costos[i][j] - u[i]; vAsp[j] = true; }
          else if (!uAsp[i] && vAsp[j]) { u[i] = costos[i][j] - v[j]; uAsp[i] = true; }
        }
      }
    }
  }

  let esOptimo = true, maxMarginal = -1;
  for (let i = 0; i < f; i++) {
    for (let j = 0; j < d; j++) {
      if (asignaciones[i][j] === 0) {
        let cm = u[i] + v[j] - costos[i][j];
        if (cm > 0) { esOptimo = false; if (cm > maxMarginal) maxMarginal = cm; }
      }
    }
  }

  let htmlMODI = `
    <div class="border-t border-slate-200 pt-4 space-y-4 animate-fade-in">
      <div class="p-4 bg-slate-900 text-white rounded-xl font-mono text-[11px]">
        <h5 class="font-bold text-purple-300 uppercase tracking-wider mb-2">// Multiplicadores en Matriz Balanceada</h5>
        <div class="grid grid-cols-2 gap-2 text-slate-300">
          <div>${u.map((val, idx) => `<p>u<sub>${idx+1}</sub> = ${val}</p>`).join('')}</div>
          <div>${v.map((val, idx) => `<p>v<sub>${idx+1}</sub> = ${val}</p>`).join('')}</div>
        </div>
      </div>
  `;

  if (esOptimo) {
    htmlMODI += `<div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">🎯 Solución Óptima Global Confirmada. Los índices marginales en celdas básicas e imaginarias son ≤ 0.</div>`;
  } else {
    htmlMODI += `<div class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">⚠️ Solución No Óptima. Costo marginal detectado de +${maxMarginal}. Se requiere iteración de lazo cerrado (θ).</div>`;
  }

  htmlMODI += `</div>`;
  modiContainer.innerHTML = htmlMODI;
}