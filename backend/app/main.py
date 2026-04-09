import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.analyze import router as analyze_router
from app.routers.scrape import router as scrape_router
from app.services.simplify import print_model_runtime_info

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Legal Clause Simplifier API")
    print_model_runtime_info()
    yield
    logger.info("Shutting down Legal Clause Simplifier API")


app = FastAPI(
    title="Legal Clause Simplifier API",
    description=(
        "MVP backend for Indian Rental Agreement and "
        "Leave-and-License clause simplification."
    ),
    version="0.1.0",
    lifespan=lifespan,
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
