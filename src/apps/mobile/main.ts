import '../../comum/css/tokens.css';
import '../../comum/css/base.css';
import '../../comum/entrar/entrar.css';
import '../../comum/css/telemovel.css';
import '../../comum/carregar/carregar.css';
import './css/pick.css';
import './css/inventario.css';
import './css/entrar-industrial.css';
import './css/cena.css';
import '../../comum/css/editor.css';

import { montar } from '../../comum/pagina';
import { iniciar as entrar } from '../../comum/entrar/comportamento';
import { mobile } from './app';
import { iniciar as inventario } from './comportamento/inventario';
import { iniciar as entrarIndustrial } from './comportamento/entrar-industrial';
import { iniciar as navegar } from './comportamento/navegar';

montar(mobile, [navegar, entrar, inventario, entrarIndustrial]);
