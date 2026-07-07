// ==========================================
// 1. ELEMENTOS DEL DOM
// ==========================================

// Define un objeto constante 'DOM' que actúa como un diccionario centralizado para acceder a los elementos HTML.
const DOM = {
    // Utiliza un 'getter' para obtener dinámicamente el valor actual del input numérico de cantidad de nodos.
    get nodeCountInput() { return document.getElementById('node-count'); },
    // Utiliza un 'getter' para obtener la referencia al botón que dispara la generación de la matriz.
    get btnGenerateMatrix() { return document.getElementById('btn-generate-matrix'); },
    
    // Almacena la referencia a la sección HTML (section) que contiene la matriz de adyacencia.
    matrixSection: document.getElementById('matrix-section'),
    // Almacena la referencia al contenedor interno ('div') donde se inyectará la tabla de la matriz.
    matrixWrapper: document.getElementById('matrix-wrapper'),
    
    // Almacena la referencia a la sección donde el usuario configura los parámetros de ejecución.
    executionSection: document.getElementById('execution-section'),
    // Referencia al elemento 'select' que contiene las opciones para elegir el nodo de origen.
    startNodeSelect: document.getElementById('dijkstra-start-node'),
    // Referencia al elemento 'select' que contiene las opciones para elegir el nodo de destino final.
    endNodeSelect: document.getElementById('dijkstra-end-node'),
    // Referencia al botón primario de color verde que ejecuta el cálculo matemático del algoritmo.
    btnCalculate: document.getElementById('btn-calculate'),
    // Referencia al botón rojo que reinicia por completo la aplicación a su estado inicial.
    btnResetAll: document.getElementById('btn-reset-all'),
    
    // Referencia al panel principal que envuelve toda el área de resultados (gráficos y tablas).
    resultsPanel: document.getElementById('results-panel'),
    // Referencia al 'span' donde se inyectará el texto con el costo o distancia total mínima obtenida.
    totalCostSpan: document.getElementById('total-minimum-cost'),
    // Referencia al contenedor vacío donde la librería D3.js inyectará la etiqueta <svg> para dibujar la red.
    svgContainer: document.getElementById('graph-svg-container'),
    
    // Referencia a la fila del encabezado (<tr>) de la tabla HTML de iteraciones.
    tableHeader: document.getElementById('dijkstra-table-header'),
    // Referencia al cuerpo (<tbody>) de la tabla HTML donde se inyectarán las filas de datos.
    tableBody: document.getElementById('dijkstra-table-body'),
    
    // Referencia al contenedor 'overlay' o fondo oscuro de la ventana modal de errores.
    errorModal: document.getElementById('error-modal'),
    // Referencia al párrafo interno de la ventana modal donde se escribirá el texto del error.
    errorMessage: document.getElementById('error-message'),
    // Referencia al botón interno del modal que permite cerrarlo y ocultarlo.
    btnCloseModal: document.getElementById('btn-close-modal')
// Cierra la declaración del objeto DOM.
};

// ==========================================
// 2. ESTADO GLOBAL
// ==========================================

// Declara una variable global mutable para almacenar la cantidad de nodos de la red en ejecución.
let numNodes = 0;
// Declara un arreglo global vacío que almacenará la estructura bidimensional de la matriz de adyacencia.
let adjMatrix = [];
// Constante de cadena de texto con el alfabeto, usada para traducir índices numéricos (0, 1) a letras (A, B).
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ==========================================
// 3. FUNCIONES DE INTERFAZ Y EVENTOS
// ==========================================

// Declara una función para mostrar errores visuales; recibe como parámetro el mensaje a mostrar.
function showError(message) {
    // Inyecta el texto del parámetro 'message' dentro del elemento de mensaje de error en el modal.
    DOM.errorMessage.textContent = message;
    // Cambia el estilo CSS 'display' del modal a 'flex' para hacerlo visible centrando su contenido.
    DOM.errorModal.style.display = 'flex';
// Cierra la función showError.
}

// Agrega un escuchador de eventos de tipo 'click' al botón de cierre del modal.
DOM.btnCloseModal.addEventListener('click', () => {
    // Al hacer clic, oculta la ventana modal devolviendo su propiedad display a 'none'.
    DOM.errorModal.style.display = 'none';
// Cierra la función flecha del escuchador de eventos del modal.
});

// Declara una función para obtener el nombre alfabético de un nodo basado en su índice numérico (0, 1, 2...).
function getNodeName(index) {
    // Retorna la letra correspondiente del alfabeto, o un string 'N1', 'N2' si el índice supera las 26 letras.
    return ALPHABET[index] || `N${index + 1}`;
// Cierra la función getNodeName.
}

