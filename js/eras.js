// js/eras.js
// Linha do tempo de Eras: mundos em abas, eras como retângulos (1 px = 1 ano),
// marcas de século, eventos com risco + nome e card em popup.
// Editores (colaboradores do repo) podem criar/arrastar/excluir; o resto vê.

(async function () {
    const ARQUIVO = 'contents/eras/eras.md';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const uid = () => 'x' + Math.random().toString(36).slice(2, 9);

    let dados = { mundos: [] };
    let mundoIdx = 0;
    let sujo = false;                       // há alterações não salvas no GitHub
    const editor = () => typeof WNJAuth !== 'undefined' && WNJAuth.podeEditar();

    // ---------------- CARREGAR ----------------
    function extrairJson(texto) {
        if (!texto) return null;
        const m = texto.match(/```json\r?\n([\s\S]*?)```/);
        if (!m) return null;
        try { return JSON.parse(m[1]); } catch (e) { console.error('JSON das eras inválido', e); return null; }
    }

    async function carregar() {
        // rascunho local (edições ainda não commitadas) tem prioridade para editores
        const rascunho = localStorage.getItem('wnj_eras_rascunho');
        try {
            const { texto } = await WNJAuth.lerArquivo(ARQUIVO);
            const remoto = extrairJson(texto);
            if (remoto && Array.isArray(remoto.mundos)) dados = remoto;
        } catch (e) { console.warn('Não consegui ler as eras:', e.message); }

        if (rascunho && editor()) {
            try {
                const r = JSON.parse(rascunho);
                if (r && Array.isArray(r.mundos)) { dados = r; sujo = true; }
            } catch (e) { /* ignora rascunho inválido */ }
        }
        if (!dados.mundos.length) dados.mundos = [{ id: uid(), nome: 'Mundo 1', eras: [] }];
    }

    function marcarSujo() {
        sujo = true;
        try { localStorage.setItem('wnj_eras_rascunho', JSON.stringify(dados)); } catch (e) {}
        renderAbas();
    }

    async function salvarNoGitHub() {
        if (!editor()) return;
        const btn = $('btn-salvar-eras');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Salvando...'; }
        try {
            const { texto } = await WNJAuth.lerArquivo(ARQUIVO);
            const base = texto || '# Eras — Linha do Tempo de Luxsandoria\n\n```json\n{}\n```\n';
            const novo = base.replace(/```json\r?\n[\s\S]*?```/,
                '```json\n' + JSON.stringify(dados, null, 2) + '\n```');
            await WNJAuth.salvarArquivo(ARQUIVO, novo, 'Atualizando Eras pela página');
            localStorage.removeItem('wnj_eras_rascunho');
            sujo = false;
            renderAbas();
            alert('✓ Eras salvas no repositório! O site público atualiza em alguns segundos.');
        } catch (e) {
            alert('Erro ao salvar: ' + e.message);
        } finally {
            if (btn) { btn.disabled = false; }
            renderAbas();
        }
    }

    const mundo = () => dados.mundos[mundoIdx] || { eras: [] };
    const totalAnos = () => mundo().eras.reduce((s, e) => s + (e.anos || 0), 0);

    // ---------------- IMAGENS ----------------
    function redimensionar(file, max, quadrado) {
        return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => {
                const cv = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (quadrado) {
                    cv.width = cv.height = max;
                    const lado = Math.min(w, h);
                    cv.getContext('2d').drawImage(img, (w - lado) / 2, (h - lado) / 2, lado, lado, 0, 0, max, max);
                } else {
                    const sc = Math.min(1, max / Math.max(w, h));
                    cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
                    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                }
                res(cv.toDataURL('image/jpeg', 0.82));
            };
            img.onerror = rej;
            img.src = URL.createObjectURL(file);
        });
    }

    // ---------------- ABAS ----------------
    function renderAbas() {
        const bar = $('mundos-bar');
        let html = dados.mundos.map((m, i) =>
            '<button class="mundo-aba' + (i === mundoIdx ? ' ativa' : '') + '" data-mundo="' + i + '">' + esc(m.nome) + '</button>'
        ).join('');
        if (editor()) html += '<button class="mundo-add" id="add-mundo" title="Novo mundo">+</button>';
        html += '<div class="aba-acoes">';
        if (editor()) {
            html += '<button class="b azul" id="btn-editar-mundo" style="padding:7px 14px">✏️ Mundo</button>';
            html += '<button class="b ' + (sujo ? 'ouro' : 'fantasma') + '" id="btn-salvar-eras" style="padding:7px 14px">'
                 + (sujo ? '💾 Salvar alterações •' : '💾 Salvo') + '</button>';
        }
        html += '</div>';
        bar.innerHTML = html;

        bar.querySelectorAll('[data-mundo]').forEach(b => {
            b.onclick = () => { mundoIdx = parseInt(b.dataset.mundo, 10); renderAbas(); renderLinha(); };
        });
        if ($('add-mundo')) $('add-mundo').onclick = () => abrirMundo(null);
        if ($('btn-editar-mundo')) $('btn-editar-mundo').onclick = () => abrirMundo(mundoIdx);
        if ($('btn-salvar-eras')) $('btn-salvar-eras').onclick = salvarNoGitHub;
    }

    // ---------------- LINHA DO TEMPO ----------------
    function renderLinha() {
        const area = $('linha-area');
        const eras = mundo().eras;
        if (!eras.length) {
            area.innerHTML = '<div class="vazio-aviso"><span class="icone">🕰️</span>' +
                (editor()
                    ? 'Nenhuma era neste mundo ainda.<br>Crie o primeiro período de tempo abaixo.'
                    : 'Nenhuma era registrada neste mundo ainda.') +
                '</div>' + (editor() ? botaoNovaEra() : '');
            ligarNovaEra();
            atualizarHud(null);
            return;
        }

        let acumulado = 0;
        let html = '<div class="coluna" id="coluna">';
        eras.forEach((era, idx) => {
            const anos = Math.max(1, era.anos || 1);
            const inicio = acumulado;
            html += '<div class="era" data-era="' + idx + '" style="height:' + anos + 'px;background:' + esc(era.cor || '#8a5cf6') + '">';

            // conteúdo DENTRO do retângulo: nome, duração e imagem (se couber)
            html += '<div class="era-dentro"><div class="nome">' + esc(era.nome || 'Era sem nome') + '</div>' +
                '<div class="anos">ano ' + inicio + ' – ' + (inicio + anos) + ' · ' + anos + ' anos</div>' +
                (era.img && anos >= 170 ? '<img src="' + era.img + '" alt="">' : '') + '</div>';

            // marcas de século
            for (let y = 100; y < anos; y += 100) {
                html += '<div class="seculo" style="top:' + y + 'px;background:' + esc(era.cor || '#fff') + '">' +
                    '<span>ano ' + (inicio + y) + '</span></div>';
            }

            // eventos
            (era.eventos || []).slice().sort((a, b) => (a.ano || 0) - (b.ano || 0)).forEach(ev => {
                const y = Math.min(anos, Math.max(0, ev.ano || 0));
                html += '<div class="evento" data-era="' + idx + '" data-evento="' + esc(ev.id) + '" style="top:' + y + 'px">' +
                    '<div class="txt"><b>' + esc(ev.nome || 'Evento') + '</b><small>ano ' + (inicio + y) + '</small></div>' +
                    '<div class="risco"></div></div>';
            });

            if (editor()) html += '<div class="alca" data-alca="' + idx + '" title="Arraste para mudar a duração"></div>';
            html += '</div>';
            acumulado += anos;
        });
        html += '</div>';
        if (editor()) html += botaoNovaEra();
        area.innerHTML = html;

        ligarNovaEra();
        ligarEras();
        atualizarHud(null);
    }

    function botaoNovaEra() {
        return '<div style="margin-top:26px"><button class="btn-nova-era" id="btn-nova-era"></button>' +
            '<div class="legenda-nova">Criar novo período de tempo</div></div>';
    }
    function ligarNovaEra() {
        if ($('btn-nova-era')) $('btn-nova-era').onclick = () => abrirEra(null);
    }

    function ligarEras() {
        // eventos (clique abre o card)
        document.querySelectorAll('.evento').forEach(el => {
            el.onclick = (e) => {
                e.stopPropagation();
                abrirCard(parseInt(el.dataset.era, 10), el.dataset.evento);
            };
        });

        // alças de arrastar
        document.querySelectorAll('[data-alca]').forEach(al => {
            al.onmousedown = (e) => {
                e.preventDefault(); e.stopPropagation();
                const idx = parseInt(al.dataset.alca, 10);
                const era = mundo().eras[idx];
                const caixa = al.closest('.era');
                const rotulo = caixa.querySelector('.era-dentro .anos');
                const y0 = e.clientY, anos0 = era.anos || 1;
                const mover = (ev) => {
                    const novo = Math.max(20, anos0 + (ev.clientY - y0));
                    caixa.style.height = novo + 'px';
                    if (rotulo) rotulo.textContent = novo + ' anos (arrastando...)';
                    atualizarHud(ev.clientY);
                };
                const soltar = (ev) => {
                    document.removeEventListener('mousemove', mover);
                    document.removeEventListener('mouseup', soltar);
                    era.anos = Math.max(20, anos0 + (ev.clientY - y0));
                    marcarSujo();
                    renderLinha();
                };
                document.addEventListener('mousemove', mover);
                document.addEventListener('mouseup', soltar);
            };
        });

        // retângulo da era: hover mostra o risco/ano; clique abre o menu (editor)
        document.querySelectorAll('.era').forEach(el => {
            const idx = parseInt(el.dataset.era, 10);
            el.onmousemove = (e) => {
                atualizarHud(e.clientY);
                if (!editor()) return;
                const r = el.getBoundingClientRect();
                const y = Math.round(e.clientY - r.top);
                let f = el.querySelector('.fantasma');
                if (!f) {
                    f = document.createElement('div');
                    f.className = 'fantasma';
                    f.innerHTML = '<div class="txt"></div><div class="risco"></div>';
                    el.appendChild(f);
                }
                f.style.top = y + 'px';
                f.querySelector('.txt').textContent = 'ano ' + (anoInicial(idx) + y) + ' — clique para marcar';
            };
            el.onmouseleave = () => {
                const f = el.querySelector('.fantasma');
                if (f) f.remove();
            };
            el.onclick = (e) => {
                if (!editor()) return;
                const r = el.getBoundingClientRect();
                abrirMenuEra(idx, Math.round(e.clientY - r.top), e.clientX, e.clientY);
            };
        });
    }

    function anoInicial(idx) {
        return mundo().eras.slice(0, idx).reduce((s, e) => s + (e.anos || 0), 0);
    }

    // ---------------- HUD DO ANO ----------------
    function atualizarHud(clientY) {
        const eras = mundo().eras;
        $('hud-total').textContent = eras.length
            ? 'Total do mundo: ' + totalAnos() + ' anos · ' + eras.length + ' era(s)'
            : 'Nenhuma era neste mundo';
        if (!eras.length) {
            $('hud-ano').textContent = '—'; $('hud-era').textContent = '—'; $('hud-dentro').textContent = '';
            return;
        }
        const ref = clientY == null ? (window.innerHeight / 2) : clientY;
        const caixas = document.querySelectorAll('.era');
        let achou = -1, dentro = 0;
        caixas.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            if (ref >= r.top && ref <= r.bottom) { achou = i; dentro = Math.round(ref - r.top); }
        });
        if (achou < 0) {
            // fora de qualquer era: mostra o total
            $('hud-ano').textContent = 'ano ' + totalAnos();
            $('hud-era').textContent = '—';
            $('hud-era').style.color = '#cfe1f0';
            $('hud-dentro').textContent = 'Passe o mouse sobre uma era';
            return;
        }
        const era = eras[achou];
        $('hud-ano').textContent = 'ano ' + (anoInicial(achou) + dentro);
        $('hud-era').textContent = era.nome || 'Era sem nome';
        $('hud-era').style.color = era.cor || '#f0d17a';
        $('hud-dentro').textContent = 'ano ' + dentro + ' de ' + (era.anos || 0) + ' dentro da era';
    }

    // ---------------- MENU DA ERA ----------------
    let menuAberto = null;
    function fecharMenu() { if (menuAberto) { menuAberto.remove(); menuAberto = null; } }
    document.addEventListener('click', (e) => {
        if (menuAberto && !menuAberto.contains(e.target)) fecharMenu();
    }, true);

    function abrirMenuEra(idx, anoRel, x, y) {
        fecharMenu();
        const era = mundo().eras[idx];
        const m = document.createElement('div');
        m.className = 'menu-era';
        m.style.left = Math.min(x + 6, window.innerWidth - 230) + 'px';
        m.style.top = (y + window.scrollY + 6) + 'px';
        m.innerHTML =
            '<div class="cab">' + esc(era.nome || 'Era') + ' · ano ' + (anoInicial(idx) + anoRel) + '</div>' +
            '<button data-acao="evento">➕ Adicionar evento aqui</button>' +
            '<button data-acao="editar">✏️ Editar era</button>' +
            '<button data-acao="excluir" style="color:#ff9b9b">🗑 Excluir era</button>';
        document.body.appendChild(m);
        menuAberto = m;
        m.querySelectorAll('[data-acao]').forEach(b => {
            b.onclick = (e) => {
                e.stopPropagation();
                const a = b.dataset.acao;
                fecharMenu();
                if (a === 'evento') abrirEvento(idx, null, anoRel);
                if (a === 'editar') abrirEra(idx);
                if (a === 'excluir') {
                    if (confirm('Excluir a era "' + (era.nome || 'sem nome') + '" e todos os seus eventos?')) {
                        mundo().eras.splice(idx, 1);
                        marcarSujo(); renderLinha();
                    }
                }
            };
        });
    }

    // ---------------- MODAIS ----------------
    const abrir = (id) => $(id).classList.add('aberto');
    const fechar = (id) => $(id).classList.remove('aberto');
    document.querySelectorAll('[data-fechar]').forEach(b => {
        b.onclick = () => b.closest('.ov').classList.remove('aberto');
    });
    document.querySelectorAll('.ov').forEach(ov => {
        ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('aberto'); });
    });

    // --- MUNDO ---
    let mundoEditando = null;
    function abrirMundo(idx) {
        mundoEditando = idx;
        $('mundo-titulo').textContent = idx == null ? 'Novo Mundo' : 'Editar Mundo';
        $('mundo-nome').value = idx == null ? '' : (dados.mundos[idx].nome || '');
        $('mundo-excluir').style.display = (idx != null && dados.mundos.length > 1) ? '' : 'none';
        abrir('ov-mundo');
    }
    $('mundo-salvar').onclick = () => {
        const nome = $('mundo-nome').value.trim();
        if (!nome) { alert('Dê um nome ao mundo.'); return; }
        if (mundoEditando == null) {
            dados.mundos.push({ id: uid(), nome, eras: [] });
            mundoIdx = dados.mundos.length - 1;
        } else {
            dados.mundos[mundoEditando].nome = nome;
        }
        fechar('ov-mundo'); marcarSujo(); renderAbas(); renderLinha();
    };
    $('mundo-excluir').onclick = () => {
        const m = dados.mundos[mundoEditando];
        if (!confirm('Excluir o mundo "' + m.nome + '" com todas as suas eras?')) return;
        dados.mundos.splice(mundoEditando, 1);
        mundoIdx = 0;
        fechar('ov-mundo'); marcarSujo(); renderAbas(); renderLinha();
    };

    // --- ERA ---
    let eraEditando = null, eraImgTmp = null;
    function abrirEra(idx) {
        eraEditando = idx;
        const era = idx == null ? null : mundo().eras[idx];
        $('era-titulo').textContent = idx == null ? 'Novo Período de Tempo' : 'Editar Era';
        $('era-nome').value = era ? (era.nome || '') : '';
        $('era-cor').value = era ? (era.cor || '#8a5cf6') : '#8a5cf6';
        $('era-anos').value = era ? (era.anos || 300) : 300;
        eraImgTmp = era ? (era.img || null) : null;
        $('era-img').value = '';
        $('era-img-previa').innerHTML = eraImgTmp ? '<img src="' + eraImgTmp + '" alt="">' : '';
        abrir('ov-era');
    }
    $('era-img').onchange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        eraImgTmp = await redimensionar(f, 128, true);
        $('era-img-previa').innerHTML = '<img src="' + eraImgTmp + '" alt="">';
    };
    $('era-salvar').onclick = () => {
        const nome = $('era-nome').value.trim();
        if (!nome) { alert('Dê um nome à era.'); return; }
        const dados_era = {
            nome,
            cor: $('era-cor').value,
            anos: Math.max(20, parseInt($('era-anos').value, 10) || 300),
            img: eraImgTmp || null
        };
        if (eraEditando == null) {
            mundo().eras.push(Object.assign({ id: uid(), eventos: [] }, dados_era));
        } else {
            Object.assign(mundo().eras[eraEditando], dados_era);
        }
        fechar('ov-era'); marcarSujo(); renderLinha();
    };

    // --- EVENTO ---
    let evEra = null, evId = null, evFotos = [];
    function abrirEvento(eraIdx, eventoId, anoSugerido) {
        evEra = eraIdx; evId = eventoId;
        const era = mundo().eras[eraIdx];
        const ev = eventoId ? (era.eventos || []).find(x => x.id === eventoId) : null;
        $('evento-titulo').textContent = ev ? 'Editar Evento' : 'Novo Evento';
        $('evento-ano-info').textContent = 'Era: ' + (era.nome || '—') + ' (0 a ' + (era.anos || 0) + ' anos) · começa no ano ' + anoInicial(eraIdx) + ' do mundo';
        $('evento-nome').value = ev ? (ev.nome || '') : '';
        $('evento-ano').value = ev ? (ev.ano || 0) : (anoSugerido || 0);
        $('evento-desc').value = ev ? (ev.desc || '') : '';
        evFotos = ev && ev.fotos ? ev.fotos.slice() : [];
        $('evento-fotos').value = '';
        renderPreviaFotos();
        $('evento-excluir').style.display = ev ? '' : 'none';
        abrir('ov-evento');
    }
    function renderPreviaFotos() {
        $('evento-fotos-previa').innerHTML = evFotos.map((f, i) =>
            '<img src="' + f + '" alt="" title="Clique para remover" data-foto="' + i + '" style="cursor:pointer">').join('');
        document.querySelectorAll('#evento-fotos-previa [data-foto]').forEach(im => {
            im.onclick = () => { evFotos.splice(parseInt(im.dataset.foto, 10), 1); renderPreviaFotos(); };
        });
    }
    $('evento-fotos').onchange = async (e) => {
        for (const f of e.target.files) evFotos.push(await redimensionar(f, 900, false));
        renderPreviaFotos();
    };
    $('evento-salvar').onclick = () => {
        const nome = $('evento-nome').value.trim();
        if (!nome) { alert('Dê um nome ao evento.'); return; }
        const era = mundo().eras[evEra];
        era.eventos = era.eventos || [];
        const dadosEv = {
            nome,
            ano: Math.max(0, Math.min(era.anos || 0, parseInt($('evento-ano').value, 10) || 0)),
            desc: $('evento-desc').value,
            fotos: evFotos.slice()
        };
        if (evId) Object.assign(era.eventos.find(x => x.id === evId), dadosEv);
        else era.eventos.push(Object.assign({ id: uid() }, dadosEv));
        fechar('ov-evento'); marcarSujo(); renderLinha();
    };
    $('evento-excluir').onclick = () => {
        const era = mundo().eras[evEra];
        const ev = (era.eventos || []).find(x => x.id === evId);
        if (!ev || !confirm('Excluir o evento "' + ev.nome + '"?')) return;
        era.eventos = era.eventos.filter(x => x.id !== evId);
        fechar('ov-evento'); marcarSujo(); renderLinha();
    };

    // --- CARD DO EVENTO ---
    function abrirCard(eraIdx, eventoId) {
        const era = mundo().eras[eraIdx];
        const ev = (era.eventos || []).find(x => x.id === eventoId);
        if (!ev) return;
        const anoMundo = anoInicial(eraIdx) + (ev.ano || 0);
        $('card-box').style.borderTopColor = era.cor || '#f0d17a';
        $('card-titulo').textContent = ev.nome || 'Evento';
        $('card-titulo').style.color = era.cor || '#f0d17a';
        $('card-ano').textContent = 'Ano ' + anoMundo + ' do mundo · ano ' + (ev.ano || 0) + ' da ' + (era.nome || 'era');
        $('card-desc').textContent = ev.desc || '(sem descrição)';
        $('card-fotos').innerHTML = (ev.fotos || []).map(f => '<img src="' + f + '" alt="">').join('');
        const bEd = $('card-editar');
        bEd.style.display = editor() ? '' : 'none';
        bEd.onclick = () => { fechar('ov-card'); abrirEvento(eraIdx, eventoId, ev.ano); };
        abrir('ov-card');
    }

    // ---------------- INIT ----------------
    window.addEventListener('scroll', () => atualizarHud(null), { passive: true });
    document.addEventListener('wnj-auth', () => { renderAbas(); renderLinha(); });

    await carregar();
    renderAbas();
    renderLinha();

    if (!editor()) {
        const aviso = document.createElement('div');
        aviso.className = 'modo-leitura-aviso';
        aviso.innerHTML = '👁 Modo leitura — entre com o GitHub para editar';
        aviso.style.cursor = 'pointer';
        aviso.onclick = () => WNJAuth.abrirLogin();
        document.body.appendChild(aviso);
    }
})();
