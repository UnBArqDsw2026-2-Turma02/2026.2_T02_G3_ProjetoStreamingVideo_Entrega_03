# Adapter 

## 1. Introdução

O **Adapter** (Adaptador) é um padrão de projeto estrutural do catálogo *Gang of Four* (GoF) que permite a comunicação entre componentes cujas interfaces não são diretamente compatíveis. O padrão introduz um objeto intermediário responsável por apresentar ao cliente as operações que ele espera, enquanto utiliza internamente os recursos oferecidos por uma implementação existente.

Na plataforma de streaming de vídeo, a reprodução de conteúdos HLS utiliza a biblioteca `hls.js`, que disponibiliza métodos próprios para carregar um manifesto, associar o fluxo ao elemento de vídeo e gerenciar eventos. Para que essas operações não sejam acessadas diretamente pela camada responsável pela sessão de reprodução, foi definida a interface `IPlayer` e implementada a classe `HlsJsPlayerAdapter`.

A solução permite que `ReproducaoFacade` utilize um contrato de reprodução próprio da aplicação, enquanto o adaptador concentra a comunicação com `hls.js` e com o elemento `HTMLVideoElement` do navegador. Dessa forma, a dependência de uma biblioteca específica fica restrita à implementação do adaptador.

## 2. Motivação

A biblioteca `hls.js` utiliza operações como `loadSource()`, `attachMedia()` e `destroy()`, enquanto o módulo de reprodução da plataforma trabalha com ações como carregar, reproduzir, pausar, observar eventos e descartar o reprodutor. Embora essas operações atendam a objetivos relacionados, suas interfaces e responsabilidades não são idênticas.

Sem o Adapter, a classe que coordena a sessão precisaria conhecer os métodos da biblioteca, controlar diretamente seus eventos e combinar essas chamadas com a API de vídeo do navegador. Isso ampliaria o acoplamento entre a lógica da sessão e o mecanismo de reprodução HLS.

A Equipe 2 adotou o padrão para estabelecer uma separação entre **o contrato utilizado pela aplicação** e **a implementação concreta do player**. Assim, `ReproducaoFacade` trabalha com `IPlayer`, e `HlsJsPlayerAdapter` fica responsável por traduzir as operações desse contrato. A implementação analisada contempla um adaptador para `hls.js`; a inclusão de outros mecanismos de reprodução permanece uma possibilidade de evolução, e não uma funcionalidade já existente.

## 3. Metodologia

A aplicação do padrão foi desenvolvida coletivamente pelos integrantes da **Equipe 2**, considerando o diagrama de classes e as necessidades do módulo de reprodução da plataforma. Foram identificadas as operações que a aplicação precisava oferecer, a interface disponibilizada pela biblioteca externa e as responsabilidades de cada participante do Adapter.

A modelagem definiu o contrato `IPlayer`, o adaptador `HlsJsPlayerAdapter`, a biblioteca `Hls` e a classe cliente `ReproducaoFacade`. A implementação correspondente foi realizada no front-end em TypeScript, utilizando a biblioteca `hls.js` e os recursos de mídia do navegador. A relação entre esses elementos é apresentada nas seções de rastreabilidade, modelagem e código-fonte.

## 4. Rastreabilidade (diagrama de classes)

O Adapter está representado no diagrama de classes apresentado na Seção 5 (Figura 1), derivado do diagrama de classes de domínio da plataforma, especialmente na relação entre a fachada responsável pela sessão, a interface de reprodução e a biblioteca externa.

| Artefato UML | Padrão | Função no projeto / rastreabilidade |
| --- | --- | --- |
| Figura 1 deste relatório (diagrama de classes do Adapter), derivada do diagrama de classes de domínio da plataforma | Adapter | `ReproducaoFacade` atua como cliente da interface `IPlayer`. `HlsJsPlayerAdapter` implementa esse contrato e adapta as operações para a classe `Hls`, da biblioteca `hls.js`, utilizando também o elemento de vídeo do navegador. |

