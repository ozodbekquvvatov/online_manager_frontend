import * as React from 'react';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge } from 'react-bootstrap';
import {
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, LineChart, Line, CartesianGrid, XAxis, YAxis, PieLabelRenderProps } from 'recharts';

interface DashboardMetrics {
  totalProductsValue: number;
  totalSalaryExpense: number;
  totalProfit: number;
  profitMargin: number;
  totalEmployees: number;
  totalProducts: number;
  totalSales: number;
  lowStockItems: number;
  activeEmployees: number;
  totalProductCost: number;
  totalExpenses: number;
  totalOtherExpenses: number;
  estimatedRevenue: number;
  totalRevenue: number;
  todayRevenue: number;
  todaySales: number;
  grossProfit: number;
  grossProfitMargin: number;
}

interface Product {
  id: number;
  name: string;
  cost_price: string | number;
  selling_price: string | number;
  stock_quantity: number;
  stock?: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  base_salary: string | number;
  is_active: boolean;
}

interface SaleItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
  product?: {
    name: string;
    sku?: string;
  };
}

interface Sale {
  id: number;
  orderNumber: string;
  sale_number?: string;
  totalAmount: number;
  total_amount?: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'digital';
  payment_method?: string;
  date: string;
  sale_date?: string;
  created_at?: string;
  taxAmount?: number;
  tax_amount?: number;
  discountAmount?: number;
  discount_amount?: number;
  netAmount?: number;
  items: SaleItem[];
}

interface FormattedSale {
  id: number;
  orderNumber: string;
  totalAmount: number;
  netAmount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountPercent: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'digital';
  date: string;
  items: FormattedSaleItem[];
}