// Agrega un escuchador de eventos al botón de generar matriz que se activa al hacer clic.
DOM.btnGenerateMatrix.addEventListener('click', () => {
    // Extrae el valor digitado por el usuario y lo convierte explícitamente a un número entero.
    const count = parseInt(DOM.nodeCountInput.value);
    
    // Valida si el valor no es un número (NaN) o si está fuera del rango permitido (menor a 2 o mayor a 15).
    if (isNaN(count) || count < 2 || count > 15) {
        // Invoca la función de error mostrando un mensaje restrictivo al usuario.
        showError("Por favor, ingrese una cantidad válida de nodos (entre 2 y 15).");
        // Rompe la ejecución de la función actual usando return temprano, deteniendo el proceso.
        return;
    // Cierra el bloque condicional de validación.
    }
    
    // Si la validación es correcta, actualiza la variable global numNodes con la cantidad ingresada.
    numNodes = count;
    // Llama a la función renderMatrix pasándole la cantidad de nodos para construir los inputs HTML.
    renderMatrix(numNodes);
    // Llama a populateSelects para rellenar los desplegables de origen y destino con los nuevos nodos.
    populateSelects(numNodes);
    
    // Hace visible el panel de la matriz de costos cambiando su display a 'block'.
    DOM.matrixSection.style.display = 'block';
    // Hace visible el panel de ejecución (botones de cálculo) cambiando su display a 'block'.
    DOM.executionSection.style.display = 'block';
    // Asegura que el panel de resultados permanezca oculto hasta que se calcule una ruta.
    DOM.resultsPanel.style.display = 'none';
// Cierra la función flecha del evento clic del botón generar.
});

// Declara la función que construye dinámicamente los campos de entrada HTML para la matriz de adyacencia.
function renderMatrix(size) {
    // Vacía el contenido previo del contenedor de la matriz en el DOM para evitar duplicados.
    DOM.matrixWrapper.innerHTML = '';
    
    // Crea un nuevo elemento HTML de tipo 'table' que representará la matriz en pantalla.
    const table = document.createElement('table');
    // Asigna la clase CSS 'matrix-table' a la nueva tabla para su estilización.
    table.className = 'matrix-table';
    
    // Crea el elemento 'thead' que contendrá los encabezados de las columnas de la matriz.
    const thead = document.createElement('thead');
    // Crea una nueva fila 'tr' que actuará como la primera fila de la tabla (encabezados).
    const headRow = document.createElement('tr');
    // Añade una celda vacía 'th' al principio para que coincida con la columna de nombres de filas.
    headRow.appendChild(document.createElement('th'));
    
    // Inicia un bucle 'for' para crear los encabezados de columna, iterando según la cantidad de nodos.
    for (let i = 0; i < size; i++) {
        // Crea una nueva celda de encabezado 'th' para cada iteración.
        const th = document.createElement('th');
        // Asigna el texto a la celda usando la función getNodeName (Ej: 'A', 'B', 'C').
        th.textContent = getNodeName(i);
        // Inserta la celda de encabezado recién creada dentro de la fila de encabezados.
        headRow.appendChild(th);
    // Cierra el bucle de columnas del encabezado.
    }
    // Añade la fila completa de encabezados dentro del contenedor 'thead'.
    thead.appendChild(headRow);
    // Añade el contenedor 'thead' a la estructura principal de la 'table'.
    table.appendChild(thead);
    
    // Crea el elemento 'tbody' que contendrá el cuerpo principal con los inputs numéricos.
    const tbody = document.createElement('tbody');
    // Inicia un bucle externo 'for' para generar las filas 'i' de la matriz.
    for (let i = 0; i < size; i++) {
        // Crea una nueva fila HTML 'tr' para alojar las celdas de datos.
        const row = document.createElement('tr');
        // Crea una celda de encabezado lateral 'th' para identificar la fila actual.
        const rowHeader = document.createElement('th');
        // Asigna la letra correspondiente al nodo como texto del encabezado lateral.
        rowHeader.textContent = getNodeName(i);
        // Inserta la celda de encabezado lateral al inicio de la fila actual.
        row.appendChild(rowHeader);
        
        // Inicia un bucle interno 'for' para generar las celdas 'j' dentro de la fila 'i'.
        for (let j = 0; j < size; j++) {
            // Crea una celda estándar de tabla 'td'.
            const td = document.createElement('td');
            // Crea un campo de entrada 'input' de HTML.
            const input = document.createElement('input');
            // Configura el tipo del input a numérico.
            input.type = 'number';
            // Configura un valor mínimo lógico de 0, ya que Dijkstra no maneja pesos negativos.
            input.min = '0';
            // Asigna una clase CSS 'matrix-input' para aplicarle estilos de diseño.
            input.className = 'matrix-input';
            // Genera un ID dinámico y único usando los índices i,j para poder localizar este input luego.
            input.id = `cell-${i}-${j}`;
            
            // Verifica si estamos en la diagonal principal de la matriz (distancia de un nodo hacia sí mismo).
            if (i === j) {
                // Si es la diagonal, asigna '0' como valor predeterminado, ya que la distancia a sí mismo es nula.
                input.value = '0';
                // Deshabilita el campo de entrada para impedir que el usuario lo modifique.
                input.disabled = true;
            // Cierra el bloque condicional de la diagonal.
            }
            
            // Inserta el campo input configurado dentro de la celda de tabla 'td'.
            td.appendChild(input);
            // Inserta la celda de tabla completa dentro de la fila actual.
            row.appendChild(td);
        // Cierra el bucle interno de columnas 'j'.
        }
        // Añade la fila completa (con todas sus columnas) dentro del cuerpo de la tabla 'tbody'.
        tbody.appendChild(row);
    // Cierra el bucle externo de filas 'i'.
    }
    // Añade el cuerpo completo a la estructura principal de la tabla.
    table.appendChild(tbody);
    // Finalmente, inserta toda la tabla construida en el DOM visible para el usuario.
    DOM.matrixWrapper.appendChild(table);
// Cierra la función renderMatrix.
}

