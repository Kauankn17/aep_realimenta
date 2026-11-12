-- =====================================================================
-- ReAlimenta - Plataforma de Redistribuicao de Excedentes Alimentares
-- AEP 4o Semestre (2026.2) - UniCesumar
--
-- Script de criacao do banco de dados (PostgreSQL 14+).
-- Este script e a fonte de verdade do modelo fisico: a aplicacao roda com
-- `synchronize: false`, ou seja, o TypeORM NAO cria nem altera tabelas.
--
-- Execucao:
--   createdb realimenta
--   psql -U postgres -d realimenta -f database/schema.sql
-- =====================================================================

DROP TABLE IF EXISTS registro_retirada    CASCADE;
DROP TABLE IF EXISTS manifestacao_interesse CASCADE;
DROP TABLE IF EXISTS notificacao          CASCADE;
DROP TABLE IF EXISTS doacao               CASCADE;
DROP TABLE IF EXISTS participante         CASCADE;

-- ---------------------------------------------------------------------
-- TABELA participante
--
-- Mapeia a HERANCA do modelo de classes usando Single Table Inheritance:
-- a superclasse abstrata `Participante` e as subclasses concretas
-- `EstabelecimentoDoador` (tipo = 'DOADOR') e `OrganizacaoReceptora`
-- (tipo = 'RECEPTORA') compartilham esta tabela, diferenciadas pela coluna
-- discriminadora `tipo`. As colunas especificas de cada subclasse sao
-- anulaveis, pois so se aplicam a um dos tipos.
--
-- Atende aos REQ01, REQ02 e REQ03.
-- ---------------------------------------------------------------------
CREATE TABLE participante (
    id                          SERIAL        PRIMARY KEY,
    tipo                        VARCHAR(30)   NOT NULL,
    nome                        VARCHAR(120)  NOT NULL,
    cnpj                        VARCHAR(18)   NOT NULL,
    email                       VARCHAR(120)  NOT NULL,
    telefone                    VARCHAR(20)   NOT NULL,
    endereco                    VARCHAR(200)  NOT NULL,
    latitude                    DOUBLE PRECISION NOT NULL,
    longitude                   DOUBLE PRECISION NOT NULL,
    criado_em                   TIMESTAMP     NOT NULL DEFAULT NOW(),

    -- Colunas exclusivas de EstabelecimentoDoador (REQ01)
    categoria_estabelecimento   VARCHAR(40),

    -- Colunas exclusivas de OrganizacaoReceptora (REQ02 e REQ03)
    documentacao_comprobatoria  VARCHAR(200),
    validada                    BOOLEAN       DEFAULT FALSE,
    capacidade_atendimento      INTEGER,
    raio_atuacao_km             DOUBLE PRECISION,

    CONSTRAINT uq_participante_cnpj  UNIQUE (cnpj),
    CONSTRAINT ck_participante_tipo  CHECK (tipo IN ('DOADOR', 'RECEPTORA'))
);

CREATE INDEX idx_participante_tipo ON participante (tipo);

-- ---------------------------------------------------------------------
-- TABELA doacao  (ENTIDADE PRINCIPAL DO CRUD)
--
-- COMPOSICAO 1:N -> participante (doador) 1 ---- N doacao
-- A exclusao do doador remove suas doacoes em cascata: a doacao nao existe
-- sem o estabelecimento que a publicou.
--
-- Atende aos REQ04, REQ05, REQ07, REQ09 e REQ10.
-- ---------------------------------------------------------------------
CREATE TABLE doacao (
    id                      SERIAL        PRIMARY KEY,
    doador_id               INTEGER       NOT NULL,
    receptora_id            INTEGER,
    tipo_alimento           VARCHAR(120)  NOT NULL,
    descricao               VARCHAR(255),
    quantidade_estimada_kg  NUMERIC(10,2) NOT NULL,
    validade_ate            TIMESTAMP     NOT NULL,
    horario_limite_retirada TIMESTAMP     NOT NULL,
    local_retirada          VARCHAR(200)  NOT NULL,
    latitude                DOUBLE PRECISION NOT NULL,
    longitude               DOUBLE PRECISION NOT NULL,
    status                  VARCHAR(20)   NOT NULL DEFAULT 'DISPONIVEL',
    criado_em               TIMESTAMP     NOT NULL DEFAULT NOW(),
    atualizado_em           TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_doacao_doador
        FOREIGN KEY (doador_id)    REFERENCES participante (id) ON DELETE CASCADE,
    CONSTRAINT fk_doacao_receptora
        FOREIGN KEY (receptora_id) REFERENCES participante (id) ON DELETE SET NULL,
    CONSTRAINT ck_doacao_quantidade CHECK (quantidade_estimada_kg > 0),
    CONSTRAINT ck_doacao_status
        CHECK (status IN ('DISPONIVEL', 'RESERVADA', 'RETIRADA', 'EXPIRADA', 'CANCELADA')),
    -- Regra de negocio: o horario-limite de retirada nunca pode ultrapassar
    -- a validade do alimento.
    CONSTRAINT ck_doacao_janela CHECK (horario_limite_retirada <= validade_ate)
);

