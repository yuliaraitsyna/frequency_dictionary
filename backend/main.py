import os
import re
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Counter, Optional
from enum import Enum

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SortOption(str, Enum):
    SORT_WORD_DESC = "Sort by word desc"
    SORT_WORD_ASC = "Sort by word asc"
    SORT_FREQUENCY_DESC = "Sort by frequency desc"
    SORT_FREQUENCY_ASC = "Sort by frequency asc"

frequency_dict = []
uploaded_file_path = None

def get_next_id():
    if not frequency_dict:
        return 1
    else:
        max_id = max(entry['id'] for entry in frequency_dict)
        return max_id + 1

def save_to_file():
    global uploaded_file_path
    if uploaded_file_path is None:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    print(frequency_dict[0])
    with open(uploaded_file_path, 'w', encoding='utf-8') as f:
        for entry in frequency_dict:
            f.write(f"{entry['word']}\t{entry['frequency']}\n")

def clean_text(input_file, output_file, language):
    dash_pattern = r'[–—―-]'
    
    if language == 'ru':
        allowed_chars = r"[^а-яА-ЯёЁ\- ]"
    elif language == 'en':
        allowed_chars = r"[^a-zA-Z\-\' ]"
    elif language == 'de':
        allowed_chars = r"[^a-zA-ZäöüßÄÖÜ\- ]"
    else:
        raise ValueError("Unsupported language. Choose 'ru', 'en', or 'de'.")

    with open(input_file, 'r', encoding='utf-8') as fin, \
         open(output_file, 'w', encoding='utf-8') as fout:
        for line in fin:
            line = line.strip()
            line = re.sub(dash_pattern, '-', line)
            line = re.sub(r'(?<![а-яА-ЯёЁa-zA-ZäöüßÄÖÜ])-+(?![а-яА-ЯёЁa-zA-ZäöüßÄÖÜ])', '', line)
            line = re.sub(allowed_chars, '', line)
            line = re.sub(r'\s+', ' ', line)
            
            if line:
                fout.write(line + '\n')

def preprocess(text, language):
    text = text.lower()
    if language == 'ru':
        words = re.findall(r'\b[\w\-]+\b', text)
    elif language == 'en':
        words = re.findall(r"\b[\w'-]+\b", text)
    elif language == 'de':
        words = re.findall(r'\b[\wäöüß\-]+\b', text)

    return words

def create_frequency_dict(input_file, output_file, language):
    frequency = Counter()
    
    with open(input_file, 'r', encoding='utf-8') as fin:
        for line in fin:
            words = preprocess(line, language)
            frequency.update(words)

    with open(output_file, 'w', encoding='utf-8') as fout:
        for word, freq in frequency.most_common():
            fout.write(f"{word}\t{freq}\n")
                
