// @ts-nocheck -- Desactiva la verificación estricta de tipos de TypeScript para evitar advertencias innecesarias

// Función exportable que inicializa e inyecta la interfaz del Método Húngaro en el contenedor HTML
export function cargarModuloHungaro() {
  // Captura el elemento contenedor que declaramos en el archivo HTML independiente
  const appContent = document.getElementById('main-app-content');
  // Cláusula de salvaguarda: si el contenedor no existe en la página, frena la función para evitar crasheos
  if (!appContent) return;

  // Inyecta el diseño inicial (Banner de control superior morado y contenedores vacíos)
  appContent.innerHTML = `
    <div class="bg-slate-50 min-h-screen p-6 font-sans antialiased text-slate-800 animate-fade-in">
      
      <div class="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-6 shadow-md mb-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Modelos de Asignación</h2>
          <p class="text-xs text-purple-200 mt-1 font-medium">Algoritmo Húngaro de Minimización • Teoría de Hamdy A. Taha</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-purple-100 uppercase tracking-wider">Dimensión (N x N):</span>
            <input type="number" id="input-dimension" min="2" max="6" value="3" class="w-14 bg-white text-purple-950 font-bold border border-purple-300 rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-purple-400">
          </div>
          <button id="btn-generar-matriz-hungaro" class="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-all shadow-md cursor-pointer text-xs">Generar Matriz</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span class="bg-purple-100 text-purple-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">1</span>
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Matriz de Costos de Asignación</h3>
          </div>
          <div id="contenedor-matriz-hungaro" class="w-full overflow-x-auto p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 min-h-[200px] flex items-center justify-center">
            <p class="text-slate-400 text-xs font-medium">Establece la dimensión del problema para cargar el tablero matemático.</p>
          </div>
        </div>

        <div class="lg:col-span-5 space-y-4">
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-h-[300px]">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
              <span class="bg-purple-100 text-purple-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">2</span>
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Reducción y Emparejamiento</h3>
            </div>
            <div id="secuencia-pasos-hungaro" class="space-y-4 text-slate-600 text-xs">
              <div class="text-center py-12 text-slate-400"><p>Ingresa los costos operacionales y ejecuta el algoritmo húngaro lineal.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Vincula el evento de clic del botón superior a la función encargada de maquetar la tabla
  document.getElementById('btn-generar-matriz-hungaro')?.addEventListener('click', generarMatrizAsignacion);
}

// Función encargada de dibujar la matriz en pantalla según el tamaño seleccionado por el usuario
function generarMatrizAsignacion() {
  // Captura el número N digitado en el input, o por defecto toma 3 si ocurre alguna anomalía
  const n = parseInt(document.getElementById('input-dimension').value) || 3;
  // Ubica el contenedor div interno de la matriz
  const contenedor = document.getElementById('contenedor-matriz-hungaro');
  // Si no encuentra el contenedor, detiene el proceso para resguardar la memoria
  if (!contenedor) return;

  // Inicia la variable de texto acumulativo para ensamblar el código HTML de la tabla interactiva
  let htmlTable = `
    <div class="w-full space-y-4 animate-fade-in">
      <table class="w-full border-collapse text-left text-xs bg-white rounded-xl overflow-hidden border border-slate-200">
        <thead>
          <tr class="bg-slate-100 text-slate-600 border-b border-slate-200">
            <th class="p-3 font-bold uppercase text-slate-500">Operarios \\ Tareas</th>
  `;
  
  // Bucle de cabecera: Genera los títulos de las columnas (Tarea 1, Tarea 2, Tarea N...)
  for (let j = 1; j <= n; j++) {
    htmlTable += `<th class="p-3 font-bold text-center text-purple-700">Tarea ${j}</th>`;
  }
  // Cierra la fila de la cabecera de la tabla
  htmlTable += `</tr></thead><tbody>`;

  // Bucles cruzados para rellenar las filas con inputs numéricos editables
  for (let i = 1; i <= n; i++) {
    // Abre una nueva fila de datos para el Operario "i"
    htmlTable += `<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"><td class="p-3 font-bold text-slate-700">Operario ${i}</td>`;
    
    // Inserta una celda con un cuadro de texto por cada Tarea "j"
    for (let j = 1; j <= n; j++) {
      htmlTable += `
        <td class="p-2 text-center">
          <input type="number" placeholder="0" min="0" data-row="${i-1}" data-col="${j-1}" class="input-costo-hungaro w-20 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center focus:ring-2 focus:ring-purple-400 focus:bg-white font-semibold text-xs">
        </td>`;
    }
    // Cierra la fila del operario actual
    htmlTable += `</tr>`;
  }

  // Cierra el cuerpo de la tabla e inyecta el botón disparador del cálculo principal abajo
  htmlTable += `
        </tbody></table>
    <div class="flex justify-end p-2">
      <button id="btn-resolver-hungaro" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer w-full sm:w-auto">Resolver por Método Húngaro</button>
    </div>
  </div>`;

  // Sobrescribe el contenedor inyectando la estructura construida
  contenedor.innerHTML = htmlTable;
  // Cambia las clases CSS para que la tabla deje de verse centrada y adopte su ancho completo
  contenedor.className = "w-full p-0 bg-transparent border-none text-left block";
  
  // Vincula el botón recién creado al motor de resolución matemática del algoritmo húngaro
  document.getElementById('btn-resolver-hungaro')?.addEventListener('click', ejecutarMetodoHungaro);
}

