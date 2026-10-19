import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ManipuladorDeFluxo } from './ManipuladorDeFluxo';
import { ContextoFluxo } from '../dto/contexto-fluxo.dto';
import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';
import * as fs from 'fs';

@Injectable()
export class GerenciadorDeDistribuicaoHls extends ManipuladorDeFluxo {
  private readonly logger = new Logger(GerenciadorDeDistribuicaoHls.name);

  async processar(dados: ContextoFluxo): Promise<boolean> {
    this.logger.log(`Iniciando etapa de distribuição HLS para live ${dados.idTransmissao}`);

    try {
      if (!dados.hlsUrl) {
        const mensagem = 'Playlist HLS não foi informada pelo elo de transcodificação.';
        this.logger.error(mensagem);
        dados.atualizarStatus(StatusEtapaPipeline.FALHA_DISTRIBUICAO, mensagem);
        throw new BadRequestException(mensagem);
      }

      if (!fs.existsSync(dados.hlsUrl)) {
        const mensagem = `Arquivo do HLS não encontrado no caminho: ${dados.hlsUrl}`;
        this.logger.error(mensagem);
        dados.atualizarStatus(StatusEtapaPipeline.FALHA_DISTRIBUICAO, mensagem);
        throw new BadRequestException(mensagem);
      }

      const portaHls = process.env.HLS_PORT || '8000';
      const hostHls = process.env.HLS_HOST || 'localhost';
      const urlPublicaHls = `http://${hostHls}:${portaHls}/live/${dados.idTransmissao}/index.m3u8`;

      dados.hlsUrl = urlPublicaHls;
      dados.atualizarStatus(StatusEtapaPipeline.DISTRIBUIDO);

      this.logger.log(`Live distribuída com sucesso. URL de reprodução: ${urlPublicaHls}`);

      return await this.processarProximo(dados);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const mensagem = error?.message || 'Erro inesperado durante a distribuição HLS';
      this.logger.error(`Falha na etapa de distribuição HLS: ${mensagem}`);
      dados.atualizarStatus(StatusEtapaPipeline.FALHA_DISTRIBUICAO, mensagem);
      throw new BadRequestException(mensagem);
    }
  }
}