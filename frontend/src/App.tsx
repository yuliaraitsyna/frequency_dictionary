import React from 'react';
import { Container } from '@mui/material';
import FileUploader from './components/FileUploader';

const App: React.FC = () => {
  return (
    <Container>
      <FileUploader />
    </Container>
  );
};

export default App;
