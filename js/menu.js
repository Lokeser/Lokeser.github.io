// ==================================================================
//  TEMA — Aurora Arcana (claro) e Eclipse Arcano (escuro)
//  Visitante: a escolha fica num cookie. Usuário logado: a escolha
//  fica guardada para aquele login, e volta sempre que ele entra.
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
function usuarioLogado() {
    try {
        return localStorage.getItem('wnj_gh_token') ? (localStorage.getItem('wnj_gh_user') || '') : '';
    } catch (e) { return ''; }
}
const chaveTemaUsuario = (u) => 'wnj_tema_' + u.toLowerCase();

// O cookie antigo 'blue' continua valendo e é lido como claro.
function temaSalvo() {
    const u = usuarioLogado();
    if (u) {
        try {
            const t = localStorage.getItem(chaveTemaUsuario(u));
            if (t === 'dark' || t === 'light') return t;
        } catch (e) { /* segue para o cookie */ }
    }
    const c = getCookie('theme');
    if (c === 'dark') return 'dark';
    if (c === 'light' || c === 'blue') return 'light';
    return null;                       // sem escolha: segue o sistema
}
function temaEfetivo(theme) {
    return theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function applyTheme(theme) {
    if (theme) document.documentElement.setAttribute('data-theme', theme);
    else document.documentElement.removeAttribute('data-theme');
    const escuro = temaEfetivo(theme) === 'dark';
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.setAttribute('aria-checked', String(escuro));
        btn.title = escuro ? 'Mudar para Aurora Arcana (claro)' : 'Mudar para Eclipse Arcano (escuro)';
    }
    const rot = document.getElementById('tema-rotulo');
    if (rot) rot.textContent = escuro ? 'Eclipse Arcano' : 'Aurora Arcana';
}
function salvarTema(t) {
    setCookie('theme', t, 365);                 // vale para o próximo carregamento
    const u = usuarioLogado();
    if (u) { try { localStorage.setItem(chaveTemaUsuario(u), t); } catch (e) {} }
}
function toggleTheme() {
    const proximo = temaEfetivo(temaSalvo()) === 'dark' ? 'light' : 'dark';
    salvarTema(proximo);
    applyTheme(proximo);
}

