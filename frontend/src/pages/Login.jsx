import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from "react-bootstrap";
import { supabase } from "../client";
import "../components/layout/Layout.css";

// Security validation helpers
const sanitizeInput = (input) => {
  // Remove HTML tags and script tags
  return input.replace(/<[^>]*>/g, '').trim();
};

const hasXSSAttempt = (input) => {
  // Check for common XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onerror=, onclick=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  return xssPatterns.some(pattern => pattern.test(input));
};

const Login = ({ setToken }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true
    });
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = '';

    // Check for XSS attempts
    if (hasXSSAttempt(value)) {
      error = 'Invalid characters detected';
      setFieldErrors({
        ...fieldErrors,
        [name]: error
      });
      return error;
    }

    switch (name) {
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (value.length > 254) {
          error = 'Email is too long';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email';
        }
        break;
      
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (value.length > 128) {
          error = 'Password must be less than 128 characters';
        }
        break;
      
      default:
        break;
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: error
    });

    return error;
  };

  const validateAllFields = () => {
    const errors = {};
    
    // Email
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (hasXSSAttempt(formData.email)) {
      errors.email = 'Invalid characters detected';
    } else if (formData.email.length > 254) {
      errors.email = 'Email is too long';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    // Password
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (formData.password.length > 128) {
      errors.password = 'Password must be less than 128 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true
    });

    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    try {
      setLoading(true);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      // Save session
      setToken?.(data.session);
      localStorage.setItem("supabase_token", JSON.stringify(data.session));

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (fieldName) => {
    const baseClass = 'signup-input';
    if (touched[fieldName] && fieldErrors[fieldName]) {
      return `${baseClass} is-invalid`;
    }
    return baseClass;
  };

  return (
    <div className="signup-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="signup-card shadow-lg border-0">
              <Row className="g-0">
                {/* Left Side - Branding */}
                <Col
                  md={5}
                  className="signup-left-side d-none d-md-flex flex-column justify-content-center align-items-center text-center"
                >
                  <img
                    src="/PriceWiseLOGO.PNG"
                    alt="PriceWise Logo"
                    style={{
                      width: "150px",
                      height: "auto",
                      marginTop: "15px",
                      marginBottom: "20px",
                    }}
                  />
                  <h1 className="signup-title">PriceWise</h1>
                  <p className="signup-subtitle">Smart Pricing Management for Your Café & Restaurant</p>
                </Col>

                {/* Right Side - Form */}
                <Col md={7} className="signup-form-container">
                  <div className="mb-4">
                    <h2 className="signup-heading">Welcome Back</h2>
                    <p className="signup-description">Sign in to continue to your dashboard</p>
                  </div>

                  {/* Server Error Alert Only */}
                  {error && (
                    <Alert
                      variant="danger"
                      dismissible
                      onClose={() => setError("")}
                      className="mb-3"
                    >
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <Form.Group className="mb-3">
                      <Form.Label className="signup-label">
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        className={getInputClassName('email')}
                        isInvalid={touched.email && !!fieldErrors.email}
                        maxLength={254}
                      />
                      {touched.email && fieldErrors.email && (
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.email}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>

                    {/* Password with Toggle */}
                    <Form.Group className="mb-4">
                      <Form.Label className="signup-label">
                        Password <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup hasValidation>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Minimum 8 characters"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={loading}
                          className={getInputClassName('password')}
                          style={{ borderRight: "none" }}
                          isInvalid={touched.password && !!fieldErrors.password}
                          maxLength={128}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          style={{
                            borderLeft: "none",
                            border: `2px solid ${touched.password && fieldErrors.password ? '#dc3545' : '#e2e8f0'}`,
                            borderRadius: "0 10px 10px 0",
                            backgroundColor: "white",
                            color: "#6f7478ff",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                            e.currentTarget.style.color = "#7B4B94";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.color = "#6f7478ff";
                          }}
                        >
                          <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </Button>
                        {touched.password && fieldErrors.password && (
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.password}
                          </Form.Control.Feedback>
                        )}
                      </InputGroup>
                      {!touched.password && (
                        <Form.Text className="text-muted small">
                          Password must be at least 8 characters
                        </Form.Text>
                      )}
                    </Form.Group>

                    {/* Submit Button */}
                    <Button type="submit" disabled={loading} className="signup-button">
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          Login
                          <i className="bi bi-arrow-right ms-2"></i>
                        </>
                      )}
                    </Button>
                  </Form>

                  {/* Signup Link */}
                  <div className="text-center mt-4">
                    <span className="text-muted">Don't have an account? </span>
                    <Link to="/signup" className="signup-link">
                      Sign Up
                    </Link>
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

export default Login;