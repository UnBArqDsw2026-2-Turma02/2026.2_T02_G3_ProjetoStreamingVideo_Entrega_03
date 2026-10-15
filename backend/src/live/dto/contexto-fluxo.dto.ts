import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';

export class ContextoFluxo {
  idTransmissao: string;
  chaveTransmissao: string;
  rtmpUrl: string;
  hlsUrl: string;
  statusAtual: StatusEtapaPipeline;
  mensagemErro?: string;

  obterStatus(): StatusEtapaPipeline {
    return this.statusAtual;
  }

  atualizarStatus(novoStatus: StatusEtapaPipeline): void {}
}