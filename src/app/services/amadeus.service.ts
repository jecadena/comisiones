import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AmadeusService {
  private amadeusSubject = new BehaviorSubject<any[]>([]);
  amadeus$ = this.amadeusSubject.asObservable();
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  getAmadeusList(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.baseUrl}/amadeus`, { headers });
  }

  buscarAmadeus(termino: string): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any[]>(`${this.baseUrl}/amadeus/buscar/${termino}`, {}, { headers });
  }

  buscarAmadeusLista(termino: string): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any[]>(`${this.baseUrl}/amadeus/buscar-por-agencia/${termino}`, {}, { headers });
  }

  obtenerUsuarios(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.baseUrl}/amadeus/buscar-por-counter`, { headers });
  }
  
  getAgencias(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.baseUrl}/agencias`, { headers });
  }

  actualizarListaAmadeus(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(`${this.baseUrl}/amadeus`, { headers }).subscribe(
      data => {
        this.amadeusSubject.next(data);
      },
      error => {
        console.error('Error al actualizar la lista de registros:', error);
      }
    );
  }
}
