/* =========================================================
   PICK — o trabalhador da Arrumação (30 out. 2026): no «Não consigo arrumar», escolher um motivo liga «Comunicar problema»
   (sem motivo, o botão fica desligado). Ver arrumador-v2.ts.
   ========================================================= */
export function iniciar(): void {
  document.addEventListener('change', (ev) => {
    const i = ev.target as HTMLInputElement;
    if (!i.matches?.('.ta-motivo input[type="radio"]')) return;
    const b = i.closest('.gpi')?.querySelector<HTMLButtonElement>('.gi-pe [data-ir="ta-enviado"]');
    if (b) { b.disabled = false; b.removeAttribute('aria-disabled'); }
  });
}
