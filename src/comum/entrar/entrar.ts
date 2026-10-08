/* =========================================================
   ROMAFE — o início de sessão, comum às três apps

   O processo é o mesmo em todas, porque a identidade é uma só (Keycloak):

     01 Entrar ── conta nossa ──▶ 02 A palavra-passe
        └──── cliente federado ─▶ 03 O início de sessão da empresa

   O que muda é quanto se mostra à volta:
     completa  (ERP, Web)  fotografia, texto de apresentação, tema e idioma,
                           alertas de licença e de lugar, «manter sessão»,
                           apoio, versão e rodapé
     compacta  (Mobile)    a fotografia e o cartão: a marca, o campo e o botão. Sem
                           barra de topo (a marca já está no cartão) e sem
                           «manter sessão», porque o aparelho é partilhado
   ========================================================= */
import type { Ecra } from '../tipos';
import { discurso as discursoDe, type Apresentacao } from './discurso';

export type IdEntrar = 'entrada' | 'palavra-passe' | 'federado' | 'ajuda';
export type Variante = 'completa' | 'compacta';
/** onde fica o cartão na variante completa: à direita, com a apresentação
    à esquerda (v1); ao centro, sozinho sobre a fotografia (v2); ou ao
    centro, com o título por cima e as vantagens por baixo (v3) */
export type Disposicao = 'lado' | 'centro' | 'centro-apresentacao' | 'diagonal';
/** v6: a família Romafe (8 out. 2026). Três tipos de aplicação, diferentes
    entre si e com as mesmas peças: o nome ROMAFE na letra Motor e no azul
    RGB(0, 99, 170), o cartão, o botão laranja e o rodapé. */
export type Familia = 'interna' | 'webshop' | 'marketplace';

/** como cada tipo se apresenta ao lado do nome ROMAFE, na barra de topo */
const TIPO: Record<Familia, string> = {
  interna: 'Aplicações internas',
  webshop: 'Loja online',
  marketplace: 'Marketplace',
};

export interface OpcoesEntrar {
  variante: Variante;
  /** só na completa; por omissão «lado» */
  disposicao?: Disposicao;
  /** sem nada da Romafe à vista (v4): o produto é vendido, e pode ser de
      outra empresa. Saem os direitos, o «Alojado pela Romafe», o apoio com
      o nome, a fotografia do armazém da Romafe e o desenho do logótipo dela
      (a letra Motor e o risco laranja); fica o nome do produto, em letra neutra */
  semRomafe?: boolean;
  /** a marca do produto ganha um monograma (a inicial num quadrado) e o
      fundo, sem fotografia, ganha um desenho abstrato (v5) */
  desenhado?: boolean;
  /** no lugar do monograma, o nome ROMAFE em Motor (Pick v3: ela pediu
      «remove o P e coloca Romafe», 8 out. 2026) */
  monogramaRomafe?: boolean;
  /** v6: o tipo de aplicação, que decide o palco (ver `Familia`) */
  familia?: Familia;
  /** v7: a v6 com o cartão ao centro nos três tipos — o título por cima e
      as vantagens por baixo; cada tipo guarda o seu fundo. Na barra de topo
      fica só o ROMAFE, sem dizer o tipo (ela: «não digas se é para web ou mobile») */
  centro?: boolean;
  /** no cartão, o nome ROMAFE em Motor no lugar do nome do produto
      (ERP v7: ela pediu «não digas Rolgest, mas sim Romafe») */
  nomeRomafe?: boolean;
  /** ERP v6 (era a v8; 8 out. 2026, a partir de duas imagens dela): pouco texto à
      volta. Sem barra de topo, sem rodapé e sem discurso; no cartão o selo,
      a linha por baixo (marca.sub), o campo e «Precisa de ajuda?». O selo é
      a palavra espaçada por baixo do ROMAFE: «ERP». */
  minimo?: {
    selo: string;
    /** ERP v7 (era a v9): a fotografia no ecrã todo, com o cartão ao centro e duas formas
        azuis nos cantos; a ajuda só em texto */
    centro?: boolean;
    /** v8 do ERP (8 out. 2026), depois de ela dizer que tudo «parece feito pela
        IA»: uma fotografia verdadeira da Romafe, nítida e sem véu, e um painel
        branco liso com o ROMAFE grande. Nenhum brilho, degradê nem forma
        recortada. O valor é a fotografia (src/comum/img/<foto>.webp, tirada do
        vídeo de romafe.com). */
    foto?: 'corredor' | 'separacao' | 'fachada' | 'mosaico' | 'video' | 'cena';
    /** na versão do vídeo, o tipo de app decide a cena, onde fica a caixa e a faixa */
    tipo?: Familia;
  };
  /** o cartão fica no mesmo sítio em todos os ecrãs da versão: o texto à
      volta é sempre o do 01, o cartão prende-se em cima, e o 03 deixa de ser
      «Fora da Romafe» para ter a marca como os outros (ERP, 8 out. 2026) */
  fixo?: boolean;
  /** o ROMAFE, azul e em Motor, por cima do nome da app em todas as versões,
      também nas que eram sem a Romafe (Web e Pick, 8 out. 2026: «quero sempre
      Romafe presente com aquele azul») */
  comRomafe?: boolean;
  /** em baixo, a faixa azul das marcas no lugar do rodapé (ERP v3.1) */
  faixaMarcas?: boolean;
  /** o produto diz-se no feminino: «da Romafe», «na Romafe» */
  feminino?: boolean;
  /** v6: o convite no fim do cartão do 01, para quem ainda não tem conta.
      Nas internas não há: a conta nasce no administrador. */
  convite?: { texto: string; ligacao: string };
  /** o nome na marca e a linha por baixo: ROLGEST · Plataforma de gestão */
  marca: { nome: string; sub: string };
  /** como o produto se chama numa frase: «O Rolgest não vê a sua palavra-passe» */
  produto: string;
  /** só na completa: o título e as três vantagens à esquerda do 01, de cada app */
  apresentacao?: Apresentacao;
  /** o nome do fluxo no mapa e no seletor; por omissão «Entrar» */
  fluxo?: string;
  /** só na completa: a linha discreta no fim do cartão do 01 */
  versao?: string;
  /** só na completa: o realm do Keycloak, no fim do cartão do 02 */
  realm?: string;
}

