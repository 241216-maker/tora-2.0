/**
 * TORA Advanced - Módulo de Método Gráfico (PL 2D)
 * Algoritmo numérico, cálculo geométrico de región factible y renderizado en Canvas HTML5.
 */

// Colors para restricciones en el canvas
const CONSTRAINT_COLORS = [
    '#53e0dc', // Cyan
    '#9d4edi', // Magenta
    '#ff9e00', // Amber
    '#ff4d6d', // Rose
    '#3a86ff', // Blue
    '#06d6a0', // Emerald
    '#f15bb5', // Pink
    '#fee440'  // Yellow
];

// Estado global del módulo gráfico
let state = {
    zoom: 1.0,
    model: null,
    solution: null
};

// Referencias DOM
const DOM = {
    constraintCount: document.getElementById('constraint-count'),
    optimizationType: document.getElementById('optimization-type'),
    btnGenerateModel: document.getElementById('btn-generate-model'),
    btnLoadReddy: document.getElementById('btn-load-reddy'),
    btnResetGraphic: document.getElementById('btn-reset-graphic'),
    btnCalculateGraphic: document.getElementById('btn-calculate-graphic'),
    matrixSection: document.getElementById('matrix-section'),
    graphicModelWrapper: document.getElementById('graphic-model-wrapper'),
    resultsPanel: document.getElementById('results-panel'),
    optimalCoordsValue: document.getElementById('optimal-coords-value'),
    optimalZValue: document.getElementById('optimal-z-value'),
    linesLegendContainer: document.getElementById('lines-legend-container'),
    verticesTableBody: document.getElementById('vertices-table-body'),
    canvas: document.getElementById('graph-canvas'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomReset: document.getElementById('btn-zoom-reset'),
    errorModal: document.getElementById('error-modal'),
    errorMessage: document.getElementById('error-message'),
    btnCloseModal: document.getElementById('btn-close-modal')
};

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
});

function initEventListeners() {
    DOM.btnGenerateModel?.addEventListener('click', () => generateFormInputs());
    DOM.btnLoadReddy?.addEventListener('click', loadReddyMikksPreset);
    DOM.btnResetGraphic?.addEventListener('click', resetAll);
    DOM.btnCalculateGraphic?.addEventListener('click', calculateAndRender);

    DOM.btnZoomIn?.addEventListener('click', () => adjustZoom(0.15));
    DOM.btnZoomOut?.addEventListener('click', () => adjustZoom(-0.15));
    DOM.btnZoomReset?.addEventListener('click', () => {
        state.zoom = 1.0;
        if (state.solution) renderCanvas();
    });

    DOM.btnCloseModal?.addEventListener('click', () => {
        DOM.errorModal.classList.add('display-none');
    });
}

/**
 * Muestra mensajes de error en la ventana modal
 */
function showError(msg) {
    if (DOM.errorMessage) DOM.errorMessage.textContent = msg;
    DOM.errorModal?.classList.remove('display-none');
}

/**
 * Genera el formulario dinámico para ingresar función objetivo y restricciones
 */
function generateFormInputs(numConstraints = null) {
    const count = numConstraints || parseInt(DOM.constraintCount.value, 10) || 4;
    DOM.constraintCount.value = count;

    let html = `
        <div class="objective-input-container">
            <h4>Función Objetivo Z:</h4>
            <div class="equation-row">
                <span class="eq-label">Z =</span>
                <input type="number" id="c1" step="any" placeholder="c1" class="input-simplex-coeff" value="0">
                <span class="var-label">x<sub>1</sub> +</span>
                <input type="number" id="c2" step="any" placeholder="c2" class="input-simplex-coeff" value="0">
                <span class="var-label">x<sub>2</sub></span>
            </div>
        </div>

        <div class="constraints-input-container mt-15">
            <h4>Restricciones del Sistema:</h4>
    `;

    for (let i = 0; i < count; i++) {
        html += `
            <div class="equation-row constraint-row mt-10" data-index="${i}">
                <span class="eq-label">(${i + 1})</span>
                <input type="number" id="a_${i}_1" step="any" placeholder="a${i+1}1" class="input-simplex-coeff" value="0">
                <span class="var-label">x<sub>1</sub> +</span>
                <input type="number" id="a_${i}_2" step="any" placeholder="a${i+1}2" class="input-simplex-coeff" value="0">
                <span class="var-label">x<sub>2</sub></span>
                
                <select id="sign_${i}" class="simplex-sign-select">
                    <option value="<=">&le;</option>
                    <option value=">=">&ge;</option>
                    <option value="=">=</option>
                </select>

                <input type="number" id="b_${i}" step="any" placeholder="b${i+1}" class="input-simplex-coeff" value="0">
            </div>
        `;
    }

    html += `
        <div class="non-negativity-note mt-10">
            <p><em>* Se incluyen automáticamente las restricciones de no negatividad: x<sub>1</sub> &ge; 0, x<sub>2</sub> &ge; 0</em></p>
        </div>
    `;

    DOM.graphicModelWrapper.innerHTML = html;
    DOM.matrixSection.classList.remove('display-none');
    DOM.resultsPanel.classList.add('display-none');
}

