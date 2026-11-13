import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { Doacao } from './entities/doacao.entity';
import { ManifestacaoInteresse } from './entities/manifestacao-interesse.entity';
import { RegistroRetirada } from './entities/registro-retirada.entity';
import { StatusDoacao } from './enums/status-doacao.enum';
import {
  AtualizarDoacaoDto,
  ConfirmarRetiradaDto,
  CriarDoacaoDto,
  ManifestarInteresseDto,
} from './dto/doacao.dto';
import { ParticipantesService } from '../participantes/participantes.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { distanciaEmKm } from '../common/geo/haversine';
import { RegraDePriorizacao } from './regras/regra-de-priorizacao.interface';
import { PriorizacaoPorProximidade } from './regras/priorizacao';

/** Indicadores de impacto usados no relatorio (ODS 2 e ODS 12). */
const REFEICOES_POR_KG = 2;
const CO2_EVITADO_POR_KG = 2.5;

@Injectable()
export class DoacoesService {
  /**
   * PILAR DE POO - PROGRAMACAO ORIENTADA A INTERFACE
   *
   * O servico depende do CONTRATO `RegraDePriorizacao`, nao de uma classe
   * concreta. Trocar a politica de desempate do REQ08 e trocar esta linha,
   * sem alterar mais nada no restante do codigo.
   */
  private readonly regraDePriorizacao: RegraDePriorizacao = new PriorizacaoPorProximidade();

  constructor(
    @InjectRepository(Doacao)
    private readonly doacaoRepository: Repository<Doacao>,
    @InjectRepository(ManifestacaoInteresse)
    private readonly manifestacaoRepository: Repository<ManifestacaoInteresse>,
    @InjectRepository(RegistroRetirada)
    private readonly registroRepository: Repository<RegistroRetirada>,
    private readonly participantesService: ParticipantesService,
    private readonly notificacoesService: NotificacoesService,
    private readonly dataSource: DataSource,
  ) {}

  // ---------------------------------------------------------------- CREATE
  /** REQ04 - publicacao de doacao + REQ06 - notificacao automatica. */
  async criar(dto: CriarDoacaoDto): Promise<Doacao> {
    const doador = await this.participantesService.buscarDoador(dto.doadorId);

    const validadeAte = new Date(dto.validadeAte);
    const horarioLimiteRetirada = new Date(dto.horarioLimiteRetirada);

    if (horarioLimiteRetirada.getTime() > validadeAte.getTime()) {
      throw new BadRequestException(
        'O horario-limite de retirada nao pode ser posterior a validade do alimento.',
      );
    }

    const doacao = this.doacaoRepository.create({
      doadorId: doador.id,
      tipoAlimento: dto.tipoAlimento,
      descricao: dto.descricao,
      quantidadeEstimadaKg: dto.quantidadeEstimadaKg,
      validadeAte,
      horarioLimiteRetirada,
      localRetirada: dto.localRetirada,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: StatusDoacao.DISPONIVEL,
    });

    const salva = await this.doacaoRepository.save(doacao);
    const completa = await this.buscarPorId(salva.id);

    // REQ06 - dispara as notificacoes para as receptoras compativeis.
    await this.notificacoesService.notificarReceptorasCompativeis(completa);

    return completa;
  }

  // ------------------------------------------------------------------ READ
  /** REQ10 - visualizacao das doacoes, com filtros opcionais. */
  async listar(filtros: { status?: StatusDoacao; doadorId?: number } = {}): Promise<Doacao[]> {
    await this.expirarDoacoesVencidas();

    const where: Record<string, unknown> = {};
    if (filtros.status) where.status = filtros.status;
    if (filtros.doadorId) where.doadorId = filtros.doadorId;

    return this.doacaoRepository.find({
      where,
      order: { criadoEm: 'DESC' },
      relations: { manifestacoes: true, registroRetirada: true },
    });
  }

  async buscarPorId(id: number): Promise<Doacao> {
    const doacao = await this.doacaoRepository.findOne({
      where: { id },
      relations: { manifestacoes: true, registroRetirada: true, notificacoes: true },
    });
    if (!doacao) {
      throw new NotFoundException(`Doacao ${id} nao encontrada.`);
    }
    return doacao;
  }

  /**
   * REQ05 - consulta das doacoes disponiveis compativeis com a localizacao e
   * o perfil de atendimento da organizacao receptora.
   */
  async listarCompativeisParaReceptora(receptoraId: number): Promise<Array<Record<string, unknown>>> {
    await this.expirarDoacoesVencidas();

    const receptora = await this.participantesService.buscarReceptora(receptoraId);

    if (!receptora.podeReivindicarDoacoes()) {
      throw new ForbiddenException(
        'Organizacao receptora ainda nao validada pela plataforma (REQ03).',
      );
    }

    const disponiveis = await this.doacaoRepository.find({
      where: { status: StatusDoacao.DISPONIVEL },
      relations: { manifestacoes: true },
    });

    return disponiveis
      .map((doacao) => ({ doacao, distanciaKm: distanciaEmKm(receptora, doacao) }))
      .filter(({ distanciaKm }) => distanciaKm <= (receptora.raioAtuacaoKm ?? 0))
      .sort((a, b) => a.distanciaKm - b.distanciaKm)
      .map(({ doacao, distanciaKm }) => ({
        ...doacao,
        distanciaKm,
        jaManifestouInteresse: (doacao.manifestacoes ?? []).some(
          (manifestacao) => manifestacao.receptoraId === receptoraId,
        ),
      }));
  }

