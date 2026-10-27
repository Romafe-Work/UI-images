/* =========================================================
   PICK — Inventário v2, o operador no desenho do Gestor (27 out. 2026)
   Ela: «focus on mobile now. draw screens para inventario» → «Operador: versão nova». Os ecrãs 40–56 e os estados
   deles ganham a v2; a v1 (21 out.) fica como estava. O mesmo fluxo e as mesmas regras (inventario.ts), no desenho
   do Gestor de Armazém (gestor.ts, 22 out.): sempre escuro (o armazém, o ecrã a brilhar), ROMAFE | Pick no cabeçalho,
   cartões, alvos de toque ≥ 44 px, a ação laranja em baixo, à largura toda, com ícone e texto.
   O que muda no desenho, para o terminal (EDA61K, 320 × 533):
     - a contagem ativa fica num só bloco por baixo do cabeçalho: o inventário, a posição partida em armazém · zona ·
       coluna · prateleira (os oito algarismos lêem-se de relance) e os quatro passos da contagem;
     - o leitor é uma mira com os cantos laranja e a linha que varre — o feixe da abertura —, e diz que a leitura
       vem da tecla física; certo fica verde, errado fica vermelho;
     - a quantidade: o número grande ao centro, − e + de 56 px e o teclado de 46 px;
     - o Inventário (40) tem um cartão dominante, como o do Gestor: continuar a contagem, onde parou e o progresso
       em posições (às cegas: nunca as unidades do sistema).
   Continua tudo o que está decidido: sem rede a Pick para e nada fica à espera no PDA; palavra-passe; contar é da
   Arrumação; o operador nunca vê a quantidade do sistema; contar não é ajustar.
   CSS: css/inventario-v2.css. Comportamento: o de comportamento/inventario.ts (o leitor, o teclado, confirmar).
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdInventario, IdEstadoInventario } from './inventario';
import { INV, POS, ART, CONTAGENS, MOTIVOS, DIV } from './inventario';
import { CAIXA } from './cena';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import wifi from 'lucide-static/icons/wifi.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import pause from 'lucide-static/icons/pause.svg?raw';
import play from 'lucide-static/icons/play.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import rotate from 'lucide-static/icons/rotate-ccw.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import del from 'lucide-static/icons/delete.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import coffee from 'lucide-static/icons/coffee.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import userRound from 'lucide-static/icons/user-round.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import radio from 'lucide-static/icons/radio.svg?raw';

/** O ícone do Lucide, sem a classe dele e com o nome em data-lucide. */
export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
export const OPERADOR = { nome: 'Joana Silva', primeiro: 'Joana', iniciais: 'JS' };
export const GESTORA = { nome: 'Ana Ferreira', iniciais: 'AF' };
const CONTADOS: [string, string, string, string][] = [['SKF VKBA 6556', 'Kit de rolamento de roda', '4 un.', '10:42'], ['SKF VKMV 6PK1873', 'Correia poli-V', '12 un.', '10:40']];

