import React, { useState } from 'react';
import { Product, Invoice, AiPrediction } from '../types';
import { getInventoryPrediction } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import { Loader2, BrainCircuit, TrendingUp, PackageCheck, ArrowUpCircle, ArrowDownCircle, Scale, AlertTriangle, X, DollarSign } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  invoices: Invoice[];
}

const Dashboard: React.FC<DashboardProps> = ({ products, invoices }) => {
  const [prediction, setPrediction] = useState<AiPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'YEAR'>('MONTH');
  const [showAlert, setShowAlert] = useState(true);

  // 1. Inventory Calculations
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);
  
  // Real Asset Value (Money tied up in inventory based on COST)
  const totalInventoryCost = products.reduce((acc, p) => acc + (p.currentStock * p.cost), 0);
  
  // Potential Revenue (If everything is sold at current PRICE)
  const totalPotentialRevenue = products.reduce((acc, p) => acc + (p.currentStock * p.price), 0);

  // 2. Financial History Calculations (Cash Flow)
  const totalSales = invoices
    .filter(i => i.type === 'SALE')
    .reduce((acc, i) => acc + i.totalAmount, 0);

  const totalPurchases = invoices
    .filter(i => i.type === 'PURCHASE')
    .reduce((acc, i) => acc + i.totalAmount, 0);

  const netProfit = totalSales - totalPurchases;
  const isProfitPositive = netProfit >= 0;

  // AI Report Handler
  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInventoryPrediction(products, invoices);
      setPrediction(result);
    } catch (e) {
      setError("No se pudo generar el reporte. Verifica tu conexión o clave API.");
    } finally {
      setLoading(false);
    }
  };

  // Chart Logic: Project Future Trends
  const generateChartData = () => {
    const dataMap = new Map<string, { sales: number, purchases: number }>();
    
    // Sort invoices
    const sortedInvoices = [...invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Aggregate historical data
    sortedInvoices.forEach(inv => {
        const date = inv.date;
        const current = dataMap.get(date) || { sales: 0, purchases: 0 };
        if (inv.type === 'SALE') current.sales += inv.totalAmount;
        else current.purchases += inv.totalAmount;
        dataMap.set(date, current);
    });

    let chartData: any[] = Array.from(dataMap.entries())
        .map(([date, d]) => ({ 
            date, 
            sales: d.sales, 
            purchases: d.purchases,
            estimated: null as number | null // Initialize estimated as null for historical
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter based on Time Range
    const today = new Date();
    const rangeDays = timeRange === 'WEEK' ? 7 : timeRange === 'MONTH' ? 30 : 365;
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - rangeDays);

    chartData = chartData.filter(d => new Date(d.date) >= cutoffDate);

    // Projection Logic
    if (chartData.length > 2) {
        // Calculate average growth or simple linear trend from last few points
        const lastPoints = chartData.slice(-5); // Use last 5 days for trend
        const avgSales = lastPoints.reduce((sum, p) => sum + p.sales, 0) / lastPoints.length;
        
        // Starting point for estimation is the last real data point
        const lastRealData = chartData[chartData.length - 1];
        
        // Add a "connector" point so the line is continuous
        // We modify the last real point to also be the start of the estimation, 
        // OR we just rely on Recharts connectNulls if we want gaps. 
        // Better visual: The last real sales point is also the first estimated point.
        lastRealData.estimated = lastRealData.sales; 

        const lastDate = new Date(lastRealData.date);
        
        // Project 5 periods into the future
        for(let i = 1; i <= 5; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);
            
            // Add some randomness to the projection based on the average
            const trendFactor = 1 + (Math.random() * 0.2 - 0.1); // +/- 10% variance
            const projectedValue = Math.round(avgSales * trendFactor);

            chartData.push({
                date: nextDate.toISOString().split('T')[0],
                sales: null,     // No real sales in future
                purchases: null, // No purchases in future (unless scheduled)
                estimated: projectedValue
            });
        }
    }
    
    return chartData;
  };

  const financialChartData = generateChartData();

  const inventoryChartData = products.map(p => ({
    name: p.name.split(' ')[0], 
    stock: p.currentStock,
    min: p.minStock,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Alert Banner for Low Stock */}
      {showAlert && lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-red-800">Alerta de Stock Bajo</h3>
              <p className="text-sm text-red-700 mt-1">
                Tienes {lowStockProducts.length} productos por debajo del stock mínimo ({lowStockProducts.map(p => p.name).join(', ')}).
                Revisa el inventario o la sección de IA para recomendaciones.
              </p>
            </div>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-red-400 hover:text-red-600">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inventory Value (Cost) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <PackageCheck size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Activo en Bodega</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">${totalInventoryCost.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Costo total productos en stock</p>
          </div>
        </div>

        {/* Card 2: Total Sales */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <ArrowUpCircle size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas Totales</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">${totalSales.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Ingresos brutos acumulados</p>
          </div>
        </div>

        {/* Card 3: Total Purchases */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <ArrowDownCircle size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gastos en Compras</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">${totalPurchases.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Inversión en reposición</p>
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${isProfitPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <Scale size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ganancia Neta</span>
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${isProfitPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isProfitPositive ? '+' : ''}${netProfit.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Ventas - Compras (Cash Flow)</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Financial Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
             <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-gray-400" />
                Flujo de Caja Real vs Estimado
             </h3>
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
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialChartData}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{fontSize: 10}} tickMargin={10} stroke="#9ca3af" />
                    <YAxis tick={{fontSize: 10}} stroke="#9ca3af" tickFormatter={(val) => `$${val}`} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/>
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '10px', fontSize: '12px'}}/>
                    
                    {/* Ventas Reales */}
                    <Area type="monotone" dataKey="sales" name="Ventas Reales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    
                    {/* Ventas Estimadas (Dashed) */}
                    <Area type="monotone" dataKey="estimated" name="Ventas Estimadas" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0.5} fill="url(#colorSales)" />
                    
                    {/* Compras */}
                    <Area type="monotone" dataKey="purchases" name="Compras (Gastos)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorPurchases)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Level Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-w-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Stock Actual vs Mínimo</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                Potencial Venta: ${totalPotentialRevenue.toLocaleString()}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fontSize: 10}} tickMargin={10} stroke="#9ca3af" />
                <YAxis tick={{fontSize: 10}} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`${value} un.`, 'Stock']}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '10px', fontSize: '12px'}} />
                <Bar dataKey="stock" name="Actual" radius={[4, 4, 0, 0]}>
                  {inventoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.stock < entry.min ? '#ef4444' : '#6366f1'} />
                  ))}
                </Bar>
                <Bar dataKey="min" name="Mínimo" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BrainCircuit className="text-purple-600" />
              IA Predictiva Buena Fe
            </h3>
            <button 
              onClick={handleGenerateReport}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md shadow-purple-200"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Analizar Negocio'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[200px] bg-gray-50 rounded-lg p-4 border border-gray-100">
            {!prediction && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center py-8">
                <BrainCircuit size={48} className="mb-2 opacity-20" />
                <p>Presiona "Analizar Negocio" para obtener predicciones de ventas y recomendaciones de compra.</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-purple-600 py-8">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="animate-pulse">Analizando inventario y flujo de caja...</p>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-center p-4">
                {error}
              </div>
            )}

            {prediction && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-900 leading-relaxed">
                  <strong>Resumen:</strong> {prediction.analysis}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
                      <TrendingUp size={16} /> Predicciones de Demanda
                    </h4>
                    <ul className="space-y-2">
                      {prediction.predictions.map((pred, i) => (
                        <li key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                          <span className="font-medium text-gray-800">{pred.productName}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              pred.urgency === 'Alta' ? 'bg-red-100 text-red-700' : 
                              pred.urgency === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {pred.urgency}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 w-full mt-1 block sm:hidden">{pred.predictedDemand}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide flex items-center gap-2">
                      <PackageCheck size={16} /> Recomendación de Compra
                    </h4>
                    <ul className="space-y-2">
                      {prediction.restockRecommendations.map((rec, i) => (
                        <li key={i} className="bg-white p-3 rounded-lg border border-gray-100 border-l-4 border-l-emerald-400 shadow-sm">
                          <div className="flex justify-between font-medium">
                            <span>{rec.productName}</span>
                            <span className="text-emerald-600 font-bold">+{rec.suggestedQuantity} un.</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {prediction.financialTip && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                    <DollarSign size={18} className="mt-0.5" />
                    <p><strong>Tip Financiero:</strong> {prediction.financialTip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default Dashboard;