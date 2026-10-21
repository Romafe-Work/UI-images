/* =========================================================
   PICK — a cena da marca (21 out. 2026): o porta-paletes, a caixa e o armazém
   Do briefing «Cinematic industrial motion experience» que ela colou («Every movement counts»): um veículo de
   armazém a sério (não um brinquedo), em 2,5D — corpo do motor em azul ROMAFE com as faces de cima e de lado, o
   timão, a roda motriz e a roda de apoio, o encosto e os garfos com as rodas de carga — e a caixa laranja com a
   etiqueta e o código de barras. A caixa é um elemento à parte (`.pk-caixa-viva`): é ela que passa de ecrã para
   ecrã (abertura → entrada → Inventário) com View Transitions.
   Tudo SVG e CSS (sem WebGL): leve para o EDA61K. As cores vêm dos tokens --k-* (claro e escuro).
   ========================================================= */

/** A caixa (2,5D): frente, topo e lado, a fita, a etiqueta com o código e o feixe que o lê. */
export const CAIXA = (cls = '') => `<svg class="pk-caixa-viva${cls ? ` ${cls}` : ''}" viewBox="0 0 80 62" fill="none" aria-hidden="true" focusable="false">
  <path class="pkc-topo" d="M2 15 15 3h63L65 15Z"/>
  <path class="pkc-lado" d="M65 15 78 3v45L65 60Z"/>
  <rect class="pkc-frente" x="2" y="15" width="63" height="45" rx="1.5"/>
  <path class="pkc-fita" d="M2 23h63M33 15v8M15 3l18 12M46 3 65 15"/>
  <g class="pkc-etiqueta"><rect x="8" y="30" width="32" height="22" rx="1.5"/>
    <path class="pkc-codigo" d="M12 34v12M14.5 34v12M16 34v12M19 34v12M21.5 34v12M23 34v12M26 34v12M28 34v12M31 34v12M32.5 34v12M35 34v12"/>
    <path class="pkc-numeros" d="M12 49h24"/></g>
  <line class="pkc-feixe" x1="6" y1="28" x2="6" y2="54"/>
  <!-- o código transformado no indicador de leitura do PDA (os cantos e a linha) -->
  <g class="pkc-indicador"><path d="M7 35v-6h7M41 35v-6h-7M7 47v6h7M41 47v6h-7"/><path class="pkc-indicador-l" d="M13 41h22"/></g>
</svg>`;

/** O porta-paletes elétrico (vista de lado com profundidade): as rodas são grupos para girarem. */
export const PORTA_PALETES = `<svg class="pk-porta" viewBox="0 0 250 130" fill="none" aria-hidden="true" focusable="false">
  <ellipse class="pkp-sombra" cx="128" cy="124" rx="104" ry="5"/>
  <!-- o timão -->
  <path class="pkp-timao" d="M46 60 20 16"/>
  <rect class="pkp-pega" x="9" y="9" width="24" height="7" rx="3" transform="rotate(-30 21 12)"/>
  <!-- os garfos e as rodas de carga -->
  <path class="pkp-garfo" d="M104 106h132a4 4 0 0 1 4 4v4H104Z"/>
  <path class="pkp-garfo-fundo" d="M112 102h128v4H112Z"/>
  <g transform="translate(226 119)"><g class="pkp-roda pkp-roda--carga"><circle r="6"/><circle class="pkp-cubo" r="2.2"/></g></g>
  <g transform="translate(150 119)"><g class="pkp-roda pkp-roda--carga2"><circle r="6"/><circle class="pkp-cubo" r="2.2"/></g></g>
  <!-- o encosto da carga -->
  <path class="pkp-encosto" d="M100 54h7v60h-7Z"/><path class="pkp-encosto-l" d="M100 66h7M100 80h7M100 94h7"/>
  <!-- o corpo do motor: frente, topo e lado -->
  <g class="pkp-corpo">
    <path class="pkp-corpo-topo" d="M30 60 40 50h66l-8 10Z"/>
    <path class="pkp-corpo-lado" d="M98 60 106 50v56l-8 8Z"/>
    <rect class="pkp-corpo-frente" x="30" y="60" width="68" height="54" rx="4"/>
    <rect class="pkp-faixa" x="30" y="96" width="68" height="6"/>
    <rect class="pkp-visor" x="40" y="68" width="22" height="12" rx="2"/>
    <path class="pkp-visor-l" d="M44 74h14"/>
    <circle class="pkp-luz" cx="88" cy="72" r="3"/>
  </g>
  <!-- a roda motriz (com raios) e a roda de apoio -->
  <g transform="translate(64 116)"><g class="pkp-roda pkp-roda--motriz"><circle r="12"/><circle class="pkp-cubo" r="5"/><path class="pkp-raio" d="M0-10v20M-10 0h20M-7-7l14 14M7-7-7 7"/></g></g>
  <g transform="translate(38 120)"><g class="pkp-roda pkp-roda--apoio"><circle r="6"/><circle class="pkp-cubo" r="2.2"/></g></g>
</svg>`;

