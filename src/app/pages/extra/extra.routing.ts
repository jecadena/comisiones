import { Routes } from '@angular/router';

// pages
import { AppIconsComponent } from './icons/icons.component';
import { RecibosComponent } from './recibos/recibos.component';
import { DetalleReciboComponent } from './recibos/detalle/detalle-recibo.component';

export const ExtraRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'icons',
        component: AppIconsComponent,
      },
      {
        path: 'recibos',
        component: RecibosComponent,
      },
      {
        path: 'detalle-recibo/:id',
        component: DetalleReciboComponent,
      },
    ],
  },
];