// =========================================================================
// 1. CONTROLADORES DEL DOM Y SELECTORES DEL SISTEMA
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
    
    equationFormPreview: document.getElementById('equation-form-preview'),
    equationFormContent: document.getElementById('equation-form-content'),

    resultsPanel: document.getElementById('results-panel'),
    optimalZValue: document.getElementById('optimal-z-value'),
    modelStatus: document.getElementById('model-status'),
    
    optimalSolutionTableWrapper: document.getElementById('optimal-solution-table-wrapper'),
    resourceStatusTableWrapper: document.getElementById('resource-status-table-wrapper'),
    simplexTablesContainer: document.getElementById('simplex-tables-container'),
    
    errorModal: document.getElementById('error-modal'),
    errorMessage: document.getElementById('error-message'),
    btnCloseModal: document.getElementById('btn-close-modal'),

    // Botones de Navegación del Paso a Paso
    btnPrevStep: document.getElementById('btn-prev-step'),
    btnNextStep: document.getElementById('btn-next-step'),
    iterationCounter: document.getElementById('iteration-counter')
};

// =========================================================================
// 2. ESTADO GLOBAL DE LAS ITERACIONES (PASO A PASO)
// =========================================================================
let numVars = 0;
let numConstraints = 0;
let simplexSteps = []; 
let currentStepIndex = 0;