// Declara la función para rellenar los desplegables de origen y destino con opciones válidas.
function populateSelects(size) {
    // Vacía las opciones previas del selector de nodo de inicio.
    DOM.startNodeSelect.innerHTML = '';
    // Vacía las opciones previas del selector de nodo final.
    DOM.endNodeSelect.innerHTML = '';
    
    // Itera desde 0 hasta la cantidad de nodos para crear cada opción desplegable.
    for (let i = 0; i < size; i++) {
        // Crea un nuevo elemento <option> en el DOM para el selector inicial.
        const option1 = document.createElement('option');
        // Asigna el índice numérico en formato texto como valor real del select.
        option1.value = i.toString();
        // Asigna texto legible (Ej. 'Nodo A') que verá el usuario en pantalla.
        option1.textContent = `Nodo ${getNodeName(i)}`;
        
        // Crea un elemento <option> idéntico para el selector de destino.
        const option2 = document.createElement('option');
        // Asigna el índice numérico como valor oculto del select destino.
        option2.value = i.toString();
        // Asigna el nombre legible al option destino.
        option2.textContent = `Nodo ${getNodeName(i)}`;
        
        // Añade físicamente la opción 1 al contenedor select de origen.
        DOM.startNodeSelect.appendChild(option1);
        // Añade físicamente la opción 2 al contenedor select de destino.
        DOM.endNodeSelect.appendChild(option2);
    // Cierra el bucle de creación de opciones.
    }
    
    // Verifica por usabilidad si hay más de 1 nodo disponible en la red.
    if (size > 1) {
        // Establece lógicamente el último nodo como valor por defecto en el destino.
        DOM.endNodeSelect.value = (size - 1).toString();
    // Cierra el bloque condicional.
    }
// Cierra la función populateSelects.
}

// Declara la función que transfiere los números escritos en HTML a la variable global adjMatrix (estructura de datos JS).
function extractMatrix() {
    // Vacía y reinicia la variable global que mantiene la matriz actual.
    adjMatrix = [];
    
    // Itera verticalmente sobre las filas de la matriz HTML.
    for (let i = 0; i < numNodes; i++) {
        // Crea un arreglo temporal que representará la fila matemática extraída.
        const row = [];
        // Itera horizontalmente sobre las celdas de la fila en turno.
        for (let j = 0; j < numNodes; j++) {
            // Revisa si estamos evaluando la conexión del nodo consigo mismo.
            if (i === j) {
                // Inyecta directamente un 0 en el modelo de datos.
                row.push(0);
                // Utiliza la directiva continue para saltar el resto de código e ir al siguiente j.
                continue;
            // Cierra el bloque if-diagonal.
            }
            // Obtiene la referencia directa al input HTML cruzando coordenadas (i,j).
            const input = document.getElementById(`cell-${i}-${j}`);
            // Convierte el texto digitado en el input HTML a un número decimal flotante matemático real.
            const val = parseFloat(input.value);
            
            // Revisa si el campo estaba en blanco (NaN) o si introdujeron un peso cero/negativo.
            if (isNaN(val) || val <= 0) {
                // Un valor 'null' en la estructura JS indicará que no existe una arista directa (costo infinito de red).
                row.push(null); 
            // Bloque else, si sí hay un número válido insertado.
            } else {
                // Empuja el costo o peso validado dentro del arreglo temporal de la fila.
                row.push(val);
            // Cierra el bloque if-else.
            }
        // Cierra el bucle interno de columnas.
        }
        // Finaliza la fila completa y la empuja al array maestro global adjMatrix, creando el 2D.
        adjMatrix.push(row);
    // Cierra el bucle externo de filas.
    }
    // Retorna true indicando una extracción satisfactoria del DOM.
    return true;
// Cierra la función extractMatrix.
}

