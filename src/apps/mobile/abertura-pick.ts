/* =========================================================
   PICK — 00 · Abertura (22 out. 2026), do briefing dela «ecrã de abertura para uma app de armazém num PDA
   Honeywell… foco em Inventário como primeiro módulo». Substitui a de 21 out. (uma só versão).
   Uma história curta (≈1,5 s), no EDA61K (320 × 533 dp):
     0–150 ms    o armazém (traço discreto) aparece;
     150–800 ms  o porta-paletes entra com a caixa e trava; as rodas giram, o corpo acusa a travagem;
     800–1050 ms o feixe lê o código da caixa;
     900–1250 ms o leitor, a rede e o servidor confirmam-se um a um (em cima);
     1100–1500 ms sobe a entrada do Inventário: o nome do módulo, o armazém e o PDA, quem entrou da última vez,
                 os atalhos das três tarefas e «Entrar».
   Tudo grande e de toque (atalhos de 72 px, «Entrar» de 56 px); escuro, contraste forte, pouco texto. Tocar no
   ecrã acaba a história. Sem rede, «Entrar» desliga-se (a Pick não trabalha sem rede); sem leitor, «Entrar na
   mesma». Os atalhos e «Entrar» levam ao 01 · Entrar (primeiro a sessão, depois a tarefa).
   ========================================================= */
import { I, IC } from './estados';
import { CAIXA, PORTA_PALETES, ARMAZEM } from './cena';
import type { EstadoAberturaPk } from './entrar-industrial';

const IC2 = {
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>',
  leitor: IC.ler, seta: '<path d="M5 12h14M13 6l6 6-6 6"/>', pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};

export function aberturaPick(e: EstadoAberturaPk = ''): string {
  const pilulas: [string, string, 'ok' | 'mal' | 'espera'][] = [
    ['leitor', 'Leitor', e === 'leitor' ? 'mal' : 'ok'],
    ['rede', 'Rede', e === 'sem-rede' ? 'mal' : 'ok'],
    ['servidor', 'Servidor', e === 'sem-rede' ? 'espera' : 'ok'],
  ];
  const atalhos: [string, string, string][] = [[IC2.lista, 'Contagens', '3 atribuídas'], [IC.corrigir, 'Corrigir', 'posição'], [IC2.lupa, 'Consultar', 'stock']];
  const aviso = e === 'sem-rede' ? '<p class="pkb-aviso pkb-aviso--mal">' + I(IC.semrede) + 'Sem rede. Continua sozinha quando houver sinal.</p>'
    : e === 'leitor' ? '<p class="pkb-aviso pkb-aviso--mal">' + I(IC.aviso) + 'O leitor não responde. Reinicie-o, ou escreva os códigos.</p>' : '';
  return `<div class="pkb${e ? ` pkb--${e} is-fim is-ja` : ''}" data-pkb>
  <header class="pkb-estado" aria-label="Estado do PDA">${pilulas.map(([k, t, s], i) => `<span class="pkb-pilula is-${s}" data-pilula="${k}" style="--i:${i}"><i aria-hidden="true">${s === 'mal' ? I(IC.aviso) : s === 'espera' ? '' : I(IC.fechar)}</i>${t}</span>`).join('')}</header>
  <div class="pkb-palco" aria-hidden="true">
    ${ARMAZEM}
    <div class="pkb-veiculo"><div class="pkb-porta">${PORTA_PALETES}</div><div class="pkb-caixa">${CAIXA()}</div></div>
  </div>
  <section class="pkb-baixo">
    <p class="pkb-marca"><span class="romafe pkb-romafe">ROMAFE</span><i aria-hidden="true"></i><b>Pick</b></p>
    <h1 class="pkb-modulo">Inventário</h1>
    <p class="pkb-onde"><span>Armazém 60</span><span>PDA 24174B6440</span></p>
    <p class="pkb-quem">${I(IC2.pessoa)}Último a entrar: <b>Joana Silva</b></p>
    <nav class="pkb-atalhos" aria-label="Tarefas do Inventário">${atalhos.map(([ic, t, s], i) => `<button type="button" class="pkb-atalho" data-ir="entrada" style="--i:${i}">${I(ic)}<b>${t}</b><small>${s}</small></button>`).join('')}</nav>
    ${aviso}
    <button type="button" class="pkb-entrar" data-ir="entrada"${e === 'sem-rede' ? ' disabled' : ''}><span>${e === 'leitor' ? 'Entrar na mesma' : 'Entrar'}</span>${I(IC2.seta)}</button>
  </section>
</div>`;
}
