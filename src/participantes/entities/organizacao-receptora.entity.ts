import { ChildEntity, Column, OneToMany } from 'typeorm';
import { Participante } from './participante.entity';
import { Doacao } from '../../doacoes/entities/doacao.entity';
import { Notificacao } from '../../notificacoes/entities/notificacao.entity';

/**
 * PILAR DE POO 2 - HERANCA
 *
 * `OrganizacaoReceptora` HERDA de `Participante` e acrescenta os atributos
 * exigidos pelo REQ02 (documentacao comprobatoria) e pelo REQ03 (validacao
 * previa), alem do perfil de atendimento usado no REQ05.
 */
@ChildEntity('RECEPTORA')
export class OrganizacaoReceptora extends Participante {
  @Column({
    name: 'documentacao_comprobatoria',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  documentacaoComprobatoria: string;

  /** REQ03 - a organizacao so opera depois de validada pela plataforma. */
  @Column({ name: 'validada', type: 'boolean', nullable: true, default: false })
  validada: boolean;

  /** Perfil de atendimento: numero de pessoas atendidas pela organizacao. */
  @Column({ name: 'capacidade_atendimento', type: 'int', nullable: true })
  capacidadeAtendimento: number;

  /** REQ05 - raio de atuacao, em km, usado na busca por doacoes compativeis. */
  @Column({ name: 'raio_atuacao_km', type: 'double precision', nullable: true })
  raioAtuacaoKm: number;

  @OneToMany(() => Doacao, (doacao) => doacao.receptora)
  doacoesReivindicadas: Doacao[];

  @OneToMany(() => Notificacao, (notificacao) => notificacao.receptora)
  notificacoes: Notificacao[];

  /** PILAR DE POO 3 - POLIMORFISMO (equivalente ao @Override do Java). */
  override papel(): string {
    return 'ORGANIZACAO RECEPTORA';
  }

  override descricaoResumida(): string {
    const situacao = this.validada ? 'VALIDADA' : 'PENDENTE DE VALIDACAO';
    return `${this.nome} (${situacao}) - atende ate ${this.capacidadeAtendimento ?? 0} pessoas em um raio de ${this.raioAtuacaoKm ?? 0} km`;
  }

  /**
   * REQ03 - implementacao real da regra de negocio: somente a organizacao
   * receptora validada pode reivindicar uma doacao. Sobrescreve o
   * comportamento padrao da superclasse, que nega para todos.
   */
  override podeReivindicarDoacoes(): boolean {
    return this.validada === true;
  }
}
