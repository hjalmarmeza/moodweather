# Inventario Completo de Videos - MoodWeather

## ✅ Videos Implementados y Funcionando

### Videos de Día (Diurnos)
| Condición | Código WMO | ID Cloudinary | Estado |
|-----------|------------|---------------|--------|
| Soleado | 0 | `soleado_id2xmu` | ✅ |
| Parcialmente Nublado | 1-2 | `parcialmente_fdhxml` | ✅ |
| Nublado | 3 | `nublado_v2_assaug` | ✅ |
| Niebla | 45-48 | `neblina_odrm7y` | ✅ |
| Llovizna | 51-57 | `llovizna_kw31jm` | ✅ |
| Lluvia | 61-82 | `lluvia_lpxtmw` | ✅ |
| Nieve | 71-86 | `nieve_ghrasq` | ✅ |
| Tormenta | 95+ | `día_tormenta_nb24f3` | ✅ NUEVO |

### Videos de Noche (Nocturnos)
| Condición | Código WMO | ID Cloudinary | URL Cloudinary | Estado |
|-----------|------------|---------------|----------------|--------|
| Despejada Estrellada | 0 | `noche_despejada_estrellada_yxjpxa` | [Ver](https://res.cloudinary.com/dveqs8f3n/video/upload/v1769717395/noche_despejada_estrellada_yxjpxa.mp4) | ✅ |
| Parcialmente Nublado | 1-2 | `noche_parcialmente_nublado_dwuvkx` | [Ver](https://res.cloudinary.com/dveqs8f3n/video/upload/v1769717409/noche_parcialmente_nublado_dwuvkx.mp4) | ✅ |
| Nublado | 3 | `noche_nublado_c16ex3` | [Ver](https://res.cloudinary.com/dveqs8f3n/video/upload/v1769717405/noche_nublado_c16ex3.mp4) | ✅ |
| Niebla | 45-48 | `noche_niebla_drlpix` | [Ver](https://res.cloudinary.com/dveqs8f3n/video/upload/v1769717401/noche_niebla_drlpix.mp4) | ✅ |
| Llovizna | 51-57 | `noche_lluvia_qmzrat` | [Ver](https://res.cloudinary.com/dveqs8f3n/video/upload/v1769717399/noche_lluvia_qmzrat.mp4) | ✅ |
| Lluvia | 61-82 | `noche_lluvia_qmzrat` | [Ver](https://res.cloudinary.com/dveqs8f3n/video/upload/v1769717399/noche_lluvia_qmzrat.mp4) | ✅ |
| Nieve | 71-86 | `noche_nieve_mibq4v` | [Ver](https://res.cloudinary.com/dveqs8f3n/video/upload/v1769717403/noche_nieve_mibq4v.mp4) | ✅ |
| Tormenta | 95+ | `Noche_Tormenta_ap8pn8` | [Ver](https://res.cloudinary.com/dveqs8f3n/video/upload/v1769717394/Noche_Tormenta_ap8pn8.mp4) | ✅ |

---

## 📊 Resumen

- **Total de videos**: 16
- **Videos de día**: 8 ✅
- **Videos de noche**: 8 ✅
- **Cobertura**: 100% de condiciones climáticas

---

## 🎯 Lógica de Selección

La app determina qué video mostrar basándose en:

1. **Código WMO** (weathercode de la API)
2. **Hora del día** (is_day de la API: 1 = día, 0 = noche)

### Ejemplo:
```javascript
// Situación: 8:46 PM, Parcialmente Nublado
weatherCode = 2
isDay = 0 (noche)

// Video seleccionado:
getWeatherId(2, 0) → 'noche_parcialmente_nublado_dwuvkx'
```

---

## 🔄 Fallbacks

Si un video no se encuentra, el sistema usa:
- **Día**: `soleado_id2xmu`
- **Noche**: `noche_despejada_estrellada_yxjpxa`

---

## 📝 Notas

- **Llovizna nocturna** usa el mismo video que **lluvia nocturna** (`noche_lluvia_qmzrat`)
- Todos los videos están en formato **MP4**
- Los videos se cargan desde Cloudinary con transformación automática
- Duración recomendada: **10-30 segundos** (loop)

---

## 🎨 Características Visuales por Condición

### Noche Despejada Estrellada 🌟
- Cielo oscuro con estrellas brillantes
- Atmósfera tranquila y serena
- Ideal para mostrar fases lunares

### Noche Parcialmente Nublado ☁️🌙
- Nubes dispersas moviéndose lentamente
- Luna parcialmente visible
- Atmósfera dinámica

### Noche Nublado ☁️
- Cielo completamente cubierto
- Nubes densas y oscuras
- Sin estrellas visibles

### Noche Niebla 🌫️
- Niebla densa con baja visibilidad
- Atmósfera misteriosa
- Tonos azul oscuro

### Noche Lluvia 🌧️
- Gotas de lluvia cayendo
- Atmósfera húmeda y oscura
- Efecto de lluvia visible

### Noche Nieve ❄️
- Copos de nieve cayendo suavemente
- Atmósfera invernal nocturna
- Tonos azul-blanco

### Noche Tormenta ⛈️
- Relámpagos iluminando el cielo
- Nubes oscuras dramáticas
- Atmósfera intensa y eléctrica

---

## ✅ Estado del Proyecto

**Última actualización**: 29 de enero de 2026, 21:12

Todos los videos nocturnos han sido subidos exitosamente a Cloudinary y están integrados en la aplicación. La app ahora muestra videos coherentes con la hora del día real.

**Próximas mejoras potenciales**:
- [ ] Video específico para llovizna nocturna (actualmente usa lluvia)
- [ ] Variantes de intensidad (lluvia ligera vs fuerte)
- [ ] Transiciones suaves entre videos