/* ---------- o ecrã: cabeçalho, corpo e o pé com as ações ---------- */
export interface Opcoes { voltar?: string; titulo?: string; rede?: boolean; pe?: string; gestor?: boolean; faixa?: string; /** outra pessoa e outra função (a demonstração das funções, 27 out.) */ quem?: { nome: string; iniciais: string }; funcao?: string }
export function ecra(corpo: string, o: Opcoes = {}): string {
  const rede = o.rede !== false, quem = o.quem ?? (o.gestor ? GESTORA : OPERADOR);
  return `<div class="gp gpi" data-gpi>
  <header class="gp-topo">
    ${o.voltar ? `<button type="button" class="gp-voltar" data-ir="${o.voltar}" aria-label="Voltar">${L(arrowLeft)}</button>` : ''}
    <div class="gp-marca"><span class="romafe gp-romafe">ROMAFE</span><i aria-hidden="true"></i><b>Pick</b></div>
    <span class="gp-rede${rede ? '' : ' is-mal'}" title="${rede ? 'Ligado ao servidor' : 'Sem rede'}">${L(rede ? wifi : wifiOff)}<span class="sr-only">${rede ? 'Ligado' : 'Sem rede'}</span></span>
    <button type="button" class="gp-conta" aria-label="Conta de ${quem.nome}">${quem.iniciais}</button>
    <p class="gp-onde"><b>${o.titulo ?? 'Inventário'}</b> · ${o.funcao ?? (o.gestor ? 'Gestor' : 'Arrumação')} · Armazém 60</p>
  </header>
  ${rede ? '' : `<p class="gp-faixa" role="status">${L(wifiOff)}<span><b>Sem rede.</b> A Pick precisa de rede para registar. Continua quando houver sinal.</span></p>`}${o.faixa ?? ''}
  <main class="gp-corpo gi-corpo">${corpo}</main>
  ${o.pe ? `<footer class="gi-pe">${o.pe}</footer>` : ''}
</div>`;
}
export const acao = (t: string, ic: string, extra = '') => `<button type="button" class="gp-btn gp-btn--acao gp-btn--grande"${extra}>${L(ic)}<span data-rotulo>${t}</span></button>`;
export const sec = (t: string, ic: string, extra = '') => `<button type="button" class="gp-btn gi-btn-sec"${extra}>${L(ic)}<span>${t}</span></button>`;
export const esperar = (t: string) => `<button type="button" class="gp-btn gp-btn--acao gp-btn--grande is-a-carregar" disabled aria-busy="true"><span class="girador girador--claro" aria-hidden="true"></span><span>${t}</span></button>`;
export const aviso = (tom: 'erro' | 'aviso' | 'info' | 'ok', ic: string, titulo: string, texto: string) => `<section class="gi-aviso gi-aviso--${tom}" role="${tom === 'erro' ? 'alert' : 'status'}"><span class="gi-aviso__ic">${L(ic)}</span><h1>${titulo}</h1><p>${texto}</p></section>`;
export const nota = (t: string) => `<p class="gp-nota">${t}</p>`;
export const prog = (f: number, t: number, rot = 'Posições contadas') => `<div class="gi-prog"><p><span>${rot}</span><b>${f} de ${t}</b></p><span class="gp-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${t}" aria-valuenow="${f}" aria-label="${rot}: ${f} de ${t}"><i style="--p:${t ? (f / t).toFixed(3) : 0}"></i></span></div>`;

/* ---------- a posição: os oito algarismos partidos (armazém · zona · coluna · prateleira) ---------- */
export const PARTES = ['Arm.', 'Zona', 'Col.', 'Prat.'];
export const posicao = (p: string, cls = '') => `<span class="gi-pos${cls ? ` ${cls}` : ''}" role="img" aria-label="Posição ${p}: armazém ${p.slice(0, 2)}, zona ${p.slice(2, 4)}, coluna ${p.slice(4, 6)}, prateleira ${p.slice(6, 8)}">${PARTES.map((t, i) => `<span><b>${p.slice(i * 2, i * 2 + 2)}</b><small>${t}</small></span>`).join('')}</span>`;

/* ---------- a contagem ativa: o inventário, a posição e os passos ---------- */
const PASSOS = ['Posição', 'Artigo', 'Quant.', 'Registo'];
export const passos = (feitos: number) => `<ol class="gi-passos" aria-label="Passos desta contagem">${PASSOS.map((p, i) => `<li class="${i < feitos ? 'is-feito' : i === feitos ? 'is-atual' : ''}"${i === feitos ? ' aria-current="step"' : ''}><i aria-hidden="true"></i><span>${p}</span></li>`).join('')}</ol>`;
export const ativa = (o: { pos?: string; mudar?: boolean; passo?: number } = {}) => `<section class="gi-ativa" aria-label="Contagem ativa">
    <p class="gi-ativa__inv"><b>${INV}</b><span>Zona 30 · às cegas</span></p>
    ${o.pos ? `<div class="gi-ativa__pos">${posicao(o.pos)}${o.mudar !== false ? `<button type="button" class="gi-mudar" data-ir="inv-posicao">${L(mapPin)}<span>Mudar</span></button>` : ''}</div>` : ''}
    ${o.passo !== undefined ? passos(o.passo) : ''}
  </section>`;

/* ---------- o leitor: a mira (o feixe da abertura); tocar faz de tecla física do EDA61K ---------- */
interface Leitor { titulo: string; texto: string; codigo?: string; ir?: string; tipo?: string; estado?: '' | 'ok' | 'erro' | 'parado' }
export const leitor = (o: Leitor) => `<button type="button" class="gi-leitor${o.estado ? ` is-${o.estado}` : ''}" data-ler="${o.codigo ?? ''}" data-tipo-leitura="${o.tipo ?? ''}"${o.ir ? ` data-depois="${o.ir}"` : ''}>
    <span class="gi-mira" aria-hidden="true"><i></i><i></i><i></i><i></i><span class="gi-mira__linha"></span>${L(o.estado === 'ok' ? circleCheck : o.estado === 'erro' || o.estado === 'parado' ? triangle : scanBarcode, 'gi-mira__ic')}</span>
    <b class="gi-leitor__t">${o.titulo}</b><small class="gi-leitor__x">${o.texto}</small>
    <span class="gi-leitor__tecla">${L(radio)}${o.estado === 'parado' ? 'A tecla de leitura não está a enviar' : 'Prima a tecla de leitura'}</span>
  </button>`;

