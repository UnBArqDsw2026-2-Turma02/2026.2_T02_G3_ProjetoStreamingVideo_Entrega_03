/**
 * Interface do padrão GoF Criacional: Abstract Factory (Produto Abstrato A).
 * Define o contrato de um player de vídeo, independente do formato (WebVideo ou HLS).
 */
export interface IPlayer {
  /**
   * Inicia (ou continua) a reprodução a partir da posição atual.
   * @returns Promise com um resumo da reprodução.
   */
  reproduzir(): Promise<string>;

  /**
   * Pausa a reprodução.
   */
  pausar(): void;

  /**
   * Move a posição da reprodução para o segundo informado.
   */
  buscar(segundos: number): void;

  /**
   * Altera a resolução de reprodução (ex: '720p', '480p', '360p').
   */
  setResolucao(resolucao: string): void;
}
