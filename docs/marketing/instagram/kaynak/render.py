import asyncio, sys
from playwright.async_api import async_playwright
async def main(src,out):
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={"width":1080,"height":1350},device_scale_factor=1)
        await pg.goto("file://"+src, wait_until="networkidle"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(500)
        await pg.screenshot(path=out); await b.close()
asyncio.run(main(sys.argv[1],sys.argv[2]))
