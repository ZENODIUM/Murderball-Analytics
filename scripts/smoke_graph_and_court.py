"""Exercise graph and court gestures against the local Next.js app."""

from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "Docs" / "screenshots"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def navigate(page, label):
    page.locator("aside nav").get_by_role("button", name=label, exact=True).click()
    page.locator("main .app-page-heading h2").get_by_text(label, exact=True).wait_for()


def main():
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=CHROME, headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.goto("http://localhost:3000", wait_until="domcontentloaded")
        brand_color = page.locator(".app-area-tab.is-active").evaluate("element => getComputedStyle(element).backgroundColor")
        assert brand_color == "rgb(53, 87, 71)", f"Stale application palette: {brand_color}"
        print("OK  Updated forest palette is active")
        navigate(page, "Lineup Constellation")
        graph = page.get_by_test_id("lineup-network")
        graph.wait_for(timeout=15000)
        SCREENSHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SCREENSHOTS / "interactive_network.png"), full_page=True)

        assert graph.locator("[data-node-name]").count() >= 10, "Graph nodes missing"
        select = page.get_by_label("Select athlete in network")
        names = select.locator("option").all_text_contents()
        select.select_option(label=names[1])
        assert names[1] in page.locator("main").inner_text(), "Athlete selection did not update"
        print("OK  Athlete selector changes graph focus")

        node = graph.locator("[data-node-name]").first
        before = node.get_attribute("transform")
        box = node.bounding_box()
        assert box
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] / 2 + 65, box["y"] + box["height"] / 2 + 28, steps=8)
        page.mouse.up()
        assert node.get_attribute("transform") != before, "Node drag did not move"
        print("OK  Graph node drag moves an athlete")

        page.get_by_role("button", name="Zoom in graph").click()
        assert "115%" in page.locator(".network-zoom-value").inner_text()
        page.get_by_role("button", name="Reset graph view").click()
        assert "100%" in page.locator(".network-zoom-value").inner_text()
        print("OK  Graph zoom and reset")
        graph_bounds = graph.bounding_box()
        assert graph_bounds
        graph_layer = graph.locator(":scope > g").first
        pan_before = graph_layer.get_attribute("transform")
        page.mouse.move(graph_bounds["x"] + 40, graph_bounds["y"] + 40)
        page.mouse.down()
        page.mouse.move(graph_bounds["x"] + 95, graph_bounds["y"] + 65, steps=6)
        page.mouse.up()
        assert graph_layer.get_attribute("transform") != pan_before, "Canvas did not pan"
        page.get_by_role("button", name="Reset graph view").click()
        print("OK  Graph background drag pans the canvas")
        page.get_by_label("Select squad in network").select_option("JPN")
        graph.locator("[data-node-name]").first.wait_for(timeout=10000)
        assert page.get_by_label("Select athlete in network").locator("option").count() > 0
        print("OK  Squad change loads a new network")

        navigate(page, "Tactical Court")
        court = page.get_by_test_id("tactical-court")
        court.wait_for(timeout=10000)
        page.get_by_role("button", name="Zoom in court").click()
        assert "125%" in page.locator("main").inner_text()
        page.get_by_role("button", name="Pan Court").click()
        court.scroll_into_view_if_needed()
        pan_bounds = court.bounding_box()
        assert pan_bounds
        pan_before = court.get_attribute("style")
        page.mouse.move(pan_bounds["x"] + pan_bounds["width"] * .3, pan_bounds["y"] + pan_bounds["height"] * .2)
        page.mouse.down()
        page.mouse.move(pan_bounds["x"] + pan_bounds["width"] * .3 + 65, pan_bounds["y"] + pan_bounds["height"] * .2 + 35, steps=6)
        page.mouse.up()
        assert court.get_attribute("style") != pan_before, "Court view did not pan"
        page.get_by_role("button", name="Reset court view").click()
        page.get_by_role("button", name="Move Token").click()
        print("OK  Court zoom, pan, and view reset")
        token = court.locator("[data-token-id]").first
        token.scroll_into_view_if_needed()
        token_before = token.get_attribute("style")
        token_box = token.bounding_box()
        assert token_box
        page.mouse.move(token_box["x"] + token_box["width"] / 2, token_box["y"] + token_box["height"] / 2)
        page.mouse.down()
        page.mouse.move(token_box["x"] + token_box["width"] / 2 - 75, token_box["y"] + token_box["height"] / 2 + 65, steps=8)
        page.mouse.up()
        assert token.get_attribute("style") != token_before, "Court token did not move"
        print("OK  Court token drag moves an athlete")

        page.get_by_role("button", name="Drive Arrow").click()
        court.scroll_into_view_if_needed()
        bounds = court.bounding_box()
        assert bounds
        page.mouse.move(bounds["x"] + bounds["width"] * .25, bounds["y"] + bounds["height"] * .30)
        page.mouse.down()
        page.mouse.move(bounds["x"] + bounds["width"] * .43, bounds["y"] + bounds["height"] * .42, steps=8)
        page.mouse.up()
        assert court.locator('[data-annotation-type="arrow"]').count() == 1, "Drive arrow was not drawn"
        print("OK  Drag gesture creates a drive arrow")

        page.get_by_role("button", name="Keyblock Screen").click()
        court.scroll_into_view_if_needed()
        bounds = court.bounding_box()
        assert bounds
        page.mouse.click(bounds["x"] + bounds["width"] * .56, bounds["y"] + bounds["height"] * .28)
        assert court.locator('[data-annotation-type="screen"]').count() == 1, "Screen was not placed"
        page.get_by_role("button", name="Undo", exact=True).click()
        assert court.locator('[data-annotation-type="screen"]').count() == 0, "Undo did not remove screen"
        page.get_by_role("button", name="Save Scenario").click()
        page.get_by_role("status").get_by_text("Saved on this device").wait_for()
        page.get_by_role("button", name="Clear", exact=True).click()
        assert court.locator('[data-annotation-type="arrow"]').count() == 0
        page.get_by_role("button", name="Load saved").click()
        assert court.locator('[data-annotation-type="arrow"]').count() == 1, "Saved drawing was not restored"
        page.get_by_role("button", name="Pass Route").click()
        court.scroll_into_view_if_needed()
        bounds = court.bounding_box()
        assert bounds
        page.mouse.click(bounds["x"] + bounds["width"] * .20, bounds["y"] + bounds["height"] * .45)
        page.mouse.click(bounds["x"] + bounds["width"] * .38, bounds["y"] + bounds["height"] * .52)
        assert court.locator('[data-annotation-type="pass"]').count() == 1, "Two-click pass route was not drawn"
        page.get_by_role("button", name="Trap Zone").click()
        court.scroll_into_view_if_needed()
        bounds = court.bounding_box()
        assert bounds
        page.mouse.click(bounds["x"] + bounds["width"] * .57, bounds["y"] + bounds["height"] * .30)
        assert court.locator('[data-annotation-type="trap"]').count() == 1, "Trap zone was not placed"
        page.screenshot(path=str(SCREENSHOTS / "interactive_tactical_court.png"), full_page=False)
        print("OK  Drawing tools, undo, save, and load")

        browser.close()
    assert not errors, "Browser errors: " + "; ".join(errors)
    print("RESULT: graph and court interactions passed with no browser errors")


if __name__ == "__main__":
    main()