/* ---------- o artigo, a quantidade e as linhas contadas ---------- */
export const artigo = (novo = false) => `<section class="gi-artigo${novo ? ' is-novo' : ''}"><span class="gi-artigo__ic">${L(pkg)}</span><div><p class="gi-artigo__ref">${ART.ref}</p><p class="gi-artigo__desc">${ART.desc} · ${ART.marca}</p><p class="gi-artigo__meta">EAN ${ART.ean} · ${ART.un}</p></div></section>`;
const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
export const quantidade = (valor = '12', o: { erro?: string; teclado?: boolean; rotulo?: string } = {}) => `<div class="gi-qtd${o.erro ? ' is-erro' : ''}" data-qtd>
    <label class="gi-qtd__rot" for="gi-qtd-n">${o.rotulo ?? 'Quantas estão aqui?'} <span>(${ART.un})</span></label>
    <div class="gi-qtd__linha">
      <button type="button" class="gi-qtd__bt" data-qtd-passo="-1" aria-label="Menos 1">${L(minus)}</button>
      <input class="gi-qtd__n" id="gi-qtd-n" value="${valor}" inputmode="numeric" autocomplete="off" aria-invalid="${!!o.erro}"${o.erro ? ' aria-describedby="gi-qtd-erro"' : ''}>
      <button type="button" class="gi-qtd__bt" data-qtd-passo="1" aria-label="Mais 1">${L(plus)}</button>
    </div>
    ${o.erro ? `<p class="gi-qtd__erro" id="gi-qtd-erro" role="alert">${L(triangle)}${o.erro}</p>` : ''}
    ${o.teclado === false ? '' : `<div class="gi-teclado" role="group" aria-label="Teclado numérico">${TECLAS.map((k) => `<button type="button" class="gi-tecla" data-tecla="${k}">${k}</button>`).join('')}<button type="button" class="gi-tecla gi-tecla--leve" data-tecla="limpar" aria-label="Limpar">${L(xIc)}</button><button type="button" class="gi-tecla" data-tecla="0">0</button><button type="button" class="gi-tecla gi-tecla--leve" data-tecla="apagar" aria-label="Apagar um algarismo">${L(del)}</button></div>`}
  </div>`;
export const linha = ([ref, desc, q, quando]: [string, string, string, string], extra = '') => `<li class="gi-linha${extra}"><div><b>${ref}</b><span>${desc}</span></div><div class="gi-linha__q"><b>${q}</b><span>${extra.includes('is-corrigida') ? 'corrigida · ' : ''}${quando}</span></div></li>`;
const contados = (extra: [string, string, string, string][] = []) => `<ul class="gi-linhas" role="list">${extra.map((l) => linha(l, ' is-nova')).join('')}${CONTADOS.map((l) => linha(l)).join('')}</ul>`;
export const h2 = (t: string, n?: number) => `<h2 class="gp-h">${t}${n !== undefined ? ` <span class="gi-n">${n}</span>` : ''}</h2>`;

/* =========================================================
   Os ecrãs
   ========================================================= */