/** O que muda quando a mesma app tem dois produtos:
    os ids dos ecrãs e das peças levam um prefixo, para não se repetirem. */
interface Chaves { ir: (id: IdEntrar) => string; id: (peca: string) => string }

/* ---------------- peças ---------------- */

/** A marca: o lockup, e na v5 o monograma (a inicial do produto) antes dele —
    ao lado no topo, por cima no cartão. */
function marca(o: OpcoesEntrar, cls: string, idSub = ''): string {
  if (o.familia) return produto(o, idSub);
  const l = lockup(o, cls, idSub);
  if (!o.desenhado) return l;
  const inicial = o.marca.nome.trim().charAt(0).toUpperCase();
  const dir = cls.includes('centro') ? 'marca-produto--coluna' : 'marca-produto--linha';
  /* com o ROMAFE presente, o monograma (a inicial num quadrado) sai: a marca é o ROMAFE */
  if (o.comRomafe) return l;
  if (o.monogramaRomafe) return `<span class="marca-produto ${dir}">${romafe('romafe--cartao')}${l}</span>`;
  return `<span class="marca-produto ${dir}"><span class="marca-produto__monograma" aria-hidden="true">${inicial}</span>${l}</span>`;
}

function lockup(o: OpcoesEntrar, cls: string, idSub = ''): string {
  const m = o.marca;
  /* com o ROMAFE, o nome é sempre o desenho da marca — azul e em Motor —,
     também nas versões neutras, que de outro modo o punham noutra letra.
     Numa app que não é a Romafe, o nome dela vem por baixo, na letra dos títulos. */
  const nome = o.nomeRomafe
    ? romafe('lockup__romafe')
    : o.comRomafe
      ? romafe('lockup__romafe') + (o.produto !== 'Romafe' ? `<span class="lockup__produto">${o.produto}</span>` : '')
      : `<span class="lockup__nome">${m.nome}</span>`;
  return `<span class="lockup ${cls}">
      ${nome}
      <span class="lockup__risco" aria-hidden="true"></span>
      <span class="lockup__sub"${idSub ? ` id="${idSub}"` : ''}>${m.sub}</span>
    </span>`;
}

/** O nome ROMAFE, na letra e na cor que a Romafe deu. É texto, para se ler. */
function romafe(cls = ''): string {
  return `<span class="romafe${cls ? ' ' + cls : ''}">ROMAFE</span>`;
}

/** v6: no cartão, o nome do produto na letra dos títulos. A Motor fica só
    para o ROMAFE; na compacta, sem barra de topo, o ROMAFE vem por cima. */
function produto(o: OpcoesEntrar, idSub = ''): string {
  return `<span class="produto">
      ${(o.variante === 'compacta' || o.comRomafe) && !o.nomeRomafe ? romafe('romafe--cartao') : ''}
      ${o.nomeRomafe ? romafe('romafe--nome') : `<span class="produto__nome">${o.produto}</span>`}
      <span class="produto__sub"${idSub ? ` id="${idSub}"` : ''}>${o.marca.sub}</span>
    </span>`;
}

function topo(o: OpcoesEntrar): string {
  const accoes = `
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
    </div>`;
  const esquerda = o.familia
    ? `<span class="topo__familia">${romafe()}${o.centro ? '' : `<span class="topo__tipo">${TIPO[o.familia]}</span>`}</span>`
    : marca(o, 'lockup--sm');
  return `<header class="topo">
    ${esquerda}${accoes}
  </header>`;
}

function rodape(o: OpcoesEntrar): string {
  if (o.variante === 'compacta') return '';
  if (o.faixaMarcas) return `<footer class="faixa">
    <p class="faixa__rotulo">Distribuímos</p>
    <ul class="faixa__marcas">${MARCAS.map((m) => `<li>${m}</li>`).join('')}</ul>
  </footer>`;
  return `<footer class="rodape">
    <p class="rodape__direitos" data-ed-nome="Direitos">© 2026 ${o.semRomafe ? o.produto : 'Romafe SA'}. Todos os direitos reservados.</p>
    <ul class="rodape__ligacoes">
      <li><a href="#">Aviso legal</a></li>
      <li><a href="#">Política de privacidade</a></li>
      <li><a href="#">Contactos</a></li>
    </ul>
    ${o.semRomafe ? '' : `<p class="rodape__selo">
      <span class="rodape__barras" aria-hidden="true">///</span>
      <span class="rodape__lema">Alojado<br>pela Romafe</span>
    </p>`}
  </footer>`;
}

