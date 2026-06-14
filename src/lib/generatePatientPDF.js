/**
 * generatePatientPDF — Genera y descarga el reporte clínico de un paciente.
 *
 * Carga jsPDF + autotable dinámicamente desde CDN (sin dependencia de npm).
 * No incluye datos de contacto ni historial de pagos — solo progreso clínico.
 *
 * Secciones:
 *   1. Header + resumen numérico
 *   2. Historial de sesiones
 *   3. Notas clínicas
 *   4. Tareas terapéuticas
 *   5. Check-ins IA
 *   6. Tests psicométricos completados
 */

const JSPDF_URL     = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
const AUTOTABLE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

const RISK_LABELS = { high: 'Riesgo alto', medium: 'Riesgo medio', low: 'Sin riesgo' }
const SESSION_STATUS = { completed: 'Completada', scheduled: 'Agendada', cancelled: 'Cancelada', pending: 'Pendiente', no_show: 'No asistió' }
const TASK_STATUS = { completed: 'Completada', pending: 'Pendiente', in_progress: 'En progreso' }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-DO', { dateStyle: 'medium' })
}

const C = {
  primary:  [79,  70,  229],
  p50:      [238, 236, 255],
  warm900:  [28,  25,  23],
  warm500:  [120, 113, 108],
  warm100:  [245, 243, 241],
  white:    [255, 255, 255],
  green:    [22,  163, 74],
  amber:    [217, 119, 6],
  red:      [220, 38,  38],
}

