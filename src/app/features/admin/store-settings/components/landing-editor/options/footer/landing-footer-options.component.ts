import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { LandingEditorAction } from '../../models/landing-editor.types';

@Component({
  selector: 'app-landing-footer-options',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-footer-options.component.html',
  styleUrl: './landing-footer-options.component.scss'
})
export class LandingFooterOptionsComponent {
  @Output() action = new EventEmitter<LandingEditorAction>();

  emit(action: LandingEditorAction): void {
    this.action.emit(action);
  }
}