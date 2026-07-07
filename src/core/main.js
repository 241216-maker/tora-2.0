/**
 * =========================================================================
 * TORA ADVANCED - MAIN CORE ENGINE (Dashboard Controller)
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 TORA Advanced Core inicializado correctamente.");
    
    initDashboardInteractions();
});

/**
 * Registra eventos interactivos y animaciones en la página principal
 */
function initDashboardInteractions() {
    const btnTheme = document.getElementById('btn-toggle-theme');
    const activeCards = document.querySelectorAll('.active-card');
    
    // 1. Efecto sutil de clic en preferencias tecnológicas
    if (btnTheme) {
        btnTheme.addEventListener('click', (e) => {
            e.preventDefault();
            alert("🔒 Las preferencias avanzadas de estilo cristal están optimizadas por hardware para tu pantalla.");
        });
    }

    // 2. Escuchar la entrada a las tarjetas del algoritmo para generar destellos decorativos en consola
    activeCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const algoTitle = card.querySelector('h3')?.textContent || "Algoritmo";
            // Log decorativo en consola para simular un entorno hacker/tecnológico real
            console.log(`%c[INFO] Enfocando módulo matemático: ${algoTitle}`, "color: #49dfdb; font-weight: bold;");
        });
    });
}