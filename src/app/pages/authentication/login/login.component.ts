/*import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class AppSideLoginComponent {
  idusuario: string = '';
  usuario: string = '';
  contrasena: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  async login() {
    if (!this.usuario || !this.contrasena) {
      await Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: 'Ambos campos son obligatorios. Por favor, llénelos y luego intente de nuevo.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
  
    try {
      await this.authService.login(this.idusuario, this.usuario, this.contrasena);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      await Swal.fire({});
      this.idusuario = '';
      this.usuario = '';
      this.contrasena = '';
    }
  }
}




import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class AppSideLoginComponent {
  usuario: string = '';
  contrasena: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  async login() {
    if (!this.usuario || !this.contrasena) {
      await Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: 'Ambos campos son obligatorios. Por favor, llénelos y luego intente de nuevo.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
  
    try {
      this.authService.login(this.usuario, this.contrasena);
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al iniciar sesión',
        text: 'Hubo un problema al iniciar sesión. Por favor, intente de nuevo.',
        confirmButtonText: 'Aceptar'
      });
      this.usuario = '';
      this.contrasena = '';
    }
  }
}
*/

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class AppSideLoginComponent {
  usuario: string = '';
  contrasena: string = '';
  loading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  async login() {
    if (!this.usuario || !this.contrasena) {
      await Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: 'Ambos campos son obligatorios. Por favor, llénelos y luego intente de nuevo.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.loading = true; 

    try {
      await this.authService.login(this.usuario, this.contrasena);
      this.router.navigate(['/comisiones/confirmadas']);
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al iniciar sesión',
        text: 'Hubo un problema al iniciar sesión. Por favor, intente de nuevo.',
        confirmButtonText: 'Aceptar'
      });
      this.usuario = '';
      this.contrasena = '';
    } finally {
      this.loading = false;
    }
  }
}
