import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { SEED_DRILLS } from './drills'

// ─── Theme ────────────────────────────────────────────────────────────────────
// Primary navy: #1e3a5f  Hover navy: #152d4a  Light navy bg: #eef1f7
const N = { bg:'#1e3a5f', hover:'#152d4a', light:'#eef1f7', border:'#1e3a5f', text:'#1e3a5f' }

const CATEGORIES = ['Strength & Conditioning', 'Passing', 'Tackling', 'Attacking', 'Age Group Changes']
const AGE_GROUPS = ['U12', 'U13', 'U14', 'U15']
const COACH_PIN = '1234'

const CAT_COLORS = {
  'Passing':                  { pill:'bg-blue-100 text-blue-800',    border:'border-blue-300',    bg:'bg-blue-50',    icon:'🎯', accent:'#3b82f6' },
  'Tackling':                 { pill:'bg-red-100 text-red-800',      border:'border-red-300',     bg:'bg-red-50',     icon:'🛡️', accent:'#ef4444' },
  'Attacking':                { pill:'bg-amber-100 text-amber-800',  border:'border-amber-300',   bg:'bg-amber-50',   icon:'⚡', accent:'#f59e0b' },
  'Strength & Conditioning':  { pill:'bg-green-100 text-green-800',  border:'border-green-300',   bg:'bg-green-50',   icon:'💪', accent:'#22c55e' },
  'Age Group Changes':        { pill:'bg-purple-100 text-purple-800',border:'border-purple-300',  bg:'bg-purple-50',  icon:'📈', accent:'#8b5cf6' },
}

// ─── Reusable navy button style helpers ───────────────────────────────────────
const navyBtn  = { background: N.bg }
const navyBtnHover = (e) => { e.currentTarget.style.background = N.hover }
const navyBtnLeave = (e) => { e.currentTarget.style.background = N.bg }

