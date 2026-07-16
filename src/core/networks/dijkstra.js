// ==========================================
// 1. ELEMENTOS DEL DOM
// ==========================================
const DOM = {
    get nodeCountInput() { return document.getElementById('node-count'); },
    get btnGenerateMatrix() { return document.getElementById('btn-generate-matrix'); },
    
    matrixSection: document.getElementById('matrix-section'),
    matrixWrapper: document.getElementById('matrix-wrapper'),
    
    executionSection: document.getElementById('execution-section'),
    startNodeSelect: document.getElementById('dijkstra-start-node'),
    endNodeSelect: document.getElementById('dijkstra-end-node'),
    btnCalculate: document.getElementById('btn-calculate'),
    btnResetAll: document.getElementById('btn-reset-all'),
    
    resultsPanel: document.getElementById('results-panel'),
    totalCostSpan: document.getElementById('total-minimum-cost'),
    svgContainer: document.getElementById('graph-svg-container'),
    
    tableHeader: document.getElementById('dijkstra-table-header'),
    tableBody: document.getElementById('dijkstra-table-body'),
    
    errorModal: document.getElementById('error-modal'),
    errorMessage: document.getElementById('error-message'),
    btnCloseModal: document.getElementById('btn-close-modal')
};

// ==========================================
// 2. ESTADO GLOBAL
// ==========================================
let numNodes = 0;
let adjMatrix = [];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ==========================================
// 3. GENERACIÓN DE INTERFAZ (MATRIZ)
// ==========================================

DOM.btnGenerateMatrix.addEventListener('click', () => {
    numNodes = parseInt(DOM.nodeCountInput.value);
    
    if (isNaN(numNodes) || numNodes < 2 || numNodes > 15) {
        showError("Por favor, ingrese un número de nodos válido (entre 2 y 15).");
        return;
    }

    generateMatrixUI();
    updateSelectDropdowns();
    
    DOM.matrixSection.style.display = 'block';
    DOM.executionSection.style.display = 'block';
    DOM.resultsPanel.style.display = 'none';
});

