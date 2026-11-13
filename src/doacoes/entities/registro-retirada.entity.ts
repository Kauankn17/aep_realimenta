import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doacao } from './doacao.entity';

const numerico = {
  to: (valor: number) => valor,
  from: (valor: string) => (valor === null ? null : Number(valor)),
};

/**
 * REQ09 - registro IMUTAVEL da retirada, previsto nas regras de negocio da
 * 1a entrega: "toda doacao retirada gera um registro imutavel (data,
 * quantidade estimada, doador e organizacao receptora) para fins de auditoria
 * e geracao de relatorios de impacto".
 *
 * A aplicacao nunca atualiza nem exclui linhas desta tabela: ela apenas
 * insere. E a partir dela que o painel de impacto e calculado.
 */
@Entity('registro_retirada')
export class RegistroRetirada {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @OneToOne(() => Doacao, (doacao) => doacao.registroRetirada, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doacao_id' })
  doacao: Doacao;

  @Column({ name: 'doacao_id', type: 'int', unique: true })
  doacaoId: number;

  @Column({ name: 'doador_id', type: 'int' })
  doadorId: number;

  @Column({ name: 'receptora_id', type: 'int' })
  receptoraId: number;

  @Column({
    name: 'quantidade_retirada_kg',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numerico,
  })
  quantidadeRetiradaKg: number;

  /** Indicador de impacto: 1 kg de alimento equivale a cerca de 2 refeicoes. */
  @Column({ name: 'refeicoes_equivalentes', type: 'int' })
  refeicoesEquivalentes: number;

  /** Indicador de impacto: 1 kg de residuo organico evitado = 2,5 kg de CO2e. */
  @Column({
    name: 'co2_evitado_kg',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numerico,
  })
  co2EvitadoKg: number;

  @CreateDateColumn({ name: 'retirado_em', type: 'timestamp' })
  retiradoEm: Date;
}
