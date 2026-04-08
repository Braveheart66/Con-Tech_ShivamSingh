from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.analyze import router as analyze_router
from app.routers.scrape import router as scrape_router
from app.services.simplify import print_model_runtime_info


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


@app.on_event("startup")
def startup_event() -> None:
    print_model_runtime_info()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
