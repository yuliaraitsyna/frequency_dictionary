from fastapi import FastAPI, UploadFile, File, HTTPException
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
            {"word": word, "frequency": int(freq)}
            for line in text.splitlines() if line.strip()
            for word, freq in [line.split('\t')]
        ]
        
        sorted_dict = await sort_dictionary(sortOption)

        if searchTerm:
            sorted_dict = [entry for entry in sorted_dict if searchTerm.lower() in entry['word'].lower()]

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
