/* =========================================================
   ERP — um .xlsx verdadeiro, sem bibliotecas (23 out. 2026), para «Exportar para Excel — F4».
   Um livro com uma folha: a primeira linha são os nomes das colunas (a negrito, presa); os números vão como números,
   as datas como datas (dd/mm/aaaa) e os euros com o formato «# ##0,00 €». O ficheiro é um ZIP sem compressão
   (método 0), que é o que o Excel e o LibreOffice abrem.
   ========================================================= */
export type Celula = string | number | { data: string } | { euros: number } | { pct: number } | null;
export interface Folha { nome: string; colunas: string[]; linhas: Celula[][]; larguras?: number[] }

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const col = (i: number): string => (i >= 26 ? col(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));
/** Dias desde 30/12/1899 (o número de série das datas no Excel). */
const serie = (iso: string) => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(1899, 11, 30)) / 864e5);

function folhaXml(f: Folha): string {
  const cel = (c: Celula, r: number, i: number): string => {
    const ref = `${col(i)}${r}`;
    if (c === null || c === '') return '';
    if (typeof c === 'number') return `<c r="${ref}" s="3"><v>${c}</v></c>`;
    if (typeof c === 'string') return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(c)}</t></is></c>`;
    if ('data' in c) return `<c r="${ref}" s="1"><v>${serie(c.data)}</v></c>`;
    if ('pct' in c) return `<c r="${ref}" s="5"><v>${c.pct}</v></c>`;
    return `<c r="${ref}" s="2"><v>${(c.euros / 100).toFixed(2)}</v></c>`;
  };
  const cab = `<row r="1">${f.colunas.map((t, i) => `<c r="${col(i)}1" t="inlineStr" s="4"><is><t>${xml(t)}</t></is></c>`).join('')}</row>`;
  const corpo = f.linhas.map((l, k) => `<row r="${k + 2}">${l.map((c, i) => cel(c, k + 2, i)).join('')}</row>`).join('');
  const larg = (f.larguras ?? f.colunas.map((t) => Math.max(10, t.length + 4))).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${larg}</cols><sheetData>${cab}${corpo}</sheetData><autoFilter ref="A1:${col(f.colunas.length - 1)}${f.linhas.length + 1}"/></worksheet>`;
}
const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="#,##0.00\\ &quot;€&quot;"/><numFmt numFmtId="166" formatCode="+0.0%;-0.0%;0.0%"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="6"><xf/><xf numFmtId="164" applyNumberFormat="1"/><xf numFmtId="165" applyNumberFormat="1"/><xf numFmtId="3" applyNumberFormat="1"/><xf fontId="1" applyFont="1"/><xf numFmtId="166" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

/* ---------- o ZIP (sem compressão) ---------- */
const TAB = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Uint8Array) => { let c = 0xffffffff; for (const x of b) c = TAB[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(ficheiros: [string, string][]): Blob {
  const enc = new TextEncoder(), partes: Uint8Array[] = [], central: Uint8Array[] = []; let pos = 0;
  for (const [nome, texto] of ficheiros) {
    const n = enc.encode(nome), d = enc.encode(texto), c = crc32(d);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true); h.setUint32(14, c, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, n.length, true);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, c, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, n.length, true); ch.setUint32(42, pos, true);
    partes.push(new Uint8Array(h.buffer), n, d); central.push(new Uint8Array(ch.buffer), n);
    pos += 30 + n.length + d.length;
  }
  const tam = central.reduce((s, x) => s + x.length, 0);
  const fim = new DataView(new ArrayBuffer(22)); fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, ficheiros.length, true); fim.setUint16(10, ficheiros.length, true); fim.setUint32(12, tam, true); fim.setUint32(16, pos, true);
  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)] as BlobPart[], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function xlsx(f: Folha): Blob {
  const nome = xml(f.nome.slice(0, 31));
  return zip([
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${nome}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${nome}'!$A$1:$${col(f.colunas.length - 1)}$${f.linhas.length + 1}</definedName></definedNames></workbook>`],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml', ESTILOS],
    ['xl/worksheets/sheet1.xml', folhaXml(f)],
  ]);
}
/** Descarrega o livro (no navegador). */
export function descarregar(b: Blob, nome: string): void {
  const u = URL.createObjectURL(b), a = document.createElement('a');
  a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(u), 4000);
}