/* 40 · Inventário: o cartão dominante (continuar), a contagem seguinte e as duas operações */
const inicio = (sem = false) => ecra(`
    <div class="gp-ola"><h1>Olá, ${OPERADOR.primeiro}</h1><p>${sem ? 'Não tem contagens para hoje.' : 'Tem uma contagem a meio.'}</p></div>
    ${sem ? `<section class="gi-vazio">${L(coffee)}<p><b>Não tem contagens atribuídas.</b> Quando o gestor planear uma contagem para si, aparece aqui. As operações continuam.</p></section>`
    : `<section class="gi-dom" aria-labelledby="gi-dom-t">
      <div class="gi-dom__cab"><span class="gi-dom__caixa">${CAIXA()}</span><div><small>Continuar a contagem</small><b id="gi-dom-t">${INV}</b></div></div>
      <p class="gi-dom__meta"><span class="gp-tag gp-tag--curso">Em curso</span>Zona 30 · por posição · às cegas</p>
      <p class="gi-dom__onde">${L(mapPin)}<span>Parou em</span>${posicao(POS, 'gi-pos--peq')}</p>
      ${prog(18, 46)}
      ${acao('Continuar a contar', scanBarcode, ' data-ir="inv-posicao"')}
    </section>
    <section class="gp-sec">${h2('A seguir')}
      <button type="button" class="gi-ir" data-ir="inv-posicao"><span class="gi-ir__ic">${L(listChecks)}</span><span class="gi-ir__t"><b>INV-2026-015</b><small>Cíclica · zona 10 · 30 posições</small></span><span class="gp-tag gp-tag--planeada">Planeada</span></button>
      <button type="button" class="gp-ligacao" data-ir="inv-lista">${L(list)}Ver as contagens atribuídas</button>
    </section>`}
    <section class="gp-sec">${h2('Operações')}
      <div class="gp-dois">
        <button type="button" class="gp-rap" data-ir="inv-corrigir-posicao">${L(pencil)}<span>Corrigir posição</span></button>
        <button type="button" class="gp-rap" data-ir="inv-consultar">${L(search)}<span>Consultar stock</span></button>
      </div>
    </section>`);

/* 41 · as contagens atribuídas */
const TAG: Record<string, string> = { curso: 'curso', planeada: 'planeada', submetida: 'validar' };
const lista = () => ecra(`<h1 class="gp-titulo">Contagens atribuídas</h1>
    <ul class="gp-lista" role="list">${CONTAGENS.map(([n, tipo, area, data, est, k, f, t], i) => `<li style="--i:${i}"><div class="gp-inv-card gi-card--${k}">
      <p><b>${n}</b><span class="gp-tag gp-tag--${TAG[k]}">${est}</span></p><small>${tipo} · ${area} · ${data}</small>${prog(f, t)}
      <div class="gp-inv-acoes">${k === 'submetida' ? `<span class="gi-espera">${L(clock)}À espera da conferência</span>` : `<button type="button" class="gp-btn gp-btn--acao" data-ir="inv-posicao">${L(k === 'curso' ? play : scanBarcode)}<span>${k === 'curso' ? 'Continuar' : 'Iniciar'}</span></button>`}</div></div></li>`).join('')}</ul>
    ${nota('O gestor planeia as contagens. As submetidas esperam pela conferência; se for preciso recontar, aparece aqui.')}`, { voltar: 'inv-inicio', titulo: 'Contagens' });

/* 42 · ler a posição */
const lerPosicao = (est: '' | 'ok' | 'fora' = '') => ecra(`${ativa({ passo: 0 })}
    ${est === 'fora' ? `${aviso('erro', mapPin, 'Posição fora desta contagem', 'Esta contagem é da <b>zona 30</b>, colunas 01 a 12.')}<div class="gi-compara"><p><span>Leu</span>${posicao('60100304', 'gi-pos--erro')}</p><p><span>Contagem</span><b class="gi-area">Zona 30 · colunas 01–12</b></p></div>`
    : est === 'ok' ? `<section class="gi-lida" role="status"><span class="gi-lida__ok">${L(check)}</span>${posicao(POS, 'gi-pos--grande')}<p>Posição certa. A passar ao artigo…</p></section>`
    : `${leitor({ titulo: 'Leia a etiqueta da posição', texto: 'Oito algarismos: armazém, zona, coluna, prateleira.', codigo: POS, tipo: 'posicao', ir: 'inv-artigo' })}
      <p class="gi-dica">${L(mapPin)}<span>Esta contagem: <b>zona 30</b>, colunas 01 a 12</span></p>`}`,
  { pe: est === 'fora' ? acao('Ler a etiqueta certa', scanBarcode, ' data-ir="inv-posicao"') : est === 'ok' ? '' : `${sec('Escrever à mão', keyboard)}${sec('Pausar', pause, ' data-ir="inv-pausa"')}` });

