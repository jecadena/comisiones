import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComisionesService } from '../../../services/comisiones.service';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-nuevacomision',
  templateUrl: './nuevacomision.component.html'
})
export class NuevacomisionComponent implements OnInit {
  usuarioDatos: any;
  isAdmin: boolean = false;
  private itpocambio: number | null = null;
  comisionForm: FormGroup;
  comision: any = {
    RateplanTotalPrice: 0,
    numeroDias: 0,
    diario: 0,
    PorComision: 0,
    CommissionAmountInEuro: 0,
    CityName: ''
  };
  ValorTipoCambio: number = 1; 
  pnrs: any[] = [];
  cadenas: string[] = [];
  vendedores: string[] = [];
  estados: string[] = [];
  hoteles: string[] = [];
  ciudades: { de_ciudad: string, de_pais: string }[] = [];
  isEditMode = false;
  previousRoute: string = '';
  mostrarCampoSelectVendedor: boolean = true; 

  coCounter: string = '';
  coMaestro: string = '';

  mostrarCampoTextoCadena: boolean = false;
  mostrarCampoTextoVendedor: boolean = false;
  mostrarCampoTextoHotel: boolean = false;
  mostrarCampoTextoCity: boolean = false;
  lacomision: any = {
    CheckInDate: null,
    CheckOutDate: null
  };

  constructor(
    private route: ActivatedRoute, 
    private authService: AuthService, 
    private router: Router, 
    private comisionesService: ComisionesService, 
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.authService.usuarioDatos$.subscribe(datos => {
      this.usuarioDatos = datos;
      const co_role = this.usuarioDatos?.co_role?.trim();
      console.log('Datos del usuario:', this.usuarioDatos);
      this.isAdmin = co_role === 'ADMIN';
    });
    this.verificarCiudad();
    this.calcularPrecioDiario();
    this.route.queryParams.subscribe(params => {
      this.previousRoute = params['returnUrl'] || '/comisiones';
    });
    this.comisionForm = this.formBuilder.group({
      CheckInDate: ['', Validators.required],
      CheckOutDate: ['', Validators.required],
      ConfirmationCode: ['', Validators.required],
      HotelChainName: ['', Validators.required],
      HotelName: ['', Validators.required],
      HotelPrice: ['', Validators.required],
      numeroDias: ['', Validators.required],
      total: ['', Validators.required],
      PorComision: ['', Validators.required],
      ComisionTotal: ['', Validators.required],
      StatusComision: ['', Validators.required],
      TotalComision: ['', Validators.required]
    });
    this.loadStateData();
    this.cargarPNRs();
    this.cargarCadenasHoteles();
    this.cargarHoteles();
    this.cargarVendedores();
    this.cargarEstados();
    this.cargarCiudades();
    const comisionState = history.state.comision;
    if (comisionState) {
      this.isEditMode = true;
      this.comision = comisionState;
      console.log("Contenido: ", this.comision);
      this.procesarComision(this.comision);
      this.asignarDatosAlFormulario(this.comision);
    } else {
      const id = this.route.snapshot.params['id'];
      console.log("ID: ", id);
      if (id) {
        this.comisionesService.getComision(id).subscribe(
          (data: any) => {
            this.isEditMode = true;
            this.comision = data;
            console.log("Editando: ", this.comision);
            this.procesarComision(this.comision);
            this.asignarDatosAlFormulario(this.comision);
          },
          (error: any) => {
            console.error('Error al cargar los detalles de la comisión:', error);
          }
        );
      }
    }
    if (this.comision.GuestFirstName || this.comision.GuestLastName) {
      this.fullName = `${this.comision.GuestFirstName || ''} ${this.comision.GuestLastName || ''}`;
    }
    console.log("Comision Total: ", this.comision.ComisionTotal);
    console.log("Comisión en Euros:", this.comision.CommissionAmountInEuro);
    const ValorTipoCambio = this.comision.ComisionTotal / this.comision.CommissionAmountInEuro;
    console.log(ValorTipoCambio);
    this.adjustCurrencyCode();
    this.verificarVendedor();
  }

