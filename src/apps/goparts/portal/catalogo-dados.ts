/* =========================================================
   GOPARTS — os modelos e os veículos de exemplo do Catálogo v3 (13 out. 2026)
   Como no GO REPAIR: a marca abre a tabela dos modelos (Fabricado desde /
   até), e o modelo abre a dos veículos (motor, kW, cv, cc, tração,
   carroçaria). Só há exemplos para as oito marcas favoritas de origem; os
   veículos de cada modelo saem dos motores da marca. São de exemplo — os
   anos e os códigos são plausíveis, não são do TecDoc.
   Usado pelo comportamento (comportamento/catalogo-v3.ts) e pelos estados
   parados 11.9 e 11.10, por isso o HTML das linhas é feito aqui.
   ========================================================= */

/** nome · fabricado desde · até ('' = ainda se fabrica) · carroçaria */
export type Modelo = [string, string, string, string];
/** nome · combustível · kW · cv · cc · códigos do motor */
type Motor = [string, string, number, number, number, string];

export interface Veiculo { nome: string; versao: string; anos: string; combustivel: string; kw: number; cv: number; cc: number; tracao: string; carrocaria: string; motor: string; desde: number; ate: number }

export const MODELOS: Record<string, Modelo[]> = {
  BMW: [
    ['1 (E81)', '09/2006', '09/2012', 'Hatchback'], ['1 (E87)', '02/2003', '12/2013', 'Hatchback'], ['1 (F20)', '07/2011', '06/2019', 'Hatchback'],
    ['1 (F21)', '12/2011', '12/2019', 'Hatchback'], ['1 (F40)', '07/2019', '', 'Hatchback'], ['1 (F70)', '07/2024', '', 'Hatchback'],
    ['1 Coupé (E82)', '10/2006', '10/2013', 'Coupé'], ['1 Cabriolet (E88)', '12/2007', '12/2013', 'Cabriolet'],
    ['3 (E90)', '12/2004', '12/2011', 'Berlina'], ['3 Touring (E91)', '09/2005', '06/2012', 'Carrinha'], ['3 (F30, F80)', '10/2011', '10/2018', 'Berlina'],
    ['3 (G20, G80)', '11/2018', '', 'Berlina'], ['5 (F10)', '01/2009', '02/2017', 'Berlina'], ['X1 (E84)', '03/2009', '06/2015', 'SUV'],
    ['X1 (F48)', '07/2014', '06/2022', 'SUV'], ['X3 (F25)', '09/2010', '08/2017', 'SUV'],
  ],
  'Citroën': [
    ['C3 II (SC_)', '11/2009', '12/2016', 'Hatchback'], ['C3 III (SX)', '11/2016', '', 'Hatchback'], ['C4 I (LC_)', '11/2004', '07/2011', 'Hatchback'],
    ['C4 II (B7)', '09/2009', '12/2018', 'Hatchback'], ['C4 Picasso I (UD_)', '10/2006', '08/2013', 'Monovolume'], ['Berlingo II (B9)', '04/2008', '12/2018', 'Furgão'],
    ['Berlingo III (K9)', '06/2018', '', 'Furgão'], ['C5 Aircross (A_)', '11/2018', '', 'SUV'],
  ],
  'Mercedes-Benz': [
    ['Classe A (W169)', '09/2004', '06/2012', 'Hatchback'], ['Classe A (W176)', '06/2012', '05/2018', 'Hatchback'], ['Classe A (W177)', '03/2018', '', 'Hatchback'],
    ['Classe C (W204)', '01/2007', '12/2014', 'Berlina'], ['Classe C (W205)', '02/2014', '06/2021', 'Berlina'], ['Classe E (W212)', '01/2009', '12/2016', 'Berlina'],
    ['Classe E (W213)', '03/2016', '', 'Berlina'], ['GLA (X156)', '12/2013', '12/2019', 'SUV'], ['Vito (W639)', '09/2003', '10/2014', 'Furgão'],
    ['Sprinter 3,5-t (906)', '06/2006', '12/2018', 'Furgão'],
  ],
  Opel: [
    ['Corsa D (S07)', '07/2006', '08/2014', 'Hatchback'], ['Corsa E (X15)', '09/2014', '06/2019', 'Hatchback'], ['Corsa F (P2JO)', '06/2019', '', 'Hatchback'],
    ['Astra H (A04)', '03/2004', '05/2014', 'Hatchback'], ['Astra J (P10)', '09/2009', '10/2015', 'Hatchback'], ['Astra K (B16)', '06/2015', '12/2021', 'Hatchback'],
    ['Insignia A (G09)', '07/2008', '03/2017', 'Berlina'], ['Mokka / Mokka X (J13)', '06/2012', '12/2019', 'SUV'], ['Combo Tour (X12)', '02/2012', '12/2018', 'Monovolume'],
  ],
  Peugeot: [
    ['206 (2A/C)', '08/1998', '12/2012', 'Hatchback'], ['207 (WA_, WC_)', '02/2006', '12/2015', 'Hatchback'], ['208 I (CA_, CC_)', '03/2012', '12/2019', 'Hatchback'],
    ['208 II (UB_, UP_, UW_, UJ_)', '06/2019', '', 'Hatchback'], ['308 I (4A_, 4C_)', '09/2007', '10/2014', 'Hatchback'], ['308 II (LB_, LP_, LW_)', '09/2013', '12/2021', 'Hatchback'],
    ['2008 I (CU_)', '03/2013', '12/2019', 'SUV'], ['3008 (0U_)', '06/2009', '12/2016', 'Monovolume'], ['Partner Tepee (B9)', '04/2008', '12/2018', 'Furgão'],
  ],
  Renault: [
    ['Clio III (BR0/1, CR0/1)', '01/2005', '12/2014', 'Hatchback'], ['Clio IV (BH_)', '11/2012', '08/2019', 'Hatchback'], ['Clio V (B7_)', '05/2019', '', 'Hatchback'],
    ['Mégane III (BZ0/1_)', '11/2008', '08/2016', 'Hatchback'], ['Mégane IV (B9A/M/N_)', '11/2015', '', 'Hatchback'], ['Scénic II (JM0/1_)', '06/2003', '08/2009', 'Monovolume'],
    ['Scénic III (JZ0/1_)', '02/2009', '12/2016', 'Monovolume'], ['Captur I (J5_, H5_)', '06/2013', '12/2019', 'SUV'], ['Kadjar (HA_, HL_)', '06/2015', '12/2022', 'SUV'],
    ['Kangoo II Express (FW0/1_)', '02/2008', '', 'Furgão'], ['Twingo II (CN0_)', '03/2007', '12/2014', 'Hatchback'],
  ],
  Toyota: [
    ['Yaris (_P9_)', '08/2005', '12/2014', 'Hatchback'], ['Yaris (_P13_)', '09/2010', '08/2020', 'Hatchback'], ['Yaris (_P21_, _PA1_, _PH1_)', '08/2020', '', 'Hatchback'],
    ['Auris (_E15_)', '10/2006', '09/2012', 'Hatchback'], ['Auris (_E18_)', '10/2012', '12/2018', 'Hatchback'], ['Corolla (_E21_)', '02/2019', '', 'Hatchback'],
    ['C-HR (_X1_)', '10/2016', '', 'SUV'], ['RAV 4 IV (_A4_)', '12/2012', '12/2018', 'SUV'],
  ],
  VW: [
    ['Golf V (1K1)', '10/2003', '02/2009', 'Hatchback'], ['Golf VI (5K1)', '10/2008', '11/2013', 'Hatchback'], ['Golf VII (5G1, BQ1, BE1, BE2)', '08/2012', '08/2020', 'Hatchback'],
    ['Golf VIII (CD1)', '08/2019', '', 'Hatchback'], ['Polo V (6R1, 6C1)', '04/2009', '10/2017', 'Hatchback'], ['Polo VI (AW1, BZ1)', '06/2017', '', 'Hatchback'],
    ['Passat B7 (362)', '08/2010', '12/2014', 'Carrinha'], ['Passat B8 (3G2, CB2)', '08/2014', '', 'Carrinha'], ['T-Roc (A11, D11)', '07/2017', '', 'SUV'],
    ['Tiguan (AD1, AX1)', '01/2016', '', 'SUV'], ['Caddy III (2KA, 2KH)', '03/2004', '05/2015', 'Furgão'],
  ],
};

