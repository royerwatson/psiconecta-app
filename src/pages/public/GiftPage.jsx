/**
 * GiftPage — Compra de gift card para sesiones de terapia.
 * Ruta: /regalo (pública, sin login requerido)
 * Diseño: premium light — mismo fondo que LandingPage (bg-psiconecta)
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ChevronRight, Check, Sparkles, Loader2, Shield, Clock, Star } from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

/* ─── Constantes ────────────────────────────────────────── */
const PRESET_AMOUNTS = [50, 100, 150]

/* ─── Colores base ──────────────────────────────────────── */
const C = {
  bg:        'linear-gradient(160deg, #f0f2ff 0%, #faf5ff 45%, #f5f5f7 100%)',
  card:      'rgba(255,255,255,0.80)',
  cardBorder:'rgba(167,139,250,0.18)',
  text:      '#1e1b4b',
  muted:     '#6b7280',
  subtle:    '#9ca3af',
  violet:    '#7c3aed',
  violetLight:'#ede9fe',
}

/* ─── Gift card visual preview ──────────────────────────── */
function GiftCardPreview({ amount, sender, recipient, mini = false }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white select-none"
      style={{
        background: 'linear-gradient(135deg, #3b0d8a 0%, #6d28d9 40%, #0ea5e9 100%)',
        padding: mini ? '20px 24px' : '32px',
        boxShadow: '0 20px 60px rgba(109,40,217,0.30)',
      }}
    >
      {/* Shine */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
      {/* Circles */}
      <div style={{ position:'absolute',bottom:-40,right:-40,width:160,height:160,
        borderRadius:'50%',background:'rgba(255,255,255,0.06)' }} />
      <div style={{ position:'absolute',bottom:-20,right:-20,width:90,height:90,
        borderRadius:'50%',background:'rgba(255,255,255,0.08)' }} />

      {/* Logo row */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:10 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:28,height:28,background:'rgba(255,255,255,0.2)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <PsiconectaLogo size={16} color="white" />
          </div>
          <span style={{ fontWeight:700,fontSize:13 }}>Psico<span style={{ opacity:0.7 }}>necta</span></span>
        </div>
        <Sparkles size={16} style={{ opacity:0.5 }} />
      </div>

      {/* Amount */}
      <div style={{ marginTop:mini?16:28,marginBottom:mini?10:20,position:'relative',zIndex:10 }}>
        <div style={{ fontSize:11,opacity:0.6,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4 }}>
          Crédito de regalo
        </div>
        <div style={{ fontSize:mini?32:48,fontWeight:900,letterSpacing:'-0.03em',lineHeight:1 }}>
          ${amount}
          <span style={{ fontSize:mini?14:20,fontWeight:400,opacity:0.6,marginLeft:4 }}>USD</span>
        </div>
      </div>

      {/* From/To */}
      {(sender || recipient) && (
        <div style={{ position:'relative',zIndex:10,display:'flex',gap:24 }}>
          {sender   && <div><div style={{ fontSize:10,opacity:0.5,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' }}>De</div><div style={{ fontSize:13,fontWeight:600,opacity:0.9,marginTop:2 }}>{sender}</div></div>}
          {recipient && <div><div style={{ fontSize:10,opacity:0.5,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' }}>Para</div><div style={{ fontSize:13,fontWeight:600,opacity:0.9,marginTop:2 }}>{recipient}</div></div>}
        </div>
      )}

      {!mini && (
        <div style={{ position:'relative',zIndex:10,marginTop:20,display:'flex',alignItems:'center',gap:6,opacity:0.4,fontSize:11 }}>
          <Clock size={11} /> Válido por 12 meses · psiconecta.app
        </div>
      )}
    </div>
  )
}

/* ─── PayPal button ─────────────────────────────────────── */
function PayPalGiftButton({ formData, amountUsd, onSuccess, onError }) {
  const containerRef = useRef(null)
  const rendered     = useRef(false)
  const [sdkReady,   setSdkReady]   = useState(false)
  const [sdkError,   setSdkError]   = useState(false)
  const [processing, setProcessing] = useState(false)
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID

  useEffect(() => {
    if (window.paypal) { setSdkReady(true); return }
    const s = document.createElement('script')
    s.src   = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&locale=es_DO`
    s.async = true
    s.onload  = () => setSdkReady(true)
    s.onerror = () => setSdkError(true)
    document.body.appendChild(s)
    return () => { rendered.current = false }
  }, [clientId])

  useEffect(() => {
    if (!sdkReady || !containerRef.current || rendered.current) return
    rendered.current = true
    window.paypal.Buttons({
      style: { layout:'vertical', color:'gold', shape:'pill', label:'pay', height:50 },
      createOrder: async () => {
        const res  = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-gift-order`,
          { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ amountUsd, senderName:formData.senderName, senderEmail:formData.senderEmail,
              recipientName:formData.recipientName, recipientEmail:formData.recipientEmail, message:formData.message }) })
        const data = await res.json()
        if (!res.ok || !data.orderId) throw new Error(data.error ?? 'Error creando orden')
        return data.orderId
      },
      onApprove: async (paypalData) => {
        setProcessing(true)
        try {
          const res  = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-gift-payment`,
            { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orderId: paypalData.orderID }) })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Error capturando pago')
          onSuccess(data)
        } catch(e) { onError(e.message) }
        finally { setProcessing(false) }
      },
      onError:  (err) => { console.error('[PayPalGiftButton]', err); onError('Error con PayPal. Intenta de nuevo.') },
      onCancel: () => toast('Pago cancelado', { icon:'↩️' }),
    }).render(containerRef.current)
  }, [sdkReady])

  if (sdkError) return <p className="text-sm text-red-500 text-center">No se pudo cargar PayPal. Recarga la página.</p>

  return (
    <div className="relative">
      {processing && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-xl gap-3">
          <Loader2 size={28} className="animate-spin text-violet-500" />
          <p className="text-sm text-violet-700">Procesando pago…</p>
        </div>
      )}
      {!sdkReady && <div className="h-[50px] bg-violet-100 rounded-full animate-pulse" />}
      <div ref={containerRef} className={sdkReady ? '' : 'hidden'} />
    </div>
  )
}

/* ─── Field helper ──────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.subtle, marginBottom:6, letterSpacing:'0.08em', textTransform:'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = `w-full bg-white border border-violet-100 rounded-xl px-4 py-3 text-sm text-warm-900
  placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-violet-300 transition-all shadow-sm`

/* ─── Page ──────────────────────────────────────────────── */
export default function GiftPage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState('form')
  const [amount, setAmount]     = useState(100)
  const [customAmt, setCustomAmt] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [result, setResult]     = useState(null)
  const [form, setForm] = useState({
    senderName:'', senderEmail:'', recipientName:'', recipientEmail:'', message:'',
  })

  const finalAmount  = useCustom ? Math.max(50, parseFloat(customAmt) || 50) : amount
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.senderName || !form.senderEmail || !form.recipientName || !form.recipientEmail) {
      toast.error('Completa todos los campos requeridos'); return
    }
    if (useCustom && (parseFloat(customAmt) < 50 || isNaN(parseFloat(customAmt)))) {
      toast.error('El monto mínimo es $50 USD'); return
    }
    setStep('payment')
  }

  return (
    <div style={{ minHeight:'100dvh', background:C.bg }}>

      {/* Ambient glows sutiles sobre fondo claro */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0 }}>
        <div style={{ position:'absolute',top:'-5%',left:'15%',width:500,height:500,borderRadius:'50%',
          background:'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',filter:'blur(50px)' }} />
        <div style={{ position:'absolute',top:'40%',right:'-5%',width:350,height:350,borderRadius:'50%',
          background:'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)',filter:'blur(50px)' }} />
        <div style={{ position:'absolute',bottom:'5%',left:'-5%',width:300,height:300,borderRadius:'50%',
          background:'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)',filter:'blur(50px)' }} />
      </div>

      {/* Navbar */}
      <nav style={{ position:'relative',zIndex:10,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 32px',maxWidth:940,margin:'0 auto' }}>
        <button onClick={() => navigate('/')} style={{ display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer' }} className="hover:opacity-70 transition-opacity">
          <div style={{ width:32,height:32,background:'linear-gradient(135deg,#7c3aed,#0ea5e9)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <PsiconectaLogo size={18} color="white" />
          </div>
          <span style={{ fontWeight:700,fontSize:15,color:C.text }}>Psico<span style={{ color:C.violet }}>necta</span></span>
        </button>
        <button onClick={() => navigate('/login')}
          style={{ fontSize:13,color:C.muted,background:'none',border:'none',cursor:'pointer' }}
          className="hover:text-violet-700 transition-colors">
          Iniciar sesión
        </button>
      </nav>

      {/* ─── FORM ─────────────────────────────────── */}
      {step === 'form' && (
        <div style={{ position:'relative',zIndex:10,maxWidth:940,margin:'0 auto',padding:'0 20px 80px' }}>

          {/* Hero */}
          <div style={{ textAlign:'center',padding:'28px 20px 44px' }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,
              background:'rgba(167,139,250,0.12)',border:'1px solid rgba(167,139,250,0.3)',
              borderRadius:999,padding:'6px 14px',marginBottom:20 }}>
              <Sparkles size={13} style={{ color:C.violet }} />
              <span style={{ fontSize:12,fontWeight:700,color:C.violet,letterSpacing:'0.05em' }}>EL REGALO QUE CAMBIA VIDAS</span>
            </div>
            <h1 style={{ fontSize:'clamp(30px,5.5vw,52px)',fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.08,
              marginBottom:16,fontFamily:'Georgia,serif',color:C.text }}>
              El mejor regalo<br />
              <span style={{ background:'linear-gradient(135deg,#7c3aed,#9333ea,#ec4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
                es el autocuidado
              </span>
            </h1>
            <p style={{ fontSize:17,color:C.muted,maxWidth:420,margin:'0 auto',lineHeight:1.65 }}>
              Regala sesiones de terapia online. Un gesto que acompaña, apoya, y transforma.
            </p>
          </div>

          {/* Two-column */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,alignItems:'start' }}>

            {/* LEFT: form */}
            <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:16 }}>

              {/* Amount card */}
              <div style={{ background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:24,
                boxShadow:'0 4px 24px rgba(124,58,237,0.06)' }}>
                <p style={{ fontSize:11,fontWeight:700,color:C.subtle,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:16 }}>Monto del regalo</p>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:8 }}>
                  {PRESET_AMOUNTS.map(a => (
                    <button key={a} type="button" onClick={() => { setAmount(a); setUseCustom(false) }}
                      style={{
                        padding:'14px 0',borderRadius:14,fontWeight:800,fontSize:18,cursor:'pointer',transition:'all 0.18s',
                        border:`2px solid ${!useCustom && amount===a ? '#7c3aed' : 'rgba(167,139,250,0.25)'}`,
                        background: !useCustom && amount===a
                          ? 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(109,40,217,0.06))'
                          : 'white',
                        color: !useCustom && amount===a ? C.violet : C.muted,
                        boxShadow: !useCustom && amount===a ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
                      }}>
                      ${a}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => setUseCustom(true)}
                  style={{
                    width:'100%',padding:'11px 0',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.18s',
                    border:`1.5px dashed ${useCustom ? C.violet : 'rgba(167,139,250,0.35)'}`,
                    background: useCustom ? 'rgba(124,58,237,0.06)' : 'transparent',
                    color: useCustom ? C.violet : C.subtle,
                  }}>
                  Otro monto (mín. $50 USD)
                </button>

                {useCustom && (
                  <div style={{ marginTop:10,position:'relative' }}>
                    <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:C.muted,fontWeight:700 }}>$</span>
                    <input type="number" min="50" step="1" placeholder="50"
                      value={customAmt} onChange={e => setCustomAmt(e.target.value)}
                      className={inputCls} style={{ paddingLeft:28,paddingRight:52 }} />
                    <span style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:C.subtle,fontSize:12 }}>USD</span>
                  </div>
                )}

                {/* Total */}
                <div style={{ marginTop:12,background:'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(109,40,217,0.04))',
                  borderRadius:12,padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',
                  border:'1px solid rgba(124,58,237,0.12)' }}>
                  <span style={{ fontSize:13,color:C.muted }}>Total a pagar</span>
                  <span style={{ fontWeight:800,fontSize:17,color:C.violet }}>${finalAmount} USD</span>
                </div>
              </div>

              {/* De parte de */}
              <div style={{ background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:24,
                boxShadow:'0 4px 24px rgba(124,58,237,0.06)',display:'flex',flexDirection:'column',gap:14 }}>
                <p style={{ fontSize:11,fontWeight:700,color:C.subtle,letterSpacing:'0.12em',textTransform:'uppercase' }}>De parte de</p>
                <Field label="Tu nombre *">
                  <input name="senderName" value={form.senderName} onChange={handleChange}
                    placeholder="Tu nombre completo" required className={inputCls} />
                </Field>
                <Field label="Tu email *">
                  <input name="senderEmail" type="email" value={form.senderEmail} onChange={handleChange}
                    placeholder="tu@email.com" required className={inputCls} />
                </Field>
              </div>

              {/* Para */}
              <div style={{ background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:24,
                boxShadow:'0 4px 24px rgba(124,58,237,0.06)',display:'flex',flexDirection:'column',gap:14 }}>
                <p style={{ fontSize:11,fontWeight:700,color:C.subtle,letterSpacing:'0.12em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:6 }}>
                  <Heart size={12} style={{ color:'#ec4899' }} /> Para
                </p>
                <Field label="Nombre del destinatario *">
                  <input name="recipientName" value={form.recipientName} onChange={handleChange}
                    placeholder="¿A quién le regalas?" required className={inputCls} />
                </Field>
                <Field label="Email del destinatario *">
                  <input name="recipientEmail" type="email" value={form.recipientEmail} onChange={handleChange}
                    placeholder="su@email.com" required className={inputCls} />
                </Field>
                <Field label="Mensaje personal (opcional)">
                  <textarea name="message" value={form.message} onChange={handleChange}
                    placeholder="Escríbele algo especial…" rows={3}
                    className={inputCls} style={{ resize:'none' }} />
                </Field>
              </div>

              {/* CTA */}
              <button type="submit"
                style={{
                  width:'100%',padding:'16px 0',borderRadius:16,fontWeight:800,fontSize:16,
                  background:'linear-gradient(135deg,#7c3aed 0%,#9333ea 50%,#ec4899 100%)',
                  color:'white',border:'none',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                  boxShadow:'0 8px 32px rgba(124,58,237,0.35)',transition:'box-shadow 0.2s',
                }}
                onMouseOver={e=>e.currentTarget.style.boxShadow='0 12px 40px rgba(124,58,237,0.50)'}
                onMouseOut={e=>e.currentTarget.style.boxShadow='0 8px 32px rgba(124,58,237,0.35)'}
              >
                Continuar al pago <ChevronRight size={18} strokeWidth={2.5} />
              </button>

              {/* Trust badges */}
              <div style={{ display:'flex',justifyContent:'center',gap:20 }}>
                {[
                  { icon:<Shield size={13}/>, label:'Pago seguro SSL' },
                  { icon:<Clock size={13}/>,  label:'Entrega inmediata' },
                  { icon:<Star size={13}/>,   label:'Válido 12 meses' },
                ].map(({icon,label}) => (
                  <div key={label} style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.subtle }}>
                    <span style={{ color:'rgba(124,58,237,0.5)' }}>{icon}</span>{label}
                  </div>
                ))}
              </div>
            </form>

            {/* RIGHT: preview + how it works */}
            <div style={{ position:'sticky',top:32,display:'flex',flexDirection:'column',gap:20 }}>
              <div>
                <p style={{ fontSize:11,fontWeight:700,color:C.subtle,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12 }}>
                  Vista previa de la tarjeta
                </p>
                <GiftCardPreview amount={finalAmount}
                  sender={form.senderName || 'Tu nombre'}
                  recipient={form.recipientName || 'Nombre del destinatario'} />
              </div>

              {/* How it works */}
              <div style={{ background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:24,
                boxShadow:'0 4px 24px rgba(124,58,237,0.06)' }}>
                <p style={{ fontSize:11,fontWeight:700,color:C.subtle,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:18 }}>
                  ¿Cómo funciona?
                </p>
                {[
                  { n:'01', title:'Completa el formulario',  desc:'Elige el monto y los datos del destinatario.' },
                  { n:'02', title:'Paga con PayPal',         desc:'Pago seguro en USD. Procesado al instante.' },
                  { n:'03', title:'El código llega al email',desc:'El destinatario recibe el código PSICO-XXXX-XXXX.' },
                  { n:'04', title:'Canjea en la plataforma', desc:'Se aplica como crédito en la próxima sesión.' },
                ].map(({n,title,desc}) => (
                  <div key={n} style={{ display:'flex',gap:14,marginBottom:16 }}>
                    <div style={{ minWidth:28,height:28,borderRadius:8,background:'rgba(124,58,237,0.1)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:11,fontWeight:800,color:C.violet,marginTop:1 }}>{n}</div>
                    <div>
                      <p style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:2 }}>{title}</p>
                      <p style={{ fontSize:12,color:C.muted,lineHeight:1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAYMENT ────────────────────────────────── */}
      {step === 'payment' && (
        <div style={{ position:'relative',zIndex:10,maxWidth:520,margin:'0 auto',padding:'0 20px 80px' }}>
          <button onClick={() => setStep('form')}
            style={{ display:'flex',alignItems:'center',gap:6,fontSize:13,color:C.muted,
              background:'none',border:'none',cursor:'pointer',marginBottom:32 }}
            className="hover:text-violet-700 transition-colors">
            ← Editar datos
          </button>

          <GiftCardPreview amount={finalAmount} sender={form.senderName} recipient={form.recipientName} mini />

          {/* Summary */}
          <div style={{ background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:24,
            marginTop:20,marginBottom:20,boxShadow:'0 4px 24px rgba(124,58,237,0.06)' }}>
            <p style={{ fontSize:11,fontWeight:700,color:C.subtle,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:16 }}>Resumen</p>
            {[['De',form.senderName],['Para',form.recipientName],['Email destino',form.recipientEmail]].map(([k,v]) => (
              <div key={k} style={{ display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13 }}>
                <span style={{ color:C.muted }}>{k}</span>
                <span style={{ color:C.text,fontWeight:600 }}>{v}</span>
              </div>
            ))}
            {form.message && (
              <div style={{ margin:'8px 0 10px',padding:'10px 14px',background:'rgba(124,58,237,0.04)',
                borderRadius:10,fontSize:12,color:C.muted,fontStyle:'italic',border:'1px solid rgba(124,58,237,0.1)' }}>
                "{form.message}"
              </div>
            )}
            <div style={{ display:'flex',justifyContent:'space-between',borderTop:`1px solid rgba(167,139,250,0.2)`,
              paddingTop:14,marginTop:6,fontSize:16,fontWeight:800 }}>
              <span style={{ color:C.text }}>Total a pagar</span>
              <span style={{ color:C.violet }}>${finalAmount} USD</span>
            </div>
          </div>

          <div style={{ background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:24,
            boxShadow:'0 4px 24px rgba(124,58,237,0.06)' }}>
            <PayPalGiftButton formData={form} amountUsd={finalAmount}
              onSuccess={data => { setResult(data); setStep('success') }}
              onError={msg => toast.error(msg)} />
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              marginTop:14,fontSize:11,color:C.subtle }}>
              <Shield size={11} style={{ color:'rgba(124,58,237,0.5)' }} />
              Pago procesado de forma segura por PayPal · Encriptación SSL
            </div>
          </div>
        </div>
      )}

      {/* ─── SUCCESS ─────────────────────────────────── */}
      {step === 'success' && (
        <div style={{ position:'relative',zIndex:10,maxWidth:520,margin:'0 auto',padding:'20px 20px 80px',textAlign:'center' }}>

          <div style={{ width:80,height:80,borderRadius:'50%',margin:'0 auto 28px',
            background:'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(16,185,129,0.08))',
            border:'2px solid rgba(52,211,153,0.4)',
            display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Check size={38} strokeWidth={2.5} style={{ color:'#059669' }} />
          </div>

          <div style={{ display:'inline-flex',alignItems:'center',gap:6,
            background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.3)',
            borderRadius:999,padding:'5px 14px',marginBottom:16 }}>
            <span style={{ fontSize:12,fontWeight:700,color:'#059669',letterSpacing:'0.05em' }}>REGALO ENVIADO</span>
          </div>

          <h2 style={{ fontSize:36,fontWeight:900,letterSpacing:'-0.03em',marginBottom:12,
            fontFamily:'Georgia,serif',color:C.text }}>
            ¡Listo,{' '}
            <span style={{ background:'linear-gradient(135deg,#7c3aed,#ec4899)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
              gracias!
            </span>
          </h2>
          <p style={{ fontSize:15,color:C.muted,marginBottom:32,lineHeight:1.6 }}>
            El código llegará en minutos al email de <strong style={{ color:C.text }}>{form.recipientName}</strong>.
          </p>

          <div style={{ marginBottom:28 }}>
            <GiftCardPreview amount={finalAmount} sender={form.senderName} recipient={form.recipientName} />
            {result?.code && (
              <div style={{ marginTop:16,padding:'16px 24px',borderRadius:16,
                background:C.card,border:`1px solid ${C.cardBorder}`,
                boxShadow:'0 4px 20px rgba(124,58,237,0.08)' }}>
                <p style={{ fontSize:11,color:C.subtle,marginBottom:8,letterSpacing:'0.1em',textTransform:'uppercase' }}>Código de referencia</p>
                <p style={{ fontFamily:'monospace',fontSize:22,fontWeight:900,letterSpacing:'0.15em',color:C.violet }}>{result.code}</p>
                <p style={{ fontSize:11,color:C.subtle,marginTop:6 }}>Guárdalo como referencia · Ya fue enviado al destinatario</p>
              </div>
            )}
          </div>

          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <button onClick={() => navigate('/')}
              style={{ width:'100%',padding:'15px 0',borderRadius:16,fontWeight:700,fontSize:15,
                background:'linear-gradient(135deg,#7c3aed,#9333ea)',color:'white',border:'none',cursor:'pointer',
                boxShadow:'0 8px 24px rgba(124,58,237,0.30)' }}>
              Volver al inicio
            </button>
            <button onClick={() => { setStep('form'); setResult(null); setForm({ senderName:'',senderEmail:'',recipientName:'',recipientEmail:'',message:'' }) }}
              style={{ fontSize:13,color:C.muted,background:'none',border:'none',cursor:'pointer',padding:'8px 0' }}
              className="hover:text-violet-700 transition-colors">
              Enviar otro regalo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
