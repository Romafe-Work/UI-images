/* =========================================================
   ERP — a base do início de sessão

   A barra de topo, a fotografia do armazém e o rodapé estão escritos aqui
   uma vez só. Cada ecrã de entrada traz o discurso (à esquerda) e o
   cartão (à direita). Mudar a base muda todos os ecrãs que nasceram dela.
   ========================================================= */

export interface PartesEntrada {
  /** o texto grande à esquerda, por cima da fotografia */
  discurso: string;
  /** o cartão à direita, com o formulário */
  cartao: string;
}

export function entrada({ discurso, cartao }: PartesEntrada): string {
  return `
<div class="entrada">
  <header class="topo">
      <div class="lockup lockup--sm">
        <p class="lockup__nome">ROLGEST</p>
        <span class="lockup__risco" aria-hidden="true"></span>
        <p class="lockup__sub">Plataforma de gestão</p>
      </div>

      <div class="topo__accoes">
        <div class="segmented" role="group" aria-label="Tema da interface">
          <button type="button" class="segmented__btn" data-tema="light" aria-pressed="false">Claro</button>
          <button type="button" class="segmented__btn" data-tema="dark" aria-pressed="false">Escuro</button>
          <button type="button" class="segmented__btn" data-tema="auto" aria-pressed="true">Auto</button>
        </div>
        <button type="button" class="topo__idioma" aria-label="Mudar idioma: Português">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20Z"/>
          </svg>
          Português
        </button>
      </div>
    </header>

  <main class="palco">
    <div class="palco__foto" role="img" aria-label="Armazém da Romafe"></div>
    <div class="palco__veu" aria-hidden="true"></div>
${discurso}
${cartao}
  </main>

  <footer class="rodape">
      <p class="rodape__direitos" data-ed-nome="Direitos" style="margin:0">© 2026 Romafe SA. Todos os direitos reservados.</p>
      <ul class="rodape__ligacoes">
        <li><a href="#">Aviso legal</a></li>
        <li><a href="#">Política de privacidade</a></li>
        <li><a href="#">Contactos</a></li>
      </ul>
      <p class="rodape__selo" style="margin:0">
        <span class="rodape__barras" aria-hidden="true">///</span>
        <span class="rodape__lema">Alojado<br>pela Romafe</span>
      </p>
    </footer>
</div>`;
}
