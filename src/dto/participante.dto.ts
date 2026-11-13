import {
  IsBoolean,
  IsEmail,
  IsEnum,
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
import { CategoriaEstabelecimento } from '../enums/categoria-estabelecimento.enum';

/** Campos comuns a qualquer participante (REQ01 e REQ02). */
export abstract class ParticipanteBaseDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome e obrigatorio.' })
  @Length(3, 120)
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'O CNPJ e obrigatorio.' })
  @Length(14, 18)
  cnpj: string;

  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  email: string;

  @IsString()
  @Length(8, 20)
  telefone: string;

  @IsString()
  @Length(5, 200)
  endereco: string;

  @IsLatitude({ message: 'Latitude invalida.' })
  latitude: number;

  @IsLongitude({ message: 'Longitude invalida.' })
  longitude: number;
}

/** REQ01 - cadastro de estabelecimentos doadores. */
export class CriarDoadorDto extends ParticipanteBaseDto {
  @IsEnum(CategoriaEstabelecimento, {
    message: 'Categoria invalida. Use RESTAURANTE, PADARIA, SUPERMERCADO, FEIRA, HOTEL ou OUTRO.',
  })
  categoriaEstabelecimento: CategoriaEstabelecimento;
}

/** REQ02 - cadastro de organizacoes receptoras. */
export class CriarReceptoraDto extends ParticipanteBaseDto {
  @IsString()
  @IsNotEmpty({ message: 'A documentacao comprobatoria e obrigatoria.' })
  @Length(3, 200)
  documentacaoComprobatoria: string;

  @IsInt()
  @Min(1)
  capacidadeAtendimento: number;

  @IsNumber()
  @Min(0.5)
  raioAtuacaoKm: number;
}

/** Atualizacao parcial de um participante ja cadastrado. */
export class AtualizarParticipanteDto {
  @IsOptional() @IsString() @Length(3, 120) nome?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Length(8, 20) telefone?: string;
  @IsOptional() @IsString() @Length(5, 200) endereco?: string;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;

  @IsOptional()
  @IsEnum(CategoriaEstabelecimento)
  categoriaEstabelecimento?: CategoriaEstabelecimento;

  @IsOptional() @IsString() @Length(3, 200) documentacaoComprobatoria?: string;
  @IsOptional() @IsInt() @Min(1) capacidadeAtendimento?: number;
  @IsOptional() @IsNumber() @Min(0.5) raioAtuacaoKm?: number;
}

/** REQ03 - validacao da organizacao receptora pela plataforma. */
export class ValidarReceptoraDto {
  @IsBoolean()
  validada: boolean;
}
