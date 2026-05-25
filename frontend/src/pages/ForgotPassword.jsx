import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import '../components/layout/Layout.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    const frontendBaseUrl = (process.env.REACT_APP_FRONTEND_URL || window.location.origin).replace(/\/$/, '');

    try {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${frontendBaseUrl}/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess('If this email exists, a reset link has been sent.');
      setEmail('');
    } catch (submitError) {
      setError(submitError.message || 'Failed to send reset email. Please try again.');
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
                <Col
                  md={5}
                  className="signup-left-side d-none d-md-flex flex-column justify-content-center align-items-center text-center"
                >
                  <img
                    src="/PriceWiseLOGO.PNG"
                    alt="PriceWise Logo"
                    style={{ width: '150px', height: 'auto', marginTop: '15px', marginBottom: '20px' }}
                  />
                  <h1 className="signup-title">PriceWise</h1>
                  <p className="signup-subtitle">Smart Pricing Management for Saudi Cafes</p>
                </Col>

                <Col md={7} className="signup-form-container">
                  <div className="mb-4">
                    <h2 className="signup-heading">Forgot Password</h2>
                    <p className="signup-description">Enter your email to receive a reset link</p>
                  </div>

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

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-4">
                      <Form.Label className="signup-label">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={loading}
                        className="signup-input"
                        maxLength={254}
                      />
                    </Form.Group>

                    <Button type="submit" disabled={loading} className="signup-button">
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Reset Link
                          <i className="bi bi-envelope ms-2"></i>
                        </>
                      )}
                    </Button>
                  </Form>

                  <div className="text-center mt-4">
                    <Link to="/login" className="signup-link">
                      Back to Login
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

export default ForgotPassword;

