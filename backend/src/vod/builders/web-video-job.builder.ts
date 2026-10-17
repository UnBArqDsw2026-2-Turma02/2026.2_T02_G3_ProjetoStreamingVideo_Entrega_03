import type { IJobBuilder } from '../interfaces/job-builder.interface';
import { JobWebVideo } from '../jobs/job-web-video';

/**
 * Builder concreto para construção de instâncias de JobWebVideo (GoF Criacional: Builder).
 */
export class WebVideoJobBuilder implements IJobBuilder {
  private jobAtual: JobWebVideo;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.jobAtual = new JobWebVideo();
  }

  public setVideo(videoUrl: string): this {
    this.jobAtual.setVideoUrl(videoUrl);
    return this;
  }

  public setResolucao(resolucao: string): this {
    this.jobAtual.setResolucao(resolucao);
    return this;
  }

  public setOutputDir(outputDir: string): this {
    this.jobAtual.setOutputDir(outputDir);
    return this;
  }

  public setDuracaoSegundos(segundos?: number): this {
    this.jobAtual.setDuracaoSegundos(segundos);
    return this;
  }

  public build(): JobWebVideo {
    const jobPronto = this.jobAtual;
    this.reset();
    return jobPronto;
  }
}
