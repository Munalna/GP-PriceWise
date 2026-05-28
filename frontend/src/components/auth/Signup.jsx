import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (fullName.trim().length === 0) {
  setError('Business name is required');
  return;
}

if (fullName.length > 50) {
  setError('Business name must not exceed 50 characters');
  return;
}

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
              <Row className="g-0">
                <Col md={5} className="auth-brand-section text-white p-5 d-flex flex-column justify-content-center">
                  <h2 className="fw-bold mb-3">GP-PriceWise</h2>
                  <p className="mb-5 opacity-75">Smart Pricing Management</p>
                  <div>
                    <div className="mb-3">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Real-time price optimization
                    </div>
                    <div className="mb-3">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Seasonal pricing control
                    </div>
                    <div>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Cost management insights
                    </div>
                  </div>
                </Col>

                <Col md={7} className="p-5 bg-white">
                  <div className="mb-4">
                    <h3 className="fw-semibold mb-2">Create Account</h3>
                    <p className="text-muted small">Sign up to get started with GP-PriceWise</p>
                  </div>

                  {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                  {success && <Alert variant="success" className="py-2">Account created! Check your email.</Alert>}

                  <Form onSubmit={handleSignUp}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        maxLength={50} 
                        className="py-2"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="py-2"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="py-2"
                      />
                      <Form.Text className="text-muted">Must be at least 8 characters</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium small">Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="py-2"
                      />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 py-2 fw-semibold" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                  </Form>

                  <div className="text-center mt-4">
                    <p className="text-muted small mb-0">
                      Already have an account? <a href="/login" className="text-decoration-none fw-semibold">Log In</a>
                    </p>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default SignUp;