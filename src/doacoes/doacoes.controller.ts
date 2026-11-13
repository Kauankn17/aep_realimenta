import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DoacoesService } from './doacoes.service';
import {
  AtualizarDoacaoDto,
  ConfirmarRetiradaDto,
  CriarDoacaoDto,
  ManifestarInteresseDto,
} from './dto/doacao.dto';
import { StatusDoacao } from './enums/status-doacao.enum';

@Controller('doacoes')
export class DoacoesController {
  constructor(private readonly doacoesService: DoacoesService) {}

  // ----------------------------------------------------- CRUD: READ (lista)
  @Get()
  listar(
    @Query('status') status?: StatusDoacao,
    @Query('doadorId') doadorId?: string,
  ) {
    return this.doacoesService.listar({
      status,
      doadorId: doadorId ? Number(doadorId) : undefined,
    });
  }

  /** Painel de impacto (ODS 2 e ODS 12). */
  @Get('impacto')
  painelDeImpacto() {
    return this.doacoesService.painelDeImpacto();
  }

  /** REQ05 */
  @Get('compativeis/:receptoraId')
  listarCompativeis(@Param('receptoraId', ParseIntPipe) receptoraId: number) {
    return this.doacoesService.listarCompativeisParaReceptora(receptoraId);
  }

  // -------------------------------------------------- CRUD: READ (por id)
  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.doacoesService.buscarPorId(id);
  }

  // ------------------------------------------------------- CRUD: CREATE
  /** REQ04 */
  @Post()
  criar(@Body() dto: CriarDoacaoDto) {
    return this.doacoesService.criar(dto);
  }

  // ------------------------------------------------------- CRUD: UPDATE
  /** REQ10 */
  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarDoacaoDto,
  ) {
    return this.doacoesService.atualizar(id, dto);
  }

  /** REQ08 (1a etapa) - organizacao manifesta interesse na doacao. */
  @Post(':id/manifestacoes')
  manifestarInteresse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ManifestarInteresseDto,
  ) {
    return this.doacoesService.manifestarInteresse(id, dto);
  }

  /** REQ07 e REQ08 (2a etapa) - aplica a priorizacao e reserva a doacao. */
  @Post(':id/priorizacao')
  resolverPriorizacao(@Param('id', ParseIntPipe) id: number) {
    return this.doacoesService.resolverPriorizacao(id);
  }

  /** REQ09 */
  @Post(':id/retirada')
  confirmarRetirada(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmarRetiradaDto,
  ) {
    return this.doacoesService.confirmarRetirada(id, dto);
  }

  @Patch(':id/cancelamento')
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.doacoesService.cancelar(id);
  }

  // ------------------------------------------------------- CRUD: DELETE
  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.doacoesService.remover(id);
  }
}
