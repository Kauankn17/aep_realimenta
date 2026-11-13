import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ParticipantesService } from './participantes.service';
import {
  AtualizarParticipanteDto,
  CriarDoadorDto,
  CriarReceptoraDto,
  ValidarReceptoraDto,
} from './dto/participante.dto';

@Controller('participantes')
export class ParticipantesController {
  constructor(private readonly participantesService: ParticipantesService) {}

  /** GET /api/participantes - lista polimorfica (doadores + receptoras). */
  @Get()
  listarTodos() {
    return this.participantesService.listarTodos();
  }

  @Get('doadores')
  listarDoadores() {
    return this.participantesService.listarDoadores();
  }

  @Get('receptoras')
  listarReceptoras() {
    return this.participantesService.listarReceptoras();
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.participantesService.buscarPorId(id);
  }

  /** REQ01 */
  @Post('doadores')
  criarDoador(@Body() dto: CriarDoadorDto) {
    return this.participantesService.criarDoador(dto);
  }

  /** REQ02 */
  @Post('receptoras')
  criarReceptora(@Body() dto: CriarReceptoraDto) {
    return this.participantesService.criarReceptora(dto);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarParticipanteDto,
  ) {
    return this.participantesService.atualizar(id, dto);
  }

  /** REQ03 */
  @Patch('receptoras/:id/validacao')
  validarReceptora(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ValidarReceptoraDto,
  ) {
    return this.participantesService.validarReceptora(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.participantesService.remover(id);
  }
}
