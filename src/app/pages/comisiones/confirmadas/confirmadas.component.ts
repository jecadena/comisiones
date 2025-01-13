import { Component, OnInit } from '@angular/core';
import { ComisionesService } from '../../../services/comisiones.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import * as fs from 'file-saver';
import { saveAs } from 'file-saver';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-confirmadas',
    templateUrl: './confirmadas.component.html',
    styleUrls: ['./confirmadas.component.scss'],
    providers: [DatePipe],
    standalone: false
})

export class ConfirmadasComponent implements OnInit {
  usuarioDatos: any;
  isAdmin: boolean = false;
  selectedFile: File | null = null;
  comisionesList: any[] = [];
  errorLoadingComisiones: string | null = null;
  fechasFacturacion: string[] = [];
  mostrarTabla: boolean = false;
  faltantes: number = 0;
  encontradas: number = 0;
  busqueda: string = '';
  busquedaActiva = false;
  filtrarPorAgenciaActiva: boolean = false;
  selectedOrder: string = 'FechaAsc';
  countCobradas = 0;
  countAnuladas = 0;
  countRecibos = 0;
  countPendientes = 0;
  sumaTotal = 0;
  currentRoute = '';
  SumatoriaComisiones: number = 0;
  SumatoriaComisiones1: number = 0;
  SumatoriaRecibido: number = 0;
  SumatoriaDistribuir: number = 0;
  SumatoriaFee: number = 0;
  SumatoriaGbaI: number = 0;
  SumatoriaGbaL: number = 0;
  TotalFactura: number = 0;
  aFacturar: number = 0;
  loading: boolean = false;
  estado: string = '';
  SignIn: string = '';
  comisionesListFiltrada: any[] = [];

  selectedYear: string = '2025'; 
  availableYears: string[] = ['2024', '2025']; 
  fechasFiltradas: string[] = []; 

  nombreUsuario: string = '';
  dePatSolicitante: string = '';
  de_img: string = '';
  coCounter: string = '';
  coMaestro: string = '';
  coSolicitante: string = '';
  coTipMaestro: string = '';
  infoAdicional: string = '';

  public fechaFacturacion: any;

  selectedComisiones: any[] = [];
  isAnyCheckboxChecked: boolean = false;
  isSecondTableCheckboxChecked: boolean = false;
  comisiones: any[] = [];
  comisionesPorFecha: { [fecha: string]: any[] } = {};

  private searchSubject: Subject<string> = new Subject();

