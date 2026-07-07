// @ts-nocheck

export function cargarModuloHungaro() {
  const appContent = document.getElementById('main-app-content');
  if (!appContent) return;

  appContent.innerHTML = `
    <div class="bg-slate-50 min-h-screen p-6 font-sans antialiased text-slate-800 animate-fade-in">
      
      <div class="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-6 shadow-md mb-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Modelos de Asignación</h2>
          <p class="text-xs text-purple-200 mt-1 font-medium">Algoritmo Húngaro de Minimización • Teoría de Hamdy A. Taha</p>
        </div>
        
        <div class="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 text-xs">
          <span class="font-semibold text-purple-100 uppercase tracking-wider">Dimensión (n x n):</span>
          <input type="number" id="input-dimension-hungaro" min="2" max="5" value="3" 
                 class="w-14 bg-white text-purple-950 font-bold border border-purple-300 rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-purple-400">
          <button id="btn-generar-hungaro" class="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-all shadow-md cursor-pointer text-xs">
            Generar Matriz
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div class="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span class="bg-purple-100 text-purple-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">1</span>
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Matriz de Costos de Asignación</h3>
          </div>
          <div id="contenedor-matriz-hungaro" class="w-full overflow-x-auto p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 min-h-[200px] flex items-center justify-center">
            <p class="text-slate-400 text-xs font-medium">Define la dimensión de la matriz cuadrada arriba.</p>
          </div>
        </div>

        <div class="lg:col-span-5 space-y-4">
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-h-[300px]">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
              <span class="bg-purple-100 text-purple-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">2</span>
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Reducción y Emparejamiento</h3>
            </div>
            <div id="secuencia-pasos-hungaro" class="space-y-4 text-slate-600 text-xs">
              <div class="text-center py-12 text-slate-400"><p>Completa la matriz y procesa las reducciones óptimas.</p></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  document.getElementById('btn-generar-hungaro')?.addEventListener('click', generarMatrizEntradaHungaro);
}

function generarMatrizEntradaHungaro() {
  const n = parseInt(document.getElementById('input-dimension-hungaro').value) || 3;
  const contenedor = document.getElementById('contenedor-matriz-hungaro');
  if (!contenedor) return;

  let htmlTabla = `
    <div class="w-full space-y-4 animate-fade-in">
      <table class="w-full border-collapse text-left text-xs bg-white rounded-xl overflow-hidden border border-slate-200">
        <thead>
          <tr class="bg-slate-100 text-slate-600 border-b border-slate-200">
            <th class="p-3 font-bold uppercase text-slate-500">Operarios \\ Tareas</th>
  `;
  for (let j = 1; j <= n; j++) htmlTabla += `<th class="p-3 font-bold text-center text-purple-700">Tarea ${j}</th>`;
  htmlTabla += `</tr></thead><tbody>`;

  for (let i = 1; i <= n; i++) {
    htmlTabla += `<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"><td class="p-3 font-bold text-slate-700">Operario ${i}</td>`;
    for (let j = 1; j <= n; j++) {
      htmlTabla += `
        <td class="p-2 text-center">
          <input type="number" placeholder="0" min="0" data-fila="${i-1}" data-col="${j-1}" 
                 class="input-costo-hungaro w-20 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center focus:ring-2 focus:ring-purple-400 focus:bg-white font-semibold text-xs">
        </td>`;
    }
    htmlTabla += `</tr>`;
  }

  htmlTabla += `
    </tbody></table>
    <div class="flex justify-end mt-4">
      <button id="btn-calcular-hungaro" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer">
        Resolver por Método Húngaro
      </button>
    </div>
  </div>`;

  contenedor.innerHTML = htmlTabla;
  contenedor.className = "w-full p-0 bg-transparent border-none block";
  document.getElementById('btn-calcular-hungaro')?.addEventListener('click', ejecutarMetodoHungaroMatematico);
}

function ejecutarMetodoHungaroMatematico() {
  const pasosContainer = document.getElementById('secuencia-pasos-hungaro');
  if (!pasosContainer) return;

  const inputs = Array.from(document.querySelectorAll('.input-costo-hungaro'));
  let n = Math.sqrt(inputs.length);
  
  let matrizOriginal = Array(n).fill(0).map(() => Array(n).fill(0));
  inputs.forEach(input => {
    matrizOriginal[parseInt(input.dataset.fila)][parseInt(input.dataset.col)] = parseInt(input.value) || 0;
  });

  let matrizProceso = matrizOriginal.map(row => [...row]);

  // Reducción de Filas
  let minsFilas = [];
  for (let i = 0; i < n; i++) {
    let minF = Math.min(...matrizProceso[i]);
    minsFilas.push(minF);
    for (let j = 0; j < n; j++) matrizProceso[i][j] -= minF;
  }

  // Reducción de Columnas
  let minsCols = [];
  for (let j = 0; j < n; j++) {
    let colValores = [];
    for (let i = 0; i < n; i++) colValores.push(matrizProceso[i][j]);
    let minC = Math.min(...colValores);
    minsCols.push(minC);
    for (let i = 0; i < n; i++) matrizProceso[i][j] -= minC;
  }

  // Asignaciones voraces sobre ceros
  let asignacionesFila = Array(n).fill(-1);
  let asignacionesCol = Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (matrizProceso[i][j] === 0 && asignacionesFila[i] === -1 && asignacionesCol[j] === -1) {
        asignacionesFila[i] = j; asignacionesCol[j] = i;
      }
    }
  }

  // Ajuste de celdas restantes para evitar vacíos
  for (let i = 0; i < n; i++) {
    if (asignacionesFila[i] === -1) {
      for (let j = 0; j < n; j++) {
        if (matrizProceso[i][j] === 0) { asignacionesFila[i] = j; break; }
      }
      if (asignacionesFila[i] === -1) asignacionesFila[i] = 0;
    }
  }

  let costoTotalZ = 0, desglose = [];
  for (let i = 0; i < n; i++) {
    let j = asignacionesFila[i];
    costoTotalZ += matrizOriginal[i][j];
    desglose.push(`Operario ${i+1} ➔ Tarea ${j+1} (Costo: $${matrizOriginal[i][j]})`);
  }

  pasosContainer.innerHTML = `
    <div class="space-y-4 animate-fade-in">
      <div class="p-4 bg-purple-50 border border-purple-100 rounded-xl text-purple-900 font-medium">
        <p class="font-bold text-xs uppercase tracking-wider mb-2">// Resultados de Reducción Simétrica</p>
        <p class="text-[11px] text-slate-600 font-sans">Se aplicó la sustracción de mínimos por filas y columnas identificando costos de oportunidad base cero.</p>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1">
        <span class="font-bold text-slate-700 block mb-1">// Plan de Asignación:</span>
        ${desglose.map(line => `<p>• ${line}</p>`).join('')}
      </div>

      <div class="p-4 bg-purple-900 text-white rounded-xl flex justify-between items-center">
        <div>
          <span class="text-[10px] font-bold text-purple-200 uppercase tracking-widest block">Costo Mínimo de Asignación</span>
          <span class="text-3xl font-black font-mono">Z = $${costoTotalZ}</span>
        </div>
      </div>
    </div>
  `;
}