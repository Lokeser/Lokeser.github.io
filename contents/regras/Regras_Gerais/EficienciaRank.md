# Eficiência de Rank

Essas Eficiências de Rank representam o quão habilidoso ou competente um personagem é. Ao avançar de Ranks, você se torna cada vez mais forte e habilidoso, a Eficiência de Rank é uma prova disso.

Você pode verificar sua ER na página do seu Rank



**Usos da Eficiência de Rank**
.Sua Eficiência de Rank é adicionada em todos os testes de uma perícia na qual for *Profissional*(Ter uma profissão na qual essa perícia é a principal).
.Cálculo de Dano: Magias, Armas, Etc. Causam dano ERdX + Atributo.

---

## Dado Máximo — o bônus da sorte

Todo dano da forma **ERdX + Atributo** tem uma segunda chance escondida nos dados:

> **Para cada dado que mostrar o valor máximo, some o Atributo do dano mais uma vez.**

Isso vale para **todo ERdX**: armas, Manipulação Livre, técnicas, habilidades, bônus de dano (`+ERdX`) e qualquer outro dano escrito nessa forma.

**Como resolver**

1. Role os **ER** dados (`ERdX`) e some os resultados.
2. Conte quantos dados mostraram o **valor máximo** (o número de faces: um 4 num d4, um 6 num d6...).
3. Dano total = dados + **Atributo × (1 + dados máximos)**.
4. Se o ataque foi um **Crítico**, dobre o total no final.

**Qual atributo?** O mesmo que aparece na fórmula. Se a fórmula não traz atributo (por exemplo um `+ERd4` de dano extra), use o **atributo de dano do ataque** que o originou.

**Exemplo — adaga:** um personagem de **Rank 8** (ER 3) com **Técnica 8** ataca com uma adaga, **ERd4 + Técnica** = 3d4 + 8.

| Rolagem | Dados máximos | Cálculo | Dano |
| --- | --- | --- | --- |
| 1, 2, 3 | 0 | 6 + 8 | **14** |
| 4, 2, 3 | 1 | 9 + 8 + 8 | **25** |
| 4, 4, 1 | 2 | 9 + 8 + 16 | **33** |
| 4, 4, 4 | 3 | 12 + 8 + 24 | **44** |

**Quanto isso rende em média?** Cada dado tem **1 chance em X** de ser máximo, então o bônus esperado é **ER × Atributo ÷ X**. Dados menores acertam o máximo com mais frequência. Com **ER 3 e Atributo 8**:

| Dado | Chance de máximo | Média dos dados | Bônus esperado | Dano médio total |
| --- | --- | --- | --- | --- |
| d4 | 25% | 7.5 | +6.0 | **21.5** |
| d6 | 16,7% | 10.5 | +4.0 | **22.5** |
| d8 | 12,5% | 13.5 | +3.0 | **24.5** |
| d10 | 10% | 16.5 | +2.4 | **26.9** |
| d12 | 8,3% | 19.5 | +2.0 | **29.5** |

Sem o Dado Máximo, um d12 daria **2,6 vezes** o dano de dados de um d4. Com ele, a diferença no dano médio total cai para cerca de **37%** — e **quanto maior o Atributo, menor ainda**: com ER 7 e Atributo 20 (Rank 3), d4 e d10 empatam em **72,5** de média. Por isso um dado pequeno não é uma escolha ruim: rende menos por dado, mas **entrega o bônus de sorte com muito mais frequência** — e o dano fica mais consistente.
