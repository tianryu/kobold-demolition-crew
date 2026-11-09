"""从 @fontsource/noto-serif-sc 的 700 字重提取游戏界面字形。"""
import re
import sys
from pathlib import Path
from shutil import copyfile
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
package = Path(sys.argv[1])
out = root / 'assets' / 'fonts'
corpus = ''.join(p.read_text() for p in (root / 'src').glob('*.mjs'))
wanted = {ord(c) for c in corpus if ord(c) >= 32}
css = []
for source in sorted((package / 'files').glob('*-700-normal.woff2')):
    font = TTFont(source)
    supported = wanted & font.getBestCmap().keys()
    if not supported:
        continue
    options = subset.Options()
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=supported)
    sub.subset(font)
    filename = 'crew-' + source.name.removeprefix('noto-serif-sc-').replace('-700-normal', '')
    font.save(out / filename)
    ranges = ','.join(f'U+{value:X}' for value in sorted(supported))
    css.append(f"@font-face {{font-family:'Crew Serif';font-weight:500 900;font-display:swap;src:url('{filename}') format('woff2');unicode-range:{ranges}}}")
    wanted -= supported
(out / 'crew-font.css').write_text('\n'.join(css) + '\n')
copyfile(package / 'LICENSE', out / 'OFL-Noto-Serif-SC.txt')
