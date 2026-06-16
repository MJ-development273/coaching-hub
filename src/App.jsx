import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { SEED_DRILLS } from './drills'

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Strength & Conditioning', 'Passing', 'Tackling', 'Attacking', 'Age Group Changes']
const AGE_GROUPS = ['U11', 'U12', 'U13', 'U14', 'U15']
const COACH_PIN = '1234' // ← Change this to your preferred PIN

const CAT_COLORS = {
  'Passing':                  { pill:'bg-blue-100 text-blue-800',   border:'border-blue-300',   bg:'bg-blue-50',   icon:'🎯', accent:'#3b82f6' },
  'Tackling':                 { pill:'bg-red-100 text-red-800',     border:'border-red-300',    bg:'bg-red-50',    icon:'🛡️', accent:'#ef4444' },
  'Attacking':                { pill:'bg-amber-100 text-amber-800', border:'border-amber-300',  bg:'bg-amber-50',  icon:'⚡', accent:'#f59e0b' },
  'Strength & Conditioning':  { pill:'bg-green-100 text-green-800', border:'border-green-300',  bg:'bg-green-50',  icon:'💪', accent:'#22c55e' },
  'Age Group Changes':        { pill:'bg-purple-100 text-purple-800',border:'border-purple-300',bg:'bg-purple-50', icon:'📈', accent:'#8b5cf6' },
}