  constructor(
    private comisionesService: ComisionesService,
    private authService: AuthService, 
    private http: HttpClient, 
    private router: Router, 
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.authService.usuarioDatos$.subscribe(datos => {
      this.usuarioDatos = datos;
      const co_role = this.usuarioDatos?.co_role?.trim();
      console.log('Datos del usuario:', this.usuarioDatos);
      this.isAdmin = co_role === 'ADMIN';
    });
    this.cargarFechasFacturacion();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.buscarComisiones(searchText);
    });
    this.cargarTodosLosRegistros();
  }

  cargarFechasFacturacion() {
    this.comisionesService.getFechasFacturacion().subscribe(
      data => {
        this.fechasFacturacion = data
          .filter(comision => comision.FechaFacturacion !== null)
          .map(comision => comision.FechaFacturacion);
        this.fechasFacturacion.forEach(fecha => {
          this.cargarComisionesPorFecha(fecha);
        });
  
        // Filtrar fechas por el año por defecto (2025)
        this.filtrarFechasPorAnio();
      },
      (error: HttpErrorResponse) => {
        this.errorLoadingComisiones = 'Error al cargar las fechas de facturación: ' + error.message;
        console.error('Error al cargar las fechas de facturación:', error);
      }
    );
  }  

  cargarComisionesPorFecha(fechaFacturacion: string) {
    const fechaFactura = fechaFacturacion.slice(0, 10);
    this.comisionesService.getComisionPorFecha(fechaFactura).subscribe(
      data => {
        this.comisionesPorFecha[fechaFacturacion] = data;
      },
      (error: HttpErrorResponse) => {
        console.error(`Error al cargar las comisiones para la fecha ${fechaFacturacion}:`, error);
      }
    );
  }

  filtrarFechasPorAnio(): void {
    this.fechasFiltradas = this.fechasFacturacion.filter(fecha => fecha.startsWith(this.selectedYear));
  }  

  revisarComision(fechaFacturacion: string) {
    this.router.navigate(['/comisiones/cobradas'], {
      queryParams: { fechaFacturacion, estado: 'COB' }
    });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.mostrarTabla = true;
    }
  }

  formatCommissions(commissions: any[]): any[] {
    console.log('Input commissions:', commissions);
    return commissions.map(commission => {
        console.log('Processing commission:', commission);
        commission.date = this.formatDateToDatabase(commission.date);
        return commission;
    });
  }

  procesarConfirmacionComisiones() {
    if (!this.isSecondTableCheckboxChecked) {
        Swal.fire('Error', 'Debe seleccionar al menos una comisión para confirmar.', 'error');
        return;
    }
    const selectedCommissions = this.comisionesList.filter(hotel => hotel.selected);
    const newCommissions = selectedCommissions.filter(hotel => hotel.isNew);
    const existingCommissions = selectedCommissions.filter(hotel => !hotel.isNew);
    const formatDateToDatabase = (date: any): string => {
        if (typeof date === 'string' && !isNaN(Date.parse(date))) {
            return date.split('T')[0];
        } else if (typeof date === 'number') {
            const jsDate = new Date((date - (25567 + 2)) * 86400 * 1000);
            return jsDate.toISOString().split('T')[0];
        } else {
            throw new Error('Formato de fecha no reconocido');
        }
    };
    const formatCommissions = (commissions: any[]) => {
        return commissions.map(commission => {
            return {
                ...commission,
                CheckInDate: formatDateToDatabase(commission.CheckInDate),
                CheckOutDate: formatDateToDatabase(commission.CheckOutDate),
                FechaFacturacion: commission.FechaFacturacion 
                                  ? formatDateToDatabase(commission.FechaFacturacion)
                                  : null,
                ConfirmationCode: String(commission.ConfirmationCode)
            };
        });
    };
    const mostrarToastCargando = (mensaje: string) => {
        Swal.fire({
            title: mensaje,
            html: '<div id="progress-bar-container"><div id="progress-bar" style="width: 0%;"></div></div><div id="progress-percentage">0%</div>',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading(null);
                updateProgressBar(0);
            }
        });
    };
    const updateProgressBar = (percentage: number) => {
        const progressBar = document.getElementById('progress-bar') as HTMLElement;
        const progressPercentage = document.getElementById('progress-percentage') as HTMLElement;

        if (progressBar && progressPercentage) {
            progressBar.style.width = `${percentage}%`;
            progressPercentage.textContent = `${percentage}%`;
        }
    };
    const handleSuccess = () => {
        Swal.fire({
            title: 'Éxito',
            text: 'Las comisiones se han procesado exitosamente.',
            icon: 'success',
            confirmButtonText: 'OK'
        });
    };
    const handleError = (error: any) => {
        Swal.fire('Error', 'Hubo un problema al procesar las comisiones.', 'error');
    };
    const updateCommissionsPromise = existingCommissions.length > 0 ? 
        new Promise<void>((resolve, reject) => {
            mostrarToastCargando('Actualizando Comisiones');
            this.http.post('https://actoursapps.com.pe:3000/api/update-comisiones', formatCommissions(existingCommissions))
                .subscribe({
                    next: () => {
                        updateProgressBar(100);
                        resolve();
                    },
                    error: (error) => {
                        handleError(error);
                        reject(error);
                    }
                });
        }) : Promise.resolve();

    const insertCommissionsPromise = newCommissions.length > 0 ?
        new Promise<void>((resolve, reject) => {
            mostrarToastCargando('Ingresando Comisiones');
            this.http.post('https://actoursapps.com.pe:3000/api/insert-comisiones', formatCommissions(newCommissions))
                .subscribe({
                    next: () => {
                        updateProgressBar(100);
                        setTimeout(() => {
                            resolve();
                        }, 5000);
                    },
                    error: (error) => {
                        handleError(error);
                        reject(error);
                    }
                });
        }) : Promise.resolve();

    Promise.all([updateCommissionsPromise, insertCommissionsPromise])
        .then(() => {
            handleSuccess();
            this.router.navigate(['/comisiones']);
        })
        .catch((error) => {
            console.error('Error procesando comisiones:', error);
        });  
  }

  confirmarComisiones() {
    if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            this.compararDatos(jsonData);
            console.log("DATOS DE", jsonData);
        };
        reader.readAsArrayBuffer(this.selectedFile);
    } else {
        Swal.fire('Error', 'Por favor, seleccione un archivo.', 'error');
    }
  }

  compararDatos(data: any[][]) {
    const filteredData = data.slice(3).filter((row: any[]) => {
        return row[0] !== undefined && row[0] !== null && row[0].toString().trim() !== '';
    }).map((row: any[]) => {
        row[6] = row[6] !== undefined && row[6] !== null ? row[6].toString().trim() : '';
        row[11] = row[11] !== undefined && row[11] !== null ? row[11].toString().trim() : '';
        console.log("ConfirmationCode: ", row[6]);
        // Convertir fechas en formato Excel a ISO strings
        if (row[1]) {
            const excelDate = row[1];
            const jsDate = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
            row[1] = jsDate.toISOString(); // Fecha de facturación
        }
        if (row[8]) {
            const excelDate = row[8];
            const jsDate = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
            row[8] = jsDate.toISOString();
        }
        if (row[9]) {
            const excelDate = row[9];
            const jsDate = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
            row[9] = jsDate.toISOString();
        }

        let lastName = '';
        let firstName = '';
        if (row[5]) {
          const names = row[5].split('/');
          if (names.length === 2) {
              lastName = names[0] ? names[0].trim() : '';
              firstName = names[1] ? names[1].trim() : '';
          } else {
              lastName = row[5].trim();
              firstName = '-';
          }
        } else {
            lastName = '-';
            firstName = '-';
        }    

        let CommissionAmountInEuro = '';
        let CommissionAmountInOther = '';
        let RateplanTotalEuro = '';
        let RateplanTotalOther = '';
        let TotalOtraMoneda = '';
        let ComisionOtraMoneda = '';
        if (row[11] === 'EUR') {
            CommissionAmountInEuro = row[13] || '';
            RateplanTotalEuro = row[12] || '';
            TotalOtraMoneda = row[12] || '';
            ComisionOtraMoneda = row[13] || '';
        } else if (row[11] !== 'USD' && row[11]) {
            CommissionAmountInOther = row[13] || '';
            RateplanTotalOther = row[12] || '';
            TotalOtraMoneda = row[12] || '';
            ComisionOtraMoneda = row[13] || '';
        }

        return { 
            row, 
            lastName, 
            firstName,
            CommissionAmountInEuro,
            CommissionAmountInOther,
            RateplanTotalOther,
            TotalOtraMoneda,
            ComisionOtraMoneda
        };
    });

    const confirmationCodes = filteredData.map((item: any) => item.row[6] || '---');
    const encodedCodes = encodeURIComponent(confirmationCodes.join(','));

    // Obtener la FechaFacturacion del primer registro para la comparación
    const fechaFacturacion = filteredData[0].row[1]; 
    const encodedFechaFacturacion = encodeURIComponent(fechaFacturacion);

    // Obtener lastName y firstName del primer registro para la comparación
    const lastName = filteredData[0].lastName;
    const firstName = filteredData[0].firstName;
    const encodedLastName = encodeURIComponent(lastName);
    const encodedFirstName = encodeURIComponent(firstName);

    console.log("Datos de códigos: ", encodedCodes);
    console.log("Fecha de facturación: ", fechaFacturacion);

    // Verificar si los códigos ya fueron ingresados previamente para la fecha indicada
    const checkUrl = `https://actoursapps.com.pe:3000/api/compare-comisiones?codes=${encodedCodes}&fechaFacturacion=${encodedFechaFacturacion}&lastName=${encodedLastName}&firstName=${encodedFirstName}`;

    this.http.get<{ found: boolean, conflict: boolean, message?: string, data?: any }>(checkUrl).subscribe(
        (response) => {
            if (response.conflict) {
                // Mostrar mensaje de confirmación con SweetAlert
                Swal.fire({
                    title: 'Confirmación',
                    text: response.message || 'Se encontró un registro facturado. ¿Desea continuar?',
                    icon: 'warning',
                    confirmButtonText: 'Aceptar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Si el usuario acepta, continuar con la búsqueda de comisiones
                        console.log("Datos filtrados: ", filteredData);
                        this.procesarBusqueda(encodedCodes, fechaFacturacion, filteredData, firstName, lastName);
                    }
                });
            } else {
                // Si no hay conflicto, proceder automáticamente
                this.procesarBusqueda(encodedCodes, fechaFacturacion, filteredData, firstName, lastName);
            }
        },
        (error) => {
            console.error('Error al verificar códigos:', error);
            Swal.fire('Error', 'Hubo un problema al verificar los códigos.', 'error');
        }
    );
  }

  procesarBusqueda(encodedCodes: string, fechaFacturacion: string, filteredData: any[], firstName: string, lastName: string) {
    // Construir la URL con los parámetros de código, fecha, firstName y lastName
    const url = `https://actoursapps.com.pe:3000/api/compare-comisiones?codes=${encodedCodes}&fechaFacturacion=${fechaFacturacion}&firstName=${firstName}&lastName=${lastName}`;

    // Realizar la solicitud GET al servidor
    this.http.get<{ found: boolean, data: any[], conflict?: boolean, message?: string }>(url).subscribe(
        (response) => {
            console.log('Respuesta del servidor:', response);

            // Manejar conflicto si existe
            if (response.conflict) {
                /*console.error('Conflicto en la respuesta del servidor:', response.message);
                Swal.fire('Conflicto', response.message, 'warning');*/
                this.loading = false;
                return;
            }

            // Validar respuesta
            if (response.found === undefined || !Array.isArray(response.data)) {
                console.error('La respuesta del servidor no es válida', response);
                Swal.fire('Error', 'Hubo un problema al comparar los datos.', 'error');
                this.loading = false;
                return;
            }

            // Procesar comisiones encontradas
            const foundCommissions = response.data.map((commission: any) => {
                commission.ConfirmationCode = commission.ConfirmationCode.toString().trim();
                return commission;
            });

            const foundCodes = new Set(foundCommissions.map((commission: any) => commission.ConfirmationCode));
            console.log("CODIGOS ENCONTRADOS: ", foundCodes);

            let sumatoriaTotal = 0;

            // Cálculo de sumatorias
            this.SumatoriaComisiones1 = filteredData.reduce((sum, item: any) => {
                const comisionTotal = parseFloat(item.row[14]) || 0;
                return sum + comisionTotal;
            }, 0);

            this.SumatoriaFee = filteredData.reduce((sum, item: any) => {
                const comisionTotal = parseFloat(item.row[16]) || 0;
                return sum + comisionTotal;
            }, 0);

            this.SumatoriaGbaI = filteredData.reduce((sum, item: any) => {
                const comisionTotal = parseFloat(item.row[17]) || 0;
                return sum + comisionTotal;
            }, 0);

            this.SumatoriaRecibido = filteredData.reduce((sum, item: any) => {
                const comisionTotal = parseFloat(item.row[18]) || 0;
                return sum + comisionTotal;
            }, 0);

            this.SumatoriaGbaL = filteredData.reduce((sum, item: any) => {
                const comisionTotalL = parseFloat(item.row[19]) || 0;
                return sum + comisionTotalL;
            }, 0);

            this.SumatoriaDistribuir = filteredData.reduce((sum, item: any) => {
                const comisionTotalL = parseFloat(item.row[20]) || 0;
                return sum + comisionTotalL;
            }, 0);

            this.TotalFactura = this.SumatoriaComisiones1 - this.SumatoriaFee - this.SumatoriaGbaI;
            this.aFacturar = this.SumatoriaComisiones1 - this.SumatoriaGbaI;

            // Inicializar la lista de comisiones
            this.comisionesList = [];

            // Para cada item en filteredData, llamamos a un endpoint para obtener de_vendedor
            filteredData.forEach((item: any) => {
                console.log("CONFIRMATION CODE: ", item.row[6]);
                console.log("NOMBRE: ", item.row[5]);
                console.log("FIRST NAME: ",firstName);
                console.log("LAST NAME: ",lastName);
                let lastNames = '';
                let firstNames = '';
                if (item.row[5]) {
                  const names = item.row[5].split('/');
                  if (names.length === 2) {
                      lastNames = names[0] ? names[0].trim() : '';
                      firstNames = names[1] ? names[1].trim() : '';
                  } else {
                      lastNames = item.row[5].trim();
                      firstNames = '-';
                  }
                } else {
                    lastNames = '-';
                    firstNames = '-';
                }    

                const confirmationCode = item.row[6] || '---';
                console.log("CC: ", confirmationCode);
                // Primero verificamos si el confirmationCode está en foundCodes
                const codeExists = foundCodes.has(confirmationCode);

                // Declaramos la variable matchingCommission aquí
                let matchingCommission = null;

                // Luego verificamos si los nombres coinciden (solo si el código existe)
                let isNew = !codeExists; // Asumimos que es nuevo si el código no existe

                if (codeExists) {
                    // Buscar la comisión que coincida en foundCommissions
                    matchingCommission = foundCommissions.find((c: any) => 
                        c.ConfirmationCode === confirmationCode
                    );
                    console.log("MATCHING: ", matchingCommission);
                    // Si los nombres no coinciden, consideramos que es nuevo
                    if (matchingCommission) {
                        const namesMatch = matchingCommission.GuestFirstName === firstNames && matchingCommission.GuestLastName === lastNames;
                        isNew = !namesMatch; // Si los nombres no coinciden, es nuevo
                    }
                }

                // Mostrar el estado de isNew para ver el resultado de la lógica
                console.log(`isNew: ${isNew}`);

                let comisionTotal = matchingCommission ? 
                    (matchingCommission.ComisionTotal === 0 || matchingCommission.ComisionTotal === '') ? item.row[14] : matchingCommission.ComisionTotal 
                    : item.row[14];

                const comisionTotalFloat = parseFloat(comisionTotal) || 0;
                sumatoriaTotal += comisionTotalFloat;

                // Llamada adicional para obtener de_vendedor
                this.http.get<{ de_vendedor: string }>(`https://actoursapps.com.pe:3000/api/get-vendedor?firstName=${item.firstName}&lastName=${item.lastName}`)
                    .subscribe(
                        (vendedorResponse) => {
                            const deVendedor = vendedorResponse.de_vendedor || ''; // Si no hay valor, lo dejamos vacío

                            const newCommission = {
                                RateplanCurrencyCode: item.row[11],
                                AgencyName: item.row[2],
                                FechaFacturacion: item.row[1], 
                                HotelName: item.row[4],
                                GuestFirstName: item.firstName,
                                GuestLastName: item.lastName,
                                ConfirmationCode: item.row[6],
                                CityName: item.row[7],
                                CheckInDate: item.row[8],
                                CheckOutDate: item.row[9],
                                SignIn: item.row[10],
                                ComisionTotal: comisionTotalFloat,
                                ComisionTotalReal: item.row[14],
                                Fee: item.row[16],
                                GbaI: item.row[17],
                                RecBanco: item.row[18],
                                GbaL: item.row[19],
                                ComisionDistribuir: item.row[20],
                                CommissionAmountInEuro: item.row[13],
                                CommissionAmountInOther: '',
                                TotalOtraMoneda: item.row[12],
                                isNew: isNew,
                                de_vendedor: deVendedor
                            };

                            this.comisionesList.push(newCommission);
                        },
                        (error) => {
                            console.error('Error al obtener el valor de de_vendedor:', error);
                        }
                    );
            });

            console.log("Comisiones Encontradas: ", this.comisionesList);
            this.loading = false; // Finaliza el proceso de carga
        },
        (error) => {
            console.error('Error al comparar comisiones:', error);
            Swal.fire('Error', 'Hubo un problema al comparar los datos.', 'error');
            this.loading = false; // Finaliza el proceso de carga
        }
    );
  }

  onKeyUp() {
    this.searchSubject.next(this.busqueda);
  }

  ordenarComisiones() {

  }

  eliminarComision(id: number) {

  }

  formatDate(date: string): string {
    const parsedDate = new Date(date);
    const day = String(parsedDate.getUTCDate()).padStart(2, '0');
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
    const year = parsedDate.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  formatDate1(date: string): string {
    const parsedDate = new Date(date);
    const day = String(parsedDate.getUTCDate()).padStart(2, '0');
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
    const year = parsedDate.getUTCFullYear();
    return `${year}-${month}-${day}`;
  }


  excelDateToJSDate(serial: number): string {
    const utcDays = Math.floor(serial - 25569) + 1; 
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    const day = String(dateInfo.getDate()).padStart(2, '0');
    const month = String(dateInfo.getMonth() + 1).padStart(2, '0');
    const year = dateInfo.getFullYear();
    return `${day}/${month}/${year}`;
  }

  updateSelectedComisiones() {
    // Inicializamos el array de comisiones seleccionadas
    this.selectedComisiones = [];

    // Recorremos todas las fechas de facturación para buscar las comisiones seleccionadas
    this.fechasFacturacion.forEach(fecha => {
        const comisionesSeleccionadasPorFecha = this.comisionesPorFecha[fecha]?.filter(comision => comision.selected) || [];
        
        // Agregamos las comisiones seleccionadas al array general
        this.selectedComisiones.push(...comisionesSeleccionadasPorFecha);
    });
  }

  toggleAll(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.fechasFacturacion.forEach(fecha => {
      if (this.comisionesPorFecha[fecha]) {
        this.comisionesPorFecha[fecha].forEach(comision => {
          comision.selected = isChecked;
        });
      }
    });
    this.onCheckboxChange();
  }

  // Modifica el botón de la primera tabla para que dependa solo de los checkboxes de la segunda tabla
  onCheckboxChange() {
    // Verificar si hay alguna comisión seleccionada en la tabla de comisiones agrupadas por fecha
    this.isAnyCheckboxChecked = this.fechasFacturacion.some(fecha => 
      this.comisionesPorFecha[fecha]?.some(comision => comision.selected)
    );
    
    // Actualizar el listado de comisiones seleccionadas para el botón de Excel
    this.updateSelectedComisiones();

    // Actualiza el estado del botón de la segunda tabla (si existe otra tabla que uses con comisionesList)
    this.isSecondTableCheckboxChecked = this.comisionesList.some(hotel => hotel.selected);
  }

  // Método para exportar las comisiones seleccionadas a un archivo Excel
  exportarExcelSeleccionado(): void {
    const comisionesSeleccionadas = this.selectedComisiones.filter(comision => comision.selected);
    console.log("Comisiones: ", comisionesSeleccionadas);
    if (comisionesSeleccionadas.length === 0) {
        console.error('No hay registros seleccionados.'); // Mensaje de error en la consola
        return; // No hay registros seleccionados, no hacer nada
    }

    // Extraer fechas de las comisiones seleccionadas
    const fechasFacturacion = Array.from(new Set(comisionesSeleccionadas.map(comision => this.formatDate1(comision.FechaFacturacion))));
    console.log("Fechas para pasar: ", fechasFacturacion);
    // Obtener las comisiones por fechas

    this.comisionesService.getComisionesPorFechas(fechasFacturacion).subscribe(comisiones => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Comisiones Seleccionadas');

        const headers = ['FECHA FACT.', 'CHECK IN', 'CHECK OUT', 'VENDEDOR', 'SIGN IN', 'NOMBRE', 'APELLIDO', 'CIUDAD', 'HOTEL', 'CÓDIGO', 'AMADEUS', 'RECIBIDA', 'AGENCIA', 'MONEDA', 'TARIFA', 'COMISION', 'RATEPLAN TOTAL PRICE', 'COMMISSION AMOUNT IN EURO', 'RECIBIDO EN BANCO', 'COMISION A DISTRIBUIR',];
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

        // Iterar sobre las comisiones obtenidas para agregarlas al Excel
        comisiones.forEach(comision => {
            worksheet.addRow([
                this.formatDate(comision.FechaFacturacion),
                this.formatDate(comision.CheckInDate),
                this.formatDate(comision.CheckOutDate),
                comision.de_vendedor,
                comision.SignIn,
                comision.GuestFirstName,
                comision.GuestLastName,
                comision.CityName,
                comision.HotelName,
                comision.ConfirmationCode,
                comision.ComisionTotal,
                comision.ComisionTotalReal,
                comision.AgencyName,
                comision.RateplanCurrencyCode,
                comision.TotalOtraMoneda,
                comision.CommissionAmountInEuro,
                comision.RateplanTotalPrice,
                comision.ComisionOtraMoneda,
                comision.RecBanco,
                comision.ComisionDistribuir
            ]);
        });

        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(blob, `Reporte_Comisiones_Seleccionadas.xlsx`);
        });
    }, error => {
        console.error('Error al obtener las comisiones:', error);
    });
  }

  // Método para seleccionar/deseleccionar todos los checkboxes de la segunda tabla
  toggleAllSecondTable(event: any) {
    const checked = event.target.checked;
    this.comisionesList.forEach(hotel => hotel.selected = checked);
    this.isSecondTableCheckboxChecked = checked;  // Actualiza la variable en función de la selección global
  }

  // Método para verificar los cambios en los checkboxes individuales de la segunda tabla
  onSecondTableCheckboxChange() {
    // Revisa si hay al menos una fila seleccionada en la tabla
    this.isSecondTableCheckboxChecked = this.comisionesList.some(hotel => hotel.selected);
  }  

  cancelar() {
    const fileInput: HTMLInputElement = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.comisionesList = [];
    this.faltantes = 0;
    this.errorLoadingComisiones = null;
    this.selectedFile = null;
    this.isAnyCheckboxChecked = false;
  }

  formatDateToDatabase(date: number): string {
    console.log('Input date:', date);
    if (typeof date !== 'number' || isNaN(date) || date < 0) {
        console.error('Invalid date input:', date);
        return ''; 
    }
    const baseDate = new Date(1899, 11, 30);
    const days = Math.floor(date);
    const convertedDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    if (isNaN(convertedDate.getTime())) {
        console.error('Failed to convert date:', date);
        return '';
    }
    if (convertedDate.getFullYear() < 1900 || convertedDate.getFullYear() > 2100) {
        console.error('Converted date out of valid range:', convertedDate);
        return '';
    }
    return convertedDate.toISOString().split('T')[0];
  }

  eliminarComisionesSeleccionadas() {
    const selectedCommissions: { fecha: string }[] = []; // Define el tipo correctamente
    for (const fecha of Object.keys(this.comisionesPorFecha)) {
      const comisionesPorFecha = this.comisionesPorFecha[fecha];
      const comisionesSeleccionadas = comisionesPorFecha.filter(comision => comision.selected);
      if (comisionesSeleccionadas.length > 0) {
        selectedCommissions.push({
          fecha: fecha.slice(0, 10) 
        });
      }
    }
    if (selectedCommissions.length === 0) {
      Swal.fire('Error', 'Debe seleccionar al menos una comisión para eliminar.', 'error');
      return;
    }
    const fechasAEliminar = selectedCommissions.map(com => com.fecha).join(', ');
    Swal.fire({
      title: 'Confirmación',
      text: `Está seguro que desea eliminar la comisión de: ${fechasAEliminar} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.comisionesService.eliminarComisionesPorFecha(selectedCommissions)
          .subscribe({
            next: (_response) => {
              Swal.fire('Éxito', 'Las comisiones seleccionadas han sido eliminadas y/o actualizadas.', 'success');
              // Aquí podrías agregar lógica para refrescar la tabla si es necesario
              this.cargarFechasFacturacion();
            },
            error: (_error) => {
              Swal.fire('Error', 'Hubo un problema al eliminar las comisiones.', 'error');
            }
          });
      }
    });
  }

  buscarComisiones(searchText: string = this.busqueda, estado: string = 'COB', SignIn: string = this.SignIn) {
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
      //this.cargarTodosLosRegistros();
      this.cargarFechasFacturacion();
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

  cobradas(): void {

  }
}
