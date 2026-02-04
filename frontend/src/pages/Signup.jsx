import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { authService } from '../services/authService';
import '../components/layout/Layout.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.businessName || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      const result = await authService.signup(
        formData.email,
        formData.password,
        formData.businessName
      );

setSuccess('Account created! Please check your email to verify your account.');      
      // Clear form
      setFormData({
        businessName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="signup-card shadow-lg border-0">
              <Row className="g-0">
                {/* Left Side - Branding */}
              <Col md={5} className="signup-left-side d-none d-md-flex flex-column justify-content-center align-items-center text-center">
  <img 
    src="/PriceWiseLOGO.png" 
    alt="PriceWise Logo" 
    style={{
      width: '150px',
      height: 'auto',
      marginTop: '15px',
      marginBottom: '20px'
    }}
     
  />
    <h1 className="signup-title">PriceWise</h1>

  <p className="signup-subtitle">
    Smart Pricing Management for Your Café & Restaurant
  </p>
                  
                </Col>

                {/* Right Side - Form */}
                <Col md={7} className="signup-form-container">
                  <div className="mb-4">
                    <h2 className="signup-heading">Create Account</h2>
                    <p className="signup-description">
                      Join PriceWise and start optimizing your pricing
                    </p>
                  </div>

                  {/* Alerts */}
                  {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {error}
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert variant="success" className="mb-3">
                      <i className="bi bi-check-circle me-2"></i>
                      {success}
                    </Alert>
                  )}

                  {/* Form */}
                  <Form onSubmit={handleSubmit}>
                    {/* Business Name */}
                    <Form.Group className="mb-3">
                      <Form.Label className="signup-label">Business Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="businessName"
                        placeholder="Your café or restaurant name"
                        value={formData.businessName}
                        onChange={handleChange}
                        disabled={loading}
                        className="signup-input"
                      />
                    </Form.Group>

                    {/* Email */}
                    <Form.Group className="mb-3">
                      <Form.Label className="signup-label">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                        className="signup-input"
                      />
                    </Form.Group>

                 {/* Password with Toggle */}
<Form.Group className="mb-3">
  <Form.Label className="signup-label">Password</Form.Label>
  <InputGroup>
    <Form.Control
      type={showPassword ? 'text' : 'password'}
      name="password"
      placeholder="Minimum 8 characters"
      value={formData.password}
      onChange={handleChange}
      disabled={loading}
      className="signup-input"
      style={{ borderRight: 'none' }}
    />
    <Button
      variant="outline-secondary"
      onClick={() => setShowPassword(!showPassword)}
      disabled={loading}
      style={{
        borderLeft: 'none',
        border: '2px solid #e2e8f0',
        borderRadius: '0 10px 10px 0',
        backgroundColor: 'white',
        color: '#6f7478ff'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#f8f9fa';
        e.target.style.color = '#7B4B94';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'white';
        e.target.style.color = '#6f7478ff';
      }}
    >
      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
    </Button>
  </InputGroup>
  <Form.Text className="text-muted small">
    Must be at least 8 characters long
  </Form.Text>
</Form.Group>

                  {/* Confirm Password with Toggle */}
<Form.Group className="mb-4">
  <Form.Label className="signup-label">Confirm Password</Form.Label>
  <InputGroup>
    <Form.Control
      type={showConfirmPassword ? 'text' : 'password'}
      name="confirmPassword"
      placeholder="Re-enter your password"
      value={formData.confirmPassword}
      onChange={handleChange}
      disabled={loading}
      className="signup-input"
      style={{ borderRight: 'none' }}
    />
    <Button
      variant="outline-secondary"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      disabled={loading}
      style={{
        borderLeft: 'none',
        border: '2px solid #e2e8f0',
        borderRadius: '0 10px 10px 0',
        backgroundColor: 'white',
        color: '#6f7478ff'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#f8f9fa';
        e.target.style.color = '#7B4B94';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'white';
        e.target.style.color = '#6f7478ff';
      }}
    >
      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
    </Button>
  </InputGroup>
</Form.Group>

                    {/* Submit Button */}
                    <Button type="submit" disabled={loading} className="signup-button">
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <i className="bi bi-arrow-right ms-2"></i>
                        </>
                      )}
                    </Button>
                  </Form>

                  {/* Login Link */}
                  <div className="text-center mt-4">
                    <span className="text-muted">Already have an account? </span>
                    <a href="/login" className="signup-link">Sign In</a>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Signup;