import { ManifestacaoInteresse } from '../entities/manifestacao-interesse.entity';
import { RegraDePriorizacao } from './regra-de-priorizacao.interface';

/**
 * PILAR DE POO 1 - CLASSE ABSTRATA aplicada as regras de priorizacao.
 *
 * Concentra o comportamento comum a todas as regras (nunca alterar o array
 * recebido) e deixa o criterio de ordenacao a cargo das subclasses, atraves
 * do metodo abstrato `compararPrioridade`. E o chamado "Template Method":
 * o algoritmo geral fica na superclasse e o passo que varia e abstrato.
 */
export abstract class RegraDePriorizacaoBase implements RegraDePriorizacao {
  abstract nome(): string;

  /** Retorna negativo se `a` tem prioridade sobre `b`. */
  protected abstract compararPrioridade(
    a: ManifestacaoInteresse,
    b: ManifestacaoInteresse,
  ): number;

  ordenar(manifestacoes: ManifestacaoInteresse[]): ManifestacaoInteresse[] {
    return [...manifestacoes].sort((a, b) => this.compararPrioridade(a, b));
  }
}

/**
 * REGRA OFICIAL DO REQ08.
 * PILAR DE POO 3 - POLIMORFISMO via `override` (equivalente ao @Override).
 *
 * Prioriza a organizacao receptora mais proxima do ponto de retirada e, em
 * caso de empate na distancia, usa a ordem de manifestacao como desempate.
 */
export class PriorizacaoPorProximidade extends RegraDePriorizacaoBase {
  override nome(): string {
    return 'Proximidade geografica (desempate por ordem de manifestacao)';
  }

  protected override compararPrioridade(
    a: ManifestacaoInteresse,
    b: ManifestacaoInteresse,
  ): number {
    const diferencaDeDistancia = Number(a.distanciaKm) - Number(b.distanciaKm);
    if (diferencaDeDistancia !== 0) {
      return diferencaDeDistancia;
    }
    return a.manifestadoEm.getTime() - b.manifestadoEm.getTime();
  }
}

/**
 * Regra alternativa (ordem de chegada pura), mantida para demonstrar que a
 * politica de priorizacao e intercambiavel sem tocar no servico de doacoes.
 */
export class PriorizacaoPorOrdemDeManifestacao extends RegraDePriorizacaoBase {
  override nome(): string {
    return 'Ordem de manifestacao (primeiro a manifestar interesse)';
  }

  protected override compararPrioridade(
    a: ManifestacaoInteresse,
    b: ManifestacaoInteresse,
  ): number {
    return a.manifestadoEm.getTime() - b.manifestadoEm.getTime();
  }
}
