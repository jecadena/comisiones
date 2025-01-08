import { Component, OnInit } from '@angular/core';
import { navItems } from './sidebar-data';
import { NavService } from '../../../services/nav.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ComisionesService } from '../../../services/comisiones.service';


@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    standalone: false
})
export class SidebarComponent implements OnInit {
  usuarioDatos: any;
  isAdmin: boolean = false;
  navItems = navItems;
  idUsuario: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
  rolUsuario: string = '';
  SignIn: string = '';

  amadeusList: any[] = [];
  PnrId: number = 0;
  AgencyName: string = '';
  OfficeIATA: string = '';
  IssuerCode: string = '';
  IssuedData: string = '';
  cuenta: string = '';

  errorLoadingAmadeus: string = '';
  busqueda: string = '';
  busquedaActiva = false;
  socket: any;

  comisionForm: FormGroup;
  comision: any = {};
  pnrs: any[] = [];
  cadenas: string[] = [];
  hoteles: string[] = [];
  isEditMode = false;
  amadeusListFiltered: any[] = [];
  countRecibos: number = 0;
  comisionesList: any[] = [];

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private http: HttpClient, 
    private comisionesService: ComisionesService) {}
  
  ngOnInit(): void {
    this.authService.usuarioDatos$.subscribe(datos => {
      this.usuarioDatos = datos;
      const co_role = this.usuarioDatos?.co_role?.trim();
      console.log('Datos del usuario:', this.usuarioDatos);
      this.isAdmin = co_role === 'ADMIN';
    });
    this.authService.usuarioDatos$.subscribe(datosUsuario => {
      if (datosUsuario && datosUsuario['rolUsuario']) {
        this.actualizarSidebar(datosUsuario['rolUsuario']);
        this.idUsuario = datosUsuario['idUsuario'] || '';
        this.rolUsuario = datosUsuario['rolUsuario'] || '';
        this.nombreUsuario = datosUsuario['nombre'] || '';
        this.imagenUsuario = datosUsuario['fechaIngreso'] || '';
        sessionStorage.setItem('rolUsuario', this.rolUsuario);
        sessionStorage.setItem('idUsuario', this.idUsuario);
      }
    });
  
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }

    this.comisionesService.comisiones$.subscribe(
      data => {
        this.comisionesList = data;
      },
      error => {
        console.error('Error al obtener la lista de comisiones:', error);
      }
    );

    this.loadCounts();
    const userData = this.authService.getUserData();
    this.SignIn = userData.co_counter;
  }
  
  private actualizarSidebar(rolUsuario: string) {
    this.navItems = navItems.filter(item => item.displayName !== 'Agencias');
  
    if (rolUsuario === '1') {
      this.navItems.splice(1, 0, {
        displayName: 'Agencias',
        iconName: 'layout-dashboard',
        route: '/dashboard',
      });
    }
  }

  navigateToComisiones() {
    const rolUsuario = sessionStorage.getItem('rolUsuario');
    const idUsuario = sessionStorage.getItem('idUsuario');
    if (idUsuario === '1') {
      this.router.navigate(['/comisiones'], { queryParams: { idUsuario: idUsuario } });
    } else {
      this.router.navigate(['/comisiones'], { queryParams: { rolUsuario: rolUsuario } });
    }
  }
  loadCounts(): void {
    this.comisionesService.getCountRecibos(this.SignIn)
        .subscribe(count => this.countRecibos = count);
  }
}
