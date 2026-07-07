// @ts-nocheck
import { cargarModuloTransporte } from './core/transport/transporte.js';
import { cargarModuloHungaro } from './core/transport/Hungarian.js';

document.addEventListener('DOMContentLoaded', () => {
  const btnTransport = document.getElementById('btn-transport');
  const btnAssignment = document.getElementById('btn-assignment');
  
  // CORRECCIÓN: Usamos 'main-app-content' que es el ID real de tu sección HTML
  const appContent = document.getElementById('main-app-content');

  function prepararContenedor() {
    if (appContent) {
      appContent.innerHTML = '';
    }
  }

  // Escuchador para el Módulo de Transporte
  if (btnTransport) {
    btnTransport.addEventListener('click', (e) => {
      e.preventDefault(); // Evita que recargue la página por ser un enlace
      prepararContenedor();
      cargarModuloTransporte();
    });
  }

  // Escuchador para el Módulo Húngaro (Asignación)
  if (btnAssignment) {
    btnAssignment.addEventListener('click', (e) => {
      e.preventDefault(); // Evita que recargue la página por ser un enlace
      prepararContenedor();
      cargarModuloHungaro();
    });
  }

  // Carga inicial por defecto para verificar que pinte de inmediato
  prepararContenedor();
  cargarModuloTransporte();
});