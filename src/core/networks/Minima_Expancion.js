document.addEventListener('DOMContentLoaded', () => {
    let listaEnlaces = [];
    let conjuntoNodos = new Set();
    
    let pasosAlgoritmo = [];
    let pasoActual = 0;
    let simulacionD3 = null; 

    const inputs = {
        origen: document.getElementById('edge-source'),
        destino: document.getElementById('edge-target'),
        peso: document.getElementById('edge-weight'),
        btnAñadir: document.getElementById('btn-add-edge'),
        btnCalcular: document.getElementById('btn-calculate-mst'),
        btnSiguiente: document.getElementById('btn-next-step'),
        btnAnterior: document.getElementById('btn-prev-step'),
        btnClear: document.getElementById('btn-clear-network'),
        controlsIter: document.getElementById('iteration-controls'),
        statusBox: document.getElementById('iteration-status'),
        liveList: document.getElementById('edges-live-list'),
        resultsPanel: document.getElementById('results-panel'),
        mstOutput: document.getElementById('mst-output'), 
        metricTotal: document.getElementById('metric-total-weight')
    };

    inputs.btnAñadir.addEventListener('click', () => {
        const u = inputs.origen.value.trim().toUpperCase();
        const v = inputs.destino.value.trim().toUpperCase();
        const peso = parseFloat(inputs.peso.value);
        
        if (!u || !v || u === v) return alert('Nodos inválidos.');
        if (isNaN(peso) || peso < 0) return alert('Costo inválido.');
        
        if (listaEnlaces.some(e => (e.origen===u && e.destino===v) || (e.origen===v && e.destino===u))) {
            return alert('Ya existe una conexión entre estos nodos.');
        }

        listaEnlaces.push({ origen: u, destino: v, peso: peso, id: `e-${u}-${v}` });
        conjuntoNodos.add(u); 
        conjuntoNodos.add(v);

        inputs.origen.value = ''; inputs.destino.value = ''; inputs.peso.value = '';
        inputs.origen.focus();
        
        actualizarLista();
        dibujarRedEstatica();
    });

    if(inputs.btnClear) {
        inputs.btnClear.addEventListener('click', () => {
            if(confirm("¿Estás seguro de que deseas borrar toda la red?")) {
                listaEnlaces = [];
                conjuntoNodos.clear();
                pasosAlgoritmo = [];
                
                actualizarLista();
                document.getElementById('network-svg-container').innerHTML = '';
                if(inputs.resultsPanel) inputs.resultsPanel.style.display = 'none';
                if(inputs.controlsIter) inputs.controlsIter.style.display = 'none';
                if(inputs.btnCalcular) {
                    inputs.btnCalcular.style.display = 'block';
                    inputs.btnCalcular.textContent = 'Iniciar Algoritmo';
                }
            }
        });
    }

    function actualizarLista() {
        if(!inputs.liveList) return;
        inputs.liveList.innerHTML = listaEnlaces.length === 0 ? '<p class="empty-notice">No hay conexiones en la red.</p>' : '';
        listaEnlaces.forEach((enlace, index) => {
            const div = document.createElement('div');
            div.className = 'edge-item-log';
            div.innerHTML = `<span>${enlace.origen} ➔ ${enlace.destino} (Costo: ${enlace.peso})</span>`;
            
            const btn = document.createElement('button');
            btn.className = 'btn-small-danger'; 
            btn.textContent = 'Borrar';
            btn.onclick = () => {
                listaEnlaces.splice(index, 1);
                conjuntoNodos.clear();
                listaEnlaces.forEach(e => { conjuntoNodos.add(e.origen); conjuntoNodos.add(e.destino); });
                actualizarLista();
                dibujarRedEstatica();
            };
            div.appendChild(btn);
            inputs.liveList.appendChild(div);
        });
    }

    function generarPasosPrim() {
        let nodos = Array.from(conjuntoNodos).sort();
        if (nodos.length === 0) throw new Error("No hay nodos para calcular.");

        let pasos = [];
        let Ck = new Set([nodos[0]]); 
        let Ck_bar = new Set(nodos.slice(1));
        let mstActual = [];
        let costoAcumulado = 0;

        pasos.push({
            iteracion: 0,
            conectados: new Set(Ck),
            aristasMST: [...mstActual],
            aristaEvaluada: null,
            mensaje: `<strong>Paso 0:</strong> Iniciamos en el nodo <strong>${nodos[0]}</strong>.`
        });

        let iteracion = 1;

        while (Ck_bar.size > 0) {
            let aristaMinima = null;
            let pesoMinimo = Infinity;
            let nodoOrigenReal = null;
            let nodoDestinoReal = null;

            for (let e of listaEnlaces) {
                let uEnCk = Ck.has(e.origen), vEnCk = Ck.has(e.destino);
                let uEnBar = Ck_bar.has(e.origen), vEnBar = Ck_bar.has(e.destino);

                if ((uEnCk && vEnBar) || (vEnCk && uEnBar)) {
                    if (e.peso < pesoMinimo) {
                        pesoMinimo = e.peso;
                        aristaMinima = e;
                        nodoOrigenReal = uEnCk ? e.origen : e.destino;
                        nodoDestinoReal = uEnCk ? e.destino : e.origen;
                    }
                }
            }

            if (!aristaMinima) throw new Error("Red desconectada. Faltan enlaces para unir todos los nodos.");

            mstActual.push(aristaMinima);
            costoAcumulado += pesoMinimo;
            
            Ck.add(nodoDestinoReal);
            Ck_bar.delete(nodoDestinoReal);

            pasos.push({
                iteracion: iteracion,
                conectados: new Set(Ck),
                aristasMST: [...mstActual],
                aristaEvaluada: aristaMinima,
                direccion: { de: nodoOrigenReal, a: nodoDestinoReal },
                mensaje: `<strong>Iteración ${iteracion}:</strong> Conectamos <strong>${nodoOrigenReal} ➔ ${nodoDestinoReal}</strong> (Costo: ${pesoMinimo}).`
            });
            iteracion++;
        }
        
        return { pasos, costoFinal: costoAcumulado, mstFinal: mstActual };
    }

    function dibujarRedEstatica() {
        const contenedor = document.getElementById('network-svg-container');
        if(!contenedor) return;
        contenedor.innerHTML = '';
        if (conjuntoNodos.size === 0) return;

        const width = contenedor.clientWidth;
        const height = contenedor.clientHeight;
        const svg = d3.select('#network-svg-container').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`);

        svg.append("defs").selectAll("marker")
            .data(["normal", "active", "mst"])
            .enter().append("marker")
            .attr("id", d => `arrow-${d}`)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 28)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", d => d === "active" ? "#bd5bf7" : (d === "mst" ? "#00f0ff" : "#4a485c"));

        const nodosData = Array.from(conjuntoNodos).map(id => ({ id }));
        const enlacesData = listaEnlaces.map(e => ({ source: e.origen, target: e.destino, peso: e.peso, id: e.id }));

        // --- AJUSTES FÍSICOS EXTREMOS PARA MAYOR SEPARACIÓN ---
        simulacionD3 = d3.forceSimulation(nodosData)
            .force("link", d3.forceLink(enlacesData).id(d => d.id).distance(300)) // Aumentado a 300px
            .force("charge", d3.forceManyBody().strength(-4500)) // Fuerza de repulsión masiva
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX(width / 2).strength(0.02)) // Gravedad central muy débil
            .force("y", d3.forceY(height / 2).strength(0.02)) // Gravedad central muy débil
            .stop(); 

        for (let i = 0; i < 300; ++i) {
            simulacionD3.tick();
        }

        const padding = 40; 
        nodosData.forEach(d => {
            d.x = Math.max(padding, Math.min(width - padding, d.x));
            d.y = Math.max(padding, Math.min(height - padding, d.y));
        });

        const lineas = svg.selectAll(".link").data(enlacesData).enter().append("line")
            .attr("class", "link")
            .attr("stroke", "#2b2a3b")
            .attr("stroke-width", 2)
            .attr("id", d => `line-${d.id}`)
            .attr("marker-end", "url(#arrow-normal)"); 

        const textosL = svg.selectAll(".link-text").data(enlacesData).enter().append("text")
            .attr("class", "link-text")
            .attr("id", d => `text-${d.id}`)
            .text(d => d.peso).attr("fill", "#6a6880").attr("font-size", "14px").attr("font-weight", "bold");

        const nodos = svg.selectAll(".node").data(nodosData).enter().append("g");

        nodos.append("circle").attr("r", 20).attr("id", d => `circle-${d.id}`)
            .attr("fill", "#12111c").attr("stroke", "#3f3d56").attr("stroke-width", 2);

        nodos.append("text").text(d => d.id).attr("text-anchor", "middle").attr("dy", 4)
            .attr("fill", "#ffffff").attr("font-weight", "bold");

        lineas.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
              .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        
        textosL.attr("x", d => (d.source.x + d.target.x) / 2)
               .attr("y", d => (d.source.y + d.target.y) / 2 - 8);
        
        nodos.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    function aplicarEstilosPaso(paso) {
        if(inputs.statusBox) inputs.statusBox.innerHTML = paso.mensaje;

        d3.selectAll("circle").attr("stroke", "#3f3d56").style("filter", "none");
        d3.selectAll(".link")
            .attr("stroke", "#2b2a3b").attr("stroke-width", 1.5).attr("stroke-dasharray", "none")
            .attr("marker-end", "url(#arrow-normal)").style("filter", "none");
        d3.selectAll(".link-text").attr("fill", "#4a485c").attr("font-weight", "normal");

        paso.conectados.forEach(nodoId => {
            d3.select(`#circle-${nodoId}`).attr("stroke", "#00f0ff").attr("stroke-width", 3)
              .style("filter", "drop-shadow(0px 0px 8px rgba(0,240,255,0.6))");
        });

        paso.aristasMST.forEach(e => {
            d3.select(`#line-${e.id}`).attr("stroke", "#00f0ff").attr("stroke-width", 4)
              .attr("marker-end", "url(#arrow-mst)");
            d3.select(`#text-${e.id}`).attr("fill", "#00f0ff").attr("font-weight", "bold");
        });

        if (paso.aristaEvaluada) {
            let linea = d3.select(`#line-${paso.aristaEvaluada.id}`);
            linea.attr("stroke", "#bd5bf7").attr("stroke-width", 5)
                 .attr("stroke-dasharray", "6,4")
                 .attr("marker-end", "url(#arrow-active)")
                 .style("filter", "drop-shadow(0px 0px 8px rgba(189,91,247,0.8))");
                 
            let dataLinea = linea.datum();
            if(dataLinea.source.id !== paso.direccion.de) {
                linea.attr("marker-end", null).attr("marker-start", "url(#arrow-active)");
            }
        }
    }

    if(inputs.btnCalcular) {
        inputs.btnCalcular.addEventListener('click', () => {
            try {
                const resultado = generarPasosPrim();
                pasosAlgoritmo = resultado.pasos;
                pasoActual = 0;

                inputs.btnCalcular.style.display = 'none';
                
                if(inputs.controlsIter) inputs.controlsIter.style.display = 'block';
                if(inputs.resultsPanel) inputs.resultsPanel.style.display = 'none';

                if(inputs.btnAnterior) inputs.btnAnterior.disabled = true;
                if(inputs.btnSiguiente) inputs.btnSiguiente.textContent = 'Siguiente ➔';

                if(inputs.mstOutput) {
                    inputs.mstOutput.innerHTML = resultado.mstFinal.map(e => 
                        `<span>Nodo <strong>${e.origen}</strong> ➔ Nodo <strong>${e.destino}</strong> (Costo: ${e.peso})</span><br>`
                    ).join('');
                }
                
                if(inputs.metricTotal) {
                    inputs.metricTotal.textContent = resultado.costoFinal;
                }

                aplicarEstilosPaso(pasosAlgoritmo[pasoActual]);
            } catch (err) { 
                if(err.message.includes("Red desconectada") || err.message.includes("No hay nodos")) {
                    alert(err.message); 
                }
            }
        });
    }

    if(inputs.btnSiguiente) {
        inputs.btnSiguiente.addEventListener('click', () => {
            pasoActual++;
            if (pasoActual < pasosAlgoritmo.length) {
                aplicarEstilosPaso(pasosAlgoritmo[pasoActual]);
                if(inputs.btnAnterior) inputs.btnAnterior.disabled = false;
                
                if (pasoActual === pasosAlgoritmo.length - 1) {
                    inputs.btnSiguiente.textContent = "Ver Resultado Final";
                }
            } else {
                if(inputs.controlsIter) inputs.controlsIter.style.display = 'none';
                if(inputs.btnCalcular) {
                    inputs.btnCalcular.style.display = 'block';
                    inputs.btnCalcular.textContent = 'Reiniciar Algoritmo';
                }
                if(inputs.resultsPanel) {
                    inputs.resultsPanel.style.display = 'block';
                    inputs.resultsPanel.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    if(inputs.btnAnterior) {
        inputs.btnAnterior.addEventListener('click', () => {
            if (pasoActual > 0) {
                pasoActual--;
                aplicarEstilosPaso(pasosAlgoritmo[pasoActual]);
                
                if(inputs.btnSiguiente) inputs.btnSiguiente.textContent = "Siguiente ➔";
                
                if (pasoActual === 0 && inputs.btnAnterior) {
                    inputs.btnAnterior.disabled = true;
                }
            }
        });
    }
});