import type { IPlayer } from '../player/IPlayer';
import {
  PlaybackError,
  type PlaybackEvent,
  type PlaybackListener,
  type Unsubscribe,
} from '../player/playback.types';
import type { ServicoDeVideos } from './ServicoDeVideos';

/** Deve fornecer um player novo e exclusivo para cada sessão. */
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

  async prepararVideo(videoId: string, video: HTMLVideoElement): Promise<void> {
    this.garantirAberta();

    if (this.estado !== 'nova') {
      throw new PlaybackError(
        'SESSAO_JA_INICIADA',
        'Cada sessão permite preparar apenas um vídeo. Crie outra Facade para abrir um novo vídeo.',
      );
    }

    this.estado = 'preparando';
    const cancelamento = new Promise<never>((_resolver, rejeitar) => {
      this.cancelarPreparacao = () => rejeitar(new PlaybackError(
        'CARREGAMENTO_CANCELADO',
        'A preparação do vídeo foi cancelada porque a sessão foi encerrada.',
      ));
    });

    try {
      // A corrida permite cancelar até uma consulta que ainda não retornou.
      await Promise.race([this.consultarEPreparar(videoId, video), cancelamento]);
      this.garantirAberta();
      this.estado = 'pronta';
    } catch (erro) {
      if (!this.encerrada) {
        this.estado = 'falhou';
        try {
          this.liberarPlayer();
        } catch (falhaAoLiberar) {
          console.error('Falha ao liberar o player após uma preparação malsucedida.', falhaAoLiberar);
        }
      }

      // Erros do serviço e do Adapter preservam sua identidade e sua causa.
      throw erro;
    } finally {
      this.cancelarPreparacao = undefined;
    }
  }

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

  private async consultarEPreparar(videoId: string, video: HTMLVideoElement): Promise<void> {
    const dados = await this.servicoDeVideos.buscarPorId(videoId);
    this.garantirAberta();

    const player = this.playerProvider(video);
    if (this.encerrada) {
      player.descartar();
      this.garantirAberta();
    }

    this.player = player;
    this.removerInscricao = player.observar((evento) => {
      if (!this.encerrada) this.notificar(evento);
    });
    this.garantirAberta();
    await player.carregar(dados.manifestoUrl);
  }

  private obterPlayerPronto(): IPlayer {
    this.garantirAberta();

    if (this.estado !== 'pronta' || !this.player) {
      throw new PlaybackError(
        'VIDEO_NAO_PREPARADO',
        'Prepare o vídeo antes de utilizar os controles de reprodução.',
      );
    }

    return this.player;
  }

  private garantirAberta(): void {
    if (this.encerrada) {
      throw new PlaybackError(
        'SESSAO_ENCERRADA',
        'Esta sessão foi encerrada. Crie outra Facade para iniciar uma nova sessão.',
      );
    }
  }

  private get encerrada(): boolean {
    return this.estado === 'encerrada';
  }

  private liberarPlayer(): void {
    const player = this.player;
    const removerInscricao = this.removerInscricao;
    this.player = undefined;
    this.removerInscricao = undefined;

    try {
      removerInscricao?.();
    } finally {
      player?.descartar();
    }
  }

  private notificar(evento: PlaybackEvent): void {
    for (const listener of Array.from(this.ouvintes)) {
      if (this.encerrada && evento.tipo !== 'descartado') break;
      if (!this.ouvintes.has(listener)) continue;

      try {
        listener(evento);
      } catch (erro) {
        console.error('Falha em um observador da sessão de reprodução.', erro);
      }
    }
  }
}
