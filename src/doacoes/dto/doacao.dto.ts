import {
  IsDateString,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

/** REQ04 - publicacao de uma nova doacao pelo estabelecimento doador. */
export class CriarDoacaoDto {
  @IsInt({ message: 'Informe o id do estabelecimento doador.' })
  doadorId: number;

  @IsString()
  @IsNotEmpty({ message: 'O tipo de alimento e obrigatorio.' })
  @Length(3, 120)
  tipoAlimento: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  descricao?: string;

  @IsNumber({}, { message: 'A quantidade estimada deve ser numerica.' })
  @Min(0.1, { message: 'A quantidade estimada deve ser maior que zero.' })
  quantidadeEstimadaKg: number;

  @IsDateString({}, { message: 'Informe a validade no formato ISO (AAAA-MM-DDTHH:mm).' })
  validadeAte: string;

  @IsDateString({}, { message: 'Informe o horario-limite no formato ISO (AAAA-MM-DDTHH:mm).' })
  horarioLimiteRetirada: string;

  @IsString()
  @Length(5, 200)
  localRetirada: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}

/** REQ10 - atualizacao dos dados de uma doacao ja cadastrada. */
export class AtualizarDoacaoDto {
  @IsOptional() @IsString() @Length(3, 120) tipoAlimento?: string;
  @IsOptional() @IsString() @Length(0, 255) descricao?: string;
  @IsOptional() @IsNumber() @Min(0.1) quantidadeEstimadaKg?: number;
  @IsOptional() @IsDateString() validadeAte?: string;
  @IsOptional() @IsDateString() horarioLimiteRetirada?: string;
  @IsOptional() @IsString() @Length(5, 200) localRetirada?: string;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
}

/** REQ07 e REQ08 - manifestacao de interesse de uma organizacao receptora. */
export class ManifestarInteresseDto {
  @IsInt()
  receptoraId: number;
}

/** REQ09 - confirmacao da retirada pelas partes envolvidas. */
export class ConfirmarRetiradaDto {
  @IsNumber()
  @Min(0.1, { message: 'Informe a quantidade efetivamente retirada.' })
  quantidadeRetiradaKg: number;
}
