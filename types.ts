
export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  sources?: Array<{
    title: string;
    uri: string;
  }>;
}

export interface StockData {
  symbol: string;
  price: number;
  change: number; // Percentage
  volume?: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  reasoning?: string;
}

export interface PortfolioItem {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  sector?: string;
}

export enum AnalysisType {
  GENERAL = 'GENERAL',
  SPECIFIC = 'SPECIFIC', // e.g., FPT, VCB
  MARKET_UPDATE = 'MARKET_UPDATE', // 9AM/5PM
}

export interface Alert {
  id: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW';
  threshold: number;
  active: boolean;
}

export interface SavedRecommendation {
  id: string;
  symbol: string;
  action: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'THEO DÕI';
  priceAtTime: number;
  date: string; // ISO string for storage
  notes: string;
}

export interface TechnicalIndicators {
  rsi: number;   // Relative Strength Index
  macd: number;  // Moving Average Convergence Divergence
  signal: number; // MACD Signal Line
  sma20: number; // Simple Moving Average (Short term)
  sma50: number; // Simple Moving Average (Medium term)
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
}

export interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
