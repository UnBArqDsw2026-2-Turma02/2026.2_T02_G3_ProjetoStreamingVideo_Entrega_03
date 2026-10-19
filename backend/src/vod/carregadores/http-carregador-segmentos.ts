import * as fs from 'fs';
import type { ICarregadorSegmentos } from '../interfaces/carregador-segmentos.interface';

/**
 * Produto concreto B1 da família WebVideo (GoF Abstract Factory).
 * Baixa os dados diretamente do servidor: via HTTP quando a URL é remota,
 * ou lendo do disco quando é um caminho local (como os arquivos gerados pela transcodificação).
 */
export class HttpCarregadorSegmentos implements ICarregadorSegmentos {
  private totalRequisicoes: number = 0;
  private totalBytes: number = 0;

  public async baixarSegmento(url: string): Promise<string> {
    let conteudo: Buffer;

    if (/^https?:\/\//i.test(url)) {
      const resposta = await fetch(url);
      if (!resposta.ok) {
        throw new Error(`Falha ao baixar ${url}: HTTP ${resposta.status}`);
      }
      conteudo = Buffer.from(await resposta.arrayBuffer());
    } else {
      if (!fs.existsSync(url)) {
        throw new Error(`Recurso de vídeo não encontrado: ${url}`);
      }
      conteudo = await fs.promises.readFile(url);
    }

    this.totalRequisicoes++;
    this.totalBytes += conteudo.length;
    // 'latin1' mapeia cada byte para um caractere, então o conteúdo binário não se perde
    return conteudo.toString('latin1');
  }

  public getTotalRequisicoes(): number {
    return this.totalRequisicoes;
  }

  public getTotalBytes(): number {
    return this.totalBytes;
  }
}
