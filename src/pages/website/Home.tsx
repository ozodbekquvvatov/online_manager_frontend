import * as React from 'react';
const { useEffect, useState, useRef } = React;
import { Container, Row, Col, Card, Button, Navbar, Nav, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  LogIn,
  Image as ImageIcon,
  ChevronRight,
  Star,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Users,
  Globe,
  Headphones,
  ShoppingCart,
  Send,
  Play,
  Package,
  ArrowUp,
  Circle,
  Leaf,
  Recycle,
  Battery,
  Sun,
  Droplets,
  Trees
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  cost_price: string;
  selling_price: string;
  stock_quantity: number;
  reorder_level: number;
  unit_of_measure: string;
  is_active: boolean;
  profit_margin: string;
  images?: ProductImage[];
}

interface ProductImage {
  id: number;
  image_path: string;
  image_name: string;
  is_primary: boolean;
}

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(6);
  const [totalProducts, setTotalProducts] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/products/public?page=${currentPage}&limit=${productsPerPage}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setProducts(result.data);
        setTotalProducts(result.total || result.data.length * 3);
      } else {
        throw new Error(result.message || 'Failed to load products');
      }
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getProductImageUrl = (product: Product) => {
    if (imageErrors[product.id]) {
      return 'https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=400&h=300&fit=crop';
    }

    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.is_primary);
      const firstImage = product.images[0];
      const image = primaryImage || firstImage;
      
      if (image && image.image_path) {
        if (image.image_path.startsWith('http')) {
          return image.image_path;
        } else {
          return `/storage/${image.image_path}`;
        }
      }
    }
    
    return 'https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=400&h=300&fit=crop';
  };

  const handleImageError = (productId: number) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const formatPrice = (price: string) => {
    const priceNumber = parseFloat(price);
    
    if (isNaN(priceNumber)) {
      return 'Price not available';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceNumber);
  };

  const hasImages = (product: Product) => {
    return product.images && product.images.length > 0;
  };

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const renderPaginationItems = () => {
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
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
      />
    );

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  return (
    <>
      {/* Navigation */}
      <Navbar 
        bg="white" 
        expand="lg" 
        fixed="top"
        className={`py-3 shadow-sm ${scrolled ? 'shadow' : ''}`}
      >
        <Container>
          <Navbar.Brand href="/" className="fw-bold d-flex align-items-center">
            <Leaf className="me-2 text-success" size={24} />
            <span style={{ color: '#2E7D32' }}>EcoNexus</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto">
              <Nav.Link href="#home" className="mx-3 text-dark">
                Home
              </Nav.Link>
              <Nav.Link href="#products" className="mx-3 text-dark">
                Products
              </Nav.Link>
              <Nav.Link href="#about" className="mx-3 text-dark">
                About
              </Nav.Link>
              <Nav.Link href="#contact" className="mx-3 text-dark">
                Contact
              </Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link 
                as={Link} 
                to="/login" 
                className="px-4 py-2 rounded bg-success text-white"
              >
                <LogIn size={18} className="me-2" />
                Admin Portal
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section id="home" className="pt-5 mt-5" style={{ backgroundColor: '#F1F8E9' }}>
        <Container>
          <Row className="align-items-center py-5">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="mb-4">
                <span className="px-3 py-1 rounded-pill bg-success text-white">
                  <Zap className="me-2" size={16} />
                  Sustainable Solutions
                </span>
              </div>
              <h1 className="display-4 fw-bold mb-4">
                Building a <span style={{ color: '#2E7D32' }}>Greener</span> Future Together
              </h1>
              <p className="lead mb-5 text-muted">
                Discover eco-friendly products that combine innovation with sustainability. 
                Join us in creating a better world for future generations.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Button 
                  size="lg" 
                  variant="success"
                  className="px-4 py-3"
                  href="#products"
                >
                  Shop Products
                  <ChevronRight className="ms-2" size={20} />
                </Button>
                <Button 
                  variant="outline-success" 
                  size="lg" 
                  className="px-4 py-3"
                  href="#contact"
                >
                  <Play className="me-2" size={20} />
                  Learn More
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <div className="position-relative">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop"
                  alt="Sustainable Products"
                  className="img-fluid rounded shadow"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="g-4">
            {[
              { icon: <Recycle />, value: '10K+', label: 'Products Recycled', color: '#4CAF50' },
              { icon: <Trees />, value: '50K+', label: 'Trees Planted', color: '#2E7D32' },
              { icon: <Sun />, value: '5MW', label: 'Solar Energy Generated', color: '#FF9800' },
              { icon: <Droplets />, value: '100M', label: 'Liters Water Saved', color: '#2196F3' },
            ].map((stat, i) => (
              <Col key={i} md={3} sm={6}>
                <div className="text-center p-4">
                  <div 
                    className="rounded-circle p-3 mb-3 d-inline-flex align-items-center justify-content-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <span style={{ color: stat.color }}>
                      {stat.icon}
                    </span>
                  </div>
                  <div className="fs-3 fw-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-muted">{stat.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Products Section */}
      <section id="products" className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">
              Our <span style={{ color: '#2E7D32' }}>Eco-Friendly</span> Products
            </h2>
            <p className="text-muted">
              Sustainable products for a better tomorrow
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="d-flex justify-content-center">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <p className="mt-3 text-muted">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <div className="w-24 h-24 mx-auto mb-4">
                <Package className="text-success" size={48} />
              </div>
              <h3 className="h4 fw-bold mb-3">Coming Soon</h3>
              <p className="text-muted mb-4">New sustainable products arriving soon!</p>
              <Button 
                variant="outline-success" 
                className="px-4"
                href="#contact"
              >
                Get Notified
              </Button>
            </div>
          ) : (
            <>
              <Row className="g-4">
                {products.map((product) => (
                  <Col key={product.id} lg={4} md={6}>
                    <Card className="h-100 shadow-sm border-0">
                      <div 
                        className="position-relative overflow-hidden"
                        style={{ height: '200px' }}
                      >
                        <img
                          src={getProductImageUrl(product)}
                          alt={product.name}
                          className="w-100 h-100 object-cover"
                          onError={() => handleImageError(product.id)}
                        />
                        {!hasImages(product) && (
                          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                            <div className="text-center text-muted">
                              <ImageIcon size={32} className="mb-2" />
                              <p className="small">No Image</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <Card.Body className="d-flex flex-column p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <Card.Title className="h5 mb-0 fw-bold">
                            {product.name}
                          </Card.Title>
                          <span className="h5 text-success fw-bold">
                            {formatPrice(product.selling_price)}
                          </span>
                        </div>

                        <Card.Text className="text-muted mb-4 flex-grow-1">
                          {product.description && product.description.length > 100 
                            ? `${product.description.substring(0, 100)}...`
                            : product.description || 'Sustainable product designed for eco-friendly living'
                          }
                        </Card.Text>

                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex text-warning">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} fill="currentColor" />
                              ))}
                            </div>
                            <span className="text-muted small">(4.5)</span>
                          </div>
                          <div className="text-muted small">
                            <Circle size={8} className="d-inline me-1 text-success" fill="currentColor" />
                            In Stock
                          </div>
                        </div>

                        <Button 
                          variant="success" 
                          className="w-100"
                        >
                          <ShoppingCart className="me-2" size={16} />
                          View Details
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-5">
                  <Pagination>
                    {renderPaginationItems()}
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      {/* About Section */}
      <section id="about" className="py-5 bg-white">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=400&fit=crop"
                alt="Our Mission"
                className="img-fluid rounded shadow"
              />
            </Col>
            <Col lg={6}>
              <h2 className="display-5 fw-bold mb-4">
                Our <span style={{ color: '#2E7D32' }}>Mission</span>
              </h2>
              <p className="lead mb-4">
                We are committed to creating sustainable solutions that protect our planet while delivering exceptional value to our customers.
              </p>
              <div className="mb-4">
                <div className="d-flex align-items-start mb-3">
                  <Leaf className="text-success me-3 mt-1" size={24} />
                  <div>
                    <h5 className="fw-bold">Eco-Friendly Materials</h5>
                    <p className="text-muted mb-0">All products made from sustainable, renewable resources</p>
                  </div>
                </div>
                <div className="d-flex align-items-start mb-3">
                  <Recycle className="text-success me-3 mt-1" size={24} />
                  <div>
                    <h5 className="fw-bold">Zero Waste Packaging</h5>
                    <p className="text-muted mb-0">100% recyclable and biodegradable packaging</p>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <Sun className="text-success me-3 mt-1" size={24} />
                  <div>
                    <h5 className="fw-bold">Carbon Neutral Shipping</h5>
                    <p className="text-muted mb-0">Offset carbon emissions from all deliveries</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-5" style={{ backgroundColor: '#F1F8E9' }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="mb-5">
                <h2 className="display-5 fw-bold mb-4">
                  Get in <span style={{ color: '#2E7D32' }}>Touch</span>
                </h2>
                <p className="text-muted">
                  Have questions about our products? We're here to help!
                </p>
              </div>

              <div className="mb-4">
                {[
                  { icon: <Phone />, title: 'Phone', value: '+1 (555) 123-4567' },
                  { icon: <Mail />, title: 'Email', value: 'hello@econexus.com' },
                  { icon: <MapPin />, title: 'Location', value: 'San Francisco, CA' },
                ].map((item, i) => (
                  <div key={i} className="d-flex align-items-center p-3 rounded bg-white mb-3 shadow-sm">
                    <div className="p-3 rounded-circle bg-success text-white me-3">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-muted small mb-1">{item.title}</p>
                      <p className="fw-semibold mb-0">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <h4 className="fw-bold mb-3">Follow Us</h4>
                <div className="d-flex gap-3">
                  {[
                    { icon: <Facebook />, color: '#1877f2' },
                    { icon: <Twitter />, color: '#1da1f2' },
                    { icon: <Instagram />, color: '#e4405f' },
                    { icon: <Linkedin />, color: '#0a66c2' },
                  ].map((social, i) => (
                    <a
                      key={i}
                      href="#"
                      className="w-12 h-12 rounded-circle d-flex align-items-center justify-content-center text-white"
                      style={{ backgroundColor: social.color }}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </Col>

            <Col lg={6}>
              <div className="rounded border-0 shadow-lg p-4 bg-white">
                <h4 className="fw-bold mb-4">Send us a message</h4>
                <form>
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control py-3 px-4"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control py-3 px-4"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea
                      rows={4}
                      className="form-control py-3 px-4"
                      placeholder="Your message..."
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="success"
                    className="w-100 py-3"
                  >
                    Send Message
                    <Send className="ms-2" size={18} />
                  </Button>
                </form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-5">
        <Container>
          <Row className="mb-4">
            <Col lg={4} className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <Leaf className="me-2 text-success" size={20} />
                <span className="fs-4 fw-bold">EcoNexus</span>
              </div>
              <p className="text-white-50 mb-0">
                Committed to sustainable living and environmental protection.
              </p>
            </Col>
            {['Products', 'Company', 'Support'].map((category, i) => (
              <Col key={category} lg={2} md={4} sm={6} className="mb-4">
                <h5 className="fw-bold mb-3">{category}</h5>
                <ul className="list-unstyled">
                  {['Features', 'Pricing', 'Contact'].map((item, j) => (
                    <li key={item} className="mb-2">
                      <a href="#" className="text-white-50">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </Col>
            ))}
          </Row>
          <div className="pt-4 border-top border-white-20">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
              <p className="text-white-50 small mb-3 mb-md-0">
                © {new Date().getFullYear()} EcoNexus. All rights reserved.
              </p>
              <div className="d-flex align-items-center gap-4">
                {['Privacy', 'Terms', 'Cookies'].map((item, i) => (
                  <a key={item} href="#" className="text-white-50 small">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </footer>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="position-fixed bottom-4 end-4 w-12 h-12 rounded-circle bg-success text-white shadow-lg border-0 d-flex align-items-center justify-content-center"
        style={{ 
          opacity: scrolled ? 1 : 0,
          transition: 'opacity 0.3s'
        }}
      >
        <ArrowUp size={20} />
      </button>
    </>
  );
};