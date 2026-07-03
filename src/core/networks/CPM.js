let proyectoActividades = [];

function normalizarActividades(actividades) {
  return actividades.map((actividad) => ({
    ...actividad,
    id: String(actividad.id).trim().toUpperCase(),
    duracion: Number(actividad.duracion),
    predecesores: Array.isArray(actividad.predecesores)
      ? actividad.predecesores.map((pred) => String(pred).trim().toUpperCase()).filter(Boolean)
      : [],
    es: 0,
    ef: 0,
    ls: 0,
    lf: 0,
    holgura: 0
  }));
}

function calcularCPM(actividades) {
  const lista = normalizarActividades(actividades);

  for (let iteracion = 0; iteracion < lista.length; iteracion += 1) {
    for (const act of lista) {
      const predecesores = lista.filter((p) => act.predecesores.includes(p.id));
      act.es = predecesores.length > 0 ? Math.max(...predecesores.map((p) => p.ef)) : 0;
      act.ef = act.es + act.duracion;
    }
  }

  const tiempoTotalProyecto = lista.length > 0 ? Math.max(...lista.map((a) => a.ef)) : 0;

  for (let i = lista.length - 1; i >= 0; i -= 1) {
    const act = lista[i];
    const sucesores = lista.filter((s) => s.predecesores.includes(act.id));

    act.lf = sucesores.length > 0 ? Math.min(...sucesores.map((s) => s.ls)) : tiempoTotalProyecto;
    act.ls = act.lf - act.duracion;
    act.holgura = act.ls - act.es;
  }

  return lista;
}

function construirRutaCritica(resultados) {
  const actividadesCriticas = resultados.filter((act) => act.holgura === 0);

  if (actividadesCriticas.length === 0) {
    return [];
  }

  const inicio = actividadesCriticas.find((act) => act.predecesores.length === 0) || actividadesCriticas[0];
  const ruta = [inicio.id];
  let actual = inicio;

  while (true) {
    const sucesoresCriticos = actividadesCriticas.filter((s) => s.predecesores.includes(actual.id));
    if (sucesoresCriticos.length === 0) {
      break;
    }

    const siguiente = sucesoresCriticos[0];
    ruta.push(siguiente.id);
    actual = siguiente;
  }

  return ruta;
}

function renderizarActividades(actividades, vistaActividades) {
  if (!vistaActividades) {
    return;
  }

  if (actividades.length === 0) {
    vistaActividades.textContent = 'Ninguna actividad añadida aún.';
    return;
  }

  const texto = actividades.map((act) => {
    const cadenaPred = act.predecesores.length > 0 ? act.predecesores.join(', ') : 'Ninguno';
    return `• Actividad [${act.id}] | Duración: ${act.duracion} | Predecesores: [${cadenaPred}]`;
  }).join('\n');

  vistaActividades.textContent = texto;
}

function renderizarResultados(resultados, vistaResultado) {
  if (!vistaResultado) {
    return;
  }

  const rutaCritica = construirRutaCritica(resultados);
  const duracionTotal = resultados.length > 0 ? Math.max(...resultados.map((r) => r.ef || 0)) : 0;
  const lineas = [
    '=== RESULTADOS CPM ===',
    '',
    ...resultados.map((act) => `• Actividad [${act.id}]: ES:${act.es} | EF:${act.ef} | LS:${act.ls} | LF:${act.lf} | Holgura: ${act.holgura}`),
    '',
    `➔ RUTA CRÍTICA: ${rutaCritica.join(' ➔ ') || 'No definida'}`,
    `➔ DURACIÓN TOTAL: ${duracionTotal} días.`
  ];

  vistaResultado.textContent = lineas.join('\n');
}

document.addEventListener('DOMContentLoaded', () => {
  const idInput = document.getElementById('actividadId');
  const duracionInput = document.getElementById('actividadDuracion');
  const predInput = document.getElementById('actividadPredecesores');
  const btnAgregar = document.getElementById('btnAgregarActividad');
  const btnCalcular = document.getElementById('btnCalcularCPM');
  const vistaActividades = document.getElementById('visualizacionActividades');
  const vistaResultado = document.getElementById('resultadoCPM');

  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      const id = idInput?.value.trim().toUpperCase() || '';
      const duracion = Number.parseInt(duracionInput?.value || '', 10);
      const predRaw = predInput?.value.trim().toUpperCase() || '';

      if (!id) {
        alert('Ingresa un ID válido (Ej: A).');
        return;
      }

      if (Number.isNaN(duracion) || duracion < 0) {
        alert('Ingresa una duración válida (0 o mayor).');
        return;
      }

      if (proyectoActividades.some((act) => act.id === id)) {
        alert(`La actividad [${id}] ya existe.`);
        return;
      }

      const predecesores = predRaw
        ? predRaw.split(',').map((p) => p.trim()).filter((p) => p !== '')
        : [];

      proyectoActividades.push({ id, duracion, predecesores });

      if (idInput) idInput.value = '';
      if (duracionInput) duracionInput.value = '';
      if (predInput) predInput.value = '';
      if (idInput) idInput.focus();

      renderizarActividades(proyectoActividades, vistaActividades);
    });
  }

  if (btnCalcular) {
    btnCalcular.addEventListener('click', () => {
      if (proyectoActividades.length === 0) {
        alert('Añade al menos una actividad primero.');
        return;
      }

      const resultados = calcularCPM(proyectoActividades);
      renderizarResultados(resultados, vistaResultado);
    });
  }
});