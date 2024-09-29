import React from "react";
import { Container, List, ListItem, ListItemText, Typography } from "@mui/material";

interface DictionaryEntry {
    word: string;
    frequency: number;
}

interface DictionaryListProps {
    dictionary: DictionaryEntry[] | null;
}

const DictionaryList: React.FC<DictionaryListProps> = ({ dictionary }) => {
    return (
        <Container>
            <Typography variant='h5' style={{ margin: "20px 0" }}>Dictionary List</Typography>
            <List>
                {dictionary && dictionary.length > 0 ? (
                    dictionary.map((entry, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={`${entry.word}: ${entry.frequency}`} />
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
