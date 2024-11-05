import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ComisionesService } from '../../../services/comisiones.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as ExcelJS from 'exceljs';
import * as fs from 'file-saver';

@Component({
  selector: 'app-cobradas',
  templateUrl: './cobradas.component.html',
  styleUrls: ['./cobradas.component.scss']
})
export class CobradasComponent implements OnInit {
  usuarioDatos: any;
  isAdmin: boolean = false;
  currentRoute: string = '';
  SignIn: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
  rolUsuario: string = '';
  editMode = false;
  editItemIndex: number;
  mostrarCampoTextoVendedor: boolean = false;

  selectedFile: File | null = null;
  filteredComisionesList: any[] = [];
  isFiltering: boolean = false;

  id: number = 0;
  PnrId: number = 0;
  CheckInDate: string = '';
  CheckOutDate: string = '';
  ConfirmationCode: string = '';
  HotelChainName: string = '';
  HotelName: string = '';
  HotelPrice: number = 0;
  HotelPriceCurrency: string = '';
  NumberOfNights: number = 0;
  sumaParcial: number = 0;
  sumaTotal: number = 0;
  estado: string = '';
  diario: number = 0;
  filteredCount: number = 0;
  comisionForm: FormGroup;
  comision: any = {}; 

  errorLoadingComisiones: string = '';

  busqueda: string = '';
  busquedaActiva = false;
  filtrarPorAgenciaActiva: boolean = false;
  countCobradas: number = 0;
  countAnuladas: number = 0;
  countPendientes: number = 0;
  countRecibos: number = 0;
  showCreateReceiptButton: boolean = false;
  coCounter: string = '';
  coMaestro: string = '';
  coSolicitante: string = '';
  coTipMaestro: string = '';
  infoAdicional: string = '';
  comisionesList: any[] = [];
  tiposDocumento: string[] = [];
  deNomSolicitante: string = '';
  dePatSolicitante: string = '';
  de_img: string = '';
  selectedOrder: string = 'FechaDesc';
  sumatoriaFee: number = 0;
  sumatoriaComisionTotalReal: number = 0;
  sumatoriaGbaI: number = 0;
  sumatoriaGbaL: number = 0;
  tipdoc: string = '';
  serie: string = '';
  numero: string = '';
  sumatoriaTotalAmadeus: number = 0;
  sumatoriaRecibidos: number = 0;
  sumatoriaTotalBancos: number = 0;
  sumatoriaTotalDistribuidos: number = 0;
  sumatoriaDiferencia1: number = 0;
  sumatoriaDiferencia2: number = 0;
  mostrarComisionesDiferentes: boolean = false;
  comisionesListFiltrada: any[] = [];
  vendedores: string[] = [];
  vendedoresUnicos: string[] = [];
  vendedoresFiltrados: string[] = [];
  selectedVendedor: string = '';
  lacomision: number = 0;
  sortedComisionesList: any[] = [];
  sortColumn: string = '';
  sortDirection: string = 'asc'; 

  public fechaFacturacion: string;
  public selectedHotels: Set<number> = new Set<number>();

  private searchSubject: Subject<string> = new Subject();

