import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import {
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  gridOutline,
  giftOutline,
  logOutOutline,
  menuOutline,
  optionsOutline,
  pricetagOutline,
  settingsOutline,
  speedometerOutline,
  storefrontOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  isSidebarCollapsed = false;
  sectionState = {
    navegacion: true,
    catalogo: true,
    landing: true
  };
  icons = {
    menu: menuOutline,
    chevronBack: chevronBackOutline,
    chevronDown: chevronDownOutline,
    chevronForward: chevronForwardOutline,
    tienda: storefrontOutline,
    dashboard: speedometerOutline,
    productos: pricetagOutline,
    categorias: gridOutline,
    atributos: optionsOutline,
    ofertas: giftOutline,
    landing: settingsOutline,
    logout: logOutOutline
  };

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleSection(section: keyof typeof this.sectionState): void {
    this.sectionState[section] = !this.sectionState[section];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
