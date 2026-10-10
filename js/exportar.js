// js/exportar.js
// Gera a ficha jogável (.html independente) do personagem.
// A aparência e as interações vivem em assets/modelo-ficha.html; aqui só
// calculamos os valores do sistema e injetamos os dados no modelo.
// O tema de cores segue a MAGIA do personagem (WNJ.paletaMagia).

const WNJExport = (() => {

    const MODELO = 'assets/modelo-ficha.html';
    const CONDICOES = 'contents/regras/Regras_Combate/Tipos_Condicoes.md';
    const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');   // seguro dentro de <script>

    // Condições reais do sistema, lidas do próprio .md de regras
    function lerCondicoes(md) {
        const GRUPO = { 'Condições Adversas': 'Condição Adversa', 'Condições Adversas Graves': 'Condição Adversa Grave', 'Condições Especiais': 'Condição Especial' };
        const lista = [];
        let grupo = '';
        for (const bloco of md.replace(/\r/g, '').split(/^(?=##+ )/m)) {
            const g = bloco.match(/^## (.+)/);
            if (g) { grupo = GRUPO[g[1].trim()] || ''; continue; }
            const h = bloco.match(/^### (.+)\n([\s\S]*)/);
            if (!h || !grupo) continue;
            const def = h[2].split('\n')
                .map(l => l.replace(/\*\*|\*|`/g, '').replace(/^\s*(?:[-*]|\d+\.)\s+/, '').trim())
                .filter(l => l && l !== '---' && !/^Tipo:/.test(l))
                .map(l => /[.:;!?)]$/.test(l) ? l : l + '.')
                .join(' ').replace(/\s+/g, ' ');
            const tipo = (h[2].match(/\*\*Tipo:\*\*\s*(.+)/) || [])[1];
            lista.push({ nome: h[1].trim(), grupo, tipo: tipo ? tipo.trim() : '', def });
        }
        return lista;
    }

    async function baixar(char) {
        const cfg = await WNJ.config();
        const CORES = {}; cfg.atributos.forEach(a => CORES[a.id] = a.cor);

        // ---- paleta pela magia (lógica do sistema, inalterada) ----
        const pal = WNJ.paletaMagia(char.magia);

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
        const vidaMax = WNJ.calcVida(racaInfo, attrs.corpo);
        const magMax = WNJ.calcMagiculas(cfg, attrs, er);
        const arcana = char.arcanaManual != null ? char.arcanaManual : WNJ.calcArcanaPersonagem(cfg, char, attrs);
        const ca = char.caManual != null ? char.caManual : WNJ.calcCA(cfg, attrs, char.rank);
        const calc = WNJ.calcPericias(cfg, attrs);
        const pDesloc0 = calc.find(p => p.nome === 'Deslocamento');
        const perDesloc0 = pDesloc0 ? pDesloc0.valor + ((char.periciasDelta || {})[pDesloc0.nome] || 0) : 0;
        const desloc = char.deslocManual != null ? char.deslocManual : WNJ.calcDeslocamento(cfg, attrs, perDesloc0);
        const pericias = calc.map(p => ({
            nome: p.nome,
            pesos: p.pesos,
            valor: (char.overridesPericias || {})[p.nome] !== undefined
                ? char.overridesPericias[p.nome]                     // legado (absoluto)
                : p.valor + ((char.periciasDelta || {})[p.nome] || 0), // atual (delta)
            cor: CORES[Object.entries(p.pesos).sort((a, b) => b[1] - a[1])[0][0]]
        }));
        const principais = WNJ.atributosPrincipais(cfg, attrs).filter(Boolean).map(a => ({ nome: a.nome, cor: a.cor }));

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
        const resistencias = Object.entries(char.resistencias || {}).map(([tipo, nid]) => {
            const n = NIVEIS_RES[nid]; if (!n) return null;
            const reducao = n.base != null ? 'reduz ' + (n.base + er + (attrs.corpo || 0)) :
                (nid === 'imune' ? 'não recebe dano' : 'reduz pelo atributo adaptado');
            return { tipo, rotulo: n.rotulo, reducao };
        }).filter(Boolean);

        let condicoes = [];
        try { condicoes = lerCondicoes(await WNJ.fetchMD(CONDICOES)); } catch (e) { console.warn('Condições indisponíveis', e); }

        const sistema = {
            versao: 2, exportado: new Date().toISOString(),
            paleta: { chave: pal.chave, nome: pal.nome, acentos: pal.acentos, fundo1: pal.fundo1, fundo2: pal.fundo2, animado: pal.animado },
            dr, er, ca, desloc, arcana, vidaMax, magMax,
            attrs, principais, pericias, resistencias, condicoes,
            atributos: cfg.atributos.map(a => ({ id: a.id, nome: a.nome, cor: a.cor })),
            tagsPoder: cfg.tags_poder, tagsInv: cfg.tags_inventario, maxCargas: cfg.max_cargas || 9
        };

        const dados = Object.assign({}, char);
        delete dados._nuvem; delete dados._sha;

        const res = await fetch(MODELO);
        if (!res.ok) throw new Error('Não foi possível ler o modelo da ficha.');
        const nomeCompleto = [char.nome, char.sobrenome].filter(Boolean).join(' ') || 'Sem Nome';
        const html = (await res.text())
            .replace('<script type="application/json" id="wnj-ficha">{}</script>', () => '<script type="application/json" id="wnj-ficha">' + json(dados) + '</script>')
            .replace('<script type="application/json" id="wnj-sistema">{}</script>', () => '<script type="application/json" id="wnj-sistema">' + json(sistema) + '</script>')
            .replace('<title>Ficha — Luxsandoria</title>', () => '<title>' + nomeCompleto.replace(/[<&]/g, '') + ' · Ficha Luxsandoria</title>');

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (nomeCompleto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_') || 'personagem') + '.html';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    }

    return { baixar };
})();
