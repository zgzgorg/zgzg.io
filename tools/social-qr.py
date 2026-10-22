# 给页脚的国内社交平台生成二维码 images/social/qr/<key>.webp。
#
# 做法：读 _data/social.yml 里每一个带 qr 的平台的 key 和 qr，用最高容错等级 H
# 生成二维码，中间叠上圆形社区 logo（images/zgzglogo.png），存成无损 WebP。
#
# 用法（需要 qrcode 和 Pillow）：
#   pip install "qrcode[pil]"
#   python3 tools/social-qr.py
#
# 增加平台或者改了二维码地址之后，重新跑一遍，把生成的图片一起提交。

import re
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / '_data' / 'social.yml'
OUT = ROOT / 'images' / 'social' / 'qr'
LOGO = Image.open(ROOT / 'images' / 'zgzglogo.png').convert('RGBA')

text = DATA.read_text()
for key, url in re.findall(r'key: (\w+),.*?qr: "([^"]+)"', text):
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H,
                       box_size=12, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=(31, 20, 21), back_color='white').convert('RGBA')
    size = img.width
    # logo 宽度约占二维码边长的 22%，外面垫一圈白色圆底
    w = round(size * 0.22)
    logo = LOGO.resize((w, round(LOGO.height * w / LOGO.width)), Image.LANCZOS)
    d = max(logo.size) + 2 * round(w * 0.12)
    disc = Image.new('RGBA', (d, d), (0, 0, 0, 0))
    ImageDraw.Draw(disc).ellipse((0, 0, d - 1, d - 1), fill='white')
    img.alpha_composite(disc, ((size - d) // 2, (size - d) // 2))
    img.alpha_composite(logo, ((size - logo.width) // 2, (size - logo.height) // 2))
    out = OUT / (key + '.webp')
    img.convert('RGB').save(out, 'WEBP', lossless=True, method=6)
    print('%s: %s (%dpx)' % (out.relative_to(ROOT), url, size))
