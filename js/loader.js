// js/loader.js
// Carrega e renderiza um arquivo .md indicado por ?file=... no visualizador.
// Somente leitura — a edição de conteúdo é feita manualmente nos arquivos.

document.addEventListener("DOMContentLoaded", () => {
    const contentDiv = document.getElementById('content');
    if (!contentDiv) return;

    const urlParams = new URLSearchParams(window.location.search);
    const currentFilePath = urlParams.get('file');

    if (!currentFilePath) {
        contentDiv.innerHTML = "<p class='text-center p-5'>Nenhum pergaminho selecionado.</p>";
        return;
    }

    fetch(currentFilePath)
        .then(res => {
            if (!res.ok) throw new Error("Arquivo não encontrado.");
            return res.text();
        })
        .then(md => renderMarkdown(md, contentDiv))
        .catch(err => {
            contentDiv.innerHTML = `<p class="text-danger p-5">Erro: ${err.message}</p>`;
        });
});

function renderMarkdown(md, container) {
    if (typeof marked !== 'undefined') {
        container.innerHTML = marked.parse(md);
    } else {
        container.innerHTML = `<pre>${md}</pre>`;
    }
}
