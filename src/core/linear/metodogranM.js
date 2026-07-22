// =========================================================================
// TORA ADVANCED - MÓDULO DEL MÉTODO DE LA GRAN M (metodogranM.js)
// =========================================================================

const DOM = {
    variableCount: document.getElementById('variable-count'),
    constraintCount: document.getElementById('constraint-count'),
    optimizationType: document.getElementById('optimization-type'),
    btnGenerateModel: document.getElementById('btn-generate-model'),
    btnResetSimplex: document.getElementById('btn-reset-simplex'),
    
    matrixSection: document.getElementById('matrix-section'),
    simplexModelWrapper: document.getElementById('simplex-model-wrapper'),
    btnCalculateSimplex: document.getElementById('btn-calculate-simplex'),
    
    resultsPanel: document.getElementById('results-panel'),
    optimalZValue: document.getElementById('optimal-z-value'),
    modelStatus: document.getElementById('model-status'),
    simplexTablesContainer: document.getElementById('simplex-tables-container'),
    
    errorModal: document.getElementById('error-modal'),
    errorMessage: document.getElementById('error-message'),
    btnCloseModal: document.getElementById('btn-close-modal'),

    btnPrevStep: document.getElementById('btn-prev-step'),
    btnNextStep: document.getElementById('btn-next-step'),
    iterationCounter: document.getElementById('iteration-counter')
};

// Valor numérico de M (Suficientemente grande para el escalamiento)
const BIG_M = 100000;

let numVars = 0;
let numConstraints = 0;
let simplexSteps = []; 
let currentStepIndex = 0;

// Listeners principales
if (DOM.btnGenerateModel) DOM.btnGenerateModel.addEventListener('click', generarMatrizGranM);
if (DOM.btnResetSimplex) DOM.btnResetSimplex.addEventListener('click', reiniciarModulo);
if (DOM.btnCloseModal) DOM.btnCloseModal.addEventListener('click', () => DOM.errorModal.style.display = 'none');

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
        if (currentStepIndex < simplexSteps.length - 1) {
            currentStepIndex++;
            renderPasoActual();
        }
    });
}

// =========================================================================
// 1. GENERACIÓN DINÁMICA DEL FORMULARIO CON OPTION DE SIGNOS (<=, >=, =)
// =========================================================================
function generarMatrizGranM() {
    numVars = parseInt(DOM.variableCount.value);
    numConstraints = parseInt(DOM.constraintCount.value);

    if (isNaN(numVars) || numVars < 1 || isNaN(numConstraints) || numConstraints < 1) {
        showError("Ingresa números válidos de variables y restricciones (mínimo 1).");
        return;
    }

    let html = `<div class="objective-function-setup" style="margin-bottom:25px;">
                    <h4 style="color:var(--cyan-primary); margin-bottom:10px; font-size:14px;">Función Objetivo (Z)</h4>
                    <div class="matrix-row-simplex">
                        <span style="color:var(--text-main); font-weight:700; margin-right:5px;">Z = </span>`;
    
    for (let j = 1; j <= numVars; j++) {
        html += `<input type="number" id="z-c${j}" class="input-simplex-coeff" placeholder="0">
                 <span style="color:var(--text-muted); margin-right:10px;">X<sub>${j}</sub> ${j < numVars ? '+' : ''}</span>`;
    }
    html += `   </div>
             </div>
             <div class="constraints-setup">
                <h4 style="color:var(--magenta-primary); margin-bottom:10px; font-size:14px;">Restricciones del Sistema</h4>`;

    for (let i = 1; i <= numConstraints; i++) {
        html += `<div class="matrix-row-simplex">
                    <span style="color:var(--text-muted); font-size:12px; min-width:30px;">R${i}:</span>`;
        for (let j = 1; j <= numVars; j++) {
            html += `<input type="number" id="r${i}-c${j}" class="input-simplex-coeff" placeholder="0">
                     <span style="color:var(--text-muted); margin-right:10px;">X<sub>${j}</sub> ${j < numVars ? '+' : ''}</span>`;
        }
        html += `   <select id="r${i}-sign" class="simplex-sign-select">
                        <option value="<=">&le;</option>
                        <option value=">=">&ge;</option>
                        <option value="=">=</option>
                    </select>
                    <input type="number" id="r${i}-rhs" class="input-simplex-coeff" placeholder="0" style="margin-left:10px; text-align:left; padding-left:8px; width:85px;">
                 </div>`;
    }
    html += `</div>`;

    DOM.simplexModelWrapper.innerHTML = html;
    DOM.matrixSection.style.display = 'block';
    DOM.resultsPanel.style.display = 'none';
}

