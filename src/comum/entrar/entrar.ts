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

export type IdEntrar = 'entrada' | 'palavra-passe' | 'federado';
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
  /** v8 do ERP (8 out. 2026, a partir de duas imagens dela): pouco texto à
      volta. Sem barra de topo, sem rodapé e sem discurso; no cartão o selo,
      a linha por baixo (marca.sub), o campo e «Precisa de ajuda?». O selo é
      a palavra espaçada por baixo do ROMAFE: «ERP». */
  minimo?: {
    selo: string;
    /** v9: a fotografia no ecrã todo, com o cartão ao centro e duas formas
        azuis nos cantos; a ajuda só em texto */
    centro?: boolean;
  };
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
  const l = lockup(o.marca, cls, idSub);
  if (!o.desenhado) return l;
  const inicial = o.marca.nome.trim().charAt(0).toUpperCase();
  const dir = cls.includes('centro') ? 'marca-produto--coluna' : 'marca-produto--linha';
  if (o.monogramaRomafe) return `<span class="marca-produto ${dir}">${romafe('romafe--cartao')}${l}</span>`;
  return `<span class="marca-produto ${dir}"><span class="marca-produto__monograma" aria-hidden="true">${inicial}</span>${l}</span>`;
}

function lockup(m: OpcoesEntrar['marca'], cls: string, idSub = ''): string {
  return `<span class="lockup ${cls}">
      <span class="lockup__nome">${m.nome}</span>
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
      ${o.variante === 'compacta' && !o.nomeRomafe ? romafe('romafe--cartao') : ''}
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
  if (o.minimo) return paginaMinima(cartao, !!o.minimo.centro);
  if (o.familia) return paginaFamilia(o, discurso, cartao);
  const completa = o.variante === 'completa';
  const centro = completa && o.disposicao === 'centro';
  const centroApr = completa && o.disposicao === 'centro-apresentacao';
  const cls = (centro ? ' entrada--centro' : centroApr ? ' entrada--centro entrada--centro-apresentacao' : '')
    + (o.semRomafe ? ' entrada--neutra' : '') + (o.desenhado ? ' entrada--desenhada' : '');
  return `<div class="entrada entrada--${o.variante}${cls}">
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
  return `<div class="entrada entrada--${o.variante} entrada--familia entrada--${f}${o.centro ? ' entrada--familia-centro' : ''}">
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
  return `<span class="selo${cls ? ' ' + cls : ''}">${romafe('romafe--selo')}<span class="selo__risco" aria-hidden="true"></span><span class="selo__sub">${o.minimo!.selo}</span>${comSub ? `<span class="selo__linha">${o.marca.sub}</span>` : ''}</span>`;
}

/** v8: a fotografia do armazém à esquerda, sem texto, com duas faixas
    azuis em diagonal; o painel claro à direita, recortado em seta, com o
    cartão. Mais nada. */
function paginaMinima(cartao: string, centro: boolean): string {
  const formas = centro
    ? '<div class="minima__canto minima__canto--cima" aria-hidden="true"></div><div class="minima__canto minima__canto--baixo" aria-hidden="true"></div>'
    : '<div class="minima__faixa" aria-hidden="true"></div><div class="minima__painel" aria-hidden="true"></div>';
  return `<div class="entrada entrada--completa entrada--minima${centro ? ' entrada--minima-centro' : ''}">
  <main class="palco">
    <div class="minima__foto" role="img" aria-label="Armazém da Romafe"></div>
    ${formas}
    ${cartao}
  </main>
</div>`;
}

const SVG_AJUDA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/></svg>`;

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
            <p class="apoio__titulo">Precisa de ajuda?</p>
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
      ${o.minimo ? `<div class="ajuda"><a href="#">${o.minimo.centro ? '' : SVG_AJUDA}Precisa de ajuda?</a></div>` : ''}
      ${o.convite ? `<p class="convite">${o.convite.texto} <a href="#">${o.convite.ligacao}</a></p>` : ''}
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
  return `<section class="cartao cartao--fora" aria-labelledby="${k.id('titulo-fora')}">
      <p class="fora__marca">Fora ${o.feminino ? 'da' : 'do'} ${o.produto}</p>
      <h2 class="cartao__titulo" id="${k.id('titulo-fora')}">Página do fornecedor da empresa</h2>
      <p class="cartao__sub">Por exemplo, o Entra ID da Exemplo, Lda. O desenho é o dela.</p>
      <div class="formulario">
        <p class="identidade"><span class="identidade__correio">ana.ribeiro@exemplo.pt</span></p>
        <div class="campo">
          <label class="campo__label" for="${k.id('passe-empresa')}">Palavra-passe da empresa</label>
          <input class="input" id="${k.id('passe-empresa')}" type="password" value="••••••••••" disabled>
        </div>
        <div class="campo">
          <label class="campo__label" for="${k.id('fator-empresa')}">Segundo fator do cliente</label>
          <input class="input" id="${k.id('fator-empresa')}" type="text" value="código da aplicação" disabled>
        </div>
        <div class="formulario__accoes">
          <button type="button" class="btn btn--acao btn--bloco"><span class="btn__rotulo">Entrar na Exemplo</span></button>
        </div>
      </div>
      <div class="cartao__pe">
        <span>Não é a sua empresa?</span>
        <a class="ligacao-recuperar" href="#" ${k.ir('entrada')}>Usar outro endereço</a>
      </div>
    </section>`;
}

