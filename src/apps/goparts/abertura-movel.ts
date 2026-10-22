/* =========================================================
   PEÇA A PEÇA — 00 · Abertura no telemóvel (22 out. 2026), do briefing dela «ecrã de abertura para a app mobile
   da ROMAFE / Peça a Peça… wow, moderno, clean e profissional»
   O mesmo ecrã (a abertura que vem depois do login comum), com uma composição própria até 700 px de largura —
   no telemóvel a cena 3D não corre. Três zonas:
     em cima  — ROMAFE · Peça A Peça e a conta em que se entrou (Oficina · Conta Porto);
     ao meio  — «A peça certa. Em segundos.», uma linha de apoio e três cartões do trabalho de uma oficina, que
                entram com ritmo e ficam a respirar: uma peça com stock, um pedido a caminho, uma fatura;
     em baixo — «Começar» (o Início), «Mudar conta» (o login comum), a ajuda e o estado do sistema.
   Rápido (≈1 s até «Começar» estar no sítio; funciona desde o primeiro instante), sem efeitos de brilho.
   Comportamento: comportamento/abertura-movel.ts. CSS: css/abertura-movel.css.
   ========================================================= */
const I = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  rolamento: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="5.5" r="1.2"/><circle cx="18.5" cy="12" r="1.2"/><circle cx="12" cy="18.5" r="1.2"/><circle cx="5.5" cy="12" r="1.2"/>',
  camiao: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  fatura: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6M16 12H8M13 16H8"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>', conta: '<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>', ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  trocar: '<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>', mais: '<path d="M12 5v14M5 12h14"/>',
};

export function aberturaMovel(): string {
  return `<section class="pam" data-pam aria-label="Peça A Peça">
  <header class="pam-topo">
    <p class="pam-marca"><span class="romafe pam-romafe">ROMAFE</span><i aria-hidden="true"></i><b>Peça A Peça</b></p>
    <span class="pam-conta">${I(IC.conta)}Oficina · Conta Porto</span>
  </header>
  <div class="pam-meio">
    <h1 class="pam-titulo"><span><span>A peça certa.</span></span><span><span>Em segundos.</span></span></h1>
    <p class="pam-sub">Pesquisa, encomenda e acompanha — na tua mão.</p>
    <div class="pam-cartoes" aria-hidden="true">
      <i class="pam-fio"></i>
      <article class="pam-cartao" style="--i:0"><span class="pam-ic">${I(IC.rolamento)}</span><div><b>SKF VKBA 6556</b><small>Rolamento de roda · Porto · hoje</small></div><span class="pam-chip pam-chip--acao">${I(IC.mais)}Adicionar</span></article>
      <article class="pam-cartao" style="--i:1"><span class="pam-ic pam-ic--azul">${I(IC.camiao)}</span><div><b>P2024/001256</b><small>Expedido · chega hoje</small></div><span class="pam-barra"><i></i></span></article>
      <article class="pam-cartao" style="--i:2"><span class="pam-ic pam-ic--verde">${I(IC.fatura)}</span><div><b>FT2024/05530</b><small>Fatura · 342,50 €</small></div><span class="pam-chip">Em aberto</span></article>
    </div>
  </div>
  <footer class="pam-baixo">
    <button type="button" class="pam-comecar" data-ir="inicio"><span>Começar</span>${I(IC.seta)}</button>
    <div class="pam-sec">
      <button type="button" class="pam-ligacao" data-login>${I(IC.trocar)}Mudar conta</button>
      <button type="button" class="pam-ligacao" data-pam-ajuda aria-expanded="false">${I(IC.ajuda)}Ajuda</button>
    </div>
    <p class="pam-ajuda" data-pam-ajuda-texto hidden>Apoio da Romafe: <a href="tel:+351226158300">+351 226 158 300</a>, dias úteis das 9h às 18h.</p>
    <p class="pam-estado"><i aria-hidden="true"></i>Sistema ativo</p>
  </footer>
</section>`;
}
