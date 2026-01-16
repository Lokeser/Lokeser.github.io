# ⚔️ Watashi no Jinsei: O Arsenal do Destino

Este documento detalha o armamento disponível no mundo. O poder de uma arma não reside apenas em seu corte, mas na **Eficiência de Rank (ER)** de quem a empunha.

---

## 📐 Regras Gerais de Combate

### Fórmulas Universais
Para evitar repetições, todas as armas abaixo seguem estas fórmulas base, salvo descrito o contrário:

* **Acerto:** `DR + Atributo`
    * *Nota:* Conhecimento em [Nome da Arma] concede +ER no Acerto da mesma.
    * *Nota:* Armas **Médias** e **Grandes** exigem a habilidade *Conhecimento de Arma*, caso contrário sofrem **-1DR** no acerto.
    * *Nota:* Armas **Pequenas** concedem automaticamente **+ER** no Acerto devido à facilidade de manuseio.
* **Dano Base:** `(ER x Dado da Arma) + Atributo`
    * *Exemplo:* Um Rank 8 (ER 3) com Força 4 usando uma Adaga (d4) causa: `3d4 + 4`.

### Legenda de Efeitos
* **Sangramento:** O alvo perde `1d8` de vida no início de seus turnos (Teste de CON CD 18+Rank para parar).
* **Queda:** O alvo cai no chão (Condição: Caído).
* **Tonto:** O alvo perde ações aleatórias (1d3).

---

## 🗡️ Categoria: Armas Pequenas
*Armas leves, fáceis de esconder e rápidas. Ideais para quem prioriza velocidade ou uso de magia em combate.*
* **Dado Padrão:** `d4` (Pode variar por especialização)
* **Bônus:** Recebem `+ER` extra na rolagem de Acerto.

### Adaga
* **Tipo:** Cortante / Perfurante
* **Atributo:** Destreza
* **Dado:** `d4`
**Estilo Duplo:** Se estiver empunhando duas adagas, você pode realizar um ataque com a segunda adaga como **Ação Bônus**.
* **Corte Preciso**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd4 + Des`
    * *Efeito:* Crítico aplica **Sangramento**. Se o alvo já estiver sangrando, recebe +2 de Dano final.
* **Corte Sombrio (Custo: 1 Magícula)**
    * *Gatilho:* Ao realizar a ação Atacar.
    * *Efeito:* Realiza um ataque extra imediato.
    * *Dano:* `ERd4` (Sem atributo). Crítico aplica 1 nível de Sangramento.
* **Arremesso**
    * *Acerto:* `DR + Des`
    * *Distância:* `2m + Atletismo`
    * *Dano:* `ERd4 + Des`
    * *Especial:* Pode recuperar a adaga magicamente como Ação Bônus se estiver a 1m dela.

### Foice Curta
* **Tipo:** Cortante
* **Atributo:** Destreza (Pode usar Força, reduzindo o dado para d4)
* **Dado:** `d6` (Especializada)
* **Ceifa Curva**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd6 + Des`
    * *Efeito:* Crítico aplica **Sangramento**.
* **Gancho Traiçoeiro**
    * *Custo:* Ação Bônus após acertar uma Ceifa.
    * *Efeito:* O alvo realiza Teste de Defesa (Força ou Des) contra o resultado do seu ataque.
    * *Falha:* O alvo é puxado 1,5m em sua direção e fica **Desprevenido** até o início do seu próximo turno.

### Chakram
* **Tipo:** Cortante
* **Atributo:** Destreza
* **Dado:** `d4` (Corpo a corpo) / `d14` (Arremesso Treinado)
* **Requisito:** *Treino com Chakram* para o arremesso potente.
**Estilo Dançante:** Se possuir uma Classe de Combate e empunhar dois chakrams, pode realizar um ataque com a segunda arma como **Ação Bônus**.
* **Corte Circular**
    * *Acerto:* `DR + Des`
    * *Dano:* `ER x d4 + Des`
    * *Efeito:* **Sangris.** Crítico aplica **Sangramento**. Se o alvo já estiver sangrando, você causa `+2 Dados` de dano extra.