const MOTORES: Record<string, Motor[]> = {
  BMW: [['116i', 'Gasolina', 90, 122, 1599, 'N45 B16 A'], ['118d', 'Diesel', 105, 143, 1995, 'N47 D20 C'], ['120d', 'Diesel', 120, 163, 1995, 'N47 D20 A'], ['118i', 'Gasolina', 100, 136, 1499, 'B38 B15 A'], ['316d', 'Diesel', 85, 116, 1995, 'N47 D20 C']],
  'Citroën': [['1.2 PureTech', 'Gasolina', 60, 82, 1199, 'HMZ (EB2F)'], ['1.6 HDi', 'Diesel', 68, 92, 1560, '9HP (DV6DTED)'], ['1.6 HDi', 'Diesel', 80, 109, 1560, '9HZ (DV6TED4)'], ['1.5 BlueHDi', 'Diesel', 75, 102, 1499, 'YHY (DV5RD)'], ['1.2 PureTech', 'Gasolina', 96, 130, 1199, 'HNS (EB2ADTS)']],
  'Mercedes-Benz': [['180 CDI', 'Diesel', 80, 109, 1991, 'OM 640.940'], ['200 CDI', 'Diesel', 100, 136, 2148, 'OM 646.811'], ['220 d', 'Diesel', 125, 170, 2143, 'OM 651.921'], ['180', 'Gasolina', 90, 122, 1595, 'M 270.910'], ['200', 'Gasolina', 135, 184, 1991, 'M 274.920']],
  Opel: [['1.2', 'Gasolina', 59, 80, 1229, 'Z 12 XEP'], ['1.3 CDTI', 'Diesel', 55, 75, 1248, 'Z 13 DTJ'], ['1.4', 'Gasolina', 74, 100, 1398, 'A 14 XER'], ['1.7 CDTI', 'Diesel', 96, 131, 1686, 'A 17 DTS'], ['1.6 CDTI', 'Diesel', 100, 136, 1598, 'B 16 DTH']],
  Peugeot: [['1.2 PureTech', 'Gasolina', 60, 82, 1199, 'HMZ (EB2F)'], ['1.6 HDi', 'Diesel', 68, 92, 1560, '9HP (DV6DTED)'], ['1.6 HDi', 'Diesel', 80, 109, 1560, '9HZ (DV6TED4)'], ['1.5 BlueHDi', 'Diesel', 75, 102, 1499, 'YHY (DV5RD)'], ['1.2 PureTech', 'Gasolina', 96, 130, 1199, 'HNS (EB2ADTS)']],
  Renault: [['1.2 16V', 'Gasolina', 55, 75, 1149, 'D4F 740, D4F 742'], ['1.5 dCi', 'Diesel', 63, 86, 1461, 'K9K 728, K9K 729'], ['1.5 dCi', 'Diesel', 78, 106, 1461, 'K9K 734, K9K 732'], ['1.6 16V', 'Gasolina', 82, 112, 1598, 'K4M 812, K4M 813'], ['1.3 TCe', 'Gasolina', 103, 140, 1332, 'H5H 470']],
  Toyota: [['1.0 VVT-i', 'Gasolina', 51, 69, 998, '1KR-FE'], ['1.33 Dual VVT-i', 'Gasolina', 73, 99, 1329, '1NR-FE'], ['1.4 D-4D', 'Diesel', 66, 90, 1364, '1ND-TV'], ['1.8 Hybrid', 'Híbrido', 90, 122, 1798, '2ZR-FXE'], ['2.0 D-4D', 'Diesel', 91, 124, 1998, '1AD-FTV']],
  VW: [['1.0 TSI', 'Gasolina', 70, 95, 999, 'DKRF'], ['1.4 TSI', 'Gasolina', 90, 122, 1390, 'CAXA'], ['1.6 TDI', 'Diesel', 77, 105, 1598, 'CAYC'], ['2.0 TDI', 'Diesel', 103, 140, 1968, 'CFFB'], ['2.0 TDI', 'Diesel', 110, 150, 1968, 'DFGA']],
};

