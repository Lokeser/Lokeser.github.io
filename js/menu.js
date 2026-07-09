// ==================================================================
//  TEMA (Azul padrão / Modo Escuro) — persistido via cookie
// ==================================================================
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[1]) : null;
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        const dark = theme === 'dark';
        btn.textContent = dark ? '☀️' : '🌙';
        btn.title = dark ? 'Mudar para tema Azul' : 'Mudar para Modo Escuro';
        btn.setAttribute('aria-label', btn.title);
    }
}
function toggleTheme() {
    const current = getCookie('theme') || 'blue';
    const next = current === 'dark' ? 'blue' : 'dark';
    setCookie('theme', next, 365);
    applyTheme(next);
}

document.addEventListener("DOMContentLoaded", () => {
    // Aplica o tema salvo (cookie) assim que a página carrega
    applyTheme(getCookie('theme') || 'blue');

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
                
                <a href="/" class="nav-logo nav-logo-link">LUXSANDORIA</a>

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
                    <li><a href="${finalPrefix}personagem.html" class="nav-cta">Criar Personagem</a></li>
                    <li><button id="theme-toggle" class="theme-toggle" type="button" title="Alternar tema">🌙</button></li>
                </ul>
            </div>
        </nav>
    `;

    navbarPlaceholder.innerHTML = navHTML;

    // Sincroniza o ícone do botão com o tema atual e liga o clique
    applyTheme(getCookie('theme') || 'blue');
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

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