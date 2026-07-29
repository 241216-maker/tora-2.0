document.addEventListener('DOMContentLoaded', () => { // Espera a que la página cargue completamente antes de ejecutar el código
    const inputs = { // Diccionario que almacena las referencias a los controles de la interfaz de usuario
        numOrigins: document.getElementById('num-origins'), // Input que define la cantidad de filas (Fábricas/Orígenes)
        numDests: document.getElementById('num-destinations'), // Input que define la cantidad de columnas (Clientes/Destinos)
        btnGenerate: document.getElementById('btn-generate-grid'), // Botón para dibujar la tabla en pantalla
        matrixContainer: document.getElementById('matrix-container'), // Contenedor HTML donde se inyectará la tabla
        btnCalculate: document.getElementById('btn-calculate-cost'), // Botón disparador del algoritmo matemático
        resultsPanel: document.getElementById('results-panel'), // Panel inferior donde se muestran las métricas finales
        costOutput: document.getElementById('min-cost-output'), // Etiqueta donde se imprimirá el Costo Total (Z)
        metricBalance: document.getElementById('metric-balance'), // Etiqueta que informará si el sistema requirió balanceo ficticio
        iterationsTableBody: document.getElementById('iterations-table-body'), // Cuerpo de la tabla de pasos del algoritmo
        solutionGrid: document.getElementById('solution-grid'), // Contenedor de la matriz de solución inicial
        resultSummaryLine: document.getElementById('result-summary-line'), // Línea principal de resumen del cálculo
        assignmentSummary: document.getElementById('assignment-summary') // Lista textual de rutas resueltas
    };

    // =========================================================================
    // GENERADOR DINÁMICO DE LA MATRIZ DE TRANSPORTE
    // =========================================================================
    inputs.btnGenerate.addEventListener('click', () => { // Evento que se dispara al hacer clic en "Generar Matriz"
        const rows = parseInt(inputs.numOrigins.value); // Obtiene el número de orígenes deseados por el usuario
        const cols = parseInt(inputs.numDests.value); // Obtiene el número de destinos deseados

        if (rows < 1 || cols < 1) return alert('Debes tener al menos 1 origen y 1 destino.'); // Validación de seguridad

        let tableHTML = '<table class="cost-matrix"><thead><tr><th>Orígenes \\ Destinos</th>'; // Inicia la construcción de la cadena HTML de la tabla
        
        // Genera los encabezados superiores de la tabla (D1, D2, D3...)
        for (let j = 0; j < cols; j++) tableHTML += `<th>D${j + 1}</th>`;
        tableHTML += '<th>OFERTA</th></tr></thead><tbody>'; // Añade la última columna reservada para la Oferta de cada origen

        // Genera las filas de la matriz (O1, O2, O3...) y sus respectivas celdas de costos
        for (let i = 0; i < rows; i++) {
            tableHTML += `<tr><th>O${i + 1}</th>`; // Cabecera lateral izquierda de la fila actual
            for (let j = 0; j < cols; j++) {
                // Crea los inputs (cuadros de texto) grises para capturar los costos unitarios de envío (Cij)
                tableHTML += `<td><input type="number" class="cell-cost" id="cost-${i}-${j}" min="0" placeholder="0"></td>`;
            }
            // Crea el input cian al final de la fila para capturar la Oferta total disponible en ese origen
            tableHTML += `<td><input type="number" class="cell-supply" id="sup-${i}" min="0" placeholder="0"></td></tr>`;
        }

        // Genera la última fila de la tabla reservada para la Demanda de cada cliente
        tableHTML += `<tr><th>DEMANDA</th>`;
        for (let j = 0; j < cols; j++) {
            // Crea los inputs cian en la base para capturar el requerimiento (Demanda) de cada destino
            tableHTML += `<td><input type="number" class="cell-demand" id="dem-${j}" min="0" placeholder="0"></td>`;
        }
        tableHTML += '<td></td></tr></tbody></table>'; // Cierra la estructura de la tabla HTML

        inputs.matrixContainer.innerHTML = tableHTML; // Inyecta el código HTML construido directamente en el documento
        inputs.btnCalculate.style.display = 'block'; // Hace visible el botón de cálculo ahora que existe una tabla para procesar
    });

    // =========================================================================
    // ALGORITMO: MÉTODO DEL COSTO MÍNIMO (MCM)
    // =========================================================================
    inputs.btnCalculate.addEventListener('click', () => { // Evento que inicia el procesamiento analítico de los datos
        const rows = parseInt(inputs.numOrigins.value); // Lee la cantidad de filas actuales
        const cols = parseInt(inputs.numDests.value); // Lee la cantidad de columnas actuales

        let costs = []; // Matriz bidimensional para almacenar los costos unitarios de transporte
        let supply = []; // Arreglo para almacenar la oferta disponible en cada origen
        let demand = []; // Arreglo para almacenar la demanda requerida por cada destino

        // LECTURA DE DATOS: Recorre los inputs de la tabla HTML y extrae los valores numéricos ingresados
        try {
            for (let i = 0; i < rows; i++) {
                let rowCosts = [];
                for (let j = 0; j < cols; j++) {
                    const cVal = parseFloat(document.getElementById(`cost-${i}-${j}`).value) || 0; // Lee el costo, asume 0 si está vacío
                    rowCosts.push({ cost: cVal, r: i, c: j }); // Empaqueta el costo junto a sus coordenadas originales
                }
                costs.push(rowCosts); // Añade la fila a la matriz general de costos
                supply.push(parseFloat(document.getElementById(`sup-${i}`).value) || 0); // Captura la oferta de la fila i
            }
            for (let j = 0; j < cols; j++) {
                demand.push(parseFloat(document.getElementById(`dem-${j}`).value) || 0); // Captura la demanda de la columna j
            }
        } catch (e) {
            return alert('Error al leer la matriz. Asegúrate de generar la tabla y llenar los datos.'); // Atrapa errores de lectura DOM
        }

        const initialSupply = [...supply];
        const initialDemand = [...demand];

        // COMPROBACIÓN DE BALANCEO: Un problema de transporte DEBE tener Oferta Total = Demanda Total
        let totalSupply = supply.reduce((a, b) => a + b, 0); // Suma todos los elementos del arreglo de ofertas
        let totalDemand = demand.reduce((a, b) => a + b, 0); // Suma todos los elementos del arreglo de demandas

        let isBalanced = true; // Bandera para indicar a la interfaz si el problema ingresado era ideal
        if (totalSupply !== totalDemand) { // Si existe discrepancia, alerta al usuario y aborta para mantener rigor académico
            return alert(`Problema No Balanceado.\nOferta Total: ${totalSupply}\nDemanda Total: ${totalDemand}\n\nPor favor, balancea manualmente agregando un origen o destino ficticio con costo 0 antes de calcular.`);
        }
        inputs.metricBalance.textContent = isBalanced ? "Balanceado" : "Ficticio Añadido"; // Muestra el estatus en el panel de métricas

        // INICIALIZACIÓN DEL ALGORITMO: Preparación de estructuras de datos para el MCM
        let allocation = Array(rows).fill(0).map(() => Array(cols).fill(0)); // Crea una matriz vacía llena de ceros para guardar las asignaciones de mercancía
        let activeRows = Array.from({length: rows}, (_, i) => i); // Lista de índices de orígenes que aún tienen mercancía para enviar
        let activeCols = Array.from({length: cols}, (_, i) => i); // Lista de índices de destinos que aún necesitan recibir mercancía
        
        let totalCost = 0; // Acumulador maestro para el costo total optimizado (Z) de la red
        const iterations = []; // Arreglo para guardar el seguimiento de cada paso del algoritmo

        // BUCLE PRINCIPAL DEL COSTO MÍNIMO (Greedy Algorithm)
        while (activeRows.length > 0 && activeCols.length > 0) { // Continúa mientras existan orígenes con oferta y destinos con demanda
            
            let minCost = Infinity; // Inicializa la búsqueda del costo más barato en un valor inalcanzable
            let minR = -1, minC = -1; // Variables para almacenar las coordenadas de la celda elegida
            
            // FASE 1: Búsqueda exhaustiva de la celda con el costo unitario más bajo en la matriz activa
            for (let i of activeRows) {
                for (let j of activeCols) {
                    if (costs[i][j].cost < minCost) { // Si encuentra una ruta más barata que la actual
                        minCost = costs[i][j].cost; // Actualiza el récord del costo mínimo
                        minR = i; // Guarda la fila ganadora
                        minC = j; // Guarda la columna ganadora
                    }
                }
            }

            // FASE 2: Asignación de mercancía. Envía lo máximo posible que permita la oferta de la fábrica y la demanda del cliente
            let quantity = Math.min(supply[minR], demand[minC]); // Regla matemática: Asigna el valor MÍNIMO entre la oferta y la demanda disponible
            allocation[minR][minC] = quantity; // Registra la cantidad enviada en la matriz de asignación final
            
            // FASE 3: Deducción de saldos
            supply[minR] -= quantity; // Resta la mercancía enviada al almacén del origen
            demand[minC] -= quantity; // Resta la mercancía recibida a la necesidad del destino
            totalCost += (quantity * minCost); // Suma el impacto financiero de este envío al costo total (Cantidad * Costo Unitario)

            iterations.push({
                step: iterations.length + 1,
                origin: `O${minR + 1}`,
                destination: `D${minC + 1}`,
                unitCost: minCost,
                quantity,
                remainingSupply: supply[minR],
                remainingDemand: demand[minC],
                accumulatedCost: totalCost
            });

            // FASE 4: Cancelación de filas o columnas agotadas
            if (supply[minR] === 0) {
                activeRows = activeRows.filter(r => r !== minR); // Si el origen se quedó sin mercancía, se tacha (elimina) de la lista de filas activas
            } else if (demand[minC] === 0) {
                activeCols = activeCols.filter(c => c !== minC); // Si el cliente se saturó, se tacha de la lista de columnas activas
            }
            // Nota de degeneración: En caso de que ambos queden en 0 simultáneamente, el 'else if' asegura que solo se elimine uno a la vez, creando una asignación degenerada de 0 en el siguiente ciclo como mandan los libros de Investigación de Operaciones.
        }

        inputs.costOutput.textContent = `$${totalCost.toLocaleString()}`; // Inyecta el costo total (Z) formateado con comas en la tarjeta de resultados
        renderIterations(iterations); // Genera la tabla con la secuencia de asignaciones
        renderSolutionMatrix(allocation, rows, cols, initialSupply, initialDemand); // Muestra el cuadro final de asignación inicial
        renderCalculationSummary(iterations, totalCost); // Muestra el resumen de cálculo final en texto

        inputs.resultsPanel.style.display = 'block'; // Quita la ocultación CSS del panel de conclusiones
        inputs.resultsPanel.scrollIntoView({ behavior: 'smooth' }); // Desplaza la pantalla automáticamente hacia los resultados
    });

    // =========================================================================
    // RENDERIZADO VISUAL: TABLA PASO A PASO DEL ALGORITMO
    // =========================================================================
    function renderIterations(iterations) {
        inputs.iterationsTableBody.innerHTML = iterations.map(step => {
            return `
                <tr>
                    <td>${step.step}</td>
                    <td>${step.origin}</td>
                    <td>${step.destination}</td>
                    <td>$${step.unitCost.toLocaleString()}</td>
                    <td>${step.quantity}</td>
                    <td>${step.remainingSupply}</td>
                    <td>${step.remainingDemand}</td>
                    <td>$${step.accumulatedCost.toLocaleString()}</td>
                </tr>
            `;
        }).join('');
    }

    function renderSolutionMatrix(allocation, rows, cols, supply, demand) {
        let tableHTML = '<table><thead><tr><th>Origen \ Destino</th>';

        for (let j = 0; j < cols; j++) {
            tableHTML += `<th>D${j + 1}</th>`;
        }
        tableHTML += '<th>Oferta</th></tr></thead><tbody>';

        for (let i = 0; i < rows; i++) {
            tableHTML += `<tr><th>O${i + 1}</th>`;
            for (let j = 0; j < cols; j++) {
                tableHTML += `<td class="solution-cell">${allocation[i][j] || 0}</td>`;
            }
            tableHTML += `<td class="solution-cell">${supply[i]}</td></tr>`;
        }

        tableHTML += '<tr><th>Demanda</th>';
        for (let j = 0; j < cols; j++) {
            tableHTML += `<td class="solution-cell">${demand[j]}</td>`;
        }
        tableHTML += '<td></td></tr></tbody></table>';

        inputs.solutionGrid.innerHTML = tableHTML;
    }

    function renderCalculationSummary(iterations, totalCost) {
        const parts = iterations.map(step => `${step.origin}${step.destination} = ${step.quantity} · ${step.unitCost}`);
        const formula = `Z = ${parts.join(' + ')} = $${totalCost.toLocaleString()}`;

        inputs.resultSummaryLine.textContent = formula;
        inputs.assignmentSummary.innerHTML = iterations.map(step => {
            return `<li>${step.origin} → ${step.destination}: cantidad asignada ${step.quantity}, costo unitario $${step.unitCost.toLocaleString()}, costo parcial $${(step.quantity * step.unitCost).toLocaleString()}</li>`;
        }).join('');
    }
});