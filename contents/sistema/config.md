# Configuração do Sistema — Ficha de Personagem

> **Este arquivo é lido pelo site em tempo real.** O Criador de Personagem usa o bloco JSON abaixo
> para montar dropdowns, calcular perícias e valores automáticos. **Edite os números à vontade** —
> só não remova as aspas nem as vírgulas, e mantenha o bloco dentro das cercas de código.

## Como a automação funciona

* **DR e ER** são lidos dos arquivos de rank (`contents/ranks/*.md`), das linhas
  `**Dado de Rank (DR):** **d20**` e `**Eficiência de Rank (ER):** **1**`.
* **Vida** é lida do arquivo da raça, da linha `**Vida Base:** **20 + 6 a cada 2 pontos de Corpo**`.
* **Modificadores raciais** são lidos da linha `**Modificadores raciais:** +2 Corpo, −1 Mana...` da raça.
* **Poderes** são lidos dos marcadores `<!--#poder id="..." fonte="..." rank="..." estrela="..."-->`
  espalhados nos .md de raças, classes, magias e ranks. O texto entre o marcador e `<!--#fim-->`
  é o efeito do poder — edite o texto livremente, só preserve os marcadores.
* **Perícias, CA, Deslocamento, Arcana e Magículas** usam o JSON abaixo.

