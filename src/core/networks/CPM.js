// Interfaz exclusiva para las actividades CPM
interface ActividadCPM {
  id: string;
  duracion: number;
  predecesores: string[];
  es?: number; // Early Start
  ef?: number; // Early Finish
  ls?: number; // Late Start
  lf?: number; // Late Finish
  holgura?: number;
}

// Lista en memoria para almacenar las actividades ingresadas por el usuario
const proyectoActividades: ActividadCPM[] = [];

// Función matemática que calcula el algoritmo CPM
function calcularCPM(actividades: ActividadCPM[]): ActividadCPM[] {
  const lista = actividades.map(a => ({ ...a, es: 0, ef: 0, ls: 0, lf: 0, holgura: 0 }));

  // 1. Pasada hacia adelante (Tiempos Tempranos)
  for (const act of lista) {
    if (act.predecesores.length === 0) {
      act.es = 0;
    } else {
      const tiemposFinPredecesores = lista
        .filter(p => act.predecesores.includes(p.id))
        .map(p => p.ef);
      act.es = tiemposFinPredecesores.length > 0 ? Math.max(...tiemposFinPredecesores) : 0;
    }
    act.ef = act.es + act.duracion;
  }

  // Tiempo total estimado del proyecto
  const tiempoTotalProyecto = lista.length > 0 ? Math.max(...lista.map(a => a.ef)) : 0;

  // 2. Pasada hacia atrás (Tiempos Tardíos y Holguras)
  for (let i = lista.length - 1; i >= 0; i--) {
    const act = lista[i];
    const sucesores = lista.filter(s => s.predecesores.includes(act.id));
    
    if (sucesores.length === 0) {
      act.lf = tiempoTotalProyecto;
    } else {
      const tiemposInicioSucesores = sucesores.map(s => s.ls);
      act.lf = Math.min(...tiemposInicioSucesores);
    }
    act.ls = act.lf - act.duracion;
    act.holgura = act.ls - act.es;
  }

  return lista;
}

// Captura de eventos e interfaz de usuario
document.addEventListener('DOMContentLoaded', () => {
  const idInput = document.getElementById('actividadId') as HTMLInputElement;
  const duracionInput = document.getElementById('actividadDuracion') as HTMLInputElement;
  const predInput = document.getElementById('actividadPredecesores') as HTMLInputElement;
  const btnAgregar = document.getElementById('btnAgregarActividad');
  const btnCalcular = document.getElementById('btnCalcularCPM');
  
  const vistaActividades = document.getElementById('visualizacionActividades');
  const vistaResultado = document.getElementById('resultadoCPM');

  // Acción: Agregar Actividad a la lista
  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      const id = idInput.value.trim().toUpperCase();
      const duracion = parseInt(duracionInput.value);
      const predRaw = predInput.value.trim().toUpperCase();

      if (!id || isNaN(duracion)) {
        alert('Por favor, ingresa un ID válido y la duración de la actividad.');
        return;
      }

      // Procesar predecesores separados por coma (ej: "A,B" -> ["A", "B"])
      const predecesores = predRaw ? predRaw.split(',').map(p => p.trim()) : [];

      proyectoActividades.push({ id, duracion, predecesores });

      // Limpiar inputs
      idInput.value = '';
      duracionInput.value = '';
      predInput.value = '';

      // Mostrar el estado de lo que se ha guardado
      if (vistaActividades) {
        vistaActividades.textContent = JSON.stringify(proyectoActividades, null, 2);
      }
    });
  }

  // Acción: Calcular la Ruta Crítica
  if (btnCalcular && vistaResultado) {
    btnCalcular.addEventListener('click', () => {
      if (proyectoActividades.length === 0) {
        vistaResultado.textContent = 'No hay actividades registradas para procesar.';
        return;
      }

      const resultados = calcularCPM(proyectoActividades);
      const rutaCritica: string[] = [];

      let output = `=== RESULTADOS DEL MÉTODO DE LA RUTA CRÍTICA (CPM) ===\n\n`;
      
      resultados.forEach(act => {
        output += `• Actividad [${act.id}]:\n`;
        output += `  - Inicio Temprano (ES): ${act.es} | Fin Temprano (EF): ${act.ef}\n`;
        output += `  - Inicio Tardío (LS): ${act.ls} | Fin Tardío (LF): ${act.lf}\n`;
        output += `  - Holgura: ${act.holgura}\n`;
        
        // Si la holgura es cero, pertenece a la ruta crítica
        if (act.holgura === 0) {
          rutaCritica.push(act.id);
          output += `  [¡ACTIVIDAD CRÍTICA!]\n`;
        }
        output += `\n`;
      });

      output += `--------------------------------------------------\n`;
      output += `➔ RUTA CRÍTICA DEL PROYECTO: ${rutaCritica.join(' ➔ ')}\n`;
      output += `➔ DURACIÓN TOTAL DEL PROYECTO: ${Math.max(...resultados.map(r => r.ef || 0))} unidades de tiempo.`;

      vistaResultado.textContent = output;
    });
  }
});