export async function generatePatientPDF({ patient, therapistName, sessions, history, tasks, checkins, testAssignments }) {
  await loadScript(JSPDF_URL)
  await loadScript(AUTOTABLE_URL)

  const { jsPDF } = window.jspdf
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW   = doc.internal.pageSize.getWidth()
  const PH   = doc.internal.pageSize.getHeight()
  const M    = 18
  const CW   = PW - M * 2
  let y      = M

  const dateStr = new Date().toLocaleDateString('es-DO', { dateStyle: 'long' })
  const completedSessions = sessions.filter(s => s.status === 'completed')

  // ── HEADER BAR ──────────────────────────────────────────────────────────────
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, PW, 20, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...C.white)
  doc.text('Psiconecta', M, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Reporte de Progreso Clínico · Confidencial', M + 40, 12)
  doc.text(dateStr, PW - M, 12, { align: 'right' })

  y = 30

  // ── PATIENT INFO ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(...C.warm900)
  doc.text(patient.full_name ?? 'Paciente', M, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C.warm500)
  doc.text(`Terapeuta: ${therapistName}`, M, y)
  y += 14

  // ── SUMMARY CHIPS ────────────────────────────────────────────────────────────
  const chips = [
    { label: 'Sesiones completadas', value: completedSessions.length },
    { label: 'Notas clínicas',       value: history.length           },
    { label: 'Tareas asignadas',     value: tasks.length             },
    { label: 'Check-ins IA',         value: checkins.length          },
  ]
  const chipW = (CW - 9) / 4
  chips.forEach((chip, i) => {
    const cx = M + i * (chipW + 3)
    doc.setFillColor(...C.p50)
    doc.roundedRect(cx, y, chipW, 16, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...C.primary)
    doc.text(String(chip.value), cx + chipW / 2, y + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.warm500)
    doc.text(chip.label, cx + chipW / 2, y + 13, { align: 'center' })
  })
  y += 24

  // ── SECTION HEADING ──────────────────────────────────────────────────────────
  const section = (title) => {
    if (y > 258) { doc.addPage(); addPageHeader(); y = M + 6 }
    doc.setFillColor(...C.primary)
    doc.rect(M, y, CW, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...C.white)
    doc.text(title.toUpperCase(), M + 3, y + 5)
    y += 11
    doc.setTextColor(...C.warm900)
  }

  // ── PAGE HEADER (páginas 2+) ──────────────────────────────────────────────────
  const addPageHeader = () => {
    doc.setFillColor(...C.primary)
    doc.rect(0, 0, PW, 10, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.white)
    doc.text(`Psiconecta · Reporte de ${patient.full_name ?? 'Paciente'} · Confidencial`, M, 7)
  }

  // ── TABLE DEFAULTS ───────────────────────────────────────────────────────────
  const tableStyles = {
    styles:             { fontSize: 8, cellPadding: 3 },
    headStyles:         { fillColor: C.p50, textColor: C.primary, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: C.warm100 },
    margin:             { left: M, right: M },
  }

  // ── 1. SESIONES ──────────────────────────────────────────────────────────────
  if (sessions.length > 0) {
    section(`Historial de sesiones (${sessions.length} total, ${completedSessions.length} completadas)`)
    doc.autoTable({
      startY: y,
      ...tableStyles,
      head: [['Fecha', 'Estado', 'Precio (USD)']],
      body: sessions.map(s => [
        fmtDate(s.scheduled_at),
        SESSION_STATUS[s.status] ?? s.status,
        s.price_usd ? `$${s.price_usd}` : '—',
      ]),
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 45 }, 2: { cellWidth: 40 } },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── 2. NOTAS CLÍNICAS ────────────────────────────────────────────────────────
  if (history.length > 0) {
    section(`Notas clínicas (${history.length})`)

    history.forEach((h, idx) => {
      if (y > 250) { doc.addPage(); addPageHeader(); y = M + 14 }

      // Nota header row
      doc.setFillColor(...C.warm100)
      doc.rect(M, y, CW, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...C.warm900)
      doc.text(`Nota ${idx + 1}  ·  ${fmtDate(h.created_at)}`, M + 2, y + 5)

      // Risk badge (right)
      const riskColor = h.risk_level === 'high' ? C.red : h.risk_level === 'medium' ? C.amber : C.green
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...riskColor)
      doc.text(RISK_LABELS[h.risk_level] ?? h.risk_level, PW - M - 2, y + 5, { align: 'right' })
      y += 9

      const fields = [
        { label: 'Diagnóstico / impresión clínica', value: h.diagnosis },
        { label: 'Plan de tratamiento',              value: h.treatment_plan },
        { label: 'Notas de sesión',                  value: h.session_notes },
      ]

      fields.forEach(f => {
        if (!f.value) return
        if (y > 260) { doc.addPage(); addPageHeader(); y = M + 14 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(...C.warm500)
        doc.text(f.label, M + 3, y)
        y += 4.5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...C.warm900)
        const lines = doc.splitTextToSize(f.value, CW - 6)
        lines.forEach(line => {
          if (y > 270) { doc.addPage(); addPageHeader(); y = M + 14 }
          doc.text(line, M + 3, y)
          y += 4.5
        })
        y += 2
      })

      // Separator
      doc.setDrawColor(...C.warm100)
      doc.line(M, y, M + CW, y)
      y += 5
    })
  }

  // ── 3. TAREAS ────────────────────────────────────────────────────────────────
  if (tasks.length > 0) {
    if (y > 240) { doc.addPage(); addPageHeader(); y = M + 14 }
    section(`Tareas terapéuticas (${tasks.length})`)
    const completed = tasks.filter(t => t.status === 'completed').length
    const pct = tasks.length > 0 ? Math.round(completed / tasks.length * 100) : 0

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...C.warm500)
    doc.text(`${completed} de ${tasks.length} completadas (${pct}%)`, M, y - 3)

    doc.autoTable({
      startY: y,
      ...tableStyles,
      head: [['Tarea', 'Estado', 'Vencimiento', 'Completada']],
      body: tasks.map(t => [
        t.title,
        TASK_STATUS[t.status] ?? t.status,
        fmtDate(t.due_date),
        fmtDate(t.completed_at),
      ]),
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
      },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── 4. CHECK-INS IA ──────────────────────────────────────────────────────────
  if (checkins.length > 0) {
    if (y > 240) { doc.addPage(); addPageHeader(); y = M + 14 }
    const highRisk = checkins.filter(c => c.risk_level === 'high').length
    const medRisk  = checkins.filter(c => c.risk_level === 'medium').length
    section(`Check-ins de bienestar IA (${checkins.length} total · ${highRisk} riesgo alto · ${medRisk} riesgo medio)`)

    doc.autoTable({
      startY: y,
      ...tableStyles,
      head: [['Fecha', 'Riesgo', 'Resumen IA']],
      body: checkins.slice(0, 30).map(c => [
        fmtDate(c.created_at),
        RISK_LABELS[c.risk_level] ?? c.risk_level,
        (c.ai_message ?? '').slice(0, 130) + ((c.ai_message ?? '').length > 130 ? '…' : ''),
      ]),
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 28 }, 2: { cellWidth: 'auto' } },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.section === 'body') {
          const val = data.cell.raw
          if (val === 'Riesgo alto')   data.cell.styles.textColor = C.red
          if (val === 'Riesgo medio')  data.cell.styles.textColor = C.amber
          if (val === 'Sin riesgo')    data.cell.styles.textColor = C.green
        }
      },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── 5. TESTS PSICOMÉTRICOS ───────────────────────────────────────────────────
  const completed = (testAssignments ?? []).filter(a => a.test_sessions?.status === 'completed')
  if (completed.length > 0) {
    if (y > 240) { doc.addPage(); addPageHeader(); y = M + 14 }
    section(`Tests psicométricos completados (${completed.length})`)

    doc.autoTable({
      startY: y,
      ...tableStyles,
      head: [['Test', 'Categoría', 'Completado']],
      body: completed.map(a => [
        a.tests?.name ?? '—',
        a.tests?.category ?? '—',
        fmtDate(a.test_sessions?.completed_at),
      ]),
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
      },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── FOOTER EN TODAS LAS PÁGINAS ──────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(6.5)
    doc.setTextColor(...C.warm500)
    doc.text(
      `Documento confidencial generado por Psiconecta · ${dateStr} · Página ${p} de ${totalPages}`,
      PW / 2, PH - 6, { align: 'center' }
    )
  }

  // ── DESCARGAR ─────────────────────────────────────────────────────────────────
  const safeName = (patient.full_name ?? 'paciente')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
  const today = new Date().toISOString().slice(0, 10)
  doc.save(`reporte_${safeName}_${today}.pdf`)
}
