# Luxsandoria

**O grimório digital de _Watashi no Jinsei_** — um RPG de mesa de fantasia autoral.

Aqui ficam todas as regras do mundo: raças, classes, magias, habilidades e ranks. Você também cria e guarda seus personagens direto no site, sem instalar nada.

🌐 **Acesse:** https://lokeser.github.io

---

## O que tem no site

| Seção | O que você encontra |
| --- | --- |
| **Regras** | Atributos, perícias, combate, condições, arsenal e sistemas opcionais, com busca |
| **Ranks** | A hierarquia de poder, do Rank 10 (Deceri) ao Rank 3 (Ark) |
| **Raças** | Humanas, mágicas, especiais e proibidas |
| **Classes** | Iniciais, avançadas, absolutas, herdadas e secretas |
| **Magias** | As quatro fontes — Mana, Ki, Fé e Caos — e as Artes de cada uma |
| **Habilidades** | Os pilares de Corpo, Mente e Alma, organizados por estágio |
| **Meus Personagens** | Criador de fichas, com cálculo automático e exportação |
| **Eras e Mapa** | A linha do tempo e o atlas do mundo |

---

## Criador de personagem

- Calcula sozinho DR, ER, CA, Deslocamento, Vida, Arcana, perícias e magículas.
- Os poderes de raça, classe e magia entram na ficha a partir dos próprios arquivos de regras: **editou uma regra, a ficha acompanha**.
- Sobe de Rank e de estrela com os dados de Vida e Magículas.
- Baixa a ficha como `.html` e a carta do personagem como imagem.
- Os personagens ficam salvos no navegador. Com login do GitHub, também podem ser enviados para este repositório.

---

## Como o conteúdo funciona

O site é estático (GitHub Pages): não há servidor nem banco de dados. Tudo é lido de arquivos Markdown em tempo real.

```
contents/
├── regras/        regras gerais, combate e sistemas opcionais
├── ranks/         um arquivo por rank
├── racas/         uma raça por arquivo
├── classes/       iniciais, avançadas, absolutas, herdadas e secretas
├── magias/        Mana, Ki, Fé e Caos
├── habilidades/   pilares Corpo, Mente e Alma
├── eras/  mapa/   linha do tempo e atlas
├── personagens/   fichas salvas na nuvem, uma pasta por usuário
└── sistema/       config.md e o índice de habilidades
css/  js/  assets/  visual, lógica e imagens
```

### Para editar uma regra

Basta editar o `.md` correspondente e enviar. As páginas mostram o texto novo na hora.

Os poderes que a ficha lê ficam entre marcadores. Ao editar, **preserve-os**:

```markdown
<!--#poder id="mg_exemplo_r10_1" fonte="magia" rank="10" estrela="1" nome="Nome do Poder"-->
### Nome do Poder
Texto do efeito.
<!--#fim-->
```

| Campo | Significado |
| --- | --- |
| `id` | Identificador estável. Não mude depois de criado |
| `fonte` | `raca`, `classe_inicial`, `classe_avancada`, `magia`... |
| `rank` / `estrela` | Em que ponto da evolução o poder é liberado |

Os números que a ficha usa (perícias, fórmulas, listas de raças e magias) ficam em [`contents/sistema/config.md`](contents/sistema/config.md).

---

## Visual

- Dois temas: **Aurora Arcana** (claro) e **Eclipse Arcano** (escuro). A escolha é salva por usuário.
- Tokens de design em [`css/tokens.css`](css/tokens.css), compartilhados por todas as páginas.
- Responsivo, com navegação por teclado e respeito a `prefers-reduced-motion`.

---

## Rodar localmente

Não há build. Qualquer servidor estático serve:

```bash
python -m http.server 8099
```

Depois abra http://localhost:8099.

> Abrir os `.html` direto pelo arquivo (`file://`) não funciona, porque o site busca os `.md` com `fetch`.

---

## Autoria

Sistema, mundo e regras de **Lokeser**.