export const ANO_HOJE = 2026;
export const ano = (mmaaaa: string) => (mmaaaa ? Number(mmaaaa.slice(-4)) : ANO_HOJE);

/** Os veículos de um modelo: três ou quatro motores da marca, a começar num diferente em cada modelo. */
export function veiculosDe(marca: string, modelo: string): Veiculo[] {
  const lista = MODELOS[marca] || [];
  const i = lista.findIndex((m) => m[0] === modelo);
  const motores = MOTORES[marca] || [];
  if (i < 0 || !motores.length) return [];
  const [nome, desde, ate, carrocaria] = lista[i];
  const n = 3 + (i % 2);
  const a0 = ano(desde), a1 = ano(ate);
  return Array.from({ length: n }, (_, j) => {
    const [mot, comb, kw, cv, cc, cod] = motores[(i + j) % motores.length];
    /* cada motor numa parte dos anos do modelo, para o filtro do ano ter efeito */
    const d = a0 + Math.floor(((a1 - a0) * j) / (n + 1));
    /* no ano em que o modelo começa, nunca antes do mês dele */
    const mesV = Math.max((j * 3) % 9 + 1, d === a0 ? Number(desde.slice(0, 2)) : 1);
    const desdeV = j === 0 ? desde : String(mesV).padStart(2, '0') + '/' + d;
    return { nome: `${nome} ${mot}`, versao: mot, anos: `${desdeV} – ${ate || '…'}`, combustivel: comb, kw, cv, cc,
      tracao: marca === 'BMW' && !nome.startsWith('X') ? 'Tração traseira' : 'Tração dianteira', carrocaria, motor: cod, desde: ano(desdeV), ate: a1 };
  });
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** As linhas da tabela dos modelos. */
export function linhasModelos(marca: string): string {
  return (MODELOS[marca] || []).map((m, i) =>
    `<tr class="cat3__linha" style="--i:${i}" data-modelo="${esc(m[0])}" data-desde="${ano(m[1])}" data-ate="${ano(m[2])}" tabindex="0"><td><span class="cat3__nome">${esc(m[0])}</span></td><td>${m[1]}</td><td>${m[2] || '<span class="cat3__ainda">em produção</span>'}</td><td class="cat3__ir" aria-hidden="true">${SETA}</td></tr>`).join('');
}

/** O código do modelo: o que está entre parênteses no nome («1 (E87)» → «E87»). */
export const codigo = (nome: string) => (/\(([^)]+)\)\s*$/.exec(nome) || ['', '—'])[1];
const mes = (mmaaaa: string) => (mmaaaa ? Number(mmaaaa.slice(-4)) * 100 + Number(mmaaaa.slice(0, 2)) : 999999);

