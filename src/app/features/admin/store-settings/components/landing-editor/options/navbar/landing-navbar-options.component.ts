import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LandingEditorAction } from '../../models/landing-editor.types';

@Component({
  selector: 'app-landing-navbar-options',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-navbar-options.component.html',
  styleUrl: './landing-navbar-options.component.scss'
})
export class LandingNavbarOptionsComponent {
  @Input() imageUrl = '';

  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() action = new EventEmitter<LandingEditorAction>();

  onImageUrlChange(value: string): void {
    this.imageUrlChange.emit(value);
  }

  emit(action: LandingEditorAction): void {
    this.action.emit(action);
  }
}