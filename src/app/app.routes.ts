import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from './features/auth/services/auth.service';

const adminAccessGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);

	if (authService.isAdmin()) {
		return true;
	}

	return router.createUrlTree(['/auth/login']);
};

const guestOnlyGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);
	const session = authService.getSession();

	if (!session) {
		return true;
	}

	return router.createUrlTree([session.role === 'admin' ? '/admin/dashboard' : '/tienda']);
};

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'tienda'
	},
	{
		path: 'admin',
		canActivate: [adminAccessGuard],
		loadComponent: () =>
			import('./layout/admin/admin-layout.component').then(
				(m) => m.AdminLayoutComponent
			),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'dashboard'
			},
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./features/admin/dashboard/pages/dashboard.page').then(
						(m) => m.AdminDashboardPage
					)
			},
			{
				path: 'products',
				loadComponent: () =>
					import('./features/admin/products/pages/products.page').then(
						(m) => m.AdminProductsPage
					)
			},
			{
				path: 'categories',
				loadComponent: () =>
					import('./features/admin/categories/pages/categories.page').then(
						(m) => m.AdminCategoriesPage
					)
			},
			{
				path: 'attributes',
				loadComponent: () =>
					import('./features/admin/attributes/pages/attributes.page').then(
						(m) => m.AdminAttributesPage
					)
			},
			{
				path: 'offers',
				loadComponent: () =>
					import('./features/admin/offers/pages/offers.page').then(
						(m) => m.AdminOffersPage
					)
			},
			{
				path: 'store-settings',
				loadComponent: () =>
					import('./features/admin/store-settings/pages/store-settings.page').then(
						(m) => m.AdminStoreSettingsPage
					)
			}
		]
	},
	{
		path: 'tienda',
		loadComponent: () =>
			import('./layout/storefront/storefront-layout.component').then(
				(m) => m.StorefrontLayoutComponent
			),
		children: [
			{
				path: '',
				pathMatch: 'full',
				loadComponent: () =>
					import('./features/user/home/pages/home.page').then((m) => m.UserHomePage)
			},
			{
				path: 'catalogo',
				loadComponent: () =>
					import('./features/user/catalog/pages/catalog.page').then(
						(m) => m.UserCatalogPage
					)
			},
			{
				path: 'producto/:id',
				loadComponent: () =>
					import('./features/user/product-detail/pages/product-detail.page').then(
						(m) => m.UserProductDetailPage
					)
			},
			{
				path: 'carrito',
				loadComponent: () =>
					import('./features/user/cart/pages/cart.page').then((m) => m.UserCartPage)
			},
			{
				path: 'checkout-whatsapp',
				loadComponent: () =>
					import(
						'./features/user/checkout-whatsapp/pages/checkout-whatsapp.page'
					).then((m) => m.UserCheckoutWhatsappPage)
			}
		]
	},
	{
		path: 'auth',
		canActivate: [guestOnlyGuard],
		loadComponent: () =>
			import('./layout/auth/auth-layout.component').then(
				(m) => m.AuthLayoutComponent
			),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'login'
			},
			{
				path: 'login',
				loadComponent: () =>
					import('./features/auth/login/pages/login.page').then(
						(m) => m.LoginPage
					)
			},
			{
				path: 'register',
				loadComponent: () =>
					import('./features/auth/register/pages/register.page').then(
						(m) => m.RegisterPage
					)
			}
		]
	},
	{
		path: '**',
		redirectTo: 'tienda'
	}
];
