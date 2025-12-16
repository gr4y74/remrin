#!/usr/bin/env python3
"""
Final cleanup - keep only header, hero section with black hole, and footer
"""
from pathlib import Path
from bs4 import BeautifulSoup

INPUT_FILE = Path(__file__).parent / "template.html"
OUTPUT_FILE = Path(__file__).parent / "template.html"

def final_clean():
    print("Reading HTML file...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    body = soup.find('body')
    
    if not body:
        print("Error: No body tag found")
        return
    
    print("\nRemoving all content except header, hero, and footer...")
    
    # Find and keep header
    header = body.find('div', class_='header')
    
    # Find and keep hero section
    hero = body.find('section', class_='hero')
    if not hero:
        # Try to find hero-black-hole div
        hero_black_hole = body.find('div', class_='hero-black-hole')
        if hero_black_hole:
            # Create a hero section wrapper
            hero = soup.new_tag('section', class_='hero')
            hero_black_hole.insert_before(hero)
            hero.append(hero_black_hole)
            # Move hero-black-hole and its siblings into hero
            current = hero_black_hole
            while current:
                next_sibling = current.next_sibling
                if current.name and 'hero' in str(current.get('class', [])).lower():
                    hero.append(current)
                current = next_sibling if next_sibling else None
    
    # Find and keep footer
    footer = body.find('div', class_='footer')
    
    # Clear body
    body.clear()
    
    # Re-add only what we want to keep
    if header:
        print("  Keeping header")
        body.append(header)
    
    if hero:
        print("  Keeping hero section with black hole")
        body.append(hero)
    
    if footer:
        print("  Keeping footer")
        # Clean footer content
        footer_nav = footer.find('div', class_='footer-nav')
        if footer_nav:
            footer_nav.decompose()
        footer_newsletter = footer.find('div', class_='footer-newsletter')
        if footer_newsletter:
            footer_newsletter.decompose()
        footer_social = footer.find('div', class_='footer-social-media')
        if footer_social:
            footer_social.decompose()
        body.append(footer)
    
    # Remove all style blocks that aren't for header, hero, or footer
    print("\nCleaning up style blocks...")
    style_blocks = soup.find_all('style')
    kept_styles = ['header', 'hero', 'footer', 'black-hole', 'button']
    for style in style_blocks:
        style_content = style.string or ''
        # Keep styles for header, hero, footer, black-hole
        if not any(keyword in style_content.lower() for keyword in kept_styles):
            # Check if it's inside a kept section
            parent = style.find_parent(['div', 'section'])
            if parent:
                parent_classes = str(parent.get('class', [])).lower()
                if not any(keyword in parent_classes for keyword in ['header', 'hero', 'footer']):
                    style.decompose()
                    print(f"  Removed style block")
    
    print(f"\nWriting cleaned HTML to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    
    print("Done!")
    
    # Verify what's left
    print("\nFinal structure:")
    if header:
        print("  ✓ Header")
    if hero:
        print("  ✓ Hero section")
        # Check for black hole
        if hero.find('div', class_='hero-black-hole'):
            print("    ✓ Black hole video")
    if footer:
        print("  ✓ Footer")

if __name__ == "__main__":
    final_clean()
