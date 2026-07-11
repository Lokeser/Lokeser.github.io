// js/exportar.js
// Gera um .html standalone (bonito e sem dependências) com a ficha do personagem.
// O tema de cores do documento segue a MAGIA do personagem (WNJ.paletaMagia).

const WNJExport = (() => {

    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    async function baixar(char) {
        const cfg = await WNJ.config();
        const CORES = {}; cfg.atributos.forEach(a => CORES[a.id] = a.cor);
        const NOMES = {}; cfg.atributos.forEach(a => NOMES[a.id] = a.nome);
        const TAGS = {}; cfg.tags_poder.forEach(t => TAGS[t.id] = t);
        const TAGS_INV = {}; cfg.tags_inventario.forEach(t => TAGS_INV[t.id] = t);

        // ---- paleta pela magia ----
        const pal = WNJ.paletaMagia(char.magia);
        const AC = pal.acentos[0];
        const AC2 = pal.acentos[1] || pal.acentos[0];
        const AC3 = pal.acentos[2] || pal.acentos[0];
        const gradAcento = pal.animado
            ? 'linear-gradient(120deg,' + AC + ',' + AC2 + ',' + AC3 + ',' + AC + ')'
            : 'linear-gradient(120deg,' + AC + ',' + AC + ')';

        // ---- dados derivados ----
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
        const ca = char.caManual != null ? char.caManual : WNJ.calcCA(cfg, attrs, char.rank);
        const desloc = char.deslocManual != null ? char.deslocManual : WNJ.calcDeslocamento(cfg, attrs);
        const pericias = WNJ.calcPericias(cfg, attrs).map(p => ({
            nome: p.nome,
            valor: (char.overridesPericias || {})[p.nome] !== undefined
                ? char.overridesPericias[p.nome]                     // legado (absoluto)
                : p.valor + ((char.periciasDelta || {})[p.nome] || 0), // atual (delta)
            cor: CORES[Object.entries(p.pesos).sort((a, b) => b[1] - a[1])[0][0]]
        }));
        const [ap1, ap2] = WNJ.atributosPrincipais(cfg, attrs);

        const nomeCompleto = [char.nome, char.sobrenome].filter(Boolean).join(' ') || 'Sem Nome';
        const titulo = char.titulo ? ((char.tituloArtigo ? char.tituloArtigo + ' ' : '') + char.titulo) : '';
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

        // ---- resistências ----
        const NIVEIS_RES = {
            acostumado: { rotulo: 'Acostumado', base: null },
            r1: { rotulo: 'Resistência I', base: 3 }, r2: { rotulo: 'Resistência II', base: 6 },
            r3: { rotulo: 'Resistência III', base: 8 }, r4: { rotulo: 'Resistência IV', base: 10 },
            r5: { rotulo: 'Resistência V', base: 12 }, r6: { rotulo: 'Resistência VI', base: 14 },
            r7: { rotulo: 'Resistência VII', base: 16 }, r8: { rotulo: 'Resistência VIII', base: 18 },
            r9: { rotulo: 'Resistência IX', base: 20 }, r10: { rotulo: 'Resistência X', base: 25 },
            imune: { rotulo: 'Imunidade', base: null }
        };
        const resHTML = Object.entries(char.resistencias || {}).map(([tipo, nid]) => {
            const n = NIVEIS_RES[nid]; if (!n) return '';
            const red = n.base != null ? 'reduz ' + (n.base + er + (attrs.corpo || 0)) :
                (nid === 'imune' ? 'não recebe dano' : 'reduz pelo atributo adaptado');
            return '<div class="pe"><span class="dot" style="background:' + AC + '"></span>' + esc(tipo) +
                '<span class="pv" style="font-size:.72rem">' + n.rotulo + ' · ' + red + '</span></div>';
        }).join('');

        const poderesVisiveis = (char.poderes || []).filter(p => !p.oculto);
        const podHTML = poderesVisiveis.map(p => {
            const tag = TAGS[p.tag] || TAGS.extra;
            const rankSelo = p.rank ? ' <span class="rk">R' + p.rank + (p.estrela > 1 ? '★' + p.estrela : '') + '</span>' : '';
            return '<div class="card" style="border-left-color:' + tag.cor + '">' +
                '<span class="tag" style="background:' + tag.cor + '">' + tag.nome + '</span>' + rankSelo +
                '<h4>' + esc(p.nome) + '</h4><div class="ef">' + (p.efeitoHTML || '') + '</div></div>';
        }).join('') || '<p class="mudo">—</p>';

        const atqHTML = (char.ataques || []).map(a => {
            const cor = CORES[a.atrAtaque] || AC;
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

        const pensHTML = (char.pensamentos || []).map(p =>
            '<div class="card" style="border-left-color:' + AC + '">' +
            '<span class="tag" style="background:' + AC + '">Pensamento</span>' +
            '<h4>' + esc(p.assunto) + '</h4><div class="ef">' + (p.textoHTML || '') + '</div></div>').join('') || '<p class="mudo">—</p>';

        const html = '<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<title>' + esc(nomeCompleto) + ' — Ficha Luxsandoria</title>' +
            '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">' +
            '<style>' +
            ':root{--ac:' + AC + ';--ac2:' + AC2 + ';--f1:' + pal.fundo1 + ';--f2:' + pal.fundo2 + '}' +
            '*{box-sizing:border-box;margin:0;padding:0}' +
            'body{background:radial-gradient(1100px 600px at 50% -8%,var(--f1),var(--f2) 72%);background-attachment:fixed;color:#f0ecec;font-family:Lato,sans-serif;padding:30px 14px}' +
            '.folha{max-width:1000px;margin:0 auto}' +
            '.cab{display:flex;gap:26px;flex-wrap:wrap;align-items:center;border:1px solid ' + AC + '55;border-radius:18px;padding:26px;background:rgba(255,255,255,.05);position:relative;overflow:hidden}' +
            '.cab::before{content:"";position:absolute;top:0;left:0;right:0;height:5px;background:' + gradAcento + ';background-size:300% 100%;' + (pal.animado ? 'animation:flx 4s linear infinite' : '') + '}' +
            '@keyframes flx{0%{background-position:0% 0}100%{background-position:300% 0}}' +
            '.cab img{width:260px;height:260px;object-fit:cover;border-radius:16px;border:3px solid var(--ac);box-shadow:0 0 34px ' + AC + '55}' +
            '.cab .semimg{width:260px;height:260px;border-radius:16px;border:3px solid var(--ac);display:flex;align-items:center;justify-content:center;font-size:5rem;background:rgba(0,0,0,.3)}' +
            '.titulo{font-family:Cinzel,serif;color:var(--ac);font-size:1.35rem;letter-spacing:2px;text-shadow:0 0 16px ' + AC + '88}' +
            'h1{font-family:Cinzel,serif;color:#fff;font-size:2.1rem;letter-spacing:2px}' +
            (titulo ? '' : 'h1{color:var(--ac);text-shadow:0 0 18px ' + AC + '88}') +
            '.sub{color:#cbc4c4;margin-top:6px}' +
            '.rank{display:inline-block;background:' + gradAcento + ';background-size:300% 100%;' + (pal.animado ? 'animation:flx 4s linear infinite;' : '') + 'color:#0d0d0d;font-weight:800;border-radius:16px;padding:6px 18px;margin-top:12px;letter-spacing:1px}' +
            '.principais{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}' +
            '.principais span{border:1px solid;border-radius:14px;padding:3px 13px;font-size:.82rem;font-weight:700;background:rgba(0,0,0,.35)}' +
            '.chips{margin-top:10px}.chip{display:inline-block;background:' + AC + '22;border:1px solid var(--ac);color:#fff;border-radius:12px;padding:2px 10px;font-size:.76rem;margin:0 5px 5px 0}' +
            'h2{font-family:Cinzel,serif;color:var(--ac);font-size:1.05rem;letter-spacing:2px;text-transform:uppercase;margin:32px 0 12px;border-bottom:1px solid ' + AC + '44;padding-bottom:8px}' +
            '.sts{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:10px}' +
            '.st{background:rgba(0,0,0,.3);border:1px solid ' + AC + '44;border-top:3px solid var(--ac);border-radius:10px;padding:11px;text-align:center}' +
            '.st .r{font-size:.62rem;text-transform:uppercase;letter-spacing:1px;color:#b9adad}' +
            '.st .v{font-size:1.45rem;font-weight:800;color:var(--ac)}' +
            '.st .s{font-size:.66rem;color:#9c9090}' +
            '.ats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}' +
            '.at{border:1px solid;border-radius:12px;padding:12px;text-align:center}' +
            '.at .r{font-size:.66rem;letter-spacing:1.5px;font-weight:700}.at .v{font-size:1.7rem;font-weight:800;color:#fff}' +
            '.pes{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}' +
            '.pe{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.26);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px 11px;font-size:.86rem}' +
            '.dot{width:8px;height:8px;border-radius:50%;flex:0 0 8px}' +
            '.pv{margin-left:auto;font-weight:800;color:var(--ac)}' +
            '.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}' +
            '.card{background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.12);border-left:4px solid var(--ac);border-radius:10px;padding:13px}' +
            '.tag{display:inline-block;font-size:.6rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#0d0d0d;border-radius:10px;padding:2px 9px;margin-bottom:6px}' +
            '.rk{font-size:.62rem;color:#b9adad;background:rgba(255,255,255,.1);border-radius:10px;padding:1px 8px}' +
            '.card h4{font-family:Cinzel,serif;color:#fff;font-size:.95rem;margin-bottom:5px}' +
            '.res{color:var(--ac);font-weight:700;font-size:.85rem;margin-bottom:4px}' +
            '.ef{font-size:.8rem;color:#d8cfcf;line-height:1.45}.ef p{margin-bottom:5px}' +
            '.mudo{color:#9c9090;font-size:.82rem}' +
            '.cgs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:620px}' +
            '.cg{background:rgba(0,0,0,.3);border:1px solid ' + AC + '44;border-radius:10px;padding:10px;text-align:center}' +
            '.cn{color:var(--ac);font-weight:700;font-size:.84rem}.cv{color:#fff;font-weight:800;margin-top:4px}' +
            'footer{text-align:center;color:#9c9090;margin-top:36px;font-size:.8rem}' +
            '</style></head><body><div class="folha">' +
            '<div class="cab">' +
            (char.img ? '<img src="' + char.img + '" alt="">' : '<div class="semimg">🎭</div>') +
            '<div style="flex:1;min-width:240px">' +
            (titulo ? '<div class="titulo">' + esc(titulo).toUpperCase() + '</div>' : '') +
            '<h1>' + esc(nomeCompleto).toUpperCase() + '</h1>' +
            '<div class="sub">' + esc([char.raca, char.classeInicial, char.classeAvancada, char.magia].filter(Boolean).join(' · ')) + '</div>' +
            '<span class="rank">RANK ' + char.rank + estrelas + '</span>' +
            '<div class="principais">' +
            '<span style="color:' + ap1.cor + ';border-color:' + ap1.cor + '">' + ap1.nome + '</span>' +
            '<span style="color:' + ap2.cor + ';border-color:' + ap2.cor + '">' + ap2.nome + '</span>' +
            '</div>' +
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
            (resHTML ? '<h2>Resistências</h2><div class="pes">' + resHTML + '</div>' : '') +
            '<h2>Poderes</h2><div class="cards">' + podHTML + '</div>' +
            '<h2>Ataques</h2><div class="cards">' + atqHTML + '</div>' +
            '<h2>Inventário</h2><div class="cards">' + invHTML + '</div>' +
            '<h2>Cargas</h2><div class="cgs">' + cargasHTML + '</div>' +
            '<h2>Pensamentos e Opiniões</h2><div class="cards">' + pensHTML + '</div>' +
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