/** Uma versão do início de sessão: as opções com que se desenha. */
export interface VersaoEntrar { id: string; nota: string; opcoes: OpcoesEntrar }

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
    return {
      entrada: pagina(o, d.entrada, cartaoEntrada(o, k)),
      'palavra-passe': pagina(o, d.palavraPasse, cartaoPalavraPasse(o, k)),
      federado: pagina(o, d.federado, cartaoFederado(o, k)),
    } as Record<IdEntrar, string>;
  });
  const fluxo = versoes[0].opcoes.fluxo || 'Entrar';
  const ecra = (id: IdEntrar, nome: string, objetivo: string): Ecra<`${P}${IdEntrar}`> => ({
    id: `${prefixo}${id}` as `${P}${IdEntrar}`, nome, fluxo, objetivo,
    versoes: versoes.map((v, i) => ({ id: v.id, nota: v.nota, html: desenhos[i][id] })) as Ecra['versoes'],
  });
  return [
    ecra('entrada', '01 · Entrar',
      'Passo 1: só o endereço de correio, e o domínio decide o caminho. Conta nossa segue para a palavra-passe (02); empresa com fornecedor próprio segue sozinha para a página dela (03). É uma página do Keycloak: a aplicação só redireciona, nunca recebe a palavra-passe.'),
    ecra('palavra-passe', '02 · A palavra-passe',
      'Passo 2, conta nossa: a palavra-passe valida no Keycloak. O endereço fica à vista com «mudar». A recusa é sempre a mesma, esteja a conta errada, desativada ou inexistente.'),
    ecra('federado', '03 · O início de sessão da empresa',
      'Passo 2, cliente federado: o domínio pertence a uma organização com fornecedor próprio (por exemplo o Entra ID da empresa). A palavra-passe e o segundo fator são do cliente; a página não é nossa. Volta à aplicação já com o token. Não há botão que leve aqui: é o Keycloak que redireciona quando reconhece o domínio do endereço do 01.'),
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
    { id: 'v7', nota: 'A v6 com o cartão ao centro: o título por cima e as vantagens por baixo, sobre o fundo do tipo', opcoes: { ...v6, ...v7, centro: true } },
  ];
}

export const DESCRICAO_ENTRAR =
  'Primeiro o endereço, e o domínio decide o caminho: palavra-passe nossa (02) ou a página da empresa (03). É o mesmo nas três apps.';
