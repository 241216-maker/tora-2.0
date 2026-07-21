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

        // Evitar aristas duplicadas entre los mismos dos nodos
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
            item.className = 'activity-item activity-item-log';

            const textSpan = document.createElement('span');
            textSpan.innerHTML = `• Conexión: <strong>${arista.u} ⟷ ${arista.v}</strong> | Costo: ${arista.peso}`;
            item.appendChild(textSpan);

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-small btn-delete';
            delBtn.textContent = 'borrar';
            delBtn.style.marginLeft = '10px';
            delBtn.addEventListener('click', () => {
                listaAristas = listaAristas.filter(a => !( (a.u === arista.u && a.v === arista.v) || (a.u === arista.v && a.v === arista.u) ));
                actualizarListaLateral();
                document.dispatchEvent(new CustomEvent('edge:removed', { detail: { u: arista.u, v: arista.v } }));
            });

            item.appendChild(delBtn);
            inputs.liveList.appendChild(item);
        });
    }

    // 2. LÓGICA DEL ALGORITMO DE KRUSKAL (ÁRBOL DE MÍNIMA EXPANSIÓN)
    function calcularKruskal(aristas) {
        // Obtener todos los nodos únicos presentes
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

        // Clonar y ordenar aristas de menor a mayor peso
        let aristasOrdenadas = aristas.map((a, i) => ({ ...a, originalIndex: i })).sort((a, b) => a.peso - b.peso);
        
        let pesoTotalMST = 0;
        let aristasEnMST = [];

        aristasOrdenadas.forEach(arista => {
            if (find(arista.u) !== find(arista.v)) {
                union(arista.u, arista.v);
                aristas[arista.originalIndex].inMST = true; // Marcar en la lista original
                pesoTotalMST += arista.peso;
                aristasEnMST.push(arista);
            }
        });

        return { pesoTotalMST, aristasEnMST, totalNodos: nodosUnicos.size };
    }

    // 3. DIBUJAR LA RED CON UNA SIMULACIÓN DE FUERZAS DE D3
    function dibujarGrafoMST(aristas, nodosUnicosArray) {
        const contenedor = document.getElementById('network-svg-container');
        contenedor.innerHTML = '';

        const width = contenedor.clientWidth || 700;
        const height = 500;

        const svg = d3.select('#network-svg-container').append('svg')
            .attr('width', '100%').attr('height', height);

        // Convertir aristas a formato de enlaces D3 usando referencias de objetos
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

        // Crear la simulación física de D3 para que se acomoden solos en la pantalla
        const simulation = d3.forceSimulation(datasetNodos)
            .force('link', d3.forceLink(datasetEnlaces).id(d => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Dibujar las líneas (Aristas)
        const link = svg.append('g').selectAll('line').data(datasetEnlaces).enter().append('line')
            .attr('stroke', d => d.inMST ? '#00f0ff' : '#2c2942')
            .attr('stroke-width', d => d.inMST ? 5 : 2)
            .style('filter', d => d.inMST ? 'drop-shadow(0px 0px 6px rgba(0,240,255,0.8))' : 'none');

        // Dibujar etiquetas de texto para el peso de las aristas
        const linkText = svg.append('g').selectAll('text').data(datasetEnlaces).enter().append('text')
            .attr('font-size', '10px').attr('fill', d => d.inMST ? '#00f0ff' : '#8b8a9f')
            .attr('font-weight', d => d.inMST ? '700' : '400')
            .text(d => d.peso);

        // Dibujar los círculos (Nodos)
        const node = svg.append('g').selectAll('circle').data(datasetNodos).enter().append('circle')
            .attr('r', 18).attr('fill', '#12111c').attr('stroke', '#bd5bf7').attr('stroke-width', 2)
            .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));

        // Dibujar los nombres de los nodos
        const labels = svg.append('g').selectAll('text').data(datasetNodos).enter().append('text')
            .attr('text-anchor', 'middle').attr('dy', 4).attr('fill', '#ffffff')
            .attr('font-weight', '700').attr('font-size', '12px').text(d => d.id);

        // Actualizar posiciones en cada tic de la simulación
        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x).attr('y2', d => d.target.y);

            linkText.attr('x', d => (d.source.x + d.target.x) / 2)
                    .attr('y', d => (d.source.y + d.target.y) / 2 - 4);

            node.attr('cx', d => d.x).attr('cy', d => d.y);
            labels.attr('x', d => d.x).attr('y', d => d.y);
        });

        // Funciones para arrastrar los nodos con el mouse
        function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
        function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
        function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
    }

    // BOTÓN DE CALCULAR MÍNIMA EXPANSIÓN
    inputs.btnCalcular.addEventListener('click', () => {
        if (listaAristas.length === 0) return alert('Error: No hay conexiones registradas.');

        // Reiniciar estados anteriores
        listaAristas.forEach(a => a.inMST = false);

        const { pesoTotalMST, aristasEnMST, totalNodos } = calcularKruskal(listaAristas);

        // Renderizar texto de resultados
        if (aristasEnMST.length === 0) {
            inputs.pathOutput.innerHTML = `<p style="color:red;">No se pudo formar el árbol.</p>`;
        } else {
            inputs.pathOutput.innerHTML = aristasEnMST
                .map(a => `<span style="color:#00f0ff; font-weight:700;">[${a.u} ⟷ ${a.v} (Costo: ${a.peso})]</span>`)
                .join(' , ');
        }

        inputs.metricWeight.textContent = pesoTotalMST;

        // Obtener lista de nodos únicos ordenados para dibujar
        let nodosSet = new Set();
        listaAristas.forEach(a => { nodosSet.add(a.u); nodosSet.add(a.v); });
        
        dibujarGrafoMST(listaAristas, Array.from(nodosSet));

        inputs.resultsPanel.style.display = 'block';
        inputs.resultsPanel.scrollIntoView({ behavior: 'smooth' });
    });
});