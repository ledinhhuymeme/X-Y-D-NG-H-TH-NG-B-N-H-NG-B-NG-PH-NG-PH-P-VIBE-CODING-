import urllib.request
import re
import json

urls = [
    'https://vuahanghieu.com/gucci/thoi-trang',
    'https://vuahanghieu.com/gucci/giay-dep',
    'https://vuahanghieu.com/gucci/tui-xach'
]

products = []
for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        
        # Regex tìm card sản phẩm
        # thường là <a href="..." title="..."> kèm ảnh <img data-src="..." hoặc src="..." alt="...">
        imgs = re.findall(r'<img[^>]+(?:data-src|src)=["\'](https://[^"\']+)["\'][^>]*alt=["\']([^"\']+)["\']', html)
        for src, alt in imgs:
            if 'gucci' in alt.lower() and ('upload/product' in src or 'cdn.vuahanghieu' in src):
                products.append({'name': alt, 'img': src})
    except Exception as e:
        print("Error fetching:", u, e)

print(f"Total: {len(products)}")
with open('gucci_crawl.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)
print("Saved to gucci_crawl.json")