* **Arremesso Letal (Requer Conhecimento)**
    * *Acerto:* `DR + Des + ER`
    * *Dano:* `ER x d14 + Des`
    * *Efeito:* **Sangris** (Aplica Sangramento ou +2D se já sangrando).
    * *Técnica de Retorno:* Arremessa em Distância Média. A arma retorna magicamente à sua mão no início do seu próximo turno (se tiver mão livre).
---

## ⚔️ Categoria: Armas Médias
*O equilíbrio entre poder e controle. Exigem treinamento para serem letais.*
* **Dado Padrão:** `d8`
* **Requisito:** Habilidade *Conhecimento de Arma* (ou sofre -1DR).

### Espada Curta (Lâmina Ágil)
* **Tipo:** Cortante / Perfurante
* **Atributo:** Destreza ou Força
* **Dado:** `d8`
* **Golpe Versátil**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd8 + (For ou Des)`
    * *Efeito:* Crítico aplica 2 níveis de **Sangramento**.
* **Fluxo de Lâmina (Custo: 2 Magícula)**
    * *Gatilho:* Pode ser usado para *cada* ataque dentro de uma ação.
    * *Efeito:* Realiza um golpe rápido adicional.
    * *Dano:* `ERd6`. (Não soma atributo).
* **Estocada Vital**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd8 + Des`
    * *Crítico:* Aplica `1d4` níveis de Sangramento.

### Machado de Mão
* **Tipo:** Cortante
* **Atributo:** Força (Dano brutal) ou Destreza (Velocidade)
* **Dado:** `d8`
* **Corte Forte**
    * *Acerto:* `DR + For`
    * *Dano:* `ERd8 + For`
    * *Efeito:* Crítico aplica **Sangramento**.
* **Corte Veloz**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd6 + Des`
    * *Efeito:* Recebe **-1 na Margem de Ameaça** (Critica mais fácil).
* **Arremesso Pesado**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd8 + Des`
    * *Recuperação:* Como ação bônus se estiver a 1m.

### Espada Longa
* **Tipo:** Cortante
* **Atributo:** Força (Primário) ou Destreza (Adaptável)
* **Dado:** `d10`
* **Postura de Corte**
    * *Acerto:* `DR + For`
    * *Dano:* `ERd10 + For`
    * *Efeito:* Crítico aplica **Sangramento**.
* **Postura de Estocada**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd10 + Des`
    * *Efeito:* Em caso de crítico, aumenta o dano final em `+(1d4ER)`.

### Katana
* **Tipo:** Cortante / Perfurante
* **Atributo:** Força (Dano Bruto) e Destreza (Técnica)
* **Dado:** `d11` / `d9` (Aço Dobrado)
* **Requisito:** Nenhum (Mas escala melhor com Classe de Combate).
* **Corte Forte (Iaijutsu)**
    * *Acerto:* `DR + For`
    * *Dano:* `ER x d11 + For`
    * *Crítico:* Aplica **Sangramento**.
* **Corte Rápido**
    * *Acerto:* `DR + Des`
    * *Dano:* `ER x d9 + Des`
* **Estocada Perfeita**
    * *Acerto:* `DR + (For/2) + (Des/2)`
    * *Dano:* `ER x d9 + Des`
    * *Nota:* Único movimento que utiliza Destreza total no dano base.

### Maça
* **Tipo:** Contundente
* **Atributo:** Força
* **Dado:** `d10` (Impacto Pesado)
* **Bonk!**
    * *Acerto:* `DR + For`
    * *Dano:* `ERd10 + For`
    * *Efeito:* Crítico aplica a condição **Tonto**. Pode atacar uma segunda vez como Ação Bônus (sem somar atributo no dano do segundo ataque).
* **Quebra-Cascos (Passiva)**
    * Causa dano extra baseado na armadura do alvo:
        * Leve: `+1d10`
        * Média: `+2d10`
        * Pesada: `+3d10`

### Lança
* **Tipo:** Perfurante
* **Atributo:** Destreza ou Força
* **Dado:** `d8`
* **Alcance:** Permite atacar inimigos a **3m** (Curto) em vez de 1,5m.
* **Perfuração Tática**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd8 + Atributo`
    * *Crítico:* Aplica **Sangramento** e perfura, atingindo um segundo inimigo atrás do alvo (até 3m).
