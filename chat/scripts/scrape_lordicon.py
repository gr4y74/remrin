import os
import requests
import json

ICON_DATA = {
  "solid": [
    "https://media.lordicon.com/icons/system/solid/8-account.svg",
    "https://media.lordicon.com/icons/system/solid/31-check.svg",
    "https://media.lordicon.com/icons/system/solid/160-trending-up.svg",
    "https://media.lordicon.com/icons/system/solid/58-call-phone.svg",
    "https://media.lordicon.com/icons/system/solid/23-calendar.svg",
    "https://media.lordicon.com/icons/system/solid/102-wifi.svg",
    "https://media.lordicon.com/icons/system/solid/90-lock-closed.svg",
    "https://media.lordicon.com/icons/system/solid/124-thumb-up.svg",
    "https://media.lordicon.com/icons/system/solid/67-clock.svg",
    "https://media.lordicon.com/icons/system/solid/26-play.svg",
    "https://media.lordicon.com/icons/system/solid/87-hourglass.svg",
    "https://media.lordicon.com/icons/system/solid/89-location.svg",
    "https://media.lordicon.com/icons/system/solid/65-shopping-basket.svg",
    "https://media.lordicon.com/icons/system/solid/80-upload.svg",
    "https://media.lordicon.com/icons/system/solid/79-laptop-computer.svg",
    "https://media.lordicon.com/icons/system/solid/43-pie-chart-diagram.svg",
    "https://media.lordicon.com/icons/system/solid/191-mail-envelope-close.svg",
    "https://media.lordicon.com/icons/system/solid/121-bulb.svg",
    "https://media.lordicon.com/icons/system/solid/29-cross.svg",
    "https://media.lordicon.com/icons/system/solid/113-log-sign-in.svg",
    "https://media.lordicon.com/icons/system/solid/1-share.svg",
    "https://media.lordicon.com/icons/system/solid/5-wallet.svg",
    "https://media.lordicon.com/icons/system/solid/14-article.svg",
    "https://media.lordicon.com/icons/system/solid/22-build.svg",
    "https://media.lordicon.com/icons/system/solid/35-compare.svg",
    "https://media.lordicon.com/icons/system/solid/39-trash.svg",
    "https://media.lordicon.com/icons/system/solid/41-home.svg",
    "https://media.lordicon.com/icons/system/solid/42-search.svg",
    "https://media.lordicon.com/icons/system/solid/44-folder.svg",
    "https://media.lordicon.com/icons/system/solid/46-notification-bell.svg",
    "https://media.lordicon.com/icons/system/solid/48-favorite-heart.svg",
    "https://media.lordicon.com/icons/system/solid/63-settings-cog.svg",
    "https://media.lordicon.com/icons/system/solid/73-world-globe-wikis.svg",
    "https://media.lordicon.com/icons/system/solid/76-newspaper.svg",
    "https://media.lordicon.com/icons/system/solid/81-download-save.svg",
    "https://media.lordicon.com/icons/system/solid/95-star.svg",
    "https://media.lordicon.com/icons/system/solid/100-flag.svg",
    "https://media.lordicon.com/icons/system/solid/105-smartphone.svg",
    "https://media.lordicon.com/icons/system/solid/123-camera.svg",
    "https://media.lordicon.com/icons/system/solid/161-arrow-long-right.svg",
    "https://media.lordicon.com/icons/system/solid/186-chat-empty.svg",
    "https://media.lordicon.com/icons/system/solid/715-spinner-horizontal-dashed-circle.svg",
    "https://media.lordicon.com/icons/system/solid/716-spinner-three-dots.svg",
    "https://media.lordicon.com/icons/system/solid/721-spinner-dots-circle.svg",
    "https://media.lordicon.com/icons/system/solid/734-spinner-spiral.svg",
    "https://media.lordicon.com/icons/system/solid/199-attribution.svg",
    "https://media.lordicon.com/icons/system/solid/198-cut.svg",
    "https://media.lordicon.com/icons/system/solid/196-reply-all.svg",
    "https://media.lordicon.com/icons/system/solid/192-forum.svg",
    "https://media.lordicon.com/icons/system/solid/187-contacts.svg"
  ],
  "regular": [
    "https://media.lordicon.com/icons/system/regular/8-account.svg",
    "https://media.lordicon.com/icons/system/regular/31-check.svg",
    "https://media.lordicon.com/icons/system/regular/160-trending-up.svg",
    "https://media.lordicon.com/icons/system/regular/58-call-phone.svg",
    "https://media.lordicon.com/icons/system/regular/23-calendar.svg",
    "https://media.lordicon.com/icons/system/regular/102-wifi.svg",
    "https://media.lordicon.com/icons/system/regular/90-lock-closed.svg",
    "https://media.lordicon.com/icons/system/regular/124-thumb-up.svg",
    "https://media.lordicon.com/icons/system/regular/67-clock.svg",
    "https://media.lordicon.com/icons/system/regular/26-play.svg",
    "https://media.lordicon.com/icons/system/regular/87-hourglass.svg",
    "https://media.lordicon.com/icons/system/regular/89-location.svg",
    "https://media.lordicon.com/icons/system/regular/65-shopping-basket.svg",
    "https://media.lordicon.com/icons/system/regular/80-upload.svg",
    "https://media.lordicon.com/icons/system/regular/79-laptop-computer.svg",
    "https://media.lordicon.com/icons/system/regular/43-pie-chart-diagram.svg",
    "https://media.lordicon.com/icons/system/regular/191-mail-envelope-close.svg",
    "https://media.lordicon.com/icons/system/regular/121-bulb.svg",
    "https://media.lordicon.com/icons/system/regular/29-cross.svg",
    "https://media.lordicon.com/icons/system/regular/113-log-sign-in.svg",
    "https://media.lordicon.com/icons/system/regular/1-share.svg",
    "https://media.lordicon.com/icons/system/regular/5-wallet.svg",
    "https://media.lordicon.com/icons/system/regular/14-article.svg",
    "https://media.lordicon.com/icons/system/regular/22-build.svg",
    "https://media.lordicon.com/icons/system/regular/35-compare.svg",
    "https://media.lordicon.com/icons/system/regular/39-trash.svg",
    "https://media.lordicon.com/icons/system/regular/41-home.svg",
    "https://media.lordicon.com/icons/system/regular/42-search.svg",
    "https://media.lordicon.com/icons/system/regular/44-folder.svg",
    "https://media.lordicon.com/icons/system/regular/46-notification-bell.svg",
    "https://media.lordicon.com/icons/system/regular/48-favorite-heart.svg",
    "https://media.lordicon.com/icons/system/regular/63-settings-cog.svg",
    "https://media.lordicon.com/icons/system/regular/73-world-globe-wikis.svg",
    "https://media.lordicon.com/icons/system/regular/76-newspaper.svg",
    "https://media.lordicon.com/icons/system/regular/81-download-save.svg",
    "https://media.lordicon.com/icons/system/regular/95-star.svg",
    "https://media.lordicon.com/icons/system/regular/100-flag.svg",
    "https://media.lordicon.com/icons/system/regular/105-smartphone.svg",
    "https://media.lordicon.com/icons/system/regular/123-camera.svg",
    "https://media.lordicon.com/icons/system/regular/161-arrow-long-right.svg",
    "https://media.lordicon.com/icons/system/regular/186-chat-empty.svg",
    "https://media.lordicon.com/icons/system/regular/715-spinner-horizontal-dashed-circle.svg",
    "https://media.lordicon.com/icons/system/regular/716-spinner-three-dots.svg",
    "https://media.lordicon.com/icons/system/regular/721-spinner-dots-circle.svg",
    "https://media.lordicon.com/icons/system/regular/734-spinner-spiral.svg",
    "https://media.lordicon.com/icons/system/regular/199-attribution.svg",
    "https://media.lordicon.com/icons/system/regular/198-cut.svg",
    "https://media.lordicon.com/icons/system/regular/196-reply-all.svg",
    "https://media.lordicon.com/icons/system/regular/192-forum.svg",
    "https://media.lordicon.com/icons/system/regular/187-contacts.svg"
  ]
}

def download_icons():
    base_dir = "public/icons/lordicon"
    
    for style, urls in ICON_DATA.items():
        style_dir = os.path.join(base_dir, style)
        os.makedirs(style_dir, exist_ok=True)
        
        print(f"Downloading {style} icons...")
        for url in urls:
            filename = os.path.basename(url)
            filepath = os.path.join(style_dir, filename)
            
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    with open(filepath, "wb") as f:
                        f.write(response.content)
                    print(f"  ✓ {filename}")
                else:
                    print(f"  ✗ Failed to download {filename} (Status: {response.status_code})")
            except Exception as e:
                print(f"  ✗ Error downloading {filename}: {str(e)}")

if __name__ == "__main__":
    download_icons()
