#!/usr/bin/env python3
"""
Aggressively remove ALL Reflect mentions from the HTML
"""
import re
from pathlib import Path
from bs4 import BeautifulSoup

INPUT_FILE = Path(__file__).parent / "template.html"
OUTPUT_FILE = Path(__file__).parent / "template.html"

def remove_all_reflect():
    print("Reading HTML file...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove Reflect from the raw content first
    print("Removing Reflect from raw content...")
    content = re.sub(r'reflect', '', content, flags=re.IGNORECASE)
    content = re.sub(r'Reflect', '', content)
    
    soup = BeautifulSoup(content, 'html.parser')
    
    # Remove any remaining text nodes with Reflect
    for text_node in soup.find_all(string=True):
        if text_node.parent and text_node.parent.name not in ['script', 'style']:
            if 'reflect' in text_node.lower():
                text_node.replace_with('')
    
    # Remove Reflect from attributes
    for tag in soup.find_all(True):
        for attr_name, attr_value in list(tag.attrs.items()):
            if isinstance(attr_value, str) and 'reflect' in attr_value.lower():
                if attr_name in ['id', 'class']:
                    if isinstance(attr_value, list):
                        tag[attr_name] = [v for v in attr_value if 'reflect' not in v.lower()]
                    else:
                        tag[attr_name] = re.sub(r'reflect', '', attr_value, flags=re.IGNORECASE)
                else:
                    tag[attr_name] = re.sub(r'reflect', '', attr_value, flags=re.IGNORECASE)
    
    # Remove common Reflect content text
    reflect_texts = [
        'all your notes',
        'connected',
        'give your brain superpowers',
        'what can you do',
        'notes with an ai',
        'never miss a note',
        'think better',
    ]
    
    for text in reflect_texts:
        for text_node in soup.find_all(string=re.compile(text, re.I)):
            if text_node.parent and text_node.parent.name not in ['script', 'style']:
                if not text_node.find_parent('div', class_='hero-black-hole'):
                    text_node.replace_with('')
    
    print(f"Writing cleaned HTML to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    
    print("Done!")
    
    # Check for remaining Reflect
    remaining = soup.get_text().lower().count('reflect')
    print(f"Remaining 'reflect' mentions in text: {remaining}")

if __name__ == "__main__":
    remove_all_reflect()
