import React, { useState } from 'react';
import axios from 'axios';
import { Button, CircularProgress, Container, Typography, Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material';
import DictionaryList from './DictionaryList';
import { Action } from '../models/Action';

const FileUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<{ word: string; frequency: number }[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [sortOption, setSortOption] = useState<Action>(Action.SORT_WORD_ASC);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredResponse, setFilteredResponse] = useState<{ word: string; frequency: number }[] | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setLoading(true);

        try {
            const res = await axios.post(
                `http://127.0.0.1:8000/upload_file`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            setResponse(res.data);
            setFilteredResponse(res.data);
        } catch (error) {
            console.error('Error uploading file:', error);
            setResponse(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = async () => {
        if (!response) return;
        setLoading(true);
        try {
            console.log(sortOption)
            const res = await axios.get(
                `http://127.0.0.1:8000/sort`, {
                    params: {
                        sortOption: sortOption,
                    },
                }
            );
            setFilteredResponse(res.data);
        } catch (error) {
            console.error('Error sorting data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!response || !searchTerm) return; 
        
        setLoading(true);
        try {
            const res = await axios.get(
                `http://127.0.0.1:8000/search`, {
                    params: {
                        searchTerm: searchTerm,
                    },
                }
            );
            setFilteredResponse(res.data);
        } catch (error) {
            console.error('Error searching data:', error);
        } finally {
            setLoading(false);
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

            <Container>
                <TextField
                    label="Search Word"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Button onClick={handleSearch} variant="contained" color="primary" style={{ marginTop: '10px' }}>
                    Search
                </Button>
            </Container>

            <FormControl fullWidth style={{ marginTop: '10px' }}>
                <InputLabel id="sort-select-label">Sort By</InputLabel>
                <Select
                    labelId="sort-select-label"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as Action)}
                >
                    <MenuItem value={Action.SORT_WORD_ASC}>{Action.SORT_WORD_ASC}</MenuItem>
                    <MenuItem value={Action.SORT_WORD_DESC}>{Action.SORT_WORD_DESC}</MenuItem>
                    <MenuItem value={Action.SORT_FREQUENCY_ASC}>{Action.SORT_FREQUENCY_ASC}</MenuItem>
                    <MenuItem value={Action.SORT_FREQUENCY_DESC}>{Action.SORT_FREQUENCY_DESC}</MenuItem>
                </Select>
                <Button onClick={handleSort} variant="contained" style={{ marginTop: '10px' }}>Sort</Button>
            </FormControl>

            <Container>
                {loading && <CircularProgress style={{ marginTop: '10px' }} />}
                {filteredResponse && <DictionaryList dictionary={filteredResponse} />}
            </Container>
        </Container>
    );
};

export default FileUploader;
