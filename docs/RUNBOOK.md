# Runbook local

## Requisitos
Windows 11, Node.js 22+, pnpm 10.31.0 y Python 3.11+.

## Inicio
Desde la raíz del repositorio:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://127.0.0.1:3000/campaignos`. El servicio queda enlazado al loopback.

## Preflight antes de producción
1. Abre la sección de prueba de estrés.
2. Completa idea, audiencia/territorio, guion, claims/fuentes y formatos.
3. Revisa BLOCK primero; resuelve REVIEW con los responsables indicados y consigue evidencia para los NOT_ASSESSED.
4. Exporta JSON y pasa la ficha a responsables de claims, operaciones, contexto y campaña.
5. Revisa capturas y cortes en los formatos reales. El checklist no es predicción, aprobación ni garantía.

## Inteligencia social
Usa solo contenido autorizado y los adaptadores documentados en `docs/CAMPAIGNOS_JEV_SOCIAL.md`. Captura y cookies permanecen locales. El modo sin `TYPESAFE_API_KEY` es una vista previa determinista y no evidencia de mercado. Nunca publiques ni respondas automáticamente.

## Verificación de cambios
`pnpm install --frozen-lockfile`, `pnpm audit`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `node --check scripts/campaignos-collector.mjs`, `python -m unittest discover -s tests -v` y `pnpm build`.