/** O armazém ao fundo, em perspetiva: o chão com as linhas de fuga e duas estantes (só traço, discreto). */
export const ARMAZEM = `<svg class="pk-armazem" viewBox="0 0 320 240" fill="none" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
  <path class="pka-chao" d="M0 170h320v70H0Z"/>
  <path class="pka-fuga" d="M160 120 -60 240M160 120 40 240M160 120 120 240M160 120 200 240M160 120 280 240M160 120 380 240M0 186h320M0 206h320"/>
  <g class="pka-estante pka-estante--e"><path d="M18 40v130M92 52v118M18 40l74 12M18 84l74 8M18 128l74 4M18 170h74"/><path d="M92 52l14-6v118l-14 6"/>
    <rect x="30" y="64" width="20" height="16"/><rect x="56" y="70" width="16" height="16"/><rect x="34" y="110" width="22" height="16"/></g>
  <g class="pka-estante pka-estante--d"><path d="M302 40v130M228 52v118M302 40l-74 12M302 84l-74 8M302 128l-74 4M302 170h-74"/><path d="M228 52l-14-6v118l14 6"/>
    <rect x="252" y="66" width="18" height="16"/><rect x="274" y="62" width="20" height="18"/><rect x="246" y="110" width="24" height="16"/></g>
</svg>`;

/** O pequeno carrinho do percurso da contagem (um ícone, para andar ao longo dos passos). */
export const CARRINHO_MINI = `<svg class="pk-mini" viewBox="0 0 34 22" fill="none" aria-hidden="true" focusable="false"><path class="pkm-corpo" d="M3 6h11v10H3Z"/><path class="pkm-garfo" d="M14 15h17v2H14Z"/><rect class="pkm-caixa" x="17" y="6" width="11" height="9" rx="1"/><circle class="pkm-roda" cx="7" cy="18" r="2.5"/><circle class="pkm-roda" cx="27" cy="18" r="1.8"/><path class="pkm-timao" d="M5 6 1 1"/></svg>`;

/** A posição do armazém ao nível do chão (a baia onde o porta-paletes pousa a caixa), com a etiqueta 60300102. */
export const POSICAO = `<svg class="pk-posicao-svg" viewBox="0 0 120 160" fill="none" aria-hidden="true" focusable="false">
  <path class="pkq-montante" d="M6 4v152M112 4v152"/><path class="pkq-montante-fundo" d="M18 0v146M120 0v146"/>
  <path class="pkq-viga" d="M6 54h106M6 104h106M6 54l12-8h102M112 54l8-8M112 104l8-8"/>
  <rect class="pkq-etq" x="30" y="90" width="58" height="12" rx="2"/><text class="pkq-etq-t" x="59" y="99" text-anchor="middle">60300102</text>
</svg>`;
