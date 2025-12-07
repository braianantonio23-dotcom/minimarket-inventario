
import React, { useState } from 'react';
import { ViewState, Product, Invoice } from './types';
import { INITIAL_PRODUCTS, MOCK_INVOICES } from './constants';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Billing from './components/Billing';
import ProductAnalytics from './components/ProductAnalytics';
import { LayoutDashboard, Package, Store, Menu, X, Receipt, LineChart } from 'lucide-react';

// Extract NavItem component to avoid re-creation on every render
interface NavItemProps {
  view: ViewState;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ view, icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive 
        ? 'bg-emerald-100 text-emerald-800 font-semibold shadow-sm' 
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
    }`}
  >
    <Icon size={20} />
    {label}
  </button>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // CRUD Operations
  const handleAddProduct = (newProduct: Product) => {
    setProducts([...products, newProduct]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Billing Logic
  const handleAddInvoice = (newInvoice: Invoice) => {
    // 1. Add Invoice to history
    setInvoices([...invoices, newInvoice]);

    // 2. Update Stock based on invoice type
    const updatedProducts = products.map(p => {
        const itemInInvoice = newInvoice.items.find(i => i.productId === p.id);
        if (itemInInvoice) {
            const quantityChange = itemInInvoice.quantity;
            if (newInvoice.type === 'SALE') {
                return { ...p, currentStock: Math.max(0, p.currentStock - quantityChange) };
            } else { // PURCHASE / RESTOCK
                return { 
                  ...p, 
                  currentStock: p.currentStock + quantityChange, 
                  lastRestocked: newInvoice.date 
                };
            }
        }
        return p;
    });
    setProducts(updatedProducts);
  };

  const handleNavClick = (view: ViewState) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 leading-tight">Buena Fe</h1>
              <p className="text-xs text-gray-400 font-medium">Minimarket & Bodega</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem 
              view={ViewState.DASHBOARD} 
              icon={LayoutDashboard} 
              label="Panel General" 
              isActive={currentView === ViewState.DASHBOARD}
              onClick={() => handleNavClick(ViewState.DASHBOARD)}
            />
            <NavItem 
              view={ViewState.INVENTORY} 
              icon={Package} 
              label="Inventario" 
              isActive={currentView === ViewState.INVENTORY}
              onClick={() => handleNavClick(ViewState.INVENTORY)}
            />
            <NavItem 
              view={ViewState.BILLING} 
              icon={Receipt} 
              label="Facturación" 
              isActive={currentView === ViewState.BILLING}
              onClick={() => handleNavClick(ViewState.BILLING)}
            />
            <NavItem 
              view={ViewState.ANALYTICS} 
              icon={LineChart} 
              label="Estadísticas" 
              isActive={currentView === ViewState.ANALYTICS}
              onClick={() => handleNavClick(ViewState.ANALYTICS)}
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100 text-xs text-gray-400 text-center">
            &copy; 2024 Buena Fe Systems
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm font-medium text-gray-600">Sistema Online</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm">
              BF
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {currentView === ViewState.DASHBOARD && (
              <Dashboard products={products} invoices={invoices} />
            )}
            {currentView === ViewState.INVENTORY && (
              <Inventory 
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}
            {currentView === ViewState.BILLING && (
              <Billing 
                products={products}
                invoices={invoices}
                onAddInvoice={handleAddInvoice}
              />
            )}
            {currentView === ViewState.ANALYTICS && (
              <ProductAnalytics 
                products={products}
                invoices={invoices}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
