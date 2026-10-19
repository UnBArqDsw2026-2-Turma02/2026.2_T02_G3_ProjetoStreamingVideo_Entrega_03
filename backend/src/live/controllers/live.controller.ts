import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LiveService } from '../services/live.service';
import { IniciarLiveDto } from '../dto/iniciar-live.dto';

@Controller(['live', 'api/live'])
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get('status')
  obterStatus() {
    return this.liveService.obterStatusAoVivo();
  }

  @Post('iniciar')
  @HttpCode(HttpStatus.OK)
  async iniciar(@Body() dto: IniciarLiveDto) {
    const transmissao = await this.liveService.iniciar(dto);
    return {
      sucesso: true,
      transmissao,
    };
  }

  @Post('encerrar')
  @HttpCode(HttpStatus.OK)
  async encerrar(@Body() body: { idTransmissao: string }) {
    const resultado = this.liveService.encerrar(body.idTransmissao);
    return {
      ...resultado,
      mensagem: resultado.sucesso ? 'Transmissão encerrada com sucesso.' : 'Nenhum processo ativo para esse ID.',
    };
  }
}