CREATE INDEX idx_doacao_status   ON doacao (status);
CREATE INDEX idx_doacao_doador   ON doacao (doador_id);
CREATE INDEX idx_doacao_limite   ON doacao (horario_limite_retirada);

-- ---------------------------------------------------------------------
-- TABELA notificacao
--
-- COMPOSICAO 1:N -> doacao 1 ---- N notificacao
-- REQ06: notifica as organizacoes receptoras compativeis quando uma nova
-- doacao e publicada na regiao de atuacao delas.
-- ---------------------------------------------------------------------
CREATE TABLE notificacao (
    id            SERIAL        PRIMARY KEY,
    doacao_id     INTEGER       NOT NULL,
    receptora_id  INTEGER       NOT NULL,
    mensagem      VARCHAR(255)  NOT NULL,
    distancia_km  NUMERIC(10,2) NOT NULL,
    lida          BOOLEAN       NOT NULL DEFAULT FALSE,
    enviada_em    TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notificacao_doacao
        FOREIGN KEY (doacao_id)    REFERENCES doacao (id)       ON DELETE CASCADE,
    CONSTRAINT fk_notificacao_receptora
        FOREIGN KEY (receptora_id) REFERENCES participante (id) ON DELETE CASCADE
);

CREATE INDEX idx_notificacao_receptora ON notificacao (receptora_id);

-- ---------------------------------------------------------------------
-- TABELA manifestacao_interesse
--
-- COMPOSICAO 1:N -> doacao 1 ---- N manifestacao_interesse
-- REQ08: quando duas ou mais organizacoes manifestam interesse na mesma
-- doacao, a plataforma prioriza a mais proxima e usa a ordem de
-- manifestacao (`manifestado_em`) como criterio de desempate.
-- ---------------------------------------------------------------------
CREATE TABLE manifestacao_interesse (
    id             SERIAL        PRIMARY KEY,
    doacao_id      INTEGER       NOT NULL,
    receptora_id   INTEGER       NOT NULL,
    distancia_km   NUMERIC(10,2) NOT NULL,
    manifestado_em TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_manifestacao_doacao
        FOREIGN KEY (doacao_id)    REFERENCES doacao (id)       ON DELETE CASCADE,
    CONSTRAINT fk_manifestacao_receptora
        FOREIGN KEY (receptora_id) REFERENCES participante (id) ON DELETE CASCADE,
    -- Uma organizacao manifesta interesse em uma doacao uma unica vez.
    CONSTRAINT uq_manifestacao_doacao_receptora UNIQUE (doacao_id, receptora_id)
);

-- ---------------------------------------------------------------------
-- TABELA registro_retirada
--
-- REQ09 e regra de negocio da 1a entrega: "toda doacao retirada gera um
-- registro IMUTAVEL para fins de auditoria e relatorios de impacto".
-- A aplicacao apenas insere nesta tabela - nunca atualiza nem exclui.
-- Relacionamento 1:1 com doacao (uma doacao gera no maximo uma retirada).
-- ---------------------------------------------------------------------
CREATE TABLE registro_retirada (
    id                     SERIAL        PRIMARY KEY,
    doacao_id              INTEGER       NOT NULL,
    doador_id              INTEGER       NOT NULL,
    receptora_id           INTEGER       NOT NULL,
    quantidade_retirada_kg NUMERIC(10,2) NOT NULL,
    refeicoes_equivalentes INTEGER       NOT NULL,
    co2_evitado_kg         NUMERIC(10,2) NOT NULL,
    retirado_em            TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_registro_doacao
        FOREIGN KEY (doacao_id) REFERENCES doacao (id) ON DELETE CASCADE,
    CONSTRAINT uq_registro_doacao UNIQUE (doacao_id),
    CONSTRAINT ck_registro_quantidade CHECK (quantidade_retirada_kg > 0)
);

-- ---------------------------------------------------------------------
-- EVOLUCAO PREVISTA (1a entrega - Justificativa Tecnica e Arquitetural)
--
-- A 1a entrega previu a extensao PostGIS para as consultas espaciais do
-- REQ05 e do REQ08. Nesta entrega a distancia e calculada pela formula de
-- Haversine na camada de dominio (src/common/geo/haversine.ts), mantendo a
-- mesma regra de negocio sem exigir a extensao para executar o projeto.
-- Para ativar o PostGIS em producao, basta descomentar as linhas abaixo.
--
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE participante ADD COLUMN geo geography(Point, 4326);
-- ALTER TABLE doacao       ADD COLUMN geo geography(Point, 4326);
-- CREATE INDEX idx_participante_geo ON participante USING GIST (geo);
-- CREATE INDEX idx_doacao_geo       ON doacao       USING GIST (geo);
-- ---------------------------------------------------------------------
