// js/auth.js
// Login com GitHub para editar conteúdo compartilhado (Eras).
// Quem tem permissão de push no repositório entra como EDITOR; o resto vê
// tudo em modo leitura. O token fica só no localStorage deste navegador e é
// enviado exclusivamente para api.github.com.

const WNJAuth = (() => {
    const API = 'https://api.github.com';
    // Repositório de origem (deduzido do domínio; ajuste se publicar em outro lugar)
    const REPO_PADRAO = { owner: 'Lokeser', repo: 'lokeser.github.io' };

    function repo() {
        const h = location.hostname || '';
        const m = h.match(/^([^.]+)\.github\.io$/i);
        if (m) return { owner: m[1], repo: h.toLowerCase() };
        return REPO_PADRAO;
    }

    function credenciais() {
        return {
            user: localStorage.getItem('wnj_gh_user') || '',
            token: localStorage.getItem('wnj_gh_token') || '',
            editor: localStorage.getItem('wnj_gh_editor') === '1'
        };
    }
    function logado() { return !!credenciais().token; }
    function podeEditar() { const c = credenciais(); return !!c.token && c.editor; }

    function sair() {
        ['wnj_gh_user', 'wnj_gh_token', 'wnj_gh_editor'].forEach(k => localStorage.removeItem(k));
        atualizarBotao();
        document.dispatchEvent(new CustomEvent('wnj-auth', { detail: { editor: false } }));
    }

    // ---------- API ----------
    function b64encode(str) { return window.btoa(unescape(encodeURIComponent(str))); }
    function b64decode(str) { return decodeURIComponent(escape(window.atob(str))); }
    function encPath(p) { return p.split('/').map(encodeURIComponent).join('/'); }

    // Verifica se o usuário tem permissão de escrita (push) no repositório
    async function verificarPermissao(token) {
        const r = repo();
        const res = await fetch(`${API}/repos/${r.owner}/${r.repo}`, {
            headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' }
        });
        if (!res.ok) {
            const msg = res.status === 401 ? 'Token inválido ou expirado.' : `Erro ${res.status} ao consultar o repositório.`;
            throw new Error(msg);
        }
        const data = await res.json();
        return !!(data.permissions && data.permissions.push);
    }

    async function entrar(user, token) {
        const push = await verificarPermissao(token);
        localStorage.setItem('wnj_gh_user', user.trim());
        localStorage.setItem('wnj_gh_token', token.trim());
        localStorage.setItem('wnj_gh_editor', push ? '1' : '0');
        atualizarBotao();
        document.dispatchEvent(new CustomEvent('wnj-auth', { detail: { editor: push } }));
        return push;
    }

    // Lê um arquivo do repositório. Sem token, usa o próprio site (público).
    async function lerArquivo(caminho) {
        const c = credenciais();
        if (c.token) {
            const r = repo();
            const res = await fetch(`${API}/repos/${r.owner}/${r.repo}/contents/${encPath(caminho)}?t=${Date.now()}`, {
                headers: { 'Authorization': 'token ' + c.token, 'Accept': 'application/vnd.github+json' }
            });
            if (res.ok) {
                const d = await res.json();
                return { texto: b64decode(d.content), sha: d.sha };
            }
            if (res.status !== 404) console.warn('Falha na API, caindo para leitura pública', res.status);
            else return { texto: null, sha: null }; // arquivo ainda não existe
        }
        const res = await fetch(caminho + '?t=' + Date.now());
        if (!res.ok) return { texto: null, sha: null };
        return { texto: await res.text(), sha: null };
    }

    // Grava um arquivo (precisa ser editor). Busca o sha atual antes de enviar.
    async function salvarArquivo(caminho, conteudo, mensagem) {
        if (!podeEditar()) throw new Error('Você não tem permissão de edição neste repositório.');
        const c = credenciais();
        const r = repo();
        const url = `${API}/repos/${r.owner}/${r.repo}/contents/${encPath(caminho)}`;
        let sha = null;
        try {
            const atual = await fetch(url + '?t=' + Date.now(), {
                headers: { 'Authorization': 'token ' + c.token, 'Accept': 'application/vnd.github+json' }
            });
            if (atual.ok) sha = (await atual.json()).sha;
        } catch (e) { /* arquivo novo */ }

        const body = { message: mensagem || ('Atualizando ' + caminho), content: b64encode(conteudo) };
        if (sha) body.sha = sha;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': 'token ' + c.token, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error((await res.json()).message || ('Erro ' + res.status));
        return res.json();
    }

    // ---------- UI ----------
    function atualizarBotao() {
        const rot = document.getElementById('gh-login-rotulo');
        const btn = document.getElementById('gh-login-btn');
        if (!rot || !btn) return;
        const c = credenciais();
        if (c.token) {
            rot.textContent = c.user || 'Conectado';
            btn.classList.toggle('editor', c.editor);
            btn.title = c.editor ? 'Editor — clique para sair' : 'Somente leitura — clique para sair';
        } else {
            rot.textContent = 'Entrar';
            btn.classList.remove('editor');
            btn.title = 'Entrar com GitHub';
        }
    }

    function montarModal() {
        if (document.getElementById('gh-modal')) return;
        const ov = document.createElement('div');
        ov.id = 'gh-modal';
        ov.className = 'gh-overlay';
        ov.innerHTML = `
            <div class="gh-box">
                <h3>🔑 Entrar com GitHub</h3>
                <p class="gh-sub">Colaboradores do repositório podem <strong>editar as Eras</strong>. Sem login (ou sem permissão), o conteúdo fica em modo leitura.</p>
                <label>Usuário GitHub</label>
                <input id="gh-user" placeholder="seu-usuario" autocomplete="username">
                <label>Personal Access Token (com acesso a este repositório)</label>
                <input id="gh-token" type="password" placeholder="ghp_..." autocomplete="current-password">
                <div class="gh-status" id="gh-status"></div>
                <p class="gh-nota">⚠️ O token fica salvo apenas neste navegador e só é enviado para api.github.com.</p>
                <div class="gh-acoes">
                    <button class="gh-btn fantasma" id="gh-cancelar">Cancelar</button>
                    <button class="gh-btn ouro" id="gh-entrar">Entrar</button>
                </div>
            </div>`;
        document.body.appendChild(ov);

        const fechar = () => ov.classList.remove('aberto');
        ov.addEventListener('click', e => { if (e.target === ov) fechar(); });
        document.getElementById('gh-cancelar').onclick = fechar;
        document.getElementById('gh-entrar').onclick = async () => {
            const user = document.getElementById('gh-user').value.trim();
            const token = document.getElementById('gh-token').value.trim();
            const st = document.getElementById('gh-status');
            if (!user || !token) { st.className = 'gh-status err'; st.textContent = 'Preencha usuário e token.'; return; }
            st.className = 'gh-status'; st.textContent = 'Verificando permissões...';
            try {
                const editor = await entrar(user, token);
                st.className = 'gh-status ok';
                st.textContent = editor
                    ? '✓ Você é colaborador — modo edição liberado!'
                    : '✓ Conectado, mas sem permissão de escrita: modo leitura.';
                setTimeout(() => { fechar(); location.reload(); }, 1100);
            } catch (err) {
                st.className = 'gh-status err';
                st.textContent = err.message;
            }
        };
    }

    function abrirLogin() {
        const c = credenciais();
        if (c.token) {
            const papel = c.editor ? 'editor' : 'somente leitura';
            if (confirm('Conectado como ' + (c.user || '—') + ' (' + papel + ').\nDeseja sair?')) {
                sair();
                location.reload();
            }
            return;
        }
        montarModal();
        const ov = document.getElementById('gh-modal');
        document.getElementById('gh-user').value = '';
        document.getElementById('gh-token').value = '';
        document.getElementById('gh-status').textContent = '';
        ov.classList.add('aberto');
    }

    function ligarBotao() {
        const btn = document.getElementById('gh-login-btn');
        if (btn) btn.addEventListener('click', abrirLogin);
        atualizarBotao();
    }

    // Grava conteúdo já em base64 (imagens e outros binários).
    async function salvarArquivoBase64(caminho, base64, mensagem) {
        if (!podeEditar()) throw new Error('Você não tem permissão de edição neste repositório.');
        const c = credenciais();
        const r = repo();
        const url = `${API}/repos/${r.owner}/${r.repo}/contents/${encPath(caminho)}`;
        let sha = null;
        try {
            const atual = await fetch(url + '?t=' + Date.now(), {
                headers: { 'Authorization': 'token ' + c.token, 'Accept': 'application/vnd.github+json' }
            });
            if (atual.ok) sha = (await atual.json()).sha;
        } catch (e) { /* arquivo novo */ }
        const body = { message: mensagem || ('Enviando ' + caminho), content: base64 };
        if (sha) body.sha = sha;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': 'token ' + c.token, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error((await res.json()).message || ('Erro ' + res.status));
        return res.json();
    }

    return { credenciais, logado, podeEditar, entrar, sair, lerArquivo, salvarArquivo, salvarArquivoBase64, abrirLogin, ligarBotao, atualizarBotao, repo };
})();
