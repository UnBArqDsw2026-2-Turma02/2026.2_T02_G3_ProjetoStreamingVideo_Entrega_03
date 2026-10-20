# Documentação das Reuniões — SubEquipe 02


- [Ata 01 — Modelagem UML do Adapter](#ata-de-reunião-01)
- [Ata 02 — Modelagem UML do Facade](#ata-de-reunião-02)
- [Ata 03 — Código e execução do Adapter](#ata-de-reunião-03)
- [Ata 04 — Código e execução do Facade](#ata-de-reunião-04)

---

## Ata de Reunião 01

**Data:**  16/10/2026
**Reunião nº:** 01  
**Assunto:** Construção coletiva e explicação do diagrama UML do padrão Adapter.

### 1. Gravação

**Registro da reunião:** [Acessar](https://www.youtube.com/watch?v=BQ8IfCvFp7w&feature=youtu.be)

### 2. Participantes

| **Membro** | **Presença** |
| --- | --- |
| [Enzo Menali](https://github.com/menali17) | ✅ |
| [Geovanna Umbelino](https://github.com/GeovannaUmbelino) | ✅ |
| [Lucas Oliveira](https://github.com/dev-LucasDpaula) | ✅ |
| [Paulo Vitor Gomes](https://github.com/gpaulovit) | ✅ |

### 3. Pauta da Reunião

- Discutir o problema de integração da biblioteca `hls.js` à lógica de reprodução.
- Construir e explicar coletivamente o diagrama de classes do Adapter.
- Identificar os participantes e suas responsabilidades.

### 4. Tópicos Discutidos

#### 4.1. Contexto da Reprodução de Vídeos

Foi discutida a necessidade de utilizar a biblioteca `hls.js` sem expor seus detalhes diretamente aos demais componentes da aplicação.

#### 4.2. Construção do Diagrama UML

A equipe trabalhou na representação da interface `IPlayer` e da classe `HlsJsPlayerAdapter`, explicando a relação entre o contrato interno e a adaptação da biblioteca externa.

#### 4.3. Responsabilidades do Padrão

Foram discutidos o papel do cliente, da interface esperada e do adaptador, relacionando o modelo à organização do frontend.

### 5. Decisões

- Utilizar o padrão Adapter para isolar a integração com `hls.js`.
- Representar `IPlayer` e `HlsJsPlayerAdapter` no diagrama de classes.

### 6. Observações

O vídeo registra a discussão e a elaboração coletiva da modelagem. 

---

## Ata de Reunião 02

**Data:** 16/10/2026 
**Reunião nº:** 02  
**Assunto:** Construção coletiva e explicação do diagrama UML do padrão Facade.

### 1. Gravação

**Registro da reunião:** [Acessar](https://www.youtube.com/watch?v=RjhG-PO6mQA)

### 2. Participantes

| **Membro** | **Presença** |
| --- | --- |
| [Enzo Menali](https://github.com/menali17) | ✅ |
| [Geovanna Umbelino](https://github.com/GeovannaUmbelino) | ✅ |
| [Lucas Oliveira](https://github.com/dev-LucasDpaula) | ✅ |
| [Paulo Vitor Gomes](https://github.com/gpaulovit) | ✅ |

### 3. Pauta da Reunião

- Analisar a complexidade das operações de reprodução no frontend.
- Construir e explicar coletivamente o diagrama UML do Facade.
- Discutir a relação entre o componente cliente, a fachada e os serviços.

### 4. Tópicos Discutidos

#### 4.1. Motivação para o Facade

A equipe discutiu como evitar que a interface visual precise coordenar diretamente os detalhes das funcionalidades de reprodução.

#### 4.2. Construção do Diagrama UML

Foi trabalhada a representação de `ReproducaoFacade` e sua relação com `ServicoDeVideos` e `ReproducaoEInteracoes`, destacando as responsabilidades de cada elemento.

#### 4.3. Organização das Dependências

Os integrantes explicaram como a fachada pode oferecer um acesso mais simples às operações internas, contribuindo para a separação de responsabilidades.

### 5. Decisões

- Aplicar o padrão Facade à organização das operações de reprodução.
- Destacar `ReproducaoFacade` e os elementos relacionados na modelagem UML.

### 6. Observações

O vídeo registra a discussão e a elaboração coletiva da modelagem. 

---

## Ata de Reunião 03

**Data:** 19/10/2026 
**Reunião nº:** 03  
**Assunto:** Explicação do código e demonstração dos padrões GoF Estruturais Adapter e Facade.

### 1. Gravação

**Registro da reunião:** [Acessar](https://www.youtube.com/watch?v=PfnSCj9nGYI)

### 2. Participantes

| **Membro** | **Presença** |
| --- | --- |
| [Enzo Menali](https://github.com/menali17) | ✅ |
| [Geovanna Umbelino](https://github.com/GeovannaUmbelino) | ✅ |
| [Lucas Oliveira](https://github.com/dev-LucasDpaula) | ✅ |
| [Paulo Vitor Gomes](https://github.com/gpaulovit) | ✅ |


### 3. Pauta da Reunião

- Apresentação da organização do código no frontend.
- Explicação da interface `IPlayer` e do padrão Adapter.
- Análise da implementação de `HlsJsPlayerAdapter` e da integração com a biblioteca `hls.js`.
- Explicação do padrão Facade, incluindo `ReproducaoFacade` e `ServicoDeVideos`.
- Apresentação do componente `ReproducaoEInteracoes`.
- Demonstração do funcionamento dos padrões na aplicação.

### 4. Tópicos Discutidos

#### 4.1. Estrutura do código e interface IPlayer

Apresentação da organização do frontend e das responsabilidades dos padrões Adapter e Facade. Explicação da interface `IPlayer`, que estabelece um contrato para as operações de reprodução.

**Responsável pela apresentação:** Geovanna Umbelino.

#### 4.2. Implementação do Adapter

Explicação da classe `HlsJsPlayerAdapter`, responsável por implementar o contrato definido pela interface `IPlayer` e adaptar a comunicação com a biblioteca externa `hls.js`.

Foram abordados os objetivos do padrão, sua aplicação na reprodução de vídeos e a importância da redução do acoplamento entre a aplicação e a biblioteca.



#### 4.3. Implementação do Facade

Explicação da classe `ReproducaoFacade`, responsável por simplificar o acesso às operações de reprodução.

Apresentação das responsabilidades do `ServicoDeVideos` e da organização das chamadas entre os componentes e os serviços da aplicação.


#### 4.4. Componente React e relação entre os padrões

Apresentação do componente `ReproducaoEInteracoes` e de sua relação com a lógica de reprodução.

Explicação das diferenças entre os padrões:

- **Adapter:** adapta a interface utilizada pela aplicação à biblioteca externa de reprodução.
- **Facade:** simplifica o acesso às funcionalidades e organiza as operações relacionadas à reprodução.



#### 4.5. Demonstração da aplicação

Demonstração do frontend, identificando no código onde os padrões Adapter e Facade estão implementados e como participam do funcionamento da aplicação.

A demonstração deverá relacionar os diagramas UML, as classes implementadas e o comportamento observado durante a execução.

### 5. Decisões

- Realizar uma única gravação para apresentar e explicar as implementações dos padrões GoF Estruturais Adapter e Facade.
- Dividir a explicação técnica entre os três integrantes que ainda não haviam apresentado o código à professora, considerando que a quarta integrante já havia realizado parte da explicação presencialmente.
- Garantir a participação e o reconhecimento das contribuições dos quatro integrantes, considerando também os commits realizados no repositório como evidências do trabalho desenvolvido.
- Apresentar as principais classes, interfaces e métodos utilizados na implementação, explicando suas responsabilidades e a aplicação de cada padrão.
- Demonstrar o funcionamento da aplicação, identificando onde o Adapter e o Facade estão implementados e como se relacionam durante a execução.
- Utilizar a gravação, juntamente com os registros de commits, como comprovação das atividades realizadas pela subequipe na implementação dos padrões GoF Estruturais.

### 6. Observações

A gravação será destinada à apresentação conjunta dos códigos dos padrões Adapter e Facade, complementando as reuniões anteriores de modelagem UML.

A execução conjunta dos padrões deverá ser confirmada durante a demonstração, verificando as chamadas realizadas entre os componentes e as classes implementadas.

**Código-fonte:** [Link Facade](https://github.com/UnBArqDsw2026-2-Turma02/2026.2_T02_G3_ProjetoStreamingVideo_Entrega_03/tree/feat/configura%C3%A7%C3%A3o-inicial-para-desenvolvimento/frontend/src/lib/reproducao).

**Código-fonte:** [Link Adapter](https://github.com/UnBArqDsw2026-2-Turma02/2026.2_T02_G3_ProjetoStreamingVideo_Entrega_03/tree/feat/configura%C3%A7%C3%A3o-inicial-para-desenvolvimento/frontend/src/lib/player).

