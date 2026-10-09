# Análise Matemática

> *Quanto um personagem acerta, quanto bate, quanto aguenta e quão difícil o mundo precisa ser para que tudo isso se encaixe. Esta página é a conta por trás do balanceamento — e o guia de bolso do Mestre para escolher uma CD.*

O sistema foi desenhado para **começar frágil e escalar muito**: um Rank 10 cai em poucos golpes; um Rank 3 atravessa um duelo sem perder o fôlego. O que importa não é o tamanho absoluto dos números (eles podem ficar astronômicos), e sim que **dano, vida, defesa e perícia cresçam juntos**. É isso que esta análise mede.

---

## 1. Regras de base

| Peça | Regra |
| --- | --- |
| **Dado de Rank (DR)** | d20, d22, d24, d26, d28, d30, d32, d35 do Rank 10 ao Rank 3. É o dado de todo teste. |
| **Eficiência de Rank (ER)** | 1, 2, 3, 4, 5, 6, 7, 7. Quantidade de dados de todo dano. |
| **Dano** | **ERdX + Atributo**, com X entre d4 e d12. |
| **Dado Máximo** | Cada dado que tira o valor máximo soma o Atributo **de novo** (ver *Eficiência de Rank*). |
| **Crítico** | Dobra o total, já com o Dado Máximo. |
| **Perícia** | Escalas **4/0**, **3/1** e **2/2** sobre os atributos. Teto de **80**. |
| **Atributos** | 5 pontos na criação + 1 por estrela (45 ao fim). Máximo 20 por atributo. |
| **CA** | 10 + Técnica + (10 − Rank). |
| **CD Mágica** | 10 + Mana + ER. |

Todas as tabelas usam o mesmo personagem de teste, o **Herói de Referência**: dois atributos principais que crescem juntos (um guerreiro com Corpo e Técnica, um mago com Mana e Intelecto), medido na **3ª estrela** de cada Rank. Os valores são esperados exatos (probabilidades calculadas, sem sorteio).

---

## 2. Dano

### 2.1 A fórmula

Dano médio de um ataque que acerta:

> **ER × (X + 1) ÷ 2 + Atributo × (1 + ER ÷ X)**

O primeiro termo são os dados; o segundo é o atributo, que entra uma vez e mais **ER ÷ X** vezes pelo Dado Máximo. Um dado menor tem mais chance de ser máximo, então **entrega o atributo com mais frequência**.

### 2.2 Dano por golpe do Herói de Referência

| Rank | ER | Atributo | d4 | d8 | d12 | Crítico (d8) |
| --- | --- | --- | --- | --- | --- | --- |
| R10 Deceri | 1 | 4 | 8 | 9 | 11 | 18 |
| R9 Novedo | 2 | 7 | 16 | 18 | 21 | 36 |
| R8 Octitus | 3 | 9 | 23 | 26 | 31 | 52 |
| R7 Arcana | 4 | 12 | 34 | 36 | 42 | 72 |
| R6 Coniuncta | 5 | 14 | 44 | 45 | 52 | 90 |
| R5 Unearta | 6 | 17 | 58 | 57 | 64 | 114 |
| R4 Verus | 7 | 19 | 70 | 67 | 76 | 134 |
| R3 Ark | 7 | 20 | 72 | 69 | 77 | 138 |

**O que a tabela diz**

* O dano cresce **cerca de 8 vezes** do primeiro ao último Rank (de 9 a 69 com um d8). É uma curva saudável: fraco no começo, forte no fim, sem ficar linear.
* **Do Rank 6 em diante o d4 empata com o d8 e nos Ranks 5 a 3 passa dele.** Com Atributo alto, o bônus do Dado Máximo pesa mais que a média dos dados. Nada quebra — o d12 continua na frente —, mas a diferença entre armas deixa de ser o dado e passa a ser o efeito da arma (alcance, velocidade, sangramento, mãos). Ao criar armas novas, dê ao d4 e ao d6 um efeito de utilidade, não mais dano.
* **Rank 4 (Verus) e Rank 3 (Ark) têm o mesmo ER (7).** Do Verus para o Ark o ganho é de apenas **1 a 3 pontos** por golpe. Para o último Rank parecer um salto, recomenda-se **ER 8 no Rank 3** (ver seção 9).

---

## 3. Vida

### 3.1 O problema: duas fórmulas

