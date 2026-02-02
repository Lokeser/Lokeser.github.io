// js/loader.js

// Variáveis Globais para controle
let currentFileSha = null;
let currentRawContent = "";
let currentFilePath = "";
let ghConfig = {};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Carregar Configurações do LocalStorage (Salvas na Forja)
    ghConfig = {
        user: localStorage.getItem('ghUser'),
        repo: localStorage.getItem('ghRepo'),
        token: localStorage.getItem('ghToken')
    };

    // 2. Verificar se usuário é admin (tem token) para mostrar botões
    if (ghConfig.token && ghConfig.user && ghConfig.repo) {
        document.getElementById('admin-controls').style.display = 'block';
    }

    // 3. Carregar Arquivo
    const urlParams = new URLSearchParams(window.location.search);
    currentFilePath = urlParams.get('file'); // ex: contents/galeria/artefatos/item.md
    const contentDiv = document.getElementById('content');

    if (currentFilePath) {
        // Se temos token, usamos API do GitHub para pegar SHA (necessário para editar)
        // Se não, usamos fetch normal (apenas leitura)
        if (ghConfig.token) {
            fetchViaAPI(currentFilePath, contentDiv);
        } else {
            fetchViaPublic(currentFilePath, contentDiv);
        }
    } else {
        contentDiv.innerHTML = "<p class='text-center'>Nenhum pergaminho selecionado.</p>";
    }
});

// --- MODO LEITURA PÚBLICA ---
function fetchViaPublic(path, container) {
    fetch(path)
        .then(res => {
            if (!res.ok) throw new Error("Arquivo não encontrado.");
            return res.text();
        })
        .then(md => {
            currentRawContent = md; // Guarda para visualização
            renderMarkdown(md, container);
        })
        .catch(err => container.innerHTML = `<p class="text-danger">Erro: ${err.message}</p>`);
}