/** A base: o topo, o palco e o rodapé à volta do cartão de cada passo. */
function pagina(o: OpcoesEntrar, discurso: string, cartao: string): string {
  if (o.minimo?.foto === 'video') return paginaVideo(cartao, o.minimo.tipo);
  if (o.minimo?.foto === 'cena') return paginaCena(cartao);
  if (o.minimo?.foto) return paginaFoto(o.minimo.foto, cartao);
  if (o.minimo) return paginaMinima(cartao, !!o.minimo.centro, !!o.fixo);
  if (o.familia) return paginaFamilia(o, discurso, cartao);
  const completa = o.variante === 'completa';
  const centro = completa && o.disposicao === 'centro';
  const centroApr = completa && o.disposicao === 'centro-apresentacao';
  const cls = (centro ? ' entrada--centro' : centroApr ? ' entrada--centro entrada--centro-apresentacao' : '')
    + (o.semRomafe ? ' entrada--neutra' : '') + (o.desenhado ? ' entrada--desenhada' : '')
    + (o.nomeRomafe ? ' entrada--erp' : '');
  return `<div class="entrada entrada--${o.variante}${cls}${o.fixo ? ' entrada--fixa' : ''}">
  ${completa ? topo(o) : ''}
  <main class="palco">
    ${o.semRomafe ? '' : '<div class="palco__foto" role="img" aria-label="Armazém da Romafe"></div>'}
    <div class="palco__veu" aria-hidden="true"></div>
    ${completa && !centro ? discurso : ''}
    ${cartao}
  </main>
  ${rodape(o)}
</div>`;
}

/** O que a loja online mostra à volta do discurso: as famílias de peças,
    como as prateleiras de uma loja. */
const CATEGORIAS = ['Travagem', 'Filtros', 'Suspensão', 'Iluminação', 'Embraiagem', 'Baterias'];

/** v6: a mesma barra de topo e o mesmo rodapé nos três tipos; o palco é de cada um.
      interna      duas metades: a fotografia do armazém com o discurso, e o
                   cartão numa superfície lisa. Sóbria, é uma ferramenta
      webshop      clara, de loja: o discurso e as famílias de peças à
                   esquerda, o cartão à direita, e o convite para pedir conta
      marketplace  escura e desenhada, de rede: o título por cima do cartão,
                   as vantagens por baixo, e o convite para vender */
function paginaFamilia(o: OpcoesEntrar, discurso: string, cartao: string): string {
  const f = o.familia!;
  const completa = o.variante === 'completa';
  const extra = f === 'webshop' && discurso
    ? `<ul class="categorias" aria-label="Famílias de peças">${CATEGORIAS.map((c) => `<li class="categoria">${c}</li>`).join('')}</ul>`
    : '';
  const foto = f === 'interna' ? '<div class="palco__foto" role="img" aria-label="Armazém da Romafe"></div><div class="palco__veu" aria-hidden="true"></div>' : '';
  return `<div class="entrada entrada--${o.variante} entrada--familia entrada--${f}${o.centro ? ' entrada--familia-centro' : ''}${o.fixo ? ' entrada--fixa' : ''}">
  ${completa ? topo(o) : ''}
  <main class="palco">
    ${foto}
    ${completa ? `<div class="palco__discurso">${discurso}${extra}</div>` : ''}
    ${cartao}
  </main>
  ${rodape(o)}
</div>`;
}

/** O ROMAFE com o risco laranja e a palavra espaçada por baixo. O ROMAFE
    é sempre azul e sempre em Motor, e por isso só vai em fundo claro. */
function selo(o: OpcoesEntrar, cls = '', comSub = false): string {
  return `<span class="selo${cls ? ' ' + cls : ''}">${romafe('romafe--selo')}<span class="selo__risco" aria-hidden="true"></span><span class="selo__sub${o.minimo!.selo.length > 4 ? ' selo__sub--nome' : ''}">${o.minimo!.selo}</span>${comSub ? `<span class="selo__linha">${o.marca.sub}</span>` : ''}</span>`;
}

/** ERP v6: a fotografia do armazém à esquerda, sem texto, com duas faixas
    azuis em diagonal; o painel claro à direita, recortado em seta, com o
    cartão. Mais nada. */
function paginaMinima(cartao: string, centro: boolean, fixo: boolean): string {
  const formas = centro
    ? '<div class="minima__canto minima__canto--cima" aria-hidden="true"></div><div class="minima__canto minima__canto--baixo" aria-hidden="true"></div>'
    : '<div class="minima__faixa" aria-hidden="true"></div><div class="minima__painel" aria-hidden="true"></div>';
  return `<div class="entrada entrada--completa entrada--minima${centro ? ' entrada--minima-centro' : ''}${fixo ? ' entrada--fixa' : ''}">
  <main class="palco">
    <div class="minima__foto" role="img" aria-label="Armazém da Romafe"></div>
    ${formas}
    ${cartao}
  </main>
</div>`;
}

/** v8: a fotografia da Romafe à esquerda, tal como é, e o painel branco à
    direita. No fundo do painel, só factos: desde 1945, e o lema da casa. */
