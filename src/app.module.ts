import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantesModule } from './participantes/participantes.module';
import { DoacoesModule } from './doacoes/doacoes.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { Participante } from './participantes/entities/participante.entity';
import { EstabelecimentoDoador } from './participantes/entities/estabelecimento-doador.entity';
import { OrganizacaoReceptora } from './participantes/entities/organizacao-receptora.entity';
import { Doacao } from './doacoes/entities/doacao.entity';
import { ManifestacaoInteresse } from './doacoes/entities/manifestacao-interesse.entity';
import { RegistroRetirada } from './doacoes/entities/registro-retirada.entity';
import { Notificacao } from './notificacoes/entities/notificacao.entity';

/**
 * Conexao ATIVA com o PostgreSQL.
 *
 * `synchronize: false` e proposital: a criacao das tabelas e feita pelo
 * script `database/schema.sql`, que e o artefato exigido na entrega. Assim o
 * script SQL e a unica fonte de verdade do modelo fisico, e as entidades
 * TypeScript apenas o espelham.
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'realimenta',
      entities: [
        Participante,
        EstabelecimentoDoador,
        OrganizacaoReceptora,
        Doacao,
        ManifestacaoInteresse,
        RegistroRetirada,
        Notificacao,
      ],
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
    }),
    ParticipantesModule,
    DoacoesModule,
    NotificacoesModule,
  ],
})
export class AppModule {}
