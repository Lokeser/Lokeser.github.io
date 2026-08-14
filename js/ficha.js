// js/ficha.js
// Logica da ficha de personagem (criacao e edicao).
// Tudo que e "automatico" vem de WNJ (js/sistema.js), que le os .md do site.

(async function () {
    const $ = (id) => document.getElementById(id);
    const params = new URLSearchParams(location.search);
    const editId = params.get('id');
    const modoEdicao = !!editId;

    let cfg;
    try { cfg = await WNJ.config(); }
    catch (e) {
        console.error('Config do sistema falhou:', e);
        document.querySelector('.ficha-wrap').insertAdjacentHTML('afterbegin',
            '<div style="background:#7a1f1f;color:#ffd9d9;border-radius:10px;padding:14px 18px;margin-bottom:18px">' +
            'Erro ao carregar a configuração do sistema (contents/sistema/config.md): ' + e.message + '</div>');
        return;
    }

    let char = modoEdicao ? WNJ.obter(editId) : WNJ.novoPersonagem();
    if (modoEdicao && !char) { alert('Personagem não encontrado.'); location.href = 'personagem.html'; return; }
    // Rascunho: restaura a criação anterior se o usuário saiu no meio
    if (!modoEdicao) {
        try {
            const rasc = localStorage.getItem('wnj_draft');
            if (rasc) char = Object.assign(WNJ.novoPersonagem(), JSON.parse(rasc), { id: char.id });
        } catch (e) {}
    }
    // compatibilidade com fichas antigas
    char.pensamentos = char.pensamentos || [];
    char.titulo = char.titulo || '';
    char.tituloArtigo = char.tituloArtigo || '';
    if (modoEdicao) document.body.classList.add('modo-edicao');

    let racaInfo = { mods: {}, vidaBase: 20, vidaPasso: 6, vidaRacial: 6, livre: true };
    let rankInfo = { dr: 20, er: 1 };

    const CORES = {}; cfg.atributos.forEach(a => CORES[a.id] = a.cor);
    const NOMES = {}; cfg.atributos.forEach(a => NOMES[a.id] = a.nome);
    const TAGS = {}; cfg.tags_poder.forEach(t => TAGS[t.id] = t);
    const TAGS_INV = {}; cfg.tags_inventario.forEach(t => TAGS_INV[t.id] = t);

    let filtroPoder = 'todos';
    let filtroInv = 'todos';

    // ================= HELPERS =================
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    function attrsTotais() {
        const t = {};
        for (const a of cfg.atributos) {
            t[a.id] = (char.atributos[a.id] || 0) + (racaInfo.livre ? 0 : (racaInfo.mods[a.id] || 0));
        }
        return t;
    }
    function fmtMod(v) { return v > 0 ? '+' + v : String(v); }

    // ================= CARREGAMENTO DE FONTES =================
    async function carregarRaca() {
        const entry = cfg.racas.find(r => r.nome === char.raca);
        if (!entry) { racaInfo = { mods: {}, vidaBase: 20, vidaPasso: 6, vidaRacial: 6, livre: true }; return; }
        try { racaInfo = WNJ.parseRaca(await WNJ.fetchMD(entry.arquivo)); }
        catch (e) { console.warn(e); }
    }
    async function carregarRank() {
        const d = await WNJ.dadosRank(cfg, char.rank);
        if (d.dr) rankInfo.dr = d.dr;
        if (d.er) rankInfo.er = d.er;
        rankInfo.vidaEstrela = d.vidaEstrela || null;
        rankInfo.magEstrela = d.magEstrela || null;
    }

    // Sincroniza poderes automaticos (raca / classes / magia) com o estado atual.
    async function sincronizarPoderes() {
        const autos = await WNJ.poderesAutomaticos(cfg, char);
        const validos = new Set(autos.map(p => p.id));
        let novos = 0;
        for (const p of autos) {
            const existente = char.poderes.find(x => x.refId === p.id);
            const html = (typeof marked !== 'undefined') ? marked.parse(p.efeitoMD) : '<pre>' + esc(p.efeitoMD) + '</pre>';
            if (existente) { existente.nome = p.nome; existente.efeitoHTML = html; existente.rank = p.rank; existente.estrela = p.estrela; }
            else {
                char.poderes.push({ refId: p.id, nome: p.nome, tag: WNJ.tagDaFonte(p.fonte), efeitoHTML: html, auto: true, rank: p.rank, estrela: p.estrela });
                novos++;
            }
        }
        char.poderes = char.poderes.filter(x => !x.auto || validos.has(x.refId));
        return novos;
    }

    // ================= RENDER =================
    function renderTopo() {
        $('titulo-pagina').textContent = modoEdicao ? 'FICHA DE PERSONAGEM' : 'NOVO PERSONAGEM';
        const estrelas = char.rank < 10 ? ' ' + '★'.repeat(char.estrela) : '';
        $('badge-rank').textContent = 'RANK ' + char.rank + estrelas;
        $('btn-evoluir').style.display = modoEdicao ? '' : 'none';
        $('btn-visualizar').style.display = modoEdicao ? '' : 'none';
        $('btn-baixar').style.display = modoEdicao ? '' : 'none';
        $('btn-salvar').style.display = modoEdicao ? '' : 'none';
        $('btn-reset-criacao').style.display = modoEdicao ? 'none' : '';
        $('rodape-criar').style.display = modoEdicao ? 'none' : '';
        $('secao-inventario').style.display = modoEdicao ? '' : 'none';
        // classe avancada libera no rank 8
        const libera = char.rank <= 8;
        $('f-classe2').disabled = !libera;
        $('aviso-ca').textContent = libera ? '' : '(Rank 8+)';
    }

    function renderIdentidade() {
        $('f-nome').value = char.nome || '';
        $('f-sobrenome').value = char.sobrenome || '';
        $('f-raca').value = char.raca || '';
        $('f-classe1').value = char.classeInicial || '';
        $('f-classe2').value = char.classeAvancada || '';
        $('f-magia').value = char.magia || '';
        $('f-titulo-artigo').value = char.tituloArtigo || '';
        $('f-titulo').value = char.titulo || '';
        $('foto').innerHTML = char.img ? '<img src="' + char.img + '" alt="">' : '🖼️';
        renderEquipados();
    }

    function renderEquipados() {
        const eq = (char.inventario || []).filter(i => i.tag === 'artefato' && i.equipado);
        const box = $('equipados');
        if (!modoEdicao || !eq.length) { box.style.display = 'none'; return; }
        box.style.display = '';
        $('equipados-lista').innerHTML = eq.map(i => '<span class="chip-artefato">⚜ ' + esc(i.nome) + '</span>').join('');
    }

    // Fórmula por estrela do rank atual (config), com o VR da raça substituído
    function formulaEstrela(chave) {
        const f = (cfg[chave] || {})[String(char.rank)];
        if (!f) return '';
        return f.replace(/\bVR\b/g, 'VR ' + racaInfo.vidaRacial);
    }

    function autoCard(rotulo, valorHTML, sub) {
        return '<div class="auto-card"><div class="rotulo">' + rotulo + '</div><div class="valor">' + valorHTML + '</div>' +
            (sub ? '<small>' + sub + '</small>' : '') + '</div>';
    }

    function renderAutos() {
        const t = attrsTotais();
        const vidaAuto = WNJ.calcVida(racaInfo, t.corpo);
        const vidaMax = char.vidaMaxManual != null ? char.vidaMaxManual : vidaAuto;
        if (char.vidaAtual == null) char.vidaAtual = vidaMax;
        const magAuto = WNJ.calcMagiculas(cfg, t, rankInfo.er);
        const magMax = char.magiculasMax != null ? char.magiculasMax : magAuto;
        if (char.magiculasAtual == null) char.magiculasAtual = magMax;
        const arcana = char.arcanaManual != null ? char.arcanaManual : WNJ.calcArcana(cfg, char.rank);
        const ca = char.caManual != null ? char.caManual : WNJ.calcCA(cfg, t, char.rank);
        // Deslocamento automático acompanha a perícia Deslocamento (com ajuste manual dela)
        const pDesloc = WNJ.calcPericias(cfg, t).find(p => p.nome === 'Deslocamento');
        const perDesloc = pDesloc ? pDesloc.valor + ((char.periciasDelta || {})[pDesloc.nome] || 0) : 0;
        const deslocAuto = WNJ.calcDeslocamento(cfg, t, perDesloc);
        const desloc = char.deslocManual != null ? char.deslocManual : deslocAuto;

        $('autos').innerHTML =
            autoCard('Dado de Rank', 'DR 1d' + rankInfo.dr) +
            autoCard('Eficiência de Rank', 'ER ' + rankInfo.er) +
            '<div class="auto-card"><div class="rotulo">C.A</div><div class="valor"><input id="in-ca" type="number" value="' + ca + '"></div><small>auto: ' + WNJ.calcCA(cfg, t, char.rank) + '</small></div>' +
            '<div class="auto-card"><div class="rotulo">Deslocamento</div><div class="valor"><input id="in-desloc" type="number" value="' + desloc + '"></div><small>metros · perícia Deslocamento: ' + deslocAuto + '</small></div>' +
            '<div class="auto-card"><div class="rotulo">Vida</div><div class="par"><input id="in-vida-atual" type="number" value="' + char.vidaAtual + '"> / <input id="in-vida-max" type="number" value="' + vidaMax + '"></div><small>inicial: ' + vidaAuto + ' · VR ' + racaInfo.vidaRacial + (formulaEstrela('vida_por_estrela') ? ' · por ★: ' + formulaEstrela('vida_por_estrela') : '') + '</small></div>' +
            '<div class="auto-card" style="border-top-color:#a86af0"><div class="rotulo">Vida Mágica</div><div class="par"><input id="in-vidamag-atual" type="number" value="' + (char.vidaMagicaAtual || 0) + '"> / <input id="in-vidamag-max" type="number" value="' + (char.vidaMagicaMax || 0) + '"></div><small>manual</small></div>' +
            '<div class="auto-card"><div class="rotulo">Arcana</div><div class="valor"><input id="in-arcana" type="number" value="' + arcana + '"></div><small>auto: ' + WNJ.calcArcana(cfg, char.rank) + '</small></div>' +
            '<div class="auto-card"><div class="rotulo">Magículas</div><div class="par"><input id="in-mag-atual" type="number" value="' + char.magiculasAtual + '"> / <input id="in-mag-max" type="number" value="' + magMax + '"></div><small>iniciais: Mana + ER = ' + magAuto + (formulaEstrela('magiculas_por_estrela') ? ' · por ★: ' + formulaEstrela('magiculas_por_estrela') : '') + '</small></div>';

        $('in-ca').oninput = e => { char.caManual = parseInt(e.target.value) || 0; };
        $('in-desloc').oninput = e => { char.deslocManual = parseInt(e.target.value) || 0; };
        $('in-arcana').oninput = e => { char.arcanaManual = parseInt(e.target.value) || 0; };
        $('in-vida-atual').oninput = e => { char.vidaAtual = parseInt(e.target.value) || 0; };
        $('in-vida-max').oninput = e => { char.vidaMaxManual = parseInt(e.target.value) || 0; };
        $('in-mag-atual').oninput = e => { char.magiculasAtual = parseInt(e.target.value) || 0; };
        $('in-mag-max').oninput = e => { char.magiculasMax = parseInt(e.target.value) || 0; };
        $('in-vidamag-atual').oninput = e => { char.vidaMagicaAtual = parseInt(e.target.value) || 0; };
        $('in-vidamag-max').oninput = e => { char.vidaMagicaMax = parseInt(e.target.value) || 0; };
    }

    function renderAtributos() {
        const t = attrsTotais();
        $('attr-grid').innerHTML = cfg.atributos.map(a => {
            const mod = racaInfo.livre ? null : (racaInfo.mods[a.id] || 0);
            return '<div class="attr-card" style="background:' + a.cor + '18;border-color:' + a.cor + '">' +
                '<div class="nome" data-info="' + a.id + '" style="color:' + a.cor + ';cursor:pointer" title="Ver os benefícios de ' + a.nome + '">' + a.nome.toUpperCase() + ' ℹ️</div>' +
                '<input type="number" data-attr="' + a.id + '" value="' + (char.atributos[a.id] || 0) + '">' +
                '<div class="mod" style="color:' + a.cor + '">' + (mod === null ? 'raça: livre' : 'raça: ' + fmtMod(mod)) + '</div>' +
                '<div class="total" style="color:#fff">total: ' + t[a.id] + '</div>' +
                '</div>';
        }).join('');
        document.querySelectorAll('#attr-grid input').forEach(inp => {
            inp.oninput = () => {
                char.atributos[inp.dataset.attr] = parseInt(inp.value) || 0;
                renderAtributos(); renderAutos(); renderPericias(); renderAtaques();
                const foco = document.querySelector('#attr-grid input[data-attr="' + inp.dataset.attr + '"]');
                if (foco) { foco.focus(); }
            };
        });
        document.querySelectorAll('#attr-grid .nome[data-info]').forEach(el => {
            el.onclick = () => abrirInfoAtributo(el.dataset.info);
        });
    }

    // ---------- POPUP DE BENEFÍCIOS DO ATRIBUTO ----------
    function ganhosAtributo(id, v) {
        const g = [];
        const dom = (nome) => { if (v >= 20) g.push('👑 <strong>Domínio de ' + nome + '</strong> desbloqueado!'); };
        if (id === 'corpo') {
            const tabela = cfg.carga_corpo || [];
            let carga = 0;
            for (let i = 0; i < Math.min(v, tabela.length); i++) carga += tabela[i];
            g.push('🏋️ <strong>Capacidade de carga atual: ' + carga.toLocaleString('pt-BR') + ' kg</strong>');
            g.push('👊 Dano desarmado: <strong>+' + v + '</strong>');
            g.push('🛡️ Resistências I ganhas: <strong>' + Math.floor(v / 3) + '</strong> (a cada 3 pontos; mesmas resistências acumulam estágio)');
            if (v >= 10) g.push('💀 Testes de Resistência contra a Morte: <strong>+' + (v - 9) + '</strong>');
            dom('Corpo');
        } else if (id === 'tecnica') {
            g.push('🛡️ CA: <strong>+' + v + '</strong>');
            g.push('🤌 Gestos Perfeitos: <strong>' + Math.floor(v / 5) + '</strong> (a cada 5 pontos)');
            dom('Técnica');
        } else if (id === 'intelecto') {
            g.push('🎯 Pontos de perícia para distribuir: <strong>+' + v + '</strong>');
            g.push('🗣️ Idiomas/códigos extras: <strong>' + Math.floor(v / 3) + '</strong> (a cada 3 pontos)');
            g.push('⚡ Reações extras por rodada: <strong>' + Math.floor(v / 5) + '</strong> (a cada 5 pontos)');
            const acoes = v >= 10 ? 1 + Math.floor((v - 10) / 5) : 0;
            g.push('⏳ Ações extras em Interlúdios: <strong>' + acoes + '</strong> (1 aos 10, +1 a cada +5)');
            dom('Intelecto');
        } else if (id === 'carisma') {
            g.push('💬 PA em eventos com personagens: <strong>+' + v + '</strong>');
            g.push('🛡️ CA: <strong>+' + Math.floor(v / 5) + '</strong> (a cada 5 pontos)');
            if (v >= 10) g.push('🕊️ Hostilidade de seres vivos em relação a você <strong>diminui em um nível</strong>');
            dom('Carisma');
        } else if (id === 'sabedoria') {
            g.push('📖 Habilidades de Corpo/Mente que pode aprender: <strong>' + v + '</strong>');
            g.push('🔁 Reaprender habilidades: <strong>' + Math.floor(v / 5) + '</strong> (a cada 5 pontos)');
            if (v >= 10) g.push('🔮 <strong>+1DR</strong> em Testes de Intuição');
            dom('Sabedoria');
        } else if (id === 'mana') {
            g.push('✨ Magículas: <strong>+' + v + '</strong>');
            if (v >= 10) g.push('🌊 <strong>+1DR</strong> na Manipulação Livre OU no Ataque Principal da Magia');
            dom('Mana');
        }
        return g;
    }
    async function abrirInfoAtributo(id) {
        const a = cfg.atributos.find(x => x.id === id);
        const v = attrsTotais()[id] || 0;
        $('attrinfo-titulo').innerHTML = a.nome + ' <span style="font-size:.9rem;color:#9fc0da">— total ' + v + '</span>';
        $('attrinfo-titulo').style.color = a.cor;
        $('attrinfo-ganhos').innerHTML =
            '<div style="font-size:.72rem;letter-spacing:2px;text-transform:uppercase;color:' + a.cor + ';margin-bottom:8px">Seus ganhos atuais</div>' +
            ganhosAtributo(id, v).map(x => '<div style="padding:5px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:.9rem">' + x + '</div>').join('');
        $('attrinfo-md').innerHTML = '<p class="aviso-inline">Carregando…</p>';
        abrirOverlay('ov-attrinfo');
        try {
            const arq = (cfg.atributos_md || {})[id];
            const md = arq ? await WNJ.fetchMD(arq) : null;
            $('attrinfo-md').innerHTML = md
                ? (typeof marked !== 'undefined' ? marked.parse(md.replace(/^#\s+.*\n/, '')) : '<pre>' + esc(md) + '</pre>')
                : '<p class="aviso-inline">Sem página de regras para este atributo.</p>';
        } catch (e) {
            $('attrinfo-md').innerHTML = '<p class="aviso-inline">Não consegui carregar as regras: ' + esc(e.message) + '</p>';
        }
    }

    function escalaTexto(pesos) {
        return Object.values(pesos).sort((a, b) => b - a).join('/') + (Object.keys(pesos).length === 1 ? '/0' : '');
    }

    function renderPericias() {
        const t = attrsTotais();
        const lista = WNJ.calcPericias(cfg, t);
        // Ajustes manuais são guardados como DELTA (bônus/pena) sobre o valor
        // automático — assim, subir um atributo continua refletindo na perícia.
        char.periciasDelta = char.periciasDelta || {};
        $('pericias-grid').innerHTML = lista.map(p => {
            const delta = char.periciasDelta[p.nome] || 0;
            const manual = delta !== 0;
            const valor = p.valor + delta;
            const corPrincipal = CORES[Object.entries(p.pesos).sort((a, b) => b[1] - a[1])[0][0]];
            return '<div class="pericia' + (manual ? ' editada' : '') + '" data-pericia="' + esc(p.nome) + '" data-auto="' + p.valor + '">' +
                '<span style="width:8px;height:8px;border-radius:50%;background:' + corPrincipal + ';flex:0 0 8px"></span>' +
                '<span class="pnome">' + esc(p.nome) + (manual ? ' <small style="color:#f0c56b">(' + (delta > 0 ? '+' : '') + delta + ')</small>' : '') + '</span>' +
                '<span class="escala">' + escalaTexto(p.pesos) + '</span>' +
                '<button class="reset" title="Voltar ao automático">↺</button>' +
                '<input type="number" value="' + valor + '">' +
                '</div>';
        }).join('');
        document.querySelectorAll('#pericias-grid .pericia').forEach(el => {
            const nome = el.dataset.pericia;
            const auto = parseInt(el.dataset.auto, 10) || 0;
            el.querySelector('input').oninput = (e) => {
                const digitado = parseInt(e.target.value, 10);
                const delta = (isNaN(digitado) ? auto : digitado) - auto;
                if (delta === 0) delete char.periciasDelta[nome];
                else char.periciasDelta[nome] = delta;
                el.classList.toggle('editada', delta !== 0);
                if (nome === 'Deslocamento') renderAutos(); // card automático acompanha a perícia
            };
            el.querySelector('.reset').onclick = () => {
                delete char.periciasDelta[nome];
                renderPericias();
                renderAutos();
            };
        });
    }

    // ================= RESISTÊNCIAS =================
    // Redução (Tipos_Resistencia.md): base do estágio + ER + Corpo.
    const TIPOS_DANO = [
        { nome: 'Cortante', cor: '#b9c4cf' }, { nome: 'Perfurante', cor: '#b9c4cf' }, { nome: 'Contundente', cor: '#b9c4cf' },
        { nome: 'Magi-Cortante', cor: '#a86af0' }, { nome: 'Magi-Perfurante', cor: '#a86af0' }, { nome: 'Magi-Contundente', cor: '#a86af0' },
        { nome: 'Água', cor: '#4aa3ff' }, { nome: 'Terra', cor: '#ff9040' }, { nome: 'Fogo', cor: '#ff5a3c' },
        { nome: 'Vento', cor: '#52d273' }, { nome: 'Raio', cor: '#b05aff' },
        { nome: 'Ki', cor: '#ff2e2e' }, { nome: 'Fé', cor: '#ffe27a' }, { nome: 'Caos', cor: '#9d5cff' },
        { nome: 'Anômalo', cor: '#6fd4ff' }, { nome: 'Malícia', cor: '#c94f7c' }, { nome: 'Ordem', cor: '#f0f0f0' }
    ];
    const NIVEIS_RES = [
        { id: 'acostumado', rotulo: 'Acostumado', base: null },
        { id: 'r1', rotulo: 'Resistência I', base: 3 }, { id: 'r2', rotulo: 'Resistência II', base: 6 },
        { id: 'r3', rotulo: 'Resistência III', base: 8 }, { id: 'r4', rotulo: 'Resistência IV', base: 10 },
        { id: 'r5', rotulo: 'Resistência V', base: 12 }, { id: 'r6', rotulo: 'Resistência VI', base: 14 },
        { id: 'r7', rotulo: 'Resistência VII', base: 16 }, { id: 'r8', rotulo: 'Resistência VIII', base: 18 },
        { id: 'r9', rotulo: 'Resistência IX', base: 20 }, { id: 'r10', rotulo: 'Resistência X', base: 25 },
        { id: 'imune', rotulo: 'Imunidade', base: null }
    ];
    function reducaoTexto(nivel) {
        if (!nivel) return '';
        if (nivel.id === 'imune') return 'não recebe dano';
        if (nivel.id === 'acostumado') return 'reduz conforme o atributo adaptado';
        const t = attrsTotais();
        const valor = nivel.base + (rankInfo.er || 1) + (t.corpo || 0);
        return 'reduz ' + valor + ' (' + nivel.base + ' + ER + Corpo)';
    }
    let resAberto = null; // tipo com o painel aberto
    function renderResistencias() {
        char.resistencias = char.resistencias || {};
        $('res-grid').innerHTML = TIPOS_DANO.map(td => {
            const nivelId = char.resistencias[td.nome];
            const nivel = NIVEIS_RES.find(n => n.id === nivelId);
            const badge = nivel ? '<span class="res-nivel">' + nivel.rotulo + '</span>' : '';
            const reducao = nivel ? '<span class="res-reducao">' + reducaoTexto(nivel) + '</span>' : '';
            const painel = resAberto === td.nome
                ? '<div class="res-painel">' +
                  '<button data-nivel=""><span>— Nenhuma —</span></button>' +
                  NIVEIS_RES.map(n => '<button data-nivel="' + n.id + '"><span>' + n.rotulo + '</span><small>' + reducaoTexto(n) + '</small></button>').join('') +
                  '</div>'
                : '';
            return '<div class="res-item" data-tipo="' + esc(td.nome) + '">' +
                '<button type="button" class="res-chip" style="--rescor:' + td.cor + '"><span>' + esc(td.nome) + reducao + '</span>' + badge + '</button>' +
                painel + '</div>';
        }).join('');
        document.querySelectorAll('#res-grid .res-item').forEach(item => {
            const tipo = item.dataset.tipo;
            item.querySelector('.res-chip').onclick = () => {
                resAberto = resAberto === tipo ? null : tipo;
                renderResistencias();
            };
            item.querySelectorAll('.res-painel button').forEach(b => {
                b.onclick = (e) => {
                    e.stopPropagation();
                    if (b.dataset.nivel) char.resistencias[tipo] = b.dataset.nivel;
                    else delete char.resistencias[tipo];
                    resAberto = null;
                    renderResistencias();
                };
            });
        });
    }

    function renderFiltrosPoder() {
        const tags = [{ id: 'todos', nome: 'Todos', cor: '' }].concat(cfg.tags_poder);
        let html = tags.map(t =>
            '<button class="filtro' + (filtroPoder === t.id ? ' ativo' : '') + '" data-tag="' + t.id + '">' + t.nome + '</button>').join('');
        // filtros por rank: do 10 até o rank atual do personagem
        for (let r = 10; r >= char.rank; r--) {
            html += '<button class="filtro' + (filtroPoder === 'rank' + r ? ' ativo' : '') + '" data-tag="rank' + r + '">R' + r + '</button>';
        }
        html += '<button class="filtro' + (filtroPoder === 'ocultos' ? ' ativo' : '') + '" data-tag="ocultos" style="border-color:#8fa3b5;color:#8fa3b5' + (filtroPoder === 'ocultos' ? ';background:#8fa3b5;color:#14202e' : '') + '">👁 Ocultos</button>';
        $('filtros-poder').innerHTML = html;
        document.querySelectorAll('#filtros-poder .filtro').forEach(b => {
            b.onclick = () => { filtroPoder = b.dataset.tag; renderFiltrosPoder(); renderPoderes(); };
        });
    }

    function poderVisivel(p) {
        if (filtroPoder === 'ocultos') return !!p.oculto;
        if (p.oculto) return false;
        if (filtroPoder === 'todos') return true;
        if (filtroPoder.startsWith('rank')) return p.rank === parseInt(filtroPoder.slice(4), 10);
        return p.tag === filtroPoder;
    }

    function renderPoderes() {
        const lista = char.poderes.filter(poderVisivel);
        $('board-poderes').innerHTML = lista.length ? lista.map((p) => {
            const idx = char.poderes.indexOf(p);
            const tag = TAGS[p.tag] || TAGS.extra;
            const rankSelo = p.rank ? '<span class="escala" style="margin-left:6px">R' + p.rank + (p.estrela > 1 ? '★' + p.estrela : '') + '</span>' : '';
            return '<div class="tcard' + (p.oculto ? ' ocultado' : '') + '" style="--tag:' + tag.cor + '">' +
                '<div class="acoes-card">' +
                '<button class="olho" data-ocultar="' + idx + '" title="' + (p.oculto ? 'Mostrar poder' : 'Ocultar poder') + '">' + (p.oculto ? '🙈' : '👁') + '</button>' +
                (p.auto ? '<span class="auto-selo">AUTO</span>' :
                    '<button data-editar="' + idx + '" title="Editar">✏️</button><button data-remover="' + idx + '" title="Remover">🗑️</button>') +
                '</div>' +
                '<span class="tag">' + tag.nome + '</span>' + rankSelo +
                '<h4>' + esc(p.nome) + '</h4>' +
                '<div class="efeito">' + (p.efeitoHTML || '') + '</div>' +
                '</div>';
        }).join('') : '<p class="aviso-inline">' + (filtroPoder === 'ocultos'
            ? 'Nenhum poder oculto — use o olhinho 👁 de um poder para guardá-lo aqui.'
            : 'Nenhum poder aqui — escolha raça/classe/magia ou clique em <strong>+ Novo Poder</strong>.') + '</p>';
        document.querySelectorAll('#board-poderes [data-remover]').forEach(b => {
            b.onclick = () => { char.poderes.splice(parseInt(b.dataset.remover), 1); renderPoderes(); };
        });
        document.querySelectorAll('#board-poderes [data-editar]').forEach(b => {
            b.onclick = () => abrirModalPoder(parseInt(b.dataset.editar));
        });
        document.querySelectorAll('#board-poderes [data-ocultar]').forEach(b => {
            b.onclick = () => {
                const p = char.poderes[parseInt(b.dataset.ocultar)];
                p.oculto = !p.oculto;
                renderPoderes();
            };
        });
    }

    function renderAtaques() {
        const t = attrsTotais();
        $('board-ataques').innerHTML = char.ataques.length ? char.ataques.map((a, i) => {
            const cor = CORES[a.atrAtaque] || '#58A0C8';
            const resumo = a.ndr + 'd' + rankInfo.dr + ' + ' + (NOMES[a.atrAtaque] || '?') + ' (' + (t[a.atrAtaque] || 0) + ')';
            const dano = 'Dano: ' + (NOMES[a.atrDano] || '?') + ' (' + (t[a.atrDano] || 0) + ') · Crít. ×' + a.mult + (a.crit ? ' — ' + esc(a.crit) : '');
            return '<div class="tcard" style="--tag:' + cor + '">' +
                '<div class="acoes-card"><button data-editar="' + i + '" title="Editar">✏️</button><button data-remover="' + i + '" title="Remover">🗑️</button></div>' +
                '<span class="tag" style="background:' + cor + '">' + (NOMES[a.atrAtaque] || 'Ataque') + '</span>' +
                '<h4>' + esc(a.nome) + '</h4>' +
                '<div class="resumo">🎲 ' + resumo + '</div>' +
                '<div class="aviso-inline" style="margin-bottom:6px">' + dano + '</div>' +
                '<div class="efeito">' + (a.efeitoHTML || '') + '</div>' +
                '</div>';
        }).join('') : '<p class="aviso-inline">Nenhum ataque — clique em <strong>+ Novo Ataque</strong>.</p>';
        document.querySelectorAll('#board-ataques [data-remover]').forEach(b => {
            b.onclick = () => { char.ataques.splice(parseInt(b.dataset.remover), 1); renderAtaques(); };
        });
        document.querySelectorAll('#board-ataques [data-editar]').forEach(b => {
            b.onclick = () => abrirModalAtaque(parseInt(b.dataset.editar));
        });
    }

    function renderFiltrosInv() {
        const tags = [{ id: 'todos', nome: 'Todos', cor: '' }].concat(cfg.tags_inventario);
        $('filtros-inv').innerHTML = tags.map(t =>
            '<button class="filtro' + (filtroInv === t.id ? ' ativo' : '') + '" data-tag="' + t.id + '">' + t.nome + '</button>').join('');
        document.querySelectorAll('#filtros-inv .filtro').forEach(b => {
            b.onclick = () => { filtroInv = b.dataset.tag; renderFiltrosInv(); renderInventario(); };
        });
    }

    function renderInventario() {
        if (!modoEdicao) return;
        const lista = char.inventario.filter(i => filtroInv === 'todos' || i.tag === filtroInv);
        $('board-inventario').innerHTML = lista.length ? lista.map(item => {
            const i = char.inventario.indexOf(item);
            const tag = TAGS_INV[item.tag] || TAGS_INV.outro;
            return '<div class="tcard" style="--tag:' + tag.cor + '">' +
                '<div class="acoes-card"><button data-editar="' + i + '" title="Editar">✏️</button><button data-remover="' + i + '" title="Remover">🗑️</button></div>' +
                '<span class="tag" style="background:' + tag.cor + '">' + tag.nome + '</span>' +
                '<h4>' + esc(item.nome) + (item.qtd > 1 ? ' <span style="color:#9fc0da;font-size:.8rem">×' + item.qtd + '</span>' : '') + '</h4>' +
                '<div class="efeito">' + (item.descHTML || '') + '</div>' +
                (item.tag === 'artefato' ? '<label class="inv-check"><input type="checkbox" data-equipar="' + i + '"' + (item.equipado ? ' checked' : '') + '> Equipado</label>' : '') +
                '</div>';
        }).join('') : '<p class="aviso-inline">Inventário vazio — clique em <strong>+ Novo Item</strong>.</p>';
        document.querySelectorAll('#board-inventario [data-remover]').forEach(b => {
            b.onclick = () => { char.inventario.splice(parseInt(b.dataset.remover), 1); renderInventario(); renderEquipados(); };
        });
        document.querySelectorAll('#board-inventario [data-editar]').forEach(b => {
            b.onclick = () => abrirModalItem(parseInt(b.dataset.editar));
        });
        document.querySelectorAll('#board-inventario [data-equipar]').forEach(cb => {
            cb.onchange = () => { char.inventario[parseInt(cb.dataset.equipar)].equipado = cb.checked; renderEquipados(); };
        });
    }

    function renderCargas() {
        const grid = $('cargas-grid');
        grid.innerHTML = char.cargas.map((c, i) =>
            '<div class="carga">' +
            '<button class="rm" data-rm="' + i + '">✖</button>' +
            '<input class="cnome" data-i="' + i + '" value="' + esc(c.nome) + '" placeholder="Nome da carga">' +
            '<div class="valores"><input type="number" data-atual="' + i + '" value="' + c.atual + '"> / <input type="number" data-max="' + i + '" value="' + c.max + '"></div>' +
            '</div>').join('');
        $('btn-nova-carga').disabled = char.cargas.length >= (cfg.max_cargas || 9);
        grid.querySelectorAll('.rm').forEach(b => b.onclick = () => { char.cargas.splice(parseInt(b.dataset.rm), 1); renderCargas(); });
        grid.querySelectorAll('.cnome').forEach(inp => inp.oninput = () => { char.cargas[parseInt(inp.dataset.i)].nome = inp.value; });
        grid.querySelectorAll('[data-atual]').forEach(inp => inp.oninput = () => { char.cargas[parseInt(inp.dataset.atual)].atual = parseInt(inp.value) || 0; });
        grid.querySelectorAll('[data-max]').forEach(inp => inp.oninput = () => { char.cargas[parseInt(inp.dataset.max)].max = parseInt(inp.value) || 0; });
    }

    function renderPensamentos() {
        $('board-pensamentos').innerHTML = char.pensamentos.length ? char.pensamentos.map((p, i) =>
            '<div class="tcard" style="--tag:#9fc0da">' +
            '<div class="acoes-card"><button data-editar="' + i + '" title="Editar">✏️</button><button data-remover="' + i + '" title="Remover">🗑️</button></div>' +
            '<span class="tag" style="background:#9fc0da">Pensamento</span>' +
            '<h4>' + esc(p.assunto) + '</h4>' +
            '<div class="efeito">' + (p.textoHTML || '') + '</div>' +
            '</div>').join('') : '<p class="aviso-inline">O que seu personagem pensa sobre o mundo? Clique em <strong>+ Novo Pensamento</strong>.</p>';
        document.querySelectorAll('#board-pensamentos [data-remover]').forEach(b => {
            b.onclick = () => { char.pensamentos.splice(parseInt(b.dataset.remover), 1); renderPensamentos(); };
        });
        document.querySelectorAll('#board-pensamentos [data-editar]').forEach(b => {
            b.onclick = () => abrirModalPensamento(parseInt(b.dataset.editar));
        });
    }

    function renderTudo() {
        renderTopo(); renderIdentidade(); renderAutos(); renderAtributos();
        renderPericias(); renderResistencias(); renderFiltrosPoder(); renderPoderes(); renderAtaques();
        renderFiltrosInv(); renderInventario(); renderCargas(); renderPensamentos();
    }

    // ================= MODAIS =================
    function abrirOverlay(id) { $(id).classList.add('aberto'); }
    function fecharOverlay(id) { $(id).classList.remove('aberto'); }
    document.querySelectorAll('[data-fechar]').forEach(b => {
        b.onclick = () => b.closest('.overlay').classList.remove('aberto');
    });
    document.querySelectorAll('.rt-bar button').forEach(b => {
        b.onclick = (e) => { e.preventDefault(); document.execCommand(b.dataset.cmd, false, null); };
    });

    let poderEditando = null;
    function abrirModalPoder(idx) {
        poderEditando = idx != null ? idx : null;
        const p = poderEditando != null ? char.poderes[poderEditando] : null;
        $('poder-titulo').textContent = p ? 'Editar Poder' : 'Novo Poder';
        $('poder-nome').value = p ? p.nome : '';
        $('poder-tag').innerHTML = cfg.tags_poder.map(t => '<option value="' + t.id + '">' + t.nome + '</option>').join('');
        $('poder-tag').value = p ? p.tag : 'extra';
        $('poder-efeito').innerHTML = p ? (p.efeitoHTML || '') : '';
        abrirOverlay('ov-poder');
    }
    $('btn-novo-poder').onclick = () => abrirModalPoder(null);
    $('poder-salvar').onclick = () => {
        const nome = $('poder-nome').value.trim();
        if (!nome) { alert('Dê um nome ao poder.'); return; }
        const dados = { nome, tag: $('poder-tag').value, efeitoHTML: $('poder-efeito').innerHTML, auto: false };
        if (poderEditando != null) Object.assign(char.poderes[poderEditando], dados);
        else char.poderes.push(dados);
        fecharOverlay('ov-poder'); renderPoderes();
    };

    let ataqueEditando = null;
    function abrirModalAtaque(idx) {
        ataqueEditando = idx != null ? idx : null;
        const a = ataqueEditando != null ? char.ataques[ataqueEditando] : null;
        $('ataque-titulo').textContent = a ? 'Editar Ataque' : 'Novo Ataque';
        $('atq-nome').value = a ? a.nome : '';
        $('atq-ndr').value = a ? a.ndr : 1;
        $('atq-mult').value = a ? a.mult : 2;
        const opts = cfg.atributos.map(x => '<option value="' + x.id + '">' + x.nome + '</option>').join('');
        $('atq-attr-ataque').innerHTML = opts;
        $('atq-attr-dano').innerHTML = opts;
        $('atq-attr-ataque').value = a ? a.atrAtaque : 'tecnica';
        $('atq-attr-dano').value = a ? a.atrDano : 'corpo';
        $('atq-crit').value = a ? a.crit : '';
        $('atq-efeito').innerHTML = a ? (a.efeitoHTML || '') : '';
        abrirOverlay('ov-ataque');
    }
    $('btn-novo-ataque').onclick = () => abrirModalAtaque(null);
    $('atq-salvar').onclick = () => {
        const nome = $('atq-nome').value.trim();
        if (!nome) { alert('Dê um nome ao ataque.'); return; }
        const dados = {
            nome,
            ndr: Math.max(1, parseInt($('atq-ndr').value) || 1),
            mult: Math.max(2, parseInt($('atq-mult').value) || 2),
            atrAtaque: $('atq-attr-ataque').value,
            atrDano: $('atq-attr-dano').value,
            crit: $('atq-crit').value.trim(),
            efeitoHTML: $('atq-efeito').innerHTML
        };
        if (ataqueEditando != null) Object.assign(char.ataques[ataqueEditando], dados);
        else char.ataques.push(dados);
        fecharOverlay('ov-ataque'); renderAtaques();
    };

    let itemEditando = null;
    function abrirModalItem(idx) {
        itemEditando = idx != null ? idx : null;
        const it = itemEditando != null ? char.inventario[itemEditando] : null;
        $('item-titulo').textContent = it ? 'Editar Item' : 'Novo Item';
        $('item-nome').value = it ? it.nome : '';
        $('item-tag').innerHTML = cfg.tags_inventario.map(t => '<option value="' + t.id + '">' + t.nome + '</option>').join('');
        $('item-tag').value = it ? it.tag : 'outro';
        $('item-qtd').value = it ? it.qtd : 1;
        $('item-desc').innerHTML = it ? (it.descHTML || '') : '';
        abrirOverlay('ov-item');
    }
    $('btn-novo-item').onclick = () => abrirModalItem(null);
    $('item-salvar').onclick = () => {
        const nome = $('item-nome').value.trim();
        if (!nome) { alert('Dê um nome ao item.'); return; }
        const dados = {
            nome, tag: $('item-tag').value,
            qtd: Math.max(1, parseInt($('item-qtd').value) || 1),
            descHTML: $('item-desc').innerHTML,
            equipado: itemEditando != null ? char.inventario[itemEditando].equipado : false
        };
        if (itemEditando != null) Object.assign(char.inventario[itemEditando], dados);
        else char.inventario.push(dados);
        fecharOverlay('ov-item'); renderInventario(); renderEquipados();
    };

    let pensamentoEditando = null;
    function abrirModalPensamento(idx) {
        pensamentoEditando = idx != null ? idx : null;
        const p = pensamentoEditando != null ? char.pensamentos[pensamentoEditando] : null;
        $('pensamento-titulo').textContent = p ? 'Editar Pensamento' : 'Novo Pensamento';
        $('pen-assunto').value = p ? p.assunto : '';
        $('pen-texto').innerHTML = p ? (p.textoHTML || '') : '';
        abrirOverlay('ov-pensamento');
    }
    $('btn-novo-pensamento').onclick = () => abrirModalPensamento(null);
    $('pen-salvar').onclick = () => {
        const assunto = $('pen-assunto').value.trim();
        if (!assunto) { alert('Sobre o quê é esse pensamento?'); return; }
        const dados = { assunto, textoHTML: $('pen-texto').innerHTML };
        if (pensamentoEditando != null) Object.assign(char.pensamentos[pensamentoEditando], dados);
        else char.pensamentos.push(dados);
        fecharOverlay('ov-pensamento'); renderPensamentos();
    };

    // ================= VISUALIZAR (card retrato) =================
    function tituloCompleto() {
        if (!char.titulo) return '';
        return (char.tituloArtigo ? char.tituloArtigo + ' ' : '') + char.titulo;
    }
    $('btn-visualizar').onclick = () => {
        coletarIdentidade();
        const pal = WNJ.paletaMagia(char.magia);
        const card = $('view-card');
        const a = pal.acentos;
        card.classList.toggle('animado', pal.animado);
        card.style.setProperty('--vc-f1', pal.fundo1);
        card.style.setProperty('--vc-f2', pal.fundo2);
        card.style.setProperty('--vc-acento', a[0]);
        card.style.setProperty('--vc-brilho', a[0] + '66');
        card.style.setProperty('--vc-g1', a[0]);
        card.style.setProperty('--vc-g2', a[1] || a[0]);
        card.style.setProperty('--vc-g3', a[2] || a[0]);
        if (!pal.animado) card.style.borderColor = a[0]; else card.style.borderColor = '';
        $('view-foto').style.backgroundImage = char.img ? 'url(' + char.img + ')' : 'none';
        $('view-foto').textContent = char.img ? '' : '🎭';
        const nomeCompleto = [char.nome, char.sobrenome].filter(Boolean).join(' ') || 'Sem Nome';
        const tit = tituloCompleto();
        $('view-titulo').textContent = tit;
        $('view-titulo').style.display = tit ? '' : 'none';
        $('view-nome').textContent = nomeCompleto;
        $('view-nome').classList.toggle('destaque', !tit);
        const estrelas = char.rank < 10 ? ' ' + '★'.repeat(char.estrela) : '';
        $('view-rank').textContent = 'Rank ' + char.rank + estrelas + (pal.nome ? ' · ' + pal.nome : '');
        const [p1, p2] = WNJ.atributosPrincipais(cfg, attrsTotais());
        $('view-attrs').innerHTML =
            '<span style="color:' + p1.cor + ';border-color:' + p1.cor + '">' + p1.nome + '</span>' +
            '<span style="color:' + p2.cor + ';border-color:' + p2.cor + '">' + p2.nome + '</span>';
        abrirOverlay('ov-view');
    };

    // ================= NOVA HABILIDADE =================
    const HAB_CORES = { corpo: '#ff4500', mente: '#9d00ff', alma: '#00d4ff' };
    const HAB_ICONES = { corpo: '💪', mente: '🧠', alma: '🔮' };
    const HAB_NOMES = { corpo: 'Pilar do Corpo', mente: 'Pilar da Mente', alma: 'Pilar da Alma' };
    let habIndice = null;
    async function carregarHabIndice() {
        if (habIndice) return habIndice;
        const md = await WNJ.fetchMD('contents/sistema/habilidades.md');
        const m = md.match(/```json\r?\n([\s\S]*?)```/);
        habIndice = m ? JSON.parse(m[1]) : [];
        return habIndice;
    }
    function renderListaHab() {
        const tipo = $('hab-tipo').value;
        const cor = HAB_CORES[tipo];
        const itens = habIndice.filter(h => h.tipo === tipo)
            .sort((a, b) => (a.estagio || 99) - (b.estagio || 99) || a.nome.localeCompare(b.nome));
        let atual = null, html = '';
        for (const h of itens) {
            if (h.estagio_rotulo !== atual) {
                atual = h.estagio_rotulo;
                const nota = h.estagio >= 2
                    ? ' <span style="text-transform:none;letter-spacing:0;font-weight:400;color:#8fb3cf">— Requer até duas habilidades do estágio passado.</span>'
                    : '';
                html += '<div style="font-size:.7rem;text-transform:uppercase;letter-spacing:2px;font-weight:700;color:' + cor + ';margin:12px 2px 6px">' + esc(atual) + nota + '</div>';
            }
            html += '<button type="button" class="hab-opcao" data-arquivo="' + esc(h.arquivo) + '" ' +
                'style="display:block;width:100%;text-align:left;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);' +
                'border-left:3px solid ' + cor + ';border-radius:8px;color:#eaf2fa;padding:9px 12px;margin-bottom:6px;cursor:pointer;font-size:.88rem">' +
                esc(h.nome) + '</button>';
        }
        $('hab-lista').innerHTML = html || '<p class="aviso-inline">Nenhuma habilidade encontrada.</p>';
        document.querySelectorAll('#hab-lista .hab-opcao').forEach(b => {
            b.onclick = () => escolherHabilidade(habIndice.find(h => h.arquivo === b.dataset.arquivo));
        });
    }
    async function escolherHabilidade(h) {
        if (!h) return;
        try {
            const md = await WNJ.fetchMD(h.arquivo);
            const corpoMd = md.replace(/^#\s+.*\n?/, '').trim();
            const cab = '<p style="font-size:.72rem;letter-spacing:1px;text-transform:uppercase;color:' + HAB_CORES[h.tipo] + '">' +
                HAB_ICONES[h.tipo] + ' ' + HAB_NOMES[h.tipo] + ' · ' + esc(h.estagio_rotulo) + '</p>';
            const html = (typeof marked !== 'undefined') ? marked.parse(corpoMd) : '<pre>' + esc(corpoMd) + '</pre>';
            char.poderes.push({ nome: h.nome, tag: 'habilidade', efeitoHTML: cab + html, auto: false });
            fecharOverlay('ov-habilidade');
            renderPoderes();
        } catch (e) {
            alert('Não consegui carregar essa habilidade: ' + e.message);
        }
    }
    $('btn-nova-habilidade').onclick = async () => {
        await carregarHabIndice();
        renderListaHab();
        abrirOverlay('ov-habilidade');
    };
    $('hab-tipo').onchange = renderListaHab;

    // ================= BAIXAR CARTA COMO PNG =================
    function rrect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    $('btn-carta-png').onclick = async () => {
        coletarIdentidade();
        const pal = WNJ.paletaMagia(char.magia);
        const a = pal.acentos;
        const W = 760, H = 1104, B = 14, R = 34;
        const cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const ctx = cv.getContext('2d');
        try { await document.fonts.load('700 46px Cinzel'); await document.fonts.load('700 30px Cinzel'); } catch (e) {}

        // moldura (gradiente animado vira gradiente diagonal)
        const gb = ctx.createLinearGradient(0, 0, W, H);
        if (a.length > 1) { gb.addColorStop(0, a[0]); gb.addColorStop(.5, a[1]); gb.addColorStop(1, a[2] || a[0]); }
        else { gb.addColorStop(0, a[0]); gb.addColorStop(1, a[0]); }
        rrect(ctx, 0, 0, W, H, R); ctx.fillStyle = gb; ctx.fill();

        // fundo interno
        const gf = ctx.createLinearGradient(0, 0, 0, H);
        gf.addColorStop(0, pal.fundo1); gf.addColorStop(1, pal.fundo2);
        rrect(ctx, B, B, W - 2 * B, H - 2 * B, R - 8); ctx.fillStyle = gf; ctx.fill();

        // foto (58% superior, recorte cover)
        const fotoH = Math.round((H - 2 * B) * 0.58);
        if (char.img) {
            const img = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = char.img; });
            if (img) {
                ctx.save();
                rrect(ctx, B, B, W - 2 * B, H - 2 * B, R - 8); ctx.clip();
                const dw = W - 2 * B, dh = fotoH;
                const sc = Math.max(dw / img.width, dh / img.height);
                const sw = dw / sc, sh = dh / sc;
                ctx.drawImage(img, (img.width - sw) / 2, 0, sw, sh, B, B, dw, dh);
                const sombra = ctx.createLinearGradient(0, B + dh - 130, 0, B + dh);
                sombra.addColorStop(0, 'rgba(0,0,0,0)'); sombra.addColorStop(1, pal.fundo2);
                ctx.fillStyle = sombra; ctx.fillRect(B, B + dh - 130, dw, 130);
                ctx.restore();
            }
        } else {
            ctx.font = '120px serif'; ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,.25)';
            ctx.fillText('🎭', W / 2, B + fotoH / 2 + 40);
        }

        // textos
        const nomeCompleto = [char.nome, char.sobrenome].filter(Boolean).join(' ') || 'Sem Nome';
        const tit = tituloCompleto();
        let y = B + fotoH + 74;
        ctx.textAlign = 'center';
        if (tit) {
            ctx.font = '700 40px Cinzel, serif';
            ctx.fillStyle = a[0];
            ctx.shadowColor = a[0]; ctx.shadowBlur = 22;
            ctx.fillText(tit.toUpperCase(), W / 2, y);
            ctx.shadowBlur = 0;
            y += 46;
            ctx.font = '26px Lato, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(nomeCompleto, W / 2, y);
        } else {
            ctx.font = '700 46px Cinzel, serif';
            ctx.fillStyle = a[0];
            ctx.shadowColor = a[0]; ctx.shadowBlur = 22;
            ctx.fillText(nomeCompleto.toUpperCase(), W / 2, y);
            ctx.shadowBlur = 0;
            y += 46;
        }
        y += 40;
        const estrelas = char.rank < 10 ? ' ' + '★'.repeat(char.estrela) : '';
        ctx.font = '700 22px Lato, sans-serif';
        ctx.fillStyle = '#d5dde5';
        ctx.fillText(('RANK ' + char.rank + estrelas + (pal.nome ? ' · ' + pal.nome.toUpperCase() : '')), W / 2, y);

        // pilulas dos 2 maiores atributos
        const [p1, p2] = WNJ.atributosPrincipais(cfg, attrsTotais());
        y += 62;
        ctx.font = '700 24px Lato, sans-serif';
        const pilula = (texto, cor, cx) => {
            const tw = ctx.measureText(texto).width;
            const pw = tw + 44, ph = 46;
            rrect(ctx, cx - pw / 2, y - ph / 2 - 8, pw, ph, 23);
            ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.fill();
            ctx.strokeStyle = cor; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.fillStyle = cor; ctx.fillText(texto, cx, y);
        };
        const w1 = ctx.measureText(p1.nome).width + 44, w2 = ctx.measureText(p2.nome).width + 44;
        const gap = 18, total = w1 + w2 + gap;
        pilula(p1.nome, p1.cor, W / 2 - total / 2 + w1 / 2);
        pilula(p2.nome, p2.cor, W / 2 + total / 2 - w2 / 2);

        // rodape discreto
        ctx.font = '16px Lato, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.fillText('LUXSANDORIA · WATASHI NO JINSEI', W / 2, H - 34);

        cv.toBlob(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const nomeArq = (nomeCompleto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_') || 'personagem');
            link.download = nomeArq + '_carta.png';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 800);
        }, 'image/png');
    };

    // ================= CAMPOS DE IDENTIDADE =================
    $('f-nome').oninput = e => char.nome = e.target.value;
    $('f-sobrenome').oninput = e => char.sobrenome = e.target.value;
    $('f-titulo-artigo').onchange = e => char.tituloArtigo = e.target.value;
    $('f-titulo').oninput = e => char.titulo = e.target.value;
    $('f-raca').onchange = async e => {
        char.raca = e.target.value;
        await carregarRaca(); await sincronizarPoderes();
        renderAutos(); renderAtributos(); renderPericias(); renderPoderes();
    };
    $('f-classe1').onchange = async e => {
        char.classeInicial = e.target.value;
        await sincronizarPoderes(); renderPoderes();
    };
    $('f-classe2').onchange = async e => {
        char.classeAvancada = e.target.value;
        await sincronizarPoderes(); renderPoderes();
    };
    $('f-magia').onchange = async e => {
        char.magia = e.target.value;
        await sincronizarPoderes(); renderPoderes();
    };

    // Imagem: redimensiona para dataURL compacto
    $('foto').onclick = () => $('foto-input').click();
    $('foto-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
            const MAX = 400;
            const escala = Math.min(1, MAX / Math.max(img.width, img.height));
            const cv = document.createElement('canvas');
            cv.width = Math.round(img.width * escala);
            cv.height = Math.round(img.height * escala);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            char.img = cv.toDataURL('image/jpeg', 0.82);
            renderIdentidade();
        };
        img.src = URL.createObjectURL(file);
    };

    // ================= CARGAS =================
    $('btn-nova-carga').onclick = () => {
        if (char.cargas.length >= (cfg.max_cargas || 9)) return;
        char.cargas.push({ nome: 'Nova Carga', atual: 0, max: 0 });
        renderCargas();
    };

    // ================= EVOLUIR =================
    const MAX_E = cfg.estrelas_por_rank || 5;
    // "posição" linear para comparar avanço: rank 10 = 0, cada estrela +1
    function posEvo(rank, est) { return rank === 10 ? 0 : (10 - rank - 1) * MAX_E + est; }

    async function aplicarEvolucao(rank, estrela, comDados) {
        char.rank = rank; char.estrela = estrela;
        await carregarRank();
        const novos = await sincronizarPoderes();
        WNJ.salvar(char);
        renderTudo();
        $('evo-estrelas').textContent = rank < 10 ? '★'.repeat(estrela) : '✦';
        $('evo-titulo').textContent = rank < 10
            ? 'Parabéns! Rank ' + rank + ' — ' + estrela + 'ª Estrela'
            : 'Rank 10 — Início da Jornada';
        const texto = await WNJ.textoEstrela(cfg, rank, estrela);
        $('evo-ganhos').innerHTML = texto
            ? (typeof marked !== 'undefined' ? marked.parse(texto) : '<pre>' + esc(texto) + '</pre>')
            : '<em>Consulte a página do Rank ' + rank + ' para os ganhos desta estrela.</em>';
        if (novos > 0) {
            $('evo-ganhos').innerHTML += '<p style="color:#7fd08a"><strong>+' + novos + ' poder(es)</strong> adicionados à sua ficha.</p>';
        }
        renderDadosEvolucao(comDados, texto);
        abrirOverlay('ov-evo');
    }

    // Botões "Girar Dados" do popup — só ao subir 1 estrela (não em saltos).
    // Quais aparecem segue o texto da estrela no .md do rank; as fórmulas vêm
    // das linhas "Aumento de Vida/Magículas por Estrela" do mesmo .md.
    function renderDadosEvolucao(comDados, textoEstrela) {
        const box = $('evo-dados');
        box.innerHTML = '';
        if (!comDados) return;
        const t = attrsTotais();
        const ctx = {};
        cfg.atributos.forEach(a => ctx[a.id] = t[a.id] || 0);
        ctx.vr = racaInfo.vidaRacial || 0;
        const plano = (textoEstrela || '').replace(/[*_]/g, ''); // remove negrito/itálico do markdown
        const mostraVida = rankInfo.vidaEstrela && (!plano || /vida m[aá]xima aumenta/i.test(plano));
        const mostraMag = rankInfo.magEstrela && (!plano || /mag[íi]culas aumenta/i.test(plano));
        if (!mostraVida && !mostraMag) return;

        const botao = (id, rotulo, formula) =>
            '<button class="btn-wnj verde" id="' + id + '" style="width:100%;justify-content:center;margin-top:8px">🎲 ' + rotulo + ' <small style="opacity:.8">(' + esc(formula) + ')</small></button>';
        let html = '<div style="font-size:.72rem;letter-spacing:2px;text-transform:uppercase;color:#8fb3cf;margin-top:14px">Rolagens da estrela</div>';
        if (mostraVida) html += botao('evo-rolar-vida', 'Girar Dados de Vida', rankInfo.vidaEstrela);
        if (mostraMag) html += botao('evo-rolar-mag', 'Girar Dados de Magículas', rankInfo.magEstrela);
        box.innerHTML = html;

        if (mostraVida) $('evo-rolar-vida').onclick = () => {
            const r = WNJ.rolarFormula(rankInfo.vidaEstrela, ctx);
            if (!r) return;
            const maxAtual = char.vidaMaxManual != null ? char.vidaMaxManual : WNJ.calcVida(racaInfo, t.corpo);
            char.vidaMaxManual = maxAtual + r.total;
            WNJ.salvar(char);
            renderAutos();
            const b = $('evo-rolar-vida');
            b.disabled = true;
            b.innerHTML = '❤️ +' + r.total + ' de Vida Máxima <small style="opacity:.8">(agora ' + char.vidaMaxManual + ')</small>';
            b.title = r.partes.join(' · ');
        };
        if (mostraMag) $('evo-rolar-mag').onclick = () => {
            const r = WNJ.rolarFormula(rankInfo.magEstrela, ctx);
            if (!r) return;
            const maxAtual = char.magiculasMax != null ? char.magiculasMax : WNJ.calcMagiculas(cfg, t, rankInfo.er);
            char.magiculasMax = maxAtual + r.total;
            WNJ.salvar(char);
            renderAutos();
            const b = $('evo-rolar-mag');
            b.disabled = true;
            b.innerHTML = '✨ +' + r.total + ' de Magículas <small style="opacity:.8">(agora ' + char.magiculasMax + ')</small>';
            b.title = r.partes.join(' · ');
        };
    }

    function proximaEvo() {
        let { rank, estrela } = char;
        if (rank === 10) return { rank: 9, estrela: 1 };
        if (estrela < MAX_E) return { rank, estrela: estrela + 1 };
        if (rank > 3) return { rank: rank - 1, estrela: 1 };
        return null; // topo
    }

    $('btn-evoluir').onclick = () => {
        $('evo-atual').textContent = char.rank < 10 ? 'Rank ' + char.rank + ' · ' + char.estrela + 'ª Estrela' : 'Rank 10';
        // popular selects de salto (10 → 3)
        $('evo-rank').innerHTML = '';
        for (let r = 10; r >= 3; r--) $('evo-rank').insertAdjacentHTML('beforeend', '<option value="' + r + '">Rank ' + r + '</option>');
        $('evo-estrela').innerHTML = '';
        for (let s = 1; s <= MAX_E; s++) $('evo-estrela').insertAdjacentHTML('beforeend', '<option value="' + s + '">' + s + 'ª Estrela</option>');
        $('evo-rank').value = String(char.rank);
        $('evo-estrela').value = String(char.rank < 10 ? char.estrela : 1);
        const semTopo = !proximaEvo();
        $('evo-mais1').disabled = semTopo;
        $('evo-mais1').textContent = semTopo ? 'Você já está no topo (Rank 3 ★' + MAX_E + ')' : '⭐ Subir 1 Estrela';
        abrirOverlay('ov-evo-menu');
    };

    $('evo-mais1').onclick = async () => {
        const nx = proximaEvo();
        if (!nx) return;
        fecharOverlay('ov-evo-menu');
        await aplicarEvolucao(nx.rank, nx.estrela, true);
    };

    $('evo-saltar').onclick = async () => {
        let rank = parseInt($('evo-rank').value, 10);
        let estrela = rank === 10 ? 1 : parseInt($('evo-estrela').value, 10);
        if (posEvo(rank, estrela) < posEvo(char.rank, char.estrela)) {
            if (!confirm('Isso vai REGREDIR seu personagem para um estágio anterior. Continuar?')) return;
        }
        fecharOverlay('ov-evo-menu');
        await aplicarEvolucao(rank, estrela, false); // salto direto: sem rolagens automáticas
    };

    // ================= SALVAR / CRIAR / BAIXAR =================
    function coletarIdentidade() {
        char.nome = $('f-nome').value.trim();
        char.sobrenome = $('f-sobrenome').value.trim();
        char.titulo = $('f-titulo').value.trim();
        char.tituloArtigo = $('f-titulo-artigo').value;
    }
    // Salva local e, se estiver logado com permissão, também na nuvem do usuário
    async function salvarTudo() {
        const okLocal = WNJ.salvar(char);
        let nuvem = null;
        if (typeof WNJNuvem !== 'undefined' && WNJNuvem.disponivel()) {
            try { await WNJNuvem.enviar(char); nuvem = true; }
            catch (e) { nuvem = false; console.warn('Falha ao enviar para a nuvem', e); }
        }
        return { okLocal, nuvem };
    }

    $('btn-salvar').onclick = async () => {
        coletarIdentidade();
        const btn = $('btn-salvar');
        btn.disabled = true; btn.textContent = '⏳ Salvando...';
        const r = await salvarTudo();
        btn.disabled = false;
        btn.textContent = r.nuvem === true ? '✔ Salvo + ☁️' : (r.okLocal ? '✔ Salvo!' : '⚠️ Falhou');
        setTimeout(() => btn.innerHTML = '💾 Salvar', 1600);
    };
    $('btn-criar').onclick = async () => {
        coletarIdentidade();
        if (!char.nome) { alert('Dê um nome ao seu personagem!'); return; }
        const btn = $('btn-criar');
        btn.disabled = true; btn.textContent = '⏳ Salvando...';
        const r = await salvarTudo();
        btn.disabled = false; btn.innerHTML = '✨ Criar Personagem';
        if (!r.okLocal) return;   // avisos já foram mostrados
        localStorage.removeItem('wnj_draft');
        localStorage.removeItem('wnj_draft_oculto');
        location.href = 'personagem.html#meus';
    };

    // ================= RESETAR CRIAÇÃO (modo criação) =================
    let resetandoCriacao = false;
    $('btn-reset-criacao').onclick = () => {
        if (!confirm('Tem certeza que deseja resetar a criação de personagem?\nTudo que foi preenchido será excluído.')) return;
        resetandoCriacao = true; // impede o auto-save de regravar o rascunho ao sair
        localStorage.removeItem('wnj_draft');
        localStorage.removeItem('wnj_draft_oculto');
        location.href = 'ficha.html'; // recarrega limpo, sem restaurar rascunho
    };

    // ================= AUTO-SAVE DO RASCUNHO (modo criação) =================
    if (!modoEdicao) {
        let draftTimer = null;
        const salvarRascunho = () => {
            if (resetandoCriacao) return;
            coletarIdentidade();
            try {
                localStorage.setItem('wnj_draft', JSON.stringify(char));
                localStorage.removeItem('wnj_draft_oculto'); // atividade nova reexibe o botão
            } catch (e) {}
        };
        const agendar = () => { clearTimeout(draftTimer); draftTimer = setTimeout(salvarRascunho, 800); };
        document.addEventListener('input', agendar, true);
        document.addEventListener('change', agendar, true);
        document.addEventListener('click', agendar, true);
        window.addEventListener('beforeunload', salvarRascunho);
    }
    $('btn-baixar').onclick = async () => {
        coletarIdentidade();
        WNJ.salvar(char);
        await WNJExport.baixar(char);
    };

    // ================= INIT =================
    // Entradas com "secreta": true só aparecem depois do desbloqueio
    // (7 cliques no rótulo do campo — Raça / Classe Inicial / Classe Avançada).
    function desbloqueado(chave) { return localStorage.getItem('wnj_unlock_' + chave) === '1'; }
    function popularSelect(id, lista, chave) {
        const sel = $(id);
        const atual = sel.value;
        const visiveis = lista.filter(x => !x.secreta || (chave && desbloqueado(chave)) || x.nome === atual);
        sel.innerHTML = '<option value="">— escolher —</option>' +
            visiveis.map(x => '<option value="' + esc(x.nome) + '">' + (x.secreta ? '🔮 ' : '') + esc(x.nome) + '</option>').join('');
        if (atual) sel.value = atual;
    }
    function popularTudo() {
        popularSelect('f-raca', cfg.racas, 'racas');
        popularSelect('f-classe1', cfg.classes_iniciais, 'ci');
        popularSelect('f-classe2', cfg.classes_avancadas, 'ca');
        popularSelect('f-magia', cfg.magias);
        // garante que o valor salvo do personagem apareça mesmo sem desbloqueio
        [['f-raca', char.raca], ['f-classe1', char.classeInicial], ['f-classe2', char.classeAvancada]].forEach(([id, val]) => {
            const sel = $(id);
            if (val && ![...sel.options].some(o => o.value === val)) {
                sel.insertAdjacentHTML('beforeend', '<option value="' + esc(val) + '">🔮 ' + esc(val) + '</option>');
            }
            if (val) sel.value = val;
        });
    }
    popularTudo();

    // 7 cliques no rótulo desbloqueiam as entradas secretas
    const CLIQUES_SECRETOS = [
        { texto: 'Raça', chave: 'racas', sel: 'f-raca' },
        { texto: 'Classe Inicial', chave: 'ci', sel: 'f-classe1' },
        { texto: 'Classe Avançada', chave: 'ca', sel: 'f-classe2' }
    ];
    document.querySelectorAll('.campo > label').forEach(lb => {
        const alvo = CLIQUES_SECRETOS.find(c => lb.textContent.trim().startsWith(c.texto));
        if (!alvo) return;
        let cliques = 0, timer = null;
        lb.style.userSelect = 'none';
        lb.addEventListener('click', () => {
            if (desbloqueado(alvo.chave)) return;
            cliques++;
            clearTimeout(timer);
            timer = setTimeout(() => { cliques = 0; }, 1600);
            if (cliques >= 7) {
                localStorage.setItem('wnj_unlock_' + alvo.chave, '1');
                popularTudo();
                lb.style.textShadow = '0 0 12px #FDF5AA';
                lb.textContent = '🔮 ' + lb.textContent;
                alert('✨ Segredos revelados! Novas opções apareceram na lista de ' + alvo.texto + '.');
            }
        });
    });

    await carregarRaca();
    await carregarRank();
    await sincronizarPoderes();

    // Migração: fichas antigas guardavam a perícia editada como valor absoluto;
    // convertemos para delta (valor - automático) para acompanhar os atributos.
    if (char.overridesPericias && Object.keys(char.overridesPericias).length) {
        char.periciasDelta = char.periciasDelta || {};
        const autos = WNJ.calcPericias(cfg, attrsTotais());
        for (const [nome, absoluto] of Object.entries(char.overridesPericias)) {
            const p = autos.find(x => x.nome === nome);
            const delta = (absoluto || 0) - (p ? p.valor : 0);
            if (delta !== 0) char.periciasDelta[nome] = delta;
        }
        delete char.overridesPericias;
    } else {
        delete char.overridesPericias;
    }

    renderTudo();
})();
