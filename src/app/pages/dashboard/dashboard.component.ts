import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AmadeusService } from '../../services/amadeus.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    standalone: false
})
export class AppDashboardComponent implements OnInit {
  Math = Math;
  idUsuario: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
  rolUsuario: string = '';

  amadeusList: any[] = [];
  amadeusListFiltered: any[] = [];
  currentPage: number = 1; // Página actual
  itemsPerPage: number = 20; // Cantidad de ítems por página
  totalItems: number = 0; // Total de ítems
  pageSizeOptions: number[] = [20, 40, 60]; // Opciones de cantidad por página

  counterList: any[] = [];
  PnrId: number = 0;
  AgencyName: string = '';
  OfficeIATA: string = '';
  IssuerCode: string = '';
  IssuedData: string = '';
  cuenta: string = '';

  CheckInDate: string = '';
  CheckOutDate: string = '';
  ConfirmationCode: string = '';
  HotelChainName: string = '';
  HotelName: string = '';
  HotelPrice: string = '';
  estado: string = '';

  errorLoadingAmadeus: string = '';
  busqueda: string = '';
  busquedaActiva: boolean = false;
  filtrarPorAgenciaActiva: boolean = false;
  socket: any;

  comisionForm: FormGroup;
  comision: any = {};
  pnrs: any[] = [];
  cadenas: string[] = [];
  hoteles: string[] = [];
  isEditMode = false;

  usuarios: any[] = [];

  private searchSubject: Subject<string> = new Subject();

  constructor(
    private authService: AuthService,
    private router: Router,
    private amadeusService: AmadeusService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.comisionForm = this.fb.group({
      // Initialize your form controls here
    });
  }

  ngOnInit(): void {
    this.loadAmadeusList();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.loadUserData();
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(searchText => {
        this.buscarAmadeus(searchText);
      });

      this.cargarAgencias();
    }
  }

  loadAmadeusList(): void {
    this.amadeusService.amadeus$.subscribe(
      data => {
        this.amadeusList = data;
        this.totalItems = this.amadeusList.length; // Actualizar total de ítems
        this.actualizarListaPaginada(); // Actualizar lista paginada al inicio
      },
      error => {
        console.error('Error al obtener la lista de comisiones:', error);
      }
    );
  }

  loadUserData(): void {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      this.idUsuario = userData['idusuario'];
      this.rolUsuario = userData['rolUsuario'];
      this.nombreUsuario = userData['nombre'];
      this.imagenUsuario = userData['fechaIngreso'];
    }
    this.authService.usuarioDatos$.subscribe(datosUsuario => {
      if (datosUsuario && datosUsuario['nombre']) {
        this.idUsuario = datosUsuario['idusuario'];
        this.rolUsuario = datosUsuario['rolUsuario'];
        this.nombreUsuario = datosUsuario['nombre'];
        this.imagenUsuario = datosUsuario['fechaIngreso'];
      }
    });
  }

  formatearFecha(fecha: string): string {
    let IssuedData: Date = new Date(fecha);
    let dia: string = String(IssuedData.getDate()).padStart(2, '0');
    let mes: string = String(IssuedData.getMonth() + 1).padStart(2, '0');
    let año: string = String(IssuedData.getFullYear());
    return `${dia}/${mes}/${año}`;
  }

  onKeyUp() {
    if (this.busqueda.trim() !== '') {
      this.searchSubject.next(this.busqueda);
    } else {
      this.limpiarBusqueda();
    }
  }

  buscarAmadeus(searchText: string = this.busqueda) {
    if (searchText.trim() !== '') {
      this.busquedaActiva = true;
      this.filtrarPorAgenciaActiva = false;
      this.amadeusService.buscarAmadeus(searchText).subscribe(
        data => {
          this.amadeusList = data;
          this.totalItems = this.amadeusList.length; // Actualizar total de ítems
          this.actualizarListaPaginada(); // Actualizar lista paginada al buscar
        },
        (error: HttpErrorResponse) => {
          this.errorLoadingAmadeus = 'Error al cargar la lista de comisiones: ' + error.message;
          console.error('Error al obtener la lista de comisiones:', error.message);
        }
      );
    } else {
      this.cargarAgencias();
    }
  }

  cargarAgencias(): void {
    this.amadeusService.getAgencias().subscribe(
      (data: any[]) => {
        this.cadenas = data.map(item => item.AgencyName);
      },
      (error: any) => {
        console.error('Error al cargar las agencias', error);
      }
    );
  }

  filtrarPorAgencia(PnrId: number) {
    if (PnrId !== 0) {
      this.busquedaActiva = true;
      this.filtrarPorAgenciaActiva = true;
      this.amadeusService.buscarAmadeusLista(PnrId.toString()).subscribe(
        data => {
          this.amadeusList = data;
          this.totalItems = this.amadeusList.length; // Actualizar total de ítems
          this.actualizarListaPaginada(); // Actualizar lista paginada al filtrar
        },
        (error: HttpErrorResponse) => {
          this.errorLoadingAmadeus = 'Error al cargar la lista de agencias: ' + error.message;
          console.error('Error al obtener la lista de agencias:', error.message);
        }
      );
    } else {
      Swal.fire(
        'Error',
        'No se ha seleccionado un PnrId válido para la búsqueda.',
        'error'
      );
    }
  }

  regresarListado() {
    this.amadeusListFiltered = [];
  }

  limpiarBusqueda() {
    this.busqueda = '';
    this.loadAmadeusList();
  }

  logout() {
    this.authService.logout();
  }

  estructura() {
    this.router.navigate(['/estructura']);
  }

  regresar() {
    this.busqueda = '';
    this.busquedaActiva = false;
    this.amadeusService.actualizarListaAmadeus();
  }

  // Métodos de paginación

  actualizarListaPaginada(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.amadeusListFiltered = this.amadeusList.slice(startIndex, endIndex);
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.actualizarListaPaginada();
  }

  onItemsPerPageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.itemsPerPage = Number(target.value);
      this.currentPage = 1;
      this.actualizarListaPaginada();
    }
  }
}