// ─── SVG Diagrams ─────────────────────────────────────────────────────────────
function DrillDiagram({ type, category }) {
  const accent = (CAT_COLORS[category] || {}).accent || '#3b82f6'
  const overlays = {
    rondo: <>{[0,51,103,154,205,257,309].map((a,i)=>{const r=68,cx=100+r*Math.cos((a-90)*Math.PI/180),cy=100+r*Math.sin((a-90)*Math.PI/180);return <circle key={i} cx={cx} cy={cy} r="10" fill={accent} stroke="#fff" strokeWidth="1.5"/>})}<circle cx="83" cy="88" r="10" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/><circle cx="117" cy="112" r="10" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/><circle cx="100" cy="100" r="7" fill="white" opacity="0.9"/>{[[100,100,32,32],[100,100,168,32],[100,100,168,168]].map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6"/>)}</>,
    weave: <>{[1,2,3,4,5,6].map(i=><polygon key={i} points={`${25*i+5},${i%2===0?75:125} ${25*i-3},${i%2===0?92:108} ${25*i+13},${i%2===0?92:108}`} fill={accent} stroke="#fff" strokeWidth="1"/>)}<path d="M12,155 Q37,75 62,115 Q87,155 112,75 Q137,35 162,95" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="6,3"/><circle cx="12" cy="155" r="9" fill={accent} stroke="#fff" strokeWidth="1.5"/></>,
    tackle: <><circle cx="68" cy="100" r="12" fill={accent} stroke="#fff" strokeWidth="1.5"/><circle cx="132" cy="100" r="12" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/><circle cx="100" cy="114" r="7" fill="white" opacity="0.9"/><path d="M80,100 L120,100" stroke="white" strokeWidth="1.5" strokeDasharray="4,3"/><defs><marker id="ar1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={accent}/></marker></defs><path d="M123,88 Q110,72 100,80" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#ar1)"/></>,
    '3v2': <><rect x="76" y="158" width="48" height="22" fill="none" stroke="white" strokeWidth="2"/>{[[58,48],[100,38],[142,52]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="10" fill={accent} stroke="#fff" strokeWidth="1.5"/>)}{[[78,112],[122,112]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="10" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/>)}<circle cx="100" cy="172" r="8" fill="#94a3b8" stroke="#fff" strokeWidth="1.5"/><circle cx="100" cy="62" r="7" fill="white" opacity="0.9"/><path d="M58,48 Q79,55 100,62" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3"/><path d="M100,62 Q121,57 142,52" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3"/></>,
    positions: <><circle cx="100" cy="178" r="9" fill="#94a3b8" stroke="#fff" strokeWidth="1.5"/>{[[42,148],[80,143],[120,143],[158,148]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="9" fill={N.bg} stroke="#fff" strokeWidth="1.5"/>)}{[[62,108],[100,103],[138,108]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="9" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5"/>)}{[[45,62],[100,45],[155,62]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="9" fill={accent} stroke="#fff" strokeWidth="1.5"/>)}</>,
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

// ─── Auth ──────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const check = () => { if (pin === COACH_PIN) { onAuth('coach') } else { setErr('Incorrect PIN. Try again.'); setPin('') } }
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{background:N.bg}}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{background:N.bg}}>⚽</div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Clydach Juniors</h1>
        <p className="text-sm font-semibold text-gray-700 mb-3 mt-4">Enter your coach PIN</p>
        <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} placeholder="••••" maxLength={6}
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold focus:outline-none mb-3"
          style={{'--tw-ring-color':N.bg}} onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
        {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
        <button onClick={check} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}
          className="w-full text-white font-bold py-3 rounded-xl mb-4 transition-colors" style={navyBtn}>
          Sign In as Coach
        </button>
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 mb-2">Parent or player?</p>
          <button onClick={()=>onAuth('parent')} className="w-full border-2 font-semibold py-2.5 rounded-xl transition-colors"
            style={{borderColor:N.bg, color:N.text}}
            onMouseEnter={e=>{e.currentTarget.style.background=N.light}}
            onMouseLeave={e=>{e.currentTarget.style.background='white'}}>
            View This Week's Home Drills 🏠
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ children, onClose, wide }) {
  useEffect(()=>{const fn=e=>e.key==='Escape'&&onClose();window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide?'max-w-3xl':'max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold z-10">✕</button>
        {children}
      </div>
    </div>
  )
}

// ─── Drill Detail ─────────────────────────────────────────────────────────────
function DrillDetail({ drill, onClose, isCoach }) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="h-48 rounded-xl overflow-hidden mb-5"><DrillDiagram type={drill.diagram} category={drill.category}/></div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-900">{drill.title}</h2>
          {drill.home_ready && <span className="shrink-0 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">🏠 Home</span>}
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(CAT_COLORS[drill.category]||{}).pill||'bg-gray-100'}`}>{drill.category}</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">⏱ {drill.duration}</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">👥 {drill.players}</span>
          {(drill.age_groups||[]).map(ag=><span key={ag} className="text-xs px-2 py-1 rounded-full text-white" style={{background:N.bg}}>{ag}</span>)}
        </div>
        <div className="mb-4"><h4 className="text-sm font-semibold text-gray-800 mb-1">How to run this drill</h4><p className="text-sm text-gray-600 leading-relaxed">{drill.description}</p></div>
        {isCoach && drill.coach_notes && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4"><h4 className="text-sm font-semibold text-amber-800 mb-1">📋 Coach Notes</h4><p className="text-sm text-amber-700 leading-relaxed">{drill.coach_notes}</p></div>}
        {!isCoach && <div className="rounded-xl p-4" style={{background:N.light,border:`1px solid ${N.bg}22`}}><h4 className="text-sm font-semibold mb-1" style={{color:N.text}}>💡 Tips for practising at home</h4><p className="text-sm leading-relaxed" style={{color:N.text}}>Find a safe open space — a garden or park works great. Plastic bottles or jumpers can substitute for cones. Start slow and focus on getting the technique right before trying to go fast.</p></div>}
      </div>
    </Modal>
  )
}

// ─── Drill Card ───────────────────────────────────────────────────────────────
function DrillCard({ drill, onClick, onShare, isCoach }) {
  const cc = CAT_COLORS[drill.category] || { pill:'bg-gray-100 text-gray-700' }
  return (
    <div className="bg-white rounded-xl border border-gray-200 transition-all overflow-hidden flex flex-col"
      style={{'--hover-border':N.bg}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=N.bg}
      onMouseLeave={e=>e.currentTarget.style.borderColor='#e5e7eb'}>
      <div className="h-32 cursor-pointer relative" onClick={()=>onClick(drill)}>
        <DrillDiagram type={drill.diagram} category={drill.category}/>
        {drill.home_ready && <span className="absolute top-2 right-2 bg-amber-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">🏠</span>}
        {drill.is_custom && <span className="absolute top-2 left-2 text-white text-xs font-bold px-1.5 py-0.5 rounded-full" style={{background:N.bg}}>New</span>}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1 cursor-pointer" onClick={()=>onClick(drill)}>
        <h3 className="font-semibold text-gray-900 text-xs leading-tight">{drill.title}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${cc.pill}`}>{drill.category}</span>
        <div className="flex gap-2"><span className="text-xs text-gray-400">⏱ {drill.duration}</span><span className="text-xs text-gray-400">👥 {drill.players}</span></div>
        <div className="flex flex-wrap gap-1">{(drill.age_groups||[]).map(ag=><span key={ag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ag}</span>)}</div>
      </div>
      {isCoach && (
        <div className="px-3 pb-3">
          <button onClick={e=>{e.stopPropagation();onShare(drill)}}
            className="w-full text-xs font-semibold py-1.5 rounded-lg border transition-colors text-white"
            style={{background:N.bg, borderColor:N.bg}}
            onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}>
            📲 Share
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Filter Pill ─────────────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
      style={active
        ? {background:N.bg, color:'white', borderColor:N.bg}
        : {background:'white', color:'#4b5563', borderColor:'#e5e7eb'}}
      onMouseEnter={e=>{ if(!active){ e.currentTarget.style.borderColor=N.bg; e.currentTarget.style.color=N.text }}}
      onMouseLeave={e=>{ if(!active){ e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.color='#4b5563' }}}>
      {label}
    </button>
  )
}

