import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LandingSection } from '../../../../core/models/landing-config.model';
import { LandingConfigService } from '../../../../core/services/landing-config.service';

interface SectionStatus {
  id: LandingSection;
  label: string;
  customized: boolean;
}

@Component({
  selector: 'app-user-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class UserHomePage implements OnInit, OnDestroy {
  sectionStatus: SectionStatus[] = [];

  private configSub?: Subscription;

  constructor(private readonly landingConfigService: LandingConfigService) {}

  ngOnInit(): void {
    this.landingConfigService.init();
    this.refreshStatus();

    this.configSub = this.landingConfigService.config$.subscribe(() => {
      this.refreshStatus();
    });
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  private refreshStatus(): void {
    this.sectionStatus = [
      {
        id: 'navbar',
        label: 'Navbar',
        customized: this.landingConfigService.hasCustomContent('navbar')
      },
      {
        id: 'hero',
        label: 'Hero / Carrusel',
        customized: this.landingConfigService.hasCustomContent('hero')
      },
      {
        id: 'products',
        label: 'Productos / Subcategorias',
        customized: this.landingConfigService.hasCustomContent('products')
      },
      {
        id: 'footer',
        label: 'Footer',
        customized: this.landingConfigService.hasCustomContent('footer')
      }
    ];
  }
}
