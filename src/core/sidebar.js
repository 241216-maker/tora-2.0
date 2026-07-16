// src/core/sidebar.js

// Esperamos de forma segura a que todo el HTML esté cargado en memoria
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('sidebar-container');
    
    // Si el contenedor no existe en esta página, evitamos el error y salimos limpiamente
    if (!container) return;

    // Detectamos la ubicación del archivo de forma infalible
    const isInSubfolder = window.location.pathname.includes('/pages/') || 
                          window.location.pathname.includes('/networks/') || 
                          window.location.pathname.includes('/linear_programming/');

    // Configuración limpia de enlaces dinámicos
    const rootPath = isInSubfolder ? '../../' : './';
    const pagesPath = isInSubfolder ? '../' : './src/pages/';

    // Guardamos el marcado limpio del menú lateral
    const sidebarHTML = `
        <aside class="sidebar" id="app-sidebar">
            <div class="sidebar-header">
                <div class="logo-container">
                    <i class="ph-fill ph-chart-polar logo-icon"></i>
                    <h2 class="logo-text">TORA<span class="logo-highlight">Advanced</span></h2>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <span class="nav-label">Navegación General</span>
                <a href="${rootPath}index.html" class="nav-item">
                    <i class="ph ph-squares-four nav-icon"></i>
                    Dashboard Principal
                </a>

                <span class="nav-label">Módulos de Algoritmos</span>
                
                <div class="nav-group">
                    <span class="nav-item-static">
                        <i class="ph ph-graph nav-icon"></i> Optimización de Redes
                    </span>
                    <div class="sub-nav">
                        <a href="${isInSubfolder ? '../networks/dijkstra.html' : './src/pages/dijkstra.html'}" class="sub-nav-item">
                            Algoritmo de Dijkstra
                        </a>
                    </div>
                </div>

                <div class="nav-group">
                    <span class="nav-item-static">
                        <i class="ph ph-line-segments nav-icon"></i> Programación Lineal
                    </span>
                    <div class="sub-nav">
                        <a href="${isInSubfolder ? '../linear_programming/simplex.html' : './src/pages/simplex.html'}" class="sub-nav-item active">
                            Método Simplex Primal
                        </a>
                    </div>
                </div>
            </nav>
        </aside>
    `;

    // Inyectamos el menú de manera segura
    container.innerHTML = sidebarHTML;
});