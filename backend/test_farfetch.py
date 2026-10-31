import urllib.request
import re

url = "https://www.farfetch.com/shopping/men/gucci/polos-2/items.aspx"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
try:
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
    imgs = re.findall(r'https://cdn-images\.farfetch-contents\.com/[^\s"\'<>]+\.jpg', html)
    print(f"Farfetch images found: {len(imgs)}")
    for img in imgs[:5]:
        print(img)
except Exception as e:
    print("Error:", e)