/** v4: as carroçarias da marca com quantos modelos têm, pela ordem da lista. */
export function carrocarias(marca: string): [string, number][] {
  const n = new Map<string, number>();
  (MODELOS[marca] || []).forEach((m) => n.set(m[3], (n.get(m[3]) || 0) + 1));
  return Array.from(n);
}

/** v4: as linhas dos modelos com a silhueta, o código, o tipo e o botão de abrir (a imagem dela, 13 out.). */
export function linhasModelos4(marca: string, icone: (carrocaria: string) => string): string {
  return (MODELOS[marca] || []).map((m, i) =>
    `<tr class="cat3__linha" style="--i:${i}" data-modelo="${esc(m[0])}" data-desde="${ano(m[1])}" data-ate="${ano(m[2])}" data-carrocaria="${esc(m[3])}" data-mes="${mes(m[1])}" tabindex="0">`
    + `<td><span class="cat4__modelo"><span class="cat4__silhueta" aria-hidden="true">${icone(m[3])}</span><span class="cat4__modelo-nome">${esc(m[0])}</span></span></td>`
    + `<td class="cat4__codigo">${esc(codigo(m[0]))}</td><td>${m[1]}</td><td>${m[2] || '<span class="cat3__ainda">em produção</span>'}</td>`
    + `<td><span class="cat4__tipo">${esc(m[3])}</span></td>`
    + `<td class="cat4__accoes"><button type="button" class="cat4__abrir" aria-label="Ver os veículos do ${esc(m[0])}" tabindex="-1">${SETA}</button></td></tr>`).join('');
}

