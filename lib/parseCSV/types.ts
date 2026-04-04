export type TradeSide = "Long" | "Short";

export type NormalizedTrade = {
  id: string;
  openedAt: string;
  closedAt?: string;
  symbol: string;
  side: TradeSide;
  entry: number;
  exit?: number;
  volume: number;
  profit?: number;
  stopLoss?: number;
  takeProfit?: number;
  pips?: number | null;
};

export type ParseSource = "mt4" | "binance" | "tradingview" | "unknown";
