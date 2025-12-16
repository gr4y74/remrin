#!/usr/bin/env python3
"""
Script to download Reflect.app landing page with all assets for offline viewing
"""
import os
import re
import requests
from urllib.parse import urljoin, urlparse
from pathlib import Path
from bs4 import BeautifulSoup
import json

BASE_URL = "https://reflect.app"
OUTPUT_DIR = Path(__file__).parent
DOWNLOADED_URLS = set()

def sanitize_filename(url):
    """Convert URL to a safe filename"""
    parsed = urlparse(url)
    path = parsed.path.strip('/')
    if not path:
        path = 'index.html'
    # Replace slashes and special chars
    path = path.replace('/', '_').replace('?', '_').replace('&', '_')
    return path

def download_file(url, local_path):
    """Download a file and save it locally"""
    if url in DOWNLOADED_URLS:
        return local_path
    
    try:
        print(f"Downloading: {url}")
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        # Create directory if needed
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save file
        with open(local_path, 'wb') as f:
            f.write(response.content)
        
        DOWNLOADED_URLS.add(url)
        return local_path
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return None

def find_and_download_assets(soup, html_content, base_url):
    """Find all asset URLs in HTML and download them"""
    assets_dir = OUTPUT_DIR / "assets"
    assets_dir.mkdir(exist_ok=True)
    
    replacements = {}
    
    # Find all CSS files
    for link in soup.find_all('link', rel='stylesheet'):
        href = link.get('href')
        if href:
            full_url = urljoin(base_url, href)
            if full_url.startswith(BASE_URL):
                local_path = assets_dir / sanitize_filename(href)
                if download_file(full_url, local_path):
                    replacements[href] = f"assets/{local_path.name}"
    
    # Find style tags with data-src
    for style in soup.find_all('style', {'data-src': True}):
        src = style.get('data-src')
        if src:
            full_url = urljoin(base_url, src)
            if full_url.startswith(BASE_URL):
                local_path = assets_dir / sanitize_filename(src)
                if download_file(full_url, local_path):
                    # Replace in content
                    html_content = html_content.replace(
                        f'data-src="{src}"',
                        f'data-src="assets/{local_path.name}"'
                    )
    
    # Find all JS files
    for script in soup.find_all('script', src=True):
        src = script.get('src')
        if src:
            full_url = urljoin(base_url, src)
            if full_url.startswith(BASE_URL):
                local_path = assets_dir / sanitize_filename(src)
                if download_file(full_url, local_path):
                    replacements[src] = f"assets/{local_path.name}"
    
    # Find all images
    for img in soup.find_all('img', src=True):
        src = img.get('src')
        if src and not src.startswith('data:'):
            full_url = urljoin(base_url, src)
            if full_url.startswith(BASE_URL):
                local_path = assets_dir / sanitize_filename(src)
                if download_file(full_url, local_path):
                    replacements[src] = f"assets/{local_path.name}"
    
    # Find images in meta tags
    for meta in soup.find_all('meta', content=True):
        content = meta.get('content')
        if content and content.startswith('http'):
            full_url = urljoin(base_url, content)
            if full_url.startswith(BASE_URL):
                local_path = assets_dir / sanitize_filename(content)
                if download_file(full_url, local_path):
                    replacements[content] = f"assets/{local_path.name}"
    
    # Find fonts in CSS
    font_pattern = re.compile(r'url\(([^)]+)\)')
    for style in soup.find_all('style'):
        css_content = style.string or ''
        for match in font_pattern.finditer(css_content):
            font_url = match.group(1).strip('"\'')
            if font_url.startswith('/') or font_url.startswith('http'):
                full_url = urljoin(base_url, font_url)
                if full_url.startswith(BASE_URL):
                    local_path = assets_dir / sanitize_filename(font_url)
                    if download_file(full_url, local_path):
                        replacements[font_url] = f"assets/{local_path.name}"
    
    # Apply replacements to HTML
    for old_url, new_path in replacements.items():
        html_content = html_content.replace(old_url, new_path)
    
    return html_content

def main():
    print("Downloading Reflect.app landing page...")
    
    # Download main HTML
    response = requests.get(BASE_URL, headers={
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    })
    response.raise_for_status()
    
    html_content = response.text
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Download all assets
    print("\nDownloading assets...")
    html_content = find_and_download_assets(soup, html_content, BASE_URL)
    
    # Save updated HTML
    output_file = OUTPUT_DIR / "reflect_landing.html"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"\nDone! Saved to: {output_file}")
    print(f"Downloaded {len(DOWNLOADED_URLS)} assets")

if __name__ == "__main__":
    main()
