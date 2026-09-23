# Seguridad

- No guardar secretos en el repo; `.env.example` solo documenta configuración no sensible.
- Mantener datos brutos, cache y datos personales fuera de Git.
- No almacenar cookies ni enviar credenciales sociales a despliegues cloud.
- Usar APIs y permisos autorizados; nunca eludir CAPTCHA, autenticación, controles o rate limits.
- Minimizar/redactar datos personales y definir retención antes de ingesta real.
- Validar schema y procedencia de salidas de agentes.
- Bloquear publicación, respuestas y cambios de pauta hasta una decisión humana explícita.
- Usar scopes mínimos, logs sin tokens y fallos cerrados.
