from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
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

def get_next_id():
    if not frequency_dict:
        return 1 
    else:
        max_id = max(entry['id'] for entry in frequency_dict)
        return max_id + 1

@app.post("/upload_file")
async def upload_file(
    file: UploadFile = File(...),
    sortOption: SortOption = SortOption.SORT_FREQUENCY_DESC,
    page: Optional[int] = 1,
    limit: Optional[int] = 100,
    searchTerm: Optional[str] = None,
    fetch_all: Optional[bool] = False
):
    global frequency_dict
    content = await file.read()
    
    try:
        text = content.decode('utf-8')
        frequency_dict = [
            {"id": index + 1, "word": word, "frequency": int(freq)}
            for index, line in enumerate(text.splitlines()) if line.strip()
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
        raise HTTPException(status_code=400, detail=f"Error processing file: {e}")

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
        raise HTTPException(status_code=400, delail="Word already exists.")
    
    new_id = get_next_id()
    new_word = {"id": new_id, "word": word, "frequency": frequency}
    frequency_dict.append(new_word)
    return {"message": "Word added successfully", "word": new_word}

@app.put("/edit_word/{word_id}")
async def edit_word(word_id: int, word: Optional[str] = Body(None), frequency: Optional[int] = Body(None)):
    global frequency_dict
    for entry in frequency_dict:
        if entry['id'] == word_id:
            if word:
                entry['word'] = word
            if frequency is not None:
                entry['frequency'] = frequency
            return {"message": "Word updated successfully", "word": entry}
    
    raise HTTPException(status_code=404, detail="Word not found")

@app.delete("/delete_word/{word_id}")
async def delete_word(word_id: int):
    global frequency_dict
    for entry in frequency_dict:
        if entry['id'] == word_id:
            frequency_dict.remove(entry)
            return {"message": "Word deleted successfully", "word": entry}
    
    raise HTTPException(status_code=404, detail="Word not found")