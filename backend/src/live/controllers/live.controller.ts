import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { LiveService } from '../services/live.service';
import { IniciarLiveDto } from '../dto/iniciar-live.dto';
import { StatusEtapaPipeline } from '../enums/status-etapa-pipeline.enum';

@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Post('iniciar')
  @HttpCode(HttpStatus.OK)
  async iniciar(@Body() dto: IniciarLiveDto) {
    if (!dto.idTransmissao || !dto.chaveTransmissao) {
      throw new BadRequestException('Os campos idTransmissao e chaveTransmissao são obrigatórios.');
    }

    const resultado = await this.liveService.iniciar(dto);

    if (resultado.statusAtual === StatusEtapaPipeline.DISTRIBUIDO) {
      return {
        sucesso: true,
        idTransmissao: resultado.idTransmissao,
        status: resultado.statusAtual,
        hlsUrl: resultado.hlsUrl,
      };
    }

    if (resultado.statusAtual === StatusEtapaPipeline.FALHA_AUTENTICACAO) {
      throw new UnauthorizedException({
        sucesso: false,
        status: resultado.statusAtual,
        erro: resultado.mensagemErro || 'Chave de transmissão inválida.',
      });
    }

    throw new BadRequestException({
      sucesso: false,
      status: resultado.statusAtual,
      erro: resultado.mensagemErro || 'Falha no processamento da esteira de transmissão.',
    });
  }
}