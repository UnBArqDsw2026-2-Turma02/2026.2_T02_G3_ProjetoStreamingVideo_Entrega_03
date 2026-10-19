import * as path from 'path';
import * as fs from 'fs';
import type { IJob } from '../interfaces/job.interface';
import {
  executarFfmpegHls,
  gerarMasterPlaylistHls,
  type HlsVariantInfo,
} from '../utils/ffmpeg.util';

/**
 * Job concreto para transcodificação de vídeo em formato HLS (HTTP Live Streaming).
 * Gera listas de reprodução por resolução e uma Master Playlist (master.m3u8) unificada,
 * permitindo que players baseados em hls.js ofereçam comutação adaptativa (ABR)
 * ou seleção manual de qualidade de forma ergonômica.
 *
 * Implementa IJob e IJobPrototype (GoF Prototype).
 */
export class JobHLS implements IJob {
  private videoUrl: string = '';
  private resolucoes: string[] = ['720p'];
  private outputDir: string = './media/vod/hls';
  private duracaoSegundos?: number;
  private duracaoSegmento: number = 4; // segundos por segmento .ts

  constructor(
    videoUrl?: string,
    resolucoes?: string | string[],
    outputDir?: string,
    duracaoSegundos?: number,
    duracaoSegmento: number = 4,
  ) {
    if (videoUrl) this.videoUrl = videoUrl;
    if (resolucoes) {
      this.resolucoes = Array.isArray(resolucoes) ? [...resolucoes] : [resolucoes];
    }
    if (outputDir) this.outputDir = outputDir;
    if (duracaoSegundos) this.duracaoSegundos = duracaoSegundos;
    this.duracaoSegmento = duracaoSegmento;
  }

  public getVideoUrl(): string {
    return this.videoUrl;
  }

  public setVideoUrl(videoUrl: string): void {
    this.videoUrl = videoUrl;
  }

  /**
   * Retorna a resolução primária/padrão do job (compatibilidade com a interface IJob).
   */
  public getResolucao(): string {
    return this.resolucoes[0] || '720p';
  }

  /**
   * Define uma resolução única para o job (compatibilidade com a interface IJob).
   */
  public setResolucao(resolucao: string): void {
    this.resolucoes = [resolucao];
  }

  /**
   * Retorna todas as resoluções configuradas para este stream HLS.
   */
  public getResolucoes(): string[] {
    return [...this.resolucoes];
  }

  /**
   * Define um conjunto de resoluções para compor a Master Playlist unificada.
   */
  public setResolucoes(resolucoes: string[]): void {
    if (resolucoes.length === 0) {
      throw new Error('O JobHLS deve conter ao menos uma resolução.');
    }
    this.resolucoes = [...resolucoes];
  }

  /**
   * Adiciona uma nova resolução ao conjunto da Master Playlist.
   */
  public addResolucao(resolucao: string): void {
    if (!this.resolucoes.includes(resolucao)) {
      this.resolucoes.push(resolucao);
    }
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

  public getDuracaoSegmento(): number {
    return this.duracaoSegmento;
  }

  public setDuracaoSegmento(segundos: number): void {
    this.duracaoSegmento = segundos;
  }

  /**
   * Executa a transcodificação HLS gerando uma Master Playlist unificada (master.m3u8)
   * e as sub-playlists e segmentos .ts para cada resolução configurada.
   * @returns Caminho absoluto da Master Playlist (master.m3u8).
   */
  public async executarJob(): Promise<string> {
    if (!this.videoUrl) {
      throw new Error('Não é possível executar JobHLS: videoUrl não definida.');
    }

    if (!fs.existsSync(this.videoUrl)) {
      throw new Error(`Arquivo de vídeo de entrada não encontrado: ${this.videoUrl}`);
    }

    const baseName = path.basename(this.videoUrl, path.extname(this.videoUrl));
    const jobOutputDir = path.resolve(this.outputDir, baseName);

    fs.mkdirSync(jobOutputDir, { recursive: true });

    const variantesInfo: HlsVariantInfo[] = [];

    // Transcodifica cada resolução em seu subdiretório dedicado
    for (const res of this.resolucoes) {
      const resSanitized = res.replace(/[^a-zA-Z0-9]/g, '_');
      const variantDir = path.resolve(jobOutputDir, resSanitized);
      fs.mkdirSync(variantDir, { recursive: true });

      const playlistPath = path.resolve(variantDir, 'index.m3u8');
      const segmentPattern = path.resolve(variantDir, 'segment_%03d.ts');

      await executarFfmpegHls({
        inputPath: this.videoUrl,
        playlistPath,
        segmentPattern,
        resolucao: res,
        duracaoSegmento: this.duracaoSegmento,
        duracaoSegundos: this.duracaoSegundos,
      });

      variantesInfo.push({
        resolucao: res,
        relativePlaylistPath: `${resSanitized}/index.m3u8`,
      });
    }

    // Gera a Master Playlist (Multivariant Playlist) unificada
    const masterPlaylistPath = path.resolve(jobOutputDir, 'master.m3u8');
    gerarMasterPlaylistHls(masterPlaylistPath, variantesInfo);

    return masterPlaylistPath;
  }

  /**
   * GoF Prototype: clona a instância atual com todas as resoluções e configurações.
   */
  public clone(): JobHLS {
    return new JobHLS(
      this.videoUrl,
      [...this.resolucoes],
      this.outputDir,
      this.duracaoSegundos,
      this.duracaoSegmento,
    );
  }
}