function generateMatrixUI() {
    // Cabeceras (Columnas: "A")
    let tableHTML = '<table class="matrix-table"><thead><tr><th>De \\ A</th>';
    for (let i = 0; i < numNodes; i++) {
        tableHTML += `<th>${ALPHABET[i]}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';

    // Filas (Cabeceras: "De")
    for (let i = 0; i < numNodes; i++) {
        tableHTML += `<tr><th>${ALPHABET[i]}</th>`;
        for (let j = 0; j < numNodes; j++) {
            if (i === j) {
                tableHTML += `<td><input type="text" class="matrix-input" disabled value="0"></td>`;
            } else {
                tableHTML += `<td><input type="number" class="matrix-input" id="cell-${i}-${j}" min="0" placeholder="-"></td>`;
            }
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    
    DOM.matrixWrapper.innerHTML = tableHTML;
}

function updateSelectDropdowns() {
    DOM.startNodeSelect.innerHTML = '';
    DOM.endNodeSelect.innerHTML = '';
    
    for (let i = 0; i < numNodes; i++) {
        const option1 = document.createElement('option');
        option1.value = i;
        option1.text = `Nodo ${ALPHABET[i]}`;
        DOM.startNodeSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = i;
        option2.text = `Nodo ${ALPHABET[i]}`;
        DOM.endNodeSelect.appendChild(option2);
    }
    // Seleccionar el último nodo por defecto para el destino
    DOM.endNodeSelect.value = numNodes - 1;
}

function extractMatrix() {
    adjMatrix = [];
    for (let i = 0; i < numNodes; i++) {
        let row = [];
        for (let j = 0; j < numNodes; j++) {
            if (i === j) {
                row.push(0);
            } else {
                const cellValue = document.getElementById(`cell-${i}-${j}`).value;
                row.push(cellValue === "" ? Infinity : parseFloat(cellValue));
            }
        }
        adjMatrix.push(row);
    }
}

// ==========================================
// 4. LÓGICA DEL ALGORITMO (MÉTODO TAHA)
// ==========================================

function solveDijkstra(matrix, start, end) {
    // 1. INICIALIZACIÓN DE VARIABLES
    // Creamos arreglos del tamaño del total de nodos
    let dist = Array(numNodes).fill(Infinity); // Todas las distancias iniciales son infinitas
    let pred = Array(numNodes).fill(null);     // Nadie tiene un nodo predecesor al inicio
    let perm = Array(numNodes).fill(false);    // Ningún nodo es permanente/visitado aún
    
    // La distancia del nodo origen a sí mismo siempre es 0
    dist[start] = 0;
    let iterations = []; // Almacenará el historial de cada paso para pintar la tabla en la interfaz

    // 2. BUCLE PRINCIPAL (Se ejecuta una vez por cada nodo del grafo)
    for (let step = 0; step < numNodes; step++) {
        
        // PARTE A: Buscar el nodo no permanente con la menor distancia acumulada
        let u = -1;
        let minDist = Infinity;
        for (let i = 0; i < numNodes; i++) {
            // Si el nodo 'i' no es permanente y su distancia es menor a la mínima encontrada...
            if (!perm[i] && dist[i] < minDist) {
                minDist = dist[i]; // Actualizamos la distancia mínima temporal
                u = i;             // Guardamos el índice del nodo ganador
            }
        }

        // Si 'u' sigue siendo -1, significa que los nodos restantes son inalcanzables. Rompemos el ciclo.
        if (u === -1) break; 

        // Marcamos el nodo elegido 'u' como PERMANENTE (su distancia ya es la óptima final)
        perm[u] = true;

        // REGISTRO DE ESTADO: Guardamos una foto de este momento para renderizarla en la UI
        let currentState = {
            selected: u,
            labels: dist.map((d, idx) => ({
                dist: d,
                pred: pred[idx],
                isPerm: perm[idx],
                justBecamePerm: idx === u 
            }))
        };

        // PARTE B: RELAJACIÓN DE ARISTAS (Actualizar los costos de los vecinos del nodo 'u')
        for (let v = 0; v < numNodes; v++) {
            // Verificamos tres condiciones indispensables:
            // 1. Que exista conexión directa en la matriz (distinta a Infinity)
            // 2. Que el costo de la conexión sea mayor a 0 (evita ciclos sobre sí mismo)
            // 3. Que el vecino 'v' no sea ya permanente
            if (matrix[u][v] !== Infinity && matrix[u][v] > 0 && !perm[v]) {
                
                // Evaluamos: ¿El camino actual (distancia a 'u' + peso hacia 'v') es más corto que el que ya conocíamos para 'v'?
                if (dist[u] + matrix[u][v] < dist[v]) {
                    dist[v] = dist[u] + matrix[u][v]; // Actualizamos con el nuevo costo menor
                    pred[v] = u;                      // Guardamos que a 'v' se llega de forma óptima pasando por 'u'
                }
            }
        }
        
        iterations.push(currentState); // Guardamos la iteración procesada
        
        // Optimización: Si el nodo que acabamos de hacer permanente es nuestro destino, terminamos antes.
        if (u === end) break; 
    }

    // 3. RECONSTRUCCIÓN DE LA RUTA ÓPTIMA (Caminata hacia atrás)
    let path = [];
    let curr = end; // Empezamos desde el nodo final
    
    // Mientras el nodo actual tenga un predecesor y no hayamos regresado al origen...
    while (curr !== null && curr !== start) {
        path.unshift(curr); // Insertamos el nodo al inicio del arreglo para mantener el orden correcto
        curr = pred[curr];  // Saltamos al predecesor
    }
    
    // Si logramos conectar de vuelta con el inicio, agregamos el origen y la ruta es válida
    if (curr === start) {
        path.unshift(start);
    } else {
        path = []; // Si no conecta con el origen, significa que no existe ninguna ruta válida
    }

    // Retornamos un objeto estructurado con todos los datos calculados
    return { 
        totalDistance: dist[end], // El costo total mínimo hacia el destino
        path: path,               // El arreglo con la secuencia de nodos de la ruta
        iterations: iterations,   // El historial paso a paso para la tabla dinámica
        finalLabels: dist.map((d, i) => ({ dist: d, pred: pred[i] })) // Etiquetas finales de control
    };
}

// ==========================================
// 5. RENDERIZADO DE TABLA (FORMATO TAHA)
// ==========================================

function buildTable(iterations) {
    // Cabecera: Iteración + Nodos
    DOM.tableHeader.innerHTML = '<th>Iteración (Nodo Seleccionado)</th>';
    for (let i = 0; i < numNodes; i++) {
        DOM.tableHeader.innerHTML += `<th>${ALPHABET[i]}</th>`;
    }

    DOM.tableBody.innerHTML = '';

    iterations.forEach((iter, index) => {
        const tr = document.createElement('tr');
        
        // Celda de iteración
        const tdIter = document.createElement('td');
        tdIter.innerHTML = `<strong>Paso ${index + 1} (Nodo ${ALPHABET[iter.selected]})</strong>`;
        tr.appendChild(tdIter);

        // Celdas de nodos
        iter.labels.forEach((label, i) => {
            const td = document.createElement('td');
            
            let distText = label.dist === Infinity ? '∞' : label.dist;
            let predText = label.pred === null ? '-' : ALPHABET[label.pred];
            
            // Formato [Distancia, Predecesor]
            let cellContent = `[${distText}, ${predText}]`;

            if (label.justBecamePerm) {
                td.innerHTML = `<span style="background-color: var(--color-light-blue); padding: 4px 8px; border-radius: 4px; font-weight: bold; border: 1px solid var(--color-mid-blue);">${cellContent}</span>`;
            } else if (label.isPerm) {
                td.innerHTML = `<strong>${cellContent}</strong>`;
                td.style.color = "var(--text-muted)";
            } else {
                td.textContent = cellContent;
            }
            
            tr.appendChild(td);
        });
        
        DOM.tableBody.appendChild(tr);
    });
}

// ==========================================
// 6. RENDERIZADO DEL GRAFO (D3.JS CON FLECHAS)
// ==========================================

function drawGraph(matrix, result, startNode, endNode) {
    DOM.svgContainer.innerHTML = '';
    
    const width = DOM.svgContainer.clientWidth || 800;
    const height = DOM.svgContainer.clientHeight || 450;
    
    const svg = d3.select("#graph-svg-container")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`);

    // Definir marcadores (Flechas)
    const defs = svg.append("defs");
    
    // Flecha normal
    defs.append("marker")
        .attr("id", "arrow-normal")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22) // Ajustado al borde del nodo
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#CBD5E1");

    // Flecha ruta óptima (ROJA)
    defs.append("marker")
        .attr("id", "arrow-path")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "var(--color-danger)");

    let nodesData = [];
    let linksData = [];

    // Nodos
    for (let i = 0; i < numNodes; i++) {
        nodesData.push({ id: i, name: ALPHABET[i] });
    }

    // Aristas (Grafos dirigidos)
    const pathEdges = new Set();
    if (result.path.length > 0) {
        for (let i = 0; i < result.path.length - 1; i++) {
            pathEdges.add(`${result.path[i]}-${result.path[i+1]}`);
        }
    }

    for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < numNodes; j++) {
            if (matrix[i][j] !== Infinity && matrix[i][j] > 0) {
                const isOptimal = pathEdges.has(`${i}-${j}`);
                linksData.push({
                    source: i,
                    target: j,
                    weight: matrix[i][j],
                    isOptimal: isOptimal
                });
            }
        }
    }

    const simulation = d3.forceSimulation(nodesData)
        .force("link", d3.forceLink(linksData).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-800))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Dibujar líneas (Aristas)
    const link = svg.append("g")
        .selectAll("path")
        .data(linksData)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", d => d.isOptimal ? "var(--color-danger)" : "#CBD5E1") // Ruta óptima en ROJO
        .attr("stroke-width", d => d.isOptimal ? 4 : 2)
        .attr("marker-end", d => d.isOptimal ? "url(#arrow-path)" : "url(#arrow-normal)");

    // Textos de los pesos
    const linkText = svg.append("g")
        .selectAll("text")
        .data(linksData)
        .enter()
        .append("text")
        .attr("font-size", "12px")
        .attr("fill", d => d.isOptimal ? "var(--color-danger)" : "#6B7280")
        .attr("font-weight", d => d.isOptimal ? "bold" : "normal")
        .attr("dy", -5)
        .text(d => d.weight);

    // Grupos de nodos
    const node = svg.append("g")
        .selectAll("g")
        .data(nodesData)
        .enter()
        .append("g")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Círculos
    node.append("circle")
        .attr("r", 18)
        .attr("fill", d => {
            if (d.id === startNode) return "#3B82F6"; // Origen
            if (d.id === endNode) return "var(--color-danger)"; // Destino
            if (result.path.includes(d.id)) return "var(--color-danger)"; // Nodos intermedios ruta
            return "#FFFFFF";
        })
        .attr("stroke", d => result.path.includes(d.id) ? "var(--color-danger)" : "var(--color-mid-blue)")
        .attr("stroke-width", 3);

    // Letra del nodo (A, B, C...)
    node.append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .attr("fill", d => (d.id === startNode || result.path.includes(d.id)) ? '#FFFFFF' : '#1E293B')
        .attr("font-weight", "bold")
        .text(d => d.name);

    // Etiquetas Taha [Distancia, Predecesor] flotando al lado del nodo
    node.append("text")
        .attr("dx", 22)
        .attr("dy", -15)
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .attr("fill", "var(--color-purple)")
        .text(d => {
            let info = result.finalLabels[d.id];
            if (!info || info.dist === Infinity) return "";
            let pName = info.pred === null ? "-" : ALPHABET[info.pred];
            return `[${info.dist}, ${pName}]`;
        });

    simulation.on("tick", () => {
        // Actualizar aristas (curvas ligeras para grafos bidireccionales, rectas para unidireccionales)
        link.attr("d", d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Ligera curva
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        // Actualizar posición de pesos
        linkText
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);

        // Actualizar posición de nodos
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// ==========================================
// 7. EVENTOS PRINCIPALES (BOTONES)
// ==========================================

DOM.btnCalculate.addEventListener('click', () => {
    extractMatrix();
    const startNode = parseInt(DOM.startNodeSelect.value);
    const endNode = parseInt(DOM.endNodeSelect.value);
    
    if (startNode === endNode) {
        showError("El nodo de origen y destino no pueden ser el mismo.");
        return;
    }
    
    const result = solveDijkstra(adjMatrix, startNode, endNode);
    
    if (result.totalDistance === Infinity) {
        showError("No existe una ruta posible (dirigida) entre el origen y el destino.");
        return;
    }
    
    // Renderizar resultados
    DOM.totalCostSpan.textContent = result.totalDistance.toString();
    buildTable(result.iterations);
    drawGraph(adjMatrix, result, startNode, endNode);
    
    DOM.resultsPanel.style.display = 'block';
    DOM.resultsPanel.scrollIntoView({ behavior: 'smooth' });
});

DOM.btnResetAll.addEventListener('click', () => {
    DOM.nodeCountInput.value = '';
    DOM.matrixSection.style.display = 'none';
    DOM.executionSection.style.display = 'none';
    DOM.resultsPanel.style.display = 'none';
    adjMatrix = [];
    numNodes = 0;
});

DOM.btnCloseModal.addEventListener('click', () => {
    DOM.errorModal.style.display = 'none';
});

function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorModal.style.display = 'flex';
}