/** v5: as linhas dos veículos como na terceira imagem dela (13 out.): o (i) abre os detalhes
    numa linha por baixo, o nome é só a versão (o modelo está na barra de cima). */
export function linhasVeiculos5(marca: string, modelo: string, ic: { info: string; visto: string; seta: string }): string {
  return veiculosDe(marca, modelo).map((v, i) =>
    `<tr class="cat3__linha" style="--i:${i}" data-nome="${esc(v.versao)}" data-versao="${esc(v.versao)}" data-desde="${v.desde}" data-ate="${v.ate}" data-motor="${esc(v.motor)}" data-kw="${v.kw}" data-cv="${v.cv}" data-cc="${v.cc}" tabindex="0">`
    + `<td class="cat5__i"><button type="button" class="cat5__info" aria-expanded="false" aria-label="Detalhes do ${esc(v.versao)}">${ic.info}</button></td>`
    /* data-r: o rótulo de cada valor quando se vê em «Lista» */
    + `<td><span class="cat5__versao">${esc(v.versao)}</span><span class="cat5__escolhido">${ic.visto}Selecionado</span></td><td class="cat3__nowrap" data-r="Ano">${v.anos}</td><td data-r="Combustível">${v.combustivel}</td>`
    + `<td class="erp-num" data-r="kW">${v.kw}</td><td class="erp-num" data-r="cv">${v.cv}</td><td class="erp-num" data-r="cc">${v.cc}</td><td data-r="Tração">${v.tracao}</td><td data-r="Carroçaria">${v.carrocaria}</td><td class="cat3__nowrap" data-r="Motor">${esc(v.motor)}</td></tr>`
    + `<tr class="cat5__detalhe" hidden><td></td><td colspan="9"><div class="cat5__painel"><dl class="cat5__ficha">`
    + `<div><dt>Veículo</dt><dd>${esc(marca)} ${esc(v.nome)}</dd></div><div><dt>Fabricado</dt><dd>${v.anos}</dd></div>`
    + `<div><dt>Potência</dt><dd>${v.kw} kW · ${v.cv} cv</dd></div><div><dt>Cilindrada</dt><dd>${v.cc} cc</dd></div>`
    + `<div><dt>Combustível</dt><dd>${v.combustivel}</dd></div><div><dt>Motor</dt><dd>${esc(v.motor)}</dd></div>`
    + `<div><dt>Tração</dt><dd>${v.tracao}</dd></div><div><dt>Carroçaria</dt><dd>${v.carrocaria}</dd></div></dl>`
    + `<button type="button" class="btn btn--acao btn--sm cat5__pecas"><span class="btn__rotulo">Encontrar peças compatíveis</span>${ic.seta}</button></div></td></tr>`).join('');
}

