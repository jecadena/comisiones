import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AppSideLoginComponent } from './pages/authentication/login/login.component';
import { ComisionesComponent } from './pages/comisiones/comisiones.component';
import { NuevacomisionComponent } from './pages/comisiones/nuevacomision/nuevacomision.component';
import { FileReaderComponent } from './pages/file-reader/file-reader.component';
import { CobradasComponent } from './pages/comisiones/cobradas/cobradas.component';
import { DetalleComisionComponent } from './pages/comisiones/cobradas/detalle-comision/detalle-comision.component';
import { ConfirmadasComponent } from './pages/comisiones/confirmadas/confirmadas.component';
import { AnuladasComponent } from './pages/comisiones/anuladas/anuladas.component';
import { PendientesComponent } from './pages/comisiones/pendientes/pendientes.component';
import { PaginaTareasComponent } from './pages/pagina-tareas/pagina-tareas.component';
import { RecibosComponent } from './pages/extra/recibos/recibos.component';
import { DetalleReciboComponent } from './pages/extra/recibos/detalle/detalle-recibo.component';
import { CargarExcelComponent } from './pages/comisiones/cargar-excel/cargar-excel.component';

const routes: Routes = [
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: '',
        component: AppSideLoginComponent,
      },
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.module').then(
            (m) => m.AuthenticationModule
          ),
      },
    ],
  },
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.module').then((m) => m.PagesModule),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.module').then(
            (m) => m.UicomponentsModule
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('./pages/extra/extra.module').then((m) => m.ExtraModule),
      },
      {
        path: 'comisiones',
        component: ComisionesComponent,
      },
      {
        path: 'file-reader',
        component: FileReaderComponent,
      },
      {
        path: 'comisiones/confirmadas',
        component: ConfirmadasComponent,
      },
      {
        path: 'comisiones/nuevacomision',
        component: NuevacomisionComponent,
      },
      { path: 'comisiones/editar/:id', component: NuevacomisionComponent },
      {
        path: 'comisiones/cobradas',
        component: CobradasComponent,
      },
      { 
        path: 'comisiones/cobradas/detalle', 
        component: DetalleComisionComponent },
      {
        path: 'comisiones/anuladas',
        component: AnuladasComponent,
      },
      {
        path: 'comisiones/pendientes',
        component: PendientesComponent,
      },
      {
        path: 'pagina-tareas',
        component: PaginaTareasComponent
      },
      {
        path: 'comisiones/cargar-excel',
        component: CargarExcelComponent
      },
      {
        path: 'recibos',
        component: RecibosComponent,
      },
      { path: 'recibos/detalle/:Id', component: DetalleReciboComponent }
    ],
  },
  { path: 'login', component: AppSideLoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}