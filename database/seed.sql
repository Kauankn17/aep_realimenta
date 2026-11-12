-- =====================================================================
-- ReAlimenta - Massa de dados para demonstracao
-- Execucao: psql -U postgres -d realimenta -f database/seed.sql
--
-- As datas usam NOW() + INTERVAL para que as doacoes estejam sempre
-- dentro do prazo no momento da apresentacao.
-- =====================================================================

TRUNCATE registro_retirada, manifestacao_interesse, notificacao, doacao, participante
    RESTART IDENTITY CASCADE;

-- ------------------------------------------------- ESTABELECIMENTOS DOADORES
INSERT INTO participante
    (tipo, nome, cnpj, email, telefone, endereco, latitude, longitude, categoria_estabelecimento)
VALUES
    ('DOADOR', 'Restaurante Sabor do Campo', '12.345.678/0001-90', 'contato@sabordocampo.com.br',
     '(44) 3225-1100', 'Av. Brasil, 1200 - Centro, Maringa/PR', -23.4253, -51.9386, 'RESTAURANTE'),
    ('DOADOR', 'Padaria Pao Quente', '23.456.789/0001-01', 'contato@paoquente.com.br',
     '(44) 3226-2200', 'Rua Neo Alves Martins, 850 - Zona 03, Maringa/PR', -23.4180, -51.9290, 'PADARIA'),
    ('DOADOR', 'Supermercado Bom Preco', '34.567.890/0001-12', 'sac@bompreco.com.br',
     '(44) 3227-3300', 'Av. Colombo, 5790 - Zona 07, Maringa/PR', -23.4050, -51.9400, 'SUPERMERCADO');

-- ------------------------------------------------- ORGANIZACOES RECEPTORAS
INSERT INTO participante
    (tipo, nome, cnpj, email, telefone, endereco, latitude, longitude,
     documentacao_comprobatoria, validada, capacidade_atendimento, raio_atuacao_km)
VALUES
    ('RECEPTORA', 'Cozinha Comunitaria Mãos Unidas', '45.678.901/0001-23', 'contato@maosunidas.org.br',
     '(44) 3228-4400', 'Rua Pioneiro Jose Ferreira, 220 - Zona 06, Maringa/PR', -23.4300, -51.9450,
     'CEBAS 2024/0455 + Estatuto registrado', TRUE, 180, 8),
    ('RECEPTORA', 'Banco de Alimentos Semear', '56.789.012/0001-34', 'contato@semear.org.br',
     '(44) 3229-5500', 'Av. Tuiuti, 1450 - Zona 04, Maringa/PR', -23.4120, -51.9330,
     'Certificado OSCIP 1120/2023', TRUE, 400, 12),
    ('RECEPTORA', 'Associacao Esperanca Viva', '67.890.123/0001-45', 'contato@esperancaviva.org.br',
     '(44) 3230-6600', 'Rua Santos Dumont, 980 - Zona 05, Maringa/PR', -23.4400, -51.9200,
     'Ata de fundacao protocolada - em analise', FALSE, 90, 6);

-- ------------------------------------------------- DOACOES PUBLICADAS
INSERT INTO doacao
    (doador_id, tipo_alimento, descricao, quantidade_estimada_kg,
     validade_ate, horario_limite_retirada, local_retirada, latitude, longitude, status)
VALUES
    (1, 'Marmitas prontas', 'Excedente do almoco executivo, refrigerado', 18.50,
     NOW() + INTERVAL '2 day', NOW() + INTERVAL '6 hour',
     'Av. Brasil, 1200 - entrada de servico', -23.4253, -51.9386, 'DISPONIVEL'),
    (2, 'Paes e assados do dia', 'Paes franceses e doces produzidos hoje', 12.00,
     NOW() + INTERVAL '1 day', NOW() + INTERVAL '4 hour',
     'Rua Neo Alves Martins, 850 - balcao dos fundos', -23.4180, -51.9290, 'DISPONIVEL'),
    (3, 'Hortifruti proximo da validade', 'Frutas e legumes selecionados e proprios para consumo', 45.00,
     NOW() + INTERVAL '3 day', NOW() + INTERVAL '10 hour',
     'Av. Colombo, 5790 - doca de recebimento', -23.4050, -51.9400, 'DISPONIVEL');

-- ------------------------------------------------- CONFERENCIA
SELECT tipo, COUNT(*) AS total FROM participante GROUP BY tipo ORDER BY tipo;
SELECT status, COUNT(*) AS total FROM doacao GROUP BY status ORDER BY status;
