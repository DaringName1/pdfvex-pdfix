"""Generate synthetic real PDFs for reading/permission tests; no user data."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from pypdf.constants import UserAccessPermissions
import io

root = Path(__file__).resolve().parent.parent / 'tests' / 'fixtures'
root.mkdir(parents=True, exist_ok=True)
target = root / 'reading-sample.pdf'
c = canvas.Canvas(str(target), pagesize=(612, 792))
c.setTitle('PDFix reading fixture — synthetic maintenance guide')
pages = [
    ('A little clarity for your paperwork', 'Welcome to PDFix', ['This is a synthetic PDF fixture, created for PDFix tests.', 'No private documents or customer records are included.', 'Select this sentence or search for the word welcome.']),
    ('Regular inspection', 'Maintenance & operating guide', ['Inspect the oil level before each long journey.', 'Replace the oil every 5,000 miles or six months.', 'Keep a dated service record for future reference.']),
    ('Service record', 'A record worth keeping', ['Service completed at 4,800 miles on September 14.', 'Oil and filter replaced; inspection completed.', 'Next service is due at approximately 9,800 miles.'])
]
for i, (title, subtitle, lines) in enumerate(pages):
    c.setFillColor(colors.HexColor('#4b7b62')); c.roundRect(44, 699, 37, 39, 9, fill=1, stroke=0)
    c.setFillColor(colors.white); c.setFont('Helvetica-Bold', 25); c.drawString(55, 708, 'f')
    c.setFillColor(colors.HexColor('#263b34')); c.setFont('Helvetica-Bold', 23); c.drawString(48, 650, title)
    c.setFillColor(colors.HexColor('#789184')); c.setFont('Helvetica', 12); c.drawString(48, 623, subtitle)
    c.setStrokeColor(colors.HexColor('#dce6dd')); c.line(48, 604, 564, 604)
    c.setFillColor(colors.HexColor('#405b49')); c.setFont('Helvetica', 13)
    for j, line in enumerate(lines): c.drawString(48, 558 - 30*j, line)
    c.setFillColor(colors.HexColor('#f1f6ee')); c.roundRect(48, 361, 516, 72, 8, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#5c7d63')); c.setFont('Helvetica', 11); c.drawString(65, 405, 'A real PDF. Rendered locally. Original unchanged.')
    c.setFont('Helvetica', 9); c.drawString(65, 385, 'Synthetic example content — not advice or an actual service record.')
    c.setFillColor(colors.HexColor('#819587')); c.setFont('Helvetica', 9); c.drawString(48, 46, f'PDFIX TEST FIXTURE  |  PAGE {i+1} OF 3')
    c.showPage()
c.save()

image = Image.new('RGB', (1224, 1584), '#fffdf6'); draw = ImageDraw.Draw(image)
font_file = Path('C:/Windows/Fonts/arial.ttf')
font = ImageFont.truetype(str(font_file), 36) if font_file.exists() else ImageFont.load_default()
draw.text((96, 130), 'SCANNED MAINTENANCE GUIDE', fill='#303b30', font=font)
draw.text((96, 260), 'Replace the oil every 5,000 miles.', fill='#303b30', font=font)
draw.text((96, 330), 'Check the filter before a long journey.', fill='#303b30', font=font)
image.save(root / 'scan-page.png')
c = canvas.Canvas(str(root / 'scan-only.pdf'), pagesize=(612, 792)); c.drawImage(ImageReader(image), 0, 0, 612, 792); c.save()

reader = PdfReader(target)
for name, permissions in [('password.pdf', UserAccessPermissions.PRINT | UserAccessPermissions.EXTRACT | UserAccessPermissions.PRINT_TO_REPRESENTATION), ('restricted.pdf', UserAccessPermissions.PRINT)]:
    writer = PdfWriter(); writer.append(reader)
    writer.encrypt('pdfix-test', 'owner-test-secret', permissions_flag=permissions, algorithm='RC4-128')
    with (root / name).open('wb') as out: writer.write(out)
(root / 'damaged.pdf').write_bytes(b'%PDF-1.7\ninvalid object data\n%%EOF')
print(f'Generated PDF corpus in {root}')

# Deliberately interleaved content stream; each visible column remains coherent.
c = canvas.Canvas(str(root / 'awkward-columns.pdf'), pagesize=(612, 792))
c.setFont('Helvetica', 12)
for i, (left, right) in enumerate([('Left first line', 'Right first line'), ('Left second line', 'Right second line'), ('Left third line', 'Right third line')]):
    y = 690 - i * 30
    c.drawString(340, y, right)
    c.drawString(50, y, left)
c.save()
