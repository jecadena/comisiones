import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://actoursapps.com.pe:8080/comision/oauth/token'; // URL del servicio
  private usuarioDatosSubject = new BehaviorSubject<any>(null);  // Para almacenar los datos de usuario
  public usuarioDatos$ = this.usuarioDatosSubject.asObservable(); // Para suscribirse desde otros componentes

  constructor(private http: HttpClient, private router: Router) {
    const savedUserData = this.getUserData();
    if (savedUserData) {
      this.usuarioDatosSubject.next(savedUserData); // Cargar datos de localStorage al iniciar
    }
  }

  login(usuario: string, contrasena: string): void {
    const credentials = btoa('angularapp:12345'); 
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    });

    const body = new HttpParams()
      .set('username', usuario)
      .set('password', contrasena)
      .set('grant_type', 'password');

    this.http.post<any>(this.baseUrl, body.toString(), { headers }).pipe(
      tap((response) => {
        localStorage.setItem('token', response.access_token);
        this.setUserData(response); // Guardar datos de usuario
        this.router.navigate(['/comisiones/confirmadas']);
      }),
      catchError(error => {
        let errorMessage = 'Error desconocido';
        if (error.status === 401) {
          errorMessage = 'Credenciales incorrectas';
        }
        Swal.fire({
          icon: 'error',
          title: 'Error al iniciar sesión',
          text: errorMessage,
        });
        return throwError(error);
      })
    ).subscribe();
  }

  // Método para obtener los datos de usuario
  obtenerDatosUsuario() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    return this.http.get<any>(this.baseUrl, { headers });
  }

  getUserData() {
    return JSON.parse(localStorage.getItem('userData') || '{}');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    this.usuarioDatosSubject.next(null);
    this.router.navigate(['/']);
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  setUserData(userData: any) {
    const userInfo = {
      nombre: userData.de_nom_solicitante,
      apellido: userData.de_pat_solicitante,
      co_maestro: userData.co_maestro,
      co_tip_maestro: userData.co_tip_maestro,
      co_counter: userData.co_counter,
      co_solicitante: userData.co_solicitante,
      de_nom_solicitante: userData.de_nom_solicitante,
      de_pat_solicitante: userData.de_pat_solicitante,
      info_adicional: userData.info_adicional,
      de_img: userData.de_img,
      co_role: userData.co_role
    };
    localStorage.setItem('userData', JSON.stringify(userInfo));
    this.usuarioDatosSubject.next(userInfo); // Emitir los datos para que los otros componentes escuchen
  }
}
