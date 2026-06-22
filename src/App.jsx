import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { SEED_DRILLS } from './drills'

// ─── Theme ────────────────────────────────────────────────────────────────────
// Primary navy: #1e3a5f  Hover navy: #152d4a  Light navy bg: #eef1f7
const N = { bg:'#1e3a5f', hover:'#152d4a', light:'#eef1f7', border:'#1e3a5f', text:'#1e3a5f' }

const CATEGORIES = ['Strength & Conditioning', 'Passing', 'Tackling', 'Attacking', 'Goalkeeping', 'Age Group Changes']
const AGE_GROUPS = ['U12', 'U13', 'U14', 'U15']
const COACH_PIN = '1234'

const CAT_COLORS = {
  'Passing':                  { pill:'bg-blue-100 text-blue-800',    border:'border-blue-300',    bg:'bg-blue-50',    icon:'🎯', accent:'#3b82f6' },
  'Tackling':                 { pill:'bg-red-100 text-red-800',      border:'border-red-300',     bg:'bg-red-50',     icon:'🛡️', accent:'#ef4444' },
  'Attacking':                { pill:'bg-amber-100 text-amber-800',  border:'border-amber-300',   bg:'bg-amber-50',   icon:'⚡', accent:'#f59e0b' },
  'Strength & Conditioning':  { pill:'bg-green-100 text-green-800',  border:'border-green-300',   bg:'bg-green-50',   icon:'💪', accent:'#22c55e' },
  'Goalkeeping':              { pill:'bg-cyan-100 text-cyan-800',    border:'border-cyan-300',    bg:'bg-cyan-50',    icon:'🧤', accent:'#0891b2' },
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
  const [screen, setScreen] = useState('home') // 'home' | 'pin'
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const check = () => { if (pin === COACH_PIN) { onAuth('coach') } else { setErr('Incorrect PIN. Try again.'); setPin('') } }
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{background:N.bg}}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{background:N.bg}}>⚽</div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Clydach Juniors</h1>
        <p className="text-sm text-gray-500 mb-6">Junior Football Coaching Hub</p>
        {screen==='home' ? (
          <div className="space-y-3">
            <button onClick={()=>setScreen('pin')} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}
              className="w-full text-white font-bold py-3 rounded-xl transition-colors" style={navyBtn}>
              👨‍🏫 Coach Login
            </button>
            <button onClick={()=>onAuth('parent')} className="w-full border-2 font-semibold py-3 rounded-xl transition-colors"
              style={{borderColor:N.bg, color:N.text}}
              onMouseEnter={e=>{e.currentTarget.style.background=N.light}}
              onMouseLeave={e=>{e.currentTarget.style.background='white'}}>
              👪 Player / Parent
            </button>
          </div>
        ) : (
          <>
            <button onClick={()=>{setScreen('home');setPin('');setErr('')}} className="text-xs text-gray-400 hover:text-gray-600 mb-4 block mx-auto">&lt;&lt; Back</button>
            <p className="text-sm font-semibold text-gray-700 mb-3">Enter your coach PIN</p>
            <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} placeholder="••••" maxLength={6} autoFocus
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold focus:outline-none mb-3"
              onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
            {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
            <button onClick={check} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}
              className="w-full text-white font-bold py-3 rounded-xl transition-colors" style={navyBtn}>
              Sign In
            </button>
          </>
        )}
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

