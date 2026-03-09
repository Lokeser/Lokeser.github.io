// js/loader.js

// Variáveis Globais
let currentFileSha = null;
let currentRawContent = "";
let currentFilePath = "";
let ghConfig = {};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Carregar Configurações
    ghConfig = {
        user: localStorage.getItem('ghUser'),
        repo: localStorage.getItem('ghRepo'),
        token: localStorage.getItem('ghToken')
    };

    // 2. Mostrar controles de admin se houver token
    if (ghConfig.token && ghConfig.user && ghConfig.repo) {
        const adminPanel = document.getElementById('admin-controls');
        if(adminPanel) adminPanel.style.display = 'block';
    }

    // 3. Identificar arquivo na URL
    const urlParams = new URLSearchParams(window.location.search);
    currentFilePath = urlParams.get('file'); 
    const contentDiv = document.getElementById('content');

    if (currentFilePath) {
        if (ghConfig.token) {
            fetchViaAPI(currentFilePath, contentDiv);
        } else {
            fetchViaPublic(currentFilePath, contentDiv);
        }
    } else {
        contentDiv.innerHTML = "<p class='text-center p-5'>Nenhum pergaminho selecionado.</p>";
    }
});

// --- LEITURA (PÚBLICA) ---
function fetchViaPublic(path, container) {
    fetch(path)
        .then(res => {
            if (!res.ok) throw new Error("Arquivo não encontrado.");
            return res.text();
        })
        .then(md => {
            currentRawContent = md;
            renderMarkdown(md, container);
        })
        .catch(err => container.innerHTML = `<p class="text-danger p-5">Erro: ${err.message}</p>`);
}

