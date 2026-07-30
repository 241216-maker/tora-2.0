document.addEventListener('DOMContentLoaded', () => {
    const inputs = {
        numOrigins: document.getElementById('num-origins'),
        numDests: document.getElementById('num-destinations'),
        btnGenerate: document.getElementById('btn-generate-grid'),
        matrixContainer: document.getElementById('matrix-container'),
        btnCalculate: document.getElementById('btn-calculate-mav'),
        resultsPanel: document.getElementById('results-panel'),
        costOutput: document.getElementById('min-cost-output'),
        iterationsContainer: document.getElementById('iterations-container')
    };

    // 1. GENERAR MATRIZ EN PANTALLA
    inputs.btnGenerate.addEventListener('click', () => {
        const rows = parseInt(inputs.numOrigins.value);
        const cols = parseInt(inputs.numDests.value);
        if (rows < 1 || cols < 1) return;

        let tableHTML = '<table class="cost-matrix"><thead><tr><th></th>';
        for (let j = 0; j < cols; j++) tableHTML += `<th>${j + 1}</th>`;
        tableHTML += '<th>OFERTA</th></tr></thead><tbody>';

        for (let i = 0; i < rows; i++) {
            tableHTML += `<tr><th>${i + 1}</th>`;
            for (let j = 0; j < cols; j++) {
                tableHTML += `<td><input type="number" class="cell-cost" id="cost-${i}-${j}" min="0"></td>`;
            }
            tableHTML += `<td><input type="number" class="cell-supply" id="sup-${i}" min="0"></td></tr>`;
        }

        tableHTML += `<tr><th>DEMANDA</th>`;
        for (let j = 0; j < cols; j++) {
            tableHTML += `<td><input type="number" class="cell-demand" id="dem-${j}" min="0"></td>`;
        }
        tableHTML += '<td></td></tr></tbody></table>';

        inputs.matrixContainer.innerHTML = tableHTML;
        inputs.btnCalculate.style.display = 'block';
    });

    // 2. LÓGICA MAV (Con Reglas Exactas)
    inputs.btnCalculate.addEventListener('click', () => {
        const rows = parseInt(inputs.numOrigins.value);
        const cols = parseInt(inputs.numDests.value);

        let costs = [];
        let supply = [];
        let demand = [];

        try {
            for (let i = 0; i < rows; i++) {
                let rowCosts = [];
                for (let j = 0; j < cols; j++) {
                    const cVal = parseFloat(document.getElementById(`cost-${i}-${j}`).value) || 0;
                    rowCosts.push({ cost: cVal, r: i, c: j });
                }
                costs.push(rowCosts);
                supply.push(parseFloat(document.getElementById(`sup-${i}`).value) || 0);
            }
            for (let j = 0; j < cols; j++) {
                demand.push(parseFloat(document.getElementById(`dem-${j}`).value) || 0);
            }
        } catch (e) {
            return alert('Error al leer la matriz.');
        }

        let totalSupply = supply.reduce((a, b) => a + b, 0);
        let totalDemand = demand.reduce((a, b) => a + b, 0);
        if (totalSupply !== totalDemand) {
            return alert(`Problema No Balanceado. Oferta: ${totalSupply} | Demanda: ${totalDemand}. Balancea agregando ficticios.`);
        }

        let allocation = Array(rows).fill(0).map(() => Array(cols).fill(null));
        let activeRows = Array.from({length: rows}, (_, i) => i);
        let activeCols = Array.from({length: cols}, (_, i) => i);
        let totalCost = 0;
        let iterationHistory = [];
        let stepCount = 1;

        // Función de penalización (Paso 1)
        function getPenalty(elements) {
            if (elements.length === 0) return null;
            if (elements.length === 1) return null; // Si queda 1, no hay penalización, se usa Costo Mínimo.
            let sorted = [...elements].sort((a, b) => a.cost - b.cost);
            return sorted[1].cost - sorted[0].cost;
        }

        // BUCLE PRINCIPAL (Pasos 1, 2 y 3)
        while (activeRows.length > 0 && activeCols.length > 0) {
            let rowPens = {};
            let colPens = {};
            let maxPenalty = -1;
            let targetType = '';
            let targetIndex = -1;
            let isMinCostMode = false;

            // Paso 3 (b) y (c): Si queda solo una fila o columna, aplicamos Costo Mínimo.
            if (activeRows.length === 1 || activeCols.length === 1) {
                isMinCostMode = true;
            } else {
                // Paso 1: Calcular Penalizaciones
                for (let r of activeRows) {
                    let activeCells = activeCols.map(c => costs[r][c]);
                    let pen = getPenalty(activeCells);
                    rowPens[r] = pen;
                    if (pen !== null && pen > maxPenalty) { maxPenalty = pen; targetType = 'row'; targetIndex = r; }
                }
                for (let c of activeCols) {
                    let activeCells = activeRows.map(r => costs[r][c]);
                    let pen = getPenalty(activeCells);
                    colPens[c] = pen;
                    if (pen !== null && pen > maxPenalty) { maxPenalty = pen; targetType = 'col'; targetIndex = c; }
                }
            }

            let minC = Infinity;
            let selR = -1, selC = -1;

            if (isMinCostMode) {
                // Costo Mínimo directo sobre lo que queda
                for (let r of activeRows) {
                    for (let c of activeCols) {
                        if (costs[r][c].cost < minC) {
                            minC = costs[r][c].cost; selR = r; selC = c;
                        }
                    }
                }
            } else {
                // Seleccionar mínimo en la fila/columna de máxima penalización
                if (targetType === 'row') {
                    for (let c of activeCols) {
                        if (costs[targetIndex][c].cost < minC) { minC = costs[targetIndex][c].cost; selR = targetIndex; selC = c; }
                    }
                } else {
                    for (let r of activeRows) {
                        if (costs[r][targetIndex].cost < minC) { minC = costs[r][targetIndex].cost; selR = r; selC = targetIndex; }
                    }
                }
            }

            // Asignación (Paso 2)
            let quantity = Math.min(supply[selR], demand[selC]);
            allocation[selR][selC] = quantity;
            totalCost += (quantity * minC);
            
            // Guardar Snapshot ANTES de ajustar
            let snapshot = {
                step: stepCount++,
                isMinCostMode,
                activeR: [...activeRows], activeC: [...activeCols],
                rowPens, colPens, targetType, targetIndex, maxPenalty,
                selR, selC, minC, quantity,
                sBefore: [...supply], dBefore: [...demand],
                eliminated: '', currentAllocations: JSON.parse(JSON.stringify(allocation))
            };

            // Ajustar oferta y demanda
            supply[selR] -= quantity;
            demand[selC] -= quantity;

            // Regla de Tache (Paso 2: Si se satisfacen al mismo tiempo, solo se tacha una)
            if (supply[selR] === 0 && demand[selC] === 0) {
                // Rompemos empate tachando la fila (dejando columna con demanda 0)
                activeRows = activeRows.filter(r => r !== selR);
                snapshot.eliminated = `Fila ${selR + 1}`;
                
                // Paso 3 (a): Si fue la última y todo queda en 0, detenemos.
                if (activeRows.length === 0 && activeCols.length === 1) {
                    activeCols = []; // Forzar parada
                }
            } else if (supply[selR] === 0) {
                activeRows = activeRows.filter(r => r !== selR);
                snapshot.eliminated = `Fila ${selR + 1}`;
            } else {
                activeCols = activeCols.filter(c => c !== selC);
                snapshot.eliminated = `Columna ${selC + 1}`;
            }

            iterationHistory.push(snapshot);
        }

        inputs.costOutput.textContent = `$${totalCost.toLocaleString()}`;
        renderTextbookIterations(iterationHistory, rows, cols, costs);
        
        inputs.resultsPanel.style.display = 'block';
        inputs.resultsPanel.scrollIntoView({ behavior: 'smooth' });
    });

    // 3. RENDERIZAR TABLAS ESTILO LIBRO DE TEXTO
    function renderTextbookIterations(history, rows, cols, costs) {
        let html = '';

        history.forEach(iter => {
            let desc = iter.isMinCostMode 
                ? `Queda una sola fila/columna. Se aplica <b>Costo Mínimo</b>. Se asignan <b>${iter.quantity}</b> a la celda (${iter.selR + 1}, ${iter.selC + 1}). Se tacha la <b>${iter.eliminated}</b>.`
                : `Penalización máxima: <b style="color:var(--primary-color)">${iter.maxPenalty}</b> en ${iter.targetType === 'row' ? 'Fila' : 'Columna'} ${iter.targetIndex + 1}. Se asignan <b>${iter.quantity}</b> a la celda de menor costo (${iter.selR + 1}, ${iter.selC + 1}). Se tacha la <b>${iter.eliminated}</b>.`;

            let tableHTML = `<div class="iter-step-card">
                <div class="iter-header">Iteración ${iter.step}</div>
                <div class="iter-desc">${desc}</div>
                <div class="table-responsive"><table class="textbook-table">
                <thead><tr><th></th>`;
            
            for (let j = 0; j < cols; j++) tableHTML += `<th class="header-cell">${j+1}</th>`;
            tableHTML += `<th class="header-cell"></th><th class="header-cell" style="text-align:left; padding-left:15px;">Penalización en las filas</th></tr></thead><tbody>`;

            for (let i = 0; i < rows; i++) {
                tableHTML += `<tr><th class="header-cell">${i+1}</th>`;
                for (let j = 0; j < cols; j++) {
                    let isEliminatedPrev = !iter.activeR.includes(i) || !iter.activeC.includes(j);
                    // Para sombrear la que se acaba de eliminar en este paso
                    let isEliminatedNow = (iter.eliminated.includes('Fila') && i === iter.selR) || (iter.eliminated.includes('Columna') && j === iter.selC);
                    let shadedClass = (isEliminatedPrev || isEliminatedNow) ? 'shaded-cell' : '';
                    
                    let allocVal = iter.currentAllocations[i][j] !== null ? iter.currentAllocations[i][j] : '';
                    let costVal = costs[i][j].cost;
                    
                    tableHTML += `<td class="matrix-cell ${shadedClass}">
                                    <span class="cost-val">${costVal}</span>
                                    <span class="assign-val">${allocVal}</span>
                                  </td>`;
                }
                
                // Oferta
                tableHTML += `<td class="sup-dem-cell">${iter.sBefore[i]}</td>`;
                
                // Penalización Fila
                let p = iter.rowPens[i] !== undefined && iter.rowPens[i] !== null ? iter.rowPens[i] : (iter.activeR.includes(i) && !iter.isMinCostMode ? '-' : '');
                let isMax = (!iter.isMinCostMode && iter.targetType === 'row' && iter.targetIndex === i);
                tableHTML += `<td class="pen-cell" style="text-align:left; padding-left:15px;"><span class="${isMax ? 'pen-highlight' : ''}">${p}</span></td></tr>`;
            }

            // Fila de Demanda
            tableHTML += `<tr><th class="header-cell" style="text-align:left;">Penalización<br>en las columnas</th>`;
            for (let j = 0; j < cols; j++) {
                tableHTML += `<td class="sup-dem-cell">${iter.dBefore[j]}</td>`;
            }
            tableHTML += `<td></td><td></td></tr>`;

            // Fila de Penalización de Columnas
            tableHTML += `<tr><th></th>`;
            for (let j = 0; j < cols; j++) {
                let p = iter.colPens[j] !== undefined && iter.colPens[j] !== null ? iter.colPens[j] : (iter.activeC.includes(j) && !iter.isMinCostMode ? '-' : '');
                let isMax = (!iter.isMinCostMode && iter.targetType === 'col' && iter.targetIndex === j);
                tableHTML += `<td class="pen-cell"><span class="${isMax ? 'pen-highlight' : ''}">${p}</span></td>`;
            }
            tableHTML += `<td></td><td></td></tr>`;

            tableHTML += `</tbody></table></div></div>`;
            html += tableHTML;
        });

        inputs.iterationsContainer.innerHTML = html;
    }
});