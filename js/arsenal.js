// js/arsenal.js
// Regras de criação de artefatos (raridade, conectividade, orçamento de poder,
// estrelas), a ficha do artefato em HTML e o armazenamento:
//   privados  -> IndexedDB deste navegador (WNJ.lerDado/gravarDado)
//   públicos  -> repositório: contents/arsenal/artefatos/<id>.json + catálogo
// Depende de bestiario.js (esc, ATRS, imgSrc) e de auth.js para publicar.

const WNJArsenal = (() => {
    const B = WNJBest, esc = B.esc;
    const CATALOGO = 'contents/arsenal/artefatos.json';
    const PASTA = 'contents/arsenal/artefatos/';
    const CHAVE_PRIV = 'artefatos';

    // ---------- raridades ----------
    // pontos: orçamento de modificadores (pequeno = 1, médio = 2, mudança de jogo = 2)
    const RARIDADES = [
        { id: 'incomum',  nome: 'Incomum',  cor: '#8fbf7a', pontos: 1, resumo: '1 modificador pequeno' },
        { id: 'raro',     nome: 'Raro',     cor: '#5aa9e6', pontos: 2, resumo: '2 modificadores pequenos ou 1 médio' },
        { id: 'epico',    nome: 'Épico',    cor: '#a678e8', pontos: 3, resumo: '1 mudança de jogo e 1 bônus' },
        { id: 'lendario', nome: 'Lendário', cor: '#e3b25a', estrelas: true, resumo: 'Poder base, atributo e traço único; evolui por 5 estrelas' },
        { id: 'mitico',   nome: 'Mítico',   cor: '#e0566b', estrelas: true, alem: true, resumo: 'Como o Lendário, com estrelas além da 5ª por Rank' },
        { id: 'fabula',   nome: 'Fábula',   cor: '#d9c8ff', divino: true, resumo: 'Item divino: Varinha, Asas, Lâmina ou Halo' }
    ];
    const RAR = Object.fromEntries(RARIDADES.map(r => [r.id, r]));
    const sempreConectivo = (r) => ['lendario', 'mitico', 'fabula'].includes(r);

    // ---------- arma-base ----------
    // Dados de Regras_Combate/Asenal/*.md
    const BASES = [
        { grupo: 'Armas pequenas', itens: [['Adaga', 'Cortante / Perfurante', 'tecnica', 4], ['Foice Curta', 'Cortante', 'tecnica', 6], ['Chakram', 'Cortante', 'tecnica', 4]] },
        { grupo: 'Armas médias', itens: [['Espada Curta', 'Cortante / Perfurante', 'tecnica', 8], ['Machado de Mão', 'Cortante', 'corpo', 8], ['Espada Longa', 'Cortante', 'corpo', 10],
            ['Katana', 'Cortante / Perfurante', 'corpo', 11], ['Maça', 'Contundente', 'corpo', 10], ['Lança', 'Perfurante', 'tecnica', 8], ['Mangual', 'Contundente', 'corpo', 8]] },
        { grupo: 'Armas grandes', itens: [['Espada Montante', 'Cortante', 'corpo', 12], ['Machado de Guerra', 'Cortante', 'corpo', 12], ['Martelo de Guerra', 'Contundente', 'corpo', 12],
            ['Lança de Cavalaria', 'Perfurante', 'corpo', 14], ['Foice Longa', 'Cortante', 'corpo', 12], ['Glaive', 'Cortante', 'corpo', 7]] },
        { grupo: 'Armas à distância', itens: [['Arco Curto', 'Perfurante', 'tecnica', 6], ['Arco Longo', 'Perfurante', 'tecnica', 8], ['Besta Pesada', 'Perfurante', 'tecnica', 14]] },
        { grupo: 'Focos mágicos', itens: [['Varinha', 'Mágico', 'mana', 6], ['Cajado', 'Mágico', 'mana', 8], ['Grimório', 'Mágico', 'intelecto', 6], ['Pêndulo', 'Mágico', 'sabedoria', 6], ['Orbe', 'Mágico', 'mana', 6]] },
        { grupo: 'Armaduras', itens: [['Armadura Leve', 'Defesa', 'tecnica', 0], ['Armadura Média', 'Defesa', 'corpo', 0], ['Armadura Pesada', 'Defesa', 'corpo', 0], ['Escudo', 'Defesa', 'corpo', 6]] },
        { grupo: 'Acessórios', itens: [['Anel', 'Acessório', 'mana', 0], ['Amuleto', 'Acessório', 'sabedoria', 0], ['Bracelete', 'Acessório', 'tecnica', 0], ['Capa', 'Acessório', 'tecnica', 0]] }
    ];
    // Fábula só existe nestas quatro formas
    const BASES_FABULA = [['Varinha Mágica', 'Mágico', 'mana', 8], ['Asas Angelicais', 'Divino', 'mana', 0], ['Lâmina Angelical', 'Cortante / Divino', 'tecnica', 12], ['Halo', 'Divino', 'sabedoria', 0]];
    const todasBases = () => BASES.flatMap(g => g.itens).concat(BASES_FABULA);
    const dadosBase = (nome) => { const b = todasBases().find(x => x[0] === nome); return b ? { tipoDano: b[1], atributo: b[2], dado: b[3] } : null; };

    // ---------- efeitos ----------
    // peso: quanto custa no orçamento (null = vaga própria, fora dos pontos)
    const EFEITOS = {
        acerto:      { nome: 'Acerto',               peso: 1, ajuda: '+1 em todos os ataques ou +2 em um ataque' },
        dano:        { nome: 'Dano elemental',       peso: 1, ajuda: '+1d4 de um elemento em todos os ataques' },
        condicional: { nome: 'Efeito condicional',   peso: 1, ajuda: 'Ex.: crítico ilumina o alvo por 1 turno' },
        ativa:       { nome: 'Habilidade ativa',     peso: 1, ajuda: 'Gasta Magículas ou tem usos por encontro' },
        passiva:     { nome: 'Habilidade passiva',   peso: 1, ajuda: 'Sempre ligada, pode ter condição' },
        atributo:    { nome: 'Bônus de atributo',    peso: 1, nucleo: true, ajuda: '+1 em um atributo do portador' },
        critico:     { nome: 'Crítico aprimorado',   peso: 1, ajuda: 'O crítico ganha um efeito, ou a margem cai 1' },
        gameplay:    { nome: 'Mudança de jogo',      peso: 2, fixo: true, ajuda: 'Muda como a arma é usada: alcance, ricochete, troca de dano, economia de ação' },
        modulo:      { nome: 'Módulo conectivo',     peso: null, nucleo: true, ajuda: 'Tempero pelo slot do núcleo: +1 em um ataque, +1d4 elemental, +1 em perícia ou um efeito pequeno' },
        base:        { nome: 'Poder base',           peso: null, ajuda: 'A mecânica forte que define o artefato' },
        caracteristica: { nome: 'Traço único',       peso: null, ajuda: 'Lore com efeito: quem pode empunhar, o que a arma faz sozinha' },
        divino:      { nome: 'Poder divino',         peso: null, ajuda: 'Nível de magia suprema; pode quebrar regras gerais' },
        secundario:  { nome: 'Poder secundário',     peso: null, ajuda: 'Poderes significativos que orbitam o divino' }
    };
    const EFEITOS_POR_RARIDADE = {
        incomum: ['acerto', 'dano', 'condicional', 'ativa', 'passiva', 'atributo', 'critico', 'modulo'],
        raro:    ['acerto', 'dano', 'condicional', 'ativa', 'passiva', 'atributo', 'critico', 'modulo'],
        epico:   ['gameplay', 'acerto', 'dano', 'condicional', 'ativa', 'passiva', 'atributo', 'critico', 'modulo'],
        lendario: ['base', 'atributo', 'caracteristica'],
        mitico:   ['base', 'atributo', 'caracteristica'],
        fabula:   ['divino', 'secundario']
    };
    const pesoDe = (e) => { const d = EFEITOS[e.tipo]; if (!d || d.peso == null) return 0; return d.fixo ? d.peso : (e.tamanho === 'medio' ? 2 : 1); };

    // ---------- estrelas ----------
    const TIPOS_ESTRELA = [
        [1, 'Aumento de acerto'], [2, 'Aumento de dano'], [3, 'Habilidade passiva'], [4, 'Habilidade ativa'],
        [5, 'Melhoria de habilidade'], [6, 'Bônus de atributo'], [7, 'Crítico aprimorado']
    ];
    const rankSugerido = (n) => n <= 5 ? '' : Math.max(3, 12 - n);   // 6ª → R6, 7ª → R5, 8ª → R4, 9ª+ → R3

    function novo() {
        return {
            id: '', nome: '', img: null, raridade: 'raro', conectividade: 'inconectivo',
            base: 'Espada Longa', tipoDano: 'Cortante', atributo: 'corpo', dado: 10,
            lore: '', linhaConexao: '', troca: '', condicao: '',
            requisitos: { rank: '', atributos: [], raca: '', classe: '', magia: '', outro: '' },
            efeitos: [], ataques: [], estrelas: [], publica: false
        };
    }
    // Ajusta o artefato quando a raridade muda (estrelas e conectividade fixa)
    function normalizar(a) {
        const r = RAR[a.raridade] || RAR.raro;
        if (sempreConectivo(a.raridade)) a.conectividade = 'conectivo';
        a.requisitos = Object.assign({ rank: '', atributos: [], raca: '', classe: '', magia: '', outro: '' }, a.requisitos);
        a.efeitos = a.efeitos || []; a.ataques = a.ataques || []; a.estrelas = a.estrelas || [];
        if (r.estrelas) {
            while (a.estrelas.length < 5) a.estrelas.push({ tipo: [3, 2, 6, 4, 5][a.estrelas.length], texto: '', rank: '' });
            if (!r.alem) a.estrelas.length = 5;
        }
        return a;
    }

    // ---------- orçamento ----------
    // Devolve os engastes (vagas de poder) e a lista de verificações da raridade.
    function orcamento(a) {
        const r = RAR[a.raridade] || RAR.raro, ef = a.efeitos || [];
        const conta = (t) => ef.filter(e => e.tipo === t).length;
        const checks = [], slots = [];
        const ok = (txt) => checks.push({ nivel: 'ok', txt }), aviso = (txt) => checks.push({ nivel: 'aviso', txt }), erro = (txt) => checks.push({ nivel: 'erro', txt });
        const conectivo = a.conectividade === 'conectivo';

        if (r.pontos) {
            const usados = ef.reduce((s, e) => s + pesoDe(e), 0);
            for (let i = 0; i < Math.max(r.pontos, usados); i++) slots.push({ rot: 'Modificador', cheio: i < usados, excesso: i >= r.pontos });
            if (usados === r.pontos) ok('Orçamento de ' + r.nome + ' cheio: ' + r.resumo + '.');
            else if (usados < r.pontos) aviso('Sobram ' + (r.pontos - usados) + ' ponto(s): ' + r.nome + ' comporta ' + r.resumo + '.');
            else if (String(a.troca || '').trim()) aviso('Acima do orçamento em ' + (usados - r.pontos) + ' ponto(s), justificado como troca equivalente.');
            else erro('Acima do orçamento em ' + (usados - r.pontos) + ' ponto(s). Corte um efeito ou explique a troca equivalente.');
            if (a.raridade === 'incomum' && ef.some(e => e.tamanho === 'medio' && !EFEITOS[e.tipo].fixo)) erro('Incomum não comporta modificador médio.');
            if (a.raridade === 'epico') (conta('gameplay') ? ok : erro)('Épico precisa de uma Mudança de jogo.');
            else if (conta('gameplay')) erro('Mudança de jogo é exclusiva do Épico.');
        }
        if (r.estrelas) {
            [['base', 'Poder base'], ['atributo', 'Bônus de atributo'], ['caracteristica', 'Traço único']].forEach(([t, n]) => {
                slots.push({ rot: n, cheio: conta(t) > 0, base: true });
                if (!conta(t)) erro('Falta o ' + n + ' do estado inicial.');
            });
            if (conta('base') > 1) aviso('Lendários têm um único Poder base; os outros poderes chegam pelas estrelas.');
            a.estrelas.forEach((s, i) => slots.push({ rot: (i + 1) + 'ª estrela', cheio: !!String(s.texto || '').trim(), estrela: true }));
            const vazias = a.estrelas.filter(s => !String(s.texto || '').trim()).length;
            if (vazias) aviso(vazias + ' estrela(s) sem efeito.'); else ok('Todas as estrelas preenchidas.');
            const tipos = new Set(a.estrelas.slice(0, 5).map(s => +s.tipo));
            if (tipos.size <= 2) aviso('As cinco estrelas usam só ' + tipos.size + ' tipo(s) de aumento. Misture para o artefato não ficar unidimensional.');
            if (r.alem && a.estrelas.slice(5).some(s => !s.rank)) erro('Estrelas além da 5ª precisam de um Rank mínimo.');
        }
        if (r.divino) {
            if (!BASES_FABULA.some(b => b[0] === a.base)) erro('Fábula só existe como Varinha Mágica, Asas Angelicais, Lâmina Angelical ou Halo.');
            slots.push({ rot: 'Poder divino', cheio: conta('divino') > 0, base: true });
            for (let i = 0; i < 3; i++) slots.push({ rot: 'Secundário', cheio: i < conta('secundario') });
            if (conta('divino') !== 1) erro('Fábula tem exatamente 1 Poder divino.');
            const s = conta('secundario');
            if (s < 2 || s > 3) erro('Fábula tem de 2 a 3 Poderes secundários (agora: ' + s + ').');
            if (!String(a.condicao || '').trim()) erro('Fábula precisa de uma condição de uso.');
        }
        const fora = ef.filter(e => !EFEITOS_POR_RARIDADE[a.raridade].includes(e.tipo));
        if (fora.length) aviso(fora.length + ' efeito(s) não fazem parte do esqueleto de ' + r.nome + ' (' + [...new Set(fora.map(e => (EFEITOS[e.tipo] || { nome: e.tipo }).nome))].join(', ') + '). Mude o tipo ou leve o efeito para uma estrela.');
        // conectividade
        const pedeNucleo = ef.filter(e => e.nucleo || (EFEITOS[e.tipo] || {}).nucleo);
        if (conectivo && r.pontos) {
            slots.push({ rot: 'Módulo conectivo', cheio: conta('modulo') > 0, modulo: true });
            if (!conta('modulo')) aviso('Conectivo ganha um Módulo conectivo pequeno pelo slot do núcleo.');
            if (conta('modulo') > 1) erro('Só um Módulo conectivo por artefato.');
        }
        if (!conectivo && pedeNucleo.length) erro('“' + (pedeNucleo[0].nome || EFEITOS[pedeNucleo[0].tipo].nome) + '” usa o núcleo do portador: o artefato precisa ser Conectivo.');
        if (conectivo && !sempreConectivo(a.raridade) && !pedeNucleo.length) aviso('Nenhum efeito usa o núcleo do portador. Ele poderia ser Inconectivo e não ocupar slot.');
        if (!String(a.nome || '').trim()) erro('Dê um nome ao artefato.');
        return { slots, checks, erros: checks.filter(c => c.nivel === 'erro').length };
    }

    // ---------- ficha ----------
    const txt = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
    const nomeAtr = (id) => (B.ATRS.find(x => x.id === id) || { nome: id }).nome;
    const linhaTopo = (a) => [(RAR[a.raridade] || {}).nome, a.conectividade === 'conectivo' ? 'Conectivo' : 'Inconectivo', a.base].filter(Boolean).join(' — ');
    function textoRequisitos(q) {
        const p = [];
        if (q.rank) p.push('Rank ' + q.rank + ' ou maior');
        (q.atributos || []).filter(x => x.atr && x.min !== '').forEach(x => p.push(nomeAtr(x.atr) + ' ' + x.min + '+'));
        ['raca', 'classe', 'magia'].forEach(k => { if (q[k]) p.push(q[k]); });
        if (String(q.outro || '').trim()) p.push(q.outro.trim());
        return p;
    }
    const estrelas = (n) => '★'.repeat(n);

    function ficha(a, opts) {
        opts = opts || {};
        const r = RAR[a.raridade] || RAR.raro;
        const q = textoRequisitos(a.requisitos || {});
        const efeitos = (a.efeitos || []).filter(e => e.texto || e.nome);
        const ataques = (a.ataques || []).filter(x => x.nome);
        const blocoEf = efeitos.length ? '<section class="af-bloco"><h2>' + (r.divino ? 'Poderes' : r.estrelas ? 'Estado inicial' : 'Efeitos') + '</h2><ul class="af-lista">' + efeitos.map(e =>
            '<li><div class="af-li-topo"><span class="af-tipo">' + esc(EFEITOS[e.tipo] ? EFEITOS[e.tipo].nome : e.tipo) + '</span><strong>' + esc(e.nome || '') + '</strong>' +
            (e.custo ? '<span class="af-custo">' + esc(e.custo) + '</span>' : '') + '</div>' +
            (e.texto ? '<p>' + txt(e.texto) + '</p>' : '') + '</li>').join('') + '</ul></section>' : '';
        const blocoAt = ataques.length ? '<section class="af-bloco"><h2>Ataques</h2><ul class="af-lista">' + ataques.map(x =>
            '<li><div class="af-li-topo"><strong>' + esc(x.nome) + '</strong>' + (x.custo ? '<span class="af-custo">' + esc(x.custo) + '</span>' : '') + '</div>' +
            '<p class="af-formula"><span>Acerto <b>DR + ' + esc(nomeAtr(x.atr)) + '</b></span>' + (+x.dado ? '<span>Dano <b>ERd' + esc(x.dado) + ' + ' + esc(nomeAtr(x.atr)) + '</b></span>' : '') + '</p>' +
            (x.efeito ? '<p>' + txt(x.efeito) + '</p>' : '') + '</li>').join('') + '</ul></section>' : '';
        const blocoEst = r.estrelas ? '<section class="af-bloco af-estrelas"><h2>Evolução por estrelas</h2><ol>' + (a.estrelas || []).map((s, i) =>
            '<li class="' + (String(s.texto || '').trim() ? '' : 'vazia') + (i === 4 ? ' apice' : '') + '"><span class="af-est">' + estrelas(i + 1) + '</span>' +
            '<div><div class="af-li-topo"><span class="af-tipo">' + esc((TIPOS_ESTRELA.find(t => t[0] === +s.tipo) || [0, ''])[1]) + '</span>' +
            (i >= 5 && s.rank ? '<span class="af-custo">Requer Rank ' + esc(s.rank) + '</span>' : '') + (i === 4 ? '<span class="af-custo">Ápice</span>' : '') + '</div>' +
            '<p>' + (String(s.texto || '').trim() ? txt(s.texto) : 'Ainda sem efeito.') + '</p></div></li>').join('') + '</ol></section>' : '';
        return '<article class="af" style="--rar:' + r.cor + '">' +
            '<header class="af-cab">' + (a.img ? '<div class="af-img"><img src="' + esc(B.imgSrc(a)) + '" alt="' + esc(a.nome) + '"></div>' : '') +
            '<div class="af-id"><h1>' + esc(a.nome || 'Artefato sem nome') + '</h1>' +
            '<p class="af-linha"><span class="af-rar">' + esc(r.nome) + '</span> — ' + esc(linhaTopo(a).split(' — ').slice(1).join(' — ')) +
            (opts.marcarPrivado ? ' <span class="af-priv">Privado</span>' : '') + '</p>' +
            (a.linhaConexao ? '<p class="af-conexao">' + txt(a.linhaConexao) + '</p>' : '') + '</div></header>' +
            (a.lore ? '<section class="af-bloco af-lore">' + String(a.lore).split(/\n{2,}/).map(p => '<p>' + txt(p) + '</p>').join('') + '</section>' : '') +
            '<section class="af-bloco"><h2>Características base</h2><dl class="af-dl">' +
            '<div><dt>Tipo</dt><dd>' + esc(a.tipoDano || '—') + '</dd></div><div><dt>Atributo</dt><dd>' + esc(nomeAtr(a.atributo)) + '</dd></div>' +
            (+a.dado ? '<div><dt>Dado</dt><dd>d' + esc(a.dado) + '</dd></div>' : '') +
            '<div class="largo"><dt>Requisitos</dt><dd>' + (q.length ? esc(q.join(', ')) : 'Nenhum') + '</dd></div>' +
            (a.conectividade === 'conectivo' ? '<div class="largo"><dt>Núcleo</dt><dd>Ocupa 1 slot de Conectivo. O portador vincula até ER Conectivos.</dd></div>' : '') +
            (r.divino && a.condicao ? '<div class="largo"><dt>Condição de uso</dt><dd>' + txt(a.condicao) + '</dd></div>' : '') +
            '</dl></section>' + blocoEf + blocoAt + blocoEst + '</article>';
    }

    // Texto curto para a ficha de personagem (inventário)
    function descricaoInventario(a) {
        const d = document.createElement('div');
        d.innerHTML = ficha(a);
        d.querySelectorAll('.af-cab, .af-lore').forEach(x => x.remove());
        return '<p><em>' + esc(linhaTopo(a)) + '</em></p>' + d.innerHTML;
    }

    // ---------- armazenamento ----------
    const slug = (s) => String(s || 'artefato').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'artefato';
    const novoId = (nome) => slug(nome) + '_' + Math.random().toString(36).slice(2, 6);
    const temToken = () => typeof WNJAuth !== 'undefined' && WNJAuth.credenciais().token;
    const podePublicar = () => typeof WNJAuth !== 'undefined' && WNJAuth.podeEditar();

    async function lerRepo(caminho) {
        if (temToken()) { const r = await WNJAuth.lerArquivo(caminho); return r.texto; }   // API: sempre a versão mais nova
        const res = await fetch(B.BASE + caminho + '?t=' + Date.now());
        return res.ok ? res.text() : null;
    }
    async function catalogo() {
        try { const t = await lerRepo(CATALOGO); const c = t ? JSON.parse(t) : {}; return { artefatos: c.artefatos || [] }; }
        catch (e) { console.warn('Catálogo do Arsenal indisponível', e); return { artefatos: [] }; }
    }
    async function privados() { return (await WNJ.lerDado(CHAVE_PRIV)) || []; }
    async function ler(id, fonte) {
        if (fonte === 'privada') return (await privados()).find(a => a.id === id) || null;
        const t = await lerRepo(PASTA + id + '.json');
        return t ? JSON.parse(t) : null;
    }
    const resumo = (a) => ({ id: a.id, nome: a.nome, raridade: a.raridade, conectividade: a.conectividade, base: a.base,
        img: /^data:/.test(a.img || '') ? null : a.img, resumo: String(a.lore || '').split('\n')[0].slice(0, 160), autor: a.autor || '', atualizado: a.atualizado });

    async function salvarPrivado(a) {
        a.publica = false; a.atualizado = new Date().toISOString();
        if (!a.id) a.id = novoId(a.nome);
        const lista = await privados();
        const i = lista.findIndex(x => x.id === a.id);
        if (i >= 0) lista[i] = a; else lista.push(a);
        await WNJ.gravarDado(CHAVE_PRIV, lista);
        return a;
    }
    async function publicar(a) {
        if (!podePublicar()) throw new Error('Entre com o GitHub (com permissão de edição) para publicar no Arsenal.');
        const dados = JSON.parse(JSON.stringify(a));
        if (!dados.id) dados.id = novoId(dados.nome);
        dados.publica = true; dados.atualizado = new Date().toISOString();
        dados.autor = WNJAuth.credenciais().user || '';
        const m = /^data:image\/([a-z0-9+]+);base64,(.*)$/i.exec(dados.img || '');
        if (m) {   // imagem em HD vai como arquivo próprio, fora do JSON
            const ext = { jpeg: 'jpg', 'svg+xml': 'svg' }[m[1].toLowerCase()] || m[1].toLowerCase();
            const caminho = PASTA + 'img/' + dados.id + '.' + ext;
            await WNJAuth.salvarArquivoBase64(caminho, m[2], 'Arsenal: imagem de ' + dados.nome);
            dados.img = caminho;
        }
        await WNJAuth.salvarArquivo(PASTA + dados.id + '.json', JSON.stringify(dados, null, 2), 'Arsenal: ' + dados.nome);
        const cat = await catalogo();
        const i = cat.artefatos.findIndex(x => x.id === dados.id);
        if (i >= 0) cat.artefatos[i] = resumo(dados); else cat.artefatos.push(resumo(dados));
        await WNJAuth.salvarArquivo(CATALOGO, JSON.stringify(cat, null, 2), 'Arsenal: catálogo (' + dados.nome + ')');
        const priv = await privados();
        if (priv.some(x => x.id === dados.id)) await WNJ.gravarDado(CHAVE_PRIV, priv.filter(x => x.id !== dados.id));
        return dados;
    }
    async function excluir(a, fonte) {
        if (fonte === 'privada') { await WNJ.gravarDado(CHAVE_PRIV, (await privados()).filter(x => x.id !== a.id)); return; }
        if (!podePublicar()) throw new Error('Só editores do repositório removem artefatos públicos.');
        const cat = await catalogo();
        cat.artefatos = cat.artefatos.filter(x => x.id !== a.id);
        await WNJAuth.salvarArquivo(CATALOGO, JSON.stringify(cat, null, 2), 'Arsenal: remove ' + a.nome);
        // apaga o arquivo do artefato (o histórico do Git guarda a versão antiga)
        const cr = WNJAuth.credenciais(), r = WNJAuth.repo();
        const url = 'https://api.github.com/repos/' + r.owner + '/' + r.repo + '/contents/' + PASTA + a.id + '.json';
        const atual = await fetch(url + '?t=' + Date.now(), { headers: { 'Authorization': 'token ' + cr.token, 'Accept': 'application/vnd.github+json' } });
        if (atual.ok) {
            const sha = (await atual.json()).sha;
            await fetch(url, { method: 'DELETE', headers: { 'Authorization': 'token ' + cr.token, 'Content-Type': 'application/json' },
                               body: JSON.stringify({ message: 'Arsenal: remove ' + a.nome, sha }) });
        }
    }

    return {
        RARIDADES, RAR, BASES, BASES_FABULA, EFEITOS, EFEITOS_POR_RARIDADE, TIPOS_ESTRELA, sempreConectivo, rankSugerido,
        novo, normalizar, orcamento, pesoDe, dadosBase, ficha, descricaoInventario, linhaTopo,
        catalogo, privados, ler, salvarPrivado, publicar, excluir, podePublicar
    };
})();
