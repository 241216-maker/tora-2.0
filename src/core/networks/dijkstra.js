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
// 3. FUNCIONES DE INTERFAZ Y EVENTOS
// ==========================================

// Mostrar modal de error
function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorModal.style.display = 'flex';
}

DOM.btnCloseModal.addEventListener('click', () => {
    DOM.errorModal.style.display = 'none';
});

// Obtener nombre del nodo (A, B, C...)
function getNodeName(index) {
    return ALPHABET[index] || `N${index + 1}`;
}

// Generar Matriz
DOM.btnGenerateMatrix.addEventListener('click', () => {
    const count = parseInt(DOM.nodeCountInput.value);
    
    if (isNaN(count) || count < 2 || count > 15) {
        showError("Por favor, ingrese una cantidad válida de nodos (entre 2 y 15).");
        return;
    }
    
    numNodes = count;
    renderMatrix(numNodes);
    populateSelects(numNodes);
    
    DOM.matrixSection.style.display = 'block';
    DOM.executionSection.style.display = 'block';
    DOM.resultsPanel.style.display = 'none';
});

function renderMatrix(size) {
    DOM.matrixWrapper.innerHTML = '';
    
    const table = document.createElement('table');
    table.className = 'matrix-table';
    
    // Header
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.appendChild(document.createElement('th')); // Esquina vacía
    
    for (let i = 0; i < size; i++) {
        const th = document.createElement('th');
        th.textContent = getNodeName(i);
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    for (let i = 0; i < size; i++) {
        const row = document.createElement('tr');
        
        const rowHeader = document.createElement('th');
        rowHeader.textContent = getNodeName(i);
        row.appendChild(rowHeader);
        
        for (let j = 0; j < size; j++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.className = 'matrix-input';
            input.id = `cell-${i}-${j}`;
            
            if (i === j) {
                input.value = '0';
                input.disabled = true;
            }
            
            td.appendChild(input);
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    DOM.matrixWrapper.appendChild(table);
}

function populateSelects(size) {
    DOM.startNodeSelect.innerHTML = '';
    DOM.endNodeSelect.innerHTML = '';
    
    for (let i = 0; i < size; i++) {
        const option1 = document.createElement('option');
        option1.value = i.toString();
        option1.textContent = `Nodo ${getNodeName(i)}`;
        
        const option2 = document.createElement('option');
        option2.value = i.toString();
        option2.textContent = `Nodo ${getNodeName(i)}`;
        
        DOM.startNodeSelect.appendChild(option1);
        DOM.endNodeSelect.appendChild(option2);
    }
    
    // Seleccionar el último nodo por defecto para el destino
    if (size > 1) {
        DOM.endNodeSelect.value = (size - 1).toString();
    }
}

// Extraer datos de la matriz HTML a un array 2D
function extractMatrix() {
    adjMatrix = [];
    for (let i = 0; i < numNodes; i++) {
        const row = [];
        for (let j = 0; j < numNodes; j++) {
            if (i === j) {
                row.push(0);
                continue;
            }
            const input = document.getElementById(`cell-${i}-${j}`);
            const val = parseFloat(input.value);
            
            if (isNaN(val) || val <= 0) {
                row.push(null); // null representa que no hay conexión directa (infinito)
            } else {
                row.push(val);
            }
        }
        adjMatrix.push(row);
    }
    return true;
}

// ==========================================
// 4. LÓGICA DEL ALGORITMO DE DIJKSTRA
// ==========================================
function solveDijkstra(matrix, start, end) {
    const distances = new Array(numNodes).fill(Infinity);
    const previous = new Array(numNodes).fill(null);
    const unvisited = new Set([...Array(numNodes).keys()]);
    const iterations = [];
    
    distances[start] = 0;
    let step = 1;

    while (unvisited.size > 0) {
        // Encontrar el nodo no visitado con la distancia mínima
        let currentNode = null;
        let minDistance = Infinity;
        
        unvisited.forEach(node => {
            if (distances[node] < minDistance) {
                minDistance = distances[node];
                currentNode = node;
            }
        });
        
        // Si no hay nodos alcanzables o llegamos al destino, terminamos la iteración principal
        if (currentNode === null) break;

        // Registrar estado actual para la tabla
        iterations.push({
            step: step++,
            currentNode: currentNode,
            distances: [...distances],
            unvisited: Array.from(unvisited)
        });

        unvisited.delete(currentNode);
        
        if (currentNode === end) break;
        
        // Actualizar vecinos
        for (let neighbor = 0; neighbor < numNodes; neighbor++) {
            const weight = matrix[currentNode][neighbor];
            if (weight !== null && unvisited.has(neighbor)) {
                const altPath = distances[currentNode] + weight;
                if (altPath < distances[neighbor]) {
                    distances[neighbor] = altPath;
                    previous[neighbor] = currentNode;
                }
            }
        }
    }
    
    // Reconstruir la ruta más corta
    const path = [];
    let current = end; 
    
    if (distances[end] !== Infinity) {
        while (current !== null) {
            path.unshift(current);
            if (current === start) {
                break;
            }
            current = previous[current]; 
        }
    }
    
    return {
        path,
        totalDistance: distances[end],
        iterations
    };
}

// ==========================================
// 5. VISUALIZACIÓN DE TABLA Y GRÁFICOS
// ==========================================

function buildTable(iterations) {
    // Limpiar tabla
    DOM.tableHeader.innerHTML = '<th>Paso</th><th>Nodo Actual</th>';
    for (let i = 0; i < numNodes; i++) {
        DOM.tableHeader.innerHTML += `<th>D(${getNodeName(i)})</th>`;
    }
    DOM.tableHeader.innerHTML += '<th>Nodos Restantes</th>';
    
    DOM.tableBody.innerHTML = '';
    
    iterations.forEach(iter => {
        const tr = document.createElement('tr');
        
        let rowHtml = `
            <td>${iter.step}</td>
            <td><strong>${getNodeName(iter.currentNode)}</strong></td>
        `;
        
        iter.distances.forEach(dist => {
            const displayDist = dist === Infinity ? '∞' : dist;
            rowHtml += `<td>${displayDist}</td>`;
        });
        
        const unvisitedStr = iter.unvisited.map(getNodeName).join(', ');
        rowHtml += `<td>{ ${unvisitedStr} }</td>`;
        
        tr.innerHTML = rowHtml;
        DOM.tableBody.appendChild(tr);
    });
}

function drawGraph(matrix, result, startNode, endNode) {
    DOM.svgContainer.innerHTML = '';
    
    const width = DOM.svgContainer.clientWidth || 600;
    const height = DOM.svgContainer.clientHeight || 400;
    const radius = 20;
    
    const svg = d3.select('#graph-svg-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`);

    // Disposición Circular
    const nodesData = Array.from({ length: numNodes }, (_, i) => {
        const angle = (i / numNodes) * 2 * Math.PI - Math.PI / 2;
        return {
            id: i,
            name: getNodeName(i),
            x: width / 2 + (width / 3) * Math.cos(angle),
            y: height / 2 + (height / 3) * Math.sin(angle)
        };
    });

    const linksData = [];
    // Convertir matriz a links
    for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < numNodes; j++) {
            if (matrix[i][j] !== null && i !== j) {
                // Verificar si pertenece a la ruta óptima
                let isPath = false;
                for (let k = 0; k < result.path.length - 1; k++) {
                    if (result.path[k] === i && result.path[k + 1] === j) {
                        isPath = true;
                        break;
                    }
                }
                
                linksData.push({
                    source: nodesData[i],
                    target: nodesData[j],
                    weight: matrix[i][j],
                    isPath: isPath
                });
            }
        }
    }

    // Dibujar enlaces (líneas)
    const link = svg.selectAll('.link')
        .data(linksData)
        .enter()
        .append('line')
        .attr('class', (d) => d.isPath ? 'graph-link path-link' : 'graph-link normal-link')
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
        .style('stroke', (d) => d.isPath ? '#10B981' : '#CBD5E1')
        .style('stroke-width', (d) => d.isPath ? 4 : 2)
        .attr('marker-end', (d) => d.isPath ? 'url(#arrow-path)' : 'url(#arrow-normal)');

    // Textos de los pesos
    svg.selectAll('.weight-text')
        .data(linksData)
        .enter()
        .append('text')
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2 - 5)
        .attr('text-anchor', 'middle')
        .style('fill', (d) => d.isPath ? '#047857' : '#64748B')
        .style('font-weight', (d) => d.isPath ? 'bold' : 'normal')
        .style('font-size', '12px')
        .text((d) => d.weight);

    // Dibujar Nodos
    const node = svg.selectAll('.node')
        .data(nodesData)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', (d) => `translate(${d.x},${d.y})`);

    node.append('circle')
        .attr('r', radius)
        .style('fill', (d) => {
            if (d.id === startNode) return '#3B82F6'; // Origen Azul
            if (d.id === endNode) return '#EF4444'; // Destino Rojo
            if (result.path.includes(d.id)) return '#10B981'; // Ruta Verde
            return '#F8FAFC';
        })
        .style('stroke', '#475569')
        .style('stroke-width', 2);

    node.append('text')
        .attr('dy', 5)
        .attr('text-anchor', 'middle')
        .style('fill', (d) => (d.id === startNode || d.id === endNode || result.path.includes(d.id)) ? '#FFFFFF' : '#1E293B')
        .style('font-weight', 'bold')
        .style('font-family', 'Inter, sans-serif')
        .text((d) => d.name);
}

// ==========================================
// 6. EVENTOS PRINCIPALES
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
        showError("No existe una ruta posible entre el nodo de origen y el destino.");
        return;
    }
    
    // Renderizar resultados
    DOM.totalCostSpan.textContent = result.totalDistance.toString();
    buildTable(result.iterations);
    drawGraph(adjMatrix, result, startNode, endNode);
    
    DOM.resultsPanel.style.display = 'block';
    
    // Desplazarse suavemente a los resultados
    DOM.resultsPanel.scrollIntoView({ behavior: 'smooth' });
});

DOM.btnResetAll.addEventListener('click', () => {
    DOM.nodeCountInput.value = '';
    DOM.matrixSection.style.display = 'none';
    DOM.executionSection.style.display = 'none';
    DOM.resultsPanel.style.display = 'none';
    numNodes = 0;
    adjMatrix = [];
});