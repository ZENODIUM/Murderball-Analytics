"""Browser smoke check for every top-level MurderBall feature.

Run: .venv/Scripts/python.exe scripts/smoke_ui_navigation.py
"""

from pathlib import Path
import re
import sys

from playwright.sync_api import sync_playwright


BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "Docs" / "screenshots"

AREAS = {
    "Workspace": [
        "Match Theatre", "Match Explorer", "Player Studio", "Championships",
        "World Rankings", "Tactical Court", "Lineup Optimizer", "Scenario Lab",
        "Coach Assistant", "Decision Mirror", "Pressure Atlas",
        "Lineup Constellation", "Confidence Frontier", "RuleShift Lab", "Archetypes",
    ],
    "Research & Data": [
        "Overview", "Research Hub", "Living Intelligence", "Frontier Lab",
        "Data Coverage", "Data Quality", "CV Evaluation", "Annotation Queue",
    ],
}


def main():
    failures = []
    console_errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=CHROME, headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("pageerror", lambda error: console_errors.append(str(error)))
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
        page.get_by_role("tab", name="Workspace").wait_for(timeout=15000)
        page.wait_for_timeout(1800)
        SCREENSHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SCREENSHOTS / "redesigned_workspace.png"), full_page=True)

        for area, features in AREAS.items():
            page.get_by_role("tab", name=area).click()
            for feature in features:
                try:
                    page.locator("aside nav").get_by_role("button", name=feature, exact=True).click()
                    page.locator("main .app-page-heading h2").get_by_text(feature, exact=True).wait_for(timeout=7000)
                    page.wait_for_timeout(700)
                    content = page.locator("main").inner_text()
                    if len(content.strip()) < len(feature) + 40:
                        raise AssertionError("Feature content is empty")
                    print(f"OK  {area}: {feature}")
                except Exception as exc:
                    failures.append(f"{area}: {feature}: {exc}")
                    print(f"FAIL {area}: {feature}: {exc}")
            if area == "Research & Data":
                page.locator("aside nav").get_by_role("button", name="Research Hub", exact=True).click()
                page.wait_for_timeout(1000)
                page.screenshot(path=str(SCREENSHOTS / "redesigned_research.png"), full_page=True)
                research_picker = page.get_by_label("Explore research section")
                for section in (
                    "case_studies", "hypotheses_fdr", "model_tournament", "coaching_playbook",
                    "academic_originality", "hypotheses", "benchmarks", "coplay", "research_leaderboard",
                ):
                    research_picker.select_option(section)
                    page.wait_for_timeout(150)
                    if len(page.locator("main").inner_text().strip()) < 150:
                        failures.append(f"Research section {section} is empty")
                print("OK  All nine research sections render")

        page.get_by_role("tab", name="Workspace").click()
        page.locator("aside nav").get_by_role("button", name="Match Theatre", exact=True).click()
        page.wait_for_timeout(1200)
        iframe = page.locator('iframe[src*="y1LvPJW4jt0"]')
        if iframe.count() != 1:
            failures.append("Default official match iframe is absent")
        else:
            print("OK  Official full-match iframe uses verified YouTube ID")
        match_picker = page.get_by_label("Select Paralympic Match for Theatre Inspection")
        match_picker.select_option("PAR24_M19")
        page.get_by_text("Broadcast Embed Unavailable").wait_for(timeout=8000)
        if page.locator('iframe[src*="y1LvPJW4jt0"]').count():
            failures.append("Wrong match inherited the Japan–USA video")
        else:
            print("OK  Unverified bronze match does not inherit another match's video")
        match_picker.select_option("PAR24_M20")
        page.locator('iframe[src*="y1LvPJW4jt0"]').wait_for(timeout=8000)
        page.screenshot(path=str(SCREENSHOTS / "redesigned_match_theatre.png"), full_page=True)

        page.locator("aside nav").get_by_role("button", name="Player Studio", exact=True).click()
        page.get_by_placeholder("Search athlete, team, or tier...").fill("Aoki")
        try:
            page.get_by_text("AOKI Chuck", exact=True).first.wait_for(timeout=12000)
            print("OK  Player search filters athlete records")
        except Exception as exc:
            failures.append(f"Player search: {exc}")

        page.locator("aside nav").get_by_role("button", name="Lineup Optimizer", exact=True).click()
        page.get_by_role("button", name="Solve Optimal Lineups").click()
        try:
            page.get_by_text(re.compile(r"Optimal Legal Lineup Combinations \([1-9]"), exact=False).wait_for(timeout=12000)
            print("OK  Lineup optimizer returns legal combinations")
        except Exception as exc:
            failures.append(f"Lineup optimizer: {exc}")

        page.locator("aside nav").get_by_role("button", name="Scenario Lab", exact=True).click()
        page.get_by_role("button", name="Run 500 Iterations").click()
        page.get_by_text("Simulated Win Probability").wait_for(timeout=12000)
        print("OK  Scenario simulation action responds")

        page.get_by_role("tab", name="Research & Data").click()
        page.get_by_label("Explore research section").select_option("model_tournament")
        page.get_by_text("24 Reused Evaluation Matches").wait_for(timeout=12000)
        print("OK  Research model comparison opens")

        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
        mobile.get_by_role("tab", name="Research & Data").click()
        mobile.get_by_label("Choose feature").locator('option[value="quality"]').wait_for(state="attached", timeout=10000)
        mobile.get_by_label("Choose feature").select_option("quality")
        mobile.locator("main .app-page-heading h2").get_by_text("Data Quality").wait_for(timeout=7000)
        mobile.screenshot(path=str(SCREENSHOTS / "redesigned_mobile.png"), full_page=True)
        print("OK  Mobile area switch and feature picker")
        browser.close()

    for error in sorted(set(console_errors)):
        print(f"PAGE ERROR: {error}")
    for failure in failures:
        print(f"FAILURE: {failure}")
    print(f"RESULT: {sum(len(items) for items in AREAS.values()) - len(failures)}/23 feature views rendered, {len(console_errors)} page errors")
    if failures or console_errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
