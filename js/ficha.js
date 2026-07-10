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
        const ca = char.caManual != null ? char.caManual : WNJ.calcCA(cfg, t);
        const desloc = char.deslocManual != null ? char.deslocManual : WNJ.calcDeslocamento(cfg, t);

        $('autos').innerHTML =
            autoCard('Dado de Rank', 'DR 1d' + rankInfo.dr) +
            autoCard('Eficiência de Rank', 'ER ' + rankInfo.er) +
            '<div class="auto-card"><div class="rotulo">C.A</div><div class="valor"><input id="in-ca" type="number" value="' + ca + '"></div><small>auto: ' + WNJ.calcCA(cfg, t) + '</small></div>' +
            '<div class="auto-card"><div class="rotulo">Deslocamento</div><div class="valor"><input id="in-desloc" type="number" value="' + desloc + '"></div><small>metros · auto: ' + WNJ.calcDeslocamento(cfg, t) + '</small></div>' +
            '<div class="auto-card"><div class="rotulo">Vida</div><div class="par"><input id="in-vida-atual" type="number" value="' + char.vidaAtual + '"> / <input id="in-vida-max" type="number" value="' + vidaMax + '"></div><small>inicial: ' + vidaAuto + ' (' + racaInfo.vidaBase + ' + ' + racaInfo.vidaPasso + ' a cada 2 Corpo)</small></div>' +
            '<div class="auto-card"><div class="rotulo">Arcana</div><div class="valor"><input id="in-arcana" type="number" value="' + arcana + '"></div><small>auto: ' + WNJ.calcArcana(cfg, char.rank) + '</small></div>' +
            '<div class="auto-card"><div class="rotulo">Magículas</div><div class="par"><input id="in-mag-atual" type="number" value="' + char.magiculasAtual + '"> / <input id="in-mag-max" type="number" value="' + magMax + '"></div><small>iniciais: Mana + ER = ' + magAuto + '</small></div>';

        $('in-ca').oninput = e => { char.caManual = parseInt(e.target.value) || 0; };
        $('in-desloc').oninput = e => { char.deslocManual = parseInt(e.target.value) || 0; };
        $('in-arcana').oninput = e => { char.arcanaManual = parseInt(e.target.value) || 0; };
        $('in-vida-atual').oninput = e => { char.vidaAtual = parseInt(e.target.value) || 0; };
        $('in-vida-max').oninput = e => { char.vidaMaxManual = parseInt(e.target.value) || 0; };
        $('in-mag-atual').oninput = e => { char.magiculasAtual = parseInt(e.target.value) || 0; };
        $('in-mag-max').oninput = e => { char.magiculasMax = parseInt(e.target.value) || 0; };
    }

    function renderAtributos() {
        const t = attrsTotais();
        $('attr-grid').innerHTML = cfg.atributos.map(a => {
            const mod = racaInfo.livre ? null : (racaInfo.mods[a.id] || 0);
            return '<div class="attr-card" style="background:' + a.cor + '18;border-color:' + a.cor + '">' +
                '<div class="nome" style="color:' + a.cor + '">' + a.nome.toUpperCase() + '</div>' +
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
    }

    function escalaTexto(pesos) {
        return Object.values(pesos).sort((a, b) => b - a).join('/') + (Object.keys(pesos).length === 1 ? '/0' : '');
    }

    function renderPericias() {
        const t = attrsTotais();
        const lista = WNJ.calcPericias(cfg, t);
        $('pericias-grid').innerHTML = lista.map(p => {
            const override = char.overridesPericias[p.nome];
            const manual = override !== undefined;
            const valor = manual ? override : p.valor;
            const corPrincipal = CORES[Object.entries(p.pesos).sort((a, b) => b[1] - a[1])[0][0]];
            return '<div class="pericia' + (manual ? ' editada' : '') + '" data-pericia="' + esc(p.nome) + '">' +
                '<span style="width:8px;height:8px;border-radius:50%;background:' + corPrincipal + ';flex:0 0 8px"></span>' +
                '<span class="pnome">' + esc(p.nome) + '</span>' +
                '<span class="escala">' + escalaTexto(p.pesos) + '</span>' +
                '<button class="reset" title="Voltar ao automático">↺</button>' +
                '<input type="number" value="' + valor + '">' +
                '</div>';
        }).join('');
        document.querySelectorAll('#pericias-grid .pericia').forEach(el => {
            const nome = el.dataset.pericia;
            el.querySelector('input').oninput = (e) => {
                char.overridesPericias[nome] = parseInt(e.target.value) || 0;
                el.classList.add('editada');
            };
            el.querySelector('.reset').onclick = () => {
                delete char.overridesPericias[nome];
                renderPericias();
            };
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
        renderPericias(); renderFiltrosPoder(); renderPoderes(); renderAtaques();
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
    $('btn-evoluir').onclick = async () => {
        let { rank, estrela } = char;
        const maxE = cfg.estrelas_por_rank || 5;
        if (rank === 10) { rank = 9; estrela = 1; }
        else if (estrela < maxE) { estrela++; }
        else if (rank > 3) { rank--; estrela = 1; }
        else { alert('Você já alcançou o topo: Rank 3 ★' + maxE + '!'); return; }
        char.rank = rank; char.estrela = estrela;
        await carregarRank();
        const novos = await sincronizarPoderes();
        WNJ.salvar(char);
        renderTudo();
        // popup
        $('evo-estrelas').textContent = '★'.repeat(estrela);
        $('evo-titulo').textContent = 'Parabéns! Rank ' + rank + ' — ' + estrela + 'ª Estrela';
        const texto = await WNJ.textoEstrela(cfg, rank, estrela);
        $('evo-ganhos').innerHTML = texto
            ? (typeof marked !== 'undefined' ? marked.parse(texto) : '<pre>' + esc(texto) + '</pre>')
            : '<em>Consulte a página do Rank ' + rank + ' para os ganhos desta estrela.</em>';
        if (novos > 0) {
            $('evo-ganhos').innerHTML += '<p style="color:#7fd08a"><strong>+' + novos + ' poder(es)</strong> adicionados à sua ficha.</p>';
        }
        abrirOverlay('ov-evo');
    };

    // ================= SALVAR / CRIAR / BAIXAR =================
    function coletarIdentidade() {
        char.nome = $('f-nome').value.trim();
        char.sobrenome = $('f-sobrenome').value.trim();
        char.titulo = $('f-titulo').value.trim();
        char.tituloArtigo = $('f-titulo-artigo').value;
    }
    $('btn-salvar').onclick = () => {
        coletarIdentidade();
        WNJ.salvar(char);
        const btn = $('btn-salvar');
        btn.textContent = '✔ Salvo!';
        setTimeout(() => btn.innerHTML = '💾 Salvar', 1400);
    };
    $('btn-criar').onclick = () => {
        coletarIdentidade();
        if (!char.nome) { alert('Dê um nome ao seu personagem!'); return; }
        WNJ.salvar(char);
        location.href = 'personagem.html#meus';
    };
    $('btn-baixar').onclick = async () => {
        coletarIdentidade();
        WNJ.salvar(char);
        await WNJExport.baixar(char);
    };

    // ================= INIT =================
    function popularSelect(id, lista) {
        const sel = $(id);
        sel.innerHTML = '<option value="">— escolher —</option>' +
            lista.map(x => '<option value="' + esc(x.nome) + '">' + esc(x.nome) + '</option>').join('');
    }
    popularSelect('f-raca', cfg.racas);
    popularSelect('f-classe1', cfg.classes_iniciais);
    popularSelect('f-classe2', cfg.classes_avancadas);
    popularSelect('f-magia', cfg.magias);

    await carregarRaca();
    await carregarRank();
    await sincronizarPoderes();
    renderTudo();
})();
