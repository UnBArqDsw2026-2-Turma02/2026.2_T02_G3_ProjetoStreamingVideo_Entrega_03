import type { IPlayerFactory } from '../interfaces/player-factory.interface';
import { WebVideoPlayer } from '../players/web-video-player';
import { HttpCarregadorSegmentos } from '../carregadores/http-carregador-segmentos';

/**
 * Fábrica concreta da família WebVideo (GoF Criacional: Abstract Factory).
 * Cria um WebVideoPlayer sempre acompanhado de um HttpCarregadorSegmentos.
 */
export class WebVideoPlayerFactory implements IPlayerFactory {
  public criarPlayer(videoUrl: string): WebVideoPlayer {
    return new WebVideoPlayer(videoUrl, this.criarCarregador());
  }

  public criarCarregador(): HttpCarregadorSegmentos {
    return new HttpCarregadorSegmentos();
  }
}
