import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ComisionesService } from '../../services/comisiones.service';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NavigationExtras } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

interface Comision {
  ComisionTotal: number;
  ComisionTotalReal: number;
  ConfirmationCode: string;
  FechaFacturacion: string | null;
}

@Component({
  selector: 'app-comisiones',
  templateUrl: './comisiones.component.html',
  styleUrls: ['./comisiones.component.scss']
})
export class ComisionesComponent implements OnInit {
  SignIn: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
  rolUsuario: string = '';
  coCounter: string = '';
  coMaestro: string = '';
  coSolicitante: string = '';
  coTipMaestro: string = '';
  infoAdicional: string = '';
  deNomSolicitante: string = '';
  dePatSolicitante: string = '';
  de_img: string = '';
  cargando: boolean = false;
  comisionesListFiltrada: any[] = [];
  mostrarComisionesDiferentes: boolean = false;

  public fechaFacturacion: any;

  editMode = false;
  editItemIndex: number;

  comisionesList: any[] = [];
  id: number = 0;
  PnrId: number = 0;
  CheckInDate: string = '';
  CheckOutDate: string = '';
  ConfirmationCode: string = '';
  HotelChainName: string = '';
  HotelName: string = '';
  HotelPrice: number = 0;
  HotelPriceCurrency: string = '';
  numeroDias: number = 0;
  diferenciaComision: number = 0;
  sumaParcial: number = 0;
  sumaTotal: number = 0;
  estado: string = '';
  comisiones: any[] = [];
  loading: boolean = false;
  selectedComisiones: any[] = [];
  totalACobrar: number = 0;
  totalComisionReal: number = 0;
  totalRecibido: number = 0;
  totalFacturar: number = 0;
  totalFee: number = 0;
  totalGbaL: number = 0;
  totalGbaI: number = 0;
  diferencia: number = 0;
  totalDistribuirInput: number = 0;
  totalAmadeus: number = 0;
  sumatoriaAmadeus: number = 0;
  sumatoriaRecibidos: number = 0;
  sumatoriaBancos: number = 0;
  sumatoriaDistribuidos: number = 0;
  sumatoriaDiferencia1: number = 0;
  sumatoriaDiferencia2: number = 0;
  sumatoriaFee: number = 0;
  totalBanco: number = 0;
  diferenciaAmadeusBanco: number = 0;
  lacomision: number = 0;

  errorLoadingComisiones: string = '';

  busqueda: string = '';
  busquedaActiva = false;
  filtrarPorAgenciaActiva: boolean = false;

  countProceso: number = 0;
  countCobradas: number = 0;
  countAnuladas: number = 0;
  countPendientes: number = 0;
  countRecibos: number = 0;
  selectedOrder: string = 'FechaDesc';

  dataSource = new MatTableDataSource<any>(this.comisionesList);

  @ViewChild(MatPaginator) paginator: MatPaginator;

  private searchSubject: Subject<string> = new Subject();