function paginaFoto(foto: string, cartao: string): string {
  /* v9: três fotografias em mosaico (gente, corredor, fachada) e, no fundo do
     painel, os números do site da Romafe em vez de frases */
  const imagem = foto === 'mosaico'
    ? `<div class="foto foto--mosaico" role="img" aria-label="A Romafe: a separação, o armazém e a sede no Porto">
        <span class="mosaico__a"></span><span class="mosaico__b"></span><span class="mosaico__c"></span>
      </div>`
    : `<div class="foto foto--${foto}" role="img" aria-label="Armazém da Romafe"></div>`;
  const pe = foto === 'mosaico'
    ? `<dl class="numeros">
        <div><dt>1945</dt><dd>fundada no Porto</dd></div>
        <div><dt>60</dt><dd>pessoas</dd></div>
        <div><dt>6 000 m²</dt><dd>de armazém</dd></div>
      </dl>`
    : `<p class="foto__pe"><span>Desde 1945</span><span class="foto__lema">Rolling your way</span></p>`;
  return `<div class="entrada entrada--completa entrada--foto entrada--fixa${foto === 'mosaico' ? ' entrada--mosaico' : ''}">
  <main class="palco">
    ${imagem}
    ${cartao}
    ${pe}
  </main>
</div>`;
}

/* ---------------- v10 (ERP): movimento, marcas, uma pessoa e cor ----------------
   O que ela escolheu quando disse que «falta qualquer coisa» (8 out. 2026):
   o vídeo do armazém do site da Romafe a correr ao fundo e a caixa do login
   ao meio. Depois pediu «algo mais simples»: a faixa azul em baixo ficou só
   com as marcas que a Romafe distribui (saiu a frase da CEO). Tudo verdadeiro, tirado de romafe.com. O vídeo vem do
   site deles (17 MB, não se copia para aqui); enquanto não carrega, ou se
   falhar, fica a fotografia do corredor. */
const VIDEO_ROMAFE = 'https://www.romafe.com/assets/video/intro.mp4';
const MARCAS = ['SKF', 'TRW', 'VALEO', 'HELLA', 'NGK NTK', 'CORTECO', 'UFI', 'MANNOL'];

/* Na v9 as três apps diferem (ela, 8 out. 2026: «os ecrãs entre ERP, GoShop e
   GoParts devem diferir»; a v8 fica igual nas três), e continuam da mesma família: o vídeo, o ROMAFE
   azul, a caixa branca e o botão laranja são os mesmos.
     interna      o vídeo desde o escritório; a caixa ao meio; faixa azul
                  com factos da casa (do site da Romafe)
     webshop      desde os corredores com as caixas; a caixa à direita;
                  faixa laranja com as marcas que vende
     marketplace  desde os empilhadores e as paletes; a caixa à esquerda;
                  faixa escura com as famílias de peças */
const CENA: Record<Familia | 'igual', { inicio: number; rotulo: string; itens: string[] }> = {
  /* v8: igual nas três apps — o vídeo do princípio, a caixa ao meio, as marcas a azul */
  igual: { inicio: 0, rotulo: 'Distribuímos', itens: MARCAS },
  interna: { inicio: 3, rotulo: 'Romafe', itens: ['Desde 1945', 'Porto e Sacavém', '60 pessoas', '6 000 m² de armazém'] },
  webshop: { inicio: 6, rotulo: 'Marcas que vendemos', itens: MARCAS },
  marketplace: { inicio: 30, rotulo: 'Encontre peças de', itens: ['Travagem', 'Filtros', 'Suspensão', 'Embraiagem', 'Direção', 'Iluminação', 'Baterias'] },
};

