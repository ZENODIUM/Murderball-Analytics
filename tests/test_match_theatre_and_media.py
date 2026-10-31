"""
Automated Test Suite for Match Theatre, Media Catalog & Computer Vision Audit
=============================================================================
AQX Sports Analytics Data Bowl 4.0 - MurderBall Intelligence Platform
"""

import os
import sys
import json
import pytest

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.api.main import app, load_all_data

# Ensure data is loaded
load_all_data()

client = TestClient(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def test_media_catalog_rights_and_structure():
    path = os.path.join(BASE_DIR, "data", "extracted", "media_catalog.json")
    assert os.path.exists(path), f"Media catalog missing at {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "broadcast_replays" in data
    assert "open_licensed_photography" in data

    replays = data["broadcast_replays"]
    assert len(replays) >= 5, f"Expected >= 5 replays, got {len(replays)}"

    required_fields = [
        "media_id", "match_id", "competition", "tournament_year", "date", "teams",
        "stage", "title", "publisher", "source_url", "embed_url", "media_type",
        "public_availability", "embedding_allowed", "license_and_usage",
        "cv_processing_allowed", "redistribution_allowed", "duration_seconds",
        "verified_timestamp_anchors", "verification_status"
    ]
    for r in replays:
        for field in required_fields:
            assert field in r, f"Missing {field} in broadcast replay {r.get('media_id')}"
        assert isinstance(r["verified_timestamp_anchors"], list)
        if r.get("sync_verified"):
            assert r["verified_timestamp_anchors"], "Synchronized video requires verified anchors"
        else:
            assert not r["verified_timestamp_anchors"], "Unverified timestamps must not be presented as anchors"
        if r["embedding_allowed"]:
            assert r.get("youtube_id")
            assert r["source_url"].endswith(r["youtube_id"])
            assert r["embed_url"].endswith(r["youtube_id"])
        else:
            assert r.get("embed_url") is None

    default_replay = next(r for r in replays if r["match_id"] == "PAR24_M20")
    assert default_replay["youtube_id"] == "y1LvPJW4jt0"
    assert default_replay["sync_verified"] is False

    # Verify open photography
    photos = data["open_licensed_photography"]
    assert len(photos) >= 4
    for p in photos:
        assert "photo_id" in p
        assert "athlete_name" in p
        assert "license" in p
        assert "source_url" in p
        assert p["cv_processing_allowed"] is True
        assert p["redistribution_allowed"] is True

def test_cv_experimental_evaluation_scientific_honesty():
    path = os.path.join(BASE_DIR, "data", "extracted", "cv_experimental_evaluation.json")
    assert os.path.exists(path), f"CV evaluation payload missing at {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "tasks_evaluated" in data
    tasks = data["tasks_evaluated"]
    assert len(tasks) == 5

    task_ids = [t["task_id"] for t in tasks]
    assert "CV_01_SCOREBOARD_OCR" in task_ids
    assert "CV_05_HUMAN_POSE_ESTIMATION" in task_ids

    # Verify that pose estimation is documented honestly as scientifically invalid
    pose_task = next(t for t in tasks if t["task_id"] == "CV_05_HUMAN_POSE_ESTIMATION")
    assert "SCIENTIFICALLY_INVALID" in pose_task["feasibility_verdict"]
    assert pose_task["metrics"]["pckh_at_0_5"] < 0.50

def test_match_narratives_grounding():
    path = os.path.join(BASE_DIR, "data", "extracted", "match_narratives.json")
    assert os.path.exists(path), f"Match narratives payload missing at {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "matches" in data
    matches = data["matches"]
    assert "PAR24_M20" in matches

    m20 = matches["PAR24_M20"]
    assert "chapters" in m20
    assert len(m20["chapters"]) >= 3
    for ch in m20["chapters"]:
        assert "chapter_index" in ch
        assert "title" in ch
        assert "summary" in ch
        assert "source_provenance" in ch

def test_api_media_and_narratives_endpoints():
    # 1. Catalog
    res_cat = client.get("/api/media/catalog")
    assert res_cat.status_code == 200
    assert "broadcast_replays" in res_cat.json()

    # 2. CV Evaluation
    res_cv = client.get("/api/media/evaluation-cv")
    assert res_cv.status_code == 200
    assert "tasks_evaluated" in res_cv.json()

    # 3. Match Narratives list
    res_nar = client.get("/api/media/narratives")
    assert res_nar.status_code == 200
    assert "matches" in res_nar.json()

    # 4. Single Match Narrative
    res_single = client.get("/api/media/narratives/PAR24_M20")
    assert res_single.status_code == 200
    assert res_single.json()["match_id"] == "PAR24_M20"
