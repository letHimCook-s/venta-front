import { LandingSection } from '../../../../../../core/models/landing-config.model';

export type { LandingSection };

export type LandingEditorAction =
  | 'addText'
  | 'addBlock'
  | 'addImage'
  | 'removeSelected'
  | 'clearCanvas'
  | 'saveSection'
  | 'resetSection';

export interface SectionOption {
  id: LandingSection;
  label: string;
}