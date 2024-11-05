import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';
import { ComisionesService } from '../../../../services/comisiones.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PdfGeneratorService } from '../../../../services/pdf-generator.service';
import Swal from 'sweetalert2';

interface Banco {
  co_banco: string;
  de_banco: string;
}

interface FormaPago {
  co_forma: string;
  de_forma: string;
}

interface CuentaBanco {
  id: number;
  co_banco: string;
  co_cta_cte: string;
  de_cta_cte: string;
  co_moneda: string;
}

interface TipoCambio {
  numero: string;
}
interface Comision {
  ComisionTotal?: number; 
  ComisionTotalReal: number;
}
interface Hotel {
  ComisionTotal: number;
  ComisionTotalReal: number;
  montoRestante?: number;
  montoRecibido?: number;
  HotelChainName?: string;
  HotelName?: string;
  CityName?: string;
}

@Component({
  selector: 'app-detalle-comision',
  templateUrl: './detalle-comision.component.html'
})
export class DetalleComisionComponent implements OnInit, OnChanges {
  comisionForm: FormGroup;
  idUsuario: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
  rolUsuario: string = '';
  editMode = false;
  editItemIndex: number;
  isEditMode = false;
  sumatoriaComisionTotalReal: number = 0;
  sumatoriaFee: number = 0;
  sumatoriaGbaI: number = 0;
  sumatoriaGbaL: number = 0;
  sumatoriaTotalAmadeus: number = 0;
  sumatoriaRecibidos: number = 0;
  sumatoriaTotalBancos: number = 0;
  sumatoriaTotalDistribuidos: number = 0;
  sumatoriaDiferencia1: number = 0;
  sumatoriaDiferencia2: number = 0;
  tipdoc: string;
  serie: string;
  numero: string;
  montoAFacturar: number = 0;
  montoBanco:number = 0;
  montoDistribuir: number = 0;

  bancos: Banco[] = [];
  formaPago: FormaPago[] = [];
  selectedTipoCambio: string = '';
  cuentaBanco: CuentaBanco[] = [];
  selectedBanco: number | null = null;
  selectedCuenta: number | null = null;
  selectedFormaPago: number | null = 1;
  numeroBanco: string = '';
  monedaBanco: string = '';
  comision: any;

  idHotel: string = '';
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
  sumaTotalReal: number = 0;
  porComision: string = '';
  comisionTotal: string = '';
  estado: string = '';
  CityName: string = '';
  FechaCreacion: string = '';
  RecNumero: string = '';
  FacSerie: string = '';
  FacNumero: string = '';
  monto: string = '';
  observaciones: string = '';
  appliedPercentage: number = 0;
  GbaI: number = 0;

  comisionesList: any[] = [];
  Id: number = 0;
  errorLoadingComisiones: string = '';

  busqueda: string = '';
  busquedaActiva = false;
  filtrarPorAgenciaActiva: boolean = false;

  selectedHotels: any;
  porcentajeComision: number = 0;
  sumaSeleccionada: number;

  constructor(
    private authService: AuthService, 
    private comisionesService: ComisionesService, 
    private router: Router, 
    private route: ActivatedRoute, 
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private pdfGeneratorService: PdfGeneratorService
  ) {}

