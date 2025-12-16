#!/usr/bin/env python3
"""
Clean up the cloned Reflect landing page - remove trackers, analytics, and Reflect-specific content
"""
import re
from pathlib import Path
from bs4 import BeautifulSoup, Comment

INPUT_FILE = Path(__file__).parent / "reflect_landing.html"
OUTPUT_FILE = Path(__file__).parent / "reflect_landing_clean.html"

def clean_html():
    print("Reading HTML file...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # ===== CLEAN HEAD SECTION =====
    print("Cleaning <head> section...")
    head = soup.find('head')
    if not head:
        print("Warning: No <head> tag found")
    else:
        # Remove tracking scripts
        for script in head.find_all('script'):
            src = script.get('src', '')
            if any(tracker in src.lower() for tracker in ['googletagmanager', 'analytics', 'gtag', 'ga(', 'tracking', 'facebook', 'twitter']):
                print(f"  Removing tracking script: {src[:50]}...")
                script.decompose()
        
        # Remove canonical link
        for link in head.find_all('link', rel='canonical'):
            print("  Removing canonical link")
            link.decompose()
        
        # Remove og: meta tags (unless we want to update them later)
        for meta in head.find_all('meta', property=lambda x: x and x.startswith('og:')):
            print(f"  Removing og: tag: {meta.get('property')}")
            meta.decompose()
        
        # Also remove og: tags by name attribute
        for meta in head.find_all('meta', attrs={'name': lambda x: x and x.startswith('og:')}):
            print(f"  Removing og: tag: {meta.get('name')}")
            meta.decompose()
        
        # Remove apple-mobile-web-app-title if it says Reflect
        for meta in head.find_all('meta', attrs={'name': 'apple-mobile-web-app-title'}):
            if 'reflect' in meta.get('content', '').lower():
                meta.decompose()
                print("  Removed apple-mobile-web-app-title")
        
        # Remove twitter meta tags
        for meta in head.find_all('meta', attrs={'name': re.compile(r'^twitter:')}):
            print(f"  Removing twitter tag: {meta.get('name')}")
            meta.decompose()
        
        # Change title to Remrin.ai
        title = head.find('title')
        if title:
            title.string = "Remrin.ai"
            print("  Changed title to Remrin.ai")
        
        # Remove description meta tags (or update them)
        for meta in head.find_all('meta', attrs={'name': 'description'}):
            meta['content'] = "Remrin - AI-powered digital souls and companions"
            print("  Updated description")
        
        # Keep viewport and charset - they're essential
    
    # ===== CLEAN BODY SECTION =====
    print("\nCleaning <body> section...")
    body = soup.find('body')
    if not body:
        print("Warning: No <body> tag found")
    else:
        # Find and clean header/nav
        header = body.find(['header', 'nav'])
        if not header:
            # Look for header-like divs
            header = body.find('div', class_=re.compile(r'header|nav', re.I))
        
        if header:
            print("  Cleaning header...")
            # Remove logo SVGs and replace with text
            for svg in header.find_all('svg'):
                svg.decompose()
            
            # Remove Login and Sign up links
            for link in header.find_all('a', href=re.compile(r'/auth|/sign-up|login|signup', re.I)):
                link.decompose()
                print("    Removed login/signup link")
            
            # Remove navigation links (Product, Pricing, etc.)
            nav = header.find(['nav', 'ul'], class_=re.compile(r'nav', re.I))
            if nav:
                nav.decompose()
                print("    Removed navigation menu")
            
            # Add REMRIN text if there's a container
            header_container = header.find('div', class_=re.compile(r'container', re.I))
            if not header_container:
                # Try to find any div in header
                header_container = header.find('div')
            if header_container:
                # Remove existing logo/text
                try:
                    for elem in list(header_container.find_all(['a', 'img', 'svg'])):
                        try:
                            elem_class = elem.get('class', []) or []
                            if 'logo' in str(elem_class).lower() or (elem.name == 'svg'):
                                elem.decompose()
                        except (AttributeError, TypeError):
                            continue
                    # Add REMRIN heading
                    h1 = soup.new_tag('h1')
                    h1.string = "REMRIN"
                    h1['style'] = "margin: 0; font-size: 24px; font-weight: 500;"
                    header_container.insert(0, h1)
                    print("    Added REMRIN heading")
                except Exception as e:
                    print(f"    Warning: Could not fully clean header: {e}")
        
        # Find and clean hero section
        hero = body.find('section', class_=re.compile(r'hero', re.I))
        if not hero:
            hero = body.find('div', class_=re.compile(r'hero', re.I))
        
        if hero:
            print("  Cleaning hero section...")
            hero_content = hero.find('div', class_=re.compile(r'hero-content', re.I))
            if hero_content:
                # Remove all text content but keep structure
                for h1 in hero_content.find_all('h1'):
                    h1.decompose()
                for p in hero_content.find_all('p', class_=re.compile(r'hero-description', re.I)):
                    p.decompose()
                for a in hero_content.find_all('a', class_=re.compile(r'hero-badge', re.I)):
                    a.decompose()
                # Keep the container div empty for Ambassador Terminal
                print("    Emptied hero content (ready for Ambassador Terminal)")
        
        # Find and clean feature/bento grid sections
        # Look for grid-like containers
        grids = body.find_all(['div', 'section'], class_=re.compile(r'grid|bento|feature', re.I))
        for grid in grids:
            print(f"  Found grid section: {grid.get('class')}")
            # Keep container structure, remove content
            for card in grid.find_all(['div', 'article'], class_=re.compile(r'card|item|feature', re.I)):
                # Clear content but keep the card element
                card.clear()
                card['class'] = card.get('class', []) + ['empty-card']
                print(f"    Emptied card: {card.get('class')}")
        
        # Remove all scripts at the bottom
        print("  Removing scripts...")
        scripts_removed = 0
        for script in body.find_all('script'):
            src = script.get('src', '')
            # Remove Qwik hydration scripts, React scripts, etc.
            if any(bad in src.lower() for bad in ['q-', 'qwik', 'react', 'hydrate', 'entry']):
                script.decompose()
                scripts_removed += 1
            elif script.string and any(bad in script.string.lower() for bad in ['qwik', 'hydrate', 'react']):
                script.decompose()
                scripts_removed += 1
        
        print(f"    Removed {scripts_removed} scripts")
    
    # Remove all Qwik-specific attributes (q:key, q:id, etc.)
    print("\nRemoving Qwik framework attributes...")
    for tag in soup.find_all(True):
        attrs_to_remove = [attr for attr in tag.attrs if attr.startswith('q:') or attr.startswith('on:')]
        for attr in attrs_to_remove:
            del tag[attr]
    
    # Remove Qwik comments
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        if 'qv' in str(comment) or 'q:' in str(comment):
            comment.extract()
    
    # Write cleaned HTML
    print(f"\nWriting cleaned HTML to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    
    print("Done! Cleaned HTML saved.")

if __name__ == "__main__":
    clean_html()
