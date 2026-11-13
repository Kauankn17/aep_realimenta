import { Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service';

/** REQ06 - consulta das notificacoes enviadas as organizacoes receptoras. */
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  listarTodas() {
    return this.notificacoesService.listarTodas();
  }

  @Get('receptora/:receptoraId')
  listarPorReceptora(@Param('receptoraId', ParseIntPipe) receptoraId: number) {
    return this.notificacoesService.listarPorReceptora(receptoraId);
  }

  @Patch(':id/leitura')
  marcarComoLida(@Param('id', ParseIntPipe) id: number) {
    return this.notificacoesService.marcarComoLida(id);
  }
}
