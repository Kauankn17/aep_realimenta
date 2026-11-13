# aep_realimenta

**ReAlimenta — Plataforma de Redistribuição de Excedentes Alimentares**
AEP do 4º Semestre (2026.2) — Engenharia de Software / ADS — UniCesumar

Projeto alinhado ao **ODS 2 (Fome Zero e Agricultura Sustentável)** e ao **ODS 12
(Consumo e Produção Responsáveis — meta 12.3)**: conecta estabelecimentos com
excedente alimentar a organizações receptoras validadas e próximas, reduzindo o
desperdício e ampliando o acesso a alimentos.

---

## 1. Requisitos

REQ01 — O sistema deve permitir o cadastro de estabelecimentos doadores, com nome do estabelecimento, CNPJ, endereço, telefone e e-mail.
REQ02 — O sistema deve permitir o cadastro de organizações receptoras, com nome, CNPJ, documentação comprobatória, endereço, telefone e e-mail.
REQ03 — O sistema deve permitir a validação das organizações receptoras antes que elas possam reivindicar doações.
REQ04 — O sistema deve permitir ao doador publicar uma doação informando tipo de alimento, quantidade estimada, janela de validade, horário-limite de retirada e local de retirada.
REQ05 — O sistema deve permitir às organizações receptoras consultar as doações disponíveis compatíveis com sua localização e perfil de atendimento.
REQ06 — O sistema deve notificar organizações receptoras compatíveis quando uma nova doação for publicada em sua região.
REQ07 — O sistema deve permitir que uma organização receptora reivindique uma doação disponível, retirando-a da disponibilidade para as demais organizações.
REQ08 — O sistema deve priorizar a organização receptora mais próxima do ponto de retirada quando houver mais de um interessado e utilizar a ordem de manifestação como critério de desempate.
REQ09 — O sistema deve permitir a confirmação da retirada da doação pelas partes envolvidas e registrar a data e a quantidade efetivamente retirada.
REQ10 — O sistema deve permitir ao doador visualizar e atualizar os dados de uma doação cadastrada, incluindo quantidade, validade e horário-limite de retirada.

## 2. Cronograma

| Data | Atividade | Responsável |
|---|---|---|
| 15/09/2026 | Consolidação dos requisitos, regras de negócio e escopo | Equipe |
| 17/09/2026 | Revisão da arquitetura, tecnologias e estrutura do repositório | Equipe |
| 20/09/2026 | Modelagem das classes e relacionamentos de POO | Equipe |
| 23/09/2026 | Modelagem do banco de dados e elaboração do DER | Equipe |
| 26/09/2026 | Criação da estrutura /src, /docs e /database e README | Equipe |
| 30/09/2026 | Preparação do ambiente de desenvolvimento e integração inicial | Equipe |
| 05/10/2026 | Implementação inicial da entidade principal (Doacao) e CRUD | Equipe |
| 10/10/2026 | Revisão da aderência ao planejamento e preparação da entrega | Equipe |
| 20/10/2026 | Implementação das classes de domínio e pilares de POO | Equipe |
| 27/10/2026 | CRUD completo da entidade Doacao e integração com PostgreSQL | Equipe |
| 03/11/2026 | Regras de negócio: validação, notificação e priorização | Equipe |
| 10/11/2026 | Interface gráfica, testes end-to-end e documentação final | Equipe |


---

## 3. Como executar

### 3.1. Pré-requisitos

| Ferramenta | Versão mínima | Verificação |
|---|---|---|
| Node.js | 18 (testado no 22) | `node -v` |
| npm | 9 | `npm -v` |
| PostgreSQL | 14 (testado no 16) | `psql --version` |

### 3.2. Passo a passo

```bash
# 1. Clonar o repositório
git clone https://github.com/Kauankn17/aep_realimenta.git
cd aep_realimenta

# 2. Instalar as dependências
npm install

# 3. Criar o banco de dados
createdb -U postgres realimenta
#   (no Windows, use o pgAdmin ou: psql -U postgres -c "CREATE DATABASE realimenta;")

# 4. Criar as tabelas (script obrigatório da entrega)
psql -U postgres -d realimenta -f database/schema.sql

# 5. (Opcional) Carregar a massa de dados de demonstração
psql -U postgres -d realimenta -f database/seed.sql

# 6. Configurar as credenciais do banco
cp .env.example .env     # edite DB_USER e DB_PASSWORD conforme sua instalação

# 7. Compilar e executar
npm run build
npm start
```

