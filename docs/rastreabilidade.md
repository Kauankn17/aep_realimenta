# Matriz de Rastreabilidade — 1ª entrega → 2ª entrega

Este documento liga cada requisito planejado na 1ª entrega ao código entregue na 2ª,
atendendo ao critério **Aderência ao Planejamento do Projeto**.

| Requisito | Implementação (classe / método) | Endpoint | Tabela | Onde ver na interface |
|---|---|---|---|---|
| **REQ01** — cadastro de estabelecimentos doadores | `ParticipantesService.criarDoador` · `EstabelecimentoDoador` | `POST /api/participantes/doadores` | `participante` (`tipo='DOADOR'`) | Aba *Estabelecimentos doadores* |
| **REQ02** — cadastro de organizações receptoras | `ParticipantesService.criarReceptora` · `OrganizacaoReceptora` | `POST /api/participantes/receptoras` | `participante` (`tipo='RECEPTORA'`) | Aba *Organizações receptoras* |
| **REQ03** — validação antes de reivindicar | `ParticipantesService.validarReceptora` · `OrganizacaoReceptora.podeReivindicarDoacoes()` | `PATCH /api/participantes/receptoras/:id/validacao` | `participante.validada` | Botão **Validar / Revogar** |
| **REQ04** — publicar doação | `DoacoesService.criar` | `POST /api/doacoes` | `doacao` | Formulário *Publicar doação* |
| **REQ05** — consultar doações compatíveis | `DoacoesService.listarCompativeisParaReceptora` · `distanciaEmKm` | `GET /api/doacoes/compativeis/:receptoraId` | `doacao` | Filtro por proximidade na API |
| **REQ06** — notificar receptoras compatíveis | `NotificacoesService.notificarReceptorasCompativeis` | `GET /api/notificacoes` | `notificacao` | Aba *Notificações* |
| **REQ07** — reivindicar doação, retirando-a das demais | `DoacoesService.resolverPriorizacao` (status → `RESERVADA`) | `POST /api/doacoes/:id/priorizacao` | `doacao.status`, `doacao.receptora_id` | Botão **Aplicar priorização** |
| **REQ08** — priorizar a mais próxima, desempate por ordem | `PriorizacaoPorProximidade.compararPrioridade` | `POST /api/doacoes/:id/manifestacoes` + `POST /api/doacoes/:id/priorizacao` | `manifestacao_interesse` | Linha *Interessadas (REQ08)* no cartão da doação |
| **REQ09** — confirmar retirada e registrar data/quantidade | `DoacoesService.confirmarRetirada` (transacional) | `POST /api/doacoes/:id/retirada` | `registro_retirada` | Botão **Confirmar retirada** |
| **REQ10** — visualizar e atualizar doação | `DoacoesService.listar` · `buscarPorId` · `atualizar` | `GET` e `PATCH /api/doacoes/:id` | `doacao` | Botão **Editar** |

## Observação sobre o REQ07 e o REQ08

Na 1ª entrega, duas regras conviviam no mesmo fluxo: *"uma doação só pode ser
reivindicada por uma organização por vez"* (REQ07) e *"quando duas ou mais
organizações manifestam interesse na mesma doação, a prioridade é dada pela
proximidade geográfica"* (REQ08).

Para que ambas fossem atendidas, a reivindicação foi implementada em **duas etapas**:

1. **Manifestação de interesse** — enquanto a doação está `DISPONIVEL`, várias
   organizações validadas podem se candidatar (`manifestacao_interesse`).
2. **Priorização e reserva** — ao encerrar a janela, a regra do REQ08 define a
   vencedora, a doação passa a `RESERVADA` e deixa de ser exibida às demais,
   cumprindo o REQ07.

Se a reserva ocorresse já na primeira manifestação, a regra de desempate do REQ08
nunca seria exercida — não haveria duas interessadas para comparar.

## Desvio declarado em relação à 1ª entrega

| Planejado | Entregue | Motivo |
|---|---|---|
| Consultas espaciais com a extensão **PostGIS** | Fórmula de **Haversine** na camada de domínio (`src/common/geo/haversine.ts`) | Mantém a mesma regra de negócio (proximidade em km) sem exigir a instalação da extensão para executar o projeto. O caminho de migração para o PostGIS está documentado e comentado ao final de `database/schema.sql`. |

Todas as demais escolhas da 1ª entrega — TypeScript, NestJS, PostgreSQL, arquitetura
modular em camadas — foram mantidas integralmente.
