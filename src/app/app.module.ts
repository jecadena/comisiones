import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToastrModule } from 'ngx-toastr';

// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

// Import all material modules
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import Layouts
import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';

// Vertical Layout
import { SidebarComponent } from './layouts/full/sidebar/sidebar.component';
import { HeaderComponent } from './layouts/full/header/header.component';
import { BrandingComponent } from './layouts/full/sidebar/branding.component';
import { AppNavItemComponent } from './layouts/full/sidebar/nav-item/nav-item.component';
import { ComisionesComponent } from './pages/comisiones/comisiones.component';
import { NuevacomisionComponent } from './pages/comisiones/nuevacomision/nuevacomision.component';
import { FileReaderComponent } from './pages/file-reader/file-reader.component';
import { CobradasComponent } from './pages/comisiones/cobradas/cobradas.component';
import { AnuladasComponent } from './pages/comisiones/anuladas/anuladas.component';
import { PendientesComponent } from './pages/comisiones/pendientes/pendientes.component';
import { PaginaTareasComponent } from './pages/pagina-tareas/pagina-tareas.component';
import { DetalleComisionComponent } from './pages/comisiones/cobradas/detalle-comision/detalle-comision.component';

import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CargarExcelComponent } from './pages/comisiones/cargar-excel/cargar-excel.component';

@NgModule({
  declarations: [
    AppComponent,
    FullComponent,
    BlankComponent,
    SidebarComponent,
    HeaderComponent,
    BrandingComponent,
    AppNavItemComponent,
    ComisionesComponent,
    NuevacomisionComponent,
    FileReaderComponent,
    CobradasComponent,
    AnuladasComponent,
    PendientesComponent,
    PaginaTareasComponent,
    DetalleComisionComponent,
    CargarExcelComponent
  ],
  imports: [
    BrowserModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule.pick(TablerIcons),
    CommonModule,
    DragDropModule,
    MatPaginatorModule,
    MatTableModule,
    MatBadgeModule
  ],
  exports: [TablerIconsModule],
  bootstrap: [AppComponent],
})
export class AppModule {}