// =========================================================================
// 2. MOTOR ALGEBRAICO PRINCIPAL: MÉTODO DE LA GRAN M
// =========================================================================
if (DOM.btnCalculateSimplex) {
    DOM.btnCalculateSimplex.addEventListener('click', () => {
        const type = DOM.optimizationType.value; // "MAX" o "MIN"
        
        let slackSurplusVars = [];
        let artificialVars = [];
        let constraintTypes = [];
        
        // Determinar qué variables ($S_i, R_i$) se agregan según cada tipo de restricción
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

        let headers = [];
        for (let j = 1; j <= numVars; j++) headers.push(`X${j}`);
        
        // Cabeceras de Holgura / Exceso
        let sCounter = 1;
        slackSurplusVars.forEach(v => {
            v.name = `S${sCounter++}`;
            headers.push(v.name);
        });

        // Cabeceras Artificiales
        let rCounter = 1;
        artificialVars.forEach(v => {
            v.name = `R${rCounter++}`;
            headers.push(v.name);
        });

        const totalCols = headers.length + 1; // +1 para columna RHS
        const totalRows = numConstraints + 1; // +1 para fila Z

        let tableau = Array(totalRows).fill(0).map(() => Array(totalCols).fill(0));
        let basis = [];

        // Llenado de filas de restricciones y asignación de la base inicial
        for (let i = 0; i < numConstraints; i++) {
            // Variables de decisión originales
            for (let j = 0; j < numVars; j++) {
                let val = parseFloat(document.getElementById(`r${i+1}-c${j+1}`).value);
                tableau[i][j] = isNaN(val) ? 0 : val;
            }

            // RHS
            let rhsVal = parseFloat(document.getElementById(`r${i+1}-rhs`).value);
            tableau[i][totalCols - 1] = isNaN(rhsVal) ? 0 : rhsVal;

            const sign = constraintTypes[i];

            if (sign === '<=') {
                const sObj = slackSurplusVars.find(s => s.constraintIndex === i + 1);
                const colIdx = headers.indexOf(sObj.name);
                tableau[i][colIdx] = 1;
                basis.push(sObj.name);
            } else if (sign === '>=') {
                const sObj = slackSurplusVars.find(s => s.constraintIndex === i + 1);
                const rObj = artificialVars.find(r => r.constraintIndex === i + 1);
                
                tableau[i][headers.indexOf(sObj.name)] = -1; // Superávit
                tableau[i][headers.indexOf(rObj.name)] = 1;  // Artificial
                basis.push(rObj.name);
            } else if (sign === '=') {
                const rObj = artificialVars.find(r => r.constraintIndex === i + 1);
                tableau[i][headers.indexOf(rObj.name)] = 1;
                basis.push(rObj.name);
            }
        }
        basis.push("Z");

        // Configuración Fila Z (Función Objetivo Original + Penalizaciones Gran M)
        for (let j = 0; j < numVars; j++) {
            let val = parseFloat(document.getElementById(`z-c${j+1}`).value);
            let coeff = isNaN(val) ? 0 : val;
            // Forma estándar: Z - c1X1 - c2X2 ... = 0
            tableau[totalRows - 1][j] = (type === "MAX") ? -coeff : coeff;
        }

        // Aplicar la penalización M a las variables artificiales en la fila Z
        artificialVars.forEach(r => {
            const colIdx = headers.indexOf(r.name);
            tableau[totalRows - 1][colIdx] = (type === "MAX") ? BIG_M : -BIG_M;
        });

        // PASO CRÍTICO DE ACONDICIONAMIENTO: Eliminar las M de la Fila Z para las variables básicas iniciales
        for (let i = 0; i < numConstraints; i++) {
            const currentBasisVar = basis[i];
            if (currentBasisVar.startsWith("R")) {
                const factor = tableau[totalRows - 1][headers.indexOf(currentBasisVar)];
                for (let j = 0; j < totalCols; j++) {
                    tableau[totalRows - 1][j] -= factor * tableau[i][j];
                }
            }
        }

        // Registrar la Iteración 0 (Acondicionada)
        simplexSteps = [{
            matrix: cloneMatrix(tableau),
            basis: [...basis],
            headers: [...headers],
            pivotColIndex: -1,
            pivotRowIndex: -1,
            ratios: Array(numConstraints).fill(null)
        }];

        // Bucle Iterativo Simplex
        let isOptimal = false;
        let currentIter = 0;
        const maxLoop = 50;

        while (!isOptimal && currentIter < maxLoop) {
            let lastRow = tableau[totalRows - 1];
            let pivotCol = -1;

            if (type === "MAX") {
                let minVal = -1e-6; // Criterio de entrada: más negativo
                for (let j = 0; j < totalCols - 1; j++) {
                    if (lastRow[j] < minVal) {
                        minVal = lastRow[j];
                        pivotCol = j;
                    }
                }
            } else {
                let maxVal = 1e-6; // Criterio de entrada MIN: más positivo
                for (let j = 0; j < totalCols - 1; j++) {
                    if (lastRow[j] > maxVal) {
                        maxVal = lastRow[j];
                        pivotCol = j;
                    }
                }
            }

            if (pivotCol === -1) {
                isOptimal = true;
                break;
            }

            // Prueba de la Razón Mínima (Factibilidad de Salida)
            let pivotRow = -1;
            let minRatio = Infinity;
            let currentRatios = Array(numConstraints).fill(null);

            for (let i = 0; i < numConstraints; i++) {
                let colVal = tableau[i][pivotCol];
                if (colVal > 1e-9) {
                    let rhsVal = tableau[i][totalCols - 1];
                    let ratio = rhsVal / colVal;
                    currentRatios[i] = ratio;
                    if (ratio >= 0 && ratio < minRatio) {
                        minRatio = ratio;
                        pivotRow = i;
                    }
                }
            }

            if (pivotRow === -1) {
                showError("El modelo no está acotado. La solución óptima tiende al infinito.");
                return;
            }

            simplexSteps[simplexSteps.length - 1].pivotColIndex = pivotCol;
            simplexSteps[simplexSteps.length - 1].pivotRowIndex = pivotRow;
            simplexSteps[simplexSteps.length - 1].ratios = [...currentRatios];

            // Reemplazo en la Base
            basis[pivotRow] = headers[pivotCol];

            // Operaciones Gauss-Jordan
            let pivotElement = tableau[pivotRow][pivotCol];
            for (let j = 0; j < totalCols; j++) {
                tableau[pivotRow][j] /= pivotElement;
            }

            for (let i = 0; i < totalRows; i++) {
                if (i !== pivotRow) {
                    let factor = tableau[i][pivotCol];
                    for (let j = 0; j < totalCols; j++) {
                        tableau[i][j] -= factor * tableau[pivotRow][j];
                    }
                }
            }

            currentIter++;

            simplexSteps.push({
                matrix: cloneMatrix(tableau),
                basis: [...basis],
                headers: [...headers],
                pivotColIndex: -1,
                pivotRowIndex: -1,
                ratios: Array(numConstraints).fill(null)
            });
        }

        // Verificación final de factibilidad
        let isInfeasible = false;
        for (let i = 0; i < numConstraints; i++) {
            if (basis[i].startsWith("R") && Math.abs(tableau[i][totalCols - 1]) > 1e-4) {
                isInfeasible = true;
                break;
            }
        }

        let finalZ = tableau[totalRows - 1][totalCols - 1];
        if (type === "MAX") finalZ = -finalZ;

        if (isInfeasible) {
            showError("El problema NO tiene solución factible (Infactible). Al menos una variable artificial permanece en la base.");
            if (DOM.modelStatus) DOM.modelStatus.innerText = "Infactible";
            if (DOM.optimalZValue) DOM.optimalZValue.innerText = "N/A";
        } else {
            if (DOM.optimalZValue) DOM.optimalZValue.innerText = formatNum(Math.abs(finalZ));
            if (DOM.modelStatus) DOM.modelStatus.innerText = isOptimal ? "Óptimo Alcanzado" : "Límite Excedido";
        }

        if (DOM.resultsPanel) DOM.resultsPanel.style.display = 'block';

        currentStepIndex = 0;
        renderPasoActual();
    });
}

