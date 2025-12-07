import React, { useState } from 'react';
import { Product, Invoice } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Package, DollarSign } from 'lucide-react';

interface ProductAnalyticsProps {
  products: Product[];
  invoices: Invoice[];
}

const ProductAnalytics: React.FC<ProductAnalyticsProps> = ({ products, invoices }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'YEAR'>('MONTH');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Calculate stats for the selected product
  const productInvoices = invoices.filter(inv => 
    inv.items.some(item => item.productId === selectedProductId)
  );

  const totalSold = productInvoices
    .filter(inv => inv.type === 'SALE')
    .reduce((acc, inv) => acc + (inv.items.find(i => i.productId === selectedProductId)?.quantity || 0), 0);

  const totalRevenue = productInvoices
    .filter(inv => inv.type === 'SALE')
    .reduce((acc, inv) => acc + (inv.items.find(i => i.productId === selectedProductId)?.total || 0), 0);

  // Prepare chart data with aggregation and projection
  const generateChartData = () => {
    const rawMap = new Map<string, number>();
    
    // 1. Gather historical data
    productInvoices.forEach(inv => {
      if (inv.type === 'SALE') {
        const qty = inv.items.find(i => i.productId === selectedProductId)?.quantity || 0;
        rawMap.set(inv.date, (rawMap.get(inv.date) || 0) + qty);
      }
    });

    let data = Array.from(rawMap.entries())
      .map(([date, qty]) => ({ date, real: qty, estimated: null as number | null }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Filter by Time Range
    const today = new Date();
    const rangeDays = timeRange === 'WEEK' ? 7 : timeRange === 'MONTH' ? 30 : 365;
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - rangeDays);
    
    data = data.filter(d => new Date(d.date) >= cutoffDate);

    // 3. Fill gaps (optional for line chart, but good for logic) if needed, 
    // or just let the line chart connect points.
    
    // 4. Create Projections (Visual Forecast)
    if (data.length > 1) {
       // Average sales per day in the visible range
       const avgSales = data.reduce((acc, curr) => acc + curr.real, 0) / data.length;
       
       const lastItem = data[data.length - 1];
       // Connector point
       lastItem.estimated = lastItem.real;

       const lastDate = new Date(lastItem.date);
       // Forecast 4 periods
       for(let i = 1; i <= 4; i++) {
           const nextDate = new Date(lastDate);
           nextDate.setDate(lastDate.getDate() + i); // Assuming daily granularity for simplicity in demo
           
           // Simple variance logic
           const variance = Math.random() * 2 - 1; // -1 to 1
           const nextVal = Math.max(0, Math.round(avgSales + variance));
           
           data.push({
               date: nextDate.toISOString().split('T')[0],
               real: null,
               estimated: nextVal
           });
       }
    }

    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Analítica por Producto</h2>
        <div className="w-full sm:w-64">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
        </div>
      </div>

      {selectedProduct ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Total Vendido</p>
                    <h3 className="text-xl font-bold text-gray-800">{totalSold} unidades</h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Ingresos Generados</p>
                    <h3 className="text-xl font-bold text-gray-800">${totalRevenue.toLocaleString()}</h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                    <Package size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Stock Actual</p>
                    <h3 className="text-xl font-bold text-gray-800">{selectedProduct.currentStock} unidades</h3>
                </div>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-w-0">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Tendencia y Proyección</h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    {(['WEEK', 'MONTH', 'YEAR'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                timeRange === range ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {range === 'WEEK' ? '7D' : range === 'MONTH' ? '30D' : '1A'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-80 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#9ca3af" />
                        <YAxis tick={{fontSize: 10}} stroke="#9ca3af"/>
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '10px'}}/>
                        <Line type="monotone" dataKey="real" name="Ventas Reales" stroke="#059669" strokeWidth={3} dot={{r: 4, fill: '#059669'}} activeDot={{r: 6}} />
                        <Line type="monotone" dataKey="estimated" name="Proyección" stroke="#fbbf24" strokeDasharray="5 5" strokeWidth={3} dot={{r: 4, fill: '#fbbf24'}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        No hay datos suficientes en este rango de tiempo.
                    </div>
                )}
            </div>
          </div>
        </>
      ) : (
          <div className="text-center py-12 text-gray-500">
              Selecciona un producto para ver sus estadísticas.
          </div>
      )}
    </div>
  );
};

export default ProductAnalytics;