/** As linhas da tabela dos veículos. */
export function linhasVeiculos(marca: string, modelo: string): string {
  return veiculosDe(marca, modelo).map((v, i) =>
    `<tr class="cat3__linha" style="--i:${i}" data-nome="${esc(v.nome)}" data-desde="${v.desde}" data-ate="${v.ate}" data-motor="${esc(v.motor)}" data-kw="${v.kw}" data-cv="${v.cv}" data-cc="${v.cc}" tabindex="0">`
    + `<td><span class="cat3__nome">${esc(v.nome)}</span></td><td class="cat3__nowrap">${v.anos}</td>`
    + `<td><span class="cat3__comb cat3__comb--${v.combustivel === 'Diesel' ? 'diesel' : v.combustivel === 'Híbrido' ? 'hibrido' : 'gasolina'}">${v.combustivel}</span></td>`
    + `<td class="erp-num">${v.kw}</td><td class="erp-num">${v.cv}</td><td class="erp-num">${v.cc}</td><td>${v.tracao}</td><td>${v.carrocaria}</td><td class="cat3__nowrap">${esc(v.motor)}</td>`
    + `<td class="cat3__ir" aria-hidden="true">${SETA}</td></tr>`).join('');
}

/** Os anos para o filtro «Ano», do mais recente para o mais antigo. */
export function anos(desde: number, ate: number): number[] {
  return Array.from({ length: ate - desde + 1 }, (_, k) => ate - k);
}

const SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-lucide="chevron-right"><path d="m9 18 6-6-6-6"/></svg>';

/* ---------- v5: as referências (a quarta imagem dela, 13 out.) ----------
   Peças de exemplo para qualquer veículo: grupo de montagem, fabricante,
   referência, descrição, preço de tabela, desconto (%) e stock no Porto e em
   Sacavém. As referências têm o formato de cada marca, mas são inventadas. */
export type Referencia = [string, string, string, string, number, number, number, number];
export const REFERENCIAS: Referencia[] = [
  ['Rolamento de roda', 'SKF', 'VKBA 6556', 'Kit de rolamento de roda, eixo dianteiro', 89.9, 40, 12, 4],
  ['Rolamento de roda', 'SKF', 'VKBA 6557', 'Kit de rolamento de roda, eixo traseiro', 94.5, 40, 6, 0],
  ['Rolamento de roda', 'FAG', '713 6497 00', 'Kit de rolamento de roda, eixo dianteiro', 84.5, 35, 3, 0],
  ['Kit de distribuição', 'SKF', 'VKMC 01250-2', 'Kit de distribuição com bomba de água', 245, 40, 5, 2],
  ['Kit de distribuição', 'INA', '530 0089 10', 'Kit de distribuição', 168.3, 35, 0, 3],
  ['Kit de distribuição', 'Gates', 'K015569XS', 'Kit de distribuição', 152.1, 30, 2, 0],
  ['Bomba de água', 'SKF', 'VKPC 88618', 'Bomba de água', 112.4, 40, 7, 5],
  ['Bomba de água', 'INA', '538 0001 10', 'Bomba de água', 98, 35, 0, 0],
  ['Correia de acessórios', 'SKF', 'VKMV 6PK1873', 'Correia poli-V, 6 nervuras, 1873 mm', 24.6, 40, 30, 18],
  ['Correia de acessórios', 'Gates', '6PK1873', 'Correia poli-V, 6 nervuras, 1873 mm', 22.9, 30, 10, 6],
  ['Tensor da correia', 'SKF', 'VKM 38236', 'Tensor da correia de acessórios', 58.7, 40, 4, 1],
  ['Homocinética', 'SKF', 'VKJA 5446', 'Kit de junta homocinética, lado da roda', 79.9, 40, 2, 2],
];
export const GRUPOS = Array.from(new Set(REFERENCIAS.map((r) => r[0])));
export const FABRICANTES = Array.from(new Set(REFERENCIAS.map((r) => r[1]))).sort();
export const euros = (n: number) => n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