/**
 * Carga el problema clásico de Reddy Mikks (Ejemplo 2.2-1 del libro de Taha)
 */
function loadReddyMikksPreset() {
    DOM.optimizationType.value = 'MAX';
    generateFormInputs(4);

    // Función Objetivo: Z = 5x1 + 4x2
    document.getElementById('c1').value = 5;
    document.getElementById('c2').value = 4;

    // Restricción 1: 6x1 + 4x2 <= 24 (Materia Prima M1)
    document.getElementById('a_0_1').value = 6;
    document.getElementById('a_0_2').value = 4;
    document.getElementById('sign_0').value = '<=';
    document.getElementById('b_0').value = 24;

    // Restricción 2: x1 + 2x2 <= 6 (Materia Prima M2)
    document.getElementById('a_1_1').value = 1;
    document.getElementById('a_1_2').value = 2;
    document.getElementById('sign_1').value = '<=';
    document.getElementById('b_1').value = 6;

    // Restricción 3: -x1 + x2 <= 1 (Límite del mercado)
    document.getElementById('a_2_1').value = -1;
    document.getElementById('a_2_2').value = 1;
    document.getElementById('sign_2').value = '<=';
    document.getElementById('b_2').value = 1;

    // Restricción 4: x2 <= 2 (Límite de demanda)
    document.getElementById('a_3_1').value = 0;
    document.getElementById('a_3_2').value = 1;
    document.getElementById('sign_3').value = '<=';
    document.getElementById('b_3').value = 2;
}

/**
 * Reinicia la pantalla de trabajo
 */
function resetAll() {
    DOM.matrixSection.classList.add('display-none');
    DOM.resultsPanel.classList.add('display-none');
    DOM.graphicModelWrapper.innerHTML = '';
    state.model = null;
    state.solution = null;
    state.zoom = 1.0;
}

/**
 * Lee la entrada del usuario, resuelve geométricamente y genera visualización
 */
