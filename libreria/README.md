# Librería de animaciones SiMAR

`simar-animaciones.js` es un solo archivo, sin dependencias, para probar animaciones sobre la landing
de SiMAR. Se carga al final de la página y agrega un panel **Personalizar** con tres pestañas.

```html
<script src="simar-animaciones.js"></script>
```

Necesita el HTML de la landing: `header#top` con su `figure` de fotos, las secciones con `id`
(`proyecto`, `conciencia`, `mapa`…), los bloques `.reveal` y las cifras de `NumeroAnimado`.
Lo que eliges se guarda en `localStorage` del navegador.

## Fondos (un `<canvas>` detrás de cada sección)

Se eligen por sección o para toda la página, con intensidad y velocidad. Cada sección se puede ocultar.

| Grupo | Animaciones |
|---|---|
| Peces | Cardumen, Cardumen tenue, Cardumen de paso, Remolino, Cardumen curioso, Dos cardúmenes |
| Agua | Burbujas, Plancton, Nieve marina, Corriente suave, Vórtice, Gotas y ondas, Líneas de marea |
| Luz | Destellos, Sonar, Rejilla que respira, Ola de puntos, Bioluminiscencia, Constelación, Rayos de sol |

En secciones claras usa azul marea y golfo; en las bandas oscuras (`bg-simar-abismo`), espuma.

## Transiciones

- **Bloques al hacer scroll:** subir (original), fundido, acercar, desde el lado, desenfoque,
  inclinación 3D o ninguna; duración normal, rápida o lenta; opción de escalonar.
- **Cifras:** contar desde 0 (original), dígitos que ruedan, aparecer con zoom o ninguna.
- **Entrada del hero:** original, más lenta, acercar, desde el lado o ninguna.

## Hero y carrusel

- **Diseño:** original, más grande hasta el borde, ventana con forma de ola, fotos de fondo
  completo, tarjetas apiladas.
- **Cambio de foto:** fundido (original), deslizar, cortina, zoom lento (Ken Burns), desenfoque
  o corte directo; 4, 6 o 9 segundos por foto.

## Para pasarlo a la landing real

Cada fondo es una entrada de `SCENES` con `init(L)` (crea los puntos) y `draw(P, L, t)` (dibuja un
cuadro). Para llevar uno a React basta copiar esa entrada y llamarla desde un `useEffect` con
`requestAnimationFrame`, como hace `dots/DotsBackground.tsx` en este repo.
