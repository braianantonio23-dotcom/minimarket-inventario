
import React, { useState } from 'react';
import { Product, Invoice, InvoiceItem, InvoiceType } from '../types';
import { Plus, Trash2, ShoppingCart, Truck, CheckCircle } from 'lucide-react';

interface BillingProps {
  products: Product[];
  invoices: Invoice[];
  onAddInvoice: (invoice: Invoice) => void;
}

const Billing: React.FC<BillingProps> = ({ products, invoices, onAddInvoice }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('SALE');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [currentQty, setCurrentQty] = useState<number>(1);
  const [currentItems, setCurrentItems] = useState<InvoiceItem[]>([]);

  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const existingItemIndex = currentItems.findIndex(item => item.productId === product.id);
    const unitPrice = invoiceType === 'SALE' ? product.price : product.cost;

    if (existingItemIndex >= 0) {
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex].quantity += currentQty;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * unitPrice;
      setCurrentItems(updatedItems);
    } else {
      setCurrentItems([
        ...currentItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: currentQty,
          unitPrice: unitPrice,
          total: currentQty * unitPrice
        }
      ]);
    }
    setCurrentQty(1);
    setSelectedProduct('');
  };

  const handleRemoveItem = (index: number) => {
    setCurrentItems(currentItems.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = () => {
    if (currentItems.length === 0) return;

    const totalAmount = currentItems.reduce((sum, item) => sum + item.total, 0);
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      type: invoiceType,
      date: new Date().toISOString().split('T')[0],
      items: currentItems,
      totalAmount
    };

    onAddInvoice(newInvoice);
    setCurrentItems([]);
    alert(invoiceType === 'SALE' ? 'Venta registrada con éxito' : 'Reposición registrada con éxito');
  };

  const totalInvoice = currentItems.reduce((sum, item) => sum + item.total, 0);

  // Sort invoices reverse chronologically
  const sortedHistory = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Facturación y Movimientos</h2>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'NEW' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Nuevo Movimiento
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'HISTORY' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => { setInvoiceType('SALE'); setCurrentItems([]); }}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                    invoiceType === 'SALE' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' 
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingCart size={20} />
                  Registrar Venta
                </button>
                <button
                  onClick={() => { setInvoiceType('PURCHASE'); setCurrentItems([]); }}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                    invoiceType === 'PURCHASE' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold' 
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Truck size={20} />
                  Reponer Stock
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Stock: {p.currentStock} - ${invoiceType === 'SALE' ? p.price : p.cost}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={currentQty}
                    onChange={(e) => setCurrentQty(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={!selectedProduct}
                  className="w-full sm:w-auto px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                  Agregar
                </button>
              </div>
            </div>

            {/* Current Items List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Cant.</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Unit.</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 font-medium text-gray-800">{item.productName}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-gray-600">${item.unitPrice.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">${item.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No hay items agregados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Resumen {invoiceType === 'SALE' ? 'Venta' : 'Compra'}</h3>
            
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Items</span>
                <span>{currentItems.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${totalInvoice.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>${totalInvoice.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleSaveInvoice}
              disabled={currentItems.length === 0}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg transition-all ${
                invoiceType === 'SALE' 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
              } disabled:opacity-50 disabled:shadow-none`}
            >
              <CheckCircle size={20} />
              Confirmar {invoiceType === 'SALE' ? 'Venta' : 'Compra'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Detalle</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedHistory.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{inv.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      inv.type === 'SALE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {inv.type === 'SALE' ? 'VENTA' : 'COMPRA'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-800">
                      {inv.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${
                    inv.type === 'SALE' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {inv.type === 'SALE' ? '+' : '-'}${inv.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