function calculateAndRender() {
    const type = DOM.optimizationType.value;
    const c1 = parseFloat(document.getElementById('c1').value) || 0;
    const c2 = parseFloat(document.getElementById('c2').value) || 0;
    const count = parseInt(DOM.constraintCount.value, 10);

    const constraints = [];

    // Agregar restricciones definidas por el usuario
    for (let i = 0; i < count; i++) {
        const a1 = parseFloat(document.getElementById(`a_${i}_1`).value) || 0;
        const a2 = parseFloat(document.getElementById(`a_${i}_2`).value) || 0;
        const sign = document.getElementById(`sign_${i}`).value;
        const b = parseFloat(document.getElementById(`b_${i}`).value) || 0;

        if (a1 === 0 && a2 === 0) {
            showError(`La restricción (${i + 1}) no puede tener ambos coeficientes en cero.`);
            return;
        }

        constraints.push({
            id: i + 1,
            a1, a2, sign, b,
            color: CONSTRAINT_COLORS[i % CONSTRAINT_COLORS.length]
        });
    }

    // Guardar modelo
    state.model = {
        type,
        c1, c2,
        constraints
    };

    // Resolver
    const solution = solveGraphicalModel(state.model);
    if (!solution.success) {
        showError(solution.message);
        return;
    }

    state.solution = solution;
    state.zoom = 1.0;

    // Actualizar Interfaz
    renderSummary(solution);
    renderLegend(constraints);
    renderVerticesTable(solution);
    renderCanvas();

    DOM.resultsPanel.classList.remove('display-none');
    DOM.resultsPanel.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Algoritmo numérico: cálculo de intersecciones y detección de región factible
 */
function solveGraphicalModel(model) {
    // Definición de todas las líneas rectas (Restricciones + Ejes x1=0, x2=0)
    const lines = [];

    model.constraints.forEach(c => {
        lines.push({ a1: c.a1, a2: c.a2, b: c.b, type: 'user', id: c.id });
    });

    // x1 >= 0 (Línea: x1 = 0)
    lines.push({ a1: 1, a2: 0, b: 0, type: 'boundary', name: 'x1 >= 0' });
    // x2 >= 0 (Línea: x2 = 0)
    lines.push({ a1: 0, a2: 1, b: 0, type: 'boundary', name: 'x2 >= 0' });

    // Encontrar todas las intersecciones de a pares de líneas
    const rawPoints = [];
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const pt = intersectLines(lines[i], lines[j]);
            if (pt) {
                rawPoints.push(pt);
            }
        }
    }

    // Filtrar puntos que cumplen TODAS las restricciones (Región Factible)
    const feasiblePoints = [];
    const eps = 1e-5;

    rawPoints.forEach(pt => {
        if (pt.x1 >= -eps && pt.x2 >= -eps) {
            let isFeasible = true;
            for (const c of model.constraints) {
                const val = c.a1 * pt.x1 + c.a2 * pt.x2;
                if (c.sign === '<=' && val > c.b + eps) isFeasible = false;
                if (c.sign === '>=' && val < c.b - eps) isFeasible = false;
                if (c.sign === '=' && Math.abs(val - c.b) > eps) isFeasible = false;
                if (!isFeasible) break;
            }
            if (isFeasible) {
                // Evitar duplicados numéricos
                const exists = feasiblePoints.some(p => Math.abs(p.x1 - pt.x1) < 1e-4 && Math.abs(p.x2 - pt.x2) < 1e-4);
                if (!exists) {
                    feasiblePoints.push({
                        x1: Math.abs(pt.x1) < eps ? 0 : pt.x1,
                        x2: Math.abs(pt.x2) < eps ? 0 : pt.x2
                    });
                }
            }
        }
    });

    if (feasiblePoints.length === 0) {
        return { success: false, message: 'El problema no tiene solución factible (Espacio Vacío).' };
    }

    // Ordenar puntos factibles cíclicamente (polígono convexo)
    const polygon = sortPolygonVertices(feasiblePoints);

    // Evaluar Función Objetivo Z en cada vértice factible
    let bestZ = model.type === 'MAX' ? -Infinity : Infinity;
    let bestVertex = null;

    const evaluatedVertices = polygon.map((pt, idx) => {
        const zVal = model.c1 * pt.x1 + model.c2 * pt.x2;
        const letter = String.fromCharCode(65 + idx); // A, B, C...

        let isBest = false;
        if (model.type === 'MAX') {
            if (zVal > bestZ + 1e-5) {
                bestZ = zVal;
                bestVertex = { ...pt, letter, z: zVal };
            }
        } else {
            if (zVal < bestZ - 1e-5) {
                bestZ = zVal;
                bestVertex = { ...pt, letter, z: zVal };
            }
        }

        return { letter, x1: pt.x1, x2: pt.x2, z: zVal };
    });

    // Marcar el óptimo
    evaluatedVertices.forEach(v => {
        v.isOptimal = Math.abs(v.z - bestZ) < 1e-5;
    });

    return {
        success: true,
        feasiblePolygon: polygon,
        vertices: evaluatedVertices,
        optimal: bestVertex,
        bestZ
    };
}

/**
 * Calcula la intersección entre dos rectas A1*x1 + A2*x2 = B
 */
function intersectLines(l1, l2) {
    const det = l1.a1 * l2.a2 - l2.a1 * l1.a2;
    if (Math.abs(det) < 1e-9) return null; // Rectas paralelas

    const x1 = (l1.b * l2.a2 - l2.b * l1.a2) / det;
    const x2 = (l1.a1 * l2.b - l2.a1 * l1.b) / det;

    return { x1, x2 };
}

/**
 * Ordena los vértices del polígono en sentido antihorario respecto a su centroide
 */
