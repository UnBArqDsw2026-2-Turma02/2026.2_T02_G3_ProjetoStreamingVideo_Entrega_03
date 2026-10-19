import type { ICarregadorSegmentos } from '../interfaces/carregador-segmentos.interface';
import { HttpCarregadorSegmentos } from './http-carregador-segmentos';

/**
 * Representa o "enxame" (swarm) de espectadores conectados a um tracker.
 * Simulação em memória: cada espectador anuncia os segmentos que já baixou,
 * e os demais podem buscá-los dele em vez de pedir ao servidor.
 * (No PeerTube real, essa troca acontece entre navegadores via WebRTC.)
 */
class SwarmP2P {
  private static swarms = new Map<string, Map<string, { peerId: string; conteudo: string }>>();

  public static obter(trackerUrl: string): Map<string, { peerId: string; conteudo: string }> {
    if (!this.swarms.has(trackerUrl)) {
      this.swarms.set(trackerUrl, new Map());
    }
    return this.swarms.get(trackerUrl)!;
  }

  public static limpar(): void {
    this.swarms.clear();
  }
}

/**
 * Produto concreto B2 da família HLS (GoF Abstract Factory).
 * Busca os segmentos com outros espectadores (P2P) e, quando nenhum par possui o segmento,
 * baixa do servidor via HTTP (fallback) e o anuncia para os próximos espectadores.
 */
export class P2PCarregadorSegmentos implements ICarregadorSegmentos {
  private static contadorPeers: number = 0;

  private trackerUrl: string;
  private peerId: string;
  private fallbackHttp: HttpCarregadorSegmentos;
  private segmentosViaP2P: number = 0;
  private segmentosViaHttp: number = 0;

  constructor(trackerUrl: string = 'wss://tracker.peertube.local/tracker/socket') {
    this.trackerUrl = trackerUrl;
    this.peerId = `peer-${++P2PCarregadorSegmentos.contadorPeers}`;
    this.fallbackHttp = new HttpCarregadorSegmentos();
  }

  public async baixarSegmento(url: string): Promise<string> {
    const swarm = SwarmP2P.obter(this.trackerUrl);
    const anuncio = swarm.get(url);

    // 1. Outro espectador já possui o segmento: baixa dele (P2P)
    if (anuncio && anuncio.peerId !== this.peerId) {
      this.segmentosViaP2P++;
      return anuncio.conteudo;
    }

    // 2. Nenhum par disponível: baixa do servidor (fallback HTTP)
    const conteudo = await this.fallbackHttp.baixarSegmento(url);
    this.segmentosViaHttp++;

    // 3. Anuncia o segmento no swarm para os próximos espectadores
    if (!anuncio) {
      swarm.set(url, { peerId: this.peerId, conteudo });
    }

    return conteudo;
  }

  public getTrackerUrl(): string {
    return this.trackerUrl;
  }

  public getPeerId(): string {
    return this.peerId;
  }

  public getSegmentosViaP2P(): number {
    return this.segmentosViaP2P;
  }

  public getSegmentosViaHttp(): number {
    return this.segmentosViaHttp;
  }

  /**
   * Limpa todos os swarms simulados (útil para testes).
   */
  public static limparSwarms(): void {
    SwarmP2P.limpar();
  }
}
