/* =========================================================
   ERP — abrir outro ecrã com contexto (19 nov. 2026). Num separador do IDE, pede à área de trabalho que abra (ou
   traga para a frente) o ecrã da rota e lhe passe o contexto no «modo»; fora do IDE, muda o endereço para esse ecrã.
   Quem recebe lê o «modo» do endereço e das mensagens «cf-modo» (ver stocks/mapa-movimentos-v2.ts).
   ========================================================= */
export function abrirEcra(rota: string, ecra: string, modo: string, titulo: string): void {
  if (window.parent !== window) { window.parent.postMessage({ romafe: 'abrir', rota, modo, titulo }, '*'); return; }
  location.hash = `so=ecra&ecra=${encodeURIComponent(ecra)}&modo=${encodeURIComponent(modo)}`;
  location.reload(); /* a página só lê o ecrã do endereço ao abrir */
}
/** «aba=ext;art=6205-2Z;ano=2026» → { aba: 'ext', art: '6205-2Z', ano: '2026' } */
export const lerModo = (m: string | null | undefined): Record<string, string> => Object.fromEntries((m ?? '').split(';').filter((x) => x.includes('=')).map((x) => [x.slice(0, x.indexOf('=')), x.slice(x.indexOf('=') + 1)]));
