// js/loader.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Pega o caminho do arquivo na URL (?file=caminho/do/arquivo.md)
    const urlParams = new URLSearchParams(window.location.search);
    const filePath = urlParams.get('file');
    const contentDiv = document.getElementById('content');

    if (filePath) {
        // 2. Faz o fetch do arquivo Markdown
        // Usamos path relativo ao viewer.html (que está na raiz)
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar arquivo: ${response.statusText}`);
                }
                return response.text();
            })
            .then(markdown => {
                // 3. Renderiza o conteúdo
                // Se estiver usando a biblioteca 'marked' (recomendado colocar no head do viewer)
                if (typeof marked !== 'undefined') {
                    contentDiv.innerHTML = marked.parse(markdown);
                } else {
                    // Fallback caso não tenha biblioteca de renderização ainda
                    contentDiv.innerHTML = `<pre>${markdown}</pre>`;
                }
            })
            .catch(error => {
                contentDiv.innerHTML = `<p style="color:red">Erro: O arquivo "${filePath}" não foi encontrado ou não pode ser lido.</p>`;
                console.error(error);
            });
    } else {
        contentDiv.innerHTML = "<p>Nenhum conteúdo selecionado.</p>";
    }
});