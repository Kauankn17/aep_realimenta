/**
 * Ciclo de vida de uma doacao, derivado das regras de negocio levantadas
 * na 1a entrega (Descoberta - secao 1.3).
 */
export enum StatusDoacao {
  /** Publicada pelo doador e visivel para as organizacoes compativeis. */
  DISPONIVEL = 'DISPONIVEL',
  /** Reivindicada por uma organizacao - deixa de ser exibida as demais (REQ07). */
  RESERVADA = 'RESERVADA',
  /** Retirada confirmada pelas duas partes (REQ09). */
  RETIRADA = 'RETIRADA',
  /** Horario-limite de retirada ultrapassado sem retirada. */
  EXPIRADA = 'EXPIRADA',
  /** Cancelada pelo proprio doador. */
  CANCELADA = 'CANCELADA',
}