function sortPolygonVertices(points) {
    if (points.length <= 2) return points;

    let cx = 0, cy = 0;
    points.forEach(p => { cx += p.x1; cy += p.x2; });
    cx /= points.length;
    cy /= points.length;

    return points.slice().sort((a, b) => {
        const angleA = Math.atan2(a.x2 - cy, a.x1 - cx);
        const angleB = Math.atan2(b.x2 - cy, b.x1 - cx);
        return angleA - angleB;
    });
}

/**
 * Actualiza la caja contenedora de resumen
 */
function renderSummary(sol) {
    if (DOM.optimalCoordsValue) {
        DOM.optimalCoordsValue.textContent = `(${sol.optimal.x1.toFixed(2)}, ${sol.optimal.x2.toFixed(2)}) [Punto ${sol.optimal.letter}]`;
    }
    if (DOM.optimalZValue) {
        DOM.optimalZValue.textContent = sol.bestZ.toFixed(2);
    }
}

/**
 * Genera la leyenda de restricciones
 */
function renderLegend(constraints) {
    if (!DOM.linesLegendContainer) return;

    let html = '';
    constraints.forEach(c => {
        const signSymbol = c.sign === '<=' ? '≤' : (c.sign === '>=' ? '≥' : '=');
        html += `
            <div class="legend-card-item">
                <span class="line-color-indicator" style="background-color: ${c.color}; color: ${c.color};"></span>
                <span><strong>(${c.id})</strong> ${c.a1}x<sub>1</sub> + ${c.a2}x<sub>2</sub> ${signSymbol} ${c.b}</span>
            </div>
        `;
    });

    DOM.linesLegendContainer.innerHTML = html;
}

/**
 * Llena la tabla HTML con los vértices evaluados
 */
function renderVerticesTable(sol) {
    if (!DOM.verticesTableBody) return;

    let html = '';
    sol.vertices.forEach(v => {
        const rowClass = v.isOptimal ? 'vertex-optimal-row' : '';
        const badge = v.isOptimal 
            ? '<span class="badge-vertex-feasible">★ ÓPTIMO</span>' 
            : '<span class="badge-vertex-infeasible">Factible</span>';

        html += `
            <tr class="${rowClass}">
                <td><strong>Punto ${v.letter}</strong></td>
                <td>${v.x1.toFixed(2)}</td>
                <td>${v.x2.toFixed(2)}</td>
                <td><strong>${v.z.toFixed(2)}</strong></td>
                <td>${badge}</td>
            </tr>
        `;
    });

    DOM.verticesTableBody.innerHTML = html;
}

/**
 * Ajusta el Zoom del Canvas
 */
function adjustZoom(delta) {
    state.zoom = Math.max(0.4, Math.min(3.0, state.zoom + delta));
    if (state.solution) renderCanvas();
}

/**
 * Renderiza el plano cartesiano, líneas, polígono factible y función Z en Canvas HTML5
 */
