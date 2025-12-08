#!/usr/bin/env python3
"""
Final cleanup - remove all Reflect content, keep only header, hero (with black hole), and footer
"""
import re
from pathlib import Path
from bs4 import BeautifulSoup

INPUT_FILE = Path(__file__).parent / "template.html"
OUTPUT_FILE = Path(__file__).parent / "template.html"

def final_cleanup():
    print("Reading HTML file...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    body = soup.find('body')
    
    if not body:
        print("ERROR: No body tag found!")
        return
    
    print("\n=== STEP 1: Remove all Reflect text mentions ===")
    reflect_count = 0
    for text_node in soup.find_all(string=True):
        if text_node.parent and text_node.parent.name not in ['script', 'style']:
            text_lower = text_node.lower()
            if 'reflect' in text_lower:
                # Replace with empty string
                text_node.replace_with('')
                reflect_count += 1
    
    print(f"  Removed {reflect_count} Reflect text mentions")
    
    print("\n=== STEP 2: Remove all content sections except hero ===")
    
    # Find all sections
    all_sections = body.find_all('section')
    for section in all_sections:
        section_class = section.get('class', [])
        # Keep ONLY hero section
        if 'hero' not in str(section_class).lower():
            print(f"  Removing section: {section_class}")
            section.decompose()
    
    # Remove any divs that are content sections (not in hero or footer)
    content_keywords = ['features', 'ai-', 'connected', 'research', 'encryption', 
                       'meetings', 'integrations', 'pricing', 'testimonials', 
                       'about', 'cta', 'tetris', 'hero-video']
    
    for keyword in content_keywords:
        divs = body.find_all('div', class_=re.compile(keyword, re.I))
        for div in divs:
            # Make sure it's not inside hero or footer
            if not div.find_parent(['section', 'div'], class_=re.compile(r'hero|footer', re.I)):
                print(f"  Removing content div: {keyword}")
                div.decompose()
    
    print("\n=== STEP 3: Clean hero section content ===")
    hero = body.find('section', class_='hero')
    if hero:
        hero_content = hero.find('div', class_='hero-content')
        if hero_content:
            # Remove empty section-header
            section_header = hero_content.find('div', class_='section-header')
            if section_header and not section_header.get_text(strip=True):
                section_header.decompose()
                print("  Removed empty section-header")
            
            # Remove any headings
            for heading in hero_content.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                heading.decompose()
                print("  Removed heading")
            
            # Remove hero-badge
            hero_badge = hero_content.find('a', class_='hero-badge')
            if hero_badge:
                hero_badge.decompose()
                print("  Removed hero-badge")
            
            # Remove hero-description
            hero_desc = hero_content.find('p', class_='hero-description')
            if hero_desc:
                hero_desc.decompose()
                print("  Removed hero-description")
    
    print("\n=== STEP 4: Remove Reflect-related text patterns ===")
    patterns = [
        r'all your notes',
        r'connected',
        r'give your brain superpowers',
        r'what can you do',
        r'notes with an ai',
        r'never miss a note',
        r'think better',
        r'use gpt',
        r'whisper',
        r'openai',
        r'intellectual thought partner',
    ]
    
    for pattern in patterns:
        for text_node in soup.find_all(string=re.compile(pattern, re.I)):
            if text_node.parent and text_node.parent.name not in ['script', 'style']:
                # Don't remove if it's in hero black hole section
                if not text_node.find_parent('div', class_='hero-black-hole'):
                    text_node.replace_with('')
    
    print("\n=== STEP 5: Clean footer ===")
    footer = body.find('div', class_='footer')
    if footer:
        # Remove footer navigation
        footer_nav = footer.find('div', class_='footer-nav')
        if footer_nav:
            footer_nav.decompose()
            print("  Removed footer navigation")
        
        # Remove footer newsletter
        footer_newsletter = footer.find('div', class_='footer-newsletter')
        if footer_newsletter:
            footer_newsletter.decompose()
            print("  Removed footer newsletter")
        
        # Remove social media
        footer_social = footer.find('div', class_='footer-social-media')
        if footer_social:
            footer_social.decompose()
            print("  Removed footer social media")
        
        # Clean footer links that point to Reflect
        for link in footer.find_all('a', href=True):
            href = link.get('href', '')
            if 'reflect' in href.lower():
                link.decompose()
                print(f"  Removed Reflect link: {href[:50]}")
    
    print("\n=== STEP 6: Remove orphaned style blocks ===")
    style_blocks = soup.find_all('style')
    removed = 0
    for style in style_blocks:
        style_content = style.string or ''
        # Check if style is for removed sections
        if any(keyword in style_content.lower() for keyword in [
            '.features', '.ai-cards', '.ai-background', '.ai-showcase',
            '.connected', '.research', '.encryption', '.meetings',
            '.integrations', '.pricing', '.testimonials', '.cta',
            '.hero-video', '.tetris', '.about'
        ]):
            # Make sure it's not in hero section
            if not style.find_parent('section', class_='hero'):
                style.decompose()
                removed += 1
    
    print(f"  Removed {removed} orphaned style blocks")
    
    print("\n=== STEP 7: Remove Qwik scripts ===")
    scripts = body.find_all('script')
    for script in scripts:
        script_content = script.string or ''
        script_src = script.get('src', '')
        # Remove Qwik-related scripts
        if 'qwik' in script_content.lower() or 'qwik' in script_src.lower() or 'qFuncs' in script_content:
            script.decompose()
            print("  Removed Qwik script")
    
    print(f"\nWriting cleaned HTML to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    
    print("Done!")
    
    # Final verification
    print("\n=== FINAL STRUCTURE ===")
    if body.find('div', class_='header'):
        print("  ✓ Header")
    hero = body.find('section', class_='hero')
    if hero:
        print("  ✓ Hero section")
        if hero.find('div', class_='hero-black-hole'):
            print("    ✓ Black hole video container")
        if hero.find('video'):
            print("    ✓ Black hole video element")
    if body.find('div', class_='footer'):
        print("  ✓ Footer")
    
    # Count remaining sections
    remaining_sections = body.find_all('section')
    print(f"\nRemaining sections: {len(remaining_sections)}")
    for section in remaining_sections:
        print(f"  - {section.get('class')}")

if __name__ == "__main__":
    final_cleanup()
