# BARAL CampaignOS

Dashboard de auditoría BARAL con módulo local de Social Intelligence y cimientos de CampaignOS. El master completo está en `docs/BARAL_CAMPAIGNOS_CODEX_OBSIDIAN_MASTER.md`.

## Requisitos locales
- Windows 11
- Node.js 22 o superior (CI fijado en Node 24)
- pnpm 10.31.0
- Python 3.11 o superior (schemas y pruebas de contratos)

## Instalar
```powershell
pnpm install --frozen-lockfile
```

## Arrancar
```powershell
pnpm dev
```
Abre http://127.0.0.1:3000/campaignos. El servidor de desarrollo queda enlazado a loopback. Sin `TYPESAFE_API_KEY`, se usa preview heurístico etiquetado. Para Jev real, copia `.env.example` a `.env.local` y agrega una clave autorizada. El endpoint de análisis no funciona en Vercel/cloud.

## Preflight de ideas y spots
En la sección **Prueba de estrés de campaña y spot**, registra idea, audiencia/alcance, guion o storyboard, claims, evidencia y canales. El análisis es estático y local: señala claims absolutos/comparativos, campos ausentes y preguntas de revisión humana. No estima probabilidades ni determina mala fe. Nunca declara “listo”; exporta una ficha JSON local para cerrar los gates del equipo. Guía completa: `docs/CAMPAIGN_PREMORTEM.md`.

## Recolector local
El binario de `socai` **no se distribuye en GitHub**. En el equipo de trabajo está instalado en `.tools/socai/` (ruta ignorada por Git); en otra máquina instala el CLI desde su release oficial verificado y configura `SOCAI_BIN` o `PATH`. No se inicia sesión ni captura contenido hasta ejecutar el comando. Las sesiones permanecen en Chrome. También puedes importar JSON manual. El collector solo admite endpoints loopback; Jev envía texto con PII básica redactada al proveedor solo si configuras una clave.

## Verificar
```powershell
pnpm audit
pnpm lint
pnpm typecheck
pnpm test
pnpm audit
node --check scripts/campaignos-collector.mjs
python -m unittest discover -s tests -v
pnpm build
```

Las decisiones del Human Gate se exportan junto con el análisis; no publican, responden ni modifican campañas. El CI instala pnpm antes de habilitar su cache, ejecuta el audit de dependencias y valida build, tipos y suites. `pnpm lint` cubre los módulos de CampaignOS añadidos; la auditoría general del dashboard heredado conserva deuda documentada.

### Usar el recolector

```powershell
node scripts/campaignos-collector.mjs --platform instagram --query "término de búsqueda" --limit 10 --out data/evidence/run.json
```

El comando captura únicamente cuando lo ejecutas. Para TikTok o LinkedIn cambia `--platform`; otras fuentes pueden importarse desde JSON. No ejecuta login por su cuenta, no publica y no supera controles de acceso.
