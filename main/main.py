from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from deta import Deta


app = FastAPI(docs_url=None, openapi_url=None, redoc_url=None)
deta = Deta()
drive = deta.Drive("notes")


@app.get("/api/v1/list")
async def list_files():
    result = drive.list()
    all_files = result.get("names")
    paging = result.get("paging")
    last = paging.get("last") if paging else None
    while last:
        result = drive.list(last=last)
        all_files += result.get("names")
        paging = result.get("paging")
        last = paging.get("last") if paging else None

    return all_files


@app.get("/api/v1/get/{fname}", response_class=StreamingResponse)
async def get_file(fname: str):
    file = drive.get(fname)
    return StreamingResponse(file.iter_chunks())


@app.post("/api/v1/post/{fname}")
async def write_file(fname: str, request: Request):
    return drive.put(fname, await request.body())


@app.delete("/api/v1/del/{fname}")
async def delete_file(fname: str):
    return drive.delete(fname)


app.mount("/", StaticFiles(directory="static", html=True))
