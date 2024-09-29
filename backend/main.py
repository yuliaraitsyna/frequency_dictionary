from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload_file")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    try:
        text = content.decode('utf-8')
        data = [line.split('\t') for line in text.splitlines()]
        frequency_dict = [{"word": word, "frequency": int(freq)} for word, freq in data]
        return frequency_dict
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {e}")
