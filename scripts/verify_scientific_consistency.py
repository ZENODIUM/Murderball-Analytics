from pathlib import Path
import sys
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "docs" / "screenshots"
SCREENSHOTS.mkdir(parents=True, exist_ok=True)


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        target_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
        page.set_extra_http_headers({"ngrok-skip-browser-warning": "true"})
        page.goto(target_url, wait_until="networkidle", timeout=60_000)

        page.get_by_role("tab", name="Research & Data", exact=False).click()
        page.get_by_role("button", name="Research Hub").click()
        page.get_by_text("AQX SPORTS ANALYTICS DATA BOWL 4.0", exact=False).first.wait_for(timeout=30_000)
        page.get_by_text("1,296 recorded Assist Blocks", exact=False).wait_for(timeout=30_000)
        research_text = page.locator("body").inner_text()
        print("\n".join(line for line in research_text.splitlines() if "Assist" in line or "28.1" in line))
        assert "1,296 recorded Assist Blocks" in research_text
        assert "class 0.5: 364 (28.1%)" in research_text
        assert "2,505 Assist Blocks" not in research_text
        assert "does not identify the cause" in research_text
        assert "No Detectable Linear Association" in research_text
        assert "no absolute rule is supported" in research_text
        assert "p=0.8923" in research_text
        assert "p = 0.6740" not in research_text
        assert "First study" not in research_text
        assert "only statistically valid" not in research_text
        page.screenshot(path=SCREENSHOTS / "scientific_consistency_research_leaderboard.png", full_page=True)

        page.get_by_label("Explore research section").select_option("model_tournament")
        page.get_by_text("RETROSPECTIVE SENSITIVITY ANALYSIS", exact=True).wait_for(timeout=10_000)
        model_text = page.locator("body").inner_text()
        assert "24 Reused Evaluation Matches" in model_text
        assert "Seed/Favorite Baseline" in model_text
        assert "0.1177" in model_text
        assert "0.1433" in model_text
        assert "24 Unseen Test Matches" not in model_text
        page.screenshot(path=SCREENSHOTS / "scientific_consistency_model_comparison.png", full_page=True)

        page.get_by_role("tab", name="Workspace", exact=False).click()
        page.get_by_text("MULTIMODAL MATCH THEATRE", exact=False).wait_for(timeout=15_000)
        theatre_text = page.locator("body").inner_text()
        assert "UNSYNCHRONIZED" in theatre_text.upper()
        assert "aggressive keyline pressing" not in theatre_text.casefold()
        assert "rapid cross-court distribution" not in theatre_text.casefold()
        page.screenshot(path=SCREENSHOTS / "scientific_consistency_match_theatre.png", full_page=True)

        print("PASS: Research Leaderboard, model comparison, and Match Theatre are scientifically consistent.")
        browser.close()


if __name__ == "__main__":
    main()
