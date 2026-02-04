import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../components/layout/Layout.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    // Get token from URL
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || type !== 'signup') {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    try {
      // Supabase automatically verifies the email when the link is clicked
      setStatus('success');
      setMessage('Email verified successfully! Redirecting to dashboard...');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error) {
      setStatus('error');
      setMessage('Failed to verify email. Please try again or contact support.');
    }
  };

  return (
    <div className="signup-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5 text-center">
                {/* Logo */}
                <img 
                  src="/PriceWiseLOGO.PNG" 
                  alt="PriceWise Logo" 
                  style={{
                    width: '120px',
                    height: '120px',
                    marginBottom: '30px',
                    borderRadius: '50%'
                  }}
                />

                <h2 className="fw-bold mb-4" style={{ color: '#6f7478ff' }}>
                  Email Verification
                </h2>

                {/* Verifying State */}
                {status === 'verifying' && (
                  <div>
                    <Spinner animation="border" style={{ color: '#7B4B94' }} className="mb-3" />
                    <p className="text-muted">Verifying your email address...</p>
                  </div>
                )}

                {/* Success State */}
                {status === 'success' && (
                  <Alert variant="success" className="mb-0">
                    <div className="mb-3">
                      <i className="bi bi-check-circle" style={{ fontSize: '48px', color: '#27AE60' }}></i>
                    </div>
                    <h5 className="mb-2">Success!</h5>
                    <p className="mb-0">{message}</p>
                  </Alert>
                )}

                {/* Error State */}
                {status === 'error' && (
                  <div>
                    <Alert variant="danger" className="mb-4">
                      <div className="mb-3">
                        <i className="bi bi-x-circle" style={{ fontSize: '48px' }}></i>
                      </div>
                      <h5 className="mb-2">Verification Failed</h5>
                      <p className="mb-0">{message}</p>
                    </Alert>
                    <a 
                      href="/signup" 
                      className="btn btn-primary"
                      style={{ backgroundColor: '#7B4B94', borderColor: '#7B4B94' }}
                    >
                      Back to Signup
                    </a>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default VerifyEmail;