// ==========================================
// 4. LÓGICA DEL ALGORITMO DE DIJKSTRA (ESTILO ETIQUETAS TAHA)
// ==========================================

// Declara el núcleo del algoritmo, recibe la matriz bidimensional, el nodo inicio (índice) y nodo fin (índice).
function solveDijkstra(matrix, start, end) {
    // Crea un arreglo 'labels' que almacenará un objeto con el estado [distancia, predecesor, esPermanente] por cada nodo.
    const labels = Array(numNodes).fill(null).map(() => ({
        // Inicializa la distancia temporal de todos los nodos en Infinito.
        distance: Infinity,
        // Inicializa el nodo predecesor como null, ya que aún no conocemos ninguna ruta.
        predecessor: null,
        // Inicializa el estado temporal (false) para todos los nodos.
        isPermanent: false
    }));

    // Asigna la distancia 0 al nodo de inicio. (Etiqueta: [0, -])
    labels[start].distance = 0;
    
    // Declara un arreglo para registrar como 'fotografía' cada paso y enviarlo a la tabla HTML.
    const iterations = [];
    // Inicializa el contador del número de iteración visual para la interfaz.
    let step = 0;
    // Declara una variable de control que rastreará cuál fue el último nodo que se marcó como permanente.
    let lastPermanent = start;

    // Ejecuta el PASO 0 (Condición Inicial): Convierte al nodo de origen en el primer nodo Permanente.
    labels[start].isPermanent = true;

    // Toma la 'fotografía' del PASO 0, guardándola en el historial (Iterations array).
    iterations.push({
        // Número de paso actual (0).
        step: step++,
        // Nodo que acaba de cambiar a estado permanente.
        lastPermanent: start,
        // Clona en profundidad (Deep Copy) el estado completo del arreglo labels en este instante usando JSON.
        labels: JSON.parse(JSON.stringify(labels)) 
    });

    // Calcula cuántos nodos restan por visitar (Todos menos el de inicio).
    let unvisitedCount = numNodes - 1;

    // Inicia el bucle general de iteraciones. Se repetirá mientras queden nodos sin visitar.
    while (unvisitedCount > 0) {
        
        // FASE 1: ACTUALIZACIÓN DE ETIQUETAS TEMPORALES. Revisa todos los vecinos directos del último nodo vuelto permanente.
        for (let j = 0; j < numNodes; j++) {
            // Extrae el costo (peso) de la arista directa en la matriz de adyacencia.
            let weight = matrix[lastPermanent][j];
            
            // Verifica si la arista existe (no es null) y si el nodo destino 'j' AÚN es Temporal (no permanente).
            if (weight !== null && !labels[j].isPermanent) {
                // Calcula el costo de la ruta alternativa sumando lo acumulado por lastPermanent + el peso de la arista nueva.
                let newDist = labels[lastPermanent].distance + weight;
                
                // Si la nueva ruta descubierta cuesta MENOS que la distancia temporal que tenía registrada el nodo 'j'...
                if (newDist < labels[j].distance) {
                    // Actualiza la distancia del nodo 'j' en el arreglo con el nuevo valor óptimo.
                    labels[j].distance = newDist;
                    // Marca en la etiqueta que la mejor manera de llegar aquí fue pasando desde el nodo 'lastPermanent'.
                    labels[j].predecessor = lastPermanent;
                }
            }
        }

        // FASE 2: SELECCIÓN DEL NUEVO NODO PERMANENTE.
        // Inicializa un rastreador para buscar el menor costo entre los nodos temporales restantes.
        let minDistance = Infinity;
        // Inicializa el puntero del candidato a ganador.
        let nextPermanent = null;

        // Itera nuevamente sobre todo el grupo de nodos.
        for (let j = 0; j < numNodes; j++) {
            // Filtra exclusivamente a los nodos Temporales y evalúa si su distancia es la más baja descubierta hasta ahora.
            if (!labels[j].isPermanent && labels[j].distance < minDistance) {
                // Si es la menor, sobreescribe el récord global para compararlo con el siguiente en el ciclo.
                minDistance = labels[j].distance;
                // Asigna al candidato como el probable nuevo nodo permanente.
                nextPermanent = j;
            }
        }

        // Condición de quiebre: si nextPermanent sigue null, la red está desconectada (no hay rutas hacia los nodos faltantes).
        if (nextPermanent === null) break;

        // FASE 3: MARCAR COMO PERMANENTE (Cierre de Etiqueta).
        // Cambia el estado temporal del nodo ganador a Permanente.
        labels[nextPermanent].isPermanent = true;
        // Pasa el testigo: El ganador se vuelve el nuevo nodo del cual partir en la siguiente iteración.
        lastPermanent = nextPermanent;
        // Disminuye en 1 la cantidad de nodos restantes para continuar acercando el bucle 'while' a su fin.
        unvisitedCount--;

        // FASE 4: REGISTRO HISTÓRICO.
        // Toma la 'fotografía' de cómo quedaron todas las etiquetas tras esta pasada y la mete al arreglo de iteraciones.
        iterations.push({
            step: step++,
            lastPermanent: nextPermanent,
            labels: JSON.parse(JSON.stringify(labels))
        });
    }

    // FASE 5: RECONSTRUCCIÓN DE LA RUTA.
    // Inicializa el arreglo en blanco que almacenará la secuencia de índices del camino óptimo.
    const path = [];
    // Empieza a rastrear desde atrás hacia adelante, configurando el nodo de destino como nodo actual.
    let current = end;
    
    // Primero, revisa lógicamente si el destino fue alcanzado (su distancia NO es Infinito).
    if (labels[end].distance !== Infinity) {
        // Ejecuta un ciclo de retroceso mientras el nodo actual no sea el nodo base absoluto.
        while (current !== null) {
            // Inyecta al inicio de la lista del arreglo de ruta el nodo que se está analizando (método LIFO o Pila).
            path.unshift(current);
            // Salta al predecesor del nodo analizado usando el registro de la etiqueta guardada.
            current = labels[current].predecessor;
        }
    }
    
    // Devuelve un objeto JSON empaquetado que contiene los 3 productos resultantes del algoritmo matemático.
    return {
        // Arreglo numérico secuencial del camino: Ej [0, 2, 4, 5].
        path,
        // El valor numérico final correspondiente al costo de la etiqueta permanente del nodo de destino.
        totalDistance: labels[end].distance,
        // El arreglo histórico con todas las fases capturadas, vitales para rellenar la tabla de Taha HTML.
        iterations
    };
}

