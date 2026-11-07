"""Static deploy-artifact gate. Run with Python 3 + Node.js; no package installation."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, subprocess, tempfile
ROOT = Path(__file__).resolve().parents[1]
html = (ROOT/'public/index.html').read_text(encoding='utf-8')
meta = json.loads((ROOT/'public/version.json').read_text(encoding='utf-8'))
assert hashlib.sha256(html.encode()).hexdigest() == meta['html_sha256'], 'stale or modified deploy artifact'
assert f'content="{meta["version"]}"' in html, 'missing actual build identity'
for token in ["gantt:'Диаграмма Ганта'", 'function ganttChart(', 'function ganttView(',
              'function ganttPresent(', 'function ganttMissing(', "c9.page==='gantt'",
              "c9Field('startDate'", 'startDate', 'data-page="gantt"', 'clusterboard-functional-demo-v03']:
    assert token in html, 'missing Gantt dependency: '+token
class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(); self.inside=False; self.parts=[]
    def handle_starttag(self, tag, attrs):
        if tag=='script': self.inside=True; self.parts.append('')
    def handle_endtag(self, tag):
        if tag=='script': self.inside=False
    def handle_data(self, value):
        if self.inside: self.parts[-1]+=value
s=Scripts(); s.feed(html)
assert len(s.parts)>=2
with tempfile.TemporaryDirectory() as tmp:
    for i,code in enumerate(s.parts):
        path=Path(tmp)/f'inline-{i}.js'; path.write_text(code, encoding='utf-8')
        subprocess.run(['node','--check',str(path)], check=True)
print('Deployment checks OK:',meta['version'],len(s.parts),'scripts')
