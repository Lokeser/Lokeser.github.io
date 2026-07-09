// js/exportar.js
// Gera um .html standalone (bonito e sem dependências) com a ficha do personagem.

const WNJExport = (() => {

    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    async function baixar(char) {
        const cfg = await WNJ.config();
        const CORES = {}; cfg.atributos.forEach(a => CORES[a.id] = a.cor);
        const NOMES = {}; cfg.atributos.forEach(a => NOMES[a.id] = a.nome);
        const TAGS = {}; cfg.tags_poder.forEach(t => TAGS[t.id] = t);
        const TAGS_INV = {}; cfg.tags_inventario.forEach(t => TAGS_INV[t.id] = t);

        // dados derivados
        let racaInfo = { mods: {}, vidaBase: 20, vidaPasso: 6, vidaRacial: 6, livre: true };
        const rEntry = cfg.racas.find(r => r.nome === char.raca);
        if (rEntry) { try { racaInfo = WNJ.parseRaca(await WNJ.fetchMD(rEntry.arquivo)); } catch (e) {} }
        const rk = await WNJ.dadosRank(cfg, char.rank);
        const dr = rk.dr || 20, er = rk.er || 1;
        const attrs = {};
        for (const a of cfg.atributos) {
            attrs[a.id] = (char.atributos[a.id] || 0) + (racaInfo.livre ? 0 : (racaInfo.mods[a.id] || 0));
        }
        const vidaMax = char.vidaMaxManual != null ? char.vidaMaxManual : WNJ.calcVida(racaInfo, attrs.corpo);
        const magMax = char.magiculasMax != null ? char.magiculasMax : WNJ.calcMagiculas(cfg, attrs, er);
        const arcana = char.arcanaManual != null ? char.arcanaManual : WNJ.calcArcana(cfg, char.rank);
        const ca = char.caManual != null ? char.caManual : WNJ.calcCA(cfg, attrs);
        const desloc = char.deslocManual != null ? char.deslocManual : WNJ.calcDeslocamento(cfg, attrs);
        const pericias = WNJ.calcPericias(cfg, attrs).map(p => ({
            nome: p.nome,
            valor: char.overridesPericias[p.nome] !== undefined ? char.overridesPericias[p.nome] : p.valor,
            cor: CORES[Object.entries(p.pesos).sort((a, b) => b[1] - a[1])[0][0]]
        }));

        const nomeCompleto = [char.nome, char.sobrenome].filter(Boolean).join(' ') || 'Sem Nome';
        const estrelas = char.rank < 10 ? ' ' + '★'.repeat(char.estrela) : '';
        const equipados = (char.inventario || []).filter(i => i.tag === 'artefato' && i.equipado);

        const statCard = (rot, val, sub) =>
            '<div class="st"><div class="r">' + rot + '</div><div class="v">' + val + '</div>' + (sub ? '<div class="s">' + sub + '</div>' : '') + '</div>';

        const attrCards = cfg.atributos.map(a =>
            '<div class="at" style="border-color:' + a.cor + ';background:' + a.cor + '14">' +
            '<div class="r" style="color:' + a.cor + '">' + a.nome.toUpperCase() + '</div>' +
            '<div class="v">' + attrs[a.id] + '</div></div>').join('');

        const perHTML = pericias.map(p =>
            '<div class="pe"><span class="dot" style="background:' + p.cor + '"></span>' + esc(p.nome) +
            '<span class="pv">' + p.valor + '</span></div>').join('');

        const podHTML = (char.poderes || []).map(p => {
            const tag = TAGS[p.tag] || TAGS.extra;
            return '<div class="card" style="border-left-color:' + tag.cor + '">' +
                '<span class="tag" style="background:' + tag.cor + '">' + tag.nome + '</span>' +
                '<h4>' + esc(p.nome) + '</h4><div class="ef">' + (p.efeitoHTML || '') + '</div></div>';
        }).join('') || '<p class="mudo">—</p>';

        const atqHTML = (char.ataques || []).map(a => {
            const cor = CORES[a.atrAtaque] || '#58A0C8';
            return '<div class="card" style="border-left-color:' + cor + '">' +
                '<span class="tag" style="background:' + cor + '">' + (NOMES[a.atrAtaque] || '') + '</span>' +
                '<h4>' + esc(a.nome) + '</h4>' +
                '<div class="res">🎲 ' + a.ndr + 'd' + dr + ' + ' + (NOMES[a.atrAtaque] || '?') + ' (' + (attrs[a.atrAtaque] || 0) + ')</div>' +
                '<div class="mudo">Dano: ' + (NOMES[a.atrDano] || '?') + ' (' + (attrs[a.atrDano] || 0) + ') · Crít ×' + a.mult + (a.crit ? ' — ' + esc(a.crit) : '') + '</div>' +
                '<div class="ef">' + (a.efeitoHTML || '') + '</div></div>';
        }).join('') || '<p class="mudo">—</p>';

        const invHTML = (char.inventario || []).map(i => {
            const tag = TAGS_INV[i.tag] || TAGS_INV.outro;
            return '<div class="card" style="border-left-color:' + tag.cor + '">' +
                '<span class="tag" style="background:' + tag.cor + '">' + tag.nome + (i.equipado ? ' · EQUIPADO' : '') + '</span>' +
                '<h4>' + esc(i.nome) + (i.qtd > 1 ? ' ×' + i.qtd : '') + '</h4>' +
                '<div class="ef">' + (i.descHTML || '') + '</div></div>';
        }).join('') || '<p class="mudo">—</p>';

        const cargasHTML = (char.cargas || []).map(c =>
            '<div class="cg"><div class="cn">' + esc(c.nome) + '</div><div class="cv">' + c.atual + ' / ' + c.max + '</div></div>').join('') || '<p class="mudo">—</p>';

        const html = '<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<title>' + esc(nomeCompleto) + ' — Ficha Luxsandoria</title>' +
            '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">' +
            '<style>' +
            '*{box-sizing:border-box;margin:0;padding:0}' +
            'body{background:radial-gradient(circle at top,#1d4267,#113F67 70%);color:#eaf2fa;font-family:Lato,sans-serif;padding:30px 14px}' +
            '.folha{max-width:980px;margin:0 auto}' +
            '.cab{display:flex;gap:22px;flex-wrap:wrap;align-items:center;border:1px solid #58A0C8;border-top:4px solid #FDF5AA;border-radius:16px;padding:22px;background:rgba(255,255,255,.05)}' +
            '.cab img{width:150px;height:150px;object-fit:cover;border-radius:12px;border:2px solid #58A0C8}' +
            '.cab .semimg{width:150px;height:150px;border-radius:12px;border:2px solid #58A0C8;display:flex;align-items:center;justify-content:center;font-size:3rem;background:rgba(0,0,0,.3)}' +
            'h1{font-family:Cinzel,serif;color:#FDF5AA;font-size:1.9rem;letter-spacing:2px}' +
            '.sub{color:#9fc0da;margin-top:4px}' +
            '.rank{display:inline-block;background:#FDF5AA;color:#14202e;font-weight:800;border-radius:16px;padding:5px 16px;margin-top:10px}' +
            '.chips{margin-top:10px}.chip{display:inline-block;background:rgba(240,197,107,.15);border:1px solid #f0c56b;color:#f0d99a;border-radius:12px;padding:2px 10px;font-size:.76rem;margin:0 5px 5px 0}' +
            'h2{font-family:Cinzel,serif;color:#FDF5AA;font-size:1.05rem;letter-spacing:2px;text-transform:uppercase;margin:30px 0 12px;border-bottom:1px solid rgba(255,255,255,.15);padding-bottom:8px}' +
            '.sts{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:10px}' +
            '.st{background:rgba(0,0,0,.25);border:1px solid #34699A;border-top:3px solid #58A0C8;border-radius:10px;padding:11px;text-align:center}' +
            '.st .r{font-size:.62rem;text-transform:uppercase;letter-spacing:1px;color:#9fc0da}' +
            '.st .v{font-size:1.45rem;font-weight:800;color:#FDF5AA}' +
            '.st .s{font-size:.66rem;color:#8fb3cf}' +
            '.ats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}' +
            '.at{border:1px solid;border-radius:12px;padding:12px;text-align:center}' +
            '.at .r{font-size:.66rem;letter-spacing:1.5px;font-weight:700}.at .v{font-size:1.7rem;font-weight:800;color:#fff}' +
            '.pes{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}' +
            '.pe{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px 11px;font-size:.86rem}' +
            '.dot{width:8px;height:8px;border-radius:50%;flex:0 0 8px}' +
            '.pv{margin-left:auto;font-weight:800;color:#FDF5AA}' +
            '.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}' +
            '.card{background:rgba(0,0,0,.26);border:1px solid rgba(255,255,255,.12);border-left:4px solid #58A0C8;border-radius:10px;padding:13px}' +
            '.tag{display:inline-block;font-size:.6rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#0d1520;border-radius:10px;padding:2px 9px;margin-bottom:6px}' +
            '.card h4{font-family:Cinzel,serif;color:#fff;font-size:.95rem;margin-bottom:5px}' +
            '.res{color:#FDF5AA;font-weight:700;font-size:.85rem;margin-bottom:4px}' +
            '.ef{font-size:.8rem;color:#c9d9e8;line-height:1.45}.ef p{margin-bottom:5px}' +
            '.mudo{color:#8fb3cf;font-size:.82rem}' +
            '.cgs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:620px}' +
            '.cg{background:rgba(0,0,0,.25);border:1px solid #34699A;border-radius:10px;padding:10px;text-align:center}' +
            '.cn{color:#FDF5AA;font-weight:700;font-size:.84rem}.cv{color:#fff;font-weight:800;margin-top:4px}' +
            'footer{text-align:center;color:#8fb3cf;margin-top:36px;font-size:.8rem}' +
            '@media print{body{background:#113F67}}' +
            '</style></head><body><div class="folha">' +
            '<div class="cab">' +
            (char.img ? '<img src="' + char.img + '" alt="">' : '<div class="semimg">🎭</div>') +
            '<div><h1>' + esc(nomeCompleto).toUpperCase() + '</h1>' +
            '<div class="sub">' + esc([char.raca, char.classeInicial, char.classeAvancada, char.magia].filter(Boolean).join(' · ')) + '</div>' +
            '<span class="rank">RANK ' + char.rank + estrelas + '</span>' +
            (equipados.length ? '<div class="chips">⚜ Artefatos Equipados: ' + equipados.map(i => '<span class="chip">' + esc(i.nome) + '</span>').join('') + '</div>' : '') +
            '</div></div>' +
            '<h2>Valores</h2><div class="sts">' +
            statCard('Dado de Rank', 'DR 1d' + dr) + statCard('Eficiência', 'ER ' + er) +
            statCard('C.A', ca) + statCard('Deslocamento', desloc + 'm') +
            statCard('Vida', (char.vidaAtual != null ? char.vidaAtual : vidaMax) + ' / ' + vidaMax) +
            statCard('Arcana', arcana) +
            statCard('Magículas', (char.magiculasAtual != null ? char.magiculasAtual : magMax) + ' / ' + magMax) +
            '</div>' +
            '<h2>Atributos</h2><div class="ats">' + attrCards + '</div>' +
            '<h2>Perícias</h2><div class="pes">' + perHTML + '</div>' +
            '<h2>Poderes</h2><div class="cards">' + podHTML + '</div>' +
            '<h2>Ataques</h2><div class="cards">' + atqHTML + '</div>' +
            '<h2>Inventário</h2><div class="cards">' + invHTML + '</div>' +
            '<h2>Cargas</h2><div class="cgs">' + cargasHTML + '</div>' +
            '<footer>Luxsandoria — Watashi no Jinsei · Ficha gerada em ' + new Date().toLocaleDateString('pt-BR') + '</footer>' +
            '</div></body></html>';

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const arquivo = (nomeCompleto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_') || 'personagem') + '.html';
        a.download = arquivo;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    }

    return { baixar };
})();