A aplicação sobe em **http://localhost:3000** — a interface gráfica abre na raiz e a
API REST responde em `/api`.

### 3.3. Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_HOST` | `localhost` | Endereço do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `postgres` | Senha do banco |
| `DB_NAME` | `realimenta` | Nome do banco |
| `PORT` | `3000` | Porta da aplicação |
| `DB_LOGGING` | `false` | `true` imprime o SQL executado no console |

> **Compatibilidade de ambientes (Sistemas Operacionais):** o projeto roda em Windows,
> Linux e macOS sem alteração de código. A única diferença é o modo de criar o banco
> (`createdb` no Linux/macOS, pgAdmin ou `psql` no Windows). Como a aplicação executa
> sobre o Node.js, não há dependência de bibliotecas nativas específicas de SO.

---

## 4. Estrutura do repositório

```
aep_realimenta/
├── database/
│   ├── schema.sql        # DDL completo (tabelas, chaves, constraints e índices)
│   └── seed.sql          # Massa de dados para demonstração
├── docs/
│   ├── diagrama-de-classes.md   # Diagrama de classes (herança, composição, polimorfismo)
│   ├── diagrama-der.md          # Diagrama entidade-relacionamento
│   └── rastreabilidade.md       # Requisito -> classe -> endpoint -> tabela
├── public/               # Interface gráfica (HTML, CSS e JS)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── common/geo/       # Cálculo de distância (Haversine)
│   ├── doacoes/          # Entidade principal: entidades, DTOs, regras, service, controller
│   ├── notificacoes/     # REQ06
│   ├── participantes/    # REQ01, REQ02 e REQ03 (herança)
│   ├── app.module.ts     # Conexão com o PostgreSQL
│   └── main.ts           # Bootstrap da aplicação
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Pilares de Programação Orientada a Objetos aplicados

| Pilar | Onde está | Evidência |
|---|---|---|
| **Classe abstrata** | `src/participantes/entities/participante.entity.ts` | `export abstract class Participante` com os métodos abstratos `papel()` e `descricaoResumida()` |
| **Classe abstrata (2ª ocorrência)** | `src/doacoes/regras/priorizacao.ts` | `RegraDePriorizacaoBase` (Template Method) com `compararPrioridade()` abstrato |
| **Interface** | `src/doacoes/regras/regra-de-priorizacao.interface.ts` | `interface RegraDePriorizacao` implementada pelas estratégias de priorização |
| **Herança** | `estabelecimento-doador.entity.ts` e `organizacao-receptora.entity.ts` | `class EstabelecimentoDoador extends Participante` e `class OrganizacaoReceptora extends Participante` |
| **Polimorfismo** | mesmas classes acima | `override papel()`, `override descricaoResumida()`, `override podeReivindicarDoacoes()` |
| **Composição 1:N** | `doacao.entity.ts` | `EstabelecimentoDoador` 1→N `Doacao`; `Doacao` 1→N `Notificacao`; `Doacao` 1→N `ManifestacaoInteresse` |

### Sobre o `override` (equivalente ao `@Override` do Java)

O `tsconfig.json` habilita **`"noImplicitOverride": true`**. Com essa flag, o
compilador TypeScript **rejeita** qualquer método que sobrescreva a superclasse sem a
palavra-chave `override` — exatamente a mesma verificação que a anotação `@Override`
faz no Java. A sobrescrita, portanto, é validada em tempo de compilação, não apenas
por convenção.

Demonstração prática na aba **Painel de impacto** da interface: a tabela
"Participantes cadastrados" é montada a partir de **uma única consulta à superclasse
`Participante`**, e as colunas `papel()`, `descricaoResumida()` e
`podeReivindicarDoacoes()` exibem resultados diferentes para cada subclasse sem
nenhum `if` no backend — o despacho é resolvido pela instância concreta.

---

## 6. CRUD completo da entidade principal (`Doacao`)

| Operação | Método e rota | Requisito |
|---|---|---|
| **C**reate | `POST /api/doacoes` | REQ04 |
| **R**ead (lista) | `GET /api/doacoes?status=&doadorId=` | REQ10 |
| **R**ead (por id) | `GET /api/doacoes/:id` | REQ10 |
| **R**ead (compatíveis) | `GET /api/doacoes/compativeis/:receptoraId` | REQ05 |
| **U**pdate | `PATCH /api/doacoes/:id` | REQ10 |
| **D**elete | `DELETE /api/doacoes/:id` | — |

### Demais endpoints

| Rota | Requisito |
|---|---|
| `POST /api/participantes/doadores` | REQ01 |
| `POST /api/participantes/receptoras` | REQ02 |
| `PATCH /api/participantes/receptoras/:id/validacao` | REQ03 |
| `GET /api/participantes` | Listagem polimórfica |
| `GET /api/notificacoes` | REQ06 |
| `POST /api/doacoes/:id/manifestacoes` | REQ08 (manifestação) |
| `POST /api/doacoes/:id/priorizacao` | REQ07 e REQ08 (reserva) |
| `POST /api/doacoes/:id/retirada` | REQ09 |
| `PATCH /api/doacoes/:id/cancelamento` | Regra de negócio |
| `GET /api/doacoes/impacto` | Relatório de impacto (ODS 2 e 12) |

---

## 7. Persistência em banco de dados

A conexão com o PostgreSQL é **ativa e obrigatória** — não há dados em memória. A
aplicação não sobe se o banco não estiver acessível.

O TypeORM roda com **`synchronize: false`** (`src/app.module.ts`): o arquivo
`database/schema.sql` é a **única fonte de verdade** do modelo físico, e as classes
TypeScript apenas o espelham. As tabelas criadas são:

`participante` · `doacao` · `notificacao` · `manifestacao_interesse` · `registro_retirada`

A herança do modelo de classes é mapeada por **Single Table Inheritance**: as
subclasses `EstabelecimentoDoador` e `OrganizacaoReceptora` compartilham a tabela
`participante`, diferenciadas pela coluna discriminadora `tipo`.

---

## 8. Regras de negócio implementadas

1. CNPJ é único entre todos os participantes.
2. Organização receptora nasce **pendente** e só reivindica doações após validação (REQ03).
3. O horário-limite de retirada nunca pode ser posterior à validade do alimento (validado na aplicação **e** por `CHECK` no banco).
4. Uma doação só pode ser reservada por uma organização por vez; após a reserva, deixa de ser exibida às demais (REQ07).
5. Enquanto a janela está aberta, várias organizações podem manifestar interesse; a reserva é decidida pela regra de priorização — menor distância, com desempate pela ordem de manifestação (REQ08).
6. Cada organização manifesta interesse em uma doação uma única vez (`UNIQUE` no banco).
7. A confirmação da retirada gera um **registro imutável** de auditoria, dentro de uma transação (REQ09).
8. Doação já retirada não pode ser alterada nem excluída.
9. Doações não retiradas dentro do horário-limite são encerradas automaticamente pelo sistema.
10. Excluir um doador remove suas doações em cascata (composição).

---

## 9. Tecnologias e justificativa

| Camada | Tecnologia | Por quê |
|---|---|---|
| Linguagem | **TypeScript** | Tipagem estática verificada em compilação; `noImplicitOverride` garante o rigor da sobrescrita |
| Runtime | **Node.js 18+** | Mesma linguagem no backend e na interface, reduzindo a curva de aprendizado da equipe |
| Framework | **NestJS 10** | Impõe arquitetura modular com injeção de dependência, espelhando a Clean Architecture definida na 1ª entrega |
| ORM | **TypeORM** | Mapeia a herança de classes para o banco via Single Table Inheritance, preservando o modelo de POO |
| Banco | **PostgreSQL 14+** | Integridade referencial, transações e `CHECK` constraints — exigidos pelas regras de negócio |
| Validação | **class-validator** | Validação declarativa nos DTOs, com mensagens em português |
| Interface | **HTML + CSS + JS** | Servida pelo próprio backend: um único comando executa o sistema inteiro |

Essas escolhas mantêm a arquitetura definida na 1ª entrega. A única adaptação: as
consultas espaciais previstas com **PostGIS** foram implementadas pela fórmula de
Haversine na camada de domínio (`src/common/geo/haversine.ts`), preservando a mesma
regra de negócio sem exigir a instalação da extensão. O caminho de evolução para o
PostGIS está documentado no fim de `database/schema.sql`.
