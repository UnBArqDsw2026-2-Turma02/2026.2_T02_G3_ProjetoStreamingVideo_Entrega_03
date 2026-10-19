# Facade 

## 1. Introdução

O **Facade** (Fachada) é um padrão de projeto estrutural do catálogo *Gang of Four* (GoF) que fornece uma interface simplificada para um conjunto de classes ou operações de um subsistema. Seu objetivo é facilitar o uso de funcionalidades que exigem a colaboração de diferentes componentes, sem obrigar o cliente a conhecer todos os detalhes dessa interação.

Na plataforma de streaming de vídeo, o processo de reprodução envolve a consulta aos dados de um vídeo, a obtenção de um reprodutor, o carregamento do manifesto HLS e o gerenciamento do ciclo de vida da sessão. Essas responsabilidades são coordenadas pela classe `ReproducaoFacade`, que oferece à camada de apresentação operações de alto nível, como preparar, reproduzir, pausar, observar eventos e encerrar a reprodução.

A fachada é utilizada pelo componente React `ReproducaoEInteracoes`, que pode solicitar as ações de reprodução sem realizar diretamente a consulta ao catálogo ou o gerenciamento interno do player. Dessa maneira, o padrão organiza a comunicação entre a interface da aplicação e os serviços responsáveis pela reprodução.

## 2. Motivação

O módulo de reprodução da plataforma reúne responsabilidades que precisam ocorrer de forma coordenada. Antes de reproduzir um vídeo, é necessário localizar seus dados, obter a URL do manifesto, criar um player associado ao elemento HTML e aguardar o carregamento. Durante a sessão, também é necessário encaminhar eventos e liberar recursos ao encerrar a reprodução.

Se todas essas operações fossem executadas diretamente no componente React, a camada de apresentação precisaria conhecer os detalhes do serviço de vídeos, da interface do player e da ordem correta das chamadas. Isso aumentaria o acoplamento e concentraria no componente visual responsabilidades que pertencem ao controle da sessão.

Para evitar essa situação, a Equipe 2 aplicou o padrão Facade por meio da classe `ReproducaoFacade`. A fachada coordena `ServicoDeVideos` e `IPlayer`, enquanto `ReproducaoEInteracoes` utiliza operações voltadas às necessidades da interface. O serviço de vídeos implementado atualmente consulta um catálogo em memória, sem comunicação HTTP com o back-end.

## 3. Metodologia

A modelagem do padrão Facade foi realizada de forma colaborativa por todos os integrantes da **Equipe 2**, a partir das responsabilidades identificadas para a reprodução de vídeos na plataforma. Foram considerados o componente responsável pela interação com o usuário, o serviço de consulta aos vídeos e o contrato de reprodução utilizado pelo player.

Com base nessa divisão, foi definida a classe `ReproducaoFacade` como ponto de coordenação entre os elementos do subsistema. A implementação foi desenvolvida no front-end em TypeScript e integrada ao componente React. A documentação relaciona a estrutura representada no diagrama de classes às interfaces e classes efetivamente presentes no projeto.

## 4. Rastreabilidade (diagrama de classes)

O Facade está representado no diagrama de classes apresentado na Seção 5 (Figura 1), derivado do diagrama de classes de domínio da plataforma, no qual o componente de interface acessa a fachada para utilizar os serviços necessários à sessão.

**Tabela 1 —** Rastreabilidade do padrão Facade na plataforma de streaming.  

| Artefato UML | Padrão | Função no projeto / rastreabilidade |
| --- | --- | --- |
| Figura 1 deste relatório (diagrama de classes do Facade), derivada do diagrama de classes de domínio da plataforma | Facade | `ReproducaoEInteracoes` utiliza `ReproducaoFacade` como ponto de acesso às operações de reprodução. A fachada coordena `ServicoDeVideos` e um player definido pela interface `IPlayer`, reduzindo a necessidade de interação direta do componente React com esses elementos. |

