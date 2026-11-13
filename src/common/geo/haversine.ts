/**
 * Calculo da distancia geografica (formula de Haversine), em quilometros.
 *
 * A 1a entrega previa o uso da extensao PostGIS para consultas espaciais.
 * Nesta entrega a regra de proximidade (REQ05 e REQ08) foi implementada na
 * camada de dominio, mantendo a mesma regra de negocio e dispensando a
 * instalacao da extensao para executar o projeto. A evolucao para indices
 * espaciais do PostGIS permanece prevista e esta documentada em
 * database/schema.sql.
 */
const RAIO_DA_TERRA_KM = 6371;

const paraRadianos = (grau: number): number => (grau * Math.PI) / 180;

export interface Coordenada {
  latitude: number;
  longitude: number;
}

export function distanciaEmKm(origem: Coordenada, destino: Coordenada): number {
  const deltaLat = paraRadianos(destino.latitude - origem.latitude);
  const deltaLon = paraRadianos(destino.longitude - origem.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(paraRadianos(origem.latitude)) *
      Math.cos(paraRadianos(destino.latitude)) *
      Math.sin(deltaLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((RAIO_DA_TERRA_KM * c).toFixed(2));
}