function paginaVideo(cartao: string, tipo?: Familia): string {
  const c = CENA[tipo ?? 'igual'];
  return `<div class="entrada entrada--completa entrada--video${tipo ? ` entrada--video-${tipo}` : ''}">
  <main class="palco">
    <video class="video" autoplay muted loop playsinline preload="auto" aria-hidden="true" src="${VIDEO_ROMAFE}${c.inicio ? `#t=${c.inicio}` : ''}"></video>
    ${cartao}
  </main>
  <footer class="faixa">
    <p class="faixa__rotulo">${c.rotulo}</p>
    <ul class="faixa__marcas">${c.itens.map((m) => `<li>${m}</li>`).join('')}</ul>
  </footer>
</div>`;
}

/* ---------------- v10 do ERP: sem o armazém ----------------
   Ela, 8 out. 2026: «não quero ter sempre a imagem do armazém, o vídeo do
   mesmo». A fachada da sede (o letreiro ROMAFE), parada; caixa ao meio;
   faixa azul com os factos da casa. Também se fez para o GoShop (texto da
   Romafe Automotive; antes um bloco laranja) e para o GoParts (uma parede
   de marcas), e ela não gostou de nenhuma das duas: saíram. */
function paginaCena(cartao: string): string {
  const c = CENA.interna;
  return `<div class="entrada entrada--completa entrada--video entrada--cena entrada--cena-interna">
  <main class="palco">
    ${cartao}
  </main>
  <footer class="faixa">
    <p class="faixa__rotulo">${c.rotulo}</p>
    <ul class="faixa__marcas">${c.itens.map((m) => `<li>${m}</li>`).join('')}</ul>
  </footer>
</div>`;
}

const SVG_AJUDA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/></svg>`;

/* Todos os botões levam ícone e texto (ela, 8 out. 2026). */
const SVG_ENTRAR = `<svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>`;
const SVG_VOLTAR = `<svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></svg>`;
const SVG_SETA = `<svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`;

/* ---------------- 01 · Entrar ---------------- */
function cartaoEntrada(o: OpcoesEntrar, k: Chaves): string {
  const completa = o.variante === 'completa' && !o.minimo;
  /* 19 §3: uma mensagem só, e nenhum campo ganha borda vermelha. As duas
     recusas de outro dono (a licença, o lugar) estão escondidas: mostram-se
     no painel, em Peça → Visível. No Mobile não cabem: lá a recusa é do PDA. */
  const alertas = completa ? `
      <div class="alerta alerta--licenca" role="alert" data-ed-nome="Alerta · licença" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
        <span>A licença da sua empresa expirou a 14 de setembro. Fale com quem a contratou.</span>
      </div>
      <div class="alerta alerta--permissao" role="alert" data-ed-nome="Alerta · permissão" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>Entrou, mas não tem lugar em nenhum módulo. Peça acesso ao administrador da sua empresa.</span>
      </div>` : '';

  const apoio = completa ? `
      <div class="apoio">
        <div class="apoio__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
          <div>
            <p class="apoio__titulo">Sessão verificada</p>
            <p class="apoio__sub">A empresa ativa é confirmada em cada pedido</p>
          </div>
        </div>
        <div class="apoio__risco" aria-hidden="true"></div>
        <div class="apoio__item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/></svg>
          <div>
            <p class="apoio__titulo"><a href="#" ${k.ir('ajuda')}>Precisa de ajuda?</a></p>
            <p class="apoio__sub">${o.semRomafe ? 'Apoio ao cliente' : 'Apoio Romafe'} · 800 000 000</p>
          </div>
        </div>
      </div>
      ${o.versao ? `<p class="cartao__versao">${o.versao}</p>` : ''}` : '';

  return `<section class="cartao" aria-labelledby="${k.id('titulo-entrada')}">
      <div class="cartao__cabeca">${o.minimo ? `<h1 class="selo__titulo" id="${k.id('titulo-entrada')}">${selo(o, '', true)}</h1>` : marca(o, 'lockup--centro', k.id('titulo-entrada'))}</div>
      ${alertas}
      <!-- Passo 1. Um endereço que não existe também segue para a
           palavra-passe, e só falha no fim: dizer aqui «não existe»
           confirmava a quem tenta quem tem conta. -->
      <form class="formulario" id="${k.id('formulario')}" novalidate>
        <div class="campo campo--icone">
          <label class="campo__label" for="${k.id('utilizador')}">Endereço de correio <span class="campo__req" aria-hidden="true">*</span></label>
          <svg class="campo__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
          <input class="input" id="${k.id('utilizador')}" name="utilizador" type="email" required
                 autocomplete="username" placeholder="nome@empresa.pt" value="ana.ribeiro@exemplo.pt">
        </div>
        <div class="formulario__accoes">
          <button type="submit" class="btn btn--acao btn--bloco" id="${k.id('continuar')}" ${k.ir('palavra-passe')}>
            <span class="btn__rotulo">Continuar</span>${SVG_SETA}
          </button>
        </div>
      </form>
      ${o.convite ? `<p class="convite">${o.convite.texto} <a href="#">${o.convite.ligacao}</a></p>` : ''}
      ${o.minimo ? `<div class="ajuda"><a href="#" ${k.ir('ajuda')}>${o.minimo.centro ? '' : SVG_AJUDA}Precisa de ajuda?</a></div>` : ''}
      ${o.variante === 'compacta' ? `<a class="ligacao-recuperar ajuda-compacta" href="#" ${k.ir('ajuda')}>Precisa de ajuda?</a>` : ''}
      ${apoio}
    </section>`;
}

/* ---------------- 02 · A palavra-passe ---------------- */
function cartaoPalavraPasse(o: OpcoesEntrar, k: Chaves): string {
  /* 19 §5: desligada e com a dica. No Mobile não existe: o PDA é de todos. */
  const manter = o.variante === 'completa' ? `
        <div class="opcao">
          <input type="checkbox" id="${k.id('manter')}" name="manter">
          <label class="opcao__texto" for="${k.id('manter')}">Manter sessão iniciada
            <span class="opcao__ajuda">Não usar em computadores partilhados</span>
          </label>
        </div>` : '';
  return `<section class="cartao" aria-labelledby="${k.id('titulo-passe')}">
      <div class="cartao__cabeca">${o.minimo ? selo(o, '', true) : marca(o, 'lockup--centro')}</div>
      <div class="alerta" id="${k.id('alerta')}" data-credenciais role="alert" data-ed-nome="Alerta · credenciais" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16.5v.5"/></svg>
        <span>Endereço ou palavra-passe incorretos.</span>
      </div>
      <form class="formulario" id="${k.id('formulario-passe')}" data-palavra-passe novalidate>
        <p class="identidade">
          <span class="identidade__correio">ana.ribeiro@exemplo.pt</span>
          <a class="identidade__mudar" href="#" ${k.ir('entrada')}>mudar</a>
        </p>
        <div class="campo campo--icone">
          <label class="campo__label" for="${k.id('palavra-passe')}" id="${k.id('titulo-passe')}">Palavra-passe <span class="campo__req" aria-hidden="true">*</span></label>
          <svg class="campo__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input class="input" id="${k.id('palavra-passe')}" name="password" type="password" required
                 autocomplete="current-password" data-com-botao placeholder="A sua palavra-passe">
          <!-- 19 §2.1: é um <button>, e o rótulo muda -->
          <button type="button" class="campo__acao" id="${k.id('ver-palavra-passe')}" aria-label="Mostrar palavra-passe" aria-pressed="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>${manter}
        <div class="formulario__accoes">
          <button type="submit" class="btn btn--acao btn--bloco" id="${k.id('entrar')}">
            <svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
            <span class="btn__rotulo">Entrar</span>
          </button>
          <!-- 19 §1: a recuperação é a última coisa do formulário, e é do Keycloak. -->
          <a class="ligacao-recuperar" href="#">Esqueceu-se da palavra-passe?</a>
        </div>
      </form>
      ${o.variante === 'completa' && !o.minimo && o.realm ? `<p class="cartao__versao">Valida no Keycloak · realm ${o.realm}</p>` : ''}
    </section>`;
}

/* ---------------- 03 · O início de sessão da empresa ---------------- */
function cartaoFederado(o: OpcoesEntrar, k: Chaves): string {
  const topoCartao = o.fixo
    ? `<div class="cartao__cabeca">${o.minimo ? selo(o, '', true) : marca(o, 'lockup--centro')}</div>`
    : `<p class="fora__marca">Fora ${o.feminino ? 'da' : 'do'} ${o.produto}</p>`;
  return `<section class="cartao${o.fixo ? '' : ' cartao--fora'}" aria-labelledby="${k.id('titulo-fora')}">
      ${topoCartao}
      <h2 class="cartao__titulo" id="${k.id('titulo-fora')}">Página do fornecedor da empresa</h2>
      <p class="cartao__sub">Por exemplo, o Entra ID da Exemplo, Lda. O desenho é o dela.</p>
      <div class="formulario">
        <p class="identidade"><span class="identidade__correio">ana.ribeiro@exemplo.pt</span></p>
        <div class="campo">
          <label class="campo__label" for="${k.id('fator-empresa')}">Segundo fator do cliente</label>
          <input class="input" id="${k.id('fator-empresa')}" type="text" value="código da aplicação" disabled>
        </div>
        <div class="formulario__accoes">
          <button type="button" class="btn btn--acao btn--bloco">${SVG_ENTRAR}<span class="btn__rotulo">Entrar na Exemplo</span></button>
        </div>
      </div>
      <div class="cartao__pe">
        <span>Não é a sua empresa?</span>
        <a class="ligacao-recuperar" href="#" ${k.ir('entrada')}>Usar outro endereço</a>
      </div>
    </section>`;
}

/* ---------------- 04 · Precisa de ajuda? ----------------
   Para quem não consegue entrar. Não é um formulário: diz o que fazer em
   cada caso e a quem ligar. A recuperação da palavra-passe continua a ser
   do Keycloak, no 02; aqui só se diz onde está. */
const AJUDA_ICONES = {
  chave: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7"/><path d="m16 7 3 3"/><path d="m14 9 2 2"/>',
  cadeado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  empresa: '<path d="M3 21V8l6-4 6 4v13"/><path d="M15 21V11h6v10"/><path d="M2 21h20"/>',
  telefone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
};
function icone(nome: keyof typeof AJUDA_ICONES): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${AJUDA_ICONES[nome]}</svg>`;
}

function cartaoAjuda(o: OpcoesEntrar, k: Chaves): string {
  const casos: [keyof typeof AJUDA_ICONES, string, string][] = [
    ['chave', 'Esqueci-me da palavra-passe', 'No passo seguinte, «Esqueceu-se da palavra-passe?».'],
    /* nas internas a conta nasce no administrador; na loja e no marketplace pede-se */
    o.convite
      ? ['cadeado', 'Ainda não tenho conta', `No primeiro passo, «${o.convite.ligacao}».`]
      : ['cadeado', 'Não tenho conta ou está bloqueada', 'Fale com o administrador da sua empresa.'],
    ['empresa', 'Entro com a conta da empresa', 'Escreva o endereço: seguimos para a página dela.'],
  ];
  const cabeca = o.minimo ? selo(o) : marca(o, 'lockup--centro');
  return `<section class="cartao cartao--ajuda" aria-labelledby="${k.id('titulo-ajuda')}">
      <div class="cartao__cabeca">${cabeca}</div>
      <h2 class="cartao__titulo" id="${k.id('titulo-ajuda')}">Precisa de ajuda?</h2>
      <ul class="casos">${casos.map(([i, t, d]) => `
        <li class="caso">${icone(i)}<div><p class="caso__titulo">${t}</p><p class="caso__texto">${d}</p></div></li>`).join('')}
      </ul>
      <p class="contacto">${icone('telefone')}<span>${o.semRomafe && !o.comRomafe ? 'Apoio ao cliente' : 'Apoio Romafe'}</span><strong>800 000 000</strong></p>
      <div class="formulario__accoes">
        <a class="btn btn--acao btn--bloco ajuda__voltar" href="#" ${k.ir('entrada')}>${SVG_VOLTAR}<span class="btn__rotulo">Voltar a entrar</span></a>
      </div>
    </section>`;
}

/** Uma versão do início de sessão: as opções com que se desenha. */
export interface VersaoEntrar {
  id: string; nota: string; opcoes: OpcoesEntrar;
  /** os ecrãs onde esta versão não existe (no ERP, a ajuda só tem algumas) */
  sem?: IdEntrar[];
}

/** Os três ecrãs do início de sessão, para a app que os pede, com as versões
    que ela tiver. Se uma app tiver dois produtos, cada um passa o seu prefixo
    para os ids dos ecrãs não se repetirem. */
export function ecrasEntrar<P extends string = ''>(versoes: [VersaoEntrar, ...VersaoEntrar[]], prefixo = '' as P): Ecra<`${P}${IdEntrar}`>[] {
  /* cada versão desenha os três ecrãs; as peças levam a versão no id, para
     duas versões do mesmo ecrã não terem dois #palavra-passe */
  const desenhos = versoes.map((v, i) => {
    const o = v.opcoes;
    const k: Chaves = {
      ir: (id) => `data-ir="${prefixo}${id}"`,
      id: (peca) => prefixo + (i ? v.id + '-' : '') + peca,
    };
    const d = o.variante === 'completa' && o.apresentacao
      ? discursoDe(o.produto, o.apresentacao, !!o.semRomafe, !!o.feminino)
      : { entrada: '', palavraPasse: '', federado: '' };
    /* fixo: o mesmo texto à volta em todos os ecrãs, para o cartão não mudar de sítio */
    const volta = (outro: string): string => (o.fixo ? d.entrada : outro);
    return {
      entrada: pagina(o, d.entrada, cartaoEntrada(o, k)),
      'palavra-passe': pagina(o, volta(d.palavraPasse), cartaoPalavraPasse(o, k)),
      federado: pagina(o, volta(d.federado), cartaoFederado(o, k)),
      ajuda: pagina(o, volta(''), cartaoAjuda(o, k)),
    } as Record<IdEntrar, string>;
  });
  const fluxo = versoes[0].opcoes.fluxo || 'Entrar';
  const ecra = (id: IdEntrar, nome: string, objetivo: string): Ecra<`${P}${IdEntrar}`> => ({
    id: `${prefixo}${id}` as `${P}${IdEntrar}`, nome, fluxo, objetivo,
    versoes: versoes.map((v, i) => ({ id: v.id, nota: v.nota, html: desenhos[i][id], sem: v.sem }))
      .filter((v) => !v.sem?.includes(id))
      /* num ecrã com versões a menos (a ajuda), os números seguem a ordem, sem
         buracos (ela, 8 out. 2026); nos outros ficam os nomes (v3.1 incluída) */
      .map(({ sem: _sem, ...v }, n, todas) => (todas.length < versoes.length ? { ...v, id: 'v' + (n + 1) } : v)) as Ecra['versoes'],
  });
  return [
    ecra('entrada', '01 · Entrar',
      'Passo 1: só o endereço de correio, e o domínio decide o caminho. Conta nossa segue para a palavra-passe (02); empresa com fornecedor próprio segue sozinha para a página dela (03). É uma página do Keycloak: a aplicação só redireciona, nunca recebe a palavra-passe.'),
    ecra('palavra-passe', '02 · A palavra-passe',
      'Passo 2, conta nossa: a palavra-passe valida no Keycloak. O endereço fica à vista com «mudar». A recusa é sempre a mesma, esteja a conta errada, desativada ou inexistente.'),
    ecra('federado', '03 · O início de sessão da empresa',
      'Passo 2, cliente federado: o domínio pertence a uma organização com fornecedor próprio (por exemplo o Entra ID da empresa). A palavra-passe e o segundo fator são do cliente; a página não é nossa. Volta à aplicação já com o token. Não há botão que leve aqui: é o Keycloak que redireciona quando reconhece o domínio do endereço do 01.'),
    ecra('ajuda', '04 · Precisa de ajuda?',
      'Para quem não consegue entrar: o que fazer quando se esquece da palavra-passe, quando não tem conta ou ela está bloqueada, e quando entra com a conta da empresa; e o número do apoio. Abre-se em «Precisa de ajuda?» no 01 e volta-se ao 01.'),
  ];
}

/** A nota do separador da v6, conforme o tipo de aplicação. */
export const NOTA_V6: Record<Familia, string> = {
  interna: 'Família Romafe, aplicações internas: o ROMAFE em Motor no topo, a fotografia do armazém numa metade e o cartão na outra',
  webshop: 'Família Romafe, loja online: o ROMAFE em Motor no topo, um palco claro de loja e o convite para pedir conta',
  marketplace: 'Família Romafe, marketplace: o ROMAFE em Motor no topo, um palco escuro de rede e o convite para vender',
};

/** As versões do início de sessão completo (7 de outubro): v1 com o cartão
    à direita; v2 com o cartão ao centro, sugestão da chefia; v3 a v2 com a
    apresentação de volta, porque à v2 «falta mais algo»; v4 a v3 sem nada
    da Romafe, porque o produto pode ser vendido a outra empresa; v5 a v4
    com o monograma e um fundo desenhado, porque à v4 «parece que falta
    alguma coisa». O que a app quiser diferente sem a Romafe (um texto que
    falava dela) vem em `v4`, e vale para a v4 e a v5. A v6 (8 out.) é a
    família Romafe, e é a única que usa a `familia` e o `convite` da app; a
    v7 é a v6 com o cartão ao centro, e o que a app lá quiser diferente vem em `v7`. */
export function versoesCompletas(v6: OpcoesEntrar, v4: Partial<OpcoesEntrar> = {}, v7: Partial<OpcoesEntrar> = {}): [VersaoEntrar, VersaoEntrar, VersaoEntrar, VersaoEntrar, VersaoEntrar, VersaoEntrar, VersaoEntrar] {
  const o: OpcoesEntrar = { ...v6, familia: undefined, convite: undefined };
  return [
    { id: 'v1', nota: 'Cartão à direita, com a apresentação da app', opcoes: { ...o, disposicao: 'lado' } },
    { id: 'v2', nota: 'Cartão ao centro, sozinho sobre a fotografia', opcoes: { ...o, disposicao: 'centro' } },
    { id: 'v3', nota: 'Cartão ao centro, com o título por cima e as vantagens por baixo', opcoes: { ...o, disposicao: 'centro-apresentacao' } },
    { id: 'v4', nota: 'A v3 sem nada da Romafe: nem o nome, nem o desenho do logótipo, nem a fotografia do armazém', opcoes: { ...o, marca: { ...o.marca, nome: o.produto }, ...v4, disposicao: 'centro-apresentacao', semRomafe: true } },
    { id: 'v5', nota: 'A v4 com marca e fundo: o monograma do produto e um desenho abstrato no lugar da fotografia', opcoes: { ...o, marca: { ...o.marca, nome: o.produto }, ...v4, disposicao: 'centro-apresentacao', semRomafe: true, desenhado: true } },
    { id: 'v6', nota: NOTA_V6[v6.familia ?? 'interna'], opcoes: v6 },
    { id: 'v7', nota: 'Família Romafe com o cartão ao centro: o título por cima e as vantagens por baixo, sobre o fundo do tipo', opcoes: { ...v6, ...v7, centro: true } },
  ];
}

/** As versões numeram-se pela ordem, sem buracos: quando uma sai, as de
    depois sobem um número (ela, 8 out. 2026: «muda só o nome da versão»). */
function numerar(vs: (VersaoEntrar & { ponto?: boolean })[]): [VersaoEntrar, ...VersaoEntrar[]] {
  /* uma versão com `ponto` é uma variante da anterior e leva o número dela
     com .1 (ela, 8 out. 2026: «faz um v3.1»); as outras seguem a ordem */
  let n = 0, p = 0;
  return vs.map(({ ponto, ...v }) => (ponto ? { ...v, id: `v${n}.${++p}` } : (p = 0, { ...v, id: 'v' + ++n }))) as [VersaoEntrar, ...VersaoEntrar[]];
}

/** As versões do login das apps completas (ERP, GoShop, GoParts),
    iguais nas três desde 8 out. 2026 — o que ela foi pedindo no ERP vale para
    a Web: saem a v5 (fundo desenhado) e a v6 (família com o cartão ao lado);
    entram a de pouco texto com a fotografia em diagonal, a da fotografia
    toda com o cartão ao centro e a do vídeo do armazém; números seguidos. Na 04 · Precisa de ajuda?
    ficam só a v1, a v2, a v4 e a v5, numeradas outra vez v1 a v4.
    `selo` é o que vai por baixo do ROMAFE nas duas últimas: «ERP», ou o nome da app. */
export function versoesRomafe(o: OpcoesEntrar, selo: string, v4: Partial<OpcoesEntrar> = {}): [VersaoEntrar, ...VersaoEntrar[]] {
  const minimo = { ...o, familia: undefined };
  const tipo = o.familia ?? 'interna';
  const erp = tipo === 'interna';
  const semAjuda = ['ajuda'] as IdEntrar[];
  const [v1, v2, v3, v4b, familia] = versoesCompletas(o, v4).filter((v) => v.id !== 'v5' && v.id !== 'v6');
  return numerar([
    v1, v2, { ...v3, sem: semAjuda },
    /* ERP, 8 out. 2026: a v3 com a faixa azul das marcas no lugar do rodapé */
    ...(erp ? [{ id: '', ponto: true, nota: 'A v3 com a faixa azul das marcas em baixo, no lugar do rodapé', opcoes: { ...v3.opcoes, faixaMarcas: true }, sem: semAjuda }] : []),
    v4b, familia,
    { id: '', nota: 'Pouco texto à volta: a fotografia sem texto com faixas azuis em diagonal, e o cartão com o ROMAFE, o nome, o campo e a ajuda', opcoes: { ...minimo, minimo: { selo } }, sem: semAjuda },
    /* a da fotografia toda com formas nos cantos saiu do ERP a 8 out. 2026 */
    ...(erp ? [] : [{ id: '', nota: 'A fotografia no ecrã todo, com formas azuis nos cantos, e o cartão da anterior ao centro', opcoes: { ...minimo, minimo: { selo, centro: true } }, sem: semAjuda }]),
    /* 8 out. 2026: o vídeo do armazém ao fundo, primeiro no ERP e depois, a pedido dela, no GoShop e no GoParts */
    { id: '', nota: 'O vídeo do armazém ao fundo, a caixa ao meio e, em baixo, as marcas que a Romafe distribui', opcoes: { ...minimo, minimo: { selo, foto: 'video' } } },
    /* 8 out. 2026: uma interface diferente em cada app (ela: «os ecrãs entre ERP, GoShop e GoParts devem diferir»; a v8 fica igual nas três) */
    { id: '', nota: 'Diferente em cada app: a cena do vídeo e a faixa de baixo', opcoes: { ...minimo, minimo: { selo, foto: 'video', tipo } } },
    /* 8 out. 2026: sem o armazém (ela não quer sempre a mesma imagem); só no ERP */
    ...(erp ? [{ id: '', nota: 'Sem o armazém: a fachada da sede, parada, e a faixa azul com os factos da casa', opcoes: { ...minimo, minimo: { selo, foto: 'cena' as const } } }] : []),
  ]);
}

export const DESCRICAO_ENTRAR =
  'Primeiro o endereço, e o domínio decide o caminho: palavra-passe nossa (02) ou a página da empresa (03). É o mesmo nas três apps.';
