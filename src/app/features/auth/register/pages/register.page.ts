import { Component } from '@angular/core';
import { RegisterFormComponent } from '../components/register-form.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RegisterFormComponent],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {}