  constructor(
    private http: HttpClient, 
    private authService: AuthService, 
    private router: Router, 
    private comisionesService: ComisionesService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.authService.usuarioDatos$.subscribe(datos => {
      this.usuarioDatos = datos;
      const co_role = this.usuarioDatos?.co_role?.trim();
      console.log('Datos del usuario:', this.usuarioDatos);
      this.isAdmin = co_role === 'ADMIN';
    });
    this.sortedComisionesList = [...this.filteredComisionesList];
    this.filtrarVendedores();
    this.cargarVendedores();
    this.calcularSumatorias();
    this.loadCounts();
    this.currentRoute = this.router.url;
    const userData = this.authService.getUserData();
    this.SignIn = userData.co_counter;
    this.estado = 'COB';

    this.comisionesService.getVendedoresDistintos(this.fechaFacturacion.substring(0, 10)).subscribe(data => {
      this.vendedoresUnicos = data;
    });

    this.comisionesService.comisiones$.subscribe(
      data => {
        this.comisionesList = data;
      },
      error => {
        console.error('Error al obtener la lista de comisiones:', error);
      }
    );
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.loadUserDataFromLocalStorage();
      this.authService.usuarioDatos$.subscribe(datosUsuario => {
        if (datosUsuario && datosUsuario['nombre']) {
          this.updateUserData(datosUsuario);
        }
      });
    }
    this.loadCounts();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.buscarComisiones(searchText);
    });
    this.cargarTodosLosRegistros();
    this.cargarTiposDocumento();
  }

  private loadUserDataFromLocalStorage(): void {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      this.updateUserData(userData);
    }
  }

  private updateUserData(userData: any): void {
    this.nombreUsuario = userData['nombre'];
    this.imagenUsuario = userData['fechaIngreso'];
    this.coCounter = userData['co_counter'];
    this.coMaestro = userData['co_maestro'];
    this.coSolicitante = userData['co_solicitante'];
    this.coTipMaestro = userData['co_tip_maestro'];
    this.deNomSolicitante = userData['de_nom_solicitante'];
    this.dePatSolicitante = userData['de_pat_solicitante'];
    this.de_img = userData['de_img'];
    this.infoAdicional = userData['info_adicional'];
  }

  /*loadComisionesCobradasList() {
    const estado = "COB";
    const fechaFacturacion = this.getFechaFacturacionFromUrl();
  
    if (this.SignIn) {
      this.comisionesService.getComisionesListCob(this.SignIn, estado, fechaFacturacion).subscribe(
        data => {
          this.comisionesList = data;
          console.log("Datos: ", this.comisionesList);
          if (this.comisionesList.length > 0) {
            this.updateComisionDetails(this.comisionesList[0]);
          }
        },
        (error: HttpErrorResponse) => {
          this.errorLoadingComisiones = 'Error al cargar la lista de comisiones: ' + error.message;
          console.error('Error al obtener la lista de comisiones:', error);
        }
      );
    }
  }*/
  
  getFechaFacturacionFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('fechaFacturacion');
  }
  

  private updateComisionDetails(elitem: any): void {
    this.id = elitem.id;
    this.PnrId = elitem.PnrId;
    const lacheckInDate = new Date(elitem.CheckInDate);
    const lacheckOutDate = new Date(elitem.CheckOutDate);
    this.CheckInDate = this.formatDateToString(lacheckInDate);
    this.CheckOutDate = this.formatDateToString(lacheckOutDate);
    this.ConfirmationCode = elitem.ConfirmationCode;
    this.HotelChainName = elitem.HotelChainName;
    this.HotelName = elitem.HotelName;
    this.HotelPrice = elitem.HotelPrice;
    this.HotelPriceCurrency = elitem.HotelPriceCurrency;
    this.NumberOfNights = this.calcularDiferenciaDias(elitem.CheckInDate, elitem.CheckOutDate);
    this.diario = parseFloat((elitem.RateplanTotalPrice / this.NumberOfNights).toFixed(2));
    this.sumaParcial = (this.NumberOfNights * this.diario);
    this.estado = elitem.Estado;
  }

  private formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}/${year}`;
  }

  calcularDiferenciaDias(fechaInicio: string, fechaFin: string): number {
    const fecha1 = new Date(fechaInicio);
    const fecha2 = new Date(fechaFin);
    const diferenciaTiempo = Math.abs(fecha2.getTime() - fecha1.getTime());
    const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
    return diferenciaDias;
  }

  calcularSumaParcial(NumberOfNights: number, hotelPrice: number): number {
    return NumberOfNights;
  }

  calcularComision(porComision: number, totalParcial: number): number{
    return (porComision * totalParcial)/100;
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

  onKeyUp() {
    this.searchSubject.next(this.busqueda);
  }

  buscarComisiones(searchText: string = this.busqueda, estado: string = this.estado, SignIn: string = this.SignIn) {
    if (searchText.trim() !== '') {
      this.busquedaActiva = true;
      this.filtrarPorAgenciaActiva = false;
      this.comisionesService.buscarComisionesFecha(searchText, estado, SignIn, this.fechaFacturacion).subscribe(
        data => {
          this.filteredComisionesList = data;
          this.reapplySelectedHotels();
          this.calcularSumatoriasFiltradas();
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

  calcularSumatoriasFiltradas() {
    this.sumatoriaFee = this.filteredComisionesList.reduce((total, comision) => total + comision.Fee, 0).toFixed(2);
    this.sumatoriaComisionTotalReal = this.filteredComisionesList.reduce((total, comision) => total + comision.ComisionTotalReal, 0).toFixed(2);
    this.sumatoriaGbaI = this.filteredComisionesList.reduce((total, comision) => total + comision.GbaI, 0).toFixed(2);
    this.sumatoriaGbaL = this.filteredComisionesList.reduce((total, comision) => total + comision.GbaL, 0).toFixed(2);
    this.sumatoriaTotalAmadeus = this.filteredComisionesList.reduce((total, comision) => total + comision.ComisionTotal, 0).toFixed(2);
    this.sumatoriaTotalBancos = this.filteredComisionesList.reduce((total, comision) => total + comision.RecBanco, 0).toFixed(2);
    this.sumatoriaTotalDistribuidos = this.filteredComisionesList.reduce((total, comision) => total + comision.ComisionDistribuir, 0).toFixed(2);
  }
  

  // Método para cargar todos los registros
  cargarTodosLosRegistros() {
    const urlParams = new URLSearchParams(window.location.search);
    this.fechaFacturacion = urlParams.get('fechaFacturacion') || ''; 
    if (!this.fechaFacturacion) {
      console.error('No se proporcionó fecha de facturación en la URL');
      return;
    }
    console.log("Fecha de Facturación: ",this.fechaFacturacion);
    this.comisionesService.obtenerTodosLosRegistros1(this.SignIn, this.estado, this.fechaFacturacion).subscribe(
      data => {
        this.comisionesList = data;
        this.filteredComisionesList = data; 
        this.reapplySelectedHotels();
        this.calcularSumatorias();
      },
      (error: HttpErrorResponse) => {
        this.errorLoadingComisiones = 'No se encontraron registros para esta fecha. Seleccione una fecha desde la página de Confirmación.';
        console.error('Error al cargar todos los registros:', error.message);
      }
    );
  }

  reapplySelectedHotels() {
    this.filteredComisionesList.forEach(hotel => {
      hotel.selected = this.selectedHotels.has(hotel.id); // Marca como seleccionado si está en la lista
    });
  }
  

  toggleFilter() {
    this.isFiltering = !this.isFiltering;
  
    if (this.isFiltering) {
      this.filteredComisionesList = this.comisionesList.filter(item => item.StatusComision === 'new');
    } else {
      this.filteredComisionesList = this.comisionesList;
    }
  
    this.filteredCount = this.filteredComisionesList.length;
  
    this.calcularSumatoriasFiltradas();
  }
  
  calcularSumatoriasFiltradas1() {
    this.sumatoriaFee = this.filteredComisionesList.reduce((total, comision) => total + comision.Fee, 0).toFixed(2);
    this.sumatoriaComisionTotalReal = this.filteredComisionesList.reduce((total, comision) => total + comision.ComisionTotalReal, 0).toFixed(2);
    this.sumatoriaGbaI = this.filteredComisionesList.reduce((total, comision) => total + comision.GbaI, 0).toFixed(2);
    this.sumatoriaGbaL = this.filteredComisionesList.reduce((total, comision) => total + comision.GbaL, 0).toFixed(2);
    this.sumatoriaTotalAmadeus = this.filteredComisionesList.reduce((total, comision) => total + comision.ComisionTotal, 0).toFixed(2);
    this.sumatoriaTotalBancos = this.filteredComisionesList.reduce((total, comision) => total + comision.RecBanco, 0).toFixed(2);
    this.sumatoriaTotalDistribuidos = this.filteredComisionesList.reduce((total, comision) => total + comision.ComisionDistribuir, 0).toFixed(2);
  }
  
  
  calcularSumatorias() {
    this.sumatoriaFee = this.comisionesList.reduce((total, comision) => total + comision.Fee, 0).toFixed(2);
    this.sumatoriaComisionTotalReal = this.comisionesList.reduce((total, comision) => total + comision.ComisionTotalReal, 0).toFixed(2);
    this.sumatoriaGbaI = this.comisionesList.reduce((total, comision) => total + comision.GbaI, 0).toFixed(2);
    this.sumatoriaGbaL = this.comisionesList.reduce((total, comision) => total + comision.GbaL, 0).toFixed(2);
    this.sumatoriaTotalAmadeus = this.comisionesList.reduce((total, comision) => total + comision.ComisionTotal, 0).toFixed(2);
    this.sumatoriaTotalBancos = this.comisionesList.reduce((total, comision) => total + comision.RecBanco, 0).toFixed(2);
    this.sumatoriaTotalDistribuidos = this.comisionesList.reduce((total, comision) => total + comision.ComisionDistribuir, 0).toFixed(2);
  }

  nuevacomision() {
    this.router.navigate(['/comisiones/nuevacomision']);
  }

  editarComision(index: number) {
    this.editMode = true;
    this.editItemIndex = index;
    this.router.navigate(['/comisiones/nuevacomision'], { state: { comision: this.comisionesList[index] } });
  }

  eliminarComision(id: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
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
            this.comisionesList = this.comisionesList.filter(comision => comision.id !== id);
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  
    const formattedDate = localDate.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  
    return formattedDate;
  }
  

  regresar() {
    this.busqueda = '';
    this.busquedaActiva = false;
    this.comisionesService.actualizarListaComisiones(this.SignIn);
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

  generarPago(id: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Va a generar su recibo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, generar recibo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.comisionesService.getComision(id).subscribe(
          (data) => {
            this.router.navigate(['/comisiones/cobradas/detalle'], { state: { comision: data } });
          },
          (error) => {
            console.error('Error al obtener los detalles de la comisión:', error);
            Swal.fire('Error', 'No se pudo obtener los detalles de la comisión. Intente nuevamente más tarde.', 'error');
          }
        );
      }
    });
  }

  loadCounts(): void {
    const urlParames = new URLSearchParams(window.location.search);
    this.fechaFacturacion = urlParames.get('fechaFacturacion') || ''; 
    const lafecha = this.fechaFacturacion.substring(0, 10);
    console.log("FECHA: ", lafecha);
    this.comisionesService.getCountCobradasFecha(this.SignIn, lafecha)
      .subscribe(count => this.countCobradas = count);

    this.comisionesService.getVendedoresDistintos(lafecha).subscribe(data => {
      this.vendedoresUnicos = data;
    });

    this.comisionesService.getCountAnuladas(this.SignIn)
      .subscribe(count => this.countAnuladas = count);

    this.comisionesService.getCountPendientes(this.SignIn)
      .subscribe(count => this.countPendientes = count);

    this.comisionesService.getCountRecibos(this.SignIn)
      .subscribe(count => this.countRecibos = count);
  }

  toggleAll(event: any): void {
    const checked = event.target.checked;
    this.filteredComisionesList.forEach(hotel => {
      hotel.selected = checked;
      if (checked) {
        this.selectedHotels.add(hotel.id); 
      } else {
        this.selectedHotels.delete(hotel.id); 
      }
      const sumaParcial = this.calcularSumaParcial(hotel.ComisionDistribuir, hotel.PorComision);
      this.toggleSumaTotal({ target: { checked } }, sumaParcial);
    });
    this.updateButtonVisibility();
  }

  toggleHotel(hotel: any, event: any): void {
    const checked = event.target.checked;
    hotel.selected = checked;
    if (checked) {
      this.selectedHotels.add(hotel.id);
    } else {
      this.selectedHotels.delete(hotel.id);
    }
    const sumaParcial = this.calcularSumaParcial(hotel.ComisionDistribuir, hotel.PorComision);
    this.toggleSumaTotal({ target: { checked } }, sumaParcial);
    this.updateButtonVisibility();
  }

  generarReciboMultiple(): void {
    const hotelesPagina = this.comisionesList;
    if (hotelesPagina.length === 0) {
      Swal.fire('Advertencia', 'No hay comisiones para generar el recibo.', 'warning');
      return;
    }
    console.log('Datos antes de navegar: ', {
      sumaTotal: this.sumaTotal,
      sumatoriaComisionTotalReal: this.sumatoriaComisionTotalReal,
      sumatoriaFee: this.sumatoriaFee,
      tipdoc: this.tipdoc,
      serie: this.serie,
      numero: this.numero
    });    
    this.router.navigate(['/comisiones/cobradas/detalle'], { 
      state: { 
        comision: hotelesPagina,
        sumaTotal: this.sumaTotal, 
        sumatoriaComisionTotalReal: this.sumatoriaComisionTotalReal,
        sumatoriaGbaI: this.sumatoriaGbaI,
        sumatoriaGbaL: this.sumatoriaGbaL,
        sumatoriaFee: this.sumatoriaFee,
        tipdoc: this.tipdoc,
        serie: this.serie,
        numero: this.numero
      } 
    });    
  }
    
  updateButtonVisibility(): void {
    this.showCreateReceiptButton = this.comisionesList.some(hotel => hotel.selected);
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
          NumberOfNights: this.calcularNumeroDias(item.CheckInDate, item.CheckOutDate),
          sumaParcial: this.calcularSumaParcial(this.calcularNumeroDias(item.CheckInDate, item.CheckOutDate), item.HotelPrice), 
          estado: item.Estado,
          RoomDescription: item.RoomDescription,
          porcentaje: this.extractPercentage(item.RoomDescription)
        }));
        this.calcularSumaTotal();
      },
      (error: HttpErrorResponse) => {
        this.errorLoadingComisiones = 'Error al cargar la lista de comisiones: ' + error.message;
        console.error('Error al obtener la lista de comisiones:', error);
      }
    );
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

  cargarTiposDocumento(): void {
    this.comisionesService.getTipoDocumento().subscribe(
      (data: any) => {
        console.log("Datos recibidos:", data);
        if (Array.isArray(data)) {
          this.tiposDocumento = data.map(item => item.de_tip_doc);
        } else {
          console.error('Error: La respuesta no es un array.');
        }
      },
      (error: any) => {
        console.error('Error al cargar los tipos de documento:', error);
      }
    );
  }

  cargarVendedores(): void {
    this.comisionesService.getVendedores().subscribe(
      (data: any[]) => {
        this.vendedores = data.map(item => item.de_maestro);
      },
      (error: any) => {
        console.error('Error al cargar los vendedores', error);
      }
    );
  }

  toggleCampoVendedor(): void {
    this.mostrarCampoTextoVendedor = !this.mostrarCampoTextoVendedor;
  }

  asignarVendedor(): void {
    console.log('Vendedor seleccionado o ingresado:', this.comision.de_vendedor);
  }

  getSelectedComisiones(): any[] {
    return this.filteredComisionesList.filter(hotel => hotel.selected);
  }

  actualizarVendedoresSeleccionados(): void {
    const comisionesSeleccionadas = this.getSelectedComisiones();
    const nuevoVendedor = this.comision.de_vendedor; 
    if (comisionesSeleccionadas.length === 0) {
      Swal.fire('Advertencia', 'No se ha seleccionado ninguna comisión', 'warning');
      return;
    }
    const idsComisiones = comisionesSeleccionadas.map(hotel => hotel.id); 
    console.log('Datos enviados al servicio:', { vendedor: nuevoVendedor, ids: idsComisiones }); 
    this.comisionesService.actualizarVendedor(idsComisiones, nuevoVendedor).subscribe(
      response => {
        console.log('Respuesta del servidor:', response);
        comisionesSeleccionadas.forEach(hotel => {
          hotel.de_vendedor = nuevoVendedor;
        });
        this.comisionesService.getVendedoresDistintos(this.fechaFacturacion).subscribe(data => {
          this.vendedoresUnicos = data;
        });
      },
      error => {
        console.error('Error al actualizar:', error);
        Swal.fire('Error', 'No se pudo actualizar las comisiones', 'error');
      }
    );
  }

  exportarExcel(): void {
    if (!this.selectedVendedor) {
      Swal.fire('Advertencia', 'Seleccione un vendedor', 'warning');
      return;
    }
    const fechaFacturacion1 = this.formatDate(this.fechaFacturacion);
    this.comisionesService.getVendedoresUnicos2(this.fechaFacturacion, this.selectedVendedor).subscribe(data => {
      const comisionesParaExcel = data;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Comisiones');
  
      worksheet.addRow([`REPORTE POR VENDEDOR: ${this.selectedVendedor}`]).font = { size: 16, bold: true };
      worksheet.addRow([]);
  
      const headers = ['FECHA FACT.', 'CHECK IN', 'CHECK OUT', 'AGENCIA', 'NOMBRE', 'APELLIDO', 'CIUDAD', 'HOTEL', 'CÓDIGO', 'AMADEUS', 'RECIBIDA', 'MONEDA', 'TARIFA', 'COMISION', 'RATEPLAN TOTAL PRICE', 'COMMISSION AMOUNT IN EURO', 'RECIBIDO EN BANCO', 'COMISION A DISTRIBUIR', 'TA SIGN'];
      const headerRow = worksheet.addRow(headers);

      // Aplicar color y centrado en los encabezados
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0000FF' }
        };
        cell.font = { color: { argb: 'FFFFFF' }, bold: true };

        // Centrando el encabezado 'AGENCIA' (columna 4)
        if (colNumber === 4) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });

      worksheet.columns.forEach((column, i) => {
        column.width = headers[i].length < 12 ? 12 : headers[i].length;
      });
  
      let sumatoriaRecBanco = 0;
      let totalComisionTotal = 0;
      let totalComisionOtraMoneda = 0;
      let sumatoriaDistribuir = 0;
      let sumatoriaCommissionAmountInEuro = 0;
      let sumatoriaRateplanTotalPrice = 0;
      let totalGbaI = 0;
      let totalGbaL = 0;
      let totalToFacturar = 0;
  
      // Usar la variable local `comisionesParaExcel` en lugar de `this.filteredComisionesList`
      comisionesParaExcel.forEach(comision => {
        const row = worksheet.addRow([
          this.formatDate(this.fechaFacturacion),
          this.formatDate(comision.CheckInDate),
          this.formatDate(comision.CheckOutDate),
          comision.AgencyName,
          comision.GuestFirstName,
          comision.GuestLastName,
          comision.CityName,
          comision.HotelName,
          comision.ConfirmationCode,
          comision.ComisionTotalReal,
          comision.ComisionOtraMoneda,
          comision.RateplanCurrencyCode,
          comision.TotalOtraMoneda,
          comision.CommissionAmountInEuro,
          comision.RateplanTotalPrice,
          comision.ComisionOtraMoneda,
          comision.RecBanco,
          comision.ComisionDistribuir,
          comision.SignIn
        ]);
  
        // Establecer bordes
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        // Aplicar centrado y color de fondo amarillo en 'AgencyName' (columna 4)
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };  // Centrando
        row.getCell(4).fill = {  // Fondo amarillo
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF00' }
        };
  
        totalComisionTotal += comision.ComisionTotal;
        totalComisionOtraMoneda += comision.ComisionOtraMoneda;
        sumatoriaRecBanco += comision.RecBanco;
        sumatoriaDistribuir += comision.ComisionDistribuir;
        sumatoriaRateplanTotalPrice += comision.RateplanTotalPrice;
        totalGbaI += comision.GbaI || 0;
        totalGbaL += comision.GbaL || 0;
      });
  
      // Add total row
      worksheet.addRow([]);
      const totalRow = worksheet.addRow([
        'Total:',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        totalComisionTotal.toFixed(2),
        totalComisionOtraMoneda.toFixed(2),
        '',
        '',
        '',
        '',
        '',
        sumatoriaRecBanco.toFixed(2),
        sumatoriaDistribuir.toFixed(2),
        '',
      ]);

      totalRow.font = { bold: true };
      totalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, `Reporte_${this.selectedVendedor}.xlsx`);
      });
    });
  }


  exportarExcelFiltrado(): void {
    const comisionesParaExcel = this.isFiltering ? this.filteredComisionesList : this.comisionesList;
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Comisiones');
  
    const titulo = this.isFiltering ? 'REPORTE NUEVOS REGISTROS' : 'REPORTE TODOS LOS REGISTROS';
    worksheet.addRow([`${titulo}: ${this.fechaFacturacion}`]).font = { size: 16, bold: true };
    worksheet.addRow([]);
  
    const headers = ['FECHA FACT.', 'CHECK IN', 'CHECK OUT', 'VENDEDOR', 'SIGN IN', 'AGENCIA', 'NOMBRE', 'APELLIDO', 'CIUDAD', 'HOTEL', 'CÓDIGO', 'AMADEUS', 'RECIBIDA', 'MONEDA', 'TARIFA', 'COMISION', 'RATEPLAN TOTAL PRICE', 'COMMISSION AMOUNT IN EURO', 'RECIBIDO EN BANCO', 'COMISION A DISTRIBUIR', 'TA SIGN'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0000FF' }
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
    });

    worksheet.columns.forEach((column, i) => {
      column.width = headers[i].length < 12 ? 12 : headers[i].length;
    });
  
    let sumatoriaRecBanco = 0;
    let totalComisionTotal = 0;
    let totalComisionOtraMoneda = 0;
    let sumatoriaTotalOtraMoneda = 0;
    let sumatoriaComisionDistribuir = 0;
    let sumatoriaRateplanTotalPrice = 0;
    let totalGbaI = 0;
    let totalGbaL = 0;
  
    comisionesParaExcel.forEach(comision => {
      const row = worksheet.addRow([
        this.formatDate(this.fechaFacturacion),
        this.formatDate(comision.CheckInDate),
        this.formatDate(comision.CheckOutDate),
        comision.de_vendedor,
        comision.SignIn,
        comision.AgencyName,
        comision.GuestFirstName,
        comision.GuestLastName,
        comision.CityName,
        comision.HotelName,
        comision.ConfirmationCode,
        comision.ComisionTotal,
        comision.ComisionTotalReal,
        comision.RateplanCurrencyCode,
        comision.TotalOtraMoneda,
        comision.CommissionAmountInEuro,
        comision.RateplanTotalPrice,
        comision.ComisionOtraMoneda,
        comision.RecBanco,
        comision.ComisionDistribuir,
        comision.SignIn
      ]);
  
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
  
      totalComisionTotal += comision.ComisionTotal;
      totalComisionOtraMoneda += comision.ComisionTotalReal;
      sumatoriaTotalOtraMoneda += comision.TotalOtraMoneda;
      sumatoriaRecBanco += comision.RecBanco;
      sumatoriaComisionDistribuir += comision.ComisionDistribuir;
      totalGbaI += comision.GbaI || 0;
      totalGbaL += comision.GbaL || 0;
    });
  
    worksheet.addRow([]);
    const totalRow = worksheet.addRow([
      'Total:',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalComisionTotal.toFixed(2),
      totalComisionOtraMoneda.toFixed(2),
      '',
      '',
      '',
      '',
      '',
      sumatoriaRecBanco.toFixed(2),
      sumatoriaComisionDistribuir.toFixed(2)
    ]);
  
    totalRow.font = { bold: true };
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, `Reporte_${this.fechaFacturacion}.xlsx`);
    });
  }
  
  filtrarVendedores() {
    this.vendedoresFiltrados = this.vendedoresUnicos.filter(v => v !== null && v !== '');
  }

  sort(column: string, direction: string) {
    this.sortColumn = column;
    this.sortDirection = direction;
    this.filteredComisionesList.sort((a, b) => {
      if (a[column] < b[column]) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (a[column] > b[column]) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
}