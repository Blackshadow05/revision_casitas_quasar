import { jsPDF } from 'jspdf'

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dhd61lan4/image/upload'

const LAYOUT = {
  margin: 12,
  casitasPerPage: 5,
  cellGapY: 4,
  headerHeight: 16,
  summaryHeight: 28,
  photoGap: 2.5,
  photoHeight: 36,
  photoMaxWidth: 54,
  labelGap: 1,
  labelHeight: 6.5,
  estadoBarHeight: 1.4,
  noteLineHeight: 3.2
}

const ESTADO_DEFECTUOSA = 'defectuosa'
const ESTADO_BUEN = 'en buen estado'
const ESTADO_NO_HAY = 'no hay pantalla'

const PDF_IMAGE_TRANSFORMS = 'w_2400,c_limit,q_auto:best,f_jpg'
const PDF_JPEG_QUALITY = 0.98

export function getCloudinaryUrl (url, transforms = '') {
  if (!url) return ''
  if (url.startsWith('http')) {
    if (transforms && url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/${transforms}/`)
    }
    return url
  }
  const cleanPath = url.replace(/^\/+/, '')
  return transforms
    ? `${CLOUDINARY_BASE}/${transforms}/${cleanPath}`
    : `${CLOUDINARY_BASE}/${cleanPath}`
}

function formatFechaHora (value, short = false) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return new Intl.DateTimeFormat('es-CR', {
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: short ? undefined : '2-digit',
      minute: short ? undefined : '2-digit',
      hour12: false
    }).format(d)
  } catch {
    return String(value)
  }
}

function normalizeEstado (estado) {
  if (!estado) return ESTADO_DEFECTUOSA
  const value = String(estado).trim().toLowerCase()
  if (value === ESTADO_BUEN || value === 'buen estado' || value === 'buena') {
    return ESTADO_BUEN
  }
  if (
    value === ESTADO_NO_HAY ||
    value === 'no hay' ||
    value === 'sin pantalla' ||
    value === 'no hay pantallas'
  ) {
    return ESTADO_NO_HAY
  }
  return ESTADO_DEFECTUOSA
}

function estadoBarColor (estado) {
  const value = normalizeEstado(estado)
  if (value === ESTADO_BUEN) return [46, 125, 50]
  if (value === ESTADO_NO_HAY) return [251, 192, 45]
  return [198, 40, 40]
}

function hasDefectuosa (imagesOrFotos) {
  const list = Array.isArray(imagesOrFotos) ? imagesOrFotos : []
  if (list.length === 0) return false
  return list.some(item => normalizeEstado(item.estado) === ESTADO_DEFECTUOSA)
}

function loadImageAsDataUrl (url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', PDF_JPEG_QUALITY)
        canvas.width = 0
        canvas.height = 0
        resolve({
          dataUrl,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        })
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${url}`))
    img.src = url
  })
}