interface FormattedSaleItem {
  id?: number;
  productId: number;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface FinancialData {
  name: string;
  value: number;
  color: string;
}

interface TrendData {
  date: string;
  value: number;
}

interface DailySalesData {
  date: string;
  day: string;
  sales: number;
  profit: number;
  orders: number;
  profitMargin: number;
  trend: 'up' | 'down' | 'stable';
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProductsValue: 0,
    totalSalaryExpense: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalEmployees: 0,
    totalProducts: 0,
    totalSales: 0,
    lowStockItems: 0,
    activeEmployees: 0,
    totalProductCost: 0,
    totalExpenses: 0,
    totalOtherExpenses: 0,
    estimatedRevenue: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    todaySales: 0,
    grossProfit: 0,
    grossProfitMargin: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sales, setSales] = useState<FormattedSale[]>([]);
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { user, isAuthenticated } = useAuth();

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const parseAmount = (amount: any): number => {
    if (amount === undefined || amount === null) return 0;
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const cleaned = amount.replace(/[$,]/g, '').trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const safeParseDate = (dateString: string): Date => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date();
      }
      return date;
    } catch (error) {
      return new Date();
    }
  };

  const formatSaleData = (sale: any): FormattedSale => {
    try {
      const orderNumber = sale.orderNumber || sale.sale_number || `SALE-${sale.id}`;
      const totalAmount = parseAmount(sale.totalAmount || sale.total_amount || 0);
      const paymentMethod = sale.paymentMethod || sale.payment_method || 'cash';
      const date = sale.date || sale.sale_date || sale.created_at || new Date().toISOString();
      const taxAmount = parseAmount(sale.taxAmount || sale.tax_amount || 0);
      const discountAmount = parseAmount(sale.discountAmount || sale.discount_amount || 0);
      
      const subtotal = totalAmount + discountAmount - taxAmount;
      const discountPercent = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
      const netAmount = parseAmount(sale.netAmount || totalAmount);

      const formattedItems: FormattedSaleItem[] = (sale.items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product?.name || 'Unknown product',
        sku: item.product?.sku,
        quantity: item.quantity || 0,
        unitPrice: parseAmount(item.unit_price),
        totalPrice: parseAmount(item.total_price)
      }));

      return {
        id: sale.id,
        orderNumber,
        totalAmount,
        netAmount,
        subtotal,
        taxAmount,
        discountAmount,
        discountPercent,
        status: sale.status || 'completed',
        paymentMethod,
        date,
        items: formattedItems
      };
    } catch (error) {
      return {
        id: sale.id || 0,
        orderNumber: `SALE-${sale.id || 'UNKNOWN'}`,
        totalAmount: 0,
        netAmount: 0,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        discountPercent: 0,
        status: 'completed',
        paymentMethod: 'cash',
        date: new Date().toISOString(),
        items: []
      };
    }
  };

  const fetchAllData = async () => {
    if (!isAuthenticated) {
      setError('Please log in to the system');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      
      const [employeesResponse, productsResponse, salesResponse] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/admin/employees?t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/admin/products?t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/admin/sales?t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      let employeesData: Employee[] = [];
      if (employeesResponse.status === 'fulfilled' && employeesResponse.value.ok) {
        const result = await employeesResponse.value.json();
        employeesData = Array.isArray(result.data) ? result.data : 
                      Array.isArray(result) ? result : [];
      }

      let productsData: Product[] = [];
      if (productsResponse.status === 'fulfilled' && productsResponse.value.ok) {
        const result = await productsResponse.value.json();
        productsData = Array.isArray(result.data) ? result.data : 
                     Array.isArray(result) ? result : [];
      }

      let salesData: FormattedSale[] = [];
      if (salesResponse.status === 'fulfilled' && salesResponse.value.ok) {
        const result = await salesResponse.value.json();
        const rawSales = Array.isArray(result.data) ? result.data : 
                        Array.isArray(result) ? result : [];
        salesData = rawSales.map(formatSaleData);
      }

      setEmployees(employeesData);
      setProducts(productsData);
      setSales(salesData);
      setLastUpdated(new Date());

      calculateAllMetrics(employeesData, productsData, salesData);
      
    } catch (error: any) {
      setError('Error loading data: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const calculateAllMetrics = (employeesData: Employee[], productsData: Product[], salesData: FormattedSale[]) => {
    try {
      const totalProductsValue = productsData.reduce((sum, product) => {
        const sellingPrice = parseAmount(product.selling_price);
        const stock = product.stock_quantity || product.stock || 0;
        return sum + (sellingPrice * stock);
      }, 0);

      const totalProductCost = productsData.reduce((sum, product) => {
        const costPrice = parseAmount(product.cost_price);
        const stock = product.stock_quantity || product.stock || 0;
        return sum + (costPrice * stock);
      }, 0);

      const lowStockItems = productsData.filter(product => {
        const stock = product.stock_quantity || product.stock || 0;
        return stock <= 5 && stock > 0;
      }).length;

      let totalRevenue = 0;
      let todayRevenue = 0;
      let todaySales = 0;
      const today = new Date();
      const todayString = today.toDateString();

      salesData.forEach(sale => {
        const saleAmount = sale.totalAmount || 0;
        totalRevenue += saleAmount;

        const saleDate = safeParseDate(sale.date);
        if (saleDate.toDateString() === todayString) {
          todayRevenue += saleAmount;
          todaySales += 1;
        }
      });

      const activeEmployees = employeesData.filter(emp => emp.is_active !== false);
      const totalSalaryExpense = activeEmployees.reduce((sum, emp) => {
        return sum + parseAmount(emp.base_salary);
      }, 0);

      let costOfGoodsSold = 0;
      salesData.forEach(sale => {
        sale.items.forEach(item => {
          const product = productsData.find(p => p.id === item.productId);
          if (product) {
            const costPrice = parseAmount(product.cost_price);
            costOfGoodsSold += costPrice * item.quantity;
          }
        });
      });

      const grossProfit = totalRevenue - costOfGoodsSold;
      const totalExpenses = totalSalaryExpense;
      const totalNetProfit = grossProfit - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
      const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      const dailySalesData = generateDailySalesData(salesData, productsData);

      const newMetrics: DashboardMetrics = {
        totalProductsValue,
        totalSalaryExpense,
        totalProfit: totalNetProfit,
        profitMargin,
        totalEmployees: employeesData.length,
        totalProducts: productsData.length,
        totalSales: salesData.length,
        lowStockItems,
        activeEmployees: activeEmployees.length,
        totalProductCost,
        totalExpenses,
        totalOtherExpenses: 0,
        estimatedRevenue: totalProductsValue * 0.3,
        totalRevenue,
        todayRevenue,
        todaySales,
        grossProfit,
        grossProfitMargin
      };

      setMetrics(newMetrics);
      setDailySales(dailySalesData);

    } catch (error) {
      setError('Error calculating metrics');
    }
  };

  const generateDailySalesData = (salesData: FormattedSale[], productsData: Product[]): DailySalesData[] => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyData: { [key: string]: { sales: number; profit: number; orders: number } } = {};
    
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { sales: 0, profit: 0, orders: 0 };
    }
    
    salesData.forEach(sale => {
      try {
        const saleDate = safeParseDate(sale.date);
        const dateKey = saleDate.toISOString().split('T')[0];
        
        if (dailyData[dateKey] !== undefined) {
          const saleAmount = sale.totalAmount || 0;
          
          let saleProfit = 0;
          sale.items.forEach(item => {
            const product = productsData.find(p => p.id === item.productId);
            if (product) {
              const costPrice = parseAmount(product.cost_price);
              const profitPerItem = (item.unitPrice - costPrice) * item.quantity;
              saleProfit += profitPerItem;
            }
          });
          
          if (saleProfit === 0 && saleAmount > 0) {
            saleProfit = saleAmount * 0.4;
          }
          
          dailyData[dateKey].sales += saleAmount;
          dailyData[dateKey].profit += saleProfit;
          dailyData[dateKey].orders += 1;
        }
      } catch (error) {
        // Silent error handling
      }
    });
    
    const result: DailySalesData[] = [];
    const dates = Object.keys(dailyData).sort();
    
    dates.forEach((dateKey, index) => {
      const date = safeParseDate(dateKey);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayName = days[date.getDay()];
      const dayData = dailyData[dateKey];
      
      const profitMargin = dayData.sales > 0 ? (dayData.profit / dayData.sales) * 100 : 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (index > 0) {
        const prevDateKey = dates[index - 1];
        const prevDayData = dailyData[prevDateKey];
        if (dayData.sales > prevDayData.sales * 1.1) trend = 'up';
        else if (dayData.sales < prevDayData.sales * 0.9) trend = 'down';
      }
      
      result.push({
        date: dateStr,
        day: dayName,
        sales: dayData.sales,
        profit: dayData.profit,
        orders: dayData.orders,
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        trend
      });
    });
    
    return result;
  };

  const getFinancialBreakdown = (): FinancialData[] => {
    const data: FinancialData[] = [
      { name: 'Total Revenue', value: metrics.totalRevenue, color: '#3b82f6' },
      { name: 'Today\'s Revenue', value: metrics.todayRevenue, color: '#8b5cf6' },
      { name: 'Net Profit', value: metrics.totalProfit, color: '#10b981' },
      { name: 'Products Value', value: metrics.totalProductsValue, color: '#f59e0b' },
      { name: 'Salary Expenses', value: metrics.totalSalaryExpense, color: '#ef4444' },
      { name: 'Product Costs', value: metrics.totalProductCost, color: '#dc2626' },
    ].filter(item => item.value > 0);

    return data;
  };

  const getTrendingData = (): TrendData[] => {
    return dailySales.map((day: DailySalesData) => ({
      date: day.date,
      value: day.sales
    }));
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={12} className="text-success" />;
      case 'down':
        return <TrendingUp size={12} className="text-danger rotate-180" />;
      default:
        return <div className="text-muted">—</div>;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const refreshData = () => {
    fetchAllData();
  };

  if (loading) {
    return (
      <Container fluid className="px-2 px-sm-3 py-2">
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading business data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="px-2 px-sm-3 py-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-0">Business Management Dashboard</h4>
          <p className="text-muted small mb-0">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString('en-US')}`}
          </p>
        </div>
        <Button variant="outline-primary" onClick={refreshData} size="sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-2 py-2">
          <small>{error}</small>
        </Alert>
      )}

      <Row className="g-2 mb-2">
        <Col xs={12} sm={6} xl={3}>
          <Card className="border-0 shadow-sm h-100 compact-card">
            <Card.Body className="p-2">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1">
                  <small className="text-muted fw-semibold">Products Value</small>
                  <h6 className="mb-0 fw-bold text-info">{formatCurrency(metrics.totalProductsValue)}</h6>
                  <small className="text-muted">{metrics.totalProducts} products</small>
                </div>
                <div className="bg-info bg-opacity-10 p-1 rounded">
                  <Package size={16} className="text-info" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} xl={3}>
          <Card className="border-0 shadow-sm h-100 compact-card">
            <Card.Body className="p-2">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1">
                  <small className="text-muted fw-semibold">Net Profit</small>
                  <h6 className={`mb-0 fw-bold ${metrics.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(metrics.totalProfit)}
                  </h6>
                  <small className="text-muted">{metrics.profitMargin.toFixed(1)}% profit margin</small>
                </div>
                <div className={`${metrics.totalProfit >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 p-1 rounded`}>
                  <TrendingUp size={16} className={metrics.totalProfit >= 0 ? 'text-success' : 'text-danger'} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} xl={3}>
          <Card className="border-0 shadow-sm h-100 compact-card">
            <Card.Body className="p-2">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1">
                  <small className="text-muted fw-semibold">Total Revenue</small>
                  <h6 className="mb-0 fw-bold text-primary">{formatCurrency(metrics.totalRevenue)}</h6>
                  <small className="text-muted">{metrics.totalSales} sales</small>
                </div>
                <div className="bg-primary bg-opacity-10 p-1 rounded">
                  <DollarSign size={16} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} xl={3}>
          <Card className="border-0 shadow-sm h-100 compact-card">
            <Card.Body className="p-2">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1">
                  <small className="text-muted fw-semibold">Today's Revenue</small>
                  <h6 className="mb-0 fw-bold text-purple">{formatCurrency(metrics.todayRevenue)}</h6>
                  <small className="text-muted">{metrics.todaySales} sales</small>
                </div>
                <div className="bg-purple bg-opacity-10 p-1 rounded">
                  <ShoppingCart size={16} className="text-purple" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-1 mb-2">
        <Col xs={4} sm={2}>
          <Card className="border-0 shadow-sm h-100 stats-card">
            <Card.Body className="p-1 text-center">
              <Users size={14} className="text-primary mb-1" />
              <div className="fw-bold small">{metrics.totalEmployees}</div>
              <small className="text-muted">Employees</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={4} sm={2}>
          <Card className="border-0 shadow-sm h-100 stats-card">
            <Card.Body className="p-1 text-center">
              <Package size={14} className="text-success mb-1" />
              <div className="fw-bold small">{metrics.totalProducts}</div>
              <small className="text-muted">Products</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={4} sm={2}>
          <Card className="border-0 shadow-sm h-100 stats-card">
            <Card.Body className="p-1 text-center">
              <ShoppingCart size={14} className="text-info mb-1" />
              <div className="fw-bold small">{metrics.totalSales}</div>
              <small className="text-muted">Sales</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={4} sm={2}>
          <Card className={`border-0 shadow-sm h-100 stats-card ${metrics.lowStockItems > 0 ? 'warning-card' : ''}`}>
            <Card.Body className="p-1 text-center">
              {metrics.lowStockItems > 0 ? (
                <AlertCircle size={14} className="text-warning mb-1" />
              ) : (
                <CheckCircle size={14} className="text-success mb-1" />
              )}
              <div className="fw-bold small">{metrics.lowStockItems}</div>
              <small className="text-muted">Alerts</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={4} sm={2}>
          <Card className="border-0 shadow-sm h-100 stats-card">
            <Card.Body className="p-1 text-center">
              <DollarSign size={14} className="text-danger mb-1" />
              <div className="fw-bold small">{formatCurrency(metrics.totalSalaryExpense)}</div>
              <small className="text-muted">Salaries</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={4} sm={2}>
          <Card className="border-0 shadow-sm h-100 stats-card">
            <Card.Body className="p-1 text-center">
              <TrendingUp size={14} className="text-purple mb-1" />
              <div className="fw-bold small">{metrics.profitMargin.toFixed(1)}%</div>
              <small className="text-muted">Profit %</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-2">
        <Card.Header className="bg-white border-0 py-2 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-semibold small d-flex align-items-center">
            <Calendar size={16} className="me-2" />
            Daily Sales (7 days)
          </h6>
          <Badge bg="light" text="dark" className="small">
            {dailySales.reduce((sum: number, day: DailySalesData) => sum + day.orders, 0)} orders
          </Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 small table-github">
              <thead className="bg-light">
                <tr>
                  <th className="py-2 px-3 border-0">Date</th>
                  <th className="py-2 px-3 border-0">Day</th>
                  <th className="py-2 px-3 border-0 text-end">Sales</th>
                  <th className="py-2 px-3 border-0 text-end">Profit</th>
                  <th className="py-2 px-3 border-0 text-end">Profit %</th>
                  <th className="py-2 px-3 border-0 text-center">Orders</th>
                  <th className="py-2 px-3 border-0 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {dailySales.map((day: DailySalesData, index: number) => (
                  <tr 
                    key={index} 
                    className="table-row-hover"
                    style={{ 
                      backgroundColor: day.sales > 0 ? '#f0fff4' : 'transparent',
                      borderLeft: day.sales > 0 ? '3px solid #2ea44f' : '3px solid transparent'
                    }}
                  >
                    <td className="py-2 px-3 fw-semibold">{day.date}</td>
                    <td className="py-2 px-3 text-muted">{day.day}</td>
                    <td className="py-2 px-3 text-end fw-bold">
                      {day.sales > 0 ? formatCurrency(day.sales) : '-'}
                    </td>
                    <td className="py-2 px-3 text-end">
                      <span className={`fw-bold ${day.profit > 0 ? 'text-success' : 'text-muted'}`}>
                        {day.profit > 0 ? formatCurrency(day.profit) : '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-end">
                      {day.profitMargin > 0 ? (
                        <span className={`badge ${day.profitMargin > 25 ? 'bg-success' : day.profitMargin > 15 ? 'bg-warning' : 'bg-info'}`}>
                          {day.profitMargin}%
                        </span>
                      ) : (
                        <span className="badge bg-secondary">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {day.orders > 0 ? (
                        <span className="badge bg-primary">{day.orders}</span>
                      ) : (
                        <span className="badge bg-secondary">0</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {day.sales > 0 ? getTrendIcon(day.trend) : <div className="text-muted">—</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-2 mb-2">
        <Col xs={12} xl={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 py-1">
              <h6 className="mb-0 fw-semibold small">Financial Breakdown</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getFinancialBreakdown()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={20}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} xl={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 py-1">
              <h6 className="mb-0 fw-semibold small">Sales Trend (7 days)</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={getTrendingData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 9 }}
                    tickFormatter={(value) => {
                      if (value === 0) return '$0';
                      if (value < 1000) return `$${value}`;
                      return `$${(value / 1000).toFixed(0)}k`;
                    }} 
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Sales']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 3 }}
                    activeDot={{ r: 5, fill: '#1d4ed8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .compact-card, .stats-card {
          transition: all 0.2s ease;
        }
        .compact-card:hover, .stats-card:hover {
          transform: translateY(-1px);
        }
        
        .warning-card {
          border-left: 2px solid #f59e0b !important;
        }
        
        .text-purple {
          color: #8b5cf6;
        }
        
        .bg-purple {
          background-color: #8b5cf6;
        }
        
        .rotate-180 {
          transform: rotate(180deg);
        }
        
        .table-github th {
          border-bottom: 1px solid #e1e4e8 !important;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #586069;
        }
        
        .table-github td {
          border-top: 1px solid #e1e4e8;
          border-bottom: 1px solid #e1e4e8;
          vertical-align: middle;
        }
        
        .table-row-hover:hover {
          background-color: #f6f8fa !important;
        }
      `}</style>
    </Container>
  );
}