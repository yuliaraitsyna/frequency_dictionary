import React, { useState } from 'react';
import axios from 'axios';
import { Button, CircularProgress, Container, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import DictionaryList from './DictionaryList';
import { Action } from '../models/Action';

const FileUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<{ word: string; frequency: number }[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [sortOption, setSortOption] = useState<Action>(Action.SORT_WORD_ASC);

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
            const res = await axios.post('http://127.0.0.1:8000/upload_file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log(res.data);
            setResponse(res.data);
        } catch (error) {
            console.error('Error uploading file:', error);
            setResponse(null);
        } finally {
            setLoading(false);
        }
    };

    const sortDictionary = (data: { word: string; frequency: number }[]) => {
        if (!data) return [];
        switch (sortOption) {
            case Action.SORT_WORD_ASC:
                return data.sort((a, b) => a.word.localeCompare(b.word));
            case Action.SORT_WORD_DESC:
                return data.sort((a, b) => b.word.localeCompare(a.word));
            case Action.SORT_FREQUENCY_ASC:
                return data.sort((a, b) => a.frequency - b.frequency);
            case Action.SORT_FREQUENCY_DESC:
                return data.sort((a, b) => b.frequency - a.frequency);
            default:
                return data;
        }
    };

    const sortedResponse = response && sortDictionary(response);

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
                <Container>
                    <FormControl style={{ marginTop: '10px' }}>
                        <InputLabel id="sort-select-label"></InputLabel>
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
                    </FormControl>
                </Container>
                {loading && <CircularProgress style={{ marginTop: '10px' }} />}
                {sortedResponse && <DictionaryList dictionary={sortedResponse} />}
            </Container>
        </Container>
    );
};

export default FileUploader;
