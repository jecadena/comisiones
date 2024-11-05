import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ComisionesService } from '../../../services/comisiones.service';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

@Component({
  selector: 'app-pendientes',
  templateUrl: './pendientes.component.html',
  styleUrls: ['./pendientes.component.scss']
})
export class PendientesComponent implements OnInit {
  usuarioDatos: any;
  isAdmin: boolean = false;
  currentRoute: string = '';
  SignIn: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
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
  sumaParcial: number = 0;
  sumaTotal: number = 0;
  estado: string = '';
  selectedOrder: string = 'FechaDesc';
  mostrarComisionesDiferentes: boolean = false;
  comisionesListFiltrada: any[] = [];
  selectedComisiones: any[] = [];
  public fechaFacturacion: any;
  errorLoadingComisiones: string = '';
  busqueda: string = '';
  busquedaActiva = false;
  filtrarPorAgenciaActiva: boolean = false;
  countPendientes: number = 0;
  coCounter: string = '';
  coMaestro: string = '';
  coSolicitante: string = '';
  coTipMaestro: string = '';
  infoAdicional: string = '';
  deNomSolicitante: string = '';
  dePatSolicitante: string = '';
  de_img: string = '';
  lacomision: number = 0;
  paginatedComisionesList: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 14;
  totalPages: number = 0;
  sortedComisionesList: any[] = [];
  sortColumn: string = '';
  sortDirection: string = 'asc';
  filteredComisionesList: any[] = [];
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
    this.estado = 'PEN';
    this.comisionesService.comisiones$.subscribe(
      data => {
        this.comisionesList = data;
      },
      error => {
        console.error('Error al obtener la lista de comisiones:', error);
      }
    );
    this.comisionesList = [...this.filteredComisionesList];
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
    this.loadComisionesPendientesList();
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

  loadComisionesPendientesList() {
    const estado = "PEN";
    //if (this.SignIn) {
      this.comisionesService.getComisionesList(this.SignIn, estado).subscribe(
        (data: any[]) => {
          this.comisionesList = data;
          console.log("DATOS INICIALES: ",this.comisionesList);
          this.sumaTotal = this.comisionesList.reduce((acc, hotel) => acc + hotel.ComisionTotal, 0);
          this.totalPages = Math.ceil(this.comisionesList.length / this.itemsPerPage);
          this.paginateComisionesList();
        },
        (error: HttpErrorResponse) => {
          this.errorLoadingComisiones = 'Error al cargar la lista de comisiones: ' + error.message;
          console.error('Error al obtener la lista de comisiones:', error);
        }
      );
    //}
  }

