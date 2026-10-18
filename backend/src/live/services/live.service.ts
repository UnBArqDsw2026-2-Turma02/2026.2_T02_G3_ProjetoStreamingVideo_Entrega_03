import { Injectable, Logger } from '@nestjs/common';
import { IniciarLiveDto } from '../dto/iniciar-live.dto';
import { ContextoFluxo } from '../dto/contexto-fluxo.dto';
import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';
import { GerenciadorDeAutenticacaoDeIngestao } from '../pipeline/1-GerenciadorDeAutenticacaoDeIngestao';
import { GerenciadorDeTranscodificacao } from '../pipeline/2-GerenciadorDeTranscodificacao';
import { GerenciadorDeDistribuicaoHls } from '../pipeline/3-GerenciadorDeDistribuicaoHls';
@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(
    private readonly authHandler: GerenciadorDeAutenticacaoDeIngestao,
    private readonly transcodeHandler: GerenciadorDeTranscodificacao,
    private readonly deliveryHandler: GerenciadorDeDistribuicaoHls,
  ) {}

  async iniciar(dto: IniciarLiveDto): Promise<ContextoFluxo> {
    this.logger.log(`Recebida requisição para iniciar live: ${dto.idTransmissao}`);

    const contexto = new ContextoFluxo();
    contexto.idTransmissao = dto.idTransmissao;
    contexto.chaveTransmissao = dto.chaveTransmissao;
    contexto.rtmpUrl = dto.rtmpUrl || '';
    contexto.hlsUrl = '';
    contexto.atualizarStatus(StatusEtapaPipeline.RECEBIDO);

    this.authHandler
      .definirProximo(this.transcodeHandler)
      .definirProximo(this.deliveryHandler);

    const sucesso = await this.authHandler.processar(contexto);

    if (sucesso) {
      this.logger.log(`Esteira de live ${dto.idTransmissao} concluída com sucesso.`);
    } else {
      this.logger.warn(
        `Esteira de live ${dto.idTransmissao} interrompida no estado ${contexto.statusAtual}. Motivo: ${contexto.mensagemErro}`,
      );
    }

    return contexto;
  }
}