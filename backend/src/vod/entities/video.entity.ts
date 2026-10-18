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
  private urlsWebVideo: Map<string, string> = new Map<string, string>();
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

  /**
   * Obtém a URL do WebVideo para uma resolução específica.
   * Se nenhuma resolução for especificada, retorna a primeira disponível (ou string vazia se inexistente).
   * Permite que aplicações clientes escolham o vídeo de qualquer resolução já transcodificada.
   * @param resolucao Resolução desejada (ex: '1080p', '720p', '480p', '360p').
   */
  public getUrlWebVideo(resolucao?: string): string {
    if (resolucao) {
      return this.urlsWebVideo.get(resolucao) || '';
    }
    if (this.urlsWebVideo.size > 0) {
      return this.urlsWebVideo.values().next().value || '';
    }
    return '';
  }

  /**
   * Retorna uma cópia do Map de todas as URLs de WebVideo transcodificadas indexadas por resolução.
   */
  public getUrlsWebVideo(): Map<string, string> {
    return new Map(this.urlsWebVideo);
  }

  /**
   * Retorna a lista de resoluções de WebVideo atualmente disponíveis.
   */
  public getResolucoesDisponiveisWebVideo(): string[] {
    return Array.from(this.urlsWebVideo.keys());
  }

  /**
   * Verifica se uma determinada resolução de WebVideo já está disponível.
   */
  public hasResolucaoWebVideo(resolucao: string): boolean {
    return this.urlsWebVideo.has(resolucao);
  }

  /**
   * Define uma URL de WebVideo.
   * Suporta sobrecarga:
   * - setUrlWebVideo(resolucao, url): associa a URL diretamente à resolução informada.
   * - setUrlWebVideo(url): associa a URL à chave 'default'.
   */
  public setUrlWebVideo(resolucaoOuUrl: string, url?: string): void {
    if (url !== undefined) {
      this.urlsWebVideo.set(resolucaoOuUrl, url);
    } else {
      this.urlsWebVideo.set('default', resolucaoOuUrl);
    }
  }

  public getUrlHLS(): string {
    return this.urlHLS;
  }

  public setUrlHLS(url: string): void {
    this.urlHLS = url;
  }

  /**
   * Solicita a transcodificação utilizando um builder fornecido.
   * Constrói o job, o executa e atualiza os atributos urlsWebVideo ou urlHLS de acordo com o tipo de job.
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
      this.urlsWebVideo.set(job.getResolucao(), resultado);
    } else if (job instanceof JobHLS) {
      this.urlHLS = resultado;
    }

    return resultado;
  }

  /**
   * Aplicação prática do padrão GoF Criacional: Prototype.
   * A partir de um job protótipo já configurado, clona-o para produzir múltiplas variantes de resolução
   * sem precisar redefinir parâmetros comuns como caminho de origem ou diretório de saída.
   * Todas as resoluções transcodificadas são armazenadas em urlsWebVideo indexadas pela resolução.
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

      if (jobClonado instanceof JobWebVideo) {
        this.urlsWebVideo.set(resolucao, pathGerado);
      } else if (jobClonado instanceof JobHLS && !this.urlHLS) {
        this.urlHLS = pathGerado;
      }
    }

    return resultados;
  }
}
