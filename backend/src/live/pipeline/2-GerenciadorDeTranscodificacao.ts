import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ManipuladorDeFluxo } from './ManipuladorDeFluxo';
import { ContextoFluxo } from '../dto/contexto-fluxo.dto';
import { FFmpegService } from '../services/ffmpeg.service';
import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';

@Injectable()
export class GerenciadorDeTranscodificacao extends ManipuladorDeFluxo {
  private readonly logger = new Logger(GerenciadorDeTranscodificacao.name);
  constructor(private readonly ffmpegService: FFmpegService) {
    super();
  }
  async processar(dados: ContextoFluxo): Promise<boolean> {
    this.logger.log(`Iniciando etapa de transcodificação para live ${dados.idTransmissao}`);
    try {
      const playlistMaster = await this.ffmpegService.iniciarTranscodificacao(
        dados.idTransmissao,
        dados.rtmpUrl,
      );
      dados.hlsUrl = playlistMaster;
      dados.atualizarStatus(StatusEtapaPipeline.TRANSCODIFICADO);
      this.logger.log(`Transcodificação iniciada com sucesso. Avançando para o próximo elo.`);
      return await this.processarProximo(dados);
    } catch (error: any) {
      const mensagem = error?.message || 'Erro durante o processo de transcodificação.';
      this.logger.error(`Falha na etapa de transcodificação: ${mensagem}`);
      dados.atualizarStatus(StatusEtapaPipeline.FALHA_TRANSCODIFICACAO, mensagem);
      throw new BadRequestException(mensagem);
    }
  }
}