// =========================================================================
// 3. RENDERIZADOR Y AUXILIARES
// =========================================================================
function renderPasoActual() {
    if (simplexSteps.length === 0) return;

    const iter = simplexSteps[currentStepIndex];
    const totalSteps = simplexSteps.length - 1;

    if (DOM.iterationCounter) {
        DOM.iterationCounter.innerText = `TABLA: ${currentStepIndex} de ${totalSteps} ${currentStepIndex === totalSteps ? '(FINAL)' : ''}`;
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
        <div class="matrix-table-wrapper" style="overflow-x: auto; background: rgba(9,5,20,0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 15px;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: center;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);">
                        <th style="padding: 12px; color: var(--text-muted); font-size:13px;">Base</th>`;
    
    iter.headers.forEach(h => {
        let color = h.startsWith("R") ? "var(--magenta-primary)" : "var(--text-main)";
        html += `<th style="padding: 12px; color: ${color}; font-weight: 600; font-size:13px;">${h}</th>`;
    });
    
    html += `           <th style="padding: 12px; color: var(--cyan-primary); font-size:13px;">RHS</th>
                        <th style="padding: 12px; color: #ff4d6d; font-size:13px;">Razón</th>
                    </tr>
                </thead>
                <tbody>`;

    for (let i = 0; i < iter.matrix.length; i++) {
        const isZRow = (i === iter.matrix.length - 1);
        const isPivotRow = (i === iter.pivotRowIndex);
        let rowClass = isPivotRow ? 'class="pivot-row"' : '';

        html += `<tr ${rowClass} style="border-bottom: 1px solid rgba(255,255,255,0.02);">
                    <td style="padding: 12px; font-weight: 700; color: ${isZRow ? 'var(--cyan-primary)' : 'var(--text-muted)'};">
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

            html += `<td ${cellClass} style="padding: 12px;">${formatNum(iter.matrix[i][j])}</td>`;
        }

        if (!isZRow) {
            let ratioVal = (iter.ratios && iter.ratios[i] !== undefined && iter.ratios[i] !== null)
                ? (isFinite(iter.ratios[i]) && iter.ratios[i] >= 0 ? formatNum(iter.ratios[i]) : '&infin;')
                : '-';
            html += `<td style="color: #ff4d6d; font-weight: 600; padding: 12px;">${ratioVal}</td>`;
        } else {
            html += `<td style="color: var(--text-muted); padding: 12px;">-</td>`;
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

function cloneMatrix(matrix) {
    return matrix.map(row => [...row]);
}

function formatNum(num) {
    if (Math.abs(num) < 1e-5) return "0";
    if (Math.abs(num - BIG_M) < 1000) return "M";
    if (Math.abs(num + BIG_M) < 1000) return "-M";
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
    if (DOM.simplexModelWrapper) DOM.simplexModelWrapper.innerHTML = '';
    simplexSteps = [];
    currentStepIndex = 0;
}