import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participante } from './entities/participante.entity';
import { EstabelecimentoDoador } from './entities/estabelecimento-doador.entity';
import { OrganizacaoReceptora } from './entities/organizacao-receptora.entity';
import {
  AtualizarParticipanteDto,
  CriarDoadorDto,
  CriarReceptoraDto,
  ValidarReceptoraDto,
} from './dto/participante.dto';

@Injectable()
export class ParticipantesService {
  constructor(
    @InjectRepository(Participante)
    private readonly participanteRepository: Repository<Participante>,
    @InjectRepository(EstabelecimentoDoador)
    private readonly doadorRepository: Repository<EstabelecimentoDoador>,
    @InjectRepository(OrganizacaoReceptora)
    private readonly receptoraRepository: Repository<OrganizacaoReceptora>,
  ) {}

  // ---------------------------------------------------------------- CREATE
  /** REQ01 - cadastro de estabelecimento doador. */
  async criarDoador(dto: CriarDoadorDto): Promise<EstabelecimentoDoador> {
    await this.garantirCnpjInedito(dto.cnpj);
    const doador = this.doadorRepository.create(dto);
    return this.doadorRepository.save(doador);
  }

  /** REQ02 - cadastro de organizacao receptora (nasce pendente de validacao). */
  async criarReceptora(dto: CriarReceptoraDto): Promise<OrganizacaoReceptora> {
    await this.garantirCnpjInedito(dto.cnpj);
    const receptora = this.receptoraRepository.create({ ...dto, validada: false });
    return this.receptoraRepository.save(receptora);
  }

  // ------------------------------------------------------------------ READ
  /**
   * DEMONSTRACAO DE POLIMORFISMO
   *
   * O repositorio da superclasse devolve uma lista de `Participante`, mas cada
   * item e, em tempo de execucao, um `EstabelecimentoDoador` ou uma
   * `OrganizacaoReceptora`. As chamadas a `papel()` e `descricaoResumida()`
   * sao resolvidas dinamicamente pela instancia concreta: o servico nao faz
   * nenhum `if` para decidir qual texto gerar.
   */
  async listarTodos(): Promise<Array<Record<string, unknown>>> {
    const participantes = await this.participanteRepository.find({
      order: { nome: 'ASC' },
    });

    return participantes.map((participante) => ({
      id: participante.id,
      nome: participante.nome,
      cnpj: participante.cnpj,
      email: participante.email,
      telefone: participante.telefone,
      endereco: participante.endereco,
      latitude: participante.latitude,
      longitude: participante.longitude,
      classe: participante.constructor.name,
      papel: participante.papel(),
      descricaoResumida: participante.descricaoResumida(),
      podeReivindicarDoacoes: participante.podeReivindicarDoacoes(),
      ...(participante instanceof EstabelecimentoDoador
        ? { categoriaEstabelecimento: participante.categoriaEstabelecimento }
        : {}),
      ...(participante instanceof OrganizacaoReceptora
        ? {
            validada: participante.validada,
            capacidadeAtendimento: participante.capacidadeAtendimento,
            raioAtuacaoKm: participante.raioAtuacaoKm,
            documentacaoComprobatoria: participante.documentacaoComprobatoria,
          }
        : {}),
    }));
  }

  async listarDoadores(): Promise<EstabelecimentoDoador[]> {
    return this.doadorRepository.find({ order: { nome: 'ASC' } });
  }

  async listarReceptoras(): Promise<OrganizacaoReceptora[]> {
    return this.receptoraRepository.find({ order: { nome: 'ASC' } });
  }

  async buscarPorId(id: number): Promise<Participante> {
    const participante = await this.participanteRepository.findOne({ where: { id } });
    if (!participante) {
      throw new NotFoundException(`Participante ${id} nao encontrado.`);
    }
    return participante;
  }

  async buscarDoador(id: number): Promise<EstabelecimentoDoador> {
    const doador = await this.doadorRepository.findOne({ where: { id } });
    if (!doador) {
      throw new NotFoundException(`Estabelecimento doador ${id} nao encontrado.`);
    }
    return doador;
  }

  async buscarReceptora(id: number): Promise<OrganizacaoReceptora> {
    const receptora = await this.receptoraRepository.findOne({ where: { id } });
    if (!receptora) {
      throw new NotFoundException(`Organizacao receptora ${id} nao encontrada.`);
    }
    return receptora;
  }

  // ---------------------------------------------------------------- UPDATE
  async atualizar(id: number, dto: AtualizarParticipanteDto): Promise<Participante> {
    const participante = await this.buscarPorId(id);

    if (participante instanceof EstabelecimentoDoador) {
      Object.assign(participante, {
        nome: dto.nome ?? participante.nome,
        email: dto.email ?? participante.email,
        telefone: dto.telefone ?? participante.telefone,
        endereco: dto.endereco ?? participante.endereco,
        latitude: dto.latitude ?? participante.latitude,
        longitude: dto.longitude ?? participante.longitude,
        categoriaEstabelecimento:
          dto.categoriaEstabelecimento ?? participante.categoriaEstabelecimento,
      });
      return this.doadorRepository.save(participante);
    }

    const receptora = participante as OrganizacaoReceptora;
    Object.assign(receptora, {
      nome: dto.nome ?? receptora.nome,
      email: dto.email ?? receptora.email,
      telefone: dto.telefone ?? receptora.telefone,
      endereco: dto.endereco ?? receptora.endereco,
      latitude: dto.latitude ?? receptora.latitude,
      longitude: dto.longitude ?? receptora.longitude,
      documentacaoComprobatoria:
        dto.documentacaoComprobatoria ?? receptora.documentacaoComprobatoria,
      capacidadeAtendimento: dto.capacidadeAtendimento ?? receptora.capacidadeAtendimento,
      raioAtuacaoKm: dto.raioAtuacaoKm ?? receptora.raioAtuacaoKm,
    });
    return this.receptoraRepository.save(receptora);
  }

  /** REQ03 - validacao (ou revogacao) de uma organizacao receptora. */
  async validarReceptora(id: number, dto: ValidarReceptoraDto): Promise<OrganizacaoReceptora> {
    const receptora = await this.buscarReceptora(id);

    if (dto.validada && !receptora.documentacaoComprobatoria) {
      throw new BadRequestException(
        'Nao e possivel validar uma organizacao sem documentacao comprobatoria (REQ02).',
      );
    }

    receptora.validada = dto.validada;
    return this.receptoraRepository.save(receptora);
  }

  // ---------------------------------------------------------------- DELETE
  async remover(id: number): Promise<{ removido: number }> {
    const participante = await this.buscarPorId(id);
    await this.participanteRepository.remove(participante);
    return { removido: id };
  }

  // --------------------------------------------------------------- APOIO
  private async garantirCnpjInedito(cnpj: string): Promise<void> {
    const existente = await this.participanteRepository.findOne({ where: { cnpj } });
    if (existente) {
      throw new ConflictException(`Ja existe um participante cadastrado com o CNPJ ${cnpj}.`);
    }
  }
}
