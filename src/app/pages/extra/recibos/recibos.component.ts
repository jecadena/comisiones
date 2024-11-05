import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ComisionesService } from '../../../services/comisiones.service';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-recibos',
  templateUrl: './recibos.component.html'
})
export class RecibosComponent implements OnInit {

  SignIn: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
  rolUsuario: string = '';
  editMode = false;
  editItemIndex: number;

  comisionesListCobradas: any[] = [];
  Id: number = 0;
  PnrId: number = 0;
  FechaCreacion: string = '';
  FacSerie: string = '';
  FacNumero: string = '';
  RecNumero: string = '';
  idHotel: string = '';
  PorComision: number = 0;
  ComisionTotal: string = '';
  FormaPago: string = '';
  Estado: string = '';
  Banco: string = '';
  Cuenta: string = '';
  Moneda: string = '';
  Monto: string = '';
  TipoCambio: string = '';
  Observaciones: string = '';
  estado: string = '';
  numero: string = '';
  descripcion: string = '';

  amadeusData: string = '';
  hotelesAmadeusData: string = '';
  formaPagoData: string = '';
  bancoData: string = '';
  cuentaData: string = '';
  nombre: string = '';

  errorLoadingComisiones: string = '';

  busqueda: string = '';
  busquedaActiva = false;
  filtrarPorAgenciaActiva: boolean = false;
  countCobradas: number = 0;
  countAnuladas: number = 0;
  countPendientes: number = 0;
  countRecibos: number = 0;
  showCreateReceiptButton: boolean = false;

  private searchSubject: Subject<string> = new Subject();

  constructor(private authService: AuthService, private router: Router, private comisionesService: ComisionesService) { }

