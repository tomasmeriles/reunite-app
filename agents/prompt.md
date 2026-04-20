# REUNITE APP

Estoy diseñando una aplicación de invitaciones a eventos que voy a utilizar realmente para mi cumpleaños:

Empecé con este boilerplate que seguramente tengamos que modificar para lograr el resultado esperado.

La idea a parte de que sea una plataforma que brinde experiencias para que los invitados ingresen después de inscribirse al evento para hacer actividades dentro (Modulo de chat, módulos de juegos, modulo de premios, modulo de imágenes del evento)

Mi idea de flujo es la siguiente

1.  Una persona que si o si tiene que tener una cuenta crea un evento personalizado:

- Un evento tiene una fecha, un lugar, una cantidad máxima de invitados (Pueden ser infinitos/null)
- Un evento tiene un tipo: Evento publico (Cualquiera con el link puede registrarse), evento con invitación sin cuenta: Se genera una invitación la cual solo puede ser aceptada mediante ESE link (Numero de usos, expiración, etc), evento con invitación con cuenta obligatoria: Permite whitelist de invitados a partir de un tag de usuario.
- Un evento tiene una relacion 1 a 1 con su configuración: Lista de invitados publica/privada, módulos activados/desactivados
- Un evento tiene reglas dinámicas: Una regla tiene un name, type (String, bool, number) y un value.
- Un evento puede encadenar a otros eventos (Estar antes/después de un evento)
- Un evento puede tener organizadores que pueden actual sobre ese evento en especifico
- Un evento puede no estar encadenado por otros eventos pero si debería tener la posibilidad de crear un texto antes del evento (Tipo previa) y después del evento (Tipo after)
- Un evento tiene estados internos que indican los procesos por los que esta pasando (Incluso un estado rescheduled automático)

1.  El flujo de aceptar la invitación es la siguiente:

- Flujo para evento publico: Una persona ingresa al link y de no tener cuenta agrega su nombre y da a aceptar (Queda inscripto directamente). Si tiene cuenta inferimos su nombre y solo tiene que apretar el botón de aceptar invitación.

  En este flujo me interesa que la gente pueda agregar a mas personas en la lista sin limitación.

- Flujo para evento con invitación sin cuenta obligatoria: Se genera una invitación la cual tiene un numero de usos ya que una persona puede inscribir a mas personas.
- Flujo para evento con invitación con cuenta obligatoria: Se genera el evento y la persona tiene que agregar tags de usuario (Nuevo campo) los cuales son notificados y/o el organizador puede copiar el link y mandárselos.

1. Me gustaría una UI/UX super simple y bonita:

- Utilicemos React confetti para las inscripciones al evento
- La UI tiene que ser full responsive (Tenemos hooks como useBreakpoint)
- La experiencia de crear un evento tiene que ser agradable, no algo muy rigido ni muy estructurado full plug and play

## Cuestiones que necesito que me ayudes a decidir:

1.  ¿Cómo hacemos para recordar a una persona que se inscribió en un evento y no tiene cuenta pero quiere utilizar el modulo de imágenes o incluso darse de baja del evento?
2.  Si una ingresa a una invitación sin cuenta obligatoria/publica y anota a mas personas como podríamos hacer que esas personas “Inicien sesión” para utilizar los módulos? Se me ocurre alguna especie de código de uso único pero es muy poco user friendly.
3.  No me convence el flujo de tags de usuario para invitar. Por motivos de seguridad deberíamos notificar si se pudo encontrar al usuario o no? Imagino que si.
4.  La landing page debería ser publica e invitar a crearse cuentas para crear eventos.

## Antes de escribir el código:

1. Me gustaría crear un .md con todo el flujo y todas las decisiones que vayamos tomando para tenerlo como contexto
2. Hay que componetizar absolutamente todo para permitir la reutilización
3. Hay que utilizar buenas practicas de SEO
