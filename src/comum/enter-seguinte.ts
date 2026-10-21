/* =========================================================
   ROMAFE — Enter passa ao campo seguinte (21 out. 2026)
   Do briefing «Smart Enter keyboard navigation». O projeto não é Vue: em vez de uma diretiva, um só ouvinte para a
   página e um atributo em cada formulário onde faz sentido:
     data-enter="seguinte"      no formulário (ou no contentor) — Enter num campo leva ao campo seguinte
     data-enter-fim="submeter"  no último campo, valida e submete o formulário (só ações que não destroem nada);
                                sem isto, o foco vai para o botão principal ([data-enter-acao] ou o de submeter)
     data-enter="proprio"       num campo onde Enter já tem um sentido (pesquisar, confirmar): fica o do campo
   Fica sempre o comportamento normal: áreas de texto, botões, listas de sugestões abertas, campos de seleção,
   composição de acentos (IME), Enter com Ctrl/Alt/Shift/Meta. Saltam-se campos desligados, escondidos, só de
   leitura ou fora do teclado (tabindex −1). O foco não sai do formulário (nem de um diálogo).
   ========================================================= */
const CAMPOS = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]), select, textarea';

function elegivel(el: HTMLElement): boolean {
  const i = el as HTMLInputElement;
  if (i.disabled || i.readOnly || el.tabIndex < 0 || el.closest('[hidden], [inert]')) return false;
  if (el.matches('[data-enter="proprio"]')) return true; /* entra na ordem; só não é tratado ao sair dele */
  const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
}
/** Os campos do formulário pela ordem do documento (a ordem visual dos formulários do protótipo). */
const campos = (zona: HTMLElement) => Array.from(zona.querySelectorAll<HTMLElement>(CAMPOS)).filter(elegivel);
function botaoPrincipal(zona: HTMLElement): HTMLButtonElement | null {
  return zona.querySelector<HTMLButtonElement>('[data-enter-acao]:not(:disabled)') ?? zona.querySelector<HTMLButtonElement>('button[type="submit"]:not(:disabled), button:not([type]):not(:disabled)');
}
function irPara(el: HTMLElement): void {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (el instanceof HTMLInputElement && /^(text|search|email|tel|url|number|)$/.test(el.type)) { try { el.select(); } catch { /* alguns tipos não deixam */ } }
}

export function iniciar(): void {
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' || ev.isComposing || ev.keyCode === 229 || ev.ctrlKey || ev.altKey || ev.shiftKey || ev.metaKey || ev.defaultPrevented) return;
    const el = ev.target as HTMLElement;
    if (!el.matches?.(CAMPOS) || el.matches('textarea, select, [data-enter="proprio"]')) return;
    /* uma lista de sugestões aberta: Enter escolhe a sugestão */
    if (el.getAttribute('aria-expanded') === 'true' || el.getAttribute('aria-activedescendant')) return;
    const zona = el.closest<HTMLElement>('[data-enter="seguinte"]'); if (!zona) return;
    const l = campos(zona), i = l.indexOf(el); if (i < 0) return;
    ev.preventDefault();
    if (i < l.length - 1) { irPara(l[i + 1]); return; }
    /* o último campo */
    const form = el.closest('form');
    if (zona.dataset.enterFim === 'submeter' && form) {
      const b = botaoPrincipal(form);
      if (b?.getAttribute('aria-busy') === 'true' || b?.disabled) return; /* já a submeter: não repete */
      if (!form.noValidate && !form.reportValidity()) return;
      form.requestSubmit(b && b.type === 'submit' ? b : undefined);
      return;
    }
    const b = botaoPrincipal(zona); if (b) b.focus();
  });
}
