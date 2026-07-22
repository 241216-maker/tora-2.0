// =========================================================================
// TORA ADVANCED - MÓDULO DEL MÉTODO DE DOS FASES (dosFases.js)
// =========================================================================

// Cache de Elementos del DOM
const DOM = {
    variableCount: document.getElementById('variable-count'),
    constraintCount: document.getElementById('constraint-count'),
    optimizationType: document.getElementById('optimization-type'),
    btnGenerateModel: document.getElementById('btn-generate-model'),
    btnResetSimplex: document.getElementById('btn-reset-simplex'),
    btnLoadExample: document.getElementById('btn-load-example'),
    
    matrixSection: document.getElementById('matrix-section'),
    twoPhaseModelWrapper: document.getElementById('two-phase-model-wrapper'),
    btnCalculateTwoPhase: document.getElementById('btn-calculate-twophase'),
    
    resultsPanel: document.getElementById('results-panel'),
    modelStatus: document.getElementById('model-status'),
    phase1RValue: document.getElementById('phase1-r-value'),
    optimalZValue: document.getElementById('optimal-z-value'),
    
    tabPhase1: document.getElementById('tab-phase-1'),
    tabPhase2: document.getElementById('tab-phase-2'),
    phaseTransitionBanner: document.getElementById('phase-transition-banner'),
    
    simplexTablesContainer: document.getElementById('simplex-tables-container'),
    btnPrevStep: document.getElementById('btn-prev-step'),
    btnNextStep: document.getElementById('btn-next-step'),
    iterationCounter: document.getElementById('iteration-counter'),
    
    errorModal: document.getElementById('error-modal'),
    errorMessage: document.getElementById('error-message'),
    btnCloseModal: document.getElementById('btn-close-modal')
};

// Estado Global del Algoritmo
let numVars = 0;
let numConstraints = 0;
let phase1Steps = [];
let phase2Steps = [];
let activePhase = 1; // 1 o 2
let currentStepIndex = 0;

