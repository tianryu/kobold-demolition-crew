"""从生成原稿裁切独立纹理并压缩 WebP。需安装 Pillow。"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'docs' / 'art-source'
target = root / 'assets' / 'art'


def read(name):
    return Image.open(source / f'{name}.png')


def export(image, name, size, quality=86):
    image.thumbnail(size, Image.Resampling.LANCZOS)
    image.save(target / f'{name}.webp', 'WEBP', quality=quality, method=6, alpha_quality=92)


def cut(image, bounds, name, size):
    asset = image.crop(bounds)
    if asset.mode == 'RGBA':
        alpha = asset.getchannel('A')
        box = alpha.point(lambda x: 255 if x > 32 else 0).getbbox()
        assert box, name
        asset = asset.crop((
            max(0, box[0] - 3), max(0, box[1] - 3),
            min(asset.width, box[2] + 3), min(asset.height, box[3] + 3),
        ))
    export(asset, name, size)


def sheet(name, names, columns, rows, size):
    image = read(name)
    for i, sprite in enumerate(names):
        row, col = divmod(i, len(columns) - 1)
        cut(image, (columns[col], rows[row], columns[col + 1], rows[row + 1]), sprite, size)


target.mkdir(parents=True, exist_ok=True)
field = read('field')
export(field.crop((0, 0, 1672, 614)), 'sky', (1500, 620), 84)
export(field.crop((0, 614, 1672, 941)), 'earth', (1500, 320), 85)
export(read('workshop'), 'workshop', (1600, 900), 88)
title = read('title')
cut(title, (0, 0, *title.size), 'title', (1150, 410))
sheet('objects', ['tower', 'vault', 'vault-open', 'shed', 'barrel', 'cargo', 'gate', 'rubble',
                  'foot', 'brace', 'miner', 'cache'], [0, 361, 724, 1092, 1448], [0, 391, 734, 1086], (335, 360))
sheet('ui', ['shovel', 'brace-icon', 'coin', 'scent', 'yes', 'no', 'contract', 'ledger',
             'dust', 'blast', 'lock', 'gear'], [0, 365, 725, 1093, 1448], [0, 373, 724, 1086], (190, 190))
sheet('terrain', ['tunnel', 'portal', 'socket', 'sign', 'wall', 'paper'], [0, 510, 1024, 1536],
      [0, 512, 1024], (480, 385))
export(read('terrain').crop((26, 183, 487, 382)), 'tunnel', (460, 210))
export(read('terrain').crop((1139, 761, 1439, 827)).convert('RGB'), 'paper-grain', (300, 66), 84)
dig = read('dig')
for i in range(4):
    x = i * 543
    # 帧共用裁切框与底边，避免挥铲时人物随纹理边界跳位。
    export(dig.crop((x + 37, 127, x + 518, 571)), f'dig-{i + 1}', (240, 225))

for name in ('gantry', 'iron'):
    sprite = read(name)
    cut(sprite, (0, 0, *sprite.size), name, (340, 325))

# 五十关扩展：保留生成 alpha，钟楼使用较高纹理避免长建筑模糊。
for name in ('bulwark', 'platform', 'boulder', 'spring', 'bellhouse', 'bridge', 'powderhouse', 'watertower', 'cottage'):
    sprite = read(name)
    cut(sprite, (0, 0, *sprite.size), name, (420, 520))
