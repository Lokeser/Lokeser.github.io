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
// Dois temas: Aurora Arcana (claro) e Eclipse Arcano (escuro).
// O cookie antigo 'blue' continua valendo e é lido como claro.
function temaSalvo() {
    const c = getCookie('theme');
    if (c === 'dark') return 'dark';
    if (c === 'light' || c === 'blue') return 'light';
    return null;                       // sem escolha: segue o sistema
}
function applyTheme(theme) {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        const escuro = theme === 'dark' ||
            (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        btn.textContent = escuro ? '☀' : '☾';
        btn.title = escuro ? 'Mudar para Aurora Arcana (claro)' : 'Mudar para Eclipse Arcano (escuro)';
        btn.setAttribute('aria-label', btn.title);
    }
}
function toggleTheme() {
    const atual = temaSalvo() ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const proximo = atual === 'dark' ? 'light' : 'dark';
    setCookie('theme', proximo, 365);
    applyTheme(proximo);
}

document.addEventListener("DOMContentLoaded", () => {
    // Aplica o tema salvo (cookie) assim que a página carrega
    applyTheme(temaSalvo());

    // Fontes do grimório — injetadas aqui para valer em todas as páginas
    if (!document.querySelector('link[href*="fonts.googleapis"]')) {
        const pre = document.createElement('link');
        pre.rel = 'preconnect'; pre.href = 'https://fonts.gstatic.com'; pre.crossOrigin = '';
        document.head.appendChild(pre);
        const f = document.createElement('link');
        f.rel = 'stylesheet';
        f.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700' +
                 '&family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap';
        document.head.appendChild(f);
    }

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
                    <li><a href="${finalPrefix}eras.html" class="nav-eras">Eras</a></li>
                    <li><a href="${finalPrefix}mapa.html" class="nav-eras">Mapa</a></li>
                    <li><a href="${finalPrefix}personagem.html" class="nav-cta">Meus Personagens</a></li>
                    <li><button id="theme-toggle" class="theme-toggle" type="button" title="Alternar tema">🌙</button></li>
                    <li><button id="gh-login-btn" class="gh-login" type="button" title="Entrar com GitHub">🔑 <span id="gh-login-rotulo">Entrar</span></button></li>
                </ul>
            </div>
        </nav>
    `;

    navbarPlaceholder.innerHTML = navHTML;

    // Sincroniza o ícone do botão com o tema atual e liga o clique
    applyTheme(temaSalvo());
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Marca onde o leitor está
    const aqui = window.location.pathname.replace(/\/$/, '');
    document.querySelectorAll('.nav-links a[href]').forEach(a => {
        const alvo = a.getAttribute('href').split('?')[0].replace(/^(\.\.\/)+/, '').replace(/\/$/, '');
        if (alvo && alvo !== '/' && aqui.endsWith(alvo)) a.setAttribute('aria-current', 'page');
    });

    // Notas de margem (tooltips) — disponíveis em todas as páginas
    if (typeof LuxUI === 'undefined') {
        const u = document.createElement('script');
        u.src = finalPrefix + 'js/ui.js';
        document.head.appendChild(u);
    }

    // Login GitHub: carrega o módulo sob demanda (a navbar existe em todas as páginas)
    if (typeof WNJAuth === 'undefined') {
        const s = document.createElement('script');
        s.src = finalPrefix + 'js/auth.js';
        s.onload = () => WNJAuth.ligarBotao();
        document.head.appendChild(s);
    } else {
        WNJAuth.ligarBotao();
    }

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

    // ==================================================================
    //  BOTÃO FLUTUANTE: "Voltar à criação anterior" (rascunho da ficha)
    // ==================================================================
    try {
        const emFicha = /ficha\.html$/i.test(window.location.pathname);
        const rascunho = localStorage.getItem('wnj_draft');
        const oculto = localStorage.getItem('wnj_draft_oculto') === '1';
        if (rascunho && !oculto && !emFicha) {
            let nome = '';
            try { nome = (JSON.parse(rascunho).nome || '').trim(); } catch (e) {}
            const box = document.createElement('div');
            box.id = 'draft-flutuante';
            box.style.cssText = 'position:fixed;left:18px;bottom:18px;z-index:3000;display:flex;align-items:center;gap:8px;' +
                'background:rgba(12,16,24,.95);border:1px solid #c5a059;border-radius:30px;padding:9px 12px 9px 16px;' +
                'box-shadow:0 8px 24px rgba(0,0,0,.55);font-family:sans-serif;';
            box.innerHTML =
                '<a href="' + finalPrefix + 'ficha.html" style="color:#f0d17a;text-decoration:none;font-size:.86rem;font-weight:700;letter-spacing:.5px">' +
                '↩ Voltar à criação anterior' + (nome ? ' <span style="opacity:.7">(' + nome + ')</span>' : '') + '</a>' +
                '<button id="draft-fechar" title="Ignorar" style="background:none;border:1px solid #6b5a35;color:#c5a059;' +
                'border-radius:50%;width:24px;height:24px;line-height:1;cursor:pointer;font-size:.8rem;padding:0">✕</button>';
            document.body.appendChild(box);
            document.getElementById('draft-fechar').addEventListener('click', () => {
                localStorage.setItem('wnj_draft_oculto', '1');
                box.remove();
            });
        }
    } catch (e) { /* localStorage indisponível — ignora */ }
});