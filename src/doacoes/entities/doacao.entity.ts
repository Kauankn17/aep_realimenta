import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusDoacao } from '../enums/status-doacao.enum';
import { EstabelecimentoDoador } from '../../participantes/entities/estabelecimento-doador.entity';
import { OrganizacaoReceptora } from '../../participantes/entities/organizacao-receptora.entity';
import { Notificacao } from '../../notificacoes/entities/notificacao.entity';
import { ManifestacaoInteresse } from './manifestacao-interesse.entity';
import { RegistroRetirada } from './registro-retirada.entity';

/**
 * ENTIDADE PRINCIPAL DO ESCOPO (alvo do CRUD completo).
 *
 * Atende aos REQ04 (publicacao), REQ05 (consulta), REQ07 (reivindicacao),
 * REQ09 (confirmacao de retirada) e REQ10 (atualizacao e visualizacao).
 *
 * RELACIONAMENTO DE COMPOSICAO 1:N
 * `EstabelecimentoDoador` 1 ---- N `Doacao`
 * `Doacao`                1 ---- N `Notificacao`
 * `Doacao`                1 ---- N `ManifestacaoInteresse`
 */
@Entity('doacao')
export class Doacao {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** Lado N da composicao 1:N com o doador. */
  @ManyToOne(() => EstabelecimentoDoador, (doador) => doador.doacoes, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'doador_id' })
  doador: EstabelecimentoDoador;

  @Column({ name: 'doador_id', type: 'int' })
  doadorId: number;

  /** Preenchido apenas quando a doacao e reivindicada (REQ07). */
  @ManyToOne(() => OrganizacaoReceptora, (receptora) => receptora.doacoesReivindicadas, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'receptora_id' })
  receptora: OrganizacaoReceptora | null;

  @Column({ name: 'receptora_id', type: 'int', nullable: true })
  receptoraId: number | null;

  @Column({ name: 'tipo_alimento', type: 'varchar', length: 120 })
  tipoAlimento: string;

  @Column({ name: 'descricao', type: 'varchar', length: 255, nullable: true })
  descricao: string;

  @Column({
    name: 'quantidade_estimada_kg',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (valor: number) => valor,
      from: (valor: string) => (valor === null ? null : Number(valor)),
    },
  })
  quantidadeEstimadaKg: number;

  /** Janela de validade do alimento (regra de negocio da Descoberta). */
  @Column({ name: 'validade_ate', type: 'timestamp' })
  validadeAte: Date;

  /** Horario-limite para a retirada; apos ele a doacao expira (REQ04). */
  @Column({ name: 'horario_limite_retirada', type: 'timestamp' })
  horarioLimiteRetirada: Date;

  @Column({ name: 'local_retirada', type: 'varchar', length: 200 })
  localRetirada: string;

  @Column({ name: 'latitude', type: 'double precision' })
  latitude: number;

  @Column({ name: 'longitude', type: 'double precision' })
  longitude: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: StatusDoacao.DISPONIVEL,
  })
  status: StatusDoacao;

  @OneToMany(() => Notificacao, (notificacao) => notificacao.doacao)
  notificacoes: Notificacao[];

  @OneToMany(() => ManifestacaoInteresse, (manifestacao) => manifestacao.doacao)
  manifestacoes: ManifestacaoInteresse[];

  @OneToOne(() => RegistroRetirada, (registro) => registro.doacao)
  registroRetirada: RegistroRetirada;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp' })
  atualizadoEm: Date;

  /** Verdadeiro quando o horario-limite de retirada ja passou. */
  estaVencida(referencia: Date = new Date()): boolean {
    return this.horarioLimiteRetirada.getTime() < referencia.getTime();
  }

  /** Uma doacao so pode ser reivindicada se estiver disponivel e dentro do prazo. */
  podeSerReivindicada(referencia: Date = new Date()): boolean {
    return this.status === StatusDoacao.DISPONIVEL && !this.estaVencida(referencia);
  }
}
