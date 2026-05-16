export const STATION_STATUSES = ['Disponível', 'Ocupado', 'Em Manutenção', 'Reservado'] as const;
export const STATION_CONNECTORS = ['CCS2', 'Tipo 2', 'CHAdeMO'] as const;
export const STATION_PRICES = ['Gratuito', 'Pago'] as const;

export type StationStatusLabel = (typeof STATION_STATUSES)[number];
export type StationConnectorLabel = (typeof STATION_CONNECTORS)[number];
export type StationPriceLabel = (typeof STATION_PRICES)[number];

export interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    timestamp: string;
    source: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
