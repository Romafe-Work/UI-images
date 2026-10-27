/* =========================================================
   PICK — o módulo Inventário (21 out. 2026)
   Do briefing «Industrial warehouse app — Module 01: Inventory» que ela colou, ajustado ao que está decidido:
   - o nome é Pick (8 out.); o terminal é o Honeywell EDA61K, Android 11, 320 × 533 dp; a leitura chega pela Data
     Collection Intent API (é ela que distingue um código lido de um escrito à mão) — aqui, toca-se no leitor para
     simular a tecla física;
   - o «inventário» são três operações (21 out.): a contagem física, a correção de posição e a consulta de stock;
   - contar é da Arrumação (não há função «inventário»); as contagens são atribuídas (o gestor planeia);
   - a Pick não trabalha sem rede (16 set.): sem rede, a contagem para e nada fica guardado à espera — por isso não
     há «por sincronizar», fila local nem conflitos de sincronização;
   - posições com oito algarismos: armazém 60 · zona · coluna · prateleira (não há corredor nem nível);
   - entra-se com palavra-passe (17 set.).
   Contar não é ajustar: o operador regista o que vê; quem compara com o stock e decide é o gestor (às cegas: o
   operador nunca vê a quantidade do sistema, nem pelo progresso, que conta posições e não unidades).
   Os dados são de exemplo: o INV-2026-014 da zona 30, posições e artigos inventados para mostrar o fluxo.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { I, IC, BOTAO, GIRADOR, E, pick, aviso } from './estados';
import { CAIXA, CARRINHO_MINI } from './cena';

export type IdInventario = 'inv-inicio' | 'inv-lista' | 'inv-posicao' | 'inv-artigo' | 'inv-quantidade' | 'inv-guardada' | 'inv-unidades' | 'inv-fim-posicao'
  | 'inv-contados' | 'inv-corrigir' | 'inv-pausa' | 'inv-submeter' | 'inv-divergencias' | 'inv-recontar' | 'inv-corrigir-posicao' | 'inv-consultar';
export type IdEstadoInventario = 'inv-sem-contagens' | 'inv-carga' | 'inv-posicao-ok' | 'inv-posicao-fora' | 'inv-desconhecido' | 'inv-repetido' | 'inv-qtd-invalida'
  | 'inv-a-guardar' | 'inv-nao-guardou' | 'inv-sem-rede' | 'inv-retomada' | 'inv-submetida' | 'inv-sem-permissao' | 'inv-sessao' | 'inv-leitor-parado' | 'inv-leitor-sem-perfil' | 'inv-consultar-fechado';

const FUNCAO = 'Arrumação';
const IC2 = {
  ...IC,
  mais: '<path d="M12 5v14M5 12h14"/>', menos: '<path d="M5 12h14"/>', apagar: '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path d="m18 9-6 6M12 9l6 6"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', pausa: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  enviar: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>', caixa: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>', teclado: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M8 17h8"/>',
  diferenca: '<path d="M12 3v18M3 12h18"/>', seta: '<path d="m9 18 6-6-6-6"/>', som: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
};

/* ---------- os dados de exemplo ---------- */
export const INV = 'INV-2026-014';
export const POS = '60300102', POS_PARTES = 'Armazém 60 · Zona 30 · Coluna 01 · Prateleira 02';
export const ART = { ref: 'SKF02553', desc: 'Autocolante', marca: 'SKF', un: 'un.', ean: '7316200025531' };

/* ---------- peças ---------- */
/** A barra da contagem ativa: o inventário e a posição, sempre à vista; «Mudar» volta a ler a posição. */
const contagemTopo = (posicao = POS, mudar = true) => `<section class="iv-ativa" aria-label="Contagem ativa">
    <p class="iv-ativa__inv"><b>${INV}</b><span>Zona 30 · às cegas</span></p>
    ${posicao ? `<p class="iv-ativa__pos"><span class="iv-ativa__rot">Posição</span><b class="iv-pos">${posicao}</b>${mudar ? `<button type="button" class="iv-ligacao" data-ir="inv-posicao">Mudar</button>` : ''}</p>` : ''}
  </section>`;
/** O leitor: a área grande que diz o que ler; tocá-la simula a tecla física do EDA61K. */
const leitor = (o: { titulo: string; texto: string; codigo?: string; ir?: string; tipo?: string; estado?: '' | 'ok' | 'erro' | 'parado' }) => `<button type="button" class="iv-leitor${o.estado ? ` iv-leitor--${o.estado}` : ''}" data-ler="${o.codigo ?? ''}" data-tipo-leitura="${o.tipo ?? ''}"${o.ir ? ` data-depois="${o.ir}"` : ''} aria-describedby="iv-leitor-ajuda">
    <span class="iv-leitor__icone">${I(IC.ler)}</span>
    <span class="iv-leitor__titulo">${o.titulo}</span>
    <span class="iv-leitor__texto" id="iv-leitor-ajuda">${o.texto}</span>
  </button>`;