/* 44 · na posição: ler cada artigo */
const lerArtigo = (est: '' | 'desconhecido' | 'repetido' | 'sem-rede' = '') => ecra(`${ativa({ pos: POS, passo: 1 })}
    ${est === 'desconhecido' ? `${aviso('erro', pkgX, 'Artigo não encontrado', 'O código <b>5601234000017</b> não é de nenhum artigo do catálogo nem desta contagem.')}${nota('Leia outra etiqueta do artigo. Se não tiver, separe-o: fica registado como artigo por identificar nesta posição, e o gestor vê-o.')}`
    : est === 'repetido' ? `${aviso('aviso', triangle, `Já contou ${ART.ref} aqui`, 'Registou <b>12 un.</b> às 10:44 e leu de novo o mesmo código.')}${nota('Se encontrou mais unidades, some-as. Se a primeira contagem estava errada, corrija-a — a anterior fica guardada, com o motivo.')}`
    : est === 'sem-rede' ? `${aviso('aviso', wifiOff, 'Não ficou registada', 'Sem rede, a Pick não regista. As contagens anteriores estão no servidor; nada fica à espera no PDA.')}<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A procurar rede…</p>`
    : `${leitor({ titulo: 'Leia o código do artigo', texto: 'Um artigo de cada vez; depois diz quantos há.', codigo: ART.ean, tipo: 'artigo', ir: 'inv-quantidade' })}
      ${h2('Contados nesta posição', 2)}${contados()}`}`,
  { rede: est !== 'sem-rede', pe: est === 'repetido' ? `${acao('Somar mais unidades', plus, ' data-ir="inv-quantidade"')}${sec('Corrigir a contagem', pencil, ' data-ir="inv-corrigir"')}`
    : est === 'sem-rede' ? acao('Tentar de novo', refresh) : est === 'desconhecido' ? `${acao('Ler outra vez', scanBarcode, ' data-ir="inv-artigo"')}${sec('Registar por identificar', pkgX, ' data-ir="inv-artigo"')}`
    : sec('Acabei esta posição', check, ' data-ir="inv-fim-posicao"') });

/* 45 · a quantidade (às cegas: nunca se mostra a do sistema) */
const qtdEcra = (est: '' | 'invalida' | 'a-guardar' | 'nao-guardou' = '') => ecra(`${ativa({ pos: POS, passo: 2 })}
    ${artigo(est === '')}
    ${quantidade(est === 'invalida' ? '1,5' : '12', { erro: est === 'invalida' ? 'Este artigo conta-se à unidade: escreva um número inteiro.' : undefined })}
    ${est === 'nao-guardou' ? aviso('erro', serverOff, 'A contagem não ficou registada', 'O servidor não respondeu. Os 12 continuam escritos: confirme outra vez.') : ''}`,
  { pe: est === 'a-guardar' ? esperar('A registar…') : acao('Confirmar contagem', check, ` data-confirmar data-ir="inv-guardada"${est === 'invalida' ? ' disabled' : ''}`) });

/* 46 · registada: o verde e o leitor já pronto para o artigo seguinte */
const guardada = () => ecra(`${ativa({ pos: POS, passo: 4 })}
    <p class="gi-registada" role="status">${L(circleCheck)}<span><b>${ART.ref} · 12 ${ART.un}</b> registado às 10:44</span></p>
    ${leitor({ titulo: 'Leia o artigo seguinte', texto: 'Ou «Acabei esta posição» quando não houver mais.', codigo: ART.ean, tipo: 'artigo', ir: 'inv-repetido', estado: 'ok' })}
    ${h2('Contados nesta posição', 3)}${contados([[ART.ref, ART.desc, `12 ${ART.un}`, '10:44']])}`,
  { pe: sec('Acabei esta posição', check, ' data-ir="inv-fim-posicao"') });

/* 47 · à unidade: cada leitura do mesmo código soma 1 */
const unidades = () => ecra(`${ativa({ pos: POS, passo: 2 })}
    <p class="gi-modo">${L(plus)}<span><b>Contagem à unidade.</b> Cada leitura do mesmo código soma 1.</span></p>
    ${artigo()}
    <div class="gi-soma" role="status" aria-live="polite"><b data-soma>3</b><span>unidades lidas</span></div>
    ${leitor({ titulo: 'Leia a unidade seguinte', texto: 'Outro código fecha este artigo e passa ao seguinte.', codigo: ART.ean, tipo: 'unidade', estado: 'ok' })}`,
  { pe: acao('Confirmar 3 unidades', check, ' data-ir="inv-guardada"') });

/* 48 · posição contada */
const fimPosicao = () => ecra(`${ativa({ pos: POS, mudar: false, passo: 4 })}
    <section class="gi-feito"><span class="gi-feito__ok">${L(check)}</span><h1>Posição contada</h1><p>3 artigos · 28 unidades</p></section>
    ${prog(19, 46)}`,
  { pe: `${acao('Ler a posição seguinte', scanBarcode, ' data-ir="inv-posicao"')}${sec('Ver o que já contei', list, ' data-ir="inv-contados"')}` });

