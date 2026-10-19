import * as path from 'path';
import * as fs from 'fs';
import type { IJob } from '../interfaces/job.interface';
import { executarFfmpegWebVideo } from '../utils/ffmpeg.util';

/**
 * Job concreto para transcodificação de vídeo voltado para a web (formato MP4 com faststart).
 * Implementa IJob e IJobPrototype (GoF Prototype).
 */
export class JobWebVideo implements IJob {
  private videoUrl: string = '';
  private resolucao: string = '720p';
  private outputDir: string = './media/vod/web';
  private duracaoSegundos?: number;

  constructor(videoUrl?: string, resolucao?: string, outputDir?: string, duracaoSegundos?: number) {
    if (videoUrl) this.videoUrl = videoUrl;
    if (resolucao) this.resolucao = resolucao;
    if (outputDir) this.outputDir = outputDir;
    if (duracaoSegundos) this.duracaoSegundos = duracaoSegundos;
  }

  public getVideoUrl(): string {
    return this.videoUrl;
  }

  public setVideoUrl(videoUrl: string): void {
    this.videoUrl = videoUrl;
  }

  public getResolucao(): string {
    return this.resolucao;
  }

  public setResolucao(resolucao: string): void {
    this.resolucao = resolucao;
  }

  public getOutputDir(): string {
    return this.outputDir;
  }

  public setOutputDir(outputDir: string): void {
    this.outputDir = outputDir;
  }

  public getDuracaoSegundos(): number | undefined {
    return this.duracaoSegundos;
  }

  public setDuracaoSegundos(duracao?: number): void {
    this.duracaoSegundos = duracao;
  }

  /**
   * Executa a transcodificação para formato MP4 web.
   * @returns Caminho absoluto do arquivo MP4 gerado.
   */
  public async executarJob(): Promise<string> {
    if (!this.videoUrl) {
      throw new Error('Não é possível executar JobWebVideo: videoUrl não definida.');
    }

    if (!fs.existsSync(this.videoUrl)) {
      throw new Error(`Arquivo de vídeo de entrada não encontrado: ${this.videoUrl}`);
    }

    fs.mkdirSync(this.outputDir, { recursive: true });

    const baseName = path.basename(this.videoUrl, path.extname(this.videoUrl));
    const resSanitized = this.resolucao.replace(/[^a-zA-Z0-9]/g, '_');
    const outputFileName = `${baseName}_${resSanitized}.mp4`;
    const outputPath = path.resolve(this.outputDir, outputFileName);

    await executarFfmpegWebVideo({
      inputPath: this.videoUrl,
      outputPath,
      resolucao: this.resolucao,
      duracaoSegundos: this.duracaoSegundos,
    });

    return outputPath;
  }

  /**
   * GoF Prototype: clona a instância atual com todas as configurações.
   */
  public clone(): JobWebVideo {
    return new JobWebVideo(
      this.videoUrl,
      this.resolucao,
      this.outputDir,
      this.duracaoSegundos,
    );
  }
}