  paginateComisionesList() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedComisionesList = this.comisionesList.slice(startIndex, endIndex);
    console.log('Lista paginada:', this.paginatedComisionesList); // Verificar si los datos se están paginando correctamente
  }

  goToFirstPage() {
    this.currentPage = 1;
    this.paginateComisionesList();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateComisionesList();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateComisionesList();
    }
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
    this.paginateComisionesList();
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

  buscarComisiones(searchText: string = this.busqueda, estado: string = this.estado, SignIn: string = this.SignIn) {
    if (searchText.trim() !== '') {
      this.busquedaActiva = true;
      this.filtrarPorAgenciaActiva = false;
      console.log('Buscando:', searchText);
      this.comisionesService.buscarComisiones(searchText, estado, SignIn).subscribe(
        data => {
          this.comisionesList = data;
          // Actualizar suma total, total de páginas y lista paginada
          this.sumaTotal = this.comisionesList.reduce((acc, hotel) => acc + hotel.ComisionTotal, 0);
          this.totalPages = Math.ceil(this.comisionesList.length / this.itemsPerPage);
          this.currentPage = 1; // Reiniciar a la primera página después de la búsqueda
          this.paginateComisionesList();
        },
        (error: HttpErrorResponse) => {
          this.errorLoadingComisiones = 'Error al cargar la lista de comisiones: ' + error.message;
          console.error('Error al obtener la lista de comisiones:', error.message);
        }
      );
    } else {
      // Si no hay texto de búsqueda, cargar todos los registros
      this.busquedaActiva = false;
      this.cargarTodosLosRegistros(); // Llamar al método que carga todos los registros
    }
  }

  cargarTodosLosRegistros() {
    const SignIn = this.SignIn; 
    this.comisionesService.obtenerTodosLosRegistros(SignIn, this.estado).subscribe(
      data => {
        this.comisionesList = data;
        // Actualizar suma total, total de páginas y lista paginada
        this.sumaTotal = this.comisionesList.reduce((acc, hotel) => acc + hotel.ComisionTotal, 0);
        this.totalPages = Math.ceil(this.comisionesList.length / this.itemsPerPage);
        this.currentPage = 1; // Reiniciar a la primera página
        this.paginateComisionesList(); // Paginar los resultados
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
  pendientes(): void {
    this.router.navigate(['/comisiones/pendientes']);
  }
  loadCounts(): void {
    this.comisionesService.getCountPendientes(this.SignIn)
      .subscribe(count => this.countPendientes = count);
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

  exportarDiferenciasAExcel() {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Diferencias');
    const fechaFact = this.formatDate(this.fechaFacturacion);
    console.log("Antes de convertir: ", this.fechaFacturacion);
    console.log("Valor a Exportar: ", fechaFact);

    const fechaFacturacion1 = this.comisionesListFiltrada.length > 0
      ? this.formatDate(this.fechaFacturacion)
      : 'Fecha Desconocida';

    worksheet.mergeCells('A1:N1');
    const titleCell = worksheet.getCell('A1');
    
    titleCell.value = `REPORTE COMISIONES PENDIENTES`;
    
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' },
    };

    const headers = ['CHECK IN', 'CHECK OUT', 'NOMBRE', 'APELLIDO', 'CIUDAD', 'HOTEL', 'CÓDIGO', 'AMADEUS', 'MONEDA', 'TARIFA', 'COMISION', 'TARIFA AMADEUS', 'COMISION AMADEUS', 'SIGN'];
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

    this.selectedComisiones.forEach(comision => {
      this.lacomision = comision.TotalOtraMoneda === '' || comision.TotalOtraMoneda === null || comision.TotalOtraMoneda === 0
        ? comision.ComisionTotal
        : comision.TotalOtraMoneda;

      const row = worksheet.addRow([
        this.formatDate(comision.CheckInDate),
        this.formatDate(comision.CheckOutDate),
        comision.GuestFirstName,
        comision.GuestLastName,
        comision.CityName,
        comision.HotelName,
        comision.ConfirmationCode,
        comision.ComisionTotal,
        comision.RateplanCurrencyCode,
        this.lacomision,
        comision.CommissionAmountInEuro,
        comision.RateplanTotalPrice,
        comision.ComisionOtraMoneda,
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
    });

    const totalRow = worksheet.addRow([
      '', '', '', '', '', '', 'TOTAL:',
      this.comisionesList.reduce((sum, comision) => sum + comision.ComisionTotal, 0),
      this.comisionesList.reduce((sum, comision) => sum + comision.ComisionTotalReal, 0),
      '', '', '', '', '',
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
      { key: 'C', width: 25 },
      { key: 'D', width: 25 },
      { key: 'E', width: 25 },
      { key: 'F', width: 35 },
      { key: 'G', width: 15 },
      { key: 'H', width: 15 },
      { key: 'I', width: 15 },
      { key: 'J', width: 10 },
      { key: 'K', width: 12 },
      { key: 'L', width: 12 },
      { key: 'M', width: 12 },
      { key: 'N', width: 8 },
    ];

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte_Diferencias_Amadeus_Banco.xlsx');
    });
  }

  toggleAll(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement?.checked ?? false;
    this.comisionesList.forEach(hotel => hotel.selected = isChecked);
    this.selectedComisiones = (this.mostrarComisionesDiferentes ? this.comisionesListFiltrada : this.comisionesList)
        .filter(comision => comision.selected);
    console.log("Seleccionados: ",this.selectedComisiones);
  }

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
        this.selectedComisiones = (this.mostrarComisionesDiferentes ? this.comisionesListFiltrada : this.comisionesList)
            .filter(comision => comision.selected);
    }
  }

  sort(column: string, direction: string) {
    this.sortColumn = column;
    this.sortDirection = direction;
  
    this.comisionesList.sort((a, b) => {
      if (a[column] < b[column]) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (a[column] > b[column]) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  
    this.paginateComisionesList();
  }
  
}