# Contribuir

## Preparar el entorno

Requisitos: Node.js 22 o superior, pnpm 10.31.0 y Python 3.11 o superior.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

El dashboard de CampaignOS está en `http://127.0.0.1:3000/campaignos`. No se requiere una clave Jev para el modo preview.

## Antes de abrir o actualizar un pull request

```powershell
pnpm audit
pnpm lint
pnpm typecheck
pnpm test
node --check scripts/campaignos-collector.mjs
python -m unittest discover -s tests -v
pnpm build
```

El workflow de GitHub ejecuta estas mismas comprobaciones con lockfile congelado. `pnpm lint` cubre los archivos de CampaignOS y el collector; los errores de lint heredados del dashboard principal están descritos en `docs/CURRENT_STATE_AUDIT.md` y deben corregirse en un cambio con alcance y pruebas propios.

## Revisión responsable

- Mantén `.env`, claves, cookies sociales, capturas privadas, datos brutos y exports con PII fuera del commit.
- Revisa `git diff --cached` antes de confirmar cambios; no uses `git add -A`.
- No añadas llamadas externas, proveedores pagos ni nuevos permisos sin documentar el flujo de datos y su justificación.
- Mantén el análisis y los collectors en solo lectura; no automatices publicaciones, respuestas, likes ni bypass de controles.
- Trata los resultados de modelos y heurísticas como señales por verificar, no como hechos sobre una persona.
- Mantén aprobación humana para claims, decisiones estratégicas, moderación y publicación.
- Incluye evidencia, limitaciones, pruebas ejecutadas y riesgos pendientes en cada PR.
- No fusiones un PR hasta que CI esté verde y otra persona haya revisado el diff.
