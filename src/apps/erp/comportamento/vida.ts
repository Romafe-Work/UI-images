/* ERP — os números dos indicadores contam até ao valor ao abrir o ecrã (25 nov., ela: «faz»; o código é comum/contar.ts) */
import { contarNumeros } from '../../../comum/contar';
export function iniciar(): void { contarNumeros('.minv2-kpi > b, .dv2-kpis b'); }
