import path from 'path'

/**
 * Ubicación del almacenamiento en disco.
 *
 * Antes esto era `D:/GGLabs/baral-audit-dashboard/cache`, una ruta absoluta que
 * ataba el proyecto a una máquina concreta. Ahora se deriva del directorio de
 * trabajo, así que sigue funcionando aunque el repositorio se mueva o se clone
 * en otro equipo.
 *
 * En Vercel el filesystem es de solo lectura salvo /tmp, y además efímero: lo
 * que se guarde allí sobrevive al proceso, no al despliegue. Para el uso
 * interno —ejecución local— el directorio del proyecto sí persiste.
 */
const ON_VERCEL = !!process.env.VERCEL

export const CACHE_DIR = ON_VERCEL
  ? '/tmp/audit-cache'
  : path.join(process.cwd(), 'cache')

/** Bitácora append-only de intentos de escaneo (éxitos y fallos). */
export const EVENTS_FILE = path.join(CACHE_DIR, '_scan-events.jsonl')

/** Vault de Obsidian: solo tiene sentido en la máquina local del usuario. */
export const OBSIDIAN_DIR = ON_VERCEL
  ? ''
  : 'D:/GGLabs/00_AI_FACTORY/obsidian-vault/03_PROJECTS/audits'
