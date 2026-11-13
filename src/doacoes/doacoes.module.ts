import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doacao } from './entities/doacao.entity';
import { ManifestacaoInteresse } from './entities/manifestacao-interesse.entity';
import { RegistroRetirada } from './entities/registro-retirada.entity';
import { DoacoesService } from './doacoes.service';
import { DoacoesController } from './doacoes.controller';
import { ParticipantesModule } from '../participantes/participantes.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doacao, ManifestacaoInteresse, RegistroRetirada]),
    ParticipantesModule,
    NotificacoesModule,
  ],
  controllers: [DoacoesController],
  providers: [DoacoesService],
  exports: [DoacoesService],
})
export class DoacoesModule {}
