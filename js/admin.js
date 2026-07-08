// js/admin.js
// Sistema de administração de conteúdo: criar, editar (markdown bruto) e
// remover qualquer arquivo .md do site, commitando via API do GitHub.
// O token fica somente em localStorage deste navegador.

(function () {
    const API = 'https://api.github.com';

    // ---------- Configuração ----------
    function cfg() {
        return {
            user: localStorage.getItem('ghUser'),
            repo: localStorage.getItem('ghRepo'),
            token: localStorage.getItem('ghToken')
        };
    }
    function isConfigured() {
        const c = cfg();
        return !!(c.user && c.repo && c.token);
    }

    // Codifica cada segmento do caminho (lida com espaços, acentos, etc.)
    function encPath(p) {
        return p.split('/').map(encodeURIComponent).join('/');
    }
    function b64encode(str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    }
    function b64decode(str) {
        return decodeURIComponent(escape(window.atob(str)));
    }

    // ---------- Chamadas à API do GitHub ----------
    async function ghGet(path) {
        const c = cfg();
        const url = `${API}/repos/${c.user}/${c.repo}/contents/${encPath(path)}?t=${Date.now()}`;
        const r = await fetch(url, { headers: { 'Authorization': `token ${c.token}` } });
        if (!r.ok) throw new Error((await r.json()).message || `Erro ${r.status}`);
        const d = await r.json();
        return { sha: d.sha, content: b64decode(d.content) };
    }
    async function ghPut(path, contentStr, message, sha) {
        const c = cfg();
        const body = { message, content: b64encode(contentStr) };
        if (sha) body.sha = sha;
        const r = await fetch(`${API}/repos/${c.user}/${c.repo}/contents/${encPath(path)}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${c.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!r.ok) throw new Error((await r.json()).message || `Erro ${r.status}`);
        return r.json();
    }
    async function ghDelete(path, sha, message) {
        const c = cfg();
        const r = await fetch(`${API}/repos/${c.user}/${c.repo}/contents/${encPath(path)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `token ${c.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sha })
        });
        if (!r.ok) throw new Error((await r.json()).message || `Erro ${r.status}`);
        return r.json();
    }

    // ---------- Estado do arquivo atual (viewer) ----------
    const currentFile = new URLSearchParams(window.location.search).get('file');
    let loadedSha = null;

    // ---------- Injeção da interface ----------
    function buildUI() {
        // Botão flutuante
        const fab = document.createElement('button');
        fab.className = 'admin-fab';
        fab.type = 'button';
        fab.textContent = '⚙️';
        fab.title = 'Administração de conteúdo';
        document.body.appendChild(fab);

        // Painel (overlay)
        const overlay = document.createElement('div');
        overlay.className = 'admin-overlay';
        overlay.innerHTML = `
            <div class="admin-box" role="dialog" aria-modal="true">
                <h2>⚙️ Administração</h2>
                <p class="admin-sub">Crie, edite e remova arquivos <code>.md</code>. As mudanças são commitadas no repositório e aparecem no site após a reconstrução do GitHub Pages (alguns segundos).</p>

                <div class="admin-section">
                    <h3>Conexão GitHub</h3>
                    <label>Usuário / Organização</label>
                    <input id="adm-user" placeholder="Lokeser" autocomplete="off">
                    <label>Repositório</label>
                    <input id="adm-repo" placeholder="lokeser.github.io" autocomplete="off">
                    <label>Token de acesso (PAT com permissão de conteúdo)</label>
                    <input id="adm-token" type="password" placeholder="ghp_..." autocomplete="off">
                    <div class="admin-actions">
                        <button class="admin-btn ghost" id="adm-logout" type="button">Desconectar</button>
                        <button class="admin-btn primary" id="adm-save-cfg" type="button">Salvar conexão</button>
                    </div>
                    <div class="admin-status" id="adm-cfg-status"></div>
                    <p class="admin-note">⚠️ O token é guardado apenas neste navegador (localStorage) e só é enviado à API do GitHub.</p>
                </div>

                <div class="admin-section" id="adm-file-section" style="display:none">
                    <h3>Editar arquivo atual</h3>
                    <div id="adm-file-path"></div>
                    <textarea id="adm-file-content" rows="12" placeholder="Clique em «Carregar» para trazer o conteúdo bruto deste arquivo..."></textarea>
                    <div class="admin-actions">
                        <button class="admin-btn danger" id="adm-delete" type="button">Excluir</button>
                        <button class="admin-btn ghost" id="adm-load" type="button">Carregar</button>
                        <button class="admin-btn primary" id="adm-save-file" type="button" disabled>Salvar edição</button>
                    </div>
                    <div class="admin-status" id="adm-file-status"></div>
                </div>

                <div class="admin-section">
                    <h3>Criar novo .md</h3>
                    <label>Caminho (a partir da raiz do site)</label>
                    <input id="adm-new-path" placeholder="contents/racas/NovaRaca.md" autocomplete="off">
                    <label>Conteúdo (Markdown)</label>
                    <textarea id="adm-new-content" rows="8" placeholder="# Título&#10;&#10;Escreva o conteúdo aqui..."></textarea>
                    <div class="admin-actions">
                        <button class="admin-btn primary" id="adm-create" type="button" disabled>Criar arquivo</button>
                    </div>
                    <div class="admin-status" id="adm-new-status"></div>
                </div>

                <div class="admin-actions">
                    <button class="admin-btn ghost" id="adm-close" type="button">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Referências
        const $ = (id) => overlay.querySelector('#' + id);
        const fileSection = $('adm-file-section');

        function refreshState() {
            const conf = isConfigured();
            fab.classList.toggle('connected', conf);
            $('adm-create').disabled = !conf;
            const cfgStatus = $('adm-cfg-status');
            if (conf) {
                const c = cfg();
                cfgStatus.className = 'admin-status ok';
                cfgStatus.textContent = `✓ Conectado a ${c.user}/${c.repo}`;
            } else {
                cfgStatus.className = 'admin-status';
                cfgStatus.textContent = 'Não conectado — preencha os campos acima para habilitar a edição.';
            }
            // Seção do arquivo atual só aparece no viewer com token
            if (currentFile && conf) {
                fileSection.style.display = 'block';
                $('adm-file-path').textContent = currentFile;
            } else {
                fileSection.style.display = 'none';
            }
        }

        function open() {
            const c = cfg();
            $('adm-user').value = c.user || '';
            $('adm-repo').value = c.repo || '';
            $('adm-token').value = c.token || '';
            refreshState();
            overlay.classList.add('open');
        }
        function close() { overlay.classList.remove('open'); }

        fab.addEventListener('click', open);
        $('adm-close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        // Salvar conexão
        $('adm-save-cfg').addEventListener('click', () => {
            localStorage.setItem('ghUser', $('adm-user').value.trim());
            localStorage.setItem('ghRepo', $('adm-repo').value.trim());
            localStorage.setItem('ghToken', $('adm-token').value.trim());
            refreshState();
            const s = $('adm-cfg-status');
            s.className = 'admin-status ok';
            s.textContent = '✓ Conexão salva neste navegador.';
        });

        // Desconectar
        $('adm-logout').addEventListener('click', () => {
            localStorage.removeItem('ghUser');
            localStorage.removeItem('ghRepo');
            localStorage.removeItem('ghToken');
            $('adm-user').value = $('adm-repo').value = $('adm-token').value = '';
            refreshState();
        });

        // Carregar arquivo atual para edição bruta
        $('adm-load').addEventListener('click', async () => {
            const s = $('adm-file-status');
            s.className = 'admin-status';
            s.textContent = 'Carregando...';
            try {
                const data = await ghGet(currentFile);
                loadedSha = data.sha;
                $('adm-file-content').value = data.content;
                $('adm-save-file').disabled = false;
                s.className = 'admin-status ok';
                s.textContent = '✓ Conteúdo carregado. Edite e salve.';
            } catch (err) {
                s.className = 'admin-status err';
                s.textContent = 'Erro ao carregar: ' + err.message;
            }
        });

        // Salvar edição
        $('adm-save-file').addEventListener('click', async () => {
            const btn = $('adm-save-file');
            const s = $('adm-file-status');
            btn.disabled = true;
            s.className = 'admin-status';
            s.textContent = 'Gravando...';
            try {
                await ghPut(currentFile, $('adm-file-content').value, `Editando: ${currentFile}`, loadedSha);
                s.className = 'admin-status ok';
                s.textContent = '✓ Salvo! Recarregando...';
                setTimeout(() => location.reload(), 900);
            } catch (err) {
                btn.disabled = false;
                s.className = 'admin-status err';
                s.textContent = 'Erro ao salvar: ' + err.message;
            }
        });

        // Excluir arquivo atual
        $('adm-delete').addEventListener('click', async () => {
            if (!confirm('Excluir permanentemente este arquivo?\n' + currentFile)) return;
            const s = $('adm-file-status');
            s.className = 'admin-status';
            s.textContent = 'Excluindo...';
            try {
                const sha = loadedSha || (await ghGet(currentFile)).sha;
                await ghDelete(currentFile, sha, `Excluindo: ${currentFile}`);
                s.className = 'admin-status ok';
                s.textContent = '✓ Excluído. Voltando...';
                setTimeout(() => { if (history.length > 1) history.back(); else location.href = 'index.html'; }, 900);
            } catch (err) {
                s.className = 'admin-status err';
                s.textContent = 'Erro ao excluir: ' + err.message;
            }
        });

        // Criar novo arquivo
        $('adm-create').addEventListener('click', async () => {
            const path = $('adm-new-path').value.trim().replace(/^\/+/, '');
            const content = $('adm-new-content').value;
            const s = $('adm-new-status');
            if (!path.endsWith('.md')) {
                s.className = 'admin-status err';
                s.textContent = 'O caminho deve terminar em .md';
                return;
            }
            const btn = $('adm-create');
            btn.disabled = true;
            s.className = 'admin-status';
            s.textContent = 'Criando...';
            try {
                await ghPut(path, content, `Criando: ${path}`);
                s.className = 'admin-status ok';
                s.innerHTML = `✓ Criado! <a href="viewer.html?file=${encodeURI(path)}" style="color:#FDF5AA">Abrir arquivo →</a>`;
            } catch (err) {
                s.className = 'admin-status err';
                s.textContent = 'Erro ao criar: ' + err.message;
            } finally {
                btn.disabled = !isConfigured();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildUI);
    } else {
        buildUI();
    }
})();
