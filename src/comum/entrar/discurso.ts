/* =========================================================
   ROMAFE — o texto de apresentação do início de sessão
   À esquerda do cartão, na variante completa (ERP, GoShop, GoParts).
   A forma é comum — um título e três vantagens —, o conteúdo é de cada
   app: diz o que se vai encontrar lá dentro, e não o que as apps têm
   em comum. Cada app escreve o seu em src/apps/<app>/entrar.ts.
   ========================================================= */

/** Os ícones que uma vantagem pode levar (traço de 24 × 24). */
export const ICONES = {
  empresa: '<path d="M3 21V8l6-4 6 4v13"/><path d="M15 21V11h6v10"/><path d="M2 21h20"/><path d="M7 11h2"/><path d="M7 15h2"/><path d="M18 15h1"/>',
  documento: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/>',
  separadores: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M9 4v5"/><path d="M15 4v5"/>',
  ferramenta: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 0-5-5L13 2l-2 2 3.7 2.3Z"/><path d="m3 21 6-6"/>',
  carro: '<path d="M5 17h14"/><path d="M6 17v2"/><path d="M18 17v2"/><path d="M3 13l2-6h14l2 6v4H3Z"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  procura: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  caixa: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  camiao: '<path d="M2 6h11v10H2Z"/><path d="M13 9h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
} as const;

export type Icone = keyof typeof ICONES;

export interface Vantagem { icone: Icone; titulo: string; sub: string }

/** O que a app diz de si à entrada. */
export interface Apresentacao {
  /** em maiúsculas no ecrã; <br> para partir a linha */
  titulo: string;
  vantagens: [Vantagem, Vantagem, Vantagem];
}

function vantagem(v: Vantagem): string {
  return `
        <li class="vantagem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[v.icone]}</svg>
          <div>
            <p class="vantagem__titulo">${v.titulo}</p>
            <p class="vantagem__sub">${v.sub}</p>
          </div>
        </li>`;
}

/* Depois de cada <br> vai um espaço: na v1 não se vê (o espaço no início
   de uma linha desaparece), e na v3, onde o título é uma linha só e os <br>
   se escondem, é o que separa as palavras. */
export function discurso(produto: string, a: Apresentacao, semRomafe = false): { entrada: string; palavraPasse: string; federado: string } {
  return {
    entrada: `
    <section class="discurso">
      <h1 class="discurso__titulo">${a.titulo.replace(/<br>/g, '<br> ')}</h1>
      <ul class="vantagens">${a.vantagens.map(vantagem).join('')}
      </ul>
    </section>`,
    palavraPasse: `
    <section class="discurso">
      <h1 class="discurso__titulo">${semRomafe ? `Uma conta<br> do ${produto}` : 'Uma conta<br> da Romafe'}</h1>
      <p class="discurso__texto">O endereço é de uma conta criada no ${produto}. A palavra-passe confirma-se aqui.</p>
    </section>`,
    federado: `
    <section class="discurso">
      <h1 class="discurso__titulo">A conta<br> é da sua empresa</h1>
      <p class="discurso__texto">O ${produto} não vê a sua palavra-passe. Quem a confirma é a sua empresa, e devolve-o aqui já com a sessão aberta.</p>
    </section>`,
  };
}
