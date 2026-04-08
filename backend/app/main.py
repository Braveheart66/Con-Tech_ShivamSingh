from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.analyze import router as analyze_router
from app.routers.scrape import router as scrape_router


app = FastAPI(
    title="Legal Clause Simplifier API",
    description=(
        "MVP backend for Indian Rental Agreement and "
        "Leave-and-License clause simplification."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(scrape_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
