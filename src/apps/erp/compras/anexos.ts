/* =========================================================
   ERP — Compras: os anexos dos documentos (26 out. 2026), para os Orçamentos v2 e as Encomendas v2.
   O protótipo não tem servidor de ficheiros: este é o «serviço» — guarda neste computador (localStorage) o nome, o tipo,
   o tamanho, quem e quando, e o conteúdo dos ficheiros até 1,5 MB, para se poderem ver e descarregar. Acima disso,
   recusa e diz porquê. Cada anexo pertence a um documento (a referência: «PC 2026/0017|skf», «EF 2026/0413»).
   ========================================================= */
export interface AnexoDoc { id: string; doc: string; nome: string; tipo: string; tamanho: number; quando: string; quem: string; dados: string }
const CHAVE = 'erp:anexos:v1';
export const MAX_ANEXO = 1_500_000;
function todos(): AnexoDoc[] { try { return JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as AnexoDoc[]; } catch { return []; } }
function gravarTodos(xs: AnexoDoc[]): void { localStorage.setItem(CHAVE, JSON.stringify(xs)); }
export const anexosDe = (doc: string) => todos().filter((a) => a.doc === doc).sort((a, b) => b.quando.localeCompare(a.quando));
export const tamanho = (n: number) => n < 1024 ? `${n} B` : n < 1_048_576 ? `${(n / 1024).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} KB` : `${(n / 1_048_576).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} MB`;
export const podeVer = (tipo: string) => /^image\/(png|jpeg|webp|gif)$/.test(tipo) || tipo === 'application/pdf' || tipo.startsWith('text/');

/** Lê e guarda um ficheiro; o progresso é o da leitura (o único que existe sem servidor). */
export function anexar(doc: string, f: File, quem: string, progresso: (p: number) => void): Promise<AnexoDoc> {
  return new Promise((ok, falha) => {
    if (f.size > MAX_ANEXO) { falha(new Error(`«${f.name}» tem ${tamanho(f.size)}; neste protótipo o limite é ${tamanho(MAX_ANEXO)}.`)); return; }
    const r = new FileReader();
    r.onprogress = (e) => { if (e.lengthComputable) progresso(e.loaded / e.total); };
    r.onerror = () => falha(new Error(`Não foi possível ler «${f.name}».`));
    r.onload = () => {
      const a: AnexoDoc = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, doc, nome: f.name, tipo: f.type || 'application/octet-stream', tamanho: f.size, quando: new Date().toISOString(), quem, dados: String(r.result) };
      try { gravarTodos([...todos(), a]); ok(a); } catch { falha(new Error('Não há espaço neste computador para guardar o anexo. Nada se guardou.')); }
    };
    r.readAsDataURL(f);
  });
}
export function removerAnexo(id: string): boolean { try { gravarTodos(todos().filter((a) => a.id !== id)); return true; } catch { return false; } }
export const anexo = (id: string) => todos().find((a) => a.id === id);
