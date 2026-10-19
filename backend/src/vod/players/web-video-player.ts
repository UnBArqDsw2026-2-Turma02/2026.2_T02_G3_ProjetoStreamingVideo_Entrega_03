import * as fs from 'fs';
import * as path from 'path';
import type { IPlayer } from '../interfaces/player.interface';
import type { ICarregadorSegmentos } from '../interfaces/carregador-segmentos.interface';

/**
 * Produto concreto A1 da família WebVideo (GoF Abstract Factory).
 * Reproduz o arquivo MP4 único gerado pelo JobWebVideo (urlWebVideo).
 */
export class WebVideoPlayer implements IPlayer {
  private videoUrl: string = '';
  private resolucao: string = '';
  private carregador: ICarregadorSegmentos;
  private estado: 'PARADO' | 'REPRODUZINDO' | 'PAUSADO' = 'PARADO';
  private posicaoSegundos: number = 0;

  constructor(videoUrl: string, carregador: ICarregadorSegmentos) {
    this.videoUrl = videoUrl;
    this.carregador = carregador;
    // O JobWebVideo nomeia os arquivos como <nome>_<resolucao>.mp4
    const match = path.basename(videoUrl).match(/_([a-zA-Z0-9]+)\.mp4$/);
    this.resolucao = match ? match[1] : '720p';
  }

  public getVideoUrl(): string {
    return this.videoUrl;
  }

  public getResolucao(): string {
    return this.resolucao;
  }

  public getCarregador(): ICarregadorSegmentos {
    return this.carregador;
  }

  public getEstado(): string {
    return this.estado;
  }

  public getPosicao(): number {
    return this.posicaoSegundos;
  }

  /**
   * Baixa o arquivo MP4 pelo carregador da família (HTTP) e inicia a reprodução.
   */
  public async reproduzir(): Promise<string> {
    if (!this.videoUrl) {
      throw new Error('Não é possível reproduzir: videoUrl não definida.');
    }

    const conteudo = await this.carregador.baixarSegmento(this.videoUrl);

    // Arquivos MP4 possuem a assinatura "ftyp" nos bytes 4 a 8
    if (conteudo.substring(4, 8) !== 'ftyp') {
      throw new Error(`O arquivo não é um MP4 válido: ${this.videoUrl}`);
    }

    this.estado = 'REPRODUZINDO';
    const tamanhoMb = (conteudo.length / (1024 * 1024)).toFixed(2);
    return `WebVideo ${this.resolucao}: ${path.basename(this.videoUrl)} (${tamanhoMb} MB) reproduzindo a partir de ${this.posicaoSegundos}s`;
  }

  public pausar(): void {
    if (this.estado === 'REPRODUZINDO') {
      this.estado = 'PAUSADO';
    }
  }

  public buscar(segundos: number): void {
    this.posicaoSegundos = Math.max(0, segundos);
  }

  /**
   * O WebVideo é um arquivo único por resolução. A troca só acontece se existir
   * o arquivo da resolução pedida ao lado do atual (ex: variantes geradas pelo Prototype).
   */
  public setResolucao(resolucao: string): void {
    const novaUrl = this.videoUrl.replace(/_[a-zA-Z0-9]+\.mp4$/, `_${resolucao}.mp4`);
    const remota = /^https?:\/\//i.test(novaUrl);

    if (novaUrl !== this.videoUrl && (remota || fs.existsSync(novaUrl))) {
      this.videoUrl = novaUrl;
      this.resolucao = resolucao;
    } else {
      throw new Error(`Não existe arquivo WebVideo em ${resolucao} para ${path.basename(this.videoUrl)}.`);
    }
  }
}