/** v5: uma linha da tabela das referências. */
export function linhaReferencia(r: Referencia, i: number, ic: { imagem: string; caixa: string }): string {
  const [grupo, fab, ref, desc, preco, d, porto, sacavem] = r;
  const liquido = preco * (1 - d / 100);
  const stock = porto + sacavem;
  const estado = stock === 0 ? 'sem' : stock < 5 ? 'pouco' : 'ok';
  return `<tr class="cat5__ref" style="--i:${i}" data-grupo="${esc(grupo)}" data-fabricante="${esc(fab)}" data-ref="${esc(ref)}" data-preco="${liquido.toFixed(2)}" data-stock="${stock}">`
    + `<td class="cat5__marcar"><input type="checkbox" data-comparar="${esc(fab)}|${esc(ref)}" aria-label="Comparar ${esc(fab)} ${esc(ref)}"></td>`
    + `<td><span class="cat5__imagem" aria-hidden="true">${ic.imagem}</span></td>`
    + `<td><span class="cat5__referencia">${esc(ref)}</span><span class="cat5__fabricante">${esc(fab)}</span></td>`
    + `<td data-r="Descrição">${esc(desc)}<span class="cat5__grupo">${esc(grupo)}</span></td>`
    + `<td class="erp-num" data-r="Preço">${euros(preco)}</td><td class="erp-num" data-r="Desc.">${d}%</td>`
    + `<td class="erp-num cat5__liquido" data-r="Líquido">${euros(liquido)}</td>`
    + `<td data-r="Stock"><span class="cat5__stock cat5__stock--${estado}" title="Porto ${porto} · Sacavém ${sacavem}">${ic.caixa}${stock === 0 ? 'Sem stock' : `${stock} un.`}</span><span class="cat5__armazens">Porto ${porto} · Sacavém ${sacavem}</span></td></tr>`;
}

/* ---------- v5: o Universal (a quinta imagem dela, 13 out.) ----------
   As peças sem veículo: os grupos de montagem numa árvore (categoria → grupo).
   As categorias são as da imagem do GO REPAIR; os grupos são de exemplo e
   incluem os das referências acima. */
export const ARVORE: [string, string[]][] = [
  ['Acessórios', ['Almofada para o pescoço', 'Capas de banco', 'Tapetes']],
  ['Alimentação de combustível', ['Bomba de combustível', 'Filtro de combustível']],
  ['Aquecimento e ventilação', ['Filtro de habitáculo', 'Radiador de aquecimento']],
  ['Caixa de velocidades', ['Apoio da caixa', 'Óleo da caixa']],
  ['Carroçaria', ['Escovas limpa-vidros', 'Espelho retrovisor']],
  ['Circuitos elétricos', ['Baterias', 'Fusíveis']],
  ['Comando da correia', ['Bomba de água', 'Correia de acessórios', 'Kit de distribuição', 'Tensor da correia']],
  ['Direção', ['Bomba da direção', 'Rótula de direção']],
  ['Embraiagem', ['Kit de embraiagem', 'Volante bimassa']],
  ['Equipamento para a oficina', ['Ferramentas de montagem', 'Massa lubrificante']],
  ['Iluminação e sinalização', ['Faróis', 'Lâmpadas']],
  ['Jantes e pneus', ['Pesos de equilibragem', 'Válvulas']],
  ['Suspensão e amortecimento', ['Amortecedor', 'Rolamento de roda']],
  ['Transmissão', ['Fole de transmissão', 'Homocinética']],
];
const OUTROS = ['Bosch', 'HELLA', 'SKF', 'STC', 'Valeo'];
/** Os fabricantes de um grupo: os das referências de exemplo, ou três de uma lista fixa. */
export function fabricantesDe(grupo: string): string[] {
  const das = Array.from(new Set(REFERENCIAS.filter((r) => r[0] === grupo).map((r) => r[1]))).sort();
  if (das.length) return das;
  const k = grupo.length % OUTROS.length;
  return [0, 1, 2].map((j) => OUTROS[(k + j * 2) % OUTROS.length]).sort();
}

