# Videos Nocturnos Requeridos para MoodWeather

Para que la app funcione correctamente de noche, necesitas generar/subir estos videos a Cloudinary:

## Videos de Noche Requeridos:

### 1. **Noche Despejada Estrellada**
- **ID Cloudinary**: `noche_despejada_estrellada`
- **Descripción**: Cielo nocturno despejado con estrellas visibles
- **Cuándo se usa**: Código WMO 0 (despejado) de noche

### 2. **Noche Parcialmente Nublado**
- **ID Cloudinary**: `noche_parcialmente_nublado`
- **Descripción**: Cielo nocturno con algunas nubes, luna parcialmente visible
- **Cuándo se usa**: Códigos WMO 1-2 (parcialmente nublado) de noche

### 3. **Noche Nublado**
- **ID Cloudinary**: `noche_nublado`
- **Descripción**: Cielo nocturno completamente cubierto de nubes
- **Cuándo se usa**: Código WMO 3 (nublado) de noche

### 4. **Noche Niebla**
- **ID Cloudinary**: `noche_niebla`
- **Descripción**: Niebla densa de noche con poca visibilidad
- **Cuándo se usa**: Códigos WMO 45-48 (niebla) de noche

### 5. **Noche Llovizna**
- **ID Cloudinary**: `noche_llovizna`
- **Descripción**: Llovizna ligera de noche
- **Cuándo se usa**: Códigos WMO 51-57 (llovizna) de noche

### 6. **Noche Lluvia**
- **ID Cloudinary**: `noche_lluvia`
- **Descripción**: Lluvia moderada a fuerte de noche
- **Cuándo se usa**: Códigos WMO 61-82 (lluvia) de noche

### 7. **Noche Nieve**
- **ID Cloudinary**: `noche_nieve`
- **Descripción**: Nevada de noche
- **Cuándo se usa**: Códigos WMO 71-86 (nieve) de noche

### 8. **Noche Tormenta**
- **ID Cloudinary**: `noche_tormenta`
- **Descripción**: Tormenta eléctrica de noche con relámpagos
- **Cuándo se usa**: Códigos WMO 95+ (tormenta) de noche

---

## Cómo Generar los Videos:

### Opción 1: Usar IA (Recomendado)
Puedes usar herramientas como:
- **Runway ML**: https://runwayml.com
- **Pika Labs**: https://pika.art
- **Stable Video Diffusion**

**Prompts sugeridos** (en inglés para mejor resultado):

1. **Noche Despejada**: "Night sky with stars twinkling, peaceful atmosphere, dark blue gradient, cinematic loop"
2. **Noche Parcialmente Nublado**: "Night sky with scattered clouds moving slowly, moon partially visible, dark atmosphere"
3. **Noche Nublado**: "Overcast night sky, thick dark clouds, moody atmosphere, no stars visible"
4. **Noche Niebla**: "Dense fog at night, mysterious atmosphere, low visibility, dark blue tones"
5. **Noche Llovizna**: "Light drizzle at night, raindrops falling gently, dark wet atmosphere"
6. **Noche Lluvia**: "Heavy rain at night, strong rainfall, dark stormy atmosphere"
7. **Noche Nieve**: "Snowfall at night, snowflakes falling peacefully, dark winter atmosphere"
8. **Noche Tormenta**: "Thunderstorm at night, lightning flashes, dramatic dark clouds, intense atmosphere"

### Opción 2: Stock Videos
Buscar en:
- **Pexels Videos**: https://www.pexels.com/videos/
- **Pixabay Videos**: https://pixabay.com/videos/
- **Videvo**: https://www.videvo.net/

Palabras clave: "night sky", "night rain", "night storm", "starry night", etc.

---

## Cómo Subir a Cloudinary:

1. Ve a tu dashboard de Cloudinary
2. Sube cada video con el nombre exacto especificado arriba
3. Asegúrate de que estén en la misma carpeta que los videos de día
4. Los videos deben ser formato MP4
5. Duración recomendada: 10-30 segundos (loop)

---

## Fallback Temporal:

Mientras generas los videos nocturnos, la app usará `noche_despejada_estrellada` como fallback para todas las condiciones nocturnas. Esto significa que si no existe ese video, mostrará el video de día.

**Prioridad de creación:**
1. ✅ `noche_despejada_estrellada` (más común)
2. ✅ `noche_parcialmente_nublado` (común)
3. ✅ `noche_lluvia` (importante)
4. `noche_nublado`
5. `noche_tormenta`
6. `noche_llovizna`
7. `noche_nieve`
8. `noche_niebla`
