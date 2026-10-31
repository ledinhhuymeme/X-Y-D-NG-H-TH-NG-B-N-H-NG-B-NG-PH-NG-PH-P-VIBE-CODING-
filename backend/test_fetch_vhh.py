import urllib.request
import re

req = urllib.request.Request(
    'https://vuahanghieu.com/gucci/thoi-trang',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)
try:
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    imgs = re.findall(r'https://[^\s"\'<>]+\.(?:jpg|png|webp|jpeg)', html)
    print(f"Total image URLs found: {len(imgs)}")
    prod_imgs = [img for img in imgs if 'product' in img or 'upload' in img]
    print(f"Product images found: {len(prod_imgs)}")
    for img in prod_imgs[:15]:
        print(img)
except Exception as e:
    print("Error:", e)