Cada arquivo de Rank diz duas coisas diferentes sobre a Vida:

| Onde | O que diz | Rendimento |
| --- | --- | --- |
| Cabeçalho do Rank e `config.md` | **Corpo × dN + VR** por estrela | Cresce com o Corpo e com o dado. Rank 3, estrela 5: **~3.250 de Vida** |
| Texto de cada estrela | **1d4 + (ER × 2) + VR** | Cresce linear. Rank 3, estrela 5: **~570 de Vida** |

Contra o dano da seção 2, a primeira fórmula faz um duelo entre iguais durar **54 ataques** no Rank 3 (e só **4** no Rank 10): a Vida cresce mais de cem vezes enquanto o dano cresce oito. A segunda fórmula, nas mesmas condições, mantém a duração entre **4 e 13 ataques** em todos os Ranks.

### 3.2 Recomendação

> **Vida por estrela (2ª à 5ª): 1d4 + (ER × 2) + VR + metade do Corpo.**

O texto da estrela já era a fórmula equilibrada; só faltava dar ao Corpo um papel. Meio ponto de Corpo por estrela deixa o guerreiro com **20% a 40% mais Vida** que um mago — um tanque de verdade, sem virar um muro.

| Rank (estrela 1 → 5) | Vida do guerreiro | Vida do mago |
| --- | --- | --- |
| R10 Deceri | 26 → 76 | 20 → 62 |
| R9 Novedo | 76 → 139 | 62 → 112 |
| R8 Octitus | 139 → 215 | 112 → 170 |
| R7 Arcana | 215 → 304 | 170 → 236 |
| R6 Coniuncta | 304 → 406 | 236 → 310 |
| R5 Unearta | 406 → 521 | 310 → 392 |
| R4 Verus | 521 → 649 | 392 → 482 |
| R3 Ark | 649 → 779 | 482 → 572 |

### 3.3 Duração de um duelo entre iguais

Quantos ataques (acertos e erros incluídos) um herói precisa para derrubar outro do mesmo nível, com a Vida recomendada. Ela sobe de 4,5 para 13 porque o Rank 10 nasce com Vida mínima.

| Rank | Estrela | Guerreiro derruba Guerreiro | Mago derruba Guerreiro | Guerreiro derruba Mago |
| --- | --- | --- | --- | --- |
| R10 | 1 | 4,5 | 4,5 | 2,8 |
| R10 | 5 | 10,6 | 10,6 | 6,3 |
| R7 | 1 | 7,5 | 7,1 | 4,2 |
| R7 | 5 | 9,8 | 9,4 | 5,5 |
| R5 | 1 | 8,3 | 8,0 | 4,8 |
| R5 | 5 | 10,1 | 9,7 | 5,8 |
| R3 | 1 | 10,8 | 10,8 | 6,1 |
| R3 | 5 | 13,0 | 13,0 | 7,3 |

Com duas ou três ações por turno, isso é **3 a 6 rodadas** por combate. O mago cai em cerca de metade do tempo do guerreiro: tem menos Vida e uma CA menor (sem Técnica). A fragilidade vem da escolha de atributos, não de uma regra especial.

---

## 4. Perícias

### 4.1 O que cada build alcança

Perícia = Dado de Rank + escala × atributos. A cada estrela entra **1 ponto de atributo**, e na escala 4/0 isso vale **+4** na perícia.

| Build | Como cresce | Chega ao teto 80 em |
| --- | --- | --- |
| **Pico** (tudo em um atributo) | +4 por estrela | Rank 7, estrela 2 |
| **Dupla** (dois principais) | +2 por estrela | Rank 4, estrela 5 |
| **Generalista** (6 atributos iguais) | +0,7 por estrela | **nunca** — termina em ~30 |

Dois fatos que importam:

1. **Quem espalha pontos não faz testes difíceis.** Com seis atributos iguais, a melhor perícia termina em ~30, e a CD Média do Rank 5 é 82. O sistema é feito para **especialistas**; um personagem "bom em tudo" só vence CDs baixas. Isso é intencional — para o Mestre, significa que a mesa precisa de **grupo**, não de herói solo.
2. **O teto 80 chega cedo.** Depois dele a perícia só cresce pelo Dado de Rank (cerca de +1 por Rank) e por itens e poderes. A tabela de CD da seção 6 já acompanha isso: nos Ranks 4 e 3 ela deixa de subir 10 por Rank e sobe só de 4 a 9.

