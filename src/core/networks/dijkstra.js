// ==========================================================
// ALGORITMO DE DIJKSTRA — Método de Etiquetado de Taha
// Adaptado con Nodos Base: N_1 (Hospital), N_2 (Comisaría), N_3 (Bomberos)
// Visualización: Diagrama de Red Superior y Tabla Resumen Inferior
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. ELEMENTOS DEL DOM
    // ==========================================
    const DOM = {
        nodeCountInput: document.getElementById('node-count'),
        weightTypeSelect: document.getElementById('matrix-weight-type'),
        
        btnPresetN1: document.getElementById('btn-preset-n1'),
        btnPresetN2: document.getElementById('btn-preset-n2'),
        btnPresetN3: document.getElementById('btn-preset-n3'),
        btnGenerateMatrix: document.getElementById('btn-generate-matrix'),

        nodeNamesContainer: document.getElementById('node-names-container'),
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
        pathSummaryBox: document.getElementById('path-summary-box'),

        tableHeader: document.getElementById('dijkstra-table-header'),
        tableBody: document.getElementById('dijkstra-table-body'),
        iterationsDetailContainer: document.getElementById('iterations-detail-container'),

        errorModal: document.getElementById('error-modal'),
        errorMessage: document.getElementById('error-message'),
        btnCloseModal: document.getElementById('btn-close-modal')
    };

    // ==========================================
    // 2. ESTADO GLOBAL Y DATOS PREDEFINIDOS
    // ==========================================
    let numNodes = 0;
    let adjMatrix = [];
    let nodeCustomNames = [];
    let currentUnit = "KM";

    // Datos del Cuadro de Red de Emergencia
    const PRESET_EXAMPLE = {
        nodes: [
            "N_1 (Hospital ESSALUD)",
            "N_2 (Comisaría Bellavista)",
            "N_3 (Bomberos N° 68)",
            "N_4 (Mercado Central)",
            "N_5 (Universidad UNAMBA)"
        ],
        edges: [
            { from: 0, to: 1, dist: 1.3, timeNormal: 4.75, timeEmergencia: 2.75 },
            { from: 0, to: 2, dist: 3.1, timeNormal: 11.0, timeEmergencia: 6.00 },
            { from: 0, to: 3, dist: 2.6, timeNormal: 10.0, timeEmergencia: 5.50 },
            { from: 0, to: 4, dist: 4.5, timeNormal: 15.0, timeEmergencia: 8.75 },
            { from: 1, to: 2, dist: 2.0, timeNormal: 7.25, timeEmergencia: 4.25 },
            { from: 1, to: 3, dist: 1.8, timeNormal: 6.75, timeEmergencia: 4.00 },
            { from: 1, to: 4, dist: 4.2, timeNormal: 14.0, timeEmergencia: 8.50 },
            { from: 2, to: 3, dist: 0.8, timeNormal: 4.00, timeEmergencia: 1.75 },
            { from: 2, to: 4, dist: 3.0, timeNormal: 10.25, timeEmergencia: 6.00 },
            { from: 3, to: 4, dist: 3.8, timeNormal: 13.0, timeEmergencia: 7.50 }
        ]
    };

    function getNodeName(index) {
        if (nodeCustomNames[index] && nodeCustomNames[index].trim() !== '') {
            return nodeCustomNames[index].trim();
        }
        return `N_${index + 1}`;
    }

    function updateUnit() {
        if (!DOM.weightTypeSelect) return;
        const val = DOM.weightTypeSelect.value;
        currentUnit = (val === 'tiempo' || val === 'tiempo_emergencia') ? "MIN" : "KM";
    }

    // ==========================================
    // 3. GENERACIÓN DE INTERFAZ Y MANEJO DE PRESETS
    // ==========================================

    if (DOM.btnPresetN1) {
        DOM.btnPresetN1.addEventListener('click', () => loadPresetData(0, 4));
    }
    if (DOM.btnPresetN2) {
        DOM.btnPresetN2.addEventListener('click', () => loadPresetData(1, 4));
    }
    if (DOM.btnPresetN3) {
        DOM.btnPresetN3.addEventListener('click', () => loadPresetData(2, 0));
    }

    if (DOM.btnGenerateMatrix) {
        DOM.btnGenerateMatrix.addEventListener('click', () => {
            numNodes = parseInt(DOM.nodeCountInput.value);

            if (isNaN(numNodes) || numNodes < 2 || numNodes > 15) {
                showError("Por favor, ingrese un número de nodos válido (entre 2 y 15).");
                return;
            }

            nodeCustomNames = Array.from({ length: numNodes }, (_, i) => nodeCustomNames[i] || `N_${i + 1}`);
            updateUnit();

            generateNodeNamesUI();
            generateMatrixUI();
            updateSelectDropdowns();

            DOM.matrixSection.style.display = 'block';
            DOM.executionSection.style.display = 'block';
            DOM.resultsPanel.style.display = 'none';
        });
    }

    if (DOM.weightTypeSelect) {
        DOM.weightTypeSelect.addEventListener('change', () => {
            updateUnit();
            if (numNodes > 0) {
                generateMatrixUI();
            }
        });
    }

    function loadPresetData(startNodeIdx = 0, defaultEndNodeIdx = 4) {
        updateUnit();
        const weightType = DOM.weightTypeSelect ? DOM.weightTypeSelect.value : 'distancia';
        numNodes = PRESET_EXAMPLE.nodes.length;
        if (DOM.nodeCountInput) DOM.nodeCountInput.value = numNodes;

        nodeCustomNames = [...PRESET_EXAMPLE.nodes];

        generateNodeNamesUI();
        generateMatrixUI();
        updateSelectDropdowns();

        PRESET_EXAMPLE.edges.forEach(edge => {
            let val;
            if (weightType === 'tiempo_emergencia') {
                val = edge.timeEmergencia;
            } else if (weightType === 'tiempo') {
                val = edge.timeNormal;
            } else {
                val = edge.dist;
            }

            const cellDirect = document.getElementById(`cell-${edge.from}-${edge.to}`);
            const cellReverse = document.getElementById(`cell-${edge.to}-${edge.from}`);

            if (cellDirect) cellDirect.value = val;
            if (cellReverse) cellReverse.value = val;
        });

        DOM.startNodeSelect.value = startNodeIdx;
        DOM.endNodeSelect.value = defaultEndNodeIdx;

        DOM.matrixSection.style.display = 'block';
        DOM.executionSection.style.display = 'block';
        DOM.resultsPanel.style.display = 'none';
    }

    function generateNodeNamesUI() {
        let html = '';
        for (let i = 0; i < numNodes; i++) {
            html += `
                <div class="form-group">
                    <label class="group-label">Etiqueta Nodo ${i + 1}:</label>
                    <input type="text" class="form-select node-name-input" data-index="${i}" value="${getNodeName(i)}" placeholder="Ej. N_${i+1}">
                </div>
            `;
        }
        DOM.nodeNamesContainer.innerHTML = html;

        document.querySelectorAll('.node-name-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index);
                nodeCustomNames[idx] = e.target.value;
                updateSelectDropdowns();
                updateMatrixHeaders();
            });
        });
    }

    function generateMatrixUI() {
        let tableHTML = `<table class="matrix-table"><thead><tr><th>De \\ A (${currentUnit})</th>`;
        for (let i = 0; i < numNodes; i++) {
            tableHTML += `<th id="header-col-${i}">${getNodeName(i)}</th>`;
        }
        tableHTML += '</tr></thead><tbody>';

        for (let i = 0; i < numNodes; i++) {
            tableHTML += `<tr><th id="header-row-${i}">${getNodeName(i)}</th>`;
            for (let j = 0; j < numNodes; j++) {
                if (i === j) {
                    tableHTML += `<td><input type="text" class="matrix-input" disabled value="0"></td>`;
                } else {
                    tableHTML += `<td>
                        <input type="number" step="any" min="0" class="matrix-input" id="cell-${i}-${j}" placeholder="-" 
                               oninput="if(this.value < 0) this.value = '';">
                    </td>`;
                }
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</tbody></table>';

        DOM.matrixWrapper.innerHTML = tableHTML;
    }

    function updateMatrixHeaders() {
        for (let i = 0; i < numNodes; i++) {
            const colHead = document.getElementById(`header-col-${i}`);
            const rowHead = document.getElementById(`header-row-${i}`);
            if (colHead) colHead.textContent = getNodeName(i);
            if (rowHead) rowHead.textContent = getNodeName(i);
        }
    }

    function updateSelectDropdowns() {
        const prevStart = DOM.startNodeSelect.value;
        const prevEnd = DOM.endNodeSelect.value;

        DOM.startNodeSelect.innerHTML = '';
        DOM.endNodeSelect.innerHTML = '';

        for (let i = 0; i < numNodes; i++) {
            const option1 = document.createElement('option');
            option1.value = i;
            option1.text = getNodeName(i);
            DOM.startNodeSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = i;
            option2.text = getNodeName(i);
            DOM.endNodeSelect.appendChild(option2);
        }

        DOM.startNodeSelect.value = prevStart !== "" && prevStart < numNodes ? prevStart : 0;
        DOM.endNodeSelect.value = prevEnd !== "" && prevEnd < numNodes ? prevEnd : numNodes - 1;
    }

    function extractMatrix() {
        adjMatrix = [];
        for (let i = 0; i < numNodes; i++) {
            let row = [];
            for (let j = 0; j < numNodes; j++) {
                if (i === j) {
                    row.push(0);
                } else {
                    const cell = document.getElementById(`cell-${i}-${j}`);
                    const cellValue = cell ? cell.value.trim() : "";
                    if (cellValue === "") {
                        row.push(Infinity);
                    } else {
                        const val = parseFloat(cellValue);
                        if (isNaN(val) || val < 0) {
                            throw new Error(`Restricción: No se permiten distancias o costos negativos.`);
                        }
                        row.push(val);
                    }
                }
            }
            adjMatrix.push(row);
        }
    }

    // ==========================================
    // 4. LÓGICA DEL ALGORITMO (MÉTODO TAHA)
    // ==========================================

    function solveDijkstra(matrix, start, end) {
        let dist = Array(numNodes).fill(Infinity);
        let pred = Array(numNodes).fill(null);
        let perm = Array(numNodes).fill(false);
        let everLabeled = Array(numNodes).fill(false);

        dist[start] = 0;
        everLabeled[start] = true;

        let iterations = [];

        for (let step = 1; step <= numNodes; step++) {
            let minDist = Infinity;
            for (let i = 0; i < numNodes; i++) {
                if (!perm[i] && dist[i] < minDist) minDist = dist[i];
            }
            if (minDist === Infinity) break;

            const tieCandidates = [];
            for (let i = 0; i < numNodes; i++) {
                if (!perm[i] && dist[i] === minDist) tieCandidates.push(i);
            }
            const u = tieCandidates[0];
            const wasTie = tieCandidates.length > 1;
            perm[u] = true;

            const relaxedNodes = [];
            for (let v = 0; v < numNodes; v++) {
                if (v === u) continue;
                const w = matrix[u][v];
                if (w !== Infinity && w >= 0 && !perm[v]) {
                    const candidate = dist[u] + w;
                    if (candidate < dist[v]) {
                        const wasNew = dist[v] === Infinity;
                        relaxedNodes.push({ node: v, oldDist: dist[v], newDist: candidate, wasNew });
                        dist[v] = candidate;
                        pred[v] = u;
                        everLabeled[v] = true;
                    }
                }
            }

            const labelsSnapshot = [];
            for (let i = 0; i < numNodes; i++) {
                let state;
                if (i === u) state = 'new-permanent';
                else if (perm[i]) state = 'permanent';
                else if (everLabeled[i]) state = 'temporal';
                else state = 'none';

                labelsSnapshot.push({
                    node: i,
                    dist: dist[i],
                    pred: pred[i],
                    state,
                    justRelaxed: relaxedNodes.some(r => r.node === i)
                });
            }

            iterations.push({
                number: step,
                selectedNode: u,
                wasTie,
                tieCandidates,
                relaxedNodes,
                labels: labelsSnapshot
            });

            if (u === end) break;
        }

        let path = [];
        let curr = end;
        while (curr !== null && curr !== start) {
            path.unshift(curr);
            curr = pred[curr];
        }
        if (curr === start) {
            path.unshift(start);
        } else {
            path = [];
        }

        return {
            totalDistance: dist[end],
            path,
            iterations,
            finalLabels: dist.map((d, i) => ({ dist: d, pred: pred[i] }))
        };
    }

    // ==========================================
    // 5. RENDERIZADO — TABLA RESUMEN Y DETALLES
    // ==========================================

    function buildSummaryTable(iterations) {
        DOM.tableHeader.innerHTML = '<th>Iteración (Nodo permanente)</th>';
        for (let i = 0; i < numNodes; i++) {
            DOM.tableHeader.innerHTML += `<th>${getNodeName(i)}</th>`;
        }

        DOM.tableBody.innerHTML = '';

        iterations.forEach((iter) => {
            const tr = document.createElement('tr');

            const tdIter = document.createElement('td');
            tdIter.innerHTML = `<strong>Paso ${iter.number} (${getNodeName(iter.selectedNode)})</strong>`;
            tr.appendChild(tdIter);

            iter.labels.forEach((label) => {
                const td = document.createElement('td');

                if (label.state === 'none') {
                    td.innerHTML = `<span class="label-unreached">—</span>`;
                    tr.appendChild(td);
                    return;
                }

                const distText = label.dist === Infinity ? '∞' : label.dist;
                const predText = label.pred === null ? '-' : getNodeName(label.pred);
                const cellContent = `[${distText}, ${predText}]`;

                if (label.state === 'new-permanent') {
                    td.innerHTML = `<span class="label-new-perm">${cellContent}</span>`;
                } else if (label.state === 'permanent') {
                    td.innerHTML = `<span class="label-perm">${cellContent}</span>`;
                } else if (label.justRelaxed) {
                    td.innerHTML = `<span class="label-tie">${cellContent}</span>`;
                } else {
                    td.innerHTML = `<span class="label-temp">${cellContent}</span>`;
                }

                tr.appendChild(td);
            });

            DOM.tableBody.appendChild(tr);
        });
    }

    function buildIterationCards(iterations, start, end) {
        DOM.iterationsDetailContainer.innerHTML = '';

        iterations.forEach((iter) => {
            const card = document.createElement('div');
            card.className = 'iteration-card';

            const selLabel = iter.labels.find(l => l.node === iter.selectedNode);
            const selPredText = selLabel && selLabel.pred !== null ? getNodeName(selLabel.pred) : '-';
            const selDistText = selLabel ? selLabel.dist : 0;

            const header = document.createElement('div');
            header.className = 'iteration-card-header';
            header.innerHTML = `
                <span class="iteration-badge">Iteración ${iter.number}</span>
                <span class="iteration-selected-tag">Nodo permanente: <strong>${getNodeName(iter.selectedNode)}</strong> — etiqueta [${selDistText}, ${selPredText}]</span>
            `;
            card.appendChild(header);

            const explain = document.createElement('div');
            explain.className = 'iteration-explain';

            let text = '';
            if (iter.number === 1) {
                text += `Se inicia fijando el nodo de origen <strong>${getNodeName(start)}</strong> con la etiqueta permanente <strong>[0, -]</strong>. `;
            } else {
                text += `El nodo <strong>${getNodeName(iter.selectedNode)}</strong> posee la menor distancia acumulada entre las etiquetas temporales y pasa a ser <strong>permanente</strong>. `;
            }

            if (iter.relaxedNodes.length > 0) {
                const list = iter.relaxedNodes.map(r => {
                    return r.wasNew
                        ? `${getNodeName(r.node)} (nueva etiqueta temporal = [${r.newDist} ${currentUnit}, ${getNodeName(iter.selectedNode)}])`
                        : `${getNodeName(r.node)} (actualizada a ${r.newDist} ${currentUnit})`;
                }).join('; ');
                text += `Evaluación de arcos desde ${getNodeName(iter.selectedNode)}: ${list}.`;
            } else {
                text += `No existen arcos hacia nodos temporales por actualizar.`;
            }

            explain.innerHTML = text;
            card.appendChild(explain);

            const table = document.createElement('table');
            table.className = 'iteration-mini-table';
            table.innerHTML = `<thead><tr><th>Nodo</th><th>Etiqueta [distancia (${currentUnit}), predecesor]</th><th>Estado</th></tr></thead>`;
            const tbody = document.createElement('tbody');

            iter.labels.forEach(label => {
                if (label.state === 'none') return;
                const tr = document.createElement('tr');

                let rowClass = (label.state === 'new-permanent') ? 'row-new-permanent' : 
                               (label.state === 'permanent') ? 'row-permanent' : 
                               (label.justRelaxed) ? 'row-tie' : '';
                               
                let statusHTML = (label.state === 'new-permanent' || label.state === 'permanent') 
                    ? `<span class="status-pill permanent">Permanente</span>`
                    : `<span class="status-pill temporal">Temporal</span>`;

                const distText = label.dist === Infinity ? '∞' : label.dist;
                const predText = label.pred === null ? '-' : getNodeName(label.pred);

                tr.className = rowClass;
                tr.innerHTML = `
                    <td><strong>${getNodeName(label.node)}</strong></td>
                    <td>[${distText}, ${predText}]</td>
                    <td>${statusHTML}</td>
                `;
                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            card.appendChild(table);
            DOM.iterationsDetailContainer.appendChild(card);
        });
    }

    function buildPathSummary(result, start, end) {
        if (result.path.length === 0) {
            DOM.pathSummaryBox.innerHTML = '<div class="error-text">No existe una ruta posible entre el origen y destino seleccionados.</div>';
            return;
        }

        let forwardChain = result.path.map(n => `
            <span class="path-chain-node">${getNodeName(n)}</span>
        `).join('<span class="path-chain-arrow">→</span>');

        let backwardParts = [];
        let curr = end;
        while (curr !== null) {
            const info = result.finalLabels[curr];
            const predText = info.pred === null ? '-' : getNodeName(info.pred);
            backwardParts.push(`(${getNodeName(curr)}) → [${info.dist}, ${predText}]`);
            curr = info.pred;
        }
        const backwardTrace = backwardParts.join(' → ');

        DOM.pathSummaryBox.innerHTML = `
            <div><strong>Trazado inverso de etiquetas permanentes:</strong></div>
            <div class="mt-10" style="font-family: monospace; font-size: 0.9rem; color: #8b8a9f;">
                ${backwardTrace}
            </div>
            <div class="path-chain mt-15">${forwardChain}</div>
            <div class="mt-10" style="font-size: 1.05rem;">Ruta Óptima: <strong>${result.path.map(getNodeName).join(' → ')}</strong> con un total de 
            <strong>${result.totalDistance} ${currentUnit}</strong>.</div>
        `;
    }

    // ==========================================
    // 6. VISUALIZACIÓN DEL GRAFO (D3.JS EN LA PARTE SUPERIOR)
    // ==========================================

    function drawGraph(matrix, result, startNode, endNode) {
        DOM.svgContainer.innerHTML = '';
        
        // Dimensiones adaptadas para el banner superior
        const width = 1000;
        const height = 520;

        if (typeof d3 === 'undefined') {
            DOM.svgContainer.innerHTML = '<p style="color:#ff4d4d; padding: 20px;">Error: La librería D3.js no está disponible.</p>';
            return;
        }

        const svg = d3.select("#graph-svg-container")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const defs = svg.append("defs");

        defs.append("marker")
            .attr("id", "arrow-normal")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 32)
            .attr("refY", 0)
            .attr("markerWidth", 7)
            .attr("markerHeight", 7)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#64748b");

        defs.append("marker")
            .attr("id", "arrow-path")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 34)
            .attr("refY", 0)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#ff4d4d");

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 200;

        let nodesData = [];
        for (let i = 0; i < numNodes; i++) {
            const angle = (2 * Math.PI * i) / numNodes - (Math.PI / 2);
            nodesData.push({
                id: i,
                name: getNodeName(i),
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }

        const pathEdges = new Set();
        if (result.path && result.path.length > 0) {
            for (let i = 0; i < result.path.length - 1; i++) {
                pathEdges.add(`${result.path[i]}-${result.path[i + 1]}`);
            }
        }

        let linksData = [];
        for (let i = 0; i < numNodes; i++) {
            for (let j = 0; j < numNodes; j++) {
                if (matrix[i][j] !== Infinity && matrix[i][j] > 0) {
                    const isOptimal = pathEdges.has(`${i}-${j}`);
                    linksData.push({
                        source: nodesData[i],
                        target: nodesData[j],
                        weight: matrix[i][j],
                        isOptimal
                    });
                }
            }
        }

        const linkGroup = svg.append("g").attr("class", "links-layer");

        linksData.forEach(d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const curveOffset = 32;
            const midX = (d.source.x + d.target.x) / 2 + (dy / dist) * curveOffset;
            const midY = (d.source.y + d.target.y) / 2 - (dx / dist) * curveOffset;

            const pathStr = `M${d.source.x},${d.source.y} Q${midX},${midY} ${d.target.x},${d.target.y}`;

            linkGroup.append("path")
                .attr("d", pathStr)
                .attr("fill", "none")
                .attr("class", d.isOptimal ? "graph-edge edge-optimal" : "graph-edge")
                .attr("marker-end", d.isOptimal ? "url(#arrow-path)" : "url(#arrow-normal)");

            const textBgX = (d.source.x + 2 * midX + d.target.x) / 4;
            const textBgY = (d.source.y + 2 * midY + d.target.y) / 4;

            const weightG = linkGroup.append("g")
                .attr("class", d.isOptimal ? "edge-weight-group optimal" : "edge-weight-group")
                .attr("transform", `translate(${textBgX}, ${textBgY})`);

            weightG.append("rect")
                .attr("class", "edge-weight-bg")
                .attr("x", -24)
                .attr("y", -11)
                .attr("width", 48)
                .attr("height", 22)
                .attr("rx", 5);

            weightG.append("text").text(`${d.weight}`);
        });

        const nodeGroup = svg.append("g")
            .attr("class", "nodes-layer")
            .selectAll("g")
            .data(nodesData)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        nodeGroup.append("circle")
            .attr("r", 26)
            .attr("class", d => {
                if (d.id === startNode) return "graph-node node-start";
                if (d.id === endNode) return "graph-node node-end";
                if (result.path.includes(d.id)) return "graph-node node-optimal-path";
                return "graph-node node-regular";
            });

        nodeGroup.append("text")
            .attr("class", "node-title-text")
            .text(d => d.name.split(' ')[0]);

        nodeGroup.append("text")
            .attr("class", "node-taha-label")
            .attr("dy", -34)
            .text(d => {
                let info = result.finalLabels[d.id];
                if (!info || info.dist === Infinity) return "[∞, -]";
                let pName = info.pred === null ? "-" : getNodeName(info.pred).split(' ')[0];
                return `[${info.dist}, ${pName}]`;
            });
    }

    // ==========================================
    // 7. EVENTOS Y CONTROLADORES
    // ==========================================

    if (DOM.btnCalculate) {
        DOM.btnCalculate.addEventListener('click', () => {
            try {
                updateUnit();
                extractMatrix();
                const startNode = parseInt(DOM.startNodeSelect.value);
                const endNode = parseInt(DOM.endNodeSelect.value);

                if (startNode === endNode) {
                    showError("El nodo de origen y destino no pueden ser iguales.");
                    return;
                }

                const result = solveDijkstra(adjMatrix, startNode, endNode);

                if (result.totalDistance === Infinity) {
                    showError("No existe una ruta o camino posible entre el origen y destino seleccionados.");
                    return;
                }

                DOM.totalCostSpan.textContent = `${result.totalDistance} ${currentUnit}`;
                
                // Renders
                buildPathSummary(result, startNode, endNode);
                buildSummaryTable(result.iterations);
                buildIterationCards(result.iterations, startNode, endNode);

                DOM.resultsPanel.style.display = 'block';
                DOM.resultsPanel.scrollIntoView({ behavior: 'smooth' });

                // Dibujar el grafo en la sección superior
                drawGraph(adjMatrix, result, startNode, endNode);
            } catch (err) {
                showError(err.message);
            }
        });
    }

    if (DOM.btnResetAll) {
        DOM.btnResetAll.addEventListener('click', () => {
            if (DOM.nodeCountInput) DOM.nodeCountInput.value = '5';
            DOM.matrixSection.style.display = 'none';
            DOM.executionSection.style.display = 'none';
            DOM.resultsPanel.style.display = 'none';
            adjMatrix = [];
            nodeCustomNames = [];
            numNodes = 0;
        });
    }

    if (DOM.btnCloseModal) {
        DOM.btnCloseModal.addEventListener('click', () => {
            DOM.errorModal.style.display = 'none';
        });
    }

    function showError(message) {
        if (DOM.errorMessage && DOM.errorModal) {
            DOM.errorMessage.textContent = message;
            DOM.errorModal.style.display = 'flex';
        } else {
            alert(message);
        }
    }
});
