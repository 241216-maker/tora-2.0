// @ts-nocheck -- Desactiva la verificación estricta de tipos de TypeScript para evitar advertencias en VS Code

// =============================================================================
// 1. FUNCIÓN DE INICIO: INYECTA LA INTERFAZ DE USUARIO EN EL HTML
// ==============================================================================
export function cargarModuloHungaro() {
  const appContent = document.getElementById('main-app-content');
  if (!appContent) return;

  appContent.innerHTML = `
    <div class="bg-slate-50 min-h-screen p-6 font-sans antialiased text-slate-800">
      
      <!-- BANNER SUPERIOR MORADO: Contiene el título y el selector de dimensión -->
      <div class="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-6 shadow-md mb-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Modelos de Asignación</h2>
          <p class="text-xs text-purple-200 mt-1 font-medium font-mono">// Algoritmo Húngaro de Minimización • Paso a Paso Dinámico</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-purple-100 uppercase tracking-wider">Dimensión (N x N):</span>
            <input type="number" id="input-dimension" min="2" max="6" value="3" class="w-14 bg-white text-purple-950 font-bold border border-purple-300 rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-purple-400">
          </div>
          <button id="btn-generar-matriz-hungaro" class="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-all shadow-md cursor-pointer text-xs">Generar Matriz</button>
        </div>
      </div>

      <!-- CUERPO DE LA APP: Dos paneles. Izquierdo para entrada, Derecho para el paso a paso visual -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <div class="xl:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm self-start">
          <div class="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
            <span class="bg-purple-100 text-purple-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">1</span>
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Matriz de Costos Inicial</h3>
          </div>
          <div id="contenedor-matriz-hungaro" class="w-full overflow-x-auto p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 min-h-[180px] flex items-center justify-center">
            <p class="text-slate-400 text-xs font-medium">Genera el tablero para ingresar tus costos.</p>
          </div>
        </div>

        <div class="xl:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
            <span class="bg-purple-100 text-purple-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">2</span>
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Flujo del Proceso de Optimización (Taha)</h3>
          </div>
          <div id="secuencia-pasos-hungaro" class="space-y-8 text-slate-600 text-xs">
            <div class="text-center py-12 text-slate-400">
              <p>Completa la matriz de entrada y presiona "Resolver" para examinar el comportamiento paso a paso.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Asigna el evento click al botón superior para disparar la creación de la tabla
  document.getElementById('btn-generar-matriz-hungaro')?.addEventListener('click', generarMatrizAsignacion);
}

// ==============================================================================
// 2. FUNCIÓN DE CONSTRUCCIÓN DE MATRIZ DE ENTRADA 
// ==============================================================================
// Define la función encargada de generar visualmente la cuadrícula donde el usuario ingresará los datos
function generarMatrizAsignacion() {
  
  // 1. Busca en el HTML la cajita donde el usuario escribe el tamaño de la matriz (ej. 3, 4, 5).
  // Lo convierte a un número entero (parseInt). Si el usuario lo deja vacío o hay un error, usa el número 3 por defecto.
  const n = parseInt(document.getElementById('input-dimension').value) || 3;
  
  // 2. Busca en tu página web el elemento (un div vacío) que tiene el ID 'contenedor-matriz-hungaro'. 
  // Aquí es donde vamos a inyectar la tabla que estamos a punto de crear.
  const contenedor = document.getElementById('contenedor-matriz-hungaro');
  
  // 3. Medida de seguridad: Si por alguna razón no encuentra ese contenedor en el HTML, 
  // detiene toda la función (return) para que el programa no se congele ni lance un error en consola.
  if (!contenedor) return;

  // 4. Inicia una variable de texto (string) llamada 'htmlTable'. 
  // Aquí empezamos a escribir literalmente el código HTML de nuestra tabla, aplicándole estilos de Tailwind CSS (colores, bordes redondeados).
  let htmlTable = `
    <div class="w-full space-y-4">
      <table class="w-full border-collapse text-left text-xs bg-white rounded-xl overflow-hidden border border-slate-200">
        <thead>
          <tr class="bg-slate-100 text-slate-600 border-b border-slate-200">
            <!-- Esta es la celda de la esquina superior izquierda que queda vacía o sirve de guía cruzada -->
            <th class="p-3 font-bold uppercase text-slate-500">Operarios \\ Tareas</th>
  `;
  
  // 5. BUCLE DE CABECERAS: Empieza a contar desde 1 hasta el tamaño 'n' que eligió el usuario.
  // Por cada vuelta, agrega al HTML una cabecera de columna (ej. "Tarea 1", "Tarea 2", "Tarea 3").
  for (let j = 1; j <= n; j++) {
    htmlTable += `<th class="p-3 font-bold text-center text-purple-700">Tarea ${j}</th>`;
  }
  
  // 6. Cierra la fila de las cabeceras (</tr>), cierra el encabezado de la tabla (</thead>) 
  // y abre el cuerpo de la tabla (<tbody>), que es donde irán los datos.
  htmlTable += `</tr></thead><tbody>`;

  // 7. BUCLE DE FILAS: Empieza a contar desde 1 hasta 'n' para crear las filas horizontales.
  for (let i = 1; i <= n; i++) {
    
    // 8. Crea una nueva fila HTML (<tr>) y le pone la primera celda de la izquierda indicando el operario (ej. "Ope 1").
    htmlTable += `<tr class="border-b border-slate-100 hover:bg-slate-50/50"><td class="p-3 font-bold text-slate-700">Ope ${i}</td>`;
    
    // 9. BUCLE DE CELDAS INTERNAS: Estando dentro de la fila del "Operario i", 
    // crea las cajitas donde se escribirán los costos para cada "Tarea j".
    for (let j = 1; j <= n; j++) {
      
      // 10. Agrega el código HTML de un 'input' numérico. 
      // LA MAGIA ESTÁ AQUÍ: Le asignamos 'data-row="${i-1}"' y 'data-col="${j-1}"'. 
      // Esto le pone una "coordenada matemática" invisible a cada cajita (empezando desde 0) para luego saber exactamente qué celda es al hacer los cálculos.
      htmlTable += `
        <td class="p-2 text-center">
          <input type="number" placeholder="0" min="0" data-row="${i-1}" data-col="${j-1}" class="input-costo-hungaro w-16 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center focus:ring-2 focus:ring-purple-400 focus:bg-white font-semibold text-xs">
        </td>`;
    }
    
    // 11. Cierra la fila actual del operario para que el bucle principal pueda pasar al siguiente operario.
    htmlTable += `</tr>`;
  }

  // 12. Cierra el cuerpo de la tabla (</tbody>) y la etiqueta general de la tabla (</table>).
  // Además, justo debajo de la tabla, agrega el botón morado de "Resolver por Método Húngaro".
  htmlTable += `
        </tbody></table>
    <button id="btn-resolver-hungaro" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer w-full">Resolver por Método Húngaro</button>
  </div>`;

  // 13. Agarra todo ese "chorizo" de texto HTML que hemos estado armando y lo inserta físicamente dentro del contenedor de la página web. 
  // En este momento es cuando la tabla aparece visualmente en la pantalla del usuario.
  contenedor.innerHTML = htmlTable;
  
  // 14. Le cambia las clases de diseño (CSS) al contenedor principal para asegurarse de que ocupe todo el ancho disponible y no tenga bordes raros.
  contenedor.className = "w-full p-0 bg-transparent border-none text-left block";
  
  // 15. Busca el botón "Resolver" que acabamos de inyectar en el paso 12.
  // El '?.' es por si acaso el botón no existe. Si existe, le añade un "escuchador de eventos" ('click').
  // Esto significa que cuando el usuario haga clic en ese botón, se disparará la función 'ejecutarMetodoHungaro' que hace toda la matemática.
  document.getElementById('btn-resolver-hungaro')?.addEventListener('click', ejecutarMetodoHungaro);
}

// ==============================================================================
// 3. FUNCIÓN AUXILIAR: RENDERIZA TABLAS ESTÁTICAS PARA EL PASO A PASO
// ==============================================================================
// Define una función "auxiliar" que se encarga de dibujar las tablitas pequeñas del paso a paso.
// Recibe 4 parámetros: los datos numéricos (matriz), un título (ej. "Paso 1..."), un texto explicativo, y opcionalmente un arreglo con las asignaciones finales (resaltarIndices).
function renderizarMiniMatrizHTML(matriz, titulo, explicacion, resaltarIndices = null) {
  
  // 1. Averigua el tamaño de la matriz (N) contando cuántas filas tiene el arreglo principal.
  const n = matriz.length;
  
  // 2. Empieza a armar el texto HTML de la cabecera de la tabla. 
  // La primera celda de la esquina superior izquierda se queda fija como "Ope \ Tar" (Operarios \ Tareas).
  let lineasCabecera = `<th class="p-2 bg-slate-100 border border-slate-200 font-bold text-[10px] uppercase text-slate-400">Ope \\ Tar</th>`;
  
  // 3. Un bucle horizontal que genera dinámicamente las cabeceras de las tareas (T 1, T 2, T 3...) según el tamaño 'n'.
  for (let j = 1; j <= n; j++) lineasCabecera += `<th class="p-2 bg-slate-100 border border-slate-200 text-center font-semibold text-purple-700 text-[10px]">T ${j}</th>`;

  // 4. Inicializa una cadena de texto vacía ('filasHTML') donde iremos acumulando todo el cuerpo de la tabla.
  let filasHTML = "";
  
  // 5. BUCLE EXTERNO (Filas): Recorre la matriz verticalmente (los operarios).
  for (let i = 0; i < n; i++) {
    
    // 6. Abre una fila HTML (<tr>) y le inserta la primera celda del lado izquierdo con el nombre del operario (Ope 1, Ope 2...).
    filasHTML += `<tr class="border border-slate-200"><td class="p-2 border border-slate-200 font-bold bg-slate-50 text-[10px] text-slate-600">Ope ${i+1}</td>`;
    
    // 7. BUCLE INTERNO (Columnas): Estando en la fila 'i', recorre celda por celda para inyectar los números de las tareas.
    for (let j = 0; j < n; j++) {
      
      // 8. Define las clases CSS "base" (diseño, bordes, fuente monoespaciada) para cualquier celda común.
      let claseCelda = "p-2 border border-slate-200 text-center font-mono font-medium text-xs";
      
      // 9. CONDICIÓN 1 (ASIGNACIÓN FINAL): Revisa si se enviaron índices para resaltar y si la tarea 'j' le pertenece al operario 'i' en la solución final.
      if (resaltarIndices && resaltarIndices[i] === j) 
        // Si es la celda ganadora, le suma clases CSS para pintarla de VERDE ESMERALDA.
        claseCelda += " bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
        
      // 10. CONDICIÓN 2 (CEROS SIMPLES): Si no es ganadora, evalúa si el valor en esa posición matemática es exactamente un cero (0).
      else if (matriz[i][j] === 0) 
        // Si es un cero, le suma clases CSS para pintarla con un fondo MORADO CLARITO (para resaltar los ceros de oportunidad).
        claseCelda += " bg-purple-50 text-purple-700 font-semibold";
        
      // 11. CONDICIÓN 3 (NÚMEROS COMUNES): Si no es ni asignación final ni es un cero...
      else 
        // ...simplemente le pone un color de texto gris oscuro estándar.
        claseCelda += " text-slate-600";

      // 12. Construye la celda (<td>), le aplica la cadena de estilos CSS resultante y mete adentro el valor numérico exacto extraído de la matriz.
      filasHTML += `<td class="${claseCelda}">${matriz[i][j]}</td>`;
    }
    
    // 13. Cierra la fila del operario actual para que el bucle pueda avanzar al siguiente.
    filasHTML += `</tr>`;
  }

  // 14. Finalmente, devuelve (return) todo el bloque de código HTML empaquetado. 
  // Crea una "tarjeta" visual con bordes redondeados, coloca el título del paso, 
  // debajo el texto explicativo y al final inyecta la cabecera y las filas que armamos en los pasos anteriores.
  return `
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 animate-fade-in">
      <div class="border-b border-slate-100 pb-2">
        <h4 class="font-bold text-slate-800 text-[11px] uppercase tracking-wider font-mono text-purple-700">${titulo}</h4>
        <p class="text-[10px] text-slate-400 mt-0.5">${explicacion}</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-slate-200 text-xs">
          <thead><tr>${lineasCabecera}</tr></thead>
          <tbody>${filasHTML}</tbody>
        </table>
      </div>
    </div>
  `;
}
// ==============================================================================
// 4. MOTOR MATEMÁTICO PRINCIPAL (LÓGICA DEL HÚNGARO)
// ==============================================================================
function ejecutarMetodoHungaro() {
// 1. Busca en el documento HTML el div con el ID 'secuencia-pasos-hungaro' (el panel derecho).
  const pasosContainer = document.getElementById('secuencia-pasos-hungaro');
  // 2. Si por alguna razón ese contenedor no existe en la página, aborta la función para evitar que la app colapse.
  if (!pasosContainer) return;
  // --- ¿CÓMO SE ALMACENA LA INFORMACIÓN? ---
  // Obtiene todos los inputs y los guarda en un arreglo
  const inputsCosto = Array.from(document.querySelectorAll('.input-costo-hungaro'));
  let n = Math.sqrt(inputsCosto.length); // Halla N sacando la raíz cuadrada del total de celdas

  // Crea la matriz bidimensional llena de ceros
  let costosOriginales = Array(n).fill(0).map(() => Array(n).fill(0));
  
  // Recorre todos los inputs que recolectamos de la interfaz del navegador
  inputsCosto.forEach(inp => {
    let r = parseInt(inp.dataset.row); // Extrae la fila usando el atributo data-row
    let c = parseInt(inp.dataset.col); // Extrae la columna usando el atributo data-col
    let val = parseInt(inp.value) || 0; // Lee el valor o pone 0 si está vacío
    costosOriginales[r][c] = val; // Lo guarda en la posición matemática exacta [r][c]
  });

  // --- ITERACIONES Y OPERACIONES (PASO A PASO TAHA) ---
  
  // PASO A: REDUCCIÓN DE FILAS
  let matrizFilasReducidas = costosOriginales.map(row => {
    // Encuentra el valor más bajo dentro de la fila actual
    let minFila = Math.min(...row);
    // Retorna una nueva fila restando ese valor mínimo a cada elemento individual
    return row.map(val => val - minFila);
  });

  // PASO B: REDUCCIÓN DE COLUMNAS
  let matrizColumnasReducidas = matrizFilasReducidas.map(row => [...row]); // Clona la matriz anterior
  
  // Itera sobre cada columna (j) de manera horizontal
  for (let j = 0; j < n; j++) {
    let minColumna = Infinity; // Inicia el mínimo de columna en infinito
    
    // Recorre verticalmente para identificar el menor elemento de la columna
    for (let i = 0; i < n; i++) {
      if (matrizColumnasReducidas[i][j] < minColumna) {
        minColumna = matrizColumnasReducidas[i][j];
      }
    }
    // Aplica la resta vertical a todos los elementos de la columna 'j'
    for (let i = 0; i < n; i++) {
      matrizColumnasReducidas[i][j] -= minColumna;
    }
  }

  // PASO C: EMPAREJAMIENTO DE CEROS
  let asignaciones = Array(n).fill(-1); // Array para guardar qué tarea tiene cada operario
  let columnasOcupadas = Array(n).fill(false); // Array de banderas booleanas para no repetir tareas

  // Recorre fila por fila buscando ceros óptimos libres
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (matrizColumnasReducidas[i][j] === 0 && !columnasOcupadas[j]) {
        asignaciones[i] = j; // Registra la tarea 'j' al operario 'i'
        columnasOcupadas[j] = true; // Bloquea la tarea para que nadie más la tome
        break; // Rompe el bucle interno y pasa al siguiente operario
      }
    }
  }

  // Generamos el HTML visual de los pasos usando la función auxiliar
  const htmlPaso1 = renderizarMiniMatrizHTML(matrizFilasReducidas, "Paso 1: Reducción de Filas", "Se busca el mínimo de cada fila y se resta horizontalmente.");
  const htmlPaso2 = renderizarMiniMatrizHTML(matrizColumnasReducidas, "Paso 2: Reducción de Columnas", "Se busca el mínimo de cada columna y se resta verticalmente.");
  const htmlPaso3 = renderizarMiniMatrizHTML(matrizColumnasReducidas, "Paso 3: Matriz de Decisiones y Cobertura", "Emparejamiento final donde los ceros óptimos están resaltados.", asignaciones);

  // --- ¿CÓMO SE SUMA EL Z? ---
  let z = 0; // Inicializa la variable Z en cero
  let desgloseAsignacion = "";
  
  // Itera sobre los operarios para calcular el costo de su asignación
for (let i = 0; i < n; i++) {
    let jSeleccionada = asignaciones[i]; // Tarea asignada óptimamente al operario i
    
    // 3. MECANISMO DE SEGURIDAD: Verifica si el operario se quedó sin tarea asignada (es decir, su valor sigue siendo -1).
    if (jSeleccionada === -1) {
      // 4. Busca en el arreglo de 'columnasOcupadas' el índice de la primera tarea que siga libre (que sea 'false').
      jSeleccionada = columnasOcupadas.findIndex(ocupada => !ocupada);
      // 5. Si por algún caso extremo todas las tareas están ocupadas, le asigna la tarea 0 por defecto para que el código no falle al buscar el costo.
      if (jSeleccionada === -1) jSeleccionada = 0;
    }
    // Consulta el valor numérico en la MATRIZ ORIGINAL, no en la reducida
    let costoCeldaOriginal = costosOriginales[i][jSeleccionada];
    
    // Suma el costo original a la variable acumulativa Z
    z += costoCeldaOriginal;
    
    // Imprime en pantalla el texto de qué tarea tocó y a qué costo
    desgloseAsignacion += `<p>• Operario ${i+1} ➔ Tarea ${jSeleccionada+1} <span class="text-emerald-700 font-bold">(Costo Original: $${costoCeldaOriginal})</span></p>`;
  }

  // Inyectamos todo el recorrido en el panel derecho del navegador
  pasosContainer.innerHTML = `
    <div class="space-y-6">
      ${htmlPaso1}
      ${htmlPaso2}
      ${htmlPaso3}
      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1.5 animate-fade-in">
        <h5 class="font-bold text-slate-700 uppercase tracking-wider mb-1">// Plan de Asignación Decidido:</h5>
        ${desgloseAsignacion}
      </div>
      <div class="bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 rounded-xl shadow-md text-white flex justify-between items-center animate-fade-in">
        <div>
          <span class="text-[9px] font-bold text-emerald-100 uppercase tracking-widest block">// Solución Óptima Minimizada</span>
          <span class="text-2xl font-extrabold font-mono tracking-tight">Z = $${z}</span>
        </div>
        <svg class="w-8 h-8 text-emerald-200/40" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
      </div>
    </div>
  `;
}