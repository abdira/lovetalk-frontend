import React from 'react';
import { Container } from 'react-bootstrap';

const NotFound = () => {
  return (
    <Container className="text-center py-5">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for does not exist.</p>
    </Container>
  );
};

export default NotFound;