/* 49 · o que já contei */
const jaContei = () => ecra(`<h1 class="gp-titulo">O que já contei</h1>${nota(`${INV} · 19 posições · tudo no servidor`)}
    <section class="gi-grupo"><h2 class="gi-grupo__pos">${posicao(POS, 'gi-pos--peq')}</h2>${contados([[ART.ref, ART.desc, `12 ${ART.un}`, '10:44']])}</section>
    <section class="gi-grupo"><h2 class="gi-grupo__pos">${posicao('60300101', 'gi-pos--peq')}</h2><ul class="gi-linhas" role="list">${linha(['INA 530 0089 10', 'Kit de distribuição', '2 un.', '10:31'])}${linha(['SKF VKPC 88618', 'Bomba de água', '5 un.', '10:29'], ' is-corrigida')}</ul></section>
    ${nota('«Corrigida» quer dizer que há uma contagem anterior guardada, com o motivo e quem corrigiu.')}`,
  { voltar: 'inv-artigo', titulo: 'Contados', pe: `${acao('Voltar à contagem', arrowLeft, ' data-ir="inv-artigo"')}${sec('Corrigir uma contagem', pencil, ' data-ir="inv-corrigir"')}` });

/* 50 · corrigir uma contagem: a nova e o motivo; a anterior fica */
const corrigir = () => ecra(`${ativa({ pos: POS })}
    <p class="gi-antes"><span>Registado às 10:44</span><b>${ART.ref} · 12 ${ART.un}</b></p>
    ${quantidade('14', { teclado: false, rotulo: 'A quantidade certa' })}
    <fieldset class="gi-motivos"><legend>Motivo <span>(obrigatório)</span></legend>${MOTIVOS.map((m, i) => `<label class="gi-motivo"><input type="radio" name="gi-motivo"${i === 1 ? ' checked' : ''}><span>${m}</span></label>`).join('')}</fieldset>
    ${nota('A contagem de 12 fica guardada; a nova (14) fica com o motivo, a hora e quem corrigiu.')}`,
  { voltar: 'inv-artigo', titulo: 'Corrigir', pe: `${acao('Registar a correção', check, ' data-ir="inv-guardada"')}${sec('Cancelar', xIc, ' data-ir="inv-artigo"')}` });

/* 51 · pausar / retomada */
const pausar = (retomada = false) => ecra(retomada
  ? `${aviso('ok', play, 'Contagem retomada', `Voltou ao ${INV} onde parou às 10:46. O que já contou está no servidor.`)}${ativa({ pos: POS, mudar: false })}`
  : `${aviso('info', pause, 'Pausar a contagem?', `O ${INV} fica parado nesta posição. Volta exatamente aqui, neste ou noutro PDA.`)}${ativa({ pos: POS, mudar: false })}${prog(18, 46)}
    ${nota('Nada se perde: cada contagem é registada no servidor quando a confirma.')}`,
  { pe: retomada ? acao('Continuar a contar', scanBarcode, ' data-ir="inv-artigo"') : `${acao('Pausar', pause, ' data-ir="inv-inicio"')}${sec('Continuar a contar', play, ' data-ir="inv-artigo"')}` });

/* 52 · submeter / submetida */
const submeter = (feita = false) => ecra(feita
  ? `${aviso('ok', send, 'Contagem submetida', `O ${INV} foi para conferência. O gestor compara com o stock; se for preciso recontar, aparece-lhe no Inventário.`)}`
  : `<h1 class="gp-titulo">Submeter a contagem</h1>${prog(46, 46)}
    <dl class="gi-resumo"><div><dt>Posições</dt><dd>46</dd></div><div><dt>Artigos</dt><dd>128</dd></div><div><dt>Correções</dt><dd>3</dd></div><div class="is-aviso"><dt>Por identificar</dt><dd>1</dd></div></dl>
    ${nota('Depois de submeter, já não se pode corrigir: só o gestor pede recontagens.')}`,
  { voltar: feita ? undefined : 'inv-contados', titulo: 'Submeter', pe: feita ? acao('Voltar ao Inventário', arrowLeft, ' data-ir="inv-inicio"') : `${acao('Submeter para conferência', send, ' data-ir="inv-submetida"')}${sec('Voltar', arrowLeft, ' data-ir="inv-contados"')}` });

