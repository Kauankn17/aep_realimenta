import { ManifestacaoInteresse } from '../entities/manifestacao-interesse.entity';

/**
 * PILAR DE POO 1 (forma alternativa) - INTERFACE
 *
 * Contrato das regras de priorizacao previstas no REQ08. Qualquer estrategia
 * de desempate implementa esta interface, o que permite trocar a politica de
 * priorizacao sem alterar o `DoacoesService` (padrao Strategy).
 */
export interface RegraDePriorizacao {
  /** Nome legivel da regra, exibido na interface grafica. */
  nome(): string;

  /** Ordena as manifestacoes da mais prioritaria para a menos prioritaria. */
  ordenar(manifestacoes: ManifestacaoInteresse[]): ManifestacaoInteresse[];
}
