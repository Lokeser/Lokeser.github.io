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
        const vida = text.match(/Aumento de Vida por Estrela:\*\*\s*\*\*([^*\n]+)\*\*/i);
        const mag = text.match(/Aumento de Mag[íi]culas por Estrela:\*\*\s*\*\*([^*\n]+)\*\*/i);
        return {
            dr: dr ? parseInt(dr[1], 10) : null,
            er: er ? parseInt(er[1], 10) : null,
            vidaEstrela: vida ? vida[1].trim() : null,
            magEstrela: mag ? mag[1].trim() : null
        };
    }

    // ---------- ROLAGEM DE FÓRMULAS ("Corpo×d8 + VR", "Mana×d2 + 2", "1d4 + Mana") ----------
    // contexto = { corpo: 7, mana: 3, ..., vr: 6 }
    function rolarFormula(formula, contexto) {
        if (!formula) return null;
        const norm = formula
            .toLowerCase()
            .replace(/valor de vida da ra[çc]a\s*\(vr\)/g, 'vr')
            .replace(/valor de vida da ra[çc]a/g, 'vr')
            .replace(/×/g, ' ')          // "corpo×d6" -> "corpo d6"
            .replace(/\bx\b/g, ' ');     // "corpo x d6" -> "corpo d6"
        let total = 0;
        const partes = [];
        const rolagens = [];
        for (const bruto of norm.split('+')) {
            const termo = bruto.trim();
            if (!termo) continue;
            const dado = termo.match(/^([a-zà-ú]+|\d+)\s*d(\d+)$/i);
            if (dado) {
                const qtd = /^\d+$/.test(dado[1]) ? parseInt(dado[1], 10) : Math.max(0, contexto[dado[1]] || 0);
                const lados = parseInt(dado[2], 10);
                let soma = 0;
                const dice = [];
                for (let i = 0; i < qtd; i++) {
                    const r = 1 + Math.floor(Math.random() * lados);
                    dice.push(r); soma += r;
                }
                total += soma;
                rolagens.push({ termo: qtd + 'd' + lados, dados: dice, soma });
                partes.push(qtd + 'd' + lados + ' = ' + soma + (dice.length ? ' [' + dice.join(', ') + ']' : ''));
            } else if (/^\d+$/.test(termo)) {
                total += parseInt(termo, 10);
                partes.push('+' + termo);
            } else {
                const v = contexto[termo] || 0;
                total += v;
                partes.push(termo + ' = ' + v);
            }
        }
        return { total, partes, rolagens };
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

    // Certas classes especiais definem a Arcana fora da progressao de rank.
    // O Embaixador, por exemplo, a desperta no valor de seu maior atributo.
    function calcArcanaPersonagem(cfg, char, atributos) {
        const classe = (cfg.classes_iniciais || []).find(x => x.nome === char.classeInicial) ||
            (cfg.classes_avancadas || []).find(x => x.nome === char.classeAvancada);
        if (classe && classe.arcana === 'maior_atributo') {
            return Math.max(0, ...Object.values(atributos || {}).map(v => Number(v) || 0));
        }
        return calcArcana(cfg, char.rank);
    }

    function calcCA(cfg, atributos, rank) {
        const attr = cfg.formulas.ca_atributo;
        // +1 de CA na primeira estrela de cada rank novo (R9..R3) => (10 - rank)
        const bonusRank = (cfg.formulas.ca_por_rank !== false && rank) ? (10 - rank) : 0;
        return (cfg.formulas.ca_base || 10) + (attr ? (atributos[attr] || 0) : 0) + bonusRank;
    }

    // Deslocamento automático = perícia Deslocamento (+ base opcional do config)
    function calcDeslocamento(cfg, atributos, periciaDesloc) {
        const attr = cfg.formulas.deslocamento_atributo;
        return (cfg.formulas.deslocamento_base || 0) + (attr ? (atributos[attr] || 0) : 0) + (periciaDesloc || 0);
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
    // Arquivo da raça — se ela tiver linhagens (sub-raças), usa o da escolhida.
    function arquivoRaca(cfg, char) {
        const e = (cfg.racas || []).find(x => x.nome === char.raca);
        if (!e) return null;
        if (e.subracas && char.subRaca) {
            const s = e.subracas.find(x => x.nome === char.subRaca);
            if (s) return s.arquivo;
        }
        return e.arquivo;
    }

    // Uma classe com especializações lê sempre o arquivo-base e, depois,
    // o da escolha atual. Assim os poderes universais e os personalizados
    // coexistem na ficha sem duplicar a classe inteira.
    function arquivosClasse(cfg, lista, nome, subNome) {
        const e = (lista || []).find(x => x.nome === nome);
        if (!e) return [];
        const arquivos = e.arquivo ? [e.arquivo] : [];
        if (e.subclasses && subNome) {
            const s = e.subclasses.find(x => x.nome === subNome);
            if (s && s.arquivo) arquivos.push(s.arquivo);
        }
        return arquivos;
    }

    async function poderesAutomaticos(cfg, char) {
        const arquivos = [];
        const rc = arquivoRaca(cfg, char); if (rc) arquivos.push(rc);
        arquivos.push(...arquivosClasse(cfg, cfg.classes_iniciais, char.classeInicial, char.subClasseInicial));
        arquivos.push(...arquivosClasse(cfg, cfg.classes_avancadas, char.classeAvancada, char.subClasseAvancada));
        const mg = (cfg.magias || []).find(x => x.nome === char.magia);
        if (mg) {
            arquivos.push(mg.arquivo);
            // Magias com subclasse (as Artes do Ki) também carregam os poderes da base
            if (mg.base) arquivos.push(mg.base);
        }
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
    // Os personagens ficam no IndexedDB (centenas de MB) e não mais no
    // localStorage (~5 MB, que enchia com poucas imagens em HD). Uma cópia em
    // memória mantém listar()/obter()/salvar() síncronos; cada página chama
    // "await WNJ.pronto()" antes de ler. A gravação no disco é assíncrona;
    // "await WNJ.gravado()" antes de sair da página quando importa.
    // Segurança mantida: leitura ruim nunca vira gravação destrutiva, e cada
    // gravação guarda a versão anterior como backup.
    const KEY = 'wnj_personagens';                        // chaves antigas (localStorage)
    const KEY_BAK = 'wnj_personagens_backup';
    const KEY_BAK2 = 'wnj_personagens_backup2';
    const BANCO = 'wnj', LOJA = 'dados';
    let cache = [], backupIdb = null, leituraFalhou = false, semBanco = false;
    let ultimaGravacao = Promise.resolve(true), _pronto = null;
    const canal = ('BroadcastChannel' in window) ? new BroadcastChannel('wnj_personagens') : null;
    const ouvintes = [];

    function abrirBanco() {
        return new Promise((ok, erro) => {
            const req = indexedDB.open(BANCO, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(LOJA);
            req.onsuccess = () => ok(req.result);
            req.onerror = () => erro(req.error);
        });
    }
    async function idb(modo, fn) {
        const db = await abrirBanco();
        return new Promise((ok, erro) => {
            const tx = db.transaction(LOJA, modo);
            const req = fn(tx.objectStore(LOJA));
            tx.oncomplete = () => { db.close(); ok(req ? req.result : undefined); };
            tx.onerror = tx.onabort = () => { db.close(); erro(tx.error); };
        });
    }
    const idbLer = (k) => idb('readonly', l => l.get(k));
    const idbGravar = (k, v) => idb('readwrite', l => l.put(v, k));
    const idbApagar = (k) => idb('readwrite', l => l.delete(k));

    function lerLocalStorage() {
        for (const k of [KEY, KEY_BAK, KEY_BAK2]) {
            try { const v = JSON.parse(localStorage.getItem(k) || 'null'); if (Array.isArray(v) && v.length) return v; } catch (e) {}
        }
        return null;
    }
    // Abre o banco, migra o que estava no localStorage (uma vez) e libera aquele espaço
    function pronto() {
        if (_pronto) return _pronto;
        _pronto = (async () => {
            try {
                let lista = await idbLer('personagens');
                backupIdb = (await idbLer('personagens_backup')) || null;
                const antigos = lerLocalStorage();
                if (!Array.isArray(lista)) {
                    lista = antigos || [];
                    if (antigos) await idbGravar('personagens', antigos);
                } else if (antigos) {
                    // junta o que só existia no localStorage: nada se perde na migração
                    const ids = new Set(lista.map(c => c.id));
                    const faltam = antigos.filter(c => c && c.id && !ids.has(c.id));
                    if (faltam.length) { lista = lista.concat(faltam); await idbGravar('personagens', lista); }
                }
                if (antigos) [KEY, KEY_BAK, KEY_BAK2].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
                cache = lista;
                if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
            } catch (e) {
                // Sem IndexedDB (alguns modos privados): segue com o localStorage, como antes
                console.warn('IndexedDB indisponível; usando localStorage.', e);
                semBanco = true;
                cache = lerLocalStorage() || [];
            }
        })();
        return _pronto;
    }
    // Outra aba gravou: recarrega o cache e avisa a página
    if (canal) canal.onmessage = async () => {
        try { cache = (await idbLer('personagens')) || cache; } catch (e) {}
        ouvintes.forEach(fn => { try { fn(); } catch (e) {} });
    };
    function aoMudar(fn) { ouvintes.push(fn); }

    // Cópia para quem chama: mexer no objeto não altera o cache até salvar().
    // A imagem (string grande e imutável) é reaproveitada em vez de copiada.
    function copia(c) {
        if (!c || typeof c !== 'object') return c;
        const o = JSON.parse(JSON.stringify(Object.assign({}, c, { img: undefined })));
        if (c.img) o.img = c.img;
        return o;
    }

    function listar() { return cache.map(copia); }

    function gravar(lista) {
        const anterior = cache;
        cache = lista.map(copia);
        if (semBanco) {
            try { localStorage.setItem(KEY, JSON.stringify(cache)); return true; }
            catch (e) {
                cache = anterior;
                alert('⚠️ Não consegui salvar: o armazenamento deste navegador encheu.\n\n' +
                      'Seus personagens antigos continuam salvos. Baixe as fichas em .html ou envie para a nuvem.');
                return false;
            }
        }
        ultimaGravacao = ultimaGravacao.then(async () => {
            try {
                await idbGravar('personagens_backup', anterior);
                await idbGravar('personagens', cache);
                backupIdb = anterior;
                if (canal) canal.postMessage('mudou');
                return true;
            } catch (e) {
                console.error('Falha ao gravar personagens', e);
                alert('⚠️ Não consegui salvar os personagens neste navegador (' + ((e && e.name) || 'erro') + ').\n\n' +
                      'O disco pode estar cheio. Baixe as fichas em .html ou envie para a nuvem.');
                return false;
            }
        });
        return true;
    }
    const gravado = () => ultimaGravacao;

    function salvar(char) {
        if (leituraFalhou) return false;
        const todos = listar();
        const i = todos.findIndex(c => c.id === char.id);
        char.atualizado = new Date().toISOString();
        if (i >= 0) todos[i] = char; else todos.push(char);
        return gravar(todos);
    }
    function excluir(id) {
        if (leituraFalhou) return false;
        return gravar(listar().filter(c => c.id !== id));
    }
    function obter(id) {
        const c = cache.find(x => x.id === id);
        return c ? copia(c) : null;
    }

    // ---------- RASCUNHO DA CRIAÇÃO ----------
    // O texto continua no localStorage (o botão "Voltar à criação" lê de lá);
    // a imagem vai para o IndexedDB para não estourar a cota.
    function guardarRascunho(char) {
        const semImg = Object.assign({}, char, { img: null, _temImg: !!char.img });
        try { localStorage.setItem('wnj_draft', JSON.stringify(semImg)); } catch (e) {}
        if (!semBanco) idbGravar('rascunho_img', char.img || null).catch(() => {});
    }
    async function lerRascunho() {
        let r = null;
        try { r = JSON.parse(localStorage.getItem('wnj_draft') || 'null'); } catch (e) {}
        if (!r) return null;
        if (r._temImg && !semBanco) { try { r.img = await idbLer('rascunho_img'); } catch (e) {} }
        delete r._temImg;
        return r;
    }
    function apagarRascunho() {
        ['wnj_draft', 'wnj_draft_oculto'].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
        if (!semBanco) idbApagar('rascunho_img').catch(() => {});
    }

    // ---------- RECUPERAÇÃO ----------
    // Procura fichas fora da lista: backup do banco, chaves antigas do
    // localStorage e o rascunho da criação.
    function pareceFicha(o) {
        return o && typeof o === 'object' && !Array.isArray(o) &&
            (o.atributos || o.pericias || o.periciasDelta) &&
            ('rank' in o || 'nome' in o);
    }
    function varrerRecuperaveis() {
        const achados = [];
        const vistos = new Set(cache.map(c => c.id));
        const considerar = (origem, v) => {
            (Array.isArray(v) ? v : [v]).forEach(c => {
                if (!pareceFicha(c)) return;
                if (!c.id) c.id = 'rec' + Math.random().toString(36).slice(2, 9);
                if (vistos.has(c.id)) return;
                vistos.add(c.id);
                achados.push({ origem, char: c });
            });
        };
        if (backupIdb) considerar('backup automático', backupIdb);
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            try { considerar(k, JSON.parse(localStorage.getItem(k))); } catch (e) {}
        }
        return achados;
    }
    function restaurar(chars) {
        const todos = listar();
        let n = 0;
        chars.forEach(c => {
            if (!todos.some(x => x.id === c.id)) { todos.push(c); n++; }
        });
        if (n) gravar(todos);
        return n;
    }

    function novoPersonagem() {
        return {
            id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            criado: new Date().toISOString(),
            img: null,
            nome: '', sobrenome: '',
            raca: '', subRaca: '', classeInicial: '', subClasseInicial: '', classeAvancada: '', subClasseAvancada: '', magia: '',
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

    // ---------- PALETA POR MAGIA ----------
    // Cores tematicas usadas no card Visualizar e no .html exportado.
    // animado=true -> borda/acentos com gradiente em movimento.
    const PALETAS = {
        fogo:    { nome: 'Fogo',    acentos: ['#ff5a3c'],                       fundo1: '#4a0d05', fundo2: '#1d0502', animado: false },
        agua:    { nome: 'Água',    acentos: ['#4aa3ff'],                       fundo1: '#06213f', fundo2: '#020e1d', animado: false },
        terra:   { nome: 'Terra',   acentos: ['#ff9040'],                       fundo1: '#4a2405', fundo2: '#1d0e02', animado: false },
        vento:   { nome: 'Vento',   acentos: ['#52d273'],                       fundo1: '#0b3d1e', fundo2: '#04180b', animado: false },
        raio:    { nome: 'Raio',    acentos: ['#b05aff'],                       fundo1: '#2d0a4e', fundo2: '#12041f', animado: false },
        anomala: { nome: 'Anômala', acentos: ['#6fd4ff', '#b05aff', '#ff4d6d'], fundo1: '#0a0a14', fundo2: '#000000', animado: true },
        ki:      { nome: 'Ki',      acentos: ['#ff2e2e', '#1a0000', '#ff6b4a'], fundo1: '#3d0715', fundo2: '#12010a', animado: true },
        fe:      { nome: 'Fé',      acentos: ['#ffe27a', '#d4a017', '#fff6c9'], fundo1: '#4a3805', fundo2: '#1d1502', animado: true },
        caos:    { nome: 'Caos',    acentos: ['#0d0212', '#9d5cff', '#3b1266'], fundo1: '#2e1b4e', fundo2: '#120a22', animado: true },
        neutro:  { nome: '',        acentos: ['#58A0C8'],                       fundo1: '#113F67', fundo2: '#081e33', animado: false }
    };
    function paletaMagia(nomeMagia) {
        const n = String(nomeMagia || '').toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '');
        let chave = 'neutro';
        if (n.includes('fogo')) chave = 'fogo';
        else if (n.includes('agua')) chave = 'agua';
        else if (n.includes('terra')) chave = 'terra';
        else if (n.includes('vento')) chave = 'vento';
        else if (n.includes('raio')) chave = 'raio';
        else if (n.includes('anomal')) chave = 'anomala';
        else if (n.startsWith('ki')) chave = 'ki';
        else if (n === 'fe' || n.startsWith('fe ') || n.startsWith('fe—') || n.startsWith('fe -')) chave = 'fe';
        else if (n.includes('caos')) chave = 'caos';
        return Object.assign({ chave }, PALETAS[chave]);
    }

    // Dois maiores atributos (para "Atributo Principal + Secundário")
    function atributosPrincipais(cfg, atributosTotais) {
        const ordenados = cfg.atributos
            .map(a => ({ id: a.id, nome: a.nome, cor: a.cor, valor: atributosTotais[a.id] || 0 }))
            .sort((x, y) => y.valor - x.valor);
        return [ordenados[0], ordenados[1]];
    }

    return {
        fetchMD, config, parsePoderes, parseRankDados, parseRaca,
        calcPericias, elegivel, dadosRank, calcVida, calcArcana, calcArcanaPersonagem, calcCA,
        calcDeslocamento, calcMagiculas, poderesAutomaticos, textoEstrela,
        tagDaFonte, listar, salvar, excluir, obter, novoPersonagem,
        paletaMagia, atributosPrincipais, rolarFormula, arquivoRaca, arquivosClasse,
        varrerRecuperaveis, restaurar, pronto, gravado, aoMudar,
        guardarRascunho, lerRascunho, apagarRascunho
    };
})();