/* 53 · divergências (gestor): contado, sistema e diferença; pedir recontagem */
const divergencias = () => ecra(`<h1 class="gp-titulo">Divergências</h1>${nota(`${INV} · em conferência · só o gestor vê o stock do sistema`)}
    <ul class="gp-lista" role="list">${DIV.map(([p, a, c, s, k], i) => { const d = c - s; return `<li style="--i:${i}"><div class="gi-div${k ? ` gi-div--${k}` : ''}">${posicao(p, 'gi-pos--peq')}<p class="gi-div__art">${a}</p>
      <dl><div><dt>Contado</dt><dd>${c}</dd></div><div><dt>Sistema</dt><dd>${s}</dd></div><div><dt>Diferença</dt><dd class="${d < 0 ? 'is-menos' : d > 0 ? 'is-mais' : ''}">${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d)}</dd></div></dl>
      ${k === 'recontar' ? `<span class="gp-tag gp-tag--planeada">${L(rotate)}Recontagem pedida</span>` : k === 'ok' ? `<span class="gp-tag gp-tag--ok">${L(check)}Sem diferença</span>` : `<button type="button" class="gp-btn gp-btn--acao" data-ir="inv-recontar">${L(rotate)}<span>Pedir recontagem</span></button>`}</div></li>`; }).join('')}</ul>
    ${nota('Ajustar o stock é outra operação, do gestor, depois da conferência. Recontar não apaga as contagens anteriores.')}`,
  { voltar: 'gestor-inventario', titulo: 'Divergências', gestor: true });

/* 54 · recontagem pedida (o operador): às cegas outra vez */
const recontar = () => ecra(`${aviso('aviso', rotate, 'Recontagem pedida', `O gestor pediu para recontar <b>${ART.ref}</b> nesta posição.`)}
    <section class="gi-cartao">${posicao(POS, 'gi-pos--grande')}<p>${ART.ref} · ${ART.desc}</p></section>
    ${nota('Conte como da primeira vez: não se mostra o que contou antes nem o que o sistema diz.')}`,
  { pe: acao('Ler a posição', scanBarcode, ' data-ir="inv-posicao"') });

/* 55 · corrigir posição (a operação): a posição, o artigo e o que lá está */
const corrigirPosicao = () => ecra(`<h1 class="gp-titulo">Corrigir posição</h1>
    <section class="gi-cartao gi-cartao--linha"><span>Posição</span>${posicao('60300105', 'gi-pos--peq')}</section>
    ${artigo()}
    ${quantidade('7', { teclado: false, rotulo: 'Na posição estão' })}
    ${nota('A correção vai para o motor de correções e conta para o limite de correções abertas da posição.')}`,
  { voltar: 'inv-inicio', titulo: 'Corrigir posição', pe: `${acao('Corrigir a posição', pencil, ' data-ir="inv-inicio"')}${sec('Cancelar', xIc, ' data-ir="inv-inicio"')}` });

/* 56 · consultar stock / fechada durante uma contagem às cegas da mesma zona */
const consultar = (fechado = false) => ecra(fechado
  ? `${aviso('aviso', lock, 'Consulta fechada na zona 30', `Está a contar a zona 30 às cegas (${INV}). Até submeter, a consulta de stock desta zona não mostra quantidades.`)}`
  : `${leitor({ titulo: 'Leia um artigo ou uma posição', texto: 'Mostra onde está e quanto o sistema diz que há. Não regista nada.', codigo: '7316201250277', tipo: 'consulta' })}
    <section class="gi-consulta"><p class="gi-artigo__ref">SKF VKBA 6556</p><p class="gi-artigo__desc">Kit de rolamento de roda, eixo dianteiro</p>
      <ul class="gi-linhas" role="list">${linha(['60101203', 'Zona 10 · Coluna 12 · Prateleira 03', '12 un.', 'Porto'])}${linha(['60211401', 'Zona 21 · Coluna 14 · Prateleira 01', '4 un.', 'Porto'])}</ul></section>`,
  { voltar: 'inv-inicio', titulo: 'Consultar stock', pe: acao('Voltar ao Inventário', arrowLeft, ' data-ir="inv-inicio"') });

/* estados */
const carga = () => ecra(`<section class="gi-enche" role="status" aria-live="polite"><svg viewBox="0 0 200 120" fill="none" aria-hidden="true"><path class="gi-enche__est" d="M10 6v110M190 6v110M10 42h180M10 80h180M10 116h180"/>${[[18, 16, 30, 24], [54, 20, 26, 20], [86, 14, 34, 26], [128, 18, 28, 22], [22, 54, 36, 24], [64, 58, 26, 20], [98, 52, 30, 26], [140, 56, 34, 22], [30, 92, 28, 22], [66, 90, 34, 24]].map(([x, y, w, h], i) => `<rect class="gi-enche__cx" x="${x}" y="${y}" width="${w}" height="${h}" rx="2" style="--i:${i}"/>`).join('')}</svg><p><span class="girador girador--pequeno" aria-hidden="true"></span>A carregar as suas contagens…</p></section>
    <div class="gp-esq"><i></i><i></i></div>`);