function renderCanvas() {
    const canvas = DOM.canvas;
    if (!canvas || !state.solution) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar fondo
    ctx.clearRect(0, 0, width, height);

    // Determinar escala automática considerando los vértices y límites
    let maxX = 5;
    let maxY = 5;

    state.solution.feasiblePolygon.forEach(p => {
        if (p.x1 > maxX) maxX = p.x1;
        if (p.x2 > maxY) maxY = p.x2;
    });

    state.model.constraints.forEach(c => {
        if (c.a1 > 0) maxX = Math.max(maxX, c.b / c.a1);
        if (c.a2 > 0) maxY = Math.max(maxY, c.b / c.a2);
    });

    maxX = (maxX + 1.5) / state.zoom;
    maxY = (maxY + 1.5) / state.zoom;

    const padding = 45;
    const scaleX = (width - padding * 2) / maxX;
    const scaleY = (height - padding * 2) / maxY;

    // Funciones de transformación de coordenadas reales -> Canvas
    const toPx = (x1) => padding + x1 * scaleX;
    const toPy = (x2) => height - padding - x2 * scaleY;

    // 1. Dibujar Rejilla / Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    const stepX = Math.max(1, Math.floor(maxX / 10));
    const stepY = Math.max(1, Math.floor(maxY / 10));

    for (let x = 0; x <= maxX; x += stepX) {
        ctx.beginPath();
        ctx.moveTo(toPx(x), toPy(0));
        ctx.lineTo(toPx(x), toPy(maxY));
        ctx.stroke();
    }
    for (let y = 0; y <= maxY; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(toPx(0), toPy(y));
        ctx.lineTo(toPx(maxX), toPy(y));
        ctx.stroke();
    }

    // 2. Dibujar Ejes Cartesianos X1 y X2
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Eje X1
    ctx.beginPath();
    ctx.moveTo(toPx(0), toPy(0));
    ctx.lineTo(toPx(maxX), toPy(0));
    ctx.stroke();

    // Eje X2
    ctx.beginPath();
    ctx.moveTo(toPx(0), toPy(0));
    ctx.lineTo(toPx(0), toPy(maxY));
    ctx.stroke();

    // Títulos de los ejes
    ctx.fillStyle = '#53e0dc';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('X1 (Exterior)', toPx(maxX) - 60, toPy(0) + 30);
    ctx.fillText('X2 (Interior)', toPx(0) - 35, toPy(maxY) - 10);

    // Números de los ejes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px Inter, sans-serif';
    for (let x = 0; x <= maxX; x += stepX) {
        ctx.fillText(x.toString(), toPx(x) - 4, toPy(0) + 15);
    }
    for (let y = 0; y <= maxY; y += stepY) {
        if (y !== 0) ctx.fillText(y.toString(), toPx(0) - 18, toPy(y) + 4);
    }

    // 3. Dibujar Región Factible (Polígono Sombreado)
    const poly = state.solution.feasiblePolygon;
    if (poly.length > 2) {
        ctx.beginPath();
        ctx.moveTo(toPx(poly[0].x1), toPy(poly[0].x2));
        for (let i = 1; i < poly.length; i++) {
            ctx.lineTo(toPx(poly[i].x1), toPy(poly[i].x2));
        }
        ctx.closePath();

        // Relleno Cyan traslúcido
        ctx.fillStyle = 'rgba(83, 224, 220, 0.22)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(83, 224, 220, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // 4. Dibujar Líneas de Restricción
    state.model.constraints.forEach(c => {
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Obtener dos puntos límite para trazar la línea
        let p1 = null, p2 = null;
        if (c.a2 !== 0) {
            p1 = { x1: 0, x2: c.b / c.a2 };
            p2 = { x1: maxX, x2: (c.b - c.a1 * maxX) / c.a2 };
        } else {
            p1 = { x1: c.b / c.a1, x2: 0 };
            p2 = { x1: c.b / c.a1, x2: maxY };
        }

        ctx.moveTo(toPx(p1.x1), toPy(p1.x2));
        ctx.lineTo(toPx(p2.x1), toPy(p2.x2));
        ctx.stroke();
    });

    // 5. Dibujar Línea de la Función Objetivo Óptima (Z)
    const opt = state.solution.optimal;
    if (opt && (state.model.c1 !== 0 || state.model.c2 !== 0)) {
        ctx.strokeStyle = '#9d4edi'; // Magenta brillante
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]); // Línea punteada

        const targetZ = state.solution.bestZ;
        let p1 = null, p2 = null;

        if (state.model.c2 !== 0) {
            p1 = { x1: 0, x2: targetZ / state.model.c2 };
            p2 = { x1: maxX, x2: (targetZ - state.model.c1 * maxX) / state.model.c2 };
        } else {
            p1 = { x1: targetZ / state.model.c1, x2: 0 };
            p2 = { x1: targetZ / state.model.c1, x2: maxY };
        }

        ctx.beginPath();
        ctx.moveTo(toPx(p1.x1), toPy(p1.x2));
        ctx.lineTo(toPx(p2.x1), toPy(p2.x2));
        ctx.stroke();
        ctx.setLineDash([]); // Restaurar línea sólida
    }

    // 6. Dibujar Vértices y Etiquetas A, B, C...
    state.solution.vertices.forEach(v => {
        const px = toPx(v.x1);
        const py = toPy(v.x2);

        if (v.isOptimal) {
            // Anillo brillante para el punto óptimo
            ctx.fillStyle = '#9d4edi';
            ctx.beginPath();
            ctx.arc(px, py, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#53e0dc';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Etiqueta de la letra
        ctx.fillStyle = v.isOptimal ? '#53e0dc' : '#ffffff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText(`Punto ${v.letter}`, px + 8, py - 8);
    });
}
