import type { IPlayer } from './player.interface';
import type { ICarregadorSegmentos } from './carregador-segmentos.interface';

/**
 * Interface do padrão GoF Criacional: Abstract Factory (Fábrica Abstrata).
 * Cada fábrica concreta cria uma FAMÍLIA de objetos compatíveis para assistir a um vídeo:
 * um player e o carregador de segmentos que combina com ele.
 */
export interface IPlayerFactory {
  /**
   * Cria um player já configurado com o carregador da mesma família.
   */
  criarPlayer(videoUrl: string): IPlayer;

  /**
   * Cria o carregador de segmentos da família.
   */
  criarCarregador(): ICarregadorSegmentos;
}