  asignarDatosAlFormulario(comision: any): void {
    this.comisionForm.patchValue({
      CheckInDate: comision.CheckInDate,
      CheckOutDate: comision.CheckOutDate,
      ConfirmationCode: comision.ConfirmationCode,
      HotelChainName: comision.HotelChainName,
      HotelName: comision.HotelName,
      HotelPrice: comision.HotelPrice,
      numeroDias: comision.numeroDias,
      total: comision.total,
      PorComision: comision.PorComision,
      ComisionTotal: comision.ComisionTotal,
      StatusComision: comision.StatusComision,
      TotalComision: comision.TotalComision
    });
  }

  get fullName(): string {
    return `${this.comision.GuestFirstName || ''} ${this.comision.GuestLastName || ''}`;
  }

  set fullName(value: string) {
    const names = value.split(' ');
    this.comision.GuestFirstName = names[0] || '';
    this.comision.GuestLastName = names.slice(1).join(' ') || '';
  }

  openSecondDateInput(): void {
    const checkInDate = this.comision.CheckInDate;
    console.log(checkInDate);
    this.comision.CheckOutDate = checkInDate;
  }

  adjustCurrencyCode() {
    if (this.comision.RateplanCurrencyCode !== 'EUR') {
      this.comision.RateplanCurrencyCode = 'USD';
    }
  }

  loadStateData(): void {
    if (history.state) {
      this.coMaestro = history.state.coMaestro || '';
      this.coCounter = history.state.coCounter || '';
      console.log('State:', history.state);
      console.log('CODIGOS:', this.coMaestro, this.coCounter);
    } else {
      console.log('State is undefined');
    }
  }

  procesarComision(comision: any): void {
    this.comision.CheckInDate = this.comision.CheckInDate.substring(0, 10); 
    this.comision.CheckOutDate = this.comision.CheckOutDate.substring(0, 10); 
    this.calcularDiferenciaDias();
    this.calcularTotal();
    this.calcularComisionTotal();
    this.calcularPrecioDiario();
    if (!this.comision.PorComision) {
      this.comision.PorComision = 0;
    }
  }

  cargarPNRs(): void {
    this.comisionesService.getPNRs().subscribe(
      (data: any[]) => {
        this.pnrs = data;
      },
      (error: any) => {
        console.error('Error al cargar los PNRs:', error);
      }
    );
  }

  cargarCadenasHoteles(): void {
    this.comisionesService.getCadenasHoteles().subscribe(
      (data: any[]) => {
        this.cadenas = data.map(item => item.HotelChainName);
      },
      (error: any) => {
        console.error('Error al cargar las cadenas', error);
      }
    );
  }

 /* cargarVendedores(): void {
    this.comisionesService.getVendedores().subscribe(
      (data: any[]) => {
        this.vendedores = data.map(item => item.de_maestro);
      },
      (error: any) => {
        console.error('Error al cargar las cadenas', error);
      }
    );
  }*/

    cargarVendedores(): void {
      this.comisionesService.getVendedores().subscribe(
        (vendedores: any[]) => {
          this.vendedores = vendedores.map(item => item.de_maestro);
          // Verificar vendedor solo después de cargar vendedores y comision
          if (this.isEditMode && this.comision) {
            this.verificarVendedor();
          }
        },
        (error: any) => {
          console.error('Error al cargar los vendedores:', error);
        }
      );
    }
    
  cargarCiudades(): void {
    this.comisionesService.getCiudades().subscribe(
      (data: { de_ciudad: string, de_pais: string }[]) => {
        this.ciudades = data;
        const ciudadEncontrada = this.ciudades.some(
          (ciudad) => ciudad.de_ciudad === this.comision.CityName
        );
        this.mostrarCampoTextoCity = !ciudadEncontrada;
      },
      (error: any) => {
        console.error('Error al cargar las ciudades', error);
      }
    );
  }

onCityChange(event: any) {
  const selectedCity = event.target.value;
  const cityExists = this.ciudades.some(ciudad => ciudad.de_ciudad === selectedCity);
  if (!cityExists) {
    this.mostrarCampoTextoCity = true;
    this.comision.CityName = selectedCity;
  } else {
    this.mostrarCampoTextoCity = false;
    this.comision.CityName = selectedCity;
  }
}