### 4.2 Por que a tabela de CD antiga não funcionava

A tabela antiga de *Perícias* subia de **10 em 10** por Rank e chegava a Heroico = 125. O Herói de Referência, no auge, tira no máximo **80 + 35 = 115**. Resultado: **Heroico era impossível em qualquer Rank** e o Difícil já era raro no começo da carreira. Além disso, a tabela usava d35 e d40 nos dois últimos Ranks, enquanto os arquivos de Rank dizem **d32 e d35**.

---

## 5. Defesas

### 5.1 Testes contra a CD Mágica

Teste de resistência = Dado de Rank + atributo contra a **CD Mágica = 10 + Mana + ER** de um conjurador do mesmo nível.

| Rank | CD Mágica | Atributo principal | Atributo secundário | Atributo 3 (negligenciado) |
| --- | --- | --- | --- | --- |
| R10 | 15 | 50% | 50% | 45% |
| R8 | 22 | 50% | 50% | 25% |
| R6 | 29 | 50% | 50% | 10% |
| R5 | 33 | 50% | 46% | 3% |
| R4 | 36 | 50% | 50% | 0% |
| R3 | 37 | 54% | 54% | 5% |

A fórmula está **bem calibrada para quem investe**: 50% de resistir com o atributo principal em qualquer Rank. Mas quem negligencia o atributo **nunca resiste** a partir do Rank 5. Recomenda-se que as **faces de crítico do Dado de Rank sempre passem** em testes de resistência (um piso de 3 em 32 no Rank 4, por exemplo): um desastre garantido é menos divertido que uma chance pequena.

### 5.2 Resistência e armadura

Resistência reduz um valor **fixo** de cada golpe. O golpe cresce oito vezes ao longo dos Ranks; a Resistência I só acompanha o ER e o Corpo.

| Rank | Golpe (d8) | Resistência I | Resistência IV | Resistência X | Armadura Pesada Superior (−8) |
| --- | --- | --- | --- | --- | --- |
| R10 | 9 | 88% | 100% | 100% | 88% |
| R8 | 26 | 57% | 85% | 100% | 30% |
| R6 | 45 | 48% | 64% | 97% | 17% |
| R5 | 57 | 45% | 58% | 84% | 14% |
| R3 | 69 | 43% | 53% | 75% | 11% |

*Percentual do dano barrado, para o Corpo do Herói de Referência. Resistência I = 3 + ER + Corpo; IV = 10 + ER + Corpo; X = 25 + ER + Corpo.*

* **Resistência I já corta quase metade do dano**, e como soma o Corpo inteiro, o tanque a vê crescer sem esforço. Resistência X **anula** o golpe do Rank 10 e barra cerca de 85% de um golpe do Rank 5.
* **A redução fixa das armaduras (−1 a −8) vale muito no Rank 10 e quase nada depois**: no Rank 5 uma armadura Pesada Superior barra 14%.

Recomendações: somar o **ER** à redução das armaduras (por exemplo −4 + ER); e a Resistência **nunca deve reduzir o dano a menos de um quarto do valor rolado** — sem esse piso, as Resistências altas tornam o personagem imune a tudo que não seja Crítico.

---

## 6. Guia do Mestre — escolhendo a CD

### 6.1 Passo a passo

1. **Escolha o Rank do desafio.** É o Rank de quem o enfrentaria com naturalidade: a fechadura de uma estalagem é Rank 10; o cofre de um arquimago é Rank 6.
2. **Escolha o grau de dificuldade** na tabela abaixo.
3. **Leia a CD** na linha do Rank.
4. **Ajuste** com as circunstâncias (6.3).

### 6.2 Tabela de CD

A tabela mostra a CD que o **especialista do Rank** (Herói de Referência com a perícia no peso 4) vence na chance indicada. Ela substitui a tabela de Testes da página *Lista de Perícias*.

