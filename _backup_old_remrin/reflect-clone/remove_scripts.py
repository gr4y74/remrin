#!/usr/bin/env python3
"""
Remove all Qwik scripts from the HTML
"""
from pathlib import Path
from bs4 import BeautifulSoup

INPUT_FILE = Path(__file__).parent / "template.html"
OUTPUT_FILE = Path(__file__).parent / "template.html"

def remove_scripts():
    print("Reading HTML file...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove all script tags
    scripts = soup.find_all('script')
    removed = 0
    for script in scripts:
        script.decompose()
        removed += 1
    
    print(f"Removed {removed} script tags")
    
    print(f"Writing cleaned HTML to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    
    print("Done!")

if __name__ == "__main__":
    remove_scripts()
