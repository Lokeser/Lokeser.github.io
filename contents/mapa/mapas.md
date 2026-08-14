# Mapas — Atlas de Luxsandoria

> **Este arquivo é lido e escrito pela página `mapa.html`.** Cada mapa é uma aba com
> sua própria imagem e seus locais. Você pode editar o JSON à mão, mas o normal é
> usar a página (entrando com o GitHub).

## Formato

* `mapas[]` — abas. `imagem` é o caminho de um arquivo do repositório (ex: `assets/mapas/mundo.jpg`).
* `locais[]` — marcadores. `x` e `y` são **frações de 0 a 1** da imagem (canto superior
  esquerdo = 0,0), então funcionam em qualquer zoom ou tamanho de tela.
* `tipo` — id de um dos `tipos` abaixo (define ícone, cor e o filtro da legenda).
* `campanhas[]` — nomes das campanhas em que o local aparece; alimentam o filtro do topo.

```json
{
  "tipos": [
    { "id": "capital",  "nome": "Capital",   "icone": "🏰", "cor": "#f0d17a" },
    { "id": "cidade",   "nome": "Cidade",    "icone": "🏘️", "cor": "#58A0C8" },
    { "id": "vila",     "nome": "Vila",      "icone": "🏡", "cor": "#7fd08a" },
    { "id": "dungeon",  "nome": "Dungeon",   "icone": "💀", "cor": "#e04343" },
    { "id": "ruina",    "nome": "Ruína",     "icone": "🏛️", "cor": "#b9a68a" },
    { "id": "floresta", "nome": "Floresta",  "icone": "🌲", "cor": "#3fbf6a" },
    { "id": "montanha", "nome": "Montanha",  "icone": "⛰️", "cor": "#9aa7b5" },
    { "id": "agua",     "nome": "Mar / Rio", "icone": "🌊", "cor": "#4aa3ff" },
    { "id": "marco",    "nome": "Marco",     "icone": "✦",  "cor": "#c58cf6" },
    { "id": "outro",    "nome": "Outro",     "icone": "📍", "cor": "#ffffff" }
  ],
  "mapas": [
    {
      "id": "mundo",
      "nome": "Mundo",
      "imagem": "",
      "locais": []
    }
  ]
}
```
