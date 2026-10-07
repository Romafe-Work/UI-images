#!/usr/bin/env python3
"""Lê os ecrãs das três apps e escreve catalogo.js, que a página de
entrada usa para procurar. Correr depois de acrescentar ou mudar ecrãs:

    python3 catalogo.py
"""
import html, json, re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
APPS = [
    ('erp', 'ERP', 'Rolgest, a plataforma de gestão'),
    ('web', 'Web', 'Para abrir no navegador'),
    ('mobile', 'Mobile', 'Para o telemóvel e o PDA'),
]
ECRA = re.compile(r'<div class="ecra"([^>]*)>', re.S)
ATRIB = re.compile(r'data-([a-z-]+)="([^"]*)"', re.S)

apps = []
for pasta, nome, sub in APPS:
    pagina = RAIZ / pasta / 'index.html'
    ecras = []
    if pagina.exists():
        for m in ECRA.finditer(pagina.read_text(encoding='utf-8')):
            a = {k: html.unescape(' '.join(v.split())) for k, v in ATRIB.findall(m.group(1))}
            if 'ecra' in a:
                ecras.append({k: a.get(k, '') for k in ('ecra', 'nome', 'fluxo', 'objetivo')})
    apps.append({'pasta': pasta, 'nome': nome, 'sub': sub, 'ecras': ecras})

(RAIZ / 'catalogo.js').write_text(
    '/* Gerado por catalogo.py — não editar à mão. */\n'
    'window.CATALOGO = ' + json.dumps(apps, ensure_ascii=False, indent=1) + ';\n',
    encoding='utf-8')
for a in apps:
    print(f"{a['nome']:7} {len(a['ecras'])} ecrãs")
