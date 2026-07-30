<<<<<<< HEAD
import './index.css';

const btnLinear = document.getElementById('btn-linear') as HTMLButtonElement | null;
const btnTransport = document.getElementById('btn-transport') as HTMLButtonElement | null;
const btnNetworks = document.getElementById('btn-networks') as HTMLButtonElement | null;

const appTitle = document.getElementById('app-title') as HTMLHeadingElement | null;
const appContent = document.getElementById('app-content') as HTMLDivElement | null;

if (btnLinear && appTitle && appContent) {
  btnLinear.addEventListener('click', () => {
    appTitle.innerText = 'Módulo I: Programación Lineal';
    appContent.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-teal-500">
        <h3 class="text-lg font-bold mb-4">Método Simplex & Gráfico</h3>
        <p class="text-sm text-gray-600 mb-4">Aquí configurarás tu Función Objetivo y Restricciones.</p>
        <div class="p-4 bg-gray-50 rounded border border-dashed text-center text-gray-400">
          Área de carga de variables matemáticas...
        </div>
      </div>
    `;
  });
}

if (btnTransport && appTitle && appContent) {
  btnTransport.addEventListener('click', () => {
    appTitle.innerText = 'Módulo II: Modelos de Transporte y Asignación';
    appContent.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
        <h3 class="text-lg font-bold mb-4">Esquina Noroeste, Costo Mínimo y Vogel</h3>
        <div id="transport-matrix-container"></div>
      </div>
    `;
  });
}

if (btnNetworks) {
  btnNetworks.addEventListener('click', () => {
    window.location.href = './src/algorithm_html/CPM.html';
  });
}
=======
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
>>>>>>> login-pantalla
