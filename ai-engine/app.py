import hashlib
import json
import logging
import math
import os
import re
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import faiss
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from PIL import Image
except Exception:  # pragma: no cover
    Image = None

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover
    SentenceTransformer = None


BASE_DIR = Path(__file__).resolve().parent
AI_PIPELINE_LOG = BASE_DIR / "ai-pipeline-debug.log"
LOCAL_TEXT_MODEL = BASE_DIR / "models" / "all-MiniLM-L6-v2"
LOCAL_CLIP_MODEL = BASE_DIR / "models" / "clip-ViT-B-32"
TEXT_MODEL_NAME = os.getenv(
    "AI_TEXT_MODEL_NAME",
    str(LOCAL_TEXT_MODEL) if LOCAL_TEXT_MODEL.exists() else "sentence-transformers/all-MiniLM-L6-v2",
)
CLIP_MODEL_NAME = os.getenv(
    "AI_CLIP_MODEL_NAME",
    str(LOCAL_CLIP_MODEL) if LOCAL_CLIP_MODEL.exists() else "clip-ViT-B-32",
)
FRONTEND_PUBLIC_DIR = Path(os.getenv("FRONTEND_PUBLIC_DIR", "../car-market-frontend/public")).resolve()

TEXT_MODEL = None
CLIP_MODEL = None
TEXT_MODEL_ERROR = None
CLIP_MODEL_ERROR = None
RANKING_CACHE_VERSION = "visual-attribute-intent-v6"
AI_DEBUG_LOGGING = os.getenv("AI_DEBUG_LOGGING", "1").lower() not in {"0", "false", "off"}
if AI_DEBUG_LOGGING:
    logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("automarket.ai")
logger.setLevel(logging.INFO)
if AI_DEBUG_LOGGING and not any(isinstance(handler, logging.FileHandler) for handler in logger.handlers):
    file_handler = logging.FileHandler(AI_PIPELINE_LOG, encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(file_handler)

# Advanced Caching
CATALOG_CACHE: Dict[str, Dict[str, Any]] = {}
EMBEDDING_CACHE: Dict[str, np.ndarray] = {}
VISUAL_EMBEDDING_CACHE: Dict[int, np.ndarray] = {}

ASPECT_PROMPTS = {
    "luxury": "premium luxury vehicle, refined cabin, high-end materials, executive ownership experience",
    "family": "family car, spacious seating, safe long-distance travel, practical SUV or comfortable cabin",
    "daily": "comfortable daily driving car, smooth commute, easy city use, reliable everyday ownership",
    "performance": "sporty aggressive performance car, fast acceleration, dynamic handling, exciting driving",
    "efficiency": "fuel efficient city car, economical running costs, hybrid diesel or efficient engine",
    "value": "strong value purchase, fair price, low mileage, smart used car investment",
    "touring": "long trips, highway comfort, quiet ride, grand touring, road trip vehicle",
}

INTENT_PROMPTS = {
    "commuter": "reliable daily commuter car practical automatic comfortable efficient low maintenance regular everyday use",
    "economy": "cheap fuel efficient economical low running cost reliable affordable commuter car",
    "budget": "budget car affordable low price cheap maintenance good value practical purchase",
    "family": "family vehicle spacious safe practical comfortable children luggage long trips",
    "luxury": "luxury premium executive refined high end comfortable prestigious vehicle",
    "sporty": "sporty aggressive stylish driver focused exciting coupe roadster",
    "sports": "sports car coupe roadster fast exciting driver focused performance vehicle",
    "comfort": "comfortable daily driving smooth quiet relaxed refined easy ownership",
    "offroad": "off road adventure rugged four wheel drive land cruiser capable terrain",
    "city_driving": "city car compact easy parking efficient urban commuting daily use",
    "electric": "electric vehicle ev hybrid efficient battery low running cost modern commuter",
    "performance": "high performance sports car track focused fast acceleration aggressive handling",
}

ECONOMY_MODELS = [
    "yaris", "corolla", "prius", "camry", "camry hybrid", "avalon", "avalon hybrid", "rav4", "rav4 hybrid",
    "civic", "accord hybrid", "fit", "insight", "elantra", "sonata hybrid",
    "accord", "fusion", "elantra hybrid", "sonata", "ioniq", "leaf", "bolt", "model 3",
    "golf", "polo", "fiesta", "focus", "rio", "mazda3", "mazda 3", "sentra", "altima"
]
PERFORMANCE_MODELS = [
    "supra", "gr86", "86", "mustang", "camaro", "corvette", "911", "carrera",
    "amg", "m3", "m4", "m5", "rs3", "rs4", "rs5", "rs6", "gt", "turbo",
    "hellcat", "challenger", "charger", "r8", "gtr", "wrx", "sti", "type r",
    "ioniq 5 n", " 5 n", " n ", "gr ", "spyder", "sport classic", "competition",
]
LUXURY_BRANDS = ["mercedes", "bmw", "audi", "porsche", "lexus", "bentley", "range rover", "land rover", "cadillac", "genesis"]
RELIABILITY_BRANDS = ["toyota", "honda", "mazda", "lexus", "hyundai", "kia", "ford", "nissan"]
DAILY_RELIABILITY_BRANDS = ["toyota", "honda", "mazda", "hyundai", "kia", "ford", "nissan", "lexus"]
EXOTIC_PERFORMANCE_BRANDS = ["porsche", "ferrari", "lamborghini", "mclaren", "bentley"]
GERMAN_BRANDS = ["audi", "bmw", "mercedes-benz", "porsche", "volkswagen"]
OFFROAD_MODELS = ["land cruiser", "wrangler", "bronco", "defender", "g class", "range rover", "4runner", "raptor"]
PERFORMANCE_TRIM_TERMS = [
    "gr", "gr86", "gr 86", "gr supra", "trd", "trd pro", "type r", "amg", "m competition",
    "m power", "rs", "rs3", "rs4", "rs5", "rs6", "nismo", "sti", "wrx sti", "hellcat",
    "gt", "gts", "gt3", "gt4", "turbo", "track", "racing", "race", "competition",
    "performance", "spyder", "sport classic", "race car",
]
COMMUTER_NEGATIVE_TERMS = [
    "type r", "rs6", "rs3", "rs4", "rs5", "amg", "spyder", "performance",
    "competition", "turbo", "race car", "racing", "track", "sport classic",
    "gt3", "gt4", "hellcat", "nismo", "wrx sti", "m3", "m4", "m5", "r8",
]
PRACTICAL_INTENT_TERMS = [
    "fuel efficient", "fuel-efficient", "economical", "economy", "commuter",
    "commute", "reliable", "practical", "affordable", "daily driver",
    "daily", "low maintenance", "low running", "budget", "reasonable price",
]
OFFROAD_TRIM_TERMS = ["trd off road", "trd off-road", "trd pro", "raptor", "rubicon", "trailhawk", "4x4"]
SPORTY_QUERY_TERMS = [
    "sporty", "sports", "sport car", "sports car", "performance", "racing", "race", "fast",
    "track", "trd", "gr", "type r", "amg", "m competition", "m power", "rs", "turbo",
    "coupe", "roadster", "offroad", "off-road", "off road", "4x4", "rugged", "adventure",
]
DAILY_QUERY_TERMS = [
    "daily", "daily-use", "daily use", "daily driver", "commute", "commuter", "reliable",
    "reliability", "economy", "economical", "fuel efficient", "efficient", "family",
    "normal", "regular", "practical", "city", "comfortable", "low maintenance",
    "maintenance cost", "daily commuter", "budget car",
]
DAILY_CONSUMER_TERMS = [
    "corolla", "prius", "yaris", "camry", "rav4", "civic", "accord", "fit", "insight",
    "elantra", "sonata", "ioniq", "leaf", "golf", "polo", "fiesta", "focus", "rio",
    "fusion", "mazda3", "mazda 3", "sentra", "altima",
]
ECONOMY_DAILY_BODY_TERMS = ["sedan", "saloon", "hatchback", "wagon", "minivan", "city", "compact"]
DAILY_PREFERRED_CATEGORY_TERMS = ["sedan", "saloon", "hatchback", "wagon", "minivan", "compact", "city"]
TRUCK_UTILITY_TERMS = ["truck", "pickup", "tacoma", "tundra"]
AUTOMOTIVE_DOMAIN_TERMS = [
    "car", "cars", "vehicle", "vehicles", "auto", "automotive", "marketplace", "inventory",
    "suv", "sedan", "coupe", "hatchback", "truck", "pickup", "wagon", "convertible",
    "fuel", "diesel", "petrol", "gasoline", "hybrid", "electric", "ev", "transmission",
    "automatic", "manual", "cvt", "mileage", "kilometers", "model", "brand", "trim",
    "daily driver", "family car", "offroad", "off-road", "performance",
    "voiture", "voitures", "véhicule", "véhicules", "vehicule", "vehicules", "automatique",
    "manuelle", "carburant", "essence", "électrique", "electrique", "kilometrage",
    "kilométrage", "marque", "modele", "modèle", "familial", "familiale", "sportive",
    "سيارة", "سيارات", "مركبة", "مركبات", "وقود", "بنزين", "ديزل", "هجين", "كهربائية",
    "أوتوماتيكي", "اوتوماتيك", "يدوي", "عائلية", "رياضية",
]
AUTOMOTIVE_SHOPPING_TERMS = [
    "buy", "purchase", "looking for", "recommend", "recommendation", "available",
    "do you have", "show me", "find", "compare", "budget", "price", "under", "below",
    "cheap", "affordable", "premium", "luxury", "reliable",
    "acheter", "cherche", "recherche", "recommander", "recommandation", "disponible",
    "disponibles", "budget", "prix", "sous", "moins de", "pas cher", "abordable",
    "premium", "luxe", "fiable",
    "أبحث", "ابحث", "اريد", "أريد", "اشتري", "شراء", "اقترح", "توصية", "متاحة",
    "ميزانية", "سعر", "اقل", "أقل", "رخيصة", "فاخرة", "موثوقة",
]
COLOR_TERMS = [
    "red", "blue", "black", "white", "silver", "gray", "grey", "green",
    "yellow", "orange", "brown", "purple", "gold", "beige",
]
COLOR_CANONICAL = {
    "grey": "gray",
}
OUT_OF_DOMAIN_MESSAGE = (
    "I'm specialized in helping with vehicle search and marketplace recommendations. "
    "What type of car are you looking for?"
)

BRAND_ALIASES = {
    "mercedes-benz": ["mercedes", "mercedes benz", "mercedes-benz", "benz", "mb"],
    "bmw": ["bmw", "bimmer"],
    "audi": ["audi"],
    "toyota": ["toyota"],
    "honda": ["honda", "acura"],
    "hyundai": ["hyundai"],
    "porsche": ["porsche"],
    "ford": ["ford"],
}

KNOWN_BRAND_ALIASES = {
    **BRAND_ALIASES,
    "tesla": ["tesla", "model s", "model 3", "model x", "model y"],
    "lexus": ["lexus"],
    "volkswagen": ["volkswagen", "vw"],
    "kia": ["kia"],
    "nissan": ["nissan"],
    "mazda": ["mazda"],
    "chevrolet": ["chevrolet", "chevy"],
    "land-rover": ["land rover", "range rover", "rangerover"],
    "jeep": ["jeep"],
    "volvo": ["volvo"],
    "bentley": ["bentley"],
    "ferrari": ["ferrari"],
    "lamborghini": ["lamborghini", "lambo"],
    "mclaren": ["mclaren"],
    "cadillac": ["cadillac"],
    "genesis": ["genesis"],
    "subaru": ["subaru"],
    "mitsubishi": ["mitsubishi"],
    "peugeot": ["peugeot"],
    "renault": ["renault"],
    "dacia": ["dacia"],
    "fiat": ["fiat"],
    "mini": ["mini"],
    "skoda": ["skoda"],
    "seat": ["seat"],
}

BRAND_DISPLAY_NAMES = {
    "mercedes-benz": "Mercedes-Benz",
    "bmw": "BMW",
    "audi": "Audi",
    "toyota": "Toyota",
    "honda": "Honda",
    "hyundai": "Hyundai",
    "porsche": "Porsche",
    "ford": "Ford",
    "tesla": "Tesla",
    "lexus": "Lexus",
    "volkswagen": "Volkswagen",
    "kia": "Kia",
    "nissan": "Nissan",
    "mazda": "Mazda",
    "chevrolet": "Chevrolet",
    "land-rover": "Land Rover",
    "jeep": "Jeep",
    "volvo": "Volvo",
    "bentley": "Bentley",
    "ferrari": "Ferrari",
    "lamborghini": "Lamborghini",
    "mclaren": "McLaren",
    "cadillac": "Cadillac",
    "genesis": "Genesis",
    "subaru": "Subaru",
    "mitsubishi": "Mitsubishi",
    "peugeot": "Peugeot",
    "renault": "Renault",
    "dacia": "Dacia",
    "fiat": "Fiat",
    "mini": "Mini",
    "skoda": "Skoda",
    "seat": "Seat",
}


app = FastAPI(title="AutoMarket Real AI Advisor", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health() -> Dict[str, Any]:
    return {
        "status": "online",
        "service": "AutoMarket AI advisor",
        "message": "Use the marketplace advisor form for vehicle recommendations.",
        "search_endpoint": "POST /ai-search",
    }

@app.get("/ai-search")
async def ai_search_help() -> Dict[str, Any]:
    return {
        "message": "The AI advisor search endpoint is online. Search requests should be sent as POST JSON.",
        "example_payload": {"query": "reliable Toyota daily cars", "cars": [], "limit": 5},
    }

class CarPayload(BaseModel):
    id: int
    brand: Optional[str] = ""
    model: Optional[str] = ""
    year: Optional[int] = None
    price: Optional[float] = None
    mileage: Optional[float] = None
    fuel_type: Optional[str] = ""
    transmission: Optional[str] = ""
    category: Optional[str] = ""
    color: Optional[str] = ""
    description: Optional[str] = ""
    image_url: Optional[str] = None
    main_image: Optional[str] = None

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    cars: List[CarPayload]
    user_profile: Optional[Dict[str, Any]] = None
    limit: int = 10
    response_language: Optional[str] = None

class SimilarRequest(BaseModel):
    car: CarPayload
    cars: List[CarPayload]
    limit: int = 8

class CompareRequest(BaseModel):
    cars: List[CarPayload]



class TrackRequest(BaseModel):
    user_id: Optional[str] = None
    event_type: str
    car: Optional[CarPayload] = None
    query: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

def dump_model(model: BaseModel) -> Dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()

def safe_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())

def detect_response_language(query: str) -> str:
    raw = str(query or "")
    if re.search(r"[\u0600-\u06FF]", raw):
        return "ar"

    text = raw.lower()
    french_markers = [
        " je ", " cherche ", " recherche ", " veux ", " voudrais ", " voiture ", " voitures ",
        " vehicule ", " vehicules ", " véhicule ", " véhicules ", " automatique ", " manuelle ",
        " familial ", " familiale ", " confortable ", " économique ", " economique ", " carburant ",
        " sous ", " moins de ", " disponible ", " disponibles ", " recommandez ", " conseil ",
        " essence ", " electrique ", " électrique ", " hybride ", " citadine ", " berline ",
    ]
    english_markers = [
        " looking ", " want ", " need ", " car ", " cars ", " vehicle ", " vehicles ",
        " automatic ", " manual ", " family ", " comfortable ", " cheap ", " efficient ",
        " under ", " below ", " recommend ", " available ", " fuel ", " daily ",
    ]
    padded = f" {text} "
    french_score = sum(1 for marker in french_markers if marker in padded)
    english_score = sum(1 for marker in english_markers if marker in padded)
    if re.search(r"[àâçéèêëîïôùûüÿœ]", text):
        french_score += 2
    return "fr" if french_score > english_score else "en"

def normalize_vector(vector: Any) -> np.ndarray:
    arr = np.asarray(vector, dtype=np.float32)
    norm = np.linalg.norm(arr)
    if norm == 0:
        return arr
    return arr / norm

def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))

def require_sentence_transformers() -> None:
    if SentenceTransformer is None:
        raise HTTPException(
            status_code=503,
            detail="sentence-transformers is not installed. Run: pip install -r ai-engine/requirements.txt",
        )

def text_model() -> SentenceTransformer:
    global TEXT_MODEL, TEXT_MODEL_ERROR
    require_sentence_transformers()
    if TEXT_MODEL is not None:
        return TEXT_MODEL
    try:
        TEXT_MODEL = SentenceTransformer(TEXT_MODEL_NAME)
        return TEXT_MODEL
    except Exception as exc:  # pragma: no cover
        TEXT_MODEL_ERROR = str(exc)
        raise HTTPException(status_code=503, detail=f"Text embedding model failed to load: {exc}")

