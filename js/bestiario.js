// js/bestiario.js
// Regras do Bestiário em código (contents/bestiario/Monstro.md), a ficha de
// criatura em HTML, a rolagem de loot e o armazenamento:
//   privadas  -> IndexedDB deste navegador (WNJ.lerDado/gravarDado)
//   públicas  -> repositório: contents/bestiario/criaturas/<id>.json + catálogo

const WNJBest = (() => {
    const BASE = (() => {
        const p = location.pathname;
        return p.includes('/contents/') ? '../'.repeat((p.split('contents/')[1] || '').split('/').length) : '';
    })();
    const CATALOGO = 'contents/bestiario/criaturas.json';
    const PASTA = 'contents/bestiario/criaturas/';
    const CHAVE_PRIV = 'criaturas', CHAVE_TIPOS = 'tipos_criatura';

    // ---------- regras ----------
    const TIPOS_BASE = ['Besta', 'Goblinoide', 'Inseto', 'Aquático', 'Elemental', 'Espectral', 'Dracônico'];
    const RANKS = { 10: 'Deceri', 9: 'Novedo', 8: 'Octitus', 7: 'Arcana', 6: 'Coniuncta', 5: 'Unearta', 4: 'Verus', 3: 'Ark' };
    const DR = { 10: 20, 9: 22, 8: 24, 7: 26, 6: 28, 5: 30, 4: 32, 3: 35 };
    const ER = { 10: 1, 9: 2, 8: 3, 7: 4, 6: 5, 5: 6, 4: 7, 3: 7 };
    const PATAMARES = [   // Monstro.md, seção 5
        { rank: 10, min: 0, poderes: 1, estagio: 1 }, { rank: 9, min: 30, poderes: 2, estagio: 1 },
        { rank: 8, min: 80, poderes: 3, estagio: 2 }, { rank: 7, min: 150, poderes: 4, estagio: 2 },
        { rank: 6, min: 250, poderes: 5, estagio: 3 }, { rank: 5, min: 400, poderes: 6, estagio: 3 },
        { rank: 4, min: 650, poderes: 7, estagio: 4 }, { rank: 3, min: 950, poderes: 8, estagio: 4 }
    ];
    // Análise Matemática, 6.6: Vida de referência por Rank e papel
    const VIDA = { 10: [6, 18, 35, 140], 9: [12, 36, 73, 290], 8: [19, 58, 116, 466], 7: [28, 83, 166, 665],
                   6: [37, 112, 223, 892], 5: [47, 142, 284, 1135], 4: [57, 170, 340, 1359], 3: [57, 172, 343, 1372] };
    const PAPEIS = [['lacaio', 'Lacaio'], ['padrao', 'Padrão'], ['elite', 'Elite'], ['chefe', 'Chefe']];
    const ATRS = [
        { id: 'corpo', nome: 'Corpo', cor: '#e04343' }, { id: 'tecnica', nome: 'Técnica', cor: '#3fbf6a' },
        { id: 'intelecto', nome: 'Intelecto', cor: '#3a63d2' }, { id: 'carisma', nome: 'Carisma', cor: '#e6c15a' },
        { id: 'sabedoria', nome: 'Sabedoria', cor: '#a86af0' }, { id: 'mana', nome: 'Mana', cor: '#5ec8f0' }
    ];
    const PRESETS = [
        { nome: 'Garras', dado: 6, atr: 'tecnica', obs: 'Arma leve: funciona mesmo Agarrado.' },
        { nome: 'Mordida', dado: 8, atr: 'corpo', obs: '' },
        { nome: 'Chifres / Investida', dado: 10, atr: 'corpo', obs: 'Exige 6m de corrida; o alvo testa Corpo contra a CD Mágica ou fica Caído.' },
        { nome: 'Cauda', dado: 6, atr: 'corpo', obs: 'Alcance 3m.' },
        { nome: 'Ferrão', dado: 4, atr: 'tecnica', obs: 'O alvo testa Corpo contra a CD Mágica ou fica Envenenado.' }
    ];
    const TAGS = [
        { id: 'cristal', nome: 'Cristal de Mana', cor: '#58A0C8' }, { id: 'consumivel', nome: 'Consumível', cor: '#7fd08a' },
        { id: 'arma', nome: 'Arma', cor: '#e06a5a' }, { id: 'armadura', nome: 'Armadura', cor: '#9aa7b5' },
        { id: 'artefato', nome: 'Artefato', cor: '#f0c56b' }, { id: 'dinheiro', nome: 'Dinheiro', cor: '#e0c93f' },
        { id: 'comida', nome: 'Comida', cor: '#d98c3f' }, { id: 'missao', nome: 'Item de Missão', cor: '#c58cf6' },
        { id: 'outro', nome: 'Outro', cor: '#8fa3b5' }
    ];

    function nova() {
        return {
            id: '', nome: '', img: null, reino: 'animal', tipo: 'Besta', natureza: 'criatura',
            teto: 3, magMax: 4, papel: 'padrao', habitat: '', comportamento: '', descricao: '',
            atributos: { corpo: 1, tecnica: 1, intelecto: 0, carisma: 0, sabedoria: 1, mana: 2 },
            sobrescritas: {}, ataques: [], poderes: [], loot: [], publica: false
        };
    }

    // Todos os números derivados da criatura (sugestão; sobrescritas vencem)
    function calcular(c) {
        const mag = Math.max(0, +c.magMax || 0);
        let pat = PATAMARES[0];
        PATAMARES.forEach(p => { if (mag >= p.min) pat = p; });
        const teto = +c.teto || 3;
        const rank = Math.max(pat.rank, teto);           // número maior = mais fraco: o teto limita
        const patR = PATAMARES.find(p => p.rank === rank);
        const noTeto = pat.rank < teto;
        const extraR3 = rank === 3 ? Math.floor(Math.max(0, mag - 950) / 300) : 0;
        const monstro = c.natureza === 'monstro';
        const a = c.atributos || {};
        const pontos = 5 + Math.floor(mag / (monstro ? 50 : 25));
        const usados = ATRS.reduce((s, x) => s + (+a[x.id] || 0), 0);
        const dr = DR[rank], er = ER[rank];
        const papelI = Math.max(0, PAPEIS.findIndex(p => p[0] === c.papel));
        const sug = {
            vida: VIDA[rank][papelI],
            ca: 10 + (+a.tecnica || 0) + (10 - rank),
            cd: 10 + (+a.mana || 0) + er
        };
        const s = c.sobrescritas || {};
        return {
            mag, rank, nomeRank: RANKS[rank], dr, er, noTeto, monstro,
            poderesMax: patR.poderes + extraR3, estagioMax: patR.estagio,
            pontos, usados, sug,
            vida: s.vida != null && s.vida !== '' ? +s.vida : sug.vida,
            ca: s.ca != null && s.ca !== '' ? +s.ca : sug.ca,
            cd: s.cd != null && s.cd !== '' ? +s.cd : sug.cd,
            gv: monstro ? Math.max(1, Math.floor(mag / 50)) : 0,
            carga: Math.max(1, Math.floor(mag / (c.reino === 'etereo' ? 5 : 10))),
            proximo: PATAMARES.find(p => p.min > mag && p.rank >= teto) || null
        };
    }

    // ---------- dados ----------
    const d = (n) => 1 + Math.floor(Math.random() * n);
    // Refeição (Monstro.md, seção 5): ERd6 da presa + Mana da presa + Mana de quem come, com Dado Máximo
    function rolarRefeicao(rankPresa, manaPresa, manaPropria) {
        const er = ER[rankPresa] || 1, dados = [];
        for (let i = 0; i < er; i++) dados.push(d(6));
        const maximos = dados.filter(x => x === 6).length;
        const total = dados.reduce((s, x) => s + x, 0) + manaPresa * (1 + maximos) + manaPropria;
        return { dados, maximos, total, texto: er + 'd6 [' + dados.join(', ') + '] + Mana da presa ' + manaPresa + (maximos ? ' ×' + (1 + maximos) : '') + ' + Mana própria ' + manaPropria };
    }
    function rolarLoot(c) {
        const k = calcular(c);
        const caiu = [{ item: 'Cristal de Núcleo (carga ' + k.carga + ')', tag: 'cristal', rolagem: null }];
        (c.loot || []).forEach(l => {
            const r = d(100);
            if (r <= (+l.chance || 0)) caiu.push({ item: l.item, tag: l.tag, rolagem: r, obs: l.obs });
        });
        return caiu;
    }

    // ---------- ficha em HTML ----------
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const paragrafos = (t) => String(t || '').trim().split(/\n{2,}/).filter(Boolean).map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');
    const atrNome = (id) => (ATRS.find(a => a.id === id) || { nome: id }).nome;
    const tag = (id) => TAGS.find(t => t.id === id) || TAGS[TAGS.length - 1];
    const imgSrc = (c) => !c.img ? '' : (/^data:/.test(c.img) ? c.img : BASE + c.img);

    function ficha(c) {
        const k = calcular(c);
        const a = c.atributos || {};
        const marca = (txt, cls) => '<span class="cf-marca' + (cls ? ' ' + cls : '') + '">' + esc(txt) + '</span>';
        // A ficha mostra só o valor final; a sugestão aparece apenas no criador
        const val = (rot, v) => '<div class="cf-val"><span class="r">' + rot + '</span><b>' + esc(v) + '</b></div>';
        const ataques = (c.ataques || []).map(at => {
            const atr = +a[at.atr] || 0, atrA = +a[at.atrAtaque || 'tecnica'] || 0;
            const voraz = k.monstro ? ' + ' + k.gv + ' (Mordida Voraz)' : '';
            return '<li><div class="cf-li-topo"><b>' + esc(at.nome) + '</b><span class="cf-mono">d' + k.dr + ' + ' + (atrA + k.er) + ' para acertar</span></div>' +
                '<div>Dano <b>' + k.er + 'd' + at.dado + ' + ' + atr + '</b> (ERd' + at.dado + ' + ' + esc(atrNome(at.atr)) + ')' + voraz + '</div>' +
                (at.obs ? '<div class="cf-obs">' + esc(at.obs) + '</div>' : '') + '</li>';
        }).join('');
        const poderes = (c.poderes || []).map(p =>
            '<li><div class="cf-li-topo"><b>' + esc(p.nome) + '</b><span class="cf-mono">Estágio ' + esc(p.estagio || 1) + (p.custo ? ' · ' + esc(p.custo) + ' Magículas' : ' · passivo') + '</span></div>' +
            '<div class="cf-texto">' + paragrafos(p.efeito) + '</div></li>').join('');
        const loot = '<tr><td>Cristal de Núcleo (carga ' + k.carga + ')</td><td>' + marcaTag('cristal') + '</td><td>100%</td><td>Sempre.</td></tr>' +
            (c.loot || []).map(l => '<tr><td>' + esc(l.item) + '</td><td>' + marcaTag(l.tag) + '</td><td>' + esc(l.chance) + '%</td><td>' + esc(l.obs || '') + '</td></tr>').join('');
        return '<article class="cf">' +
            '<header class="cf-cab">' +
                (c.img ? '<div class="cf-img"><img src="' + esc(imgSrc(c)) + '" alt="' + esc(c.nome) + '"></div>' : '') +
                '<div class="cf-id"><h1>' + esc(c.nome || 'Criatura sem nome') + '</h1><div class="cf-marcas">' +
                    marca(k.monstro ? 'Monstro' : 'Criatura', k.monstro ? 'monstro' : 'criatura') +
                    marca('Rank ' + k.rank + ' ' + k.nomeRank) + marca(c.reino === 'etereo' ? 'Etéreo' : 'Animal') + marca(c.tipo || 'Sem tipo') +
                    marca('Papel: ' + (PAPEIS.find(p => p[0] === c.papel) || PAPEIS[1])[1]) + (c.publica ? '' : marca('Privada', 'privada')) +
                '</div>' + (c.descricao ? '<div class="cf-texto">' + paragrafos(c.descricao) + '</div>' : '') + '</div>' +
            '</header>' +
            '<div class="cf-grade">' +
                '<section class="cf-bloco"><h2>Núcleo</h2><div class="cf-vals">' +
                    val('Magículas máx.', k.mag) + val('Rank', k.rank) + val('Dado de Rank', 'd' + k.dr) + val('ER', k.er) +
                    val('Teto', 'Rank ' + (c.teto || 3)) + val('Carga do cristal', k.carga) +
                    val('Poderes', (c.poderes || []).length + ' / ' + k.poderesMax) + val('Estágio máx.', k.estagioMax) +
                '</div>' + (k.noTeto ? '<p class="cf-aviso">O núcleo chegou ao teto da espécie: comer mais não sobe o Rank.</p>' : '') + '</section>' +
                '<section class="cf-bloco"><h2>Combate</h2><div class="cf-vals">' +
                    val('Vida', k.vida) + val('CA', k.ca) + val('CD Mágica', k.cd) + val('Deslocamento', (c.deslocamento || 9) + 'm') +
                '</div></section>' +
            '</div>' +
            '<section class="cf-bloco"><h2>Atributos</h2><div class="cf-atrs">' + ATRS.map(x =>
                '<div class="cf-atr" style="--c:' + x.cor + '"><span>' + x.nome + '</span><b>' + (+a[x.id] || 0) + '</b></div>').join('') + '</div></section>' +
            (k.monstro ? '<section class="cf-bloco cf-voraz"><h2>Desejo Voraz</h2>' +
                '<p>Grau de Voracidade <b>' + k.gv + '</b>. Faro de Núcleo a <b>' + (k.gv * 10) + 'm</b>. Ataques naturais: <b>+' + k.gv + '</b> Saciado, <b>+' + (2 * k.gv) + '</b> Faminto, <b>+' + (3 * k.gv) + '</b> Voraz.</p></section>' : '') +
            (ataques ? '<section class="cf-bloco"><h2>Ataques</h2><ul class="cf-lista">' + ataques + '</ul></section>' : '') +
            (poderes ? '<section class="cf-bloco"><h2>Poderes de Núcleo</h2><ul class="cf-lista">' + poderes + '</ul></section>' : '') +
            (c.comportamento || c.habitat ? '<section class="cf-bloco"><h2>Comportamento</h2>' + (c.habitat ? '<p><b>Habitat:</b> ' + esc(c.habitat) + '</p>' : '') + '<div class="cf-texto">' + paragrafos(c.comportamento) + '</div></section>' : '') +
            '<section class="cf-bloco"><h2>Loot</h2><table class="cf-loot"><thead><tr><th>Item</th><th>Tipo</th><th>Chance</th><th>Observação</th></tr></thead><tbody>' + loot + '</tbody></table>' +
            '<div class="cf-rolar"><button type="button" class="btn btn--secondary" data-rolar-loot>Rolar loot</button><div class="cf-resultado" aria-live="polite"></div></div></section>' +
        '</article>';
    }
    const marcaTag = (id) => { const t = tag(id); return '<span class="cf-tag" style="--c:' + t.cor + '">' + esc(t.nome) + '</span>'; };
    function htmlLoot(caiu) {
        return '<ul>' + caiu.map(x => '<li>' + marcaTag(x.tag) + ' ' + esc(x.item) + (x.rolagem != null ? ' <small>(rolou ' + x.rolagem + ')</small>' : '') + '</li>').join('') + '</ul>';
    }

    // ---------- armazenamento ----------
    const slug = (s) => String(s || 'criatura').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'criatura';
    const novoId = (nome) => slug(nome) + '_' + Math.random().toString(36).slice(2, 6);
    const temToken = () => typeof WNJAuth !== 'undefined' && WNJAuth.credenciais().token;
    const podePublicar = () => typeof WNJAuth !== 'undefined' && WNJAuth.podeEditar();

    async function lerRepo(caminho) {
        if (temToken()) { const r = await WNJAuth.lerArquivo(caminho); return r.texto; }   // API: sempre a versão mais nova
        const res = await fetch(BASE + caminho + '?t=' + Date.now());
        return res.ok ? res.text() : null;
    }
    async function catalogo() {
        try { const t = await lerRepo(CATALOGO); const c = t ? JSON.parse(t) : {}; return { tipos: c.tipos || [], criaturas: c.criaturas || [] }; }
        catch (e) { console.warn('Catálogo do Bestiário indisponível', e); return { tipos: [], criaturas: [] }; }
    }
    async function privadas() { return (await WNJ.lerDado(CHAVE_PRIV)) || []; }
    async function tiposPrivados() { return (await WNJ.lerDado(CHAVE_TIPOS)) || []; }
    async function todosTipos() {
        const [cat, priv] = await Promise.all([catalogo(), tiposPrivados()]);
        return [...new Set(TIPOS_BASE.concat(cat.tipos, priv))].sort((x, y) => x.localeCompare(y, 'pt-BR'));
    }
    async function ler(id, fonte) {
        if (fonte === 'privada') return (await privadas()).find(c => c.id === id) || null;
        const t = await lerRepo(PASTA + id + '.json');
        return t ? JSON.parse(t) : null;
    }
    const resumo = (c) => {
        const k = calcular(c);
        return { id: c.id, nome: c.nome, reino: c.reino, tipo: c.tipo, natureza: c.natureza, rank: k.rank, papel: c.papel, img: /^data:/.test(c.img || '') ? null : c.img,
                 resumo: String(c.descricao || '').split('\n')[0].slice(0, 160), atualizado: c.atualizado };
    };

    async function salvarPrivada(c) {
        c.publica = false; c.atualizado = new Date().toISOString();
        if (!c.id) c.id = novoId(c.nome);
        const lista = await privadas();
        const i = lista.findIndex(x => x.id === c.id);
        if (i >= 0) lista[i] = c; else lista.push(c);
        await WNJ.gravarDado(CHAVE_PRIV, lista);
        if (c.tipo && !TIPOS_BASE.includes(c.tipo)) {
            const t = await tiposPrivados();
            if (!t.includes(c.tipo)) { t.push(c.tipo); await WNJ.gravarDado(CHAVE_TIPOS, t); }
        }
        return c;
    }
    async function publicar(c) {
        if (!podePublicar()) throw new Error('Entre com o GitHub (com permissão de edição) para publicar no Bestiário.');
        const dados = JSON.parse(JSON.stringify(c));
        if (!dados.id) dados.id = novoId(dados.nome);
        dados.publica = true; dados.atualizado = new Date().toISOString();
        dados.autor = WNJAuth.credenciais().user || '';
        const m = /^data:image\/([a-z0-9+]+);base64,(.*)$/i.exec(dados.img || '');
        if (m) {   // imagem em HD vai como arquivo próprio, fora do JSON
            const ext = { jpeg: 'jpg', 'svg+xml': 'svg' }[m[1].toLowerCase()] || m[1].toLowerCase();
            const caminho = PASTA + 'img/' + dados.id + '.' + ext;
            await WNJAuth.salvarArquivoBase64(caminho, m[2], 'Bestiário: imagem de ' + dados.nome);
            dados.img = caminho;
        }
        await WNJAuth.salvarArquivo(PASTA + dados.id + '.json', JSON.stringify(dados, null, 2), 'Bestiário: ' + dados.nome);
        const cat = await catalogo();
        const i = cat.criaturas.findIndex(x => x.id === dados.id);
        if (i >= 0) cat.criaturas[i] = resumo(dados); else cat.criaturas.push(resumo(dados));
        if (dados.tipo && !TIPOS_BASE.includes(dados.tipo) && !cat.tipos.includes(dados.tipo)) cat.tipos.push(dados.tipo);
        await WNJAuth.salvarArquivo(CATALOGO, JSON.stringify(cat, null, 2), 'Bestiário: catálogo (' + dados.nome + ')');
        // se ela era privada, sai da lista privada
        const priv = await privadas();
        if (priv.some(x => x.id === dados.id)) await WNJ.gravarDado(CHAVE_PRIV, priv.filter(x => x.id !== dados.id));
        return dados;
    }
    async function excluir(c, fonte) {
        if (fonte === 'privada') {
            await WNJ.gravarDado(CHAVE_PRIV, (await privadas()).filter(x => x.id !== c.id));
            return;
        }
        if (!podePublicar()) throw new Error('Só editores do repositório removem criaturas públicas.');
        const cat = await catalogo();
        cat.criaturas = cat.criaturas.filter(x => x.id !== c.id);
        await WNJAuth.salvarArquivo(CATALOGO, JSON.stringify(cat, null, 2), 'Bestiário: remove ' + c.nome);
        // apaga o arquivo da criatura (o histórico do Git guarda a versão antiga)
        const cr = WNJAuth.credenciais(), r = WNJAuth.repo();
        const url = 'https://api.github.com/repos/' + r.owner + '/' + r.repo + '/contents/' + PASTA + c.id + '.json';
        const atual = await fetch(url + '?t=' + Date.now(), { headers: { 'Authorization': 'token ' + cr.token, 'Accept': 'application/vnd.github+json' } });
        if (atual.ok) {
            const sha = (await atual.json()).sha;
            await fetch(url, { method: 'DELETE', headers: { 'Authorization': 'token ' + cr.token, 'Content-Type': 'application/json' },
                               body: JSON.stringify({ message: 'Bestiário: remove ' + c.nome, sha }) });
        }
    }

    return {
        BASE, TIPOS_BASE, RANKS, PAPEIS, ATRS, PRESETS, TAGS, ER,
        nova, calcular, rolarRefeicao, rolarLoot, ficha, htmlLoot, esc,
        catalogo, privadas, todosTipos, ler, salvarPrivada, publicar, excluir, podePublicar, imgSrc
    };
})();
