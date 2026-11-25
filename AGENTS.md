This is an Expo/React Native mobile application (`deliverytracker` — **Atelier Noir**, UTEM T06). Prioritize mobile-first patterns, performance, accessibility, and cross-platform compatibility (iOS, Android, Web).

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (currently `~58.0.26`).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v58.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present; this repo uses `npm`).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server (use --web for browser preview)
npx expo lint               # lint (alias: npm run lint)
npx tsc --noEmit            # typecheck
npm test                    # run core service/domain suite (tsx tests/verify-core.ts)
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run `npx tsc --noEmit`, `npm run lint`, and `npm test` before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Root navigator: `src/app/_layout.tsx` (loads Google Fonts, wraps `SafeAreaProvider` → `ProveedorTema` → `ProveedorAuth` → `ProveedorPedidos`).
- Tab navigator: `src/app/(tabs)/_layout.tsx` (`index.tsx` = Bodega guarded by `useAuth()`, `cliente.tsx` = public Cliente tracking).
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Project Architecture & Map

Unidirectional dependency flow: `types` → `services` → `hooks` / `context` → `components` → `screens` → `app`.

- `src/types/pedido.ts`: Domain contracts (`EstadoPedido`, `FLUJO_ESTADOS`, `Pedido`, `ItemPedido`, `EstadoUI<T>`).
- `src/services/pedidosApi.ts`: REST mock layer with $O(1)$ `Record<string, Pedido>` cache and reactive listeners. **Starts clean with 0 orders** (clears `deliverytracker_pedidos_v1..v3` on module load).
- `src/services/authLocal.ts`: Local Bodega auth using `expo-crypto` (salted iterated SHA-256) + `AsyncStorage`.
- `src/context/PedidosContext.tsx` & `src/context/AuthContext.tsx`: Shared app state.
- `src/hooks/usePedidoPolling.ts` & `src/hooks/useReducirMovimiento.ts`: Adaptive polling (5s first 30s → 30s, explicit `useEffect` cleanup) and reduced-motion preference.
- `src/constants/config.ts`: Env config (`EXPO_PUBLIC_*` vars). Remember `EXPO_PUBLIC_*` is embedded in client JS bundles; keep real production secrets on a backend server.
- `src/screens/`: `ClienteScreen.tsx` (tracking), `LocalScreen.tsx` (warehouse orders + form), `LoginScreen.tsx` (warehouse auth).
- `src/components/`: Reusable UI primitives (`Boton`, `CampoTexto`, `Masthead`, `PedidoCard`, `EstadoPedidoBadge`, `StepperProgreso`, `TarjetaMetrica`, `EstadoUIRenderer`, `AvisoFlotante`, `InterruptorTema`, `BotonSalir`, `Icon`).

## Design System & Accessibility Conventions

- **Single source of tokens:** `src/theme/tokens.ts` + `src/theme/ThemeProvider.tsx` (`useTema()`). Never hardcode theme colors, spacing, radii, or font names inside components/screens (exception: fixed high-contrast light text inside `colores.panelOscuro` hero surfaces).
- **Theme modes:** Both `claro` (`#f4f6f8` soft / `#ffffff` surface / `#0a0d10` ink / `#244dcc`–`#3e6ff6` cobalt) and `oscuro` (`#0a0d10` / `#101419` / `#171c23` / `#6f95ff`) must remain supported.
- **Typography:** `Space Grotesk` (headings/metrics), `Manrope` (body/UI, **minimum 12px**), `DM Mono` (uppercase labels, order codes, prices).
- **Accessibility:** Minimum touch target `PUNTO_MINIMO = 44` (`44x44pt`), WCAG AA contrast (`>= 4.5:1` normal text), `accessibilityRole` + `accessibilityLabel` on interactive elements, and `KeyboardAvoidingView` + `SafeAreaView` on screens.
- **Responsive breakpoint:** `BREAKPOINTS.tablet = 840` switches `LocalScreen` and `LoginScreen` from single-column mobile to two-column layouts.

## Git & Workspace Boundaries

- Keep `main` untouched unless explicitly instructed; active development happens on `deliverytracker05` and integrated milestones are pushed to `develop`.
- Never commit `.env*` files or keystores; `graphify-out/` is gitignored.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
