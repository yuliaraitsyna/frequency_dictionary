import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, CircularProgress, Container, Typography, Select, MenuItem, FormControl, InputLabel, TextField, Pagination, Dialog, DialogContent } from '@mui/material';
import DictionaryList from '../DictionaryList/DictionaryList';
import { Action } from '../../models/Action';
import Form from '../Form/Form';
import { FormAction } from '../Form/model/FormAction';
import { Word } from '../Form/model/Word';

const defaultWord: Word = {
    id: 0,
    word: '',
    frequency: 0
}

const FileUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<Word[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortOption, setSortOption] = useState<Action>(Action.SORT_FREQUENCY_DESC);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalItems, setTotalItems] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [open, setOpen] = useState(false);
    const [formAction, setFormAction] = useState<FormAction>(FormAction.ADD);
    const [editedWord, setEditedWord] = useState<Word>(defaultWord);

    const itemsPerPage = 100;

    const clearUploadedFiles = async () => {
        try {
            const response = await fetch("http://localhost:8000/clear_uploaded_files", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(data.message);
        } catch (error) {
            console.error("Error clearing uploaded files:", error);
        }
    };

    useEffect(() => {
        clearUploadedFiles();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const fetchPageData = async (page: number) => {
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
                    params: {
                        page,
                        limit: itemsPerPage,
                        sortOption,
                        searchTerm
                    },
                }
            );

            setResponse(res.data.items);
            setTotalItems(res.data.total);
        } catch (error) {
            console.error('Error fetching page data:', error);
            setResponse([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = () => {
        fetchPageData(currentPage);
    }

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
        fetchPageData(page);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchPageData(1);
    };

    const handleSort = () => {
        setCurrentPage(1);
        fetchPageData(1);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleOpen = (action: FormAction, word?: Word) => {
        setFormAction(action);
        if (action === FormAction.EDIT && word) {
            setEditedWord(word);
        } else {
            setEditedWord(defaultWord);
        }
        setOpen(true);
    };

    return (
        <Container maxWidth="md" style={{ margin: "5%" }}>
            <Typography variant='h5'>Upload Dictionary</Typography>
            <input type="file" onChange={handleFileChange} />
            <Button
                onClick={() => {
                    clearUploadedFiles();
                    fetchPageData(1);
                }}
                variant="contained"
                color="primary"
                style={{ marginTop: '10px' }}
                disabled={loading}
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
                    onChange={e => {
                        setSearchTerm(e.target.value)
                        console.log(searchTerm)
                    }}
                />
                <Button onClick={handleSearch} variant="contained" color="primary" style={{ marginTop: '10px' }} disabled={loading}>
                    Search
                </Button>
            </Container>

            <FormControl fullWidth style={{ marginTop: '10px' }}>
                <InputLabel id="sort-select-label">Sort By</InputLabel>
                <Select
                    labelId="sort-select-label"
                    value={sortOption}
                    onChange={(e) => { setSortOption(e.target.value as Action) }}
                >
                    <MenuItem value={Action.SORT_WORD_ASC}>{Action.SORT_WORD_ASC}</MenuItem>
                    <MenuItem value={Action.SORT_WORD_DESC}>{Action.SORT_WORD_DESC}</MenuItem>
                    <MenuItem value={Action.SORT_FREQUENCY_ASC}>{Action.SORT_FREQUENCY_ASC}</MenuItem>
                    <MenuItem value={Action.SORT_FREQUENCY_DESC}>{Action.SORT_FREQUENCY_DESC}</MenuItem>
                </Select>
                <Button onClick={handleSort} variant="contained" style={{ marginTop: '10px' }} disabled={loading}>Sort</Button>
            </FormControl>

            <Button onClick={() => handleOpen(FormAction.ADD)}>Add word</Button>

            <Container>
                {loading && <CircularProgress style={{ marginTop: '10px' }} />}
                <DictionaryList dictionary={response} openForm={handleOpen} setDictionary={handleUpdate} />
                <Pagination
                    count={Math.ceil(totalItems / itemsPerPage)}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    style={{ marginTop: '20px' }}
                />
            </Container>

            <Dialog open={open} onClose={handleClose}>
                <DialogContent>
                    <Form action={formAction} word={editedWord} close={handleClose} setDictionary={handleUpdate} />
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default FileUploader;