  toggleCampoCity(): void {
    this.mostrarCampoTextoCity = !this.mostrarCampoTextoCity;
    if (this.mostrarCampoTextoCity) {
      this.comisionForm.get('CityName')?.enable();
      this.comisionForm.get('CityName')?.setValue('');
      this.comision.CityName = '';
      this.comision.HotelCountry = '';
    } else {
      this.comisionForm.get('CityName')?.disable();
      this.comisionForm.get('CityName')?.setValue('');
    }
  }

  toggleCampoCadena(): void {
    this.mostrarCampoTextoCadena = !this.mostrarCampoTextoCadena;
    if (this.mostrarCampoTextoCadena) {
      this.comisionForm.get('HotelChainName')?.enable();
      this.comisionForm.get('HotelChainName')?.setValue('');
    } else {
      this.comisionForm.get('HotelChainName')?.disable();
      this.comisionForm.get('HotelChainName')?.setValue('');
    }
  }

  /*toggleCampoVendedor(): void {
    this.mostrarCampoTextoVendedor = !this.mostrarCampoTextoVendedor;
    if (this.mostrarCampoTextoVendedor) {
      this.comisionForm.get('de_vendedor')?.enable();
      this.comisionForm.get('de_vendedor')?.setValue('');
    } else {
      this.comisionForm.get('de_vendedor')?.disable();
      this.comisionForm.get('de_vendedor')?.setValue('');
    }
  }*/

    toggleCampoVendedor(): void {
      this.mostrarCampoTextoVendedor = !this.mostrarCampoTextoVendedor;
      
      if (this.mostrarCampoTextoVendedor) {
          // Mostrar los inputs de nombre, apellido paterno y apellido materno
          this.comisionForm.get('de_vendedor')?.setValue('');  // Limpiar el campo 'de_vendedor'
          
          // Habilitar y limpiar los campos de nombres y apellidos
          this.comisionForm.addControl('de_nombres', this.formBuilder.control(''));  // Añadir control si no existe
          this.comisionForm.addControl('de_apellidos', this.formBuilder.control(''));  // Añadir control si no existe
          this.comisionForm.addControl('de_apellidos1', this.formBuilder.control(''));  // Añadir control si no existe
      } else {
          // Ocultar los inputs y concatenar los valores para el campo 'de_vendedor'
          const nombre = this.comisionForm.get('de_nombres')?.value || '';
          const apellidoP = this.comisionForm.get('de_apellidos')?.value || '';
          const apellidoM = this.comisionForm.get('de_apellidos1')?.value || '';
          const nombreCompleto = `${nombre} ${apellidoP} ${apellidoM}`.trim();
          
          // Asignar el nombre completo al campo 'de_vendedor'
          this.comisionForm.get('de_vendedor')?.setValue(nombreCompleto);
          
          // Deshabilitar los campos de nombres y apellidos
          this.comisionForm.removeControl('de_nombres');  // Eliminar el control de nombres
          this.comisionForm.removeControl('de_apellidos');  // Eliminar el control de apellido paterno
          this.comisionForm.removeControl('de_apellidos1');  // Eliminar el control de apellido materno
      }
  }
  
  
  verificarVendedor(): void {
    const vendedores = this.vendedores || [];
    const valorVendedor = this.comision.de_vendedor;  // Usar comision.de_vendedor directamente
  
    if (valorVendedor) {
      // Si el valor de 'comision.de_vendedor' no está en la lista de vendedores, mostrar el input
      this.mostrarCampoTextoVendedor = !vendedores.includes(valorVendedor);
    }
  }
  
  

  toggleCampoHotel(): void {
    this.mostrarCampoTextoHotel = !this.mostrarCampoTextoHotel;
    if (this.mostrarCampoTextoHotel) {
      this.comisionForm.get('HotelName')?.enable();
      this.comisionForm.get('HotelName')?.setValue('');
    } else {
      this.comisionForm.get('HotelName')?.disable();
      this.comisionForm.get('HotelName')?.setValue('');
    }
  }

  cargarEstados(): void {
    this.comisionesService.getEstados().subscribe(
      (data: any[]) => {
        this.estados = data.map(item => item.Estado);
      },
      (error: any) => {
        console.error('Error al cargar los estados', error);
      }
    );
  }

  cargarHoteles(): void {
    this.comisionesService.getHoteles().subscribe(
      (data: any[]) => {
        this.hoteles = data.map(item => item.HotelName);
      },
      (error: any) => {
        console.error('Error al cargar los hoteles:', error);
      }
    );
  }

