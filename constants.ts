
import { Product, Invoice, InvoiceItem } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Leche Entera 1L', category: 'Lácteos', currentStock: 12, minStock: 20, price: 1200, cost: 800, lastRestocked: '2023-10-20' },
  { id: '2', name: 'Pan de Molde Blanco', category: 'Panadería', currentStock: 5, minStock: 15, price: 2500, cost: 1800, lastRestocked: '2023-10-22' },
  { id: '3', name: 'Bebida Cola 3L', category: 'Bebidas', currentStock: 45, minStock: 30, price: 3200, cost: 2100, lastRestocked: '2023-10-15' },
  { id: '4', name: 'Arroz Grado 2', category: 'Despensa', currentStock: 8, minStock: 25, price: 1100, cost: 750, lastRestocked: '2023-10-10' },
  { id: '5', name: 'Yogurt Batido Fresa', category: 'Lácteos', currentStock: 30, minStock: 20, price: 450, cost: 280, lastRestocked: '2023-10-24' },
  { id: '6', name: 'Aceite Maravilla 1L', category: 'Despensa', currentStock: 3, minStock: 10, price: 2800, cost: 1900, lastRestocked: '2023-09-30' },
  { id: '7', name: 'Cerveza Lager 6pack', category: 'Alcohol', currentStock: 22, minStock: 15, price: 5990, cost: 3500, lastRestocked: '2023-10-18' },
  { id: '8', name: 'Papas Fritas 250g', category: 'Snacks', currentStock: 14, minStock: 20, price: 2100, cost: 1200, lastRestocked: '2023-10-21' },
];

// Generate mock invoices for the last 30 days
const generateMockInvoices = (): Invoice[] => {
  const invoices: Invoice[] = [];
  const today = new Date();
  
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    const isSale = Math.random() > 0.3; // 70% chance of sale, 30% restock
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items: InvoiceItem[] = [];
    let totalAmount = 0;

    for (let j = 0; j < numItems; j++) {
        const prod = INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)];
        const qty = Math.floor(Math.random() * 5) + 1;
        const unitPrice = isSale ? prod.price : prod.cost;
        const total = qty * unitPrice;
        
        items.push({
            productId: prod.id,
            productName: prod.name,
            quantity: qty,
            unitPrice: unitPrice,
            total: total
        });
        totalAmount += total;
    }

    invoices.push({
      id: `inv-${i}`,
      type: isSale ? 'SALE' : 'PURCHASE',
      date: date.toISOString().split('T')[0],
      items,
      totalAmount
    });
  }
  // Sort by date asc
  return invoices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const MOCK_INVOICES = generateMockInvoices();
