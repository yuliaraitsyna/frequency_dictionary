import React, { useState } from 'react';
import axios from 'axios';
import { Button, Container, Typography } from '@mui/material';
import DictionaryList from './DictionaryList';

const FileUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<{ word: string; frequency: number }[] | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('http://127.0.0.1:8000/upload_file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log(res.data);
            setResponse(res.data); // Assuming the server responds with the frequency dictionary
        } catch (error) {
            console.error('Error uploading file:', error);
            setResponse(null); // Clear response on error
        }
    };

    return (
        <Container maxWidth="md" style={{ margin: "5%" }}>
            <Typography variant='h5'>Upload Dictionary</Typography>
            <input type="file" onChange={handleFileChange} />
            <Button 
                onClick={handleUpload} 
                variant="contained" 
                color="primary" 
                style={{ marginTop: '10px' }}
            >
                Upload
            </Button>
            {response && <DictionaryList dictionary={response} />}
        </Container>
    );
};

export default FileUploader;