/* ---------- v5: os Detalhes de uma referência (a sexta imagem dela, 13 out.) ----------
   Números OE, características e documentos de exemplo, por grupo de montagem. */
const CARACTERISTICAS: Record<string, [string, string][]> = {
  'Rolamento de roda': [['Diâmetro interior', '45 mm'], ['Diâmetro exterior', '84 mm'], ['Largura', '39 mm'], ['Lado de montagem', 'Eixo dianteiro, ambos os lados'], ['Com sensor ABS', 'Sim'], ['Peso', '1,3 kg']],
  'Kit de distribuição': [['Número de dentes', '137'], ['Largura da correia', '25 mm'], ['Com bomba de água', 'Sim'], ['Peças incluídas', 'Correia, tensor, polia de inversão, bomba de água'], ['Peso', '3,4 kg']],
  'Bomba de água': [['Número de pás', '7'], ['Material das pás', 'Metal'], ['Com junta', 'Sim'], ['Peso', '1,1 kg']],
  'Correia de acessórios': [['Número de nervuras', '6'], ['Comprimento', '1873 mm'], ['Peso', '0,2 kg']],
  'Tensor da correia': [['Diâmetro da polia', '70 mm'], ['Largura da polia', '26 mm'], ['Peso', '0,9 kg']],
  'Homocinética': [['Dentado exterior (lado da roda)', '27'], ['Dentado interior', '30'], ['Diâmetro da vedação', '58 mm'], ['Peso', '2,2 kg']],
};
const OE: Record<string, string[]> = {
  'Rolamento de roda': ['31 22 6 765 157', '31 22 1 095 702'], 'Kit de distribuição': ['11 31 7 797 893', '11 51 7 805 813'],
  'Bomba de água': ['11 51 7 805 813', '11 51 8 516 204'], 'Correia de acessórios': ['11 28 7 800 594'],
  'Tensor da correia': ['11 28 7 797 974', '11 28 7 790 645'], 'Homocinética': ['31 60 7 607 445'],
};
export interface Ficha { oe: string[]; caracteristicas: [string, string][]; documentos: [string, string][]; substituida: string; ean: string; garantia: string }
export function fichaDe(r: Referencia): Ficha {
  const n = r[2].replace(/\D/g, '').padEnd(9, '7').slice(0, 9);
  return {
    oe: OE[r[0]] || [],
    caracteristicas: CARACTERISTICAS[r[0]] || [['Peso', '1,0 kg']],
    documentos: [['Instruções de montagem', 'PDF · 1,2 MB'], ['Ficha técnica', 'PDF · 340 KB'], ...(r[1] === 'SKF' ? [['Declaração de conformidade', 'PDF · 95 KB'] as [string, string]] : [])],
    substituida: r[2] === 'VKBA 6557' ? 'VKBA 6557 A' : '',
    ean: '73162' + n.slice(0, 8),
    garantia: r[1] === 'SKF' ? '2 anos' : '1 ano',
  };
}
/** As equivalências: as do mesmo grupo que servem no mesmo sítio (o mesmo eixo; o kit com ou sem bomba de água). */
const eixo = (d: string) => (/dianteiro/.test(d) ? 'd' : /traseiro/.test(d) ? 't' : '');
const comBomba = (d: string) => /bomba de água/.test(d) && !/^Bomba/.test(d);
export const equivalentes = (r: Referencia) => REFERENCIAS.filter((q) => q !== r && q[0] === r[0] && eixo(q[3]) === eixo(r[3]) && comBomba(q[3]) === comBomba(r[3]));
