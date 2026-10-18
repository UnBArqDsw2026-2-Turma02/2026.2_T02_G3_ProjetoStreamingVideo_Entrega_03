import { Injectable, Logger } from '@nestjs/common';
import { ManipuladorDeFluxo } from './ManipuladorDeFluxo';
import { ContextoFluxo } from '../dto/contexto-fluxo.dto';
import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';

@Injectable()
export class GerenciadorDeAutenticacaoDeIngestao extends ManipuladorDeFluxo {
  private readonly logger = new Logger(GerenciadorDeAutenticacaoDeIngestao.name);

  async processar(dados: ContextoFluxo): Promise<boolean> {
    this.logger.log(`Iniciando etapa de autenticação de ingestão para live: ${dados.idTransmissao}`);

    try {
      if (!dados.idTransmissao || dados.idTransmissao.trim() === '') {
        const mensagem = 'Identificador da transmissão (idTransmissao) não fornecido.';
        this.logger.error(mensagem);
        dados.atualizarStatus(StatusEtapaPipeline.FALHA_AUTENTICACAO, mensagem);
        return false;
      }

      if (!dados.chaveTransmissao || dados.chaveTransmissao.trim() === '') {
        const mensagem = 'Chave de transmissão não fornecida ou inválida.';
        this.logger.error(mensagem);
        dados.atualizarStatus(StatusEtapaPipeline.FALHA_AUTENTICACAO, mensagem);
        return false;
      }

      if (dados.chaveTransmissao.trim().length < 4) {
        const mensagem = 'Chave de transmissão recusada: comprimento mínimo não atendido.';
        this.logger.error(mensagem);
        dados.atualizarStatus(StatusEtapaPipeline.FALHA_AUTENTICACAO, mensagem);
        return false;
      }

      const portaRtmp = process.env.RTMP_PORT || '1935';
      const hostRtmp = process.env.RTMP_HOST || 'localhost';
      dados.rtmpUrl = dados.rtmpUrl || `rtmp://${hostRtmp}:${portaRtmp}/live/${dados.idTransmissao}`;

      dados.atualizarStatus(StatusEtapaPipeline.AUTENTICADO);
      this.logger.log(
        `Transmissão ${dados.idTransmissao} autenticada com sucesso. Canal RTMP: ${dados.rtmpUrl}`,
      );

      return await this.processarProximo(dados);
    } catch (error: any) {
      const mensagem = error?.message || 'Erro inesperado durante a autenticação de ingestão.';
      this.logger.error(`Falha inesperada no Elo 1: ${mensagem}`);
      dados.atualizarStatus(StatusEtapaPipeline.FALHA_AUTENTICACAO, mensagem);
      return false;
    }
  }
}