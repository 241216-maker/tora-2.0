document.addEventListener('DOMContentLoaded', () => {
// Arreglo en memoria global encargado de almacenar las actividades conforme 
// las registra el usuario
            let listaActividades = [];
// Mapeo directo de los selectores del DOM para lectura/escritura veloz de datos

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
// SECCIÓN 1: CAPTURA, VALIDACIÓN Y BITÁCORA DE CONTROL
            inputs.btnAñadir.addEventListener('click', () => { // Escucha el evento de clic del botón para iniciar la captura de una actividad
// .trim() limpia espacios accidentales al inicio/final; .toUpperCase() homologa la letra a mayúscula
                const id = inputs.id.value.trim().toUpperCase(); // Obtiene el identificador limpiando espacios y convirtiéndolo a mayúsculas
                const duracion = parseInt(inputs.duration.value); // Transforma la cadena de texto de la duración ingresada en un número entero computable
// MÓDULO DE SEGURIDAD INTERNA: Validaciones preventivas para impedir el ingreso de datos nulos, duraciones negativas o IDs duplicados que corrompan los cálculos algorítmicos posteriores 
                if (!id) return alert('Error: Ingrese un identificador válido.'); // Detiene el flujo si la casilla del identificador se dejó vacía
                if (isNaN(duracion) || duracion < 0) return alert('Error: La duración debe ser mayor o igual a 0.'); // Rechaza valores que no sean numéricos o menores a cero
                if (listaActividades.some(a => a.id === id)) return alert('Error: Esta actividad ya existe.'); // Verifica en la memoria que no existan registros con el mismo identificador

                const rawPred = inputs.predecessors.value.trim(); // Captura los predecesores ingresados limpiando espacios en blanco en los extremos
                const predecesores = rawPred ? rawPred.split(',').map(p => p.trim().toUpperCase()).filter(p => p !== '') : []; // Si existen, los separa por comas, los convierte a mayúsculas y quita elementos vacíos; si no, crea una matriz vacía

                listaActividades.push({ id, duracion, predecesores }); // Introduce el objeto de la actividad estructurado al final de la matriz de persistencia global

                inputs.id.value = ''; inputs.duration.value = ''; inputs.predecessors.value = ''; // Limpia todas las casillas del formulario de entrada para dejarlas listas
                inputs.id.focus(); // Devuelve automáticamente el cursor de escritura al campo ID para agilizar la entrada de datos
                actualizarListaLateral(); // Invoca la función encargada de refrescar la bitácora visual de la columna izquierda
            }); // Cierra el bloque del escuchador de eventos de captura

            function actualizarListaLateral() { // Define la función que redibuja las actividades acumuladas en la memoria del programa
                if (listaActividades.length === 0) { // Evalúa si la cola de datos se encuentra completamente vacía
                    inputs.liveList.innerHTML = `<p class="empty-notice">No hay actividades.</p>`; // Muestra un mensaje amigable indicando la ausencia de tareas
                    return; // Interrumpe la ejecución de la función para evitar procesar código innecesariamente
                } // Fin de la validación de cola vacía
                inputs.liveList.innerHTML = ''; // Vacía el contenedor gráfico para evitar la duplicación de los textos previos
                listaActividades.forEach(act => { // Recorre uno a uno los objetos de actividades guardados en la memoria
                    const cadenaPred = act.predecesores.length > 0 ? act.predecesores.join(', ') : 'Ninguno'; // Construye un texto legible con las dependencias separadas por comas, o 'Ninguno' si es raíz
                    const item = document.createElement('div'); // Instancia dinámicamente un elemento contenedor 'div' en el documento
                    item.className = 'activity-item-log'; // Le asigna la clase CSS para aplicar los estilos visuales definidos en la plantilla
                    item.innerHTML = `
                        <div class="activity-item-content">• <strong>[${act.id}]</strong> | Duración: ${act.duracion} | Pred: [${cadenaPred}]</div>
                        <button type="button" class="btn-delete-activity" data-id="${act.id}">Borrar</button>
                    `; // Inyecta la cadena estructurada con la información de la tarea y el botón para eliminarla
                    const botonEliminar = item.querySelector('.btn-delete-activity');
                    if (botonEliminar) {
                        botonEliminar.addEventListener('click', () => eliminarActividad(act.id));
                    }
                    inputs.liveList.appendChild(item); // Agrega este nuevo bloque de texto como un elemento hijo dentro de la lista visual
                }); // Cierra el ciclo de recorrido de actividades
            } // Cierra la definición de la función de actualización lateral

            function eliminarActividad(id) {
                const indice = listaActividades.findIndex(act => act.id === id);
                if (indice === -1) return;

                listaActividades.splice(indice, 1);
                actualizarListaLateral();
            }

            function procesarCalculoCPM(actividades) { // Define el motor matemático que calcula los tiempos y la Ruta Crítica del proyecto
                let nodos = actividades.map(a => ({ ...a, es: 0, ef: 0, ls: 0, lf: 0, holgura: 0, critical: false })); // Clona las actividades inicializando las 4 variables de tiempo clásicas de CPM en cero
                let cambios = true, iteraciones = 0; const limite = nodos.length * 3; // Declara las variables de control del ciclo y un límite seguro para evitar congelar el navegador

                // Forward Pass
                while (cambios) { // Inicia un bucle de propagación hacia adelante que correrá de forma iterativa mientras los valores temporales sigan variando
                    cambios = false; iteraciones++; // Restablece el testigo de cambios e incrementa el contador de vueltas ejecutadas
                    if (iteraciones > limite) throw new Error("Circuito circular infinito detectado. Revisa tus predecesores."); // Dispara un error de seguridad si el algoritmo detecta una dependencia cíclica infinita (Bucle)

                    nodos.forEach(act => { // Examina cada actividad para proyectar sus tiempos primerencs (ES y EF) de izquierda a derecha
                        let maxEF = 0; // Declara la variable para buscar el término más tardío de las tareas previas
                        if (act.predecesores.length > 0) { // Evalúa si la actividad actual depende de la finalización de otras tareas
                            const validos = nodos.filter(p => act.predecesores.includes(p.id)); // Filtra y extrae los objetos completos correspondientes a sus predecesores reales
                            if (validos.length > 0) maxEF = Math.max(...validos.map(p => p.ef)); // REGLA ACADÉMICA DEL CPM: El Inicio Temprano (ES) es el valor MÁXIMO de los Términos Tempranos (EF) de sus predecesores
                        } // Fin del análisis de predecesores
                        if (act.es !== maxEF) { act.es = maxEF; cambios = true; } // Si el ES calculado cambia respecto al valor anterior, lo actualiza y activa la bandera de cambios
                        
                        const nuevoEF = act.es + act.duracion; // Aplica la ecuación fundamental del recorrido hacia adelante: EF = ES + Duración
                        if (act.ef !== nuevoEF) { act.ef = nuevoEF; cambios = true; } // Si el EF calculado varía, guarda el nuevo valor y levanta la bandera para reevaluar la red
                    }); // Finaliza el recorrido por los nodos en la pasada hacia adelante
                } // Finaliza el bucle de control del Forward Pass

                const tiempoTotal = nodos.length > 0 ? Math.max(...nodos.map(a => a.ef)) : 0; // Fija la duración total estimada del proyecto buscando el EF más alto registrado en toda la red

                // Backward Pass
                nodos.forEach(act => { act.lf = tiempoTotal; act.ls = tiempoTotal - act.duracion; }); // Inicialización en reversa: Acopla por defecto los tiempos tardíos de todas las tareas al límite del tiempo total del proyecto

                cambios = true; iteraciones = 0; // Restablece las variables de control para gestionar de forma limpia la pasada hacia atrás
                while (cambios) { // Inicia el bucle de propagación en reversa que se mantendrá activo mientras los límites de tiempo sigan ajustándose
                    cambios = false; iteraciones++; // Resetea el testigo de cambios incrementando el contador de vueltas analizadas
                    if (iteraciones > limite) break; // Rompe el ciclo en caso de superar el umbral límite establecido para evitar bloqueos del sistema

                    nodos.forEach(act => { // Examina cada nodo de derecha a izquierda para ajustar sus tiempos máximos permitidos (LF y LS)
                        const sucesores = nodos.filter(s => s.predecesores.includes(act.id)); // Localiza y extrae todas las actividades sucesoras que dependen directamente del nodo actual
                        let minLS = tiempoTotal; // Inicializa la variable de búsqueda tomando el tiempo total del proyecto como tope máximo de referencia
                        if (sucesores.length > 0) minLS = Math.min(...sucesores.map(s => s.ls)); // REGLA ACADÉMICA DEL CPM: El Término Tardío (LF) es el valor MÍNIMO de los Inicios Tardíos (LS) de todos sus sucesores
                        
                        if (act.lf !== minLS) { act.lf = minLS; cambios = true; } // Si el LF calculado disminuye o cambia, lo actualiza y activa el testigo para continuar el ajuste en reversa
                        const nuevoLS = act.lf - act.duracion; // Aplica la ecuación analítica del recorrido hacia atrás: LS = LF - Duración
                        if (act.ls !== nuevoLS) { act.ls = nuevoLS; cambios = true; } // Si el LS varía, lo almacena de inmediato y activa la bandera para propagar el cambio hacia el origen de la red
                    }); // Finaliza el recorrido por los nodos en la pasada hacia atrás
                } // Finaliza el bucle de control del Backward Pass

                let holguraAcumulada = 0; // Inicializa la variable acumuladora para cuantificar la flexibilidad temporal total de la red
                nodos.forEach(act => { // Recorre todos los nodos procesados para computar márgenes finales y determinar criticidades
                    act.holgura = act.lf - act.ef; // FÓRMULA MATEMÁTICA DE LA HOLGURA: H = LF - EF (o equivalentemente LS - ES). Muestra el tiempo libre disponible
                    if (Math.abs(act.holgura) < 0.0001) act.holgura = 0; // Corrección numérica de seguridad: Corrige posibles imprecisiones de coma flotante del motor de JavaScript forzando el valor a cero
                    if (act.holgura <= 0) { act.critical = true; act.holgura = 0; } // CRITERIO MATEMÁTICO: Si la holgura es cero o menor, la tarea no tiene margen de error, es CRÍTICA y se marca en verdadero
                    holguraAcumulada += act.holgura; // Suma la holgura de la actividad actual al indicador acumulativo global del proyecto
                }); // Finaliza el proceso de evaluación final de los nodos

                return { nodos, tiempoTotal, holguraAcumulada }; // Devuelve los tres componentes lógicos requeridos para renderizar las métricas y el diagrama en la interfaz de usuario
            } // Cierra la definición de la función del cálculo matemático CPM

            function dibujarGrafoCPM(nodosCpm) { // Define el componente gráfico encargado de calcular la geometría espacial y dibujar la red
                const contenedor = document.getElementById('network-svg-container'); // Obtiene del HTML el contenedor donde se inyectará el dibujo vectorial
                contenedor.innerHTML = ''; // Vacía por completo cualquier gráfico o renderizado anterior para limpiar el lienzo de dibujo

                if (typeof d3 === 'undefined') { // Control de seguridad: Verifica si la librería externa D3.js se encuentra cargada y disponible en el entorno
                    contenedor.innerHTML = '<p style="color:red; text-align:center; padding:20px;">No se pudo cargar la librería gráfica (D3.js). Verifica tu conexión a internet.</p>'; // Inyecta un aviso de error visual si falta la librería gráfica
                    return; // Aborta la ejecución de la función gráfica al carecer del motor de dibujo
                } // Fin de la validación de la librería

                const width = contenedor.clientWidth || 700; // Captura el ancho físico dinámico del contenedor en pantalla o asigna un valor base por defecto de 700 píxeles
                const height = 500; // Define la altura estática del lienzo del diagrama de red fijada en 500 píxeles

                const svg = d3.select('#network-svg-container').append('svg') // Selecciona el contenedor e inyecta dinámicamente una etiqueta estructural de tipo <svg>
                    .attr('width', '100%').attr('height', height).attr('viewBox', `0 0 ${width} ${height}`); // Configura las propiedades de escala y el cuadro de vista (viewBox) del lienzo

                const maxES = Math.max(...nodosCpm.map(n => n.es), 1); // Determina el Inicio Temprano más alto de la red (evitando el cero) para mapear proporcionalmente el eje horizontal
                const conteoPorTiempo = {}; // Objeto que actuará como diccionario para contar cuántas actividades coinciden en un mismo tiempo de inicio
                
                const datasetNodos = nodosCpm.map(n => { // Mapea los nodos calculando un índice vertical secuencial para agrupar tareas paralelas
                    conteoPorTiempo[n.es] = (conteoPorTiempo[n.es] || 0) + 1; // Incrementa el contador de actividades posicionadas en el mismo nivel de tiempo horizontal
                    return { ...n, indexEnLvl: conteoPorTiempo[n.es] }; // Retorna el objeto enriquecido con su posición ordinal dentro de su columna temporal
                }); // Cierra el mapeo de indexación

                datasetNodos.forEach(n => { // Recorre la nueva estructura para calcular las coordenadas geométricas cartesianas de cada bloque
                    n.x = 75 + (n.es * (width - 150) / maxES); // Ecuación de escala horizontal: Calcula la coordenada 'x' distribuyendo los nodos en columnas proporcionales a su valor de tiempo ES
                    if (Math.max(...nodosCpm.map(n => n.es)) === 0) n.x = width / 2; // Caso especial: Si todas las tareas arrancan al mismo tiempo en cero, las centra horizontalmente en el lienzo
                    const totalEnTiempo = conteoPorTiempo[n.es]; // Obtiene la cantidad total de actividades que comparten la misma coordenada en esta columna horizontal
                    n.y = (height / 2) + (n.indexEnLvl - (totalEnTiempo + 1) / 2) * (height / (Math.max(...Object.values(conteoPorTiempo)) + 0.8)); // Ecuación de escala vertical: Centra y equilibra simétricamente las actividades de una misma columna en el eje 'y' para evitar encavallamientos
                }); // Cierra el ciclo de asignación de coordenadas de nodos

                let datasetEnlaces = []; // Inicializa un arreglo vacío destinado a almacenar los objetos de conexión física (aristas) entre las tareas
                datasetNodos.forEach(u => { // Primer recorrido anidado (origen): Selecciona una actividad potencial de salida
                    datasetNodos.forEach(v => { // Segundo recorrido anidado (destino): Selecciona una actividad potencial de llegada
                        if (v.predecesores.includes(u.id)) { // Evalúa si la actividad de llegada tiene registrada a la actividad de origen en su lista de dependencias
                            // Esta línea conecta las bolitas y decide si es crítica o morada
                            datasetEnlaces.push({ source: u, target: v, isCritical: u.critical && v.critical }); // Empaqueta e introduce la arista definiendo sus extremos y determinando su estado crítico si ambos nodos lo son
                        } // Fin de la validación de adyacencia
                    }); // Cierra el recorrido del nodo destino
                }); // Cierra el recorrido del nodo origen

                // Flechas moradas (normales) mejoradas y más grandes
                svg.append('defs').append('marker').attr('id', 'arrow-normal')
                    .attr('viewBox', '0 -5 10 10')
                    .attr('refX', 18).attr('refY', 0)
                    .attr('markerWidth', 7)
                    .attr('markerHeight', 7)
                    .attr('orient', 'auto')
                    .append('path')
                    .attr('d', 'M0,-4L10,0L0,4')
                    .attr('fill', '#bd5bf7');

                // Flechas azules (críticas)
                svg.append('defs').append('marker').attr('id', 'arrow-critical')
                    .attr('viewBox', '0 -5 10 10')
                    .attr('refX', 18).attr('refY', 0)
                    .attr('markerWidth', 7)
                    .attr('markerHeight', 7)
                    .attr('orient', 'auto')
                    .append('path')
                    .attr('d', 'M0,-4L10,0L0,4')
                    .attr('fill', '#00f0ff');

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