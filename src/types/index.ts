export interface ApiResponse<T> {
  data: T;
  meta?: {
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

export interface PlugInput {
  connectorType: string;
  powerKW: number;
  status: string;
  pricePerKWh: number;
  priceType: string;
}

export interface StationInput {
  name: string;
  lat: number;
  lng: number;
  address: string;
  neighborhood: string;
  city?: string;
  state?: string;
  plugs?: PlugInput[];
}
