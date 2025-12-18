// js/menu.js

document.addEventListener("DOMContentLoaded", () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (!navbarPlaceholder) return;

    // 1. Detecta a profundidade do arquivo atual para ajustar os links relativos
    // Se estiver na raiz, pathPrefix é ""
    // Se estiver em contents/classes, pathPrefix é "../../"
    const pathPrefix = window.location.pathname.includes('contents') 
        ? (window.location.pathname.split('contents')[1].split('/').length > 1 ? "../../" : "../")
        : "";
    
    // Se o arquivo estiver em subpastas de 3 níveis (ex: magias/Mana/arquivo.html), ajusta para ../../../
    const depth = (window.location.pathname.split('contents/')[1] || "").split('/').length;
    const finalPrefix = window.location.pathname.includes('contents') ? "../".repeat(depth + 1) : "";

    const navHTML = `
        <nav class="main-navbar">
            <div class="nav-container">
                <div class="nav-logo">LUXSANDORIA</div>
                <ul class="nav-links">
                    <li><a href="${finalPrefix}index.html">Home</a></li>
                    <li><a href="${finalPrefix}contents/regras/regras_menu.html">Regras</a></li>
                    <li><a href="${finalPrefix}contents/ranks/ranks_menu.html">Ranks</a></li>
                    <li><a href="${finalPrefix}contents/racas/racas_menu.html">Raças</a></li>
                    <li><a href="${finalPrefix}contents/classes/classes_menu.html">Classes</a></li>
                    <li><a href="${finalPrefix}contents/magias/magias_menu.html">Magias</a></li>
                    <li><a href="${finalPrefix}contents/habilidades/habilidades_menu.html">Habilidades</a></li>
                </ul>
            </div>
        </nav>
    `;

    navbarPlaceholder.innerHTML = navHTML;
});