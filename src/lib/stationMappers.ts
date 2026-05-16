import { Station, StationStatus, StationConnector, StationPrice } from '@prisma/client';

export const STATUS_TO_LABEL: Record<StationStatus, string> = {
  DISPONIVEL: 'Disponível',
  OCUPADO: 'Ocupado',
  EM_MANUTENCAO: 'Em Manutenção',
  RESERVADO: 'Reservado',
};

export const CONNECTOR_TO_LABEL: Record<StationConnector, string> = {
  CCS2: 'CCS2',
  TIPO_2: 'Tipo 2',
  CHADEMO: 'CHAdeMO',
};

export const PRICE_TO_LABEL: Record<StationPrice, string> = {
  GRATUITO: 'Gratuito',
  PAGO: 'Pago',
};

const invert = <T extends string>(map: Record<T, string>): Record<string, T> =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [v as string, k as T])) as Record<string, T>;

export const LABEL_TO_STATUS = invert(STATUS_TO_LABEL);
export const LABEL_TO_CONNECTOR = invert(CONNECTOR_TO_LABEL);
export const LABEL_TO_PRICE = invert(PRICE_TO_LABEL);

export function toStatus(label?: string): StationStatus | undefined {
  return label ? LABEL_TO_STATUS[label] : undefined;
}

export function toConnector(label?: string): StationConnector | undefined {
  return label ? LABEL_TO_CONNECTOR[label] : undefined;
}

export function toPrice(label?: string): StationPrice | undefined {
  return label ? LABEL_TO_PRICE[label] : undefined;
}

export function serializeStation(s: Station) {
  return {
    ...s,
    status: STATUS_TO_LABEL[s.status],
    connector: CONNECTOR_TO_LABEL[s.connector],
    price: PRICE_TO_LABEL[s.price],
  };
}
