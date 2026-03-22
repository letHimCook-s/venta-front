# Estructura Frontend Monolito por Features (Angular)

Esta estructura organiza una sola aplicacion (monolito) bajo `features`, con modulos `admin` y `user`.

## Arbol principal

```text
src/app/
  core/
    guards/
    interceptors/
    models/
    services/

  shared/
    components/
    directives/
    pipes/
    ui/

  layout/
    admin/       (shell del panel administrativo)
    auth/        (shell de login/registro)
    shell/       (shell comun si se requiere)
    storefront/  (shell de la tienda publica)

  features/
    auth/
      login/
        components/
        pages/
      register/
        components/
        pages/
      services/

    admin/
      dashboard/
        components/
        pages/
      products/
        components/
        models/
        pages/
        services/
      categories/
        components/
        pages/
        services/
      attributes/
        components/
        pages/
        services/
      offers/
        components/
        pages/
        services/
      store-settings/
        components/
        pages/
        services/

    user/
      home/
        components/
        pages/
      catalog/
        components/
        pages/
        services/
      product-detail/
        components/
        pages/
      filters/
        components/
      search/
        components/
        services/
      offers/
        components/
      cart/
        components/
        pages/
        services/
      checkout-whatsapp/
        components/
        pages/
        services/
      direct-buy/
        components/
        services/
```

## Mapeo RF -> feature/modulo

- RF-00 (acceso): features/auth/login y features/auth/register

- RF-01, RF-02, RF-03, RF-04, RF-05, RF-09: features/admin/products
- RF-06: features/admin/categories
- RF-07, RF-08: features/admin/attributes
- RF-21, RF-22: features/admin/store-settings
- RF-23: features/admin/offers
- RF-10, RF-12: features/user/catalog
- RF-11: features/user/product-detail
- RF-13, RF-14: features/user/filters
- RF-15: features/user/search
- RF-16, RF-17, RF-18: features/user/cart
- RF-19: features/user/checkout-whatsapp
- RF-20: features/user/direct-buy
- RF-24: features/user/offers

## Convenciones recomendadas

- layout/: estructura visual y navegacion por contexto (admin, tienda, auth).
- pages/: contenedores de ruta por feature.
- components/: UI reutilizable dentro de la feature.
- services/: acceso a API y logica de integracion.
- models/: interfaces/tipos del dominio.

Regla aplicada: cada modulo feature tiene carpeta components/ para mantener consistencia.

Para carpetas visuales (pages/components), usa este patron:

- nombre.page.ts o nombre.component.ts (logica)
- nombre.page.html o nombre.component.html (plantilla)
- nombre.page.scss o nombre.component.scss (estilos)

Nota: en Angular se usa TypeScript en lugar de JavaScript plano.

## Nota de enrutado

Se recomienda usar prefijos de ruta por contexto:

- /admin/... para el panel administrativo
- /tienda/... para la experiencia del usuario
- /auth/login y /auth/register para autenticacion