const semPermissao = () => ecra(aviso('erro', userRound, 'Sem permissão para contar', 'A sua conta não tem a permissão «Registar contagens» no armazém 60. Peça-a ao gestor do turno.'), { pe: acao('Voltar ao Inventário', arrowLeft, ' data-ir="inv-inicio"') });
const sessao = () => ecra(`${aviso('aviso', clock, 'A sua sessão terminou', `Esteve 15 minutos sem usar a Pick. O ${INV} continua seu, na mesma posição.`)}
    <label class="gp-campo"><span>Palavra-passe</span><input type="password" placeholder="A sua palavra-passe" autocomplete="current-password"></label>`, { pe: acao('Voltar a entrar', logIn) });
const leitorParado = () => ecra(`${ativa({ pos: POS, passo: 0 })}${leitor({ titulo: 'O leitor não responde', texto: 'Prima a tecla de leitura de novo. Se não ler, reinicie o leitor; até lá, pode escrever à mão — fica marcado como escrito.', estado: 'parado' })}`,
  { pe: `${acao('Reiniciar o leitor', refresh)}${sec('Escrever à mão', keyboard)}` });
const leitorPerfil = () => ecra(`${aviso('erro', radio, 'O leitor não está ligado à Pick', 'O perfil de leitura do PDA (Data Collection Intent) não dá permissão à Pick para receber códigos.')}
    ${nota('Isto configura-se uma vez em cada PDA. O número do PDA vai no aviso ao gestor.')}<p class="gi-ref">PDA <code>24174B6440</code></p>`, { pe: acao('Avisar o gestor', userRound) });

/* =========================================================
   A v2 em cada ecrã do Inventário
   ========================================================= */
const NOTA = 'Inventário v2 (27 out.): o mesmo fluxo e as mesmas regras, no desenho do Gestor — escuro, ROMAFE | Pick, a contagem ativa num bloco (a posição partida em armazém · zona · coluna · prateleira e os passos), o leitor como uma mira com o feixe laranja, a quantidade grande com − e + e o teclado, e a ação laranja em baixo.';
const V2: Record<IdInventario | IdEstadoInventario, () => string> = {
  'inv-inicio': () => inicio(), 'inv-sem-contagens': () => inicio(true), 'inv-carga': carga, 'inv-sem-permissao': semPermissao, 'inv-sessao': sessao,
  'inv-lista': lista, 'inv-posicao': () => lerPosicao(), 'inv-posicao-ok': () => lerPosicao('ok'), 'inv-posicao-fora': () => lerPosicao('fora'),
  'inv-leitor-parado': leitorParado, 'inv-leitor-sem-perfil': leitorPerfil,
  'inv-artigo': () => lerArtigo(), 'inv-desconhecido': () => lerArtigo('desconhecido'), 'inv-repetido': () => lerArtigo('repetido'), 'inv-sem-rede': () => lerArtigo('sem-rede'),
  'inv-quantidade': () => qtdEcra(), 'inv-qtd-invalida': () => qtdEcra('invalida'), 'inv-a-guardar': () => qtdEcra('a-guardar'), 'inv-nao-guardou': () => qtdEcra('nao-guardou'),
  'inv-guardada': guardada, 'inv-unidades': unidades, 'inv-fim-posicao': fimPosicao, 'inv-contados': jaContei, 'inv-corrigir': corrigir,
  'inv-pausa': () => pausar(), 'inv-retomada': () => pausar(true), 'inv-submeter': () => submeter(), 'inv-submetida': () => submeter(true),
  'inv-divergencias': divergencias, 'inv-recontar': recontar, 'inv-corrigir-posicao': corrigirPosicao, 'inv-consultar': () => consultar(), 'inv-consultar-fechado': () => consultar(true),
};
/** Cada ecrã e cada estado do Inventário ganham a v2 (abre por omissão); a v1 fica. */
export function comInventarioV2<T extends string>(ecras: Ecra<T>[]): Ecra<T>[] {
  return ecras.map((e) => { const f = V2[e.id as IdInventario]; return f ? { ...e, versoes: [...e.versoes, { id: 'v2', nota: NOTA, html: f() }] as Ecra<T>['versoes'] } : e; });
}
