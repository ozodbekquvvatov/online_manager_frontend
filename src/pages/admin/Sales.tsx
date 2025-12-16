import * as React from 'react';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, Modal, InputGroup, Alert, Pagination } from 'react-bootstrap';
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  BarChart3,
  Save,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useBusinessCalculations } from '../../hooks/useBusinessCalculations';
import axios from 'axios';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  products?: unknown;
  message?: string;
}

interface Sale {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'digital';
  date: string;
  items: SaleItem[];
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  discountPercent?: number;
}

interface SaleItem {
  id?: number;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productId?: number;
}

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  pendingOrders: number;
  completedOrders: number;
  todaySales: number;
  monthlyGrowth: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  stock_quantity: number;
  unit_of_measure: string;
}

export const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todaySales: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [newSaleForm, setNewSaleForm] = useState({
    paymentMethod: 'cash' as 'cash' | 'card' | 'transfer' | 'digital',
    discountPercent: 0,
    items: [] as Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>
  });

  const [editSaleForm, setEditSaleForm] = useState({
    paymentMethod: 'cash' as 'cash' | 'card' | 'transfer' | 'digital',
    status: 'pending' as 'completed' | 'pending' | 'cancelled',
    paymentStatus: 'pending' as 'pending' | 'paid' | 'refunded',
    discountPercent: 0,
    items: [] as Array<{
      id?: number;
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editSelectedProduct, setEditSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [editQuantity, setEditQuantity] = useState('1');

  const calculations = useBusinessCalculations();

  const API_BASE_URL = 'https://onlinemanagerbackend-production.up.railway.app';

  const formatCurrency = (amount: number) => {
    return calculations.formatCurrency(amount);
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      try {
        const productsResponse = await axios.get(`${API_BASE_URL}/api/admin/products`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        const productsData = productsResponse.data as ApiResponse;
        if (productsData.success) {
          const products = (productsData.data || productsData.products || []) as Product[];
          setProducts(products);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      }

      const salesResponse = await axios.get(`${API_BASE_URL}/api/admin/sales`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const salesData = salesResponse.data as ApiResponse;
      if (salesData.success && salesData.data) {
        setSales(salesData.data as Sale[]);
      } else {
        setSales([]);
      }

      try {
        const statsResponse = await axios.get(`${API_BASE_URL}/api/admin/sales/stats`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });

        const statsData = statsResponse.data as ApiResponse;
        if (statsData.success && statsData.data) {
          setStats(statsData.data as SalesStats);
        }
      } catch {
        // Silently ignore stats error, use calculated stats
      }

    } catch (error: any) {
      setError(error.message || 'Failed to load data');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = searchTerm === '' || 
      sale.items.some(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={14} />
      </Pagination.Prev>
    );

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => paginate(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => paginate(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={14} />
      </Pagination.Next>
    );

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <small className="text-muted">
          Showing: {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSales.length)} of {filteredSales.length}
        </small>
        <Pagination className="mb-0">{items}</Pagination>
      </div>
    );
  };

  const handleDeleteSale = async (saleId: number) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await axios.delete(
          `${API_BASE_URL}/api/admin/sales/${saleId}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );

        const responseData = response.data as ApiResponse;
        if (responseData.success) {
          setSuccess('Sale deleted successfully');
          fetchSalesData();
          setCurrentPage(1);
        } else {
          throw new Error(responseData.message || 'Failed to delete sale');
        }
      } catch (error) {
        const err = error as Error;
        setError(err.message || 'Failed to delete sale');
      }
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setEditSaleForm({
      paymentMethod: sale.paymentMethod,
      status: sale.status === 'refunded' ? 'cancelled' : sale.status,
      paymentStatus: sale.status === 'completed' ? 'paid' : 
                    sale.status === 'refunded' ? 'refunded' : 'pending',
      discountPercent: sale.discountPercent || 0,
      items: sale.items.map(item => ({
        id: item.id,
        productId: item.productId || 0,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
    });
    setShowEditSaleModal(true);
  };

  const handleUpdateSale = async () => {
    if (!editingSale) return;

    try {
      const token = localStorage.getItem('admin_token');
      
      const totalAmount = editSaleForm.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const discountAmount = totalAmount * (editSaleForm.discountPercent / 100);
      const taxAmount = 0;

      const saleData = {
        payment_method: editSaleForm.paymentMethod,
        status: editSaleForm.status,
        payment_status: editSaleForm.paymentStatus,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        discount_percent: editSaleForm.discountPercent,
        items: editSaleForm.items.map(item => ({
          id: item.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice
        }))
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/admin/sales/${editingSale.id}`,
        saleData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      const responseData = response.data as ApiResponse;
      if (responseData.success) {
        setSuccess('Sale updated successfully');
        setShowEditSaleModal(false);
        setEditingSale(null);
        
        await fetchSalesData();
        
      } else {
        throw new Error(responseData.message || 'Failed to update sale');
      }
    } catch (error) {
      const err = error as Error;
      const errorMessage = err.message || 'Failed to update sale';
      
      setError(`Server error: ${errorMessage}`);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      setError('Please select a product and quantity');
      return;
    }

    if (selectedProduct.stock_quantity < parseInt(quantity)) {
      setError('Insufficient stock available');
      return;
    }

    const newItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: parseInt(quantity),
      unitPrice: selectedProduct.selling_price,
      totalPrice: selectedProduct.selling_price * parseInt(quantity)
    };

    setNewSaleForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setSelectedProduct(null);
    setQuantity('1');
    setProductSearchTerm('');
    setSearchResults([]);
  };

  const handleProductSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    
    try {
      const token = localStorage.getItem('admin_token');
      
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/admin/products/search?q=${encodeURIComponent(searchTerm)}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        const responseData = response.data as ApiResponse;
        if (responseData.success) {
          setSearchResults((responseData.data as Product[]) || []);
          return;
        }
      } catch {
        // Fallback to local search
      }

      if (products.length > 0) {
        const filtered = products.filter(product => {
          if (!product) return false;
          
          const searchLower = searchTerm.toLowerCase();
          const nameMatch = product.name?.toLowerCase().includes(searchLower) || false;
          const skuMatch = product.sku?.toLowerCase().includes(searchLower) || false;
          
          return (nameMatch || skuMatch) && product.stock_quantity > 0;
        }).slice(0, 10);
        
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }

    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setProductSearchTerm(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      handleProductSearch(value);
    }, 300);
    
    setSearchTimeout(newTimeout);
  };

  const handleAddEditItem = () => {
    if (!editSelectedProduct || !editQuantity || parseInt(editQuantity) <= 0) {
      setError('Please select a product and quantity');
      return;
    }

    const newItem = {
      productId: editSelectedProduct.id,
      productName: editSelectedProduct.name,
      quantity: parseInt(editQuantity),
      unitPrice: editSelectedProduct.selling_price,
      totalPrice: editSelectedProduct.selling_price * parseInt(editQuantity)
    };

    setEditSaleForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setEditSelectedProduct(null);
    setEditQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    setNewSaleForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveEditItem = (index: number) => {
    setEditSaleForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCreateSale = async () => {
    if (newSaleForm.items.length === 0) {
      setError('Please add at least one product');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const totalAmount = newSaleForm.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discountAmount = totalAmount * (newSaleForm.discountPercent / 100);
      const taxAmount = 0;

      const saleData = {
        payment_method: newSaleForm.paymentMethod,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        discount_percent: newSaleForm.discountPercent,
        items: newSaleForm.items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice
        }))
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/admin/sales`,
        saleData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      const responseData = response.data as ApiResponse;
      if (responseData.success) {
        setSuccess('New sale created successfully');
        setShowNewSaleModal(false);
        setNewSaleForm({
          paymentMethod: 'cash',
          discountPercent: 0,
          items: []
        });
        setProductSearchTerm('');
        setSearchResults([]);
        setSelectedProduct(null);
        fetchSalesData();
        setCurrentPage(1);
      } else {
        throw new Error(responseData.message || 'Failed to create sale');
      }
    } catch (error) {
      const err = error as Error;
      const errorMessage = err.message || 'Failed to create sale';
      
      setError(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      cancelled: 'danger',
      refunded: 'secondary'
    };
    
    const icons = {
      completed: <CheckCircle size={10} className="me-1" />,
      pending: <Clock size={10} className="me-1" />,
      cancelled: <Trash2 size={10} className="me-1" />,
      refunded: <RefreshCw size={10} className="me-1" />
    };

    const labels = {
      completed: 'Completed',
      pending: 'Pending',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };

    return (
      <Badge bg={variants[status as keyof typeof variants]} className="d-flex align-items-center fs-8" style={{ width: 'fit-content' }}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      card: 'primary',
      cash: 'success',
      transfer: 'info',
      digital: 'warning'
    };

    const labels = {
      card: 'Card',
      cash: 'Cash',
      transfer: 'Transfer',
      digital: 'Digital'
    };

    return <Badge bg={variants[method as keyof typeof variants]} className="fs-8">{labels[method as keyof typeof labels]}</Badge>;
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  const handleCreateNewSale = () => {
    setShowNewSaleModal(true);
  };

  const totalNewSaleAmount = newSaleForm.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const newDiscountAmount = totalNewSaleAmount * (newSaleForm.discountPercent / 100);
  const taxAmount = 0;
  const netAmount = totalNewSaleAmount - newDiscountAmount;

  const totalEditSaleAmount = editSaleForm.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const editDiscountAmount = totalEditSaleAmount * (editSaleForm.discountPercent / 100);
  const editTaxAmount = 0;
  const editNetAmount = totalEditSaleAmount - editDiscountAmount;

  if (loading) {
    return (
      <Container fluid className="px-2">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted small">Loading sales data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="fade-in px-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-1">Sales</h4>
          <p className="text-muted small mb-0">Orders and sales metrics</p>
        </div>
        <div className="d-flex gap-1">
          <Button variant="outline-primary" size="sm" className="p-1" onClick={fetchSalesData}>
            <RefreshCw size={14} />
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreateNewSale}>
            <Plus size={14} className="me-1" />
            <span className="d-none d-sm-inline">New</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3 small">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-3 small">
          {success}
        </Alert>
      )}

      <Row className="g-2 mb-3">
        <Col xs={6} sm={3}>
          <Card className="h-100">
            <Card.Body className="p-2">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-1 rounded me-2">
                  <DollarSign size={14} className="text-primary" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 small">{formatCurrency(stats.totalRevenue)}</h6>
                  <small className="text-muted">Revenue</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="h-100">
            <Card.Body className="p-2">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-1 rounded me-2">
                  <ShoppingCart size={14} className="text-success" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 small">{stats.totalSales}</h6>
                  <small className="text-muted">Sales</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="h-100">
            <Card.Body className="p-2">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-1 rounded me-2">
                  <BarChart3 size={14} className="text-info" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 small">{formatCurrency(stats.averageOrderValue)}</h6>
                  <small className="text-muted">Average</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={3}>
          <Card className="h-100">
            <Card.Body className="p-2">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 p-1 rounded me-2">
                  <TrendingUp size={14} className="text-warning" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 small">{formatCurrency(stats.todaySales)}</h6>
                  <small className="text-muted">Today</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-1 mb-3">
        <Col xs={4}>
          <Card className="text-center h-100">
            <Card.Body className="p-1">
              <Users size={12} className="text-primary mb-1" />
              <h6 className="fw-bold mb-0 small">{stats.conversionRate}%</h6>
              <small className="text-muted">Conversion</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={4}>
          <Card className="text-center h-100">
            <Card.Body className="p-1">
              <Clock size={12} className="text-warning mb-1" />
              <h6 className="fw-bold mb-0 small">{stats.pendingOrders}</h6>
              <small className="text-muted">Pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={4}>
          <Card className="text-center h-100">
            <Card.Body className="p-1">
              <CheckCircle size={12} className="text-success mb-1" />
              <h6 className="fw-bold mb-0 small">{stats.completedOrders}</h6>
              <small className="text-muted">Completed</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-3">
        <Card.Body className="p-2">
          <Row className="g-1">
            <Col xs={12} md={6}>
              <div className="position-relative">
                <Search size={12} className="position-absolute top-50 start-2 translate-middle-y text-muted" />
                <Form.Control
                  type="text"
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="ps-4"
                  size="sm"
                />
              </div>
            </Col>
            <Col xs={6} md={3}>
              <Form.Select 
                size="sm" 
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={3}>
              <Button variant="outline-secondary" size="sm" onClick={fetchSalesData} className="w-100">
                <RefreshCw size={12} />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="bg-white py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-semibold small">Sales ({filteredSales.length})</h6>
            <Badge bg="light" text="dark" className="fs-8">
              Page: {currentPage}/{totalPages}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {currentSales.length === 0 ? (
            <div className="text-center py-3">
              <ShoppingCart size={24} className="text-muted mb-1" />
              <p className="text-muted small mb-2">No sales found</p>
              <Button variant="primary" size="sm" onClick={handleCreateNewSale}>
                <Plus size={12} className="me-1" />
                New Sale
              </Button>
            </div>
          ) : (
            <>
              <div className="list-group list-group-flush">
                {currentSales.map((sale) => (
                  <div key={sale.id} className="list-group-item p-2 border-bottom">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center">
                        <strong className="small text-primary">#{sale.orderNumber}</strong>
                        <small className="text-muted ms-2">{new Date(sale.date).toLocaleDateString()}</small>
                      </div>
                      {getStatusBadge(sale.status)}
                    </div>

                    <div className="mb-1">
                      <div className="fw-semibold small">
                        {sale.items.map(item => item.productName).join(', ')}
                      </div>
                      <small className="text-muted">
                        {sale.items.length} products • {getPaymentMethodBadge(sale.paymentMethod)}
                      </small>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="text-success small">{formatCurrency(sale.netAmount)}</strong>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="p-0"
                          style={{ width: '24px', height: '24px' }}
                          onClick={() => handleViewSale(sale)}
                          title="View"
                        >
                          <Eye size={10} />
                        </Button>
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          className="p-0"
                          style={{ width: '24px', height: '24px' }}
                          onClick={() => handleEditSale(sale)}
                          title="Edit"
                        >
                          <Edit size={10} />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          className="p-0"
                          style={{ width: '24px', height: '24px' }}
                          onClick={() => handleDeleteSale(sale.id)}
                          title="Delete"
                        >
                          <Trash2 size={10} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {renderPagination()}
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showSaleModal} onHide={() => setShowSaleModal(false)} centered scrollable size="lg">
        <Modal.Header closeButton className="py-2">
          <Modal.Title className="h6">Order #{selectedSale?.orderNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-2">
          {selectedSale && (
            <>
              <Row className="g-2 mb-2">
                <Col md={6}>
                  <h6 className="text-muted border-bottom pb-1 small">Order Information</h6>
                  <div className="mb-1">
                    <small className="text-muted d-block">Date</small>
                    <strong className="small">{new Date(selectedSale.date).toLocaleString()}</strong>
                  </div>
                  <div className="mb-1">
                    <small className="text-muted d-block">Payment Method</small>
                    <div>{getPaymentMethodBadge(selectedSale.paymentMethod)}</div>
                  </div>
                  <div className="mb-1">
                    <small className="text-muted d-block">Status</small>
                    <div>{getStatusBadge(selectedSale.status)}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted border-bottom pb-1 small">Summary</h6>
                  <div className="mb-1">
                    <small className="text-muted d-block">Number of Products</small>
                    <strong className="small">{selectedSale.items.length} items</strong>
                  </div>
                  <div className="mb-1">
                    <small className="text-muted d-block">Total Amount</small>
                    <strong className="text-success small">{formatCurrency(selectedSale.totalAmount)}</strong>
                  </div>
                </Col>
              </Row>

              <h6 className="text-muted border-bottom pb-1 small">Products</h6>
              <div className="list-group list-group-flush">
                {selectedSale.items?.map(item => (
                  <div key={item.id} className="list-group-item px-0 py-1">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="fw-semibold small">{item.productName}</div>
                      <strong className="small">{formatCurrency(item.totalPrice)}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">SKU: {item.sku || 'N/A'}</small>
                      <small className="text-muted">{item.quantity} x {formatCurrency(item.unitPrice)}</small>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-2">
                    <small className="text-muted">No products found</small>
                  </div>
                )}
              </div>

              <div className="mt-3 p-2 bg-light rounded">
                <div className="d-flex justify-content-between mb-1">
                  <small>Subtotal:</small>
                  <strong className="small">{formatCurrency(selectedSale.totalAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small>Discount ({selectedSale.discountPercent || 0}%):</small>
                  <strong className="text-danger small">-{formatCurrency(selectedSale.discountAmount)}</strong>
                </div>
                <hr className="my-1" />
                <div className="d-flex justify-content-between">
                  <strong className="small">Total Amount:</strong>
                  <strong className="text-success small">{formatCurrency(selectedSale.netAmount)}</strong>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="py-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowSaleModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditSaleModal} onHide={() => setShowEditSaleModal(false)} centered scrollable size="lg">
        <Modal.Header closeButton className="py-2">
          <Modal.Title className="h6">Edit: #{editingSale?.orderNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-2">
          <Row className="g-2">
            <Col md={6}>
              <h6 className="text-muted border-bottom pb-1 small">Payment Information</h6>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Payment Method</Form.Label>
                <Form.Select
                  value={editSaleForm.paymentMethod}
                  onChange={(e) => setEditSaleForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  size="sm"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                  <option value="digital">Digital</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <h6 className="text-muted border-bottom pb-1 small">Order Status</h6>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Status</Form.Label>
                <Form.Select
                  value={editSaleForm.status}
                  onChange={(e) => setEditSaleForm(prev => ({ ...prev, status: e.target.value as any }))}
                  size="sm"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Payment Status</Form.Label>
                <Form.Select
                  value={editSaleForm.paymentStatus}
                  onChange={(e) => setEditSaleForm(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                  size="sm"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <hr className="my-2" />

          <Row className="g-2">
            <Col md={12}>
              <h6 className="text-muted border-bottom pb-1 small">Discount</h6>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Discount Percentage (%)</Form.Label>
                <Form.Control
                  type="number"
                  value={editSaleForm.discountPercent}
                  onChange={(e) => setEditSaleForm(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Enter discount percentage"
                  size="sm"
                />
                <Form.Text className="text-muted small">
                  Total: {formatCurrency(totalEditSaleAmount)} • Discount: {formatCurrency(editDiscountAmount)}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <hr className="my-2" />

          <Row className="g-2">
            <Col md={12}>
              <h6 className="text-muted border-bottom pb-1 small">Products</h6>
              <Row className="g-2 mb-2">
                <Col md={8}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold">Product</Form.Label>
                    <Form.Select
                      value={editSelectedProduct?.id || ''}
                      onChange={(e) => {
                        const productId = parseInt(e.target.value);
                        const product = products.find(p => p.id === productId);
                        setEditSelectedProduct(product || null);
                      }}
                      size="sm"
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.selling_price)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold">Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      min="1"
                      placeholder="Enter quantity"
                      size="sm"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={handleAddEditItem}
                disabled={!editSelectedProduct || !editQuantity || parseInt(editQuantity) <= 0}
                className="w-100 mb-3"
              >
                <Plus size={12} className="me-1" />
                Add Product
              </Button>
            </Col>
          </Row>

          {editSaleForm.items.length > 0 && (
            <>
              <div className="list-group list-group-flush">
                {editSaleForm.items.map((item, index) => (
                  <div key={index} className="list-group-item px-0 py-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">{item.productName}</div>
                        <small className="text-muted">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </small>
                      </div>
                      <div className="text-end">
                        <strong className="text-primary d-block small">{formatCurrency(item.totalPrice)}</strong>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="p-0 mt-1"
                          style={{ width: '20px', height: '20px' }}
                          onClick={() => handleRemoveEditItem(index)}
                        >
                          <Trash2 size={10} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 p-2 bg-light rounded">
                <div className="d-flex justify-content-between mb-1">
                  <small>Subtotal:</small>
                  <strong className="small">{formatCurrency(totalEditSaleAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small>Discount ({editSaleForm.discountPercent}%):</small>
                  <strong className="text-danger small">-{formatCurrency(editDiscountAmount)}</strong>
                </div>
                <hr className="my-1" />
                <div className="d-flex justify-content-between">
                  <strong className="small">Total Amount:</strong>
                  <strong className="text-success small">{formatCurrency(editNetAmount)}</strong>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="py-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowEditSaleModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={handleUpdateSale}
            disabled={editSaleForm.items.length === 0}
          >
            <Save size={12} className="me-1" />
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showNewSaleModal} onHide={() => setShowNewSaleModal(false)} centered scrollable size="lg">
        <Modal.Header closeButton className="py-2">
          <Modal.Title className="h6">New Sale</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-2">
          <Row className="g-2">
            <Col md={6}>
              <h6 className="text-muted border-bottom pb-1 small">Payment Information</h6>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Payment Method</Form.Label>
                <Form.Select
                  value={newSaleForm.paymentMethod}
                  onChange={(e) => setNewSaleForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  size="sm"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                  <option value="digital">Digital</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <h6 className="text-muted border-bottom pb-1 small">Discount</h6>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Discount Percentage (%)</Form.Label>
                <Form.Control
                  type="number"
                  value={newSaleForm.discountPercent}
                  onChange={(e) => setNewSaleForm(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Enter discount percentage"
                  size="sm"
                />
                <Form.Text className="text-muted small">
                  Total: {formatCurrency(totalNewSaleAmount)} • Discount: {formatCurrency(newDiscountAmount)}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <hr className="my-2" />

          <Row className="g-2">
            <Col md={12}>
              <h6 className="text-muted border-bottom pb-1 small">Product Search</h6>
              
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Search by product name or SKU</Form.Label>
                <InputGroup size="sm">
                  <Form.Control
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by product name or SKU..."
                  />
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setProductSearchTerm('');
                      setSearchResults([]);
                      setSelectedProduct(null);
                    }}
                  >
                    <Trash2 size={12} />
                  </Button>
                </InputGroup>
              </Form.Group>

              {searchLoading && (
                <div className="text-center py-2">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Searching...</span>
                  </div>
                  <small className="text-muted ms-2">Searching...</small>
                </div>
              )}

              {productSearchTerm && !searchLoading && (
                <div className="mb-3">
                  {searchResults.length === 0 ? (
                    <Alert variant="warning" className="py-2 small mb-0">
                      <Search size={14} className="me-1" />
                      Nothing found for "{productSearchTerm}"
                    </Alert>
                  ) : (
                    <div className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className={`list-group-item list-group-item-action p-2 cursor-pointer ${
                            selectedProduct?.id === product.id ? 'bg-primary text-white' : ''
                          }`}
                          onClick={() => {
                            setSelectedProduct(product);
                            setProductSearchTerm('');
                            setSearchResults([]);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="fw-semibold small">{product.name}</div>
                              <small className={selectedProduct?.id === product.id ? 'text-white-50' : 'text-muted'}>
                                SKU: {product.sku || 'N/A'} • Price: {formatCurrency(product.selling_price)}
                              </small>
                              <br />
                              <small className={selectedProduct?.id === product.id ? 'text-white-50' : 'text-muted'}>
                                Stock: {product.stock_quantity} {product.unit_of_measure}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedProduct && (
                <Alert variant="info" className="py-2 small">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Selected: {selectedProduct.name}</strong>
                      <br />
                      <small>
                        Price: {formatCurrency(selectedProduct.selling_price)} • 
                        Stock: {selectedProduct.stock_quantity} {selectedProduct.unit_of_measure}
                      </small>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(null);
                        setQuantity('1');
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </Alert>
              )}

              <Row className="g-2 mb-2">
                <Col md={8}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold">Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      max={selectedProduct?.stock_quantity}
                      placeholder="Enter quantity"
                      size="sm"
                      disabled={!selectedProduct}
                    />
                    {selectedProduct && (
                      <Form.Text className="text-muted small">
                        Maximum: {selectedProduct.stock_quantity} pieces
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleAddItem}
                    disabled={!selectedProduct || !quantity || parseInt(quantity) <= 0}
                    className="w-100 mt-4"
                  >
                    <Plus size={12} className="me-1" />
                    Add
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>

          {newSaleForm.items.length > 0 && (
            <>
              <hr className="my-2" />
              <h6 className="text-muted border-bottom pb-1 small">Sale Products ({newSaleForm.items.length})</h6>
              <div className="list-group list-group-flush">
                {newSaleForm.items.map((item, index) => (
                  <div key={index} className="list-group-item px-0 py-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">{item.productName}</div>
                        <small className="text-muted">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </small>
                      </div>
                      <div className="text-end">
                        <strong className="text-primary d-block small">{formatCurrency(item.totalPrice)}</strong>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="p-0 mt-1"
                          style={{ width: '20px', height: '20px' }}
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 size={10} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 p-2 bg-light rounded">
                <div className="d-flex justify-content-between mb-1">
                  <small>Subtotal:</small>
                  <strong className="small">{formatCurrency(totalNewSaleAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <small>Discount ({newSaleForm.discountPercent}%):</small>
                  <strong className="text-danger small">-{formatCurrency(newDiscountAmount)}</strong>
                </div>
                <hr className="my-1" />
                <div className="d-flex justify-content-between">
                  <strong className="small">Total Amount:</strong>
                  <strong className="text-success small">{formatCurrency(netAmount)}</strong>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="py-2">
          <Button variant="outline-secondary" size="sm" onClick={() => {
            setShowNewSaleModal(false);
            setSelectedProduct(null);
            setProductSearchTerm('');
            setSearchResults([]);
            setNewSaleForm({
              paymentMethod: 'cash',
              discountPercent: 0,
              items: []
            });
          }}>
            Cancel
          </Button>
            <Button 
              variant="success" 
              size="sm"
              onClick={handleCreateSale}
            disabled={newSaleForm.items.length === 0}
          >
            <Plus size={12} className="me-1" />
            Create Sale
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};