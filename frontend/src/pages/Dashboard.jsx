import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Dashboard = () => {
  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold text-dark">Dashboard</h2>
          <p className="text-muted">Overview of your business metrics</p>
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Dashboard Content</h5>
              <p className="text-muted">Teammate can build dashboard here</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;