import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import '../components/layout/Layout.css';

const passwordMinLength = 8;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const setRecoverySessionFromHash = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }
        }

        const { data, error: getSessionError } = await supabase.auth.getSession();
        if (getSessionError) {
          throw getSessionError;
        }

        if (!isMounted) {
          return;
        }

        if (data.session) {
          setRecoveryReady(true);
        } else {
          setError('Recovery session is missing or expired. Request a new reset link.');
        }
      } catch (sessionSetupError) {
        if (isMounted) {
          setError(sessionSetupError.message || 'Failed to validate recovery session.');
        }
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryReady(true);
        setError('');
        setCheckingSession(false);
      }
    });

    setRecoverySessionFromHash();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const validatePassword = () => {
    if (newPassword.length < passwordMinLength) {
      setError('Password must be at least 8 characters long.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Password and confirmation do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!recoveryReady) {
      setError('Recovery session is not ready yet.');
      return;
    }

    if (!validatePassword()) {
      return;
    }

    try {
      setLoading(true);

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        throw updateError;
      }

      setSuccess('Password updated successfully. Redirecting to login...');
      await supabase.auth.signOut();
      localStorage.removeItem('supabase_token');

      setTimeout(() => {
        navigate('/login', { replace: true, state: { message: 'Password updated' } });
      }, 1200);
    } catch (submitError) {
      setError(submitError.message || 'Failed to update password. Please request a new link.');
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
                    <h2 className="signup-heading">Reset Password</h2>
                    <p className="signup-description">Create a new password for your account</p>
                  </div>

                  {checkingSession && <Alert variant="info">Checking recovery session...</Alert>}

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
                    <Form.Group className="mb-3">
                      <Form.Label className="signup-label">
                        New Password <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          disabled={loading || checkingSession || !recoveryReady}
                          className="signup-input no-native-reveal"
                          style={{ borderRight: 'none' }}
                          placeholder="Minimum 8 characters"
                          maxLength={128}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          disabled={loading || checkingSession || !recoveryReady}
                          style={{
                            borderLeft: 'none',
                            border: '2px solid #e2e8f0',
                            borderRadius: '0 10px 10px 0',
                            backgroundColor: 'white',
                            color: '#6f7478ff',
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = '#f8f9fa';
                            event.currentTarget.style.color = '#7B4B94';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = 'white';
                            event.currentTarget.style.color = '#6f7478ff';
                          }}
                        >
                          <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="signup-label">
                        Confirm Password <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          disabled={loading || checkingSession || !recoveryReady}
                          className="signup-input no-native-reveal"
                          style={{ borderRight: 'none' }}
                          placeholder="Re-enter new password"
                          maxLength={128}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading || checkingSession || !recoveryReady}
                          style={{
                            borderLeft: 'none',
                            border: '2px solid #e2e8f0',
                            borderRadius: '0 10px 10px 0',
                            backgroundColor: 'white',
                            color: '#6f7478ff',
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = '#f8f9fa';
                            event.currentTarget.style.color = '#7B4B94';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = 'white';
                            event.currentTarget.style.color = '#6f7478ff';
                          }}
                        >
                          <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Button
                      type="submit"
                      disabled={loading || checkingSession || !recoveryReady}
                      className="signup-button"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          Update Password
                          <i className="bi bi-shield-lock ms-2"></i>
                        </>
                      )}
                    </Button>
                  </Form>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ResetPassword;

