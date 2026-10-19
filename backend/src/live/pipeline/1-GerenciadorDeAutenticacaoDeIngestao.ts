import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ManipuladorDeFluxo } from './ManipuladorDeFluxo';
import { ContextoFluxo } from '../dto/contexto-fluxo.dto';
import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';
import { PrismaService } from '../../core/database/prisma.service';
import { TransmissaoAoVivo } from '../entities/TransmissaoAoVivo.entity';

@Injectable()
export class GerenciadorDeAutenticacaoDeIngestao extends ManipuladorDeFluxo {
  private readonly logger = new Logger(GerenciadorDeAutenticacaoDeIngestao.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async processar(dados: ContextoFluxo): Promise<boolean> {
    this.logger.log(`Iniciando etapa de autenticação de ingestão para live: ${dados.idTransmissao}`);

    try {
      if (!dados.chaveTransmissao || dados.chaveTransmissao.trim() === '') {
        const mensagem = 'Chave de transmissão não fornecida ou vazia.';
        this.logger.error(mensagem);
        dados.atualizarStatus(StatusEtapaPipeline.FALHA_AUTENTICACAO, mensagem);
        throw new UnauthorizedException(mensagem);
      }

      const transmissaoBanco = await this.prisma.transmissaoAoVivo.findUnique({
        where: { chaveTransmissao: dados.chaveTransmissao.trim() },
      });

      if (!transmissaoBanco) {
        const mensagem = `Chave de transmissão '${dados.chaveTransmissao}' não autorizada ou inexistente no banco.`;
        this.logger.error(mensagem);
        dados.atualizarStatus(StatusEtapaPipeline.FALHA_AUTENTICACAO, mensagem);
        throw new UnauthorizedException(mensagem);
      }

      const entidadeTransmissao = new TransmissaoAoVivo(
        transmissaoBanco.id,
        transmissaoBanco.chaveTransmissao,
      );

      if (!entidadeTransmissao.validarChave(dados.chaveTransmissao)) {
        const mensagem = `Chave de transmissão '${dados.chaveTransmissao}' inválida para o canal.`;
        this.logger.error(mensagem);
        dados.atualizarStatus(StatusEtapaPipeline.FALHA_AUTENTICACAO, mensagem);
        throw new UnauthorizedException(mensagem);
      }

      if (!dados.idTransmissao || dados.idTransmissao.trim() === '') {
        dados.idTransmissao = `live-${Date.now()}`;
      }

      const portaRtmp = process.env.RTMP_PORT || '1935';
      const hostRtmp = process.env.RTMP_HOST || 'localhost';
      dados.rtmpUrl = `rtmp://${hostRtmp}:${portaRtmp}/live/${dados.chaveTransmissao}`;

      dados.atualizarStatus(StatusEtapaPipeline.AUTENTICADO);
      this.logger.log(
        `Transmissão '${dados.idTransmissao}' autenticada com sucesso no PostgreSQL! Canal RTMP: ${dados.rtmpUrl}`,
      );

      return await this.processarProximo(dados);
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const mensagem = error?.message || 'Erro inesperado durante a autenticação de ingestão.';
      this.logger.error(`Falha inesperada no Elo 1: ${mensagem}`);
      dados.atualizarStatus(StatusEtapaPipeline.FALHA_AUTENTICACAO, mensagem);
      throw new UnauthorizedException(mensagem);
    }
  }
}