function truncateText (doc, text, maxWidth) {
  const value = String(text || '')
  if (doc.getTextWidth(value) <= maxWidth) return value
  let truncated = value
  while (truncated.length > 1 && doc.getTextWidth(`${truncated}…`) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return `${truncated}…`
}

async function preloadReportImages (reporte) {
  const fotos = Array.isArray(reporte.fotos) ? reporte.fotos : []
  const loaded = []

  for (const foto of fotos) {
    if (!foto?.url) continue
    const estado = normalizeEstado(foto.estado)
    try {
      const sourceUrl = getCloudinaryUrl(foto.url, PDF_IMAGE_TRANSFORMS)
      const image = await loadImageAsDataUrl(sourceUrl)
      loaded.push({
        ubicacion: foto.ubicacion || '—',
        estado,
        ...image
      })
    } catch (error) {
      console.error('PDF preload image failed:', error)
      loaded.push({
        ubicacion: foto.ubicacion || '—',
        estado,
        failed: true
      })
    }
  }

  return loaded
}

function drawPageHeader (doc, margin, pageWidth, total) {
  const y = margin + 4

  doc.setFillColor(183, 28, 28)
  doc.roundedRect(margin, margin, 3, 10, 1, 1, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(33, 33, 33)
  doc.text('Reporte de pantallas', margin + 7, y + 2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(117, 117, 117)
  doc.text(
    `${total} ${total === 1 ? 'casita' : 'casitas'}  ·  ${formatFechaHora(new Date(), true)}`,
    pageWidth - margin,
    y + 2,
    { align: 'right' }
  )

  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.3)
  doc.line(margin, margin + LAYOUT.headerHeight - 2, pageWidth - margin, margin + LAYOUT.headerHeight - 2)
  doc.setTextColor(0, 0, 0)
}

function getPantallasResumen (prepared) {
  let total = 0
  let defectuosas = 0
  let buenEstado = 0
  let noHay = 0

  for (const entry of prepared) {
    const fotos = Array.isArray(entry.images) ? entry.images : []
    for (const foto of fotos) {
      total++
      const estado = normalizeEstado(foto.estado)
      if (estado === ESTADO_DEFECTUOSA) defectuosas++
      else if (estado === ESTADO_NO_HAY) noHay++
      else buenEstado++
    }
  }

  return { total, defectuosas, buenEstado, noHay }
}

function drawResumen (doc, margin, pageWidth, resumen) {
  const y = margin + LAYOUT.headerHeight
  const width = pageWidth - (margin * 2)
  const cardH = LAYOUT.summaryHeight - 4
  const gap = 2.5
  const cardW = (width - (gap * 3)) / 4

  const cards = [
    { label: 'Total pantallas', value: resumen.total, color: [33, 33, 33], bg: [245, 245, 245] },
    { label: 'Defectuosas', value: resumen.defectuosas, color: [198, 40, 40], bg: [255, 235, 238] },
    { label: 'En buen estado', value: resumen.buenEstado, color: [46, 125, 50], bg: [232, 245, 233] },
    { label: 'No hay pantalla', value: resumen.noHay, color: [245, 127, 23], bg: [255, 249, 196] }
  ]

  cards.forEach((card, index) => {
    const x = margin + (index * (cardW + gap))
    doc.setFillColor(...card.bg)
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...card.color)
    doc.text(String(card.value), x + cardW / 2, y + 11, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.2)
    doc.setTextColor(97, 97, 97)
    doc.text(card.label, x + cardW / 2, y + 18, { align: 'center' })
  })

  doc.setTextColor(0, 0, 0)
}

function drawCasitaBlock (doc, reporte, images, rect) {
  const { x, y, width, height } = rect
  const paddingX = 3.5
  const paddingY = 2.5
  const showRedAccent = hasDefectuosa(images)

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(232, 232, 232)
  doc.setLineWidth(0.35)
  doc.roundedRect(x, y, width, height, 2, 2, 'FD')

  if (showRedAccent) {
    doc.setFillColor(198, 40, 40)
    doc.roundedRect(x, y, 1.6, height, 0.8, 0.8, 'F')
  }

  const headerY = y + paddingY + 3
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(33, 33, 33)
  doc.text(`Casita ${reporte.numero_casita || '—'}`, x + paddingX + 1, headerY)
  doc.setTextColor(0, 0, 0)

  const dividerY = y + paddingY + 5.8
  doc.setDrawColor(240, 240, 240)
  doc.setLineWidth(0.25)
  doc.line(x + paddingX + 1, dividerY, x + width - paddingX, dividerY)

  const note = String(reporte.notas || '').trim()
  let photosTop = dividerY + 2
  if (note) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(80, 80, 80)
    const noteMaxWidth = width - (paddingX * 2) - 2
    const noteLines = doc.splitTextToSize(`Nota: ${note}`, noteMaxWidth).slice(0, 2)
    doc.text(noteLines, x + paddingX + 1, photosTop + 2)
    photosTop += (noteLines.length * LAYOUT.noteLineHeight) + 1.5
    doc.setTextColor(0, 0, 0)
  }

  const fotos = images.length > 0 ? images : [{ failed: true, ubicacion: 'Sin fotos', estado: ESTADO_DEFECTUOSA }]
  const photoCount = Math.min(fotos.length, 3)
  const reservedBottom = LAYOUT.labelHeight + LAYOUT.estadoBarHeight + paddingY
  const photoHeight = Math.min(LAYOUT.photoHeight, height - (photosTop - y) - reservedBottom)

  const preparedPhotos = []
  for (let i = 0; i < photoCount; i++) {
    const foto = fotos[i]
    let drawW = LAYOUT.photoMaxWidth
    let drawH = photoHeight

    if (!foto.failed && foto.dataUrl && foto.width && foto.height) {
      const ratio = Math.min(LAYOUT.photoMaxWidth / foto.width, photoHeight / foto.height, 1)
      drawW = Math.max(12, foto.width * ratio)
      drawH = Math.max(12, foto.height * ratio)
    }

    preparedPhotos.push({ foto, drawW, drawH })
  }

  let cursorX = x + paddingX + 1

  for (const item of preparedPhotos) {
    const { foto, drawW, drawH } = item
    const boxW = foto.failed || !foto.dataUrl ? LAYOUT.photoMaxWidth : drawW
    const photoX = cursorX
    const photoY = photosTop + ((photoHeight - drawH) / 2)
    const estado = normalizeEstado(foto.estado)
    const barColor = estadoBarColor(estado)

    if (foto.failed || !foto.dataUrl) {
      doc.setFillColor(248, 248, 248)
      doc.setDrawColor(235, 235, 235)
      doc.roundedRect(photoX, photosTop, LAYOUT.photoMaxWidth, photoHeight, 1.2, 1.2, 'FD')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(160, 160, 160)
      doc.text('Sin imagen', photoX + LAYOUT.photoMaxWidth / 2, photosTop + photoHeight / 2, { align: 'center' })
    } else {
      doc.addImage(foto.dataUrl, 'JPEG', photoX, photoY, drawW, drawH)
    }

    // Raya de estado debajo de la foto
    const barY = photosTop + photoHeight + 0.8
    doc.setFillColor(...barColor)
    doc.roundedRect(photoX, barY, boxW, LAYOUT.estadoBarHeight, 0.5, 0.5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(66, 66, 66)
    doc.text(
      truncateText(doc, foto.ubicacion || '—', boxW),
      photoX + boxW / 2,
      barY + LAYOUT.estadoBarHeight + 2.4,
      { align: 'center' }
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(...barColor)
    doc.text(
      truncateText(doc, estado, boxW),
      photoX + boxW / 2,
      barY + LAYOUT.estadoBarHeight + 5,
      { align: 'center' }
    )

    cursorX += boxW + LAYOUT.photoGap
    doc.setTextColor(0, 0, 0)
  }
}

/**
 * Genera PDF compacto con imágenes embebidas.
 * 1 columna × 5 filas por página, ordenado por número de casita.
 * Barra roja lateral solo si hay alguna pantalla defectuosa.
 * @param {object|object[]} reportes
 */
export async function generateReportePantallasPdf (reportes) {
  const items = (Array.isArray(reportes) ? reportes : [reportes])
    .filter(Boolean)
    .slice()
    .sort((a, b) => Number(a.numero_casita || 0) - Number(b.numero_casita || 0))

  if (items.length === 0) {
    throw new Error('No hay reportes seleccionados')
  }

  const prepared = []
  for (const reporte of items) {
    prepared.push({
      reporte,
      images: await preloadReportImages(reporte)
    })
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - (LAYOUT.margin * 2)
  const contentHeight = pageHeight - (LAYOUT.margin * 2)
  const firstPageTop = LAYOUT.margin + LAYOUT.headerHeight + LAYOUT.summaryHeight
  const otherPageTop = LAYOUT.margin
  const firstPageContentHeight = contentHeight - LAYOUT.headerHeight - LAYOUT.summaryHeight
  const rowHeightFirst = (firstPageContentHeight - (LAYOUT.cellGapY * (LAYOUT.casitasPerPage - 1))) / LAYOUT.casitasPerPage
  const rowHeightOther = (contentHeight - (LAYOUT.cellGapY * (LAYOUT.casitasPerPage - 1))) / LAYOUT.casitasPerPage
  const resumen = getPantallasResumen(prepared)

  prepared.forEach((entry, index) => {
    const pageIndex = Math.floor(index / LAYOUT.casitasPerPage)
    const slotOnPage = index % LAYOUT.casitasPerPage

    if (index > 0 && slotOnPage === 0) {
      doc.addPage()
    }

    if (slotOnPage === 0 && pageIndex === 0) {
      drawPageHeader(doc, LAYOUT.margin, pageWidth, items.length)
      drawResumen(doc, LAYOUT.margin, pageWidth, resumen)
    }

    const isFirstPage = pageIndex === 0
    const rowHeight = isFirstPage ? rowHeightFirst : rowHeightOther
    const top = isFirstPage ? firstPageTop : otherPageTop

    const rect = {
      x: LAYOUT.margin,
      y: top + (slotOnPage * (rowHeight + LAYOUT.cellGapY)),
      width: contentWidth,
      height: rowHeight
    }

    drawCasitaBlock(doc, entry.reporte, entry.images, rect)
  })

  const casitas = items.map(r => r.numero_casita).filter(Boolean)
  const suffix = casitas.length === 1
    ? `casita_${casitas[0]}`
    : `${casitas.length}_casitas`
  doc.save(`reporte_pantallas_${suffix}_${Date.now()}.pdf`)
}
