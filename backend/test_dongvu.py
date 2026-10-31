import urllib.request
import re

url = "https://dongvu.vn/danh-muc-san-pham/quan-ao/brand-gucci/"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
    imgs = re.findall(r'https://dongvu\.vn/wp-content/uploads/[^\s"\'<>]+\.(?:jpg|png|webp)', html)
    print("Dongvu images found:", len(imgs))
    for i in list(set(imgs))[:10]:
        print(i)
except Exception as e:
    print("Error:", e)
