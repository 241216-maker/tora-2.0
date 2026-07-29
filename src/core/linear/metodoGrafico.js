document.addEventListener('DOMContentLoaded', () => {
    const btnAgregar = document.getElementById('btn-agregar-restriccion');
    const btnResolver = document.getElementById('btn-resolver');
    const contenedorRestricciones = document.getElementById('contenedor-restricciones');
    const canvas = document.getElementById('plano-cartesiano');
    
    // Captura de los contenedores visuales estilo Dijkstra
    const textoSolucion = document.getElementById('texto-solucion');
    const valorZBadge = document.getElementById('valor-z-badge');
    
    let contadorRestricciones = 0;

    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            if (contadorRestricciones === 0 && contenedorRestricciones) {
                contenedorRestricciones.innerHTML = '';
            }
            contadorRestricciones++;

            const nuevaFila = document.createElement('div');
            nuevaFila.className = 'flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm animate-fade-in';
            nuevaFila.innerHTML = `
                <span class="font-bold text-purple-700 text-xs w-6 bg-purple-50 py-1 rounded text-center border border-purple-100">R${contadorRestricciones}</span>
                <input type="number" id="r${contadorRestricciones}-x1" placeholder="0" class="border border-slate-300 p-1.5 rounded-lg w-14 text-center text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                <span class="text-xs text-slate-400 font-bold">X1+</span>
                <input type="number" id="r${contadorRestricciones}-x2" placeholder="0" class="border border-slate-300 p-1.5 rounded-lg w-14 text-center text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                <span class="text-xs text-slate-400 font-bold">X2</span>
                <select id="r${contadorRestricciones}-signo" class="border border-slate-300 p-1 rounded-lg bg-white text-xs font-semibold text-slate-600 outline-none">
                    <option value="<=">&le;</option>
                    <option value=">=">&ge;</option>
                    <option value="=">=</option>
                </select>
                <input type="number" id="r${contadorRestricciones}-valor" placeholder="0" class="border border-slate-300 p-1.5 rounded-lg w-16 text-center text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white">
            `;
            if (contenedorRestricciones) {
                contenedorRestricciones.appendChild(nuevaFila);
            }
        });
    }

    if (btnResolver) {
        btnResolver.addEventListener('click', () => {
            const tipoObj = document.getElementById('tipo-optimizacion').value;
            const x1Obj = parseFloat(document.getElementById('x1-obj').value) || 0;
            const x2Obj = parseFloat(document.getElementById('x2-obj').value) || 0;

            const listaRestricciones = [];
            for (let i = 1; i <= contadorRestricciones; i++) {
                const x1Res = parseFloat(document.getElementById(`r${i}-x1`).value) || 0;
                const x2Res = parseFloat(document.getElementById(`r${i}-x2`).value) || 0;
                const signoRes = document.getElementById(`r${i}-signo`).value;
                const valorRes = parseFloat(document.getElementById(`r${i}-valor`).value) || 0;

                if (x1Res !== 0 || x2Res !== 0) {
                    listaRestricciones.push({ id: i, x1: x1Res, x2: x2Res, signo: signoRes, valor: valorRes });
                }
            }

            if (listaRestricciones.length === 0) {
                alert("Por favor, añade al menos una restricción con valores válidos.");
                return;
            }

            dibujarPlanoBase();

            if (listaRestricciones.length > 0) {
                const res = listaRestricciones[0];
                dibujarAreaFactible(res);

                const vertices = [
                    { x: 0, y: 0 },
                    { x: 0, y: res.valor / res.x2 },
                    { x: res.valor / res.x1, y: 0 }
                ];

                let mejorZ = tipoObj === 'max' ? -Infinity : Infinity;
                let mejorPunto = vertices[0];

                vertices.forEach(punto => {
                    const zCalculado = (x1Obj * punto.x) + (x2Obj * punto.y);
                    if (tipoObj === 'max') {
                        if (zCalculado > mejorZ) { mejorZ = zCalculado; mejorPunto = punto; }
                    } else {
                        if (zCalculado < mejorZ) { mejorZ = zCalculado; mejorPunto = punto; }
                    }
                    marcarVerticeEnCanvas(punto.x, punto.y);
                });

                // Actualización limpia de textos sin etiquetas rotas
                if (textoSolucion && valorZBadge) {
                    textoSolucion.innerHTML = `Ocurrido con las coordenadas:<br>• Variable <strong>X1 = ${mejorPunto.x.toFixed(2)}</strong><br>• Variable <strong>X2 = ${mejorPunto.y.toFixed(2)}</strong>`;
                    valorZBadge.innerText = mejorZ.toFixed(2);
                }
            }

            listaRestricciones.forEach(res => {
                graficarLineaRestriccion(res);
            });
        });
    }

    function dibujarPlanoBase() {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#475569'; 
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(40, 20); ctx.lineTo(40, 360); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(40, 360); ctx.lineTo(380, 360); ctx.stroke();
        ctx.font = '11px sans-serif'; ctx.fillStyle = '#94a3b8';
        ctx.fillText("X1 (Horizontal)", 290, 380); ctx.fillText("X2 (Vertical)", 10, 15);
    }

    function graficarLineaRestriccion(res) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const escala = 40; const origenX = 40; const origenY = 360; 
        let pt1 = { x: 0, y: res.valor / res.x2 };
        let pt2 = { x: res.valor / res.x1, y: 0 };
        const pixelPt1 = { x: origenX + (pt1.x * escala), y: origenY - (pt1.y * escala) };
        const pixelPt2 = { x: origenX + (pt2.x * escala), y: origenY - (pt2.y * escala) };
        ctx.beginPath(); ctx.moveTo(pixelPt1.x, pixelPt1.y); ctx.lineTo(pixelPt2.x, pixelPt2.y);
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 3; ctx.stroke(); 
        ctx.fillStyle = '#4f46e5'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`R${res.id}`, pixelPt2.x - 15, pixelPt2.y - 10);
    }

    function dibujarAreaFactible(res) {
        if (!canvas || res.signo !== '<=') return; 
        const ctx = canvas.getContext('2d');
        const escala = 40; const origenX = 40; const origenY = 360;
        let interseccionX2 = res.valor / res.x2; let interseccionX1 = res.valor / res.x1; 
        const pixelinterseccionX2 = { x: origenX, y: origenY - (interseccionX2 * escala) };
        const pixelinterseccionX1 = { x: origenX + (interseccionX1 * escala), y: origenY };
        const pixelOrigen = { x: origenX, y: origenY }; 
        ctx.beginPath(); ctx.moveTo(pixelOrigen.x, pixelOrigen.y);
        ctx.lineTo(pixelinterseccionX2.x, pixelinterseccionX2.y); ctx.lineTo(pixelinterseccionX1.x, pixelinterseccionX1.y); 
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; ctx.fill(); 
    }

    function marcarVerticeEnCanvas(matX, matY) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const escala = 40; const origenX = 40; const origenY = 360;
        const pX = origenX + (matX * escala); const pY = origenY - (matY * escala);
        ctx.beginPath(); ctx.arc(pX, pY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#6366f1'; ctx.fill();
    }
});