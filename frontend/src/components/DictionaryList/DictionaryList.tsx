import React from "react";
import { Button, Container, List, ListItem, ListItemText, Typography } from "@mui/material";
import { Word } from "../Form/model/Word";
import { FormAction } from "../Form/model/FormAction";

interface DictionaryListProps {
    dictionary: Word[] | null;
    openForm: (action: FormAction, word: Word) => void;
    setDictionary: () => void;
}

const DictionaryList: React.FC<DictionaryListProps> = ({ dictionary, openForm, setDictionary}) => {

    const handleOpenForm = (word: Word) => {
        openForm(FormAction.EDIT, word);
    }

    const handleDelete = async (word: Word) => {
        if (!window.confirm("Are you sure you want to delete this word?")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:8000/delete_word/${word.id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                setDictionary();
            } else {
                console.error("Failed to delete word");
            }
        } catch (error) {
            console.error("Error deleting word:", error);
        }
    };

    return (
        <Container>
            <Typography variant='h5' style={{ margin: "20px 0" }}>Dictionary List</Typography>
            <List>
                {dictionary && dictionary.length > 0 ? (
                    dictionary.map((entry) => (
                        <ListItem key={entry.id}>
                            <ListItemText primary={`${entry.word}: ${entry.frequency}`} />
                            <Container style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={() => handleOpenForm(entry)}>
                                    Edit
                                </Button>
                                <Button onClick={() => handleDelete(entry)}>
                                    Delete
                                </Button>
                            </Container>
                        </ListItem>
                    ))
                ) : (
                    <ListItem>
                        <ListItemText primary="No data available." />
                    </ListItem>
                )}
            </List>
        </Container>
    );
};

export default DictionaryList;
