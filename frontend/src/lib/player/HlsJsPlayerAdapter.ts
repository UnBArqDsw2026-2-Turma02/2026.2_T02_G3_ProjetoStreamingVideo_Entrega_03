import Hls, { Events, type ErrorData } from 'hls.js';

import type { IPlayer } from './IPlayer';
import {
  PlaybackError,
  type PlaybackEvent,
  type PlaybackListener,
  type Unsubscribe,
} from './playback.types';

interface CarregamentoPendente {
  manifestoUrl: string;
  resolver: () => void;
  rejeitar: (erro: PlaybackError) => void;
  temporizador: ReturnType<typeof setTimeout>;
}

export class HlsJsPlayerAdapter implements IPlayer {
  private static readonly TEMPO_LIMITE_CARREGAMENTO_MS = 30_000;

  private readonly hls: Hls;
  private readonly ouvintes = new Set<PlaybackListener>();
  private carregamentoPendente?: CarregamentoPendente;
  private descartado = false;

  constructor(private readonly video: HTMLVideoElement) {
    if (typeof window === 'undefined') {
      throw new PlaybackError(
        'AMBIENTE_INDISPONIVEL',
        'O player HLS só pode ser criado no ambiente cliente do navegador.',
      );
    }

    if (!Hls.isSupported()) {
      throw new PlaybackError(
        'HLS_NAO_SUPORTADO',
        'O navegador atual não oferece os recursos exigidos pelo hls.js.',
      );
    }

    this.hls = new Hls();
    this.hls.on(Events.MANIFEST_PARSED, this.aoManifestoPreparado);
    this.hls.on(Events.ERROR, this.aoErroDoHls);
  }

  async carregar(manifestoUrl: string): Promise<void> {
    this.garantirAtivo();

    if (!manifestoUrl.trim()) {
      throw new PlaybackError(
        'URL_INVALIDA',
        'A URL do manifesto HLS não pode ser vazia.',
      );
    }

    if (this.carregamentoPendente) {
      throw new PlaybackError(
        'CARREGAMENTO_EM_ANDAMENTO',
        'Já existe um manifesto HLS sendo preparado.',
      );
    }

    return new Promise<void>((resolver, rejeitar) => {
      const temporizador = setTimeout(() => {
        const erro = new PlaybackError(
          'TEMPO_LIMITE_CARREGAMENTO',
          'O manifesto HLS não foi preparado dentro do tempo esperado.',
        );

        this.rejeitarCarregamento(erro);
      }, HlsJsPlayerAdapter.TEMPO_LIMITE_CARREGAMENTO_MS);

      this.carregamentoPendente = {
        manifestoUrl,
        resolver,
        rejeitar,
        temporizador,
      };

      this.notificar({ tipo: 'carregando', manifestoUrl });
      if (this.descartado) return;

      try {
        this.hls.loadSource(manifestoUrl);
        this.hls.attachMedia(this.video);
      } catch (causa) {
        const erro = new PlaybackError(
          'CARREGAMENTO_FALHOU',
          'Não foi possível iniciar o carregamento do manifesto HLS.',
          causa,
        );

        this.rejeitarCarregamento(erro);
      }
    });
  }

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

  pausar(): void {
    this.garantirAtivo();

    try {
      this.video.pause();
      this.notificar({ tipo: 'pausado' });
    } catch (causa) {
      const erro = new PlaybackError(
        'PAUSA_FALHOU',
        'Não foi possível pausar a reprodução do vídeo.',
        causa,
      );

      this.notificar({ tipo: 'erro', erro });
      throw erro;
    }
  }

  observar(listener: PlaybackListener): Unsubscribe {
    this.garantirAtivo();
    this.ouvintes.add(listener);

    let inscricaoAtiva = true;

    return () => {
      if (!inscricaoAtiva) return;

      inscricaoAtiva = false;
      this.ouvintes.delete(listener);
    };
  }

  descartar(): void {
    if (this.descartado) return;

    this.descartado = true;

    if (this.carregamentoPendente) {
      const erro = new PlaybackError(
        'CARREGAMENTO_CANCELADO',
        'O carregamento do manifesto foi cancelado porque o player foi descartado.',
      );

      this.rejeitarCarregamento(erro);
    }

    try {
      this.hls.off(Events.MANIFEST_PARSED, this.aoManifestoPreparado);
      this.hls.off(Events.ERROR, this.aoErroDoHls);
      this.hls.destroy();
    } finally {
      this.notificar({ tipo: 'descartado' });
      this.ouvintes.clear();
    }
  }

  private readonly aoManifestoPreparado = (): void => {
    const carregamento = this.carregamentoPendente;
    if (!carregamento || this.descartado) return;

    this.carregamentoPendente = undefined;
    clearTimeout(carregamento.temporizador);
    this.notificar({
      tipo: 'pronto',
      manifestoUrl: carregamento.manifestoUrl,
    });
    carregamento.resolver();
  };

  private readonly aoErroDoHls = (
    _evento: Events.ERROR,
    dados: ErrorData,
  ): void => {
    if (!dados.fatal || this.descartado) return;

    const erro = new PlaybackError(
      'CARREGAMENTO_FALHOU',
      `O hls.js encontrou um erro fatal (${dados.type}: ${dados.details}).`,
      dados,
    );

    if (this.carregamentoPendente) {
      this.rejeitarCarregamento(erro);
      return;
    }

    this.notificar({ tipo: 'erro', erro });
  };

  private rejeitarCarregamento(erro: PlaybackError): void {
    const carregamento = this.carregamentoPendente;
    if (!carregamento) return;

    this.carregamentoPendente = undefined;
    clearTimeout(carregamento.temporizador);
    this.notificar({ tipo: 'erro', erro });
    carregamento.rejeitar(erro);
  }

  private garantirAtivo(): void {
    if (!this.descartado) return;

    throw new PlaybackError(
      'PLAYER_DESCARTADO',
      'O player já foi descartado e não pode mais ser utilizado.',
    );
  }

  private notificar(evento: PlaybackEvent): void {
    for (const listener of Array.from(this.ouvintes)) {
      try {
        listener(evento);
      } catch (erro) {
        console.error('Falha em um PlaybackListener.', erro);
      }
    }
  }
}