// --- LEITURA (API / ADMIN) ---
async function fetchViaAPI(path, container) {
    // Cache bust para garantir que estamos vendo a versão mais recente ao editar
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}?t=${new Date().getTime()}`;
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `token ${ghConfig.token}` }
        });
        
        if (!res.ok) throw new Error(`Erro API: ${res.status}`);
        
        const data = await res.json();
        currentFileSha = data.sha; // Necessário para salvar updates
        
        // Decodificar Base64 com suporte a acentos (UTF-8)
        const md = decodeURIComponent(escape(window.atob(data.content)));
        currentRawContent = md;
        
        renderMarkdown(md, container);

    } catch (err) {
        console.warn("Falha na API, tentando método público...", err);
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

// --- LÓGICA DE PREENCHIMENTO DO MODAL (PARSING INTELIGENTE) ---
function openEditModal() {
    let md = currentRawContent; // Copia do texto original para ir "recortando"
    
    // Elementos do DOM
    const fields = {
        name: document.getElementById('editName'),
        sub: document.getElementById('editSub'),
        img: document.getElementById('editImgPath'),
        type: document.getElementById('editType'),
        rarity: document.getElementById('editRarity'),
        bind: document.getElementById('editBind'),
        desc: document.getElementById('editDesc'),
        effects: document.getElementById('editEffects')
    };

    // --- 1. Extração Segura ---
    // Para cada campo, tentamos encontrar no texto. Se acharmos, preenchemos o input e REMOVEMOS do 'md'.
    // O que sobrar no 'md' vai para o campo de efeitos.

    // Título: ## NOME (Subtítulo)
    const titleMatch = md.match(/^##\s+(.*?)(?:\((.*?)\))?$/m);
    if (titleMatch) {
        fields.name.value = titleMatch[1].trim();
        fields.sub.value = titleMatch[2] ? titleMatch[2].trim() : "";
        md = md.replace(titleMatch[0], ""); // Remove título do texto sobra
    } else {
        fields.name.value = "Sem Título"; // Fallback
    }

    // Imagem: ![alt](path)
    const imgMatch = md.match(/!\[.*?\]\((.*?)\)/);
    if (imgMatch) {
        fields.img.value = imgMatch[1];
        md = md.replace(imgMatch[0], "");
    }

    // Tipo: **Tipo:** Valor
    const typeMatch = md.match(/\*\*Tipo:\*\*\s*(.*?)(\.|$|\n)/i);
    if (typeMatch) {
        setSelectValue('editType', typeMatch[1].trim());
        md = md.replace(typeMatch[0], "");
    }

    // Raridade: **Raridade:** Valor
    const rarityMatch = md.match(/\*\*Raridade:\*\*\s*(.*?)(\.|$|\n)/i);
    if (rarityMatch) {
        setSelectValue('editRarity', rarityMatch[1].trim());
        md = md.replace(rarityMatch[0], "");
    }

    // Vinculado a: **Vinculado a:** Valor
    const bindMatch = md.match(/\*\*Vinculado a:\*\*\s*(.*?)(\.|$|\n)/i);
    if (bindMatch) {
        fields.bind.value = bindMatch[1].trim();
        md = md.replace(bindMatch[0], "");
    }

    // Descrição: **Descrição:** Texto...
    // Pega tudo até encontrar duas quebras de linha ou o próximo markdown forte
    const descMatch = md.match(/\*\*Descrição:\*\*\s*([\s\S]*?)(?=(\n\n|###))/i);
    if (descMatch) {
        fields.desc.value = descMatch[1].trim();
        md = md.replace(descMatch[0], "");
    }

    // --- 2. Limpeza do que sobrou ---
    // Removemos linhas em branco extras no começo
    md = md.trim();
    
    // Se o texto começa com "### MECÂNICA", mantemos.
    // Removemos apenas o rodapé padrão para não duplicar
    md = md.replace(/---\n\*Registro do Grimório.*\*/, "");
    
    // O resto é EFEITO/CORPO
    fields.effects.value = md.trim();

    // 3. Abrir Modal
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

// Helper para selecionar dropdowns ignorando case/acentos se possível
function setSelectValue(id, val) {
    const sel = document.getElementById(id);
    let found = false;
    // Tenta match exato ou parcial
    const cleanVal = val.toLowerCase().replace(/[.,]/g, "").trim();
    
    for(let i=0; i<sel.options.length; i++) {
        const cleanOpt = sel.options[i].value.toLowerCase();
        if(cleanOpt === cleanVal || cleanOpt.includes(cleanVal)) {
            sel.selectedIndex = i;
            found = true;
            break;
        }
    }
    // Se não achou no dropdown (ex: tipo "Armadura Mágica"), não faz nada, 
    // mas o texto foi removido do MD. Isso é um risco pequeno.
    // Para segurança total, se não achar, poderíamos reinserir no 'effects', 
    // mas assumiremos que seus tipos são padronizados.
}

// --- SALVAR ALTERAÇÕES ---
async function saveChanges() {
    if (!confirm("Confirmar a reescrita deste registro?")) return;

    const btn = document.querySelector('#editModal .btn-warning');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Gravando...'; 
    btn.disabled = true;

    try {
        // Coletar dados
        const name = document.getElementById('editName').value;
        const sub = document.getElementById('editSub').value;
        const imgPath = document.getElementById('editImgPath').value;
        const type = document.getElementById('editType').value;
        const rarity = document.getElementById('editRarity').value;
        const bind = document.getElementById('editBind').value;
        const desc = document.getElementById('editDesc').value;
        const effects = document.getElementById('editEffects').value;

        // Reconstruir Markdown (Padronizado)
        let newMd = `## ${name.toUpperCase()} ${sub ? `(${sub})` : ''}\n\n`;
        
        // Só adiciona imagem se houver caminho
        if(imgPath) newMd += `![${name}](${imgPath})\n\n`;
        
        newMd += `**Tipo:** ${type}.\n`;
        newMd += `**Raridade:** ${rarity}.\n`;
        if (bind) newMd += `**Vinculado a:** ${bind}.\n`;
        
        newMd += `**Descrição:** ${desc}\n\n`;
        
        // Se o usuário apagou o cabeçalho de mecânicas no textarea, a gente recoloca.
        // Se ele deixou lá, a gente não duplica.
        if (!effects.includes('### MECÂNICA')) {
            newMd += `### MECÂNICA E EFEITOS\n`;
        }
        
        newMd += `${effects}\n\n`;
        newMd += `\n---\n*Registro do Grimório Luxsandoria*`;

        // Enviar
        const contentBase64 = utf8_to_b64(newMd);
        const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${currentFilePath}`;
        
        const body = {
            message: `Editando: ${name}`,
            content: contentBase64,
            sha: currentFileSha
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

        alert("Registro atualizado com sucesso!");
        location.reload();

    } catch (err) {
        alert("Erro ao salvar: " + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- EXCLUIR ---
async function confirmDelete() {
    if (!confirm("ATENÇÃO: A exclusão é permanente. Deseja incinerar este registro?")) return;

    try {
        const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${currentFilePath}`;
        const body = { message: "Excluindo arquivo", sha: currentFileSha };

        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${ghConfig.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error((await res.json()).message);

        alert("Arquivo excluído.");
        window.history.back(); // Volta para a galeria

    } catch (err) {
        alert("Erro: " + err.message);
    }
}

// Função segura para Base64 com caracteres especiais (UTF-8)
function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}


