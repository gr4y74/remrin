#!/usr/bin/env python3
"""
Restore hero section with black hole from minified file
"""
from pathlib import Path
from bs4 import BeautifulSoup

MINIFIED = Path(__file__).parent / "template_minified.html"
CURRENT = Path(__file__).parent / "template.html"
OUTPUT = Path(__file__).parent / "template.html"

def restore_hero():
    print("Reading minified file to extract hero section...")
    with open(MINIFIED, 'r', encoding='utf-8') as f:
        minified_content = f.read()
    
    minified_soup = BeautifulSoup(minified_content, 'html.parser')
    
    # Find hero section in minified
    hero_section = minified_soup.find('section', class_='hero')
    
    if not hero_section:
        print("ERROR: Hero section not found in minified file!")
        return
    
    print("Reading current cleaned file...")
    with open(CURRENT, 'r', encoding='utf-8') as f:
        current_content = f.read()
    
    current_soup = BeautifulSoup(current_content, 'html.parser')
    body = current_soup.find('body')
    
    if not body:
        print("ERROR: No body tag found!")
        return
    
    # Find header and footer
    header = body.find('div', class_='header')
    footer = body.find('div', class_='footer')
    
    # Clear body
    body.clear()
    
    # Re-add header
    if header:
        print("  Adding header")
        body.append(header)
    
    # Add hero section
    print("  Adding hero section with black hole")
    body.append(hero_section)
    
    # Re-add footer
    if footer:
        print("  Adding footer")
        body.append(footer)
    
    # Clean hero content (remove text, keep structure)
    hero_content_div = hero_section.find('div', class_='hero-content')
    if hero_content_div:
        # Remove section-header if it has text
        section_header = hero_content_div.find('div', class_='section-header')
        if section_header and section_header.get_text(strip=True):
            section_header.decompose()
        
        # Remove any headings with text
        for heading in hero_content_div.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            if heading.get_text(strip=True):
                heading.decompose()
        
        # Remove hero-badge
        hero_badge = hero_content_div.find('a', class_='hero-badge')
        if hero_badge:
            hero_badge.decompose()
        
        # Remove hero-description
        hero_desc = hero_content_div.find('p', class_='hero-description')
        if hero_desc:
            hero_desc.decompose()
    
    # Remove any Reflect text from hero
    for text_node in hero_section.find_all(string=True):
        if text_node.parent and text_node.parent.name not in ['script', 'style']:
            text_lower = text_node.lower()
            if any(word in text_lower for word in ['reflect', 'notes', 'never miss', 'think better']):
                text_node.replace_with('')
    
    print(f"\nWriting restored file to {OUTPUT}...")
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(str(current_soup))
    
    print("Done!")
    
    # Verify
    if hero_section.find('div', class_='hero-black-hole'):
        print("  ✓ Hero section with black hole restored")
    if hero_section.find('video'):
        print("  ✓ Black hole video found")

if __name__ == "__main__":
    restore_hero()