| Rank | Dado | Bônus do especialista | Trivial 95% | Fácil 80% | Médio 55% | Difícil 30% | Heroico 12% | Lendário 3% |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R10 Deceri | d20 | 16 | 18 | 20 | 25 | 30 | 34 | 36 |
| R9 Novedo | d22 | 28 | 30 | 33 | 38 | 44 | 48 | 50 |
| R8 Octitus | d24 | 36 | 38 | 41 | 47 | 53 | 58 | 60 |
| R7 Arcana | d26 | 48 | 50 | 54 | 60 | 67 | 71 | 74 |
| R6 Coniuncta | d28 | 56 | 58 | 62 | 69 | 76 | 81 | 84 |
| R5 Unearta | d30 | 68 | 70 | 74 | 82 | 89 | 95 | 98 |
| R4 Verus | d32 | 76 | 78 | 83 | 91 | 99 | 105 | 108 |
| R3 Ark | d35 | 80 | 82 | 87 | 96 | 105 | 111 | 114 |

**Como ler as chances.** São as do especialista. Quem tem **escala 2/2** em dois atributos principais fica a 1 ou 2 pontos disso. Quem **não é especialista** (atributo 3, bônus 12) passa em Fácil (65%) e Médio (40%) no Rank 10; no Rank 9 nem o Trivial é garantido (22%) e a partir do Rank 8 não passa nem ele sem ajuda. Daí a regra de ouro: *não peça teste Médio a quem não investiu — ofereça uma forma de ganhar vantagem, ou deixe o especialista do grupo fazer o teste.*

**Regra de bolso** (sem tabela): *CD Média = bônus do especialista + metade do Dado de Rank.* Rank 6: 56 + 14 = 70 (a tabela diz 69).

### 6.3 Ajustes

| Situação | Ajuste na CD |
| --- | --- |
| Ferramenta ideal, preparo, ajuda de aliado | **−2** |
| Pressa, ruído, mãos ocupadas | **+2** |
| Ambiente hostil (escuridão, lama, tempestade) | **+4** |
| Ferramenta errada ou improvisada | **+4** |
| Cada estrela acima ou abaixo da 3ª | **±2** (até o teto 80) |
| Cada Rank acima do seu | use a linha do Rank dele — *dois ranks acima é uma parede* |

### 6.4 Locais — a CD do mundo

Uma região tem **um Rank de perigo**. Use-o para tudo ao mesmo tempo:

| Elemento do local | Como definir |
| --- | --- |
| **CD de exploração** (rastrear, escalar, arrombar) | coluna *Médio*, no Rank da região |
| **CD de armadilhas e enigmas** | *Difícil*, ou *Médio* para armadilhas simples |
| **Habitantes comuns** | Rank da região **menos 1** |
| **Criaturas de elite** | Rank da região |
| **Senhor do local** | Rank da região **mais 1** (ou um chefe do mesmo Rank) |

Uma região **muito acima** do Rank do grupo é um aviso para os jogadores, não um castigo: deixe a fuga viável e as pistas visíveis.

### 6.5 Perigos de ambiente

Um perigo causa **ERdX sem atributo**, com o ER do Rank do local. Em porcentagem da Vida do Herói de Referência:

| Rank | Leve (ERd4) | Moderado (ERd8) | Mortal (ERd12) |
| --- | --- | --- | --- |
| R10 | 2 (4%) | 4 (8%) | 6 (12%) |
| R8 | 8 (4%) | 14 (7%) | 20 (11%) |
| R6 | 12 (3%) | 22 (6%) | 32 (9%) |
| R5 | 15 (3%) | 27 (5%) | 39 (8%) |
| R3 | 18 (2%) | 32 (4%) | 46 (6%) |

Aplique o perigo **por rodada** e dê à vítima um teste de CD *Médio* para reduzir à metade. Um perigo Mortal por rodada é uma ameaça real em cerca de **8 rodadas**, não um golpe único.

### 6.6 Criaturas e chefes

Referência para uma criatura do **mesmo Rank do grupo** (Herói de Referência, estrela 3). As colunas de Vida são a quantidade de pontos; cada uma equivale à quantidade de golpes que o grupo precisa acertar.

| Rank | CA | Ataque | Lacaio (1 golpe) | Padrão (3 golpes) | Elite (6 golpes) | Chefe (4 heróis) | Dano padrão | Dano do chefe (2×) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R10 | 14 | +5 | 6 | 18 | 35 | 140 | 7 | 11 |
| R9 | 17 | +8 | 12 | 36 | 73 | 290 | 14 | 21 |
| R8 | 21 | +12 | 19 | 58 | 116 | 466 | 21 | 31 |
| R7 | 24 | +15 | 28 | 83 | 166 | 665 | 29 | 43 |
| R6 | 28 | +19 | 37 | 112 | 223 | 892 | 36 | 54 |
| R5 | 31 | +22 | 47 | 142 | 284 | 1.135 | 45 | 68 |
| R4 | 35 | +26 | 57 | 170 | 340 | 1.359 | 54 | 81 |
| R3 | 37 | +27 | 57 | 172 | 343 | 1.372 | 55 | 83 |