  calcularDiferenciaDias(): void {
    const fechaInicio = new Date(this.comision.CheckInDate);
    const fechaFin = new Date(this.comision.CheckOutDate);
    const diferencia = fechaFin.getTime() - fechaInicio.getTime();
    this.comision.numeroDias = Math.abs(diferencia / (1000 * 3600 * 24));
  }

  calcularPrecioDiario(): void {
    console.log("PRECIO TOTAL: ", this.comision.RateplanTotalPrice);
    console.log("# DÍAS: ", this.comision.numeroDias);
    if (this.comision.RateplanTotalPrice && this.comision.numeroDias) {
      this.comision.diario = parseFloat((this.comision.TotalOtraMoneda / this.comision.numeroDias).toFixed(2));
    } else {
      this.comision.diario = 0;
    }
  }

  calcularTotal(): void {
    if (this.comision.diario && this.comision.numeroDias) {
      this.comision.RateplanTotalPrice = parseFloat((this.comision.diario * this.comision.numeroDias).toFixed(2));
      this.calcularComisionTotal();
    }
  }

  calcularComisionTotal(): void {
    if (this.comision.PorComision === 0) {
      this.comision.CommissionAmountInEuro = 0;
      this.comision.ComisionTotal = 0;
      return; 
    }
    if (this.comision.TotalotraMoneda && this.comision.PorComision) {
      if (this.comision.CommissionAmountInEuro > 0 && this.comision.TotalOtraMoneda > 0 && this.itpocambio === null) {
        this.itpocambio = this.comision.TotalOtraMoneda / this.comision.CommissionAmountInEuro;
      }
      if (this.comision.RateplanCurrencyCode === 'EUR') {
        this.comision.CommissionAmountInEuro = parseFloat(((this.comision.TotalOtraMoneda * this.comision.PorComision) / 100).toFixed(2));
        if (this.itpocambio !== null) {
          this.comision.TotalOtraMoneda = parseFloat((this.comision.CommissionAmountInEuro * this.itpocambio).toFixed(2));
        } else {
          this.comision.TotalOtraMoneda = this.comision.CommissionAmountInEuro;
        }
      } else if (this.comision.RateplanCurrencyCode === 'USD') {
        this.comision.TotalOtraMoneda = parseFloat(((this.comision.RateplanTotalPrice * this.comision.PorComision) / 100).toFixed(2));
        if (this.itpocambio !== null) {
          this.comision.CommissionAmountInEuro = parseFloat((this.comision.TotalOtraMoneda / this.itpocambio).toFixed(2));
        } else {
          this.comision.CommissionAmountInEuro = this.comision.TotalOtraMoneda;
        }
      }
    }
  }

  calcularUSDComisionTotal(): void {
    if (this.comision.RateplanCurrencyCode === 'USD') {
      console.log("ComisionTotal: ", this.comision.ComisionTotal);
      if (this.comision.ComisionTotal && this.comision.CommissionAmountInEuro) {
        this.comision.ComisionTotal = parseFloat((this.comision.CommissionAmountInEuro * (this.comision.ComisionTotal / this.comision.CommissionAmountInEuro)).toFixed(2));
      }
    } else if (this.comision.RateplanCurrencyCode === 'EUR') {
      if (this.comision.ComisionTotal && this.comision.CommissionAmountInEuro) {
        this.comision.CommissionAmountInEuro = parseFloat((this.comision.ComisionTotal).toFixed(2));
      }
    }
  }

  onPrecioDiarioChange(nuevoDiario: number): void {
    this.comision.diario = nuevoDiario;
    this.calcularTotal();
  }

  onTotalChange(): void {
    this.calcularPrecioDiario();
    this.calcularComisionTotal();
  }

  regresar(): void {
    this.location.back();
  }

