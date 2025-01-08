import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ComisionesService } from '../../../services/comisiones.service';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-anuladas',
    templateUrl: './anuladas.component.html',
    standalone: false
})
export class AnuladasComponent implements OnInit {
  usuarioDatos: any;
  isAdmin: boolean = false;
  currentRoute: string = '';
  SignIn: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
  rolUsuario: string = '';
  editMode = false;
  editItemIndex: number;
  mostrarComisionesDiferentes: boolean = false;

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
  sumaParcial: number = 0;
  sumaTotal: number = 0;
  estado: string = '';
  selectedComisiones: any[] = [];

  errorLoadingComisiones: string = '';

  busqueda: string = '';
  busquedaActiva = false;
  filtrarPorAgenciaActiva: boolean = false;

  countCobradas: number = 0;
  countAnuladas: number = 0;
  countPendientes: number = 0;
  countRecibos: number = 0;
  ComisionTotal: number = 0;

  coCounter: string = '';
  coMaestro: string = '';
  coSolicitante: string = '';
  coTipMaestro: string = '';
  infoAdicional: string = '';
  deNomSolicitante: string = '';
  dePatSolicitante: string = '';
  de_img: string = '';
  selectedOrder: string = 'FechaDesc';

  private searchSubject: Subject<string> = new Subject();

  constructor(
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
    this.currentRoute = this.router.url;
    const userData = this.authService.getUserData();
    this.SignIn = userData.co_counter;
    this.estado = 'ANU';
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

  loadComisionesAnuladasList() {
    const estado = "ANU";
    if (this.SignIn) {
      this.comisionesService.getComisionesList(this.SignIn, estado).subscribe(
        data => {
          this.comisionesList = data;
          if (this.comisionesList.length > 0) {
            const elitem = this.comisionesList[0];
            this.id = elitem.id;
            this.PnrId = elitem.PnrId;
            const lacheckInDate = new Date(elitem.CheckInDate);
            const lacheckOutDate = new Date(elitem.CheckOutDate);

            const checkInYear = lacheckInDate.getFullYear();
            const checkInMonth = (lacheckInDate.getMonth() + 1).toString().padStart(2, '0');
            const checkInDay = lacheckInDate.getDate().toString().padStart(2, '0');

            const checkOutYear = lacheckOutDate.getFullYear();
            const checkOutMonth = (lacheckOutDate.getMonth() + 1).toString().padStart(2, '0');
            const checkOutDay = lacheckOutDate.getDate().toString().padStart(2, '0');

            this.CheckInDate = `${checkInMonth}/${checkInDay}/${checkInYear}`;
            this.CheckOutDate = `${checkOutMonth}/${checkOutDay}/${checkOutYear}`;
            this.ComisionTotal = elitem.ComisionTotal;
            this.ConfirmationCode = elitem.ConfirmationCode;
            this.HotelChainName = elitem.HotelChainName;
            this.HotelName = elitem.HotelName;
            this.HotelPrice = elitem.HotelPrice;
            this.HotelPriceCurrency = elitem.HotelPriceCurrency;
            this.numeroDias = this.calcularDiferenciaDias(elitem.CheckInDate, elitem.CheckOutDate);
            this.sumaParcial = elitem.ComisionTotal;
            this.estado = elitem.estado;
          }
          console.log("Comisiones: ",this.sumaParcial);
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

  buscarComisiones(searchText: string = this.busqueda, estado: string = this.estado, SignIn: string = this.SignIn, rolUsuario: string = this.rolUsuario) {
    if (searchText.trim() !== '') {
      this.busquedaActiva = true;
      this.filtrarPorAgenciaActiva = false;
      console.log(searchText);
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
    console.log("Estado: ", this.estado);
    this.comisionesService.obtenerTodosLosRegistros(SignIn, this.estado).subscribe(
      data => {
        this.comisionesList = data;
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
    this.router.navigate(['/comisiones/nuevacomision'], { state: { comision: this.comisionesList[index] } });
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
            //this.comisionesService.actualizarListaComisiones();
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
  recibos(): void {
    this.router.navigate(['/extra/recibos']);
  }
  anuladas(): void {
    this.router.navigate(['/comisiones/anuladas']);
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
}