/*
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AmadeusService } from '../../services/amadeus.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class AppDashboardComponent implements OnInit {
  idUsuario: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
  rolUsuario: string = '';
  apellidoUsuario: string = '';
  coMaestro: string = '';
  coTipMaestro: string = '';
  infoAdicional: string = '';

  amadeusList: any[] = [];
  counterList: any[] = [];
  PnrId: number = 0;
  AgencyName: string = '';
  OfficeIATA: string = '';
  IssuerCode: string = '';
  IssuedData: string = '';
  cuenta: string = '';

  CheckInDate: string = '';
  CheckOutDate: string = '';
  ConfirmationCode: string = '';
  HotelChainName: string = '';
  HotelName: string = '';
  HotelPrice: string = '';
  estado: string = '';

  errorLoadingAmadeus: string = '';
  busqueda: string = '';
  busquedaActiva: boolean = false;
  filtrarPorAgenciaActiva: boolean = false;
  socket: any;

  comisionForm: FormGroup;
  comision: any = {};
  pnrs: any[] = [];
  cadenas: string[] = [];
  hoteles: string[] = [];
  isEditMode = false;
  amadeusListFiltered: any[] = [];

  usuarios: any[] = [];

  private searchSubject: Subject<string> = new Subject();

  constructor(private authService: AuthService, private router: Router, private amadeusService: AmadeusService, private http: HttpClient) {}
  ngOnInit(): void {
    
    this.amadeusService.amadeus$.subscribe(
      data => {
        this.amadeusList = data;
      },
      error => {
        console.error('Error al obtener la lista de comisiones:', error);
      }
    );

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      const userData = this.authService.getUserData();
      if (userData) {
        this.nombreUsuario = userData.nombre;
        this.apellidoUsuario = userData.apellido;
        this.coMaestro = userData.co_maestro;
        this.coTipMaestro = userData.co_tip_maestro;
        this.infoAdicional = userData.info_adicional;
      }
    }
      this.searchSubject.pipe(
      debounceTime(300), 
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.buscarAmadeus(searchText);
    });

    this.cargarAgencias();

  }
  formatearFecha(fecha: string): string {
    let IssuedData: Date = new Date(fecha);
    let dia: string = String(IssuedData.getDate()).padStart(2, '0');
    let mes: string = String(IssuedData.getMonth() + 1).padStart(2, '0');
    let año: string = String(IssuedData.getFullYear());
    return `${dia}/${mes}/${año}`;
  }
  
  onKeyUp() {
    console.log(this.busqueda);
    if (this.busqueda.trim() !== '') {
      this.searchSubject.next(this.busqueda);
    } else {
      console.log('Prueba');
      this.limpiarBusqueda();
    }
  }
  

  buscarAmadeus(searchText: string = this.busqueda) {
    if (searchText.trim() !== '') {
      this.busquedaActiva = true;
      this.filtrarPorAgenciaActiva = false;
      console.log(searchText);
      this.amadeusService.buscarAmadeus(searchText).subscribe(
        data => {
          this.amadeusList = data;
        },
        (error: HttpErrorResponse) => {
          this.errorLoadingAmadeus = 'Error al cargar la lista de comisiones: ' + error.message;
          console.error('Error al obtener la lista de comisiones:', error.message);
        }
      );
    } else {
      this.cargarAgencias();
    }
  }

  cargarAgencias(): void {
    this.amadeusService.getAgencias().subscribe(
      (data: any[]) => {
        this.cadenas = data.map(item => item.AgencyName);
      },
      (error: any) => {
        console.error('Error al cargar las agencias', error);
      }
    );
  }

  filtrarPorAgencia(PnrId: number) {
    if (PnrId !== 0) {
      this.busquedaActiva = true;
      this.filtrarPorAgenciaActiva = true; 
      this.amadeusService.buscarAmadeusLista(PnrId.toString()).subscribe(
        data => {
          this.amadeusList = data;
        },
        (error: HttpErrorResponse) => {
          this.errorLoadingAmadeus = 'Error al cargar la lista de agencias: ' + error.message;
          console.error('Error al obtener la lista de agencias:', error.message);
        }
      );
    } else {
      console.log('El PnrId de búsqueda está vacío');
      Swal.fire(
        'Error',
        'No se ha seleccionado un PnrId válido para la búsqueda.',
        'error'
      );
    }
  }  

  regresarListado() {
    this.amadeusListFiltered = [];
  }

  limpiarBusqueda() {
    this.busqueda = '';
    this.amadeusService.getAmadeusList().subscribe(
      data => {
        this.amadeusList = data;
      },
      (error: HttpErrorResponse) => {
        this.errorLoadingAmadeus = 'Error al cargar la lista de Amadeus: ' + error.message;
        console.error('Error al obtener la lista de Amadeus:', error);
      }
    );
  }
  
  logout() {
    this.authService.logout();
  }

  estructura() {
    this.router.navigate(['/estructura']);
  }

  regresar() {
    this.busqueda = '';
    this.busquedaActiva = false;
    this.amadeusService.actualizarListaAmadeus();
  }
}
*/