// =========================================================================
// 3. LISTENERS DE INTERFAZ GENERAL
// =========================================================================
if (DOM.btnGenerateModel) DOM.btnGenerateModel.addEventListener('click', generarMatrizFormulario);
if (DOM.btnResetSimplex) DOM.btnResetSimplex.addEventListener('click', reiniciarMóduloCompleto);
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
// 4. GENERACIÓN DINÁMICA DE LA MATRIZ DE INPUTS
// =========================================================================
function generarMatrizFormulario() {
    numVars = parseInt(DOM.variableCount.value);
    numConstraints = parseInt(DOM.constraintCount.value);

    if (isNaN(numVars) || numVars < 1 || numVars > 10 || isNaN(numConstraints) || numConstraints < 1 || numConstraints > 10) {
        showError("Por favor, ingresa entre 1 y 10 para variables y restricciones.");
        return;
    }

    let html = `<div class="objective-function-setup" style="margin-bottom:25px;">
                    <h4 style="color:var(--cyan-primary); margin-bottom:10px; font-size:14px;">Función Objetivo (Z)</h4>
                    <div class="matrix-row-simplex">
                        <span style="color:var(--text-main); font-weight:700; margin-right:5px;">Z = </span>`;
    
    for (let j = 1; j <= numVars; j++) {
        html += `<input type="number" id="z-c${j}" class="input-simplex-coeff" placeholder="0">
                 <span style="color:var(--text-muted); margin-right:10px;">x<sub>${j}</sub> ${j < numVars ? '+' : ''}</span>`;
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
                     <span style="color:var(--text-muted); margin-right:10px;">x<sub>${j}</sub> ${j < numVars ? '+' : ''}</span>`;
        }
        html += `   <select id="r${i}-sign" class="simplex-sign-select">
                        <option value="<=">&le;</option>
                    </select>
                    <input type="number" id="r${i}-rhs" class="input-simplex-coeff" placeholder="0" style="margin-left:10px; text-align:left; padding-left:8px; width:85px;">
                 </div>`;
    }
    html += `</div>`;

    DOM.simplexModelWrapper.innerHTML = html;
    DOM.matrixSection.style.display = 'block';
    DOM.resultsPanel.style.display = 'none';
    if (DOM.equationFormPreview) DOM.equationFormPreview.style.display = 'none';
}

// =========================================================================
// 5. CONSTRUCTOR DEL MODELO EN FORMA DE ECUACIÓN
// =========================================================================
function construirFormaEcuacion(type) {
    let zStr = `${type === 'MAX' ? 'Maximizar' : 'Minimizar'} z = `;
    let zTerms = [];
    
    for (let j = 1; j <= numVars; j++) {
        let val = parseFloat(document.getElementById(`z-c${j}`).value) || 0;
        zTerms.push(`${val}x<sub>${j}</sub>`);
    }
    for (let j = 1; j <= numConstraints; j++) {
        zTerms.push(`0s<sub>${j}</sub>`);
    }
    zStr += zTerms.join(' + ') + '<br><br><strong>Sujeto a:</strong><br>';

    let reqs = [];
    for (let i = 1; i <= numConstraints; i++) {
        let terms = [];
        for (let j = 1; j <= numVars; j++) {
            let val = parseFloat(document.getElementById(`r${i}-c${j}`).value) || 0;
            terms.push(`${val}x<sub>${j}</sub>`);
        }
        terms.push(`s<sub>${i}</sub>`);
        let rhs = parseFloat(document.getElementById(`r${i}-rhs`).value) || 0;
        reqs.push(terms.join(' + ') + ` = ${rhs}`);
    }

    zStr += reqs.join('<br>');
    
    let allVars = [];
    for (let j = 1; j <= numVars; j++) allVars.push(`x<sub>${j}</sub>`);
    for (let i = 1; i <= numConstraints; i++) allVars.push(`s<sub>${i}</sub>`);
    zStr += `<br><br>${allVars.join(', ')} &ge; 0`;

    if (DOM.equationFormContent) DOM.equationFormContent.innerHTML = zStr;
    if (DOM.equationFormPreview) DOM.equationFormPreview.style.display = 'block';
}

// =========================================================================
// 6. MOTOR ALGEBRAICO PRINCIPAL: MÉTODO SIMPLEX
// =========================================================================
if (DOM.btnCalculateSimplex) {
    DOM.btnCalculateSimplex.addEventListener('click', () => {
        let type = DOM.optimizationType.value;
        construirFormaEcuacion(type);

        let totalRows = numConstraints + 1; 
        let totalCols = numVars + numConstraints + 1; 

        let tableau = Array(totalRows).fill(0).map(() => Array(totalCols).fill(0));
        let basis = [];
        let headers = [];

        // Nombres de cabecera
        for (let j = 1; j <= numVars; j++) headers.push(`x${j}`);
        for (let j = 1; j <= numConstraints; j++) headers.push(`s${j}`);

        for (let i = 1; i <= numConstraints; i++) {
            basis.push(`s${i}`);
        }
        basis.push("z");

        // Fila de restricciones
        for (let i = 0; i < numConstraints; i++) {
            for (let j = 0; j < numVars; j++) {
                let val = parseFloat(document.getElementById(`r${i+1}-c${j+1}`).value);
                tableau[i][j] = isNaN(val) ? 0 : val;
            }
            tableau[i][numVars + i] = 1; 

            let rhsVal = parseFloat(document.getElementById(`r${i+1}-rhs`).value);
            tableau[i][totalCols - 1] = isNaN(rhsVal) ? 0 : rhsVal;
        }

        // Fila de función objetivo
        for (let j = 0; j < numVars; j++) {
            let val = parseFloat(document.getElementById(`z-c${j+1}`).value);
            let coeff = isNaN(val) ? 0 : val;
            tableau[totalRows - 1][j] = (type === "MAX") ? -coeff : coeff; 
        }
        tableau[totalRows - 1][totalCols - 1] = 0;

        simplexSteps = [{
            matrix: cloneMatrix(tableau),
            basis: [...basis],
            headers: [...headers],
            pivotColIndex: -1,
            pivotRowIndex: -1,
            ratios: Array(numConstraints).fill(null)
        }];

        let isOptimal = false;
        let currentIter = 0;
        let maxLoop = 30;

        while (!isOptimal && currentIter < maxLoop) {
            let lastRow = tableau[totalRows - 1];
            let pivotCol = -1;
            let minVal = 0;

            for (let j = 0; j < totalCols - 1; j++) {
                if (lastRow[j] < minVal) {
                    minVal = lastRow[j];
                    pivotCol = j;
                }
            }

            if (pivotCol === -1) {
                isOptimal = true;
                break;
            }

            let pivotRow = -1;
            let minRatio = Infinity;
            let currentRatios = Array(numConstraints).fill(null);

            for (let i = 0; i < numConstraints; i++) {
                let colVal = tableau[i][pivotCol];
                if (colVal > 0) { 
                    let rhsVal = tableau[i][totalCols - 1];
                    let ratio = rhsVal / colVal;
                    currentRatios[i] = ratio;
                    if (ratio < minRatio) {
                        minRatio = ratio;
                        pivotRow = i;
                    }
                }
            }

            if (pivotRow === -1) {
                showError("El modelo no está acotado. El espacio de soluciones viables es infinito.");
                return;
            }

            simplexSteps[simplexSteps.length - 1].pivotColIndex = pivotCol;
            simplexSteps[simplexSteps.length - 1].pivotRowIndex = pivotRow;
            simplexSteps[simplexSteps.length - 1].ratios = [...currentRatios];

            basis[pivotRow] = pivotCol < numVars ? `x${pivotCol + 1}` : `s${pivotCol - numVars + 1}`;
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

        let finalZ = tableau[totalRows - 1][totalCols - 1];
        if (DOM.optimalZValue) DOM.optimalZValue.innerText = formatNum(finalZ);
        if (DOM.modelStatus) DOM.modelStatus.innerText = isOptimal ? "Óptimo Alcanzado" : "Límite Alcanzado";
        
        renderizarTablasResultado(tableau, basis);

        if (DOM.resultsPanel) DOM.resultsPanel.style.display = 'block';
        
        currentStepIndex = 0;
        renderPasoActual();
    });
}

// =========================================================================
// 7. LECTURA DE LA SOLUCIÓN ÓPTIMA Y CLASIFICACIÓN DE RESTRICCIONES
// =========================================================================
function renderizarTablasResultado(tableau, basis) {
    let totalCols = numVars + numConstraints + 1;

    // Mapa de valores finales
    let varValues = {};
    for (let j = 1; j <= numVars; j++) varValues[`x${j}`] = 0;
    for (let i = 1; i <= numConstraints; i++) varValues[`s${i}`] = 0;

    for (let i = 0; i < numConstraints; i++) {
        let varName = basis[i];
        let val = tableau[i][totalCols - 1];
        varValues[varName] = val;
    }

    // 1. TABLA DE SOLUCIÓN ÓPTIMA
    let htmlOpt = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Variable de Decisión</th>
                    <th>Valor Óptimo</th>
                    <th>Estado / Interpretación</th>
                </tr>
            </thead>
            <tbody>`;
    
    for (let j = 1; j <= numVars; j++) {
        let val = varValues[`x${j}`];
        htmlOpt += `
            <tr>
                <td><strong>x<sub>${j}</sub></strong></td>
                <td><span class="value-highlight">${formatNum(val)}</span></td>
                <td>${val > 0 ? 'Variable Básica (Produce beneficio)' : 'Variable No Básica (Sin asignación)'}</td>
            </tr>`;
    }
    
    let finalZ = tableau[numConstraints][totalCols - 1];
    htmlOpt += `
            <tr class="highlight-row">
                <td><strong>Z (Objetivo)</strong></td>
                <td><span class="value-highlight">${formatNum(finalZ)}</span></td>
                <td>Valor total óptimo alcanzado</td>
            </tr>
        </tbody>
    </table>`;

    if (DOM.optimalSolutionTableWrapper) DOM.optimalSolutionTableWrapper.innerHTML = htmlOpt;

    // 2. TABLA DE CLASIFICACIÓN DE RESTRICCIONES (RECURSOS)
    let htmlRes = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Recurso / Restricción</th>
                    <th>Valor de Holgura (s<sub>i</sub>)</th>
                    <th>Estado del Recurso</th>
                </tr>
            </thead>
            <tbody>`;

    for (let i = 1; i <= numConstraints; i++) {
        let slackVal = varValues[`s${i}`];
        let isEscaso = Math.abs(slackVal) < 1e-6;
        let badgeClass = isEscaso ? 'badge-escaso' : 'badge-abundante';
        let statusText = isEscaso ? 'Escaso (Consumido al 100%)' : 'Abundante (Sobrante disponible)';

        htmlRes += `
            <tr>
                <td><strong>Restricción ${i} (R${i})</strong></td>
                <td>s<sub>${i}</sub> = ${formatNum(slackVal)}</td>
                <td><span class="status-pill ${badgeClass}">${statusText}</span></td>
            </tr>`;
    }
    htmlRes += `</tbody></table>`;

    if (DOM.resourceStatusTableWrapper) DOM.resourceStatusTableWrapper.innerHTML = htmlRes;
}

// =========================================================================
// 8. RENDERIZADOR DE PANELES DE TABLAS
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
        html += `<th style="padding: 12px; color: var(--text-main); font-weight: 600; font-size:13px;">${h}</th>`;
    });
    
    html += `           <th style="padding: 12px; color: var(--cyan-primary); font-size:13px;">RHS</th>
                        <th style="padding: 12px; color: var(--magenta-primary); font-size:13px;">Razón</th>
                    </tr>
                </thead>
                <tbody>`;

    for (let i = 0; i < iter.matrix.length; i++) {
        const isZRow = (i === iter.matrix.length - 1);
        const isPivotRow = (i === iter.pivotRowIndex);
        let rowClass = isPivotRow ? 'class="pivot-row"' : '';

        html += `<tr ${rowClass} style="border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.2s;">
                    <td style="padding: 12px; font-weight: 700; color: ${isZRow ? 'var(--cyan-primary)' : 'var(--text-muted)'}; background: rgba(255,255,255,0.01);">
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

// =========================================================================
// 9. AUXILIARES MATEMÁTICOS Y DE LIMPIEZA
// =========================================================================
function cloneMatrix(matrix) {
    return matrix.map(row => [...row]);
}

function formatNum(num) {
    if (num === 0 || Math.abs(num) < 1e-9) return "0";
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

function reiniciarMóduloCompleto() {
    if (DOM.variableCount) DOM.variableCount.value = '';
    if (DOM.constraintCount) DOM.constraintCount.value = '';
    if (DOM.matrixSection) DOM.matrixSection.style.display = 'none';
    if (DOM.resultsPanel) DOM.resultsPanel.style.display = 'none';
    if (DOM.equationFormPreview) DOM.equationFormPreview.style.display = 'none';
    if (DOM.simplexModelWrapper) DOM.simplexModelWrapper.innerHTML = '';
    simplexSteps = [];
    currentStepIndex = 0;
}