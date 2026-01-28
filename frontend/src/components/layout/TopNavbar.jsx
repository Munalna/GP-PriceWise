import React from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';

const TopNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="top-navbar">
      <Container fluid>
        <Navbar.Brand href="/">
          <strong>PriceWise</strong>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="top-navbar-nav" />
        
        <Navbar.Collapse id="top-navbar-nav" className="justify-content-end">
          <Nav>
            <Nav.Link href="#notifications">
              <i className="bi bi-bell"></i> Notifications
            </Nav.Link>
            
            <NavDropdown title="Admin User" id="user-dropdown" align="end">
              <NavDropdown.Item href="#profile">
                <i className="bi bi-person"></i> Profile
              </NavDropdown.Item>
              <NavDropdown.Item href="#settings">
                <i className="bi bi-gear"></i> Settings
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#logout">
                <i className="bi bi-box-arrow-right"></i> Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;