**Fonte:** [Enzo Menali](https://github.com/menali17), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Lucas Oliveira](https://github.com/dev-LucasDpaula) e [Paulo Vitor Gomes](https://github.com/gpaulovit).

**Tabela 2 —** Elementos da implementação associados ao padrão Facade.

| Papel no padrão | Elemento da plataforma | Localização |
| --- | --- | --- |
| Cliente | `ReproducaoEInteracoes` | `frontend/src/components/reproducao/ReproducaoEInteracoes.tsx` |
| Fachada | `ReproducaoFacade` | `frontend/src/lib/reproducao/ReproducaoFacade.ts` |
| Subsistema de consulta | `ServicoDeVideos` | `frontend/src/lib/reproducao/ServicoDeVideos.ts` |
| Contrato de reprodução | `IPlayer` | `frontend/src/lib/player/IPlayer.ts` |
| Dados do vídeo | `Video` | `frontend/src/lib/reproducao/Video.ts` |
  

**Fonte:** [Enzo Menali](https://github.com/menali17), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Lucas Oliveira](https://github.com/dev-LucasDpaula) e [Paulo Vitor Gomes](https://github.com/gpaulovit).

## 5. Modelagem (UML)

O diagrama de classes apresenta `ReproducaoEInteracoes` como cliente, `ReproducaoFacade` como fachada e `ServicoDeVideos` e `IPlayer` como os principais elementos utilizados para preparar e controlar a reprodução. O tipo `Video` representa os dados necessários para localizar o manifesto do conteúdo.

O `Video` representado aqui é uma projeção da entidade `Video` do diagrama de classes de domínio (subclasse de `Conteudo`): contém apenas `id` e `manifestoUrl`, que são os dados necessários à reprodução. Atributos como `duracaoSegundos` e `thumbnailUrl` não fazem parte desta projeção.

**Figura 1 —** Diagrama de classes do padrão Facade aplicado à plataforma de streaming.  
![Diagrama de Facade](../../../assets/Diagrama_Facade%20.drawio%20(1).png)

**Fonte:** [Enzo Menali](https://github.com/menali17), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Lucas Oliveira](https://github.com/dev-LucasDpaula) e [Paulo Vitor Gomes](https://github.com/gpaulovit)

A classe `ReproducaoFacade` disponibiliza as operações `prepararVideo()`, `reproduzir()`, `pausar()`, `observar()` e `encerrar()`. Para preparar um vídeo, consulta `ServicoDeVideos.buscarPorId()`, obtém um player a partir de `PlayerProvider`, registra os eventos da reprodução e solicita o carregamento do manifesto por meio da interface `IPlayer`.

O componente `ReproducaoEInteracoes` atua como cliente dessa interface simplificada. O padrão não elimina as classes do subsistema: ele concentra sua coordenação e permite que cada uma mantenha suas próprias responsabilidades. `ServicoDeVideos` cuida da busca dos dados do vídeo, enquanto o player executa as operações de mídia.

No diagrama, ReproducaoEInteracoes é representado como classe, e prepararReproducao aparece com os parâmetros videoId e video para evidenciar os dados usados na preparação. Na implementação, trata-se de um componente funcional React, e esses dados vêm do estado do componente e da referência ao elemento de vídeo.

**Fluxo de execução representado pela modelagem:**

1. O componente React obtém uma instância de `ReproducaoFacade`.
2. A fachada recebe a solicitação de preparação e consulta `ServicoDeVideos` pelo identificador do vídeo.
3. Após localizar os dados, solicita ao `PlayerProvider` um objeto que implementa `IPlayer`.
4. A fachada observa os eventos do player e solicita o carregamento do manifesto.
5. Quando a sessão está pronta, o cliente pode solicitar reprodução ou pausa.
6. No encerramento, a fachada remove a inscrição de eventos e descarta o player.

## 6. Código-fonte

A implementação do Facade está localizada em `frontend/src/lib/reproducao/`, com utilização pelo componente React da camada de apresentação.

### 6.1. Modelo de vídeo — `Video.ts`

```typescript
export interface Video {
  readonly id: string;
  readonly manifestoUrl: string;
}
```
A interface `Video` contém o identificador do conteúdo e a URL do manifesto utilizado na reprodução.

### 6.2. Serviço de vídeos — `ServicoDeVideos.ts`

```typescript
import { PlaybackError } from '../player/playback.types';
import type { Video } from './Video';

export class ServicoDeVideos {
  constructor(private readonly catalogo: readonly Video[]) {}

  async buscarPorId(videoId: string): Promise<Video> {
    const video = this.catalogo.find((item) => item.id === videoId);

    if (!video) {
      throw new PlaybackError(
        'VIDEO_NAO_ENCONTRADO',
        `O vídeo "${videoId}" não foi encontrado no catálogo.`,
      );
    }

    return { ...video };
  }
}
```
O serviço recebe um catálogo no construtor e realiza a busca por identificador. Na implementação atual, a consulta é feita em memória e gera um erro específico quando o vídeo não é encontrado.

### 6.3. Fachada — `ReproducaoFacade.ts`

A classe `ReproducaoFacade` recebe o serviço de vídeos e uma função responsável por fornecer o player. Essa estrutura permite que a fachada coordene o subsistema sem criar diretamente uma instância da biblioteca `hls.js`.

```typescript
export type PlayerProvider = (video: HTMLVideoElement) => IPlayer;

type EstadoDaSessao = 'nova' | 'preparando' | 'pronta' | 'falhou' | 'encerrada';

export class ReproducaoFacade {
  private player?: IPlayer;
  private readonly ouvintes = new Set<PlaybackListener>();
  private removerInscricao?: Unsubscribe;
  private cancelarPreparacao?: () => void;
  private estado: EstadoDaSessao = 'nova';

  constructor(
    private readonly servicoDeVideos: ServicoDeVideos,
    private readonly playerProvider: PlayerProvider,
  ) {}
```
As operações públicas da fachada oferecem ao cliente o controle da sessão por meio de métodos de alto nível:

```typescript
async reproduzir(): Promise<void> {
    await this.obterPlayerPronto().reproduzir();
  }

  pausar(): void {
    this.obterPlayerPronto().pausar();
  }

  observar(listener: PlaybackListener): Unsubscribe {
    this.garantirAberta();
    this.ouvintes.add(listener);

    return () => {
      this.ouvintes.delete(listener);
    };
  }

  encerrar(): void {
    if (this.encerrada) return;

    // Marcar antes do descarte impede recriação de recursos por continuações assíncronas.
    this.estado = 'encerrada';
    this.cancelarPreparacao?.();
    this.cancelarPreparacao = undefined;

    try {
      this.liberarPlayer();
    } finally {
      this.notificar({ tipo: 'descartado' });
      this.ouvintes.clear();
    }
  }
```
O método `prepararVideo()` realiza a preparação da sessão, enquanto `encerrar()` libera os recursos utilizados. A fachada também mantém um estado interno para impedir operações de reprodução antes da preparação ou depois do encerramento.

### 6.4. Cliente — `ReproducaoEInteracoes.tsx`

O componente React `ReproducaoEInteracoes` utiliza a fachada para preparar e controlar a reprodução. Sua responsabilidade principal é apresentar os controles e os estados ao usuário, delegando a coordenação da sessão à classe `ReproducaoFacade`.

A página `frontend/src/app/demonstracao/page.tsx` configura o serviço de vídeos e o provedor do player utilizados nessa integração.

## 7. Análise crítica

A aplicação do Facade reduz a quantidade de detalhes que o componente React precisa conhecer para controlar a reprodução. A fachada centraliza a consulta ao catálogo, a criação do player, a observação dos eventos e o encerramento da sessão, contribuindo para a **separação de responsabilidades** entre apresentação e controle da reprodução.

A utilização de `ServicoDeVideos` e `PlayerProvider` como dependências recebidas pela fachada também favorece a substituição desses elementos em testes. O projeto inclui `ReproducaoFacade.test.ts` e `ServicoDeVideos.test.ts`, voltados à verificação das operações da sessão e do serviço de consulta.

Como limitação, a implementação atual utiliza um catálogo local, de modo que a fachada ainda não coordena uma consulta ao back-end NestJS. Também não há suporte a transmissões ao vivo: o diagrama de domínio prevê `TransmissaoAoVivo`, mas `ServicoDeVideos` atende apenas vídeos sob demanda. A fachada também expõe ao cliente os tipos de evento do player (`PlaybackEvent`), e `prepararVideo()` recebe um `HTMLVideoElement`, o que mantém o componente React parcialmente acoplado ao subsistema de reprodução. Além disso, a classe concentra o gerenciamento de estados, observadores e cancelamento da preparação, responsabilidades que exigem atenção para evitar crescimento excessivo da fachada conforme novas funcionalidades forem incorporadas.

Na correspondência entre o diagrama e o código, a estrutura principal está representada, mas o gerenciamento interno da sessão é mais detalhado na implementação. O código utiliza `EstadoDaSessao`, uma referência opcional a `IPlayer` e mecanismos de inscrição e cancelamento. O tipo `Video` é uma interface TypeScript, e não uma classe concreta, e o cliente `ReproducaoEInteracoes` é um componente funcional React, representado no diagrama como classe apenas para fins de modelagem. Esses aspectos são relevantes para interpretar corretamente as responsabilidades e relações UML.

## 8. Conclusão

O padrão Facade foi aplicado à plataforma de streaming para simplificar a utilização das operações de reprodução pela camada de apresentação. A classe `ReproducaoFacade` reúne a coordenação do serviço de vídeos e do player, oferecendo ao componente React um conjunto de operações diretamente relacionadas ao ciclo de vida da sessão.

A modelagem desenvolvida coletivamente pela Equipe 2 estabelece a divisão de responsabilidades entre cliente, fachada e subsistemas, refletida na implementação em TypeScript. A solução contribui para a organização do módulo de reprodução e para a manutenção do front-end, sem pressupor que a integração futura com o back-end já esteja concluída.

## 9. Referências

1. GAMMA, Erich; HELM, Richard; JOHNSON, Ralph; VLISSIDES, John. *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley, 1995.
2. SERRANO, Milene. *Arquitetura e Desenho de Software — Aula GoFs Estruturais*. Material didático, Universidade de Brasília.
3. REFACTORING.GURU. **Facade**. Disponível em: <https://refactoring.guru/pt-br/design-patterns/facade>.
4. REACT. *Referencing Values with Refs*. Disponível em: <https://react.dev/learn/referencing-values-with-refs>.

## 10. Histórico de versões

| Versão | Data | Descrição | Autor | Revisor |
| --- | --- | --- | --- | --- |
| 1.0 |  17/10/2026 | Modelagem do padrão e documentação de sua aplicação à plataforma de streaming | [Enzo Menali](https://github.com/menali17), [Geovanna Umbelino](https://github.com/GeovannaUmbelino), [Lucas Oliveira](https://github.com/dev-LucasDpaula) e [Paulo Vitor Gomes](https://github.com/gpaulovit) | [Pedro Americo](https://github.com/dev-americo) |