// ==========================================
// 5. VISUALIZACIÓN DE TABLA Y GRÁFICOS
// ==========================================

// Función que lee los objetos históricos del algoritmo y construye el código HTML de la cuadrícula visual.
function buildTable(iterations) {
    // Define el marco estático superior izquierdo de las columnas: Iteración y el último nodo visitado.
    DOM.tableHeader.innerHTML = '<th>Iteración</th><th>Nodo Eval.</th>';
    // Crea columnas dinámicamente para insertar los encabezados de cada nodo disponible (Ej: Etiqueta A, Etiqueta B).
    for (let i = 0; i < numNodes; i++) {
        // Inyecta el HTML de la celda individual (th) por cada nodo en la variable 'size'.
        DOM.tableHeader.innerHTML += `<th>Etiqueta ${getNodeName(i)}</th>`;
    }
    
    // Vacía rigurosamente el cuerpo de la tabla para que no existan resultados sobrepuestos o cálculos viejos.
    DOM.tableBody.innerHTML = '';
    
    // Recorre todo el registro temporal (el arreglo de objetos iteración de Dijkstra).
    iterations.forEach(iter => {
        // Fabrica el contenedor HTML (fila TR) para esta pasada específica en memoria.
        const tr = document.createElement('tr');
        
        // Empieza a concatenar la estructura HTML de las primeras celdas base insertando números y el nodo evaluado.
        let rowHtml = `
            <td>${iter.step}</td>
            <td><strong>${getNodeName(iter.lastPermanent)}</strong></td>
        `;
        
        // Itera de forma anidada sobre las etiquetas internas capturadas en este instante histórico.
        iter.labels.forEach((label, index) => {
            // Determina la representación de texto; si la matemática dice Infinito, pinta el carácter amigable '∞'.
            const displayDist = label.distance === Infinity ? '∞' : label.distance;
            // Si el nodo predecesor es null (no existe), imprime '-', caso contrario extrae la letra del alfabeto correspondiente.
            const displayPred = label.predecessor === null ? '-' : getNodeName(label.predecessor);
            // Si el estado booleano de la etiqueta dictamina Permanente, inyecta 'Perm', sino inyecta 'Temp'.
            const displayState = label.isPermanent ? '(Perm.)' : '(Temp.)';
            
            // Si la distancia es infinita, no mostramos predecesores ni estados, solo el infinito pelado por limpieza gráfica.
            if (label.distance === Infinity) {
                rowHtml += `<td>[∞, -]</td>`;
            // De lo contrario, maqueta la estructura [Distancia, Predecesor] con el estado de forma rigurosa según libro.
            } else {
                rowHtml += `<td>[${displayDist}, ${displayPred}] <br><small>${displayState}</small></td>`;
            }
        });
        
        // Inyecta todo el string HTML compuesto y concatenado directamente en el contenido interno de la fila (TR).
        tr.innerHTML = rowHtml;
        // Adhiere visualmente la nueva fila TR completa al cuerpo TBODY de la tabla principal.
        DOM.tableBody.appendChild(tr);
    });
}

