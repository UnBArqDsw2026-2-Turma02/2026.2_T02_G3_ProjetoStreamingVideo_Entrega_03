import type { IJobBuilder } from '../interfaces/job-builder.interface';
import type { IJob } from '../interfaces/job.interface';
import { JobWebVideo } from '../jobs/job-web-video';
import { JobHLS } from '../jobs/job-hls';

/**
 * Entidade Cliente do padrão de transcodificação.
 * Representa um vídeo e coordena solicitações de transcodificação através dos Builders e Jobs.
 */
export class Video {
  private videoOriginalUrl: string = '';
  private urlWebVideo: string = '';
  private urlHLS: string = '';

  constructor(videoOriginalUrl: string = '') {
    this.videoOriginalUrl = videoOriginalUrl;
  }

  public getVideoOriginalUrl(): string {
    return this.videoOriginalUrl;
  }

  public setVideoOriginalUrl(url: string): void {
    this.videoOriginalUrl = url;
  }

  public getUrlWebVideo(): string {
    return this.urlWebVideo;
  }

  public setUrlWebVideo(url: string): void {
    this.urlWebVideo = url;
  }

  public getUrlHLS(): string {
    return this.urlHLS;
  }

  public setUrlHLS(url: string): void {
    this.urlHLS = url;
  }

  /**
   * Solicita a transcodificação utilizando um builder fornecido.
   * Constrói o job, o executa e atualiza os atributos urlWebVideo ou urlHLS de acordo com o tipo de job.
   * @param builder Instância de IJobBuilder configurada ou a ser complementada com o vídeo de origem.
   * @returns O caminho/URL do arquivo ou playlist transcodificada gerada.
   */
  public async solicitarTranscodificacao(builder: IJobBuilder): Promise<string> {
    const job = builder.build();

    // Se o job não tiver videoUrl definida e a entidade Video tiver videoOriginalUrl, injeta
    if (!job.getVideoUrl() && this.videoOriginalUrl) {
      job.setVideoUrl(this.videoOriginalUrl);
    }

    const resultado = await job.executarJob();

    if (job instanceof JobWebVideo) {
      this.urlWebVideo = resultado;
    } else if (job instanceof JobHLS) {
      this.urlHLS = resultado;
    }

    return resultado;
  }

  /**
   * Aplicação prática do padrão GoF Criacional: Prototype.
   * A partir de um job protótipo já configurado, clona-o para produzir múltiplas variantes de resolução
   * sem precisar redefinir parâmetros comuns como caminho de origem ou diretório de saída.
   * @param jobPrototipo Instância base de IJob a ser clonada.
   * @param resolucoes Lista de resoluções desejadas (ex: ['720p', '480p', '360p']).
   * @returns Lista de caminhos gerados para cada resolução.
   */
  public async solicitarVariantesResolucao(
    jobPrototipo: IJob,
    resolucoes: string[],
  ): Promise<string[]> {
    const resultados: string[] = [];

    for (const resolucao of resolucoes) {
      // GoF Prototype: clonagem profunda do job
      const jobClonado = jobPrototipo.clone();
      jobClonado.setResolucao(resolucao);

      const pathGerado = await jobClonado.executarJob();
      resultados.push(pathGerado);

      if (jobClonado instanceof JobWebVideo && !this.urlWebVideo) {
        this.urlWebVideo = pathGerado;
      } else if (jobClonado instanceof JobHLS && !this.urlHLS) {
        this.urlHLS = pathGerado;
      }
    }

    return resultados;
  }
}
