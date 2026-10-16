# Demonstração de reprodução: Facade e Adapter

## Executar

No PowerShell:

```powershell
cd C:\arquitetura\2026.2_T02_G3_ProjetoStreamingVideo_Entrega_03\frontend
npm ci
npm run dev -- --port 3001
```

Abra [http://localhost:3001/demonstracao](http://localhost:3001/demonstracao).
Essa rota funciona sem Docker, backend ou banco de dados. A página principal permanece independente.
Use um navegador com suporte ao hls.js/MediaSource Extensions, como Chrome ou Edge.
O player é instanciado apenas ao clicar em **Preparar vídeo**, após a montagem do elemento `<video>`.

## Roteiro para o vídeo da disciplina

1. Selecione **Big Buck Bunny — HLS de teste** e clique em **Preparar vídeo**.
2. Mostre os eventos `carregando` e `pronto`. Manifesto preparado não significa reprodução iniciada.
3. Clique em **Reproduzir** e mostre a reprodução e o evento `reproduzindo`.
4. Clique em **Pausar** e mostre o evento `pausado`.
5. Clique em **Encerrar sessão** e mostre `descartado` e os controles desabilitados.
6. Selecione **Vídeo fora do catálogo** e prepare: a consulta falha sem criar um player.
7. Selecione **Manifesto inexistente** e prepare: o erro HLS é exibido; pode haver retentativas da biblioteca antes da falha.
8. Para mostrar cancelamento, prepare o vídeo e encerre enquanto o estado ainda for de preparação.
   Em uma conexão rápida, use uma limitação de rede no DevTools. Os testes também cobrem esse cenário de forma controlada.

Depois de encerrar ou de uma preparação malsucedida, o próximo clique em **Preparar vídeo** cria outra Facade.
Uma mesma Facade não é reutilizada para abrir vários vídeos.

## Correspondência com a UML

| Participante | Implementação | Responsabilidade |
| --- | --- | --- |
| Client do Facade | `src/components/reproducao/ReproducaoEInteracoes.tsx` | Componente React que utiliza apenas a Facade. |
| Facade / Client do Adapter | `src/lib/reproducao/ReproducaoFacade.ts` | Coordena consulta, criação do player, observação, preparação, controles e encerramento. |
| Subsistema de consulta | `src/lib/reproducao/ServicoDeVideos.ts` | Consulta um catálogo em memória e informa vídeo inexistente. |
| Entidade | `src/lib/reproducao/Video.ts` | Tipo de dados com `id` e `manifestoUrl`; não necessita de comportamento próprio. |
| Target / subsistema de reprodução | `src/lib/player/IPlayer.ts` | Contrato independente de biblioteca. |
| Adapter | `src/lib/player/HlsJsPlayerAdapter.ts` | Adapta o contrato para hls.js e `HTMLVideoElement`. |
| Adaptee | `Hls`, importado de `hls.js` | API externa de preparação da transmissão HLS. |

`PlayerProvider = (video: HTMLVideoElement) => IPlayer` é exportado pelo módulo da Facade.
O provider deve retornar um **player novo e exclusivo** para cada sessão; essa propriedade sustenta a composição da UML.
Em `src/app/demonstracao/page.tsx`, a composição das dependências fornece o Adapter concreto e o catálogo.
A Facade não importa `HlsJsPlayerAdapter` nem `hls.js`; o componente de reprodução também não importa essas implementações.
As funções de composição fazem injeção manual de dependências, sem introduzir outro padrão GoF.

A aplicação do Facade acontece principalmente em `prepararVideo()`: o cliente informa o identificador
e o elemento de vídeo; a Facade consulta o catálogo, obtém a URL, cria o player, assina seus eventos
e carrega o manifesto. O cliente não precisa conhecer essa colaboração entre os dois subsistemas.
O Adapter continua responsável por `loadSource`, `attachMedia`, eventos HLS, `play`, `pause` e `destroy`.

## Eventos, erros e encerramento

- `observar()` funciona antes de existir um player. A inscrição da Facade em `IPlayer` ocorre antes de `carregar()`.
- Eventos do player são encaminhados sem tradução ou duplicação pela Facade.
- Erros de consulta e de criação do player rejeitam `prepararVideo()`; o componente exibe a rejeição.
- Erros de carregamento e reprodução mantêm o erro original do Adapter e seu evento normalizado.
  A Facade não emite novamente um evento `erro` quando recebe uma rejeição.
- Os controles exigem que `prepararVideo()` tenha concluído com sucesso.
- Uma falha de preparação libera imediatamente o player e sua inscrição.
- `encerrar()` marca a sessão como encerrada antes de liberar recursos, cancela a preparação,
  remove a inscrição no player e chama `IPlayer.descartar()` uma única vez.
- A Facade emite um único `descartado` para indicar o fim da sessão, inclusive se o player ainda não foi criado,
  e libera seus observadores. Os eventos de descarte do Adapter não são duplicados.
- Durante uma consulta pendente, o cancelamento rejeita imediatamente a preparação. O contrato do serviço
  não contém `AbortSignal`: uma consulta já iniciada pode continuar, mas seu resultado tardio é ignorado
  e não cria recursos. Rejeições tardias também permanecem tratadas.
- Na desmontagem React, a sessão e a inscrição da tela são liberadas. Cada nova sessão usa outra instância,
  compatível com o ciclo de montagem e desmontagem do Strict Mode.

O Adapter recebeu um ajuste interno de ordem: registra o carregamento pendente antes de emitir `carregando`.
Assim, se um observador encerrar a sessão nesse evento, o descarte cancela a Promise e nenhuma operação HLS
é iniciada depois da destruição. O contrato e as relações da UML permanecem os mesmos.

## Verificações

```powershell
npm test
npm run typecheck
npm run build
```

Os testes da Facade simulam `ServicoDeVideos` e `IPlayer`, sem importar hls.js.
Eles verificam a coordenação, a ordem de inscrição, eventos, identidade dos erros, liberação de recursos,
cancelamento durante consulta/carregamento e respostas tardias após encerramento.
Os testes do Adapter continuam verificando a adaptação, com um teste de regressão para o descarte reentrante.

Validação realizada em 15/10/2026: **30 testes aprovados** (17 da Facade, 2 do serviço e 11 do Adapter),
typecheck e build de produção concluídos. No navegador, foram verificados carregamento HLS real,
reprodução, pausa, encerramento, abertura de uma nova sessão e as duas falhas disponíveis no seletor.
O cancelamento durante operações pendentes foi comprovado com Promises controladas nos testes unitários.

## Fonte HLS e limitações

A demonstração utiliza o [stream público de teste Big Buck Bunny](https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8),
também utilizado no [exemplo oficial do hls.js](https://github.com/video-dev/hls.js#embedding-hlsjs).
Em 15/10/2026, o manifesto principal, uma playlist de qualidade e um segmento responderam com HTTP 200
e `Access-Control-Allow-Origin: *` em uma requisição com origem `http://localhost:3001`.

A fonte depende da internet e de um serviço externo, e sua disponibilidade não é garantida.
Outro stream HLS pode ser definido no catálogo da página de demonstração, desde que o manifesto,
as playlists e os segmentos permitam CORS e usem codecs suportados pelo navegador.
Não foi acrescentado fallback HLS nativo. Os eventos existentes descrevem preparação e comandos do contrato;
buffering, término do vídeo e controles externos ao Adapter não estão modelados nesta etapa.
O catálogo em memória pode ser substituído futuramente por uma consulta ao backend sem transferir
essa responsabilidade para o componente React ou para o Adapter.
