// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from "react-bootstrap";
import { supabase } from "../client";
import "../components/layout/Layout.css";

const Login = ({ setToken }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.email || !formData.password) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    if (formData.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Save session
      setToken?.(data.session); // safe call
      localStorage.setItem("supabase_token", JSON.stringify(data.session));

      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.message || "Login failed");
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
                {/* Left Side - Branding (same as Signup) */}
                <Col
                  md={5}
                  className="signup-left-side d-none d-md-flex flex-column justify-content-center align-items-center text-center"
                >
                  <img
                    src="/PriceWiseLOGO.png"
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

                  {/* Alerts */}
                  {errorMsg && (
                    <Alert
                      variant="danger"
                      dismissible
                      onClose={() => setErrorMsg("")}
                      className="mb-3"
                    >
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {errorMsg}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
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
                    <Form.Group className="mb-4">
                      <Form.Label className="signup-label">Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Minimum 8 characters"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={loading}
                          className="signup-input"
                          style={{ borderRight: "none" }}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          style={{
                            borderLeft: "none",
                            border: "2px solid #e2e8f0",
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
                      </InputGroup>

                      <Form.Text className="text-muted small">Password must be at least 8 characters</Form.Text>
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
                    <span className="text-muted">Don’t have an account? </span>
                    <Link to="/signup" className="signup-link">
                      Sign up
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
