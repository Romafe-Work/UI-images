/* =========================================================
   GOPARTS — os ícones animados das categorias (14 out. 2026)
   Ela: «aqui quero animações por categoria: se passar pela luz com o rato a luz fica amarela, as correias
   prendem-se…». Cada categoria tem o seu ícone (o traço do Lucide: 24 × 24, 2 px, pontas redondas) com as
   peças separadas, para cada uma fazer o que faz no carro. Uma vez por passagem do rato (ou foco), sem repetir.
   O CSS está em css/categorias.css.
   ========================================================= */
const svg = (k: string, corpo: string) => `<svg class="ca ca--${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;

export const CAT_SVG: Record<string, string> = {
  /* o disco roda e trava; a pinça aperta */
  Travagem: svg('travagem', '<g class="ca-disco"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="6.6" r=".4"/><circle cx="17.4" cy="12" r=".4"/><circle cx="12" cy="17.4" r=".4"/><circle cx="6.6" cy="12" r=".4"/></g><path class="ca-pinca" d="M18.2 3.6a10.5 10.5 0 0 1 2.4 3.4"/>'),
  /* a mola comprime e solta */
  'Suspensão': svg('suspensao', '<path class="ca-topo" d="M6 4h12"/><path class="ca-mola" d="M8 7l8 2-8 2 8 2-8 2 8 2"/><path d="M6 20h12"/>'),
  /* a gota fica âmbar e pinga */
  'Óleo motor': svg('oleo', '<path class="ca-gota" d="M12 3s6 6.4 6 10.3A6 6 0 0 1 6 13.3C6 9.4 12 3 12 3z"/><circle class="ca-pinga" cx="12" cy="21.5" r="1"/>'),
  /* carrega */
  Bateria: svg('bateria', '<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M22 11v2"/><rect class="ca-carga" x="5" y="9.5" width="12" height="5" rx="1"/>'),
  /* o funil abana e pinga */
  Filtros: svg('filtros', '<path class="ca-funil" d="M3 4h18l-7 8v5l-4 2v-7z"/><circle class="ca-pinga" cx="12" cy="22" r=".9"/>'),
  /* a lâmpada fica amarela e aparecem os raios */
  'Iluminação': svg('luz', '<path class="ca-ampola" d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.6.5.9 1.2.9 2V17h6v-.8c0-.8.3-1.5.9-2A6.5 6.5 0 0 0 12 2.5z"/><path d="M9.5 20h5M10.5 22.5h3"/><path class="ca-raios" d="M2.5 9H1M23 9h-1.5M4.6 3.6 3.5 2.5M19.4 3.6l1.1-1.1"/>'),
  /* os elos prendem-se */
  Correias: svg('correias', '<path class="ca-elo1" d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path class="ca-elo2" d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  /* os pratos encostam */
  Embraiagem: svg('embraiagem', '<path d="M1.5 12h21"/><ellipse class="ca-prato1" cx="8" cy="12" rx="2.4" ry="8"/><ellipse class="ca-prato2" cx="16" cy="12" rx="2.4" ry="8"/>'),
  /* o volante vira */
  'Direção': svg('direcao', '<g class="ca-volante"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 14v7M10.2 11 3.5 9.5M13.8 11l6.7-1.5"/></g>'),
  /* o floco roda e fica azul gelo */
  'Ar condicionado': svg('frio', '<g class="ca-floco"><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7"/><path d="m9.5 4 2.5 2 2.5-2M9.5 20l2.5-2 2.5 2"/></g>'),
};
