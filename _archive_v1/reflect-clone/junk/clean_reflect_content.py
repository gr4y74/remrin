#!/usr/bin/env python3
"""
Remove all Reflect mentions and content, keeping only header, black hole section, and footer
"""
import re
from pathlib import Path
from bs4 import BeautifulSoup, Comment

INPUT_FILE = Path(__file__).parent / "template.html"
OUTPUT_FILE = Path(__file__).parent / "template.html"

def clean_reflect_content():
    print("Reading HTML file...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # ===== REMOVE ALL REFLECT MENTIONS =====
    print("Removing all 'Reflect' mentions...")
    reflect_count = 0
    
    # Remove text nodes containing "Reflect"
    for text_node in soup.find_all(string=True):
        if text_node.parent and 'reflect' in text_node.lower():
            # Check if it's not in a script or style tag
            if text_node.parent.name not in ['script', 'style']:
                # Replace Reflect with empty or remove
                new_text = re.sub(r'reflect', '', text_node, flags=re.IGNORECASE)
                text_node.replace_with(new_text)
                reflect_count += 1
    
    # Remove attributes containing "reflect"
    for tag in soup.find_all(True):
        for attr_name, attr_value in list(tag.attrs.items()):
            if isinstance(attr_value, str) and 'reflect' in attr_value.lower():
                if attr_name in ['id', 'class']:
                    # Clean class/id values
                    if isinstance(attr_value, list):
                        tag[attr_name] = [v for v in attr_value if 'reflect' not in v.lower()]
                    else:
                        tag[attr_name] = re.sub(r'reflect', '', attr_value, flags=re.IGNORECASE)
                reflect_count += 1
    
    print(f"  Removed {reflect_count} Reflect mentions")
    
    # ===== REMOVE CONTENT SECTIONS =====
    print("\nRemoving content sections...")
    
    # Remove features section (bento grid)
    features = soup.find('section', class_=re.compile(r'features', re.I))
    if features:
        print("  Removing features section")
        features.decompose()
    
    # Remove AI section
    ai_section = soup.find('section', class_=re.compile(r'^ai$', re.I))
    if ai_section:
        print("  Removing AI section")
        ai_section.decompose()
    
    # Remove hero-video section (the video preview area)
    hero_video = soup.find('div', class_='hero-video')
    if hero_video:
        # Find parent section if it exists
        hero_video_section = hero_video.find_parent('section')
        if hero_video_section:
            print("  Removing hero-video section")
            hero_video_section.decompose()
        else:
            print("  Removing hero-video div")
            hero_video.decompose()
    
    # Remove AI showcase
    ai_showcase = soup.find('div', class_='ai-showcase')
    if ai_showcase:
        print("  Removing AI showcase")
        ai_showcase.decompose()
    
    # Remove AI cards
    ai_cards = soup.find('div', class_='ai-cards')
    if ai_cards:
        print("  Removing AI cards")
        ai_cards.decompose()
    
    # Remove AI background
    ai_background = soup.find('div', class_='ai-background')
    if ai_background:
        print("  Removing AI background")
        ai_background.decompose()
    
    # Remove any section headers with Reflect content
    section_headers = soup.find_all('div', class_='section-header')
    for header in section_headers:
        # Check if it contains Reflect-related content
        text = header.get_text().lower()
        if any(word in text for word in ['reflect', 'notes', 'ai assistant', 'superpowers', 'brain']):
            # Check if it's not in the hero section
            if not header.find_parent('section', class_='hero'):
                print(f"  Removing section header: {text[:50]}...")
                # Remove the entire parent section if it's a section header
                parent_section = header.find_parent('section')
                if parent_section and parent_section.get('class') != ['hero']:
                    parent_section.decompose()
                else:
                    header.decompose()
    
    # Remove ALL sections except hero and footer
    all_sections = soup.find_all('section')
    for section in all_sections:
        section_class = section.get('class', [])
        section_id = section.get('id', '')
        
        # Keep ONLY hero section - remove everything else
        if 'hero' not in str(section_class).lower():
            print(f"  Removing section: {section_class} / {section_id}")
            section.decompose()
    
    # Remove any divs with content-related classes outside hero
    content_divs = soup.find_all('div', class_=re.compile(r'(features|ai-|pricing|about)', re.I))
    for div in content_divs:
        # Make sure it's not inside hero section
        if not div.find_parent('section', class_='hero'):
            print(f"  Removing content div: {div.get('class')}")
            div.decompose()
    
    # ===== CLEAN HERO SECTION CONTENT =====
    print("\nCleaning hero section content...")
    hero = soup.find('section', class_='hero')
    if hero:
        hero_content = hero.find('div', class_='hero-content')
        if hero_content:
            # Remove section-header if it has content
            section_header = hero_content.find('div', class_='section-header')
            if section_header:
                # Check if it has any text content
                if section_header.get_text(strip=True):
                    print("  Removing section-header from hero")
                    section_header.decompose()
            
            # Remove hero-badge if it exists
            hero_badge = hero_content.find('a', class_='hero-badge')
            if hero_badge:
                print("  Removing hero-badge")
                hero_badge.decompose()
            
            # Remove hero description
            hero_desc = hero_content.find('p', class_='hero-description')
            if hero_desc:
                print("  Removing hero-description")
                hero_desc.decompose()
            
            # Remove any h1, h2, h3 with text
            for heading in hero_content.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                if heading.get_text(strip=True):
                    print(f"  Removing heading: {heading.name}")
                    heading.decompose()
    
    # ===== CLEAN FOOTER =====
    print("\nCleaning footer...")
    footer = soup.find('div', class_='footer')
    if footer:
        # Remove all footer navigation links (they point to Reflect)
        footer_nav = footer.find('div', class_='footer-nav')
        if footer_nav:
            print("  Removing footer navigation")
            footer_nav.decompose()
        
        # Remove footer newsletter
        footer_newsletter = footer.find('div', class_='footer-newsletter')
        if footer_newsletter:
            print("  Removing footer newsletter")
            footer_newsletter.decompose()
        
        # Remove social media links that point to Reflect
        footer_social = footer.find('div', class_='footer-social-media')
        if footer_social:
            print("  Removing footer social media")
            footer_social.decompose()
        
        # Clean footer brand text
        footer_brand = footer.find('div', class_='footer-brand')
        if footer_brand:
            for text_node in footer_brand.find_all(string=True):
                if 'reflect' in text_node.lower():
                    text_node.replace_with('')
    
    # ===== REMOVE ORPHANED STYLE BLOCKS =====
    print("\nRemoving orphaned style blocks...")
    # Find all style blocks and check if they're for removed sections
    style_blocks = soup.find_all('style')
    removed_styles = 0
    for style in style_blocks:
        style_content = style.string or ''
        # Check if style is for removed sections
        if any(keyword in style_content.lower() for keyword in [
            '.features', '.ai-cards', '.ai-background', '.ai-showcase',
            '.connected', '.research', '.encryption', '.meetings',
            '.integrations', '.pricing', '.testimonials', '.cta'
        ]):
            # Make sure it's not in hero section
            if not style.find_parent('section', class_='hero'):
                print(f"  Removing style block for removed section")
                style.decompose()
                removed_styles += 1
    
    print(f"  Removed {removed_styles} orphaned style blocks")
    
    # ===== CLEAN UP ANY REMAINING TEXT CONTENT =====
    print("\nCleaning remaining text content...")
    
    # Remove common Reflect-related text patterns
    text_patterns = [
        r'all your notes',
        r'connected',
        r'give your brain superpowers',
        r'what can you do with reflect',
        r'notes with an ai assistant',
        r'never miss a note',
        r'think better',
    ]
    
    for pattern in text_patterns:
        for text_node in soup.find_all(string=re.compile(pattern, re.I)):
            if text_node.parent and text_node.parent.name not in ['script', 'style']:
                # Don't remove if it's in hero black hole section
                if not text_node.find_parent('div', class_='hero-black-hole'):
                    text_node.replace_with('')
    
    # ===== WRITE CLEANED HTML =====
    print(f"\nWriting cleaned HTML to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    
    print("Done! Cleaned HTML saved.")
    print("\nRemaining sections:")
    sections = soup.find_all('section')
    for section in sections:
        print(f"  - {section.get('class')} / {section.get('id')}")

if __name__ == "__main__":
    clean_reflect_content()
