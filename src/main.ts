// @ts-ignore
import './index.css';

// 1. Capturar los elementos del DOM (HTML) usando selectores seguros de TypeScript
const btnLinear = document.getElementById('btn-linear') as HTMLButtonElement;
const btnTransport = document.getElementById('btn-transport') as HTMLButtonElement;
const btnNetworks = document.getElementById('btn-networks') as HTMLButtonElement;

const appTitle = document.getElementById('app-title') as HTMLHeadingElement;
const appContent = document.getElementById('app-content') as HTMLDivElement;

// 2. Definir qué pasará cuando el usuario haga clic en un módulo
btnLinear.addEventListener('click', () => {
  appTitle.innerText = "Módulo I: Programación Lineal";
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

btnTransport.addEventListener('click', () => {
  appTitle.innerText = "Módulo II: Modelos de Transporte y Asignación";
  appContent.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
      <h3 class="text-lg font-bold mb-4">Esquina Noroeste, Costo Mínimo y Vogel</h3>
      <div id="transport-matrix-container"></div>
    </div>
  `;
});