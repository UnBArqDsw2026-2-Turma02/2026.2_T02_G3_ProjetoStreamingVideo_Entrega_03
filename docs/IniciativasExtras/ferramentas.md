### SubGrupo03

#### Scripts e Dependências

Para demonstrar a funcionalidade do código implementando os GoFs 1 e 2, foram criados dois scripts que podem ser executados a partir da pasta *backend*. O primeiro, realiza a transcodificação de um vídeo para *WebVideo* e *HLS*, primeiro usando apenas o **Builder** para criar os jobs de menor resolução e por fim usando o **Prototype** para criar jobs iguais de menor resolução.

```sh
bun run vod:transcode
```

O segundo script utiliza o **Abstract Factory** para criar players *WebVideo* e *HLS* que consomem os vídeos de cada formato.

```sh
bun run vod:assistir
```

Para executar os scripts mostrados acima é necessário ter instalado:

1. **Bun**: interpretador de código Javascript/Typescript e gerenciador de pacotes, no projeto foi utilizada a **versão 1.4.2**.
2. **FFmpeg**: programa de conversão de audio e vídeo, utilizado para realizar a transcoficação dos vídeos, no projeto foi utilizada a **9.0.1**