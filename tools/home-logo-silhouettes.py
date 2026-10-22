# 给首页 logo 滚动条生成单色轮廓拼图 images/home-logos/silhouettes.webp。
#
# 做法：按 _data/home-logos.yml 里的顺序，把每个 WebP logo 缩成 24px 高，
# 非白、非透明的像素涂成浅灰色，其余像素透明，然后横向拼成一张图。
# 每个 logo 在拼图里的横坐标写回 _data/home-logos.yml 的 sx 字段，
# 拼图的总宽度写回 silhouettes_width 字段。
# 页面先用这张很小的拼图显示 logo 的轮廓，原图下载好之后再盖上去。
# SVG logo 本身很小，不进拼图。
#
# 用法（需要 Pillow）：
#   python3 tools/home-logo-silhouettes.py
#
# 增删或者替换 logo 之后，重新跑一遍，把拼图和 _data/home-logos.yml 一起提交。

import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / '_data' / 'home-logos.yml'
LOGOS = ROOT / 'images' / 'home-logos'
OUT = LOGOS / 'silhouettes.webp'
HEIGHT = 24
COLOR = (208, 212, 218)

lines = DATA.read_text().splitlines(keepends=True)
tiles = {}
x = 0
for line in lines:
    m = re.search(r'file: ([\w.-]+\.webp)', line)
    if not m or m.group(1) in tiles:
        continue
    im = Image.open(LOGOS / m.group(1)).convert('RGBA')
    w = max(1, round(im.width * HEIGHT / im.height))
    im = im.resize((w, HEIGHT), Image.LANCZOS)
    white = Image.new('RGBA', im.size, (255, 255, 255, 255))
    white.alpha_composite(im)
    shape = white.convert('L').point(lambda v: 255 if v < 200 else 0)
    opaque = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    mask = Image.composite(shape, Image.new('L', im.size, 0), opaque)
    tiles[m.group(1)] = (x, mask)
    x += w

sheet = Image.new('RGBA', (x, HEIGHT), COLOR + (0,))
for left, mask in tiles.values():
    sheet.paste(Image.new('RGBA', mask.size, COLOR + (255,)), (left, 0), mask)
sheet.save(OUT, 'WEBP', lossless=True, method=6)


def add_sx(line):
    m = re.search(r'file: ([\w.-]+\.webp)', line)
    line = re.sub(r', sx: \d+', '', line)
    if not m:
        return line
    return line.replace(' }', ', sx: %d }' % tiles[m.group(1)][0], 1)


text = ''.join(add_sx(line) for line in lines)
text = re.sub(r'silhouettes_width: \d+', 'silhouettes_width: %d' % x, text)
DATA.write_text(text)
print('%s: %d 个 logo，宽 %dpx，%d 字节' % (
    OUT.relative_to(ROOT), len(tiles), x, OUT.stat().st_size))
