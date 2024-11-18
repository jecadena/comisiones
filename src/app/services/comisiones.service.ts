import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComisionesService {
  private comisionesSubject = new BehaviorSubject<any[]>([]);
  comisiones$ = this.comisionesSubject.asObservable();
  private baseUrl = 'https://actoursapps.com.pe:3000';

  constructor(private http: HttpClient) { }

  getComisionesList(SignIn: string, estado: string): Observable<any[]> {
    const params = new HttpParams()
      .set('SignIn', SignIn)
      .set('estado', estado);
    return this.http.get<any[]>(`${this.baseUrl}/comisiones`, { params });
  }

  getComisionesListCob(SignIn: string, estado: string, fechaFacturacion: string): Observable<any[]> {
    console.log("Fecha en Método Servicio: ",fechaFacturacion);
    const params = new HttpParams()
      .set('SignIn', SignIn)
      .set('estado', estado)
      .set('fechaFacturacion', fechaFacturacion);
  
    return this.http.get<any[]>(`${this.baseUrl}/comisiones_cobradas`, { params });
  }

  getComisionesListCobradas(SignIn: string, estado: string): Observable<any[]> {
    const params = new HttpParams()
      .set('SignIn', SignIn)
      .set('estado', estado);
    return this.http.get<any[]>(`${this.baseUrl}/comisionesc`, {params});
  }

  getFechasFacturacion(): Observable<any[]> {
    const url = `${this.baseUrl}/comisiones_ordenadas`;
    return this.http.get<any[]>(url);
  }

  getComisionesPorFecha(fechaFacturacion: string): Observable<any[]> {
    const url = `${this.baseUrl}/comisiones_cobradas?fechaFacturacion=${fechaFacturacion}&estado=COB`;
    return this.http.get<any[]>(url);
  }

  getComisionesPorFechas(fechasFacturacion: string[]): Observable<any[]> {
    const queryParam = fechasFacturacion.join(',');
    return this.http.get<any[]>(`${this.baseUrl}/comisionesPorFechas/${queryParam}`);
  }

  getComisionPorFecha(fechaFacturacion: string): Observable<any> {
    console.log("Fecha en servicio: ", fechaFacturacion);
    return this.http.get(`${this.baseUrl}/comisionFecha/${fechaFacturacion}`);
  }

  getCobradasBadge(SignIn: string, rolUsuario: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/comisionesbadge?SignIn=${SignIn}&rolUsuario=${rolUsuario}`);
  }

  getComisionesListAnuladas(SignIn: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/comisionesa?SignIn=${SignIn}`);
  }

  getComisionesListPendientes(SignIn: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/comisionesp?SignIn=${SignIn}`);
  }

  getComisionesListRecibos(SignIn: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/comisionesr?SignIn=${SignIn}`);
  }

  buscarComisiones(termino: string, estado: string, SignIn: string): Observable<any[]> {
    const body = { termino, estado, SignIn };
    return this.http.post<any[]>(`${this.baseUrl}/comisiones/buscar`, body);
  }

  buscarComisionesFecha(termino: string, estado: string, SignIn: string, fechaFacturacion: string): Observable<any[]> {
    const body = { termino, estado, SignIn, fechaFacturacion };
    return this.http.post<any[]>(`${this.baseUrl}/comisiones/buscarFecha`, body);
  }

  actualizarVendedor(idsComisiones: number[], nuevoVendedor: string): Observable<any> {
    const url = `${this.baseUrl}/comisiones/update-vendedor`;
    const body = { vendedor: nuevoVendedor, ids: idsComisiones };
    return this.http.put(url, body);
  }

  getVendedoresUnicos2(fechaFacturacion: string, vendedor: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vendedor?de_vendedor=${vendedor}&fechaFacturacion=${fechaFacturacion}`);
  }

  getVendedoresUnicos1(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/vendedores`);
  }

  getVendedoresDistintos(fechaFacturacion: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/vendedoresUnicos?fechaFacturacion=${fechaFacturacion}`);
  }  
  
  obtenerTodosLosRegistros(SignIn: string, estado: string): Observable<any[]> {
    if (['CON', 'COB', 'PEN', 'REC', 'ANU'].includes(estado)) {
      return this.getComisionesList(SignIn, estado);
    } else {
      throw new Error('Estado no válido');
    }
  }

  obtenerTodosLosRegistros1(SignIn: string, estado: string, fechaFacturacion: string): Observable<any[]> {
    console.log("Fecha en Servicio: ",fechaFacturacion);
    if (['CON', 'COB', 'PEN', 'REC'].includes(estado)) {
      return this.getComisionesListCob(SignIn, estado, fechaFacturacion);
    } else {
      throw new Error('Estado no válido');
    }
  }
  
  eliminarComisiones(fechas: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/comisiones/eliminarComisiones`, { fechas });
  }

  getCountProceso(SignIn: string): Observable<number> {
    const params = new HttpParams().set('SignIn', SignIn);
    return this.http.get<number>(`${this.baseUrl}/comisiones/count/proceso`, { params });
  }

  getCountCobradas(SignIn: string): Observable<number> {
    const params = new HttpParams().set('SignIn', SignIn);
    return this.http.get<number>(`${this.baseUrl}/comisiones/count/cobradas`, { params });
  }

  getCountCobradasFecha(SignIn: string, fechaFacturacion: string): Observable<number> {
    const params = new HttpParams()
      .set('SignIn', SignIn)
      .set('fechaFacturacion', fechaFacturacion);
    return this.http.get<number>(`${this.baseUrl}/comisiones/count/cobradasFecha`, { params });
  }

  getCountAnuladas(SignIn: string): Observable<number> {
    const params = new HttpParams().set('SignIn', SignIn);
    return this.http.get<number>(`${this.baseUrl}/comisiones/count/anuladas`, { params });
  }

  getCountPendientes(SignIn: string): Observable<number> {
    const params = new HttpParams().set('SignIn', SignIn);
    return this.http.get<number>(`${this.baseUrl}/comisiones/count/pendientes`, { params });
  }

  getCountRecibos(SignIn: string): Observable<number> {
    const params = new HttpParams().set('SignIn', SignIn);
    return this.http.get<number>(`${this.baseUrl}/comisiones/count/recibos`, { params });
  }

  eliminarComisionesPorFecha(selectedCommissions: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/eliminarComisionesPorFecha`, { comisiones: selectedCommissions });
  }
  

  actualizarListaComisiones(SignIn: string): void {
    if (SignIn) {
      this.http.get<any[]>(`${this.baseUrl}/comisiones?SignIn=${SignIn}`).subscribe(
        data => {
          this.comisionesSubject.next(data);
        },
        error => {
          console.error('Error al actualizar la lista de comisiones:', error);
        }
      );
    }
  }

  getComisionesList1(signIn: string, estado: string, page: number, size: number): Observable<any> {
    const params = new HttpParams()
        .set('signIn', signIn)
        .set('estado', estado)
        .set('page', page.toString())
        .set('size', size.toString());
    
    return this.http.get<any>(`${this.baseUrl}/comisiones`, { params });
  }

  guardarComision(comision: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/guardar-comision`, comision);
  }

  getComision(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/comisioness/${id}`);
  }

  eliminarComision(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/comisiones/eliminar/${id}`);
  }

  imprimirComision(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/comisionesrec/${id}`);
  }

  actualizarComisiones(comisiones: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/comisiones/actualizar-recibo`, { comisiones });
  }

  submitRecibo(comisionData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/comisiones/generar`, comisionData);
  }

  getPNRs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pnrs`);
  }

  getCadenasHoteles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cadenas-hoteles`);
  }

  getVendedores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vendedores`);
  }

  getTipoDocumento(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tipo-documento`);
  }  

  getCiudades(): Observable<{ de_ciudad: string, de_pais: string }[]> {
    return this.http.get<{ de_ciudad: string, de_pais: string }[]>(`${this.baseUrl}/ciudades`);
  }

  getEstados(): Observable<any[]> {
    const estados = [
      { Estado: 'PEN' },
      { Estado: 'CON' },
      { Estado: 'COB' }
    ];
    return of(estados);
  }

  getHoteles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/hoteles`);
  }

  getBancos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/bancos`);
  }

  getTipoCambio(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tipo-cambio`);
  }

  getFormaPago(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/forpago`);
  }

  getCuenta(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cuenta`);
  }

  getCuentasPorBanco(idBanco: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cuenta?co_banco=${idBanco}`);
  }

  saveComision(comision: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, comision);
  }

  updateComision(comision: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${comision.id}`, comision);
  }

  getComisionesListOrdenadas(SignIn: string, estado: string, orden: string): Observable<any[]> {
    let orderQuery;
    switch (orden) {
      case 'FechaAsc':
        orderQuery = 'CheckInDate ASC';
        break;
      case 'FechaDesc':
        orderQuery = 'CheckInDate DESC';
        break;
      case 'HotelAsc':
        orderQuery = 'HotelName ASC';
        break;
      case 'HotelDesc':
        orderQuery = 'HotelName DESC';
        break;
      default:
        orderQuery = 'CheckInDate DESC';
    }
  
    const params = new HttpParams()
      .set('SignIn', SignIn)
      .set('estado', estado)
      .set('order', orderQuery);
  
    return this.http.get<any[]>(`${this.baseUrl}/api/comisiones`, { params });
  } 
}