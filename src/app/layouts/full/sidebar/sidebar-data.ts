/*import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Inicio',
  },
  {
    displayName: 'Comisiones',
    iconName: 'rosette',
    children: [
      {
        displayName: 'Anuladas',
        route: '/comisiones/anuladas',
      },
      {
        displayName: 'Cobradas',
        route: '/comisiones/cobradas',
      },
      {
        displayName: 'Pendientes',
        route: '/comisiones/pendientes',
      },
    ],
  },
  {
    navCap: 'Registro',
  },
  {
    displayName: 'Registro',
    iconName: 'user-plus',
    route: '/authentication/register',
  }
];
*/
import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Inicio',
  },
  {
    displayName: 'Confirmar Comisiones',
    subtext: 'Confirmadas',
    iconName: 'list',
    route: '/comisiones/confirmadas',
  },
  {
    displayName: 'Comisiones Confirmadas',
    iconName: 'layout-navbar-expand',
    route: '/comisiones',
  },
  {
    displayName: 'Comisiones Cobradas',
    subtext: 'Cobradas',
    iconName: 'clipboard-data',
    route: '/comisiones/cobradas',
  },
  {
    displayName: 'Comisiones Pendientes',
    iconName: 'file-orientation',
    route: '/comisiones/pendientes',
  },
  {
    displayName: 'Comisiones Eliminadas',
    iconName: 'checks',
    route: '/comisiones/anuladas',
  },
  {
    navCap: 'AGREGAR COMISIONES',
  },
  {
    displayName: 'Cargar Excel',
    iconName: 'user-plus',
    route: '/comisiones/cargar-excel',
  }
];
