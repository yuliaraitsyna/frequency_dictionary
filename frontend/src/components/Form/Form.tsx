import { Button, Container, DialogActions, TextField, Typography } from "@mui/material";
import { FormAction } from "./model/FormAction";
import { useEffect, useState } from "react";
import { Word } from "./model/Word";
import axios from "axios";

interface FormProps {
  action: FormAction;
  word: Word;
  close: (status: boolean) => void;
  setDictionary: () => void;
}

const Form: React.FC<FormProps> = ({ action, word, close, setDictionary}) => {
  const [formWord, setFormWord] = useState<Word>(word);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const addWord = async (word: Word) => {
    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/add_word`,
        { id: word.id, word: word.word, frequency: word.frequency },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setDictionary();
      close(true);
    } catch (err) {
      console.error("Error adding word:", err);
      setErrorMessage("Failed to add word. Please try again.");
    }
  };

  const editWord = async (word: Word) => {
    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/edit_word/${word.id}`,
        { id: word.id, word: word.word, frequency: word.frequency },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setDictionary();
      close(true);
    } catch (err) {
      console.error("Error updating word:", err);
      setErrorMessage("Failed to update word. Please try again.");
    }
  };

  const handleClose = () => {
    close(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (action === FormAction.ADD) {
        await addWord(formWord);
      } else if (action === FormAction.EDIT) {
        await editWord(formWord);
      }
    } finally {
      close(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h4">{action === FormAction.ADD ? "Add Word" : "Edit Word"}</Typography>
      {errorMessage && <Typography color="error">{errorMessage}</Typography>}
      <TextField
        label="Word"
        value={formWord.word}
        onChange={(e) => setFormWord({ ...formWord, word: e.target.value })}
      />
      <TextField
        label="Frequency"
        type="number"
        value={formWord.frequency}
        onChange={(e) => setFormWord({ ...formWord, frequency: parseInt(e.target.value) })}
      />
      <Container>
        <DialogActions>
          <Button onClick={handleClose}>
            CANCEL
          </Button>
          <Button variant="contained" type="submit">
            {action === FormAction.ADD ? "SAVE" : "APPLY"}
          </Button>
        </DialogActions>
      </Container>
    </form>
  );
};

export default Form;