def clip_model() -> SentenceTransformer:
    global CLIP_MODEL, CLIP_MODEL_ERROR
    require_sentence_transformers()
    if Image is None:
        raise HTTPException(status_code=503, detail="Pillow is required for CLIP visual search.")
    if CLIP_MODEL is not None:
        return CLIP_MODEL
    try:
        CLIP_MODEL = SentenceTransformer(CLIP_MODEL_NAME)
        return CLIP_MODEL
    except Exception as exc:  # pragma: no cover
        CLIP_MODEL_ERROR = str(exc)
        raise HTTPException(status_code=503, detail=f"CLIP model failed to load: {exc}")

def embed_texts(texts: List[str]) -> np.ndarray:
    if not texts:
        return np.empty((0, 0), dtype=np.float32)
    
    uncached = [t for t in texts if t not in EMBEDDING_CACHE]
    if uncached:
        vectors = text_model().encode(uncached, normalize_embeddings=True, convert_to_numpy=True)
        for t, v in zip(uncached, vectors):
            EMBEDDING_CACHE[t] = v
            
    return np.asarray([EMBEDDING_CACHE[t] for t in texts], dtype=np.float32)

def embed_text(text: str) -> np.ndarray:
    return embed_texts([text])[0]

def embed_clip_image(image: Image.Image) -> np.ndarray:
    vector = clip_model().encode(image, normalize_embeddings=True, convert_to_numpy=True)
    return normalize_vector(vector)

def car_title(car: CarPayload) -> str:
    return safe_text(f"{car.brand} {car.model}") or f"Car #{car.id}"

def clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))

def contains_any(text: str, terms: List[str]) -> bool:
    return any(term in text for term in terms)

def normalize_brand_name(value: Any) -> str:
    text = safe_text(value).lower().replace("&", "and")
    text = re.sub(r"[^a-z0-9]+", " ", text).strip()
    compact = text.replace(" ", "-")
    for canonical, aliases in KNOWN_BRAND_ALIASES.items():
        alias_keys = {canonical, canonical.replace("-", " ")}
        alias_keys.update(aliases)
        if text in alias_keys or compact == canonical:
            return canonical
    return compact

def query_mentions_term(query: str, term: str) -> bool:
    normalized_query = re.sub(r"[^\w]+", " ", query.lower(), flags=re.UNICODE).strip()
    normalized_term = re.sub(r"[^\w]+", " ", term.lower(), flags=re.UNICODE).strip()
    if not normalized_term:
        return False
    return bool(re.search(rf"(^| ){re.escape(normalized_term)}( |$)", normalized_query))

def text_mentions_term(text: str, term: str) -> bool:
    return query_mentions_term(text, term)

def text_mentions_any(text: str, terms: List[str]) -> bool:
    return any(text_mentions_term(text, term) for term in terms)

def canonical_color(value: Any) -> str:
    color = safe_text(value).lower()
    color = re.sub(r"[^a-z0-9]+", " ", color).strip()
    return COLOR_CANONICAL.get(color, color)

def normalized_exterior_color(value: Any) -> str:
    color = safe_text(value).lower()
    color = color.replace("grey", "gray")
    return re.sub(r"[^a-z0-9]+", " ", color).strip()

def car_matches_requested_exterior_color(car: CarPayload, requested_colors: List[str]) -> bool:
    exterior_color = normalized_exterior_color(car.color)
    if not exterior_color:
        return False
    return any(
        re.search(rf"(^| ){re.escape(canonical_color(color))}( |$)", exterior_color)
        for color in requested_colors
    )

def available_requested_colors(cars: List[CarPayload], requested_colors: List[str]) -> List[str]:
    available = []
    for color in requested_colors:
        canonical = canonical_color(color)
        if canonical in available:
            continue
        if any(car_matches_requested_exterior_color(car, [canonical]) for car in cars):
            available.append(canonical)
    return available

def sporty_or_offroad_intent_requested(query: str) -> bool:
    return text_mentions_any(query, SPORTY_QUERY_TERMS)

def practical_ownership_intent_requested(query: str, intent: Optional[Dict[str, float]] = None) -> bool:
    intent = intent or {}
    return (
        text_mentions_any(query, PRACTICAL_INTENT_TERMS)
        or intent.get("commuter", 0) >= 0.45
        or intent.get("economy", 0) >= 0.48
        or intent.get("budget", 0) >= 0.48
        or intent.get("city_driving", 0) >= 0.48
    )

def explicit_daily_or_economy_query_requested(query: str) -> bool:
    return text_mentions_any(query, [
        "daily", "daily-use", "daily use", "daily driver", "commute", "commuter",
        "reliable", "reliability", "economy", "economical", "fuel efficient",
        "efficient", "cheap", "affordable", "budget", "low maintenance",
        "maintenance cost", "city", "urban", "parking", "practical",
    ])

def daily_consumer_intent_requested(query: str, intent: Dict[str, float], performance_requested: bool) -> bool:
    if performance_requested:
        return False
    if text_mentions_any(query, ["luxury", "premium", "executive", "high end"]) and not explicit_daily_or_economy_query_requested(query):
        return False
    if text_mentions_any(query, ["family", "kids", "spacious"]) and text_mentions_any(query, ["suv", "crossover"]) and not explicit_daily_or_economy_query_requested(query):
        return False
    return (
        practical_ownership_intent_requested(query, intent)
        or explicit_daily_or_economy_query_requested(query)
        or intent.get("commuter", 0) >= 0.45
        or intent.get("economy", 0) >= 0.45
        or intent.get("budget", 0) >= 0.55
        or intent.get("city_driving", 0) >= 0.45
        or intent.get("comfort", 0) >= 0.42
    )

def performance_trim_detected(car: CarPayload) -> bool:
    text = f"{car.brand} {car.model} {car.category} {car.description}"
    return text_mentions_any(text, PERFORMANCE_TRIM_TERMS)

def offroad_trim_detected(car: CarPayload) -> bool:
    text = f"{car.brand} {car.model} {car.category} {car.description}"
    return text_mentions_any(text, OFFROAD_TRIM_TERMS)

def domain_term_mentions(query: str, terms: List[str]) -> List[str]:
    return [term for term in terms if query_mentions_term(query, term)]

def automotive_domain_assessment(query: str) -> Dict[str, Any]:
    signals = []
    score = 0.0

    if mentioned_brands(query):
        score += 0.55
        signals.append("brand")

    text = query.lower()
    fuel_signal = any(query_mentions_term(query, term) for terms in {
        "electric": ["electric", "ev"],
        "hybrid": ["hybrid"],
        "petrol": ["petrol", "gasoline", "gas"],
        "diesel": ["diesel"],
    }.values() for term in terms)
    if fuel_signal:
        score += 0.3
        signals.append("fuel")

    if any(query_mentions_term(query, term) for term in ["automatic", "auto", "manual", "cvt"]):
        score += 0.3
        signals.append("transmission")

    category_terms = ["suv", "crossover", "sedan", "saloon", "coupe", "hatchback", "truck", "pickup", "wagon", "convertible"]
    if any(query_mentions_term(query, term) for term in category_terms):
        score += 0.35
        signals.append("vehicle_category")

    if domain_term_mentions(query, AUTOMOTIVE_DOMAIN_TERMS):
        score += 0.45
        signals.append("automotive_term")

    if domain_term_mentions(query, AUTOMOTIVE_SHOPPING_TERMS):
        score += 0.18
        signals.append("shopping_term")

    if re.search(r"\b\d+(?:k|m|000)?\b", text):
        score += 0.12
        signals.append("price_or_numeric")

    score = round(min(1.0, score), 3)
    return {
        "score": score,
        "signals": sorted(set(signals)),
        "in_domain": score >= 0.32,
    }