// Configuración de Listeners de Eventos
function initEventListeners() {
    if (DOM.btnGenerateModel) DOM.btnGenerateModel.addEventListener('click', generarMatrizDosFases);
    if (DOM.btnResetSimplex) DOM.btnResetSimplex.addEventListener('click', reiniciarModulo);
    if (DOM.btnLoadExample) DOM.btnLoadExample.addEventListener('click', cargarEjemploLibro);
    if (DOM.btnCloseModal) DOM.btnCloseModal.addEventListener('click', () => DOM.errorModal.style.display = 'none');
    if (DOM.btnCalculateTwoPhase) DOM.btnCalculateTwoPhase.addEventListener('click', ejecutarDosFases);

    if (DOM.tabPhase1) {
        DOM.tabPhase1.addEventListener('click', () => {
            if (phase1Steps.length > 0) {
                activePhase = 1;
                currentStepIndex = 0;
                actualizarPestañasUX();
                renderPasoActual();
            }
        });
    }

    if (DOM.tabPhase2) {
        DOM.tabPhase2.addEventListener('click', () => {
            if (phase2Steps.length > 0) {
                activePhase = 2;
                currentStepIndex = 0;
                actualizarPestañasUX();
                renderPasoActual();
            }
        });
    }

    if (DOM.btnPrevStep) {
        DOM.btnPrevStep.addEventListener('click', () => {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                renderPasoActual();
            }
        });
    }

    if (DOM.btnNextStep) {
        DOM.btnNextStep.addEventListener('click', () => {
            const currentStepsList = (activePhase === 1) ? phase1Steps : phase2Steps;
            if (currentStepIndex < currentStepsList.length - 1) {
                currentStepIndex++;
                renderPasoActual();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initEventListeners);

// =========================================================================
// 1. GENERACIÓN DINÁMICA DEL FORMULARIO DE MATRIZ
// =========================================================================
function generarMatrizDosFases() {
    numVars = parseInt(DOM.variableCount.value, 10);
    numConstraints = parseInt(DOM.constraintCount.value, 10);

    if (isNaN(numVars) || numVars < 1 || isNaN(numConstraints) || numConstraints < 1) {
        showError("Ingresa un número válido de variables y restricciones (mínimo 1).");
        return;
    }

    let html = `
        <div class="objective-function-setup">
            <h4>Función Objetivo Original ($Z$)</h4>
            <div class="matrix-row-simplex">
                <span class="z-label">Z = </span>`;
    
    for (let j = 1; j <= numVars; j++) {
        html += `
            <input type="number" id="z-c${j}" class="input-simplex-coeff" placeholder="0" step="any">
            <span class="var-label">X<sub>${j}</sub> ${j < numVars ? '+' : ''}</span>`;
    }
    
    html += `
            </div>
        </div>
        <div class="constraints-setup">
            <h4>Restricciones del Sistema</h4>`;

    for (let i = 1; i <= numConstraints; i++) {
        html += `
            <div class="matrix-row-simplex">
                <span class="row-label">R${i}:</span>`;
        for (let j = 1; j <= numVars; j++) {
            html += `
                <input type="number" id="r${i}-c${j}" class="input-simplex-coeff" placeholder="0" step="any">
                <span class="var-label">X<sub>${j}</sub> ${j < numVars ? '+' : ''}</span>`;
        }
        html += `
                <select id="r${i}-sign" class="simplex-sign-select">
                    <option value="=">=</option>
                    <option value=">=">&ge;</option>
                    <option value="<=">&le;</option>
                </select>
                <input type="number" id="r${i}-rhs" class="input-simplex-coeff rhs-input" placeholder="0" step="any">
            </div>`;
    }
    html += `</div>`;

    DOM.twoPhaseModelWrapper.innerHTML = html;
    DOM.matrixSection.style.display = 'block';
    DOM.resultsPanel.style.display = 'none';
}

// =========================================================================
// 2. FUNCIÓN DE PRECARGA: EJEMPLO DE LIBRO (Ejemplo Clásico de Dos Fases)
// =========================================================================
function cargarEjemploLibro() {
    DOM.variableCount.value = 2;
    DOM.constraintCount.value = 3;
    DOM.optimizationType.value = 'MIN';

    generarMatrizDosFases();

    // Minimizar Z = 4X1 + X2
    document.getElementById('z-c1').value = 4;
    document.getElementById('z-c2').value = 1;

    // R1: 3X1 + X2 = 3
    document.getElementById('r1-c1').value = 3;
    document.getElementById('r1-c2').value = 1;
    document.getElementById('r1-sign').value = '=';
    document.getElementById('r1-rhs').value = 3;

    // R2: 4X1 + 3X2 >= 6
    document.getElementById('r2-c1').value = 4;
    document.getElementById('r2-c2').value = 3;
    document.getElementById('r2-sign').value = '>=';
    document.getElementById('r2-rhs').value = 6;

    // R3: X1 + 2X2 <= 4
    document.getElementById('r3-c1').value = 1;
    document.getElementById('r3-c2').value = 2;
    document.getElementById('r3-sign').value = '<=';
    document.getElementById('r3-rhs').value = 4;
}

// =========================================================================
// 3. MOTOR ALGEBRAICO PRINCIPAL: MÉTODO DE DOS FASES
// =========================================================================
function ejecutarDosFases() {
    const optType = DOM.optimizationType.value; // "MAX" o "MIN"
    phase1Steps = [];
    phase2Steps = [];

    let slackSurplusVars = [];
    let artificialVars = [];
    let constraintTypes = [];

    // Identificar variables adicionales
    for (let i = 1; i <= numConstraints; i++) {
        const sign = document.getElementById(`r${i}-sign`).value;
        constraintTypes.push(sign);

        if (sign === '<=') {
            slackSurplusVars.push({ type: 'slack', constraintIndex: i });
        } else if (sign === '>=') {
            slackSurplusVars.push({ type: 'surplus', constraintIndex: i });
            artificialVars.push({ constraintIndex: i });
        } else if (sign === '=') {
            artificialVars.push({ constraintIndex: i });
        }
    }

    const hasArtificials = artificialVars.length > 0;

    // --- CONSTRUCCIÓN CABECERAS Y MATRIZ FASE I ---
    let headersP1 = [];
    for (let j = 1; j <= numVars; j++) headersP1.push(`X${j}`);

    let sCounter = 1;
    slackSurplusVars.forEach(v => {
        v.name = `S${sCounter++}`;
        headersP1.push(v.name);
    });

    let rCounter = 1;
    artificialVars.forEach(v => {
        v.name = `R${rCounter++}`;
        headersP1.push(v.name);
    });

    const totalColsP1 = headersP1.length + 1; // +1 Columna RHS (Solución)
    let totalRowsP1 = numConstraints + 1;     // +1 Fila r

    let tableauP1 = Array(totalRowsP1).fill(0).map(() => Array(totalColsP1).fill(0));
    let basisP1 = [];

    // Cargar Restricciones en Tabla
    for (let i = 0; i < numConstraints; i++) {
        for (let j = 0; j < numVars; j++) {
            let val = parseFloat(document.getElementById(`r${i+1}-c${j+1}`).value);
            tableauP1[i][j] = isNaN(val) ? 0 : val;
        }

        let rhsVal = parseFloat(document.getElementById(`r${i+1}-rhs`).value);
        tableauP1[i][totalColsP1 - 1] = isNaN(rhsVal) ? 0 : rhsVal;

        const sign = constraintTypes[i];
        if (sign === '<=') {
            const sObj = slackSurplusVars.find(s => s.constraintIndex === i + 1);
            tableauP1[i][headersP1.indexOf(sObj.name)] = 1;
            basisP1.push(sObj.name);
        } else if (sign === '>=') {
            const sObj = slackSurplusVars.find(s => s.constraintIndex === i + 1);
            const rObj = artificialVars.find(r => r.constraintIndex === i + 1);
            tableauP1[i][headersP1.indexOf(sObj.name)] = -1;
            tableauP1[i][headersP1.indexOf(rObj.name)] = 1;
            basisP1.push(rObj.name);
        } else if (sign === '=') {
            const rObj = artificialVars.find(r => r.constraintIndex === i + 1);
            tableauP1[i][headersP1.indexOf(rObj.name)] = 1;
            basisP1.push(rObj.name);
        }
    }
    basisP1.push("r");

    // Configuración Fila r (Minimizar r = Suma R_i)
    if (hasArtificials) {
        artificialVars.forEach(r => {
            const colIdx = headersP1.indexOf(r.name);
            tableauP1[totalRowsP1 - 1][colIdx] = -1;
        });

        // Acondicionamiento Gaussiano: Eliminar coeficientes de R_i de la fila r
        for (let i = 0; i < numConstraints; i++) {
            if (basisP1[i].startsWith("R")) {
                for (let j = 0; j < totalColsP1; j++) {
                    tableauP1[totalRowsP1 - 1][j] += tableauP1[i][j];
                }
            }
        }
    }

    // Registrar Tabla Inicial (Fase I)
    phase1Steps.push({
        matrix: cloneMatrix(tableauP1),
        basis: [...basisP1],
        headers: [...headersP1],
        pivotColIndex: -1,
        pivotRowIndex: -1,
        ratios: Array(numConstraints).fill(null),
        stepTitle: "Tabla Inicial Acondicionada (Fase I)"
    });

    // =========================================================================
    // SIMPLEX - FASE I
    // =========================================================================
    let isOptimalP1 = false;
    let iterP1 = 0;

    while (!isOptimalP1 && iterP1 < 50 && hasArtificials) {
        let lastRow = tableauP1[totalRowsP1 - 1];
        let pivotCol = -1;
        let maxVal = 1e-6; // Entrada de mayor valor positivo en fila r

        for (let j = 0; j < totalColsP1 - 1; j++) {
            if (lastRow[j] > maxVal) {
                maxVal = lastRow[j];
                pivotCol = j;
            }
        }

        if (pivotCol === -1) {
            isOptimalP1 = true;
            break;
        }

        // Prueba de Razón Mínima
        let pivotRow = -1;
        let minRatio = Infinity;
        let currentRatios = Array(numConstraints).fill(null);

        for (let i = 0; i < numConstraints; i++) {
            let colVal = tableauP1[i][pivotCol];
            if (colVal > 1e-9) {
                let rhsVal = tableauP1[i][totalColsP1 - 1];
                let ratio = rhsVal / colVal;
                currentRatios[i] = ratio;
                if (ratio >= 0 && ratio < minRatio) {
                    minRatio = ratio;
                    pivotRow = i;
                }
            }
        }

        if (pivotRow === -1) {
            showError("Fase I no acotada. Verifica las restricciones ingresadas.");
            return;
        }

        phase1Steps[phase1Steps.length - 1].pivotColIndex = pivotCol;
        phase1Steps[phase1Steps.length - 1].pivotRowIndex = pivotRow;
        phase1Steps[phase1Steps.length - 1].ratios = [...currentRatios];

        // Operación Pivote Gauss-Jordan
        basisP1[pivotRow] = headersP1[pivotCol];
        let pivotElement = tableauP1[pivotRow][pivotCol];

        for (let j = 0; j < totalColsP1; j++) {
            tableauP1[pivotRow][j] /= pivotElement;
        }

        for (let i = 0; i < totalRowsP1; i++) {
            if (i !== pivotRow) {
                let factor = tableauP1[i][pivotCol];
                for (let j = 0; j < totalColsP1; j++) {
                    tableauP1[i][j] -= factor * tableauP1[pivotRow][j];
                }
            }
        }

        iterP1++;

        phase1Steps.push({
            matrix: cloneMatrix(tableauP1),
            basis: [...basisP1],
            headers: [...headersP1],
            pivotColIndex: -1,
            pivotRowIndex: -1,
            ratios: Array(numConstraints).fill(null),
            stepTitle: `Iteración ${iterP1} (Fase I)`
        });
    }

    const minRValue = Math.abs(tableauP1[totalRowsP1 - 1][totalColsP1 - 1]);
    if (DOM.phase1RValue) DOM.phase1RValue.innerText = formatNum(minRValue);

    // Evaluación de Factibilidad
    if (hasArtificials && minRValue > 1e-4) {
        showError(`El problema NO tiene solución factible (Infactible). El valor de r_min = ${formatNum(minRValue)} > 0.`);
        if (DOM.modelStatus) {
            DOM.modelStatus.innerText = "Infactible";
            DOM.modelStatus.className = "badge-status online badge-error";
        }
        DOM.resultsPanel.style.display = 'block';
        activePhase = 1;
        actualizarPestañasUX();
        renderPasoActual();
        return;
    }

    // =========================================================================
    // TRANSICIÓN Y PREPARACIÓN A FASE II
    // =========================================================================
    
    // Limpieza de Variables Artificiales que sigan en la Base con valor 0 (Degeneración)
    for (let i = 0; i < numConstraints; i++) {
        if (basisP1[i].startsWith("R")) {
            // Intentar pivotear con una variable legítima no básica
            let candidateCol = -1;
            for (let j = 0; j < headersP1.length; j++) {
                if (!headersP1[j].startsWith("R") && Math.abs(tableauP1[i][j]) > 1e-6) {
                    candidateCol = j;
                    break;
                }
            }
            if (candidateCol !== -1) {
                basisP1[i] = headersP1[candidateCol];
                let pivotElement = tableauP1[i][candidateCol];
                for (let j = 0; j < totalColsP1; j++) tableauP1[i][j] /= pivotElement;
                for (let k = 0; k < totalRowsP1; k++) {
                    if (k !== i) {
                        let factor = tableauP1[k][candidateCol];
                        for (let j = 0; j < totalColsP1; j++) tableauP1[k][j] -= factor * tableauP1[i][j];
                    }
                }
            }
        }
    }

    // 1. Omitir columnas de variables artificiales R_i
    let headersP2 = headersP1.filter(h => !h.startsWith("R"));
    const totalColsP2 = headersP2.length + 1; // +1 Columna RHS
    const totalRowsP2 = numConstraints + 1;   // +1 Fila Z

    let tableauP2 = Array(totalRowsP2).fill(0).map(() => Array(totalColsP2).fill(0));
    let basisP2 = basisP1.slice(0, numConstraints);
    basisP2.push("Z");

    // Copiar cuerpo de matriz resultante omitiendo columnas R_i
    for (let i = 0; i < numConstraints; i++) {
        for (let j = 0; j < headersP2.length; j++) {
            let origColIdx = headersP1.indexOf(headersP2[j]);
            tableauP2[i][j] = tableauP1[i][origColIdx];
        }
        tableauP2[i][totalColsP2 - 1] = tableauP1[i][totalColsP1 - 1]; // RHS
    }

    // 2. Insertar Coeficientes de la Función Objetivo Original Z
    for (let j = 0; j < numVars; j++) {
        let val = parseFloat(document.getElementById(`z-c${j+1}`).value);
        let coeff = isNaN(val) ? 0 : val;
        // Forma Estándar: Z - c1*X1 - c2*X2 ... = 0
        tableauP2[totalRowsP2 - 1][j] = (optType === "MAX") ? -coeff : coeff;
    }

    // 3. Acondicionamiento Gauss-Jordan de la Fila Z según la Base Actual
    for (let i = 0; i < numConstraints; i++) {
        const basicVarName = basisP2[i];
        const colIdxInP2 = headersP2.indexOf(basicVarName);

        if (colIdxInP2 !== -1) {
            const factor = tableauP2[totalRowsP2 - 1][colIdxInP2];
            if (Math.abs(factor) > 1e-9) {
                for (let j = 0; j < totalColsP2; j++) {
                    tableauP2[totalRowsP2 - 1][j] -= factor * tableauP2[i][j];
                }
            }
        }
    }

    phase2Steps.push({
        matrix: cloneMatrix(tableauP2),
        basis: [...basisP2],
        headers: [...headersP2],
        pivotColIndex: -1,
        pivotRowIndex: -1,
        ratios: Array(numConstraints).fill(null),
        stepTitle: "Tabla Inicial Acondicionada (Fase II)"
    });

    // =========================================================================
    // SIMPLEX - FASE II (Optimización Final)
    // =========================================================================
    let isOptimalP2 = false;
    let iterP2 = 0;

    while (!isOptimalP2 && iterP2 < 50) {
        let lastRow = tableauP2[totalRowsP2 - 1];
        let pivotCol = -1;

        if (optType === "MAX") {
            let minVal = -1e-6;
            for (let j = 0; j < totalColsP2 - 1; j++) {
                if (lastRow[j] < minVal) {
                    minVal = lastRow[j];
                    pivotCol = j;
                }
            }
        } else {
            let maxVal = 1e-6;
            for (let j = 0; j < totalColsP2 - 1; j++) {
                if (lastRow[j] > maxVal) {
                    maxVal = lastRow[j];
                    pivotCol = j;
                }
            }
        }

        if (pivotCol === -1) {
            isOptimalP2 = true;
            break;
        }

        let pivotRow = -1;
        let minRatio = Infinity;
        let currentRatios = Array(numConstraints).fill(null);

        for (let i = 0; i < numConstraints; i++) {
            let colVal = tableauP2[i][pivotCol];
            if (colVal > 1e-9) {
                let rhsVal = tableauP2[i][totalColsP2 - 1];
                let ratio = rhsVal / colVal;
                currentRatios[i] = ratio;
                if (ratio >= 0 && ratio < minRatio) {
                    minRatio = ratio;
                    pivotRow = i;
                }
            }
        }

        if (pivotRow === -1) {
            showError("El problema no está acotado (solución no acotada en Fase II).");
            return;
        }

        phase2Steps[phase2Steps.length - 1].pivotColIndex = pivotCol;
        phase2Steps[phase2Steps.length - 1].pivotRowIndex = pivotRow;
        phase2Steps[phase2Steps.length - 1].ratios = [...currentRatios];

        // Pivoteo
        basisP2[pivotRow] = headersP2[pivotCol];
        let pivotElement = tableauP2[pivotRow][pivotCol];

        for (let j = 0; j < totalColsP2; j++) {
            tableauP2[pivotRow][j] /= pivotElement;
        }

        for (let i = 0; i < totalRowsP2; i++) {
            if (i !== pivotRow) {
                let factor = tableauP2[i][pivotCol];
                for (let j = 0; j < totalColsP2; j++) {
                    tableauP2[i][j] -= factor * tableauP2[pivotRow][j];
                }
            }
        }

        iterP2++;

        phase2Steps.push({
            matrix: cloneMatrix(tableauP2),
            basis: [...basisP2],
            headers: [...headersP2],
            pivotColIndex: -1,
            pivotRowIndex: -1,
            ratios: Array(numConstraints).fill(null),
            stepTitle: `Iteración ${iterP2} (Fase II)`
        });
    }

    let finalZ = tableauP2[totalRowsP2 - 1][totalColsP2 - 1];
    if (optType === "MAX") finalZ = -finalZ;

    if (DOM.optimalZValue) DOM.optimalZValue.innerText = formatNum(Math.abs(finalZ));
    if (DOM.modelStatus) {
        DOM.modelStatus.innerText = "Óptimo Alcanzado";
        DOM.modelStatus.className = "badge-status online badge-cyan";
    }

    DOM.resultsPanel.style.display = 'block';
    
    // Iniciar desplegando por defecto la Fase II
    activePhase = 2;
    currentStepIndex = 0;
    actualizarPestañasUX();
    renderPasoActual();
}

// =========================================================================
// 4. RENDERIZADO VISUAL Y TABLAS DE ITERACIÓN
// =========================================================================
function actualizarPestañasUX() {
    if (activePhase === 1) {
        DOM.tabPhase1.classList.add('active');
        DOM.tabPhase2.classList.remove('active');
        if (DOM.phaseTransitionBanner) DOM.phaseTransitionBanner.style.display = 'none';
    } else {
        DOM.tabPhase2.classList.add('active');
        DOM.tabPhase1.classList.remove('active');
        if (DOM.phaseTransitionBanner) DOM.phaseTransitionBanner.style.display = 'flex';
    }
}

function renderPasoActual() {
    const stepsList = (activePhase === 1) ? phase1Steps : phase2Steps;
    if (!stepsList || stepsList.length === 0) return;

    const iter = stepsList[currentStepIndex];
    const totalSteps = stepsList.length - 1;

    if (DOM.iterationCounter) {
        DOM.iterationCounter.innerText = `${iter.stepTitle.toUpperCase()} - [ PASO ${currentStepIndex} DE ${totalSteps} ]`;
    }

    if (DOM.btnPrevStep) {
        DOM.btnPrevStep.style.opacity = currentStepIndex === 0 ? "0.3" : "1";
        DOM.btnPrevStep.style.pointerEvents = currentStepIndex === 0 ? "none" : "auto";
    }
    if (DOM.btnNextStep) {
        DOM.btnNextStep.style.opacity = currentStepIndex === totalSteps ? "0.3" : "1";
        DOM.btnNextStep.style.pointerEvents = currentStepIndex === totalSteps ? "none" : "auto";
    }

    let html = `
        <div class="matrix-table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="th-base">Base</th>`;
    
    iter.headers.forEach(h => {
        let colorClass = "header-var-default";
        if (h.startsWith("R")) colorClass = "header-var-artificial";
        if (h.startsWith("S")) colorClass = "header-var-slack";
        
        html += `<th class="${colorClass}">${h}</th>`;
    });
    
    html += `           <th class="th-sol">Solución</th>
                        <th class="th-ratio">Razón</th>
                    </tr>
                </thead>
                <tbody>`;

    for (let i = 0; i < iter.matrix.length; i++) {
        const isObjRow = (i === iter.matrix.length - 1);
        const isPivotRow = (i === iter.pivotRowIndex);
        let rowClass = isPivotRow ? 'class="pivot-row"' : '';

        html += `<tr ${rowClass}>
                    <td class="td-base ${isObjRow ? 'text-cyan' : ''}">
                        ${iter.basis[i]}
                    </td>`;

        for (let j = 0; j < iter.matrix[i].length; j++) {
            const isPivotCol = (j === iter.pivotColIndex);
            let cellClass = '';

            if (isPivotRow && isPivotCol) {
                cellClass = 'class="pivot-element"';
            } else if (isPivotCol) {
                cellClass = 'class="pivot-col"';
            }

            html += `<td ${cellClass}>${formatNum(iter.matrix[i][j])}</td>`;
        }

        if (!isObjRow) {
            let ratioVal = (iter.ratios && iter.ratios[i] !== undefined && iter.ratios[i] !== null)
                ? (isFinite(iter.ratios[i]) && iter.ratios[i] >= 0 ? formatNum(iter.ratios[i]) : '&infin;')
                : '-';
            html += `<td class="td-ratio">${ratioVal}</td>`;
        } else {
            html += `<td class="td-ratio-empty">-</td>`;
        }

        html += `</tr>`;
    }

    html += `   </tbody>
            </table>
        </div>`;

    if (DOM.simplexTablesContainer) {
        DOM.simplexTablesContainer.innerHTML = html;
    }
}

// =========================================================================
// 5. FUNCIONES AUXILIARES DE SOPORTE
// =========================================================================
function cloneMatrix(matrix) {
    return matrix.map(row => [...row]);
}

function formatNum(num) {
    if (Math.abs(num) < 1e-5) return "0";
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}

function showError(msg) {
    if (DOM.errorMessage && DOM.errorModal) {
        DOM.errorMessage.innerText = msg;
        DOM.errorModal.style.display = 'flex';
    } else {
        alert(msg);
    }
}

function reiniciarModulo() {
    if (DOM.variableCount) DOM.variableCount.value = '';
    if (DOM.constraintCount) DOM.constraintCount.value = '';
    if (DOM.matrixSection) DOM.matrixSection.style.display = 'none';
    if (DOM.resultsPanel) DOM.resultsPanel.style.display = 'none';
    if (DOM.twoPhaseModelWrapper) DOM.twoPhaseModelWrapper.innerHTML = '';
    phase1Steps = [];
    phase2Steps = [];
    activePhase = 1;
    currentStepIndex = 0;
}