**Tabela 1 —** Rastreabilidade do padrão Adapter na plataforma de streaming.  
**Fonte:** [Enzo Menali](https://github.com/menali17), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Lucas Oliveira](https://github.com/dev-LucasDpaula) e [Paulo Vitor Gomes](https://github.com/gpaulovit).

| Participante GoF | Elemento da plataforma | Localização |
| --- | --- | --- |
| Client | `ReproducaoFacade` | `frontend/src/lib/reproducao/ReproducaoFacade.ts` |
| Target | `IPlayer` | `frontend/src/lib/player/IPlayer.ts` |
| Adapter | `HlsJsPlayerAdapter` | `frontend/src/lib/player/HlsJsPlayerAdapter.ts` |
| Adaptee | `Hls` | Biblioteca externa `hls.js` |
| Recurso de mídia | `HTMLVideoElement` | API nativa do navegador |

**Tabela 2 —** Correspondência entre os participantes do padrão e os elementos da implementação.  
**Fonte:** [Enzo Menali](https://github.com/menali17), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Lucas Oliveira](https://github.com/dev-LucasDpaula) e [Paulo Vitor Gomes](https://github.com/gpaulovit).

## 5. Modelagem (UML)

A modelagem do Adapter representa a comunicação entre `ReproducaoFacade`, `IPlayer`, `HlsJsPlayerAdapter` e `Hls`. A fachada depende da interface de reprodução, enquanto o adaptador implementa esse contrato e utiliza os recursos específicos da biblioteca HLS.

**Figura 1 —** Diagrama de classes do padrão Adapter aplicado à plataforma de streaming. 
![Diagrama de Adapter](../../../assets/Diagrama_adapter.drawio%20(2).png)

**Fonte:** [Enzo Menali](https://github.com/menali17), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Lucas Oliveira](https://github.com/dev-LucasDpaula) e [Paulo Vitor Gomes](https://github.com/gpaulovit)

A interface `IPlayer` estabelece as operações `carregar()`, `reproduzir()`, `pausar()`, `observar()` e `descartar()`. A classe `HlsJsPlayerAdapter` realiza essa interface, mantendo referências à instância `Hls` e ao elemento `HTMLVideoElement` necessário à reprodução.

Vale notar que `reproduzir()` e `pausar()` são delegados ao `HTMLVideoElement`, e não ao `hls.js`. Assim, o adaptador traduz o contrato `IPlayer` para dois elementos: a biblioteca `Hls` (carregamento, eventos e descarte) e a API de vídeo do navegador (reprodução e pausa).

A relação de realização entre `HlsJsPlayerAdapter` e `IPlayer` expressa que o adaptador cumpre o contrato definido para o player. A classe `ReproducaoFacade` utiliza esse contrato sem depender diretamente de `Hls`. A instância de `Hls` é criada e destruída pelo adaptador, que também registra e remove os eventos utilizados durante a reprodução.

**Funcionamento representado pela modelagem:**

1. `ReproducaoFacade` recebe um player que atende à interface `IPlayer` por meio de `PlayerProvider`.
2. `HlsJsPlayerAdapter` implementa o contrato de reprodução e mantém a instância de `Hls`.
3. A operação `carregar()` encaminha o manifesto HLS para a biblioteca e associa o fluxo ao elemento de vídeo.
4. As operações `reproduzir()` e `pausar()` utilizam os métodos do elemento HTML de vídeo.
5. A operação `descartar()` libera os recursos associados ao player.

## 6. Código-fonte

A implementação do padrão está localizada em `frontend/src/lib/player/` e utiliza TypeScript. Os elementos centrais são o contrato de reprodução, o adaptador e a classe cliente que consome esse contrato.

### 6.1. Interface-alvo (Target) — `IPlayer.ts`

```typescript
import type { PlaybackListener, Unsubscribe } from './playback.types';

export interface IPlayer {
  carregar(manifestoUrl: string): Promise<void>;
  reproduzir(): Promise<void>;
  pausar(): void;
  observar(listener: PlaybackListener): Unsubscribe;
  descartar(): void;
}
```
A interface define as operações que os demais componentes podem solicitar ao reprodutor. Seus métodos não expõem diretamente a API da biblioteca `hls.js`.

### 6.2. Adaptador (Adapter) — `HlsJsPlayerAdapter.ts`

A classe `HlsJsPlayerAdapter` implementa `IPlayer`, recebe um `HTMLVideoElement` e utiliza uma instância da classe `Hls` para carregar o fluxo. A tradução entre as interfaces pode ser observada nas chamadas a `loadSource()` e `attachMedia()`:

```typescript
this.hls.loadSource(manifestoUrl);
this.hls.attachMedia(this.video);
```
O controle de reprodução é realizado pelo elemento de vídeo do navegador, enquanto o adaptador mantém a interface esperada pelo restante da aplicação:

```typescript
async reproduzir(): Promise<void> {
    this.garantirAtivo();

    try {
      await this.video.play();
      this.notificar({ tipo: 'reproduzindo' });
    } catch (causa) {
      const erro = new PlaybackError(
        'REPRODUCAO_FALHOU',
        'O navegador não permitiu iniciar a reprodução do vídeo.',
        causa,
      );

      this.notificar({ tipo: 'erro', erro });
      throw erro;
    }
  }
```
### 6.3. Cliente (Client) — `ReproducaoFacade.ts`

A fachada utiliza a interface `IPlayer` para controlar a sessão. O player concreto é obtido por uma função `PlayerProvider`, o que evita a criação direta de `Hls` pela classe cliente.

```typescript
export type PlayerProvider = (video: HTMLVideoElement) => IPlayer;

private player?: IPlayer;
```
O contrato permite que a fachada invoque as operações de reprodução sem reproduzir a lógica específica da biblioteca HLS.


## Evidências da Implementação e Demonstração

### Apresentação do Código e Demonstração

A implementação do padrão **Adapter** foi apresentada em uma gravação realizada pelos integrantes da SubEquipe 02, na qual foram explicadas a interface `IPlayer`, a classe `HlsJsPlayerAdapter` e sua relação com a biblioteca `hls.js`.

Durante a apresentação, foram abordadas as responsabilidades do padrão, a organização do código e sua aplicação na reprodução de vídeos da plataforma.

**Vídeo da apresentação:** [Assistir à explicação e demonstração](https://www.youtube.com/watch?v=PfnSCj9nGYI)

### Registro da Implementação

O desenvolvimento e a documentação do padrão também podem ser acompanhados pelos registros de versionamento do projeto, que incluem as contribuições realizadas pela subequipe.

**Commit:** [Visualizar registro no GitHub](https://github.com/UnBArqDsw2026-2-Turma02/2026.2_T02_G3_ProjetoStreamingVideo_Entrega_03/commits/feat/configura%C3%A7%C3%A3o-inicial-para-desenvolvimento/)


## 7. Análise crítica

A aplicação do Adapter apresenta como principal benefício a **redução do acoplamento** entre o gerenciamento da sessão e a biblioteca `hls.js`. O contrato `IPlayer` concentra as operações que interessam ao cliente, enquanto `HlsJsPlayerAdapter` mantém a responsabilidade de traduzir chamadas, lidar com eventos e liberar os recursos do player.

Outro benefício é a possibilidade de testar o comportamento do adaptador com simulações da biblioteca externa. O projeto contém o arquivo `HlsJsPlayerAdapter.test.ts`, que permite verificar a interação com os métodos de reprodução sem depender necessariamente de um fluxo HLS real em cada teste. Os métodos `observar()` e `notificar()` implementam um mecanismo de assinatura de eventos semelhante ao padrão comportamental Observer, que complementa o Adapter, mas não faz parte do padrão estrutural documentado aqui.

A solução também apresenta limites. O adaptador atual depende de suporte ao mecanismo `hls.js` no navegador e não representa, por si só, suporte a outros formatos ou bibliotecas. Além disso, a introdução da interface e do adaptador acrescenta uma camada à arquitetura, cuja utilidade depende da manutenção de responsabilidades bem delimitadas.

Na comparação entre modelagem e implementação, os elementos centrais do padrão estão presentes. Os mecanismos internos de observação, tratamento de erros, carregamento e descarte são mais detalhados no código do que na representação conceitual do diagrama, sem alterar os papéis principais de Client, Target, Adapter e Adaptee.

## 8. Conclusão

O padrão Adapter foi empregado na plataforma de streaming para compatibilizar o contrato de reprodução definido pela aplicação com as operações disponibilizadas pela biblioteca `hls.js`. A interface `IPlayer` estabelece as ações utilizadas pelo módulo de reprodução, enquanto `HlsJsPlayerAdapter` concentra sua tradução para o mecanismo HLS e para a API de vídeo do navegador.

A modelagem elaborada coletivamente pela Equipe 2 e sua correspondência com o código TypeScript demonstram uma separação clara entre a classe cliente e os detalhes da biblioteca externa. Essa organização contribui para a manutenção do módulo de reprodução e estabelece uma base para sua evolução, preservando o escopo da implementação atualmente disponível no front-end.

## 9. Referências

1. GAMMA, Erich; HELM, Richard; JOHNSON, Ralph; VLISSIDES, John. *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley, 1995.
2. SERRANO, Milene. *Arquitetura e Desenho de Software — Aula GoFs Estruturais*. Material didático, Universidade de Brasília.
3. REFACTORING.GURU. **Adapter**. Disponível em: <https://refactoring.guru/pt-br/design-patterns/adapter>.
4. HLS.JS. *hls.js*. Disponível em: <https://github.com/video-dev/hls.js>.

## 10. Histórico de versões

| Versão | Data | Descrição | Autor | Revisor |
| --- | --- | --- | --- | --- |
| 1.0 | 17/10/2026 | Modelagem do padrão e documentação de sua aplicação à plataforma de streaming | [Enzo Menali](https://github.com/menali17), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Lucas Oliveira](https://github.com/dev-LucasDpaula) e [Paulo Vitor Gomes](https://github.com/gpaulovit) | [Pedro Americo](https://github.com/dev-americo) |