import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, CircularProgress, Container, Typography, Select, MenuItem, FormControl, InputLabel, TextField, Pagination, Dialog, DialogContent, ButtonGroup } from '@mui/material';
import DictionaryList from '../DictionaryList/DictionaryList';
import { Action } from '../../models/Action';
import Form from '../Form/Form';
import { FormAction } from '../Form/model/FormAction';
import { Word } from '../Form/model/Word';
import { UploadAction } from './model/UploadAction';
import { Language } from './model/Language';

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
    const [uploadAction, setUploadAction] = useState<UploadAction>(UploadAction.UPLOAD_DICTIONARY);
    const [language, setLanguage] = useState<Language>(Language.EN);

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

    const fetchPageData = async (page: number, action?: UploadAction ) => {
        if (!file) {
            alert('Please select a file.');
            return;
        }

        const actionType = action ? action : uploadAction;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('is_frequency_dict', String(actionType === UploadAction.UPLOAD_DICTIONARY));
        console.log(String(actionType === UploadAction.UPLOAD_DICTIONARY))

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
                        searchTerm,
                        language: language
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

    const handleLanguageChange = (selectedLanguage: Language) => {
        setLanguage(selectedLanguage);
    };

    return (
        <Container maxWidth="md" style={{ margin: "5%" }}>
            <Typography variant='h5'>Upload Dictionary</Typography>
            <ButtonGroup>
                <Button onClick={() => handleLanguageChange(Language.DE)} disabled={language === Language.DE}>DE</Button>
                <Button onClick={() => handleLanguageChange(Language.EN)} disabled={language === Language.EN}>EN</Button>
                <Button onClick={() => handleLanguageChange(Language.RU)} disabled={language === Language.RU}>RU</Button>
            </ButtonGroup>
            <Container>
                <input type="file" onChange={handleFileChange} />
                <Button
                    onClick={() => {
                        setUploadAction(UploadAction.UPLOAD_DICTIONARY);
                        clearUploadedFiles();
                        fetchPageData(1, UploadAction.UPLOAD_DICTIONARY);
                    }}
                    variant="contained"
                    color="primary"
                    style={{ marginTop: '10px' }}
                    disabled={loading}
                >
                    Upload dictionary
                </Button>
                <Button
                    onClick={() => {
                        setUploadAction(UploadAction.UPLOAD_TEXT);
                        clearUploadedFiles();
                        fetchPageData(1, UploadAction.UPLOAD_TEXT);
                    }}
                    variant="contained"
                    color="primary"
                    style={{ marginTop: '10px', marginLeft: '10px' }}
                    disabled={loading}
                >
                    Create dictionary from file
                </Button>
            </Container>
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
