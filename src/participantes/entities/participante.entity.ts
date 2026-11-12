import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';

/**
 * PILAR DE POO 1 - CLASSE ABSTRATA
 *
 * `Participante` e a superclasse abstrata de todos os atores que se cadastram
 * na plataforma ReAlimenta (REQ01 e REQ02). Ela NAO pode ser instanciada
 * diretamente: so existe atraves de suas subclasses concretas
 * `EstabelecimentoDoador` e `OrganizacaoReceptora`.
 *
 * No banco de dados o mapeamento usa Single Table Inheritance: todas as
 * subclasses sao gravadas na tabela `participante` e sao diferenciadas pela
 * coluna discriminadora `tipo`.
 */
@Entity('participante')
@TableInheritance({ column: { type: 'varchar', name: 'tipo' } })
export abstract class Participante {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nome', type: 'varchar', length: 120 })
  nome: string;

  @Column({ name: 'cnpj', type: 'varchar', length: 18, unique: true })
  cnpj: string;

  @Column({ name: 'email', type: 'varchar', length: 120 })
  email: string;

  @Column({ name: 'telefone', type: 'varchar', length: 20 })
  telefone: string;

  @Column({ name: 'endereco', type: 'varchar', length: 200 })
  endereco: string;

  @Column({ name: 'latitude', type: 'double precision' })
  latitude: number;

  @Column({ name: 'longitude', type: 'double precision' })
  longitude: number;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp' })
  criadoEm: Date;

  /**
   * METODO ABSTRATO - cada subclasse e obrigada a fornecer sua propria
   * implementacao. E este contrato que torna possivel o POLIMORFISMO:
   * o servico trabalha com `Participante` e nao precisa saber qual
   * subclasse esta manipulando.
   */
  abstract papel(): string;

  abstract descricaoResumida(): string;

  /**
   * Regra de negocio da 1a entrega: apenas organizacoes receptoras
   * previamente VALIDADAS podem reivindicar doacoes (REQ03).
   * O comportamento padrao e negar; a subclasse que pode reivindicar
   * sobrescreve este metodo.
   */
  podeReivindicarDoacoes(): boolean {
    return false;
  }
}
