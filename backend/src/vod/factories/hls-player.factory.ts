import type { IPlayerFactory } from '../interfaces/player-factory.interface';
import { HlsPlayer } from '../players/hls-player';
import { P2PCarregadorSegmentos } from '../carregadores/p2p-carregador-segmentos';

/**
 * Fábrica concreta da família HLS (GoF Criacional: Abstract Factory).
 * Cria um HlsPlayer sempre acompanhado de um P2PCarregadorSegmentos.
 */
export class HlsPlayerFactory implements IPlayerFactory {
  private trackerUrl?: string;

  constructor(trackerUrl?: string) {
    this.trackerUrl = trackerUrl;
  }

  public criarPlayer(videoUrl: string): HlsPlayer {
    return new HlsPlayer(videoUrl, this.criarCarregador());
  }

  public criarCarregador(): P2PCarregadorSegmentos {
    return new P2PCarregadorSegmentos(this.trackerUrl);
  }
}