  sanitizeInput(input: string): string {
    return input ? input.replace(/'/g, "''") : '';
  }

  guardarComision(): void {
    if (this.mostrarCampoTextoVendedor) {
      // Validación para asegurar que se han ingresado nombres, apellidos y número de documento
      if (!this.comision.de_nombres || !this.comision.de_apellidos || !this.comision.co_ruc) {
        Swal.fire({
          icon: 'error',
          title: 'Faltan campos obligatorios',
          text: 'Por favor, ingrese los nombres, apellidos y número de documento.'
        });
        return;
      }
    }
    const comisionData = {
      id: this.comision.id,
      CheckInDate: this.comision.CheckInDate,
      CheckOutDate: this.comision.CheckOutDate,
      CityName: this.sanitizeInput(this.comision.CityName),
      ComisionTotalReal: this.comision.ComisionTotalReal || 0, 
      CommissionAmountInEuro: this.comision.CommissionAmountInEuro || 0,
      ConfirmationCode: this.sanitizeInput(this.comision.ConfirmationCode),
      GuestFirstName: this.sanitizeInput(this.comision.GuestFirstName),
      GuestLastName: this.sanitizeInput(this.comision.GuestLastName),
      HotelChainName: this.sanitizeInput(this.comision.HotelChainName),
      HotelCountry: this.sanitizeInput(this.comision.HotelCountry),
      HotelName: this.sanitizeInput(this.comision.HotelName),
      HotelPrice: this.comision.HotelPrice || "", 
      PorComision: this.comision.PorComision || 0, 
      RateplanCurrencyCode: this.sanitizeInput(this.comision.RateplanCurrencyCode),
      RateplanTotalPrice: this.comision.RateplanTotalPrice || 0,
      Observaciones: this.sanitizeInput(this.comision.Observaciones),
      Anulado: this.sanitizeInput(this.comision.Anulado),
      de_vendedor: this.mostrarCampoTextoVendedor ? '' : this.sanitizeInput(this.comision.de_vendedor),
      de_nombres: this.mostrarCampoTextoVendedor ? this.sanitizeInput(this.comision.de_nombres) : '',
      de_apellidos: this.mostrarCampoTextoVendedor ? this.sanitizeInput(this.comision.de_apellidos) : '',
      de_apellidos1: this.mostrarCampoTextoVendedor ? this.sanitizeInput(this.comision.de_apellidos1) : '',
      co_ruc: this.mostrarCampoTextoVendedor ? this.sanitizeInput(this.comision.co_ruc) : '',
      SignIn: this.comision.SignIn, 
      Estado: this.sanitizeInput(this.comision.Estado), 
      idUsuario: this.coMaestro, 
      diario: this.comision.diario || 0,
      numeroDias: this.comision.numeroDias || 0,
      fechaCreacion: this.getFormattedDate(new Date()),
    };
    
    const toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    
    const navigateAfterToast = () => {
      setTimeout(() => {
        const currentUrl = this.location.path();
        if (currentUrl === '') {
          this.router.navigate([this.previousRoute]);
        } else {
          this.location.back();
        }
      }, 1000);
    };
    
    if (this.isEditMode) {
      console.log('EDICIÓN');
      this.http.post<any>('http://localhost:3000/comisiones/actualizar', comisionData)
        .subscribe(
          (data) => {
            toast.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Comisión actualizada exitosamente',
              timer: 1000
            }).then(() => navigateAfterToast());
          },
          (error) => {
            toast.fire({
              icon: 'error',
              title: 'Error al actualizar la comisión'
            });
          }
        );
    } else {
      this.http.post<any>('http://localhost:3000/comisiones/guardar', comisionData)
        .subscribe(
          (response) => {
            const SignIn = response.SignIn;
            this.comision.SignIn = SignIn;
            toast.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Comisión creada exitosamente'
            }).then(() => navigateAfterToast());
          },
          (error) => {
            toast.fire({
              icon: 'error',
              title: 'No se ha podido crear la comisión'
            });
          }
        );
    }
  }

  verificarCiudad() {
    const selectedCity = this.comision.CityName;
    const cityExists = this.ciudades.some(ciudad => ciudad.de_ciudad === selectedCity);
    if (!cityExists && selectedCity) {
      this.mostrarCampoTextoCity = true;
    } else {
      this.mostrarCampoTextoCity = false;
    }
  }

  getFormattedDate(date: Date): string {
    const year = date.getFullYear();
    const month = this.padZero(date.getMonth() + 1);
    const day = this.padZero(date.getDate());
    const hours = this.padZero(date.getHours());
    const minutes = this.padZero(date.getMinutes());
    const seconds = this.padZero(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}