// --- MODO ADMIN (API) ---
async function fetchViaAPI(path, container) {
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}`;
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `token ${ghConfig.token}` }
        });
        
        if (!res.ok) throw new Error(`Erro API: ${res.status}`);
        
        const data = await res.json();
        currentFileSha = data.sha; // IMPORTANTE: SHA é necessário para update/delete
        
        // Decodificar conteúdo (Base64 -> UTF8)
        const md = decodeURIComponent(escape(window.atob(data.content)));
        currentRawContent = md;
        
        renderMarkdown(md, container);

    } catch (err) {
        console.error(err);
        // Tenta fallback público se API falhar
        fetchViaPublic(path, container);
    }
}

function renderMarkdown(md, container) {
    if (typeof marked !== 'undefined') {
        container.innerHTML = marked.parse(md);
    } else {
        container.innerHTML = `<pre>${md}</pre>`;
    }
}

// --- LÓGICA DE EDIÇÃO (PARSING) ---
function openEditModal() {
    const md = currentRawContent;
    
    // 1. Regex para extrair dados do Markdown existente
    const titleMatch = md.match(/^##\s+(.*?)(?:\((.*?)\))?$/m);
    const imgMatch = md.match(/!\[.*?\]\((.*?)\)/);
    const typeMatch = md.match(/\*\*Tipo:\*\*\s*(.*?)(\.|$)/i);
    const rarityMatch = md.match(/\*\*Raridade:\*\*\s*(.*?)(\.|$)/i);
    const bindMatch = md.match(/\*\*Vinculado a:\*\*\s*(.*?)(\.|$)/i);
    const descMatch = md.match(/\*\*Descrição:\*\*\s*(.*?)(\n|$)/i);
    
    // Separa efeitos (tudo após o header de mecânicas)
    const effectsSplit = md.split('### MECÂNICA E EFEITOS');
    const effects = effectsSplit.length > 1 ? effectsSplit[1].trim() : "";

    // 2. Preencher Formulário
    document.getElementById('editName').value = titleMatch ? titleMatch[1].trim() : "";
    document.getElementById('editSub').value = titleMatch && titleMatch[2] ? titleMatch[2].trim() : "";
    document.getElementById('editImgPath').value = imgMatch ? imgMatch[1] : "";
    
    // Tenta selecionar os dropdowns (remove formatação extra se houver)
    if(typeMatch) setSelectValue('editType', typeMatch[1].replace('.','').trim());
    if(rarityMatch) setSelectValue('editRarity', rarityMatch[1].replace('.','').trim());
    
    document.getElementById('editBind').value = bindMatch ? bindMatch[1].trim() : "";
    document.getElementById('editDesc').value = descMatch ? descMatch[1].trim() : "";
    
    // Limpa o footer do markdown (Registro...) para não duplicar na edição
    let cleanEffects = effects.replace(/---\n\*Registro do Grimório.*\*/, "").trim();
    document.getElementById('editEffects').value = cleanEffects;

    // 3. Abrir Modal
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

function setSelectValue(id, val) {
    const sel = document.getElementById(id);
    for(let i=0; i<sel.options.length; i++) {
        if(sel.options[i].value.toLowerCase() === val.toLowerCase()) {
            sel.selectedIndex = i;
            break;
        }
    }
}

// --- LÓGICA DE SALVAR (UPDATE) ---
async function saveChanges() {
    if (!confirm("Deseja reescrever a realidade deste artefato?")) return;

    const btn = document.querySelector('#editModal .btn-warning');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Salvando..."; btn.disabled = true;

    // 1. Remontar o Markdown
    const name = document.getElementById('editName').value;
    const sub = document.getElementById('editSub').value;
    const imgPath = document.getElementById('editImgPath').value;
    const type = document.getElementById('editType').value;
    const rarity = document.getElementById('editRarity').value;
    const bind = document.getElementById('editBind').value;
    const desc = document.getElementById('editDesc').value;
    const effects = document.getElementById('editEffects').value;

    let newMd = `## ${name.toUpperCase()} ${sub ? `(${sub})` : ''}\n\n`;
    newMd += `![${name}](${imgPath})\n\n`;
    newMd += `**Tipo:** ${type}.\n`;
    newMd += `**Raridade:** ${rarity}.\n`;
    if (bind) newMd += `**Vinculado a:** ${bind}.\n`;
    newMd += `**Descrição:** ${desc}\n\n`;
    newMd += `### MECÂNICA E EFEITOS\n`;
    newMd += `${effects}\n\n`;
    newMd += `\n---\n*Registro do Grimório Luxsandoria*`;

    // 2. Enviar Update para GitHub
    try {
        const contentBase64 = utf8_to_b64(newMd);
        const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${currentFilePath}`;
        
        const body = {
            message: `Editando artefato: ${name}`,
            content: contentBase64,
            sha: currentFileSha // OBRIGATÓRIO PARA UPDATE
        };

        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${ghConfig.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error((await res.json()).message);

        alert("Alterações salvas com sucesso!");
        location.reload();

    } catch (err) {
        alert("Erro ao salvar: " + err.message);
        btn.innerHTML = originalText; btn.disabled = false;
    }
}

// --- LÓGICA DE EXCLUIR (DELETE) ---
async function confirmDelete() {
    if (!confirm("ATENÇÃO: Isso apagará o artefato permanentemente dos registros. Tem certeza?")) return;

    try {
        const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${currentFilePath}`;
        
        const body = {
            message: `Excluindo artefato via Viewer`,
            sha: currentFileSha
        };

        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${ghConfig.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error((await res.json()).message);

        alert("Item excluído.");
        // Redireciona de volta para a galeria
        window.location.href = 'contents/galeria/galeria_artefatos.html'; 

    } catch (err) {
        alert("Erro ao excluir: " + err.message);
    }
}

// Utilitário Base64 UTF8
function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}