  // ---------------------------------------------------------------- UPDATE
  /** REQ10 - atualizacao dos dados de uma doacao cadastrada. */
  async atualizar(id: number, dto: AtualizarDoacaoDto): Promise<Doacao> {
    const doacao = await this.buscarPorId(id);

    if ([StatusDoacao.RETIRADA, StatusDoacao.CANCELADA].includes(doacao.status)) {
      throw new ConflictException(
        `Doacao com status ${doacao.status} nao pode mais ser alterada.`,
      );
    }

    const validadeAte = dto.validadeAte ? new Date(dto.validadeAte) : doacao.validadeAte;
    const horarioLimiteRetirada = dto.horarioLimiteRetirada
      ? new Date(dto.horarioLimiteRetirada)
      : doacao.horarioLimiteRetirada;

    if (horarioLimiteRetirada.getTime() > validadeAte.getTime()) {
      throw new BadRequestException(
        'O horario-limite de retirada nao pode ser posterior a validade do alimento.',
      );
    }

    Object.assign(doacao, {
      tipoAlimento: dto.tipoAlimento ?? doacao.tipoAlimento,
      descricao: dto.descricao ?? doacao.descricao,
      quantidadeEstimadaKg: dto.quantidadeEstimadaKg ?? doacao.quantidadeEstimadaKg,
      validadeAte,
      horarioLimiteRetirada,
      localRetirada: dto.localRetirada ?? doacao.localRetirada,
      latitude: dto.latitude ?? doacao.latitude,
      longitude: dto.longitude ?? doacao.longitude,
    });

    // Reabre a doacao caso ela tenha expirado e o doador tenha estendido o prazo.
    if (doacao.status === StatusDoacao.EXPIRADA && !doacao.estaVencida()) {
      doacao.status = StatusDoacao.DISPONIVEL;
    }

    await this.doacaoRepository.save(doacao);
    return this.buscarPorId(id);
  }

  /**
   * REQ08 (1a etapa) - a organizacao receptora MANIFESTA INTERESSE na doacao.
   *
   * A doacao permanece DISPONIVEL enquanto a janela de manifestacao esta
   * aberta, justamente para que "duas ou mais organizacoes" possam se
   * candidatar. A definicao de quem fica com a doacao acontece na 2a etapa,
   * em `resolverPriorizacao`.
   */
  async manifestarInteresse(id: number, dto: ManifestarInteresseDto): Promise<Doacao> {
    const doacao = await this.buscarPorId(id);
    const receptora = await this.participantesService.buscarReceptora(dto.receptoraId);

    // REQ03 - regra de negocio aplicada via POLIMORFISMO.
    if (!receptora.podeReivindicarDoacoes()) {
      throw new ForbiddenException(
        'Somente organizacoes receptoras validadas podem reivindicar doacoes (REQ03).',
      );
    }

    if (!doacao.podeSerReivindicada()) {
      throw new ConflictException(
        `Doacao indisponivel para reivindicacao (status atual: ${doacao.status}).`,
      );
    }

    const jaManifestou = await this.manifestacaoRepository.findOne({
      where: { doacaoId: id, receptoraId: receptora.id },
    });
    if (jaManifestou) {
      throw new ConflictException('Esta organizacao ja manifestou interesse nesta doacao.');
    }

    await this.manifestacaoRepository.save(
      this.manifestacaoRepository.create({
        doacaoId: doacao.id,
        receptoraId: receptora.id,
        distanciaKm: distanciaEmKm(receptora, doacao),
      }),
    );

    return this.buscarPorId(doacao.id);
  }

  /**
   * REQ07 e REQ08 (2a etapa) - encerra a janela de manifestacao e define a
   * organizacao vencedora aplicando a regra de priorizacao: menor distancia
   * ate o ponto de retirada e, em caso de empate, ordem de manifestacao.
   *
   * A doacao passa a RESERVADA e, conforme a regra de negocio da 1a entrega,
   * deixa de ser exibida as demais organizacoes.
   */
  async resolverPriorizacao(id: number): Promise<Doacao> {
    const doacao = await this.buscarPorId(id);

    if (!doacao.podeSerReivindicada()) {
      throw new ConflictException(
        `Doacao indisponivel para reserva (status atual: ${doacao.status}).`,
      );
    }

    const manifestacoes = await this.manifestacaoRepository.find({ where: { doacaoId: id } });

    if (manifestacoes.length === 0) {
      throw new ConflictException(
        'Nenhuma organizacao manifestou interesse nesta doacao ate o momento.',
      );
    }

    // POLIMORFISMO: a ordenacao concreta depende da estrategia injetada.
    const [vencedora] = this.regraDePriorizacao.ordenar(manifestacoes);

    await this.doacaoRepository.update(
      { id },
      { receptoraId: vencedora.receptoraId, status: StatusDoacao.RESERVADA },
    );

    return this.buscarPorId(id);
  }

