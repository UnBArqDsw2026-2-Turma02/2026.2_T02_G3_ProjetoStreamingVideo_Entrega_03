import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';

export class TransmissaoAoVivo {
  id: string;
  chaveTransmissao: string;
  rtmpUrl: string;
  hlsUrl: string;
  status: StatusEtapaPipeline;
  mensagemErro?: string;
  inicioPrevisto?: Date;
  iniciadaEm?: Date;
  encerradaEm?: Date;

  constructor(id: string, chaveTransmissao: string, rtmpUrl: string = '') {
    this.id = id;
    this.chaveTransmissao = chaveTransmissao;
    this.rtmpUrl = rtmpUrl;
    this.hlsUrl = '';
    this.status = StatusEtapaPipeline.RECEBIDO;
  }

  iniciar(): void {
    this.iniciadaEm = new Date();
  }

  encerrar(): void {
    this.encerradaEm = new Date();
  }

  validarChave(chave: string): boolean {
    return Boolean(chave && this.chaveTransmissao === chave.trim());
  }
}
