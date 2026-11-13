import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doacao } from '../../doacoes/entities/doacao.entity';
import { OrganizacaoReceptora } from '../../participantes/entities/organizacao-receptora.entity';

/**
 * REQ06 - notificacao enviada as organizacoes receptoras compativeis quando
 * uma nova doacao e publicada na regiao de atuacao delas.
 *
 * Lado N da composicao 1:N com `Doacao`.
 */
@Entity('notificacao')
export class Notificacao {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => Doacao, (doacao) => doacao.notificacoes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doacao_id' })
  doacao: Doacao;

  @Column({ name: 'doacao_id', type: 'int' })
  doacaoId: number;

  @ManyToOne(() => OrganizacaoReceptora, (receptora) => receptora.notificacoes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receptora_id' })
  receptora: OrganizacaoReceptora;

  @Column({ name: 'receptora_id', type: 'int' })
  receptoraId: number;

  @Column({ name: 'mensagem', type: 'varchar', length: 255 })
  mensagem: string;

  @Column({
    name: 'distancia_km',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (valor: number) => valor,
      from: (valor: string) => (valor === null ? null : Number(valor)),
    },
  })
  distanciaKm: number;

  @Column({ name: 'lida', type: 'boolean', default: false })
  lida: boolean;

  @CreateDateColumn({ name: 'enviada_em', type: 'timestamp' })
  enviadaEm: Date;
}
