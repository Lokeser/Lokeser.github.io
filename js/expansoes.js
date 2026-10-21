// js/expansoes.js
// Expansões (livros) do RPG. Cada livro libera um conjunto de arquivos;
// enquanto o livro não estiver marcado, esses arquivos somem do site:
// links e cards escondidos, página bloqueada no viewer e opções fora da ficha.
// A escolha fica no navegador e, com login, em <pasta da nuvem>/_expansoes.json.

var WNJExp = window.WNJExp || (() => {
    const LIVROS = [
        {
            id: 'sol-lua', num: 1, titulo: 'O Sol e a Lua', tom: 'sol-lua',
            frase: 'Duas luzes sempre olharam para Luxsandoria. Poucos aprenderam a olhar de volta.',
            lore: [
                'Desde a primeira Era, o Sol e a Lua governam mais do que o dia e a noite. A mana que desce da Lua é a mais pura que existe: fria, silenciosa, capaz de imobilizar o que toca. Estudiosos dedicaram vidas inteiras a ela, e a Princesa da Lua criou, há mais de treze mil anos, a esgrima que ainda leva o seu nome.',
                'O Sol oferece o caminho oposto. Quem aprende a absorver a mana solar a funde ao próprio Núcleo e o aprimora, ficando mais quente, mais forte e mais difícil de apagar. Os portadores de um Espírito Solar ou Lunar são raros, sempre treinados por um Anomalítico, e carregam o ciclo dos dois astros pelo resto da vida.',
                'Este livro apresenta as **Classes Únicas**: Caminho da Lua e Caminho do Sol. Elas acompanham o personagem do Rank 10 ao Rank 3, substituindo a Classe Inicial, a Avançada e a Absoluta. No Rank 8, o caminho se divide e você escolhe a sua subclasse.'
            ],
            conteudo: [
                { grupo: 'Classes Únicas', itens: ['Caminho da Lua (Rank 10 → 3)', 'Caminho do Sol (Rank 10 → 3)'] },
                { grupo: 'Subclasses da Lua (Rank 8)', itens: ['Tsukihime no Kenjutsu', 'Tsukihime Akatsuki', 'Mártir Lunar ✦ com Sagromaldição', 'Avatar do Eclipse ✦ com Sagromaldição'] },
                { grupo: 'Subclasses do Sol (Rank 8)', itens: ['Shiki no Kenjutsu'] },
                { grupo: 'Também neste livro', itens: ['Lorde Lunar', 'Lorde Solar', 'Tsukihime Kaminotsuki'] }
            ],
            arquivos: [
                'contents/classes/classes_iniciais/Classes_Extras/Caminho_Lunar.md',
                'contents/classes/classes_iniciais/Classes_Extras/Caminho_Solar.md',
                'contents/classes/classes_secretas/Tsukihime_NoKenjutsu.md',
                'contents/classes/classes_secretas/Shiki_NoKenjutsu.md',
                'contents/classes/classes_absolutas/Lorde_Lunar.md',
                'contents/classes/classes_absolutas/Lorde_Solar.md',
                'contents/classes/classes_absolutas/Tsukihime_Akatsuki.md',
                'contents/classes/classes_absolutas/Tsukihime_Kaminotsuki.md',
                'contents/classes/classes_absolutas/MartirLunar.md',
                'contents/classes/classes_absolutas/Avatar_doEclipse.md'
            ]
        },
        {
            id: 'sagromaldicao', num: 2, titulo: 'Sagromaldição', tom: 'sagro',
            frase: 'Nem toda força vem da Mana. Algumas vêm de quem acredita, e outras de quem desistiu de acreditar.',
            lore: [
                'Além do plano onde a Mana corre pelas veias do mundo existem outras camadas da existência. Numa delas pulsa o **Caos**, a respiração indomada do universo, que desconstrói e reconstrói a realidade sem pedir licença. Na outra ressoa a **Fé**, o coro de almas unidas por um propósito, que transforma a crença alheia em poder.',
                'Pouquíssimos nascem capazes de sentir esses planos. As **Bruxas** ouvem o Caos desde o berço, como um sussurro que nunca se cala. Os **Devotos** sentem o peso das preces ao seu redor e aprendem a carregá-las. Os dois deixam de evoluir pela Mana: crescem pelos Níveis Nox e pelos Níveis Sagrados, e a própria Vida passa a vir dos laços que criam.',
                'Este livro libera as magias de Caos e Fé, as raças que conseguem tocá-las e as Classes Absolutas forjadas no encontro entre os dois lados.'
            ],
            conteudo: [
                { grupo: 'Raças', itens: ['Bruxa (necessária para a magia do Caos)', 'Devoto (necessário para a magia da Fé)'] },
                { grupo: 'Magias', itens: ['Caos e os Níveis Nox', 'Fé e os Níveis Sagrados'] },
                { grupo: 'Classes', itens: ['Avatar do Eclipse', 'Mártir Lunar', 'Inquisitor'] }
            ],
            arquivos: [
                'contents/racas/Bruxa.md', 'contents/racas/Devoto.md',
                'contents/magias/Caos/', 'contents/magias/Fe/',
                'contents/classes/classes_absolutas/Avatar_doEclipse.md',
                'contents/classes/classes_absolutas/MartirLunar.md',
                'contents/classes/classes_secretas/Paladino_Papa.md'
            ]
        },
        {
            id: 'elfica', num: 3, titulo: 'Supremacia Élfica', tom: 'elfica',
            frase: 'Em Fareverus, oito mil anos são uma vida. E uma vida inteira é tempo demais para perdoar.',
            lore: [
                'Fareverus é governada pelos **Elfos Superiores**, a linhagem mais próxima da Mana que já caminhou sobre o mundo. Seus corpos são quase entidades mágicas: o Núcleo deles conversa com a mana do ambiente como quem respira, e cada gesto carrega um controle que outras raças levam séculos para imitar. Vivem até oito mil anos, e lembram de tudo.',
                'Os **Elfos Negros** são a sua contraparte. Têm menos controle e muito mais intensidade: a mana deles queima em vez de fluir. Foram banidos pelos Superiores e, desde então, as duas linhagens se odeiam. Um Elfo Negro poderia viver tanto quanto um Superior, mas quase nenhum chega lá; a própria mana descontrolada os consome antes.',
                'Este livro abre os mistérios de Fareverus, suas linhagens e o treinamento milenar que purifica o Núcleo no Monte da Travessia.'
            ],
            conteudo: [
                { grupo: 'Raças', itens: ['Elfo Superior', 'Elfo Negro'] },
                { grupo: 'Classes Herdadas', itens: ['Mana Purificada'] },
                { grupo: 'Em construção', itens: ['W.I.P'], wip: true }
            ],
            arquivos: [
                'contents/racas/ElfoSuperior.md', 'contents/racas/ElfoNegro.md',
                'contents/classes/classes_iniciais/Classes_Extras/Mana_Purificada.md'
            ]
        },
        {
            id: 'bestas', num: 4, titulo: 'Mitologia das Bestas', tom: 'bestas',
            frase: 'Antes das cidades de Demópolis, havia covis. E antes dos covis, havia reis com escamas.',
            lore: [
                'Demópolis guarda a cultura mais antiga do mundo. Foi o lar das bestas mais fortes que já existiram, e o sangue delas ainda corre adormecido em linhagens que se dizem humanas. Dragões, fênix, kitsunes e cérberos deixaram herdeiros, e às vezes esse sangue decide acordar.',
                'Durante a Era Real, Demópolis travou contra Wohali uma guerra que redesenhou o continente. O que restou dela são ruínas, juramentos e os **Demi-Humanos Mitológicos**, que carregam no corpo a memória das criaturas que lutaram ao lado de seus ancestrais.',
                'Este livro traz as linhagens mitológicas, o Dragão de Ouro entre elas, o fluxo de mana dos dragões e os povos ancestrais que sobreviveram à guerra.'
            ],
            conteudo: [
                { grupo: 'Raças', itens: ['Demi-Humano Mitológico (linhagens, incluindo Dragão de Ouro)', 'Hypnoriano', 'Rekel Ancestral', 'Insectoide'] },
                { grupo: 'Classes Herdadas', itens: ['Mana Dracônica'] },
                { grupo: 'Em construção', itens: ['W.I.P'], wip: true }
            ],
            arquivos: [
                'contents/racas/Secreta-Mitologico.md', 'contents/racas/Mitologico/',
                'contents/racas/Humano-Hypnoriano.md',
                'contents/racas/Secreta-RekelAncestral.md', 'contents/racas/Secreta-Insectoide.md',
                'contents/classes/classes_iniciais/Classes_Extras/Mana_Draconica.md'
            ]
        },
        {
            id: 'artes-ocultas', num: 5, titulo: 'As 12 Artes Ocultas', tom: 'artes',
            frase: 'Cada estilo aqui pertenceu a alguém que o mundo decidiu esquecer.',
            lore: [
                'Houve uma época em que doze mestres lendários lutavam de formas que ninguém mais conseguia copiar. Seus estilos não eram técnicas: eram filosofias inteiras, presas ao corpo, à mente e ao Núcleo de quem as criou. Quando os mestres se foram, as artes viraram segredo, guardadas por discípulos, pergaminhos e espíritos.',
                'Hoje, quem encontra uma Arte Oculta encontra também o peso de quem a criou. Alguns estilos sobreviveram quase inteiros; de outros restam fragmentos, como as Shadow Arts, o mais fraco dos conhecimentos dos antigos Umbralordes.',
                'Este livro libera as classes consideradas Artes Ocultas e as Classes Extras que abrem o caminho até elas.'
            ],
            conteudo: [
                { grupo: 'Artes Ocultas', itens: ['Combativo Imaginário', 'Ecomago', 'Mestre das Marionetes', 'Musicista', 'Yunnuen no Kenjutsu', 'Hikari Ken', 'Oráculo', 'Embaixador Cósmico'] },
                { grupo: 'Em construção', itens: ['A Lâmina Centenária / As 100 Lâminas', 'Cronomante', 'Umbralorde'], wip: true },
                { grupo: 'Classes Extras', itens: ['Notas Mágicas (Musicista)', 'Caminho Visionário (Oráculo)', 'Caminho Astral (Embaixador Cósmico)'] },
                { grupo: 'Também neste livro', itens: ['Jūryoku Ken', 'Yunnuen True Kenjutsu', 'Humano Variante — Convertido'] }
            ],
            arquivos: [
                'contents/classes/classes_secretas/Combativo_Imaginario.md',
                'contents/classes/classes_secretas/Ecomago.md',
                'contents/classes/classes_secretas/MestreDasMarionetes.md',
                'contents/classes/classes_secretas/Musicista.md',
                'contents/classes/classes_iniciais/Classes_Extras/NotasMagicas.md',
                'contents/classes/classes_secretas/Yunnuen_NoKenjutsu.md',
                'contents/classes/classes_absolutas/Yunnuen_TrueKenjutsu.md',
                'contents/classes/classes_secretas/HikariKen.md',
                'contents/classes/classes_secretas/JuryokuKen.md',
                'contents/classes/classes_absolutas/Oraculo.md',
                'contents/classes/classes_iniciais/Classes_Extras/Caminho_Visionario.md',
                'contents/classes/classes_secretas/Embaixador',
                'contents/classes/classes_iniciais/Classes_Extras/Caminho_Astral.md',
                'contents/racas/Secreta-HumanoConvertido.md'
            ]
        }
    ];

    // raiz do site, a partir deste próprio arquivo (js/expansoes.js)
    const RAIZ_SITE = ((document.currentScript && document.currentScript.src) || '').replace(/js\/expansoes\.js.*$/, '');
    const CHAVE = 'wnj_expansoes';
    function ativos() {
        try { const v = JSON.parse(localStorage.getItem(CHAVE) || '[]'); return Array.isArray(v) ? v : []; }
        catch (e) { return []; }
    }
    const ativo = (id) => ativos().includes(id);

    // Caminho de repositório a partir de um href (link direto ou viewer.html?file=)
    function caminhoDe(href) {
        try {
            const u = new URL(href, location.href);
            const f = u.searchParams.get('file');
            const p = f || u.pathname;
            return decodeURIComponent(p).replace(/^\/+/, '').replace(/^.*?(contents\/)/, '$1');
        } catch (e) { return ''; }
    }
    const pertence = (livro, caminho) => livro.arquivos.some(a => caminho === a || (!a.endsWith('.md') && caminho.startsWith(a)));
    const livrosDe = (caminho) => LIVROS.filter(l => pertence(l, caminho));
    // Bloqueado se algum livro dono do arquivo estiver desmarcado
    function bloqueio(caminho) {
        if (!caminho) return null;
        const at = ativos();
        return livrosDe(caminho).find(l => !at.includes(l.id)) || null;
    }
    const liberado = (caminho) => !bloqueio(caminho);
    // Arquivo de livro marcado deixa de ser "secreto" (não precisa do desbloqueio de 7 cliques)
    const deLivroAtivo = (caminho) => { const ls = livrosDe(caminho); return ls.length > 0 && ls.every(l => ativo(l.id)); };

    // Remove da config o que está bloqueado (raças, classes, magias e as escolhas internas)
    function filtrarConfig(cfg) {
        const limpa = (lista) => (lista || []).filter(x => !x.arquivo || liberado(x.arquivo)).map(x => {
            const y = Object.assign({}, x);
            if (y.arquivo && deLivroAtivo(y.arquivo)) delete y.secreta;
            if (y.subracas) y.subracas = limpa(y.subracas);
            if (y.subclasses) y.subclasses = limpa(y.subclasses);
            return y;
        });
        ['racas', 'classes_iniciais', 'classes_avancadas', 'classes_absolutas', 'magias'].forEach(k => { if (cfg[k]) cfg[k] = limpa(cfg[k]); });
        return cfg;
    }

    // ---------- PÁGINA ----------
    function aplicar() {
        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href');
            if (!href || href.startsWith('#') || /^(https?:)?\/\//.test(href) && !href.includes(location.host)) return;
            const b = bloqueio(caminhoDe(href));
            // card sozinho numa coluna do grid: some a coluna inteira, sem deixar buraco
            const pai = a.parentElement;
            const alvo = a.closest('[data-exp-card]') ||
                (pai && pai.children.length === 1 && /\bcol\b|\bcol-/.test(pai.className) ? pai : a);
            alvo.classList.toggle('wnj-exp-oculto', !!b);
        });
        // grupo que ficou sem nenhum card some junto com o rótulo logo acima
        document.querySelectorAll('.wnj-exp-vazio').forEach(e => e.classList.remove('wnj-exp-vazio', 'wnj-exp-oculto'));
        new Set([...document.querySelectorAll('.wnj-exp-oculto')].map(e => e.parentElement)).forEach(g => {
            if (!g || g === document.body || [...g.children].some(c => !c.classList.contains('wnj-exp-oculto'))) return;
            g.classList.add('wnj-exp-vazio', 'wnj-exp-oculto');
            const rot = g.previousElementSibling;
            if (rot && rot.matches('.subgroup-label, h3, h4, .grupo-titulo')) rot.classList.add('wnj-exp-vazio', 'wnj-exp-oculto');
        });
        if (!document.getElementById('wnj-exp-css')) {
            const st = document.createElement('style');
            st.id = 'wnj-exp-css';
            st.textContent = '.wnj-exp-oculto{display:none!important}';
            document.head.appendChild(st);
        }
        // página de um livro desmarcado (no viewer ou um menu próprio, como o da Fé)
        const b = bloqueio(caminhoDe(location.href));
        if (b) bloquearViewer(b);
    }
    function bloquearViewer(livro) {
        if (document.getElementById('wnj-exp-trava')) return;
        const prefixo = RAIZ_SITE || location.pathname.replace(/[^/]*$/, '');
        const box = document.createElement('div');
        box.id = 'wnj-exp-trava';
        box.style.cssText = 'position:fixed;inset:0;z-index:2500;display:grid;place-items:center;padding:16px;background:rgba(6,9,15,.92);backdrop-filter:blur(6px)';
        box.innerHTML = '<div style="max-width:440px;text-align:center;font-family:Lora,serif;color:#e8eef5">' +
            '<div style="font-family:Cinzel,serif;letter-spacing:2px;color:#c5a059;font-size:.8rem">Livro ' + livro.num + '</div>' +
            '<h2 style="font-family:Cinzel,serif;margin:6px 0 12px;font-size:1.6rem">' + livro.titulo + '</h2>' +
            '<p style="line-height:1.6;color:#b9c6d4">Este conteúdo faz parte de uma expansão que não está ativa na sua conta. Ative o livro para ver esta página, criar personagens com ele e encontrá-lo nos menus.</p>' +
            '<a href="' + prefixo + 'expansoes.html#' + livro.id + '" style="display:inline-block;margin-top:14px;padding:10px 18px;border:1px solid #c5a059;border-radius:999px;color:#f0d17a;text-decoration:none;font-family:Cinzel,serif">Ver as Expansões</a></div>';
        document.body.appendChild(box);
    }

    // ---------- SALVAR / NUVEM ----------
    const caminhoNuvem = () => {
        const c = (typeof WNJAuth !== 'undefined') ? WNJAuth.credenciais() : {};
        return c.user ? 'contents/personagens/' + c.user.trim().toLowerCase() + '/_expansoes.json' : '';
    };
    const nuvemOk = () => typeof WNJAuth !== 'undefined' && WNJAuth.podeEditar() && !!caminhoNuvem();
    function gravarLocal(lista) {
        localStorage.setItem(CHAVE, JSON.stringify(lista));
        localStorage.setItem(CHAVE + '_t', new Date().toISOString());
    }
    async function definir(id, ligado) {
        const s = new Set(ativos());
        if (ligado) s.add(id); else s.delete(id);
        gravarLocal([...s]);
        aplicar();
        if (nuvemOk()) {
            try {
                await WNJAuth.salvarArquivo(caminhoNuvem(), JSON.stringify({ ativos: [...s], atualizado: localStorage.getItem(CHAVE + '_t') }, null, 2),
                    'Expansões (' + WNJAuth.credenciais().user + ')');
            } catch (e) { console.warn('Falha ao salvar as expansões na nuvem', e); }
        }
    }
    // Traz da nuvem a escolha mais recente (uma vez por sessão, ou quando pedido)
    async function puxar(forcar) {
        if (!nuvemOk()) return false;
        if (!forcar && sessionStorage.getItem('wnj_exp_puxado')) return false;
        sessionStorage.setItem('wnj_exp_puxado', '1');
        try {
            const { texto } = await WNJAuth.lerArquivo(caminhoNuvem());
            if (!texto) return false;
            const d = JSON.parse(texto);
            const tl = new Date(localStorage.getItem(CHAVE + '_t') || 0).getTime();
            if (Array.isArray(d.ativos) && new Date(d.atualizado || 0).getTime() > tl &&
                JSON.stringify([...d.ativos].sort()) !== JSON.stringify(ativos().sort())) {
                localStorage.setItem(CHAVE, JSON.stringify(d.ativos));
                localStorage.setItem(CHAVE + '_t', d.atualizado);
                return true;
            }
        } catch (e) { console.warn('Falha ao ler as expansões da nuvem', e); }
        return false;
    }

    return { LIVROS, ativos, ativo, definir, puxar, aplicar, bloqueio, liberado, filtrarConfig, caminhoDe };
})();