// ─── Full Pitch Tactical Diagram ──────────────────────────────────────────────
// Renders a proper coaching board style diagram when viewing a drill in detail
function TacticalDiagram({ type, category }) {
  const accent = (CAT_COLORS[category] || {}).accent || '#3b82f6'

  // Shared drawing helpers
  const vb = "0 0 320 220"
  // Pitch background with markings
  const Pitch = () => (
    <>
      <rect width="320" height="220" fill="#166534"/>
      {/* Pitch border */}
      <rect x="10" y="10" width="300" height="200" fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.6"/>
      {/* Centre line */}
      <line x1="10" y1="110" x2="310" y2="110" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
      {/* Centre circle */}
      <circle cx="160" cy="110" r="30" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
      <circle cx="160" cy="110" r="2" fill="#4ade80" opacity="0.4"/>
    </>
  )
  // Player dot
  const P = (x,y,col=accent,label='') => (
    <g>
      <circle cx={x} cy={y} r="9" fill={col} stroke="white" strokeWidth="1.5"/>
      {label && <text x={x} y={y+4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{label}</text>}
    </g>
  )
  // Cone/marker
  const Cone = (x,y) => <polygon points={`${x},${y-8} ${x-5},${y+4} ${x+5},${y+4}`} fill="#f59e0b" stroke="white" strokeWidth="1"/>
  // Arrow
  const Arrow = (x1,y1,x2,y2,col=accent,dash=false) => {
    const id = `arr${x1}${y1}${x2}${y2}`.replace(/\./g,'')
    return (
      <>
        <defs><marker id={id} markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill={col}/></marker></defs>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth="2" strokeDasharray={dash?"6,3":"none"} markerEnd={`url(#${id})`} opacity="0.9"/>
      </>
    )
  }
  // Goal
  const Goal = (x,y,horiz=true) => horiz
    ? <rect x={x} y={y} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
    : <rect x={x} y={y} width="16" height="50" fill="none" stroke="white" strokeWidth="2"/>
  // Zone/area box
  const Zone = (x,y,w,h,col=accent) => <rect x={x} y={y} width={w} height={h} fill={col} opacity="0.12" stroke={col} strokeWidth="1" strokeDasharray="5,3"/>
  // Label
  const Label = (x,y,text,col='white') => <text x={x} y={y} fill={col} fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">{text}</text>

  const diagrams = {
    // ── PASSING ──────────────────────────────────────────────────────────────
    rondo: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={90} y={60} width={140} height={100} fill={accent} opacity="0.12" stroke={accent} strokeWidth="1" strokeDasharray="5,3"/>
        <text x={160} y={55} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">RONDO AREA</text>
        {[0,51,103,154,205,257,309].map((a,i) => {
          const r=55, cx=160+r*Math.cos((a-90)*Math.PI/180), cy=110+r*Math.sin((a-90)*Math.PI/180)
          return <g key={i}>{P(cx,cy,accent,String(i+1))}</g>
        })}
        {P(145,95,'#ef4444','D')}{P(175,125,'#ef4444','D')}
        <circle cx="160" cy="110" r="7" fill="white" opacity="0.9"/>
        <text x={160} y={185} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">7 attackers keep ball from 2 defenders</text>
      </svg>
    ),
    wall: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {/* Wall on left */}
        <rect x="10" y="60" width="12" height="100" fill="#94a3b8" opacity="0.8"/>
        <text x={16} y={55} fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">WALL</text>
        {P(100,110,accent,'1')}{P(200,110,accent,'2')}
        <circle cx="150" cy="110" r="7" fill="white" opacity="0.9"/>
        {Arrow(100,108,28,100,accent)}{Arrow(28,120,95,112,accent,true)}
        <text x={160} y={185} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Pass to wall → control rebound → repeat</text>
      </svg>
    ),
    triangle: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {Zone(90,55,140,110)}
        {P(120,160,accent,'A')}{P(200,160,accent,'B')}{P(160,65,accent,'C')}
        {P(160,115,'#ef4444','D')}
        <line x1="120" y1="160" x2="200" y2="160" stroke={accent} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5"/>
        <line x1="200" y1="160" x2="160" y2="65" stroke={accent} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5"/>
        <line x1="160" y1="65" x2="120" y2="160" stroke={accent} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5"/>
        {Arrow(128,157,152,117,accent)}{Arrow(160,104,167,72,accent,true)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Pass and move to a different point each time</text>
      </svg>
    ),
    gates: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {[[70,80],[70,140],[120,65],[120,155],[170,75],[170,145],[230,85],[230,135]].map(([x,y],i) =>
          <rect key={i} x={x-5} y={y-5} width="10" height="10" fill="#f59e0b" stroke="white" strokeWidth="1"/>
        )}
        {P(50,110,accent,'P')}
        {Arrow(60,108,65,90,accent)}{Arrow(75,80,115,70,accent,true)}{Arrow(125,65,165,78,accent,true)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Pass accurately through as many gates as possible</text>
      </svg>
    ),
    '4goal': (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={10} y={92} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/><rect x={250} y={92} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        <rect x="140" y="10" width="16" height="60" fill="none" stroke="white" strokeWidth="2"/>
        <rect x="140" y="150" width="16" height="60" fill="none" stroke="white" strokeWidth="2"/>
        {Zone(80,55,160,110)}
        {P(110,85,accent)}{P(210,85,accent)}{P(110,135,'#ef4444')}{P(210,135,'#ef4444')}
        <circle cx="160" cy="110" r="7" fill="white" opacity="0.9"/>
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Score by passing through any of the 4 goals</text>
      </svg>
    ),
    switch: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(40,155,accent,'A')}{P(130,110,accent,'B')}{P(270,65,accent,'C')}
        {Arrow(50,152,120,113,accent)}{Arrow(142,108,258,68,accent)}
        <text x={160} y={50} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">SWITCH PLAY — 3 passes or fewer</text>
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Must switch ball across pitch before driving forward</text>
      </svg>
    ),
    lanes: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <line x1="117" y1="10" x2="117" y2="210" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3"/>
        <line x1="203" y1="10" x2="203" y2="210" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3"/>
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        <text x={65} y={110} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">LANE 1</text><text x={160} y={110} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">LANE 2</text><text x={253} y={110} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">LANE 3</text>
        {P(50,165,accent)}{P(140,140,accent)}{P(230,100,accent)}
        {Arrow(60,163,130,143,accent)}{Arrow(152,138,222,103,accent)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Must pass into each lane before shooting</text>
      </svg>
    ),
    // ── TACKLING ─────────────────────────────────────────────────────────────
    tackle: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {Zone(70,70,180,80)}
        {P(110,110,accent,'A')}{P(210,110,'#ef4444','D')}
        <circle cx="165" cy="110" r="7" fill="white" opacity="0.9"/>
        {Arrow(120,110,158,110,accent)}
        <text x={160} y={65} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">SHADOW TACKLE ZONE</text>
        <text x={160} y={55} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Attacker dribbles slowly, defender mirrors</text>
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Mirror movement — correct body shape first</text>
      </svg>
    ),
    jockey: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {Zone(120,30,80,160)}
        {P(160,170,accent,'A')}{P(160,55,'#ef4444','D')}
        <circle cx="160" cy="140" r="7" fill="white" opacity="0.9"/>
        {Arrow(160,160,160,80,accent,true)}
        {Arrow(160,80,160,65,'#ef4444')}
        <text x={160} y={25} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">END LINE</text>
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Attacker drives to end line — defender jockeys</text>
      </svg>
    ),
    '1v1box': (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {Zone(80,55,160,110)}
        <text x={160} y={50} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">8m × 8m BOX</text>
        {P(130,100,accent,'A')}{P(190,120,'#ef4444','D')}
        <circle cx="155" cy="110" r="7" fill="white" opacity="0.9"/>
        {Arrow(140,102,148,108,accent)}
        <text x={160} y={185} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Attacker tries to dribble out any side</text>
      </svg>
    ),
    press: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={170} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        {P(100,55,accent,'A')}{P(160,45,accent,'A')}{P(220,55,accent,'A')}
        {P(110,130,'#ef4444','P')}{P(160,125,'#ef4444','P')}{P(210,130,'#ef4444','P')}
        <circle cx="160" cy="80" r="7" fill="white" opacity="0.9"/>
        {Arrow(113,130,105,68,'#ef4444')}{Arrow(163,123,161,57,'#ef4444')}{Arrow(207,128,217,67,'#ef4444')}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Press as a unit — win ball within 10 seconds</text>
      </svg>
    ),
    defshape: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={175} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        {[[80,150],[127,145],[193,145],[240,150]].map(([x,y],i)=>P(x,y,N.bg,['LB','CB','CB','RB'][i]))}
        {[[110,105],[160,100],[210,105]].map(([x,y],i)=>P(x,y,'#8b5cf6',['CM','CM','CM'][i]))}
        {[[80,55],[160,45],[240,55]].map(([x,y],i)=>P(x,y,'#ef4444',['A','A','A'][i]))}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Maintain shape — shift as a unit when ball moves</text>
      </svg>
    ),
    recovery: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={175} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        {P(80,50,accent,'A')}{P(240,50,'#ef4444','D')}
        {Arrow(80,50,240,50,'white',true)}
        <text x={160} y={45} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">START LINE</text>
        {P(80,155,accent,'A')}{P(240,155,'#ef4444','D')}
        {Arrow(90,153,230,153,accent)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Both sprint 20m — defender recovers to delay</text>
      </svg>
    ),
    channel: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {Zone(110,20,100,180)}
        {P(160,170,accent,'A')}{P(160,75,'#ef4444','D')}
        <circle cx="160" cy="145" r="7" fill="white" opacity="0.9"/>
        {Arrow(160,160,160,90,accent,true)}
        {Arrow(165,75,200,100,'#ef4444')}
        <text x={160} y={15} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">← CHANNEL →</text>
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Defender guides attacker toward touchline</text>
      </svg>
    ),
    // ── ATTACKING ────────────────────────────────────────────────────────────
    '3v2': (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        <rect x={80} y={25} width={160} height={175} fill={accent} opacity="0.12" stroke={accent} strokeWidth="1" strokeDasharray="5,3"/>
        {P(100,55,accent,'A')}{P(160,45,accent,'A')}{P(220,55,accent,'A')}
        {P(130,120,'#ef4444','D')}{P(190,120,'#ef4444','D')}
        <circle cx="150" cy="80" r="7" fill="white" opacity="0.9"/>
        {Arrow(108,57,143,82,accent)}{Arrow(160,55,155,72,accent,true)}{Arrow(212,57,185,118,'#ef4444',true)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">3 attackers vs 2 defenders — complete 3 passes first</text>
      </svg>
    ),
    cross: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        {/* Penalty area */}
        <rect x="100" y="10" width="120" height="65" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        {P(280,110,accent,'W')}{P(145,55,accent,'A1')}{P(185,45,accent,'A2')}
        {Arrow(272,108,190,50,accent)}{Arrow(145,66,145,30,accent,true)}{Arrow(185,56,185,30,accent,true)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Wide player crosses — near & far post runs</text>
      </svg>
    ),
    counter: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        {P(80,170,accent)}{P(140,175,accent)}{P(180,175,accent)}{P(240,170,accent)}
        {P(130,100,'#ef4444','D')}{P(190,100,'#ef4444','D')}
        {Arrow(80,160,78,25,accent,true)}{Arrow(140,165,140,30,accent,true)}{Arrow(180,165,180,30,accent,true)}{Arrow(240,160,242,25,accent,true)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">4v2 counter attack — score within 10 seconds</text>
      </svg>
    ),
    overlap: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        {P(60,120,N.bg,'FB')}{P(60,60,accent,'W')}{P(180,80,accent,'CF')}
        {Arrow(60,110,58,72,N.bg)}{Arrow(58,70,170,82,accent,true)}
        {/* Overlap run arc */}
        <path d="M65,120 Q30,90 65,58" fill="none" stroke={N.bg} strokeWidth="2" strokeDasharray="6,3"/>
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Full back overlaps winger — lay off into space</text>
      </svg>
    ),
    shootpress: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        <rect x="100" y="10" width="120" height="65" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.3"/>
        {P(160,120,accent,'A')}{P(160,175,'#ef4444','D')}
        <circle cx="160" cy="120" r="7" fill="white" opacity="0.9"/>
        {Arrow(160,111,160,35,accent)}{Arrow(160,165,160,132,'#ef4444')}
        <text x={265} y={120} fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">2 sec</text>
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Receive, decide: shoot/turn/lay off within 2 seconds</text>
      </svg>
    ),
    setpiece: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        <rect x="100" y="10" width="120" height="65" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        {P(20,175,accent,'K')}{P(130,35,accent,'NP')}{P(185,25,accent,'FP')}{P(150,80,accent,'S')}{P(210,80,'#ef4444','D')}
        {Arrow(29,172,123,42,accent)}{Arrow(130,46,148,72,accent,true)}{Arrow(185,36,185,30,accent,true)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Corner: near post, far post and short options</text>
      </svg>
    ),
    combo: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        {P(80,165,accent,'A')}{P(160,120,accent,'B')}{P(240,165,accent,'C')}
        {Arrow(90,162,150,123,accent)}{Arrow(170,120,232,162,accent,true)}{Arrow(240,153,190,35,accent)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">A-B-C combination — third man finishes</text>
      </svg>
    ),
    wideattack: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        {P(20,120,accent,'LW')}{P(300,120,accent,'RW')}{P(160,80,accent,'ST')}{P(120,155,accent,'LM')}{P(200,155,accent,'RM')}
        {Arrow(20,110,18,35,accent,true)}{Arrow(300,110,298,35,accent,true)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Wingers push high and wide — create width</text>
      </svg>
    ),
    // ── S&C ──────────────────────────────────────────────────────────────────
    weave: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {[50,85,120,155,190,225,260].map((x,i) => <polygon key={i} points={`${x},${i%2===0?80:140}-8 ${x}-5,${i%2===0?80:140}+4 ${x}+5,${i%2===0?80:140}+4`} fill="#f59e0b" stroke="white" strokeWidth="1"/>)}
        {P(25,110,accent,'P')}
        <path d="M35,110 Q52,80 70,110 Q88,140 105,110 Q122,80 140,110 Q158,140 175,110 Q192,80 210,110 Q227,140 244,110 Q262,80 280,110" fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="none"/>
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Dribble through cones — both feet, close control</text>
      </svg>
    ),
    ladder: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {/* Agility ladder */}
        <line x1="120" y1="30" x2="120" y2="190" stroke={accent} strokeWidth="3" opacity="0.7"/>
        <line x1="200" y1="30" x2="200" y2="190" stroke={accent} strokeWidth="3" opacity="0.7"/>
        {[0,1,2,3,4,5,6,7].map(i=><line key={i} x1="120" y1={30+i*23} x2="200" y2={30+i*23} stroke={accent} strokeWidth="2" opacity="0.7"/>)}
        {P(80,180,accent,'P')}
        <path d="M88,178 Q100,160 110,150 Q120,140 130,128 Q140,116 150,104 Q160,92 170,80 Q180,68 190,56 Q200,44 210,32" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4,2" opacity="0.8"/>
        <text x={160} y={210} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Two feet in each box — precision before pace</text>
      </svg>
    ),
    shuttle: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <line x1="50" y1="30" x2="50" y2="190" stroke="#f59e0b" strokeWidth="2"/>
        <line x1="120" y1="30" x2="120" y2="190" stroke="#f59e0b" strokeWidth="2"/>
        <line x1="190" y1="30" x2="190" y2="190" stroke="#f59e0b" strokeWidth="2"/>
        <line x1="260" y1="30" x2="260" y2="190" stroke="#f59e0b" strokeWidth="2"/>
        <text x={50} y={25} fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">5m</text>
        <text x={120} y={25} fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">10m</text>
        <text x={190} y={25} fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">15m</text>
        {P(25,110,accent,'P')}
        {Arrow(35,108,112,95,accent)}{Arrow(112,105,38,115,accent,true)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Sprint to each line and back — 6 reps</text>
      </svg>
    ),
    core: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {/* Person doing plank */}
        <ellipse cx="160" cy="95" rx="15" ry="15" fill={accent} stroke="white" strokeWidth="1.5"/>
        <line x1="160" y1="110" x2="160" y2="150" stroke={accent} strokeWidth="4"/>
        <line x1="160" y1="125" x2="130" y2="120" stroke={accent} strokeWidth="3"/>
        <line x1="160" y1="125" x2="190" y2="120" stroke={accent} strokeWidth="3"/>
        <line x1="160" y1="150" x2="140" y2="175" stroke={accent} strokeWidth="3"/>
        <line x1="160" y1="150" x2="180" y2="175" stroke={accent} strokeWidth="3"/>
        {[['Plank',50,50],['Side Plank L',130,50],['Side Plank R',210,50],['Glute Bridge',50,170],['Dead Bug',210,170]].map(([t,x,y])=>(
          <g key={t}><rect x={x-35} y={y-12} width="70" height="22" fill={N.bg} opacity="0.7" rx="4"/><text x={x} y={y+3} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">{t}</text></g>
        ))}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">40s on / 20s rest — 3 rounds, technique first</text>
      </svg>
    ),
    speedgates: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {/* T-shape speed gates */}
        {[[160,50],[160,110],[160,170],[80,110],[240,110]].map(([x,y],i)=>(
          <g key={i}>
            <rect x={x-4} y={y-20} width="8" height="35" fill={accent} rx="2" stroke="white" strokeWidth="1"/>
          </g>
        ))}
        {P(25,110,accent,'P')}
        {Arrow(35,108,72,110,accent)}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Timed runs through T-shape gate combinations</text>
      </svg>
    ),
    warmup: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {[['High Knees',80,60],['Heel Kicks',240,60],['Leg Swings',80,110],['Hip Circles',240,110],['Lunges',80,160],['Jog',240,160]].map(([t,x,y])=>(
          <g key={t}>
            <circle cx={x} cy={y} r="28" fill={N.bg} opacity="0.6" stroke={accent} strokeWidth="1.5"/>
            <text x={x} y={y-4} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">{t.split(' ')[0]}</text>
            <text x={x} y={y+7} fill="white" fontSize="8" textAnchor="middle">{t.split(' ')[1]||''}</text>
          </g>
        ))}
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">All dynamic — no static stretching</text>
      </svg>
    ),
    // ── TACTICAL / AGE GROUP ──────────────────────────────────────────────────
    positions: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/><rect x={130} y={194} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        {P(160,185,accent,'GK')}
        {[[80,150],[127,145],[193,145],[240,150]].map(([x,y],i)=>P(x,y,N.bg,['LB','CB','CB','RB'][i]))}
        {[[105,100],[160,95],[215,100]].map(([x,y],i)=>P(x,y,'#8b5cf6',['LM','CM','RM'][i]))}
        {[[80,50],[160,40],[240,50]].map(([x,y],i)=>P(x,y,accent,['LW','ST','RW'][i]))}
        <text x={160} y={210} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">4-3-3 shape — zones of responsibility</text>
      </svg>
    ),
    '9v9': (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/><rect x={130} y={194} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        <rect x="95" y="10" width="130" height="60" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        <rect x="95" y="150" width="130" height="60" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        {P(160,185,accent,'GK')}
        {[[80,150],[130,145],[190,145],[240,150]].map(([x,y],i)=>P(x,y,N.bg,['LB','CB','CB','RB'][i]))}
        {[[105,100],[160,95],[215,100]].map(([x,y],i)=>P(x,y,'#8b5cf6',['M','M','M'][i]))}
        {[[120,50],[200,50]].map(([x,y],i)=>P(x,y,accent,['A','A'][i]))}
        <text x={160} y={210} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">9v9 shape — 64x44 yard pitch</text>
      </svg>
    ),
    offside: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x={130} y={10} width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        <rect x="100" y="10" width="120" height="70" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        {/* Last defender line */}
        <line x1="10" y1="90" x2="310" y2="90" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8,4"/>
        <text x={160} y={85} fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">LAST DEFENDER LINE</text>
        {P(100,70,accent,'A1')}{P(200,70,'#ef4444','A2')}{P(180,95,N.bg,'D')}
        <text x={100} y={115} fill="#4ade80" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">✓ ONSIDE</text>
        <text x={200} y={115} fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">✗ OFFSIDE</text>
        <text x={160} y={195} fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Level with last defender = onside</text>
      </svg>
    ),
    default: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(80,110,accent)}{P(160,80,accent)}{P(240,110,accent)}
        {P(160,140,'#ef4444')}
        <circle cx="160" cy="110" r="7" fill="white" opacity="0.9"/>
        {Arrow(90,110,150,113,accent)}{Arrow(170,110,230,110,accent,true)}
      </svg>
    ),
  }

  return diagrams[type] || diagrams.default
}