// ─── SVG Diagrams ─────────────────────────────────────────────────────────────
function DrillDiagram({ type, category }) {
  const accent = (CAT_COLORS[category] || {}).accent || '#22c55e'
  const overlays = {
    rondo: <>{[0,51,103,154,205,257,309].map((a,i)=>{const r=68,cx=100+r*Math.cos((a-90)*Math.PI/180),cy=100+r*Math.sin((a-90)*Math.PI/180);return <circle key={i} cx={cx} cy={cy} r="10" fill={accent} stroke="#fff" strokeWidth="1.5"/>})}<circle cx="83" cy="88" r="10" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/><circle cx="117" cy="112" r="10" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/><circle cx="100" cy="100" r="7" fill="white" opacity="0.9"/>{[[100,100,32,32],[100,100,168,32],[100,100,168,168]].map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6"/>)}</>,
    weave: <>{[1,2,3,4,5,6].map(i=><polygon key={i} points={`${25*i+5},${i%2===0?75:125} ${25*i-3},${i%2===0?92:108} ${25*i+13},${i%2===0?92:108}`} fill={accent} stroke="#fff" strokeWidth="1"/>)}<path d="M12,155 Q37,75 62,115 Q87,155 112,75 Q137,35 162,95" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="6,3"/><circle cx="12" cy="155" r="9" fill="#22c55e" stroke="#fff" strokeWidth="1.5"/></>,
    tackle: <><circle cx="68" cy="100" r="12" fill={accent} stroke="#fff" strokeWidth="1.5"/><circle cx="132" cy="100" r="12" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/><circle cx="100" cy="114" r="7" fill="white" opacity="0.9"/><path d="M80,100 L120,100" stroke="white" strokeWidth="1.5" strokeDasharray="4,3"/><defs><marker id="ar1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#60a5fa"/></marker></defs><path d="M123,88 Q110,72 100,80" fill="none" stroke="#60a5fa" strokeWidth="1.5" markerEnd="url(#ar1)"/></>,
    '3v2': <><rect x="76" y="158" width="48" height="22" fill="none" stroke="white" strokeWidth="2"/>{[[58,48],[100,38],[142,52]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="10" fill={accent} stroke="#fff" strokeWidth="1.5"/>)}{[[78,112],[122,112]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="10" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/>)}<circle cx="100" cy="172" r="8" fill="#94a3b8" stroke="#fff" strokeWidth="1.5"/><circle cx="100" cy="62" r="7" fill="white" opacity="0.9"/><path d="M58,48 Q79,55 100,62" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3"/><path d="M100,62 Q121,57 142,52" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3"/></>,
    positions: <><circle cx="100" cy="178" r="9" fill="#94a3b8" stroke="#fff" strokeWidth="1.5"/>{[[42,148],[80,143],[120,143],[158,148]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="9" fill="#3b82f6" stroke="#fff" strokeWidth="1.5"/>)}{[[62,108],[100,103],[138,108]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="9" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5"/>)}{[[45,62],[100,45],[155,62]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="9" fill={accent} stroke="#fff" strokeWidth="1.5"/>)}</>,
    default: <>{[[60,70],[140,70],[60,130],[140,130]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="9" fill={accent} stroke="#fff" strokeWidth="1.5"/>)}<circle cx="100" cy="100" r="20" fill="none" stroke={accent} strokeWidth="2" opacity="0.4"/><circle cx="100" cy="100" r="8" fill="white" opacity="0.7"/></>,
  }
  const overlay = overlays[type] || overlays.default
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="#14532d" rx="4"/>
      <rect x="10" y="10" width="180" height="180" fill="none" stroke="#166534" strokeWidth="1" opacity="0.4"/>
      <line x1="100" y1="10" x2="100" y2="190" stroke="#166534" strokeWidth="0.8" opacity="0.3"/>
      <line x1="10" y1="100" x2="190" y2="100" stroke="#166534" strokeWidth="0.8" opacity="0.3"/>
      {overlay}
    </svg>
  )
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const check = () => {
    if (pin === COACH_PIN) { onAuth('coach') }
    else { setErr('Incorrect PIN. Try again.'); setPin('') }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-900 px-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">⚽</div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Coaching Hub</h1>
        <p className="text-sm text-gray-500 mb-6">Junior Football · Wales</p>
        <p className="text-sm font-semibold text-gray-700 mb-3">Enter your coach PIN</p>
        <input
          type="password" value={pin} onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="••••" maxLength={6}
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold focus:outline-none focus:border-green-500 mb-3"
        />
        {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
        <button onClick={check} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl mb-4 transition-colors">
          Sign In as Coach
        </button>
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 mb-2">Parent or player?</p>
          <button onClick={() => onAuth('parent')} className="w-full border-2 border-amber-400 text-amber-700 font-semibold py-2.5 rounded-xl hover:bg-amber-50 transition-colors">
            View Home Drills 🏠
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ children, onClose, wide }) {
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold z-10">✕</button>
        {children}
      </div>
    </div>
  )
}

// ─── Drill Card ───────────────────────────────────────────────────────────────
function DrillCard({ drill, onClick, onShare, isCoach }) {
  const cc = CAT_COLORS[drill.category] || { pill: 'bg-gray-100 text-gray-700' }
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="h-32 cursor-pointer relative" onClick={() => onClick(drill)}>
        <DrillDiagram type={drill.diagram} category={drill.category} />
        {drill.home_ready && <span className="absolute top-2 right-2 bg-amber-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">🏠</span>}
        {drill.is_custom && <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">New</span>}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1 cursor-pointer" onClick={() => onClick(drill)}>
        <h3 className="font-semibold text-gray-900 text-xs leading-tight">{drill.title}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${cc.pill}`}>{drill.category}</span>
        <div className="flex gap-2">
          <span className="text-xs text-gray-400">⏱ {drill.duration}</span>
          <span className="text-xs text-gray-400">👥 {drill.players}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {(drill.age_groups || []).map(ag => <span key={ag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ag}</span>)}
        </div>
      </div>
      {isCoach && (
        <div className="px-3 pb-3">
          <button onClick={e => { e.stopPropagation(); onShare(drill) }} className="w-full text-xs bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-1.5 rounded-lg border border-green-200 transition-colors">
            📲 Share
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Drill Detail ─────────────────────────────────────────────────────────────
function DrillDetail({ drill, onClose, isCoach }) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="h-48 rounded-xl overflow-hidden mb-5"><DrillDiagram type={drill.diagram} category={drill.category} /></div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-900">{drill.title}</h2>
          {drill.home_ready && <span className="shrink-0 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">🏠 Home</span>}
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(CAT_COLORS[drill.category] || {}).pill || 'bg-gray-100'}`}>{drill.category}</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">⏱ {drill.duration}</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">👥 {drill.players}</span>
          {(drill.age_groups || []).map(ag => <span key={ag} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{ag}</span>)}
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">How to run this drill</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{drill.description}</p>
        </div>
        {isCoach && drill.coach_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-1">📋 Coach Notes</h4>
            <p className="text-sm text-amber-700 leading-relaxed">{drill.coach_notes}</p>
          </div>
        )}
        {!isCoach && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-1">💡 Practising at home</h4>
            <p className="text-sm text-blue-700 leading-relaxed">Find a safe open space — a garden or park works great. Plastic bottles or jumpers can substitute for cones. Start slow and focus on technique before trying to go fast.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Add Drill Form ───────────────────────────────────────────────────────────
function AddDrillForm({ onSave, onClose }) {
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], age_groups: ['U11'], duration: '', players: '', description: '', coach_notes: '', home_ready: false, diagram: 'default' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleAge = ag => set('age_groups', form.age_groups.includes(ag) ? form.age_groups.filter(a => a !== ag) : [...form.age_groups, ag])
  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) { alert('Please add a title and description.'); return }
    setSaving(true)
    await onSave({ ...form, is_custom: true })
    setSaving(false)
  }
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">➕ Add New Drill</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Drill Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. 1v1 Gate Drill" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Diagram Style</label>
              <select value={form.diagram} onChange={e => set('diagram', e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500">
                {['default', 'rondo', 'weave', 'tackle', '3v2', 'positions'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Duration</label>
              <input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 15 min" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Players</label>
              <input value={form.players} onChange={e => set('players', e.target.value)} placeholder="e.g. Pairs" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Age Groups</label>
            <div className="flex gap-2 flex-wrap">
              {AGE_GROUPS.map(ag => (
                <button key={ag} onClick={() => toggleAge(ag)} className={`px-3 py-1 rounded-full text-sm border transition-all ${form.age_groups.includes(ag) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}>{ag}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Step-by-step instructions..." className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Coach Notes <span className="text-gray-400 font-normal">(private — not shown to parents)</span></label>
            <textarea value={form.coach_notes} onChange={e => set('coach_notes', e.target.value)} rows={2} placeholder="Key coaching points, common mistakes..." className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
            <input type="checkbox" checked={form.home_ready} onChange={e => set('home_ready', e.target.checked)} className="w-4 h-4 accent-amber-500" />
            <span className="text-sm text-amber-800 font-medium">🏠 Suitable for home practice — show to parents</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button onClick={save} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
              {saving ? 'Saving…' : 'Save Drill'}
            </button>
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Share Drill Modal ────────────────────────────────────────────────────────
function ShareDrillModal({ drill, onClose }) {
  const [target, setTarget] = useState('coaches')
  const text = target === 'coaches'
    ? `⚽ *Training Drill — ${drill.title}*\n\n📋 ${drill.category} | ${(drill.age_groups || []).join(', ')}\n⏱ ${drill.duration} | 👥 ${drill.players}\n\n${drill.description}${drill.coach_notes ? `\n\n📋 *Coach Notes:* ${drill.coach_notes}` : ''}\n\n— Coaching Hub`
    : `⚽ *Home Practice — ${drill.title}*\n\nHere's a drill for your child to try at home!\n\n📋 ${drill.category} | ${(drill.age_groups || []).join(', ')}\n⏱ ${drill.duration}\n\n${drill.description}\n\n💡 A garden or park works perfectly — bottles or jumpers for cones!\n\n— Your Coaching Team`
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">📲 Share via WhatsApp</h2>
        <p className="text-sm text-gray-500 mb-4">Who are you sending this to?</p>
        <div className="flex gap-2 mb-4">
          {['coaches', 'parents'].map(t => (
            <button key={t} onClick={() => setTarget(t)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${target === t ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}>
              {t === 'coaches' ? '👨‍🏫 Coaches' : '👪 Parents'}
            </button>
          ))}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">{text}</div>
        <div className="flex gap-3">
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-center transition-colors text-sm">Open in WhatsApp</a>
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl transition-colors text-sm">Close</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Training Planner ─────────────────────────────────────────────────────────
function generatePlan(drills, weekNum, ageFilter) {
  const plan = {}
  CATEGORIES.forEach(cat => {
    const pool = drills.filter(d => d.category === cat && (ageFilter === 'All' || (d.age_groups || []).includes(ageFilter)))
    if (pool.length === 0) return
    const sorted = [...pool].sort((a, b) => (a.id > b.id ? 1 : -1))
    plan[cat] = sorted[(weekNum - 1) % sorted.length]
  })
  return plan
}

function SwapDrillModal({ category, drills, ageFilter, currentDrill, onSwap, onClose }) {
  const pool = drills.filter(d => d.category === category && (ageFilter === 'All' || (d.age_groups || []).includes(ageFilter)))
  return (
    <Modal onClose={onClose} wide>
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Swap {category} drill</h2>
        <p className="text-sm text-gray-500 mb-4">Pick a replacement for this week's session:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
          {pool.map(d => (
            <div key={d.id} onClick={() => onSwap(category, d)}
              className={`bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-green-400 ${d.id === currentDrill?.id ? 'border-green-500 shadow-md' : 'border-gray-200'}`}>
              <div className="h-20"><DrillDiagram type={d.diagram} category={d.category} /></div>
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-900 leading-tight">{d.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">⏱ {d.duration}</p>
              </div>
              {d.id === currentDrill?.id && <div className="bg-green-600 text-white text-xs font-bold text-center py-1">✓ Current</div>}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
      </div>
    </Modal>
  )
}

function SharePlanModal({ plan, weekNum, sessionDate, sessionNotes, onClose }) {
  const dateStr = sessionDate || `Week ${weekNum}`
  const lines = [`⚽ *Training Session Plan — ${dateStr}*\n`]
  CATEGORIES.forEach(cat => {
    const drill = plan[cat]
    if (!drill) return
    const cc = CAT_COLORS[cat]
    lines.push(`${cc?.icon || '📋'} *${cat}*\n${drill.title}\n⏱ ${drill.duration} | 👥 ${drill.players}\n${drill.description}`)
  })
  if (sessionNotes) lines.push(`\n📝 *Session Notes:*\n${sessionNotes}`)
  lines.push('\n— Coaching Hub')
  const text = lines.join('\n\n')
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">📲 Share Session Plan</h2>
        <p className="text-sm text-gray-500 mb-4">Send the full week's session to your coaching team.</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">{text}</div>
        <div className="flex gap-3">
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-center transition-colors text-sm">Open in WhatsApp</a>
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl transition-colors text-sm">Close</button>
        </div>
      </div>
    </Modal>
  )
}

function TrainingPlanner({ drills }) {
  const [weekNum, setWeekNum] = useState(1)
  const [ageFilter, setAgeFilter] = useState('U11')
  const [overrides, setOverrides] = useState({})
  const [swapTarget, setSwapTarget] = useState(null)
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [detailDrill, setDetailDrill] = useState(null)

  const basePlan = generatePlan(drills, weekNum, ageFilter)
  const weekOverrides = overrides[weekNum] || {}
  const plan = { ...basePlan }
  Object.keys(weekOverrides).forEach(cat => { if (weekOverrides[cat]) plan[cat] = weekOverrides[cat] })

  const handleSwap = (category, drill) => {
    setOverrides(prev => ({ ...prev, [weekNum]: { ...(prev[weekNum] || {}), [category]: drill } }))
    setSwapTarget(null)
  }

  const totalMins = Object.values(plan).reduce((s, d) => s + (parseInt(d?.duration) || 0), 0)

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-sm">📅 Session Planner</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">~{totalMins} min total</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Week</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekNum(w => Math.max(1, w - 1))} className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors">‹</button>
              <span className="flex-1 text-center font-bold text-gray-900 text-sm">Week {weekNum}</span>
              <button onClick={() => setWeekNum(w => w + 1)} className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors">›</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Age Group</label>
            <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500">
              <option value="All">All Ages</option>
              {AGE_GROUPS.map(ag => <option key={ag}>{ag}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Session Date</label>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Session Notes</label>
            <input value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="e.g. Focus on fitness" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {CATEGORIES.map(cat => {
          const drill = plan[cat]
          const cc = CAT_COLORS[cat]
          const isOverridden = !!weekOverrides[cat]
          if (!drill) return (
            <div key={cat} className={`border-2 border-dashed ${cc.border} ${cc.bg} rounded-2xl p-4 flex items-center gap-2`}>
              <span className="text-lg">{cc.icon}</span>
              <div><p className="text-xs font-bold text-gray-700">{cat}</p><p className="text-xs text-gray-400">No drills available for {ageFilter}</p></div>
            </div>
          )
          return (
            <div key={cat} className={`bg-white border-2 ${isOverridden ? 'border-green-400' : 'border-gray-200'} rounded-2xl overflow-hidden`}>
              <div className={`px-4 py-2 flex items-center justify-between ${cc.bg} border-b ${cc.border}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{cc.icon}</span>
                  <span className="text-xs font-bold text-gray-700">{cat}</span>
                  {isOverridden && <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">Swapped</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">⏱ {drill.duration}</span>
                  <button onClick={() => setSwapTarget(cat)} className="text-xs font-semibold text-gray-500 hover:text-green-700 underline underline-offset-2 transition-colors">swap</button>
                </div>
              </div>
              <div className="flex gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setDetailDrill(drill)}>
                <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0"><DrillDiagram type={drill.diagram} category={drill.category} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{drill.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{drill.description}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(drill.age_groups || []).map(ag => <span key={ag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ag}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={() => setShareOpen(true)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2">
        <span>📲</span> Share This Session Plan
      </button>
      <p className="text-center text-xs text-gray-400 mt-2">Sends all 5 drills to your coaches via WhatsApp</p>

      {swapTarget && <SwapDrillModal category={swapTarget} drills={drills} ageFilter={ageFilter} currentDrill={plan[swapTarget]} onSwap={handleSwap} onClose={() => setSwapTarget(null)} />}
      {shareOpen && <SharePlanModal plan={plan} weekNum={weekNum} sessionDate={sessionDate} sessionNotes={sessionNotes} onClose={() => setShareOpen(false)} />}
      {detailDrill && <DrillDetail drill={detailDrill} onClose={() => setDetailDrill(null)} isCoach={true} />}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null)
  const [view, setView] = useState('drills')
  const [drills, setDrills] = useState([])
  const [filterCat, setFilterCat] = useState('All')
  const [filterAge, setFilterAge] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [shareTarget, setShareTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)

  // ── Load drills from Supabase ──
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('drills').select('*').order('id')
        if (error) throw error
        if (!data || data.length === 0) {
          // First run — seed the database
          const { error: insertError } = await supabase.from('drills').insert(SEED_DRILLS)
          if (insertError) throw insertError
          setDrills(SEED_DRILLS)
        } else {
          setDrills(data)
        }
      } catch (e) {
        console.error('Supabase error:', e)
        setDbError(true)
        setDrills(SEED_DRILLS) // fallback to local data
      }
      setLoading(false)
    }
    load()
  }, [])

  // ── Real-time updates — all coaches see new drills instantly ──
  useEffect(() => {
    const channel = supabase.channel('drills-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'drills' }, payload => {
        setDrills(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const addDrill = async (drill) => {
    try {
      const { data, error } = await supabase.from('drills').insert([drill]).select().single()
      if (error) throw error
      setDrills(prev => [...prev, data])
    } catch {
      // fallback — add locally only
      setDrills(prev => [...prev, { ...drill, id: Date.now() }])
    }
    setShowAdd(false)
  }

  const isCoach = role === 'coach'
  const isParent = role === 'parent' || view === 'home'

  if (!role) return <AuthScreen onAuth={r => { setRole(r); if (r === 'parent') setView('home') }} />

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
      <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-2xl animate-pulse">⚽</div>
      <p className="text-green-700 font-semibold text-sm">Loading drills…</p>
    </div>
  )

  const filtered = drills.filter(d => {
    if (isParent && !d.home_ready) return false
    if (filterCat !== 'All' && d.category !== filterCat) return false
    if (filterAge !== 'All' && !(d.age_groups || []).includes(filterAge)) return false
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = drills.filter(d => d.category === c && (!isParent || d.home_ready)).length
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      {dbError && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-xs text-amber-800 font-medium">
          ⚠️ Running in offline mode — add your Supabase keys in src/supabase.js to enable shared data
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center text-white text-lg">⚽</div>
              <div>
                <h1 className="font-black text-gray-900 text-sm leading-tight">Coaching Hub</h1>
                <p className="text-xs text-gray-400">Junior Football · Wales · {isCoach ? 'Coach' : 'Parent'} View</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCoach && view === 'drills' && (
                <button onClick={() => setShowAdd(true)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">+ Add</button>
              )}
              <button onClick={() => setRole(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">Sign out</button>
            </div>
          </div>
          {isCoach && (
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setView('drills')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'drills' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}>📋 Drills</button>
              <button onClick={() => setView('planner')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'planner' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>📅 Planner</button>
              <button onClick={() => setView('home')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'home' ? 'bg-white shadow text-amber-600' : 'text-gray-500'}`}>🏠 Home</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {isCoach && view === 'planner' && <TrainingPlanner drills={drills} />}

        {view !== 'planner' && (
          <>
            {isParent && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3 items-start">
                <span className="text-2xl">🏠</span>
                <div>
                  <p className="font-bold text-amber-800 text-sm">Home Practice Drills</p>
                  <p className="text-xs text-amber-700 mt-0.5">Selected by your coaches — garden or local park friendly.</p>
                </div>
              </div>
            )}
            {isCoach && view === 'drills' && (
              <div className="grid grid-cols-5 gap-2 mb-5">
                {CATEGORIES.map(c => (
                  <div key={c} onClick={() => setFilterCat(filterCat === c ? 'All' : c)}
                    className={`bg-white border rounded-xl p-2.5 text-center cursor-pointer hover:border-green-400 transition-all ${filterCat === c ? 'border-green-500 shadow-sm' : ''}`}>
                    <div className="text-lg font-black text-gray-900">{catCounts[c]}</div>
                    <div className="text-gray-500 leading-tight mt-0.5" style={{ fontSize: '9px' }}>{CAT_COLORS[c]?.icon} {c.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2 mb-5">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drills…" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-white" />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['All', ...CATEGORIES].map(cat => (
                  <button key={cat} onClick={() => setFilterCat(cat)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterCat === cat ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>{cat}</button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['All', ...AGE_GROUPS].map(ag => (
                  <button key={ag} onClick={() => setFilterAge(ag)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterAge === ag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>{ag}</button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">{filtered.length} drill{filtered.length !== 1 ? 's' : ''} shown</p>
            {filtered.length === 0
              ? <div className="text-center py-20"><div className="text-5xl mb-3">⚽</div><p className="font-bold text-gray-600">No drills found</p><p className="text-sm text-gray-400 mt-1">{isParent ? 'No home drills match this filter.' : 'Try a different filter or add a new drill.'}</p></div>
              : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{filtered.map(drill => <DrillCard key={drill.id} drill={drill} onClick={setSelected} onShare={setShareTarget} isCoach={isCoach && view === 'drills'} />)}</div>
            }
          </>
        )}
      </main>

      {selected && <DrillDetail drill={selected} onClose={() => setSelected(null)} isCoach={isCoach && view !== 'home'} />}
      {showAdd && <AddDrillForm onSave={addDrill} onClose={() => setShowAdd(false)} />}
      {shareTarget && <ShareDrillModal drill={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  )
}
