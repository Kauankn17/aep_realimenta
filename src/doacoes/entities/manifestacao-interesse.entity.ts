import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Doacao } from './doacao.entity';
import { OrganizacaoReceptora } from '../../participantes/entities/organizacao-receptora.entity';

/**
 * REQ08 - registra o interesse de uma organizacao receptora em uma doacao.
 *
 * Quando duas ou mais organizacoes manifestam interesse na mesma doacao, a
 * plataforma usa estes registros para aplicar a regra de priorizacao:
 * menor distancia primeiro e, em caso de empate, a ordem de manifestacao
 * (campo `manifestadoEm`).
 */
@Entity('manifestacao_interesse')
@Unique('uq_manifestacao_doacao_receptora', ['doacaoId', 'receptoraId'])
export class ManifestacaoInteresse {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => Doacao, (doacao) => doacao.manifestacoes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doacao_id' })
  doacao: Doacao;

  @Column({ name: 'doacao_id', type: 'int' })
  doacaoId: number;

  @ManyToOne(() => OrganizacaoReceptora, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'receptora_id' })
  receptora: OrganizacaoReceptora;

  @Column({ name: 'receptora_id', type: 'int' })
  receptoraId: number;

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

  @CreateDateColumn({ name: 'manifestado_em', type: 'timestamp' })
  manifestadoEm: Date;
}
