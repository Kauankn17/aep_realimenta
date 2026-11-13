import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacao } from './entities/notificacao.entity';
import { Doacao } from '../doacoes/entities/doacao.entity';
import { OrganizacaoReceptora } from '../participantes/entities/organizacao-receptora.entity';
import { distanciaEmKm } from '../common/geo/haversine';

@Injectable()
export class NotificacoesService {
  constructor(
    @InjectRepository(Notificacao)
    private readonly notificacaoRepository: Repository<Notificacao>,
    @InjectRepository(OrganizacaoReceptora)
    private readonly receptoraRepository: Repository<OrganizacaoReceptora>,
  ) {}

  /**
   * REQ06 - notifica as organizacoes receptoras compativeis quando uma nova
   * doacao e publicada na regiao delas.
   *
   * Compativel = organizacao VALIDADA (REQ03) cujo raio de atuacao alcanca o
   * ponto de retirada da doacao.
   */
  async notificarReceptorasCompativeis(doacao: Doacao): Promise<Notificacao[]> {
    const receptoras = await this.receptoraRepository.find();

    const notificacoes = receptoras
      .filter((receptora) => receptora.podeReivindicarDoacoes())
      .map((receptora) => ({
        receptora,
        distanciaKm: distanciaEmKm(receptora, doacao),
      }))
      .filter(({ receptora, distanciaKm }) => distanciaKm <= (receptora.raioAtuacaoKm ?? 0))
      .map(({ receptora, distanciaKm }) =>
        this.notificacaoRepository.create({
          doacaoId: doacao.id,
          receptoraId: receptora.id,
          distanciaKm,
          lida: false,
          mensagem:
            `Nova doacao disponivel a ${distanciaKm} km: ` +
            `${doacao.quantidadeEstimadaKg} kg de ${doacao.tipoAlimento} em ${doacao.localRetirada}.`,
        }),
      );

    if (notificacoes.length === 0) {
      return [];
    }
    return this.notificacaoRepository.save(notificacoes);
  }

  async listarPorReceptora(receptoraId: number): Promise<Notificacao[]> {
    return this.notificacaoRepository.find({
      where: { receptoraId },
      order: { enviadaEm: 'DESC' },
    });
  }

  async listarTodas(): Promise<Notificacao[]> {
    return this.notificacaoRepository.find({
      order: { enviadaEm: 'DESC' },
      take: 50,
      relations: { receptora: true },
    });
  }

  async marcarComoLida(id: number): Promise<Notificacao | null> {
    await this.notificacaoRepository.update({ id }, { lida: true });
    return this.notificacaoRepository.findOne({ where: { id } });
  }
}
