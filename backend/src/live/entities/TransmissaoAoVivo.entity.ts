import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';
import { ContextoFluxo } from '../dto/contexto-fluxo.dto';

export class TransmissaoAoVivo {
  id: string;
  chaveTransmissao: string;
  rtmpUrl: string;
  hlsUrl: string;
  status: StatusEtapaPipeline;
  mensagemErro?: string;

  constructor(id: string, chaveTransmissao: string, rtmpUrl: string = '') {
    this.id = id;
    this.chaveTransmissao = chaveTransmissao;
    this.rtmpUrl = rtmpUrl;
    this.hlsUrl = '';
    this.status = StatusEtapaPipeline.RECEBIDO;
  }

  sincronizarComContexto(contexto: ContextoFluxo): void {
    this.status = contexto.statusAtual;
    this.rtmpUrl = contexto.rtmpUrl;
    this.hlsUrl = contexto.hlsUrl;
    this.mensagemErro = contexto.mensagemErro;
  }
}
