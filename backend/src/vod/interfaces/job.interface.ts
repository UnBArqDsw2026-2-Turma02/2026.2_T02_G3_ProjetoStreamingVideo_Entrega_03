import type { IJobPrototype } from './job-prototype.interface';

/**
 * Interface base para Jobs de Transcodificação (GoF Criacional: Product do Builder & Prototype).
 */
export interface IJob extends IJobPrototype {
  /**
   * Retorna a URL ou caminho do vídeo de origem.
   */
  getVideoUrl(): string;

  /**
   * Define a URL ou caminho do vídeo de origem.
   */
  setVideoUrl(videoUrl: string): void;

  /**
   * Retorna a resolução configurada para o job (ex: '720p', '480p', '1280x720').
   */
  getResolucao(): string;

  /**
   * Altera a resolução do job. Método fundamental para o padrão Prototype,
   * permitindo que um job clonado assuma outra resolução sem reconstruir todas as configurações.
   */
  setResolucao(resolucao: string): void;

  /**
   * Retorna o diretório de saída dos arquivos transcodificados.
   */
  getOutputDir(): string;

  /**
   * Define o diretório de saída dos arquivos transcodificados.
   */
  setOutputDir(outputDir: string): void;

  /**
   * Executa a transcodificação do vídeo usando FFmpeg.
   * @returns Promise com o caminho ou URL do arquivo final gerado (ex: .mp4 ou .m3u8).
   */
  executarJob(): Promise<string>;

  /**
   * Cria um clone do job atual (GoF Prototype).
   */
  clone(): IJob;
}
