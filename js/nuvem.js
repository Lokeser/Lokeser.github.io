// js/nuvem.js
// Personagens salvos no repositório do GitHub, separados por login:
//   contents/personagens/<login>/<id>.json
// Cada usuário logado vê (e escreve) apenas a própria pasta. Sem login, o
// site continua funcionando 100% com o armazenamento local do navegador.

const WNJNuvem = (() => {
    const RAIZ = 'contents/personagens/';

    const login = () => {
        const c = (typeof WNJAuth !== 'undefined') ? WNJAuth.credenciais() : { user: '' };
        return (c.user || '').trim();
    };
    const disponivel = () => typeof WNJAuth !== 'undefined' && WNJAuth.podeEditar() && !!login();
    const pasta = () => RAIZ + login().toLowerCase();
    const caminhoDe = (id) => pasta() + '/' + id + '.json';

    // ---------- LISTAR ----------
    // Lê o índice da pasta do usuário pela API (precisa de token).
    async function listar() {
        if (!disponivel()) return [];
        const c = WNJAuth.credenciais();
        const r = WNJAuth.repo();
        const url = 'https://api.github.com/repos/' + r.owner + '/' + r.repo +
            '/contents/' + pasta() + '?t=' + Date.now();
        const res = await fetch(url, {
            headers: { 'Authorization': 'token ' + c.token, 'Accept': 'application/vnd.github+json' }
        });
        if (res.status === 404) return [];               // usuário ainda não tem pasta
        if (!res.ok) throw new Error('Erro ' + res.status + ' ao listar a nuvem.');
        const arquivos = (await res.json()).filter(f => f.name.endsWith('.json'));

        const chars = [];
        for (const f of arquivos) {
            try {
                const rr = await fetch(f.download_url + '?t=' + Date.now());
                if (!rr.ok) continue;
                const ch = await rr.json();
                ch._nuvem = true;
                ch._sha = f.sha;
                chars.push(ch);
            } catch (e) { console.warn('Falha ao ler ' + f.name, e); }
        }
        return chars;
    }

    // ---------- ENVIAR ----------
    async function enviar(char) {
        if (!disponivel()) throw new Error('Entre com o GitHub (com permissão de escrita) para usar a nuvem.');
        const copia = JSON.parse(JSON.stringify(char));
        delete copia._nuvem; delete copia._sha;
        copia.atualizado = new Date().toISOString();
        copia.dono = login();
        await WNJAuth.salvarArquivo(
            caminhoDe(char.id),
            JSON.stringify(copia, null, 2),
            'Personagem: ' + (char.nome || 'sem nome') + ' (' + login() + ')'
        );
        return true;
    }

    // ---------- EXCLUIR ----------
    async function excluir(id) {
        if (!disponivel()) throw new Error('Sem permissão de escrita.');
        const c = WNJAuth.credenciais();
        const r = WNJAuth.repo();
        const url = 'https://api.github.com/repos/' + r.owner + '/' + r.repo + '/contents/' + caminhoDe(id);
        const atual = await fetch(url + '?t=' + Date.now(), {
            headers: { 'Authorization': 'token ' + c.token, 'Accept': 'application/vnd.github+json' }
        });
        if (!atual.ok) return false;                     // já não existe
        const sha = (await atual.json()).sha;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': 'token ' + c.token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Removendo personagem ' + id, sha })
        });
        if (!res.ok) throw new Error((await res.json()).message || ('Erro ' + res.status));
        return true;
    }

    // ---------- SINCRONIZAR ----------
    // Junta local + nuvem. Em conflito de id, vence o "atualizado" mais recente.
    // Traz para o navegador o que só existe na nuvem e envia o que só existe aqui.
    async function sincronizar(opcoes) {
        const enviarLocais = !opcoes || opcoes.enviarLocais !== false;
        const naNuvem = await listar();
        const locais = WNJ.listar();
        const porId = {};
        locais.forEach(c => porId[c.id] = { local: c });
        naNuvem.forEach(c => { porId[c.id] = Object.assign(porId[c.id] || {}, { nuvem: c }); });

        let baixados = 0, enviados = 0, atualizados = 0;
        for (const id of Object.keys(porId)) {
            const { local, nuvem } = porId[id];
            if (local && !nuvem) {
                if (enviarLocais) { await enviar(local); enviados++; }
            } else if (!local && nuvem) {
                WNJ.salvar(nuvem); baixados++;
            } else if (local && nuvem) {
                const tl = new Date(local.atualizado || 0).getTime();
                const tn = new Date(nuvem.atualizado || 0).getTime();
                if (tn > tl) { WNJ.salvar(nuvem); atualizados++; }
                else if (tl > tn && enviarLocais) { await enviar(local); atualizados++; }
            }
        }
        return { baixados, enviados, atualizados, totalNuvem: naNuvem.length };
    }

    return { disponivel, login, listar, enviar, excluir, sincronizar, pasta };
})();
