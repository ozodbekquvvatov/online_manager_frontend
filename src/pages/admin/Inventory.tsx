import * as React from 'react';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Dropdown } from 'react-bootstrap';
import { Package, Plus, Eye, Edit, Trash2, DollarSign, BarChart, ShoppingCart, MoreVertical } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  selling_price: string;
  cost_price: string;
  stock_quantity: number;
  reorder_level: number;
  unit_of_measure: string;
  is_active: boolean;
  profit_margin: string;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
}

interface ProductImage {
  id: number;
  image_path: string;
  image_name: string;
  is_primary: boolean;
}

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selling_price: '',
    cost_price: '',
    stock_quantity: '',
    reorder_level: '10',
    unit_of_measure: 'pcs',
    is_active: true
  });

  const formatCurrency = (amount: string | number): string => {
    const amountNumber = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(amountNumber)) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amountNumber);
  };

  const calculateProfitMargin = (cost: string | number, selling: string | number): string => {
    const costNum = typeof cost === 'string' ? parseFloat(cost) : cost;
    const sellingNum = typeof selling === 'string' ? parseFloat(selling) : selling;
    
    if (isNaN(costNum) || isNaN(sellingNum) || costNum === 0) {
      return '0%';
    }
    
    const margin = ((sellingNum - costNum) / costNum) * 100;
    return `${margin.toFixed(1)}%`;
  };

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Remove credentials: 'include' since it conflicts with wildcard CORS
      const response = await fetch(`${API_BASE_URL}/api/admin/products`, {      
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
        // credentials: 'include' // Remove this line - it conflicts with CORS wildcard
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setProducts(result.data);
      } else if (Array.isArray(result)) {
        setProducts(result);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      // Check for CORS-specific errors
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.message.includes('NetworkError')) {
        setError('Connection error. Please check if the backend server is running and accessible.');
      } else {
        setError(error.message || 'Failed to load products');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      errors.selling_price = 'Selling price must be greater than 0';
    }

    if (!formData.cost_price || parseFloat(formData.cost_price) <= 0) {
      errors.cost_price = 'Cost price must be greater than 0';
    }

    const sellingPrice = parseFloat(formData.selling_price);
    const costPrice = parseFloat(formData.cost_price);
    
    if (!isNaN(sellingPrice) && !isNaN(costPrice) && sellingPrice <= costPrice) {
      errors.selling_price = 'Selling price must be greater than cost price';
    }

    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      errors.stock_quantity = 'Stock quantity must be 0 or greater';
    }

    if (!formData.reorder_level || parseInt(formData.reorder_level) < 0) {
      errors.reorder_level = 'Reorder level must be 0 or greater';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      selling_price: product.selling_price || '',
      cost_price: product.cost_price || '',
      stock_quantity: product.stock_quantity?.toString() || '',
      reorder_level: product.reorder_level?.toString() || '10',
      unit_of_measure: product.unit_of_measure || 'pcs',
      is_active: product.is_active ?? true
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
      selling_price: '',
      cost_price: '',
      stock_quantity: '',
      reorder_level: '10',
      unit_of_measure: 'pcs',
      is_active: true
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please fix the form errors');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const requestBody = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        selling_price: parseFloat(formData.selling_price),
        cost_price: parseFloat(formData.cost_price),
        stock_quantity: parseInt(formData.stock_quantity),
        reorder_level: parseInt(formData.reorder_level),
        unit_of_measure: formData.unit_of_measure,
        is_active: true
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const backendErrors: {[key: string]: string} = {};
          Object.keys(result.errors).forEach(key => {
            backendErrors[key] = result.errors[key][0];
          });
          setFormErrors(backendErrors);
          setError('Please fix the form errors');
        } else {
          throw new Error(result.message || 'Failed to create product');
        }
        return;
      }

      if (result.success) {
        setSuccess('Product created successfully');
        setShowModal(false);
        
        setFormData({
          name: '',
          description: '',
          selling_price: '',
          cost_price: '',
          stock_quantity: '',
          reorder_level: '10',
          unit_of_measure: 'pcs',
          is_active: true
        });
        setFormErrors({});
        
        await fetchProducts();
      } else {
        throw new Error(result.message || 'Failed to create product');
      }

    } catch (error: any) {
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        setError('Could not connect to server. Please check your internet connection and backend server.');
      } else {
        setError(error.message || 'Failed to create product');
      }
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedProduct) return;

    if (!validateForm()) {
      setError('Please fix the form errors');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const requestBody = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        selling_price: parseFloat(formData.selling_price),
        cost_price: parseFloat(formData.cost_price),
        stock_quantity: parseInt(formData.stock_quantity),
        reorder_level: parseInt(formData.reorder_level),
        unit_of_measure: formData.unit_of_measure,
        is_active: formData.is_active
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          const backendErrors: {[key: string]: string} = {};
          Object.keys(result.errors).forEach(key => {
            backendErrors[key] = result.errors[key][0];
          });
          setFormErrors(backendErrors);
          setError('Please fix the form errors');
        } else {
          throw new Error(result.message || 'Failed to update product');
        }
        return;
      }

      if (result.success) {
        setSuccess('Product updated successfully');
        setShowEditModal(false);
        setSelectedProduct(null);
        setFormErrors({});
        await fetchProducts();
      } else {
        throw new Error(result.message || 'Failed to update product');
      }

    } catch (error: any) {
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        setError('Could not connect to server. Please check your internet connection and backend server.');
      } else {
        setError(error.message || 'Failed to update product');
      }
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to delete product');
        }

        if (result.success) {
          setSuccess('Product deleted successfully');
          await fetchProducts();
        } else {
          throw new Error(result.message || 'Failed to delete product');
        }
      } catch (error: any) {
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          setError('Could not connect to server. Please check your internet connection and backend server.');
        } else {
          setError(error.message || 'Failed to delete product');
        }
      }
    }
  };

  const totalInventoryValue = products.reduce((sum, product) => {
    const cost = parseFloat(product.cost_price || '0');
    const stock = product.stock_quantity || 0;
    return sum + (cost * stock);
  }, 0);

  const lowStockProducts = products.filter(product => 
    product.stock_quantity <= product.reorder_level
  ).length;

  const activeProducts = products.filter(product => product.is_active).length;

  if (loading) {
    return (
      <Container fluid className="px-3 py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading inventory...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="px-3 py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1">
          <h4 className="fw-bold mb-1">Inventory Management</h4>
          <p className="text-muted small d-none d-sm-block">Manage your products and stock levels</p>
        </div>
        <Button variant="primary" onClick={handleAddProduct} size="sm">
          <Plus size={16} className="me-1" />
          <span className="d-none d-sm-inline">Add Product</span>
          <span className="d-sm-none">Add</span>
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="small mb-3">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <strong>Error:</strong> {error}
            </div>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={() => {
                setError('');
                fetchProducts();
              }}
              className="ms-2"
            >
              Refresh
            </Button>
          </div>
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="small mb-3">
          {success}
        </Alert>
      )}

      <Row className="g-3 mb-3">
        <Col xs={6} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">Total Products</p>
                  <h4 className="mb-0 fw-bold text-dark">{products.length}</h4>
                </div>
                <div className="bg-primary bg-opacity-10 p-2 rounded">
                  <Package size={18} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">Total Value</p>
                  <h4 className="mb-0 fw-bold text-dark">
                    {formatCurrency(totalInventoryValue)}
                  </h4>
                </div>
                <div className="bg-success bg-opacity-10 p-2 rounded">
                  <DollarSign size={18} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">Low Stock</p>
                  <h4 className="mb-0 fw-bold text-dark">{lowStockProducts}</h4>
                </div>
                <div className="bg-warning bg-opacity-10 p-2 rounded">
                  <ShoppingCart size={18} className="text-warning" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small fw-semibold">Active Products</p>
                  <h4 className="mb-0 fw-bold text-dark">{activeProducts}</h4>
                </div>
                <div className="bg-info bg-opacity-10 p-2 rounded">
                  <BarChart size={18} className="text-info" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-0 fw-semibold">All Products</h6>
              <small className="text-muted">Showing {products.length} products</small>
            </div>
            <Button 
              variant="outline-primary" 
              onClick={handleAddProduct} 
              size="sm"
              className="d-none d-sm-block"
            >
              <Plus size={14} className="me-1" />
              Add Product
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {products.length === 0 ? (
            <div className="text-center py-5 px-3">
              <Package size={48} className="text-muted mb-3" />
              <h6 className="text-muted">No products found</h6>
              <p className="text-muted small mb-3">Start by adding your first product</p>
              <Button variant="primary" onClick={handleAddProduct} size="sm">
                <Plus size={14} className="me-1" />
                Add Product
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="small fw-semibold">Product</th>
                    <th className="small fw-semibold d-none d-md-table-cell">Price</th>
                    <th className="small fw-semibold d-none d-sm-table-cell">Stock</th>
                    <th className="small fw-semibold d-none d-lg-table-cell">Margin</th>
                    <th className="small fw-semibold d-none d-xl-table-cell">Status</th>
                    <th className="small fw-semibold text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                                 style={{ width: '40px', height: '40px' }}>
                              <Package size={16} className="text-primary" />
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="fw-semibold small">
                              {product.name}
                            </div>
                            <div className="text-muted small">
                              {product.description && product.description.length > 30 
                                ? `${product.description.substring(0, 30)}...`
                                : product.description || 'No description'}
                            </div>
                            <div className="d-block d-md-none mt-1">
                              <Badge 
                                bg={product.stock_quantity <= product.reorder_level ? 'warning' : 'success'} 
                                className="small me-1"
                              >
                                Stock: {product.stock_quantity} {product.unit_of_measure}
                              </Badge>
                              <Badge bg="info" className="small">
                                {formatCurrency(product.selling_price)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <div>
                          <span className="fw-semibold small text-success">
                            {formatCurrency(product.selling_price)}
                          </span>
                          <div className="text-muted small">
                            Cost: {formatCurrency(product.cost_price)}
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-sm-table-cell">
                        <div>
                          <span className={`fw-semibold small ${product.stock_quantity <= product.reorder_level ? 'text-warning' : 'text-dark'}`}>
                            {product.stock_quantity} {product.unit_of_measure}
                          </span>
                          <div className="text-muted small">
                            Reorder at: {product.reorder_level}
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <Badge bg="success" className="small">
                          {calculateProfitMargin(product.cost_price, product.selling_price)}
                        </Badge>
                      </td>
                      <td className="d-none d-xl-table-cell">
                        <Badge bg={product.is_active ? 'success' : 'danger'} className="small">
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex justify-content-end gap-1">
                          <Dropdown className="d-block d-xl-none">
                            <Dropdown.Toggle variant="outline-secondary" size="sm" className="border-0">
                              <MoreVertical size={14} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end">
                              <Dropdown.Item onClick={() => handleViewProduct(product)}>
                                <Eye size={14} className="me-2" />
                                View
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleEditProduct(product)}>
                                <Edit size={14} className="me-2" />
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-danger"
                              >
                                <Trash2 size={14} className="me-2" />
                                Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>

                          <div className="d-none d-xl-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleViewProduct(product)}
                              title="View product details"
                            >
                              <Eye size={14} />
                            </Button>
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              title="Edit product"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Product Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">Add New Product</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-3">
            <Row className="g-2">
              <Col xs={12}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Product Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter product name"
                    size="sm"
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Cost Price ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    size="sm"
                    isInvalid={!!formErrors.cost_price}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.cost_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Selling Price ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    size="sm"
                    isInvalid={!!formErrors.selling_price}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.selling_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Stock Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                    step="1"
                    min="0"
                    size="sm"
                    isInvalid={!!formErrors.stock_quantity}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.stock_quantity}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Reorder Level</Form.Label>
                  <Form.Control
                    type="number"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={handleInputChange}
                    placeholder="10"
                    step="1"
                    min="0"
                    size="sm"
                    isInvalid={!!formErrors.reorder_level}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.reorder_level}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Unit of Measure</Form.Label>
                  <Form.Select
                    name="unit_of_measure"
                    value={formData.unit_of_measure}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="L">Liters (L)</option>
                    <option value="mL">Milliliters (mL)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="set">Set</option>
                    <option value="pair">Pair</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="px-3 py-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} size="sm">
              Cancel
            </Button>
            <Button variant="primary" type="submit" size="sm">
              Add Product
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">Edit Product</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateProduct}>
          <Modal.Body className="p-3">
            <Row className="g-2">
              <Col xs={12}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Product Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter product name"
                    size="sm"
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Cost Price ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    size="sm"
                    isInvalid={!!formErrors.cost_price}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.cost_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Selling Price ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    size="sm"
                    isInvalid={!!formErrors.selling_price}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.selling_price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Stock Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                    step="1"
                    min="0"
                    size="sm"
                    isInvalid={!!formErrors.stock_quantity}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.stock_quantity}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Reorder Level</Form.Label>
                  <Form.Control
                    type="number"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={handleInputChange}
                    placeholder="10"
                    step="1"
                    min="0"
                    size="sm"
                    isInvalid={!!formErrors.reorder_level}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.reorder_level}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Unit of Measure</Form.Label>
                  <Form.Select
                    name="unit_of_measure"
                    value={formData.unit_of_measure}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="L">Liters (L)</option>
                    <option value="mL">Milliliters (mL)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="set">Set</option>
                    <option value="pair">Pair</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Status</Form.Label>
                  <Form.Select
                    name="is_active"
                    value={formData.is_active.toString()}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="px-3 py-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)} size="sm">
              Cancel
            </Button>
            <Button variant="primary" type="submit" size="sm">
              Update
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Product Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">Product Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          {selectedProduct && (
            <>
              <Row className="mb-3">
                <Col xs={8}>
                  <h6 className="fw-bold mb-2">{selectedProduct.name}</h6>
                  <p className="text-muted small mb-0">
                    {selectedProduct.description || 'No description available'}
                  </p>
                </Col>
                <Col xs={4} className="text-end">
                  <Badge bg={selectedProduct.is_active ? 'success' : 'danger'} className="small mb-2">
                    {selectedProduct.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <div>
                    <small className="text-muted">ID:</small>
                    <div className="fw-bold small">{selectedProduct.id}</div>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col xs={12} sm={6}>
                  <h6 className="text-muted small mb-2">Pricing Information</h6>
                  <div className="mb-2">
                    <strong className="small">Selling Price:</strong>
                    <div className="fw-semibold small text-success">
                      {formatCurrency(selectedProduct.selling_price)}
                    </div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Cost Price:</strong>
                    <div className="fw-semibold small text-danger">
                      {formatCurrency(selectedProduct.cost_price)}
                    </div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Profit Margin:</strong>
                    <div className="fw-semibold small">
                      <Badge bg="success" className="small">
                        {calculateProfitMargin(selectedProduct.cost_price, selectedProduct.selling_price)}
                      </Badge>
                    </div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <h6 className="text-muted small mb-2">Stock Information</h6>
                  <div className="mb-2">
                    <strong className="small">Current Stock:</strong>
                    <div className={`fw-semibold small ${selectedProduct.stock_quantity <= selectedProduct.reorder_level ? 'text-warning' : 'text-dark'}`}>
                      {selectedProduct.stock_quantity} {selectedProduct.unit_of_measure}
                    </div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Reorder Level:</strong>
                    <div className="fw-semibold small">
                      {selectedProduct.reorder_level} {selectedProduct.unit_of_measure}
                    </div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Unit of Measure:</strong>
                    <div className="fw-semibold small">{selectedProduct.unit_of_measure}</div>
                  </div>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="px-3 py-2">
          <Button variant="secondary" onClick={() => setShowViewModal(false)} size="sm">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};