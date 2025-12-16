import * as React from 'react';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Dropdown } from 'react-bootstrap';
import { Users, Plus, Eye, Edit, Trash2, Mail, Phone, MapPin, MoreVertical } from 'lucide-react';
import type { Employee } from '../../types/database.types';
import { useBusinessCalculations } from '../../hooks/useBusinessCalculations';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    position: '',
    department: '',
    base_salary: '',
    hire_date: '',
    date_of_birth: '',
    address: '',
    employment_type: 'full_time',
    work_hours_per_day: '8',
    work_shift: 'day',
    is_active: true
  });

  const calculations = useBusinessCalculations();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/employees?t=${Date.now()}`, {      
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      } else if (response.status === 404) {
        throw new Error('Employees endpoint not found (404). Check backend routes.');
      } else if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setEmployees(result.data);
      } else if (Array.isArray(result)) {
        setEmployees(result);
      } else {
        setEmployees([]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!formData.position.trim()) {
      errors.position = 'Position is required';
    }

    if (!formData.department.trim()) {
      errors.department = 'Department is required';
    }

    if (!formData.base_salary || Number(formData.base_salary) <= 0) {
      errors.base_salary = 'Salary must be greater than 0';
    }

    if (!formData.work_hours_per_day || Number(formData.work_hours_per_day) < 1 || Number(formData.work_hours_per_day) > 24) {
      errors.work_hours_per_day = 'Work hours must be between 1 and 24';
    }

    if (formData.hire_date && new Date(formData.hire_date) > new Date()) {
      errors.hire_date = 'Hire date cannot be in the future';
    }

    if (formData.date_of_birth && new Date(formData.date_of_birth) > new Date()) {
      errors.date_of_birth = 'Date of birth cannot be in the future';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.department || '',
      base_salary: employee.base_salary?.toString() || '',
      hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
      date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
      address: employee.address || '',
      employment_type: (employee as any).employment_type || 'full_time',
      work_hours_per_day: (employee as any).work_hours_per_day?.toString() || '8',
      work_shift: (employee as any).work_shift || 'day',
      is_active: employee.is_active ?? true
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      position: '',
      department: '',
      base_salary: '',
      hire_date: '',
      date_of_birth: '',
      address: '',
      employment_type: 'full_time',
      work_hours_per_day: '8',
      work_shift: 'day',
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
      setError('Please fill in all fields correctly');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare the request body with proper null handling
      const requestBody: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        position: formData.position.trim(),
        department: formData.department.trim(),
        base_salary: parseFloat(formData.base_salary),
        employment_type: formData.employment_type,
        work_hours_per_day: parseInt(formData.work_hours_per_day),
        work_shift: formData.work_shift,
        is_active: true
      };

      // Handle nullable fields - only include if they have values
      if (formData.phone.trim()) {
        requestBody.phone = formData.phone.trim();
      } else {
        requestBody.phone = null;
      }

      if (formData.hire_date) {
        requestBody.hire_date = formData.hire_date;
      } else {
        requestBody.hire_date = null;
      }

      if (formData.date_of_birth) {
        requestBody.date_of_birth = formData.date_of_birth;
      } else {
        requestBody.date_of_birth = null;
      }

      if (formData.address.trim()) {
        requestBody.address = formData.address.trim();
      } else {
        requestBody.address = null;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/employees`, {
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
          setError('Please fill out the form correctly');
        } else {
          throw new Error(result.message || 'Failed to create employee');
        }
        return;
      }

      if (result.success) {
        setSuccess('Employee created successfully');
        setShowModal(false);
        
        setFormData({
          first_name: '',
          last_name: '',
          phone: '',
          position: '',
          department: '',
          base_salary: '',
          hire_date: '',
          date_of_birth: '',
          address: '',
          employment_type: 'full_time',
          work_hours_per_day: '8',
          work_shift: 'day',
          is_active: true
        });
        setFormErrors({});
        
        await fetchEmployees();
      } else {
        throw new Error(result.message || 'Failed to create employee');
      }

    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        setError('Could not connect to server. Please check your internet connection.');
      } else {
        setError(error.message || 'Failed to create employee');
      }
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEmployee) return;

    if (!validateForm()) {
      setError('Please fill in all fields correctly');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare the request body with proper null handling
      const requestBody: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        position: formData.position.trim(),
        department: formData.department.trim(),
        base_salary: parseFloat(formData.base_salary),
        employment_type: formData.employment_type,
        work_hours_per_day: parseInt(formData.work_hours_per_day),
        work_shift: formData.work_shift,
        is_active: formData.is_active
      };

      // Handle nullable fields - only include if they have values
      if (formData.phone.trim()) {
        requestBody.phone = formData.phone.trim();
      } else {
        requestBody.phone = null;
      }

      if (formData.hire_date) {
        requestBody.hire_date = formData.hire_date;
      } else {
        requestBody.hire_date = null;
      }

      if (formData.date_of_birth) {
        requestBody.date_of_birth = formData.date_of_birth;
      } else {
        requestBody.date_of_birth = null;
      }

      if (formData.address.trim()) {
        requestBody.address = formData.address.trim();
      } else {
        requestBody.address = null;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/employees/${selectedEmployee.id}`, {
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
          setError('Please fill out the form correctly');
        } else {
          throw new Error(result.message || 'Failed to update employee');
        }
        return;
      }

      if (result.success) {
        setSuccess('Employee updated successfully');
        setShowEditModal(false);
        setSelectedEmployee(null);
        setFormErrors({});
        await fetchEmployees();
      } else {
        throw new Error(result.message || 'Failed to update employee');
      }

    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        setError('Could not connect to server. Please check your internet connection.');
      } else {
        setError(error.message || 'Failed to update employee');
      }
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/employees/${employeeId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to delete employee');
        }

        if (result.success) {
          setSuccess('Employee deleted successfully');
          await fetchEmployees();
        } else {
          throw new Error(result.message || 'Failed to delete employee');
        }
      } catch (error: any) {
        if (error.message.includes('Failed to fetch')) {
          setError('Could not connect to server. Please check your internet connection.');
        } else {
          setError(error.message || 'Failed to delete employee');
        }
      }
    }
  };

  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.base_salary || 0), 0);
  const activeEmployees = employees.filter(e => e.is_active).length;

  const getWorkShiftBadge = (shift: string) => {
    const variants: { [key: string]: string } = {
      day: 'primary',
      night: 'dark',
      both: 'warning'
    };
    const labels: { [key: string]: string } = {
      day: 'Day',
      night: 'Night',
      both: 'Both'
    };
    return <Badge bg={variants[shift] || 'secondary'} className="small">{labels[shift] || shift}</Badge>;
  };

  if (loading) {
    return (
      <Container fluid className="px-3 py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading employees...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="fade-in px-3 py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="flex-grow-1">
          <h4 className="fw-bold mb-1">Employee Management</h4>
          <p className="text-muted small d-none d-sm-block">Manage your employees and their salaries</p>
        </div>
        <Button variant="primary" onClick={handleAddEmployee} size="sm">
          <Plus size={16} className="me-1" />
          <span className="d-none d-sm-inline">Add Employee</span>
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
                fetchEmployees();
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
                  <p className="text-muted mb-1 small fw-semibold">Total Employees</p>
                  <h4 className="mb-0 fw-bold text-dark">{employees.length}</h4>
                </div>
                <div className="bg-primary bg-opacity-10 p-2 rounded">
                  <Users size={18} className="text-primary" />
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
                  <p className="text-muted mb-1 small fw-semibold">Active Employees</p>
                  <h4 className="mb-0 fw-bold text-dark">{activeEmployees}</h4>
                </div>
                <div className="bg-success bg-opacity-10 p-2 rounded">
                  <Users size={18} className="text-success" />
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
                  <p className="text-muted mb-1 small fw-semibold">Monthly Payroll</p>
                  <h4 className="mb-0 fw-bold text-dark">
                    {formatCurrency(totalPayroll)}
                  </h4>
                </div>
                <div className="bg-warning bg-opacity-10 p-2 rounded">
                  <Users size={18} className="text-warning" />
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
                  <p className="text-muted mb-1 small fw-semibold">Average Salary</p>
                  <h4 className="mb-0 fw-bold text-dark">
                    {formatCurrency(employees.length > 0 ? totalPayroll / employees.length : 0)}
                  </h4>
                </div>
                <div className="bg-info bg-opacity-10 p-2 rounded">
                  <Users size={18} className="text-info" />
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
              <h6 className="mb-0 fw-semibold">All Employees</h6>
              <small className="text-muted">Showing {employees.length} employees</small>
            </div>
            <Button 
              variant="outline-primary" 
              onClick={handleAddEmployee} 
              size="sm"
              className="d-none d-sm-block"
            >
              <Plus size={14} className="me-1" />
              Add Employee
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {employees.length === 0 ? (
            <div className="text-center py-5 px-3">
              <Users size={48} className="text-muted mb-3" />
              <h6 className="text-muted">No employees found</h6>
              <p className="text-muted small mb-3">Start by adding your first employee</p>
              <Button variant="primary" onClick={handleAddEmployee} size="sm">
                <Plus size={14} className="me-1" />
                Add Employee
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="small fw-semibold">Employee</th>
                    <th className="small fw-semibold d-none d-md-table-cell">Department</th>
                    <th className="small fw-semibold d-none d-sm-table-cell">Position</th>
                    <th className="small fw-semibold d-none d-lg-table-cell">Salary</th>
                    <th className="small fw-semibold d-none d-xl-table-cell">Status</th>
                    <th className="small fw-semibold text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                                 style={{ width: '40px', height: '40px' }}>
                              <Users size={16} className="text-primary" />
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="fw-semibold small">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-muted small">
                              {employee.phone || 'No phone number'}
                            </div>
                            <div className="d-block d-md-none">
                              <Badge bg="info" className="small me-1">
                                {employee.work_hours_per_day} hours
                              </Badge>
                              {getWorkShiftBadge(employee.work_shift || 'day')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="small">{employee.department}</span>
                      </td>
                      <td className="d-none d-sm-table-cell">
                        <span className="small">{employee.position}</span>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <span className="fw-semibold small text-success">
                          {formatCurrency(Number(employee.base_salary || 0))}
                        </span>
                      </td>
                      <td className="d-none d-xl-table-cell">
                        <Badge bg={employee.is_active ? 'success' : 'danger'} className="small">
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex justify-content-end gap-1">
                          <Dropdown className="d-block d-xl-none">
                            <Dropdown.Toggle variant="outline-secondary" size="sm" className="border-0">
                              <MoreVertical size={14} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end">
                              <Dropdown.Item onClick={() => handleViewEmployee(employee)}>
                                <Eye size={14} className="me-2" />
                                View
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleEditEmployee(employee)}>
                                <Edit size={14} className="me-2" />
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                onClick={() => handleDeleteEmployee(employee.id)}
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
                              onClick={() => handleViewEmployee(employee)}
                              title="View employee details"
                            >
                              <Eye size={14} />
                            </Button>
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                              title="Edit employee"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              title="Delete employee"
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

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">Add New Employee</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-3">
            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter first name"
                    size="sm"
                    isInvalid={!!formErrors.first_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter last name"
                    size="sm"
                    isInvalid={!!formErrors.last_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.last_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number (optional)"
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Position *</Form.Label>
                  <Form.Control
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter position"
                    size="sm"
                    isInvalid={!!formErrors.position}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.position}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Department *</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter department"
                    size="sm"
                    isInvalid={!!formErrors.department}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.department}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Base Salary ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="base_salary"
                    value={formData.base_salary}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                    step="1"
                    min="0"
                    size="sm"
                    isInvalid={!!formErrors.base_salary}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.base_salary}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Monthly salary in USD
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col xs={6} sm={3}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Work Hours *</Form.Label>
                  <Form.Control
                    type="number"
                    name="work_hours_per_day"
                    value={formData.work_hours_per_day}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="24"
                    placeholder="8"
                    size="sm"
                    isInvalid={!!formErrors.work_hours_per_day}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.work_hours_per_day}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={6} sm={3}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Work Shift</Form.Label>
                  <Form.Select
                    name="work_shift"
                    value={formData.work_shift}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                    <option value="both">Both</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Employment Type</Form.Label>
                  <Form.Select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Hire Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    size="sm"
                    isInvalid={!!formErrors.hire_date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.hire_date}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    size="sm"
                    isInvalid={!!formErrors.date_of_birth}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.date_of_birth}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address (optional)"
                size="sm"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="px-3 py-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} size="sm">
              Cancel
            </Button>
            <Button variant="primary" type="submit" size="sm">
              Add Employee
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">Edit Employee</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateEmployee}>
          <Modal.Body className="p-3">
            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter first name"
                    size="sm"
                    isInvalid={!!formErrors.first_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter last name"
                    size="sm"
                    isInvalid={!!formErrors.last_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.last_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number (optional)"
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Position *</Form.Label>
                  <Form.Control
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter position"
                    size="sm"
                    isInvalid={!!formErrors.position}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.position}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Department *</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter department"
                    size="sm"
                    isInvalid={!!formErrors.department}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.department}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Base Salary ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="base_salary"
                    value={formData.base_salary}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                    step="1"
                    min="0"
                    size="sm"
                    isInvalid={!!formErrors.base_salary}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.base_salary}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Monthly salary in USD
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col xs={6} sm={3}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Work Hours *</Form.Label>
                  <Form.Control
                    type="number"
                    name="work_hours_per_day"
                    value={formData.work_hours_per_day}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="24"
                    placeholder="8"
                    size="sm"
                    isInvalid={!!formErrors.work_hours_per_day}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.work_hours_per_day}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={6} sm={3}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Work Shift</Form.Label>
                  <Form.Select
                    name="work_shift"
                    value={formData.work_shift}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                    <option value="both">Both</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Employment Type</Form.Label>
                  <Form.Select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Hire Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    size="sm"
                    isInvalid={!!formErrors.hire_date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.hire_date}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    size="sm"
                    isInvalid={!!formErrors.date_of_birth}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.date_of_birth}
                  </Form.Control.Feedback>
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

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address (optional)"
                size="sm"
              />
            </Form.Group>
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

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="px-3 py-2">
          <Modal.Title className="h6 mb-0">Employee Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          {selectedEmployee && (
            <>
              <Row className="mb-3">
                <Col xs={8}>
                  <h6 className="fw-bold mb-2">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h6>
                  {selectedEmployee.phone && (
                    <p className="text-muted small mb-1">
                      <Phone size={14} className="me-2" />
                      {selectedEmployee.phone}
                    </p>
                  )}
                  {selectedEmployee.address && (
                    <p className="text-muted small mb-0">
                      <MapPin size={14} className="me-2" />
                      {selectedEmployee.address}
                    </p>
                  )}
                </Col>
                <Col xs={4} className="text-end">
                  <Badge bg={selectedEmployee.is_active ? 'success' : 'danger'} className="small mb-2">
                    {selectedEmployee.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <div>
                    <small className="text-muted">ID:</small>
                    <div className="fw-bold small">{selectedEmployee.employee_code}</div>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col xs={12} sm={6}>
                  <h6 className="text-muted small mb-2">Work Details</h6>
                  <div className="mb-2">
                    <strong className="small">Position:</strong>
                    <div className="small">{selectedEmployee.position}</div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Department:</strong>
                    <div className="small">{selectedEmployee.department}</div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Work Hours:</strong>
                    <div className="small"><Badge bg="info" className="small">{(selectedEmployee as any).work_hours_per_day} hours</Badge></div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Work Shift:</strong>
                    <div className="small">{getWorkShiftBadge((selectedEmployee as any).work_shift)}</div>
                  </div>
                  <div className="mb-2">
                    <strong className="small">Base Salary:</strong>
                    <div className="fw-semibold small text-success">
                      {formatCurrency(Number(selectedEmployee.base_salary || 0))}
                    </div>
                  </div>
                  {selectedEmployee.hire_date && (
                    <div className="mb-2">
                      <strong className="small">Hire Date:</strong>
                      <div className="small">{new Date(selectedEmployee.hire_date).toLocaleDateString()}</div>
                    </div>
                  )}
                </Col>
                <Col xs={12} sm={6}>
                  <h6 className="text-muted small mb-2">Personal Information</h6>
                  {selectedEmployee.date_of_birth && (
                    <div className="mb-2">
                      <strong className="small">Date of Birth:</strong>
                      <div className="small">{new Date(selectedEmployee.date_of_birth).toLocaleDateString()}</div>
                    </div>
                  )}
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