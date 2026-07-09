// js/sistema.js
// Motor do sistema Watashi no Jinsei / Luxsandoria V2.
// Le os .md do site em tempo real (config, racas, classes, magias, ranks),
// extrai os marcadores <!--#poder ...--> e calcula os valores automaticos
// da ficha. Editar os numeros nos .md atualiza a ficha automaticamente.

const WNJ = (() => {

    const _cache = {};

    async function fetchMD(path) {
        if (_cache[path]) return _cache[path];
        const res = await fetch(path);
        if (!res.ok) throw new Error('Não foi possível ler ' + path);
        const text = await res.text();
        _cache[path] = text;
        return text;
    }

    // ---------- CONFIG ----------
    let _config = null;
    async function config() {
        if (_config) return _config;
        const text = await fetchMD('contents/sistema/config.md');
        const m = text.match(/```json\s*([\s\S]*?)```/);
        if (!m) throw new Error('Bloco JSON não encontrado em config.md');
        _config = JSON.parse(m[1]);
        return _config;
    }

    // ---------- PODERES ----------
    // <!--#poder id=".." fonte=".." rank=".." estrela=".." nome=".."--> ... <!--#fim-->
    function parsePoderes(text) {
        const out = [];
        const re = /<!--#poder\s+([^>]*?)-->([\s\S]*?)<!--#fim-->/g;
        let m;
        while ((m = re.exec(text)) !== null) {
            const attrs = {};
            const attrRe = /(\w+)="([^"]*)"/g;
            let a;
            while ((a = attrRe.exec(m[1])) !== null) attrs[a[1]] = a[2];
            let corpo = m[2].trim();
            // remove a primeira linha de titulo (o nome ja esta no marcador)
            corpo = corpo.replace(/^#{2,4}\s+.*\n?/, '').trim();
            // remove separadores --- sobrando nas pontas
            corpo = corpo.replace(/^---\s*/, '').replace(/\s*---\s*$/, '').trim();
            out.push({
                id: attrs.id,
                fonte: attrs.fonte || 'extra',
                rank: attrs.rank ? parseInt(attrs.rank, 10) : null,
                estrela: attrs.estrela ? parseInt(attrs.estrela, 10) : 1,
                nome: attrs.nome || attrs.id,
                efeitoMD: corpo
            });
        }
        return out;
    }

    // ---------- RANK (DR / ER lidos do .md do rank) ----------
    function parseRankDados(text) {
        const dr = text.match(/Dado de Rank \(DR\):\*\*\s*\*\*d(\d+)/i);
        const er = text.match(/Efici[êe]ncia de Rank \(ER\):\*\*\s*\*\*(\d+)/i);
        return {
            dr: dr ? parseInt(dr[1], 10) : null,
            er: er ? parseInt(er[1], 10) : null
        };
    }

    // ---------- RAÇA (mods + vida lidos do .md da raça) ----------
    const NOME_ATTR = {
        'corpo': 'corpo', 'técnica': 'tecnica', 'tecnica': 'tecnica',
        'intelecto': 'intelecto', 'carisma': 'carisma',
        'sabedoria': 'sabedoria', 'mana': 'mana'
    };
    function parseRaca(text) {
        const r = { mods: {}, vidaBase: 20, vidaPasso: 6, vidaRacial: 6, md: 0, livre: false };
        const mods = text.match(/\*\*Modificadores raciais:\*\*\s*(.+)/);
        if (mods) {
            const tokenRe = /([+\-−])\s*(\d+)\s+([A-Za-zÀ-ÿ]+)/g;
            let t;
            while ((t = tokenRe.exec(mods[1])) !== null) {
                const attr = NOME_ATTR[t[3].toLowerCase()];
                if (attr) r.mods[attr] = (t[1] === '+' ? 1 : -1) * parseInt(t[2], 10);
            }
        } else if (/Molde 100% flex/i.test(text)) {
            r.livre = true; // Humano: jogador distribui os proprios mods
        }
        const vida = text.match(/\*\*Vida Base:\*\*\s*\*{0,2}(\d+)\s*\+\s*(\d+)\s*a cada 2 pontos/i);
        if (vida) { r.vidaBase = parseInt(vida[1], 10); r.vidaPasso = parseInt(vida[2], 10); }
        const vr = text.match(/\*\*Valor de Vida da Raça:\*\*\s*\*{0,2}(\d+)/i);
        if (vr) r.vidaRacial = parseInt(vr[1], 10);
        const md = text.match(/Magia Inicial \(MD\):\s*\*\*(\d+)/i);
        if (md) r.md = parseInt(md[1], 10);
        return r;
    }

    // ---------- PERÍCIAS ----------
    // valor = soma(peso * atributo). Negativo propaga naturalmente pelo peso.
    function calcPericias(cfg, atributos) {
        return cfg.pericias.map(p => {
            let v = 0;
            for (const [attr, peso] of Object.entries(p.pesos)) {
                v += peso * (atributos[attr] || 0);
            }
            return { nome: p.nome, valor: v, pesos: p.pesos };
        });
    }

    // ---------- ELEGIBILIDADE DE PODERES ----------
    // Ranks decrescem: 10 -> 3. Um poder e elegivel se o personagem ja passou
    // pelo rank dele (rank do poder > rank atual numericamente) ou se esta no
    // mesmo rank com estrelas suficientes.
    function elegivel(p, rank, estrela) {
        if (p.rank === null) return false;
        if (p.rank > rank) return true;
        if (p.rank === rank && p.estrela <= estrela) return true;
        return false;
    }

    // ---------- DADOS DERIVADOS ----------
    async function dadosRank(cfg, rankN) {
        const entry = cfg.ranks.find(r => r.n === rankN);
        if (!entry) return { dr: null, er: null };
        const text = await fetchMD(entry.arquivo);
        return parseRankDados(text);
    }

    function calcVida(raca, corpoTotal) {
        return raca.vidaBase + raca.vidaPasso * Math.floor(Math.max(0, corpoTotal) / 2);
    }

    function calcArcana(cfg, rankN) {
        let total = 0;
        for (const [r, bonus] of Object.entries(cfg.formulas.arcana_por_rank || {})) {
            if (parseInt(r, 10) >= rankN) total += bonus;
        }
        return total;
    }

    function calcCA(cfg, atributos) {
        const attr = cfg.formulas.ca_atributo;
        return (cfg.formulas.ca_base || 10) + (attr ? (atributos[attr] || 0) : 0);
    }

    function calcDeslocamento(cfg, atributos) {
        const attr = cfg.formulas.deslocamento_atributo;
        return (cfg.formulas.deslocamento_base || 9) + (attr ? (atributos[attr] || 0) : 0);
    }

    function calcMagiculas(cfg, atributos, er) {
        const f = (cfg.formulas.magiculas_iniciais || 'mana + er').toLowerCase();
        // avaliacao segura: apenas atributos e er como variaveis
        let expr = f;
        for (const [k, v] of Object.entries(atributos)) expr = expr.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
        expr = expr.replace(/\ber\b/g, er || 0);
        if (!/^[\d\s+\-*/().]+$/.test(expr)) return (atributos.mana || 0) + (er || 0);
        try { return Math.max(0, Math.floor(Function('"use strict";return (' + expr + ')')())); }
        catch (e) { return (atributos.mana || 0) + (er || 0); }
    }

    // ---------- FONTES DE PODERES DO PERSONAGEM ----------
    function tagDaFonte(fonte) {
        if (fonte === 'raca') return 'raca';
        if (fonte === 'magia') return 'magia';
        if (fonte === 'habilidade') return 'habilidade';
        if (fonte && fonte.startsWith('classe')) return 'classe';
        return 'extra';
    }

    // Busca todos os poderes automaticos elegiveis para o personagem.
    async function poderesAutomaticos(cfg, char) {
        const arquivos = [];
        const findArq = (lista, nome) => {
            const e = (lista || []).find(x => x.nome === nome);
            return e ? e.arquivo : null;
        };
        const rc = findArq(cfg.racas, char.raca); if (rc) arquivos.push(rc);
        const ci = findArq(cfg.classes_iniciais, char.classeInicial); if (ci) arquivos.push(ci);
        const ca = findArq(cfg.classes_avancadas, char.classeAvancada); if (ca) arquivos.push(ca);
        const mg = findArq(cfg.magias, char.magia); if (mg) arquivos.push(mg);
        const out = [];
        for (const arq of arquivos) {
            try {
                const text = await fetchMD(arq);
                for (const p of parsePoderes(text)) {
                    if (p.fonte === 'rank' || p.fonte === 'habilidade') continue;
                    if (elegivel(p, char.rank, char.estrela)) out.push(p);
                }
            } catch (e) { console.warn('Falha ao ler', arq, e); }
        }
        return out;
    }

    // Bloco de texto da estrela de um rank (para o popup de evolucao)
    async function textoEstrela(cfg, rankN, estrela) {
        const entry = cfg.ranks.find(r => r.n === rankN);
        if (!entry) return null;
        try {
            const text = await fetchMD(entry.arquivo);
            const p = parsePoderes(text).find(p => p.fonte === 'rank' && p.rank === rankN && p.estrela === estrela);
            return p ? p.efeitoMD : null;
        } catch (e) { return null; }
    }

    // ---------- ARMAZENAMENTO LOCAL ----------
    const KEY = 'wnj_personagens';
    function listar() {
        try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
        catch (e) { return []; }
    }
    function salvar(char) {
        const todos = listar();
        const i = todos.findIndex(c => c.id === char.id);
        char.atualizado = new Date().toISOString();
        if (i >= 0) todos[i] = char; else todos.push(char);
        localStorage.setItem(KEY, JSON.stringify(todos));
    }
    function excluir(id) {
        localStorage.setItem(KEY, JSON.stringify(listar().filter(c => c.id !== id)));
    }
    function obter(id) {
        return listar().find(c => c.id === id) || null;
    }

    function novoPersonagem() {
        return {
            id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            criado: new Date().toISOString(),
            img: null,
            nome: '', sobrenome: '',
            raca: '', classeInicial: '', classeAvancada: '', magia: '',
            rank: 10, estrela: 1,
            atributos: { corpo: 0, tecnica: 0, intelecto: 0, carisma: 0, sabedoria: 0, mana: 0 },
            vidaAtual: null, vidaMaxManual: null,
            magiculasAtual: null, magiculasMax: null,
            arcanaManual: null, caManual: null, deslocManual: null,
            overridesPericias: {},
            cargas: [],
            poderes: [],
            ataques: [],
            inventario: []
        };
    }

    return {
        fetchMD, config, parsePoderes, parseRankDados, parseRaca,
        calcPericias, elegivel, dadosRank, calcVida, calcArcana, calcCA,
        calcDeslocamento, calcMagiculas, poderesAutomaticos, textoEstrela,
        tagDaFonte, listar, salvar, excluir, obter, novoPersonagem
    };
})();
