import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    this.errorMessage = '';
    const result = this.authService.login(this.username, this.password);

    if (!result.success || !result.role) {
      this.errorMessage = result.message ?? 'No se pudo iniciar sesion.';
      return;
    }

    this.router.navigateByUrl('/tienda');
  }

  goToRegister(): void {
    this.router.navigateByUrl('/auth/register');
  }
}
