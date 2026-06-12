# AutoMarket AI Engine

FastAPI service for semantic automotive recommendations.

## Run

```bash
cd ai-engine
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 9000 --reload
```

Set Laravel:

```env
AI_ENGINE_URL=http://127.0.0.1:9000
```

The engine uses `sentence-transformers` for semantic understanding and `clip-ViT-B-32` for visual search. Text recommendations use a hybrid automotive ranker:

```text
0.45 semantic_similarity
+ 0.25 intent_match
+ 0.15 budget_match
+ 0.10 category_match
+ 0.05 personalization_score
- hard_negative_penalty
```

It builds structured AI profiles for each car, including economy, luxury, performance, family, city, comfort, off-road, affordability, and running-cost scores. It does not use TF-IDF or keyword fallback ranking; if the embedding models are not installed, AI endpoints return a 503 with setup guidance.
