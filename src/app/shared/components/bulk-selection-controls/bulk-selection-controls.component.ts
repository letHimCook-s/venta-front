import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-bulk-selection-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-selection-controls.component.html',
  styleUrl: './bulk-selection-controls.component.scss'
})
export class BulkSelectionControlsComponent {
  @Input() selectedCount = 0;
  @Input() totalCount = 0;
  @Input() allSelected = false;

  @Output() selectAllToggle = new EventEmitter<boolean>();
  @Output() clearSelection = new EventEmitter<void>();
  @Output() deleteSelected = new EventEmitter<void>();
}
