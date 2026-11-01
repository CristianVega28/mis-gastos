# Mis Gastos

App multiplataforma (iOS, Android y web) para administrar los gastos del mes, asignar a cada persona la parte que le corresponde y llevar las deudas que otros tienen contigo (y las tuyas). Cada usuario tiene su cuenta y sus datos viven en una **API propia (Go + PostgreSQL)**, así que se ven iguales en el celular y en la web.

## Funcionalidades

- **Inicio:** total del mes con variación respecto al mes anterior, lo que te deben y lo que debes, gráfico por categoría, gasto por persona, últimos 6 meses y movimientos recientes.
- **Gastos:** lista por día, búsqueda, filtro por categoría y cambio de mes. Cada gasto se reparte entre personas en partes iguales o con montos a mano.
- **Cuentas:** banco, tarjeta de crédito, efectivo o ahorro. Cada gasto elige de qué cuenta se descuenta (se sugiere la última usada) y el formulario muestra cuánto quedará. El detalle de la cuenta lista los movimientos con el saldo después de cada uno, y permite agregar dinero o pagar la tarjeta.
- **Gastos recurrentes:** se marca un gasto como mensual y luego se copia al mes siguiente con un toque.
- **Cronograma de pagos:** lo que pagas cada mes en un día fijo (arriendo, internet, tarjeta), agrupado en 1ª quincena (1–15) y 2ª quincena (16–fin), con total, pagado, pendiente y avisos de atraso. Marcar un pago lo registra como gasto del mes en su cuenta; desmarcarlo borra ese gasto. Se abre desde Inicio ("Pagos del mes") o Ajustes.
- **Personas:** saldo de cada una (gastos por cobrar más préstamos menos lo que tú le debes). Puedes marcar partes como pagadas, elegir personas desde los contactos y compartir un resumen como imagen.
- **Deudas:** "me deben" y "debo", con abonos parciales, saldar todo, fecha de vencimiento y recordatorio con notificación local.
- **Cuenta:** registro e inicio de sesión con correo y contraseña. Cada usuario ve solo sus datos.
- **Ajustes:** tema (sistema, claro u oscuro), moneda (CLP, PEN, ARS, MXN, COP, USD, EUR), categorías, bloqueo con Face ID o huella, respaldo en JSON (exportar y restaurar) y exportación del mes a CSV.

### Vista app y vista web

|                        | App (iOS/Android) y web angosta    | Web de escritorio (≥ 960 px)  |
| ---------------------- | ---------------------------------- | ----------------------------- |
| Navegación             | Tab bar flotante con efecto vidrio | Barra lateral                 |
| Inicio                 | Una columna                        | Dashboard en dos columnas     |
| Formularios y detalles | Hoja modal nativa o pantalla       | Diálogo centrado sobre la app |
| Listas                 | Una columna                        | Grilla de dos columnas        |

La lógica está en `src/lib/layout.ts` (`useIsDesktop`) y `src/components/modal-frame.tsx`.

## Stack

| Área            | Tecnología                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Expo SDK 58, React Native 0.88, React 19, TypeScript                                                                                                                |
| Navegación      | Expo Router (rutas por archivo en `src/app`)                                                                                                                        |
| Datos           | API REST propia (proyecto aparte, `mis-gastos-api`), sin base local. Solo online                                                                                    |
| Estado de UI    | Zustand (ajustes y sesión; kv-store / llavero del sistema en nativo, `localStorage` en web)                                                                         |
| Formularios     | React Hook Form + Zod                                                                                                                                               |
| Estilos         | Uniwind (Tailwind CSS 4 para React Native) + `tailwind-merge`                                                                                                       |
| Animaciones     | Reanimated 4                                                                                                                                                        |
| Listas          | FlashList 2                                                                                                                                                         |
| Gráficos        | SVG propio (`react-native-svg`)                                                                                                                                     |
| Íconos y fuente | `lucide-react-native` e Inter                                                                                                                                       |
| Nativo          | expo-haptics, expo-blur, expo-local-authentication, expo-notifications, expo-contacts, expo-sharing, expo-file-system, expo-document-picker, react-native-view-shot |

