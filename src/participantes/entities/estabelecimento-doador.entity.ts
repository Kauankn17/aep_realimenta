import { ChildEntity, Column, OneToMany } from 'typeorm';
import { Participante } from './participante.entity';
import { Doacao } from '../../doacoes/entities/doacao.entity';
import { CategoriaEstabelecimento } from '../enums/categoria-estabelecimento.enum';

/**
 * PILAR DE POO 2 - HERANCA
 *
 * `EstabelecimentoDoador` HERDA de `Participante` todos os atributos comuns
 * (nome, CNPJ, endereco, telefone, e-mail, coordenadas) e acrescenta os
 * atributos proprios do doador. Atende ao REQ01.
 *
 * PILAR DE POO 4 - COMPOSICAO 1:N
 * Um estabelecimento doador possui varias doacoes (`doacoes`). As doacoes nao
 * existem sem o doador que as publicou: ao excluir o doador, suas doacoes sao
 * removidas em cascata.
 */
@ChildEntity('DOADOR')
export class EstabelecimentoDoador extends Participante {
  @Column({
    name: 'categoria_estabelecimento',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  categoriaEstabelecimento: CategoriaEstabelecimento;

  @OneToMany(() => Doacao, (doacao) => doacao.doador, { cascade: ['insert'] })
  doacoes: Doacao[];

  /**
   * PILAR DE POO 3 - POLIMORFISMO
   * A palavra-chave `override` do TypeScript e o equivalente direto da
   * anotacao `@Override` do Java. O projeto compila com a flag
   * `noImplicitOverride: true` (tsconfig.json), o que torna o uso de
   * `override` OBRIGATORIO em toda sobrescrita - o compilador acusa erro
   * se um metodo sobrescrever a superclasse sem declarar `override`.
   */
  override papel(): string {
    return 'ESTABELECIMENTO DOADOR';
  }

  override descricaoResumida(): string {
    const categoria = this.categoriaEstabelecimento ?? 'NAO INFORMADA';
    return `${this.nome} (${categoria}) - doador de excedente alimentar em ${this.endereco}`;
  }

  /**
   * Um doador publica doacoes, mas nunca as reivindica.
   * Mantem o comportamento padrao herdado de `Participante`, declarado aqui
   * de forma explicita para deixar a regra de negocio documentada no codigo.
   */
  override podeReivindicarDoacoes(): boolean {
    return false;
  }
}
