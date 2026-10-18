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

    const transmissao = await this.liveService.iniciar(dto);

    if (transmissao.status === StatusEtapaPipeline.DISTRIBUIDO) {
      return {
        sucesso: true,
        transmissao,
      };
    }

    if (transmissao.status === StatusEtapaPipeline.FALHA_AUTENTICACAO) {
      throw new UnauthorizedException({
        sucesso: false,
        status: transmissao.status,
        erro: transmissao.mensagemErro || 'Chave de transmissão inválida.',
      });
    }

    throw new BadRequestException({
      sucesso: false,
      status: transmissao.status,
      erro: transmissao.mensagemErro || 'Falha no processamento da esteira de transmissão.',
    });
  }
}