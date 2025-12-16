// contexts/DataContext.tsx
import * as React from 'react';
import { useAuth } from './AuthContext';

interface DataContextType {
  employees: any[];
  products: any[];
  sales: any[];
  expenses: any[];
  refreshAllData: () => Promise<void>;
  lastUpdated: Date | null;
}

const DataContext = React.createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: React.ReactNode;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [sales, setSales] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { isAuthenticated, getToken } = useAuth();

  const fetchEmployees = async (): Promise<any[]> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/employees?t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch employees');
    
    const result = await response.json();
    // Parse the data same way as your Employees component
    if (result.success && result.data) return Array.isArray(result.data) ? result.data : [];
    if (Array.isArray(result)) return result;
    if (result.employees && Array.isArray(result.employees)) return result.employees;
    if (result.data && Array.isArray(result.data)) return result.data;
    return [];
  };

  const fetchProducts = async (): Promise<any[]> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/products?t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch products');
    
    const result = await response.json();
    if (result.success && result.data) return Array.isArray(result.data) ? result.data : [];
    if (Array.isArray(result)) return result;
    if (result.data && Array.isArray(result.data)) return result.data;
    return [];
  };

  const fetchSales = async (): Promise<any[]> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/sales?t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch sales');
    
    const result = await response.json();
    if (result.success && result.data) return Array.isArray(result.data) ? result.data : [];
    if (Array.isArray(result)) return result;
    if (result.data && Array.isArray(result.data)) return result.data;
    return [];
  };

  const refreshAllData = async () => {
    if (!isAuthenticated) return;

    try {
      const [employeesData, productsData, salesData] = await Promise.all([
        fetchEmployees(),
        fetchProducts(),
        fetchSales()
      ]);

      setEmployees(employeesData);
      setProducts(productsData);
      setSales(salesData);
      setLastUpdated(new Date());
      
    } catch (error) {
    }
  };

  // Auto-refresh data
  React.useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
      const interval = setInterval(refreshAllData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const value: DataContextType = {
    employees,
    products,
    sales,
    expenses,
    refreshAllData,
    lastUpdated
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};  