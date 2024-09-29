from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from enum import Enum

app = FastAPI()

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SortOption(str, Enum):
    SORT_WORD_DESC = "Sort by word desc",
    SORT_WORD_ASC = "Sort by word asc",
    SORT_FREQUENCY_DESC = "Sort by frequency desc",
    SORT_FREQUENCY_ASC = "Sort by frequency asc",

frequency_dict = []

@app.post("/upload_file")
async def upload_file(file: UploadFile = File(...)):
    global frequency_dict
    content = await file.read()
    try:
        text = content.decode('utf-8')
        data = [line.split('\t') for line in text.splitlines()]
        frequency_dict = [{"word": word, "frequency": int(freq)} for word, freq in data]
        return frequency_dict
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {e}")

@app.get("/sort")
async def sort_dictionary(sortOption: SortOption):
    global frequency_dict
    print(f"Received sort option: {sortOption}")
    if not frequency_dict:
        raise HTTPException(status_code=404, detail="No data available to sort")

    if sortOption == SortOption.SORT_WORD_ASC:
        sorted_dict = sorted(frequency_dict, key=lambda x: x['word'])
    elif sortOption == SortOption.SORT_WORD_DESC:
        sorted_dict = sorted(frequency_dict, key=lambda x: x['word'], reverse=True)
    elif sortOption == SortOption.SORT_FREQUENCY_ASC:
        sorted_dict = sorted(frequency_dict, key=lambda x: x['frequency'])
    elif sortOption == SortOption.SORT_FREQUENCY_DESC:
        sorted_dict = sorted(frequency_dict, key=lambda x: x['frequency'], reverse=True)
    else:
        raise HTTPException(status_code=400, detail="Invalid sort option")

    return sorted_dict

@app.get("/search")
async def search_dictionary(searchTerm: Optional[str] = None):
    global frequency_dict
    if not frequency_dict:
        raise HTTPException(status_code=404, detail="No data available to search")

    if searchTerm:
        filtered_dict = [item for item in frequency_dict if searchTerm.lower() in item['word'].lower()]
        return filtered_dict
    else:
        return frequency_dict