  ngOnInit(): void {
    this.comisionesService.comisiones$.subscribe(
      data => {
        this.comisionesListCobradas = data;
      },
      error => {
        console.error('Error al obtener la lista de comisiones:', error);
      }
    );

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']); 
    } else {
      this.authService.usuarioDatos$.subscribe(datosUsuario => {
        if (datosUsuario && datosUsuario['nombre']) {
          this.SignIn = datosUsuario['SignIn'];
          this.nombreUsuario = datosUsuario['nombre'];
          this.imagenUsuario = datosUsuario['fechaIngreso'];
          this.loadComisionesCobradasList();
        }
      });
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        this.SignIn = userData.id;
        this.nombreUsuario = userData.nombre;
        this.imagenUsuario = userData.fechaIngreso;
        this.loadComisionesCobradasList();
      }
    }
    this.loadCounts();
    this.searchSubject.pipe(
      debounceTime(300), 
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.buscarComisiones(searchText);
    });
    this.cargarTodosLosRegistros();
  }

  loadComisionesCobradasList() {
    const estado = "REC";
    if (this.SignIn) {
        this.comisionesService.getComisionesListRecibos(this.SignIn).subscribe(
            data => {
                this.comisionesListCobradas = data;
                if (this.comisionesListCobradas.length > 0) {
                    const elitem = this.comisionesListCobradas[0];
                    this.Id = elitem.Id;
                    this.PnrId = elitem.PnrId;
                    const lacheckInDate = new Date(elitem.FechaCreacion);

                    const checkInYear = lacheckInDate.getFullYear();
                    const checkInMonth = (lacheckInDate.getMonth() + 1).toString().padStart(2, '0');
                    const checkInDay = lacheckInDate.getDate().toString().padStart(2, '0');

                    this.FechaCreacion = `${checkInMonth}/${checkInDay}/${checkInYear}`;

                    this.FacSerie = elitem.FacSerie;
                    this.FacNumero = elitem.FacNumero;
                    this.RecNumero = elitem.RecNumero;
                    this.nombre = elitem.nombre;
                    this.PorComision = elitem.PorComision;
                    this.ComisionTotal = elitem.ComisionTotal;
                    this.FormaPago = elitem.forpago;
                    this.Estado = elitem.Estado;
                    this.Banco = elitem.bancos;
                    this.Cuenta = elitem.cuenta;
                    this.Moneda = elitem.Moneda;
                    this.Monto = elitem.Monto;
                    this.TipoCambio = elitem.TipoCambio;
                    this.Observaciones = elitem.Observaciones;

                    this.amadeusData = elitem.amadeus;
                    this.hotelesAmadeusData = elitem.hotelesamadeus;
                    this.formaPagoData = elitem.forpago;
                    this.bancoData = elitem.bancos;
                    this.cuentaData = elitem.cuenta;
                    this.numero = elitem.numero;
                    this.descripcion = elitem.descripcion;
                    console.log(this.idHotel);
                }
            },
            (error: HttpErrorResponse) => {
                this.errorLoadingComisiones = 'Error al cargar la lista de comisiones: ' + error.message;
                console.error('Error al obtener la lista de comisiones:', error);
            }
        );
    }
  }

  calcularDiferenciaDias(fechaInicio: string, fechaFin: string): number {
    const fecha1 = new Date(fechaInicio);
    const fecha2 = new Date(fechaFin);
    const diferenciaTiempo = Math.abs(fecha2.getTime() - fecha1.getTime());
    const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
    return diferenciaDias;
  }
  calcularSumaParcial(numeroDias: number, hotelPrice: number): number {
    return numeroDias * hotelPrice;
  }

  calcularNumeroDias(checkInDate: string, checkOutDate: string): number {
    const fechaInicio = new Date(checkInDate);
    const fechaFin = new Date(checkOutDate);
    const diferencia = fechaFin.getTime() - fechaInicio.getTime();
    return Math.abs(diferencia / (1000 * 3600 * 24));
  }

  onKeyUp() {
    this.searchSubject.next(this.busqueda);
  }

  buscarComisiones(searchText: string = this.busqueda, estado: string = this.estado, SignIn: string = this.SignIn) {
    if (searchText.trim() !== '') {
      this.busquedaActiva = true;
      this.filtrarPorAgenciaActiva = false;
      console.log(searchText);
      this.comisionesService.buscarComisiones(searchText, estado, SignIn).subscribe(
        data => {
          this.comisionesListCobradas = data;
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
    const estado = this.estado;
    console.log(estado);
    this.comisionesService.obtenerTodosLosRegistros(SignIn, estado).subscribe(
      data => {
        this.comisionesListCobradas = data;
      },
      (error: HttpErrorResponse) => {
        this.errorLoadingComisiones = 'Error al cargar todos los registros: ' + error.message;
        console.error('Error al cargar todos los registros:', error.message);
      }
    );
  }
  nuevacomision() {
    this.router.navigate(['/comisiones/nuevacomision']);
  }
  editarComision(index: number) {
    this.editMode = true;
    this.editItemIndex = index;
    this.router.navigate(['/comisiones/nuevacomision'], { state: { comision: this.comisionesListCobradas[index] } });
  }
  eliminarComision(id: number) {
    const token = localStorage.getItem('token');
    console.log(token);
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
            this.comisionesListCobradas = this.comisionesListCobradas.filter(comision => comision.Id !== id);
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
    const formattedDate = date.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
  anuladas(): void {
    this.router.navigate(['/comisiones/anuladas']);
  }

  generarPago(id: number) {
    const token = localStorage.getItem('token');
    console.log(token);
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
            console.log('Comisión obtenida:', data);
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
    this.comisionesService.getCountCobradas(this.SignIn)
      .subscribe(count => this.countCobradas = count);
  
    this.comisionesService.getCountAnuladas(this.SignIn)
      .subscribe(count => this.countAnuladas = count);
  
    this.comisionesService.getCountPendientes(this.SignIn)
      .subscribe(count => this.countPendientes = count);

      this.comisionesService.getCountRecibos(this.SignIn)
      .subscribe(count => this.countRecibos = count);
  }

  generarReciboMultiple(): void {
    const selectedHotels = this.comisionesListCobradas.filter(hotel => hotel.selected);
    if (selectedHotels.length === 0) {
      Swal.fire('Advertencia', 'Debe seleccionar al menos una comisión para generar el recibo.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Está seguro?',
      text: 'Está a punto de generar el recibo con los documentos seleccionados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.comisionesService.actualizarComisiones(selectedHotels).subscribe(
          (response) => {
            Swal.fire('Éxito', 'El recibo se generó exitosamente.', 'success');
            console.log('Respuesta del servidor:', response);
          },
          (error) => {
            Swal.fire('Error', 'Hubo un problema al generar el recibo.', 'error');
            console.error('Error al generar el recibo:', error);
          }
        );
      }
    });
  }

  updateButtonVisibility(): void {
    this.showCreateReceiptButton = this.comisionesListCobradas.some(hotel => hotel.selected);
  }

  verRecibo(id: number) {
    console.log(id);
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/extra/detalle-recibo', id]);
  }
  
}