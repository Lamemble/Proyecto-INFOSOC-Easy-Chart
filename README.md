# Proyecto-INFOSOC-Easy-Chart

## Descripción

App web para crear y actualizar fichas médicas de pacientes en una veterinaria.

## Comandos

- `npm install` para instalar dependencias

- `npm run dev` para iniciarl el servidor de desarrolo

- `npx supabase start` para iniciar supabase en local (necesita docker).
  - Se debe copiar "Project URL" y "Publishable" al archivo `.env`
  - `npx supabase stop` para detener los contneedores
  - Se puede acceder a la interfaz de supabase en `http://127.0.0.1:54323`

## Supabase local

Se debe ejecutar `npx supabase start` para levantar los contenedores de supabase. Esto dará unas tablas con credenciales y se debe copiar "Project URL" y "Publishable" al archivo `.env`.

Se puede acceder a la interfaz de supabase en `http://127.0.0.1:54323`. Esto es igual a la interfaz de supabase cloud.

Desde la interfaz se pueden hacer cambios en la base de datos como agregar o editar tablas y otras configuraciones. Estos cambios luego se pueden obtener con `npx supabase db diff --schema public -f nombre_migracion`. Esto generará un archivo sql con los cambios realizados, los que luego se pueden commitear a git. Para aplicar las migraciones se puede usar `npx supabase migration up`
