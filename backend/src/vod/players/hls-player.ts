import * as path from 'path';
import type { IPlayer } from '../interfaces/player.interface';
import type { ICarregadorSegmentos } from '../interfaces/carregador-segmentos.interface';

interface VarianteHls {
  resolucao: string;
  uri: string;
}

interface SegmentoHls {
  duracao: number;
  uri: string;
}

/**
 * Produto concreto A2 da família HLS (GoF Abstract Factory).
 * Lê a Master Playlist (master.m3u8) gerada pelo JobHLS, escolhe a variante de resolução
 * e reproduz os segmentos .ts usando o carregador da família (P2P com fallback HTTP).
 */
export class HlsPlayer implements IPlayer {
  private videoUrl: string = '';
  private resolucao: string = '';
  private carregador: ICarregadorSegmentos;
  private estado: 'PARADO' | 'REPRODUZINDO' | 'PAUSADO' | 'FINALIZADO' = 'PARADO';
  private posicaoSegundos: number = 0;
  private variantes: VarianteHls[] = [];
  private segmentosReproduzidos: string[] = [];

  constructor(videoUrl: string, carregador: ICarregadorSegmentos) {
    this.videoUrl = videoUrl;
    this.carregador = carregador;
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

  public getResolucoesDisponiveis(): string[] {
    return this.variantes.map((v) => v.resolucao);
  }

  public getSegmentosReproduzidos(): string[] {
    return [...this.segmentosReproduzidos];
  }

  /**
   * Reproduz o vídeo segmento a segmento a partir da posição atual.
   * Se a resolução for trocada durante a reprodução, o player passa para a nova variante
   * na mesma posição (comutação de qualidade, como no hls.js).
   */
  public async reproduzir(): Promise<string> {
    if (!this.videoUrl) {
      throw new Error('Não é possível reproduzir: videoUrl não definida.');
    }

    if (this.variantes.length === 0) {
      const master = (await this.carregador.baixarSegmento(this.videoUrl));
      this.variantes = this.lerMasterPlaylist(master);
      if (this.variantes.length === 0) {
        throw new Error(`Master Playlist sem variantes: ${this.videoUrl}`);
      }
    }

    if (!this.resolucao) {
      this.resolucao = this.variantes[0].resolucao;
    }

    this.estado = 'REPRODUZINDO';
    let duracaoTotal = 0;
    let baixadosAgora = 0;

    while (this.estado === 'REPRODUZINDO') {
      const resolucaoAtual = this.resolucao;
      const variante = this.obterVariante(resolucaoAtual);
      const urlVariante = this.resolverUrl(this.videoUrl, variante.uri);
      const playlist = (await this.carregador.baixarSegmento(urlVariante));
      const segmentos = this.lerPlaylistVariante(playlist);
      duracaoTotal = segmentos.reduce((total, s) => total + s.duracao, 0);

      // Encontra o segmento correspondente à posição atual
      let inicio = 0;
      let acumulado = 0;
      while (inicio < segmentos.length && acumulado + segmentos[inicio].duracao <= this.posicaoSegundos) {
        acumulado += segmentos[inicio].duracao;
        inicio++;
      }

      let trocouResolucao = false;
      for (let i = inicio; i < segmentos.length; i++) {
        if (this.estado !== 'REPRODUZINDO') break;
        if (this.resolucao !== resolucaoAtual) {
          trocouResolucao = true;
          break;
        }

        const urlSegmento = this.resolverUrl(urlVariante, segmentos[i].uri);
        await this.carregador.baixarSegmento(urlSegmento);
        this.segmentosReproduzidos.push(`${resolucaoAtual}/${segmentos[i].uri}`);
        this.posicaoSegundos = acumulado + segmentos[i].duracao;
        acumulado = this.posicaoSegundos;
        baixadosAgora++;
      }

      if (!trocouResolucao && this.estado === 'REPRODUZINDO') {
        this.estado = 'FINALIZADO';
      }
    }

    return `HLS ${this.resolucao}: ${baixadosAgora} segmentos reproduzidos (posição ${this.posicaoSegundos.toFixed(1)}s de ${duracaoTotal.toFixed(1)}s)`;
  }

  public pausar(): void {
    if (this.estado === 'REPRODUZINDO') {
      this.estado = 'PAUSADO';
    }
  }

  public buscar(segundos: number): void {
    this.posicaoSegundos = Math.max(0, segundos);
    if (this.estado === 'FINALIZADO') {
      this.estado = 'PAUSADO';
    }
  }

  public setResolucao(resolucao: string): void {
    if (this.variantes.length > 0) {
      this.obterVariante(resolucao); // valida se a resolução existe na Master Playlist
    }
    this.resolucao = resolucao;
  }

  private obterVariante(resolucao: string): VarianteHls {
    const variante = this.variantes.find((v) => v.resolucao === resolucao);
    if (!variante) {
      throw new Error(
        `Resolução ${resolucao} indisponível. Disponíveis: ${this.getResolucoesDisponiveis().join(', ')}`,
      );
    }
    return variante;
  }

  /**
   * Lê a Master Playlist (RFC 8216) e retorna as variantes (NAME + caminho da sub-playlist).
   */
  private lerMasterPlaylist(conteudo: string): VarianteHls[] {
    const linhas = conteudo.split(/\r?\n/).map((l) => l.trim());
    const variantes: VarianteHls[] = [];

    for (let i = 0; i < linhas.length; i++) {
      if (!linhas[i].startsWith('#EXT-X-STREAM-INF')) continue;
      const nome = linhas[i].match(/NAME="([^"]+)"/);
      const altura = linhas[i].match(/RESOLUTION=\d+x(\d+)/);
      const uri = linhas[i + 1];
      if (uri && !uri.startsWith('#')) {
        variantes.push({
          resolucao: nome ? nome[1] : altura ? `${altura[1]}p` : uri,
          uri,
        });
      }
    }
    return variantes;
  }

  /**
   * Lê a playlist de uma variante e retorna a lista de segmentos com suas durações.
   */
  private lerPlaylistVariante(conteudo: string): SegmentoHls[] {
    const linhas = conteudo.split(/\r?\n/).map((l) => l.trim());
    const segmentos: SegmentoHls[] = [];

    for (let i = 0; i < linhas.length; i++) {
      const match = linhas[i].match(/^#EXTINF:([\d.]+)/);
      if (match && linhas[i + 1] && !linhas[i + 1].startsWith('#')) {
        segmentos.push({ duracao: parseFloat(match[1]), uri: linhas[i + 1] });
      }
    }
    return segmentos;
  }

  private resolverUrl(base: string, relativo: string): string {
    if (/^https?:\/\//i.test(relativo)) return relativo;
    if (/^https?:\/\//i.test(base)) return new URL(relativo, base).toString();
    return path.resolve(path.dirname(base), relativo);
  }
}