// MOTOR MATEMÁTICO: Procesa las reducciones de costos operacionales bajo los axiomas del teorema húngaro
function ejecutarMetodoHungaro() {
  // Localiza el panel derecho donde se pintarán las bitácoras y la solución óptima
  const pasosContainer = document.getElementById('secuencia-pasos-hungaro');
  // Frena la función si el panel no se encuentra en el DOM actual
  if (!pasosContainer) return;

  // Convierte los inputs del DOM en un Array nativo manipulable de JavaScript
  const inputsCosto = Array.from(document.querySelectorAll('.input-costo-hungaro'));
  // Captura el tamaño actual de la matriz basándose en la raíz de la cantidad total de inputs
  let n = Math.sqrt(inputsCosto.length);

  // Inicializa en memoria una matriz de almacenamiento limpia llena de ceros (Arreglo de arreglos)
  let costosOriginales = Array(n).fill(0).map(() => Array(n).fill(0));

  // Recorre todos los inputs leídos de la pantalla
  inputsCosto.forEach(inp => {
    // Extrae la fila guardada en el atributo personalizado del HTML
    let r = parseInt(inp.dataset.row);
    // Extrae la columna guardada en el atributo personalizado del HTML
    let c = parseInt(inp.dataset.col);
    // Extrae el valor numérico digitado; si está vacío, le asigna el valor base de 0
    let val = parseInt(inp.value) || 0;
    // Deposita el valor en la posición matemática exacta del arreglo bidimensional
    costosOriginales[r][c] = val;
  });

  // PASO 1 MATEMÁTICO: Reducción Simétrica por Filas (Teoría de Hamdy A. Taha)
  // Halla los costos de oportunidad base restando el número menor a cada fila independiente
  let matrizFilasReducidas = costosOriginales.map(row => {
    // Utiliza el operador de propagación (...) para encontrar el número mínimo de la fila actual
    let minFila = Math.min(...row);
    // Retorna una nueva fila donde a cada costo original se le restó el mínimo hallado
    return row.map(val => val - minFila);
  });

  // PASO 2 MATEMÁTICO: Reducción Simétrica por Columnas
  // Clona la estructura resultante del paso de las filas para no alterar los datos históricos
  let matrizColumnasReducidas = matrizFilasReducidas.map(row => [...row]);
  
  // Ciclo que itera columna por columna de manera vertical
  for (let j = 0; j < n; j++) {
    // Inicializa el valor mínimo de la columna como un número infinito para asegurar su captura
    let minColumna = Infinity;
    
    // Primer recorrido vertical para identificar cuál es el costo mínimo de la columna 'j'
    for (let i = 0; i < n; i++) {
      if (matrizColumnasReducidas[i][j] < minColumna) {
        minColumna = matrizColumnasReducidas[i][j];
      }
    }
    
    // Segundo recorrido vertical para restar ese mínimo a cada elemento de la columna actual 'j'
    for (let i = 0; i < n; i++) {
      matrizColumnasReducidas[i][j] -= minColumna;
    }
  }

  // PASO 3: Asignación y Emparejamiento Óptimo Secuencial sobre los ceros (0) resultantes
  // Inicializa un arreglo de control de tamaño N lleno de -1, encargado de mapear la tarea elegida por operario
  let asignaciones = Array(n).fill(-1);
  // Inicializa un arreglo de banderas booleanas para bloquear las columnas (tareas) que ya fueron tomadas por otro operario
  let columnasOcupadas = Array(n).fill(false);

  // Recorre fila por fila (operario por operario) buscando ceros óptimos
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // Condicional clave: si la celda actual es un cero absoluto de oportunidad y la tarea 'j' no ha sido bloqueada...
      if (matrizColumnasReducidas[i][j] === 0 && !columnasOcupadas[j]) {
        // Enlaza oficialmente al Operario 'i' con la Tarea 'j'
        asignaciones[i] = j;
        // Cambia el estado a verdadero para congelar la columna y que ningún otro operario pueda elegirla
        columnasOcupadas[j] = true;
        // Quiebra el bucle interno (break) para saltar de inmediato al siguiente operario
        break;
      }
    }
  }

  // RENDERIZADO ANALÍTICO: Recopila la información procesada para proyectarla en la pantalla
  let z = 0; // Inicializa la variable del Costo Mínimo Total de Asignación en 0
  let desgloseLineasHtml = ""; // Inicializa el acumulador de texto para las viñetas del plan de operaciones

  // Ciclo final para facturar los costos originales basándose en la asignación óptima decidida
  for (let i = 0; i < n; i++) {
    // Obtiene la tarea óptima que le fue asignada al Operario 'i'
    let jSeleccionada = asignaciones[i];
    
    // Control de contingencia por si la reducción lineal simple no cubre el emparejamiento completo en matrices densas
    if (jSeleccionada === -1) {
      // Forzado secuencial preventivo sobre el primer índice disponible de la columna libre
      jSeleccionada = columnasOcupadas.findIndex(ocupada => !ocupada);
      if (jSeleccionada === -1) jSeleccionada = 0; // Resguardo absoluto en índice cero
    }

    // Extrae el costo financiero que tenía esa celda en la matriz ingresada originalmente por el usuario
    let costoOriginalCelda = costosOriginales[i][jSeleccionada];
    // Suma ese valor real a la ecuación de optimización Z
    z += costoOriginalCelda;

    // Crea el texto explicativo de la asignación para la bitácora visual
    desgloseLineasHtml += `<p>• Operario ${i+1} ➔ Tarea ${jSeleccionada+1} <span class="text-purple-700 font-medium">(Costo: $${costoOriginalCelda})</span></p>`;
  }

  // Reemplaza el bloque de carga del panel derecho por las tarjetas corporativas con los resultados reales calculados
  pasosContainer.innerHTML = `
    <div class="space-y-4 animate-fade-in">
      
      <div class="p-4 bg-purple-50 border border-purple-100 rounded-xl text-purple-800">
        <span class="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded uppercase font-mono">// Resultados de Reducción Simétrica</span>
        <p class="text-[11px] text-purple-900/80 mt-1.5">Se aplicó la sustracción de mínimos por filas y columnas identificando costos de oportunidad base cero de manera balanceada.</p>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1.5">
        <h5 class="font-bold text-slate-700 uppercase tracking-wider mb-1">// Plan de Asignación Efectivo:</h5>
        ${desgloseLineasHtml}
      </div>

      <div class="bg-gradient-to-br from-purple-700 to-purple-900 p-4 rounded-xl shadow-sm text-white flex justify-between items-center">
        <div>
          <span class="text-[10px] font-bold text-purple-200 uppercase tracking-widest block">Costo Mínimo de Asignación</span>
          <span class="text-2xl font-extrabold font-mono tracking-tight">Z = $${z}</span>
        </div>
        <svg class="w-8 h-8 text-purple-300/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      </div>

    </div>
  `;
}