```json
{
  "atributos": [
    { "id": "corpo",     "nome": "Corpo",     "cor": "#e06a5a" },
    { "id": "tecnica",   "nome": "Técnica",   "cor": "#e0a13f" },
    { "id": "intelecto", "nome": "Intelecto", "cor": "#4fb3bf" },
    { "id": "carisma",   "nome": "Carisma",   "cor": "#c58cf6" },
    { "id": "sabedoria", "nome": "Sabedoria", "cor": "#7fd08a" },
    { "id": "mana",      "nome": "Mana",      "cor": "#58A0C8" }
  ],

  "pericias": [
    { "nome": "Atletismo",         "pesos": { "corpo": 4 } },
    { "nome": "Tenacidade",        "pesos": { "corpo": 3, "sabedoria": 1 } },
    { "nome": "Deslocamento",      "pesos": { "corpo": 2, "tecnica": 2 } },
    { "nome": "Acrobacia",         "pesos": { "tecnica": 4 } },
    { "nome": "Furtividade",       "pesos": { "tecnica": 3, "sabedoria": 1 } },
    { "nome": "Iniciativa",        "pesos": { "tecnica": 2, "corpo": 2 } },
    { "nome": "Erudição",          "pesos": { "intelecto": 4 } },
    { "nome": "Análise",           "pesos": { "intelecto": 3, "sabedoria": 1 } },
    { "nome": "Estratégia",        "pesos": { "intelecto": 2, "carisma": 2 } },
    { "nome": "Medicina",          "pesos": { "intelecto": 3, "sabedoria": 1 } },
    { "nome": "Performance",       "pesos": { "carisma": 4 } },
    { "nome": "Charme",            "pesos": { "carisma": 3, "sabedoria": 1 } },
    { "nome": "Lábia",             "pesos": { "carisma": 3, "intelecto": 1 } },
    { "nome": "Intimidação",       "pesos": { "carisma": 2, "corpo": 2 } },
    { "nome": "Adestramento",      "pesos": { "carisma": 2, "sabedoria": 2 } },
    { "nome": "Intuição",          "pesos": { "sabedoria": 4 } },
    { "nome": "Percepção",         "pesos": { "sabedoria": 2, "intelecto": 2 } },
    { "nome": "Sobrevivência",     "pesos": { "sabedoria": 2, "corpo": 2 } },
    { "nome": "Canalização",       "pesos": { "mana": 4 } },
    { "nome": "Arcanismo",         "pesos": { "mana": 3, "intelecto": 1 } },
    { "nome": "Percepção Mágica",  "pesos": { "mana": 3, "sabedoria": 1 } },
    { "nome": "Aura",              "pesos": { "mana": 3, "carisma": 1 } }
  ],

  "formulas": {
    "ca_base": 10,
    "ca_atributo": "tecnica",
    "deslocamento_base": 9,
    "deslocamento_atributo": "",
    "magiculas_iniciais": "mana + er",
    "arcana_por_rank": { "6": 5, "5": 5, "4": 5 }
  },

  "estrelas_por_rank": 5,
  "max_cargas": 9,

  "ranks": [
    { "n": 10, "nome": "Deceri",    "arquivo": "contents/ranks/10 - Deceri.md" },
    { "n": 9,  "nome": "Novedo",    "arquivo": "contents/ranks/09 - Novedo.md" },
    { "n": 8,  "nome": "Octitus",   "arquivo": "contents/ranks/08 - Octitus.md" },
    { "n": 7,  "nome": "Arcana",    "arquivo": "contents/ranks/07 - Arcana.md" },
    { "n": 6,  "nome": "Coniuncta", "arquivo": "contents/ranks/06 - Coniuncta.md" },
    { "n": 5,  "nome": "Unearta",   "arquivo": "contents/ranks/05 - Unearta.md" },
    { "n": 4,  "nome": "Verus",     "arquivo": "contents/ranks/04 - Verus.md" },
    { "n": 3,  "nome": "Ark",       "arquivo": "contents/ranks/03 - Ark.md" }
  ],

  "racas": [
    { "nome": "Humano",             "arquivo": "contents/racas/Humano.md" },
    { "nome": "Humano Oni",         "arquivo": "contents/racas/Humano-Oni.md" },
    { "nome": "Humano Amazônico",   "arquivo": "contents/racas/Humano-Amazonico.md" },
    { "nome": "Meio-Elfo",          "arquivo": "contents/racas/MeioElfo.md" },
    { "nome": "Meio-Vampiro",       "arquivo": "contents/racas/MeioVampiro.md" },
    { "nome": "Meio-Orc",           "arquivo": "contents/racas/MeioOrc.md" },
    { "nome": "Manpan",             "arquivo": "contents/racas/DemiHumano-Manpan.md" },
    { "nome": "Rekel",              "arquivo": "contents/racas/DemiHumano-Rekel.md" },
    { "nome": "Atlântide",          "arquivo": "contents/racas/DemiHumano-Atlantide.md" },
    { "nome": "Loomian",            "arquivo": "contents/racas/DemiHumano-Loomian.md" },
    { "nome": "Elfo",               "arquivo": "contents/racas/Elfo.md" },
    { "nome": "Elfo Negro",         "arquivo": "contents/racas/ElfoNegro.md" },
    { "nome": "Hypnoriano",         "arquivo": "contents/racas/Humano-Hypnoriano.md" }
  ],

  "classes_iniciais": [
    { "nome": "Acadêmico",   "arquivo": "contents/classes/classes_iniciais/Academico.md" },
    { "nome": "Aventureiro", "arquivo": "contents/classes/classes_iniciais/Aventureiro.md" },
    { "nome": "Combativo",   "arquivo": "contents/classes/classes_iniciais/Combativo.md" },
    { "nome": "Ladino",      "arquivo": "contents/classes/classes_iniciais/Ladino.md" },
    { "nome": "Malandro",    "arquivo": "contents/classes/classes_iniciais/Malandro.md" },
    { "nome": "Prodígio",    "arquivo": "contents/classes/classes_iniciais/Prodigio.md" },
    { "nome": "Trabalhador", "arquivo": "contents/classes/classes_iniciais/Trabalhador.md" }
  ],

  "classes_avancadas": [
    { "nome": "Artista Marcial",      "arquivo": "contents/classes/classes_avancadas/ArtistaMarcial.md" },
    { "nome": "Assassino",            "arquivo": "contents/classes/classes_avancadas/Assassino.md" },
    { "nome": "Atirador Instintivo",  "arquivo": "contents/classes/classes_avancadas/Atirador_Instintivo.md" },
    { "nome": "Atirador Mágico",      "arquivo": "contents/classes/classes_avancadas/Atirador_Mágico.md" },
    { "nome": "Berserker",            "arquivo": "contents/classes/classes_avancadas/Berserker.md" },
    { "nome": "Comandante",           "arquivo": "contents/classes/classes_avancadas/Comandante.md" },
    { "nome": "Combativo Instintivo", "arquivo": "contents/classes/classes_avancadas/Combativo_Instintivo.md" },
    { "nome": "Combativo Mágico",     "arquivo": "contents/classes/classes_avancadas/Combativo_Mágico.md" },
    { "nome": "Domador",              "arquivo": "contents/classes/classes_avancadas/Domador.md" },
    { "nome": "Estrategista",         "arquivo": "contents/classes/classes_avancadas/Estrategista.md" },
    { "nome": "Guardião",             "arquivo": "contents/classes/classes_avancadas/Guardiao.md" },
    { "nome": "Mago",                 "arquivo": "contents/classes/classes_avancadas/Mago.md" }
  ],

  "magias": [
    { "nome": "Elemental — Água",  "arquivo": "contents/magias/Mana/Magia_Elemental_Agua.md" },
    { "nome": "Elemental — Fogo",  "arquivo": "contents/magias/Mana/Magia_Elmental_Fogo.md" },
    { "nome": "Elemental — Terra", "arquivo": "contents/magias/Mana/Magia_Elemental_Terra.md" },
    { "nome": "Elemental — Vento", "arquivo": "contents/magias/Mana/Magia_Elemental_Vento.md" },
    { "nome": "Elemental — Raio",  "arquivo": "contents/magias/Mana/Magia_Elemental_Raio.md" },
    { "nome": "Anômala",           "arquivo": "contents/magias/Mana/Anomalia.md" },
    { "nome": "Ki — Arte da Besta",     "arquivo": "contents/magias/Ki/Arte_Besta.md" },
    { "nome": "Ki — Arte Celestial",    "arquivo": "contents/magias/Ki/Arte_Celestial.md" },
    { "nome": "Ki — Arte do Diabo",     "arquivo": "contents/magias/Ki/Arte_Diabo.md" },
    { "nome": "Fé",                "arquivo": "contents/magias/Fe/Fe.md" },
    { "nome": "Caos",              "arquivo": "contents/magias/Caos/Caos.md" }
  ],

  "tags_poder": [
    { "id": "raca",       "nome": "Poder de Raça",      "cor": "#3aa76d" },
    { "id": "classe",     "nome": "Poder de Classe",    "cor": "#d98c3f" },
    { "id": "magia",      "nome": "Poder de Magia",     "cor": "#8a5cf6" },
    { "id": "habilidade", "nome": "Poder de Habilidade","cor": "#e05a7d" },
    { "id": "extra",      "nome": "Poder Extra",        "cor": "#58A0C8" }
  ],

  "tags_inventario": [
    { "id": "artefato",  "nome": "Artefato",         "cor": "#f0c56b" },
    { "id": "arma",      "nome": "Arma",             "cor": "#e06a5a" },
    { "id": "armadura",  "nome": "Armadura",         "cor": "#9aa7b5" },
    { "id": "consumivel","nome": "Consumível",       "cor": "#7fd08a" },
    { "id": "dinheiro",  "nome": "Dinheiro",         "cor": "#e0c93f" },
    { "id": "cristal",   "nome": "Cristal de Mana",  "cor": "#58A0C8" },
    { "id": "comida",    "nome": "Comida",           "cor": "#d98c3f" },
    { "id": "missao",    "nome": "Item de Missão",   "cor": "#c58cf6" },
    { "id": "outro",     "nome": "Outro",            "cor": "#8fa3b5" }
  ]
}
```

## Notas de edição

* **CA:** `ca_base + atributo` (padrão: 10 + Técnica). Armaduras somam por cima, manualmente ou via inventário.
* **Deslocamento:** `deslocamento_base` em metros. Se quiser que um atributo some, preencha `deslocamento_atributo`.
* **Arcana:** começa em 0; `arcana_por_rank` diz quanto soma ao **entrar** em cada rank (ex.: +5 no R6, R5 e R4).
* **Magículas iniciais:** fórmula com `mana` e `er` (Rank 10: Mana + 1, pois ER = 1).
* Para **adicionar uma raça/classe/magia** nova ao criador: crie o .md e acrescente a linha no registro acima.