def out_of_domain_response(query: str, domain: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    response_lang = detect_response_language(query)
    messages = {
        "en": OUT_OF_DOMAIN_MESSAGE,
        "fr": "Je suis specialise dans la recherche de vehicules et les recommandations du marketplace. Quel type de voiture recherchez-vous ?",
        "ar": "أنا متخصص في البحث عن السيارات وتوصيات السوق. ما نوع السيارة التي تبحث عنها؟",
    }
    return {
        "query": query,
        "description": query,
        "intent": {},
        "ai_confidence": "Out of Scope",
        "engine": "automotive-marketplace-assistant",
        "grounded_in_inventory": True,
        "response_language": response_lang,
        "domain_relevance": domain or automotive_domain_assessment(query),
        "inventory_answer": messages.get(response_lang, OUT_OF_DOMAIN_MESSAGE),
        "count": 0,
        "results": [],
        "recommendations": [],
    }

def debug_ai_pipeline(stage: str, context: Dict[str, Any]) -> None:
    if not AI_DEBUG_LOGGING:
        return
    logger.warning("AI advisor pipeline %s %s", stage, json.dumps(context, ensure_ascii=True, default=str))

def utility_truck_detected(car: CarPayload) -> bool:
    text = f"{car.brand} {car.model} {car.category} {car.description}"
    return text_mentions_any(text, TRUCK_UTILITY_TERMS)

def normalized_vehicle_text(car: CarPayload) -> str:
    return safe_text(f"{car.brand} {car.model} {car.category} {car.fuel_type} {car.transmission} {car.description}").lower()

def reliability_brand_score(car: CarPayload) -> float:
    brand = normalize_brand_name(car.brand)
    if brand in ["toyota", "honda", "lexus", "mazda"]:
        return 0.95
    if brand in ["hyundai", "kia", "ford", "nissan"]:
        return 0.82
    if brand in ["volkswagen", "subaru", "mitsubishi"]:
        return 0.72
    if brand in EXOTIC_PERFORMANCE_BRANDS:
        return 0.48
    return 0.6

def practical_brand_priority_score(car: CarPayload) -> float:
    brand = normalize_brand_name(car.brand)
    text = normalized_vehicle_text(car)
    if brand in ["honda", "toyota"]:
        return 1.0
    if brand == "ford" and text_mentions_any(text, ["fusion", "focus", "fiesta"]):
        return 0.94
    if brand == "hyundai" and not commuter_negative_detected(car):
        return 0.9
    if brand in ["mazda", "kia", "nissan", "lexus"]:
        return 0.78
    if brand in EXOTIC_PERFORMANCE_BRANDS:
        return 0.12
    if brand in ["audi", "bmw", "mercedes-benz"]:
        return 0.32
    return 0.55

def mileage_practicality_score(car: CarPayload) -> float:
    mileage = float(car.mileage or 0)
    if mileage <= 0:
        return 0.58
    if mileage <= 45000:
        return 0.96
    if mileage <= 90000:
        return 0.82
    if mileage <= 140000:
        return 0.6
    if mileage <= 200000:
        return 0.38
    return 0.22

def commuter_negative_detected(car: CarPayload) -> bool:
    return text_mentions_any(normalized_vehicle_text(car), COMMUTER_NEGATIVE_TERMS)

def hybrid_type_for_car(car: CarPayload, profile: Optional[Dict[str, float]] = None) -> str:
    text = normalized_vehicle_text(car)
    fuel = safe_text(car.fuel_type).lower()
    if "hybrid" not in fuel and "hybrid" not in text:
        return "non_hybrid"

    brand = normalize_brand_name(car.brand)
    category = safe_text(car.category).lower()
    price = float(car.price or 0)
    luxury_or_exotic = brand in EXOTIC_PERFORMANCE_BRANDS or text_mentions_any(text, LUXURY_BRANDS)
    performance_oriented = (
        commuter_negative_detected(car)
        or performance_trim_detected(car)
        or text_mentions_any(text, PERFORMANCE_MODELS)
        or contains_any(category, ["sport", "coupe", "convertible", "roadster"])
        or (brand in EXOTIC_PERFORMANCE_BRANDS and price > 650000)
        or (profile or {}).get("performance_score", 0) > 0.58
    )

    if performance_oriented and luxury_or_exotic:
        return "luxury_performance_hybrid"
    if performance_oriented:
        return "performance_hybrid"
    if luxury_or_exotic or price > 650000:
        return "luxury_hybrid"
    if brand in DAILY_RELIABILITY_BRANDS or text_mentions_any(text, DAILY_CONSUMER_TERMS):
        return "economy_hybrid"
    return "standard_hybrid"

def practical_hybrid_match(car: CarPayload, profile: Dict[str, float]) -> bool:
    hybrid_type = hybrid_type_for_car(car, profile)
    if hybrid_type not in {"economy_hybrid", "standard_hybrid"}:
        return False
    return (
        profile.get("practicality_score", 0) >= 0.58
        and profile.get("fuel_efficiency_score", 0) >= 0.55
        and profile.get("performance_score", 0) < 0.55
        and profile.get("luxury_score", 0) < 0.68
    )

def true_daily_economy_match(car: CarPayload, profile: Dict[str, float]) -> bool:
    text = normalized_vehicle_text(car)
    category = safe_text(car.category).lower()
    economy_body = contains_any(category, ECONOMY_DAILY_BODY_TERMS)
    economy_model = text_mentions_any(text, DAILY_CONSUMER_TERMS)
    reliable_brand = normalize_brand_name(car.brand) in DAILY_RELIABILITY_BRANDS
    economy_profile = (
        profile.get("economy_score", 0) >= 0.55
        or profile.get("fuel_efficiency_score", 0) >= 0.55
        or profile.get("city_score", 0) >= 0.55
        or profile.get("commuter_suitability_score", 0) >= 0.58
        or profile.get("practicality_score", 0) >= 0.58
    )
    disqualified = (
        utility_truck_detected(car)
        or commuter_negative_detected(car)
        or normalize_brand_name(car.brand) in EXOTIC_PERFORMANCE_BRANDS
        or profile.get("performance_trim_score", 0) > 0
        or profile.get("performance_score", 0) > 0.62
        or profile.get("offroad_score", 0) > 0.65
        or profile.get("offroad_trim_score", 0) > 0
    )
    return not disqualified and (economy_body or economy_model or (reliable_brand and economy_profile))

def commuter_hard_filter_match(car: CarPayload, profile: Dict[str, float]) -> bool:
    category = safe_text(car.category).lower()
    practical_body = contains_any(category, DAILY_PREFERRED_CATEGORY_TERMS)
    practical_score = profile.get("commuter_suitability_score", 0.0)
    return (
        true_daily_economy_match(car, profile)
        and max(practical_score, profile.get("practicality_score", 0.0)) >= 0.56
        and (
            practical_body
            or practical_hybrid_match(car, profile)
            or text_mentions_any(normalized_vehicle_text(car), DAILY_CONSUMER_TERMS)
            or profile.get("daily_usability_score", 0.0) >= 0.62
        )
    )

def mentioned_brands(query: str) -> List[str]:
    detected = []
    for canonical, aliases in KNOWN_BRAND_ALIASES.items():
        terms = [canonical, canonical.replace("-", " "), *aliases]
        if any(query_mentions_term(query, term) for term in terms):
            detected.append(canonical)
    return sorted(set(detected))

def available_brand_map(cars: List[CarPayload]) -> Dict[str, str]:
    return {
        normalize_brand_name(car.brand): safe_text(car.brand)
        for car in cars
        if safe_text(car.brand)
    }

def extract_budget(query: str) -> Optional[float]:
    text = query.lower().replace(",", "")
    match = re.search(r"(?:under|below|less than|max|maximum|budget(?: of)?|around|for)\s*(\d+(?:\.\d+)?)\s*(k|m|mad|dh|dhs)?", text)
    if not match:
        match = re.search(r"(\d+(?:\.\d+)?)\s*(k|m)\b", text)
    if not match:
        return None
    amount = float(match.group(1))
    suffix = match.group(2) or ""
    if suffix == "k":
        amount *= 1000
    elif suffix == "m":
        amount *= 1000000
    elif not suffix and amount > 0 and amount < 1000:
        # If user says "under 50" it usually means 50k
        amount *= 1000
    return amount

def is_cheapest_query(query: str) -> bool:
    text = query.lower()
    cheapest_signals = [
        "cheapest",
        "lowest price",
        "lowest priced",
        "least expensive",
        "minimum price",
        "low price",
        "only one cheapest",
    ]
    return any(signal in text for signal in cheapest_signals)

def has_affordability_signal(query: str) -> bool:
    text = query.lower()
    return any(
        signal in text
        for signal in ["cheap", "affordable", "budget", "low cost", "low running", "economy", "economical"]
    )

def detect_inventory_constraints(query: str, cars: List[CarPayload]) -> Dict[str, Any]:
    text = query.lower()
    available_brands = available_brand_map(cars)
    brand_mentions = mentioned_brands(query)
    constraints: Dict[str, Any] = {
        "brands": brand_mentions,
        "missing_brands": [brand for brand in brand_mentions if brand not in available_brands],
        "brand_mentions": brand_mentions,
        "brand_groups": [],
        "fuel_types": [],
        "transmissions": [],
        "categories": [],
        "colors": [],
        "features": [],
        "budget": extract_budget(query),
        "efficiency_required": False,
        "explicit": False,
        "response_language": detect_response_language(query),
    }

    for color in COLOR_TERMS:
        if re.search(rf"(^|[^a-z0-9]){color}([^a-z0-9]|$)", text):
            canonical = canonical_color(color)
            if canonical not in constraints["colors"]:
                constraints["colors"].append(canonical)

    if text_mentions_any(query, ["panoramic", "sunroof", "moonroof", "toit panoramique", "سقف بانورامي"]):
        constraints["features"].append("panoramic roof")
    if text_mentions_any(query, ["luxury", "premium", "leather", "high end", "luxe", "فاخر", "فاخرة"]):
        constraints["features"].append("luxury/premium")
    if text_mentions_any(query, ["third row", "3rd row", "7 seat", "7-seat", "troisieme rangee", "صف ثالث", "سبعة مقاعد"]):
        constraints["features"].append("third row seating")
    if text_mentions_any(query, ["family", "kids", "spacious", "familial", "familiale", "famille", "عائلية", "واسعة"]):
        constraints["features"].append("family-oriented")
    if text_mentions_any(query, ["german", "germany", "deutsche", "deutsch"]):
        constraints["brand_groups"].append("german")

    fuel_terms = {
        "electric": ["electric", "ev", "électrique", "electrique"],
        "hybrid": ["hybrid", "hybride", "هجين", "هجينة"],
        "petrol": ["petrol", "gasoline", "gas", "essence", "بنزين"],
        "diesel": ["diesel", "mazout", "gazoil", "ديزل"],
    }
    fuel_terms["electric"].extend(["électrique", "كهربائية", "كهربائي"])
    for fuel, terms in fuel_terms.items():
        if any(query_mentions_term(query, term) for term in terms):
            constraints["fuel_types"].append(fuel)

    if (
        any(signal in text for signal in ["fuel efficient", "efficient car", "low running", "economical", "economy car"])
        or text_mentions_any(query, ["fuel-efficient", "fuel efficient", "economical", "low maintenance"])
    ):
        constraints["efficiency_required"] = True

    if re.search(r"(^|[^\w])(automatic|auto|automatique|bva|أوتوماتيكي|اوتوماتيك)([^\w]|$)", text, flags=re.UNICODE):
        constraints["transmissions"].append("automatic")
    if re.search(r"(^|[^\w])(manual|manuelle|bvm|يدوي|يدوية)([^\w]|$)", text, flags=re.UNICODE):
        constraints["transmissions"].append("manual")
    if re.search(r"(^|[^\w])cvt([^\w]|$)", text, flags=re.UNICODE):
        constraints["transmissions"].append("cvt")

    category_terms = {
        "suv": ["suv", "crossover", "4x4", "jeep", "دفع رباعي"],
        "sedan": ["sedan", "saloon", "berline"],
        "coupe": ["coupe", "coupé"],
        "hatchback": ["hatchback", "compact", "citadine", "هاتشباك"],
        "truck": ["truck", "pickup", "pick up", "pick-up"],
        "wagon": ["wagon", "avant", "estate", "break"],
        "convertible": ["convertible", "cabriolet", "roadster", "cabrio", "مكشوفة"],
        "sports": ["sports car", "sport car", "sportive", "رياضية"],
    }
    for category, terms in category_terms.items():
        if any(query_mentions_term(query, term) for term in terms):
            constraints["categories"].append(category)

    constraints["explicit"] = bool(
        constraints["brands"]
        or constraints["missing_brands"]
        or constraints["brand_groups"]
        or constraints["fuel_types"]
        or constraints["transmissions"]
        or constraints["categories"]
        or constraints["efficiency_required"]
        or constraints["features"]
        or constraints["budget"]
    )
    return constraints

def car_matches_inventory_constraints(car: CarPayload, constraints: Dict[str, Any], relaxed_keys: Optional[set] = None) -> bool:
    if relaxed_keys is None:
        relaxed_keys = set()
        
    brand = normalize_brand_name(car.brand)
    fuel = safe_text(car.fuel_type).lower()
    transmission = safe_text(car.transmission).lower()
    category = safe_text(car.category).lower()
    text = f"{brand} {safe_text(car.model).lower()} {category} {fuel} {transmission} {safe_text(car.description).lower()}"

    if "brands" not in relaxed_keys:
        brands = [normalize_brand_name(b) for b in (constraints.get("brands") or [])]
        if brands and brand not in brands:
            return False

    if "brand_groups" not in relaxed_keys:
        brand_groups = constraints.get("brand_groups") or []
        if "german" in brand_groups and brand not in GERMAN_BRANDS:
            return False

    if "fuel_types" not in relaxed_keys:
        fuel_types = constraints.get("fuel_types") or []
        if fuel_types and not any(fuel_type in fuel for fuel_type in fuel_types):
            return False

    if "efficiency_required" not in relaxed_keys and constraints.get("efficiency_required"):
        profile = structured_car_profile(car)
        efficient_fuel = any(kind in fuel for kind in ["electric", "hybrid", "diesel"])
        economy_profile = (
            (profile.get("fuel_efficiency_score", 0) >= 0.6 or profile.get("economy_score", 0) >= 0.62)
            and profile.get("performance_score", 0) < 0.58
        )
        if not efficient_fuel and not economy_profile:
            return False

    if "transmissions" not in relaxed_keys:
        transmissions = constraints.get("transmissions") or []
        if transmissions:
            transmission_ok = False
            for requested in transmissions:
                if requested == "automatic" and ("automatic" in transmission or "pdk" in transmission or "cvt" in transmission):
                    transmission_ok = True
                elif requested in transmission:
                    transmission_ok = True
            if not transmission_ok:
                return False

    if "categories" not in relaxed_keys:
        categories = constraints.get("categories") or []
        if categories:
            category_ok = False
            for requested in categories:
                if requested == "suv" and ("suv" in category or "crossover" in category):
                    category_ok = True
                elif requested == "truck" and ("truck" in category or "pickup" in text):
                    category_ok = True
                elif requested == "sports" and ("sports" in category or structured_car_profile(car).get("performance_score", 0) >= 0.58):
                    category_ok = True
                elif requested in category:
                    category_ok = True
            if not category_ok:
                return False

    if "budget" not in relaxed_keys:
        budget = constraints.get("budget")
        if budget and car.price and car.price > budget * 1.05:
            return False
            
    if "features" not in relaxed_keys:
        features = constraints.get("features") or []
        for feature in features:
            if not car_satisfies_requested_feature(car, feature):
                return False

    return True

def apply_inventory_constraints(cars: List[CarPayload], constraints: Dict[str, Any], relaxed_keys: Optional[set] = None) -> List[CarPayload]:
    if not constraints.get("explicit"):
        return cars
    return [car for car in cars if car_matches_inventory_constraints(car, constraints, relaxed_keys)]

def relax_constraints_progressively(
    constraints: Dict[str, Any],
    cars: List[CarPayload],
) -> Tuple[List[CarPayload], Dict[str, Any], List[str]]:
    """
    When zero cars match all hard constraints, progressively drop lower-priority
    constraints until we get results.
    Returns (matched_cars, relaxed_constraints, list_of_dropped_labels).
    """
    feature_labels = []
    requested_features = constraints.get("features") or []
    if "luxury/premium" in requested_features:
        feature_labels.append("luxury or premium features")
    if "family-oriented" in requested_features:
        feature_labels.append("family-oriented features")
    if "panoramic roof" in requested_features:
        feature_labels.append("panoramic roof")
    if "third row seating" in requested_features:
        feature_labels.append("third-row seating")
    if not feature_labels:
        feature_labels = ["requested features"]

    fallback_plans = [
        ({"budget"}, ["budget"]),
        ({"features"}, feature_labels),
        ({"budget", "features"}, ["budget", *feature_labels]),
        ({"fuel_types", "features"}, ["powertrain", *feature_labels]),
        ({"fuel_types", "budget", "features"}, ["powertrain", "budget", *feature_labels]),
        ({"fuel_types", "budget", "features", "transmissions"}, ["powertrain", "budget", *feature_labels]),
        ({"fuel_types", "budget", "features", "transmissions", "efficiency_required", "colors"}, ["most constraints"]),
        ({"fuel_types", "budget", "features", "transmissions", "efficiency_required", "colors", "categories"}, ["vehicle type", "most constraints"]),
    ]
    
    for plan_keys, plan_labels in fallback_plans:
        relaxed_cars = apply_inventory_constraints(cars, constraints, relaxed_keys=plan_keys)
        if relaxed_cars:
            new_constraints = dict(constraints)
            if "fuel_types" in plan_keys: new_constraints["fuel_types"] = []
            if "budget" in plan_keys: new_constraints["budget"] = None
            if "features" in plan_keys: new_constraints["features"] = []
            if "transmissions" in plan_keys: new_constraints["transmissions"] = []
            if "categories" in plan_keys: new_constraints["categories"] = []
            if "colors" in plan_keys: new_constraints["colors"] = []
            
            new_constraints["explicit"] = bool(
                new_constraints.get("brands")
                or new_constraints.get("missing_brands")
                or new_constraints.get("brand_groups")
                or new_constraints.get("fuel_types")
                or new_constraints.get("transmissions")
                or new_constraints.get("categories")
                or new_constraints.get("efficiency_required")
                or new_constraints.get("features")
                or new_constraints.get("budget")
            )
            return relaxed_cars, new_constraints, plan_labels
            
    return [], constraints, []

def constraint_label(constraints: Dict[str, Any], fallback: str = "matching vehicles") -> str:
    parts = []
    if constraints.get("fuel_types"):
        parts.extend(constraints["fuel_types"])
    if constraints.get("categories"):
        parts.extend(constraints["categories"])
    if constraints.get("brand_groups"):
        parts.extend([brand_group_label(group) for group in constraints["brand_groups"]])
    if constraints.get("transmissions"):
        parts.extend(constraints["transmissions"])
    if constraints.get("efficiency_required"):
        parts.append("fuel-efficient")
    if constraints.get("brands"):
        parts.extend([BRAND_DISPLAY_NAMES.get(brand, brand.replace("-", " ").title()) for brand in constraints["brands"]])
    elif constraints.get("missing_brands"):
        parts.extend([BRAND_DISPLAY_NAMES.get(brand, brand.replace("-", " ").title()) for brand in constraints["missing_brands"]])
    return " ".join(parts) if parts else fallback

def brand_group_label(group: str) -> str:
    if group == "german":
        return "German"
    return group.replace("-", " ").title()

def no_inventory_label(constraints: Dict[str, Any]) -> str:
    brands = constraints.get("brands") or constraints.get("missing_brands") or []
    brand_label = ""
    if len(brands) == 1:
        brand_label = BRAND_DISPLAY_NAMES.get(brands[0], brands[0].replace("-", " ").title())

    if constraints.get("efficiency_required"):
        return safe_text(f"fuel-efficient {brand_label} economy cars")
    if constraints.get("fuel_types"):
        fuel = " or ".join(constraints["fuel_types"])
        return safe_text(f"{fuel} {brand_label} vehicles")
    if constraints.get("categories"):
        category = " or ".join(constraints["categories"])
        return safe_text(f"{brand_label} {category} vehicles")
    if constraints.get("transmissions"):
        transmission = " or ".join(constraints["transmissions"])
        return safe_text(f"{transmission} {brand_label} vehicles")
    if brand_label:
        return f"{brand_label} vehicles"
    return constraint_label(constraints)

def coverage_constraints_for(constraints: Dict[str, Any]) -> Dict[str, Any]:
    brands = constraints.get("brands") or []
    return {
        "brands": brands,
        "missing_brands": constraints.get("missing_brands") or [],
        "brand_mentions": constraints.get("brand_mentions") or [],
        "brand_groups": constraints.get("brand_groups") or [],
        "fuel_types": [],
        "transmissions": [],
        "categories": [],
        "colors": constraints.get("colors") or [],
        "efficiency_required": False,
        "explicit": bool(brands),
    }

def format_list(items: List[str]) -> str:
    clean = [item for item in items if item]
    if not clean:
        return ""
    if len(clean) == 1:
        return clean[0]
    if len(clean) == 2:
        return f"{clean[0]} and {clean[1]}"
    return ", ".join(clean[:-1]) + f", and {clean[-1]}"

def format_list_for_language(items: List[str], lang: str) -> str:
    clean = [safe_text(item) for item in items if safe_text(item)]
    if lang == "en":
        return format_list(clean)
    if not clean:
        return ""
    if len(clean) == 1:
        return clean[0]
    joiner = " و " if lang == "ar" else " et "
    separator = "، " if lang == "ar" else ", "
    return separator.join(clean[:-1]) + joiner + clean[-1]

def localized_constraint_name(value: str, lang: str) -> str:
    translations = {
        "fr": {
            "automatic": "transmission automatique",
            "manual": "transmission manuelle",
            "cvt": "transmission CVT",
            "suv": "SUV",
            "sedan": "berline",
            "coupe": "coupe",
            "hatchback": "citadine compacte",
            "truck": "pickup",
            "wagon": "break",
            "convertible": "cabriolet",
            "sports": "voiture sportive",
            "luxury/premium": "positionnement premium",
            "family-oriented": "usage familial",
            "panoramic roof": "toit panoramique",
            "third row seating": "troisieme rangee",
            "german": "marque allemande",
            "electric": "motorisation electrique",
            "hybrid": "motorisation hybride",
            "petrol": "motorisation essence",
            "diesel": "motorisation diesel",
            "budget proximity": "budget indique",
        },
        "ar": {
            "automatic": "ناقل حركة أوتوماتيكي",
            "manual": "ناقل حركة يدوي",
            "cvt": "ناقل حركة CVT",
            "suv": "سيارة SUV",
            "sedan": "سيدان",
            "coupe": "كوبيه",
            "hatchback": "هاتشباك",
            "truck": "بيك أب",
            "wagon": "واجون",
            "convertible": "مكشوفة",
            "sports": "سيارة رياضية",
            "luxury/premium": "طابع فاخر",
            "family-oriented": "استخدام عائلي",
            "panoramic roof": "سقف بانورامي",
            "third row seating": "صف ثالث من المقاعد",
            "german": "علامة ألمانية",
            "electric": "محرك كهربائي",
            "hybrid": "محرك هجين",
            "petrol": "محرك بنزين",
            "diesel": "محرك ديزل",
            "budget proximity": "قربها من الميزانية المطلوبة",
        },
    }
    return translations.get(lang, {}).get(value, value)

def localized_inventory_summary(
    query: str,
    results: List[Dict[str, Any]],
    constraints: Dict[str, Any],
    source_count: int,
    coverage: Optional[Dict[str, Any]] = None,
    lang: Optional[str] = None,
) -> str:
    response_lang = lang or constraints.get("response_language") or detect_response_language(query)
    if response_lang == "en":
        return inventory_answer_for(query, results, constraints, source_count, coverage)

    if not results:
        if response_lang == "ar":
            return "لا توجد حاليا مركبات مطابقة لطلبك في المخزون المتاح."
        return "Actuellement, aucun vehicule correspondant a votre demande n'est disponible dans l'inventaire."

    matched_signals: List[str] = []
    brands = requested_constraint_values(constraints, "brands")
    brand_groups = requested_constraint_values(constraints, "brand_groups")
    categories = requested_constraint_values(constraints, "categories")
    transmissions = requested_constraint_values(constraints, "transmissions")
    fuel_types = requested_constraint_values(constraints, "fuel_types")
    features = requested_constraint_values(constraints, "features")
    budget = constraints.get("budget") or constraints.get("_original_budget")

    if brands:
        matched_signals.append(format_list_for_language([BRAND_DISPLAY_NAMES.get(b, str(b)) for b in brands], response_lang))
    if "german" in brand_groups:
        matched_signals.append(localized_constraint_name("german", response_lang))
    matched_signals.extend(localized_constraint_name(item, response_lang) for item in categories)
    matched_signals.extend(localized_constraint_name(item, response_lang) for item in transmissions)
    matched_signals.extend(localized_constraint_name(item, response_lang) for item in fuel_types)
    matched_signals.extend(localized_constraint_name(item, response_lang) for item in features)
    if budget:
        matched_signals.append(localized_constraint_name("budget proximity", response_lang))

    relaxed_from = constraints.get("relaxed_from") or []
    some_over_budget = False
    if budget:
        prices = [float((item.get("car") or {}).get("price") or 0) for item in results]
        some_over_budget = any(price > float(budget) * 1.05 for price in prices if price > 0)

    if response_lang == "ar":
        base = "بناء على تفضيلاتك، هذه هي المركبات الأنسب المتاحة حاليا."
        if matched_signals:
            base += f" تم اختيارها لأنها تطابق {format_list_for_language(matched_signals, response_lang)}."
        if relaxed_from or some_over_budget:
            base += " ملاحظة: تم تخفيف بعض المعايير لأن المخزون الحالي لا يحتوي على مطابقة كاملة."
        return base

    base = "Selon vos preferences, voici les vehicules les plus adaptes actuellement disponibles."
    if matched_signals:
        base += f" Ils ont ete selectionnes car ils correspondent a {format_list_for_language(matched_signals, response_lang)}."
    if relaxed_from or some_over_budget:
        base += " A noter : certains criteres ont ete assouplis car l'inventaire actuel ne contient pas de correspondance exacte."
    return base

def inventory_scope_label(constraints: Dict[str, Any]) -> str:
    brands = constraints.get("brands") or []
    if len(brands) == 1:
        return f"{BRAND_DISPLAY_NAMES.get(brands[0], brands[0].replace('-', ' ').title())} inventory"
    return "current inventory"

def result_brand_category_label(results: List[Dict[str, Any]], constraints: Dict[str, Any]) -> str:
    brands = []
    for item in results[:5]:
        car = item.get("car") or {}
        brand = safe_text(car.get("brand"))
        if brand and brand not in brands:
            brands.append(brand)

    categories = requested_constraint_values(constraints, "categories")
    category = "vehicles"
    if "suv" in categories:
        category = "SUVs"
    elif categories:
        category = categories[0] + "s"

    if len(brands) == 1:
        return f"{brands[0]} {category}"
    if "german" in requested_constraint_values(constraints, "brand_groups"):
        return f"German {category}"
    return category


def build_advisor_explanation(
    query: str,
    results: List[Dict[str, Any]],
    constraints: Dict[str, Any],
    relaxed_from: List[str],
    coverage: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Produces a human advisor-style explanation describing WHY the returned vehicles
    were selected, what intent signals they match, and what tradeoffs exist.
    Works for both direct-match and progressive-relaxation paths.
    """
    # --- Gather intent signals from constraints ---
    brand_groups   = requested_constraint_values(constraints, "brand_groups")
    categories     = requested_constraint_values(constraints, "categories")
    features       = requested_constraint_values(constraints, "features")
    fuel_types     = requested_constraint_values(constraints, "fuel_types")
    transmissions  = requested_constraint_values(constraints, "transmissions")
    budget         = constraints.get("budget") or constraints.get("_original_budget")
    is_german      = "german" in brand_groups
    is_suv         = "suv" in categories
    is_luxury      = "luxury/premium" in features
    is_hybrid      = any(f in ("hybrid", "electric") for f in fuel_types)

    # --- Gather result metadata ---
    result_brands: List[str] = []
    result_prices: List[float] = []
    for item in results:
        car = item.get("car") or {}
        b = safe_text(car.get("brand"))
        if b and b not in result_brands:
            result_brands.append(b)
        p = float(car.get("price") or 0)
        if p > 0:
            result_prices.append(p)

    over_budget_count = sum(1 for p in result_prices if budget and p > float(budget) * 1.05)
    all_over_budget   = bool(result_prices) and over_budget_count == len(result_prices)
    some_over_budget  = over_budget_count > 0 and not all_over_budget

    # --- Build matched-intent sentence (what DID match) ---
    matched_signals: List[str] = []
    if is_german and result_brands:
        if len(result_brands) == 1:
            matched_signals.append(f"German brand ({result_brands[0]})")
        else:
            matched_signals.append("German brand origin")
    elif result_brands and len(result_brands) == 1:
        matched_signals.append(f"{result_brands[0]} brand")
    if is_suv:
        matched_signals.append("SUV body type")
    if is_luxury:
        matched_signals.append("luxury/premium positioning")
    if transmissions:
        matched_signals.append(f"{format_list(transmissions)} transmission")
    if budget and not all_over_budget:
        matched_signals.append("budget proximity")

    matched_str = (
        f"These vehicles were selected because they match your {format_list(matched_signals)}"
        if matched_signals
        else "These vehicles are the closest available matches to your request"
    )

    # --- Build tradeoff sentence (what DIDN'T match or was relaxed) ---
    tradeoffs: List[str] = []
    # Track which semantic categories are already covered by relaxed_from
    relaxed_covers_powertrain = any("powertrain" in lbl for lbl in relaxed_from)
    relaxed_covers_luxury     = any(("premium" in lbl or "luxury" in lbl) for lbl in relaxed_from)
    relaxed_covers_panoramic  = any("panoramic" in lbl for lbl in relaxed_from)
    relaxed_covers_budget     = any("budget" in lbl for lbl in relaxed_from)

    if relaxed_from:
        for label in relaxed_from:
            if "powertrain" in label:
                fuel_label = format_list(fuel_types) if fuel_types else "requested"
                tradeoffs.append(f"{fuel_label} powertrain is currently unavailable in this category")
            elif "premium" in label or "luxury" in label:
                tradeoffs.append("exact luxury/premium specifications are currently unavailable")
            elif "budget" in label:
                tradeoffs.append("exact budget range could not be satisfied")
            elif "vehicle type" in label:
                tradeoffs.append("exact body type match is currently unavailable")
            elif "panoramic" in label:
                tradeoffs.append("panoramic roof is currently unavailable in this category")
            elif "third" in label or "3rd" in label or "seating" in label:
                tradeoffs.append("third-row seating is currently unavailable in matching vehicles")
            elif "family" in label:
                tradeoffs.append("not all matches are specifically family-oriented")
            else:
                # For any other relaxed constraint, use the label name but clean it up
                clean = label.replace(" preference", "").rstrip("s")
                tradeoffs.append(f"{clean} could not be fully matched")

    if all_over_budget and budget:
        tradeoffs.append(f"all options exceed your requested {int(float(budget)):,} DH budget")
    elif some_over_budget and budget:
        tradeoffs.append(f"some options exceed your requested {int(float(budget)):,} DH budget")

    # Only add unmatched-feature tradeoffs for features NOT already covered by relaxed_from
    original_features = constraints.get("_original_features") or features
    cars_list = [CarPayload(**(item.get("car") or {})) for item in results if item.get("car")]
    for feature in original_features:
        if feature == "panoramic roof" and relaxed_covers_panoramic:
            continue  # already covered above
        if feature == "luxury/premium" and relaxed_covers_luxury:
            continue  # already covered above
        if cars_list and not all(car_satisfies_requested_feature(c, feature) for c in cars_list):
            if feature == "panoramic roof":
                tradeoffs.append("panoramic roof is not confirmed for all options")
            elif feature == "luxury/premium":
                tradeoffs.append("full luxury specification is not guaranteed for all options")

    tradeoff_str = ""
    if tradeoffs:
        # Deduplicate preserving order
        seen: set = set()
        unique = [t for t in tradeoffs if not (t in seen or seen.add(t))]  # type: ignore
        # Cap at 3 tradeoffs to keep the sentence readable
        unique = unique[:3]
        tradeoff_str = ", although " + format_list(unique) + "."

    return matched_str + (tradeoff_str or ".")


def build_fallback_intro(query: str, constraints: Dict[str, Any], results: List[Dict[str, Any]]) -> str:
    """
    Builds the opening sentence for a fallback (relaxed) recommendation.
    Detects whether the body type was preserved and adjusts tone accordingly.
    """
    brand_groups  = requested_constraint_values(constraints, "brand_groups")
    categories    = requested_constraint_values(constraints, "categories")
    features      = requested_constraint_values(constraints, "features")
    fuel_types    = requested_constraint_values(constraints, "fuel_types")
    relaxed_from  = constraints.get("relaxed_from") or []
    budget        = constraints.get("budget") or constraints.get("_original_budget")
    is_german     = "german" in brand_groups
    is_suv        = "suv" in categories
    is_luxury     = "luxury/premium" in features

    # Detect if the body type (category) was preserved in results
    result_categories = set()
    for item in results:
        cat = safe_text((item.get("car") or {}).get("category")).lower()
        if cat:
            result_categories.add(cat)
    category_preserved = is_suv and bool(result_categories & {"suv", "crossover"})

    # Collect result brands for the intro
    result_brands: List[str] = []
    for item in results[:5]:
        b = safe_text((item.get("car") or {}).get("brand"))
        if b and b not in result_brands:
            result_brands.append(b)

    # Build what was originally requested
    asked_parts: List[str] = []
    if is_luxury:
        asked_parts.append("premium")
    if is_german:
        asked_parts.append("German")
    if fuel_types:
        asked_parts.append(format_list(fuel_types))
    if is_suv:
        asked_parts.append("SUV")
    elif categories:
        asked_parts.append(format_list(categories))
    if budget:
        asked_parts.append(f"under {int(float(budget)):,} DH")
    asked_str = " ".join(asked_parts) if asked_parts else query

    # If this is a luxury German SUV search, use the highly specific intro
    if is_german and is_suv and is_luxury:
        vehicle_label = result_brand_category_label(results, constraints)
        asked_display = asked_str if "s" in asked_str[-2:] else asked_str + "s"
        return (
            f"No exact {asked_display} are currently available. "
            f"However, {vehicle_label} are the closest luxury-oriented alternatives currently in inventory."
        )

    # If only soft features (family, panoramic, luxury) were relaxed but body type survived:
    only_feature_relaxed = (
        category_preserved
        and all(
            not any(kw in lbl for kw in ["powertrain", "budget", "vehicle type", "transmission"])
            for lbl in relaxed_from
        )
    )
    if only_feature_relaxed:
        vehicle_label = result_brand_category_label(results, constraints)
        return (
            f"No exact {asked_str} vehicles perfectly match all your preferences. "
            f"Based on your criteria, these are the closest {vehicle_label} currently available — "
            f"matching your body type and the most important requirements."
        )

    # Standard intro
    vehicle_kind = "options" if is_suv else "vehicles"
    return (
        f"No exact {asked_str} {vehicle_kind} are currently available. "
        f"Based on your preferences, these are the closest alternatives currently in the marketplace."
    )

def car_satisfies_requested_feature(car: CarPayload, feature: str) -> bool:
    brand = normalize_brand_name(car.brand)
    text = normalized_vehicle_text(car)
    profile = structured_car_profile(car)
    if feature == "panoramic roof":
        return text_mentions_any(text, ["panoramic", "sunroof", "moonroof"])
    if feature == "luxury/premium":
        return (
            text_mentions_any(text, ["leather", "luxury", "premium", "executive"])
            or brand in LUXURY_BRANDS
            or profile.get("luxury_score", 0) > 0.6
        )
    if feature == "third row seating":
        return text_mentions_any(text, ["third row", "3rd row", "7 seat", "7-seat"])
    if feature == "family-oriented":
        return (
            text_mentions_any(text, ["family", "kids", "spacious"])
            or profile.get("family_score", 0) > 0.6
        )
    return False

def relaxed_tradeoff_sentence(results: List[Dict[str, Any]], constraints: Dict[str, Any]) -> str:
    relaxed_from = constraints.get("relaxed_from") or []
    tradeoffs = []
    budget = constraints.get("_original_budget") or constraints.get("budget")
    if budget:
        priced_results = [
            float((item.get("car") or {}).get("price") or 0)
            for item in results
            if float((item.get("car") or {}).get("price") or 0) > 0
        ]
        over_budget_count = sum(1 for price in priced_results if price > float(budget))
        if priced_results and over_budget_count == len(priced_results):
            tradeoffs.append("these options exceed your requested budget")
        elif over_budget_count > 0 or "budget" in relaxed_from:
            tradeoffs.append("some options exceed your requested budget")

    original_features = constraints.get("_original_features") or constraints.get("features") or []
    unmatched_features = []
    for feature in original_features:
        cars = [CarPayload(**(item.get("car") or {})) for item in results if item.get("car")]
        if cars and not all(car_satisfies_requested_feature(car, feature) for car in cars):
            unmatched_features.append(feature)

    if "luxury/premium" in unmatched_features:
        tradeoffs.append("some options differ from the requested luxury or premium criteria")
    elif unmatched_features:
        tradeoffs.append("some preferred features are not fully matched")

    if any("vehicle type" in label for label in relaxed_from):
        tradeoffs.append("some options differ from the requested body type")

    if not tradeoffs:
        return "although they differ slightly from your preferred criteria."
    return "although " + format_list(tradeoffs) + "."

def requested_attribute_label(constraints: Dict[str, Any], query: str = "") -> str:
    parts = []
    if sporty_or_offroad_intent_requested(query):
        parts.append("sporty")
    if constraints.get("categories"):
        parts.extend(constraints["categories"])
    if constraints.get("transmissions"):
        parts.extend(constraints["transmissions"])
    if constraints.get("fuel_types"):
        parts.extend(constraints["fuel_types"])
    if constraints.get("efficiency_required"):
        parts.append("fuel-efficient")
    if not parts:
        return "your main requirements"
    return f"the {format_list(parts)} requirements"

def vehicle_orientation(car: CarPayload, profile: Dict[str, float]) -> str:
    category = safe_text(car.category).lower()
    text = f"{car.brand} {car.model} {car.category} {car.description}".lower()
    if utility_truck_detected(car):
        return "trucks"
    if profile.get("performance_trim_score", 0) > 0 or profile.get("performance_score", 0) > 0.62:
        return "performance-oriented vehicles"
    if profile.get("offroad_score", 0) > 0.65:
        return "off-road SUVs"
    if "suv" in category or "crossover" in category or text_mentions_any(text, ["land cruiser", "4runner", "rav4"]):
        return "SUVs"
    if profile.get("daily_consumer_score", 0) >= 0.62:
        return "daily-use vehicles"
    return "mixed vehicles"

def category_distribution(cars: List[CarPayload]) -> Dict[str, int]:
    distribution: Dict[str, int] = defaultdict(int)
    for car in cars:
        label = safe_text(car.category) or "Uncategorized"
        distribution[label] += 1
    return dict(sorted(distribution.items(), key=lambda item: item[1], reverse=True))

def inventory_coverage_for(
    query: str,
    cars: List[CarPayload],
    profiles: List[Dict[str, float]],
    constraints: Dict[str, Any],
    intent: Dict[str, float],
    performance_requested: bool,
) -> Dict[str, Any]:
    total = len(cars)
    orientations: Dict[str, int] = defaultdict(int)
    strong_daily_count = 0
    true_daily_economy_count = 0
    best_daily_score = 0.0
    requested_colors = constraints.get("colors") or []
    matched_colors = available_requested_colors(cars, requested_colors) if requested_colors else []
    exact_color_match_count = (
        sum(1 for car in cars if car_matches_requested_exterior_color(car, requested_colors))
        if requested_colors
        else 0
    )

    for car, profile in zip(cars, profiles):
        orientations[vehicle_orientation(car, profile)] += 1
        daily_score = profile.get("daily_consumer_score", 0.0)
        best_daily_score = max(best_daily_score, daily_score)
        is_true_daily = true_daily_economy_match(car, profile)
        if is_true_daily:
            true_daily_economy_count += 1
        if daily_score >= 0.62 and is_true_daily:
            strong_daily_count += 1

    dominant = [
        label
        for label, count in sorted(orientations.items(), key=lambda item: item[1], reverse=True)
        if label != "mixed vehicles" and count > 0
    ][:3]
    daily_requested = daily_consumer_intent_requested(query, intent, performance_requested)
    non_daily_count = total - true_daily_economy_count
    daily_coverage_ratio = (true_daily_economy_count / total) if total else 0.0
    limited_daily_inventory = bool(
        total
        and daily_requested
        and (
            true_daily_economy_count == 0
            or daily_coverage_ratio < 0.25
            or best_daily_score < 0.6
        )
        and non_daily_count >= max(1, math.ceil(total * 0.6))
    )
    intent_coverage_quality = "strong"
    if limited_daily_inventory:
        intent_coverage_quality = "weak"
    elif daily_requested and daily_coverage_ratio < 0.5:
        intent_coverage_quality = "partial"

    return {
        "scope": inventory_scope_label(constraints),
        "total": total,
        "category_distribution": category_distribution(cars),
        "orientation_distribution": dict(sorted(orientations.items(), key=lambda item: item[1], reverse=True)),
        "dominant_orientations": dominant,
        "daily_requested": daily_requested,
        "strong_daily_count": strong_daily_count,
        "true_daily_economy_count": true_daily_economy_count,
        "daily_coverage_ratio": round(daily_coverage_ratio, 4),
        "best_daily_consumer_score": round(best_daily_score, 4),
        "requested_colors": requested_colors,
        "available_requested_colors": matched_colors,
        "missing_requested_colors": [color for color in requested_colors if color not in matched_colors],
        "exact_color_match_count": exact_color_match_count,
        "exact_color_coverage_ratio": round((exact_color_match_count / total) if total else 0.0, 4),
        "limited_daily_inventory": limited_daily_inventory,
        "intent_coverage_quality": intent_coverage_quality,
        "weak_match_reason": (
            "Inventory does not currently contain true economy-focused daily sedans or hatchbacks."
            if limited_daily_inventory
            else ""
        ),
    }

def inventory_answer_for(
    query: str,
    results: List[Dict[str, Any]],
    constraints: Dict[str, Any],
    source_count: int,
    coverage: Optional[Dict[str, Any]] = None,
) -> str:
    relaxed_from: List[str] = constraints.get("relaxed_from") or []

    # ── Dead-end: zero results after all fallback tiers ──────────────────────
    if not results:
        label = no_inventory_label(constraints)
        if coverage and coverage.get("total") and coverage.get("dominant_orientations"):
            dominant = format_list(coverage.get("dominant_orientations") or ["other vehicle types"])
            return (
                f"No {label} are currently available matching your request. "
                f"The available inventory mainly consists of {dominant} at this time."
            )
        return f"No {label} matching your request are currently available in inventory."

    # ── Fallback path: results found after progressive constraint relaxation ──
    some_over_budget = False
    budget = constraints.get("budget") or constraints.get("_original_budget")
    if budget:
        prices = [float((item.get("car") or {}).get("price") or 0) for item in results]
        some_over_budget = any(p > float(budget) * 1.05 for p in prices if p > 0)

    if relaxed_from or some_over_budget:
        intro   = build_fallback_intro(query, constraints, results)
        detail  = build_advisor_explanation(query, results, constraints, relaxed_from, coverage)
        return f"{intro} {detail}"

    # ── Success path: results found without relaxation ────────────────────────
    # Color-miss branch: results exist but color not matched
    if coverage and coverage.get("requested_colors"):
        colors = format_list(coverage.get("requested_colors") or [])
        exact_count = int(coverage.get("exact_color_match_count") or 0)
        total = int(coverage.get("total") or 0)
        detail = build_advisor_explanation(query, results, constraints, [], coverage)
        vehicle_label = result_brand_category_label(results, constraints)
        if exact_count == 0:
            return (
                f"Based on your preferences, these are the closest {vehicle_label} currently available. "
                f"{detail} Note: exact {colors} color matches are currently unavailable among vehicles with the other requested attributes."
            )
        if exact_count < total:
            return (
                f"Based on your preferences, these are the closest {vehicle_label} currently available. "
                f"{detail} Note: exact {colors} color options are limited in the current inventory."
            )

    # Intent-aware success: any explicit constraint signals present
    brand_groups   = requested_constraint_values(constraints, "brand_groups")
    features       = requested_constraint_values(constraints, "features")
    categories     = requested_constraint_values(constraints, "categories")
    fuel_types     = requested_constraint_values(constraints, "fuel_types")
    budget         = constraints.get("budget") or constraints.get("_original_budget")
    has_intent_signals = any([
        brand_groups, features, categories, fuel_types,
        constraints.get("brands"), constraints.get("transmissions"), budget
    ])

    if has_intent_signals:
        detail = build_advisor_explanation(query, results, constraints, [], coverage)
        vehicle_label = result_brand_category_label(results, constraints)
        return f"Based on your preferences, these are the closest {vehicle_label} currently available. {detail}"

    # Generic fallback (fully semantic, no explicit constraints)
    vehicle_label = result_brand_category_label(results, constraints)
    return f"Based on your preferences, these are the closest {vehicle_label} currently available."

def requested_limit_from_query(query: str, default_limit: int) -> int:
    text = query.lower()
    if re.search(r"\b(?:one|1|single)\b", text) and is_cheapest_query(text):
        return min(default_limit, 1)
    return default_limit

def price_rank_component(car: CarPayload, prices: List[float]) -> float:
    price = float(car.price or 0)
    valid_prices = [value for value in prices if value > 0]
    if not valid_prices or price <= 0:
        return 0.0
    min_price = min(valid_prices)
    max_price = max(valid_prices)
    if max_price <= min_price:
        return 1.0
    return clamp01(1.0 - ((price - min_price) / (max_price - min_price)))

def automotive_profile_text(car: CarPayload) -> str:
    """Create rich text for embedding."""
    category = safe_text(car.category)
    fuel = safe_text(car.fuel_type)
    transmission = safe_text(car.transmission)
    price = int(car.price or 0)
    mileage = int(car.mileage or 0)

    ai_profile = structured_car_profile(car)
    dominant_tags = [
        f"{name.replace('_', ' ')} profile"
        for name, value in ai_profile.items()
        if name.endswith("_score") and value >= 0.62
    ]

    profile_sentences = [
        f"Vehicle: {car_title(car)}.",
        f"Category: {category}. Fuel type: {fuel}. Transmission: {transmission}. Color: {safe_text(car.color)}.",
        f"Year: {car.year or 'unknown'}. Price: {price} DH. Mileage: {mileage} kilometers.",
        safe_text(car.description),
        "AI ownership profile: " + ", ".join(dominant_tags) + ".",
        "Automotive interpretation:",
    ]

    lower = f"{car.brand} {car.model} {category} {fuel} {transmission} {car.description}".lower()
    if any(term in lower for term in ["suv", "x5", "q7", "gle", "range rover", "crossover", "tucson", "sportage", "cr-v"]):
        profile_sentences.append("spacious practical SUV for families, long trips, comfort, safety, luggage and road presence.")
    if any(term in lower for term in ["sedan", "saloon", "s class", "7 series", "a8", "panamera", "accord", "camry"]):
        profile_sentences.append("sedan with quiet comfort, business travel, refined ride quality and daily luxury.")
    if text_mentions_any(lower, PERFORMANCE_TRIM_TERMS + ["911", "mustang", "supra", "sport"]):
        profile_sentences.append("sport-oriented performance car with aggressive character, acceleration and dynamic handling.")
    if any(term in lower for term in ["hybrid", "electric", "diesel", "city car", "compact city"]) or text_mentions_any(lower, DAILY_CONSUMER_TERMS):
        profile_sentences.append("normal daily consumer vehicle for commuting, family use, reliability, comfort, fuel economy, and low running costs.")
    if price >= 650000:
        profile_sentences.append("premium high-end purchase with luxury positioning.")
    elif 0 < price <= 350000:
        profile_sentences.append("value-focused affordable purchase with practical budget appeal and cheap maintenance.")
    if 0 < mileage <= 45000:
        profile_sentences.append("low mileage and clean ownership appeal.")

    return safe_text(" ".join(profile_sentences))

def structured_car_profile(car: CarPayload) -> Dict[str, float]:
    text = normalized_vehicle_text(car)
    category = safe_text(car.category).lower()
    fuel = safe_text(car.fuel_type).lower()
    transmission = safe_text(car.transmission).lower()
    price = float(car.price or 0)
    brand = normalize_brand_name(car.brand)

    is_performance_trim = performance_trim_detected(car)
    is_performance_model = text_mentions_any(text, PERFORMANCE_MODELS)
    is_offroad_trim = offroad_trim_detected(car)
    is_sports = is_performance_trim or is_performance_model or contains_any(category, ["sport", "coupe", "convertible", "roadster"])
    is_economy_model = contains_any(text, ECONOMY_MODELS)
    is_luxury_brand = contains_any(text, LUXURY_BRANDS)
    is_exotic_performance_brand = brand in EXOTIC_PERFORMANCE_BRANDS
    is_offroad = is_offroad_trim or contains_any(text, OFFROAD_MODELS) or contains_any(category, ["off", "truck", "pickup"])
    is_suv = contains_any(category, ["suv", "crossover"])
    is_compact = contains_any(category, ["city", "compact", "hatchback"]) or contains_any(text, ["yaris", "fit", "polo", "fiesta", "golf", "rio"])
    is_hybrid_or_ev = contains_any(fuel, ["hybrid", "electric", "ev"]) or "hybrid" in text
    is_diesel = "diesel" in fuel
    practical_body = contains_any(category, DAILY_PREFERRED_CATEGORY_TERMS)
    automatic = "automatic" in transmission or "cvt" in transmission or "pdk" in transmission
    hybrid_type = hybrid_type_for_car(car)
    is_economy_hybrid = hybrid_type in {"economy_hybrid", "standard_hybrid"}
    is_luxury_hybrid = hybrid_type in {"luxury_hybrid", "luxury_performance_hybrid"}
    is_performance_hybrid = hybrid_type in {"performance_hybrid", "luxury_performance_hybrid"}
    is_daily_consumer = (
        is_economy_model
        or (is_hybrid_or_ev and is_economy_hybrid and not is_performance_model)
        or is_compact
        or (practical_body and not is_exotic_performance_brand and not is_sports)
    ) and not is_performance_trim and not commuter_negative_detected(car)

    affordability = 0.45
    if 0 < price <= 180000:
        affordability = 0.95
    elif price <= 350000:
        affordability = 0.85
    elif price <= 700000:
        affordability = 0.58
    elif price > 700000:
        affordability = 0.22

    fuel_eff = 0.3
    fuel_eff += 0.4 if is_economy_model else 0
    fuel_eff += 0.32 if is_economy_hybrid else 0
    fuel_eff += 0.18 if is_hybrid_or_ev and not is_economy_hybrid else 0
    fuel_eff += 0.2 if is_compact else 0
    fuel_eff -= 0.5 if is_sports or (price > 600000 and not is_hybrid_or_ev) else 0
    fuel_eff -= 0.22 if is_luxury_hybrid else 0
    fuel_eff -= 0.28 if is_performance_hybrid else 0

    reliability = reliability_brand_score(car)

    economy = 0.25
    economy += 0.34 if is_economy_model else 0
    economy += 0.30 if is_economy_hybrid else 0
    economy += 0.10 if is_hybrid_or_ev and not is_economy_hybrid else 0
    economy += 0.16 if is_diesel else 0
    economy += 0.18 if is_compact else 0
    economy += 0.12 if affordability >= 0.8 else 0
    economy -= 0.42 if is_sports else 0
    economy -= 0.16 if is_luxury_brand and price > 500000 else 0
    economy -= 0.28 if is_luxury_hybrid or is_performance_hybrid else 0

    performance = 0.2
    performance += 0.58 if is_sports else 0
    performance += 0.14 if is_luxury_brand and text_mentions_any(text, ["amg", "m competition", "m power", "rs", "turbo", "gts"]) else 0
    performance -= 0.18 if is_economy_model or is_compact else 0

    luxury = 0.18
    luxury += 0.36 if is_luxury_brand else 0
    luxury += 0.2 if price >= 650000 else 0
    luxury += 0.08 if contains_any(text, ["leather", "executive", "premium", "panamera", "s class"]) else 0

    family = 0.22
    family += 0.38 if is_suv else 0
    family += 0.14 if contains_any(category, ["sedan", "wagon", "minivan"]) else 0
    family += 0.1 if contains_any(text, ["safe", "spacious", "comfort", "long distance"]) else 0
    family -= 0.22 if contains_any(category, ["coupe", "roadster", "convertible"]) else 0

    city = 0.25
    city += 0.38 if is_compact else 0
    city += 0.24 if is_economy_model else 0
    city += 0.16 if is_hybrid_or_ev else 0
    city -= 0.22 if is_suv and not is_economy_model else 0
    city -= 0.28 if is_sports else 0

    comfort = 0.32
    comfort += 0.22 if is_luxury_brand else 0
    comfort += 0.16 if is_suv or contains_any(category, ["sedan", "wagon"]) else 0
    comfort += 0.08 if automatic else 0
    comfort -= 0.1 if contains_any(category, ["coupe", "roadster"]) else 0

    offroad = 0.12 + (0.68 if is_offroad else 0) + (0.12 if is_suv else 0)

    mileage_score = mileage_practicality_score(car)
    maintenance_cost = (
        0.28 * affordability
        + 0.24 * reliability
        + 0.22 * fuel_eff
        + 0.14 * mileage_score
        + 0.12 * (1.0 if is_economy_model else 0.55)
    )
    maintenance_cost -= 0.22 if is_sports else 0
    maintenance_cost -= 0.2 if is_luxury_brand and price > 500000 else 0
    maintenance_cost -= 0.24 if is_exotic_performance_brand else 0
    maintenance_cost -= 0.18 if is_luxury_hybrid or is_performance_hybrid else 0

    daily_usability = (
        0.22 * (1.0 if practical_body else 0.45)
        + 0.18 * (1.0 if automatic else 0.45)
        + 0.18 * comfort
        + 0.16 * mileage_score
        + 0.14 * affordability
        + 0.12 * fuel_eff
    )
    daily_usability -= 0.28 if is_sports else 0
    daily_usability -= 0.18 if is_offroad else 0
    daily_usability -= 0.24 if is_exotic_performance_brand else 0
    daily_usability -= 0.18 if is_luxury_hybrid or is_performance_hybrid else 0

    ownership_cost = (economy * 0.35) + (reliability * 0.25) + (affordability * 0.22) + (maintenance_cost * 0.18)
    practicality = (
        0.24 * fuel_eff
        + 0.22 * reliability
        + 0.20 * maintenance_cost
        + 0.18 * affordability
        + 0.16 * comfort
    )
    practicality += 0.08 if practical_body and automatic else 0
    practicality += 0.06 if is_economy_hybrid else 0
    practicality -= 0.28 if is_luxury_hybrid else 0
    practicality -= 0.30 if is_performance_hybrid else 0
    practicality -= 0.20 if is_exotic_performance_brand else 0

    commuter_suitability = (
        0.24 * reliability
        + 0.22 * fuel_eff
        + 0.20 * maintenance_cost
        + 0.18 * daily_usability
        + 0.10 * mileage_score
        + 0.06 * affordability
    )
    commuter_suitability += 0.08 if brand in DAILY_RELIABILITY_BRANDS and practical_body else 0
    commuter_suitability -= 0.3 if is_sports or is_performance_trim or is_performance_model else 0
    commuter_suitability -= 0.24 if is_exotic_performance_brand else 0
    commuter_suitability -= 0.16 if is_offroad else 0
    commuter_suitability -= 0.22 if is_luxury_hybrid or is_performance_hybrid else 0

    daily_consumer = 0.28
    daily_consumer += 0.34 if is_daily_consumer else 0
    daily_consumer += 0.18 if is_economy_model else 0
    daily_consumer += 0.12 if automatic else 0
    daily_consumer += 0.08 if reliability >= 0.8 else 0
    daily_consumer += 0.06 if family >= 0.45 or comfort >= 0.5 else 0
    daily_consumer -= 0.42 if is_performance_trim else 0
    daily_consumer -= 0.2 if is_sports else 0
    daily_consumer -= 0.14 if is_offroad else 0
    daily_consumer -= 0.16 if is_offroad_trim else 0
    daily_consumer -= 0.2 if is_exotic_performance_brand else 0
    daily_consumer -= 0.16 if commuter_negative_detected(car) else 0
    daily_consumer -= 0.2 if is_luxury_hybrid or is_performance_hybrid else 0

    return {
        "economy_score": clamp01(economy),
        "luxury_score": clamp01(luxury),
        "performance_score": clamp01(performance),
        "sporty_score": clamp01(performance + (0.12 if contains_any(category, ["coupe", "convertible", "roadster"]) else 0)),
        "family_score": clamp01(family),
        "city_score": clamp01(city),
        "comfort_score": clamp01(comfort),
        "offroad_score": clamp01(offroad),
        "affordability_score": clamp01(affordability),
        "reliability_score": clamp01(reliability),
        "fuel_efficiency_score": clamp01(fuel_eff),
        "maintenance_cost_score": clamp01(maintenance_cost),
        "mileage_practicality_score": clamp01(mileage_score),
        "daily_usability_score": clamp01(daily_usability),
        "practicality_score": clamp01(practicality),
        "economy_hybrid_score": 1.0 if hybrid_type == "economy_hybrid" else (0.7 if hybrid_type == "standard_hybrid" else 0.0),
        "luxury_hybrid_score": 1.0 if hybrid_type in {"luxury_hybrid", "luxury_performance_hybrid"} else 0.0,
        "performance_hybrid_score": 1.0 if hybrid_type in {"performance_hybrid", "luxury_performance_hybrid"} else 0.0,
        "commuter_suitability_score": clamp01(commuter_suitability),
        "ownership_cost_score": clamp01(ownership_cost),
        "daily_consumer_score": clamp01(daily_consumer),
        "performance_trim_score": 1.0 if is_performance_trim else 0.0,
        "offroad_trim_score": 1.0 if is_offroad_trim else 0.0,
    }

def catalog_fingerprint(cars: List[CarPayload]) -> str:
    payload = {
        "ranking_cache_version": RANKING_CACHE_VERSION,
        "cars": [
            {
            "id": car.id,
            "brand": car.brand,
            "model": car.model,
            "price": car.price,
            "category": car.category,
            }
            for car in cars
        ],
    }
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def aspect_vectors() -> Dict[str, np.ndarray]:
    cache_key = "aspect_vectors"
    if cache_key not in CATALOG_CACHE:
        names = list(ASPECT_PROMPTS.keys())
        vectors = embed_texts([ASPECT_PROMPTS[name] for name in names])
        CATALOG_CACHE[cache_key] = dict(zip(names, vectors))
    return CATALOG_CACHE[cache_key]

def intent_vectors() -> Dict[str, np.ndarray]:
    cache_key = "intent_vectors"
    if cache_key not in CATALOG_CACHE:
        names = list(INTENT_PROMPTS.keys())
        vectors = embed_texts([INTENT_PROMPTS[name] for name in names])
        CATALOG_CACHE[cache_key] = dict(zip(names, vectors))
    return CATALOG_CACHE[cache_key]

def extract_intent(query: str, query_vector: np.ndarray) -> Dict[str, float]:
    similarities = {name: cosine(query_vector, vector) for name, vector in intent_vectors().items()}
    values = np.asarray(list(similarities.values()), dtype=np.float32)
    weights = np.exp((values - values.max()) * 6.0)
    weights = weights / max(float(weights.sum()), 1e-6)
    intent = {name: float(weight) for name, weight in zip(similarities.keys(), weights)}

    text = query.lower()
    performance_requested = sporty_or_offroad_intent_requested(query)
    signal_boosts = {
        "commuter": ["daily", "daily driver", "daily commuter", "commute", "commuter", "reliable", "practical", "low maintenance"],
        "economy": ["cheap", "fuel efficient", "efficient", "economy", "economical", "low running", "affordable", "budget", "low cost"],
        "budget": ["cheap", "affordable", "budget", "low price", "low cost", "value"],
        "city_driving": ["city", "commute", "commuting", "urban", "parking", "daily driver", "citadine"],
        "performance": ["fast", "performance", "track", "turbo", "amg", "rs", "m power", "sport", "sportive"],
        "sporty": ["sporty", "aggressive", "coupe", "roadster", "fun"],
        "sports": ["sports car", "sport car", "coupe", "roadster", "spyder"],
        "family": ["family", "kids", "spacious", "safe", "suv", "long trips", "luggage", "famille", "familiale"],
        "luxury": ["luxury", "premium", "executive", "high end", "prestige", "luxe", "luxueuse"],
        "comfort": ["comfortable", "comfort", "smooth", "quiet", "daily", "long trips", "confortable"],
        "offroad": ["offroad", "off-road", "adventure", "rugged", "4x4", "land cruiser"],
        "electric": ["electric", "ev", "hybrid", "battery", "électrique", "hybride"],
    }
    for name, terms in signal_boosts.items():
        hits = sum(1 for term in terms if query_mentions_term(text, term))
        if hits:
            intent[name] = clamp01(intent.get(name, 0) + min(0.60, hits * 0.25))

    if not performance_requested:
        daily_or_economy_requested = explicit_daily_or_economy_query_requested(query)
        if daily_or_economy_requested:
            intent["commuter"] = max(intent.get("commuter", 0), 0.72)
            intent["economy"] = max(intent.get("economy", 0), 0.5)
            intent["city_driving"] = max(intent.get("city_driving", 0), 0.48)
        intent["comfort"] = max(intent.get("comfort", 0), 0.44)
        intent["family"] = max(intent.get("family", 0), 0.36)
        intent["performance"] = min(intent.get("performance", 0), 0.16)
        intent["sporty"] = min(intent.get("sporty", 0), 0.16)
        intent["sports"] = min(intent.get("sports", 0), 0.16)
        intent["offroad"] = min(intent.get("offroad", 0), 0.2)

    if intent.get("economy", 0) > 0.55 or intent.get("city_driving", 0) > 0.55:
        intent["performance"] = min(intent.get("performance", 0), 0.18)
        intent["sporty"] = min(intent.get("sporty", 0), 0.22)
        intent["sports"] = min(intent.get("sports", 0), 0.22)
        intent["luxury"] = min(intent.get("luxury", 0), 0.28)

    return {key: round(clamp01(value), 4) for key, value in intent.items()}

def build_catalog(cars: List[CarPayload]) -> Dict[str, Any]:
    fingerprint = catalog_fingerprint(cars)
    if fingerprint in CATALOG_CACHE:
        return CATALOG_CACHE[fingerprint]

    docs = [automotive_profile_text(car) for car in cars]
    text_vectors = embed_texts(docs)
    aspect_map = aspect_vectors()
    aspect_scores = []
    structured_profiles = []
    
    # FAISS Index
    dimension = text_vectors.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(text_vectors)
    
    for vector in text_vectors:
        aspect_scores.append({name: cosine(vector, aspect_vector) for name, aspect_vector in aspect_map.items()})
    for car in cars:
        structured_profiles.append(structured_car_profile(car))

    catalog = {
        "fingerprint": fingerprint,
        "cars": cars,
        "docs": docs,
        "text_vectors": text_vectors,
        "faiss_index": index,
        "aspect_scores": aspect_scores,
        "structured_profiles": structured_profiles,
    }
    CATALOG_CACHE[fingerprint] = catalog
    return catalog

def score_to_percentage(score: float) -> int:
    # Target: excellent (88-95), good (75-87), partial (60-74)
    # Using a mild non-linear curve to prevent bunching at the top
    scaled = 55 + (clamp01(score) ** 1.2) * 40
    return max(45, min(95, int(round(scaled))))

def localize_penalty_reason(reason: str, lang: str) -> str:
    if lang == "en":
        return reason[:1].upper() + reason[1:]
    text = safe_text(reason).lower()
    if lang == "ar":
        if "budget exceeded" in text:
            return "يتجاوز الميزانية المطلوبة"
        if "color" in text:
            return "اللون الخارجي المطلوب غير متوفر لهذا الخيار"
        if "weak match" in text or "partial match" in text:
            return "مطابقة جزئية للطلب الأساسي"
        if "fuel-efficiency" in text or "fuel efficiency" in text:
            return "ملاءمة محدودة لكفاءة استهلاك الوقود"
        if "maintenance" in text or "ownership" in text:
            return "تكلفة الاستخدام أو الصيانة قد تكون أعلى"
        if "performance" in text:
            return "طابع الأداء الرياضي أقل توافقا مع الطلب"
        if "off-road" in text:
            return "الطابع المخصص للطرق الوعرة أقل توافقا مع الطلب"
        if "brand" in text:
            return "لا يطابق العلامة المطلوبة بالكامل"
        return "مطابقة جزئية لبعض المعايير"

    if "budget exceeded" in text:
        return "Depasse le budget demande"
    if "color" in text:
        return "La couleur exterieure demandee n'est pas disponible sur cette option"
    if "weak match" in text or "partial match" in text:
        return "Correspondance partielle avec la demande principale"
    if "fuel-efficiency" in text or "fuel efficiency" in text:
        return "Profil d'economie de carburant limite"
    if "maintenance" in text or "ownership" in text:
        return "Cout d'usage ou d'entretien potentiellement plus eleve"
    if "performance" in text:
        return "Orientation performance moins alignee avec la demande"
    if "off-road" in text:
        return "Orientation tout-terrain moins alignee avec la demande"
    if "brand" in text:
        return "Ne correspond pas totalement a la marque demandee"
    return "Correspondance partielle avec certains criteres"

def confidence_tier_label(percent: int, budget_ok: bool, intent: Dict[str, float], lang: str = "en") -> str:
    if lang == "ar":
        if percent >= 85 and budget_ok:
            return "مطابقة قوية"
        if percent >= 75 and intent.get("luxury", 0) > 0.4:
            return "بديل فاخر قريب"
        if not budget_ok:
            return "خيار فوق الميزانية"
        if percent >= 70:
            return "بديل ممتاز"
        return "تنازل في بعض الميزات"
    if lang == "fr":
        if percent >= 85 and budget_ok:
            return "Forte compatibilite"
        if percent >= 75 and intent.get("luxury", 0) > 0.4:
            return "Alternative premium proche"
        if not budget_ok:
            return "Option au-dessus du budget"
        if percent >= 70:
            return "Alternative pertinente"
        return "Compromis sur les criteres"
    if percent >= 85 and budget_ok:
        return "Strong Match"
    if percent >= 75 and intent.get("luxury", 0) > 0.4:
        return "Close Luxury Alternative"
    if not budget_ok:
        return "Budget Stretch Option"
    if percent >= 70:
        return "Premium Alternative"
    return "Feature Tradeoff"

def build_item_reasons(car: CarPayload, constraints: Dict[str, Any], profile: Dict[str, float], budget_ok: bool, penalties: List[str], lang: str = "en") -> List[str]:
    reasons = []
    brand_groups = requested_constraint_values(constraints, "brand_groups")
    categories = requested_constraint_values(constraints, "categories")
    features = requested_constraint_values(constraints, "features")
    budget = constraints.get("budget") or constraints.get("_original_budget")
    
    brand = normalize_brand_name(car.brand)
    if "german" in brand_groups and brand in GERMAN_BRANDS:
        reasons.append({"fr": "Marque allemande demandee", "ar": "تطابق مع علامة ألمانية مطلوبة"}.get(lang, "German brand match"))
    elif constraints.get("brands") and brand in [normalize_brand_name(b) for b in constraints.get("brands", [])]:
        if lang == "ar":
            reasons.append(f"تطابق مع علامة {car.brand}")
        elif lang == "fr":
            reasons.append(f"Correspond a la marque {car.brand}")
        else:
            reasons.append(f"{car.brand} brand match")
        
    category = safe_text(car.category).lower()
    is_suv = False
    if categories and any(c in category for c in categories):
        is_suv = "suv" in categories
        cat_str = "SUV" if is_suv else categories[0].capitalize()
        if lang == "ar":
            reasons.append(f"تطابق مع نوع الهيكل {cat_str}")
        elif lang == "fr":
            reasons.append(f"Correspond au type {cat_str}")
        else:
            reasons.append(f"{cat_str} body type match")
        
    if "luxury/premium" in features:
        is_luxury = brand in LUXURY_BRANDS or profile.get("luxury_score", 0) > 0.45
        if is_luxury:
            reasons.append({"fr": "Positionnement premium", "ar": "طابع فاخر"}.get(lang, "Luxury positioning"))
        elif is_suv and profile.get("family_score", 0) > 0.45:
            reasons.append({"fr": "Alternative SUV adaptee a la famille", "ar": "بديل SUV مناسب للعائلة"}.get(lang, "Family-friendly SUV alternative"))
        elif is_suv:
            reasons.append({"fr": "SUV pratique proche de la categorie demandee", "ar": "سيارة SUV عملية قريبة من الفئة المطلوبة"}.get(lang, "Practical SUV close to your requested category"))
        else:
            reasons.append({"fr": "Alternative pratique a l'option premium demandee", "ar": "بديل عملي للخيار الفاخر المطلوب"}.get(lang, "Practical alternative to requested luxury option"))
        
    if budget:
        if budget_ok:
            reasons.append({"fr": "Proche du budget demande", "ar": "قريبة من الميزانية المطلوبة"}.get(lang, "Close to requested budget"))
        else:
            reasons.append({"fr": "Depasse legerement le budget", "ar": "تتجاوز الميزانية قليلا"}.get(lang, "Slightly exceeds budget"))
            
    for penalty in penalties:
        reasons.append(localize_penalty_reason(penalty, lang))
        
    if not reasons:
        reasons.append({
            "fr": "Correspond a vos criteres selon les caracteristiques disponibles dans l'inventaire",
            "ar": "يطابق معايير بحثك بناء على مواصفات المخزون الحالي",
        }.get(lang, "Matches your search criteria based on current inventory specifications"))
        
    return reasons

def budget_adjustment(car: CarPayload, budget: Optional[float]) -> float:
    if not budget or not car.price:
        return 0.0
    if car.price <= budget:
        return 0.025
    overage = (car.price - budget) / max(budget, 1)
    return -min(0.18, overage * 0.22)

def car_dict(car: CarPayload) -> Dict[str, Any]:
    data = dump_model(car)
    data["image_url"] = car.image_url or car.main_image
    return data

def semantic_traits_for(vector: np.ndarray) -> Dict[str, float]:
    return {name: cosine(vector, aspect_vector) for name, aspect_vector in aspect_vectors().items()}

def dynamic_explanation(
    query: str,
    intent: Dict[str, float],
    profile: Dict[str, float],
    budget_ok: bool,
    penalties: List[str],
    car: Optional[CarPayload] = None,
    lang: str = "en",
) -> str:
    if lang == "ar":
        if any(reason.startswith("budget exceeded") for reason in penalties):
            return "يتجاوز هذا الخيار الميزانية المطلوبة، لذلك تم اعتباره بديلا احتياطيا."
        if "weak match for primary semantic intent" in penalties or "partial match for primary semantic intent" in penalties:
            return "يطابق الطلب الأساسي جزئيا، لذلك يظهر كبديل مناسب من المخزون الحالي."
        if penalties:
            return f"هذا الخيار قريب من طلبك، مع ملاحظة: {localize_penalty_reason(penalties[0], lang)}."
        return "يطابق معايير بحثك بناء على مواصفات المركبات المتاحة حاليا."
    if lang == "fr":
        if any(reason.startswith("budget exceeded") for reason in penalties):
            return "Cette option depasse le budget demande ; elle est donc traitee comme une alternative."
        if "weak match for primary semantic intent" in penalties or "partial match for primary semantic intent" in penalties:
            return "Cette option correspond partiellement a la demande principale et reste une alternative pertinente dans l'inventaire actuel."
        if penalties:
            return f"Cette option est proche de votre demande, avec une reserve : {localize_penalty_reason(penalties[0], lang)}."
        return "Correspond a vos criteres selon les caracteristiques des vehicules actuellement disponibles."

    text = query.lower()
    phrases = []

    color_penalty = next(
        (
            reason
            for reason in penalties
            if reason.startswith("requested exterior color not matched")
            or reason == "requested color not available on this model"
        ),
        "",
    )
    if color_penalty:
        requested = color_penalty.split(":", 1)[1].strip() if ":" in color_penalty else "requested"
        phrases.append(f"Exact {requested} exterior color could not be fully matched for this vehicle.")
    elif any(reason.startswith("budget exceeded") for reason in penalties):
        phrases.append("Exceeds the requested budget, so it is treated as a fallback option.")
    elif "weak match for primary semantic intent" in penalties or "partial match for primary semantic intent" in penalties:
        phrases.append("Only partially matches the primary request, so it is ranked as a fallback alternative.")
    elif penalties:
        note = penalties[0][:1].upper() + penalties[0][1:]
        return f"This option is a close alternative, though worth noting: {note}."

    if car is not None and "german" in text and normalize_brand_name(car.brand) in GERMAN_BRANDS:
        category = safe_text(car.category).lower()
        if "suv" in text and ("suv" in category or "crossover" in category):
            phrases.append("German SUV positioning matches your preferred brand origin and body type.")
        else:
            phrases.append("German brand origin matches your preference.")
        
    if ("comfort" in text or "smooth" in text or "quiet" in text) and profile.get("comfort_score", 0) > 0.5:
        phrases.append("Refined ride quality matches your comfort request.")
    
    if ("luxury" in text or "premium" in text or "luxe" in text) and profile.get("luxury_score", 0) > 0.5:
        phrases.append("Premium features match your request for luxury styling.")
        
    if ("family" in text or "kids" in text or "spacious" in text) and profile.get("family_score", 0) > 0.5:
        phrases.append("Spacious layout matches your request for a family vehicle.")
        
    if ("sport" in text or "fast" in text or "performance" in text) and profile.get("performance_score", 0) > 0.5:
        phrases.append("Matches performance intent with dynamic specifications.")
        
    if ("city" in text or "urban" in text or "parking" in text) and profile.get("city_score", 0) > 0.5:
        phrases.append("Compact dimensions make this a strong match for urban driving.")
        
    if ("economy" in text or "cheap" in text or "efficient" in text) and profile.get("fuel_efficiency_score", 0) > 0.5:
        phrases.append("Fuel-efficient option fitting your economical search criteria.")
        
    if ("commute" in text or "daily" in text) and profile.get("commuter_suitability_score", 0) > 0.5:
        phrases.append("Matches your commuter needs with strong daily usability.")
        
    if ("reliable" in text or "reliability" in text) and profile.get("reliability_score", 0) > 0.7:
        phrases.append("Highly rated for long-term reliability.")
        
    if ("electric" in text or "hybrid" in text or "ev" in text) and profile.get("fuel_efficiency_score", 0) > 0.5:
        phrases.append("Electrified powertrain meets your efficiency requirements.")

    if not phrases:
        ranked_intents = sorted(intent, key=lambda key: intent[key], reverse=True)
        primary_intent = ranked_intents[0] if intent.get(ranked_intents[0], 0) > 0.45 else None
        
        if primary_intent == "family" and profile.get("family_score", 0) > 0.6:
            phrases.append("Spacious layout fits family usage.")
        elif primary_intent == "luxury" and profile.get("luxury_score", 0) > 0.6:
            phrases.append("Premium features and styling.")
        elif primary_intent == "performance" and profile.get("performance_score", 0) > 0.6:
            phrases.append("Strong performance specifications.")
        elif primary_intent in ["sporty", "sports"] and profile.get("sporty_score", 0) > 0.6:
            phrases.append("Sporty styling and dynamic drive.")
            
    if budget_ok and "budget" in text:
        phrases.append("Priced within your requested budget limit.")

    if not phrases:
        return "Matches your search criteria based on current inventory specifications."
        
    return " ".join(phrases[:2])


def result_dedupe_key(item: Dict[str, Any]) -> str:
    car = item.get("car") or {}
    brand = normalize_brand_name(car.get("brand"))
    model = re.sub(r"[^a-z0-9]+", " ", safe_text(car.get("model")).lower()).strip()
    return f"{brand} {model}".strip()

def dedupe_ranked_results(results: List[Dict[str, Any]], query: str = "") -> List[Dict[str, Any]]:
    seen_counts = {}
    unique = []
    text = query.lower()
    for item in results:
        key = result_dedupe_key(item)
        if key:
            limit = 2
            if text and (key.split()[0] in text or key in text):
                limit = 5
            seen_counts[key] = seen_counts.get(key, 0) + 1
            if seen_counts[key] > limit:
                continue
        unique.append(item)
    return unique


def hard_negative_penalty(
    car: CarPayload,
    query: str,
    intent: Dict[str, float],
    profile: Dict[str, float],
    budget: Optional[float],
    constraints: Dict[str, Any],
    performance_requested: bool = False,
) -> Tuple[float, List[str]]:
    penalty = 0.0
    reasons = []
    economy_mode = intent.get("economy", 0) > 0.55 or intent.get("city_driving", 0) > 0.55
    commuter_mode = intent.get("commuter", 0) > 0.45 or economy_mode
    practical_mode = practical_ownership_intent_requested(query, intent) or commuter_mode
    if economy_mode and profile["performance_score"] > 0.58:
        penalty += 0.3
        reasons.append("penalized performance-oriented profile for economy intent")
    if economy_mode and profile["fuel_efficiency_score"] < 0.45:
        penalty += 0.25
        reasons.append("weak fuel-efficiency profile")
    if commuter_mode:
        if commuter_negative_detected(car):
            penalty += 0.38
            reasons.append("deboosted performance keyword for commuter intent")
        if profile.get("commuter_suitability_score", 0) < 0.5:
            penalty += 0.26
            reasons.append("weak practical commuter suitability")
        if profile.get("maintenance_cost_score", 0) < 0.45:
            penalty += 0.2
            reasons.append("higher expected ownership or maintenance cost")
        if normalize_brand_name(car.brand) in EXOTIC_PERFORMANCE_BRANDS:
            penalty += 0.36
            reasons.append("exotic performance brand is a poor commuter fit")
        if car.price and car.price > 650000 and not constraints.get("brands"):
            penalty += 0.14
            reasons.append("premium price is less suitable for practical commuting")
    if practical_mode:
        hybrid_type = hybrid_type_for_car(car, profile)
        if hybrid_type in {"luxury_hybrid", "performance_hybrid", "luxury_performance_hybrid"}:
            penalty += 0.42
            reasons.append("luxury/performance hybrid is not an economy hybrid")
        if profile.get("practicality_score", 0) < 0.5:
            penalty += 0.24
            reasons.append("weak real-world practicality for fuel-efficient ownership")
        if practical_brand_priority_score(car) < 0.35:
            penalty += 0.18
            reasons.append("brand is lower priority for practical commuter intent")
    if budget and car.price:
        overage = (car.price - budget) / max(budget, 1)
        if overage > 0.15:
            penalty += 0.6
            reasons.append(f"budget exceeded by {int(overage*100)}%")
        elif overage > 0.05:
            penalty += 0.3
            reasons.append(f"budget exceeded by {int(overage*100)}%")
    normalized_brands = [normalize_brand_name(item) for item in (constraints.get("brands") or [])]
    if normalized_brands and normalize_brand_name(car.brand) not in normalized_brands:
        penalty += 0.55
        reasons.append("does not match requested brand")
    if intent.get("family", 0) > 0.55 and profile["family_score"] < 0.35:
        penalty += 0.16
        reasons.append("weak family practicality")
    if not performance_requested:
        if profile.get("performance_trim_score", 0) > 0:
            penalty += 0.34
            reasons.append("sporty performance focus is slightly less aligned with your original request")
        elif profile.get("performance_score", 0) > 0.62:
            penalty += 0.22
            reasons.append("more performance-oriented than requested")
        if profile.get("offroad_trim_score", 0) > 0:
            penalty += 0.18
            reasons.append("off-road focus is less aligned with your original request")
        elif profile.get("offroad_score", 0) > 0.65:
            penalty += 0.14
            reasons.append("more off-road-oriented than requested")
            
    requested_colors = constraints.get("colors") or []
    if requested_colors:
        colors_label = format_list(requested_colors)
        color_matched = car_matches_requested_exterior_color(car, requested_colors)
        color_available = bool(constraints.get("available_requested_colors"))
        if not color_matched:
            penalty += 0.38 if color_available else 0.30
            reasons.append(f"requested exterior color not matched: {colors_label}")
        else:
            penalty -= 0.18
            
    return min(0.92, penalty), reasons

def visual_attribute_score_cap(car: CarPayload, constraints: Dict[str, Any]) -> Optional[float]:
    requested_colors = constraints.get("colors") or []
    if not requested_colors or car_matches_requested_exterior_color(car, requested_colors):
        return None
    if constraints.get("available_requested_colors"):
        return 0.36
    return 0.32

def requested_constraint_values(constraints: Dict[str, Any], key: str) -> List[Any]:
    values = list(constraints.get(key) or [])
    original = constraints.get(f"_original_{key}") or []
    for item in original:
        if item not in values:
            values.append(item)
    return values

def requested_budget_value(constraints: Dict[str, Any], fallback: Optional[float]) -> Optional[float]:
    return constraints.get("budget") or constraints.get("_original_budget") or fallback

def brand_group_match_score(car: CarPayload, constraints: Dict[str, Any]) -> float:
    groups = requested_constraint_values(constraints, "brand_groups")
    if not groups:
        return 0.65
    brand = normalize_brand_name(car.brand)
    score = 0.0
    if "german" in groups:
        score = max(score, 1.0 if brand in GERMAN_BRANDS else 0.0)
    return clamp01(score)

def explicit_category_fit(car: CarPayload, constraints: Dict[str, Any]) -> float:
    requested_categories = requested_constraint_values(constraints, "categories")
    if not requested_categories:
        return 0.65

    category = safe_text(car.category).lower()
    text = normalized_vehicle_text(car)
    best = 0.0
    for requested in requested_categories:
        if requested == "suv":
            if "suv" in category or "crossover" in category:
                best = max(best, 1.0)
            elif text_mentions_any(text, ["land cruiser", "4runner", "range rover", "cayenne", "macan", "bronco"]):
                best = max(best, 0.78)
        elif requested == "truck":
            best = max(best, 1.0 if ("truck" in category or "pickup" in text) else 0.0)
        elif requested == "sports":
            best = max(best, 1.0 if ("sports" in category or structured_car_profile(car).get("performance_score", 0) >= 0.58) else 0.0)
        elif requested in category:
            best = max(best, 1.0)
    return clamp01(best)

def semantic_core_fit_score(
    car: CarPayload,
    query: str,
    intent: Dict[str, float],
    profile: Dict[str, float],
    constraints: Dict[str, Any],
    budget: Optional[float],
    budget_component: float,
) -> float:
    text = query.lower()
    weighted_sum = 0.0
    total_weight = 0.0

    def add(weight: float, value: float) -> None:
        nonlocal weighted_sum, total_weight
        if weight <= 0:
            return
        weighted_sum += weight * clamp01(value)
        total_weight += weight

    if requested_constraint_values(constraints, "categories"):
        add(0.30, explicit_category_fit(car, constraints))

    if requested_constraint_values(constraints, "brand_groups"):
        add(0.24, brand_group_match_score(car, constraints))

    family_requested = (
        intent.get("family", 0.0) >= 0.42
        or "family-oriented" in requested_constraint_values(constraints, "features")
        or text_mentions_any(text, ["family", "kids", "spacious", "7 seat", "7-seat", "third row"])
    )
    if family_requested:
        add(0.25, profile.get("family_score", 0.0))

    luxury_requested = (
        intent.get("luxury", 0.0) >= 0.42
        or "luxury/premium" in requested_constraint_values(constraints, "features")
        or text_mentions_any(text, ["luxury", "premium", "executive", "high end", "prestige", "leather"])
    )
    if luxury_requested:
        add(0.30, profile.get("luxury_score", 0.0))

    requested_budget = requested_budget_value(constraints, budget)
    if requested_budget:
        add(0.20, budget_component)

    if total_weight <= 0:
        return intent_match_score(intent, profile)
    return clamp01(weighted_sum / total_weight)

def semantic_confidence_score_cap(core_fit: float) -> Optional[float]:
    if core_fit < 0.50:
        return 0.28
    if core_fit < 0.62:
        return 0.36
    if core_fit < 0.72:
        return 0.42
    if core_fit < 0.82:
        return 0.58
    if core_fit < 0.88:
        return 0.74
    return None

def rank_with_query_vector(
    query: str,
    query_vector: np.ndarray,
    cars: List[CarPayload],
    limit: int,
    preference_vector: Optional[np.ndarray] = None,
    response_language: Optional[str] = None,
) -> Dict[str, Any]:
    start_time = time.time()
    source_catalog_size = len(cars)
    constraints = detect_inventory_constraints(query, cars)
    response_lang = response_language if response_language in {"en", "fr", "ar"} else constraints.get("response_language") or detect_response_language(query)
    constraints["response_language"] = response_lang
    searchable_cars = apply_inventory_constraints(cars, constraints)
    requested_colors = constraints.get("colors") or []
    constraints["available_requested_colors"] = available_requested_colors(searchable_cars, requested_colors) if requested_colors else []
    constraints["missing_requested_colors"] = [
        color for color in requested_colors if color not in constraints["available_requested_colors"]
    ]

    relaxed_from: List[str] = []
    if not searchable_cars:
        # Progressive constraint relaxation: drop lower-priority constraints tier by tier
        relaxed_cars, relaxed_constraints, dropped_labels = relax_constraints_progressively(constraints, cars)
        if relaxed_cars:
            # Store originals so the explanation generator can reference what was requested
            relaxed_constraints["_original_fuel_types"]     = constraints.get("fuel_types") or []
            relaxed_constraints["_original_categories"]     = constraints.get("categories") or []
            relaxed_constraints["_original_transmissions"]  = constraints.get("transmissions") or []
            relaxed_constraints["_original_features"]       = constraints.get("features") or []
            relaxed_constraints["_original_brand_groups"]   = constraints.get("brand_groups") or []
            relaxed_constraints["_original_budget"]         = constraints.get("budget")
            relaxed_constraints["relaxed_from"]             = dropped_labels
            relaxed_constraints["response_language"]        = response_lang
            searchable_cars = relaxed_cars
            relaxed_from    = dropped_labels
            constraints     = relaxed_constraints
            requested_colors = constraints.get("colors") or []
            constraints["available_requested_colors"] = available_requested_colors(searchable_cars, requested_colors) if requested_colors else []
            constraints["missing_requested_colors"] = [
                color for color in requested_colors if color not in constraints["available_requested_colors"]
            ]
        else:
            # Genuine dead-end: nothing in inventory (or brand doesn't exist at all)
            coverage_source_cars = apply_inventory_constraints(cars, coverage_constraints_for(constraints))
            coverage_profiles = [structured_car_profile(car) for car in coverage_source_cars]
            fallback_coverage = inventory_coverage_for(
                query,
                coverage_source_cars,
                coverage_profiles,
                constraints,
                {},
                sporty_or_offroad_intent_requested(query),
            ) if coverage_source_cars else None
            return {
                "query": query,
                "intent": {},
                "ai_confidence": "No Inventory Match",
                "engine": "inventory-grounded-hybrid-semantic-faiss-ranker",
                "grounded_in_inventory": True,
                "source_catalog_size": source_catalog_size,
                "catalog_size": source_catalog_size,
                "filtered_catalog_size": 0,
                "embedding_count": 0,
                "faiss_index_ntotal": 0,
                "inventory_constraints": constraints,
                "inventory_coverage": fallback_coverage,
                "response_language": response_lang,
                "inventory_answer": localized_inventory_summary(query, [], constraints, source_catalog_size, fallback_coverage, response_lang),
                "metrics": {"ranking_time_ms": round((time.time() - start_time) * 1000, 2)},
                "count": 0,
                "results": [],
                "recommendations": [],
            }

    budget = requested_budget_value(constraints, constraints.get("budget"))
    intent = extract_intent(query, query_vector)
    performance_requested = sporty_or_offroad_intent_requested(query)
    practical_requested = practical_ownership_intent_requested(query, intent)
    daily_requested_for_filter = daily_consumer_intent_requested(query, intent, performance_requested)
    daily_hard_filter_applied = False
    if daily_requested_for_filter and not performance_requested:
        profiled_cars = [(car, structured_car_profile(car)) for car in searchable_cars]
        daily_candidates = [car for car, profile in profiled_cars if commuter_hard_filter_match(car, profile)]
        if daily_candidates:
            searchable_cars = daily_candidates
            daily_hard_filter_applied = True
            constraints["available_requested_colors"] = available_requested_colors(searchable_cars, requested_colors) if requested_colors else []
            constraints["missing_requested_colors"] = [
                color for color in requested_colors if color not in constraints["available_requested_colors"]
            ]

    catalog = build_catalog(searchable_cars)
    
    # FAISS search
    D, I = catalog["faiss_index"].search(np.array([query_vector]), len(searchable_cars))
    distances = D[0]
    indices = I[0]
    
    brands = constraints.get("brands") or requested_brands(query, catalog["cars"])
    debug_ai_pipeline("intent_detected", {
        "query": query,
        "intent": intent,
        "constraints": constraints,
        "searchable_catalog_size": len(searchable_cars),
        "performance_requested": performance_requested,
        "practical_requested": practical_requested,
        "daily_hard_filter_applied": daily_hard_filter_applied,
    })
    cheapest_mode = is_cheapest_query(query)
    affordability_mode = has_affordability_signal(query)
    effective_limit = requested_limit_from_query(query, limit)
    catalog_prices = [float(car.price or 0) for car in catalog["cars"]]
    sorted_price_ids = [
        car.id
        for car in sorted(catalog["cars"], key=lambda item: float(item.price or math.inf))
        if float(car.price or 0) > 0
    ]
    price_rank_by_id = {
        car_id: 1.0 - (rank / max(len(sorted_price_ids) - 1, 1))
        for rank, car_id in enumerate(sorted_price_ids)
    }
    results = []

    for idx, sim in zip(indices, distances):
        car = catalog["cars"][idx]
        direct_similarity = float(sim)
        semantic_component = clamp01((direct_similarity + 0.05) / 0.75)
        profile = catalog["structured_profiles"][idx]
        
        # Match scorers
        intent_component = intent_match_score(intent, profile)
        budget_component = budget_match_score(car, budget, intent, profile)
        category_component = category_match_score(car, intent, profile)
        brand_component = brand_constraint_score(car, brands)
        brand_group_component = brand_group_match_score(car, constraints)
        practical_brand_component = practical_brand_priority_score(car)
        core_fit_component = semantic_core_fit_score(
            car,
            query,
            intent,
            profile,
            constraints,
            budget,
            budget_component,
        )
        
        personalization_component = 0.5
        if preference_vector is not None:
            personalization_component = clamp01((cosine(preference_vector, catalog["text_vectors"][idx]) + 0.05) / 0.75)
            
        penalty, penalty_reasons = hard_negative_penalty(car, query, intent, profile, budget, constraints, performance_requested)
        price_component = price_rank_by_id.get(car.id, price_rank_component(car, catalog_prices))

        economy_mode = intent.get("economy", 0) > 0.55 or intent.get("city_driving", 0) > 0.55
        daily_default_mode = daily_requested_for_filter and not cheapest_mode
        daily_consumer_component = profile.get("daily_consumer_score", 0.0)
        economy_ownership_component = clamp01(
            0.30 * profile.get("affordability_score", 0.0)
            + 0.25 * profile.get("fuel_efficiency_score", 0.0)
            + 0.15 * profile.get("ownership_cost_score", 0.0)
            + 0.30 * price_component
        )
        practical_attribute_component = clamp01(
            0.17 * profile.get("reliability_score", 0.0)
            + 0.17 * profile.get("fuel_efficiency_score", 0.0)
            + 0.16 * profile.get("maintenance_cost_score", 0.0)
            + 0.15 * profile.get("practicality_score", 0.0)
            + 0.13 * profile.get("daily_usability_score", 0.0)
            + 0.11 * profile.get("commuter_suitability_score", 0.0)
            + 0.06 * profile.get("economy_hybrid_score", 0.0)
            + 0.05 * practical_brand_component
        )

        if cheapest_mode:
            brand_gate = 1.0 if not brands or brand_component > 0 else 0.0
            score = (
                0.96 * price_component
                + 0.03 * brand_component
                + 0.01 * semantic_component
            ) * brand_gate
        elif daily_default_mode:
            score = (
                0.28 * practical_attribute_component
                + 0.18 * profile.get("commuter_suitability_score", 0.0)
                + 0.14 * profile.get("practicality_score", 0.0)
                + 0.12 * daily_consumer_component
                + 0.10 * economy_ownership_component
                + 0.10 * intent_component
                + 0.08 * budget_component
                + 0.06 * practical_brand_component
                + 0.03 * brand_component
                + 0.03 * category_component
                + 0.02 * personalization_component
                + 0.02 * semantic_component
                - penalty
            )
        elif economy_mode:
            if affordability_mode:
                score = (
                    0.55 * price_component
                    + 0.22 * economy_ownership_component
                    + 0.10 * intent_component
                    + 0.08 * brand_component
                    + 0.03 * budget_component
                    + 0.02 * semantic_component
                    - penalty
                )
            else:
                score = (
                    0.08 * semantic_component
                    + 0.18 * intent_component
                    + 0.34 * economy_ownership_component
                    + 0.15 * budget_component
                    + 0.15 * brand_component
                    + 0.05 * category_component
                    + 0.05 * personalization_component
                    - penalty
                )
        else:
            # User explicitly requested ranking priorities:
            # 1. Brand match
            # 2. Body type
            # 3. Luxury intent
            # 4. Price proximity
            # 5. Features (secondary)
            brand_total = max(brand_component, brand_group_component)
            score = (
                0.30 * brand_total
                + 0.25 * category_component
                + 0.20 * intent_component
                + 0.15 * budget_component
                + 0.10 * semantic_component
                - penalty
            )
        score = clamp01(score)
        visual_score_cap = visual_attribute_score_cap(car, constraints)
        semantic_score_cap = semantic_confidence_score_cap(core_fit_component)
        score_caps = [cap for cap in [visual_score_cap, semantic_score_cap] if cap is not None]
        score_cap = min(score_caps) if score_caps else None
        if score_cap is not None:
            score = min(score, score_cap)
        budget_ok = bool(budget and car.price and car.price <= budget)
        percent = score_to_percentage(score)
        explanation_penalty_reasons = list(penalty_reasons)
        if semantic_score_cap is not None:
            if core_fit_component < 0.62:
                explanation_penalty_reasons.append("weak match for primary semantic intent")
            elif core_fit_component < 0.72:
                explanation_penalty_reasons.append("partial match for primary semantic intent")
        
        if cheapest_mode:
            if response_lang == "ar":
                explanation = "أقل خيار سعرا في المخزون، مرتب حسب السعر الفعلي قبل إشارات النمط."
            elif response_lang == "fr":
                explanation = "Option la moins chere de l'inventaire, classee selon le prix reel avant les signaux de style."
            else:
                explanation = "Lowest-price match from the restored CSV inventory, ranked by actual vehicle price before semantic styling signals."
        else:
            explanation = dynamic_explanation(query, intent, profile, budget_ok, explanation_penalty_reasons, car, response_lang)
        
        results.append({
            "car": car_dict(car),
            "similarity_score": round(direct_similarity, 4),
            "semantic_component": round(semantic_component, 4),
            "intent_match_score": round(intent_component, 4),
            "budget_match_score": round(budget_component, 4),
            "price_rank_score": round(price_component, 4),
            "economy_ownership_score": round(economy_ownership_component, 4),
            "practical_attribute_score": round(practical_attribute_component, 4),
            "daily_consumer_score": round(daily_consumer_component, 4),
            "category_match_score": round(category_component, 4),
            "semantic_core_fit_score": round(core_fit_component, 4),
            "brand_constraint_score": round(brand_component, 4),
            "brand_group_match_score": round(brand_group_component, 4),
            "practical_brand_score": round(practical_brand_component, 4),
            "personalization_score": round(personalization_component, 4),
            "hard_negative_penalty": round(penalty, 4),
            "visual_attribute_score_cap": round(visual_score_cap, 4) if visual_score_cap is not None else None,
            "semantic_score_cap": round(semantic_score_cap, 4) if semantic_score_cap is not None else None,
            "final_score_cap": round(score_cap, 4) if score_cap is not None else None,
            "ranking_score": round(score, 4),
            "score": percent,
            "ai_match_percentage": percent,
            "personality_tag": confidence_tier_label(percent, budget_ok, intent, response_lang),
            "reasons": build_item_reasons(car, constraints, profile, budget_ok, explanation_penalty_reasons, response_lang),
            "match_reason": explanation,
            "hybrid_type": hybrid_type_for_car(car, profile),
            "ai_profile": {key: round(value, 4) for key, value in profile.items()},
            "penalty_reasons": explanation_penalty_reasons,
        })

    results.sort(key=lambda item: item["ranking_score"], reverse=True)
    results = dedupe_ranked_results(results, query)
    coverage = inventory_coverage_for(
        query,
        catalog["cars"],
        catalog["structured_profiles"],
        constraints,
        intent,
        performance_requested,
    )
    
    # Confidence & Fallback Logic
    highest_score = results[0]["ranking_score"] if results else 0
    semantic_certainty = results[0]["semantic_component"] if results else 0
    highest_core_fit = results[0].get("semantic_core_fit_score", 0) if results else 0
    highest_percent = results[0].get("ai_match_percentage", 0) if results else 0
    confidence = "High Confidence"
    if coverage.get("requested_colors") and coverage.get("exact_color_match_count", 0) == 0:
        confidence = "Low Confidence - Missing Color Match"
    elif coverage.get("limited_daily_inventory"):
        confidence = "Low Confidence - Limited Inventory Match"
    elif highest_percent < 70:
        confidence = "Low Confidence - Weak Fallback"
    elif highest_percent < 86 or highest_core_fit < 0.88:
        confidence = "Medium Confidence - Partial Semantic Match"
    elif coverage.get("intent_coverage_quality") == "partial" or semantic_certainty < 0.45:
        confidence = "Medium Confidence"
    elif highest_score < 0.5:
        confidence = "Low Confidence"
    elif highest_score < 0.7:
        confidence = "Medium Confidence"
        
    ranking_time = time.time() - start_time
    debug_ai_pipeline("ranked_results", {
        "query": query,
        "ai_confidence": confidence,
        "semantic_certainty": round(semantic_certainty, 4),
        "intent_coverage_quality": coverage.get("intent_coverage_quality"),
        "result_count": min(len(results), effective_limit),
        "ranked_vehicle_ids": [item["car"].get("id") for item in results[:effective_limit]],
        "ranked_vehicle_names": [
            safe_text(f"{item['car'].get('brand')} {item['car'].get('model')}")
            for item in results[:effective_limit]
        ],
        "ranked_scores": [item.get("ai_match_percentage") for item in results[:effective_limit]],
        "visual_attribute_caps": [item.get("visual_attribute_score_cap") for item in results[:effective_limit]],
        "semantic_core_fit_scores": [item.get("semantic_core_fit_score") for item in results[:effective_limit]],
        "semantic_score_caps": [item.get("semantic_score_cap") for item in results[:effective_limit]],
        "requested_colors": coverage.get("requested_colors"),
        "exact_color_match_count": coverage.get("exact_color_match_count"),
    })
    
    return {
        "query": query,
        "intent": intent,
        "ai_confidence": confidence,
        "engine": "inventory-grounded-hybrid-semantic-faiss-ranker",
        "grounded_in_inventory": True,
        "response_language": response_lang,
        "source_catalog_size": source_catalog_size,
        "filtered_catalog_size": len(searchable_cars),
        "inventory_constraints": constraints,
        "inventory_coverage": coverage,
        "inventory_answer": localized_inventory_summary(query, results[:effective_limit], constraints, source_catalog_size, coverage, response_lang),
        "metrics": {
            "ranking_time_ms": round(ranking_time * 1000, 2),
            "semantic_certainty": round(semantic_certainty, 4),
            "intent_coverage_quality": coverage.get("intent_coverage_quality"),
            "daily_hard_filter_applied": daily_hard_filter_applied,
        },
        "catalog_size": source_catalog_size,
        "embedding_count": len(catalog["docs"]),
        "faiss_index_ntotal": int(catalog["faiss_index"].ntotal),
        "count": min(len(results), effective_limit),
        "results": results[:effective_limit],
        "recommendations": results[:effective_limit],
    }

def intent_match_score(intent: Dict[str, float], profile: Dict[str, float]) -> float:
    pairs = {
        "commuter": "commuter_suitability_score",
        "economy": "economy_score",
        "budget": "affordability_score",
        "family": "family_score",
        "luxury": "luxury_score",
        "sporty": "sporty_score",
        "sports": "sporty_score",
        "comfort": "comfort_score",
        "offroad": "offroad_score",
        "city_driving": "city_score",
        "electric": "fuel_efficiency_score",
        "performance": "performance_score",
    }
    weighted_sum = 0.0
    total_weight = 0.0
    for intent_key, profile_key in pairs.items():
        weight = max(0.0, intent.get(intent_key, 0.0))
        if weight <= 0.03:
            continue
        weighted_sum += weight * profile.get(profile_key, 0.0)
        total_weight += weight
    if total_weight <= 0:
        return 0.0
    return clamp01(weighted_sum / total_weight)

def budget_match_score(car: CarPayload, budget: Optional[float], intent: Dict[str, float], profile: Dict[str, float]) -> float:
    if budget and car.price:
        if car.price <= budget:
            return 1.0
        overage = (car.price - budget) / max(budget, 1)
        return clamp01(1.0 - overage * 4.0)
    if intent.get("economy", 0) > 0.45 or intent.get("budget", 0) > 0.45 or intent.get("commuter", 0) > 0.55:
        return profile.get("affordability_score", 0.65)
    return 0.65

def category_match_score(car: CarPayload, intent: Dict[str, float], profile: Dict[str, float]) -> float:
    category = safe_text(car.category).lower()
    score = 0.5
    if intent.get("commuter", 0) > 0.45:
        score = max(score, profile.get("commuter_suitability_score", 0), profile.get("daily_usability_score", 0))
    if intent.get("city_driving", 0) > 0.45 or intent.get("economy", 0) > 0.55:
        score = max(score, profile.get("city_score", 0), profile.get("economy_score", 0) * 0.9)
    if intent.get("budget", 0) > 0.45:
        score = max(score, profile.get("affordability_score", 0), profile.get("maintenance_cost_score", 0))
    if intent.get("electric", 0) > 0.45:
        fuel = safe_text(car.fuel_type).lower()
        score = max(score, 1.0 if ("electric" in fuel or "ev" in fuel or "hybrid" in fuel) else profile.get("fuel_efficiency_score", 0) * 0.65)
    if intent.get("family", 0) > 0.45:
        score = max(score, profile.get("family_score", 0))
    if intent.get("performance", 0) > 0.45 or intent.get("sporty", 0) > 0.45 or intent.get("sports", 0) > 0.45:
        score = max(score, profile.get("performance_score", 0))
    if intent.get("luxury", 0) > 0.45:
        score = max(score, profile.get("luxury_score", 0))
    return clamp01(score)

def requested_brands(query: str, cars: List[CarPayload]) -> List[str]:
    available = available_brand_map(cars)
    return sorted([brand for brand in mentioned_brands(query) if brand in available])

def brand_constraint_score(car: CarPayload, brands: List[str]) -> float:
    if not brands:
        return 0.65
    brand = normalize_brand_name(car.brand)
    normalized = [normalize_brand_name(item) for item in brands]
    return 1.0 if brand in normalized else 0.0

def rank_cars(query: str, cars: List[CarPayload], limit: int = 10, preference_vector: Optional[np.ndarray] = None, response_language: Optional[str] = None) -> Dict[str, Any]:
    domain = automotive_domain_assessment(query)
    if not domain.get("in_domain"):
        return out_of_domain_response(query, domain)
    return rank_with_query_vector(query, embed_text(query), cars, limit, preference_vector, response_language)

def activity_embedding(activities: List[Dict[str, Any]]) -> Optional[np.ndarray]:
    vectors = []
    weights = []
    event_weights = {"favorite": 2.4, "view": 1.0, "click": 1.2, "search": 1.5, "compare": 1.4}

    for activity in activities:
        event_type = safe_text(activity.get("event_type")).lower()
        weight = event_weights.get(event_type, 0.8)
        query = safe_text(activity.get("query"))
        if query:
            vectors.append(embed_text(query))
            weights.append(weight * 1.5)
        
        meta = activity.get("metadata") or {}
        car_data = meta.get("car")
        if car_data:
            car = CarPayload(**car_data)
            vectors.append(embed_text(automotive_profile_text(car)))
            weights.append(weight)

    if not vectors:
        return None

    matrix = np.asarray(vectors, dtype=np.float32)
    weight_arr = np.asarray(weights, dtype=np.float32).reshape(-1, 1)
    combined = np.sum(matrix * weight_arr, axis=0)
    return normalize_vector(combined)

@app.post("/ai-search")
async def ai_search(request: SearchRequest) -> Dict[str, Any]:
    try:
        debug_ai_pipeline("incoming_request", {
            "query": request.query,
            "cars_count": len(request.cars),
            "limit": request.limit,
        })
        domain = automotive_domain_assessment(request.query)
        debug_ai_pipeline("domain_assessed", {
            "query": request.query,
            "domain_relevance": domain,
        })
        if not domain.get("in_domain"):
            return out_of_domain_response(request.query, domain)
        if not request.cars:
            constraints = detect_inventory_constraints(request.query, [])
            response_lang = request.response_language if request.response_language in {"en", "fr", "ar"} else constraints.get("response_language") or detect_response_language(request.query)
            constraints["response_language"] = response_lang
            return {
                "query": request.query,
                "intent": {},
                "ai_confidence": "No Inventory Match",
                "engine": "inventory-grounded-hard-filter",
                "grounded_in_inventory": True,
                "response_language": response_lang,
                "source_catalog_size": 0,
                "catalog_size": 0,
                "filtered_catalog_size": 0,
                "embedding_count": 0,
                "faiss_index_ntotal": 0,
                "inventory_constraints": constraints,
                "inventory_answer": localized_inventory_summary(request.query, [], constraints, 0, None, response_lang),
                "count": 0,
                "results": [],
                "recommendations": [],
            }
        return rank_cars(request.query, request.cars, request.limit, response_language=request.response_language)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/similar-cars")
async def ai_similar_cars(request: SimilarRequest) -> Dict[str, Any]:
    if not request.cars:
        return {"results": []}
    
    query_vector = embed_text(automotive_profile_text(request.car))
    results = rank_with_query_vector(f"similar to {request.car.brand} {request.car.model}", query_vector, request.cars, request.limit)
    results["results"] = [r for r in results["results"] if r["car"]["id"] != request.car.id]
    return results

@app.post("/compare")
async def ai_compare(request: CompareRequest) -> Dict[str, Any]:
    if len(request.cars) < 2:
        return {"error": "Need at least 2 cars to compare."}
    if len(request.cars) > 3:
        return {"error": "Can only compare up to 3 cars at a time."}
    
    profiles = [structured_car_profile(c) for c in request.cars]
    
    comparison_matrix = []
    for car in request.cars:
        comparison_matrix.append({
            "id": car.id,
            "title": f"{car.brand} {car.model}",
            "price": car.price,
            "year": car.year,
            "mileage": car.mileage,
            "fuel_type": car.fuel_type,
            "transmission": car.transmission,
            "category": car.category,
        })
        
    cars_with_price = [c for c in request.cars if c.price]
    cars_with_year = [c for c in request.cars if c.year]
    
    summary_sentences = []
    if cars_with_price:
        cheapest = min(cars_with_price, key=lambda c: c.price)
        summary_sentences.append(f"The {cheapest.brand} {cheapest.model} is the most affordable option at {cheapest.price:,.0f} DH.")
        
    if cars_with_year:
        newest = max(cars_with_year, key=lambda c: c.year)
        summary_sentences.append(f"The {newest.brand} {newest.model} is the newest model ({newest.year}).")
        
    def best_for(key: str) -> str:
        idx = max(range(len(profiles)), key=lambda i: profiles[i].get(key, 0))
        return f"{request.cars[idx].brand} {request.cars[idx].model}"

    return {
        "comparison_matrix": comparison_matrix,
        "summary": " ".join(summary_sentences) or "The vehicles offer comparable specifications.",
        "best_for": {
            "economy": best_for("economy_score"),
            "performance": best_for("performance_score"),
            "luxury": best_for("luxury_score"),
            "family": best_for("family_score"),
            "city_driving": best_for("city_score"),
            "value": best_for("ownership_cost_score"),
        }
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=9000, reload=False)
