# Diagrama de Classes Geral do Projeto

## Participantes

O presente artefato foi concebido de forma unificada e colaborativa por **todos os integrantes do Grupo G3**:

| Subgrupo | Foco Temático | Membros Participantes |
| :---: | :--- | :--- |
| **Subgrupo 1** | Transmissão ao Vivo (*Live Streaming*) | [Breno Teixeira](https://github.com/BrenoLteixeira), [Gabriel Diniz](https://github.com/GabrielDiniz12) e [Pedro Americo](https://github.com/dev-americo) |
| **Subgrupo 2** | Domínio Geral e Interações | [Enzo Menali](https://github.com/menali17), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Lucas Oliveira](https://github.com/dev-LucasDpaula) e [Paulo Vitor Gomes](https://github.com/gpaulovit) |
| **Subgrupo 3** | Vídeo sob Demanda (*VOD*) | [Giovana Barbosa](https://github.com/gio221), [José Augusto](https://github.com/JaugustoM) e [Pedro Lucas](https://github.com/pwdrinho) |

---

## Introdução

Este artefato permite visualizar a arquitetura lógica do sistema através da definição de classes, atributos, métodos, visibilidades, multiplicidades e relacionamentos conceituais como associação, agregação, composição, dependência e generalização.

Na terceira entrega do projeto **StreamingVideo**, os três subgrupos integraram suas modelagens especializadas em um **Diagrama de Classes Unificado do Projeto**. Este modelo congrega tanto o núcleo de entidades fundamentais da plataforma (gestão de usuários, canais, inscrições, interações sociais e moderação), quanto as frentes específicas de processamento de mídia: o pipeline de **Transmissão ao Vivo (*Live Streaming*)** e o fluxo de **Vídeo sob Demanda (*VOD*)**.

## Metodologia e Rastreabilidade entre os Subgrupos

A consolidação deste diagrama seguiu uma abordagem **incremental e colaborativa**. Cada frente arquitetural foi modelada e fundamentada em literatura pelos seus respectivos subgrupos ao longo do ciclo de vida do projeto, convergindo para a representação integrada apresentada nesta entrega:

### Subgrupo 1 — Transmissão ao Vivo (*Live Streaming*)
- **Escopo no Diagrama:** Modela a classe especializada `TransmissaoAoVivo`, conectando-se à cadeia comportamental *Chain of Responsibility* através da classe abstrata `ManipuladorDeFluxo`, com sua auto-associação reflexiva de elo sucessor (`0..1`), o objeto de transferência de estado `ContextoFluxo`, a enumeração de ciclo de vida `StatusEtapaPipeline` e os três manipuladores concretos (`GerenciadorDeAutenticacaoDeIngestao`, `GerenciadorDeTranscodificacao` e `GerenciadorDeDistribuicaoHls`).
- **Documentação Detalhada:** A explicação conceitual, o comportamento *fail-fast* e a rastreabilidade com o código-fonte em TypeScript/NestJS encontram-se detalhados no próprio repositório da Entrega 3 em [**Modelagem Estática da SubEquipe 01**](Base/Relatórios/SubEquipe_01/2.GOF_Estatico.md) e no [**Resumo Arquitetural**](Base/Relatórios/SubEquipe_01/1.GOF_Resumo.md).

### Subgrupo 2 — Domínio Central, Interações e Reprodução
* **Escopo no Diagrama:** Estruturou as entidades centrais que dão suporte à experiência da plataforma, incluindo `Usuario`, `Perfil`, enumeração `TipoPapel`, `Canal`, a abstração `Conteudo`, `Inscricao`, bem como as interações sociais e controle de comunidade via `Comentario`, `Reacao` (`TipoReacao`) e `Moderacao`.
* **Documentação Detalhada:** As decisões de modelagem, dicionário de dados e fundamentação teórica dessa estrutura de domínio estão documentadas no relatório da entrega anterior em [**Modelagem Estática da SubEquipe 02 (Entrega 2)**](https://unbarqdsw2026-2-turma02.github.io/2026.2_T02_G3_ProjetoStreamingVideo_Entrega_02/#/Base/Relat%C3%B3rios/SubEquipe_02/1.ModelagemEstatica).

### Subgrupo 3 — Vídeo sob Demanda (*VOD*) e Transcodificação
* **Escopo no Diagrama:** Modela a especialização `Video`, a entidade `JobTranscodificacao` responsável pelo fatiamento e conversão de formatos de mídia gravada, o armazenamento e disponibilização de fluxos de reprodução através da classe `Midia`, além do `HistoricoDeVisualizacao`.
* **Documentação Detalhada:** O fluxo de transcodificação de VOD, especificações de visibilidade e engenharia reversa do PeerTube encontram-se registrados em [**Modelagem Estática da SubEquipe 03 (Entrega 2)**](https://unbarqdsw2026-2-turma02.github.io/2026.2_T02_G3_ProjetoStreamingVideo_Entrega_02/#/Base/Relat%C3%B3rios/SubEquipe_03/1.ModelagemEstatica).

---

## Modelo Estático Unificado

<font size="3"><p style="text-align: center"><b>Figura 1:</b> Diagrama de Classes Geral da Plataforma StreamingVideo.</p></font>

<figure class="embed-figure" align="center">
  <div class="svg-embed-container"
       data-svg-path="assets/Diagrama de classes entrega 3.drawio.svg"
       data-color-scheme="light"
       data-title="Diagrama de Classes Geral - Entrega 3"
       style="width: 100%;">
  </div>
</figure>

<font size="3"><p style="text-align: center"><b>Fonte:</b> Autoria e elaboração colaborativa de <b>todos os membros da equipe G3</b>: [Breno Teixeira](https://github.com/BrenoLteixeira), [Enzo Menali](https://github.com/menali17), [Gabriel Diniz](https://github.com/GabrielDiniz12), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Giovana Barbosa](https://github.com/gio221), [José Augusto](https://github.com/JaugustoM), [Lucas Oliveira](https://github.com/dev-LucasDpaula), [Paulo Vitor Gomes](https://github.com/gpaulovit), [Pedro Americo](https://github.com/dev-americo) e [Pedro Lucas](https://github.com/pwdrinho).</p></font>

---

## 4. Referências Bibliográficas

<p id="ref1"><strong>[1]</strong> SERRANO, Milene. <em>Arquitetura e Desenho de Software - Aula Modelagem UML Estática</em> (Material de Aula). Disciplina Arquitetura e Desenho de Software. FCTE, Universidade de Brasília (UnB). Disponível em: Aprender3 UnB.</p>

<p id="ref2"><strong>[2]</strong> OMG (OBJECT MANAGEMENT GROUP). <em>Unified Modeling Language (OMG UML) Specification, Version 2.5.1</em> (Document formal/2017-12-05). Seções 9 e 11: Classes, Operações, Associações e Multiplicidades. Disponível em: <a href="https://www.omg.org/spec/UML/2.5.1/PDF">https://www.omg.org/spec/UML/2.5.1/PDF</a>.</p>

<p id="ref3"><strong>[3]</strong> SUBEQUIPE 01 (GRUPO G3). <em>Modelagem Estática - SubEquipe 01 (GoF Comportamental)</em>. Entrega 03, 2026. Disponível no repositório oficial da Entrega 3.</p>

<p id="ref4"><strong>[4]</strong> SUBEQUIPE 02 (GRUPO G3). <em>Modelagem Estática - SubEquipe 02 (Diagrama de Classes)</em>. Entrega 02, 2026. Disponível em: <a href="https://unbarqdsw2026-2-turma02.github.io/2026.2_T02_G3_ProjetoStreamingVideo_Entrega_02/#/Base/Relat%C3%B3rios/SubEquipe_02/1.ModelagemEstatica">https://unbarqdsw2026-2-turma02.github.io/2026.2_T02_G3_ProjetoStreamingVideo_Entrega_02/#/Base/Relat%C3%B3rios/SubEquipe_02/1.ModelagemEstatica</a>.</p>

<p id="ref5"><strong>[5]</strong> SUBEQUIPE 03 (GRUPO G3). <em>Modelagem Estática - SubEquipe 03 (VOD)</em>. Entrega 02, 2026. Disponível em: <a href="https://unbarqdsw2026-2-turma02.github.io/2026.2_T02_G3_ProjetoStreamingVideo_Entrega_02/#/Base/Relat%C3%B3rios/SubEquipe_03/1.ModelagemEstatica">https://unbarqdsw2026-2-turma02.github.io/2026.2_T02_G3_ProjetoStreamingVideo_Entrega_02/#/Base/Relat%C3%B3rios/SubEquipe_03/1.ModelagemEstatica</a>.</p>

---

## 5. Histórico de Versões

| Versão | Data | Descrição | Autor(es) | Revisor(es) |
| :---: | :---: | :--- | :--- | :--- |
| **1.0** | 19/10/2026 | Criação do artefato de consolidação do Diagrama de Classes Geral da Entrega 3 | [Pedro Americo](https://github.com/dev-americo) | [Giovana Barbosa](https://github.com/gio221) |
