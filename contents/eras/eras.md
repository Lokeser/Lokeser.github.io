# Eras — Linha do Tempo de Luxsandoria

> **Este arquivo é lido e escrito pela página `eras.html`.** Cada mundo é uma aba;
> cada era é um retângulo na linha do tempo onde **1 pixel = 1 ano**. Você pode
> editar o JSON à mão, mas o normal é usar a página (entrando com o GitHub).

## Formato

* `mundos[]` — abas. `nome` aparece na aba.
* `eras[]` — dentro de cada mundo, em ordem cronológica (a primeira é a mais antiga).
  * `anos` = altura do retângulo em pixels.
  * `cor` = cor do retângulo e das marcas de século.
  * `img` = imagem opcional (128×128, embutida como data URI).
* `eventos[]` — dentro de cada era. `ano` é **relativo ao início da era**.

```json
{
  "mundos": [
    {
      "id": "mundo-1",
      "nome": "Mundo 1",
      "eras": []
    }
  ]
}
```