@app.post("/upload_file")
async def upload_file(
    file: UploadFile = File(...),
    is_frequency_dict: bool = Body(...),
    sortOption: SortOption = SortOption.SORT_FREQUENCY_DESC,
    page: Optional[int] = 1,
    limit: Optional[int] = 100,
    searchTerm: Optional[str] = None,
    fetch_all: Optional[bool] = False,
    language: Optional[str] = 'en',
):
    global frequency_dict, uploaded_file_path
    print(uploaded_file_path)

    try:
        if uploaded_file_path is None:
            if is_frequency_dict:
                content = await file.read()
                uploaded_file_path = f"./uploaded_files/{file.filename}"
                os.makedirs(os.path.dirname(uploaded_file_path), exist_ok=True)

                with open(uploaded_file_path, 'wb') as f:
                    f.write(content)

                frequency_dict = [
                    {"id": index + 1, "word": word, "frequency": int(freq)}
                    for index, line in enumerate(content.decode('utf-8').splitlines())
                    if line.strip()
                    for word, freq in [line.split('\t')]
                ]
            else:
                if language not in ['ru', 'en', 'de']:
                    raise HTTPException(status_code=400, detail="Unsupported language. Choose 'ru', 'en', or 'de'.")

                content = await file.read()
                uploaded_file_path = f"./uploaded_files/{file.filename}"
                os.makedirs(os.path.dirname(uploaded_file_path), exist_ok=True)

                with open(uploaded_file_path, 'wb') as f:
                    f.write(content)

                cleaned_file_path = f"./uploaded_files/cleaned_{file.filename}"
                clean_text(uploaded_file_path, cleaned_file_path, language)

                frequency_dict_path = f"./uploaded_files/frequency_{file.filename}"
                create_frequency_dict(cleaned_file_path, frequency_dict_path, language)

                uploaded_file_path = frequency_dict_path

                with open(frequency_dict_path, 'r', encoding='utf-8') as f:
                    frequency_dict = [
                        {"id": index + 1, "word": word, "frequency": int(freq)}
                        for index, line in enumerate(f.read().splitlines())
                        if line.strip()
                        for word, freq in [line.split('\t')]
                    ]
        else:
            with open(uploaded_file_path, 'rb') as f:
                content = f.read()

            text = content.decode('utf-8')
            frequency_dict = [
                {"id": index + 1, "word": word, "frequency": int(freq)}
                for index, line in enumerate(text.splitlines())
                if line.strip()
                for word, freq in [line.split('\t')]
            ]

        sorted_dict = await sort_dictionary(sortOption)

        if searchTerm:
            sorted_dict = [entry for entry in sorted_dict if entry['word'].lower().startswith(searchTerm.lower())]

        if fetch_all:
            return {
                "items": sorted_dict,
                "total": len(sorted_dict),
                "page": 1,
                "limit": len(sorted_dict),
                "total_pages": 1
            }

        start = (page - 1) * limit
        end = start + limit
        paginated_dict = sorted_dict[start:end]

        return {
            "items": paginated_dict,
            "total": len(sorted_dict),
            "page": page,
            "limit": limit,
            "total_pages": (len(sorted_dict) + limit - 1) // limit
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

async def sort_dictionary(sortOption: SortOption):
    global frequency_dict
    
    if not frequency_dict:
        raise HTTPException(status_code=404, detail="No data available")
    
    if sortOption == SortOption.SORT_WORD_ASC:
        return sorted(frequency_dict, key=lambda x: x['word'])
    elif sortOption == SortOption.SORT_WORD_DESC:
        return sorted(frequency_dict, key=lambda x: x['word'], reverse=True)
    elif sortOption == SortOption.SORT_FREQUENCY_ASC:
        return sorted(frequency_dict, key=lambda x: x['frequency'])
    elif sortOption == SortOption.SORT_FREQUENCY_DESC:
        return sorted(frequency_dict, key=lambda x: x['frequency'], reverse=True)
    else:
        raise HTTPException(status_code=400, detail="Invalid sort option")

@app.post("/add_word")
async def add_word(word: str = Body(...), frequency: int = Body(...)):
    global frequency_dict
    if any(entry['word'] == word for entry in frequency_dict):
        raise HTTPException(status_code=400, detail="Word already exists.")
    
    new_id = get_next_id()
    new_word = {"id": new_id, "word": word, "frequency": frequency}
    frequency_dict.append(new_word)
    save_to_file()
    return {"message": "Word added successfully", "word": new_word}

@app.put("/edit_word/{word_id}")
async def edit_word(word_id: int, word: Optional[str] = Body(None), frequency: Optional[int] = Body(None)):
    global frequency_dict
    current_entry = next((entry for entry in frequency_dict if entry['id'] == word_id), None)
    
    if not current_entry:
        raise HTTPException(status_code=404, detail="Word not found")

    if word:
        existing_entry = next((entry for entry in frequency_dict if entry['word'] == word), None)
        
        if existing_entry:
            if frequency is not None:
                existing_entry['frequency'] += frequency
            else:
                existing_entry['frequency'] += current_entry['frequency']
            frequency_dict.remove(current_entry)
            save_to_file()
            return {"message": "Word updated successfully and frequencies summed", "word": existing_entry}

        current_entry['word'] = word
    if frequency is not None:
        current_entry['frequency'] = frequency

    save_to_file()
    return {"message": "Word updated successfully", "word": current_entry}

@app.delete("/delete_word/{word_id}")
async def delete_word(word_id: int):
    global frequency_dict
    for entry in frequency_dict:
        if entry['id'] == word_id:
            frequency_dict.remove(entry)
            print("DELETE")
            print(frequency_dict[0])
            save_to_file()
            return {"message": "Word deleted successfully", "word": entry}
    
    raise HTTPException(status_code=404, detail="Word not found")

@app.post("/clear_uploaded_files")
async def clear_uploaded_files():
    uploaded_files_dir = "./uploaded_files"
    if os.path.exists(uploaded_files_dir):
        shutil.rmtree(uploaded_files_dir)
        os.makedirs(uploaded_files_dir)
    global uploaded_file_path
    uploaded_file_path = None
    return {"message": "Uploaded files cleared successfully"}