* **Dano padrão** = 0,8 × o golpe do herói; **chefe** = 1,2 × o golpe, **duas vezes por rodada**.
* **CD dos poderes da criatura** = 10 + ER + o atributo principal da tabela 2.2 para aquele Rank.
* Um chefe assim derruba um herói sozinho em cerca de **5 rodadas** e dura **cerca de 6 rodadas** contra o grupo: o combate termina com um aliado caído ou perto disso.
* **Rank diferente do grupo:** use a linha do Rank da criatura. Um Rank acima o grupo ainda vence, gastando recursos; dois Ranks acima é uma fuga.

---

## 7. Resumo do diagnóstico

| Área | Situação | Veredito |
| --- | --- | --- |
| Dano ERdX + Atributo + Dado Máximo | Cresce ~8×; d4 ≈ d8 nos Ranks altos | **Bom**; d4 vira arma de utilidade |
| Vida Corpo × dN | Cresce mais de 100× contra 8× do dano | **Quebrado**; use a Vida de cada estrela |
| Vida 1d4 + 2·ER + VR (+ ½ Corpo) | Duelos de 4 a 13 ataques em todo Rank | **Calibrado** |
| Perícias 4/0, 3/1, 2/2 | Teto 80 chega cedo; generalista fica em ~30 | **Funciona para especialistas** |
| CD antiga de Perícias | Heroico impossível | **Substituída** pela seção 6.2 |
| CD Mágica 10 + Mana + ER | 50% de resistir com o atributo principal | **Bem calibrada** |
| Resistência fixa | Anula dano baixo; cresce devagar | **Ajustar** com piso de ¼ |
| Rank 3 (Ark) | ER igual ao do Rank 4 | **Pouco salto** — ER 8 |

---

## 8. Método

* Todo número vem dos arquivos do próprio sistema (ranks, *Regras de Crítico*, *Resistências*, *Arsenal*); o que é suposição está listado aqui.
* **Acerto:** ataque = d(DR) + Técnica + ER contra a CA; as faces de crítico sempre acertam.
* **Herói de Referência:** atributos principais = ⌈(5 + estrelas acumuladas) ÷ 2⌉ e ⌊(5 + estrelas acumuladas) ÷ 2⌋, máximo 20; Vida inicial 20 + 6 por 2 de Corpo; raça com VR 6 (Humano).
* **Crítico:** a quantidade de faces de crítico por Rank (1, 1, 2, 2, 3, 3, 3, 3) vem de *Regras de Crítico*; todo crítico dobra o total.
* **Dado de Rank:** os dados usados são os dos arquivos de Rank (d32 e d35 nos Ranks 4 e 3).
* **Teste de atributo:** d(DR) + valor do atributo, sem escala.
* Não há simulação por sorteio: as médias vêm de probabilidades exatas.

---

## 9. Ajustes propostos

Para aplicar quando estiverem de acordo com a mesa. Das propostas abaixo, **só a tabela de testes da página *Lista de Perícias* foi substituída**; o resto continua como estava.

1. **Vida:** unificar em *1d4 + (ER × 2) + VR + metade do Corpo* por estrela (cabeçalho dos Ranks, `config.md` e a ficha).
2. **Rank 3 (Ark): ER 8**, para o último Rank ser um salto de verdade.
3. **Resistência:** o dano reduzido nunca fica abaixo de **um quarto** do valor rolado.
4. **Armaduras:** redução fixa **mais o ER** do portador.
5. **Testes de resistência:** as faces de crítico do Dado de Rank sempre passam.
6. **Armas:** dar ao d4 e ao d6 efeitos de utilidade; deixar o dano bruto para o d10 e o d12.
7. **CD Mágica:** padronizar em **10 + Mana + ER** (a classe *Combativo Imaginário* ainda cita "DR + Mana + ER").
8. **Perícias:** manter 4/0, 3/1 e 2/2; considerar **+ER** nos testes das perícias em que o personagem é profissional (já descrito em *Eficiência de Rank*), o que mantém o crescimento depois do teto 80.
