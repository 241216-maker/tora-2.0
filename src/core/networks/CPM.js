// Esperamos a que el DOM y el HTML carguen completamente
document.addEventListener('DOMContentLoaded', () => {
    // Aquí guardaremos todas las tareas que ingrese el usuario
    let listaActividades = [];

    // Referencias a las cajas de texto y botones del HTML
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

    // --- ACCIÓN: BOTÓN DE AÑADIR ACTIVIDAD ---
    inputs.btnAñadir.addEventListener('click', () => {
        const id = inputs.id.value.trim().toUpperCase();
        const duracion = parseInt(inputs.duration.value);
        
        // Filtros básicos para evitar errores de usuario
        if (!id) return alert('Error: Ingrese un identificador válido.');
        if (isNaN(duracion) || duracion < 0) return alert('Error: La duración debe ser mayor o igual a 0.');
        if (listaActividades.some(a => a.id === id)) return alert('Error: Esta actividad ya existe.');

        // Convertimos el texto separado por comas en un arreglo limpio de predecesores
        const rawPred = inputs.predecessors.value.trim();
        const predecesores = rawPred ? rawPred.split(',').map(p => p.trim().toUpperCase()).filter(p => p !== '') : [];

        // Guardamos la información
        listaActividades.push({ id, duracion, predecesores });

        // Limpiamos cajas de texto para la siguiente tarea
        inputs.id.value = ''; inputs.duration.value = ''; inputs.predecessors.value = '';
        inputs.id.focus();
        actualizarListaLateral();
    });

    // --- RENDERIZAR LISTA LATERAL (Muestra qué hemos añadido) ---
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

            // Botón rojo para eliminar una tarea individual
            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-small btn-red btn-delete';
            delBtn.textContent = 'borrar';
            delBtn.style.marginLeft = '10px';
            delBtn.addEventListener('click', () => {
                listaActividades = listaActividades.filter(a => a.id !== act.id);
                actualizarListaLateral();
            });

            item.appendChild(delBtn);
            inputs.liveList.appendChild(item);
        });
    }

    // --- MOTOR MATEMÁTICO DEL ALGORITMO CPM ---
    function procesarCalculoCPM(actividades) {
        let nodos = actividades.map(a => ({ ...a, es: 0, ef: 0, ls: 0, lf: 0, holgura: 0, critical: false }));
        let cambios = true, iteraciones = 0; const limite = nodos.length * 3;

        // 1. Cálculo de Ida (Tiempos tempranos ES y EF)
        while (cambios) {
            cambios = false; iteraciones++;
            // Seguridad: Si alguien crea un bucle (A depende de B, B depende de A)
            if (iteraciones > limite) throw new Error("Circuito infinito. Revisa que tus predecesores no hagan un bucle cerrado.");

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

        // 2. Cálculo de Regreso (Tiempos tardíos LS y LF)
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

        // 3. Obtención de Holgura y Ruta Crítica
        let holguraAcumulada = 0;
        nodos.forEach(act => {
            act.holgura = act.lf - act.ef;
            if (Math.abs(act.holgura) < 0.0001) act.holgura = 0;
            if (act.holgura <= 0) { act.critical = true; act.holgura = 0; }
            holguraAcumulada += act.holgura;
        });

        return { nodos, tiempoTotal, holguraAcumulada };
    }

    // --- DIBUJADO GRÁFICO (D3.JS) - ZONA DE LAS SOLUCIONES VISUALES ---
    function dibujarGrafoCPM(nodosCpm) {
        const contenedor = document.getElementById('network-svg-container');
        contenedor.innerHTML = ''; 
        
        // Habilitar barra de desplazamiento si el gráfico es muy largo
        contenedor.parentElement.style.overflowX = 'auto';
        contenedor.parentElement.style.overflowY = 'hidden';

        if (typeof d3 === 'undefined') {
            contenedor.innerHTML = '<p style="color:red;">Error al cargar D3.js</p>';
            return;
        }

        const widthOriginal = contenedor.clientWidth || 800;
        const height = 500;

        // 1. Identificamos en qué etapa/nivel va cada actividad basándonos en su tiempo de inicio (ES)
        const tiemposUnicos = [...new Set(nodosCpm.map(n => n.es))].sort((a, b) => a - b);
        const pasosTotales = tiemposUnicos.length;
        
        // SOLUCIÓN A LOS NODOS JUNTOS: 
        // Obligamos a que exista una separación fija de 180 píxeles horizontales entre cada paso.
        const espaciadoHorizontal = 180; 
        const anchoNecesario = 160 + (pasosTotales - 1) * espaciadoHorizontal;
        
        // El SVG ahora crecerá lo que sea necesario para que no se aprieten las bolitas
        const widthFinal = Math.max(widthOriginal, anchoNecesario);

        const svg = d3.select('#network-svg-container').append('svg')
            .attr('width', widthFinal).attr('height', height);

        const conteoPorTiempo = {};
        const datasetNodos = nodosCpm.map(n => {
            conteoPorTiempo[n.es] = (conteoPorTiempo[n.es] || 0) + 1;
            return { ...n, indexEnLvl: conteoPorTiempo[n.es] };
        });

        datasetNodos.forEach(n => {
            const pasoActual = tiemposUnicos.indexOf(n.es);
            // Aplicamos los 180px de separación de forma matemática a la coordenada X
            n.x = pasosTotales <= 1 ? widthFinal / 2 : 80 + (pasoActual * espaciadoHorizontal);
            
            // Separación vertical estricta de 120px para que tampoco se empalmen hacia arriba o abajo
            const totalEnTiempo = conteoPorTiempo[n.es];
            const espaciadoVertical = 120; 
            n.y = (height / 2) + (n.indexEnLvl - (totalEnTiempo + 1) / 2) * espaciadoVertical;
        });

        let datasetEnlaces = [];
        datasetNodos.forEach(u => {
            datasetNodos.forEach(v => {
                if (v.predecesores.includes(u.id)) {
                    datasetEnlaces.push({ source: u, target: v, isCritical: u.critical && v.critical });
                }
            });
        });

        // SOLUCIÓN A LAS FLECHAS GIGANTES:
        // Añadimos markerUnits = 'userSpaceOnUse'. Esto evita que la flecha crezca sin control 
        // a causa del grosor de la línea, congelando su tamaño en píxeles absolutos.
        svg.append('defs').append('marker').attr('id', 'arrow-normal')
            .attr('markerUnits', 'userSpaceOnUse')
            .attr('viewBox', '0 -5 10 10').attr('refX', 32).attr('refY', 0)
            .attr('markerWidth', 12).attr('markerHeight', 12).attr('orient', 'auto')
            .append('path').attr('d', 'M0,-4L10,0L0,4').attr('fill', '#bd5bf7');

        svg.append('defs').append('marker').attr('id', 'arrow-critical')
            .attr('markerUnits', 'userSpaceOnUse')
            .attr('viewBox', '0 -5 10 10').attr('refX', 32).attr('refY', 0)
            .attr('markerWidth', 15).attr('markerHeight', 15).attr('orient', 'auto')
            .append('path').attr('d', 'M0,-4L10,0L0,4').attr('fill', '#00f0ff');

        // Dibujo de las líneas y flechas separadoras
        svg.selectAll('.link').data(datasetEnlaces).enter().append('line')
            .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
            .attr('stroke', d => d.isCritical ? '#00f0ff' : '#bd5bf7')
            .attr('stroke-width', d => d.isCritical ? 4.5 : 2.5) 
            .attr('marker-end', d => d.isCritical ? 'url(#arrow-critical)' : 'url(#arrow-normal)')
            .style('filter', d => d.isCritical ? 'drop-shadow(0px 0px 6px rgba(0,240,255,0.7))' : 'drop-shadow(0px 0px 4px rgba(189,91,247,0.5))');

        // Dibujo del nodo central (bolita oscura de radio 22)
        const gruposNodos = svg.selectAll('.node').data(datasetNodos).enter().append('g')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        gruposNodos.append('circle').attr('r', 22).attr('fill', '#12111c')
            .attr('stroke', d => d.critical ? '#00f0ff' : '#bd5bf7').attr('stroke-width', d => d.critical ? 3 : 2)
            .style('filter', d => d.critical ? 'drop-shadow(0px 0px 8px rgba(0,240,255,0.5))' : 'drop-shadow(0px 0px 5px rgba(189,91,247,0.4))');

        // Textos dentro y fuera del nodo
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

    // --- ACCIÓN: BOTÓN CALCULAR ---
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