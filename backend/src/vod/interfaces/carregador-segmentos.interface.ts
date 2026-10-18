/**
 * Interface do padrão GoF Criacional: Abstract Factory (Produto Abstrato B).
 * Define o contrato de quem busca os dados do vídeo (arquivo MP4, playlists ou segmentos .ts).
 */
export interface ICarregadorSegmentos {
  /**
   * Baixa o conteúdo de um recurso do vídeo (caminho local ou URL HTTP).
   * @returns Promise com o conteúdo baixado (string binária, sem perda de dados).
   */
  baixarSegmento(url: string): Promise<string>;
}
