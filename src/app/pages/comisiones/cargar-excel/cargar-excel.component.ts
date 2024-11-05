import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-cargar-excel',
  templateUrl: './cargar-excel.component.html',
  styleUrls: ['./cargar-excel.component.scss']
})

export class CargarExcelComponent implements OnInit{
  usuarioDatos: any;
  isAdmin: boolean = false;
  excelData: any[] = [];
  fileName: string = '';
  Estado: string = 'sell';
  showSuccessMessage: boolean = false;
  cargando: boolean = false;
  isLoading = false;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.authService.usuarioDatos$.subscribe(datos => {
      this.usuarioDatos = datos;
      const co_role = this.usuarioDatos?.co_role?.trim();
      console.log('Datos del usuario:', this.usuarioDatos);
      this.isAdmin = co_role === 'ADMIN';
    });
  }

  onFileChange(event: any) {
    this.showSuccessMessage = false;
    const target: DataTransfer = <DataTransfer>(event.target);

    if (target.files.length !== 1) {
      console.error('No se puede usar múltiples archivos');
      return;
    }

    this.fileName = target.files[0].name;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const binaryString: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(binaryString, { type: 'binary' });

      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      this.procesarDatosExcel(data);
    };

    reader.readAsBinaryString(target.files[0]);
  }

  procesarDatosExcel(data: any) {
    this.excelData = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row) {
        let confirmationCode = row[7];

        if (typeof confirmationCode === 'string' && confirmationCode.startsWith("'")) {
          confirmationCode = confirmationCode.slice(1);
        }

        if (!confirmationCode) {
          confirmationCode = '---'; 
        }

        this.excelData.push({
          hotel: row[8],
          pasajero: this.normalizeTextToSentenceCase(row[5] + ' ' + row[6]),
          confirmationCode: confirmationCode,
          ciudad: row[10],
          checkIn: this.convertDateToSQLFormat(this.excelDateToJSDate(row[15])),
          checkOut: this.convertDateToSQLFormat(this.excelDateToJSDate(row[16])),
          vendedor: this.normalizeTextToSentenceCase(row[4]),
          comisionUsd: row[27],
          rawData: row
        });
      }
    }
}

  verificarArchivo() {
    return this.http.post<{ exists: boolean }>('http://localhost:3000/verificarArchivo', { nombreArchivo: this.fileName });
  }

  verificarConfirmationCode(confirmationCode: string) {
    return this.http.post<{ exists: boolean }>('http://localhost:3000/verificarConfirmationCode', { confirmationCode });
  }

  cargarComisiones() {
    this.cargando = true;
    this.showSuccessMessage = false;

    this.verificarArchivo().subscribe(response => {
      if (response.exists) {
        Swal.fire({
          icon: 'warning',
          title: 'Archivo ya cargado',
          text: 'Este archivo ya ha sido cargado a la base de datos.',
        });
      } else {
        const confirmationCode = this.excelData.length > 0 ? this.excelData[0].confirmationCode : '';

        if (confirmationCode) {
          this.verificarConfirmationCode(confirmationCode).subscribe(codeResponse => {
            console.log(confirmationCode);
            if (codeResponse.exists) {
              Swal.fire({
                icon: 'warning',
                title: 'ConfirmationCode duplicado',
                text: 'Los registros de este archivo ya existen en la base de datos.',
              });
              this.cargando = false;
            } else {
              this.mostrarToastCargando(); 
              this.enviarComisiones();
            }
          }, error => {
            console.error('Error al verificar el ConfirmationCode:', error);
            this.cerrarToast(); 
          });
        } else {
          this.cerrarToast(); 
        }
      }
    }, error => {
      console.error('Error al verificar el archivo:', error);
      this.cerrarToast(); 
    });
}

  cerrarToast() {
    Swal.close();
  }

  mostrarAlertaCargaExitosa() {
    Swal.fire({
      icon: 'success',
      title: 'Carga completada',
      text: 'Se han cargado todos los registros a la base de datos.',
      timer: 3000,
      showConfirmButton: false
    });
  }

  mostrarToastCargando() {
    Swal.fire({
      title: 'Cargando registros...',
      html: '<div id="progress-bar-container"><div id="progress-bar" style="width: 0%;"></div></div><div id="progress-percentage">0%</div>',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
        this.updateProgressBar(0);
      },
      didClose: () => {
      }
    });
  }

  updateProgressBar(percentage: number) {
    const progressBar = document.getElementById('progress-bar') as HTMLElement;
    const progressPercentage = document.getElementById('progress-percentage') as HTMLElement;

    if (progressBar && progressPercentage) {
      progressBar.style.width = `${percentage}%`;
      progressPercentage.textContent = `${percentage}%`;
    }
  }

  enviarComisiones() {
    let registrosCargados = 0;
    const totalRegistros = this.excelData.length -3;

    console.log("Registros: ", totalRegistros);
  
    this.cargando = true;
    this.mostrarToastCargando(); 

    this.excelData.forEach((rowData, index) => {
      console.log("ConfirmationCode: ", rowData[6]);
      const signInValue = rowData.rawData[4];
      const modifiedSignIn = signInValue.substring(4, signInValue.length - 2);
      
      const rateplanTotalPrice = parseFloat(rowData.rawData[20]);
      const commissionAmountInEuro = parseFloat(rowData.rawData[26]);
  
      const porComision = rateplanTotalPrice > 0 ? (commissionAmountInEuro / rateplanTotalPrice) * 100 : 0;
  
      const requestData = {
        GuestFirstName: rowData.rawData[5],
        GuestLastName: rowData.rawData[6],
        FechaCreacion: this.convertDateToSQLFormat(this.excelDateToJSDate(rowData.rawData[0])),
        OfficeID: rowData.rawData[1],
        OfficeName: rowData.rawData[2],
        IataNumber: rowData.rawData[3],
        SignIn: modifiedSignIn,
        ConfirmationCode: rowData.rawData[7],
        HotelName: rowData.rawData[8],
        HotelCityCode: rowData.rawData[9],
        CityName: rowData.rawData[10],
        HotelCountryCode: rowData.rawData[11],
        HotelCountry: rowData.rawData[12],
        ChainCode: rowData.rawData[13],
        HotelChainName: rowData.rawData[14],
        CheckInDate: rowData.checkIn,
        CheckOutDate: rowData.checkOut,
        NumberOfNights: rowData.rawData[17],
        RoomType: rowData.rawData[19],
        RateCode: rowData.rawData[18],
        RateplanTotalPrice: rowData.rawData[20],
        TotalOtraMoneda: rowData.rawData[20],
        RateplanCurrencyCode: rowData.rawData[21],
        StatusComision: rowData.rawData[22],
        NumberOfBooking: rowData.rawData[23],
        NumberOfCancel: rowData.rawData[24],
        IsCommisionable: rowData.rawData[25],
        CommissionAmountInEuro: rowData.rawData[26],
        ComisionOtraMoneda: rowData.rawData[26],
        ComisionTotal: rowData.rawData[27],
        PorComision: porComision,
        Estado: this.Estado,
        NombreArchivo: this.fileName
      };
  
      this.http.post('http://localhost:3000/agregarcomisiones', { data: requestData })
        .subscribe({
          next: (response: any) => {
            registrosCargados++;
            const progressPercentage = Math.round((registrosCargados / totalRegistros) * 100);
            this.updateProgressBar(progressPercentage);
  
            if (registrosCargados === totalRegistros) {
              Swal.close();
              this.limpiarFormulario();
              this.mostrarAlertaCargaExitosa();
              this.showSuccessMessage = true;
              this.cargando = false; 
            }
          },
          error: (error) => {
            console.error('Error al enviar la fila:', error);
            if (index === totalRegistros - 1) {
              Swal.close();
              this.cargando = false; 
            }
          }
        });
    });
  }

  limpiarFormulario() {
    this.excelData = [];
    this.fileName = '';

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  excelDateToJSDate(serial: number): string {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    const day = ('0' + date_info.getUTCDate()).slice(-2);
    const month = ('0' + (date_info.getUTCMonth() + 1)).slice(-2);
    const year = date_info.getUTCFullYear();

    return `${day}/${month}/${year}`;
  }

  normalizeTextToSentenceCase(text: string): string {
    if (!text) return '';

    return text
      .toLowerCase()
      .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  }

  convertDateToSQLFormat(date: string): string {
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  }
}
