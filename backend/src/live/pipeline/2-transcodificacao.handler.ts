import { Injectable, Logger } from '@nestjs/common';
import { ManipuladorDeFluxo } from './manipulador-de-fluxo.base';
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
      //caminho provisório ou master que o próximo elo utilizará
      dados.hlsUrl = playlistMaster;
      dados.atualizarStatus(StatusEtapaPipeline.TRANSCODIFICADO);
      this.logger.log(`Transcodificação iniciada com sucesso. Avançando para o próximo elo.`);
      return await this.processarProximo(dados);
    } catch (error: any) {
      this.logger.error(`Falha na etapa de transcodificação: ${error?.message}`);
      dados.atualizarStatus(
        StatusEtapaPipeline.FALHA_TRANSCODIFICACAO,
        error?.message || 'Erro desconhecido durante o processo de transcodificação',
      );
      return false; 
    }
  }
}
