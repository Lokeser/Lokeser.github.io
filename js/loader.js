// js/loader.js
// Carrega e renderiza um .md indicado por ?file=... no visualizador.
// Somente leitura — a edição de conteúdo é feita manualmente nos arquivos.
//
// Além de renderizar, o loader monta a trilha de navegação, o índice da
// página e marca os termos do sistema com notas de margem (tooltips).

document.addEventListener("DOMContentLoaded", () => {
    const alvo = document.getElementById('content');
    if (!alvo) return;

    const caminho = new URLSearchParams(window.location.search).get('file');
    if (!caminho) {
        alvo.innerHTML = '<div class="erro-box"><p class="empty-title">Nenhum pergaminho selecionado</p>' +
            '<p>Escolha um conteúdo pelo menu acima.</p></div>';
        return;
    }

    montarTrilha(caminho);

    fetch(caminho)
        .then(res => { if (!res.ok) throw new Error('Arquivo não encontrado.'); return res.text(); })
        .then(md => {
            alvo.innerHTML = (typeof marked !== 'undefined')
                ? marked.parse(md)
                : '<pre>' + md.replace(/[&<]/g, c => ({ '&': '&amp;', '<': '&lt;' }[c])) + '</pre>';
            alvo.removeAttribute('aria-busy');
            document.title = (alvo.querySelector('h1')?.textContent || 'Pergaminho').trim();
            const atual = document.querySelector('#trilha .atual');
            if (atual && alvo.querySelector('h1')) atual.textContent = document.title;
            prepararPlacas(alvo);
            envolverTabelas(alvo);
            montarIndice(alvo);
            marcarTermos(alvo);
        })
        .catch(err => {
            alvo.innerHTML = '<div class="erro-box"><p class="empty-title">Não consegui abrir este pergaminho</p>' +
                '<p>' + esc(err.message) + '</p>' +
                '<p><code>' + esc(caminho) + '</code></p></div>';
        });
});

// O ui.js é injetado pelo menu.js e pode chegar depois daqui.
function marcarTermos(alvo) {
    if (typeof LuxUI !== 'undefined') { LuxUI.marcar(alvo); return; }
    document.addEventListener('lux-ui-pronto', () => LuxUI.marcar(alvo), { once: true });
}

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------------------------------------------
//  Trilha: de qual seção do grimório este arquivo veio
// ------------------------------------------------------------------
const SECOES = {
    'regras':      ['Regras',      'contents/regras/regras_menu.html'],
    'ranks':       ['Ranks',       'contents/ranks/ranks_menu.html'],
    'racas':       ['Raças',       'contents/racas/racas_menu.html'],
    'classes':     ['Classes',     'contents/classes/classes_menu.html'],
    'magias':      ['Magias',      'contents/magias/magias_menu.html'],
    'habilidades': ['Habilidades', 'contents/habilidades/habilidades_menu.html'],
    'galeria':     ['Galeria',     'contents/galeria/galeria_menu.html']
};
// Dentro de Magias, "voltar" leva ao menu da fonte de onde o arquivo veio
const FONTES_MAGIA = {
    'Mana': ['Magias', 'contents/magias/Mana/mana_menu.html', 'Magia de Mana'],
    'Ki':   ['Magias', 'contents/magias/Ki/ki_menu.html',     'Ki'],
    'Fe':   ['Magias', 'contents/magias/Fe/fe_menu.html',     'Fé'],
    'Caos': ['Magias', 'contents/magias/Caos/caos_menu.html', 'Caos']
};

function montarTrilha(caminho) {
    const trilha = document.getElementById('trilha');
    if (!trilha) return;
    const partes = caminho.split('/');
    const secao = partes[1];                       // contents/<secao>/...
    let info = SECOES[secao];
    let voltarRotulo = info ? info[0] : '';
    if (secao === 'magias' && FONTES_MAGIA[partes[2]]) {
        info = FONTES_MAGIA[partes[2]];
        voltarRotulo = info[2];
    }
    const nome = decodeURIComponent(partes[partes.length - 1]).replace(/\.md$/i, '');

    let html = '<a href="/">Grimório</a>';
    if (info) {
        html += ' <span class="sep">/</span> <a href="' + info[1] + '">' + info[0] + '</a>';
        const botao = document.getElementById('link-secao');
        if (botao) { botao.href = info[1]; botao.textContent = 'Voltar para ' + voltarRotulo; }
    } else {
        document.getElementById('link-secao')?.remove();
    }
    html += ' <span class="sep">/</span> <span class="atual">' + esc(nome) + '</span>';
    trilha.innerHTML = html;
}

// ------------------------------------------------------------------
//  Lâminas arcanas
//  Os .md trazem blocos ilustrados escritos para fundo escuro (cores
//  fixas no style inline). Em vez de reescrever o conteúdo do autor,
//  marcamos esses blocos para que ganhem uma placa escura no tema
//  claro — a arte fica intacta e o texto, sempre legível.
// ------------------------------------------------------------------
function prepararPlacas(raiz) {
    const coloridos = raiz.querySelectorAll('[style*="color:#"], [style*="color: #"]');
    const placas = new Set();
    coloridos.forEach(el => {
        // sobe até o filho direto do container e marca esse bloco
        let n = el;
        while (n.parentElement && n.parentElement !== raiz) n = n.parentElement;
        if (n !== raiz && n.nodeType === 1) placas.add(n);
    });
    placas.forEach(n => n.classList.add('lux-plate'));
}

// Tabelas largas rolam dentro do próprio container, nunca empurram a página
function envolverTabelas(raiz) {
    raiz.querySelectorAll('table').forEach(t => {
        if (t.parentElement.classList.contains('table-scroll')) return;
        const box = document.createElement('div');
        box.className = 'table-scroll';
        t.replaceWith(box);
        box.appendChild(t);
    });
}

// ------------------------------------------------------------------
//  Índice da página, montado a partir dos próprios títulos
// ------------------------------------------------------------------
function montarIndice(raiz) {
    const titulos = [...raiz.querySelectorAll('h2, h3')];
    const caixa = document.getElementById('indice');
    const nav = document.getElementById('indice-nav');
    if (!caixa || !nav || titulos.length < 3) return;   // página curta não precisa

    nav.innerHTML = titulos.map((h, i) => {
        if (!h.id) h.id = 'sec-' + i + '-' + (h.textContent.trim().toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40));
        h.style.scrollMarginTop = '90px';
        return '<a href="#' + h.id + '" class="nivel-' + h.tagName[1] + '">' +
            esc(h.textContent.trim()) + '</a>';
    }).join('');
    caixa.hidden = false;

    const links = [...nav.querySelectorAll('a')];
    const obs = new IntersectionObserver(entradas => {
        entradas.forEach(e => {
            if (!e.isIntersecting) return;
            links.forEach(a => a.classList.toggle('ativo', a.getAttribute('href') === '#' + e.target.id));
        });
    }, { rootMargin: '-90px 0px -72% 0px' });
    titulos.forEach(h => obs.observe(h));
}