document.addEventListener("DOMContentLoaded", () => {
    // Aplica o tema salvo assim que a página carrega
    applyTheme(temaSalvo());
    if (usuarioLogado() && temaSalvo()) setCookie('theme', temaSalvo(), 365);

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
    const finalPrefix = window.location.pathname.includes('contents') ? "../".repeat(depth + 1) : "";

    // --- HTML DA BARRA DE NAVEGAÇÃO ---
    // Na barra, só o conhecimento do grimório. Tudo que é do jogador
    // (conta, fichas, mundo e tema) mora no menu da conta, à direita.
    const navHTML = `
        <nav class="main-navbar">
            <div class="nav-container">
                <a href="/" class="nav-logo nav-logo-link">LUXSANDORIA</a>

                <ul class="nav-links" id="nav-links-list">
                    <li><a href="${finalPrefix}contents/regras/regras_menu.html">Regras</a></li>
                    <li><a href="${finalPrefix}contents/ranks/ranks_menu.html">Ranks</a></li>
                    <li><a href="${finalPrefix}contents/racas/racas_menu.html">Raças</a></li>
                    <li><a href="${finalPrefix}contents/classes/classes_menu.html">Classes</a></li>
                    <li><a href="${finalPrefix}contents/magias/magias_menu.html">Magias</a></li>
                    <li><a href="${finalPrefix}contents/habilidades/habilidades_menu.html">Habilidades</a></li>
                </ul>

                <div class="conta" id="conta">
                    <button class="conta-btn" id="conta-btn" type="button"
                            aria-haspopup="true" aria-expanded="false" aria-controls="conta-menu"
                            title="Sua conta">
                        <span class="conta-avatar" id="conta-avatar" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7">
                                <circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.9-4 3.8-6.2 7.5-6.2s6.6 2.2 7.5 6.2"/>
                            </svg>
                        </span>
                        <span class="sr-only">Abrir menu da conta</span>
                    </button>

                    <div class="conta-menu" id="conta-menu" hidden>
                        <div class="conta-topo" id="conta-topo"></div>

                        <div class="conta-grupo">
                            <a class="conta-item conta-item--destaque" href="${finalPrefix}personagem.html">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 3.5h11l3.5 3.5v13.5H5z"/><path d="M15.5 3.5V7H19"/><circle cx="12" cy="12" r="2.2"/><path d="M8.3 18c0-2 1.6-3.2 3.7-3.2s3.7 1.2 3.7 3.2"/></svg>
                                Meus Personagens
                            </a>
                        </div>

                        <div class="conta-grupo">
                            <p class="conta-rotulo">Universo</p>
                            <a class="conta-item" href="${finalPrefix}eras.html">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.2v5.2l3.3 2"/></svg>
                                Eras
                            </a>
                            <a class="conta-item" href="${finalPrefix}mapa.html">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 3.5L3.5 6v14.5L9 18l6 2.5 5.5-2.5V3.5L15 6z"/><path d="M9 3.5V18M15 6v14.5"/></svg>
                                Mapa
                            </a>
                            <a class="conta-item" href="${finalPrefix}contents/galeria/galeria_menu.html">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>
                                Galeria
                            </a>
                        </div>

                        <div class="conta-grupo conta-tema">
                            <span class="conta-tema-txt">
                                <span class="conta-rotulo">Tema</span>
                                <span id="tema-rotulo">Aurora Arcana</span>
                            </span>
                            <button id="theme-toggle" class="tema-switch" type="button" role="switch"
                                    aria-checked="false" aria-label="Modo escuro">
                                <span class="tema-bola" aria-hidden="true"></span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mobile-menu-icon" id="mobile-menu-btn" role="button" tabindex="0" aria-label="Abrir navegação">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    `;

    navbarPlaceholder.innerHTML = navHTML;

    // Sincroniza o seletor de tema e liga o clique
    applyTheme(temaSalvo());
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Marca onde o leitor está
    const aqui = window.location.pathname.replace(/\/$/, '');
    document.querySelectorAll('.nav-links a[href], .conta-item[href]').forEach(a => {
        const alvo = a.getAttribute('href').split('?')[0].replace(/^(\.\.\/)+/, '').replace(/\/$/, '');
        if (alvo && alvo !== '/' && aqui.endsWith(alvo)) a.setAttribute('aria-current', 'page');
    });

    // ---------- MENU DA CONTA ----------
    const contaBtn = document.getElementById('conta-btn');
    const contaMenu = document.getElementById('conta-menu');
    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function desenharConta() {
        const u = usuarioLogado();
        let editor = false;
        try { editor = localStorage.getItem('wnj_gh_editor') === '1'; } catch (e) {}
        const topo = document.getElementById('conta-topo');
        const avatar = document.getElementById('conta-avatar');
        if (u) {
            topo.innerHTML =
                '<div class="conta-quem">' +
                    '<span class="conta-inicial" aria-hidden="true">' + esc(u.trim()[0] || '?').toUpperCase() + '</span>' +
                    '<span><strong>' + esc(u) + '</strong>' +
                    '<small>' + (editor ? 'Colaborador · pode editar' : 'Somente leitura') + '</small></span>' +
                '</div>' +
                '<button class="conta-sair" id="conta-sair" type="button">Sair</button>';
            avatar.classList.add('logado');
            avatar.innerHTML = '<span>' + esc(u.trim()[0] || '?').toUpperCase() + '</span>';
            contaBtn.title = 'Conectado como ' + u;
            document.getElementById('conta-sair').onclick = () => {
                if (typeof WNJAuth !== 'undefined') WNJAuth.sair();
                location.reload();
            };
        } else {
            topo.innerHTML =
                '<p class="conta-convite">Entre para salvar seus personagens na nuvem e guardar suas preferências.</p>' +
                '<button id="gh-login-btn" class="conta-entrar" type="button">' +
                    '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 011-2.7 3.6 3.6 0 01.1-2.7s.8-.3 2.8 1a9.6 9.6 0 015 0c1.9-1.3 2.8-1 2.8-1a3.6 3.6 0 01.1 2.7 3.9 3.9 0 011 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0012 2z"/></svg>' +
                    '<span id="gh-login-rotulo">Entrar com GitHub</span>' +
                '</button>';
            avatar.classList.remove('logado');
            contaBtn.title = 'Sua conta';
            if (typeof WNJAuth !== 'undefined') WNJAuth.ligarBotao();
        }
    }

    function abrirConta(abrir) {
        contaMenu.hidden = !abrir;
        contaBtn.setAttribute('aria-expanded', String(abrir));
        if (abrir) {
            desenharConta();
            const primeiro = contaMenu.querySelector('button, a');
            if (primeiro) primeiro.focus();
        }
    }
    contaBtn.addEventListener('click', (e) => { e.stopPropagation(); abrirConta(contaMenu.hidden); });
    contaMenu.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => { if (!contaMenu.hidden) abrirConta(false); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !contaMenu.hidden) { abrirConta(false); contaBtn.focus(); }
    });
    // Login/logout em outra parte da página: redesenha e aplica o tema daquele usuário
    document.addEventListener('wnj-auth', () => { desenharConta(); applyTheme(temaSalvo()); });
    desenharConta();

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
        s.onload = () => desenharConta();
        document.head.appendChild(s);
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