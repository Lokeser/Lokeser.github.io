// ==================================================================
//  LUXSANDORIA — notas de margem (tooltips) e utilidades de interface
//
//  As definições abaixo vêm dos .md de regras do próprio sistema.
//  Nenhuma regra inventada: termo sem definição confiável não ganha
//  tooltip — fica sem, e pronto.
//
//  Uso:  <span class="lux-term" data-termo="er">ER</span>
//  ou deixe o marcador automático achar os termos dentro de .prose.
// ==================================================================
const LuxUI = (() => {

    const BASE = (() => {
        const p = location.pathname;
        return p.includes('/contents/')
            ? '../'.repeat((p.split('contents/')[1] || '').split('/').length)
            : '';
    })();

    // ---- Glossário (fonte: contents/regras/**) ----
    const TERMOS = {
        dr: {
            nome: 'Dado de Rank (DR)',
            def: 'O dado que seu Rank concede. Entra nos testes e no cálculo de dano, na forma ERdX + Atributo.',
            link: 'contents/ranks/ranks_menu.html'
        },
        er: {
            nome: 'Eficiência de Rank (ER)',
            def: 'Mede o quanto o personagem é competente. Soma-se a todos os testes de uma perícia em que você é Profissional, e multiplica os dados de dano (ERdX + Atributo).',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/EficienciaRank.md'
        },
        magiculas: {
            nome: 'Magículas',
            def: 'A mana dentro do corpo, gasta para conjurar magias e usar habilidades. A quantidade parte do seu atributo Mana e cresce com o Rank.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/Magiculas.md'
        },
        pericia: {
            nome: 'Perícia',
            def: 'Toda perícia distribui exatamente 4 pontos de escala entre um ou dois atributos (4/0, 3/1 ou 2/2). A escala é o treino — não há proficiência à parte. Teto universal: 80.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/Pericias.md'
        },
        critico: {
            nome: 'Acerto Crítico',
            def: 'Quando o DR sai no valor máximo, todo o dano é dobrado. A faixa que conta como crítico muda conforme o Rank.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/Critico.md'
        },
        pa: {
            nome: 'Pontos de Afeição (PA)',
            def: 'Medem conexão, confiança e proximidade entre personagens. Sobem com interações positivas e destravam benefícios — pensado sobretudo para a relação com sua Arcana.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/PontosAfeicaoPA.md'
        },
        rank: {
            nome: 'Rank',
            def: 'A hierarquia de poder, do Rank 10 (Deceri) ao Rank 3 (Ark). Cada Rank define seu DR, sua ER e os poderes que você recebe.',
            link: 'contents/ranks/ranks_menu.html'
        },
        estrela: {
            nome: 'Estrela',
            def: 'Cada Rank tem 5 estrelas. Subir uma estrela concede poderes e aumenta Vida e Magículas conforme a fórmula do Rank.',
            link: 'contents/ranks/ranks_menu.html'
        },
        corpo: {
            nome: 'Corpo',
            def: 'Força, resistência física e vigor. Define a Vida e a capacidade de carga.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/Atributos/Corpo.md'
        },
        tecnica: {
            nome: 'Técnica',
            def: 'Precisão, agilidade e domínio motor. Base da Classe de Armadura.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/Atributos/Tecnica.md'
        },
        intelecto: {
            nome: 'Intelecto',
            def: 'Raciocínio, memória e estudo. Governa Erudição, Análise e Arcanismo.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/Atributos/Intelecto.md'
        },
        carisma: {
            nome: 'Carisma',
            def: 'Presença, persuasão e influência sobre os outros.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/Atributos/Carisma.md'
        },
        sabedoria: {
            nome: 'Sabedoria',
            def: 'Percepção, intuição e veterania. Não é upável: cresce +1 por Saga.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/Atributos/Sabedoria.md'
        },
        mana: {
            nome: 'Mana',
            def: 'A capacidade mágica bruta. Define suas Magículas e alimenta as magias.',
            link: 'viewer.html?file=contents/regras/Regras_Gerais/Atributos/Mana.md'
        },
        ca: {
            nome: 'Classe de Armadura (CA)',
            def: 'O quanto é difícil acertar você. Parte de 10, soma Técnica e melhora a cada Rank.'
        },
        dano: {
            nome: 'Tipos de Dano',
            def: 'Cada fonte de dano tem um tipo, e cada tipo encontra resistências diferentes.',
            link: 'viewer.html?file=contents/regras/Regras_Combate/Tipos_Dano.md'
        },
        resistencia: {
            nome: 'Resistência',
            def: 'Reduz o dano de um tipo específico, em níveis (I a V). Consulte a tabela para os valores exatos.',
            link: 'viewer.html?file=contents/regras/Regras_Combate/Tipos_Resistencia.md'
        },
        condicao: {
            nome: 'Condições',
            def: 'Estados que alteram o que um personagem pode fazer. Divididas em Adversas (simples), Adversas Graves (evoluídas) e Especiais, como Machucado e Transformado.',
            link: 'viewer.html?file=contents/regras/Regras_Combate/Tipos_Condicoes.md'
        },
        arcana: {
            nome: 'Arcana',
            def: 'A entidade ligada ao seu personagem. A relação com ela evolui por Pontos de Afeição.'
        },
        vr: {
            nome: 'Valor de Vida da Raça (VR)',
            def: 'O valor que sua raça acrescenta às rolagens de Vida ao subir de estrela.'
        },
        estagio: {
            nome: 'Estágio',
            def: 'O degrau de uma habilidade dentro do seu pilar. A partir do 2º estágio, exige até duas habilidades do estágio anterior.',
            link: 'contents/habilidades/habilidades_menu.html'
        }
    };

    // ---- O balão ----
    let balao = null, alvoAtual = null, timer = null;

    function criarBalao() {
        if (balao) return balao;
        balao = document.createElement('div');
        balao.id = 'lux-tip';
        balao.setAttribute('role', 'tooltip');
        balao.hidden = true;
        document.body.appendChild(balao);
        // Deixa o ponteiro entrar no balão para clicar no link
        balao.addEventListener('mouseenter', () => clearTimeout(timer));
        balao.addEventListener('mouseleave', esconder);
        return balao;
    }

    function posicionar(alvo) {
        const r = alvo.getBoundingClientRect();
        const b = balao.getBoundingClientRect();
        const m = 10;
        // Prefere acima; se não couber, vai abaixo
        let top = r.top - b.height - 8;
        if (top < m) top = r.bottom + 8;
        let left = r.left + r.width / 2 - b.width / 2;
        // Reposiciona para não ser cortado pelas bordas
        left = Math.max(m, Math.min(left, window.innerWidth - b.width - m));
        balao.style.top = Math.round(top) + 'px';
        balao.style.left = Math.round(left) + 'px';
    }

    function mostrar(alvo) {
        const t = TERMOS[alvo.dataset.termo];
        if (!t) return;
        criarBalao();
        alvoAtual = alvo;
        balao.innerHTML =
            '<div class="tip-name">' + esc(t.nome) + '</div>' +
            '<div>' + esc(t.def) + '</div>' +
            (t.link ? '<a class="tip-more" href="' + BASE + t.link + '">Ver regra completa →</a>' : '');
        balao.hidden = false;
        balao.dataset.open = 'true';
        if (!alvo.id) alvo.id = 'lux-t' + Math.random().toString(36).slice(2, 8);
        balao.id = 'lux-tip';
        alvo.setAttribute('aria-describedby', 'lux-tip');
        posicionar(alvo);
    }

    function esconder() {
        if (!balao) return;
        balao.dataset.open = 'false';
        balao.hidden = true;
        if (alvoAtual) alvoAtual.removeAttribute('aria-describedby');
        alvoAtual = null;
    }

    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // ---- Ligação dos eventos (delegada: funciona com conteúdo dinâmico) ----
    function ligar() {
        const abrir = (e) => {
            const alvo = e.target.closest('.lux-term[data-termo]');
            if (!alvo) return;
            clearTimeout(timer);
            // Pequeno atraso: evita balões acidentais ao varrer a página
            const atraso = e.type === 'focusin' ? 0 : 220;
            timer = setTimeout(() => mostrar(alvo), atraso);
        };
        const fechar = (e) => {
            const alvo = e.target.closest('.lux-term[data-termo]');
            if (!alvo) return;
            clearTimeout(timer);
            timer = setTimeout(esconder, 160);
        };
        document.addEventListener('mouseover', abrir);
        document.addEventListener('mouseout', fechar);
        document.addEventListener('focusin', abrir);
        document.addEventListener('focusout', fechar);
        // Toque: alterna
        document.addEventListener('click', (e) => {
            const alvo = e.target.closest('.lux-term[data-termo]');
            if (alvo) { e.preventDefault(); alvoAtual === alvo ? esconder() : mostrar(alvo); return; }
            if (!e.target.closest('#lux-tip')) esconder();
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') esconder(); });
        window.addEventListener('scroll', esconder, { passive: true });
        window.addEventListener('resize', esconder);
    }

    // ---- Marcação automática dentro de um container ----
    // Só marca a PRIMEIRA ocorrência de cada termo, para não poluir o texto.
    const PADROES = [
        [/\bER\b/, 'er'], [/\bDR\b/, 'dr'],
        [/\bMag[íi]culas?\b/i, 'magiculas'],
        [/\bPontos de Afei[çc][ãa]o\b/i, 'pa'],
        [/\bClasse de Armadura\b/i, 'ca'],
        [/\bResist[êe]ncia\b/i, 'resistencia']
    ];
    function marcar(container) {
        if (!container) return;
        const usados = new Set();
        const alvos = container.querySelectorAll('p, li, td');
        for (const el of alvos) {
            if (el.querySelector('.lux-term, a, code')) continue;
            for (const [re, chave] of PADROES) {
                if (usados.has(chave) || !re.test(el.textContent)) continue;
                const m = el.innerHTML.match(re);
                if (!m) continue;
                el.innerHTML = el.innerHTML.replace(re,
                    '<span class="lux-term" data-termo="' + chave + '" tabindex="0">' + m[0] + '</span>');
                usados.add(chave);
            }
        }
    }

    function init() {
        criarBalao(); ligar();
        // Avisa quem carregou antes (o loader do viewer, por exemplo)
        document.dispatchEvent(new CustomEvent('lux-ui-pronto'));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    return { TERMOS, marcar, esconder, base: BASE };
})();
