#!/usr/bin/env python3
"""
Format the HTML file with proper indentation and comments
"""
import re
from pathlib import Path
from bs4 import BeautifulSoup, Comment

INPUT_FILE = Path(__file__).parent / "template.html"
OUTPUT_FILE = Path(__file__).parent / "template_formatted.html"

def add_section_comments(soup):
    """Add HTML comments to identify major sections"""
    
    # Find and comment header
    header = soup.find('div', class_='header')
    if header:
        comment = Comment(' ============================================\n  HEADER / NAVIGATION\n  ============================================\n  Top navigation bar with REMRIN branding\n  Contains: Logo, navigation menu (removed), mobile toggle\n  ============================================ ')
        header.insert_before(comment)
    
    # Find and comment hero section
    hero = soup.find('section', class_='hero')
    if hero:
        comment = Comment(' ============================================\n  HERO SECTION\n  ============================================\n  Main landing area - currently empty, ready for Ambassador Terminal\n  Contains: Black hole video background, animated circles, stars\n  ============================================ ')
        hero.insert_before(comment)
    
    # Find and comment black hole video
    black_hole = soup.find('div', class_='hero-black-hole')
    if black_hole:
        comment = Comment(' --- Black Hole Video Background --- ')
        black_hole.insert_before(comment)
    
    # Find and comment features section
    features = soup.find('section', class_='features')
    if features:
        comment = Comment(' ============================================\n  FEATURES / BENTO GRID SECTION\n  ============================================\n  Feature cards grid - structure preserved, content emptied\n  Ready to be filled with Remrin features (Soul Layer, Memory, etc.)\n  ============================================ ')
        features.insert_before(comment)
    
    # Find and comment AI section
    ai_section = soup.find('section', class_='ai')
    if ai_section:
        comment = Comment(' ============================================\n  AI SECTION\n  ============================================\n  AI features showcase area\n  Contains: AI background, showcase cards, animations\n  ============================================ ')
        ai_section.insert_before(comment)
    
    # Find and comment video section
    hero_video = soup.find('div', class_='hero-video')
    if hero_video:
        comment = Comment(' ============================================\n  HERO VIDEO SECTION\n  ============================================\n  Video preview/play area\n  ============================================ ')
        hero_video.insert_before(comment)

def format_html():
    print("Reading HTML file...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    print("Parsing HTML...")
    soup = BeautifulSoup(html_content, 'html.parser')
    
    print("Adding section comments...")
    add_section_comments(soup)
    
    print("Formatting HTML with proper indentation...")
    # Use prettify (default indent is 1, which is fine)
    formatted = soup.prettify()
    
    # Clean up excessive blank lines (more than 2 consecutive)
    formatted = re.sub(r'\n{3,}', '\n\n', formatted)
    
    # Add header comment
    header_comment = """<!--
================================================================================
  REMRIN LANDING PAGE TEMPLATE
================================================================================
  This is a cleaned and formatted version of the Reflect landing page clone.
  
  STRUCTURE:
  - Header: Navigation bar with REMRIN branding
  - Hero: Main landing section with black hole video background
  - Features: Bento grid for feature cards (ready to be filled)
  - AI Section: AI features showcase area
  - Video Section: Hero video preview area
  
  NOTES:
  - All tracking scripts and analytics have been removed
  - Reflect branding has been replaced with REMRIN
  - Hero section is empty and ready for Ambassador Terminal
  - Feature cards are empty but structure is preserved
  - Black hole video is integrated and ready to play
  
  CSS:
  - All styles are inline in <style> tags
  - Fonts are loaded from assets/ directory
  - Responsive breakpoints at 1248px and 390px
  
================================================================================
-->

"""
    
    formatted = header_comment + formatted
    
    print(f"Writing formatted HTML to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(formatted)
    
    print("Done! Formatted HTML saved.")
    print(f"\nOriginal size: {len(html_content):,} characters")
    print(f"Formatted size: {len(formatted):,} characters")

if __name__ == "__main__":
    format_html()
