import type { IJobBuilder } from '../interfaces/job-builder.interface';
import { JobHLS } from '../jobs/job-hls';

/**
 * Builder concreto para construção de instâncias de JobHLS (GoF Criacional: Builder).
 * Permite configurar resolução única ou múltiplas resoluções para compor uma Master Playlist HLS.
 */
export class HlsJobBuilder implements IJobBuilder {
  private jobAtual: JobHLS;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.jobAtual = new JobHLS();
  }

  public setVideo(videoUrl: string): this {
    this.jobAtual.setVideoUrl(videoUrl);
    return this;
  }

  /**
   * Define uma resolução única (substitui resoluções anteriores).
   */
  public setResolucao(resolucao: string): this {
    this.jobAtual.setResolucao(resolucao);
    return this;
  }

  /**
   * Adiciona uma resolução adicional à Master Playlist HLS.
   */
  public addResolucao(resolucao: string): this {
    this.jobAtual.addResolucao(resolucao);
    return this;
  }

  /**
   * Define múltiplas resoluções de uma vez para compor a Master Playlist HLS.
   */
  public setResolucoes(resolucoes: string[]): this {
    this.jobAtual.setResolucoes(resolucoes);
    return this;
  }

  public setOutputDir(outputDir: string): this {
    this.jobAtual.setOutputDir(outputDir);
    return this;
  }

  public setSegmentDuration(segundos: number): this {
    this.jobAtual.setDuracaoSegmento(segundos);
    return this;
  }

  public setDuracaoSegundos(segundos?: number): this {
    this.jobAtual.setDuracaoSegundos(segundos);
    return this;
  }

  public build(): JobHLS {
    const jobPronto = this.jobAtual;
    this.reset();
    return jobPronto;
  }
}