  /**
   * REQ09 - confirmacao da retirada e geracao do registro imutavel.
   * Executado dentro de uma TRANSACAO: ou a doacao e marcada como retirada e
   * o registro e criado, ou nada e gravado.
   */
  async confirmarRetirada(id: number, dto: ConfirmarRetiradaDto): Promise<RegistroRetirada> {
    const doacao = await this.buscarPorId(id);

    if (doacao.status !== StatusDoacao.RESERVADA || !doacao.receptoraId) {
      throw new ConflictException(
        'Somente doacoes reservadas por uma organizacao podem ter a retirada confirmada (REQ07).',
      );
    }

    if (doacao.registroRetirada) {
      throw new ConflictException('Esta doacao ja possui registro de retirada.');
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.update(Doacao, { id }, { status: StatusDoacao.RETIRADA });

      const registro = manager.create(RegistroRetirada, {
        doacaoId: doacao.id,
        doadorId: doacao.doadorId,
        receptoraId: doacao.receptoraId as number,
        quantidadeRetiradaKg: dto.quantidadeRetiradaKg,
        refeicoesEquivalentes: Math.round(dto.quantidadeRetiradaKg * REFEICOES_POR_KG),
        co2EvitadoKg: Number((dto.quantidadeRetiradaKg * CO2_EVITADO_POR_KG).toFixed(2)),
      });

      return manager.save(RegistroRetirada, registro);
    });
  }

  async cancelar(id: number): Promise<Doacao> {
    const doacao = await this.buscarPorId(id);
    if (doacao.status === StatusDoacao.RETIRADA) {
      throw new ConflictException('Uma doacao ja retirada nao pode ser cancelada.');
    }
    await this.doacaoRepository.update({ id }, { status: StatusDoacao.CANCELADA });
    return this.buscarPorId(id);
  }

  // ---------------------------------------------------------------- DELETE
  /**
   * Exclusao de uma doacao. Doacoes ja retiradas nao sao excluidas, porque o
   * registro de retirada e imutavel e serve de base para auditoria.
   */
  async remover(id: number): Promise<{ removido: number }> {
    const doacao = await this.buscarPorId(id);

    if (doacao.status === StatusDoacao.RETIRADA) {
      throw new ConflictException(
        'Doacao ja retirada nao pode ser excluida (registro de auditoria imutavel).',
      );
    }

    await this.doacaoRepository.remove(doacao);
    return { removido: id };
  }

  // ------------------------------------------------------------- RELATORIO
  /** Painel de impacto - evidencia a contribuicao para os ODS 2 e 12. */
  async painelDeImpacto() {
    const registros = await this.registroRepository.find();

    const totalKg = registros.reduce((soma, registro) => soma + Number(registro.quantidadeRetiradaKg), 0);
    const refeicoes = registros.reduce((soma, registro) => soma + registro.refeicoesEquivalentes, 0);
    const co2 = registros.reduce((soma, registro) => soma + Number(registro.co2EvitadoKg), 0);

    const [disponiveis, reservadas, retiradas, expiradas] = await Promise.all([
      this.doacaoRepository.count({ where: { status: StatusDoacao.DISPONIVEL } }),
      this.doacaoRepository.count({ where: { status: StatusDoacao.RESERVADA } }),
      this.doacaoRepository.count({ where: { status: StatusDoacao.RETIRADA } }),
      this.doacaoRepository.count({ where: { status: StatusDoacao.EXPIRADA } }),
    ]);

    return {
      regraDePriorizacaoAtiva: this.regraDePriorizacao.nome(),
      alimentoResgatadoKg: Number(totalKg.toFixed(2)),
      refeicoesEquivalentes: refeicoes,
      co2EvitadoKg: Number(co2.toFixed(2)),
      doacoesPorStatus: { disponiveis, reservadas, retiradas, expiradas },
      totalDeRetiradas: registros.length,
    };
  }

  /**
   * Regra de negocio da 1a entrega: doacoes nao retiradas dentro do
   * horario-limite sao automaticamente encerradas pelo sistema.
   */
  async expirarDoacoesVencidas(): Promise<number> {
    const resultado = await this.doacaoRepository.update(
      {
        status: In([StatusDoacao.DISPONIVEL, StatusDoacao.RESERVADA]),
        horarioLimiteRetirada: LessThan(new Date()),
      },
      { status: StatusDoacao.EXPIRADA },
    );
    return resultado.affected ?? 0;
  }
}