  constructor(
    private authService: AuthService,
    private router: Router,
    private comisionesService: ComisionesService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    this.SignIn = userData.co_counter;
    this.estado = 'CON';
    console.log(this.SignIn);
    console.log(this.estado);
    this.cargarTodosLosRegistros();
    this.loadComisionesList();
    this.updateTotalRecibido();
    this.cargarComisiones();

    this.authService.usuarioDatos$.subscribe(datosUsuario => {
      if (datosUsuario && Object.keys(datosUsuario).length > 0) {
        this.setUserData(datosUsuario);
      } else {
        this.actualizarDatosLocalStorage();
      }
    });

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        this.setUserData(userData);
      }
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
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.buscarComisiones(searchText);
    });
    this.showPendingCommissionsNotification();
  }

  private setUserData(datosUsuario: any) {
    //this.SignIn = datosUsuario.id || '';
    this.nombreUsuario = datosUsuario.de_nom_solicitante || '';
    this.dePatSolicitante = datosUsuario.de_pat_solicitante || '';
    this.de_img = datosUsuario.de_img || '';
    this.coCounter = datosUsuario.co_counter || '';
    this.coMaestro = datosUsuario.co_maestro || '';
    this.coSolicitante = datosUsuario.co_solicitante || '';
    this.coTipMaestro = datosUsuario.co_tip_maestro || '';
    this.infoAdicional = datosUsuario.info_adicional || '';
  }

  private actualizarDatosLocalStorage() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      if (userData) {
        this.setUserData(userData);
      }
    }
  }

  loadComisionesList() {
    //this.mostrarToastCargando(); 
    this.loading = true;
    const estado = "CON";
    console.log("SIGN IN: ", this.SignIn);
    if (this.SignIn) {
      this.comisionesService.getComisionesList(this.SignIn, estado).subscribe(
        data => {
          this.comisionesList = data.map((item: any) => ({
            id: item.id,
            PnrId: item.PnrId,
            CheckInDate: item.CheckInDate,
            CheckOutDate: item.CheckOutDate,
            ConfirmationCode: item.ConfirmationCode,
            HotelChainName: item.HotelChainName,
            HotelName: item.HotelName,
            Name: item.Name,
            LastName: item.LastName,
            CityName: item.CityName,
            SignIn: item.SignIn,
            Fee: item.Fee,
            GbaI: item.GbaI,
            GbaL: item.GbaL,
            HotelPrice: item.HotelPrice,
            GuestFirstName: item.GuestFirstName,
            GuestLastName: item.GuestLastName,
            ComisionTotal: item.ComisionTotal,
            ComisionTotalReal: item.ComisionTotalReal,
            ComisionDistribuir: item.ComisionDistribuir,
            HotelPriceCurrency: item.HotelPriceCurrency,
            RateplanCurrencyCode: item.RateplanCurrencyCode,
            CommissionAmountInEuro: item.CommissionAmountInEuro,
            RateplanTotalPrice: item.RateplanTotalPrice,
            TotalOtraMoneda: item.TotalOtraMoneda,
            ComisionOtraMoneda: item.ComisionOtraMoneda,
            RecBanco: item.RecBanco,
            difComision: this.diferenciarComision(item.ComisionTotal, item.ComisionTotalReal),
            difComisionDistribuido: this.diferenciarComision(item.RecBanco, item.ComisionDistribuir),
            numeroDias: this.calcularNumeroDias(item.CheckInDate, item.CheckOutDate),
            sumaParcial: this.calcularSumaParcial(this.calcularNumeroDias(item.CheckInDate, item.CheckOutDate), item.HotelPrice), 
            estado: item.Estado,
            RoomDescription: item.RoomDescription,
            porcentaje: this.extractPercentage(item.RoomDescription)
          }));
          this.dataSource.data = this.comisionesList;
          this.calcularSumaTotal();
          this.sumatoriaComisionesAmadeus();
          this.sumatoriaComisionesRecibido();
          this.sumatoriaComisionesBanco();
          this.sumatoriaComisionesDistribuir();
          this.sumatoriaTotalFee();
          this.diferenciaAmadeusRecibido();
          this.diferenciaBancoDistribuido();
          this.loading = false;
          this.cerrarToast(); 
        },
        (error: HttpErrorResponse) => {
          this.errorLoadingComisiones = 'Error al cargar la lista de comisiones: ' + error.message;
          console.error('Error al obtener la lista de comisiones:', error);
          this.loading = false;
          this.cerrarToast(); 
        }
      );
    }
    this.totalDistribuirInput = this.comisionesList.reduce((total, comision) => total + comision.ComisionDistribuir, 0);
  }

  extractPercentage(description: string): number | null {
    const regex = /\b(\d+)\s*(?:%|percent)?\s*(?:COMMISION|commision)\b|\b(?:COMMISION|commission)\s*(\d+)\s*(?:%|percent)?\b/gi;
    const match = regex.exec(description);
    if (match) {
      const percentage = match[1] || match[2];
      return parseInt(percentage, 10); 
    } else {
      return null;
    }
  }

  calcularSumaTotal(): void {
    this.sumaTotal = this.comisionesList.reduce((total, comision) => total + comision.sumaParcial, 0);
  }

  calcularSumaParcial(numeroDias: number, hotelPrice: number): number {
    return numeroDias * hotelPrice;
  }

  calcularDiferenciaDias(fechaInicio: string, fechaFin: string): number {
    const fecha1 = new Date(fechaInicio);
    const fecha2 = new Date(fechaFin);
    const diferenciaTiempo = Math.abs(fecha2.getTime() - fecha1.getTime());
    const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
    return diferenciaDias;
  }

  calcularNumeroDias(checkInDate: string, checkOutDate: string): number {
    const fechaInicio = new Date(checkInDate);
    const fechaFin = new Date(checkOutDate);
    const diferencia = fechaFin.getTime() - fechaInicio.getTime();
    return Math.abs(diferencia / (1000 * 3600 * 24));
  }

  toggleSumaTotal(event: any, sumaParcial: number): void {
    if (event.target.checked) {
      this.sumaTotal += sumaParcial;
    } else {
      this.sumaTotal -= sumaParcial;
    }
  }

  generarPDF(id: number) {
    const token = localStorage.getItem('token');
    console.log(token);
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Va a generar su recibo. Si desea cambiarlo contáctese con el administrador.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.comisionesService.eliminarComision(id).subscribe(
          () => {
            this.comisionesList = this.comisionesList.filter(comision => comision.Id !== id);
            Swal.fire(
              '¡Eliminado!',
              'El registro ha sido eliminado correctamente',
              'success'
            );
          },
          (error) => {
            console.error('Error al eliminar el registro:', error);
            Swal.fire(
              'Error',
              'Hubo un problema al intentar eliminar el registro',
              'error'
            );
          }
        );
      }
    });
  }

  onKeyUp() {
    this.searchSubject.next(this.busqueda);
  }

  buscarComisiones(searchText: string = this.busqueda, estado: string = this.estado, SignIn: string = this.SignIn) {
    if (searchText.trim() !== '') {
      this.busquedaActiva = true;
      this.filtrarPorAgenciaActiva = false;
      this.comisionesService.buscarComisiones(searchText, estado, SignIn).subscribe(
        data => {
          this.comisionesList = data;
        },
        (error: HttpErrorResponse) => {
          this.errorLoadingComisiones = 'Error al cargar la lista de comisiones: ' + error.message;
          console.error('Error al obtener la lista de comisiones:', error.message);
        }
      );
    } else {
      this.cargarTodosLosRegistros();
    }
  }

  cargarTodosLosRegistros() {
    const SignIn = this.SignIn;
    this.comisionesService.obtenerTodosLosRegistros(SignIn, this.estado).subscribe(
      data => {
        this.comisionesList = data;
        console.log("REGISTROS: ", this.comisionesList);

        if (this.comisionesList.length > 0) {
          this.fechaFacturacion = this.comisionesList[0].FechaFacturacion;
          console.log("Fecha: ", this.fechaFacturacion);
        } else {
          this.fechaFacturacion = null; 
        }

        this.comisionesListFiltrada = this.comisionesList.filter(comision => {
          return comision.FechaFacturacion != null;
        });
      },
      (error: HttpErrorResponse) => {
        this.errorLoadingComisiones = 'Error al cargar todos los registros: ' + error.message;
        console.error('Error al cargar todos los registros:', error.message);
      }
    );
  }

  otroMetodo() {
    console.log('Fecha de facturación:', this.fechaFacturacion);
  }

  nuevacomision() {
    const navigationExtras: NavigationExtras = {
      state: {
        coMaestro: this.coMaestro,
        coCounter: this.coCounter
      }
    };
    console.log("NUEVA: ", navigationExtras);
    this.router.navigate(['/comisiones/nuevacomision'], navigationExtras);
  }

  editarComision(index: number) {
    this.editMode = true;
    this.editItemIndex = index;
    const navigationExtras: NavigationExtras = {
      state: {
        comision: this.comisionesList[index],
        coMaestro: this.coMaestro,
        coCounter: this.coCounter
      }
    };
    console.log('DATOS: ', navigationExtras);
    this.router.navigate(['/comisiones/nuevacomision'], navigationExtras);
  }

  eliminarComision(id: number) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Una vez eliminado, no podrás recuperar este registro',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminarlo',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            this.comisionesService.eliminarComision(id).subscribe(
                () => {
                    this.comisionesList = this.comisionesList.filter(comision => comision.Id !== id);
                    Swal.fire(
                        '¡Eliminado!',
                        'El registro ha sido eliminado correctamente',
                        'success'
                    ).then(() => {
                        this.loadComisionesList();
                        this.busqueda = '';
                    });
                },
                (error) => {
                    console.error('Error al eliminar el registro:', error);
                    Swal.fire(
                        'Error',
                        'Hubo un problema al intentar eliminar el registro',
                        'error'
                    ).then(() => {
                        this.router.navigate(['/comisiones']);
                        this.busqueda = '';
                    });
                }
            );
        }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
  
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
  
    return `${day}/${month}/${year}`;
  }
  

  regresar() {
    this.busqueda = '';
    this.busquedaActiva = false;
    this.comisionesService.actualizarListaComisiones(this.SignIn);
    this.loadComisionesList();
  }

  cobradas(): void {
    this.router.navigate(['/comisiones/cobradas']);
  }

  pendientes(): void {
    this.router.navigate(['/comisiones/pendientes']);
  }

  recibos(): void {
    this.router.navigate(['/extra/recibos']);
  }

  anuladas(): void {
    this.router.navigate(['/comisiones/anuladas']);
  }

  loadCounts(): void {
    this.comisionesService.getCountProceso(this.SignIn)
      .subscribe(count => this.countProceso = count);
    this.comisionesService.getCountCobradas(this.SignIn)
      .subscribe(count => this.countCobradas = count);
    this.comisionesService.getCountAnuladas(this.SignIn)
      .subscribe(count => this.countAnuladas = count);
      this.comisionesService.getCountPendientes(this.SignIn)
      .subscribe(count => {
        this.countPendientes = count;
        this.showPendingCommissionsNotification();
      });
    this.comisionesService.getCountRecibos(this.SignIn)
      .subscribe(count => this.countRecibos = count);
  }

  ordenarComisiones() {
    this.comisionesService.getComisionesListOrdenadas(this.SignIn, this.estado, this.selectedOrder).subscribe(
      data => {
        this.comisionesList = data.map((item: any) => ({
          id: item.id,
          PnrId: item.PnrId,
          CheckInDate: item.CheckInDate,
          CheckOutDate: item.CheckOutDate,
          ConfirmationCode: item.ConfirmationCode,
          HotelChainName: item.HotelChainName,
          HotelName: item.HotelName,
          HotelPrice: item.HotelPrice,
          HotelPriceCurrency: item.HotelPriceCurrency,
          numeroDias: this.calcularNumeroDias(item.CheckInDate, item.CheckOutDate),
          sumaParcial: this.calcularSumaParcial(this.calcularNumeroDias(item.CheckInDate, item.CheckOutDate), item.HotelPrice), 
          estado: item.Estado,
          RoomDescription: item.RoomDescription,
          porcentaje: this.extractPercentage(item.RoomDescription),
          GuestFirstName: item.GuestFirstName,
          GuestLastName: item.GuestLastName,
          ComisionTotal: item.ComisionTotal,
          ComisionTotalReal: item.ComisionTotalReal,
          ComisionDistribuir: item.ComisionDistribuir
        }));
        this.calcularSumaTotal();
      },
      (error: HttpErrorResponse) => {
        this.errorLoadingComisiones = 'Error al cargar la lista de comisiones: ' + error.message;
        console.error('Error al obtener la lista de comisiones:', error);
      }
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  cargarDatos(): void {
    console.log('Cargar Datos');
  }

  showPendingCommissionsNotification() {
    const notificationShown = sessionStorage.getItem('notificationShown');
    if (!notificationShown && this.countPendientes > 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: `Tienes ${this.countPendientes} documentos pendientes`,
        showConfirmButton: false,
        timer: 5000
      });
      sessionStorage.setItem('notificationShown', 'true');
    }
  }

  mostrarToastCargando() {
    this.cargando = true;
    Swal.fire({
      title: 'Cargando registros...',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  cerrarToast() {
    this.cargando = false;
    const toastElement = document.querySelector('.swal2-container');
    if (toastElement) {
      toastElement.classList.add('swal2-toast-custom-hide');
      setTimeout(() => {
        Swal.close();
      }, 500);
    }
  }

  toggleVerComisionesDiferentes() {
    console.log("Fecha Facturación botón: ", this.fechaFacturacion);
    this.mostrarComisionesDiferentes = !this.mostrarComisionesDiferentes;
    console.log("Original: ", this.comisionesList);

    if (this.mostrarComisionesDiferentes) {
        const clonedComisionesList: Comision[] = JSON.parse(JSON.stringify(this.comisionesList));

        this.comisionesListFiltrada = clonedComisionesList.filter((comision: Comision) => {
            if (comision.ComisionTotal !== comision.ComisionTotalReal) {
                const originalComision = this.comisionesList.find(c => c.ConfirmationCode === comision.ConfirmationCode);
                
                if (originalComision && originalComision.FechaFacturacion) {
                    //console.log("Original FechaFacturacion encontrada: ", originalComision.FechaFacturacion);
                    comision.FechaFacturacion = originalComision.FechaFacturacion;
                } else {
                    //console.warn("No se encontró FechaFacturacion en el objeto original:", originalComision);
                }
                return true;
            }
            return false;
        });

        console.log("Diferentes (Filtradas): ", this.comisionesListFiltrada);
    } else {
        this.comisionesListFiltrada = JSON.parse(JSON.stringify(this.comisionesList));
        console.log("Todo: ", this.comisionesListFiltrada);
    }

    if (this.comisionesListFiltrada.length > 0) {
        const primeraComision = this.fechaFacturacion;
        console.log("Fecha Facturación Primera: ", primeraComision);
        if (primeraComision) {
            console.log("Fecha de Facturación del primer elemento filtrado: ", primeraComision);
        } else {
            console.log("El primer elemento filtrado no tiene FechaFacturacion");
        }
    } else {
        console.log("La lista filtrada está vacía");
    }
  }


  resetCalculations(): void {
    this.totalComisionReal = 0;
    this.totalGbaI = 0;
    this.totalFee = 0;
    this.totalGbaL = 0;
    this.totalFacturar = 0;
    this.totalAmadeus = 0;
    this.totalBanco = 0;
    this.diferenciaAmadeusBanco = 0;
  }

  toggleAll(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement?.checked ?? false;

    if (this.mostrarComisionesDiferentes) {
        this.comisionesListFiltrada.forEach(hotel => hotel.selected = isChecked);
    } else {
        this.comisionesList.forEach(hotel => hotel.selected = isChecked);
    }

    this.selectedComisiones = (this.mostrarComisionesDiferentes ? this.comisionesListFiltrada : this.comisionesList)
        .filter(comision => comision.selected);

    if (this.selectedComisiones.length > 0) {
        this.updateTotals();
    } else {
        this.resetCalculations();
    }
  }

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (target) {
        this.selectedComisiones = (this.mostrarComisionesDiferentes ? this.comisionesListFiltrada : this.comisionesList)
            .filter(comision => comision.selected);

        if (this.selectedComisiones.length > 0) {
            this.updateTotals();
        } else {
            this.resetCalculations();
        }
    }
  }


  updateTotals(): void {
    this.updateTotal();
    this.updateFee();
    this.updateGbaL();
    this.updateTotalComision();
    this.updateTotalRecibido();
    this.updateTotalFacturar();
    this.updateGbaI();
    this.updateDifference();
    this.updateAmadeus();
    this.updateTotalBanco();
    this.updateDiferenciaAmadeusBanco();
  }

  updateSelectedComisiones() {
    this.selectedComisiones = this.comisionesList.filter(comision => comision.selected);
  }

  cobrarComisiones() {
    Swal.fire({
      title: 'Confirme que se van a cobrar estas comisiones',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const comisionesIds = this.selectedComisiones.map(comision => comision.id);
        const fechaFacturacion = this.selectedComisiones.length > 0 ? this.selectedComisiones[0].FechaFacturacion : null;
        const url = 'http://localhost:3000/comisiones/cobrar';
  
        this.http.post(url, { ids: comisionesIds, fechaFacturacion: fechaFacturacion })
          .subscribe(() => {
            Swal.fire('¡Cobranza!', 'Las comisiones han iniciado el proceso de cobro.', 'success').then(() => {
              // Navegación con Angular Router
              this.router.navigate(['/comisiones/confirmadas'], {
                queryParams: { fechaFacturacion: fechaFacturacion, estado: 'COB' }
              });
            });
          }, () => {
            Swal.fire('Error', 'Hubo un problema al cobrar las comisiones.', 'error');
          });
      }
    });
  }
  
  
  

  diferenciarComision(val1: number, val2: number) {
    return val1 - val2;
  }

  formatDifComision(difComision: number | null | undefined): string {
    if (difComision == null) {
      return `<span style="color:black;">-</span>`; // O cualquier texto para manejar valores indefinidos o nulos
    }
    const formatted = difComision.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (difComision > 0) {
      return `<span style="color:red;font-weight:700;">${formatted}</span>`;
    } else if (difComision < 0) {
      return `<span style="color:green;font-weight:700;">${formatted}</span>`;
    } else {
      return `<span style="color:black;">${formatted}</span>`;
    }
  }
  
  formatDifComisionDistribuido(difComisionDistribuido: number | null | undefined): string {
    if (difComisionDistribuido == null) {
      return `<span style="color:black;">-</span>`;
    }
    const formatted = difComisionDistribuido.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (difComisionDistribuido > 0) {
      return `<span style="color:red;font-weight:700;">${formatted}</span>`;
    } else if (difComisionDistribuido < 0) {
      return `<span style="color:green;font-weight:700;">${formatted}</span>`;
    } else {
      return `<span style="color:black;">${formatted}</span>`;
    }
  }
  

  updateTotal() {
    this.totalACobrar = this.selectedComisiones.reduce((total, comision) => total + comision.ComisionDistribuir, 0);
    this.totalACobrar = parseFloat(this.totalACobrar.toFixed(2));
    this.updateDifference();
  }

  updateAmadeus() {
    this.totalAmadeus = this.selectedComisiones.reduce((total, comision) => {
      const totalAmadeus = comision.ComisionTotal || 0;
      return total + totalAmadeus;
    }, 0);
  }
  
  actualizarDistribucion(): void {
    const totalDistribuirActual = this.selectedComisiones.reduce((total, comision) => total + comision.ComisionDistribuir, 0);
    if (totalDistribuirActual === 0) {
      return;
    }
    const factor = this.totalDistribuirInput / totalDistribuirActual;
    this.selectedComisiones.forEach(comision => {
      comision.ComisionDistribuir = comision.ComisionDistribuir * factor;
    });    
    this.updateTotal();
    this.totalACobrar = parseFloat(this.totalACobrar.toFixed(2)); // Forzar dos decimales
  }

  updateFee() {
    this.totalFee = this.selectedComisiones.reduce((total, comision) => {
      const totalFee = comision.Fee || 0;
      return total + totalFee;
    }, 0);
  }

  updateGbaL() {
    this.totalGbaL = this.selectedComisiones.reduce((total, comision) => {
      const totalGbaL = comision.GbaL || 0;
      return total + totalGbaL;
    }, 0);
  }

  updateTotalComision() {
    this.totalComisionReal = this.selectedComisiones.reduce((total, comision) => {
      const totalComisionReal = comision.ComisionTotalReal || 0;
      return total + totalComisionReal;
    }, 0);
  }

  updateTotalRecibido() {
    this.totalRecibido = this.selectedComisiones.reduce((total, comision) => {
      const comisionTotalReal = comision.ComisionTotalReal || 0;
      const fee = comision.Fee || 0;
      const gbaI = comision.GbaI || 0;
      return total + (comisionTotalReal - fee - gbaI);
    }, 0);
  }

  updateTotalFacturar() {
    this.totalFacturar = this.selectedComisiones.reduce((total, comision) => {
      const comisionFacturar = comision.ComisionTotalReal || 0;
      const gbaI = comision.GbaI || 0;
      return total + (comisionFacturar - gbaI);
    }, 0);
  }

  updateGbaI() {
    this.totalGbaI = this.selectedComisiones.reduce((total, comision) => {
      const gbaI = comision.GbaI || 0;
      return total + gbaI;
    }, 0);
  }

  updateTotalBanco() {
    this.totalBanco = this.selectedComisiones.reduce((total, comision) => {
      const totalBanco = comision.RecBanco || 0;
      return total + totalBanco;
    }, 0);
  }
  
  updateDifference() {
    this.diferencia = this.totalRecibido - this.totalACobrar;
  }

  updateDiferenciaAmadeusBanco() {
    this.diferenciaAmadeusBanco = this.totalAmadeus - this.totalComisionReal;
  }

  sumatoriaComisionesAmadeus() {
      const listaActual = this.mostrarComisionesDiferentes ? this.comisionesListFiltrada : this.comisionesList;
      this.sumatoriaAmadeus = listaActual.reduce((total, comision) => total + comision.ComisionTotal, 0).toFixed(2);
  }

  sumatoriaComisionesRecibido() {
      const listaActual = this.mostrarComisionesDiferentes ? this.comisionesListFiltrada : this.comisionesList;
      this.sumatoriaRecibidos = listaActual.reduce((total, comision) => total + comision.ComisionTotalReal, 0).toFixed(2);
  }

  sumatoriaTotalFee() {
      const listaActual = this.mostrarComisionesDiferentes ? this.comisionesListFiltrada : this.comisionesList;
      this.sumatoriaFee = listaActual.reduce((total, comision) => total + comision.Fee, 0).toFixed(2);
  }

  sumatoriaComisionesBanco() {
      const listaActual = this.mostrarComisionesDiferentes ? this.comisionesListFiltrada : this.comisionesList;
      this.sumatoriaBancos = listaActual.reduce((total, comision) => total + comision.RecBanco, 0).toFixed(2);
  }

  sumatoriaComisionesDistribuir() {
      const listaActual = this.mostrarComisionesDiferentes ? this.comisionesListFiltrada : this.comisionesList;
      this.sumatoriaDistribuidos = listaActual.reduce((total, comision) => total + comision.ComisionDistribuir, 0).toFixed(2);
  }

  diferenciaAmadeusRecibido() {
    this.sumatoriaDiferencia1 = this.sumatoriaAmadeus - this.sumatoriaRecibidos;
  }

  diferenciaBancoDistribuido() {
    this.sumatoriaDiferencia2 = this.sumatoriaBancos - this.sumatoriaDistribuidos;
  }

  cargarComisiones() {
    this.comisionesListFiltrada = this.comisionesList;
  }

  exportarDiferenciasAExcel() {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Diferencias');
    const fechaFact = this.formatDate(this.fechaFacturacion);
    console.log("Antes de convertir: ", this.fechaFacturacion);
    console.log("Valor a Exportar: ", fechaFact);

    const fechaFacturacion1 = this.comisionesListFiltrada.length > 0
      ? this.formatDate(this.fechaFacturacion)
      : 'Fecha Desconocida';

    worksheet.mergeCells('A1:O1');
    const titleCell = worksheet.getCell('A1');
    
    titleCell.value = `REPORTE DIFERENCIAS AMADEUS vs BANCO - ${fechaFact}`;
    
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' },
    };

    const headers = ['FECHA FACT.', 'CHECK IN', 'CHECK OUT', 'NOMBRE', 'APELLIDO', 'CIUDAD', 'HOTEL', 'CÓDIGO', 'AMADEUS', 'RECIBIDA', 'MONEDA', 'TARIFA', 'COMISION', 'TARIFA AMADEUS', 'COMISION AMADEUS'];
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0070C0' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    this.comisionesListFiltrada.forEach(comision => {
      this.lacomision = comision.TotalOtraMoneda === '' || comision.TotalOtraMoneda === null || comision.TotalOtraMoneda === 0
        ? comision.ComisionTotal
        : comision.TotalOtraMoneda;

      const row = worksheet.addRow([
        this.formatDate(fechaFacturacion1),
        this.formatDate(comision.CheckInDate),
        this.formatDate(comision.CheckOutDate),
        comision.GuestFirstName,
        comision.GuestLastName,
        comision.CityName,
        comision.HotelName,
        comision.ConfirmationCode,
        comision.ComisionTotal,
        comision.ComisionTotalReal,
        comision.RateplanCurrencyCode,
        this.lacomision,
        comision.CommissionAmountInEuro,
        comision.RateplanTotalPrice,
        comision.ComisionOtraMoneda,
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    const totalRow = worksheet.addRow([
      '', '', '', '', '', '', '', 'TOTAL:',
      this.comisionesListFiltrada.reduce((sum, comision) => sum + comision.ComisionTotal, 0),
      this.comisionesListFiltrada.reduce((sum, comision) => sum + comision.ComisionTotalReal, 0),
      '', '', '', '', '', '',
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    worksheet.columns = [
      { key: 'A', width: 12 },
      { key: 'B', width: 12 },
      { key: 'C', width: 12 },
      { key: 'D', width: 25 },
      { key: 'E', width: 30 },
      { key: 'F', width: 15 },
      { key: 'G', width: 30 },
      { key: 'H', width: 15 },
      { key: 'I', width: 15 },
      { key: 'J', width: 15 },
      { key: 'K', width: 10 },
      { key: 'L', width: 12 },
      { key: 'M', width: 12 },
      { key: 'N', width: 12 },
      { key: 'O', width: 12 },
    ];

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte_Diferencias_Amadeus_Banco.xlsx');
    });
  }


  onSelectComision(hotel: any) {
    if (hotel.selected) {
      this.selectedComisiones.push(hotel);
    } else {
      this.selectedComisiones = this.selectedComisiones.filter(c => c.ConfirmationCode !== hotel.ConfirmationCode);
    }
    console.log('Comisiones seleccionadas:', this.selectedComisiones);
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

}