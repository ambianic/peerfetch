"""FASTAPI OpenAPI/REST app."""
import logging
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

log = logging.getLogger("uvicorn.error")

description = """
Minimal fastapi app for the peerfetch Hello World example.
"""

app = FastAPI(
    # FastAPI OpenAPI docs metadata
    # ref: https://fastapi.tiangolo.com/tutorial/metadata/
    title="Hello World OpenAPI",
    description=description,
    version="2021.10.13",
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
)


# CORS (Cross-Origin Resource Sharing) Section
# ref: https://fastapi.tiangolo.com/tutorial/cors/
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# [Sitemap]
# sitemap definitions follow

class HelloResponse(BaseModel):
  message: str = "Hello World!"


@app.get("/api/hello", response_model=HelloResponse)
def get_hello():
    """Returns Hello World!."""
    return HelloResponse()

