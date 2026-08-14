// js/mapa.js
// Atlas de Luxsandoria: abas de mapas, zoom/pan na imagem, marcadores fixos
// com filtro por tipo (legenda) e por campanha, e card do local em popup.
// Editores (colaboradores do repo) criam/editam; o resto só visualiza.

(async function () {
    const ARQUIVO = 'contents/mapa/mapas.md';
    const PASTA_IMG = 'assets/mapas/';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const uid = () => 'x' + Math.random().toString(36).slice(2, 9);
    const slug = (s) => String(s || 'mapa').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mapa';

    const TIPOS_PADRAO = [
        { id: 'capital', nome: 'Capital', icone: '🏰', cor: '#f0d17a' },
        { id: 'cidade', nome: 'Cidade', icone: '🏘️', cor: '#58A0C8' },
        { id: 'vila', nome: 'Vila', icone: '🏡', cor: '#7fd08a' },
        { id: 'dungeon', nome: 'Dungeon', icone: '💀', cor: '#e04343' },
        { id: 'ruina', nome: 'Ruína', icone: '🏛️', cor: '#b9a68a' },
        { id: 'floresta', nome: 'Floresta', icone: '🌲', cor: '#3fbf6a' },
        { id: 'montanha', nome: 'Montanha', icone: '⛰️', cor: '#9aa7b5' },
        { id: 'agua', nome: 'Mar / Rio', icone: '🌊', cor: '#4aa3ff' },
        { id: 'marco', nome: 'Marco', icone: '✦', cor: '#c58cf6' },
        { id: 'outro', nome: 'Outro', icone: '📍', cor: '#ffffff' }
    ];

    let dados = { tipos: TIPOS_PADRAO.slice(), mapas: [] };
    let mapaIdx = 0, sujo = false;
    let zoom = 1, panX = 0, panY = 0;
    let imgW = 0, imgH = 0;
    const tiposOff = new Set();
    let campanhaSel = '';

    const editor = () => typeof WNJAuth !== 'undefined' && WNJAuth.podeEditar();
    const mapa = () => dados.mapas[mapaIdx] || { locais: [] };
    const tipoDe = (id) => dados.tipos.find(t => t.id === id) || dados.tipos[dados.tipos.length - 1] || TIPOS_PADRAO[9];

    // ---------------- DADOS ----------------
    function extrairJson(texto) {
        if (!texto) return null;
        const m = texto.match(/```json\r?\n([\s\S]*?)```/);
        if (!m) return null;
        try { return JSON.parse(m[1]); } catch (e) { console.error('JSON dos mapas inválido', e); return null; }
    }

    async function carregar() {
        try {
            const { texto } = await WNJAuth.lerArquivo(ARQUIVO);
            const remoto = extrairJson(texto);
            if (remoto) {
                if (Array.isArray(remoto.mapas)) dados.mapas = remoto.mapas;
                if (Array.isArray(remoto.tipos) && remoto.tipos.length) dados.tipos = remoto.tipos;
            }
        } catch (e) { console.warn('Não consegui ler os mapas:', e.message); }

        const rascunho = localStorage.getItem('wnj_mapas_rascunho');
        if (rascunho && editor()) {
            try {
                const r = JSON.parse(rascunho);
                if (r && Array.isArray(r.mapas)) { dados = r; sujo = true; }
            } catch (e) { /* rascunho inválido */ }
        }
        // normaliza: um arquivo/rascunho sem "tipos" válidos não pode derrubar a página
        if (!Array.isArray(dados.tipos) || !dados.tipos.length) dados.tipos = TIPOS_PADRAO.slice();
        if (!Array.isArray(dados.mapas) || !dados.mapas.length) dados.mapas = [{ id: uid(), nome: 'Mundo', imagem: '', locais: [] }];
        dados.mapas.forEach(m => { if (!Array.isArray(m.locais)) m.locais = []; });
    }

    function marcarSujo() {
        sujo = true;
        try { localStorage.setItem('wnj_mapas_rascunho', JSON.stringify(dados)); } catch (e) {}
        renderAbas();
    }

    async function salvarNoGitHub() {
        if (!editor()) return;
        const btn = $('btn-salvar-mapas');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Salvando...'; }
        try {
            const { texto } = await WNJAuth.lerArquivo(ARQUIVO);
            const base = texto || '# Mapas — Atlas de Luxsandoria\n\n```json\n{}\n```\n';
            const novo = base.replace(/```json\r?\n[\s\S]*?```/,
                '```json\n' + JSON.stringify(dados, null, 2) + '\n```');
            await WNJAuth.salvarArquivo(ARQUIVO, novo, 'Atualizando Mapas pela página');
            localStorage.removeItem('wnj_mapas_rascunho');
            sujo = false;
            alert('✓ Mapas salvos no repositório! O site público atualiza em alguns segundos.');
        } catch (e) {
            alert('Erro ao salvar: ' + e.message);
        } finally {
            if (btn) btn.disabled = false;
            renderAbas();
        }
    }

    // ---------------- IMAGENS ----------------
    // Redimensiona e devolve { base64, dataUrl } para commitar como arquivo.
    function prepararImagem(file, maxLado) {
        return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => {
                const cv = document.createElement('canvas');
                const sc = Math.min(1, maxLado / Math.max(img.width, img.height));
                cv.width = Math.round(img.width * sc);
                cv.height = Math.round(img.height * sc);
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                const dataUrl = cv.toDataURL('image/jpeg', 0.85);
                res({ dataUrl, base64: dataUrl.split(',')[1] });
            };
            img.onerror = rej;
            img.src = URL.createObjectURL(file);
        });
    }

    async function enviarImagem(file, maxLado, prefixo) {
        const { dataUrl, base64 } = await prepararImagem(file, maxLado);
        if (!editor()) return { caminho: null, dataUrl };
        const caminho = PASTA_IMG + prefixo + '-' + uid() + '.jpg';
        await WNJAuth.salvarArquivoBase64(caminho, base64, 'Enviando imagem ' + caminho);
        return { caminho, dataUrl };
    }

    // ---------------- ABAS ----------------
    function renderAbas() {
        const bar = $('mapas-bar');
        let html = dados.mapas.map((m, i) =>
            '<button class="mapa-aba' + (i === mapaIdx ? ' ativa' : '') + '" data-mapa="' + i + '">' + esc(m.nome) + '</button>'
        ).join('');
        if (editor()) html += '<button class="mapa-add" id="add-mapa" title="Novo mapa">+</button>';
        html += '<div class="bar-acoes">';
        if (editor()) {
            html += '<button class="b azul" id="btn-editar-mapa" style="padding:7px 14px">✏️ Mapa</button>';
            html += '<button class="b ' + (sujo ? 'ouro' : 'fantasma') + '" id="btn-salvar-mapas" style="padding:7px 14px">'
                + (sujo ? '💾 Salvar alterações •' : '💾 Salvo') + '</button>';
        }
        html += '</div>';
        bar.innerHTML = html;

        bar.querySelectorAll('[data-mapa]').forEach(b => {
            b.onclick = () => {
                mapaIdx = parseInt(b.dataset.mapa, 10);
                tiposOff.clear(); campanhaSel = '';
                renderAbas(); renderMapa(true);
            };
        });
        if ($('add-mapa')) $('add-mapa').onclick = () => abrirMapa(null);
        if ($('btn-editar-mapa')) $('btn-editar-mapa').onclick = () => abrirMapa(mapaIdx);
        if ($('btn-salvar-mapas')) $('btn-salvar-mapas').onclick = salvarNoGitHub;
    }

    // ---------------- MAPA ----------------
    function aplicarTransform() {
        const p = $('palco');
        p.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
        p.style.setProperty('--inv', 1 / zoom);
        $('zoom-val').textContent = Math.round(zoom * 100) + '%';
    }

    function enquadrar() {
        const v = $('visor');
        if (!imgW || !imgH) { zoom = 1; panX = panY = 0; aplicarTransform(); return; }
        zoom = Math.min(v.clientWidth / imgW, v.clientHeight / imgH);
        panX = (v.clientWidth - imgW * zoom) / 2;
        panY = (v.clientHeight - imgH * zoom) / 2;
        aplicarTransform();
    }

    function locaisVisiveis() {
        return (mapa().locais || []).filter(l =>
            !tiposOff.has(l.tipo) &&
            (!campanhaSel || (l.campanhas || []).includes(campanhaSel))
        );
    }

    function renderMapa(reenquadrar) {
        const m = mapa();
        const palco = $('palco');
        const semMapaAntigo = $('sem-mapa');
        if (semMapaAntigo) semMapaAntigo.remove();

        if (!m.imagem) {
            palco.innerHTML = '';
            const aviso = document.createElement('div');
            aviso.className = 'sem-mapa';
            aviso.id = 'sem-mapa';
            aviso.innerHTML = '<div class="icone">🗺️</div><div>' +
                (editor() ? 'Este mapa ainda não tem imagem.' : 'Este mapa ainda não tem imagem.') + '</div>' +
                (editor() ? '<button class="b ouro" id="btn-por-imagem">🖼️ Escolher imagem do mapa</button>' : '');
            $('visor').appendChild(aviso);
            if ($('btn-por-imagem')) $('btn-por-imagem').onclick = () => abrirMapa(mapaIdx);
            renderLegenda(); renderCampanhas();
            return;
        }

        // handlers antes do src, senão uma imagem em cache pode não disparar onload
        palco.innerHTML = '';
        const el = document.createElement('img');
        el.className = 'mapa-img';
        el.id = 'mapa-img-el';
        el.alt = m.nome || '';
        const pronto = () => {
            imgW = el.naturalWidth; imgH = el.naturalHeight;
            if (reenquadrar) enquadrar(); else aplicarTransform();
            renderPinos();
        };
        el.onload = pronto;
        el.onerror = () => {
            palco.innerHTML = '';
            const aviso = document.createElement('div');
            aviso.className = 'sem-mapa'; aviso.id = 'sem-mapa';
            aviso.innerHTML = '<div class="icone">⚠️</div><div>Não consegui carregar <code>' + esc(m.imagem) + '</code>.<br>' +
                'Se acabou de enviar, aguarde o GitHub Pages publicar o arquivo.</div>';
            $('visor').appendChild(aviso);
        };
        palco.appendChild(el);
        el.src = m.imagem;
        if (el.complete && el.naturalWidth) pronto();   // já estava em cache
        renderLegenda(); renderCampanhas();
    }

    function renderPinos() {
        const palco = $('palco');
        palco.querySelectorAll('.pino').forEach(p => p.remove());
        locaisVisiveis().forEach(l => {
            const t = tipoDe(l.tipo);
            const d = document.createElement('div');
            d.className = 'pino';
            d.style.setProperty('--cor', t.cor);
            d.style.left = (l.x * imgW) + 'px';
            d.style.top = (l.y * imgH) + 'px';
            d.dataset.local = l.id;
            d.innerHTML = '<span>' + t.icone + '</span><span class="rotulo">' + esc(l.nome) + '</span>';
            d.addEventListener('mousedown', e => e.stopPropagation());
            d.onclick = (e) => { e.stopPropagation(); abrirCard(l.id); };
            palco.appendChild(d);
        });
        aplicarTransform();
    }

    function renderLegenda() {
        const usados = {};
        (mapa().locais || []).forEach(l => { usados[l.tipo] = (usados[l.tipo] || 0) + 1; });
        const lista = dados.tipos.filter(t => usados[t.id]);
        const box = $('legenda');
        if (!lista.length) { box.style.display = 'none'; return; }
        box.style.display = '';
        box.innerHTML = '<div class="tit">Tipos de local</div>' + lista.map(t =>
            '<button class="leg-item' + (tiposOff.has(t.id) ? ' off' : '') + '" data-tipo="' + t.id + '">' +
            '<span class="bolinha" style="border-color:' + t.cor + ';background:' + t.cor + '33"></span>' +
            '<span>' + t.icone + ' ' + esc(t.nome) + '</span><span class="qtd">' + usados[t.id] + '</span></button>'
        ).join('');
        box.querySelectorAll('[data-tipo]').forEach(b => {
            b.onclick = () => {
                const id = b.dataset.tipo;
                if (tiposOff.has(id)) tiposOff.delete(id); else tiposOff.add(id);
                renderLegenda(); renderPinos();
            };
        });
    }

    function renderCampanhas() {
        const set = new Set();
        (mapa().locais || []).forEach(l => (l.campanhas || []).forEach(c => c && set.add(c)));
        const nomes = [...set].sort((a, b) => a.localeCompare(b));
        const box = $('filtro-campanha');
        if (!nomes.length) { box.style.display = 'none'; campanhaSel = ''; return; }
        box.style.display = '';
        const sel = $('sel-campanha');
        sel.innerHTML = '<option value="">Todas</option>' +
            nomes.map(n => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('');
        sel.value = campanhaSel;
        sel.onchange = () => { campanhaSel = sel.value; renderPinos(); };
    }

    // ---------------- ZOOM / PAN ----------------
    const visor = $('visor');
    visor.addEventListener('wheel', (e) => {
        if (!mapa().imagem) return;
        e.preventDefault();
        const r = visor.getBoundingClientRect();
        const cx = e.clientX - r.left, cy = e.clientY - r.top;
        const fator = e.deltaY < 0 ? 1.18 : 1 / 1.18;
        const novo = Math.min(12, Math.max(0.05, zoom * fator));
        panX = cx - (cx - panX) * (novo / zoom);
        panY = cy - (cy - panY) * (novo / zoom);
        zoom = novo;
        aplicarTransform();
    }, { passive: false });

    let arrastando = false, moveu = 0, sx = 0, sy = 0;
    visor.addEventListener('mousedown', (e) => {
        if (!mapa().imagem || e.button !== 0) return;
        arrastando = true; moveu = 0; sx = e.clientX; sy = e.clientY;
        visor.classList.add('arrastando');
    });
    window.addEventListener('mousemove', (e) => {
        if (!arrastando) return;
        panX += e.clientX - sx; panY += e.clientY - sy;
        moveu += Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy);
        sx = e.clientX; sy = e.clientY;
        aplicarTransform();
    });
    window.addEventListener('mouseup', (e) => {
        if (!arrastando) return;
        arrastando = false;
        visor.classList.remove('arrastando');
        // clique curto (não arrasto) em área vazia do mapa: menu de contexto
        const alvo = (e.target && e.target.closest) ? e.target : null;
        const emUI = alvo && alvo.closest('.painel, .pino, .menu-ctx, .sem-mapa, .ov');
        if (moveu < 5 && editor() && mapa().imagem && !emUI) {
            const r = visor.getBoundingClientRect();
            const x = ((e.clientX - r.left) - panX) / zoom / imgW;
            const y = ((e.clientY - r.top) - panY) / zoom / imgH;
            if (x >= 0 && x <= 1 && y >= 0 && y <= 1) abrirMenuMapa(x, y, e.clientX, e.clientY);
        }
    });

    $('zoom-mais').onclick = () => { zoomCentro(1.3); };
    $('zoom-menos').onclick = () => { zoomCentro(1 / 1.3); };
    $('zoom-reset').onclick = () => enquadrar();
    function zoomCentro(f) {
        const v = visor, cx = v.clientWidth / 2, cy = v.clientHeight / 2;
        const novo = Math.min(12, Math.max(0.05, zoom * f));
        panX = cx - (cx - panX) * (novo / zoom);
        panY = cy - (cy - panY) * (novo / zoom);
        zoom = novo; aplicarTransform();
    }
    window.addEventListener('resize', () => aplicarTransform());

    // ---------------- MENU DE CONTEXTO ----------------
    let menuAberto = null;
    function fecharMenu() { if (menuAberto) { menuAberto.remove(); menuAberto = null; } }
    document.addEventListener('mousedown', (e) => {
        if (menuAberto && !menuAberto.contains(e.target)) fecharMenu();
    }, true);

    function abrirMenuMapa(x, y, cx, cy) {
        fecharMenu();
        const m = document.createElement('div');
        m.className = 'menu-ctx';
        m.style.left = Math.min(cx + 6, window.innerWidth - 230) + 'px';
        m.style.top = Math.min(cy + 6, window.innerHeight - 110) + 'px';
        m.innerHTML = '<div class="cab">' + (x * 100).toFixed(1) + '% , ' + (y * 100).toFixed(1) + '%</div>' +
            '<button data-acao="local">📍 Adicionar local aqui</button>';
        document.body.appendChild(m);
        menuAberto = m;
        m.querySelector('[data-acao="local"]').onclick = (ev) => {
            ev.stopPropagation(); fecharMenu(); abrirLocal(null, x, y);
        };
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

    // --- MAPA (aba) ---
    let mapaEditando = null, mapaImgTmp = null;
    function abrirMapa(idx) {
        mapaEditando = idx;
        const m = idx == null ? null : dados.mapas[idx];
        $('mapa-titulo').textContent = idx == null ? 'Novo Mapa' : 'Editar Mapa';
        $('mapa-nome').value = m ? (m.nome || '') : '';
        mapaImgTmp = null;
        $('mapa-img').value = '';
        $('mapa-img-previa').innerHTML = m && m.imagem ? '<img src="' + esc(m.imagem) + '" alt="">' : '';
        $('mapa-excluir').style.display = (idx != null && dados.mapas.length > 1) ? '' : 'none';
        abrir('ov-mapa');
    }
    $('mapa-img').onchange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        $('mapa-img-previa').innerHTML = '<div class="dica">⏳ Preparando imagem...</div>';
        try {
            const { dataUrl } = await prepararImagem(f, 2600);
            mapaImgTmp = f;
            $('mapa-img-previa').innerHTML = '<img src="' + dataUrl + '" alt="">';
        } catch (err) {
            $('mapa-img-previa').innerHTML = '<div class="dica">Não consegui ler a imagem.</div>';
        }
    };
    $('mapa-salvar').onclick = async () => {
        const nome = $('mapa-nome').value.trim();
        if (!nome) { alert('Dê um nome ao mapa.'); return; }
        const btn = $('mapa-salvar');
        btn.disabled = true;
        try {
            let caminho = mapaEditando == null ? '' : (dados.mapas[mapaEditando].imagem || '');
            if (mapaImgTmp) {
                btn.textContent = '⏳ Enviando imagem...';
                const r = await enviarImagem(mapaImgTmp, 2600, 'mapa-' + slug(nome));
                if (r.caminho) caminho = r.caminho;
            }
            if (mapaEditando == null) {
                dados.mapas.push({ id: uid(), nome, imagem: caminho, locais: [] });
                mapaIdx = dados.mapas.length - 1;
            } else {
                dados.mapas[mapaEditando].nome = nome;
                dados.mapas[mapaEditando].imagem = caminho;
            }
            fechar('ov-mapa'); marcarSujo(); renderAbas(); renderMapa(true);
        } catch (e) {
            alert('Erro ao enviar a imagem: ' + e.message);
        } finally {
            btn.disabled = false; btn.textContent = 'Salvar';
        }
    };
    $('mapa-excluir').onclick = () => {
        const m = dados.mapas[mapaEditando];
        if (!confirm('Excluir o mapa "' + m.nome + '" e todos os seus locais?')) return;
        dados.mapas.splice(mapaEditando, 1);
        mapaIdx = 0;
        fechar('ov-mapa'); marcarSujo(); renderAbas(); renderMapa(true);
    };

    // --- LOCAL ---
    let locId = null, locX = 0, locY = 0, locFotoTmp = null, locFotoAtual = null;
    function abrirLocal(id, x, y) {
        locId = id;
        const l = id ? (mapa().locais || []).find(v => v.id === id) : null;
        locX = l ? l.x : x; locY = l ? l.y : y;
        $('local-titulo').textContent = l ? 'Editar Local' : 'Novo Local';
        $('local-coord').textContent = 'Posição no mapa: ' + (locX * 100).toFixed(1) + '% , ' + (locY * 100).toFixed(1) + '%';
        $('local-nome').value = l ? (l.nome || '') : '';
        $('local-tipo').innerHTML = dados.tipos.map(t =>
            '<option value="' + t.id + '">' + t.icone + ' ' + esc(t.nome) + '</option>').join('');
        $('local-tipo').value = l ? (l.tipo || 'outro') : 'cidade';
        $('local-desc').value = l ? (l.desc || '') : '';
        $('local-campanhas').value = l ? (l.campanhas || []).join(', ') : '';
        locFotoTmp = null;
        locFotoAtual = l ? (l.foto || null) : null;
        $('local-foto').value = '';
        $('local-foto-previa').innerHTML = locFotoAtual ? '<img src="' + esc(locFotoAtual) + '" alt="">' : '';
        $('local-excluir').style.display = l ? '' : 'none';
        abrir('ov-local');
    }
    $('local-foto').onchange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        try {
            const { dataUrl } = await prepararImagem(f, 1200);
            locFotoTmp = f;
            $('local-foto-previa').innerHTML = '<img src="' + dataUrl + '" alt="">';
        } catch (err) { /* ignora */ }
    };
    $('local-salvar').onclick = async () => {
        const nome = $('local-nome').value.trim();
        if (!nome) { alert('Dê um nome ao local.'); return; }
        const btn = $('local-salvar');
        btn.disabled = true;
        try {
            let foto = locFotoAtual;
            if (locFotoTmp) {
                btn.textContent = '⏳ Enviando foto...';
                const r = await enviarImagem(locFotoTmp, 1200, 'local-' + slug(nome));
                if (r.caminho) foto = r.caminho;
            }
            const dadosLoc = {
                nome,
                tipo: $('local-tipo').value,
                x: locX, y: locY,
                foto: foto || null,
                desc: $('local-desc').value,
                campanhas: $('local-campanhas').value.split(',').map(s => s.trim()).filter(Boolean)
            };
            const m = mapa();
            m.locais = m.locais || [];
            if (locId) Object.assign(m.locais.find(v => v.id === locId), dadosLoc);
            else m.locais.push(Object.assign({ id: uid() }, dadosLoc));
            fechar('ov-local'); marcarSujo();
            renderPinos(); renderLegenda(); renderCampanhas();
        } catch (e) {
            alert('Erro ao enviar a foto: ' + e.message);
        } finally {
            btn.disabled = false; btn.textContent = 'Salvar';
        }
    };
    $('local-excluir').onclick = () => {
        const m = mapa();
        const l = (m.locais || []).find(v => v.id === locId);
        if (!l || !confirm('Excluir o local "' + l.nome + '"?')) return;
        m.locais = m.locais.filter(v => v.id !== locId);
        fechar('ov-local'); marcarSujo();
        renderPinos(); renderLegenda(); renderCampanhas();
    };

    // --- CARD DO LOCAL ---
    function abrirCard(id) {
        const l = (mapa().locais || []).find(v => v.id === id);
        if (!l) return;
        const t = tipoDe(l.tipo);
        $('card-box').style.borderTopColor = t.cor;
        const foto = $('card-foto');
        if (l.foto) { foto.src = l.foto; foto.style.display = ''; } else { foto.style.display = 'none'; }
        $('card-titulo').textContent = l.nome;
        $('card-titulo').style.color = t.cor;
        $('card-tipo').textContent = t.icone + ' ' + t.nome;
        $('card-desc').textContent = l.desc || '(sem descrição)';
        const camps = l.campanhas || [];
        $('card-campanhas').innerHTML = camps.length
            ? '<div class="tit">Aparece nas campanhas</div><div class="chips">' +
              camps.map(c => '<span class="chip">' + esc(c) + '</span>').join('') + '</div>'
            : '';
        const bEd = $('card-editar');
        bEd.style.display = editor() ? '' : 'none';
        bEd.onclick = () => { fechar('ov-card'); abrirLocal(id); };
        abrir('ov-card');
    }

    // ---------------- INIT ----------------
    document.addEventListener('wnj-auth', () => { renderAbas(); renderMapa(false); });

    await carregar();
    renderAbas();
    renderMapa(true);

    if (!editor()) {
        const aviso = document.createElement('div');
        aviso.className = 'dica-flutuante';
        aviso.textContent = '👁 Modo leitura — entre com o GitHub para editar';
        aviso.onclick = () => WNJAuth.abrirLogin();
        $('visor').appendChild(aviso);
    } else {
        const aviso = document.createElement('div');
        aviso.className = 'dica-flutuante';
        aviso.style.borderColor = '#4caf50';
        aviso.style.color = '#8fe0a0';
        aviso.textContent = '✏️ Clique no mapa para adicionar um local · roda do mouse dá zoom · arraste para mover';
        $('visor').appendChild(aviso);
    }
})();
