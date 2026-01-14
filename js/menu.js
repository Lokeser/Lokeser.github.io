document.addEventListener("DOMContentLoaded", () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (!navbarPlaceholder) return;

    // --- LÓGICA DE CAMINHOS (Mantida do original) ---
    const depth = (window.location.pathname.split('contents/')[1] || "").split('/').length;
    // Se não tiver 'contents' no path, depth pode dar erro na logica original, 
    // mas mantendo a logica de finalPrefix que você já usava:
    const finalPrefix = window.location.pathname.includes('contents') ? "../".repeat(depth + 1) : "";

    // --- HTML DA BARRA DE NAVEGAÇÃO ---
    const navHTML = `
        <nav class="main-navbar">
            <div class="nav-container">
                
                <a href="${finalPrefix}index.html" class="nav-logo nav-logo-link">LUXSANDORIA</a>

                <div class="mobile-menu-icon" id="mobile-menu-btn">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <ul class="nav-links" id="nav-links-list">
                    <li><a href="${finalPrefix}contents/regras/regras_menu.html">Regras</a></li>
                    <li><a href="${finalPrefix}contents/ranks/ranks_menu.html">Ranks</a></li>
                    <li><a href="${finalPrefix}contents/racas/racas_menu.html">Raças</a></li>
                    <li><a href="${finalPrefix}contents/classes/classes_menu.html">Classes</a></li>
                    <li><a href="${finalPrefix}contents/magias/magias_menu.html">Magias</a></li>
                    <li><a href="${finalPrefix}contents/habilidades/habilidades_menu.html">Habilidades</a></li>
                    <li><a href="${finalPrefix}contents/galeria/galeria_menu.html">Galeria</a></li>
                </ul>
            </div>
        </nav>
    `;

    navbarPlaceholder.innerHTML = navHTML;

    // --- LÓGICA DO MENU MOBILE ---
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links-list');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            // Alterna a classe 'active' para mostrar/esconder o menu lateral
            navLinks.classList.toggle('active');
            // Animação do ícone (opcional)
            menuBtn.classList.toggle('is-active');
        });
    }
});