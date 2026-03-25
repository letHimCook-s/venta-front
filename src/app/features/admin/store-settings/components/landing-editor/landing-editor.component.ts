import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LandingEditorAction,
  LandingSection,
  SectionOption
} from './models/landing-editor.types';
import { LandingConfigService } from '../../../../../core/services/landing-config.service';
import { LandingNavbarOptionsComponent } from './options/navbar/landing-navbar-options.component';
import { LandingBodyOptionsComponent } from './options/body/landing-body-options.component';
import { LandingFooterOptionsComponent } from './options/footer/landing-footer-options.component';

@Component({
  selector: 'app-landing-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LandingNavbarOptionsComponent,
    LandingBodyOptionsComponent,
    LandingFooterOptionsComponent
  ],
  templateUrl: './landing-editor.component.html',
  styleUrl: './landing-editor.component.scss'
})
export class LandingEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorCanvas', { static: true })
  canvasElement!: ElementRef<HTMLCanvasElement>;

  readonly sections: SectionOption[] = [
    { id: 'navbar', label: 'Navbar' },
    { id: 'hero', label: 'Hero / Carrusel' },
    { id: 'products', label: 'Productos y subcategorias' },
    { id: 'footer', label: 'Footer' }
  ];

  selectedSection: LandingSection = 'navbar';
  imageUrl = '';
  isBrowser = false;

  private fabricCanvas: any;
  private fabricModule: any;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly landingConfigService: LandingConfigService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    this.landingConfigService.init();
    await this.initializeCanvas();
    this.loadSection(this.selectedSection);
  }

  ngOnDestroy(): void {
    if (!this.fabricCanvas) {
      return;
    }

    this.fabricCanvas.dispose();
  }

  onSectionChange(section: string): void {
    if (!this.isLandingSection(section)) {
      return;
    }

    this.selectedSection = section;
    this.imageUrl = '';

    if (!this.fabricCanvas) {
      return;
    }

    this.loadSection(this.selectedSection);
  }

  async onAction(action: LandingEditorAction): Promise<void> {
    switch (action) {
      case 'addText':
        this.addText();
        return;
      case 'addBlock':
        this.addBlock();
        return;
      case 'addImage':
        await this.addImageByUrl();
        return;
      case 'removeSelected':
        this.removeSelected();
        return;
      case 'clearCanvas':
        this.clearCanvas();
        return;
      case 'saveSection':
        this.saveSection();
        return;
      case 'resetSection':
        this.resetSection();
        return;
      default:
        return;
    }
  }

  private addText(): void {
    if (!this.fabricCanvas || !this.fabricModule) {
      return;
    }

    const TextboxClass = this.fabricModule.Textbox ?? this.fabricModule.fabric?.Textbox;
    if (!TextboxClass) {
      return;
    }

    const text = new TextboxClass('Editar texto', {
      left: 60,
      top: 60,
      width: 260,
      fontSize: 28,
      fill: '#1e293b'
    });

    this.fabricCanvas.add(text);
    this.fabricCanvas.setActiveObject(text);
    this.fabricCanvas.requestRenderAll();
  }

  private addBlock(): void {
    if (!this.fabricCanvas || !this.fabricModule) {
      return;
    }

    const RectClass = this.fabricModule.Rect ?? this.fabricModule.fabric?.Rect;
    if (!RectClass) {
      return;
    }

    const block = new RectClass({
      left: 80,
      top: 80,
      width: 220,
      height: 120,
      rx: 12,
      ry: 12,
      fill: '#93c5fd'
    });

    this.fabricCanvas.add(block);
    this.fabricCanvas.setActiveObject(block);
    this.fabricCanvas.requestRenderAll();
  }

  private removeSelected(): void {
    if (!this.fabricCanvas) {
      return;
    }

    const active = this.fabricCanvas.getActiveObject();
    if (!active) {
      return;
    }

    this.fabricCanvas.remove(active);
    this.fabricCanvas.requestRenderAll();
  }

  private clearCanvas(): void {
    if (!this.fabricCanvas) {
      return;
    }

    this.fabricCanvas.clear();
    this.applyCanvasDefaults();
    this.fabricCanvas.requestRenderAll();
  }

  private async addImageByUrl(): Promise<void> {
    if (!this.fabricCanvas || !this.fabricModule || !this.imageUrl.trim()) {
      return;
    }

    const FabricImageClass =
      this.fabricModule.FabricImage ??
      this.fabricModule.Image ??
      this.fabricModule.fabric?.Image;

    if (!FabricImageClass?.fromURL) {
      return;
    }

    try {
      const image = await FabricImageClass.fromURL(this.imageUrl.trim(), {
        crossOrigin: 'anonymous'
      });
      image.set({ left: 100, top: 100, scaleX: 0.35, scaleY: 0.35 });
      this.fabricCanvas.add(image);
      this.fabricCanvas.setActiveObject(image);
      this.fabricCanvas.requestRenderAll();
      this.imageUrl = '';
    } catch {
      // Ignore invalid image URLs and keep the editor responsive.
    }
  }

  private saveSection(): void {
    if (!this.fabricCanvas) {
      return;
    }

    const json = this.fabricCanvas.toJSON();
    this.landingConfigService.saveSection(this.selectedSection, json);
  }

  private resetSection(): void {
    this.landingConfigService.resetSection(this.selectedSection);
    this.loadSection(this.selectedSection);
  }

  private async initializeCanvas(): Promise<void> {
    this.fabricModule = await import('fabric');
    const CanvasClass = this.fabricModule.Canvas ?? this.fabricModule.fabric?.Canvas;

    if (!CanvasClass) {
      return;
    }

    this.fabricCanvas = new CanvasClass(this.canvasElement.nativeElement, {
      width: 1080,
      height: 520,
      backgroundColor: '#f8fafc',
      preserveObjectStacking: true
    });

    this.applyCanvasDefaults();
    this.fabricCanvas.requestRenderAll();
  }

  private loadSection(section: LandingSection): void {
    if (!this.fabricCanvas) {
      return;
    }

    const sectionConfig = this.landingConfigService.getSectionConfig(section);
    const raw = sectionConfig?.fabricJson;

    if (!raw) {
      this.loadDefaultTemplate(section);
      return;
    }

    this.fabricCanvas.loadFromJSON(raw, () => {
      this.applyCanvasDefaults();
      this.fabricCanvas.requestRenderAll();
    });
  }

  private loadDefaultTemplate(section: LandingSection): void {
    this.clearCanvas();

    switch (section) {
      case 'navbar':
        this.addTemplateText('Navbar: logo, links, carrito, CTA', 36, 44, 40);
        this.addTemplateText('Home   Catalogo   Ofertas   Contacto', 42, 118, 28, '#334155');
        break;
      case 'hero':
        this.addTemplateText('Hero / Carrusel principal', 42, 44, 40);
        this.addTemplateText('Banner editable, textos, botones, imagenes', 42, 118, 28, '#334155');
        break;
      case 'products':
        this.addTemplateText('Productos destacados y subcategorias', 42, 44, 40);
        this.addTemplateText('Grid de productos, filtros, cards, badges', 42, 118, 28, '#334155');
        break;
      case 'footer':
        this.addTemplateText('Footer', 42, 44, 40);
        this.addTemplateText('Redes, metodos de pago, contacto, legal', 42, 118, 28, '#334155');
        break;
      default:
        this.addTemplateText('Landing editor', 42, 44, 40);
        break;
    }
  }

  private addTemplateText(
    value: string,
    left: number,
    top: number,
    fontSize: number,
    fill = '#0f172a'
  ): void {
    if (!this.fabricCanvas || !this.fabricModule) {
      return;
    }

    const TextboxClass = this.fabricModule.Textbox ?? this.fabricModule.fabric?.Textbox;
    if (!TextboxClass) {
      return;
    }

    this.fabricCanvas.add(
      new TextboxClass(value, {
        left,
        top,
        width: 860,
        fontSize,
        fill
      })
    );
  }

  private applyCanvasDefaults(): void {
    if (!this.fabricCanvas) {
      return;
    }

    this.fabricCanvas.backgroundColor = '#f8fafc';
  }
  private isLandingSection(value: string): value is LandingSection {
    return value === 'navbar' || value === 'hero' || value === 'products' || value === 'footer';
  }
}