Los montos se guardan como **enteros en centavos** (`amount_cents`) para evitar errores de redondeo. Las fechas viajan como `YYYY-MM-DD` en la hora local del usuario: el servidor nunca decide qué día es "hoy".

## Estructura

```
src/
  app/                 Rutas (Expo Router)
    login.tsx          Entrar / crear cuenta (sin sesión)
    (tabs)/            Inicio, Gastos, Personas, Deudas, Ajustes
    gasto.tsx          Crear o editar gasto (modal)
    cronograma.tsx     Pagos del mes por quincena
    *-form.tsx         Formularios (modal)
  components/          UI (ui/, charts/, forms/), tab bar, barra lateral
  db/
    types.ts           Entidades que devuelve la API
    queries.ts         Hooks de lectura (useLive)
    mutations.ts       Escrituras (recargan las consultas al terminar)
    use-live.ts        Recarga tras cada escritura y al volver a la app
  lib/
    api.ts             Cliente HTTP y URL de la API
    storage*.ts        Almacenamiento local por plataforma
  store/               Zustand (sesión, ajustes y mes seleccionado)
deploy/                Caddyfile, Dockerfile y script para compilar la web
```

## Desarrollo

La API es un proyecto independiente (`mis-gastos-api`, Go + PostgreSQL); sigue su README para levantarla en `http://localhost:8080`.

```bash
npm install
npx expo start            # i = iOS, a = Android, w = web
```

En desarrollo la app busca la API en el **mismo host que el servidor de Expo, puerto 8080**, así que funciona en el simulador, en la web y en un celular de tu red. Para otra URL define `EXPO_PUBLIC_API_URL` (por ejemplo, en `.env.local`).

```bash
npm run typecheck         # tsc --noEmit
npm run lint              # expo lint
npx expo-doctor
```

### Probar en el celular

La mayoría de las funciones andan en **Expo Go**. Para Face ID en iOS y para usar la app instalada como una app real, crea un development build:

```bash
npx expo run:ios          # o run:android (requiere Xcode / Android Studio)
# o en la nube:
npx eas-cli@latest build --profile development
```

## Producción (VPS con Caddy)

La web son archivos estáticos: se compilan y **Caddy** los sirve, con HTTPS, y reenvía `/api` a la API (`mis-gastos-api`, en el puerto 8081 del VPS). Web y API comparten dominio.

```bash
deploy/build-web.sh                         # compila con Docker y publica en /var/www/mis-gastos
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Sin Docker: `npm ci && npm run build:web` crea `dist/`; cópialo a `/var/www/mis-gastos` (por ejemplo, `rsync -a --delete dist/ usuario@vps:/var/www/mis-gastos/`). No definas `EXPO_PUBLIC_API_URL` al compilar la web: en producción ya usa `/api`.

El Caddyfile hace tres cosas imprescindibles: `reverse_proxy` de `/api/*` (con `handle`, no `handle_path`, porque la API espera el prefijo `/api`), `try_files … /index.html` para que recargar una ruta como `/ajustes` no dé 404, y `file_server`. Para actualizar la web basta con volver a compilar; Caddy no se reinicia.

Para la **app nativa** de producción, compílala apuntando a la API:

```bash
EXPO_PUBLIC_API_URL=https://cristianvega.app/api npx eas-cli@latest build --profile production
```

(o define esa variable en el perfil de `eas.json`).

## Notas

- Sin conexión la app muestra los datos ya cargados, pero no deja guardar: avisa del error y el formulario queda abierto.
- Los recordatorios de deudas son notificaciones locales; su id se guarda en el dispositivo, no en el servidor.
- En web no están disponibles el bloqueo biométrico, los recordatorios, los contactos ni compartir el resumen como imagen; esas opciones se ocultan.

## Pasar los datos de la versión anterior

Antes los datos vivían solo en el dispositivo. Para subirlos a tu cuenta:

1. **Antes de actualizar la app**, en la versión vieja: **Ajustes → Exportar respaldo**.
2. En la versión nueva, entra con tu cuenta y usa **Ajustes → Restaurar respaldo** con ese archivo.

Restaurar reemplaza **todos** los datos de tu cuenta por los del archivo. El respaldo exportado ahora sigue el mismo formato.
