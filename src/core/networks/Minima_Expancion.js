document.addEventListener('DOMContentLoaded', () => {
    let listaAristas = [];

    const inputs = {
        source: document.getElementById('edge-source'),
        target: document.getElementById('edge-target'),
        weight: document.getElementById('edge-weight'),
        btnAñadir: document.getElementById('btn-add-edge'),
        btnCalcular: document.getElementById('btn-calculate-mst'),
        liveList: document.getElementById('edges-live-list'),
        resultsPanel: document.getElementById('results-panel'),
        pathOutput: document.getElementById('mst-path-output'),
        metricWeight: document.getElementById('metric-total-weight')
    };

    // 1. REGISTRAR UNA NUEVA ARISTA EN LA LISTA
    inputs.btnAñadir.addEventListener('click', () => {
        const u = inputs.source.value.trim().toUpperCase();
        const v = inputs.target.value.trim().toUpperCase();
        const peso = parseInt(inputs.weight.value);

        if (!u || !v) return alert('Error: Ingrese nombres válidos para los nodos.');
        if (u === v) return alert('Error: El nodo origen y destino no pueden ser el mismo.');
        if (isNaN(peso) || peso <= 0) return alert('Error: El peso debe ser un número entero mayor que 0.');

        const existe = listaAristas.some(a => (a.u === u && a.v === v) || (a.u === v && a.v === u));
        if (existe) return alert('Error: Ya existe una conexión entre estos dos nodos.');

        listaAristas.push({ u, v, peso, inMST: false });

        inputs.source.value = ''; inputs.target.value = ''; inputs.weight.value = '';
        inputs.source.focus();
        actualizarListaLateral();
    });

    function actualizarListaLateral() {
        if (listaAristas.length === 0) {
            inputs.liveList.innerHTML = `<p class="empty-notice">No hay conexiones.</p>`;
            return;
        }
        inputs.liveList.innerHTML = '';
        listaAristas.forEach(arista => {
            const item = document.createElement('div');
            item.className = 'activity-item-log';
            item.innerHTML = `
                <div class="activity-item-content">• Conexión: <strong>${arista.u} ➔ ${arista.v}</strong> | Costo: ${arista.peso}</div>
                <button type="button" class="btn-delete-activity" data-source="${arista.u}" data-target="${arista.v}">Borrar</button>
            `;
            const botonEliminar = item.querySelector('.btn-delete-activity');
            if (botonEliminar) {
                botonEliminar.addEventListener('click', () => eliminarArista(arista.u, arista.v));
            }
            inputs.liveList.appendChild(item);
        });
    }

    function eliminarArista(u, v) {
        const indice = listaAristas.findIndex(a => (a.u === u && a.v === v) || (a.u === v && a.v === u));
        if (indice === -1) return;
        listaAristas.splice(indice, 1);
        actualizarListaLateral();
    }

    // 2. LÓGICA DEL ALGORITMO DE KRUSKAL (MST)
    function calcularKruskal(aristas) {
        let nodosUnicos = new Set();
        aristas.forEach(a => { nodosUnicos.add(a.u); nodosUnicos.add(a.v); });
        
        let parent = {};
        nodosUnicos.forEach(nodo => parent[nodo] = nodo);

        function find(i) {
            if (parent[i] === i) return i;
            return find(parent[i]);
        }

        function union(i, j) {
            let rootI = find(i);
            let rootJ = find(j);
            if (rootI !== rootJ) {
                parent[rootI] = rootJ;
                return true;
            }
            return false;
        }

        let aristasOrdenadas = aristas.map((a, i) => ({ ...a, originalIndex: i })).sort((a, b) => a.peso - b.peso);
        let pesoTotalMST = 0;
        let aristasEnMST = [];

        aristasOrdenadas.forEach(arista => {
            if (find(arista.u) !== find(arista.v)) {
                union(arista.u, arista.v);
                aristas[arista.originalIndex].inMST = true; 
                pesoTotalMST += arista.peso;
                aristasEnMST.push(arista);
            }
        });

        return { pesoTotalMST, aristasEnMST };
    }

    // 3. DIBUJAR LA RED CON FLECHAS Y COLORES COMBINADOS
    function dibujarGrafoMST(aristas, nodosUnicosArray) {
        const contenedor = document.getElementById('network-svg-container');
        contenedor.innerHTML = '';

        const width = contenedor.clientWidth || 700;
        const height = 500;

        const svg = d3.select('#network-svg-container').append('svg')
            .attr('width', '100%').attr('height', height);

        // DEFINICIÓN DE LAS FLECHAS DIRECCIONALES (MARKERS)
        const defs = svg.append('defs');

        // Flecha para el Camino Principal (Azul Neblina)
        defs.append('marker')
            .attr('id', 'arrow-mst')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 18) // Ajuste para que la punta toque el borde del círculo
            .attr('refY', 0)
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#00f0ff');

        // Flecha para la Red de Fondo (Morado)
        defs.append('marker')
            .attr('id', 'arrow-normal')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 18)
            .attr('refY', 0)
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#bd5bf7');

        let nodesMap = {};
        let datasetNodos = nodosUnicosArray.map(id => {
            nodesMap[id] = { id: id };
            return nodesMap[id];
        });

        let datasetEnlaces = aristas.map(a => ({
            source: nodesMap[a.u],
            target: nodesMap[a.v],
            peso: a.peso,
            inMST: a.inMST
        }));

        const simulation = d3.forceSimulation(datasetNodos)
            .force('link', d3.forceLink(datasetEnlaces).id(d => d.id).distance(140))
            .force('charge', d3.forceManyBody().strength(-450))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // DIBUJO DE LAS LÍNEAS CON SUS REQUISITOS DE COLOR Y FLECHA
        const link = svg.append('g').selectAll('line').data(datasetEnlaces).enter().append('line')
            // Azul si es el camino principal del árbol, Morado si es la red de descarte
            .attr('stroke', d => d.inMST ? '#00f0ff' : '#bd5bf7')
            // Más grueso el camino principal
            .attr('stroke-width', d => d.inMST ? 5 : 2.5)
            // Asignación dinámica de la punta de la flecha
            .attr('marker-end', d => d.inMST ? 'url(#arrow-mst)' : 'url(#arrow-normal)')
            // Resplandor neón solo al azul (camino principal) para que sobresalga
            .style('filter', d => d.inMST ? 'drop-shadow(0px 0px 6px rgba(0,240,255,0.7))' : 'none');

        // Etiquetas de los costos en las líneas
        const linkText = svg.append('g').selectAll('text').data(datasetEnlaces).enter().append('text')
            .attr('font-size', '11px')
            .attr('fill', d => d.inMST ? '#00f0ff' : '#bd5bf7')
            .attr('font-weight', '700')
            .text(d => d.peso);

        // Círculos de los Nodos
        const node = svg.append('g').selectAll('circle').data(datasetNodos).enter().append('circle')
            .attr('r', 20)
            .attr('fill', '#12111c')
            .attr('stroke', '#00f0ff')
            .attr('stroke-width', 2)
            .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));

        // Texto de los Nodos
        const labels = svg.append('g').selectAll('text').data(datasetNodos).enter().append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 4)
            .attr('fill', '#ffffff')
            .attr('font-weight', '700')
            .attr('font-size', '13px')
            .text(d => d.id);

        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x).attr('y2', d => d.target.y);

            linkText.attr('x', d => (d.source.x + d.target.x) / 2)
                    .attr('y', d => (d.source.y + d.target.y) / 2 - 6);

            node.attr('cx', d => d.x).attr('cy', d => d.y);
            labels.attr('x', d => d.x).attr('y', d => d.y);
        });

        function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
        function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
        function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
    }

    // BOTÓN ACCIÓN DE CALCULAR
    inputs.btnCalcular.addEventListener('click', () => {
        if (listaAristas.length === 0) return alert('Error: No hay conexiones registradas.');

        listaAristas.forEach(a => a.inMST = false);

        const { pesoTotalMST, aristasEnMST } = calcularKruskal(listaAristas);

        if (aristasEnMST.length === 0) {
            inputs.pathOutput.innerHTML = `<p style="color:red;">No se pudo conectar el árbol.</p>`;
        } else {
            inputs.pathOutput.innerHTML = aristasEnMST
                .map(a => `<span style="color:#00f0ff; font-weight:700;">[${a.u} ➔ ${a.v} (Costo: ${a.peso})]</span>`)
                .join(' , ');
        }

        inputs.metricWeight.textContent = pesoTotalMST;

        let nodosSet = new Set();
        listaAristas.forEach(a => { nodosSet.add(a.u); nodosSet.add(a.v); });
        
        dibujarGrafoMST(listaAristas, Array.from(nodosSet));

        inputs.resultsPanel.style.display = 'block';
        inputs.resultsPanel.scrollIntoView({ behavior: 'smooth' });
    });
});