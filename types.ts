
export interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  price: number; // Selling price
  cost: number; // Buying price (cost)
  lastRestocked: string;
}

export type InvoiceType = 'SALE' | 'PURCHASE';

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  notes?: string;
}

export interface AiPrediction {
  analysis: string;
  predictions: {
    productName: string;
    predictedDemand: string;
    urgency: 'Baja' | 'Media' | 'Alta';
  }[];
  restockRecommendations: {
    productName: string;
    suggestedQuantity: number;
    reason: string;
  }[];
  financialTip?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  BILLING = 'BILLING',
  ANALYTICS = 'ANALYTICS'
}
