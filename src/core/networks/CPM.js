document.addEventListener('DOMContentLoaded', () => {
            let listaActividades = [];

            const inputs = {
                id: document.getElementById('activity-id'),
                duration: document.getElementById('activity-duration'),
                predecessors: document.getElementById('activity-predecessors'),
                btnAñadir: document.getElementById('btn-add-activity'),
                btnCalcular: document.getElementById('btn-calculate-cpm'),
                liveList: document.getElementById('activities-live-list'),
                resultsPanel: document.getElementById('results-panel'),
                criticalOutput: document.getElementById('critical-path-output'),
                metricDuration: document.getElementById('metric-total-duration'),
                metricSlack: document.getElementById('metric-total-slack')
            };

            inputs.btnAñadir.addEventListener('click', () => {
                const id = inputs.id.value.trim().toUpperCase();
                const duracion = parseInt(inputs.duration.value);
                
                if (!id) return alert('Error: Ingrese un identificador válido.');
                if (isNaN(duracion) || duracion < 0) return alert('Error: La duración debe ser mayor o igual a 0.');
                if (listaActividades.some(a => a.id === id)) return alert('Error: Esta actividad ya existe.');

                const rawPred = inputs.predecessors.value.trim();
                const predecesores = rawPred ? rawPred.split(',').map(p => p.trim().toUpperCase()).filter(p => p !== '') : [];

                listaActividades.push({ id, duracion, predecesores });

                inputs.id.value = ''; inputs.duration.value = ''; inputs.predecessors.value = '';
                inputs.id.focus();
                actualizarListaLateral();
            });

            function actualizarListaLateral() {
                if (listaActividades.length === 0) {
                    inputs.liveList.innerHTML = `<p class="empty-notice">No hay actividades.</p>`;
                    return;
                }
                inputs.liveList.innerHTML = '';
                listaActividades.forEach(act => {
                    const cadenaPred = act.predecesores.length > 0 ? act.predecesores.join(', ') : 'Ninguno';
                    const item = document.createElement('div');
                    item.className = 'activity-item activity-item-log';

                    const textSpan = document.createElement('span');
                    textSpan.innerHTML = `• <strong>[${act.id}]</strong> | Duración: ${act.duracion} | Pred: [${cadenaPred}]`;
                    item.appendChild(textSpan);

                    const delBtn = document.createElement('button');
                    delBtn.className = 'btn btn-small btn-red btn-delete';
                    delBtn.textContent = 'borrar';
                    delBtn.style.marginLeft = '10px';
                    delBtn.addEventListener('click', () => {
                        listaActividades = listaActividades.filter(a => a.id !== act.id);
                        actualizarListaLateral();
                        document.dispatchEvent(new CustomEvent('activity:removed', { detail: act.id }));
                    });

                    item.appendChild(delBtn);
                    inputs.liveList.appendChild(item);
                });
            }

            function procesarCalculoCPM(actividades) {
                let nodos = actividades.map(a => ({ ...a, es: 0, ef: 0, ls: 0, lf: 0, holgura: 0, critical: false }));
                let cambios = true, iteraciones = 0; const limite = nodos.length * 3;

                // Forward Pass
                while (cambios) {
                    cambios = false; iteraciones++;
                    if (iteraciones > limite) throw new Error("Circuito circular infinito detectado. Revisa tus predecesores.");

                    nodos.forEach(act => {
                        let maxEF = 0;
                        if (act.predecesores.length > 0) {
                            const validos = nodos.filter(p => act.predecesores.includes(p.id));
                            if (validos.length > 0) maxEF = Math.max(...validos.map(p => p.ef));
                        }
                        if (act.es !== maxEF) { act.es = maxEF; cambios = true; }
                        
                        const nuevoEF = act.es + act.duracion;
                        if (act.ef !== nuevoEF) { act.ef = nuevoEF; cambios = true; }
                    });
                }

                const tiempoTotal = nodos.length > 0 ? Math.max(...nodos.map(a => a.ef)) : 0;

                // Backward Pass
                nodos.forEach(act => { act.lf = tiempoTotal; act.ls = tiempoTotal - act.duracion; });

                cambios = true; iteraciones = 0;
                while (cambios) {
                    cambios = false; iteraciones++;
                    if (iteraciones > limite) break;

                    nodos.forEach(act => {
                        const sucesores = nodos.filter(s => s.predecesores.includes(act.id));
                        let minLS = tiempoTotal;
                        if (sucesores.length > 0) minLS = Math.min(...sucesores.map(s => s.ls));
                        
                        if (act.lf !== minLS) { act.lf = minLS; cambios = true; }
                        const nuevoLS = act.lf - act.duracion;
                        if (act.ls !== nuevoLS) { act.ls = nuevoLS; cambios = true; }
                    });
                }

                let holguraAcumulada = 0;
                nodos.forEach(act => {
                    act.holgura = act.lf - act.ef;
                    if (Math.abs(act.holgura) < 0.0001) act.holgura = 0;
                    if (act.holgura <= 0) { act.critical = true; act.holgura = 0; }
                    holguraAcumulada += act.holgura;
                });

                return { nodos, tiempoTotal, holguraAcumulada };
            }

            function dibujarGrafoCPM(nodosCpm) {
                const contenedor = document.getElementById('network-svg-container');
                contenedor.innerHTML = ''; 

                if (typeof d3 === 'undefined') {
                    contenedor.innerHTML = '<p style="color:red; text-align:center; padding:20px;">No se pudo cargar la librería gráfica (D3.js). Verifica tu conexión a internet.</p>';
                    return;
                }

                const width = contenedor.clientWidth || 700;
                const height = 500;

                const svg = d3.select('#network-svg-container').append('svg')
                    .attr('width', '100%').attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

                const maxES = Math.max(...nodosCpm.map(n => n.es), 1);
                const conteoPorTiempo = {};
                
                const datasetNodos = nodosCpm.map(n => {
                    conteoPorTiempo[n.es] = (conteoPorTiempo[n.es] || 0) + 1;
                    return { ...n, indexEnLvl: conteoPorTiempo[n.es] };
                });

                datasetNodos.forEach(n => {
                    n.x = 75 + (n.es * (width - 150) / maxES);
                    if (Math.max(...nodosCpm.map(n => n.es)) === 0) n.x = width / 2;
                    const totalEnTiempo = conteoPorTiempo[n.es];
                    n.y = (height / 2) + (n.indexEnLvl - (totalEnTiempo + 1) / 2) * (height / (Math.max(...Object.values(conteoPorTiempo)) + 0.8));
                });

                let datasetEnlaces = [];
                datasetNodos.forEach(u => {
                    datasetNodos.forEach(v => {
                        if (v.predecesores.includes(u.id)) {
                            // Esta línea conecta las bolitas y decide si es crítica o morada
                            datasetEnlaces.push({ source: u, target: v, isCritical: u.critical && v.critical });
                        }
                    });
                });

                // Flechas moradas (normales) mejoradas y más grandes
                svg.append('defs').append('marker').attr('id', 'arrow-normal')
                    .attr('viewBox', '0 -5 10 10').attr('refX', 22).attr('refY', 0)
                    .attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto')
                    .append('path').attr('d', 'M0,-4L10,0L0,4').attr('fill', '#bd5bf7');

                // Flechas azules (críticas)
                svg.append('defs').append('marker').attr('id', 'arrow-critical')
                    .attr('viewBox', '0 -5 10 10').attr('refX', 22).attr('refY', 0)
                    .attr('markerWidth', 9).attr('markerHeight', 9).attr('orient', 'auto')
                    .append('path').attr('d', 'M0,-4L10,0L0,4').attr('fill', '#00f0ff');

                // Dibujar las líneas conectores (ahora más gruesas)
                svg.selectAll('.link').data(datasetEnlaces).enter().append('line')
                    .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
                    .attr('stroke', d => d.isCritical ? '#00f0ff' : '#bd5bf7')
                    .attr('stroke-width', d => d.isCritical ? 4.5 : 2.5) // Morado más grueso
                    .attr('marker-end', d => d.isCritical ? 'url(#arrow-critical)' : 'url(#arrow-normal)')
                    .style('filter', d => d.isCritical ? 'drop-shadow(0px 0px 6px rgba(0,240,255,0.7))' : 'drop-shadow(0px 0px 4px rgba(189,91,247,0.5))');

                const gruposNodos = svg.selectAll('.node').data(datasetNodos).enter().append('g')
                    .attr('transform', d => `translate(${d.x},${d.y})`);

                gruposNodos.append('circle').attr('r', 22).attr('fill', '#12111c')
                    .attr('stroke', d => d.critical ? '#00f0ff' : '#bd5bf7').attr('stroke-width', d => d.critical ? 3 : 2)
                    .style('filter', d => d.critical ? 'drop-shadow(0px 0px 8px rgba(0,240,255,0.5))' : 'drop-shadow(0px 0px 5px rgba(189,91,247,0.4))');

                gruposNodos.append('text').attr('text-anchor', 'middle').attr('dy', -3)
                    .attr('fill', '#ffffff').attr('font-weight', '700').attr('font-size', '11px').text(d => d.id);
                
                gruposNodos.append('text').attr('text-anchor', 'middle').attr('dy', 9)
                    .attr('fill', d => d.critical ? '#00f0ff' : '#8b8a9f').attr('font-size', '9px').text(d => `${d.duracion}d`);

                gruposNodos.append('text').attr('x', -26).attr('y', -14).attr('text-anchor', 'end').attr('fill', '#8b8a9f').attr('font-size', '9px').text(d => `ES:${d.es}`);
                gruposNodos.append('text').attr('x', 26).attr('y', -14).attr('text-anchor', 'start').attr('fill', '#8b8a9f').attr('font-size', '9px').text(d => `EF:${d.ef}`);
                gruposNodos.append('text').attr('x', -26).attr('y', 16).attr('text-anchor', 'end').attr('fill', '#bc66ff').attr('font-size', '9px').text(d => `LS:${d.ls}`);
                gruposNodos.append('text').attr('x', 26).attr('y', 16).attr('text-anchor', 'start').attr('fill', '#bc66ff').attr('font-size', '9px').text(d => `LF:${d.lf}`);
                gruposNodos.append('text').attr('text-anchor', 'middle').attr('y', -26).attr('fill', d => d.critical ? '#00f0ff' : '#e0a8ff').attr('font-size', '9px').attr('font-weight', '600').text(d => `H:${d.holgura}`);
            }

            inputs.btnCalcular.addEventListener('click', () => {
                if (listaActividades.length === 0) return alert('Error: No hay actividades registradas.');
                try {
                    const { nodos, tiempoTotal, holguraAcumulada } = procesarCalculoCPM(listaActividades);
                    const secuenciaCritica = nodos.filter(n => n.critical).map(n => n.id).join(' ➔ ');

                    inputs.criticalOutput.innerHTML = `<p style="color: #00f0ff; font-weight: 700; margin: 0; font-size:1.15rem;">${secuenciaCritica || 'Ninguna'}</p>`;
                    inputs.metricDuration.textContent = `${tiempoTotal} días`;
                    inputs.metricSlack.textContent = `${holguraAcumulada} días`;

                    dibujarGrafoCPM(nodos);
                    inputs.resultsPanel.style.display = 'block';
                    inputs.resultsPanel.scrollIntoView({ behavior: 'smooth' });
                } catch (error) {
                    alert(error.message);
                }
            });
        });