* **Contra-Golpe (Reação)**
    * Se um inimigo errar um ataque corpo a corpo contra você, pode realizar um ataque imediato com a Lança.

### Mangual
* **Tipo:** Contundente
* **Atributo:** Força
* *Acerto:* `DR + For`
* **Dado:** `d8`
* **Alcance:** Ignora escudos físicos.
* **Giro Caótico**
    * *Ação Bônus:* Role `1d3`. Adicione essa quantidade de dados (`d8`) ao dano do seu próximo ataque neste turno.

---

## 🏋️ Categoria: Armas Grandes
*Armas de destruição massiva. Lentas, mas devastadoras.*
* **Dado Padrão:** `d12`
* **Requisito:** Habilidade *Conhecimento de Arma* + **Força 2+** (ou sofre desvantagens severas).

### Espada Montante
* **Tipo:** Cortante
* **Atributo:** Força
* **Dado:** `d12`
* **Investida Violenta (Passiva):** Ao se mover pelo menos 3m em direção ao alvo, recebe **+2 Acerto e +2 Dano**.
* **Guilhotina**
    * *Acerto:* `DR + For`
    * *Dano:* `ERd12 + For`
    * *Efeito:* Crítico causa **Sangramento** massivo.
* **Impacto de Guarda (Estocada)**
    * *Acerto:* `DR + For`
    * *Dano:* `ERd8 + For`
    * *Efeito:* O alvo realiza Teste de Defesa (Dex). Se falhar, fica **Agarrado** na lâmina/guarda até seu próximo turno.

### Machado de Guerra
* **Tipo:** Cortante
* **Atributo:** Força
* **Dado:** `d12` (Escala para d15 com requisitos)
* **Executor**
    * *Acerto:* `DR + For`
    * *Dano:* `ERd12 + For`
    * *Crítico:* Aplica **Sangramento** e **Queda**.
* **Tornado da Morte (Habilidade Especial)**
    * *Requisitos:* Força 5+, Const 4+.
    * *Limite:* Vezes por dia igual à Força.
    * *Efeito:* Gira atingindo todos em raio de 2m.
    * *Acerto:* Inimigos fazem Teste de Defesa (Dex) contra sua CD de Força.
    * *Acerto:* `DR + For`
    * *Dano:* `ERd15 + For`.
    * *Sustentar:* No próximo turno, pode gastar Ação Completa para continuar girando e se mover.

### Martelo de Guerra
* **Tipo:** Contundente
* **Atributo:** Força
* **Dado:** `d12` (Pode chegar a d20 com bônus)
* **Esmagar**
    * *Acerto:* `DR + For`
    * *Dano:* `ERd12 + For`
    * *Crítico:* Aplica **Tonto** e **Queda**.
* **Peso Morto:** Se sua Destreza for 6 ou menos, sofre -2 na CA após atacar.
* **Destruidor de Latas (Passiva)**
    * Dano adicional contra armaduras:
        * Leve: `+1 Dado`
        * Média: `+2 Dados`
        * Pesada: `+3 Dados`