const artigoHtml = (destaque = false) => `<section class="iv-artigo${destaque ? ' is-novo' : ''}">
    <span class="iv-artigo__img" aria-hidden="true">${I(IC2.caixa)}</span>
    <div><p class="iv-artigo__ref">${ART.ref}</p><p class="iv-artigo__desc">${ART.desc} · ${ART.marca}</p>
    <p class="iv-artigo__meta">EAN ${ART.ean} · unidade: ${ART.un}</p></div>
  </section>`;
/** A quantidade: o número grande, − e +, e o teclado numérico do ecrã (o EDA61K tem também o físico). */
const quantidade = (valor = '12', o: { erro?: string; unidades?: boolean } = {}) => `<div class="iv-qtd${o.erro ? ' is-erro' : ''}" data-qtd>
    <label class="iv-qtd__rot" for="iv-qtd-n">Quantidade contada <span>(${ART.un})</span></label>
    <div class="iv-qtd__linha">
      <button type="button" class="iv-qtd__bt" data-qtd-passo="-1" aria-label="Menos 1">${I(IC2.menos)}</button>
      <input class="iv-qtd__n" id="iv-qtd-n" value="${valor}" inputmode="numeric" autocomplete="off" aria-invalid="${!!o.erro}"${o.erro ? ' aria-describedby="iv-qtd-erro"' : ''}>
      <button type="button" class="iv-qtd__bt" data-qtd-passo="1" aria-label="Mais 1">${I(IC2.mais)}</button>
    </div>
    ${o.erro ? `<p class="iv-qtd__erro" id="iv-qtd-erro" role="alert">${I(IC.aviso)}${o.erro}</p>` : ''}
    ${o.unidades ? '' : `<div class="iv-teclado" role="group" aria-label="Teclado numérico">${['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => `<button type="button" class="iv-tecla" data-tecla="${k}">${k}</button>`).join('')}<button type="button" class="iv-tecla iv-tecla--leve" data-tecla="limpar" aria-label="Limpar">${I(IC2.apagar)}</button><button type="button" class="iv-tecla" data-tecla="0">0</button><button type="button" class="iv-tecla iv-tecla--leve" data-tecla="apagar" aria-label="Apagar um algarismo">←</button></div>`}
  </div>`;
const linhaContada = (ref: string, desc: string, q: string, quando: string, extra = '') => `<li class="iv-linha${extra}"><div><b>${ref}</b><span>${desc}</span></div><div class="iv-linha__q"><b>${q}</b><span>${quando}</span></div></li>`;
const CONTADOS = [linhaContada('SKF VKBA 6556', 'Kit de rolamento de roda', '4 un.', '10:42'), linhaContada('SKF VKMV 6PK1873', 'Correia poli-V', '12 un.', '10:40')].join('');
/** (21 out., «Every movement counts») o percurso de cada contagem: posição → artigo → quantidade → registada, com o
    carrinho no passo em que se está. São os passos reais de uma contagem, não uma percentagem decorativa. */
const PASSOS = ['Posição', 'Artigo', 'Quantidade', 'Registada'];
const jornada = (feitos: number) => `<ol class="iv-jornada" aria-label="Passos desta contagem" style="--feito:${feitos}">${PASSOS.map((p, i) => `<li class="${i < feitos ? 'is-feito' : i === feitos ? 'is-atual' : ''}"${i === feitos ? ' aria-current="step"' : ''}><i aria-hidden="true"></i><span>${p}</span></li>`).join('')}<span class="iv-jornada__carro" aria-hidden="true">${CARRINHO_MINI}</span></ol>`;
const progresso = (feitas: number, total: number) => `<div class="iv-prog"><p><span>Posições contadas</span><b>${feitas} de ${total}</b></p><div class="iv-prog__barra" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${feitas}" aria-label="Posições contadas"><i style="--p:${(feitas / total).toFixed(3)}"></i></div></div>`;

/* =========================================================
   Os ecrãs
   ========================================================= */
/* 40 · o Inventário (21 out., com mais energia): a faixa azul com a caixa que veio da entrada; a contagem para continuar
   à frente de tudo; iniciar a seguinte e consultar as contagens; as duas operações */
const inicio = (sem = false) => pick(`
    <header class="iv-cabeca">
      <div class="iv-cabeca__texto"><p class="iv-cabeca__sobre">Armazém 60 · Arrumação</p><h1>Inventário</h1>
        <p class="iv-cabeca__estado"><span class="iv-pilula"><i></i>Rede</span><span class="iv-pilula"><i></i>Servidor</span></p></div>
      <div class="iv-cabeca__caixa">${CAIXA()}</div>
    </header>
    ${sem ? `<section class="iv-vazio">${I(IC.cafe)}<p><b>Não tem contagens atribuídas.</b> Quando o gestor planear uma contagem para si, aparece aqui.</p></section>`
    : `<button type="button" class="iv-continuar" data-ir="inv-posicao">
      <span class="iv-continuar__rot">Continuar inventário</span>
      <span class="iv-continuar__inv">${INV}</span>
      <span class="iv-continuar__meta">Zona 30 · por posição · às cegas · parou em ${POS}</span>
      ${progresso(18, 46)}
      <span class="iv-continuar__acao">Continuar ${I(IC2.seta)}</span>
    </button>
    <div class="iv-accoes">
      <button type="button" class="iv-opcao" data-ir="inv-posicao">${I(IC.ler)}<span><b>Iniciar inventário</b><small>INV-2026-015 · cíclica · zona 10</small></span>${I(IC2.seta, 'iv-opcao__seta')}</button>
      <button type="button" class="iv-opcao" data-ir="inv-lista">${I(IC2.lista)}<span><b>Consultar contagens</b><small>3 atribuídas · 1 submetida</small></span>${I(IC2.seta, 'iv-opcao__seta')}</button>
    </div>`}
    <h2 class="iv-subtitulo">Operações</h2>
    <div class="iv-quadrados">
      <button type="button" class="iv-quadrado" data-ir="inv-corrigir-posicao">${I(IC.corrigir)}<span>Corrigir posição</span></button>
      <button type="button" class="iv-quadrado" data-ir="inv-consultar">${I(IC2.lupa)}<span>Consultar stock</span></button>
    </div>`, { funcao: FUNCAO });

/* 41 · as contagens atribuídas: número, tipo, área, data, estado e progresso (em posições) */
export const CONTAGENS: [string, string, string, string, string, string, number, number][] = [
  [INV, 'Por posição', 'Zona 30 · colunas 01–12', '21/10/2026', 'Em curso', 'curso', 18, 46],
  ['INV-2026-015', 'Cíclica', 'Zona 10 · rolamentos', '22/10/2026', 'Planeada', 'planeada', 0, 30],
  ['INV-2026-011', 'Por posição', 'Zona 21 · colunas 01–04', '18/10/2026', 'Submetida', 'submetida', 16, 16],
];
const lista = () => pick(`<h1 class="iv-titulo">Contagens atribuídas</h1>
    <ul class="iv-contagens" role="list">${CONTAGENS.map(([n, tipo, area, data, est, k, f, t]) => `<li><button type="button" class="iv-contagem iv-contagem--${k}"${k === 'submetida' ? ' disabled' : ' data-ir="inv-posicao"'}>
      <span class="iv-contagem__topo"><b>${n}</b><span class="iv-estado iv-estado--${k}">${est}</span></span>
      <span class="iv-contagem__meta">${tipo} · ${area}</span><span class="iv-contagem__meta">${data} · atribuída a Joana Silva</span>
      ${progresso(f, t)}</button></li>`).join('')}</ul>
    <p class="pk-nota">O gestor planeia as contagens. As submetidas ficam à espera da conferência.</p>`, { funcao: FUNCAO });

/* 42 · ler a posição primeiro */
const posicao = (est: '' | 'ok' | 'fora' = '') => pick(`${contagemTopo('', false)}
    ${est === 'fora' ? aviso('erro', IC.posicao, 'Localização inválida para este inventário.', 'Leu <strong>60100304</strong> (zona 10). Esta contagem é da <strong>zona 30</strong>, colunas 01 a 12.')
    : est === 'ok' ? `<section class="iv-pos-lida" role="status"><span class="iv-pos-lida__ok">${I(IC.fechar)}</span><p class="iv-pos">${POS}</p><p class="pk-posicao__partes">${POS_PARTES}</p><p class="pk-nota">Posição certa. A passar ao artigo…</p></section>`
    : leitor({ titulo: 'Leia a etiqueta da posição', texto: 'Use a tecla de leitura do PDA. Os oito algarismos: armazém, zona, coluna, prateleira.', codigo: POS, tipo: 'posicao', ir: 'inv-artigo' })}
    ${est === 'ok' ? '' : `<button type="button" class="iv-ligacao iv-ligacao--bloco" data-ir="inv-pausa">${I(IC2.pausa)}Pausar a contagem</button>`}`,
  { funcao: FUNCAO, pe: est === 'fora' ? BOTAO('Ler a etiqueta certa', IC.ler, 'btn--acao', ' data-ir="inv-posicao"') : est === 'ok' ? '' : BOTAO('Escrever a posição à mão', IC2.teclado, 'btn--ghost') });

/* 44 · na posição: ler cada artigo; o que já se contou aqui por baixo */
const artigo = (est: '' | 'desconhecido' | 'repetido' | 'sem-rede' = '') => pick(`${contagemTopo()}${jornada(1)}
    ${est === 'desconhecido' ? aviso('erro', IC.codigo, 'Artigo não encontrado.', 'O código <strong>5601234000017</strong> não é de nenhum artigo do catálogo nem desta contagem.')
    + '<p class="pk-nota">Leia outra etiqueta do artigo. Se não tiver, separe-o e avise o gestor: fica registado como artigo por identificar nesta posição.</p>'
    : est === 'repetido' ? aviso('aviso', IC.aviso, `Já contou ${ART.ref} nesta posição`, 'Registou <strong>12 un.</strong> às 10:44. Leu de novo o mesmo código.')
      + '<p class="pk-nota">Se encontrou mais unidades, some-as. Se a primeira contagem estava errada, corrija-a — a anterior fica guardada com o motivo.</p>'
    : est === 'sem-rede' ? aviso('aviso', IC.semrede, 'Sem rede', 'A Pick precisa de rede para registar. Esta contagem não foi registada; as anteriores estão no servidor.')
      + `<p class="pk-estado" role="status">${GIRADOR('girador--pequeno')}A procurar rede…</p>`
    : leitor({ titulo: 'Leia o código do artigo', texto: 'Um artigo de cada vez. Depois escreve a quantidade.', codigo: ART.ean, tipo: 'artigo', ir: 'inv-quantidade' })}
    ${est ? '' : `<h2 class="iv-subtitulo">Contados nesta posição <span>2</span></h2><ul class="iv-linhas" role="list">${CONTADOS}</ul>`}`,
  { funcao: FUNCAO, rede: est !== 'sem-rede', pe: est === 'repetido' ? BOTAO('Somar mais unidades', IC2.mais, 'btn--acao', ' data-ir="inv-quantidade"') + BOTAO('Corrigir a contagem', IC.corrigir, 'btn--ghost', ' data-ir="inv-corrigir"')
    : est === 'sem-rede' ? BOTAO('Tentar de novo', IC.denovo) : est === 'desconhecido' ? BOTAO('Ler outra vez', IC.ler, 'btn--acao', ' data-ir="inv-artigo"') : BOTAO('Acabei esta posição', IC.fechar, 'btn--ghost', ' data-ir="inv-fim-posicao"') });

/* 45 · o artigo lido e a quantidade (às cegas: nunca se mostra a do sistema) */
const qtdEcra = (est: '' | 'invalida' | 'a-guardar' | 'nao-guardou' = '') => pick(`${contagemTopo()}${jornada(2)}
    ${artigoHtml(est === '')}
    ${quantidade(est === 'invalida' ? '1,5' : '12', { erro: est === 'invalida' ? 'Este artigo conta-se à unidade: escreva um número inteiro.' : undefined })}
    ${est === 'nao-guardou' ? aviso('erro', IC.servidor, 'A contagem não ficou registada', 'O servidor não respondeu. Os 12 continuam escritos: confirme outra vez.') : ''}`,
  { funcao: FUNCAO, pe: est === 'a-guardar' ? `<button type="button" class="btn btn--acao pk-botao is-a-carregar" disabled>${GIRADOR('girador--claro')}<span class="btn__rotulo">A registar…</span></button>`
    : BOTAO('Confirmar contagem', IC.fechar, 'btn--acao', ` data-confirmar data-ir="inv-guardada"${est === 'invalida' ? ' disabled' : ''}`) });

/* 46 · registada: o verde por um instante e o leitor pronto para o artigo seguinte (não se espera pela animação) */
const guardada = () => pick(`${contagemTopo()}${jornada(4)}
    <p class="iv-registada" role="status">${I(IC.fechar)}<span><b>${ART.ref} · 12 ${ART.un}</b> registado às 10:44</span></p>
    ${leitor({ titulo: 'Leia o artigo seguinte', texto: 'Ou «Acabei esta posição» quando não houver mais.', codigo: ART.ean, tipo: 'artigo', ir: 'inv-repetido', estado: 'ok' })}
    <h2 class="iv-subtitulo">Contados nesta posição <span>3</span></h2><ul class="iv-linhas" role="list">${linhaContada(ART.ref, ART.desc, `12 ${ART.un}`, '10:44', ' is-nova')}${CONTADOS}</ul>`,
  { funcao: FUNCAO, pe: BOTAO('Acabei esta posição', IC.fechar, 'btn--ghost', ' data-ir="inv-fim-posicao"') });

/* 47 · à unidade: cada leitura do mesmo código soma 1 (só quando a contagem o permite, e diz-se) */
const unidades = () => pick(`${contagemTopo()}
    <p class="iv-modo">${I(IC2.mais)}<span><b>Contagem à unidade.</b> Cada leitura do mesmo código soma 1.</span></p>
    ${artigoHtml()}
    <div class="iv-soma" role="status" aria-live="polite"><b data-soma>3</b><span>unidades lidas</span><small>Leia de novo para somar 1</small></div>
    ${leitor({ titulo: 'Leia a unidade seguinte', texto: 'Outro código fecha este artigo e passa ao seguinte.', codigo: ART.ean, tipo: 'unidade', estado: 'ok' })}`,
  { funcao: FUNCAO, pe: BOTAO('Confirmar 3 unidades', IC.fechar, 'btn--acao', ' data-ir="inv-guardada"') });

/* 48 · acabou a posição: resumo e a seguinte */
const fimPosicao = () => pick(`${contagemTopo(POS, false)}
    <section class="pk-cartao pk-cartao--feito"><span class="pk-aviso__icone pk-aviso__icone--ok">${I(IC.fechar)}</span><p class="pk-cartao__titulo">Posição ${POS} contada</p><p class="pk-nota">3 artigos · 28 unidades</p></section>
    ${progresso(19, 46)}`,
  { funcao: FUNCAO, pe: BOTAO('Ler a posição seguinte', IC.ler, 'btn--acao', ' data-ir="inv-posicao"') + BOTAO('Ver o que já contei', IC2.lista, 'btn--ghost', ' data-ir="inv-contados"') });

/* 49 · o que já contei: por posição, com a hora; corrigir quando é permitido */
const contados = () => pick(`<h1 class="iv-titulo">O que já contei</h1><p class="pk-nota">${INV} · 19 posições · registos no servidor</p>
    <h2 class="iv-subtitulo">${POS}</h2><ul class="iv-linhas" role="list">${linhaContada(ART.ref, ART.desc, `12 ${ART.un}`, '10:44')}${CONTADOS}</ul>
    <h2 class="iv-subtitulo">60300101</h2><ul class="iv-linhas" role="list">${linhaContada('INA 530 0089 10', 'Kit de distribuição', '2 un.', '10:31')}${linhaContada('SKF VKPC 88618', 'Bomba de água', '5 un.', '10:29', ' is-corrigida')}</ul>
    <p class="pk-nota">«Corrigida» quer dizer que há uma contagem anterior guardada, com o motivo e quem corrigiu.</p>`,
  { funcao: FUNCAO, pe: BOTAO('Corrigir uma contagem', IC.corrigir, 'btn--ghost', ' data-ir="inv-corrigir"') + BOTAO('Voltar à contagem', IC.voltar, 'btn--acao', ' data-ir="inv-artigo"') });

/* 50 · corrigir: a nova quantidade e o motivo; a anterior não se apaga */
export const MOTIVOS = ['Contei mal', 'Encontrei mais unidades', 'Artigo noutra posição', 'Outro motivo'];
const corrigir = () => pick(`${contagemTopo()}
    <p class="iv-antes"><span>Registado às 10:44</span><b>${ART.ref} · 12 ${ART.un}</b></p>
    ${quantidade('14', { unidades: true })}
    <fieldset class="iv-motivos"><legend>Motivo <span>(obrigatório)</span></legend>${MOTIVOS.map((m, i) => `<label class="iv-motivo"><input type="radio" name="iv-motivo"${i === 1 ? ' checked' : ''}><span>${m}</span></label>`).join('')}</fieldset>
    <p class="pk-nota">A contagem de 12 fica guardada; a nova (14) fica com o motivo, a hora e quem corrigiu.</p>`,
  { funcao: FUNCAO, pe: BOTAO('Registar a correção', IC.fechar, 'btn--acao', ' data-ir="inv-guardada"') + BOTAO('Cancelar', IC.voltar, 'btn--ghost', ' data-ir="inv-artigo"') });

/* 51 · pausar: o que fica e como se volta */
const pausa = (retomada = false) => pick(retomada
  ? aviso('azul', IC.relogio, 'Contagem retomada', `Voltou ao ${INV} na posição ${POS}, onde parou às 10:46. O que já contou está no servidor.`)
  : aviso('azul', IC2.pausa, 'Pausar a contagem?', `O ${INV} fica em pausa na posição ${POS}. Volta exatamente aqui, neste ou noutro PDA.`)
    + '<p class="pk-nota">Nada se perde: cada contagem é registada no servidor quando a confirma.</p>',
  { funcao: FUNCAO, pe: retomada ? BOTAO('Continuar a contar', IC.ler, 'btn--acao', ' data-ir="inv-artigo"') : BOTAO('Pausar', IC2.pausa, 'btn--acao', ' data-ir="inv-inicio"') + BOTAO('Continuar a contar', IC.voltar, 'btn--ghost', ' data-ir="inv-artigo"') });

/* 52 · submeter: todas as posições contadas → para conferência */
const submeter = (feita = false) => pick(feita
  ? aviso('azul', IC.fechar, 'Contagem submetida', `O ${INV} foi para conferência. O gestor compara com o stock; se for preciso recontar, aparece-lhe aqui.`)
  : `<h1 class="iv-titulo">Submeter a contagem</h1>${progresso(46, 46)}
    <ul class="iv-resumo"><li><span>Posições contadas</span><b>46</b></li><li><span>Artigos registados</span><b>128</b></li><li><span>Correções</span><b>3</b></li><li><span>Artigos por identificar</span><b>1</b></li></ul>
    <p class="pk-nota">Depois de submeter, já não se pode corrigir: só o gestor pede recontagens.</p>`,
  { funcao: FUNCAO, pe: feita ? BOTAO('Voltar ao Inventário', IC.voltar, 'btn--acao', ' data-ir="inv-inicio"') : BOTAO('Submeter para conferência', IC2.enviar, 'btn--acao', ' data-ir="inv-submetida"') + BOTAO('Voltar', IC.voltar, 'btn--ghost', ' data-ir="inv-contados"') });

/* 53 · divergências (gestor): contado, sistema, diferença e pedir recontagem */
export const DIV: [string, string, number, number, string][] = [['60300102', 'SKF02553 · Autocolante', 14, 18, ''], ['60300101', 'SKF VKPC 88618 · Bomba de água', 5, 5, 'ok'], ['60300107', 'INA 530 0089 10 · Kit de distribuição', 0, 3, 'recontar']];
const divergencias = () => pick(`<h1 class="iv-titulo">Divergências</h1><p class="pk-nota">${INV} · em conferência · só o gestor vê o stock do sistema</p>
    <ul class="iv-div" role="list">${DIV.map(([p, a, c, s, k]) => { const d = c - s; return `<li class="iv-div__li${k ? ` iv-div__li--${k}` : ''}"><p class="iv-div__pos">${p}</p><p class="iv-div__art">${a}</p>
      <dl><div><dt>Contado</dt><dd>${c}</dd></div><div><dt>Sistema</dt><dd>${s}</dd></div><div><dt>Diferença</dt><dd class="${d < 0 ? 'is-menos' : d > 0 ? 'is-mais' : ''}">${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d)}</dd></div></dl>
      ${k === 'recontar' ? '<span class="iv-estado iv-estado--planeada">Recontagem pedida</span>' : k === 'ok' ? '<span class="iv-estado iv-estado--submetida">Sem diferença</span>' : `<button type="button" class="btn btn--ghost iv-bt-peq" data-ir="inv-recontar">${I(IC.denovo, 'btn__icone')}<span class="btn__rotulo">Pedir recontagem</span></button>`}</li>`; }).join('')}</ul>
    <p class="pk-nota">Ajustar o stock é outra operação, do gestor, depois da conferência. Recontar não apaga as contagens anteriores.</p>`,
  { funcao: 'Gestor' });

/* 54 · recontar (o operador): às cegas, sem a contagem anterior nem a do sistema */
const recontar = () => pick(`${aviso('aviso', IC.denovo, 'Recontagem pedida', `O gestor pediu para recontar <strong>${ART.ref}</strong> na posição <strong>${POS}</strong>.`)}
    <p class="pk-nota">Conte como da primeira vez: não se mostra o que contou antes nem o que o sistema diz.</p>`,
  { funcao: FUNCAO, pe: BOTAO('Ler a posição', IC.ler, 'btn--acao', ' data-ir="inv-posicao"') });

/* 55 · corrigir posição (operação): ler a posição, ler o artigo, o que lá está — o motor de correções decide */
const corrigirPosicao = () => pick(`<h1 class="iv-titulo">Corrigir posição</h1>
    <section class="iv-ativa"><p class="iv-ativa__pos"><span class="iv-ativa__rot">Posição</span><b class="iv-pos">60300105</b></p></section>
    ${artigoHtml()}
    <div class="campo"><label class="campo__label" for="iv-cp">Na posição estão</label><input class="input pk-campo" id="iv-cp" value="7" inputmode="numeric"></div>
    <p class="pk-nota">A correção vai para o motor de correções: conta para o limite de correções abertas da posição.</p>`,
  { funcao: FUNCAO, pe: BOTAO('Corrigir a posição', IC.corrigir, 'btn--acao', ' data-ir="inv-inicio"') + BOTAO('Cancelar', IC.voltar, 'btn--ghost', ' data-ir="inv-inicio"') });

/* 56 · consultar stock: ler um artigo ou uma posição e ver o que o sistema diz (fechada durante uma contagem às cegas da mesma zona) */
const consultar = (fechado = false) => pick(fechado
  ? aviso('aviso', IC.posicao, 'Consulta fechada nesta zona', `Está a contar a zona 30 às cegas (${INV}). Até submeter, a consulta de stock da zona 30 não mostra quantidades.`)
  : `<h1 class="iv-titulo">Consultar stock</h1>
    ${leitor({ titulo: 'Leia um artigo ou uma posição', texto: 'Mostra onde está e quanto o sistema diz que há. Não regista nada.', codigo: '7316201250277', tipo: 'consulta' })}
    <section class="iv-consulta"><p class="iv-artigo__ref">SKF VKBA 6556</p><p class="iv-artigo__desc">Kit de rolamento de roda, eixo dianteiro</p>
      <ul class="iv-linhas" role="list">${linhaContada('60101203', 'Zona 10 · Coluna 12 · Prateleira 03', '12 un.', 'Porto')}${linhaContada('60211401', 'Zona 21 · Coluna 14 · Prateleira 01', '4 un.', 'Porto')}</ul></section>`,
  { funcao: FUNCAO, pe: BOTAO('Voltar ao Inventário', IC.voltar, 'btn--ghost', ' data-ir="inv-inicio"') });

/* estados que não são de um ecrã só */
/* 40.2 · a carregar: uma estante que se enche de caixas em contorno, enquanto as contagens chegam (sem percentagem) */
const carga = () => pick(`<section class="iv-enche" role="status" aria-live="polite"><svg viewBox="0 0 200 120" fill="none" aria-hidden="true"><path class="iv-enche__est" d="M10 6v110M190 6v110M10 42h180M10 80h180M10 116h180"/>${[[18, 16, 30, 24], [54, 20, 26, 20], [86, 14, 34, 26], [128, 18, 28, 22], [22, 54, 36, 24], [64, 58, 26, 20], [98, 52, 30, 26], [140, 56, 34, 22], [30, 92, 28, 22], [66, 90, 34, 24]].map(([x, y, w, h], i) => `<rect class="iv-enche__cx" x="${x}" y="${y}" width="${w}" height="${h}" rx="2" style="--i:${i}"/>`).join('')}</svg><p>${GIRADOR('girador--pequeno')}A carregar as suas contagens…</p></section>
    <section class="pk-cartao" aria-hidden="true">${E(40, 'esq--rotulo')}${E(70, 'esq--titulo')}${E(90, 'esq--texto')}</section>`, { funcao: FUNCAO });
const semPermissao = () => pick(aviso('erro', IC.gestor, 'Sem permissão para contar', 'A sua conta não tem a permissão «Registar contagens» para o armazém 60. Peça-a ao gestor do turno.'), { funcao: FUNCAO, pe: BOTAO('Voltar ao Inventário', IC.voltar, 'btn--ghost', ' data-ir="inv-inicio"') });
const sessao = () => pick(aviso('aviso', IC.relogio, 'A sua sessão terminou', `Esteve 15 minutos sem usar a Pick. O ${INV} continua seu, na posição ${POS}.`)
    + '<div class="campo"><label class="campo__label" for="iv-pp">Palavra-passe</label><input class="input pk-campo" id="iv-pp" type="password" placeholder="A sua palavra-passe"></div>',
  { funcao: FUNCAO, pe: BOTAO('Voltar a entrar', IC.entrar) });
const leitorParado = () => pick(`${contagemTopo()}${aviso('erro', IC.codigo, 'O leitor não responde', 'A tecla de leitura não está a enviar códigos para a Pick.')}
    <p class="pk-nota">Prima a tecla de leitura de novo. Se não ler, reinicie o leitor; até lá, pode escrever o código à mão — fica marcado como escrito.</p>`,
  { funcao: FUNCAO, pe: BOTAO('Reiniciar o leitor', IC.denovo) + BOTAO('Escrever o código à mão', IC2.teclado, 'btn--ghost') });
const leitorPerfil = () => pick(aviso('erro', IC.gestor, 'O leitor não está ligado à Pick', 'O perfil de leitura do PDA (Data Collection Intent) não dá permissão à Pick para receber códigos.')
    + '<p class="pk-nota">Isto configura-se uma vez em cada PDA. Avise o gestor do turno; o número do PDA vai no aviso.</p><p class="pk-ref">PDA: <code>24174B6440</code></p>',
  { funcao: FUNCAO, pe: BOTAO('Avisar o gestor', IC.gestor) });

/* =========================================================
   A lista
   ========================================================= */
export const DESCRICAO_INVENTARIO = 'O módulo Inventário da Pick (21 out.): contar uma zona posição a posição (às cegas), corrigir uma posição e consultar o stock — com o leitor do EDA61K, sempre com rede.';
export function ecrasInventario(): Ecra<IdInventario | IdEstadoInventario>[] {
  const FLUXO = 'Inventário';
  const e = (id: IdInventario, nome: string, objetivo: string, html: string): Ecra<IdInventario> => ({ id, nome, fluxo: FLUXO, objetivo, versoes: [{ id: 'v1', nota: 'Do briefing do inventário (21 out.)', html }] });
  const st = (id: IdEstadoInventario, de: IdInventario, nome: string, objetivo: string, html: string): Ecra<IdInventario | IdEstadoInventario> => ({ id, nome, fluxo: FLUXO, objetivo, estadoDe: de, versoes: [{ id: 'v1', nota: 'Do briefing do inventário (21 out.)', html }] });
  return [
    e('inv-inicio', '40 · Inventário', 'A contagem atribuída para continuar (com as posições contadas, nunca as unidades do sistema), as outras contagens e as duas operações: corrigir posição e consultar stock.', inicio()),
    st('inv-sem-contagens', 'inv-inicio', '40.1 · Sem contagens atribuídas', 'Nada para contar: diz quando aparece; as operações continuam.', inicio(true)),
    st('inv-carga', 'inv-inicio', '40.2 · A carregar', 'As contagens a chegar do servidor, em esqueleto.', carga()),
    st('inv-sem-permissao', 'inv-inicio', '40.3 · Sem permissão', 'A conta não pode registar contagens neste armazém: diz qual permissão e a quem pedir.', semPermissao()),
    st('inv-sessao', 'inv-inicio', '40.4 · Sessão terminada', 'Volta a entrar com a palavra-passe; a contagem continua na mesma posição.', sessao()),
    e('inv-lista', '41 · Contagens atribuídas', 'Número, tipo, área, data, estado e progresso em posições; as submetidas esperam pela conferência.', lista()),
    e('inv-posicao', '42 · Ler a posição', 'A posição primeiro: a área grande do leitor (toque = a tecla física); à mão, só como exceção.', posicao()),
    st('inv-posicao-ok', 'inv-posicao', '42.1 · Posição certa', '60300102 decomposta em armazém, zona, coluna e prateleira; passa sozinha ao artigo.', posicao('ok')),
    st('inv-posicao-fora', 'inv-posicao', '42.2 · Posição fora da contagem', '«Localização inválida para este inventário.» — a lida e a área da contagem.', posicao('fora')),
    st('inv-leitor-parado', 'inv-posicao', '42.3 · O leitor não responde', 'Reiniciar o leitor ou escrever à mão (marcado como escrito).', leitorParado()),
    st('inv-leitor-sem-perfil', 'inv-posicao', '42.4 · Leitor sem permissão', 'O perfil da Intent API não está configurado para a Pick: avisar o gestor, com o número do PDA.', leitorPerfil()),
    e('inv-artigo', '44 · Ler o artigo', 'Na posição, um artigo de cada vez; a posição fica à vista; os já contados por baixo.', artigo()),
    st('inv-desconhecido', 'inv-artigo', '44.1 · Artigo não encontrado', '«Artigo não encontrado.» — ler outra etiqueta ou separar e registar como por identificar.', artigo('desconhecido')),
    st('inv-repetido', 'inv-artigo', '44.2 · Leitura repetida', 'O mesmo artigo já contado nesta posição: somar ou corrigir (com motivo); nada se substitui em silêncio.', artigo('repetido')),
    st('inv-sem-rede', 'inv-artigo', '44.3 · Sem rede', 'A Pick para: a contagem não foi registada; as anteriores estão no servidor (não há fila no aparelho).', artigo('sem-rede')),
    e('inv-quantidade', '45 · Quantidade', 'O artigo lido (referência e descrição grandes) e a quantidade: número grande, − e +, teclado; às cegas.', qtdEcra()),
    st('inv-qtd-invalida', 'inv-quantidade', '45.1 · Quantidade inválida', '«1,5» num artigo à unidade: diz porquê; «Confirmar» espera.', qtdEcra('invalida')),
    st('inv-a-guardar', 'inv-quantidade', '45.2 · A registar', 'Só o botão espera; a leitura seguinte não fica bloqueada mais do que isto.', qtdEcra('a-guardar')),
    st('inv-nao-guardou', 'inv-quantidade', '45.3 · Não registou', 'O servidor não respondeu: o número continua escrito; confirmar outra vez.', qtdEcra('nao-guardou')),
    e('inv-guardada', '46 · Contagem registada', 'O verde por um instante e o leitor já pronto para o artigo seguinte; a linha nova acesa na lista.', guardada()),
    e('inv-unidades', '47 · Contagem à unidade', 'Quando a contagem o permite: cada leitura do mesmo código soma 1, e o ecrã di-lo; outro código fecha o artigo.', unidades()),
    e('inv-fim-posicao', '48 · Posição contada', 'O resumo da posição e o progresso em posições; a seguinte.', fimPosicao()),
    e('inv-contados', '49 · O que já contei', 'Por posição, com a hora; «corrigida» quando há uma contagem anterior guardada.', contados()),
    e('inv-corrigir', '50 · Corrigir uma contagem', 'A nova quantidade e o motivo (obrigatório); a anterior fica guardada.', corrigir()),
    e('inv-pausa', '51 · Pausar', 'O que fica em pausa e onde se volta, neste ou noutro PDA.', pausa()),
    st('inv-retomada', 'inv-pausa', '51.1 · Retomada', 'De volta à mesma posição.', pausa(true)),
    e('inv-submeter', '52 · Submeter', 'O resumo (posições, artigos, correções, por identificar) e submeter para conferência.', submeter()),
    st('inv-submetida', 'inv-submeter', '52.1 · Submetida', 'Foi para conferência; recontagens aparecem aqui.', submeter(true)),
    e('inv-divergencias', '53 · Divergências (gestor)', 'Contado, sistema e diferença por posição; pedir recontagem. Ajustar o stock é outra operação.', divergencias()),
    e('inv-recontar', '54 · Recontagem pedida', 'O operador reconta às cegas, sem ver o que contou antes nem o sistema.', recontar()),
    e('inv-corrigir-posicao', '55 · Corrigir posição', 'A operação: a posição, o artigo e o que lá está; vai para o motor de correções.', corrigirPosicao()),
    e('inv-consultar', '56 · Consultar stock', 'Ler um artigo ou uma posição e ver onde está e quanto há; não regista nada.', consultar()),
    st('inv-consultar-fechado', 'inv-consultar', '56.1 · Consulta fechada', 'Durante uma contagem às cegas, a consulta da mesma zona não mostra quantidades.', consultar(true)),
  ];
}
