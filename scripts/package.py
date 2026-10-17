"""Build an uploadable WordPress plugin, without developer dependencies or test data."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / 'dist' / 'golffun-1.0.0.zip'
output.parent.mkdir(exist_ok=True)
files = [root / name for name in ['golf-fun.php', 'uninstall.php', 'readme.txt', 'LICENSE']]
files += sorted((root / 'assets').rglob('*'))
files += sorted((root / 'includes').rglob('*'))
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in files:
        if file.is_file():
            archive.write(file, Path('golf-fun') / file.relative_to(root))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert 'golf-fun/golf-fun.php' in archive.namelist()
print(f'{output} ({output.stat().st_size:,} bytes)')
