import React, { useEffect } from 'react';
import { Container } from '@mui/material';
import FileUploader from './components/FileUploader/FileUploader';

const App: React.FC = () => {
  return (
    <Container>
      <FileUploader />
    </Container>
  );
};

export default App;
