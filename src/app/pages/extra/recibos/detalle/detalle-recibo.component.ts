import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';
import { ComisionesService } from '../../../../services/comisiones.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { PdfGeneratorService } from '../../../../services/pdf-generator.service';

interface Banco {
  id: number;
  nombre: string;
  numero: string;
  moneda: string;
}

interface FormaPago {
  id: number;
  codigo: string;
  descripcion: string;
}

interface CuentaBanco {
  id: number;
  idBanco: string;
  numero: string;
  descripcion: string;
  moneda: string;
}

interface TipoCambio {
  id: number;
  numero: string;
}

@Component({
  selector: 'app-detalle-recibo',
  templateUrl: './detalle-recibo.component.html'
})
export class DetalleReciboComponent implements OnInit {
  id: string;
  reciboData: any;
  errorMessage: string;

  comisionForm: FormGroup;
  SignIn: string = '';
  nombreUsuario: string = '';
  imagenUsuario: string = '';
  rolUsuario: string = '';
  editMode = false;
  editItemIndex: number;
  isEditMode = false;

  bancos: Banco[] = [];
  formaPago: FormaPago[] = [];
  tipoCambio: TipoCambio[] = [];
  cuentaBanco: CuentaBanco[] = [];
  selectedBanco: number | null = null;
  selectedCuenta: number | null = null;
  selectedFormaPago: number | null = 1;
  selectedTipoCambio: number | null = 1;
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

  constructor(
    private route: ActivatedRoute,
    private reciboService: ComisionesService,
    private pdfGeneratorService: PdfGeneratorService,
    private authService: AuthService, 
    private comisionesService: ComisionesService, 
    private router: Router, 
    private http: HttpClient,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? idParam : '';
    const elid = this.id;
    this.obtenerRecibo();
  
    this.cargarBancos();
    this.cargarFormaPago();
    this.cargarTipoCambio();
    this.FechaCreacion = this.getCurrentDate();
  
    const state = history.state;
    if (state && state.comision) {
      this.comision = state.comision;
      this.inicializarFormularioConDatosDeComision();
    } else {
      console.error('No hay datos de la comisión');
    }
  
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']); 
    } else {
      this.authService.usuarioDatos$.subscribe(datosUsuario => {
        if (datosUsuario && datosUsuario['nombre']) {
          this.SignIn = datosUsuario['SignIn'];
          this.rolUsuario = datosUsuario['rolUsuario'];
          this.nombreUsuario = datosUsuario['nombre'];
          this.imagenUsuario = datosUsuario['fechaIngreso'];
          this.inicializarFormularioConDatosDeComision();
        }
      });
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        this.SignIn = userData.id;
        this.rolUsuario = userData.rolUsuario;
        this.nombreUsuario = userData.nombre;
        this.imagenUsuario = userData.fechaIngreso;
        this.inicializarFormularioConDatosDeComision();
      }
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
      (data: any[]) => {
        if (data && data.length > 0) {
          this.selectedTipoCambio = data[0].numero; 
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comision']) {
      this.comision = changes['comision'].currentValue;
      this.inicializarFormularioConDatosDeComision();
    }
  }

  inicializarFormularioConDatosDeComision(): void {
    if (this.comision) {
      this.idHotel = this.id;
      this.PnrId = this.comision.PnrId;
      const lacheckInDate = new Date(this.comision.CheckInDate);
      const lacheckOutDate = new Date(this.comision.CheckOutDate);
  
      const checkInYear = lacheckInDate.getFullYear();
      const checkInMonth = (lacheckInDate.getMonth() + 1).toString().padStart(2, '0');
      const checkInDay = lacheckInDate.getDate().toString().padStart(2, '0');
  
      const checkOutYear = lacheckOutDate.getFullYear();
      const checkOutMonth = (lacheckOutDate.getMonth() + 1).toString().padStart(2, '0');
      const checkOutDay = lacheckOutDate.getDate().toString().padStart(2, '0');
  
      this.CheckInDate = `${checkInMonth}/${checkInDay}/${checkInYear}`;
      this.CheckOutDate = `${checkOutMonth}/${checkOutDay}/${checkOutYear}`;
  
      this.ConfirmationCode = this.comision.ConfirmationCode;
      this.HotelChainName = this.comision.HotelChainName;
      this.HotelName = this.comision.HotelName;
      this.HotelPrice = this.comision.HotelPrice;
      this.HotelPriceCurrency = this.comision.HotelPriceCurrency;
      this.numeroDias = this.calcularDiferenciaDias(this.comision.CheckInDate, this.comision.CheckOutDate);
      this.sumaParcial = this.numeroDias * this.HotelPrice;
      this.porComision = this.comision.PorComision;
      this.comisionTotal = this.comision.comisionTotal;
      this.monto = this.comision.monto;
      this.estado = this.comision.estado;
      this.CityName = this.comision.CityName;
      this.HotelPriceCurrency = this.comision.HotelPriceCurrency;
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
   
  getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  regresar(): void {
    this.router.navigate(['/extra/recibos']);
  }

  generatePdf() {
    this.pdfGeneratorService.generatePdf('contentToConvert', 'recibo.pdf');
  }

  obtenerRecibo(): void {
    if (this.id && this.id !== '') {
      this.comisionesService.imprimirComision(parseInt(this.id, 10)).subscribe(
        data => {
          this.reciboData = data;
          this.inicializarFormularioConDatosDeComision();
        },
        error => {
          console.error('Error al obtener el recibo:', error);
          Swal.fire(
            'Error',
            'Hubo un problema al intentar obtener el recibo',
            'error'
          );
        }
      );
    }
  }

  /*inicializarFormularioConDatosDeComision(): void {
    if (this.reciboData) {
    }
  }*/

}