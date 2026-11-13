import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participante } from './entities/participante.entity';
import { EstabelecimentoDoador } from './entities/estabelecimento-doador.entity';
import { OrganizacaoReceptora } from './entities/organizacao-receptora.entity';
import { ParticipantesService } from './participantes.service';
import { ParticipantesController } from './participantes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Participante, EstabelecimentoDoador, OrganizacaoReceptora]),
  ],
  controllers: [ParticipantesController],
  providers: [ParticipantesService],
  exports: [ParticipantesService, TypeOrmModule],
})
export class ParticipantesModule {}
