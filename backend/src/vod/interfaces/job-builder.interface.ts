import type { IJob } from './job.interface';

/**
 * Interface do padrão GoF Criacional: Builder.
 * Define as etapas de construção de um Job de Transcodificação.
 */
export interface IJobBuilder {
  /**
   * Reseta o estado interno do builder criando uma nova instância de Job.
   */
  reset(): void;

  /**
   * Define o vídeo de entrada (caminho local ou URL).
   */
  setVideo(videoUrl: string): IJobBuilder;

  /**
   * Define a resolução alvo (ex: '1080p', '720p', '480p', '360p').
   */
  setResolucao(resolucao: string): IJobBuilder;

  /**
   * Define o diretório de saída para os arquivos gerados.
   */
  setOutputDir(outputDir: string): IJobBuilder;

  /**
   * Finaliza a construção e retorna a instância de IJob configurada.
   */
  build(): IJob;
}
