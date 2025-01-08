/*import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AmadeusService } from '../../../services/amadeus.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;

  nombreUsuario: string = '';
  imagenUsuario: string = '';
  coCounter: string = '';
  coMaestro: string = '';
  coSolicitante: string = '';
  coTipMaestro: string = '';
  deNomSolicitante: string = '';
  dePatSolicitante: string = '';
  infoAdicional: string = '';
  de_img: string = '';

  constructor(public dialog: MatDialog, private authService: AuthService, private router: Router, private amadeusService: AmadeusService) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        this.nombreUsuario = userData.nombre;
        console.log(this.nombreUsuario);
        this.imagenUsuario = userData.fechaIngreso;
        this.coCounter = userData.co_counter;
        this.coMaestro = userData.co_maestro;
        this.coSolicitante = userData.co_solicitante;
        this.coTipMaestro = userData.co_tip_maestro;
        this.deNomSolicitante = userData.de_nom_solicitante;
        this.dePatSolicitante = userData.de_pat_solicitante;
        this.de_img = userData.de_img;
        this.infoAdicional = userData.info_adicional;
      }
      this.authService.usuarioDatos$.subscribe(datosUsuario => {
        if (datosUsuario && datosUsuario.nombre) {
          this.nombreUsuario = datosUsuario.nombre;
          this.imagenUsuario = datosUsuario.fechaIngreso;
          this.coCounter = datosUsuario.co_counter;
          this.coMaestro = datosUsuario.co_maestro;
          this.coSolicitante = datosUsuario.co_solicitante;
          this.coTipMaestro = datosUsuario.co_tip_maestro;
          this.deNomSolicitante = datosUsuario.de_nom_solicitante;
          this.dePatSolicitante = datosUsuario.de_pat_solicitante;
          this.de_img = datosUsuario.de_img;
          this.infoAdicional = datosUsuario.info_adicional;
        }
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}*/

import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
  OnInit
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AmadeusService } from '../../../services/amadeus.service';

interface UserData {
  nombre?: string;
  apellido?: string;
  co_maestro?: string;
  co_tip_maestro?: string;
  co_counter?: string;
  co_solicitante?: string;
  de_nom_solicitante?: string;
  de_pat_solicitante?: string;
  info_adicional?: string;
  de_img?: string;
  [key: string]: any;
}


@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class HeaderComponent implements OnInit {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  nombreUsuario: string = '';
  dePatSolicitante: string = '';
  de_img: string = '';
  coCounter: string = '';
  coMaestro: string = '';
  coSolicitante: string = '';
  coTipMaestro: string = '';
  infoAdicional: string = '';

  constructor(
    public dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private amadeusService: AmadeusService
  ) {}

  ngOnInit(): void {

    this.authService.usuarioDatos$.subscribe(datosUsuario => {
      if (datosUsuario && Object.keys(datosUsuario).length > 0) {
        this.setUserData(datosUsuario);
      } else {
        this.actualizarDatosLocalStorage();
      }
    });

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  private setUserData(datosUsuario: UserData) {
    this.nombreUsuario = datosUsuario.de_nom_solicitante || '';
    this.dePatSolicitante = datosUsuario.de_pat_solicitante || '';
    this.de_img = datosUsuario.de_img || '';
    this.coCounter = datosUsuario.co_counter || '';
    this.coMaestro = datosUsuario.co_maestro || '';
    this.coSolicitante = datosUsuario.co_solicitante || '';
    this.coTipMaestro = datosUsuario.co_tip_maestro || '';
    this.infoAdicional = datosUsuario.info_adicional || '';
  }
  
  private actualizarDatosLocalStorage() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      if (userData) {
        this.setUserData(userData);
      }
    }
  }

  logout() {
    this.authService.logout();
  }
}