// Declara la función para dibujar la representación interactiva y visual del grafo a través de SVG (D3.js).
function drawGraph(matrix, result, startNode, endNode) {
    // Vacía cualquier gráfico anterior que estuviese en el div del contenedor.
    DOM.svgContainer.innerHTML = '';
    
    // Captura el ancho utilizable del contenedor en píxeles. Si falla, impone un 600px estricto.
    const width = DOM.svgContainer.clientWidth || 600;
    // Captura el alto utilizable del contenedor. Si falla el DOM, impone 400px.
    const height = DOM.svgContainer.clientHeight || 400;
    // Configura el radio visual que tendrán las circunferencias correspondientes a los nodos.
    const radius = 20;
    
    // Llama a la librería D3 para atrapar al div, y usar el método de cadena append para inyectar la etiqueta <svg>.
    const svg = d3.select('#graph-svg-container')
        .append('svg')
        // Configura el ancho al máximo permitido.
        .attr('width', '100%')
        // Configura la altura al máximo permitido.
        .attr('height', '100%')
        // Establece una caja responsiva vectorial que permite al canvas ser dinámico.
        .attr('viewBox', `0 0 ${width} ${height}`);
        
    // Calcula la disposición matemática y espacial de los nodos, repartiéndolos circularmente equitativos en ángulos.
    const nodesData = Array.from({ length: numNodes }, (_, i) => {
        // Algoritmo trigonométrico que divide un círculo completo (2*PI) entre el número de nodos.
        const angle = (i / numNodes) * 2 * Math.PI - Math.PI / 2;
        // Retorna un objeto para D3 que ubica las coordenadas en X e Y para cada nodo del lienzo.
        return {
            id: i,
            name: getNodeName(i),
            x: width / 2 + (width / 3) * Math.cos(angle),
            y: height / 2 + (height / 3) * Math.sin(angle) //
        };
    // Cierra el método map.
    });
    
    // Declara una lista en blanco que se transformará en el modelo de líneas de D3.
    const linksData = [];
    // Itera otra vez para mapear de matriz matemática bidimensional hacia un objeto lineal gráfico.
    for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < numNodes; j++) {
            // Se cerciora de que la conexión bidireccional tiene un peso válido asignado distinto a nulo.
            if (matrix[i][j] !== null && i !== j) {
                // Inicia asumiendo que esa arista (conexión i,j) NO forma parte de la ruta más corta (verde).
                let isPath = false; //
                
                // Explora el listado secuencial de ruta emitido desde Dijkstra para verificar cruces.
                for (let k = 0; k < result.path.length - 1; k++) {
                    // Si el vector secuencial coincide en origen y destino con esta conexión actual i, j.
                    if (result.path[k] === i && result.path[k + 1] === j) {
                        // Cambia la variable booleana dictaminando que pertenece a la ruta divina.
                        isPath = true;
                        // Rompe este ciclo inmediato al detectar una verificación exitosa por optimización.
                        break;
                    // Cierra comprobación If de rutas.
                    }
                // Cierra ciclo exploratorio secuencial K.
                }
                
                // Construye el modelo semántico para D3 inyectando de quién a quién, el peso de arista y color.
                linksData.push({
                    source: nodesData[i],
                    target: nodesData[j],
                    weight: matrix[i][j], //
                    isPath: isPath
                });
            // Cierra condición iterativa I-J validación null.
            }
        }
    }

    // Le indica a D3 que enlace toda la 'metadata' lineal que creamos con objetos de línea SVG (<line>).
    const link = svg.selectAll('.link')
        .data(linksData)
        .enter()
        .append('line')
        // Inyecta dinámicamente clases CSS distintas si pertenece o no al camino vencedor isPath.
        .attr('class', (d) => d.isPath ? 'graph-link path-link' : 'graph-link normal-link')
        // Ancla coordenada X desde el origen.
        .attr('x1', (d) => d.source.x)
        // Ancla coordenada Y desde origen.
        .attr('y1', (d) => d.source.y)
        // Ancla coordenada X hacia el final.
        .attr('x2', (d) => d.target.x) //
        // Ancla coordenada Y hacia destino.
        .attr('y2', (d) => d.target.y)
        // Colorea las flechas con verde fuerte (#10B981) o plomo claro en base a validador de camino.
        .style('stroke', (d) => d.isPath ? '#10B981' : '#CBD5E1')
        // Engrosa 4 píxeles la línea vencedora para dar peso jerárquico al resultado visual.
        .style('stroke-width', (d) => d.isPath ? 4 : 2)
        // Dibuja terminaciones poligonales (flechas) dependiendo de la propiedad asignada.
        .attr('marker-end', (d) => d.isPath ? 'url(#arrow-path)' : 'url(#arrow-normal)');

    // Construye representaciones tipográficas (<text>) ancladas al centro geométrico estricto de las líneas graficadas.
    svg.selectAll('.weight-text')
        .data(linksData)
        .enter()
        .append('text')
        // Calcula promedio X entre origen y destino y lo inyecta como pivote horizontal de texto.
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        // Calcula promedio Y y le resta cinco píxeles para que la letra flote sin atravesar la línea.
        .attr('y', (d) => (d.source.y + d.target.y) / 2 - 5)
        // Centra el texto rigurosamente con anchor middle.
        .attr('text-anchor', 'middle')
        // Colorea de color verde pino los pesos integrales de la ruta exitosa y en gris para lo ordinario.
        .style('fill', (d) => d.isPath ? '#047857' : '#64748B')
        // Modifica de grosor estándar a negrilla intensa (bold).
        .style('font-weight', (d) => d.isPath ? 'bold' : 'normal') //
        // Tamaño tipográfico duro a doce píxeles para ser legible pero pequeño.
        .style('font-size', '12px')
        // Establece el literal escrito que extrajimos de la validación matemática previa.
        .text((d) => d.weight);

    // Llama a los contenedores Group (<g>) de SVG para englobar nodos y así unirlos estructuralmente.
    const node = svg.selectAll('.node')
        .data(nodesData)
        .enter()
        .append('g')
        // Asigna clase unificadora al grupo para interactividad.
        .attr('class', 'node')
        // Ajusta las coordenadas paramétricas generadas por la trigonometría inyectadas en la directiva translate.
        .attr('transform', (d) => `translate(${d.x},${d.y})`);

    // Procede a dibujar propiamente un vector circular (<circle>) para la morfología gráfica del nodo.
    node.append('circle')
        // Utiliza el radio superior configurado inicialmente (radius = 20) al inicio del bloque de función.
        .attr('r', radius)
        // Asigna lógica de colores para colorear la matriz semántica de red:
        .style('fill', (d) => {
            if (d.id === startNode) return '#3B82F6'; // Si es el primer nodo de selección, color azul vibrante.
            if (d.id === endNode) return '#EF4444'; // Si concuerda con el último en ruta, rojo cálido y vistoso.
            if (result.path.includes(d.id)) return '#10B981'; // Si no es origen y fin pero estuvo dentro del array resultante, verde puro.
            return '#F8FAFC'; // Si nada coincide, se deja sin ruta en blanco hueso simple.
        })
        // Determina el color o trazo anclando una tonalidad de contorno pizarra (#475569) a los círculos.
        .style('stroke', '#475569')
        // Define en 2 píxeles de anchura gráfica al delineado mencionado de la circunferencia.
        .style('stroke-width', 2);

    // Dibuja el texto (letra o número) al interior del nodo circular manipulando coordenada vectorial D.
    node.append('text')
        // Manipula 'dy' desplazando 5 unidades la tipografía en Y para contrarrestar alturas de línea y buscar simetría estética interna.
        .attr('dy', 5)
        // Refuerza de nuevo que el centro de rotación y anclaje es medio geométrico y matemático de la letra.
        .attr('text-anchor', 'middle')
        // Condiciona inteligentemente si está en el sendero vencedor cambia la fuente a puro blanco para proveer de contraste accesible.
        .style('fill', (d) => (d.id === startNode || d.id === endNode || result.path.includes(d.id)) ? '#FFFFFF' : '#1E293B')
        // Asigna estilo peso negrita estricto.
        .style('font-weight', 'bold')
        // Implementa familia Inter sin serifas modernista sobre escritura.
        .style('font-family', 'Inter, sans-serif')
        // Transforma al nombre real a un string final.
        .text((d) => d.name);