// ─── Add Drill Form ───────────────────────────────────────────────────────────
function AddDrillForm({ onSave, onClose }) {
  const [form,setForm]=useState({title:'',category:CATEGORIES[0],age_groups:['U11'],duration:'',players:'',description:'',coach_notes:'',home_ready:false,diagram:'default'})
  const [saving,setSaving]=useState(false)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const toggleAge=ag=>set('age_groups',form.age_groups.includes(ag)?form.age_groups.filter(a=>a!==ag):[...form.age_groups,ag])
  const inputCls = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
  const focusNavy = e => e.target.style.borderColor = N.bg
  const blurGray  = e => e.target.style.borderColor = '#d1d5db'
  const save=async()=>{
    if(!form.title.trim()||!form.description.trim()){alert('Please add a title and description.');return}
    setSaving(true); await onSave({...form,is_custom:true}); setSaving(false)
  }
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">➕ Add New Drill</h2>
        <div className="space-y-4">
          <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Drill Title *</label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. 1v1 Gate Drill" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Category *</label><select value={form.category} onChange={e=>set('category',e.target.value)} className={inputCls} onFocus={focusNavy} onBlur={blurGray}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Diagram</label><select value={form.diagram} onChange={e=>set('diagram',e.target.value)} className={inputCls} onFocus={focusNavy} onBlur={blurGray}>{['default','rondo','weave','tackle','3v2','positions'].map(d=><option key={d}>{d}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Duration</label><input value={form.duration} onChange={e=>set('duration',e.target.value)} placeholder="e.g. 15 min" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
            <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Players</label><input value={form.players} onChange={e=>set('players',e.target.value)} placeholder="e.g. Solo" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Age Groups</label>
            <div className="flex gap-2 flex-wrap">
              {AGE_GROUPS.map(ag=>(
                <button key={ag} onClick={()=>toggleAge(ag)}
                  className="px-3 py-1 rounded-full text-sm border transition-all"
                  style={form.age_groups.includes(ag)?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#d1d5db'}}>
                  {ag}
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Description *</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={4} placeholder="Step-by-step instructions..." className={`${inputCls} resize-none`} onFocus={focusNavy} onBlur={blurGray}/></div>
          <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Coach Notes <span className="text-gray-400 font-normal">(private)</span></label><textarea value={form.coach_notes} onChange={e=>set('coach_notes',e.target.value)} rows={2} placeholder="Key coaching points..." className={`${inputCls} resize-none`} onFocus={focusNavy} onBlur={blurGray}/></div>
          <label className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 border" style={{background:N.light, borderColor:N.bg+'44'}}>
            <input type="checkbox" checked={form.home_ready} onChange={e=>set('home_ready',e.target.checked)} className="w-4 h-4"/>
            <span className="text-sm font-medium" style={{color:N.text}}>🏠 Available for home sessions</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button onClick={save} disabled={saving} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}
              className="flex-1 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              style={navyBtn}>{saving?'Saving…':'Save Drill'}</button>
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Share Drill Modal ────────────────────────────────────────────────────────
function ShareDrillModal({ drill, onClose }) {
  const [target,setTarget]=useState('coaches')
  const text=target==='coaches'
    ?`⚽ *Training Drill — ${drill.title}*\n\n📋 ${drill.category} | ${(drill.age_groups||[]).join(', ')}\n⏱ ${drill.duration} | 👥 ${drill.players}\n\n${drill.description}${drill.coach_notes?`\n\n📋 *Coach Notes:* ${drill.coach_notes}`:''}\n\n— Clydach Juniors`
    :`⚽ *Home Practice — ${drill.title}*\n\nHere's a drill for your child to try at home this week!\n\n📋 ${drill.category} | ${(drill.age_groups||[]).join(', ')}\n⏱ ${drill.duration}\n\n${drill.description}\n\n💡 A garden or park works perfectly — bottles or jumpers for cones!\n\n— Clydach Juniors Coaching Team`
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">📲 Share via WhatsApp</h2>
        <div className="flex gap-2 mb-4">
          {['coaches','parents'].map(t=>(
            <button key={t} onClick={()=>setTarget(t)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={target===t?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#d1d5db'}}>
              {t==='coaches'?'👨‍🏫 Coaches':'👪 Parents'}
            </button>
          ))}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">{text}</div>
        <div className="flex gap-3">
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
            className="flex-1 text-white font-bold py-3 rounded-xl text-center transition-colors text-sm"
            style={navyBtn} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}>Open in WhatsApp</a>
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors text-sm">Close</button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Training Planner ─────────────────────────────────────────────────────────
// Session structure: 10min warm-up + age group intro | 10min passing | 10min tackling | 10min attacking | 15min small game
const SESSION_BLOCKS = [
  { key:'warmup',   label:'Warm-Up & Age Group Topic', time:'10 min', icon:'🏃', cat:'Strength & Conditioning', fixed:false },
  { key:'passing',  label:'Passing Drill',              time:'10 min', icon:'🎯', cat:'Passing',                 fixed:false },
  { key:'tackling', label:'Tackling / Defending Drill', time:'10 min', icon:'🛡️', cat:'Tackling',                fixed:false },
  { key:'attack',   label:'Attacking Drill',            time:'10 min', icon:'⚡', cat:'Attacking',               fixed:false },
  { key:'smallgame',label:'Small Sided Game',           time:'15 min', icon:'⚽', cat:null,                      fixed:true  },
]

function pickDrill(drills, cat, weekNum, ageFilter) {
  const pool = drills.filter(d => d.category === cat && (ageFilter === 'All' || (d.age_groups||[]).includes(ageFilter)))
  if (!pool.length) return null
  const sorted = [...pool].sort((a,b) => a.id > b.id ? 1 : -1)
  return sorted[(weekNum - 1) % sorted.length]
}

function SharePlanModal({ session, weekNum, sessionDate, sessionNotes, ageFilter, onClose }) {
  const dateStr = sessionDate || `Week ${weekNum}`
  const lines = [`⚽ *Clydach Juniors — Training Session*\n📅 ${dateStr}${ageFilter!=='All'?' | '+ageFilter:''}\n`]
  lines.push(`🏃 *10 min — Warm-Up & Age Group Topic*\n${session.warmup ? session.warmup.title : 'Dynamic warm-up + coaching topic'}`)
  lines.push(`🎯 *10 min — Passing*\n${session.passing ? session.passing.title+'\n'+session.passing.description : 'Passing drill TBC'}`)
  lines.push(`🛡️ *10 min — Tackling / Defending*\n${session.tackling ? session.tackling.title+'\n'+session.tackling.description : 'Tackling drill TBC'}`)
  lines.push(`⚡ *10 min — Attacking*\n${session.attack ? session.attack.title+'\n'+session.attack.description : 'Attacking drill TBC'}`)
  lines.push(`⚽ *15 min — Small Sided Game*\nApply today's theme in a free small sided game. Keep teams even, rotate regularly.`)
  if (sessionNotes) lines.push(`📝 *Notes:* ${sessionNotes}`)
  lines.push('— Clydach Juniors Coaching Team')
  const text = lines.join('\n\n')
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">📲 Share Session Plan</h2>
        <p className="text-xs text-gray-500 mb-3">Full 1-hour session sent to your coaches via WhatsApp.</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">{text}</div>
        <div className="flex gap-3">
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
            className="flex-1 text-white font-bold py-3 rounded-xl text-center transition-colors text-sm"
            style={navyBtn} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}>Open in WhatsApp</a>
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors text-sm">Close</button>
        </div>
      </div>
    </Modal>
  )
}

function TrainingPlanner({ drills }) {
  const [weekNum,setWeekNum]=useState(1)
  const [ageFilter,setAgeFilter]=useState('U11')
  const [overrides,setOverrides]=useState({})
  const [swapTarget,setSwapTarget]=useState(null)
  const [sessionNotes,setSessionNotes]=useState('')
  const [sessionDate,setSessionDate]=useState('')
  const [shareOpen,setShareOpen]=useState(false)
  const [detailDrill,setDetailDrill]=useState(null)
  const inputCls="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
  const focusNavy=e=>e.target.style.borderColor=N.bg
  const blurGray=e=>e.target.style.borderColor='#d1d5db'

  // Build auto session
  const weekOverrides = overrides[`${weekNum}-${ageFilter}`] || {}
  const session = {}
  SESSION_BLOCKS.forEach(b => {
    if (b.fixed) return
    session[b.key] = weekOverrides[b.key] || (b.cat ? pickDrill(drills, b.cat, weekNum, ageFilter) : null)
  })

  const handleSwap = (key, drill) => {
    const okey = `${weekNum}-${ageFilter}`
    setOverrides(prev => ({ ...prev, [okey]: { ...(prev[okey]||{}), [key]: drill } }))
    setSwapTarget(null)
  }

  const swapBlock = SESSION_BLOCKS.find(b => b.key === swapTarget)

  return (
    <div>
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-sm">📅 1-Hour Session Planner</h2>
          <span className="text-xs font-semibold px-2 py-1 rounded-lg text-white" style={{background:N.bg}}>60 min</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Week</label>
            <div className="flex items-center gap-2">
              <button onClick={()=>setWeekNum(w=>Math.max(1,w-1))} className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50">‹</button>
              <span className="flex-1 text-center font-bold text-gray-900 text-sm">Week {weekNum}</span>
              <button onClick={()=>setWeekNum(w=>w+1)} className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50">›</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Age Group</label>
            <select value={ageFilter} onChange={e=>setAgeFilter(e.target.value)} className={inputCls} onFocus={focusNavy} onBlur={blurGray}>
              <option value="All">All Ages</option>
              {AGE_GROUPS.map(ag=><option key={ag}>{ag}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Session Date</label><input type="date" value={sessionDate} onChange={e=>setSessionDate(e.target.value)} className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
          <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Session Notes</label><input value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)} placeholder="e.g. Focus on pressing" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
        </div>
      </div>

      {/* Session timeline */}
      <div className="space-y-2 mb-4">
        {SESSION_BLOCKS.map((block, i) => {
          const drill = session[block.key]
          const isOverridden = !!(weekOverrides[block.key])
          const timeOffset = [0,10,20,30,40][i]

          // Fixed small game block
          if (block.fixed) return (
            <div key={block.key} className="bg-white rounded-2xl border-2 overflow-hidden" style={{borderColor:'#e5e7eb'}}>
              <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100" style={{background:'#f8fafc'}}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{block.icon}</span>
                  <span className="text-xs font-bold text-gray-700">{block.label}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Fixed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{timeOffset} min mark</span>
                  <span className="text-xs font-bold text-gray-500">{block.time}</span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">Free Small Sided Game</p>
                <p className="text-xs text-gray-500 leading-relaxed">Apply the session's theme in a free small sided game. Keep teams even, rotate regularly, and let the players express themselves. Avoid heavy coaching — observe and note what to work on next week.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Equal playing time</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Apply today's theme</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Rotate teams</span>
                </div>
              </div>
            </div>
          )

          // Drill blocks
          return (
            <div key={block.key} className="bg-white rounded-2xl overflow-hidden border-2" style={{borderColor:isOverridden?N.bg:'#e5e7eb'}}>
              <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100" style={{background:N.light}}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{block.icon}</span>
                  <span className="text-xs font-bold text-gray-800">{block.label}</span>
                  {isOverridden && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{background:N.bg}}>Swapped</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{timeOffset} min mark</span>
                  <span className="text-xs font-bold" style={{color:N.text}}>{block.time}</span>
                  {!block.fixed && <button onClick={()=>setSwapTarget(block.key)} className="text-xs font-semibold underline underline-offset-2 ml-1" style={{color:N.text}}>swap</button>}
                </div>
              </div>
              {drill ? (
                <div className="flex gap-3 p-3 cursor-pointer hover:bg-gray-50" onClick={()=>setDetailDrill(drill)}>
                  <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0"><DrillDiagram type={drill.diagram} category={drill.category}/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{drill.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{drill.description}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">{(drill.age_groups||[]).map(ag=><span key={ag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ag}</span>)}</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-400">
                  <p className="text-xs">No {block.cat} drills available for {ageFilter}</p>
                  <button onClick={()=>setSwapTarget(block.key)} className="text-xs font-semibold mt-1 underline" style={{color:N.text}}>Choose manually</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total time bar */}
      <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{background:N.light}}>
        <div className="flex gap-4 text-xs text-gray-600">
          <span>🏃 10 min</span><span>🎯 10 min</span><span>🛡️ 10 min</span><span>⚡ 10 min</span><span>⚽ 15 min</span>
        </div>
        <span className="text-sm font-black" style={{color:N.text}}>= 55 min</span>
      </div>

      <button onClick={()=>setShareOpen(true)} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}
        className="w-full text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 mb-2"
        style={navyBtn}>📲 Share Full Session Plan</button>
      <p className="text-center text-xs text-gray-400">Sends complete 1-hour plan to your coaches via WhatsApp</p>

      {/* Swap modal */}
      {swapTarget && swapBlock && (
        <Modal onClose={()=>setSwapTarget(null)} wide>
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{swapBlock.icon} Swap {swapBlock.label}</h2>
            <p className="text-sm text-gray-500 mb-4">Choose a different drill for this block:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {drills.filter(d => d.category === swapBlock.cat && (ageFilter==='All'||(d.age_groups||[]).includes(ageFilter))).map(d => (
                <div key={d.id} onClick={()=>handleSwap(swapTarget, d)}
                  className="bg-white rounded-xl overflow-hidden cursor-pointer transition-all border-2"
                  style={{borderColor: d.id===session[swapTarget]?.id ? N.bg : '#e5e7eb'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=N.bg}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=d.id===session[swapTarget]?.id?N.bg:'#e5e7eb'}>
                  <div className="h-20"><DrillDiagram type={d.diagram} category={d.category}/></div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{d.title}</p>
                    <p className="text-xs text-gray-400">⏱ {d.duration} · 👥 {d.players}</p>
                  </div>
                  {d.id===session[swapTarget]?.id && <div className="text-white text-xs font-bold text-center py-1" style={{background:N.bg}}>✓ Current</div>}
                </div>
              ))}
            </div>
            <button onClick={()=>setSwapTarget(null)} className="mt-4 w-full border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </Modal>
      )}
      {shareOpen && <SharePlanModal session={session} weekNum={weekNum} sessionDate={sessionDate} sessionNotes={sessionNotes} ageFilter={ageFilter} onClose={()=>setShareOpen(false)}/>}
      {detailDrill && <DrillDetail drill={detailDrill} onClose={()=>setDetailDrill(null)} isCoach={true}/>}
    </div>
  )
}

// ─── Home Session Manager ─────────────────────────────────────────────────────
function HomeSessionManager({ drills, homeSession, onSave }) {
  const homeDrills=drills.filter(d=>d.home_ready)
  const [selected,setSelected]=useState(homeSession.drill_ids||[])
  const [message,setMessage]=useState(homeSession.message||'')
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const [detailDrill,setDetailDrill]=useState(null)
  const toggle=(id)=>{setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length>=2?[...prev.slice(1),id]:[...prev,id]);setSaved(false)}
  const publish=async()=>{setSaving(true);await onSave({drill_ids:selected,message});setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),3000)}
  const selectedDrills=drills.filter(d=>selected.includes(d.id))
  const shareText=()=>{
    const lines=[`🏠 *This Week's Home Practice — Clydach Juniors*\n`]
    if(message) lines.push(`${message}\n`)
    selectedDrills.forEach((d,i)=>lines.push(`*Drill ${i+1}: ${d.title}*\n⏱ ${d.duration} | 👥 ${d.players}\n\n${d.description}`))
    lines.push('\nGive these a go before next training! 💪\n— Clydach Juniors Coaching Team')
    return lines.join('\n\n')
  }
  const inputCls="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
  const focusNavy=e=>e.target.style.borderColor=N.bg
  const blurGray=e=>e.target.style.borderColor='#d1d5db'
  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <h2 className="font-bold text-gray-900 text-sm mb-1">🏠 This Week's Home Session</h2>
        <p className="text-xs text-gray-500 mb-3">Choose up to 2 drills. Only your selected drills appear in the parent view.</p>
        <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Message to parents <span className="text-gray-400 font-normal">(optional)</span></label>
        <input value={message} onChange={e=>{setMessage(e.target.value);setSaved(false)}} placeholder="e.g. Focus on close control this week!" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
      </div>
      {selectedDrills.length>0&&(
        <div className="rounded-2xl p-4 mb-4 border" style={{background:N.light,borderColor:N.bg+'44'}}>
          <p className="text-xs font-bold mb-3" style={{color:N.text}}>✅ Currently showing to parents ({selectedDrills.length}/2):</p>
          <div className="space-y-2">
            {selectedDrills.map(d=>(
              <div key={d.id} className="bg-white rounded-xl border flex items-center gap-3 p-3" style={{borderColor:N.bg+'44'}}>
                <div className="w-14 h-12 rounded-lg overflow-hidden shrink-0"><DrillDiagram type={d.diagram} category={d.category}/></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900">{d.title}</p><p className="text-xs text-gray-400">⏱ {d.duration}</p></div>
                <button onClick={()=>toggle(d.id)} className="shrink-0 w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 font-bold text-sm flex items-center justify-center">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedDrills.length===0&&(
        <div className="border-2 border-dashed rounded-2xl p-6 text-center mb-4" style={{borderColor:N.bg+'44'}}>
          <p className="text-2xl mb-2">🏠</p>
          <p className="text-sm font-semibold text-gray-600">No drills selected yet</p>
          <p className="text-xs text-gray-400 mt-1">Pick up to 2 drills below — parents won't see anything until you publish</p>
        </div>
      )}
      <div className="flex gap-3 mb-6">
        <button onClick={publish} disabled={saving||selected.length===0}
          className="flex-1 font-bold py-3 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
          style={saved?{background:N.light,color:N.text,border:`2px solid ${N.bg}44`}:selected.length===0?{background:'#f3f4f6',color:'#9ca3af'}:navyBtn}
          onMouseEnter={e=>{if(!saved&&selected.length>0)e.currentTarget.style.background=N.hover}}
          onMouseLeave={e=>{if(!saved&&selected.length>0)e.currentTarget.style.background=N.bg}}>
          {saved?'✓ Published!':saving?'Publishing…':'🚀 Publish to Parents'}
        </button>
        {selectedDrills.length>0&&(
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText())}`} target="_blank" rel="noreferrer"
            className="flex-1 text-white font-bold py-3 rounded-2xl text-center transition-colors text-sm flex items-center justify-center gap-2"
            style={navyBtn} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}>
            📲 Share via WhatsApp
          </a>
        )}
      </div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">All home-suitable drills</p>
        <p className="text-xs text-gray-400">{homeDrills.length} available</p>
      </div>
      {homeDrills.length===0
        ?<div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">🏠</p><p className="text-sm font-semibold">No home-suitable drills yet</p><p className="text-xs mt-1">Tick "Available for home sessions" when adding a drill</p></div>
        :<div className="space-y-2">
          {homeDrills.map(drill=>{
            const isSelected=selected.includes(drill.id)
            const cc=CAT_COLORS[drill.category]||{}
            return (
              <div key={drill.id} className="bg-white rounded-2xl overflow-hidden transition-all border-2"
                style={{borderColor:isSelected?N.bg:'#e5e7eb'}}>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer" onClick={()=>setDetailDrill(drill)}><DrillDiagram type={drill.diagram} category={drill.category}/></div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setDetailDrill(drill)}>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{drill.title}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cc.pill||'bg-gray-100 text-gray-600'}`}>{drill.category}</span>
                    <p className="text-xs text-gray-400 mt-0.5">⏱ {drill.duration} · 👥 {drill.players}</p>
                  </div>
                  <button onClick={()=>toggle(drill.id)}
                    className="shrink-0 w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center transition-all text-white"
                    style={isSelected?{background:N.bg}:{background:'#f3f4f6',color:'#6b7280'}}
                    onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background=N.light}}
                    onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background='#f3f4f6'}}>
                    {isSelected?'✓':'+'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      }
      {detailDrill&&<DrillDetail drill={detailDrill} onClose={()=>setDetailDrill(null)} isCoach={true}/>}
    </div>
  )
}

// ─── Parent Home View ─────────────────────────────────────────────────────────
function ParentHomeView({ drills, homeSession }) {
  const [detailDrill,setDetailDrill]=useState(null)
  const selectedDrills=drills.filter(d=>(homeSession.drill_ids||[]).includes(d.id))
  if(selectedDrills.length===0) return (
    <div className="text-center py-20 px-4">
      <div className="text-5xl mb-4">⚽</div>
      <h2 className="text-lg font-bold text-gray-700 mb-2">No drills set this week</h2>
      <p className="text-sm text-gray-400">Your coaches haven't published this week's home session yet — check back soon!</p>
    </div>
  )
  return (
    <div>
      <div className="rounded-2xl p-4 mb-5 flex gap-3 items-start" style={{background:N.light,border:`1px solid ${N.bg}44`}}>
        <span className="text-2xl">🏠</span>
        <div>
          <p className="font-bold text-sm" style={{color:N.text}}>This Week's Home Practice</p>
          {homeSession.message
            ?<p className="text-sm mt-1" style={{color:N.text}}>{homeSession.message}</p>
            :<p className="text-xs mt-0.5" style={{color:N.text+'bb'}}>Try these drills in your garden or local park before the next session!</p>}
        </div>
      </div>
      <div className="space-y-4">
        {selectedDrills.map((drill,i)=>(
          <div key={drill.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-44 cursor-pointer" onClick={()=>setDetailDrill(drill)}><DrillDiagram type={drill.diagram} category={drill.category}/></div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 text-white rounded-full text-xs font-black flex items-center justify-center shrink-0" style={{background:N.bg}}>{i+1}</span>
                <h3 className="font-bold text-gray-900 text-base">{drill.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(CAT_COLORS[drill.category]||{}).pill||'bg-gray-100'}`}>{drill.category}</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">⏱ {drill.duration}</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">👥 {drill.players}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{drill.description}</p>
              <div className="rounded-xl p-3" style={{background:N.light,border:`1px solid ${N.bg}33`}}>
                <p className="text-xs font-semibold mb-1" style={{color:N.text}}>💡 Tips for home</p>
                <p className="text-xs leading-relaxed" style={{color:N.text+'cc'}}>A garden or park works perfectly. Plastic bottles or jumpers make great cones. Start slow — technique first, then speed.</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {detailDrill&&<DrillDetail drill={detailDrill} onClose={()=>setDetailDrill(null)} isCoach={false}/>}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role,setRole]=useState(null)
  const [view,setView]=useState('drills')
  const [drills,setDrills]=useState([])
  const [homeSession,setHomeSession]=useState({drill_ids:[],message:''})
  const [filterCat,setFilterCat]=useState('All')
  const [filterAge,setFilterAge]=useState('All')
  const [search,setSearch]=useState('')
  const [selected,setSelected]=useState(null)
  const [showAdd,setShowAdd]=useState(false)
  const [shareTarget,setShareTarget]=useState(null)
  const [loading,setLoading]=useState(true)
  const [dbError,setDbError]=useState(false)

  useEffect(()=>{
    async function load(){
      try{
        const{data,error}=await supabase.from('drills').select('*').order('id')
        if(error) throw error
        if(!data||data.length===0){
          const{error:ie}=await supabase.from('drills').upsert(SEED_DRILLS,{onConflict:'id'})
          if(ie) throw ie
          setDrills(SEED_DRILLS)
        } else {
          setDrills(data)
        }
        const{data:hs}=await supabase.from('home_session').select('*').eq('id',1).single()
        if(hs) setHomeSession({drill_ids:hs.drill_ids||[],message:hs.message||''})
      }catch(e){console.error(e);setDbError(true);setDrills(SEED_DRILLS)}
      setLoading(false)
    }
    load()
  },[])

  // Only listen for custom drills added by coaches — prevents seed inserts doubling up
  useEffect(()=>{
    const ch=supabase.channel('drills-rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'drills'},p=>{
        if(p.new.is_custom) setDrills(prev=>{
          if(prev.find(d=>d.id===p.new.id)) return prev
          return [...prev,p.new]
        })
      })
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[])

  useEffect(()=>{
    const ch=supabase.channel('home-rt').on('postgres_changes',{event:'*',schema:'public',table:'home_session'},p=>{if(p.new)setHomeSession({drill_ids:p.new.drill_ids||[],message:p.new.message||''})}).subscribe()
    return()=>supabase.removeChannel(ch)
  },[])

  const addDrill=async(drill)=>{
    try{const{data,error}=await supabase.from('drills').insert([drill]).select().single();if(error)throw error;setDrills(prev=>[...prev,data])}
    catch{setDrills(prev=>[...prev,{...drill,id:Date.now()}])}
    setShowAdd(false)
  }

  const saveHomeSession=async(session)=>{
    setHomeSession(session)
    try{await supabase.from('home_session').upsert({id:1,...session})}catch(e){console.error(e)}
  }

  const isCoach=role==='coach'

  if(!role) return <AuthScreen onAuth={r=>{setRole(r);if(r==='parent')setView('home')}}/>
  if(loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3"><div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl animate-pulse" style={{background:N.bg}}>⚽</div><p className="text-sm font-semibold" style={{color:N.text}}>Loading…</p></div>

  const filtered=drills.filter(d=>{
    if(filterCat!=='All'&&d.category!==filterCat) return false
    if(filterAge!=='All'&&!(d.age_groups||[]).includes(filterAge)) return false
    if(search&&!d.title.toLowerCase().includes(search.toLowerCase())&&!d.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const catCounts=CATEGORIES.reduce((acc,c)=>{acc[c]=drills.filter(d=>d.category===c).length;return acc},{})
  const publishedCount=(homeSession.drill_ids||[]).length

  return (
    <div className="min-h-screen bg-gray-50">
      {dbError&&<div className="px-4 py-2 text-center text-xs font-medium" style={{background:'#fef3c7',color:'#92400e'}}>⚠️ Offline mode — add Supabase keys in src/supabase.js</div>}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg" style={{background:N.bg}}>⚽</div>
              <div>
                <h1 className="font-black text-gray-900 text-sm leading-tight">Clydach Juniors</h1>
                <p className="text-xs text-gray-400">{isCoach?'Coach View':'Parent View'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCoach&&view==='drills'&&(
                <button onClick={()=>setShowAdd(true)} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}
                  className="text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors" style={navyBtn}>+ Add</button>
              )}
              <button onClick={()=>setRole(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">Sign out</button>
            </div>
          </div>

          {isCoach&&(
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[
                {id:'drills',  label:'📋 Drills'},
                {id:'planner', label:'📅 Planner'},
                {id:'home-manager', label:'🏠 Home', badge: publishedCount > 0 ? publishedCount : null},
              ].map(tab=>(
                <button key={tab.id} onClick={()=>setView(tab.id)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all relative"
                  style={view===tab.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                  {tab.label}
                  {tab.badge&&<span className="absolute -top-1 -right-1 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center font-black" style={{background:N.bg,fontSize:'9px'}}>{tab.badge}</span>}
                </button>
              ))}
            </div>
          )}

          {!isCoach&&(
            <div className="rounded-xl px-3 py-2 text-center" style={{background:N.light}}>
              <p className="text-xs font-semibold" style={{color:N.text}}>🏠 This Week's Home Practice from Clydach Juniors</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {isCoach&&view==='planner'&&<TrainingPlanner drills={drills}/>}
        {isCoach&&view==='home-manager'&&<HomeSessionManager drills={drills} homeSession={homeSession} onSave={saveHomeSession}/>}
        {!isCoach&&<ParentHomeView drills={drills} homeSession={homeSession}/>}

        {isCoach&&view==='drills'&&(
          <>
            <div className="grid grid-cols-5 gap-2 mb-5">
              {CATEGORIES.map(c=>(
                <div key={c} onClick={()=>setFilterCat(filterCat===c?'All':c)}
                  className="bg-white border rounded-xl p-2.5 text-center cursor-pointer transition-all"
                  style={filterCat===c?{borderColor:N.bg,background:N.light}:{borderColor:'#e5e7eb'}}
                  onMouseEnter={e=>{if(filterCat!==c)e.currentTarget.style.borderColor=N.bg}}
                  onMouseLeave={e=>{if(filterCat!==c)e.currentTarget.style.borderColor='#e5e7eb'}}>
                  <div className="text-lg font-black text-gray-900">{catCounts[c]}</div>
                  <div className="text-gray-500 leading-tight mt-0.5" style={{fontSize:'9px'}}>{CAT_COLORS[c]?.icon} {c.split(' ')[0]}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-5">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search drills…"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white"
                onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['All',...CATEGORIES].map(cat=><FilterPill key={cat} label={cat} active={filterCat===cat} onClick={()=>setFilterCat(cat)}/>)}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['All',...AGE_GROUPS].map(ag=><FilterPill key={ag} label={ag} active={filterAge===ag} onClick={()=>setFilterAge(ag)}/>)}
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4">{filtered.length} drill{filtered.length!==1?'s':''} shown</p>

            {filtered.length===0
              ?<div className="text-center py-20"><div className="text-5xl mb-3">⚽</div><p className="font-bold text-gray-600">No drills found</p></div>
              :<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{filtered.map(drill=><DrillCard key={drill.id} drill={drill} onClick={setSelected} onShare={setShareTarget} isCoach={true}/>)}</div>
            }
          </>
        )}
      </main>

      {selected&&<DrillDetail drill={selected} onClose={()=>setSelected(null)} isCoach={isCoach}/>}
      {showAdd&&<AddDrillForm onSave={addDrill} onClose={()=>setShowAdd(false)}/>}
      {shareTarget&&<ShareDrillModal drill={shareTarget} onClose={()=>setShareTarget(null)}/>}
    </div>
  )
}