// ─── Drill Detail ─────────────────────────────────────────────────────────────
function DrillDetail({ drill, onClose, isCoach }) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="w-full rounded-xl overflow-hidden mb-5" style={{aspectRatio:"16/9"}}><TacticalDiagram type={drill.diagram} category={drill.category}/></div>
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
        {isCoach && drill.progression && <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4"><h4 className="text-sm font-semibold text-purple-800 mb-1">⬆️ Make it Harder</h4><p className="text-sm text-purple-700 leading-relaxed">{drill.progression}</p></div>}
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
  { key:'gk',       label:'Goalkeeper Drill',           time:'10 min', icon:'🧤', cat:'Goalkeeping',             fixed:false, parallel:'attack' },
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

function TrainingPlanner({ drills, seasonStart, onSeasonStartChange }) {
  const [weekNum,setWeekNum]=useState(1)
  const [ageFilter,setAgeFilter]=useState('U12')
  const [overrides,setOverrides]=useState({})
  const [swapTarget,setSwapTarget]=useState(null)
  const [sessionNotes,setSessionNotes]=useState('')
  const [sessionDate,setSessionDate]=useState('')
  const [shareOpen,setShareOpen]=useState(false)
  const [detailDrill,setDetailDrill]=useState(null)
  const [editingDate,setEditingDate]=useState(false)
  const [tempDate,setTempDate]=useState('')
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
        {/* Session date - auto from season start or manual override */}
        {(()=>{
          const autoDate = seasonStart ? (()=>{ const d=new Date(seasonStart); d.setDate(d.getDate()+(weekNum-1)*7); return d.toISOString().split('T')[0] })() : ''
          const displayDate = sessionDate || autoDate
          const fmt = iso => iso ? new Date(iso).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : ''
          return (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Session Date</label>
              {editingDate ? (
                <div className="flex gap-2">
                  <input type="date" defaultValue={displayDate} onChange={e=>setTempDate(e.target.value)}
                    className={inputCls+' flex-1'} onFocus={focusNavy} onBlur={blurGray} autoFocus/>
                  <button onClick={()=>{if(tempDate)setSessionDate(tempDate);setEditingDate(false);setTempDate('')}}
                    className="text-white text-xs font-bold px-3 rounded-xl" style={{background:N.bg}}>Set</button>
                  <button onClick={()=>{setEditingDate(false);setTempDate('')}}
                    className="text-xs border border-gray-300 rounded-xl px-2 text-gray-500">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl px-3 py-2">
                    {displayDate ? fmt(displayDate) : 'No date set'}
                  </span>
                  <button onClick={()=>{setEditingDate(true);setTempDate(displayDate||'')}}
                    className="text-xs border border-gray-300 rounded-xl px-3 py-2 text-gray-600">Change</button>
                  {sessionDate && <button onClick={()=>setSessionDate('')}
                    className="text-xs border border-red-200 text-red-400 rounded-xl px-3 py-2">Remove</button>}
                </div>
              )}
              <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Session Notes</label>
                <input value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)} placeholder="e.g. Focus on pressing" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
            </div>
          )
        })()}
      </div>

      {/* Session timeline */}
      <div className="space-y-2 mb-4">
        {SESSION_BLOCKS.map((block, i) => {
          const drill = session[block.key]
          const isOverridden = !!(weekOverrides[block.key])
          const timeOffset = [0,10,20,30,40][i]

          // GK parallel block - shown alongside attack with a note
          if (block.parallel) return (
            <div key={block.key} className="bg-white rounded-2xl border-2 overflow-hidden" style={{borderColor:'#0891b233'}}>
              <div className="px-4 py-2 flex items-center justify-between border-b" style={{background:'#ecfeff',borderColor:'#a5f3fc'}}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{block.icon}</span>
                  <span className="text-xs font-bold text-cyan-800">{block.label}</span>
                  <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded font-semibold">Runs parallel</span>
                  {isOverridden&&<span className="text-xs bg-cyan-200 text-cyan-800 font-semibold px-1.5 py-0.5 rounded">Saved</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{block.time}</span>
                  {!block.fixed&&<button onClick={()=>setSwapTarget(block.key)} className="text-xs font-semibold underline underline-offset-2" style={{color:'#0891b2'}}>swap</button>}
                </div>
              </div>
              {drill ? (
                <div className="flex gap-3 p-3">
                  <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0"><DrillDiagram type={drill.diagram} category={drill.category}/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{drill.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{drill.description}</p>
                  </div>
                </div>
              ) : (
                <div className="p-3"><p className="text-xs text-gray-400">No goalkeeper in squad -- skip this block</p></div>
              )}
            </div>
          )

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
  const clearAll=async()=>{setSelected([]);await onSave({drill_ids:[],message:''});setMessage('')}
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
        {selectedDrills.length>0&&(
          <button onClick={clearAll} className="px-4 font-bold py-3 rounded-2xl text-sm border border-red-200 text-red-400 hover:bg-red-50">
            Clear
          </button>
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
// ─── Season Start helper (outside component to avoid hook issues) ──────────────
function calcWeekNum(seasonStart) {
  if (!seasonStart) return 1
  const s = new Date(seasonStart), t = new Date()
  s.setHours(0,0,0,0); t.setHours(0,0,0,0)
  if (t < s) return 1
  return Math.floor((t - s) / (1000*60*60*24*7)) + 1
}

// ─── Session Status ────────────────────────────────────────────────────────────
function SessionStatusManager({ sessionStatus, onSave }) {
  const [form, setForm] = useState(sessionStatus)
  const [saved, setSaved] = useState(false)
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setSaved(false) }
  const save = async () => { await onSave(form); setSaved(true); setTimeout(()=>setSaved(false),2000) }
  const waText = form.status==='cancelled'
    ? `Clydach Juniors - Training CANCELLED this week. We will be back next week! - Coaches`
    : `Clydach Juniors - Training is ON this week${form.time?' at '+form.time:''}${form.location?' at '+form.location:''}. See you there! - Coaches`
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h2 className="font-bold text-gray-900 text-sm mb-3">🔔 Session Status</h2>
        <div className="flex gap-2 mb-4">
          {[{v:'on',label:'✅ Training ON'},{v:'cancelled',label:'🚫 Cancelled'}].map(o=>(
            <button key={o.v} onClick={()=>set('status',o.v)} className="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all"
              style={form.status===o.v?{background:o.v==='on'?'#16a34a':'#ef4444',color:'white',borderColor:o.v==='on'?'#16a34a':'#ef4444'}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
              {o.label}
            </button>
          ))}
        </div>
        {form.status==='on'&&(
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-semibold text-gray-600 block mb-1">Time</label>
              <input value={form.time} onChange={e=>set('time',e.target.value)} placeholder="e.g. 6:00pm" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none" onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/></div>
            <div><label className="text-xs font-semibold text-gray-600 block mb-1">Location</label>
              <input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g. Clydach Park" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none" onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/></div>
          </div>
        )}
        <div className="flex items-center justify-between p-3 rounded-xl mb-3" style={{background:form.show_parents?N.light:'#f9fafb',border:`1px solid ${form.show_parents?N.bg+'44':'#e5e7eb'}`}}>
          <div><p className="text-sm font-semibold text-gray-800">Show status to parents</p>
            <p className="text-xs text-gray-400">{form.show_parents?'Visible on parent view':'Hidden from parents'}</p></div>
          <button onClick={()=>set('show_parents',!form.show_parents)} className="w-12 h-6 rounded-full transition-all relative shrink-0 ml-3" style={{background:form.show_parents?N.bg:'#d1d5db'}}>
            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow" style={{left:form.show_parents?'26px':'2px'}}/>
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm" style={{background:saved?'#16a34a':N.bg}}>{saved?'✓ Saved!':'💾 Save Status'}</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm text-center" style={{background:'#16a34a'}}>📲 WhatsApp</a>
        </div>
      </div>
    </div>
  )
}

// ─── Match Day Notes ───────────────────────────────────────────────────────────
function MatchDayNotes({ weekNum, setWeekNum, currentWeek, matchNotes, onSave }) {
  const note = matchNotes[weekNum] || {}
  const [form, setForm] = useState({result:'',scorers:'',notes:'',opponent:'',venue:'',match_time:'',show_parents:false})
  const [tab, setTab] = useState('fixture')
  const [saved, setSaved] = useState(false)
  useEffect(()=>{ setForm({result:'',scorers:'',notes:'',opponent:'',venue:'',match_time:'',show_parents:false,...(matchNotes[weekNum]||{})}); setSaved(false) },[weekNum, matchNotes])
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setSaved(false) }
  const save = async () => { await onSave(weekNum, form); setSaved(true); setTimeout(()=>setSaved(false),2000) }
  const ic = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
  const fn = e=>e.target.style.borderColor=N.bg, fb = e=>e.target.style.borderColor='#d1d5db'
  const fixtureWa = `Clydach Juniors Match Day${form.opponent?' vs '+form.opponent:''}${form.match_time?'\nTime: '+form.match_time:''}${form.venue?'\nVenue: '+form.venue:''}\n\nGood luck to everyone! - Coaches`
  const resultWa = `Clydach Juniors Result${form.opponent?' vs '+form.opponent:''}${form.result?'\nResult: '+form.result:''}${form.scorers?'\nScorers: '+form.scorers:''}\n\nWell done everyone! - Coaches`
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2">
        <button onClick={()=>setWeekNum(w=>Math.max(1,w-1))} className="w-9 h-9 rounded-xl border border-gray-300 font-bold flex items-center justify-center">&#8249;</button>
        <div className="flex-1 text-center"><p className="font-bold text-gray-900 text-sm">Week {weekNum}{form.opponent?' - vs '+form.opponent:''}</p></div>
        <button onClick={()=>setWeekNum(w=>w+1)} className="w-9 h-9 rounded-xl border border-gray-300 font-bold flex items-center justify-center">&#8250;</button>
        <button onClick={()=>setWeekNum(currentWeek)} className="text-xs font-semibold px-2 py-1 rounded-lg" style={{background:N.light,color:N.text}}>Today</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {[{id:'fixture',label:'📋 Fixture'},{id:'result',label:'📊 Result'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all" style={tab===t.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>{t.label}</button>
          ))}
        </div>
        <div className="space-y-3">
          <div><label className="text-xs font-semibold text-gray-600 block mb-1">Opponent</label>
            <input value={form.opponent} onChange={e=>set('opponent',e.target.value)} placeholder="e.g. Swansea Juniors" className={ic} onFocus={fn} onBlur={fb}/></div>
          {tab==='fixture'&&<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-600 block mb-1">Time</label>
                <input value={form.match_time} onChange={e=>set('match_time',e.target.value)} placeholder="e.g. 10:00am" className={ic} onFocus={fn} onBlur={fb}/></div>
              <div><label className="text-xs font-semibold text-gray-600 block mb-1">Venue</label>
                <input value={form.venue} onChange={e=>set('venue',e.target.value)} placeholder="e.g. Clydach Park" className={ic} onFocus={fn} onBlur={fb}/></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{background:form.show_parents?N.light:'#f9fafb',border:`1px solid ${form.show_parents?N.bg+'44':'#e5e7eb'}`}}>
              <div><p className="text-sm font-semibold text-gray-800">Show fixture to parents</p></div>
              <button onClick={()=>set('show_parents',!form.show_parents)} className="w-12 h-6 rounded-full transition-all relative shrink-0 ml-3" style={{background:form.show_parents?N.bg:'#d1d5db'}}>
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow" style={{left:form.show_parents?'26px':'2px'}}/>
              </button>
            </div>
          </>}
          {tab==='result'&&<>
            <div><label className="text-xs font-semibold text-gray-600 block mb-1">Result</label>
              <input value={form.result} onChange={e=>set('result',e.target.value)} placeholder="e.g. Won 3-1" className={ic} onFocus={fn} onBlur={fb}/></div>
            <div><label className="text-xs font-semibold text-gray-600 block mb-1">Scorers</label>
              <input value={form.scorers} onChange={e=>set('scorers',e.target.value)} placeholder="e.g. J.Smith x2" className={ic} onFocus={fn} onBlur={fb}/></div>
            <div><label className="text-xs font-semibold text-gray-600 block mb-1">Coach Notes (private)</label>
              <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} placeholder="Key moments, areas to work on..." className={ic+' resize-none'} onFocus={fn} onBlur={fb}/></div>
          </>}
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm" style={{background:saved?'#16a34a':N.bg}}>{saved?'✓ Saved!':'💾 Save'}</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(tab==='fixture'?fixtureWa:resultWa)}`} target="_blank" rel="noreferrer" className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm text-center" style={{background:'#16a34a'}}>📲 {tab==='fixture'?'Share Fixture':'Share Result'}</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Squad Manager (Attendance + Notes + Positions + Progress) ─────────────────
function SquadManager({ currentWeek, setWeekNum, currentWeekNum, squad, attendance, onToggle, onAdd, onRemove, onUpdatePos, playerNotes, onSaveNote, drills, progressData, onSaveProgress }) {
  const [tab, setTab] = useState('attendance')
  const [newName, setNewName] = useState('')
  const [newNum, setNewNum] = useState('')
  const [adding, setAdding] = useState(false)
  const [editPlayer, setEditPlayer] = useState(null)
  const [notePlayer, setNotePlayer] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [progPlayer, setProgPlayer] = useState(null)
  const [posForm, setPosForm] = useState({preferred:'',secondary:''})
  const POSITIONS = ['GK','RB','CB','LB','RM','CM','LM','RW','ST','LW','CAM','CDM']
  const LEVELS = [{v:0,label:'Not started',color:'#e5e7eb'},{v:1,label:'Introduced',color:'#f59e0b'},{v:2,label:'Developing',color:'#3b82f6'},{v:3,label:'Confident',color:'#16a34a'}]
  const drillsForProgress = drills.filter(d=>d.category!=='Age Group Changes'&&d.category!=='Strength & Conditioning')
  const presentCount = squad.filter(p=>attendance[currentWeek+'-'+p.id]).length

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[{id:'attendance',label:'✅ Attend.'},{id:'squad',label:'👥 Squad'},{id:'notes',label:'📝 Notes'},{id:'progress',label:'📈 Progress'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all" style={tab===t.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>{t.label}</button>
        ))}
      </div>

      {tab==='attendance'&&(
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={()=>setWeekNum(w=>Math.max(1,w-1))} className="w-8 h-8 rounded-xl border border-gray-300 font-bold flex items-center justify-center text-sm">&#8249;</button>
            <div className="flex-1 text-center"><p className="font-bold text-gray-900 text-sm">Week {currentWeek}</p></div>
            <button onClick={()=>setWeekNum(w=>w+1)} className="w-8 h-8 rounded-xl border border-gray-300 font-bold flex items-center justify-center text-sm">&#8250;</button>
            <button onClick={()=>setWeekNum(currentWeekNum)} className="text-xs font-semibold px-2 py-1 rounded-lg" style={{background:N.light,color:N.text}}>Today</button>
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{background:N.bg}}>{presentCount}/{squad.length}</span>
          </div>
          {squad.length===0?<p className="text-sm text-gray-400 text-center py-4">Add players in the Squad tab first</p>:(
            <div className="space-y-2 mb-3">
              {squad.map(p=>{
                const present=!!attendance[currentWeek+'-'+p.id]
                return (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl border transition-all" style={{borderColor:present?'#16a34a':'#e5e7eb',background:present?'#f0fdf4':'white'}}>
                    {p.squad_num&&<span className="text-xs font-black w-6 text-center" style={{color:N.bg}}>{p.squad_num}</span>}
                    <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                    <button onClick={()=>onToggle(currentWeek,p.id,present)} className="w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-all" style={present?{background:'#16a34a',color:'white'}:{background:'#f3f4f6',color:'#9ca3af'}}>{present?'✓':'○'}</button>
                    <button onClick={()=>onRemove(p.id)} className="text-red-300 hover:text-red-500 text-xs px-1">✕</button>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}

      {tab==='squad'&&(
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-1">👥 Squad</h3>
          <p className="text-xs text-gray-400 mb-3">Add players once. Tap a player to set their positions.</p>
          {/* Add player */}
          {!adding?(
            <button onClick={()=>setAdding(true)} className="w-full text-xs py-2 rounded-xl border font-semibold mb-3" style={{borderColor:N.bg+'44',color:N.text,background:N.light}}>+ Add Player to Squad</button>
          ):(
            <div className="flex gap-2 mb-3">
              <input value={newNum} onChange={e=>setNewNum(e.target.value)} placeholder="#" className="border border-gray-300 rounded-xl px-2 py-2 text-sm w-12"/>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Player name" className="border border-gray-300 rounded-xl px-3 py-2 text-sm flex-1"/>
              <button onClick={()=>{if(newName.trim()){onAdd(newName.trim(),newNum.trim());setNewName('');setNewNum('');setAdding(false)}}} className="text-white text-xs font-bold px-3 rounded-xl" style={{background:N.bg}}>Add</button>
              <button onClick={()=>setAdding(false)} className="text-gray-400 text-xs px-2">✕</button>
            </div>
          )}
          <p className="text-xs font-semibold text-gray-600 mb-2">Tap a player to set positions. ✕ to remove from squad.</p>
          {squad.length===0?<p className="text-sm text-gray-400 text-center py-4">Add players in Attendance tab first</p>:(
            <div className="space-y-2">
              {squad.map(p=>(
                <button key={p.id} onClick={()=>{setEditPlayer(p);setPosForm({preferred:p.preferred||'',secondary:p.secondary||''})}} className="w-full flex items-center gap-3 p-3 rounded-xl border text-left" style={{borderColor:editPlayer?.id===p.id?N.bg:'#e5e7eb',background:editPlayer?.id===p.id?N.light:'white'}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:N.bg}}>{p.squad_num||p.name[0]}</div>
                  <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.preferred||'No position set'}{p.secondary?' / '+p.secondary:''}</p></div>
                  <span className="text-gray-300 text-xs">&#8250;</span>
                </button>
              ))}
            </div>
          )}
          {editPlayer&&(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">🎽 {editPlayer.name}</h3>
                <div className="space-y-3 mb-4">
                  <div><label className="text-xs font-semibold text-gray-600 block mb-2">Preferred Position</label>
                    <div className="flex flex-wrap gap-2">{POSITIONS.map(pos=><button key={pos} onClick={()=>setPosForm(f=>({...f,preferred:pos}))} className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all" style={posForm.preferred===pos?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>{pos}</button>)}</div></div>
                  <div><label className="text-xs font-semibold text-gray-600 block mb-2">Secondary Position</label>
                    <div className="flex flex-wrap gap-2">{POSITIONS.map(pos=><button key={pos} onClick={()=>setPosForm(f=>({...f,secondary:f.secondary===pos?'':pos}))} className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all" style={posForm.secondary===pos?{background:'#8b5cf6',color:'white',borderColor:'#8b5cf6'}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>{pos}</button>)}</div></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>{onUpdatePos(editPlayer.id,posForm);setEditPlayer(null)}} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm" style={{background:N.bg}}>Save</button>
                  <button onClick={()=>setEditPlayer(null)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='notes'&&(
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-1">📝 Player Development Notes</h3>
          <p className="text-xs text-gray-400 mb-3">Private - not visible to parents</p>
          {squad.length===0?<p className="text-sm text-gray-400 text-center py-4">Add players in Attendance tab first</p>:(
            <>
              <div className="space-y-2 mb-4">
                {squad.map(p=>{
                  const hasNote=!!(playerNotes[p.id]&&playerNotes[p.id].trim())
                  return (
                    <button key={p.id} onClick={()=>{setNotePlayer(p);setNoteText(playerNotes[p.id]||'');setNoteSaved(false)}} className="w-full flex items-center gap-3 p-3 rounded-xl border text-left" style={{borderColor:notePlayer?.id===p.id?N.bg:'#e5e7eb',background:notePlayer?.id===p.id?N.light:'white'}}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:N.bg}}>{p.squad_num||p.name[0]}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900">{p.name}</p>
                        {hasNote&&<p className="text-xs text-gray-400 truncate">{playerNotes[p.id]}</p>}</div>
                      {hasNote&&<span className="text-xs text-green-500">●</span>}
                    </button>
                  )
                })}
              </div>
              {notePlayer&&(
                <div className="border-t border-gray-100 pt-4">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Notes for {notePlayer.name}</label>
                  <textarea value={noteText} onChange={e=>{setNoteText(e.target.value);setNoteSaved(false)}} rows={4} placeholder="e.g. Strong in the air, needs work on weak foot..." className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none mb-2" onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
                  <button onClick={async()=>{await onSaveNote(notePlayer.id,noteText);setNoteSaved(true);setTimeout(()=>setNoteSaved(false),2000)}} className="w-full text-white font-bold py-2.5 rounded-xl text-sm" style={{background:noteSaved?'#16a34a':N.bg}}>{noteSaved?'✓ Saved!':'💾 Save Notes'}</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab==='progress'&&(
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">📈 Player Progression Tracker</h3>
          <div className="flex gap-3 flex-wrap mb-3">
            {LEVELS.map(l=><div key={l.v} className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{background:l.color}}/><span className="text-xs text-gray-500">{l.label}</span></div>)}
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            {squad.map(p=>(
              <button key={p.id} onClick={()=>setProgPlayer(progPlayer?.id===p.id?null:p)} className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all" style={progPlayer?.id===p.id?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                {p.squad_num?'#'+p.squad_num+' ':''}{p.name.split(' ')[0]}
              </button>
            ))}
          </div>
          {progPlayer&&(
            <div className="space-y-2">
              {drillsForProgress.map(drill=>{
                const level=progressData[progPlayer.id+'-'+drill.id]||0
                return (
                  <div key={drill.id} className="flex items-center gap-2 p-2 rounded-xl border border-gray-100">
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900 truncate">{drill.title}</p>
                      <p className="text-xs text-gray-400">{drill.category}</p></div>
                    <div className="flex gap-1">
                      {LEVELS.map(l=><button key={l.v} onClick={()=>onSaveProgress(progPlayer.id,drill.id,l.v)} className="w-7 h-7 rounded-full border-2 transition-all" style={{background:level===l.v?l.color:'white',borderColor:level===l.v?l.color:'#e5e7eb'}} title={l.label}/>)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── FAW Quick Reference ───────────────────────────────────────────────────────
const FAW_RULES = [
  {icon:'⚽',title:'Format',rule:'9v9 on a 64x44 yard pitch. 70 mins - 2x35 min halves. Goals 7x16ft. Ball size 4.'},
  {icon:'🚩',title:'Offside',rule:'Standard offside applies. Not from goal kick, throw-in or corner.'},
  {icon:'↩️',title:'Retreat Line',rule:'Opposition must be 10 yards from the goalkeeper when they have the ball.'},
  {icon:'🧤',title:'Goalkeeper',rule:'GK cannot pick up a deliberate back pass. Can handle ball in penalty area only.'},
  {icon:'⏱️',title:'Playing Time',rule:'All squad members must play minimum 50% of total playing time. Rolling substitutes.'},
  {icon:'🔴',title:'Mercy Rule',rule:'If a team leads by 8 goals, the match is declared over.'},
  {icon:'📊',title:'League Standing',rule:'Goal difference CANNOT be used in league standings at U12 or U13.'},
  {icon:'🤕',title:'Heading',rule:'Heading is LOW PRIORITY at U12. Max 10 mins per session, max 4 headers per bout.'},
  {icon:'🏆',title:'Competition',rule:'Season must start with non-competitive fixtures. Maximum 24 weeks of competitive football.'},
  {icon:'🏟️',title:'Buffer Zone',rule:'2-metre buffer zone required from touchlines. No spectators behind goals.'},
  {icon:'🚭',title:'Match Day',rule:'Smoking and vaping banned from sideline. No continuous shouting of instructions.'},
  {icon:'📋',title:'Team Roster',rule:'Team roster on COMET compulsory. Maximum 18 players per match day squad.'},
  {icon:'👨‍🏫',title:'Coach Requirements',rule:'Minimum FAW Football Leaders Award required. Valid Enhanced DBS check mandatory.'},
]
function FAWReference() {
  const [open, setOpen] = useState(null)
  return (
    <div>
      <div className="rounded-2xl p-4 mb-4 flex gap-3 items-start" style={{background:N.light,border:`1px solid ${N.bg}33`}}>
        <div><p className="font-bold text-sm" style={{color:N.text}}>FAW Quick Reference - U12 2025-26</p>
          <p className="text-xs mt-0.5" style={{color:N.text+'bb'}}>Key rules at a glance. Tap any rule for detail.</p></div>
      </div>
      <div className="space-y-2">
        {FAW_RULES.map((r,i)=>(
          <div key={i} onClick={()=>setOpen(open===i?null:i)} className="bg-white border rounded-2xl overflow-hidden cursor-pointer" style={{borderColor:open===i?N.bg:'#e5e7eb'}}>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg shrink-0">{r.icon}</span>
              <span className="flex-1 text-sm font-semibold text-gray-900">{r.title}</span>
              <span className="text-gray-400 text-xs">{open===i?'▲':'▼'}</span>
            </div>
            {open===i&&<div className="px-4 pb-3"><p className="text-sm text-gray-600 leading-relaxed">{r.rule}</p></div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Season Overview ───────────────────────────────────────────────────────────
function SeasonOverview({ seasonStart, matchNotes, currentWeek, onWeekSelect }) {
  if (!seasonStart) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
      <p className="text-2xl mb-2">📅</p>
      <p className="text-sm font-semibold text-gray-600">No season start date set</p>
      <p className="text-xs text-gray-400 mt-1">Set a season start date in the Planner tab</p>
    </div>
  )
  const weeks = Array.from({length:30},(_,i)=>i+1)
  const getDate = w => { const d=new Date(seasonStart); d.setDate(d.getDate()+(w-1)*7); return d }
  const fmt = d => d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})
  return (
    <div>
      <div className="rounded-2xl p-4 mb-4" style={{background:N.light,border:`1px solid ${N.bg}33`}}>
        <p className="font-bold text-sm" style={{color:N.text}}>Season Overview - 30 weeks</p>
        <p className="text-xs mt-0.5" style={{color:N.text+'bb'}}>Tap a week to view match notes. ⚽ = notes logged.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {weeks.map(w=>{
          const d=getDate(w)
          const hasNote=!!(matchNotes[w]&&(matchNotes[w].result||matchNotes[w].opponent))
          const isCurrent=w===currentWeek
          return (
            <button key={w} onClick={()=>onWeekSelect(w)} className="rounded-xl p-2.5 text-center border-2 transition-all"
              style={{borderColor:isCurrent?N.bg:hasNote?'#16a34a':'#e5e7eb',background:isCurrent?N.bg:hasNote?'#f0fdf4':'white',color:isCurrent?'white':'inherit'}}>
              <div className="text-xs font-black" style={{color:isCurrent?'white':N.text}}>W{w}</div>
              <div className="mt-0.5" style={{color:isCurrent?'rgba(255,255,255,0.8)':'#9ca3af',fontSize:'9px'}}>{fmt(d)}</div>
              {hasNote&&!isCurrent&&<div className="text-xs">⚽</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Parent View ───────────────────────────────────────────────────────────────
function ParentView({ sessionStatus, matchNotes, drills, homeSession }) {
  const upcomingFixture = Object.values(matchNotes).find(n=>n.show_parents&&n.opponent)
  return (
    <div>
      {sessionStatus.show_parents&&(
        sessionStatus.status==='cancelled'
          ? <div className="rounded-2xl p-4 mb-4 flex gap-3 items-center" style={{background:'#fef2f2',border:'1px solid #fecaca'}}><span className="text-2xl">🚫</span><div><p className="font-bold text-red-800 text-sm">Training CANCELLED this week</p><p className="text-red-700 text-xs mt-0.5">Check back soon for updates</p></div></div>
          : <div className="rounded-2xl p-4 mb-4 flex gap-3 items-center" style={{background:'#f0fdf4',border:'1px solid #bbf7d0'}}><span className="text-2xl">✅</span><div><p className="font-bold text-green-800 text-sm">Training is ON this week</p>{(sessionStatus.time||sessionStatus.location)&&<p className="text-green-700 text-xs mt-0.5">{[sessionStatus.time,sessionStatus.location].filter(Boolean).join(' - ')}</p>}</div></div>
      )}
      {upcomingFixture&&(
        <div className="rounded-2xl p-4 mb-4" style={{background:'#eff6ff',border:'1px solid #bfdbfe'}}>
          <p className="font-bold text-blue-800 text-sm mb-1">⚽ Upcoming Match</p>
          <p className="text-blue-900 font-semibold text-sm">vs {upcomingFixture.opponent}</p>
          <div className="flex gap-3 mt-1">
            {upcomingFixture.match_time&&<p className="text-blue-700 text-xs">⏰ {upcomingFixture.match_time}</p>}
            {upcomingFixture.venue&&<p className="text-blue-700 text-xs">📍 {upcomingFixture.venue}</p>}
          </div>
        </div>
      )}
      <ParentHomeView drills={drills} homeSession={homeSession}/>
    </div>
  )
}

export default function App() {
  const [role,setRole]=useState(null)
  const [view,setView]=useState('drills')
  const [drills,setDrills]=useState([])
  const [homeSession,setHomeSession]=useState({drill_ids:[],message:''})
  const [seasonStart,setSeasonStart]=useState('')
  const [sessionStatus,setSessionStatus]=useState({status:'on',location:'',time:'',show_parents:false})
  const [squad,setSquad]=useState([])
  const [matchNotes,setMatchNotes]=useState({})
  const [playerNotes,setPlayerNotes]=useState({})
  const [attendance,setAttendance]=useState({})
  const [progressData,setProgressData]=useState({})
  const [matchWeek,setMatchWeek]=useState(1)
  const [squadWeek,setSquadWeek]=useState(1)
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
      try{const{data,error}=await supabase.from('drills').select('*').order('id');if(error)throw error;if(!data||data.length===0){await supabase.from('drills').upsert(SEED_DRILLS,{onConflict:'id'});setDrills(SEED_DRILLS)}else{setDrills(data)}}catch(e){console.error(e);setDbError(true);setDrills(SEED_DRILLS)}
      try{const{data:hs}=await supabase.from('home_session').select('*').eq('id',1).single();if(hs)setHomeSession({drill_ids:hs.drill_ids||[],message:hs.message||''})}catch(e){}
      try{const{data:ss}=await supabase.from('season_settings').select('*').eq('id',1).single();if(ss){if(ss.season_start)setSeasonStart(ss.season_start);setSessionStatus({status:ss.session_status||'on',location:ss.session_location||'',time:ss.session_time||'',show_parents:ss.show_status_to_parents||false})}}catch(e){}
      try{const{data:sq}=await supabase.from('squad').select('*').order('name');if(sq)setSquad(sq)}catch(e){}
      try{const{data:mn}=await supabase.from('match_notes').select('*');if(mn){const o={};mn.forEach(r=>{o[r.week_num]={result:r.result||'',scorers:r.scorers||'',notes:r.notes||'',opponent:r.opponent||'',venue:r.venue||'',match_time:r.match_time||'',show_parents:r.show_parents||false}});setMatchNotes(o)}}catch(e){}
      try{const{data:pn}=await supabase.from('player_notes').select('*');if(pn){const o={};pn.forEach(r=>{o[r.player_id]=r.note||''});setPlayerNotes(o)}}catch(e){}
      try{const{data:at}=await supabase.from('attendance').select('*');if(at){const o={};at.forEach(r=>{o[r.week_num+'-'+r.player_name]=r.present});setAttendance(o)}}catch(e){}
      try{const{data:pp}=await supabase.from('player_progress').select('*');if(pp){const o={};pp.forEach(r=>{o[r.player_id+'-'+r.drill_id]=r.level});setProgressData(o)}}catch(e){}
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

  const saveSeasonStart=async(d)=>{setSeasonStart(d);try{await supabase.from('season_settings').upsert({id:1,season_start:d||null})}catch(e){}}
  const saveSessionStatus=async(s)=>{setSessionStatus(s);try{await supabase.from('season_settings').upsert({id:1,session_status:s.status,session_location:s.location,session_time:s.time,show_status_to_parents:s.show_parents||false})}catch(e){}}
  const saveMatchNote=async(wk,note)=>{setMatchNotes(p=>({...p,[wk]:note}));try{await supabase.from('match_notes').upsert({week_num:wk,...note})}catch(e){}}
  const savePlayerNote=async(pid,note)=>{setPlayerNotes(p=>({...p,[pid]:note}));try{await supabase.from('player_notes').upsert({player_id:pid,note})}catch(e){}}
  const addSquadPlayer=async(name,num)=>{try{const{data}=await supabase.from('squad').insert({name,squad_num:num}).select().single();if(data)setSquad(p=>[...p,data])}catch(e){}}
  const removeSquadPlayer=async(id)=>{setSquad(p=>p.filter(x=>x.id!==id));try{await supabase.from('squad').delete().eq('id',id)}catch(e){}}
  const updatePlayerPosition=async(id,form)=>{setSquad(p=>p.map(x=>x.id===id?{...x,...form}:x));try{await supabase.from('squad').update(form).eq('id',id)}catch(e){}}
  const toggleAttendance=async(wk,pid,cur)=>{const k=wk+'-'+pid;setAttendance(p=>({...p,[k]:!cur}));try{await supabase.from('attendance').upsert({week_num:wk,player_name:String(pid),present:!cur},{onConflict:'week_num,player_name'})}catch(e){}}
  const saveProgress=async(pid,did,level)=>{setProgressData(p=>({...p,[pid+'-'+did]:level}));try{if(level===0){await supabase.from('player_progress').delete().eq('player_id',pid).eq('drill_id',did)}else{await supabase.from('player_progress').upsert({player_id:pid,drill_id:did,level},{onConflict:'player_id,drill_id'})}}catch(e){}}

  const currentWeek=(()=>{if(!seasonStart)return 1;const s=new Date(seasonStart),t=new Date();s.setHours(0,0,0,0);t.setHours(0,0,0,0);if(t<s)return 1;return Math.floor((t-s)/(1000*60*60*24*7))+1})()

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
              <button onClick={()=>{setRole(null);setView('drills');setFilterCat('All');setFilterAge('All');setSearch('')}} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">Sign out</button>
            </div>
          </div>

          {isCoach&&(
            <>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-1">
                {[{id:'drills',label:'📋 Drills'},{id:'planner',label:'📅 Planner'},{id:'home-manager',label:'🏠 Home',badge:publishedCount>0?publishedCount:null},{id:'status',label:'🔔 Status'}].map(tab=>(
                  <button key={tab.id} onClick={()=>setView(tab.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all relative" style={view===tab.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                    {tab.label}
                    {tab.badge&&<span className="absolute -top-1 -right-1 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center font-black" style={{background:N.bg,fontSize:'9px'}}>{tab.badge}</span>}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {[{id:'match',label:'⚽ Match'},{id:'squad',label:'👥 Squad'},{id:'faw',label:'WAL FAW'},{id:'season',label:'📊 Season'}].map(tab=>(
                  <button key={tab.id} onClick={()=>setView(tab.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all" style={view===tab.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {isCoach&&view==='planner'&&<TrainingPlanner drills={drills} seasonStart={seasonStart} onSeasonStartChange={saveSeasonStart}/>}
        {isCoach&&view==='home-manager'&&<HomeSessionManager drills={drills} homeSession={homeSession} onSave={saveHomeSession}/>}
        {isCoach&&view==='status'&&<SessionStatusManager sessionStatus={sessionStatus} onSave={saveSessionStatus}/>}
        {isCoach&&view==='match'&&<MatchDayNotes weekNum={matchWeek} setWeekNum={setMatchWeek} currentWeek={currentWeek} matchNotes={matchNotes} onSave={saveMatchNote}/>}
        {isCoach&&view==='squad'&&<SquadManager currentWeek={squadWeek} setWeekNum={setSquadWeek} currentWeekNum={currentWeek} squad={squad} attendance={attendance} onToggle={toggleAttendance} onAdd={addSquadPlayer} onRemove={removeSquadPlayer} onUpdatePos={updatePlayerPosition} playerNotes={playerNotes} onSaveNote={savePlayerNote} drills={drills} progressData={progressData} onSaveProgress={saveProgress}/>}
        {isCoach&&view==='faw'&&<FAWReference/>}
        {isCoach&&view==='season'&&<SeasonOverview seasonStart={seasonStart} matchNotes={matchNotes} currentWeek={currentWeek} onWeekSelect={(w)=>setView('planner')}/>}
        {!isCoach&&<ParentView sessionStatus={sessionStatus} matchNotes={matchNotes} drills={drills} homeSession={homeSession}/>}

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