// Cierra el bloque funcional masivo responsable de D3.
}

// ==========================================
// 6. EVENTOS PRINCIPALES
// ==========================================

// Anida un escuchador de click al botón resolutivo o de cálculo.
DOM.btnCalculate.addEventListener('click', () => {
    // LLama proactivamente a la ejecución y escaneo de los números del input matrix guardando el resultado.
    extractMatrix();
    
    // Transforma a valor numérico entero la elección del menú de opciones seleccionado para origen.
    const startNode = parseInt(DOM.startNodeSelect.value);
    // Transforma para destino de forma análoga la variable String final de listado combo en entero.
    const endNode = parseInt(DOM.endNodeSelect.value);
    
    // Condición elemental que valida al usuario de una ejecución redundante y un bug en grafo nulo.
    if (startNode === endNode) {
        // Intercepta usando modal rojo avisando de que el destino es el punto inicial mismo.
        showError("El nodo de origen y destino no pueden ser el mismo.");
        // Devuelve control impidiendo paso a la máquina procesadora dijkstra posterior.
        return;
    // Cierra bloque redundante.
    }
    
    // Ejecuta de forma directa la lógica central Dijkstra parametrizando la matriz guardada matrizAdyacencia, origen, final devolviendo objeto JSON.
    const result = solveDijkstra(adjMatrix, startNode, endNode);
    
    // Evalúa si matemáticamente nunca fue capaz de acceder un destino (desconexión insalvable).
    if (result.totalDistance === Infinity) {
        // Dispara modal error al infinito, un error técnico sin arreglo algorítmico natural.
        showError("No existe una ruta posible entre el nodo de origen y el destino.");
        // Frena toda posterior renderización HTML y SVG de D3 previniendo crashes DOM de punteros nulos.
        return;
    // Final del cerrojo de validador numérico de Infinito.
    }
    
    // Modifica la interfaz gráfica incrustando al HTML (TotalMinimumCost span texto) del resultado optimo guardado de objeto.
    DOM.totalCostSpan.textContent = result.totalDistance.toString();
    // Invocación a render HTML de grilla tabla tabular, inyectándole base array de historial fotográfico.
    buildTable(result.iterations);
    // Dispara función creadora paramétrica vectorial para D3 mandando matriz global, respuestas JSON y variables de límite y color.
    drawGraph(adjMatrix, result, startNode, endNode);
    
    // Libera visualmente en estilo de CSS display de tipo bloqueo todo el marco subyacente que contenía los resultados recien generados.
    DOM.resultsPanel.style.display = 'block';
    
    // Engatilla transición de usuario desplazando con fluidez tipo suave hacia panel resultados al final DOM window.
    DOM.resultsPanel.scrollIntoView({ behavior: 'smooth' });
// Fin flecha evento de cálculo ejecutor general.
});

// Función de reseteo enganchada al clic del botón inferior secundario o peligro.
DOM.btnResetAll.addEventListener('click', () => {
    // Reinicia al input visual del formulario de nodos cantidad a campo blanco.
    DOM.nodeCountInput.value = '';
    // Esconde visualmente inyectando display nulo la visual matriz tabla DOM generada previa.
    DOM.matrixSection.style.display = 'none';
    // Condena en sombra el selector parámetro orígenes de DOM ejecución de cálculo.
    DOM.executionSection.style.display = 'none';
    // Colapsa invisibilizando de la ventana visual todo grafo o iteraciones HTML de Dijkstra de DOM al vuelo.
    DOM.resultsPanel.style.display = 'none';
    
    // Revierte a estado máquina y variables puras memoria el numero centralizado.
    numNodes = 0;
    // Purgación estricta forzando un reseteo de lista plana (limpia) a memoria matriz js local de variables arr.
    adjMatrix = [];
// Fin bloque closure reseteo app DOM de flecha a puntero memoria matriz vacia total.
});
