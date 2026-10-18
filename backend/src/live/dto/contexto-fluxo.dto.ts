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

  atualizarStatus(novoStatus: StatusEtapaPipeline, mensagemErro?: string): void {
    this.statusAtual = novoStatus;
    if (mensagemErro) {
      this.mensagemErro = mensagemErro;
    }
  }
}