  ngOnInit(): void {
    // Obtenemos el estado de la navegación
    const navigationState = history.state;
    console.log("Estado recibido: ", navigationState);
  
    // Llamadas a funciones de inicialización
    this.cargarBancos();
    this.cargarFormaPago();
    this.cargarTipoCambio();
    this.obtenerDatos();
    this.calcularSumatorias();
    this.FechaCreacion = this.getCurrentDate();
  
    this.sumatoriaTotalAmadeus = this.comisionesList.reduce((total, comision) => total + comision.ComisionTotal, 0).toFixed(2);
  
    if (navigationState) {
      this.comision = navigationState.comision || [];
      this.sumaTotal = navigationState.sumaTotal || 0;
      this.sumatoriaComisionTotalReal = navigationState.sumatoriaComisionTotalReal || 0;
      this.sumatoriaGbaI = navigationState.sumatoriaGbaI || 0;
      this.sumatoriaGbaL = navigationState.sumatoriaGbaL || 0;
      this.sumatoriaFee = navigationState.sumatoriaFee || 0;
      this.tipdoc = navigationState.tipdoc || '';
      this.serie = navigationState.serie || '';
      this.numero = navigationState.numero || '';
      this.montoAFacturar = this.sumatoriaComisionTotalReal - this.sumatoriaGbaI;
      this.montoBanco = this.sumatoriaComisionTotalReal - this.sumatoriaGbaI - this.sumatoriaFee;
      this.montoDistribuir = this.sumatoriaComisionTotalReal - this.sumatoriaGbaI - this.sumatoriaFee - this.sumatoriaGbaL;
      console.log("TIPDOC recibido: ", this.tipdoc);
    } else {
      console.error("No hay datos en el estado de navegación.");
    }
  
    if (navigationState.comision) {
      this.selectedHotels = navigationState.comision;
      console.log("seleccionados: ", this.selectedHotels);
  
      this.sumaTotal = this.selectedHotels.reduce((total: number, hotel: Comision) => {
        return total + (hotel.ComisionTotal || 0);
      }, 0);
  
      this.sumaTotalReal = this.selectedHotels.reduce((total: number, hotel: Comision) => {
        return total + (hotel.ComisionTotalReal || 0);
      }, 0);
  
      console.log("Suma Total: ", this.sumaTotal);
      this.inicializarFormularioConDatosDeComision();
    } else {
      console.error('No hay datos de la comisión');
    }
  
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']); 
    } else {
      this.authService.usuarioDatos$.subscribe(datosUsuario => {
        if (datosUsuario && datosUsuario.nombre) {
          this.idUsuario = datosUsuario['idusuario'];
          this.rolUsuario = datosUsuario['rolUsuario'];
          this.nombreUsuario = datosUsuario['nombre'];
          this.imagenUsuario = datosUsuario['fechaIngreso'];
          this.inicializarFormularioConDatosDeComision();
        }
      });
      this.cargarDatosUsuarioDesdeLocalStorage();
    }
  