### Lança de Cavalaria
* **Tipo:** Perfurante
* **Atributo:** Força
* **Dado:** `d14` (Montado) / `d10` (A pé)
* **Carga Montada**
    * *Requisito:* Estar montado.
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd14 + Des + (Des da Montaria)`
    * *Crítico:* Aplica **Queda** e **Sangramento**. O alvo deve passar em Teste de Defesa ou ser **Empalado (Agarrado)**.
* **Combate em Solo**
    * *Acerto:* `DR + For`
    * *Dano:* `ERd10 + For`
    * *Efeito:* Alcance Longo (3m). Pode correr 10m antes de atacar para somar Destreza ao dano também.

### Foice Longa (Ceifadora)
* **Tipo:** Cortante
* **Atributo:** Força
* **Dado:** `d12`
* **Requisito:** Força 10+ ou Classe de Combate.
* **Alcance:** Curto (Até 3m).
* **Colheita Mortal (Passiva):** Seus ataques visam a alma.
    * **Golpe do Ceifador**
        * *Acerto:* `DR + For`
        * *Dano:* `ER x d12 + For`
        * *Crítico:* Aplica **Apavorado** por `1d3` turnos e **Sangramento**.
* **Ceifada Ampla (Requer Força 8+)**
    * *Custo:* 1 uso (Limite diário = ER). Ação Padrão.
    * *Área:* Cone de 3m à frente.
    * *Teste:* Inimigos fazem Teste de Defesa de Destreza vs CD `(10 + For + ER)`.
    * *Dano:* `ER x d10 + For` (Falha) ou Metade (Sucesso).
    * *Efeito:* Se o dano superar a defesa/vida restante por uma margem grande (Crítico implícito), o alvo fica **Caído**.
* **Marca da Morte (Requer Sabedoria 2+)**
    * *Custo:* 2 Magículas.
    * *Efeito:* Ao acertar uma *Ceifada Ampla*, você pode focar em um alvo específico da área e aplicar um *Golpe do Ceifador* nele instantaneamente como parte da mesma ação.

### Glaive
* **Tipo:** Cortante
* **Atributo:** Força
* **Dado:** `d7` (Lâmina de Haste)
* **Requisito:** Classe de Combate.
* **Alcance:** Curto (Até 3m) em vez de Corpo a Corpo.
* **Corte de Glaive**
    * *Acerto:* `DR + For`
    * *Dano:* `ER x d7 + For`
    * *Crítico:* Aplica **Sangramento** e permite atingir um segundo inimigo adjacente (dentro de 3m).
* **Corte Meia-Lua**
    * *Ação:* Ataque.
    * *Área:* Cone de 1,5m.
    * *Efeito:* Realiza um teste de ataque único contra todos na área. Se acertar, causa o dano base (`ER x d7`) sem somar o atributo de Força.
* **Recuperar Postura (Reação)**
    * *Gatilho:* Quando um inimigo erra um ataque corpo a corpo contra você.
    * *Efeito:* Realiza imediatamente um ataque de Glaive contra ele. Causa dano normal e aplica **Sangramento**.

---

## 🏹 Categoria: Armas à Distância
*A morte que vem de longe. Requerem munição.*
* **Dado Padrão:** Variável
* **Requisito:** Duas mãos (exceto Besta de Mão e Funda).

### Arco Curto
* **Tipo:** Perfurante
* **Atributo:** Destreza
* **Dado:** `d6`
* **Alcance:** Médio
* **Tiro Rápido**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd6 + Des`
    * *Crítico:* Multiplica o dano total por **3x**.
* **Mira:** Gastar Ação de Movimento para mirar concede **+1DR** no acerto.
* **Escaramuça:** Após atirar, pode se mover metade do deslocamento como Ação Bônus sem levar ataque de oportunidade.

### Arco Longo
* **Tipo:** Perfurante
* **Atributo:** Destreza
* **Dado:** `d8`
* **Alcance:** Longo
* **Disparo Preciso**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd8 + Des`
    * *Crítico:* Aplica **Sangramento**.
* **Leitura de Vento:** Como Ação Bônus, aumenta a Margem de Ameaça (Crítico) em 1 para o próximo ataque.

### Besta Pesada
* **Tipo:** Perfurante
* **Atributo:** Destreza
* **Dado:** `d14`
* **Requisito:** Habilidade Opífice ou Treino Militar.
* **Impacto de Disparo**
    * *Acerto:* `DR + Des`
    * *Dano:* `ERd14 + Des`
    * *Crítico:* Reduz a Resistência a Dano do alvo em 2 estágios (Ex: Resistência III vira I).
    * *Recarga:* Requer uma Ação Padrão para recarregar após cada tiro.
* **Mira Estática:** Pode mirar (Ação Bônus) mesmo durante o turno de recarga, concedendo **+1DR** no próximo disparo.