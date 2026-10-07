import '../../comum/css/tokens.css';
import '../../comum/css/base.css';
import './css/entrada.css';
import '../../comum/css/editor.css';

import { montar } from '../../comum/pagina';
import { erp } from './app';
import { iniciar as entrada } from './comportamento/entrada';

montar(erp, [entrada]);