    this.comisionForm = this.formBuilder.group({
      PnrId: ['', Validators.required],
      CheckInDate: ['', Validators.required],
      CheckOutDate: ['', Validators.required],
      ConfirmationCode: ['', Validators.required],
      HotelChainName: ['', Validators.required],
      HotelName: ['', Validators.required],
      HotelPrice: ['', Validators.required],
      numeroDias: ['', Validators.required],
      total: ['', Validators.required],
      porcomision: ['', Validators.required],
      comisionTotal: ['', Validators.required],
      monto: ['', Validators.required],
      estado: ['', Validators.required]
    });
  }  
  
  cargarDatosUsuarioDesdeLocalStorage(): void {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      this.idUsuario = userData['id'];
      this.rolUsuario = userData['rolUsuario'];
      this.nombreUsuario = userData['nombre'];
      this.imagenUsuario = userData['fechaIngreso'];
      this.inicializarFormularioConDatosDeComision();
    }
  }

  cargarBancos(): void {
    this.comisionesService.getBancos().subscribe(
      (data: Banco[]) => {
        this.bancos = data;
      },
      (error: any) => {
        console.error('Error al cargar los bancos:', error);
      }
    );
  }

  cargarTipoCambio(): void {
    this.comisionesService.getTipoCambio().subscribe(
      (data: any) => {
        if (data && data.recordset && data.recordset.length > 0) {
          this.selectedTipoCambio = data.recordset[0].mo_tip_cambio.toString();
        }
      },
      (error: any) => {
        console.error('Error al cargar los tipos de cambio:', error);
      }
    );
  }

  cargarFormaPago(): void {
    this.comisionesService.getFormaPago().subscribe(
      (data: FormaPago[]) => {
        this.formaPago = data;
      },
      (error: any) => {
        console.error('Error al cargar las formas de pago:', error);
      }
    );
  }

  onBancoChange(selectedBancoId: number | null): void {
    if (selectedBancoId !== null) {
      this.comisionesService.getCuentasPorBanco(selectedBancoId.toString()).subscribe(
        (data: CuentaBanco[]) => {
          this.cuentaBanco = data;
        },
        (error: any) => {
          console.error('Error al cargar las cuentas bancarias:', error);
        }
      );
    } else {
      this.cuentaBanco = [];
    }
    this.numeroBanco = '';
    this.monedaBanco = '';
    this.selectedCuenta = null;
  }

  onCuentaChange(selectedCuentaId: string | null): void {
    if (selectedCuentaId !== null) {
      const selectedCuenta = this.cuentaBanco.find(cuenta => cuenta.co_cta_cte === selectedCuentaId);
      if (selectedCuenta) {
        this.monedaBanco = selectedCuenta.co_moneda;
      } else {
        this.monedaBanco = '';
      }
    } else {
      this.monedaBanco = '';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comision']) {
      this.comision = changes['comision'].currentValue;
      this.inicializarFormularioConDatosDeComision();
    }
  }

  inicializarFormularioConDatosDeComision(): void {
    if (this.selectedHotels && this.selectedHotels.length > 0) {
      const selectedHotel = this.selectedHotels[0];
      console.log('Obtener datos', selectedHotel);

      this.GbaI = selectedHotel.CheckInDate;
      console.log('GbaI: ', selectedHotel.id);
      this.idHotel = selectedHotel.id;
      this.PnrId = selectedHotel.PnrId;

      const lacheckInDate = new Date();
      const lacheckOutDate = new Date();

      this.CheckInDate = this.formatDate(selectedHotel.CheckInDate);
      this.CheckOutDate = this.formatDate(selectedHotel.CheckOutDate);
      this.ConfirmationCode = selectedHotel.ConfirmationCode;
      this.HotelChainName = selectedHotel.HotelChainName;
      this.HotelName = selectedHotel.HotelName;
      this.HotelPrice = selectedHotel.HotelPrice;
      this.HotelPriceCurrency = selectedHotel.HotelPriceCurrency;
      this.numeroDias = this.calcularDiferenciaDias(selectedHotel.CheckInDate, selectedHotel.CheckOutDate);
      this.sumaParcial = this.numeroDias * this.HotelPrice;
      this.porComision = selectedHotel.PorComision;
      this.comisionTotal = selectedHotel.ComisionTotal;
      this.monto = selectedHotel.monto;
      this.estado = selectedHotel.Estado;
      this.CityName = selectedHotel.CityName;
      this.HotelPriceCurrency = selectedHotel.HotelPriceCurrency;
    }
  }


  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
    return formattedDate;
  }

  calcularDiferenciaDias(fechaInicio: string, fechaFin: string): number {
    console.log(fechaInicio);
    const fecha1 = new Date(fechaInicio);
    const fecha2 = new Date(fechaFin);
    console.log(fecha1);
    const diferenciaTiempo = Math.abs(fecha2.getTime() - fecha1.getTime());
    return Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
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

  obtenerDatos() {
    console.log("Selected: ", this.comisionTotal);
    if (this.selectedHotels && this.selectedHotels.length > 0) {
      this.comisionTotal = this.selectedHotels[0].ComisionTotal;
    }
  }

  enviarRecibo(): void {
    const [day, month, year] = this.FechaCreacion.split('/'); 
    const FechaDeCreacion = `${year}-${month}-${day}`;
    const comision = {
      FacSerie: this.FacSerie, 
      FacNumero: this.FacNumero,
      RecNumero: this.RecNumero,
      PnrId: this.PnrId,
      idHotel: this.idHotel,
      PorComision: this.porComision,
      comisionTotal: this.comisionTotal,
      FechaCreacion: FechaDeCreacion,
      FormaPago: this.selectedFormaPago,
      Banco: this.selectedBanco,
      Cuenta: this.selectedCuenta,
      Moneda: this.monedaBanco,
      monto: this.monto,
      TipoCambio: this.selectedTipoCambio,
      Observaciones: this.observaciones,
      CheckInDate: this.CheckInDate,
      CheckOutDate: this.CheckOutDate,
      ConfirmationCode: this.ConfirmationCode,
      HotelChainName: this.HotelChainName,
      HotelName: this.HotelName,
      HotelPrice: this.HotelPrice,
      numeroDias: this.numeroDias,
      sumaParcial: this.sumaParcial,
      estado: this.estado,
      CityName: this.CityName,
      HotelPriceCurrency: this.HotelPriceCurrency
    };
    this.comisionesService.submitRecibo(comision).subscribe(
      response => {
        Swal.fire({
          icon: 'success',
          title: 'Actualizada',
          text: 'Comisión actualizada exitosamente',
        });
        this.router.navigate(['/comisiones/cobradas']);
      },
      error => {
        console.error('Error al enviar el recibo:', error);
      }
    );
  }
   
  getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  regresar(): void {
    this.router.navigate(['/comisiones/cobradas']);
  }

  generatePdf() {
    this.pdfGeneratorService.generatePdf('contentToConvert', 'recibo.pdf');
  }

  crearRecibo(id: number): void{
  }

  aplicarPorcentajeComision() {
      const porcentaje = parseFloat((document.getElementById('porcentajeComision') as HTMLInputElement).value);
      if (!isNaN(porcentaje)) {
          this.selectedHotels.forEach((hotel: Hotel, index: number) => {
              const descuento = hotel.ComisionTotal * (porcentaje / 100);
              hotel.ComisionTotal -= descuento;
              this.selectedHotels[index].montoRestante = hotel.ComisionTotal - (hotel.montoRecibido || 0);
          });
          this.actualizarSumaTotal();
      }
  }

  actualizarSumaTotal() {
    this.sumaTotal = this.selectedHotels.reduce((sum: number, hotel: Hotel) => {
        return sum + (hotel.montoRecibido || 0);
    }, 0);
    this.sumaTotal = parseFloat(this.sumaTotal.toFixed(2));
  }

  aplicarDescuento() {
    const porcentaje = parseFloat(this.porcentajeComision.toString());
    console.log(porcentaje);
    if (isNaN(porcentaje) || porcentaje <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'Ingrese un porcentaje a reducir de las comisiones.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    Swal.fire({
        title: '¿Está segura que desea aplicar el porcentaje de descuento a todas las comisiones?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            this.aplicarDescuentoAComisiones();
        }
    });
  }

  aplicarDescuentoAComisiones() {
    const porcentaje = parseFloat(this.porcentajeComision.toString());
    if (isNaN(porcentaje) || porcentaje <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'Ingrese un porcentaje a reducir de las comisiones.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    const descuento = porcentaje / 100;
    this.selectedHotels.forEach((hotel: Hotel, index: number) => {
        const descuentoAplicado = hotel.ComisionTotal * descuento;
        const nuevoMontoRecibido = hotel.ComisionTotal - descuentoAplicado;
        this.selectedHotels[index].montoRecibido = nuevoMontoRecibido;
        const restante = hotel.ComisionTotal - nuevoMontoRecibido;
        this.selectedHotels[index].montoRestante = Math.max(0, restante);
    });
    this.calcularSumaTotal();
    Swal.fire({
        title: 'Descuento aplicado',
        text: `Se ha aplicado un descuento del ${porcentaje}% a todas las comisiones.`,
        icon: 'success',
        confirmButtonText: 'Aceptar'
    });
  }

  calcularSumaTotal() {
      this.sumaTotal = this.selectedHotels.reduce((sum: number, hotel: Hotel) => {
          return sum + (hotel.montoRecibido || 0);
      }, 0);
  }

  actualizarMontoRecibido(hotel: Hotel, index: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const recibido = parseFloat(inputElement.value);
    if (!isNaN(recibido)) {
        const restante = hotel.ComisionTotal - recibido;
        this.selectedHotels[index].montoRestante = Math.max(0, restante);
        this.selectedHotels[index].montoRecibido = recibido; 
        this.actualizarSumaTotal();
        this.calcularSumaTotal();
    }
  }

  applyPercentageToHotels(): void {
    const totalComisiones = this.getTotalComisiones();
    (this.selectedHotels as Hotel[]).forEach((hotel: Hotel) => {
      const percentage = this.appliedPercentage / 100;
      const newMontoRecibido = totalComisiones * percentage;
      hotel.montoRecibido = newMontoRecibido;
      hotel.montoRestante = hotel.ComisionTotal - newMontoRecibido;
    });
  }

  getTotalComisiones(): number {
    return (this.selectedHotels as Hotel[]).reduce((sum, hotel: Hotel) => sum + hotel.ComisionTotal, 0);
  }

  getTotalComisionesReal(): number {
    return (this.selectedHotels as Hotel[]).reduce((sum, hotel: Hotel) => sum + hotel.ComisionTotalReal, 0);
  }

  getTotalAFacturar() {
    const totalComisionesAmadeus = this.getTotalComisiones();
    const totalComisionesReal = this.getTotalComisionesReal();
  }

  calcularSumatorias() {
    this.sumatoriaFee = this.comisionesList.reduce((total, hotel) => total + hotel.Fee, 0).toFixed(2);
    this.sumatoriaComisionTotalReal = this.comisionesList.reduce((total, comision) => total + comision.ComisionTotalReal, 0).toFixed(2);
    this.sumatoriaGbaI = this.comisionesList.reduce((total, comision) => total + comision.GbaI, 0).toFixed(2);
    this.sumatoriaGbaL = this.comisionesList.reduce((total, comision) => total + comision.GbaL, 0).toFixed(2);
    this.sumatoriaTotalAmadeus = this.comisionesList.reduce((total, comision) => total + comision.ComisionTotal, 0).toFixed(2);
    this.sumatoriaTotalBancos = this.comisionesList.reduce((total, comision) => total + comision.RecBanco, 0).toFixed(2);
    this.sumatoriaTotalDistribuidos = this.comisionesList.reduce((total, comision) => total + comision.ComisionDistribuir, 0).toFixed(2);
  }

}