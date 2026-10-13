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

export interface Veiculo { nome: string; anos: string; combustivel: string; kw: number; cv: number; cc: number; tracao: string; carrocaria: string; motor: string; desde: number; ate: number }

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
    return { nome: `${nome} ${mot}`, anos: `${desdeV} – ${ate || '…'}`, combustivel: comb, kw, cv, cc,
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
