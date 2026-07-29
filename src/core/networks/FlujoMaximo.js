document.addEventListener('DOMContentLoaded', () => {
    let arcos = []; 
    let conjuntoNodos = new Set();
    
    let historialPasos = [];
    let indicePaso = 0;
    
    const inputOrigen = document.getElementById('edge-source');
    const inputDestino = document.getElementById('edge-target');
    const inputCapIJ = document.getElementById('cap-ij');
    const inputCapJI = document.getElementById('cap-ji');
    
    const inputFuente = document.getElementById('source-node');
    const inputSumidero = document.getElementById('sink-node');
    
    const btnAdd = document.getElementById('btn-add-edge');
    const btnCalculate = document.getElementById('btn-calculate');
    const btnReset = document.getElementById('btn-reset');
    
    const btnPrev = document.getElementById('btn-prev-step');
    const btnNext = document.getElementById('btn-next-step');
    
    const liveList = document.getElementById('edges-live-list');
    const statusBox = document.getElementById('iteration-status');
    const controlsIter = document.getElementById('iteration-controls');
    const resultsPanel = document.getElementById('results-panel');
    const flowRoutesOutput = document.getElementById('flow-routes-output');
    const metricMaxFlow = document.getElementById('metric-max-flow');
    const flowTableWrapper = document.getElementById('flow-table-wrapper');

    // --- 1. AÑADIR ARCO ---
    btnAdd.addEventListener('click', () => {
        const u = inputOrigen.value.trim().toUpperCase();
        const v = inputDestino.value.trim().toUpperCase();
        const c_ij = parseFloat(inputCapIJ.value) || 0;
        const c_ji = parseFloat(inputCapJI.value) || 0;

        if (!u || !v || u === v) {
            return alert('Ingrese nombres válidos y distintos para los nodos.');
        }
        if (c_ij === 0 && c_ji === 0) {
            return alert('Al menos una capacidad (C_ij o C_ji) debe ser mayor a 0.');
        }

        const existente = arcos.find(a => (a.u === u && a.v === v) || (a.u === v && a.v === u));
        if (existente) {
            return alert('Ya existe una conexión entre estos dos nodos.');
        }

        arcos.push({ u, v, C_ij: c_ij, C_ji: c_ji });
        conjuntoNodos.add(u);
        conjuntoNodos.add(v);

        inputOrigen.value = '';
        inputDestino.value = '';
        inputCapIJ.value = '5';
        inputCapJI.value = '0';
        inputOrigen.focus();

        actualizarListaArcos();
        dibujarGrafo();
    });

    function actualizarListaArcos() {
        if (arcos.length === 0) {
            liveList.innerHTML = '<p class="empty-notice">No hay conexiones en la red.</p>';
            return;
        }

        liveList.innerHTML = '';
        arcos.forEach((arco, idx) => {
            const div = document.createElement('div');
            div.className = 'edge-item-log';
            div.innerHTML = `<span><strong>${arco.u} &leftrightarrow; ${arco.v}</strong> : (${arco.C_ij}, ${arco.C_ji})</span>`;

            const btnBorrar = document.createElement('button');
            btnBorrar.className = 'btn-small-danger';
            btnBorrar.textContent = '✕';
            btnBorrar.onclick = () => {
                arcos.splice(idx, 1);
                recalcularNodos();
                actualizarListaArcos();
                dibujarGrafo();
            };

            div.appendChild(btnBorrar);
            liveList.appendChild(div);
        });
    }

    function recalcularNodos() {
        conjuntoNodos.clear();
        arcos.forEach(a => {
            conjuntoNodos.add(a.u);
            conjuntoNodos.add(a.v);
        });
    }

    btnReset.addEventListener('click', () => {
        arcos = [];
        conjuntoNodos.clear();
        historialPasos = [];
        indicePaso = 0;
        controlsIter.style.display = 'none';
        resultsPanel.style.display = 'none';
        btnCalculate.style.display = 'block';
        statusBox.innerHTML = 'Red limpiada. Ingrese nuevos datos.';
        actualizarListaArcos();
        dibujarGrafo();
    });

    // --- 2. ALGORITMO DE ETIQUETADO DE TAHA ---
    function ejecutarAlgoritmoEtiquetado(fuente, sumidero) {
        if (!conjuntoNodos.has(fuente) || !conjuntoNodos.has(sumidero)) {
            throw new Error('Los nodos Fuente o Sumidero especificados no existen en la red.');
        }
        if (fuente === sumidero) {
            throw new Error('El nodo Fuente y Sumidero deben ser diferentes.');
        }

        let pasos = [];
        
        let c = {};
        conjuntoNodos.forEach(n1 => {
            c[n1] = {};
            conjuntoNodos.forEach(n2 => { c[n1][n2] = 0; });
        });

        arcos.forEach(a => {
            c[a.u][a.v] = a.C_ij;
            c[a.v][a.u] = a.C_ji;
        });

        let rutasDeAvance = [];
        let flujoTotal = 0;
        let numeroRuta = 1;

        while (true) {
            let etiquetas = {};
            // Usamos '∞' como string para evitar errores al convertir a JSON
            etiquetas[fuente] = { a: '∞', i: '-' };
            let nodoActual = fuente;

            pasos.push({
                tipo: 'INICIO_RUTA',
                etiquetas: JSON.parse(JSON.stringify(etiquetas)),
                residuos: JSON.parse(JSON.stringify(c)),
                nodoActual,
                mensaje: `<strong>Paso 1:</strong> Nodo fuente <strong>${fuente}</strong> etiquetado con <strong>[&infin;, -]</strong>. Inicia búsqueda de Ruta ${numeroRuta}.`
            });

            let rutaEncontrada = false;
            let nodosRemovidos = {};

            while (true) {
                let S_i = [];
                conjuntoNodos.forEach(j => {
                    if (!etiquetas[j] && c[nodoActual][j] > 0) {
                        if (!nodosRemovidos[nodoActual] || !nodosRemovidos[nodoActual].has(j)) {
                            S_i.push(j);
                        }
                    }
                });

                if (S_i.length > 0) {
                    let k = S_i[0];
                    let maxCap = c[nodoActual][k];

                    S_i.forEach(j => {
                        if (c[nodoActual][j] > maxCap) {
                            maxCap = c[nodoActual][j];
                            k = j;
                        }
                    });

                    let capAnterior = etiquetas[nodoActual].a === '∞' ? Infinity : etiquetas[nodoActual].a;
                    let a_k = Math.min(capAnterior, maxCap);
                    etiquetas[k] = { a: a_k, i: nodoActual };

                    pasos.push({
                        tipo: 'ETIQUETADO',
                        etiquetas: JSON.parse(JSON.stringify(etiquetas)),
                        residuos: JSON.parse(JSON.stringify(c)),
                        nodoActual: k,
                        mensaje: `<strong>Paso 3:</strong> Desde nodo <strong>${nodoActual}</strong> se selecciona nodo <strong>${k}</strong> con residuo c_${nodoActual}${k} = ${maxCap}. Se asigna etiqueta <strong>[${a_k}, ${nodoActual}]</strong>.`
                    });

                    if (k === sumidero) {
                        rutaEncontrada = true;
                        break;
                    }

                    nodoActual = k;
                } else {
                    if (nodoActual === fuente) {
                        pasos.push({
                            tipo: 'FIN',
                            etiquetas: JSON.parse(JSON.stringify(etiquetas)),
                            residuos: JSON.parse(JSON.stringify(c)),
                            nodoActual: fuente,
                            mensaje: `<strong>Paso 6 (Solución):</strong> No hay más rutas de avance desde la fuente. El algoritmo ha finalizado.`
                        });
                        break;
                    } else {
                        let r = etiquetas[nodoActual].i;
                        if (!nodosRemovidos[r]) nodosRemovidos[r] = new Set();
                        nodosRemovidos[r].add(nodoActual);

                        delete etiquetas[nodoActual];

                        pasos.push({
                            tipo: 'RETROCESO',
                            etiquetas: JSON.parse(JSON.stringify(etiquetas)),
                            residuos: JSON.parse(JSON.stringify(c)),
                            nodoActual: r,
                            mensaje: `<strong>Paso 4 (Retroceso):</strong> Vía muerta en nodo <strong>${nodoActual}</strong>. Se retrocede al nodo <strong>${r}</strong>.`
                        });

                        nodoActual = r;
                    }
                }
            }

            if (!rutaEncontrada) break;

            let caminoInverso = [];
            let curr = sumidero;
            while (curr !== '-') {
                caminoInverso.push(curr);
                curr = etiquetas[curr].i;
            }
            let rutaAvance = caminoInverso.reverse();
            let f_p = etiquetas[sumidero].a;

            flujoTotal += f_p;
            rutasDeAvance.push({ ruta: rutaAvance, flujo: f_p });

            for (let idx = 0; idx < rutaAvance.length - 1; idx++) {
                let u_p = rutaAvance[idx];
                let v_p = rutaAvance[idx + 1];

                c[u_p][v_p] -= f_p;
                c[v_p][u_p] += f_p;
            }

            pasos.push({
                tipo: 'ACTUALIZACION_RESIDUOS',
                etiquetas: JSON.parse(JSON.stringify(etiquetas)),
                residuos: JSON.parse(JSON.stringify(c)),
                rutaDestacada: rutaAvance,
                flujoRuta: f_p,
                mensaje: `<strong>Paso 5 (Actualización):</strong> Ruta ${numeroRuta} encontrada: <strong>${rutaAvance.join(' &rarr; ')}</strong> con flujo f_${numeroRuta} = ${f_p}. Capacidades residuales actualizadas.`
            });

            numeroRuta++;
        }

        return { pasos, flujoTotal, rutasDeAvance, residuosFinales: c };
    }

    // --- 3. GENERAR TABLA TIPO TAHA DE FLUJOS EN ARCOS ---
    function generarTablaFlujosFinales(residuosFinales) {
        let html = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Arco (i, j)</th>
                    <th>(C_ij, C_ji) - (c_ij, c_ji)</th>
                    <th>Cantidad de Flujo</th>
                    <th>Dirección</th>
                </tr>
            </thead>
            <tbody>`;

        arcos.forEach(arco => {
            const u = arco.u;
            const v = arco.v;
            const C_ij = arco.C_ij;
            const C_ji = arco.C_ji;

            const c_ij = residuosFinales[u][v];
            const c_ji = residuosFinales[v][u];

            const delta_ij = C_ij - c_ij;
            const delta_ji = C_ji - c_ji;

            let cantidad = 0;
            let direccionHTML = '<span class="badge-none">&mdash;</span>';

            if (delta_ij > 0) {
                cantidad = delta_ij;
                direccionHTML = `<span class="badge-direction">${u} &rarr; ${v}</span>`;
            } else if (delta_ji > 0) {
                cantidad = delta_ji;
                direccionHTML = `<span class="badge-direction">${v} &rarr; ${u}</span>`;
            }

            html += `
                <tr>
                    <td><strong>(${u}, ${v})</strong></td>
                    <td>(${C_ij}, ${C_ji}) &minus; (${c_ij}, ${c_ji}) = (${delta_ij}, ${delta_ji})</td>
                    <td><strong>${cantidad}</strong></td>
                    <td>${direccionHTML}</td>
                </tr>`;
        });

        html += `</tbody></table>`;
        return html;
    }

    // --- 4. RENDERIZADO D3.JS DEL GRAFO ---
    function dibujarGrafo(pasoActual = null) {
        const container = document.getElementById('network-svg-container');
        container.innerHTML = '';
        if (conjuntoNodos.size === 0) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        const svg = d3.select('#network-svg-container').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`);

        const nodesData = Array.from(conjuntoNodos).map(id => ({ id }));
        const linksData = arcos.map(a => ({ source: a.u, target: a.v, C_ij: a.C_ij, C_ji: a.C_ji }));

        const simulation = d3.forceSimulation(nodesData)
            .force('link', d3.forceLink(linksData).id(d => d.id).distance(220))
            .force('charge', d3.forceManyBody().strength(-3000))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .stop();

        for (let i = 0; i < 300; ++i) simulation.tick();

        const padding = 50;
        nodesData.forEach(d => {
            d.x = Math.max(padding, Math.min(width - padding, d.x));
            d.y = Math.max(padding, Math.min(height - padding, d.y));
        });

        const lines = svg.selectAll('.link').data(linksData).enter().append('line')
            .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
            .attr('stroke', '#222035')
            .attr('stroke-width', 3);

        if (pasoActual && pasoActual.rutaDestacada) {
            const ruta = pasoActual.rutaDestacada;
            for (let i = 0; i < ruta.length - 1; i++) {
                const u = ruta[i], v = ruta[i + 1];
                lines.filter(d => (d.source.id === u && d.target.id === v) || (d.source.id === v && d.target.id === u))
                    .attr('stroke', '#bd5bf7')
                    .attr('stroke-width', 5)
                    .style('filter', 'drop-shadow(0px 0px 8px rgba(189,91,247,0.8))');
            }
        }

        svg.selectAll('.link-text').data(linksData).enter().append('text')
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2 - 8)
            .attr('text-anchor', 'middle')
            .attr('fill', '#00f0ff')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(d => {
                if (pasoActual && pasoActual.residuos) {
                    const c_ij = pasoActual.residuos[d.source.id][d.target.id];
                    const c_ji = pasoActual.residuos[d.target.id][d.source.id];
                    return `(${c_ij}, ${c_ji})`;
                }
                return `(${d.C_ij}, ${d.C_ji})`;
            });

        const nodes = svg.selectAll('.node').data(nodesData).enter().append('g')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        nodes.append('circle')
            .attr('r', 24)
            .attr('fill', d => {
                const fuente = inputFuente.value.trim().toUpperCase();
                const sumidero = inputSumidero.value.trim().toUpperCase();
                if (d.id === fuente || d.id === sumidero) return '#00f0ff';
                if (pasoActual && pasoActual.etiquetas && pasoActual.etiquetas[d.id]) return '#bd5bf7';
                return '#12111c';
            })
            .attr('stroke', d => (pasoActual && pasoActual.nodoActual === d.id) ? '#ffffff' : '#3f3d56')
            .attr('stroke-width', d => (pasoActual && pasoActual.nodoActual === d.id) ? 4 : 2);

        nodes.append('text')
            .text(d => d.id)
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('fill', d => {
                const fuente = inputFuente.value.trim().toUpperCase();
                const sumidero = inputSumidero.value.trim().toUpperCase();
                return (d.id === fuente || d.id === sumidero) ? '#000000' : '#ffffff';
            })
            .attr('font-weight', 'bold');

        // Renderizado limpio de la etiqueta [a_j, i]
        nodes.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', -32)
            .attr('fill', '#e2b3ff')
            .attr('font-size', '13px')
            .attr('font-weight', 'bold')
            .text(d => {
                if (pasoActual && pasoActual.etiquetas && pasoActual.etiquetas[d.id]) {
                    const tag = pasoActual.etiquetas[d.id];
                    const aVal = (tag.a === null || tag.a === Infinity || tag.a === '∞') ? '∞' : tag.a;
                    return `[${aVal}, ${tag.i}]`;
                }
                return '';
            });
    }

    // --- 5. CONTROL DE PASOS Y EJECUCIÓN ---
    let ultimosResiduosFinales = null;

    btnCalculate.addEventListener('click', () => {
        const fuente = inputFuente.value.trim().toUpperCase();
        const sumidero = inputSumidero.value.trim().toUpperCase();

        try {
            const resultado = ejecutarAlgoritmoEtiquetado(fuente, sumidero);
            historialPasos = resultado.pasos;
            indicePaso = 0;
            ultimosResiduosFinales = resultado.residuosFinales;

            btnCalculate.style.display = 'none';
            controlsIter.style.display = 'flex';
            resultsPanel.style.display = 'none';

            let textoRutas = resultado.rutasDeAvance.map((r, i) => 
                `<p><strong>Ruta N_${i + 1}:</strong> ${r.ruta.join(' &rarr; ')} | Flujo f_${i + 1} = <strong>${r.flujo}</strong></p>`
            ).join('');

            flowRoutesOutput.innerHTML = textoRutas || '<p>No se encontraron rutas con flujo positivo.</p>';
            metricMaxFlow.textContent = resultado.flujoTotal;

            // Generar la tabla final tipo Taha
            flowTableWrapper.innerHTML = generarTablaFlujosFinales(resultado.residuosFinales);

            actualizarEstadoPaso();
        } catch (err) {
            alert(err.message);
        }
    });

    function actualizarEstadoPaso() {
        const paso = historialPasos[indicePaso];
        statusBox.innerHTML = paso.mensaje;
        btnPrev.disabled = indicePaso === 0;

        if (indicePaso === historialPasos.length - 1) {
            btnNext.textContent = 'Ver Tabla y Resumen Final';
        } else {
            btnNext.textContent = 'Siguiente Paso →';
        }

        dibujarGrafo(paso);
    }

    btnNext.addEventListener('click', () => {
        if (indicePaso < historialPasos.length - 1) {
            indicePaso++;
            actualizarEstadoPaso();
        } else {
            controlsIter.style.display = 'none';
            btnCalculate.style.display = 'block';
            btnCalculate.textContent = 'Reiniciar Algoritmo';
            resultsPanel.style.display = 'flex';
            resultsPanel.scrollIntoView({ behavior: 'smooth' });
        }
    });

    btnPrev.addEventListener('click', () => {
        if (indicePaso > 0) {
            indicePaso--;
            actualizarEstadoPaso();
        }
    });

    dibujarGrafo();
});