document.addEventListener('DOMContentLoaded', () => {
    
    // Almacenamiento local de las conexiones (aristas) ingresadas por el usuario
    let listaAristas = [];

    // Referencias a los elementos de la interfaz de usuario
    const inputs = {
        source: document.getElementById('edge-source'),
        target: document.getElementById('edge-target'),
        capacityForward: document.getElementById('edge-capacity-forward'),
        capacityReverse: document.getElementById('edge-capacity-reverse'),
        btnAñadir: document.getElementById('btn-add-edge'),
        btnBorrar: document.getElementById('btn-clear-network'),
        netSource: document.getElementById('network-source'),
        netSink: document.getElementById('network-sink'),
        btnCalcular: document.getElementById('btn-calculate-flow'),
        liveList: document.getElementById('edges-live-list'),
        resultsPanel: document.getElementById('results-panel'),
        flowOutput: document.getElementById('max-flow-output'),
        metricEfficiency: document.getElementById('metric-efficiency')
    };

    // Escuchador del botón para capturar aristas individuales
    inputs.btnAñadir.addEventListener('click', () => {
        const u = inputs.source.value.trim().toUpperCase();
        const v = inputs.target.value.trim().toUpperCase();
        const capForward = parseInt(inputs.capacityForward.value);
        const capReverse = parseInt(inputs.capacityReverse.value);

        // Validaciones del módulo de seguridad interna
        if (!u || !v) return alert('Error: Ingrese identificadores válidos.');
        if (u === v) return alert('Error: El origen y el destino no pueden ser el mismo nodo.');
        if ((isNaN(capForward) || capForward < 0) || (isNaN(capReverse) || capReverse < 0)) {
            return alert('Error: Las capacidades deben ser enteros no negativos.');
        }
        if (capForward === 0 && capReverse === 0) {
            return alert('Error: Ingrese al menos una capacidad positiva entre los dos sentidos.');
        }

        const tieneIda = !Number.isNaN(capForward) && capForward > 0;
        const tieneVuelta = !Number.isNaN(capReverse) && capReverse > 0;

        if (tieneIda && listaAristas.some(e => e.source === u && e.target === v)) {
            return alert('Error: Esta conexión i → j ya ha sido registrada.');
        }
        if (tieneVuelta && listaAristas.some(e => e.source === v && e.target === u)) {
            return alert('Error: Esta conexión j → i ya ha sido registrada.');
        }

        // Estructuración del objeto arista en el set de datos
        if (tieneIda) {
            listaAristas.push({ source: u, target: v, capacity: capForward, flow: 0 });
        }
        if (tieneVuelta) {
            listaAristas.push({ source: v, target: u, capacity: capReverse, flow: 0 });
        }

        // Reseteo visual del formulario
        inputs.source.value = '';
        inputs.target.value = '';
        inputs.capacityForward.value = '';
        inputs.capacityReverse.value = '';
        inputs.source.focus();

        actualizarBitacoraLateral();
    });

    // Actualiza la lista lateral de control
    function actualizarBitacoraLateral() {
        if (listaAristas.length === 0) {
            inputs.liveList.innerHTML = `<p class="empty-notice">No hay conexiones en la red. Añade aristas arriba.</p>`;
            return;
        }

        inputs.liveList.innerHTML = '';
        listaAristas.forEach((e, index) => {
            const item = document.createElement('div');
            item.className = 'edge-item-log';

            const text = document.createElement('div');
            text.className = 'edge-text';
            text.innerHTML = `• Arista: <strong>${e.source}</strong> ➔ <strong>${e.target}</strong> | Capacidad: <strong>${e.capacity}</strong>`;

            const btnDelete = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.className = 'edge-delete-btn';
            btnDelete.textContent = 'Borrar';
            btnDelete.dataset.index = index;

            item.appendChild(text);
            item.appendChild(btnDelete);
            inputs.liveList.appendChild(item);
        });
    }

    inputs.liveList.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !target.classList.contains('edge-delete-btn')) return;

        const index = Number(target.dataset.index);
        if (Number.isNaN(index)) return;

        listaAristas.splice(index, 1);
        actualizarBitacoraLateral();

        if (listaAristas.length === 0) {
            document.getElementById('network-svg-container').innerHTML = '';
            inputs.resultsPanel.style.display = 'none';
        }
    });

    inputs.btnBorrar.addEventListener('click', () => {
        listaAristas = [];
        inputs.source.value = '';
        inputs.target.value = '';
        inputs.capacityForward.value = '';
        inputs.capacityReverse.value = '';
        inputs.netSource.value = '';
        inputs.netSink.value = '';
        inputs.resultsPanel.style.display = 'none';
        document.getElementById('network-svg-container').innerHTML = '';
        actualizarBitacoraLateral();
    });

    // =========================================================================
    // ALGORITMO LÓGICO DE EDMONDS-KARP (FORD-FULKERSON POR BFS)
    // =========================================================================
    function calcularFlujoMaximoEK(aristasEntrada, fuenteS, sumideroT) {
        let nodosSet = new Set();
        aristasEntrada.forEach(e => { nodosSet.add(e.source); nodosSet.add(e.target); });
        let listaNodos = Array.from(nodosSet);

        if (!nodosSet.has(fuenteS) || !nodosSet.has(sumideroT)) {
            throw new Error("La fuente (S) o el sumidero (T) no se encuentran mapeados en la red.");
        }

        // Matrices de capacidades (C) y flujos reales (F)
        let C = {}, F = {};
        listaNodos.forEach(u => {
            C[u] = {}; F[u] = {};
            listaNodos.forEach(v => { C[u][v] = 0; F[u][v] = 0; });
        });

        aristasEntrada.forEach(e => { C[e.source][e.target] = e.capacity; });

        let flujoMaximo = 0;

        // Búsqueda en Anchura (BFS) para hallar el camino aumentante más corto
        function bfs(parentMap) {
            let visited = {};
            listaNodos.forEach(n => visited[n] = false);

            let queue = [];
            queue.push(fuenteS);
            visited[fuenteS] = true;

            while (queue.length > 0) {
                let u = queue.shift();

                for (let v of listaNodos) {
                    // Condición residual estándar: si hay capacidad disponible y el nodo no se visitó
                    if (!visited[v] && (C[u][v] - F[u][v] > 0)) {
                        queue.push(v);
                        parentMap[v] = u;
                        visited[v] = true;
                        if (v === sumideroT) return true;
                    }
                }
            }
            return false;
        }

        let parent = {};

        // Ciclo principal aumentativo del flujo
        while (bfs(parent)) {
            let flujoCamino = Infinity;
            let curr = sumideroT;

            // Fase 1: Encontrar el cuello de botella de la ruta encontrada
            while (curr !== fuenteS) {
                let prev = parent[curr];
                flujoCamino = Math.min(flujoCamino, C[prev][curr] - F[prev][curr]);
                curr = prev;
            }

            // Fase 2: Aplicar las variaciones a los flujos directos e inversos
            curr = sumideroT;
            while (curr !== fuenteS) {
                let prev = parent[curr];
                F[prev][curr] += flujoCamino; // Aumento del flujo real
                F[curr][prev] -= flujoCamino; // Ajuste del canal residual inverso
                curr = prev;
            }

            flujoMaximo += flujoCamino;
            parent = {};
        }

        // Consolidación final del mapeo de aristas procesadas
        let resultadoAristas = aristasEntrada.map(e => ({
            source: e.source,
            target: e.target,
            capacity: e.capacity,
            flow: F[e.source][e.target]
        }));

        return { flujoMaximo, aristasProcesadas: resultadoAristas };
    }

    // =========================================================================
    // COMPONENTE DE RENDERIZADO GRÁFICO (D3.JS)
    // =========================================================================
    function dibujarRedFlujo(aristasCpm) {
        const contenedor = document.getElementById('network-svg-container');
        contenedor.innerHTML = '';

        const width = contenedor.clientWidth || 700;
        const height = 450;

        const svg = d3.select('#network-svg-container').append('svg')
            .attr('width', '100%').attr('height', height);

        const defs = svg.append('defs');
        
        // Creación geométrica de los marcadores (puntas de flechas de flujo)
        defs.append('marker').attr('id', 'arrow-std').attr('viewBox', '0 -5 10 10').attr('refX', 22).attr('refY', 0).attr('markerWidth', 7).attr('markerHeight', 7).attr('markerUnits', 'strokeWidth').attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#bd5bf7');
        defs.append('marker').attr('id', 'arrow-active').attr('viewBox', '0 -5 10 10').attr('refX', 22).attr('refY', 0).attr('markerWidth', 8).attr('markerHeight', 8).attr('markerUnits', 'strokeWidth').attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#00f0ff');

        let nodosSet = new Set();
        aristasCpm.forEach(e => { nodosSet.add(e.source); nodosSet.add(e.target); });
        
        let nodes = Array.from(nodosSet).map(id => ({ id }));
        let links = aristasCpm.map(e => ({
            source: nodes.find(n => n.id === e.source),
            target: nodes.find(n => n.id === e.target),
            capacity: e.capacity,
            flow: e.flow,
            hasFlow: e.flow > 0
        }));

        // Simulación de fuerzas físicas elásticas integradas
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(140))
            .force('charge', d3.forceManyBody().strength(-600))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Dibujo de las conexiones (aristas)
        const link = svg.append('g').selectAll('line').data(links).enter().append('line')
            .attr('stroke', d => d.hasFlow ? '#00f0ff' : '#bd5bf7')
            .attr('stroke-width', d => d.hasFlow ? 3.5 : 1.5)
            .attr('stroke-linecap', 'round')
            .attr('marker-end', d => d.hasFlow ? 'url(#arrow-active)' : 'url(#arrow-std)')
            .style('filter', d => d.hasFlow ? 'drop-shadow(0px 0px 4px rgba(0,240,255,0.5))' : 'none');

        // Textos descriptivos de magnitudes sobre las aristas [Flujo/Capacidad]
        const linkText = svg.append('g').selectAll('text').data(links).enter().append('text')
            .attr('font-size', '10px').attr('font-weight', '700')
            .attr('fill', d => d.flow === d.capacity && d.capacity > 0 ? '#ff4a4a' : (d.hasFlow ? '#00f0ff' : '#a19eb1'))
            .text(d => `${d.flow}/${d.capacity}`);

        // Agrupación visual e interactiva de los nodos
        const node = svg.append('g').selectAll('g').data(nodes).enter().append('g')
            .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));

        node.append('circle').attr('r', 15).attr('fill', '#12111c').attr('stroke', '#bd5bf7').attr('stroke-width', 2);
        node.append('text').attr('text-anchor', 'middle').attr('y', 4).attr('fill', '#ffffff').attr('font-weight', '700').attr('font-size', '11px').text(d => d.id);

        // Rutina cíclica de refresco espacial cinemático
        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x).attr('y2', d => d.target.y);

            linkText.attr('x', d => (d.source.x + d.target.x) / 2)
                    .attr('y', d => (d.source.y + d.target.y) / 2 - 6)
                    .attr('text-anchor', 'middle');

            node.attr('transform', d => `translate(${d.x}, ${d.y})`);
        });

        // Funciones nativas para capturar el arrastre interactivo (drag & drop)
        function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
        function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
        function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
    }

    // =========================================================================
    // GESTIÓN DEL DISPARADOR DE CÁLCULO
    // =========================================================================
    inputs.btnCalcular.addEventListener('click', () => {
        const s = inputs.netSource.value.trim().toUpperCase();
        const t = inputs.netSink.value.trim().toUpperCase();

        if (listaAristas.length === 0) return alert('Error: No existen aristas configuradas.');
        if (!s || !t) return alert('Error: Ingrese tanto la Fuente (S) como el Sumidero (T).');
        if (s === t) return alert('Error: La Fuente y el Sumidero no pueden ser iguales.');

        try {
            const { flujoMaximo, aristasProcesadas } = calcularFlujoMaximoEK(listaAristas, s, t);

            // Inyección de métricas
            inputs.flowOutput.textContent = flujoMaximo;
            const capSalidaS = listaAristas.filter(e => e.source === s).reduce((acc, e) => acc + e.capacity, 0);
            const eficiencia = capSalidaS > 0 ? Math.round((flujoMaximo / capSalidaS) * 100) : 0;
            inputs.metricEfficiency.textContent = `${eficiencia}%`;

            // Render de la topología final
            dibujarRedFlujo(aristasProcesadas);

            inputs.resultsPanel.style.display = 'block';
            inputs.resultsPanel.scrollIntoView({ behavior: 'smooth' });

        } catch (err) {
            alert(err.message);
            console.error(err);
        }
    });
});