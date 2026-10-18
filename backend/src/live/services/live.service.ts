import { Injectable, Logger } from '@nestjs/common';
import { IniciarLiveDto } from '../dto/iniciar-live.dto';
import { ContextoFluxo } from '../dto/contexto-fluxo.dto';
import { GerenciadorDeAutenticacaoDeIngestao } from '../pipeline/1-GerenciadorDeAutenticacaoDeIngestao';
import { GerenciadorDeTranscodificacao } from '../pipeline/2-GerenciadorDeTranscodificacao';
import { GerenciadorDeDistribuicaoHls } from '../pipeline/3-GerenciadorDeDistribuicaoHls';
import { TransmissaoAoVivo } from '../entities/TransmissaoAoVivo.entity';

@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(
    private readonly authHandler: GerenciadorDeAutenticacaoDeIngestao,
    private readonly transcodeHandler: GerenciadorDeTranscodificacao,
    private readonly deliveryHandler: GerenciadorDeDistribuicaoHls,
  ) {}

  async iniciar(dto: IniciarLiveDto): Promise<TransmissaoAoVivo> {
    this.logger.log(`Recebida requisição para iniciar live: ${dto.idTransmissao}`);

    const transmissao = new TransmissaoAoVivo(
      dto.idTransmissao,
      dto.chaveTransmissao,
      dto.rtmpUrl || '',
    );

    const contexto = new ContextoFluxo();
    contexto.idTransmissao = transmissao.id;
    contexto.chaveTransmissao = transmissao.chaveTransmissao;
    contexto.rtmpUrl = transmissao.rtmpUrl;
    contexto.hlsUrl = '';
    contexto.atualizarStatus(transmissao.status);

    this.authHandler
      .definirProximo(this.transcodeHandler)
      .definirProximo(this.deliveryHandler);

    const sucesso = await this.authHandler.processar(contexto);

    transmissao.sincronizarComContexto(contexto);

    if (sucesso) {
      this.logger.log(`Live ${transmissao.id} ativa e distribuída com sucesso.`);
    } else {
      this.logger.warn(
        `Live ${transmissao.id} não pôde ser iniciada. Estado: ${transmissao.status}. Motivo: ${transmissao.mensagemErro}`,
      );
    }

    return transmissao;
  }
}