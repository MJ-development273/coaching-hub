import { useState, useEffect, useRef, Fragment } from 'react'
import { supabase } from './supabase'
import { SEED_DRILLS } from './drills'

// ─── Theme ────────────────────────────────────────────────────────────────────
// Primary navy: #1e3a5f  Hover navy: #152d4a  Light navy bg: #eef1f7

// Parses a plain YYYY-MM-DD date string as a LOCAL date (avoiding the JS pitfall where
// new Date("2025-09-07") is interpreted as UTC midnight, which can roll back a day
// when displayed in timezones behind UTC).
function parseLocalDate(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const N = { bg:'#1e3a5f', hover:'#152d4a', light:'#eef1f7', border:'#1e3a5f', text:'#1e3a5f' }
const SITE_URL = 'https://coaching-hub-virid.vercel.app'

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
  // Card thumbnails reuse the same full tactical diagram as the detail view, just scaled down
  return <TacticalDiagram type={type} category={category}/>
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
              📣 Coach Login
            </button>
            <button onClick={()=>onAuth('parent')} className="w-full border-2 font-semibold py-3 rounded-xl transition-colors"
              style={{borderColor:N.bg, color:N.text}}
              onMouseEnter={e=>{e.currentTarget.style.background=N.light}}
              onMouseLeave={e=>{e.currentTarget.style.background='white'}}>
              ⭐ Player / Parent
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
        {[50,85,120,155,190,225,260].map((x,i)=>{ const y=i%2===0?80:140; return <polygon key={i} points={`${x},${y-8} ${x-5},${y+4} ${x+5},${y+4}`} fill="#f59e0b" stroke="white" strokeWidth="1"/> })}
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
    targetpass: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(60,150,accent,'P')}
        {/* Targets at increasing distances */}
        <rect x="115" y="140" width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2"/>
        <rect x="175" y="110" width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2"/>
        <rect x="235" y="75" width="14" height="14" fill="none" stroke="#f59e0b" strokeWidth="2"/>
        <rect x="270" y="140" width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2"/>
        {Arrow(72,148,118,148,accent)}
        {Arrow(72,145,178,116,accent,true)}
        {Arrow(72,142,238,80,accent,true)}
        <text x="160" y="30" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">TARGETS AT VARIED DISTANCES</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Pass accurately to hit each target -- accuracy over power</text>
      </svg>
    ),
    vertjump: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(160,140,accent,'P')}
        {/* Straight up arrow */}
        <path d="M160,130 L160,60" fill="none" stroke="white" strokeWidth="3" markerEnd="url(#vjarrow)"/>
        <defs><marker id="vjarrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="white"/></marker></defs>
        <circle cx="160" cy="55" r="8" fill={accent} stroke="white" strokeWidth="1.5" opacity="0.6"/>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">EXPLODE STRAIGHT UP -- LAND SOFT</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Quarter squat dip, then jump as high as possible</text>
      </svg>
    ),
    broadjump: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(70,110,accent,'P')}
        <circle cx="230" cy="110" r="8" fill={accent} stroke="white" strokeWidth="1.5" opacity="0.5"/>
        <path d="M85,110 Q160,75 220,108" fill="none" stroke="white" strokeWidth="3" markerEnd="url(#bjarrow)"/>
        <defs><marker id="bjarrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="white"/></marker></defs>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">JUMP FORWARD -- LAND SOFT ON BOTH FEET</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Use arms to drive forward -- measure distance covered</text>
      </svg>
    ),
    lateralbound: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(110,110,accent,'P')}
        <circle cx="210" cy="110" r="8" fill={accent} stroke="white" strokeWidth="1.5" opacity="0.5"/>
        <path d="M125,110 L195,110" fill="none" stroke="white" strokeWidth="3" markerEnd="url(#lbarrow)"/>
        <defs><marker id="lbarrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="white"/></marker></defs>
        <path d="M195,120 L125,120" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#lbarrow2)"/>
        <defs><marker id="lbarrow2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b"/></marker></defs>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">JUMP SIDEWAYS -- STICK THE LANDING</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Hold landing 2 seconds before jumping back</text>
      </svg>
    ),
    tuckjump: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(160,145,accent,'P')}
        <path d="M160,132 L160,75" fill="none" stroke="white" strokeWidth="3" markerEnd="url(#tjarrow)"/>
        <defs><marker id="tjarrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="white"/></marker></defs>
        <circle cx="160" cy="65" r="9" fill={accent} stroke="white" strokeWidth="1.5"/>
        <path d="M153,68 Q160,55 167,68" fill="none" stroke="white" strokeWidth="1.5"/>
        <text x="160" y="42" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">KNEES UP</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Pull both knees to chest at peak, land softly</text>
      </svg>
    ),
    boxstep: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x="130" y="140" width="60" height="20" fill="#f59e0b" opacity="0.5" stroke="#f59e0b" strokeWidth="2"/>
        <text x="160" y="154" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">STEP/CURB</text>
        {P(160,110,accent,'P')}
        <path d="M160,122 L160,140" fill="none" stroke="white" strokeWidth="2.5" markerEnd="url(#bsarrow1)"/>
        <defs><marker id="bsarrow1" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="white"/></marker></defs>
        <path d="M180,150 L210,110" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#bsarrow2)"/>
        <defs><marker id="bsarrow2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b"/></marker></defs>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">STEP UP -- STEP DOWN -- RESET</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Land softly, absorb through the knees not the floor</text>
      </svg>
    ),
    scanning: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(120,120,accent,'A')}
        {P(200,80,'#ef4444','D')}
        <circle cx="160" cy="100" r="7" fill="white" opacity="0.9"/>
        {Arrow(200,88,168,98,accent)}
        {/* Head turn arc showing the scan */}
        <path d="M112,108 A14,14 0 1,1 128,108" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2"/>
        <text x="120" y="95" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">scan</text>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">CHECK SHOULDER BEFORE THE BALL ARRIVES</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Know what's behind you before you receive</text>
      </svg>
    ),
    reactionsprint: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {/* Coach with cone raised */}
        <circle cx="60" cy="70" r="10" fill="#94a3b8" stroke="white" strokeWidth="1.5"/>
        <rect x="55" y="45" width="10" height="14" fill="#f59e0b" stroke="white" strokeWidth="1"/>
        <text x="60" y="35" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">DROP</text>
        {P(60,120,accent,'P')}
        <path d="M75,120 L230,110" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6,3" markerEnd="url(#rsarrow)"/>
        <defs><marker id="rsarrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="white"/></marker></defs>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">SPRINT ON THE DROP -- REACT FAST</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">10m sprint from standing start, vary direction called</text>
      </svg>
    ),
    stairs: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {/* Stair steps drawn as ascending blocks */}
        {[0,1,2,3,4,5].map(i=>(
          <rect key={i} x={70+i*30} y={175-i*22} width="30" height={22+i*22} fill="#94a3b8" opacity="0.5" stroke="white" strokeWidth="1"/>
        ))}
        {P(85,165,accent,'P')}
        <path d="M85,155 L235,55" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6,3" markerEnd="url(#stairarrow)"/>
        <defs><marker id="stairarrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="white"/></marker></defs>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">SPRINT UP -- WALK DOWN TO RECOVER</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">8-10 reps, full recovery on the way down</text>
      </svg>
    ),
    circuit: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {[['Squats',75,55],['Lunges',245,55],['Press-Ups',75,155],['Sit-Ups',245,155]].map(([t,x,y])=>(
          <g key={t}>
            <circle cx={x} cy={y} r="28" fill={N.bg} opacity="0.7" stroke={accent} strokeWidth="1.5"/>
            <text x={x} y={y+4} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">{t}</text>
          </g>
        ))}
        <text x="160" y="108" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">30s ON / 15s REST</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Repeat the full circuit 3 times through</text>
      </svg>
    ),
    balance: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {/* Person balancing on one leg */}
        <circle cx="160" cy="80" r="12" fill={accent} stroke="white" strokeWidth="1.5"/>
        <line x1="160" y1="92" x2="160" y2="140" stroke={accent} strokeWidth="4"/>
        <line x1="160" y1="105" x2="135" y2="115" stroke={accent} strokeWidth="3"/>
        <line x1="160" y1="105" x2="185" y2="115" stroke={accent} strokeWidth="3"/>
        <line x1="160" y1="140" x2="160" y2="175" stroke={accent} strokeWidth="4"/>
        <path d="M160,140 Q185,150 195,135" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round"/>
        <ellipse cx="160" cy="178" rx="10" ry="4" fill={accent} opacity="0.4"/>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">STAND ON ONE LEG -- 30 SECONDS</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Progress: eyes closed, then reach free leg out</text>
      </svg>
    ),
    plankpress: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {/* Plank position figure */}
        <circle cx="90" cy="120" r="10" fill={accent} stroke="white" strokeWidth="1.5"/>
        <line x1="100" y1="122" x2="220" y2="140" stroke={accent} strokeWidth="4"/>
        <line x1="110" y1="128" x2="105" y2="150" stroke={accent} strokeWidth="3"/>
        <line x1="210" y1="138" x2="215" y2="155" stroke={accent} strokeWidth="3"/>
        <path d="M160,50 Q160,80 160,105" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#pparrow)"/>
        <defs><marker id="pparrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,4 L4,0 L8,4 Z" fill="white"/></marker></defs>
        <text x="160" y="42" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">PUSH UP ONE ARM AT A TIME</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Forearm plank to full press-up, alternate leading arm</text>
      </svg>
    ),
    antirotation: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(160,120,accent)}
        <line x1="160" y1="105" x2="220" y2="100" stroke={accent} strokeWidth="4" strokeLinecap="round"/>
        <circle cx="222" cy="100" r="6" fill="white" stroke={accent} strokeWidth="1.5"/>
        <path d="M160,80 L160,60" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#rotarrow)"/>
        <defs><marker id="rotarrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#ef4444"/></marker></defs>
        <text x="200" y="55" fill="#ef4444" fontSize="8" fontWeight="bold">resist twist</text>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">ARMS OUT -- CORE STAYS STILL</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Hold 20 seconds each side without twisting</text>
      </svg>
    ),
    stickland: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(160,110,accent,'P')}
        <path d="M160,100 L160,75" fill="none" stroke="white" strokeWidth="2.5" markerEnd="url(#slarrow)"/>
        <defs><marker id="slarrow" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="white"/></marker></defs>
        <path d="M160,120 L160,145" fill="none" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#slarrow2)"/>
        <defs><marker id="slarrow2" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#f59e0b"/></marker></defs>
        <text x="200" y="145" fill="#f59e0b" fontSize="8" fontWeight="bold">hold 2s</text>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">SMALL JUMP -- HOLD THE LANDING STILL</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Landing control matters far more than jump height</text>
      </svg>
    ),
    toetaps: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(160,110,accent,'P')}
        <circle cx="160" cy="130" r="6" fill="white" stroke={accent} strokeWidth="1.5"/>
        {/* Alternating tap arrows - small quick taps down onto the ball from each foot */}
        <path d="M145,100 L155,124" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#taparrow1)"/>
        <path d="M175,100 L165,124" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#taparrow2)"/>
        <defs>
          <marker id="taparrow1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={accent}/></marker>
          <marker id="taparrow2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={accent}/></marker>
        </defs>
        <text x="145" y="95" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">L</text>
        <text x="175" y="95" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">R</text>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">ALTERNATING FEET -- QUICK TAPS</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Stand over the ball, tap side to side with each foot</text>
      </svg>
    ),
    ballmastery: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        {P(160,110,accent,'P')}
        {/* Ball at feet with side-to-side roll arrows */}
        <circle cx="160" cy="130" r="6" fill="white" stroke={accent} strokeWidth="1.5"/>
        {Arrow(140,130,110,130,accent)}
        {Arrow(180,130,210,130,accent,true)}
        {/* Drag-back arrow */}
        <path d="M160,124 Q175,105 160,90" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,3"/>
        <text x="185" y="90" fill="#f59e0b" fontSize="8" fontWeight="bold">drag-back</text>
        <text x="160" y="40" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">SOLE OF FOOT ONLY</text>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Roll side to side, then drag back -- close control focus</text>
      </svg>
    ),
    gkhandling: (
      <svg viewBox={vb} className="w-full h-full">
        {Pitch()}
        <rect x="130" y="10" width="60" height="16" fill="none" stroke="white" strokeWidth="2"/>
        <rect x="100" y="10" width="120" height="65" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        {P(160,55,accent,'GK')}
        {P(60,140,'#ef4444','S')}{P(160,150,'#ef4444','S')}{P(260,140,'#ef4444','S')}
        <line x1="68" y1="133" x2="152" y2="62" stroke="white" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.7"/>
        <line x1="160" y1="141" x2="160" y2="67" stroke="white" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.7"/>
        <line x1="252" y1="133" x2="168" y2="62" stroke="white" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.7"/>
        <text x="160" y="195" fill="#86efac" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.9">Serves from multiple angles -- GK reads and responds</text>
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
    :`⚽ *Home Practice — ${drill.title}*\n\nHere's a drill for your child to try at home this week!\n\n📋 ${drill.category} | ${(drill.age_groups||[]).join(', ')}\n⏱ ${drill.duration}\n\n${drill.description}\n\n💡 A garden or park works perfectly — bottles or jumpers for cones!\n\n— Clydach Juniors Coaching Team\n🔗 ${SITE_URL}`
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">📲 Share via WhatsApp</h2>
        <div className="flex gap-2 mb-4">
          {['coaches','parents'].map(t=>(
            <button key={t} onClick={()=>setTarget(t)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={target===t?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#d1d5db'}}>
              {t==='coaches'?'🏃 Coaches':'👤 Parents'}
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
// Pre-season session focuses on fitness base, passing foundations, age group intro and GK
const PRE_SEASON_BLOCKS = [
  { key:'ps_warmup',   label:'Warm-Up & Fitness Base',        time:'15 min', icon:'🏃', cat:'Strength & Conditioning', fixed:false, desc:'Extended warm-up with conditioning focus — agility ladders, shuttle runs, dynamic stretching. Build fitness base before competitive season.' },
  { key:'ps_passing',  label:'Passing Foundations',           time:'15 min', icon:'🎯', cat:'Passing',                 fixed:false, desc:'Core passing technique — accuracy, weight of pass, movement off the ball. Keep it simple and repetitive to build muscle memory.' },
  { key:'ps_agegroup', label:'Age Group Changes & Shape',     time:'15 min', icon:'📋', cat:'Age Group Changes',       fixed:false, desc:'Walk through new age group rules, pitch size changes and positional responsibilities. Use cones to mark the new pitch dimensions.' },
  { key:'ps_gk',       label:'Goalkeeper Pre-Season',         time:'15 min', icon:'🧤', cat:'Goalkeeping',             fixed:false, desc:'GK-specific fitness and technique work. Handling, footwork, angle play and distribution. Runs alongside the age group session.' },
  { key:'ps_game',     label:'Friendly Small Sided Game',     time:'20 min', icon:'⚽', cat:null,                      fixed:true,  desc:'Low-pressure game to apply session work. Focus on effort and fun — no heavy coaching during the game itself.' },
]

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
  lines.push(`— Clydach Juniors Coaching Team\n🔗 ${SITE_URL}`)
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

function TrainingPlanner({ drills, seasonStart, preSeasonStart, onSeasonStartChange, dateOverrides, onDateOverride, onDateClear, squad, groupAssignments, groupCount }) {
  // Detect if TODAY falls in the pre-season window (used both for week calc and default toggle)
  const isPreSeasonAuto = (() => {
    if (!preSeasonStart) return false
    const today = new Date(); today.setHours(0,0,0,0)
    const pre = parseLocalDate(preSeasonStart); pre.setHours(0,0,0,0)
    const comp = seasonStart ? parseLocalDate(seasonStart) : null
    if (comp) comp.setHours(0,0,0,0)
    if (today < pre) return false
    if (comp && today >= comp) return false
    return true
  })()

  // Calculate the correct current week number based on which season is active
  const calcWeekFor = (isPre) => {
    const base = isPre ? preSeasonStart : seasonStart
    if (!base) return 1
    const s = parseLocalDate(base), t = new Date()
    s.setHours(0,0,0,0); t.setHours(0,0,0,0)
    if (t < s) return 1
    // Advance to the next week the day AFTER each session date has passed, not after a
    // full 7-day cycle -- e.g. training Monday 7th means the planner should already show
    // next week's session from Tuesday 8th onwards, not wait until Monday 14th.
    let week = Math.floor((t - s) / (1000*60*60*24*7)) + 1
    while (true) {
      const sessionDate = (!isPre && dateOverrides && dateOverrides[week])
        ? parseLocalDate(dateOverrides[week])
        : (() => { const d = new Date(s); d.setDate(d.getDate() + (week - 1) * 7); return d })()
      sessionDate.setHours(0,0,0,0)
      if (t > sessionDate) { week += 1 } else { break }
    }
    return week
  }

  const [weekNum,setWeekNum]=useState(()=>calcWeekFor(isPreSeasonAuto))
  const [ageFilter,setAgeFilter]=useState('U12')
  const [overrides,setOverrides]=useState({})
  const [swapTarget,setSwapTarget]=useState(null)
  const [sessionNotes,setSessionNotes]=useState('')
  const [shareOpen,setShareOpen]=useState(false)
  const [detailDrill,setDetailDrill]=useState(null)
  const [showGroupsFor,setShowGroupsFor]=useState(null)
  const [groupMode,setGroupMode]=useState(false)
  const [groupSwapTarget,setGroupSwapTarget]=useState(null) // {blockKey, groupNum}
  const [editingDate,setEditingDate]=useState(false)
  const [tempDate,setTempDate]=useState('')
  const [showPreSeason,setShowPreSeason]=useState(null) // null=auto, true=forced on, false=forced off
  const inputCls="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
  const focusNavy=e=>e.target.style.borderColor=N.bg
  const blurGray=e=>e.target.style.borderColor='#d1d5db'

  const isPreSeason = showPreSeason !== null ? showPreSeason : isPreSeasonAuto

  const overridesLoadedRef = useRef(false)

  // Load saved drill swaps from Supabase once on mount
  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from('season_settings').select('session_overrides').eq('id',1).single()
        if(data && data.session_overrides) setOverrides(data.session_overrides)
      }catch(e){console.error('load overrides:',e)}
      overridesLoadedRef.current = true
    })()
  },[])

  // Persist drill swaps to Supabase whenever they change (debounced), but never before the initial load completes
  useEffect(()=>{
    if(!overridesLoadedRef.current) return
    const t = setTimeout(()=>{
      supabase.from('season_settings').upsert({id:1, session_overrides: overrides}).then(({error})=>{
        if(error) console.error('save overrides:',error)
      })
    }, 600)
    return ()=>clearTimeout(t)
  },[overrides])

  // Re-sync week number whenever season dates change or the pre-season/season toggle changes,
  // so the planner always opens on the correct upcoming week rather than staying wherever it was
  useEffect(()=>{
    setWeekNum(calcWeekFor(isPreSeason))
  },[seasonStart, preSeasonStart, isPreSeason])

  const activeBlocks = isPreSeason ? PRE_SEASON_BLOCKS : SESSION_BLOCKS
  const weekOverrides = overrides[`${isPreSeason?'pre':'season'}-${weekNum}-${ageFilter}`] || {}
  const session = {}
  activeBlocks.forEach(b => {
    if (b.fixed) return
    // If group mode active and a group-specific override exists (stored as {__groups: {1: drill, 2: drill}}),
    // fall back to the base drill for the "default" view
    const ov = weekOverrides[b.key]
    const baseOverride = ov && ov.__groups ? ov.base : ov
    session[b.key] = baseOverride || (b.cat ? pickDrill(drills, b.cat, weekNum, ageFilter) : null)
  })

  // Per-group drill: returns the drill assigned to a specific group for a block, falling back to the main session drill
  const getGroupDrill = (blockKey, groupNum) => {
    const ov = weekOverrides[blockKey]
    if (ov && ov.__groups && ov.__groups[groupNum]) return ov.__groups[groupNum]
    return session[blockKey]
  }

  const handleSwap = (key, drill) => {
    const okey = `${isPreSeason?'pre':'season'}-${weekNum}-${ageFilter}`
    if (groupSwapTarget) {
      // Swapping a drill for a SPECIFIC group only
      const { blockKey, groupNum } = groupSwapTarget
      setOverrides(prev => {
        const existing = prev[okey]?.[blockKey]
        const existingGroups = (existing && existing.__groups) ? existing.__groups : {}
        const existingBase = (existing && existing.__groups) ? existing.base : existing
        return {
          ...prev,
          [okey]: {
            ...(prev[okey]||{}),
            [blockKey]: { __groups: { ...existingGroups, [groupNum]: drill }, base: existingBase || session[blockKey] }
          }
        }
      })
      setGroupSwapTarget(null)
      setSwapTarget(null)
      return
    }
    setOverrides(prev => ({ ...prev, [okey]: { ...(prev[okey]||{}), [key]: drill } }))
    setSwapTarget(null)
  }

  const clearGroupOverride = (blockKey, groupNum) => {
    const okey = `${isPreSeason?'pre':'season'}-${weekNum}-${ageFilter}`
    setOverrides(prev => {
      const existing = prev[okey]?.[blockKey]
      if (!existing || !existing.__groups) return prev
      const newGroups = { ...existing.__groups }
      delete newGroups[groupNum]
      const hasAnyGroups = Object.keys(newGroups).length > 0
      return {
        ...prev,
        [okey]: {
          ...(prev[okey]||{}),
          [blockKey]: hasAnyGroups ? { __groups: newGroups, base: existing.base } : existing.base
        }
      }
    })
  }

  const swapBlock = activeBlocks.find(b => b.key === (groupSwapTarget?.blockKey || swapTarget))

  return (
    <div>
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-sm">📅 {isPreSeason ? 'Pre-Season Session' : '1-Hour Session Planner'}</h2>
          <span className="text-xs font-semibold px-2 py-1 rounded-lg text-white" style={{background:N.bg}}>60 min</span>
        </div>
        {squad && squad.length>0 && groupCount>1 && (
          <div className="flex items-center justify-between mb-3 p-2.5 rounded-xl" style={{background:groupMode?N.light:'#f9fafb'}}>
            <div>
              <p className="text-xs font-semibold text-gray-800">🎯 Group-Aware Planning</p>
              <p className="text-xs text-gray-400">{groupMode?'Set different drills per ability group':'Same drill for whole squad'}</p>
            </div>
            <button onClick={()=>setGroupMode(!groupMode)} className="w-12 h-6 rounded-full transition-all relative shrink-0 ml-3" style={{background:groupMode?N.bg:'#d1d5db'}}>
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow" style={{left:groupMode?'26px':'2px'}}/>
            </button>
          </div>
        )}
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
          const baseDate = isPreSeason ? preSeasonStart : seasonStart
          const autoDate = baseDate ? (()=>{ const d=parseLocalDate(baseDate); d.setDate(d.getDate()+(weekNum-1)*7); const yy=d.getFullYear(),mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0'); return `${yy}-${mm}-${dd}` })() : ''
          const hasOverride = !!(dateOverrides && dateOverrides[weekNum])
          const displayDate = (dateOverrides && dateOverrides[weekNum]) || autoDate
          const fmt = iso => iso ? parseLocalDate(iso).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : ''
          return (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Session Date</label>
              {editingDate ? (
                <div className="flex gap-2">
                  <input type="date" defaultValue={displayDate} onChange={e=>setTempDate(e.target.value)}
                    className={inputCls+' flex-1'} onFocus={focusNavy} onBlur={blurGray} autoFocus/>
                  <button onClick={()=>{if(tempDate&&onDateOverride)onDateOverride(weekNum,tempDate);setEditingDate(false);setTempDate('')}}
                    className="text-white text-xs font-bold px-3 rounded-xl" style={{background:N.bg}}>Set</button>
                  <button onClick={()=>{setEditingDate(false);setTempDate('')}}
                    className="text-xs border border-gray-300 rounded-xl px-2 text-gray-500">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl px-3 py-2">
                    {displayDate ? fmt(displayDate) : 'No date set'}
                    {hasOverride && <span className="text-xs text-blue-500 ml-2">custom</span>}
                  </span>
                  <button onClick={()=>{setEditingDate(true);setTempDate(displayDate||'')}}
                    className="text-xs border border-gray-300 rounded-xl px-3 py-2 text-gray-600">Change</button>
                  {hasOverride && <button onClick={()=>onDateClear&&onDateClear(weekNum)}
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
      {/* Session type toggle - only show if preSeasonStart is set */}
      {preSeasonStart && (
        <div className="flex gap-2 mb-3">
          <button onClick={()=>setShowPreSeason(false)}
            className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all"
            style={!isPreSeason?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#6b7280',borderColor:'#e5e7eb'}}>
            📅 Season Session
          </button>
          <button onClick={()=>setShowPreSeason(true)}
            className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all"
            style={isPreSeason?{background:'#ea580c',color:'white',borderColor:'#ea580c'}:{background:'white',color:'#6b7280',borderColor:'#e5e7eb'}}>
            🌱 Pre-Season
          </button>
        </div>
      )}
      {isPreSeason && (
        <div className="rounded-2xl p-3 mb-3 flex items-center gap-3" style={{background:'#fff7ed',border:'1px solid #fed7aa'}}>
          <span className="text-xl">🌱</span>
          <div>
            <p className="font-bold text-orange-800 text-sm">Pre-Season Training</p>
            <p className="text-orange-700 text-xs">Fitness base, passing foundations, age group changes and GK work</p>
          </div>
        </div>
      )}
      <div className="space-y-2 mb-4">
        {activeBlocks.map((block, i) => {
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
              {block.desc && isPreSeason && !drill && (
                <div className="px-4 pb-3 pt-0">
                  <p className="text-xs text-gray-500 italic">{block.desc}</p>
                </div>
              )}
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
                <>
                  {!groupMode && (
                    <div className="flex gap-3 p-3 cursor-pointer hover:bg-gray-50" onClick={()=>setDetailDrill(drill)}>
                      <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0"><DrillDiagram type={drill.diagram} category={drill.category}/></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{drill.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{drill.description}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">{(drill.age_groups||[]).map(ag=><span key={ag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ag}</span>)}</div>
                      </div>
                    </div>
                  )}
                  {groupMode && squad && squad.length>0 && (()=>{
                    const GROUP_COLORS = ['#1e3a5f','#16a34a','#f59e0b','#8b5cf6','#ef4444','#0891b2']
                    const groups = Array.from({length:groupCount||2},(_,i)=>i+1)
                    return (
                      <div className="p-3 space-y-2">
                        {groups.map(g=>{
                          const groupDrill = getGroupDrill(block.key, g)
                          const players = squad.filter(p=>groupAssignments?.[`ability-${groupCount}-${p.id}`]===g)
                          const isCustom = weekOverrides[block.key]?.__groups?.[g]
                          return (
                            <div key={g} className="rounded-xl overflow-hidden border" style={{borderColor:GROUP_COLORS[g-1]+'44'}}>
                              <div className="px-3 py-1.5 flex items-center justify-between" style={{background:GROUP_COLORS[g-1]+'11'}}>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{background:GROUP_COLORS[g-1],fontSize:'9px'}}>{g}</div>
                                  <span className="text-xs font-bold" style={{color:GROUP_COLORS[g-1]}}>Group {g}</span>
                                  <span className="text-xs text-gray-400">({players.length})</span>
                                  {isCustom && <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-semibold" style={{background:GROUP_COLORS[g-1]}}>Custom</span>}
                                </div>
                                <button onClick={()=>{setGroupSwapTarget({blockKey:block.key,groupNum:g});setSwapTarget(block.key)}}
                                  className="text-xs font-semibold underline" style={{color:GROUP_COLORS[g-1]}}>swap</button>
                              </div>
                              {groupDrill ? (
                                <div className="flex gap-2 p-2 cursor-pointer hover:bg-gray-50" onClick={()=>setDetailDrill(groupDrill)}>
                                  <div className="w-14 h-11 rounded-lg overflow-hidden shrink-0"><DrillDiagram type={groupDrill.diagram} category={groupDrill.category}/></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-xs">{groupDrill.title}</p>
                                    <p className="text-xs text-gray-400 line-clamp-1">{groupDrill.description}</p>
                                  </div>
                                  {isCustom && <button onClick={(e)=>{e.stopPropagation();clearGroupOverride(block.key,g)}} className="text-xs text-red-400 self-start px-1">✕</button>}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 p-2">No drill assigned</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {squad && squad.length>0 && !groupMode && (
                    <div className="px-3 pb-3">
                      <button onClick={()=>setShowGroupsFor(showGroupsFor===block.key?null:block.key)}
                        className="text-xs font-semibold underline underline-offset-2" style={{color:N.text}}>
                        {showGroupsFor===block.key ? 'Hide groups' : '🎯 Show groups for this drill'}
                      </button>
                      {showGroupsFor===block.key && (()=>{
                        const GROUP_COLORS = ['#1e3a5f','#16a34a','#f59e0b','#8b5cf6','#ef4444','#0891b2']
                        const groups = Array.from({length:groupCount||2},(_,i)=>i+1)
                        return (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {groups.map(g=>{
                              const players = squad.filter(p=>groupAssignments?.[`ability-${groupCount}-${p.id}`]===g)
                              return (
                                <div key={g} className="rounded-xl p-2" style={{background:GROUP_COLORS[g-1]+'11',border:`1px solid ${GROUP_COLORS[g-1]}33`}}>
                                  <p className="text-xs font-bold mb-1" style={{color:GROUP_COLORS[g-1]}}>Group {g} ({players.length})</p>
                                  {players.length===0 ? <p className="text-xs text-gray-400">No players</p> : (
                                    <div className="flex flex-wrap gap-1">
                                      {players.map(p=><span key={p.id} className="text-xs bg-white px-1.5 py-0.5 rounded-full text-gray-700 font-medium">{p.name.split(' ')[0]}</span>)}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </>
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
        <Modal onClose={()=>{setSwapTarget(null);setGroupSwapTarget(null)}} wide>
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{swapBlock.icon} Swap {swapBlock.label}{groupSwapTarget?` -- Group ${groupSwapTarget.groupNum}`:''}</h2>
            <p className="text-sm text-gray-500 mb-4">{groupSwapTarget?`Choose a drill for Group ${groupSwapTarget.groupNum} only:`:'Choose a different drill for this block:'}</p>
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
            <button onClick={()=>{setSwapTarget(null);setGroupSwapTarget(null)}} className="mt-4 w-full border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </Modal>
      )}
      {shareOpen && <SharePlanModal session={session} weekNum={weekNum} sessionDate={dateOverrides[weekNum]||''} sessionNotes={sessionNotes} ageFilter={ageFilter} onClose={()=>setShareOpen(false)}/>}
      {detailDrill && <DrillDetail drill={detailDrill} onClose={()=>setDetailDrill(null)} isCoach={true}/>}


    </div>
  )
}

// ─── Home Session Manager ─────────────────────────────────────────────────────
function HomeSessionManager({ drills, homeSession, onSave, matchNotes, currentWeek }) {
  const homeDrills=drills.filter(d=>d.home_ready)
  const [selected,setSelected]=useState(homeSession.drill_ids||[])
  const [message,setMessage]=useState(homeSession.message||'')
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const [detailDrill,setDetailDrill]=useState(null)

  // Re-sync local state if another coach clears/updates via Supabase RT
  useEffect(()=>{
    setSelected(homeSession.drill_ids||[])
    setMessage(homeSession.message||'')
  },[homeSession])

  const toggle=(id)=>{setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length>=2?[...prev.slice(1),id]:[...prev,id]);setSaved(false)}
  const publish=async()=>{setSaving(true);await onSave({drill_ids:selected,message});setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),3000)}
  const clearAll=async()=>{setSelected([]);setMessage('');await onSave({drill_ids:[],message:''})}
  const selectedDrills=drills.filter(d=>selected.includes(d.id))
  const shareText=()=>{
    const lines=[`🏠 *This Week's Home Practice — Clydach Juniors*\n`]
    if(message) lines.push(`${message}\n`)
    selectedDrills.forEach((d,i)=>lines.push(`*Drill ${i+1}: ${d.title}*\n⏱ ${d.duration} | 👥 ${d.players}\n\n${d.description}`))
    lines.push(`\nGive these a go before next training! 💪\n— Clydach Juniors Coaching Team\n🔗 ${SITE_URL}`)
    return lines.join('\n\n')
  }
  const [homeTab, setHomeTab] = useState('drills')
  const [recap, setRecap] = useState('')
  const [weeklySent, setWeeklySent] = useState(false)
  const inputCls="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
  const focusNavy=e=>e.target.style.borderColor=N.bg
  const blurGray=e=>e.target.style.borderColor='#d1d5db'

  // Build the combined weekly parent update message
  const upcomingFixture = matchNotes && currentWeek ? (matchNotes[currentWeek]?.show_parents ? matchNotes[currentWeek] : Object.entries(matchNotes||{}).map(([wk,n])=>({...n,wk:Number(wk)})).filter(n=>n.show_parents&&n.opponent&&n.wk>=currentWeek).sort((a,b)=>a.wk-b.wk)[0]) : null

  const weeklyUpdateText = () => {
    const lines = [`📰 *Weekly Update -- Clydach Juniors*\n`]
    if (recap) lines.push(`*This Week:*\n${recap}`)
    if (upcomingFixture && upcomingFixture.opponent) {
      lines.push(`*⚽ Upcoming Match:*\nvs ${upcomingFixture.opponent}${upcomingFixture.match_time?'\n⏰ '+upcomingFixture.match_time:''}${upcomingFixture.venue?'\n📍 '+upcomingFixture.venue:''}`)
    }
    if (selectedDrills.length > 0) {
      lines.push(`*🏠 Home Practice This Week:*\n${selectedDrills.map(d=>`- ${d.title} (${d.duration})`).join('\n')}`)
    }
    lines.push(`\n-- Clydach Juniors Coaching Team\n🔗 ${SITE_URL}`)
    return lines.join('\n\n')
  }

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {[{id:'drills',label:'🏠 Home Drills'},{id:'weekly',label:'📰 Weekly Update'}].map(t=>(
          <button key={t.id} onClick={()=>setHomeTab(t.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all" style={homeTab===t.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>{t.label}</button>
        ))}
      </div>

      {homeTab==='drills'&&(
      <>
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
          className="flex-1 font-bold py-3 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2 text-white"
          style={saved?{background:'#16a34a',color:'white'}:selected.length===0?{background:'#f3f4f6',color:'#9ca3af'}:navyBtn}
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
      </>
      )}

      {homeTab==='weekly'&&(
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h2 className="font-bold text-gray-900 text-sm mb-1">📰 Weekly Parent Update</h2>
        <p className="text-xs text-gray-500 mb-3">Combine a session recap, upcoming fixture, and home drills into one message.</p>
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">This Week's Recap <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea value={recap} onChange={e=>{setRecap(e.target.value);setWeeklySent(false)}} rows={3}
            placeholder="e.g. Great session on pressing this week -- the players are really starting to press as a unit!"
            className={inputCls+' resize-none'} onFocus={focusNavy} onBlur={blurGray}/>
        </div>
        {upcomingFixture && upcomingFixture.opponent && (
          <div className="rounded-xl p-3 mb-3" style={{background:'#eff6ff',border:'1px solid #bfdbfe'}}>
            <p className="text-xs font-semibold text-blue-800">⚽ Will include: vs {upcomingFixture.opponent}{upcomingFixture.match_time?' at '+upcomingFixture.match_time:''}</p>
          </div>
        )}
        {selectedDrills.length > 0 && (
          <div className="rounded-xl p-3 mb-3" style={{background:N.light}}>
            <p className="text-xs font-semibold" style={{color:N.text}}>🏠 Will include: {selectedDrills.length} home drill{selectedDrills.length>1?'s':''}</p>
          </div>
        )}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">{weeklyUpdateText()}</div>
        <a href={`https://wa.me/?text=${encodeURIComponent(weeklyUpdateText())}`} target="_blank" rel="noreferrer"
          onClick={()=>{setWeeklySent(true);setTimeout(()=>setWeeklySent(false),3000)}}
          className="w-full text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2" style={{background:weeklySent?'#16a34a':'#16a34a'}}>
          {weeklySent?'✓ Opened WhatsApp!':'📲 Send Weekly Update'}
        </a>
      </div>
      )}
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
  const s = parseLocalDate(seasonStart), t = new Date()
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
    ? `Clydach Juniors - Training CANCELLED this week. We will be back next week! - Coaching Team\n🔗 ${SITE_URL}`
    : `Clydach Juniors - Training is ON this week${form.time?' at '+form.time:''}${form.location?' at '+form.location:''}. See you there! - Coaching Team\n🔗 ${SITE_URL}`
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
// ─── Match Report Builder (WhatsApp text + branded social media image) ─────────
const CLUB_LOGO_DATA_URL = 'data:image/png;base64,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'
const SPONSOR_LOGO_DATA_URL = 'data:image/png;base64,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'

function MatchReportBuilder({ form, weekNum, onSaveReport }) {
  const [photoDataUrl, setPhotoDataUrl] = useState(form.report_photo || null)
  const [reportText, setReportText] = useState(form.report_text || '')
  const [highlightBoxes, setHighlightBoxes] = useState(
    form.report_highlights || [{label:'Noticeable Mention', value:''}, {label:'Overall', value:''}]
  )
  const [generating, setGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState(form.report_image || null)
  const [saved, setSaved] = useState(false)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  // Re-sync local state whenever the active week's saved report data changes
  // (e.g. navigating to a different match). Depends on the actual report fields,
  // not just weekNum, so it can't be caught reading a stale/previous form object.
  useEffect(() => {
    setPhotoDataUrl(form.report_photo || null)
    setReportText(form.report_text || '')
    setHighlightBoxes(form.report_highlights || [{label:'Noticeable Mention', value:''}, {label:'Overall', value:''}])
    setImageUrl(form.report_image || null)
  }, [weekNum, form.report_text, form.report_photo, form.report_image, form.report_highlights])

  const updateHighlight = (i, field, val) => {
    setHighlightBoxes(prev => prev.map((h,idx) => idx===i ? {...h, [field]:val} : h))
  }
  const addHighlightBox = () => {
    if (highlightBoxes.length >= 3) return
    setHighlightBoxes(prev => [...prev, {label:'', value:''}])
  }
  const removeHighlightBox = (i) => {
    setHighlightBoxes(prev => prev.filter((_,idx)=>idx!==i))
  }

  const scoreLine = form.result || 'Result TBC'
  const scorersLine = form.scorers || ''
  const opponentLine = form.opponent || 'Opponent TBC'

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoDataUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  // Render the branded social media graphic onto a canvas, then export as PNG data URL
  const generateImage = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 50)) // let UI update before heavy canvas work
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = 1080

    // ── Pass 1: measure how tall the highlights column needs to be, so we can size
    // the canvas correctly before drawing anything (avoids cutting off long text) ──
    const photoY = 380, photoH = 430, photoMargin = 50
    const photoW = W - photoMargin*2
    const sectionY = photoY + photoH + 145
    const colGap = 24
    const leftColW = photoW * 0.28

    const measureWrap = (text, maxW, font) => {
      ctx.font = font
      const paragraphs = (text || '').split('\n')
      const lines = []
      paragraphs.forEach(paragraph => {
        if (paragraph.trim() === '') { lines.push(''); return } // preserve blank lines
        const words = paragraph.split(' ')
        let line = ''
        words.forEach(word => {
          const test = line ? line + ' ' + word : word
          if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word }
          else { line = test }
        })
        if (line) lines.push(line)
      })
      return lines
    }
    const valueFont = '30px sans-serif' // matches the match report's weight/size exactly
    const valueLineHeight = 38
    const measureBoxHeight = (value) => {
      const lines = measureWrap(value || '--', leftColW - 32, valueFont)
      return 44 + lines.length * valueLineHeight + 14
    }
    let measuredY = sectionY + 40
    measuredY += measureBoxHeight(scorersLine || 'None recorded') + 26
    highlightBoxes.forEach(h => { if (h.label) measuredY += measureBoxHeight(h.value) + 26 })
    const sectionH = measuredY - sectionY - 26

    // Also measure how tall the written match report will be, so the canvas fits whichever column is taller
    const rightColWMeasure = photoW - leftColW - colGap
    const reportBodyMeasure = reportText.trim() || `A great effort from everyone against ${opponentLine} today. Well done to the whole squad!`
    const reportLines = measureWrap(reportBodyMeasure, rightColWMeasure, valueFont)
    const reportH = 45 + reportLines.length * valueLineHeight

    const contentH = Math.max(sectionH, reportH)

    // Canvas height = however tall the content actually is, plus fixed footer space
    const H = Math.max(1450, sectionY + contentH + 260)
    canvas.width = W
    canvas.height = H

    // ── Background: grass-green base with diagonal navy accent bands (playful, magazine-style) ──
    ctx.fillStyle = '#166534'
    ctx.fillRect(0, 0, W, H)
    // Grass texture stripes -- clipped to the middle green section only, so they don't
    // bleed messily behind/around the diagonal navy bands at the very top and bottom
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, 210); ctx.lineTo(W, 150); ctx.lineTo(W, H-150); ctx.lineTo(0, H-90); ctx.closePath()
    ctx.clip()
    // Subtle vertical gradient within the stripe area for a touch more depth
    const grassGrad = ctx.createLinearGradient(0, 0, 0, H)
    grassGrad.addColorStop(0, '#1a7a3d')
    grassGrad.addColorStop(1, '#0f4d28')
    ctx.fillStyle = grassGrad
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    for (let i = -H; i < W; i += 70) {
      ctx.fillRect(i, 0, 35, H)
    }
    ctx.restore()
    // Diagonal navy band across the very top
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 150); ctx.lineTo(0, 210); ctx.closePath()
    ctx.fillStyle = N.bg
    ctx.fill()
    ctx.restore()
    // Diagonal navy band across the very bottom
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(W, H-150); ctx.lineTo(0, H-90); ctx.closePath()
    ctx.fillStyle = N.bg
    ctx.fill()
    ctx.restore()

    // Helper: rounded rect
    const roundRect = (x,y,w,h,r) => {
      ctx.beginPath()
      ctx.moveTo(x+r,y)
      ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r)
      ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r)
      ctx.closePath()
    }
    // Helper: 5-point star
    const drawStar = (cx, cy, r, color, rotation=0) => {
      ctx.save()
      ctx.translate(cx, cy); ctx.rotate(rotation)
      ctx.beginPath()
      for (let i=0; i<10; i++) {
        const rad = i%2===0 ? r : r*0.45
        const ang = (Math.PI/5)*i - Math.PI/2
        ctx.lineTo(Math.cos(ang)*rad, Math.sin(ang)*rad)
      }
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.stroke()
      ctx.restore()
    }

    // ── Header banner: club name ──
    ctx.textAlign = 'center'
    ctx.font = 'bold 62px sans-serif'
    ctx.fillStyle = 'white'
    ctx.fillText("CLYDACH UNDER 12'S", W/2, 90)
    ctx.font = 'bold 28px sans-serif'
    ctx.fillStyle = '#bfdbfe'
    const fixtureDateFmt = form.match_date ? parseLocalDate(form.match_date).toLocaleDateString('en-GB',{day:'numeric',month:'numeric',year:'2-digit'}) : ''
    ctx.fillText(`Match Report${fixtureDateFmt ? ' for ' + fixtureDateFmt : ''}`, W/2, 130)

    // Football icons flanking the crest, enlarged
    ctx.font = '110px sans-serif'
    ctx.fillText('⚽', 130, 280)
    ctx.fillText('⚽', W-130, 280)

    // ── Club crest, centred, drawn in its natural shield shape (no circular crop) ──
    await new Promise((resolve) => {
      const logoImg = new Image()
      logoImg.onload = () => {
        // Preserve the crest's real aspect ratio rather than forcing a square/circle
        const logoH = 220
        const logoW = logoH * (logoImg.width / logoImg.height)
        const logoX = W/2 - logoW/2, logoY = 155
        // Soft white glow behind the crest so it stands out on the green background
        ctx.save()
        ctx.shadowColor = 'rgba(255,255,255,0.9)'
        ctx.shadowBlur = 25
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH)
        ctx.restore()
        resolve()
      }
      logoImg.onerror = resolve
      logoImg.src = CLUB_LOGO_DATA_URL
    })

    // ── Main team photo, rounded card with white border ──
    // (photoY, photoH, photoMargin, photoW already calculated in the measurement pass above)
    ctx.save()
    roundRect(photoMargin, photoY, photoW, photoH, 24)
    ctx.clip()
    if (photoDataUrl) {
      const img = new Image()
      await new Promise((resolve) => {
        img.onload = () => {
          const scale = Math.max(photoW / img.width, photoH / img.height)
          const sw = photoW / scale, sh = photoH / scale
          const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2
          ctx.drawImage(img, sx, sy, sw, sh, photoMargin, photoY, photoW, photoH)
          resolve()
        }
        img.onerror = resolve
        img.src = photoDataUrl
      })
    } else {
      const grad = ctx.createLinearGradient(photoMargin, photoY, photoMargin+photoW, photoY+photoH)
      grad.addColorStop(0, '#1e3a5f')
      grad.addColorStop(1, '#166534')
      ctx.fillStyle = grad
      ctx.fillRect(photoMargin, photoY, photoW, photoH)
      ctx.font = '160px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fillText('⚽', W/2, photoY + photoH/2 + 55)
    }
    ctx.restore()
    // White border around photo card
    roundRect(photoMargin, photoY, photoW, photoH, 24)
    ctx.strokeStyle = 'white'; ctx.lineWidth = 8; ctx.stroke()

    // Star sticker bottom-left of photo, and opponent banner bottom-right
    drawStar(photoMargin + 55, photoY + photoH - 20, 42, '#fbbf24', -0.2)
    ctx.font = 'bold 32px sans-serif'
    ctx.fillStyle = N.bg
    ctx.textAlign = 'center'
    ctx.fillText('⚽', photoMargin + 55, photoY + photoH - 8)

    // Opponent + score banner overlapping bottom of photo
    const bannerY = photoY + photoH - 55
    const bannerW = 520
    ctx.save()
    roundRect(W/2 - bannerW/2, bannerY, bannerW, 90, 20)
    ctx.fillStyle = '#fbbf24'
    ctx.fill()
    ctx.strokeStyle = 'white'; ctx.lineWidth = 6; ctx.stroke()
    ctx.restore()
    ctx.fillStyle = N.bg
    ctx.font = 'bold 30px sans-serif'
    ctx.fillText(`vs ${opponentLine}`, W/2, bannerY + 38)
    ctx.font = 'bold 40px sans-serif'
    ctx.fillText(scoreLine, W/2, bannerY + 78)

    // ── Two-column section: narrow highlight boxes (left) + written match report (right) ──
    // (sectionY, colGap, leftColW, sectionH already calculated in the measurement pass above)
    const rightColX = photoMargin + leftColW + colGap
    const rightColW = photoW - leftColW - colGap

    // Left column heading
    ctx.textAlign = 'left'
    ctx.font = 'bold 34px sans-serif'
    ctx.fillStyle = '#fbbf24'
    ctx.fillText('★ HIGHLIGHTS', photoMargin, sectionY)

    // Helper: draw a labelled stat box, sized to fit however many lines the value needs (no cap -- full text always shown)
    const drawStatBox = (x, y, w, label, value) => {
      const maxW = w - 32
      const lines = measureWrap(value || '--', maxW, valueFont)
      const h = Math.max(90, 44 + lines.length * valueLineHeight + 18)
      roundRect(x, y, w, h, 14)
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.fill()
      ctx.font = 'bold 18px sans-serif'
      ctx.fillStyle = '#fbbf24'
      ctx.textAlign = 'left'
      ctx.fillText(label.toUpperCase(), x + 16, y + 30)
      ctx.font = valueFont
      ctx.fillStyle = 'white'
      lines.forEach((l,i) => ctx.fillText(l, x + 16, y + 62 + i*valueLineHeight))
      return h
    }

    let boxY = sectionY + 40
    const boxGap = 26
    boxY += drawStatBox(photoMargin, boxY, leftColW, 'Scorers', scorersLine || 'None recorded') + boxGap
    highlightBoxes.forEach(h => {
      if (h.label) boxY += drawStatBox(photoMargin, boxY, leftColW, h.label, h.value) + boxGap
    })

    // Right column: written match report
    ctx.textAlign = 'left'
    ctx.font = 'bold 34px sans-serif'
    ctx.fillStyle = '#fbbf24'
    ctx.fillText('📝 MATCH REPORT', rightColX, sectionY)

    ctx.font = valueFont
    ctx.fillStyle = 'white'
    const reportBody = reportText.trim() || `A great effort from everyone against ${opponentLine} today. Well done to the whole squad!`
    const reportDrawLines = measureWrap(reportBody, rightColW, valueFont)
    let rY = sectionY + 45
    reportDrawLines.forEach(line => {
      if (line) ctx.fillText(line, rightColX, rY)
      rY += valueLineHeight
    })

    // "UPPA CLYDACH" banner -- fixed distance above the footer
    ctx.textAlign = 'center'
    ctx.font = 'bold 36px sans-serif'
    ctx.fillStyle = '#fbbf24'
    const uppaText = 'UPPA CLYDACH!'
    const uppaWidth = ctx.measureText(uppaText).width
    ctx.fillText(uppaText, W/2 - 22, H - 145)
    ctx.font = '46px sans-serif'
    ctx.fillText('⚽', W/2 + uppaWidth/2 + 8, H - 141)

    // ── Footer: sponsor strip with actual logo ──
    ctx.font = '22px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText('Proudly sponsored by', W/2, H - 75)

    await new Promise((resolve) => {
      const sponsorImg = new Image()
      sponsorImg.onload = () => {
        const sponsorH = 45
        const sponsorW = sponsorH * (sponsorImg.width / sponsorImg.height)
        ctx.save()
        ctx.shadowColor = 'rgba(255,255,255,0.6)'
        ctx.shadowBlur = 14
        ctx.drawImage(sponsorImg, W/2 - sponsorW/2, H - 60, sponsorW, sponsorH)
        ctx.restore()
        resolve()
      }
      sponsorImg.onerror = resolve
      sponsorImg.src = SPONSOR_LOGO_DATA_URL
    })

    const dataUrl = canvas.toDataURL('image/png')
    setImageUrl(dataUrl)
    setGenerating(false)
  }

  const downloadImage = () => {
    if (!imageUrl) return
    // iOS Safari frequently ignores programmatic downloads of data URLs, so we open the
    // image in a new tab as a reliable fallback -- the user can then long-press to save it.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    if (isIOS) {
      const win = window.open()
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Match Report</title>
              <meta name="viewport" content="width=device-width, initial-scale=1"/>
            </head>
            <body style="margin:0;background:#111;font-family:-apple-system,sans-serif;">
              <div style="position:sticky;top:0;background:#1e3a5f;color:white;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:10;">
                <button onclick="window.close()" style="background:rgba(255,255,255,0.15);color:white;border:none;padding:10px 16px;border-radius:10px;font-size:15px;font-weight:600;">✕ Close</button>
                <span style="font-size:13px;text-align:right;line-height:1.3;">Press &amp; hold the image below,<br/>then tap "Save Image"</span>
              </div>
              <div style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <img src="${imageUrl}" style="max-width:100%;height:auto;border-radius:8px;" alt="Match report graphic"/>
              </div>
            </body>
          </html>
        `)
        win.document.close()
      } else {
        alert('Please allow pop-ups to save the image, or take a screenshot of the graphic above.')
      }
      return
    }
    const link = document.createElement('a')
    link.download = `match-report-week${weekNum}.png`
    link.href = imageUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const saveReport = async () => {
    await onSaveReport({ report_text: reportText, report_photo: photoDataUrl, report_image: imageUrl, report_highlights: highlightBoxes })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Save report data so it can be revisited/edited later */}
      <button onClick={saveReport} className="w-full text-white font-bold py-2.5 rounded-xl text-sm" style={{background:saved?'#16a34a':N.bg}}>
        {saved?'✓ Saved!':'💾 Save Report'}
      </button>

      {/* Match report text — feeds the social media graphic */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-1">📰 Match Report</h3>
        <p className="text-xs text-gray-400 mb-3">Written summary shown on the social media graphic.</p>
        <label className="text-xs font-semibold text-gray-600 block mb-1">Match report text</label>
        <textarea value={reportText} onChange={e=>setReportText(e.target.value)} rows={4}
          placeholder="e.g. Great team performance today against a tough opponent. Everyone got game time and showed real character in the second half..."
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
          onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
      </div>

      {/* Highlight boxes editor */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-1">★ Highlight Boxes</h3>
        <p className="text-xs text-gray-400 mb-3">Scorers is fixed. Add up to 2 more custom boxes (e.g. Noticeable Mention, Overall) shown on the graphic.</p>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Scorers</p>
          <p className="text-sm text-gray-700">{scorersLine || 'Set on the Result tab'}</p>
        </div>
        {highlightBoxes.map((h,i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={h.label} onChange={e=>updateHighlight(i,'label',e.target.value)} placeholder="Label e.g. Man of the Match"
              className="w-2/5 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
              onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
            <input value={h.value} onChange={e=>updateHighlight(i,'value',e.target.value)} placeholder="Value e.g. Tom Jones"
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
              onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
            <button onClick={()=>removeHighlightBox(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
          </div>
        ))}
        {highlightBoxes.length < 3 && (
          <button onClick={addHighlightBox} className="text-xs font-semibold px-3 py-2 rounded-xl border" style={{borderColor:N.bg+'44',color:N.text,background:N.light}}>
            + Add Highlight Box
          </button>
        )}
      </div>

      {/* Social media branded image */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-1">📸 Social Media Graphic</h3>
        <p className="text-xs text-gray-400 mb-3">Branded image with club logo, sponsor strip and match photo -- ready to post.</p>

        {/* Photo upload */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600 block mb-1">Match Photo <span className="text-gray-400 font-normal">(optional)</span></label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden"/>
          {photoDataUrl ? (
            <div className="relative rounded-xl overflow-hidden mb-2" style={{aspectRatio:'16/10'}}>
              <img src={photoDataUrl} alt="Match" className="w-full h-full object-cover"/>
              <button onClick={()=>setPhotoDataUrl(null)} className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">✕ Remove</button>
            </div>
          ) : (
            <button onClick={()=>fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 text-center text-gray-400 hover:border-gray-400">
              <p className="text-2xl mb-1">📷</p>
              <p className="text-xs">Tap to upload a match photo</p>
              <p className="text-xs text-gray-300 mt-0.5">A placeholder background will be used if skipped</p>
            </button>
          )}
        </div>

        <canvas ref={canvasRef} style={{display:'none'}}/>

        <button onClick={generateImage} disabled={generating}
          className="w-full text-white font-bold py-2.5 rounded-xl text-sm mb-3" style={{background:generating?'#9ca3af':N.bg}}>
          {generating ? 'Generating...' : '🎨 Generate Graphic'}
        </button>

        {imageUrl && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <img src={imageUrl} alt="Match report graphic" className="w-full"/>
            </div>
            <button onClick={downloadImage} className="w-full text-white font-bold py-2.5 rounded-xl text-sm" style={{background:'#16a34a'}}>
              ⬇️ Download Image
            </button>
            <p className="text-xs text-gray-400 text-center">On iPhone: tap Download, then press and hold the image and choose "Save Image". On other devices it downloads automatically.</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">🏷️ Club and sponsor logos both added.</p>
      </div>
    </div>
  )
}

function MatchDayNotes({ weekNum, setWeekNum, currentWeek, matchNotes, onSave, squad, matchSquad, onSaveMatchSquad, preferredTeamFormat }) {
  const note = matchNotes[weekNum] || {}
  const [form, setForm] = useState({result:'',scorers:'',notes:'',opponent:'',venue:'',match_time:'',match_date:'',match_type:'League',show_parents:false})
  const [tab, setTab] = useState('fixture')
  const [saved, setSaved] = useState(false)
  const [squadSaved, setSquadSaved] = useState(false)
  const squadData = matchSquad?.[weekNum] || { starters:[], subs:[], minutes:{}, positions:{}, subReplacements:{} }
  const [starters, setStarters] = useState(squadData.starters)
  const [benchSubs, setBenchSubs] = useState(squadData.subs)
  const [startingPositions, setStartingPositions] = useState(squadData.positions||{}) // { playerId: 'CB' }
  const [subReplacements, setSubReplacements] = useState(squadData.subReplacements||{}) // { subPlayerId: starterPlayerId }
  const [squadView, setSquadView] = useState('list') // 'list' | 'pitch'
  const [posEditPlayer, setPosEditPlayer] = useState(null)
  const [matchFormation, setMatchFormation] = useState('')
  useEffect(()=>{ setForm({result:'',scorers:'',notes:'',opponent:'',venue:'',match_time:'',match_date:'',match_type:'League',show_parents:false,...(matchNotes[weekNum]||{})}); setSaved(false) },[weekNum, matchNotes])
  useEffect(()=>{
    const sd = matchSquad?.[weekNum] || { starters:[], subs:[], positions:{}, subReplacements:{} }
    setStarters(sd.starters||[])
    setBenchSubs(sd.subs||[])
    setStartingPositions(sd.positions||{})
    setSubReplacements(sd.subReplacements||{})
    setSquadSaved(false)
  },[weekNum, matchSquad])

  const toggleStarter = (pid) => {
    setStarters(prev => prev.includes(pid) ? prev.filter(x=>x!==pid) : [...prev, pid])
    setBenchSubs(prev => prev.filter(x=>x!==pid))
    setSquadSaved(false)
  }
  const toggleSub = (pid) => {
    setBenchSubs(prev => prev.includes(pid) ? prev.filter(x=>x!==pid) : [...prev, pid])
    setStarters(prev => prev.filter(x=>x!==pid))
    setSquadSaved(false)
  }
  const setPlayerPosition = (pid, pos) => {
    setStartingPositions(prev => ({ ...prev, [pid]: pos }))
    setSquadSaved(false)
  }
  const setSubReplacement = (subId, starterId) => {
    setSubReplacements(prev => ({ ...prev, [subId]: starterId || null }))
    setSquadSaved(false)
  }
  const saveSquadSelection = async () => {
    await onSaveMatchSquad(weekNum, { starters, subs: benchSubs, minutes: squadData.minutes||{}, positions: startingPositions, subReplacements })
    setSquadSaved(true)
    setTimeout(()=>setSquadSaved(false), 2000)
  }
  const squadWa = () => {
    const startersList = (squad||[]).filter(p=>starters.includes(p.id))
    const subsList = (squad||[]).filter(p=>benchSubs.includes(p.id))
    const subsText = subsList.map(p=>{
      const replacingId = subReplacements[p.id]
      const replacingPlayer = replacingId ? startersList.find(s=>s.id===replacingId) : null
      return `${p.squad_num?'#'+p.squad_num+' ':''}${p.name}${replacingPlayer?` (for ${replacingPlayer.name})`:''}`
    }).join('\n')
    return `Clydach Juniors -- Team Sheet${form.opponent?' vs '+form.opponent:''}\n\nStarting XI:\n${startersList.map(p=>`${p.squad_num?'#'+p.squad_num+' ':''}${p.name} (${startingPositions[p.id]||p.preferred||'?'})`).join('\n')}\n\nSubs:\n${subsText}\n\n- Coaching Team\n🔗 ${SITE_URL}`
  }
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setSaved(false) }
  const save = async () => { await onSave(weekNum, form); setSaved(true); setTimeout(()=>setSaved(false),2000) }
  const ic = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
  const fn = e=>e.target.style.borderColor=N.bg, fb = e=>e.target.style.borderColor='#d1d5db'
  const fixtureDateFmt = form.match_date ? parseLocalDate(form.match_date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}) : ''
  const fixtureWa = `Clydach Juniors - ${form.match_type||'Match'} Day${form.opponent?' vs '+form.opponent:''}${fixtureDateFmt?'\nDate: '+fixtureDateFmt:''}${form.match_time?'\nTime: '+form.match_time:''}${form.venue?'\nVenue: '+form.venue:''}\n\nGood luck to everyone! - Coaching Team\n🔗 ${SITE_URL}`
  const resultWa = `Clydach Juniors Result${form.opponent?' vs '+form.opponent:''}${form.result?'\nResult: '+form.result:''}${form.scorers?'\nScorers: '+form.scorers:''}\n\nWell done everyone! - Coaching Team\n🔗 ${SITE_URL}`
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2">
        <button onClick={()=>setWeekNum(w=>Math.max(1,w-1))} className="w-9 h-9 rounded-xl border border-gray-300 font-bold flex items-center justify-center">&#8249;</button>
        <div className="flex-1 text-center">
          <p className="font-bold text-gray-900 text-sm">Game {weekNum}{form.opponent?' - vs '+form.opponent:''}</p>
          {form.match_date && <p className="text-xs text-gray-400">{parseLocalDate(form.match_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</p>}
        </div>
        <button onClick={()=>setWeekNum(w=>w+1)} className="w-9 h-9 rounded-xl border border-gray-300 font-bold flex items-center justify-center">&#8250;</button>
        <button onClick={()=>setWeekNum(currentWeek)} className="text-xs font-semibold px-2 py-1 rounded-lg" style={{background:N.light,color:N.text}}>Today</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {[{id:'fixture',label:'📋 Fixture'},{id:'squadsel',label:'🎽 Squad'},{id:'result',label:'📊 Result'},{id:'report',label:'📰 Report'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all" style={tab===t.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>{t.label}</button>
          ))}
        </div>
        <div className="space-y-3">
          {tab!=='squadsel' && (
          <>
          {/* Match type */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Match Type</label>
            <div className="flex gap-2 flex-wrap">
              {['League','Cup','Friendly','Pre-Season Friendly'].map(t=>(
                <button key={t} onClick={()=>set('match_type',t)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                  style={form.match_type===t?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div><label className="text-xs font-semibold text-gray-600 block mb-1">Opponent</label>
            <input value={form.opponent} onChange={e=>set('opponent',e.target.value)} placeholder="e.g. Swansea Juniors" className={ic} onFocus={fn} onBlur={fb}/></div>
          </>
          )}
          {tab==='fixture'&&<>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Match Date</label>
              <input type="date" value={form.match_date} onChange={e=>set('match_date',e.target.value)} className={ic} onFocus={fn} onBlur={fb}/>
              <p className="text-xs text-gray-400 mt-1">Set this for each match -- useful when playing more than once a week</p>
            </div>
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
          {tab==='squadsel'&&(()=>{
            const availablePlayers = (squad||[]).filter(p=>!starters.includes(p.id)&&!benchSubs.includes(p.id))
            const startersList = (squad||[]).filter(p=>starters.includes(p.id))
            const subsList = (squad||[]).filter(p=>benchSubs.includes(p.id))
            return (
              <div className="space-y-3">
                {(!squad || squad.length===0) ? (
                  <p className="text-sm text-gray-400 text-center py-4">Add players in the Squad tab first</p>
                ) : (
                  <>
                    {/* Starting XI */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-700">⭐ Starting XI</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{startersList.length} selected</span>
                          {startersList.length>0 && (
                            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                              <button onClick={()=>setSquadView('list')} className="px-2 py-0.5 rounded text-xs font-bold transition-all" style={squadView==='list'?{background:'white',color:N.text}:{color:'#9ca3af'}}>List</button>
                              <button onClick={()=>setSquadView('pitch')} className="px-2 py-0.5 rounded text-xs font-bold transition-all" style={squadView==='pitch'?{background:'white',color:N.text}:{color:'#9ca3af'}}>Pitch</button>
                            </div>
                          )}
                        </div>
                      </div>
                      {startersList.length===0 ? (
                        <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl p-3 text-center">Tap players below to add to Starting XI</p>
                      ) : squadView==='list' ? (
                        <div className="space-y-1.5">
                          {startersList.map(p=>(
                            <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl" style={{background:'#f0fdf4',border:'1px solid #bbf7d0'}}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:N.bg}}>{p.squad_num||p.name[0]}</div>
                              <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                              <button onClick={()=>setPosEditPlayer(p)} className="text-xs bg-white px-1.5 py-0.5 rounded-full text-gray-500 border border-gray-200">
                                {startingPositions[p.id] || p.preferred || 'Set position'}
                              </button>
                              <button onClick={()=>toggleStarter(p.id)} className="text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Pitch view -- uses the same formation grid as Team View so every slot is fixed and predictable */
                        (()=>{
                          const teamFmt = preferredTeamFormat || '9v9'
                          const fmtOptions = Object.keys(PITCH_FORMATIONS[teamFmt])
                          const activeFmt = PITCH_FORMATIONS[teamFmt][matchFormation] ? matchFormation : fmtOptions[0]
                          const slots = PITCH_FORMATIONS[teamFmt][activeFmt]

                          // Assign starters to slots: prefer a starter whose set position matches the slot,
                          // otherwise fill remaining slots with any unassigned starters in order
                          const usedPlayerIds = new Set()
                          const slotAssignments = slots.map(slot => {
                            const match = startersList.find(p => !usedPlayerIds.has(p.id) && (startingPositions[p.id]||p.preferred)===slot.pos)
                            if(match){ usedPlayerIds.add(match.id); return { slot, player: match } }
                            return { slot, player: null }
                          })
                          // Any starters left over (no matching slot, or extra players in a position with all slots full)
                          const leftover = startersList.filter(p => !usedPlayerIds.has(p.id))

                          return (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-500">Formation:</p>
                                <div className="flex gap-1 flex-wrap">
                                  {fmtOptions.map(f=>(
                                    <button key={f} onClick={()=>setMatchFormation(f)}
                                      className="px-2 py-1 rounded-lg text-xs font-bold border transition-all"
                                      style={activeFmt===f?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                                      {f}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="relative rounded-xl overflow-hidden" style={{background:'#166534',paddingTop:'130%'}}>
                                <div className="absolute inset-0">
                                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                    <rect width="100" height="100" fill="#166534"/>
                                    <rect x="3" y="3" width="94" height="94" fill="none" stroke="#4ade80" strokeWidth="0.5" opacity="0.5"/>
                                    <line x1="3" y1="50" x2="97" y2="50" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                                    <circle cx="50" cy="50" r="10" fill="none" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                                    <rect x="30" y="3" width="40" height="14" fill="none" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                                    <rect x="30" y="83" width="40" height="14" fill="none" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                                  </svg>
                                  {slotAssignments.map(({slot,player},i)=>(
                                    <div key={i} onClick={()=>player&&setPosEditPlayer(player)} className="absolute flex flex-col items-center" style={{left:`${slot.x}%`,top:`${slot.y}%`,transform:'translate(-50%,-50%)',cursor:player?'pointer':'default'}}>
                                      <div className="rounded-full flex items-center justify-center text-white font-bold shadow-lg" style={{width:'26px',height:'26px',fontSize:'9px',background:player?N.bg:'rgba(255,255,255,0.15)',border:player?'2px solid white':'2px dashed rgba(255,255,255,0.6)'}}>
                                        {player ? (player.squad_num||player.name[0]) : slot.pos}
                                      </div>
                                      {player ? (
                                        <>
                                          <div className="text-white font-semibold mt-0.5 px-1 rounded text-center" style={{fontSize:'7px',background:'rgba(0,0,0,0.5)',maxWidth:'40px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{player.name.split(' ')[0]}</div>
                                          <div className="text-white opacity-90" style={{fontSize:'6px'}}>{slot.pos}</div>
                                        </>
                                      ) : (
                                        <div className="text-white opacity-60 mt-0.5" style={{fontSize:'7px'}}>Empty</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {leftover.length>0 && (
                                <div className="mt-2 p-2 rounded-xl" style={{background:'#fff7ed',border:'1px solid #fed7aa'}}>
                                  <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ {leftover.length} player{leftover.length>1?'s':''} not placed in a slot -- tap to assign a position that fits the formation</p>
                                  <div className="flex flex-wrap gap-1">
                                    {leftover.map(p=>(
                                      <button key={p.id} onClick={()=>setPosEditPlayer(p)} className="text-xs px-2 py-1 rounded-full text-white font-semibold" style={{background:'#ea580c'}}>
                                        {p.squad_num?`#${p.squad_num} `:''}{p.name.split(' ')[0]}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )
                        })()
                      )}
                      
                    </div>

                    {/* Subs bench */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-700">🔄 Subs Bench</p>
                        <span className="text-xs text-gray-400">{subsList.length} selected</span>
                      </div>
                      {subsList.length===0 ? (
                        <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl p-3 text-center">Tap players below to add to bench</p>
                      ) : (
                        <div className="space-y-1.5">
                          {subsList.map(p=>{
                            const replacingId = subReplacements[p.id]
                            const replacingPlayer = replacingId ? startersList.find(s=>s.id===replacingId) : null
                            return (
                              <div key={p.id} className="rounded-xl overflow-hidden" style={{background:'#eff6ff',border:'1px solid #bfdbfe'}}>
                                <div className="flex items-center gap-2 p-2">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:N.bg}}>{p.squad_num||p.name[0]}</div>
                                  <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                                  <button onClick={()=>toggleSub(p.id)} className="text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
                                </div>
                                <div className="px-2 pb-2 flex items-center gap-2">
                                  <span className="text-xs text-blue-600 font-semibold">Replacing:</span>
                                  <select value={replacingId||''} onChange={e=>setSubReplacement(p.id, e.target.value?Number(e.target.value):null)}
                                    className="flex-1 text-xs border border-blue-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                                    <option value="">-- Select player --</option>
                                    {startersList.map(s=><option key={s.id} value={s.id}>{s.name}{s.preferred?' ('+s.preferred+')':''}</option>)}
                                  </select>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Available players */}
                    {availablePlayers.length>0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-700 mb-2">Available Squad ({availablePlayers.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {availablePlayers.map(p=>(
                            <div key={p.id} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-2 py-1">
                              <span className="text-xs font-semibold text-gray-700">{p.squad_num?`#${p.squad_num} `:''}{p.name.split(' ')[0]}</span>
                              <button onClick={()=>toggleStarter(p.id)} className="text-xs font-bold text-green-600 px-1" title="Add to Starting XI">XI</button>
                              <button onClick={()=>toggleSub(p.id)} className="text-xs font-bold text-blue-600 px-1" title="Add to Subs">Sub</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 50% playing time reminder */}
                    <div className="rounded-xl p-3 text-xs" style={{background:N.light}}>
                      <p className="font-semibold" style={{color:N.text}}>⏱️ FAW Rule Reminder</p>
                      <p style={{color:N.text+'aa'}} className="mt-0.5">All squad members must play a minimum of 50% of total playing time. Rolling substitutes are permitted.</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={saveSquadSelection} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm" style={{background:squadSaved?'#16a34a':N.bg}}>
                        {squadSaved?'✓ Saved!':'💾 Save Squad'}
                      </button>
                      <a href={`https://wa.me/?text=${encodeURIComponent(squadWa())}`} target="_blank" rel="noreferrer"
                        className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm text-center" style={{background:'#16a34a'}}>
                        📲 Share Team Sheet
                      </a>
                    </div>

                    {/* Position edit modal */}
                    {posEditPlayer && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                          <h3 className="font-bold text-gray-900 mb-1">🎽 {posEditPlayer.name}</h3>
                          <p className="text-xs text-gray-400 mb-4">Set position for this match{posEditPlayer.preferred?` -- usually plays ${posEditPlayer.preferred}`:''}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {['GK','LB','CB','RB','LM','CM','RM','ST'].map(pos=>(
                              <button key={pos} onClick={()=>setPlayerPosition(posEditPlayer.id, pos)}
                                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                                style={(startingPositions[posEditPlayer.id]||posEditPlayer.preferred)===pos?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                                {pos}
                              </button>
                            ))}
                          </div>
                          <button onClick={()=>setPosEditPlayer(null)} className="w-full text-white font-bold py-2.5 rounded-xl text-sm" style={{background:N.bg}}>Done</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })()}
          {tab==='result'&&<>
            <div><label className="text-xs font-semibold text-gray-600 block mb-1">Result</label>
              <input value={form.result} onChange={e=>set('result',e.target.value)} placeholder="e.g. Won 3-1" className={ic} onFocus={fn} onBlur={fb}/></div>
            <div><label className="text-xs font-semibold text-gray-600 block mb-1">Scorers</label>
              <input value={form.scorers} onChange={e=>set('scorers',e.target.value)} placeholder="e.g. J.Smith x2" className={ic} onFocus={fn} onBlur={fb}/></div>
            <div><label className="text-xs font-semibold text-gray-600 block mb-1">Coach Notes (private)</label>
              <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} placeholder="Key moments, areas to work on..." className={ic+' resize-none'} onFocus={fn} onBlur={fb}/></div>
          </>}
          {tab==='report'&&<MatchReportBuilder form={form} weekNum={weekNum} onSaveReport={async(data)=>{ const updated={...form,...data}; setForm(updated); setSaved(false); await onSave(weekNum, updated) }}/>}
          {tab!=='squadsel' && tab!=='report' && (
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm" style={{background:saved?'#16a34a':N.bg}}>{saved?'✓ Saved!':'💾 Save'}</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(tab==='fixture'?fixtureWa:resultWa)}`} target="_blank" rel="noreferrer" className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm text-center" style={{background:'#16a34a'}}>📲 {tab==='fixture'?'Share Fixture':'Share Result'}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Squad Manager (Attendance + Notes + Positions + Progress) ─────────────────
const PITCH_FORMATIONS = {
  '9v9': {
    '3-3-2': [
      {pos:'GK',  x:50, y:88},
      {pos:'LB',  x:18, y:70},{pos:'CB', x:50, y:72},{pos:'RB', x:82, y:70},
      {pos:'LM',  x:18, y:48},{pos:'CM', x:50, y:50},{pos:'RM', x:82, y:48},
      {pos:'ST',  x:35, y:25},{pos:'ST', x:65, y:25},
    ],
    '3-2-3': [
      {pos:'GK',  x:50, y:88},
      {pos:'LB',  x:18, y:70},{pos:'CB', x:50, y:72},{pos:'RB', x:82, y:70},
      {pos:'CM',  x:35, y:50},{pos:'CM', x:65, y:50},
      {pos:'LM',  x:20, y:22},{pos:'ST', x:50, y:18},{pos:'RM', x:80, y:22},
    ],
    '3-4-1': [
      {pos:'GK',  x:50, y:88},
      {pos:'LB',  x:18, y:70},{pos:'CB', x:50, y:72},{pos:'RB', x:82, y:70},
      {pos:'LM',  x:12, y:48},{pos:'CM', x:38, y:50},{pos:'CM', x:62, y:50},{pos:'RM', x:88, y:48},
      {pos:'ST',  x:50, y:18},
    ],
  },
  '11v11': {
    '4-4-2': [
      {pos:'GK',  x:50, y:88},
      {pos:'LB',  x:10, y:72},{pos:'CB', x:35, y:72},{pos:'CB', x:65, y:72},{pos:'RB', x:90, y:72},
      {pos:'LM',  x:10, y:50},{pos:'CM', x:35, y:52},{pos:'CM', x:65, y:52},{pos:'RM', x:90, y:50},
      {pos:'ST',  x:35, y:18},{pos:'ST', x:65, y:18},
    ],
    '4-3-3': [
      {pos:'GK',  x:50, y:88},
      {pos:'LB',  x:10, y:72},{pos:'CB', x:35, y:72},{pos:'CB', x:65, y:72},{pos:'RB', x:90, y:72},
      {pos:'CM',  x:50, y:56},{pos:'CM', x:28, y:46},{pos:'CM', x:72, y:46},
      {pos:'LM',  x:15, y:20},{pos:'ST', x:50, y:15},{pos:'RM', x:85, y:20},
    ],
    '4-2-3-1': [
      {pos:'GK',  x:50, y:88},
      {pos:'LB',  x:10, y:72},{pos:'CB', x:35, y:72},{pos:'CB', x:65, y:72},{pos:'RB', x:90, y:72},
      {pos:'CM',  x:35, y:56},{pos:'CM', x:65, y:56},
      {pos:'LM',  x:15, y:36},{pos:'CM', x:50, y:34},{pos:'RM', x:85, y:36},
      {pos:'ST',  x:50, y:14},
    ],
  }
}

function SquadManager({ currentWeek, setWeekNum, currentWeekNum, squad, attendance, onToggle, onAdd, onRemove, onUpdatePos, playerNotes, onSaveNote, drills, progressData, onSaveProgress, skillsData, onSaveSkill, groupCount, onGroupCountChange, groupAssignments, onAssignGroup, preferredTeamFormat, preferredFormation, onSaveFormationPref, teamCount, onSaveTeamCount, teamAssignments, onAssignTeam }) {
  const [groupMode, setGroupMode] = useState('ability') // 'ability' | 'team'
  const [tab, setTab] = useState('squad')
  const [squadSort, setSquadSort] = useState('number') // 'number' | 'name'
  const [skillPlayer, setSkillPlayer] = useState(null)
  const [skillView, setSkillView] = useState('by-skill')
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [teamFormat, setTeamFormat] = useState(preferredTeamFormat||'9v9')
  const [formation, setFormation] = useState(preferredFormation||'3-3-2')
  const [skillGroupFilter, setSkillGroupFilter] = useState('outfield')
  const [newName, setNewName] = useState('')
  const [newNum, setNewNum] = useState('')
  const [adding, setAdding] = useState(false)
  const [editPlayer, setEditPlayer] = useState(null)
  const [editName, setEditName] = useState('')
  const [editNum, setEditNum] = useState('')
  const [notePlayer, setNotePlayer] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [progPlayer, setProgPlayer] = useState(null)
  const [posForm, setPosForm] = useState({preferred:'',secondary:''})
  const POSITIONS_9V9_LIST = ['GK','RB','CB','LB','RM','CM','LM','ST']
  const POSITIONS_11V11_LIST = ['GK','RB','CB','LB','RM','CM','LM','ST']
  const POSITIONS = teamFormat==='9v9' ? POSITIONS_9V9_LIST : POSITIONS_11V11_LIST
  const LEVELS = [{v:0,label:'Not started',color:'#e5e7eb'},{v:1,label:'Introduced',color:'#f59e0b'},{v:2,label:'Developing',color:'#3b82f6'},{v:3,label:'Confident',color:'#16a34a'}]
  const drillsForProgress = drills.filter(d=>d.category!=='Age Group Changes'&&d.category!=='Strength & Conditioning')
  const presentCount = squad.filter(p=>attendance[currentWeek+'-'+p.id]).length

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{id:'squad',label:'👥 Squad'},{id:'teamview',label:'🏟️ Team'},{id:'groups',label:'🎯 Groups'},{id:'notes',label:'📝 Notes'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all" style={tab===t.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>{t.label}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{id:'skills',label:'🌟 Skills'},{id:'progress',label:'📈 Progress'},{id:'attendance',label:'✅ Attend.'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all" style={tab===t.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>{t.label}</button>
          ))}
        </div>
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">Tap a player to edit.</p>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {[{v:'number',label:'# No.'},{v:'name',label:'A-Z'}].map(s=>(
                <button key={s.v} onClick={()=>setSquadSort(s.v)}
                  className="px-2 py-1 rounded-md text-xs font-bold transition-all"
                  style={squadSort===s.v?{background:'white',color:N.text,boxShadow:'0 1px 2px rgba(0,0,0,0.1)'}:{color:'#9ca3af'}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {squad.length===0?<p className="text-sm text-gray-400 text-center py-4">No players yet — add one above</p>:(()=>{
            const sortedSquad = [...squad].sort((a,b)=>
              squadSort==='name'
                ? a.name.localeCompare(b.name)
                : (parseInt(a.squad_num)||999)-(parseInt(b.squad_num)||999)
            )
            return (
            <div className="space-y-2">
              {sortedSquad.map(p=>(
                <button key={p.id} onClick={()=>{setEditPlayer(p);setEditName(p.name);setEditNum(p.squad_num||'');setPosForm({preferred:p.preferred||'',secondary:p.secondary||''})}} className="w-full flex items-center gap-3 p-3 rounded-xl border text-left" style={{borderColor:editPlayer?.id===p.id?N.bg:'#e5e7eb',background:editPlayer?.id===p.id?N.light:'white'}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:N.bg}}>{p.squad_num||p.name[0]}</div>
                  <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.preferred||'No position set'}{p.secondary?' / '+p.secondary:''}</p></div>
                  <span className="text-gray-300 text-xs">&#8250;</span>
                </button>
              ))}
            </div>
            )
          })()}
          {editPlayer&&(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">✏️ Edit Player</h3>
                <div className="space-y-3 mb-4">
                  {/* Name and number */}
                  <div className="flex gap-2">
                    <div><label className="text-xs font-semibold text-gray-600 block mb-1">Squad #</label>
                      <input value={editNum} onChange={e=>setEditNum(e.target.value)} placeholder="#" className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-16 focus:outline-none" onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/></div>
                    <div className="flex-1"><label className="text-xs font-semibold text-gray-600 block mb-1">Name</label>
                      <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Player name" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none" onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/></div>
                  </div>
                  {/* Preferred position */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-600">Preferred Position</label>
                      {posForm.preferred && <button onClick={()=>setPosForm(f=>({...f,preferred:''}))} className="text-xs text-red-400 font-semibold">Clear</button>}
                    </div>
                    <div className="flex flex-wrap gap-2">{POSITIONS.map(pos=><button key={pos} onClick={()=>setPosForm(f=>({...f,preferred:f.preferred===pos?'':pos}))} className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all" style={posForm.preferred===pos?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>{pos}</button>)}</div>
                  </div>
                  {/* Secondary position */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-600">Secondary Position</label>
                      {posForm.secondary && <button onClick={()=>setPosForm(f=>({...f,secondary:''}))} className="text-xs text-red-400 font-semibold">Clear</button>}
                    </div>
                    <div className="flex flex-wrap gap-2">{POSITIONS.map(pos=><button key={pos} onClick={()=>setPosForm(f=>({...f,secondary:f.secondary===pos?'':pos}))} className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all" style={posForm.secondary===pos?{background:'#8b5cf6',color:'white',borderColor:'#8b5cf6'}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>{pos}</button>)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>{
                    onUpdatePos(editPlayer.id,{...posForm,name:editName.trim()||editPlayer.name,squad_num:editNum.trim()})
                    setEditPlayer(null)
                  }} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm" style={{background:N.bg}}>Save</button>
                  <button onClick={()=>setEditPlayer(null)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
                </div>
                {/* Remove player */}
                <button onClick={()=>{
                  if(window.confirm(`Remove ${editPlayer.name} from the squad?`)){onRemove(editPlayer.id);setEditPlayer(null)}
                }} className="w-full mt-3 text-red-400 border border-red-200 font-semibold py-2 rounded-xl text-sm hover:bg-red-50">
                  🗑️ Remove from Squad
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='groups'&&(()=>{
        const GROUP_COLORS = ['#1e3a5f','#16a34a','#f59e0b','#8b5cf6','#ef4444','#0891b2']
        const mode = groupMode // 'ability' | 'team'
        const count = mode==='team' ? teamCount : groupCount
        const setCount = mode==='team' ? onSaveTeamCount : onGroupCountChange
        const groups = Array.from({length:count},(_,i)=>i+1)
        const schemeKey = `${mode}-${count}`
        const assignments = mode==='team' ? teamAssignments : groupAssignments
        const onAssign = mode==='team' ? onAssignTeam : onAssignGroup
        const unassigned = squad.filter(p=>!assignments[`${schemeKey}-${p.id}`])

        return (
          <div className="space-y-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={()=>setGroupMode('ability')} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={mode==='ability'?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                🎯 Ability Groups
              </button>
              <button onClick={()=>setGroupMode('team')} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={mode==='team'?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                ⚽ Match Teams
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-1">{mode==='team'?'⚽ Small-Sided Game Teams':'🎯 Training Groups'}</h3>
              <p className="text-xs text-gray-400 mb-3">{mode==='team'?'Split the squad into balanced teams for small-sided games.':'Split the squad into ability groups for training drills.'}</p>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600">Number of {mode==='team'?'teams':'groups'}:</label>
                <div className="flex gap-1 flex-wrap">
                  {[2,3,4,5,6].map(n=>(
                    <button key={n} onClick={()=>setCount(n)}
                      className="w-9 h-9 rounded-xl text-sm font-bold border-2 transition-all shrink-0"
                      style={count===n?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {squad.length===0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-400">Add players in the Squad tab first</p>
              </div>
            ) : (
              <>
                {/* Unassigned players */}
                {unassigned.length>0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Unassigned ({unassigned.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {unassigned.map(p=>(
                        <div key={p.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
                          <span className="text-xs font-semibold text-gray-700">{p.squad_num?`#${p.squad_num} `:''}{p.name.split(' ')[0]}</span>
                          <div className="flex gap-0.5 ml-1">
                            {groups.map(g=>(
                              <button key={g} onClick={()=>onAssign(p.id,g,count)}
                                className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
                                style={{background:GROUP_COLORS[g-1]}}>
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Groups / Teams */}
                {groups.map(g=>{
                  const groupPlayers = squad.filter(p=>assignments[`${schemeKey}-${p.id}`]===g)
                  return (
                    <div key={g} className="bg-white border-2 rounded-2xl p-4" style={{borderColor:GROUP_COLORS[g-1]+'44'}}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background:GROUP_COLORS[g-1]}}>{g}</div>
                          <p className="font-bold text-gray-900 text-sm">{mode==='team'?`Team ${g}`:`Group ${g}`}</p>
                        </div>
                        <span className="text-xs text-gray-400">{groupPlayers.length} players</span>
                      </div>
                      {groupPlayers.length===0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">No players assigned yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {groupPlayers.map(p=>(
                            <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl" style={{background:GROUP_COLORS[g-1]+'11'}}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:N.bg}}>{p.squad_num||p.name[0]}</div>
                              <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                              <div className="flex gap-1">
                                {groups.filter(og=>og!==g).map(og=>(
                                  <button key={og} onClick={()=>onAssign(p.id,og,count)}
                                    className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center opacity-50 hover:opacity-100"
                                    style={{background:GROUP_COLORS[og-1]}}
                                    title={`Move to ${mode==='team'?'Team':'Group'} ${og}`}>
                                    {og}
                                  </button>
                                ))}
                                <button onClick={()=>onAssign(p.id,null,count)} className="text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                {mode==='team' && groups.some(g=>squad.some(p=>assignments[`${schemeKey}-${p.id}`]===g)) && (
                  <a href={`https://wa.me/?text=${encodeURIComponent(
                    `Clydach Juniors -- Small-Sided Teams\n\n${groups.map(g=>{
                      const gp = squad.filter(p=>assignments[`${schemeKey}-${p.id}`]===g)
                      return `*Team ${g}:*\n${gp.map(p=>`${p.squad_num?'#'+p.squad_num+' ':''}${p.name}`).join('\n')||'(empty)'}`
                    }).join('\n\n')}\n\n-- Coaching Team\n🔗 ${SITE_URL}`
                  )}`}
                    target="_blank" rel="noreferrer"
                    className="w-full text-white font-bold py-2.5 rounded-xl text-sm text-center block" style={{background:'#16a34a'}}>
                    📲 Share Teams
                  </a>
                )}
              </>
            )}
          </div>
        )
      })()}

      {tab==='notes'&&(
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-1">📝 Player Development Notes</h3>
            <p className="text-xs text-gray-400 mb-3">Tap a player to add or edit notes. Private -- not visible to parents.</p>
            {squad.length===0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Add players in the Squad tab first</p>
            ) : (
              <div className="space-y-2">
                {squad.map(p=>{
                  const hasNote=!!(playerNotes[p.id]&&playerNotes[p.id].trim())
                  const isSelected = notePlayer?.id===p.id
                  return (
                    <div key={p.id}>
                      <div onClick={()=>{if(isSelected){setNotePlayer(null)}else{setNotePlayer(p);setNoteText(playerNotes[p.id]||'');setNoteSaved(false)}}}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
                        style={{borderColor:isSelected?N.bg:'#e5e7eb',background:isSelected?N.light:'white'}}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:N.bg}}>
                          {p.squad_num||p.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          {hasNote && <p className="text-xs text-gray-400 truncate">{playerNotes[p.id]}</p>}
                        </div>
                        <span className="text-xs shrink-0" style={{color:N.text}}>{isSelected ? '▲' : (hasNote ? '● ▼' : '▼')}</span>
                      </div>
                      {isSelected && (
                        <div className="bg-gray-50 border border-t-0 rounded-b-xl px-3 pb-3 pt-2" style={{borderColor:N.bg}}>
                          <textarea value={noteText}
                            onChange={e=>{setNoteText(e.target.value);setNoteSaved(false)}}
                            rows={4}
                            placeholder="e.g. Strong in the air, needs work on weak foot. Ready for more responsibility in midfield."
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none mb-2 bg-white"
                            onFocus={e=>e.target.style.borderColor=N.bg}
                            onBlur={e=>e.target.style.borderColor='#d1d5db'}
                            autoFocus/>
                          <button onClick={async()=>{await onSaveNote(notePlayer.id,noteText);setNoteSaved(true);setTimeout(()=>setNoteSaved(false),2000)}}
                            className="w-full text-white font-bold py-2.5 rounded-xl text-sm"
                            style={{background:noteSaved?'#16a34a':N.bg}}>
                            {noteSaved?'✓ Saved!':'💾 Save Notes'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
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

      {/* ── Skills Development Tab ── */}
      {tab==='skills'&&(()=>{
        const OUTFIELD_SKILLS = [
          {key:'passing',     label:'Pass',    icon:'🎯'},
          {key:'dribbling',   label:'Drib',    icon:'⚡'},
          {key:'firsttouch',  label:'Touch',   icon:'🦶'},
          {key:'shooting',    label:'Shot',    icon:'🥅'},
          {key:'tackling',    label:'Tackle',  icon:'🛡️'},
          {key:'heading',     label:'Head',    icon:'🤕'},
          {key:'positioning', label:'Pos',     icon:'📍'},
          {key:'workrate',    label:'Work',    icon:'💪'},
          {key:'teamwork',    label:'Team',    icon:'🤝'},
          {key:'conditioning',label:'Fit',     icon:'🏃'},
        ]
        const GK_SKILLS = [
          {key:'gk_catching',  label:'Catch',  icon:'🧤'},
          {key:'gk_throwing',  label:'Throw',  icon:'🤾'},
          {key:'gk_goalkick',  label:'GKick',  icon:'👟'},
          {key:'gk_kicking',   label:'Kick',   icon:'🦵'},
          {key:'gk_punching',  label:'Punch',  icon:'👊'},
          {key:'gk_diving',    label:'Dive',   icon:'🌊'},
          {key:'gk_positioning',label:'Pos',   icon:'📍'},
          {key:'gk_footwork',  label:'Feet',   icon:'🏃'},
        ]
        const LEVELS = [
          {v:0,label:'Not Assessed',color:'#e5e7eb'},
          {v:1,label:'Needs Work',  color:'#ef4444'},
          {v:2,label:'Developing',  color:'#f59e0b'},
          {v:3,label:'Good',        color:'#3b82f6'},
          {v:4,label:'Excellent',   color:'#16a34a'},
        ]

        const skillSet = skillView==='by-skill' && selectedSkill?.key?.startsWith('gk_') ? 'gk' : (skillView==='by-skill' ? 'outfield' : 'outfield')
        const activeSkills = skillView==='gk' || (skillView==='by-skill' && selectedSkill?.key?.startsWith('gk_')) ? GK_SKILLS : OUTFIELD_SKILLS
        return (
          <div className="space-y-3">
            {/* View toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={()=>setSkillView('by-skill')} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={skillView==='by-skill'?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                Grid View
              </button>
              <button onClick={()=>setSkillView('by-player')} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={skillView==='by-player'?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                By Player
              </button>
            </div>

            {squad.length===0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-400">Add players in the Squad tab first</p>
              </div>
            )}

            {/* ── BY PLAYER VIEW ── */}
            {skillView==='by-player'&&squad.length>0&&(
              <>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-3">Select a player to rate their skills. GK players get additional goalkeeper skills.</p>
                  <div className="flex gap-2 flex-wrap">
                    {squad.map(p=>(
                      <button key={p.id} onClick={()=>setSkillPlayer(skillPlayer?.id===p.id?null:p)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                        style={skillPlayer?.id===p.id?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                        {p.squad_num?`#${p.squad_num} `:''}{p.name.split(' ')[0]}{p.preferred==='GK'?' 🧤':''}
                      </button>
                    ))}
                  </div>
                </div>

                {skillPlayer&&(()=>{
                  const isGK = skillPlayer.preferred==='GK'
                  const skills = isGK ? [...OUTFIELD_SKILLS, ...GK_SKILLS] : OUTFIELD_SKILLS
                  return (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{background:N.bg}}>
                          {skillPlayer.squad_num||skillPlayer.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{skillPlayer.name}</p>
                          <p className="text-xs text-gray-400">{isGK?'Goalkeeper -- outfield + GK skills':skillPlayer.preferred||'No position'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap mb-3">
                        {LEVELS.map(l=><div key={l.v} className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{background:l.color}}/><span className="text-xs text-gray-500">{l.label}</span></div>)}
                      </div>
                      <div className="space-y-2.5 mb-3">
                        {OUTFIELD_SKILLS.map(skill=>{
                          const level=skillsData[skillPlayer.id+'-'+skill.key]||0
                          return (
                            <div key={skill.key} className="flex items-center gap-2">
                              <span className="text-sm w-5 shrink-0">{skill.icon}</span>
                              <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900">{skill.label}</p></div>
                              <div className="flex gap-1 shrink-0">
                                {LEVELS.map(l=><button key={l.v} onClick={()=>onSaveSkill(skillPlayer.id,skill.key,l.v)} className="w-7 h-7 rounded-full border-2 transition-all" style={{background:level===l.v?l.color:'white',borderColor:level===l.v?l.color:'#e5e7eb'}} title={l.label}/>)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {isGK&&(
                        <>
                          <div className="flex items-center gap-2 my-3">
                            <div className="flex-1 border-t border-cyan-200"/><span className="text-xs font-semibold text-cyan-600 px-2">🧤 Goalkeeper Skills</span><div className="flex-1 border-t border-cyan-200"/>
                          </div>
                          <div className="space-y-2.5">
                            {GK_SKILLS.map(skill=>{
                              const level=skillsData[skillPlayer.id+'-'+skill.key]||0
                              return (
                                <div key={skill.key} className="flex items-center gap-2">
                                  <span className="text-sm w-5 shrink-0">{skill.icon}</span>
                                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-cyan-800">{skill.label}</p></div>
                                  <div className="flex gap-1 shrink-0">
                                    {LEVELS.map(l=><button key={l.v} onClick={()=>onSaveSkill(skillPlayer.id,skill.key,l.v)} className="w-7 h-7 rounded-full border-2 transition-all" style={{background:level===l.v?l.color:'white',borderColor:level===l.v?l.color:'#e5e7eb'}} title={l.label}/>)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                      <div className="mt-3 grid grid-cols-4 gap-1">
                        {LEVELS.filter(l=>l.v>0).map(l=>{
                          const all = isGK?[...OUTFIELD_SKILLS,...GK_SKILLS]:OUTFIELD_SKILLS
                          const count=all.filter(s=>(skillsData[skillPlayer.id+'-'+s.key]||0)===l.v).length
                          return <div key={l.v} className="text-center p-1.5 rounded-lg" style={{background:l.color+'22'}}><div className="text-sm font-black" style={{color:l.color}}>{count}</div><div className="text-gray-500" style={{fontSize:'8px'}}>{l.label}</div></div>
                        })}
                      </div>
                    </div>
                  )
                })()}
              </>
            )}

            {/* ── GRID VIEW ── */}
            {skillView==='by-skill'&&squad.length>0&&(()=>{
              const showGK = selectedSkill ? selectedSkill.key.startsWith('gk_') : skillGroupFilter==='gk'
              const gridSkills = showGK ? GK_SKILLS : OUTFIELD_SKILLS
              const gridSquad = showGK ? squad.filter(p=>p.preferred==='GK') : squad

              return (
                <div className="space-y-3">
                  {/* Outfield / GK toggle */}
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    <button onClick={()=>{setSkillGroupFilter('outfield');setSelectedSkill(null)}}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={!showGK?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                      Outfield Skills
                    </button>
                    <button onClick={()=>{setSkillGroupFilter('gk');setSelectedSkill(null)}}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={showGK?{background:'#0891b2',color:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                      🧤 GK Skills
                    </button>
                  </div>

                  {showGK && gridSquad.length===0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                      <p className="text-sm text-gray-400">No GK players in squad. Set a player's position to GK in the Squad tab.</p>
                    </div>
                  )}

                  {(!showGK || gridSquad.length>0)&&(
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      {/* Skill headers */}
                      <div className="overflow-auto" style={{maxHeight:'55vh'}}>
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{background:N.light}}>
                              <th className="text-left px-3 py-2 font-semibold text-gray-700 sticky left-0 top-0 z-20" style={{background:N.light,minWidth:'80px'}}>Player</th>
                              {gridSkills.map(s=>(
                                <th key={s.key} className="px-1 py-2 text-center cursor-pointer transition-all sticky top-0 z-10"
                                  style={{minWidth:'36px',background:selectedSkill?.key===s.key?N.bg:N.light,color:selectedSkill?.key===s.key?'white':N.text}}
                                  onClick={()=>setSelectedSkill(selectedSkill?.key===s.key?null:s)}>
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span>{s.icon}</span>
                                    <span style={{fontSize:'9px',fontWeight:'600'}}>{s.label}</span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedSkill
                              ? [...gridSquad].sort((a,b)=>(skillsData[b.id+'-'+selectedSkill.key]||0)-(skillsData[a.id+'-'+selectedSkill.key]||0))
                              : gridSquad
                            ).map((p,ri)=>(
                              <tr key={p.id} data-grid-row style={{background:ri%2===0?'white':'#f9fafb'}}
                                onClick={()=>{setSkillPlayer(p);setSkillView('by-player')}}>
                                <td className="px-3 py-2 sticky left-0 z-10 cursor-pointer" style={{background:ri%2===0?'white':'#f9fafb'}}>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0" style={{background:N.bg,fontSize:'9px',fontWeight:'bold'}}>
                                      {p.squad_num||p.name[0]}
                                    </div>
                                    <span className="font-semibold text-gray-900 truncate" style={{maxWidth:'55px'}}>{p.name.split(' ')[0]}</span>
                                  </div>
                                </td>
                                {gridSkills.map(s=>{
                                  const lv=skillsData[p.id+'-'+s.key]||0
                                  const col=LEVELS[lv].color
                                  const isHighlighted = selectedSkill?.key===s.key
                                  return (
                                    <td key={s.key} className="px-1 py-2 text-center"
                                      style={{background:isHighlighted?(col+'22'):'transparent'}}
                                      onClick={e=>{e.stopPropagation();onSaveSkill(p.id,s.key,(lv+1)%5)}}>
                                      <div className="w-6 h-6 rounded-full mx-auto border-2 cursor-pointer transition-all"
                                        style={{background:lv>0?col:'white',borderColor:lv>0?col:'#e5e7eb'}}
                                        title={LEVELS[lv].label}/>
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Legend */}
                      <div className="flex gap-3 flex-wrap px-3 py-2 border-t border-gray-100">
                        {LEVELS.map(l=><div key={l.v} className="flex items-center gap-1"><div className="w-3 h-3 rounded-full border" style={{background:l.v>0?l.color:'white',borderColor:l.color}}/><span className="text-gray-500" style={{fontSize:'9px'}}>{l.label}</span></div>)}
                      </div>
                      {selectedSkill&&(
                        <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-500" style={{background:N.light}}>
                          Sorted by <strong>{selectedSkill.icon} {selectedSkill.label}</strong> -- tap a player row to open their full profile
                        </div>
                      )}
                      {!selectedSkill&&(
                        <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-500">
                          Tap a skill column to sort and highlight -- tap a player row to open their full profile -- tap a dot to cycle rating
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )
      })()}

      {/* ── Team View Tab ── */}
      {tab==='teamview'&&(()=>{
        // Formation layouts grouped by squad size
        const FORMATIONS = PITCH_FORMATIONS

        const formationOptions = Object.keys(FORMATIONS[teamFormat])
        const activeFormation = FORMATIONS[teamFormat][formation] ? formation : formationOptions[0]
        const PITCH_POSITIONS = FORMATIONS[teamFormat][activeFormation]
        const formatLabel = teamFormat==='9v9' ? '9v9 (U12/U13)' : '11v11 (U14/U15)'

        return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">🏟️ Team View</h3>
              <p className="text-xs text-gray-400">Players in preferred positions</p>
            </div>
            {/* Squad size toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[{v:'9v9',label:'9v9'},{v:'11v11',label:'11v11'}].map(f=>(
                <button key={f.v} onClick={()=>{setTeamFormat(f.v);setFormation(Object.keys(FORMATIONS[f.v])[0])}}
                  className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                  style={teamFormat===f.v?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs font-semibold mb-2" style={{color:N.text}}>{formatLabel}</p>
          {/* Formation selector */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              {formationOptions.map(f=>(
                <button key={f} onClick={()=>setFormation(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                  style={activeFormation===f?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                  {f}
                </button>
              ))}
            </div>
            {(preferredTeamFormat!==teamFormat || preferredFormation!==activeFormation) ? (
              <button onClick={()=>onSaveFormationPref(teamFormat,activeFormation)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{background:'#16a34a'}}>
                ⭐ Set as Default
              </button>
            ) : (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{background:N.light,color:N.text}}>
                ⭐ Default
              </span>
            )}
          </div>
          {squad.length===0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Add players in the Squad tab first</p>
          ) : (()=>{
            return (
              <>
                <div className="relative rounded-xl overflow-hidden mb-4" style={{background:'#166534',paddingTop:'140%'}}>
                  <div className="absolute inset-0">
                    {/* Pitch markings */}
                    <svg viewBox="0 0 100 140" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <rect width="100" height="140" fill="#166534"/>
                      <rect x="3" y="3" width="94" height="134" fill="none" stroke="#4ade80" strokeWidth="0.5" opacity="0.5"/>
                      <line x1="3" y1="70" x2="97" y2="70" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                      <circle cx="50" cy="70" r="10" fill="none" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                      <rect x="28" y="3" width="44" height="18" fill="none" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                      <rect x="28" y="119" width="44" height="18" fill="none" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                      <rect x="38" y="3" width="24" height="8" fill="none" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                      <rect x="38" y="129" width="24" height="8" fill="none" stroke="#4ade80" strokeWidth="0.4" opacity="0.4"/>
                    </svg>
                    {/* Player dots */}
                    {(()=>{
                      // Group all players by preferred position
                      const byPos = {}
                      squad.forEach(p=>{ if(p.preferred){ if(!byPos[p.preferred]) byPos[p.preferred]=[]; byPos[p.preferred].push(p) } })
                      // Track which positions have been rendered to avoid duplicate slot labels
                      const renderedPos = new Set()
                      return PITCH_POSITIONS.map((slot,i)=>{
                        const players = byPos[slot.pos] || []
                        const alreadyShown = renderedPos.has(slot.pos)
                        if(!alreadyShown) renderedPos.add(slot.pos)
                        // For positions with multiple slots (e.g. CB x2), distribute players
                        const slotIndex = PITCH_POSITIONS.slice(0,i).filter(s=>s.pos===slot.pos).length
                        const player = players[slotIndex] || null
                        // Show extra players stacked if more than slots available
                        const extraPlayers = slotIndex===0 && players.length > PITCH_POSITIONS.filter(s=>s.pos===slot.pos).length
                          ? players.slice(PITCH_POSITIONS.filter(s=>s.pos===slot.pos).length)
                          : []
                        return (
                          <div key={i} className="absolute flex flex-col items-center" style={{left:`${slot.x}%`,top:`${slot.y}%`,transform:'translate(-50%,-50%)'}}>
                            {/* Primary slot player */}
                            <div className="rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                              style={{width:'28px',height:'28px',fontSize:'9px',background:player?N.bg:'rgba(255,255,255,0.15)',border:player?'2px solid white':'2px solid rgba(255,255,255,0.3)'}}>
                              {player ? (player.squad_num||player.name[0]) : slot.pos}
                            </div>
                            {player && <div className="text-white font-semibold mt-0.5 px-1 rounded text-center" style={{fontSize:'7px',background:'rgba(0,0,0,0.5)',maxWidth:'36px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{player.name.split(' ')[0]}</div>}
                            {!player && <div className="text-white opacity-40 mt-0.5" style={{fontSize:'7px'}}>{slot.pos}</div>}
                            {/* Extra players beyond available slots - shown as smaller stacked dots */}
                            {extraPlayers.map((ep,ei)=>(
                              <div key={ei} className="flex flex-col items-center mt-0.5">
                                <div className="rounded-full flex items-center justify-center text-white font-bold" style={{width:'22px',height:'22px',fontSize:'8px',background:'#6366f1',border:'1.5px solid white',opacity:0.9}}>
                                  {ep.squad_num||ep.name[0]}
                                </div>
                                <div className="text-white mt-0.5 px-1 rounded text-center" style={{fontSize:'6px',background:'rgba(99,102,241,0.7)',maxWidth:'32px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ep.name.split(' ')[0]}</div>
                              </div>
                            ))}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
                {/* Players not placed */}
                {(() => {
                  const assignedPositions = PITCH_POSITIONS.map(s=>s.pos)
                  const unplaced = squad.filter(p=>!p.preferred||!assignedPositions.includes(p.preferred))
                  if(unplaced.length===0) return null
                  return (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">No position set ({unplaced.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {unplaced.map(p=>(
                          <button key={p.id} onClick={()=>{setEditPlayer(p);setPosForm({preferred:p.preferred||'',secondary:p.secondary||''});setTab('squad')}}
                            className="text-xs px-2 py-1 rounded-full text-white font-semibold flex items-center gap-1 transition-opacity hover:opacity-80"
                            style={{background:'#9ca3af'}}>
                            {p.squad_num?`#${p.squad_num} `:''}{p.name.split(' ')[0]} <span style={{fontSize:'9px'}}>+ pos</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </>
            )
          })()}
        </div>
        )
      })()}

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
  {icon:'📋',title:'Coach Requirements',rule:'Minimum FAW Football Leaders Award required. Valid Enhanced DBS check mandatory.'},
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
function SeasonOverview({ seasonStart, preSeasonStart, onSeasonStartChange, onPreSeasonStartChange, matchNotes, currentWeek, onWeekSelect }) {
  return (
    <div className="space-y-4">
      {/* Pre-Season Dates */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4" style={{borderLeft:'4px solid #f97316'}}>
        <h3 className="font-bold text-gray-900 text-sm mb-3">🌱 Pre-Season</h3>
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Pre-Season Start Date</label>
        {preSeasonStart ? (
          <div className="flex items-center gap-2">
            <span className="flex-1 text-sm font-semibold text-gray-800 bg-orange-50 rounded-xl px-3 py-2 border border-orange-200">
              {parseLocalDate(preSeasonStart).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'long',year:'numeric'})}
            </span>
            <button onClick={()=>onPreSeasonStartChange('')} className="text-xs border border-red-200 text-red-400 rounded-xl px-3 py-2">Clear</button>
          </div>
        ) : (
          <input type="date"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            onFocus={e=>e.target.style.borderColor='#f97316'}
            onBlur={e=>{e.target.style.borderColor='#d1d5db'; if(e.target.value) onPreSeasonStartChange(e.target.value)}}/>
        )}
        {preSeasonStart && seasonStart && (
          <p className="text-xs mt-2" style={{color:'#9a3412'}}>
            Pre-season runs until {parseLocalDate(seasonStart).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
          </p>
        )}
      </div>

      {/* Competitive Season Dates */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4" style={{borderLeft:`4px solid ${N.bg}`}}>
        <h3 className="font-bold text-gray-900 text-sm mb-3">📅 Competitive Season</h3>
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Season Start Date</label>
        <p className="text-xs text-gray-400 mb-2">Sets Week 1. App auto-advances each Monday.</p>
        {seasonStart ? (
          <div className="flex items-center gap-2">
            <span className="flex-1 text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl px-3 py-2">
              {parseLocalDate(seasonStart).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'long',year:'numeric'})}
            </span>
            <button onClick={()=>onSeasonStartChange('')} className="text-xs border border-red-200 text-red-400 rounded-xl px-3 py-2">Clear</button>
          </div>
        ) : (
          <input type="date"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            onFocus={e=>e.target.style.borderColor=N.bg}
            onBlur={e=>{e.target.style.borderColor='#d1d5db'; if(e.target.value) onSeasonStartChange(e.target.value)}}/>
        )}
        {seasonStart && (
          <p className="text-xs mt-2" style={{color:N.text}}>
            Week 1 starts {parseLocalDate(seasonStart).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
          </p>
        )}
      </div>

      {!seasonStart ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-2xl mb-2">📅</p>
          <p className="text-sm font-semibold text-gray-600">Set a competitive season start date above to see the overview</p>
        </div>
      ) : (()=>{
        const weeks = Array.from({length:30},(_,i)=>i+1)
        const getDate = w => { const d=parseLocalDate(seasonStart); d.setDate(d.getDate()+(w-1)*7); return d }
        const fmt = d => d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})
        return (
        <>
        <div className="rounded-2xl p-3 mb-2 flex gap-2 items-center" style={{background:N.light,border:`1px solid ${N.bg}33`}}>
          <p className="text-xs font-semibold" style={{color:N.text}}>30-week season overview. Tap any week to open the planner.</p>
        </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">Tap a week to go to the planner. ⚽ = match logged. 🤝 = friendly.</p>
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
                {hasNote&&!isCurrent&&<div className="text-xs">{matchNotes[w]?.match_type==='Friendly'||matchNotes[w]?.match_type==='Pre-Season Friendly'?'🤝':'⚽'}</div>}
              </button>
            )
          })}
        </div>
      </div>
        </> )
      })()}
    </div>
  )
}

// ─── Parent View ───────────────────────────────────────────────────────────────
function ParentView({ sessionStatus, matchNotes, drills, homeSession, seasonStart }) {
  // Find the nearest upcoming fixture marked visible to parents.
  // Prefer sorting by actual match_date if set, otherwise fall back to week number order.
  const candidates = Object.entries(matchNotes)
    .filter(([wk,n])=>n.show_parents&&n.opponent)
    .map(([wk,n])=>({...n, wk:Number(wk)}))
  const today = new Date(); today.setHours(0,0,0,0)
  candidates.sort((a,b)=>{
    const da = a.match_date ? new Date(a.match_date) : null
    const db = b.match_date ? new Date(b.match_date) : null
    if (da && db) return da - db
    if (da && !db) return -1
    if (!da && db) return 1
    return a.wk - b.wk
  })
  // Prefer the first one that's today or in the future (by date if available)
  const upcomingFixture = candidates.find(c => {
    if (c.match_date) return new Date(c.match_date) >= today
    return true // no date set, can't filter by date, just take it in week order
  }) || candidates[0] || null
  const upcomingWeekNum = upcomingFixture ? upcomingFixture.wk : null
  // Prefer the manually-set match date (accounts for mid-week fixtures, doubleheaders etc.)
  // Fall back to the calculated week date only if no specific date was set
  const fixtureDate = upcomingFixture?.match_date
    ? new Date(upcomingFixture.match_date)
    : (seasonStart && upcomingWeekNum) ? (()=>{
        const d = parseLocalDate(seasonStart)
        d.setDate(d.getDate() + (upcomingWeekNum - 1) * 7)
        return d
      })() : null
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
          {fixtureDate && <p className="text-blue-700 text-xs mt-0.5">📅 {fixtureDate.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</p>}
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
  const [preSeasonStart,setPreSeasonStart]=useState('')
  const [dateOverrides,setDateOverrides]=useState({})
  const [sessionStatus,setSessionStatus]=useState({status:'on',location:'',time:'',show_parents:false})
  const [squad,setSquad]=useState([])
  const [matchNotes,setMatchNotes]=useState({})
  const [playerNotes,setPlayerNotes]=useState({})
  const [attendance,setAttendance]=useState({})
  const [progressData,setProgressData]=useState({})
  const [skillsData,setSkillsData]=useState({}) // { 'playerId-skill': level 0-3 }
  const [groupCount,setGroupCount]=useState(2)
  const [groupAssignments,setGroupAssignments]=useState({}) // { playerId: groupNum }
  const [teamCount,setTeamCount]=useState(2)
  const [teamAssignments,setTeamAssignments]=useState({}) // { 'team-count-playerId': teamNum }
  const [matchSquad,setMatchSquad]=useState({}) // { weekNum: { starters:[ids], subs:[ids], minutes:{playerId:mins} } }
  const [preferredTeamFormat,setPreferredTeamFormat]=useState('9v9')
  const [preferredFormation,setPreferredFormation]=useState('3-3-2')
  const [matchWeek,setMatchWeek]=useState(1)
  const [matchWeekInitialized,setMatchWeekInitialized]=useState(false)
  const [squadWeek,setSquadWeek]=useState(1)
  const [filterCat,setFilterCat]=useState('All')
  const [filterAge,setFilterAge]=useState('All')
  const [search,setSearch]=useState('')
  const [selected,setSelected]=useState(null)
  const [showAdd,setShowAdd]=useState(false)
  const [shareTarget,setShareTarget]=useState(null)
  const [loading,setLoading]=useState(true)
  const [dbError,setDbError]=useState(false)
  const [showUrlModal,setShowUrlModal]=useState(false)

  useEffect(()=>{
    async function load(){
      try{const{data,error}=await supabase.from('drills').select('*').order('id');if(error)throw error;const existingIds=(data||[]).map(d=>d.id);const missing=SEED_DRILLS.filter(d=>!existingIds.includes(d.id));if(missing.length>0){await supabase.from('drills').upsert(missing,{onConflict:'id'})};if(!data||data.length===0){setDrills(SEED_DRILLS)}else{setDrills([...data,...missing.filter(m=>!data.find(d=>d.id===m.id))])}}catch(e){console.error(e);setDbError(true);setDrills(SEED_DRILLS)}
      try{const{data:hs}=await supabase.from('home_session').select('*').eq('id',1).single();if(hs)setHomeSession({drill_ids:hs.drill_ids||[],message:hs.message||''})}catch(e){}
      try{const{data:ss}=await supabase.from('season_settings').select('*').eq('id',1).single();if(ss){if(ss.season_start)setSeasonStart(ss.season_start);if(ss.pre_season_start)setPreSeasonStart(ss.pre_season_start);if(ss.group_count)setGroupCount(ss.group_count);if(ss.team_count)setTeamCount(ss.team_count);if(ss.pref_team_format)setPreferredTeamFormat(ss.pref_team_format);if(ss.pref_formation)setPreferredFormation(ss.pref_formation);setSessionStatus({status:ss.session_status||'on',location:ss.session_location||'',time:ss.session_time||'',show_parents:ss.show_status_to_parents||false})}}catch(e){}
      try{const{data:sq}=await supabase.from('squad').select('*').order('name');if(sq){setSquad(sq);const ga={};const ta={};sq.forEach(p=>{if(p.group_assignments){Object.entries(p.group_assignments).forEach(([scheme,num])=>{if(scheme.startsWith('ability-')){ga[`${scheme}-${p.id}`]=num}else if(scheme.startsWith('team-')){ta[`${scheme}-${p.id}`]=num}})}});setGroupAssignments(ga);setTeamAssignments(ta)}}catch(e){}
      try{const{data:mn}=await supabase.from('match_notes').select('*');if(mn){const o={};mn.forEach(r=>{o[r.week_num]={result:r.result||'',scorers:r.scorers||'',notes:r.notes||'',opponent:r.opponent||'',venue:r.venue||'',match_time:r.match_time||'',match_date:r.match_date||'',match_type:r.match_type||'League',show_parents:r.show_parents||false,report_text:r.report_text||'',report_photo:r.report_photo||null,report_image:r.report_image||null,report_highlights:r.report_highlights||null}});setMatchNotes(o)}}catch(e){}
      try{const{data:pn}=await supabase.from('player_notes').select('*');if(pn){const o={};pn.forEach(r=>{o[r.player_id]=r.note||''});setPlayerNotes(o)}}catch(e){}
      try{const{data:at}=await supabase.from('attendance').select('*');if(at){const o={};at.forEach(r=>{o[r.week_num+'-'+r.player_name]=r.present});setAttendance(o)}}catch(e){}
      try{const{data:pp}=await supabase.from('player_progress').select('*');if(pp){const o={};pp.forEach(r=>{o[r.player_id+'-'+r.drill_id]=r.level});setProgressData(o)}}catch(e){}
      try{const{data:ms}=await supabase.from('match_squad').select('*');if(ms){const o={};ms.forEach(r=>{o[r.week_num]={starters:r.starters||[],subs:r.subs||[],minutes:r.minutes||{},positions:r.positions||{},subReplacements:r.sub_replacements||{}}});setMatchSquad(o)}}catch(e){}
      try{const{data:sk}=await supabase.from('player_skills').select('*');if(sk){const o={};sk.forEach(r=>{o[r.player_id+'-'+r.skill]=r.level});setSkillsData(o)}}catch(e){}
      setLoading(false)
    }
    load()
  },[])

  // Once match data has loaded, open the Match tab on the most recent match
  // (highest week number with an opponent set) rather than always Week 1
  useEffect(()=>{
    if(matchWeekInitialized) return
    const weeksWithMatches = Object.keys(matchNotes).map(Number).filter(w=>matchNotes[w]?.opponent)
    if(weeksWithMatches.length>0){
      setMatchWeek(Math.max(...weeksWithMatches))
      setMatchWeekInitialized(true)
    } else if(!loading){
      // No matches logged yet -- fall back to the current training week, calculated
      // independently here since the shared `currentWeek` value isn't available this early
      const fallbackWeek = (() => {
        if(!seasonStart) return 1
        const s = parseLocalDate(seasonStart), t = new Date()
        s.setHours(0,0,0,0); t.setHours(0,0,0,0)
        if(t < s) return 1
        let week = Math.floor((t-s)/(1000*60*60*24*7))+1
        while(true){
          const sessionDate = new Date(s); sessionDate.setDate(sessionDate.getDate()+(week-1)*7); sessionDate.setHours(0,0,0,0)
          if(t > sessionDate){ week += 1 } else { break }
        }
        return week
      })()
      setMatchWeek(fallbackWeek)
      setMatchWeekInitialized(true)
    }
  },[matchNotes, loading])

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
    // Real-time listeners for live updates across coach/parent sessions
    const ch=supabase.channel('app-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'home_session'},p=>{
        if(p.new) setHomeSession({drill_ids:p.new.drill_ids||[],message:p.new.message||''})
      })
      .on('postgres_changes',{event:'*',schema:'public',table:'season_settings'},p=>{
        if(p.new){
          if(p.new.season_start) setSeasonStart(p.new.season_start)
          setSessionStatus({status:p.new.session_status||'on',location:p.new.session_location||'',time:p.new.session_time||'',show_parents:p.new.show_status_to_parents||false})
        }
      })
      .on('postgres_changes',{event:'*',schema:'public',table:'match_notes'},p=>{
        if(p.new){
          const r=p.new
          setMatchNotes(prev=>({...prev,[r.week_num]:{result:r.result||'',scorers:r.scorers||'',notes:r.notes||'',opponent:r.opponent||'',venue:r.venue||'',match_time:r.match_time||'',match_date:r.match_date||'',match_type:r.match_type||'League',show_parents:r.show_parents||false,report_text:r.report_text||'',report_photo:r.report_photo||null,report_image:r.report_image||null,report_highlights:r.report_highlights||null}}))
        }
      })
      .subscribe()
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
  const savePreSeasonStart=async(d)=>{setPreSeasonStart(d);try{await supabase.from('season_settings').upsert({id:1,pre_season_start:d||null})}catch(e){}}
  const saveSessionStatus=async(s)=>{setSessionStatus(s);try{await supabase.from('season_settings').upsert({id:1,session_status:s.status,session_location:s.location,session_time:s.time,show_status_to_parents:s.show_parents||false})}catch(e){}}
  const saveMatchNote=async(wk,note)=>{setMatchNotes(p=>({...p,[wk]:note}));try{await supabase.from('match_notes').upsert({week_num:wk,...note})}catch(e){}}
  const savePlayerNote=async(pid,note)=>{setPlayerNotes(p=>({...p,[pid]:note}));try{await supabase.from('player_notes').upsert({player_id:pid,note},{onConflict:'player_id'})}catch(e){console.error('player_notes save:',e)}}
  const addSquadPlayer=async(name,num)=>{try{const{data}=await supabase.from('squad').insert({name,squad_num:num}).select().single();if(data)setSquad(p=>[...p,data])}catch(e){}}
  const removeSquadPlayer=async(id)=>{setSquad(p=>p.filter(x=>x.id!==id));try{await supabase.from('squad').delete().eq('id',id)}catch(e){}}
  const updatePlayerPosition=async(id,form)=>{setSquad(p=>p.map(x=>x.id===id?{...x,...form}:x));try{await supabase.from('squad').update(form).eq('id',id)}catch(e){}}
  const toggleAttendance=async(wk,pid,cur)=>{const k=wk+'-'+pid;setAttendance(p=>({...p,[k]:!cur}));try{await supabase.from('attendance').upsert({week_num:wk,player_name:String(pid),present:!cur},{onConflict:'week_num,player_name'})}catch(e){}}
  const saveFormationPref=async(fmt,form)=>{
    setPreferredTeamFormat(fmt)
    setPreferredFormation(form)
    try{await supabase.from('season_settings').upsert({id:1,pref_team_format:fmt,pref_formation:form})}catch(e){console.error('formation pref save:',e)}
  }
  const saveMatchSquad=async(wk,data)=>{
    setMatchSquad(p=>({...p,[wk]:data}))
    try{await supabase.from('match_squad').upsert({week_num:wk,starters:data.starters,subs:data.subs,minutes:data.minutes,positions:data.positions||{},sub_replacements:data.subReplacements||{}})}catch(e){console.error('match_squad save:',e)}
  }
  const saveGroupCount=async(count)=>{
    setGroupCount(count)
    try{await supabase.from('season_settings').upsert({id:1,group_count:count})}catch(e){}
  }
  const assignPlayerGroup=async(pid,groupNum)=>{
    const key = `ability-${groupCount}-${pid}`
    setGroupAssignments(p=>({...p,[key]:groupNum}))
    try{
      const{data:sq}=await supabase.from('squad').select('group_assignments').eq('id',pid).single()
      const existing = (sq && sq.group_assignments) || {}
      const updated = {...existing, [`ability-${groupCount}`]: groupNum}
      await supabase.from('squad').update({group_assignments:updated}).eq('id',pid)
    }catch(e){console.error('group assign save:',e)}
  }
  const saveTeamCount=async(count)=>{
    setTeamCount(count)
    try{await supabase.from('season_settings').upsert({id:1,team_count:count})}catch(e){}
  }
  const assignPlayerTeam=async(pid,teamNum)=>{
    const key = `team-${teamCount}-${pid}`
    setTeamAssignments(p=>({...p,[key]:teamNum}))
    try{
      const{data:sq}=await supabase.from('squad').select('group_assignments').eq('id',pid).single()
      const existing = (sq && sq.group_assignments) || {}
      const updated = {...existing, [`team-${teamCount}`]: teamNum}
      await supabase.from('squad').update({group_assignments:updated}).eq('id',pid)
    }catch(e){console.error('team assign save:',e)}
  }
  const saveSkill=async(pid,skill,level)=>{
    const k=pid+'-'+skill
    setSkillsData(p=>({...p,[k]:level}))
    try{
      if(level===0){await supabase.from('player_skills').delete().eq('player_id',pid).eq('skill',skill)}
      else{await supabase.from('player_skills').upsert({player_id:pid,skill,level},{onConflict:'player_id,skill'})}
    }catch(e){console.error('skill save:',e)}
  }
  const saveProgress=async(pid,did,level)=>{setProgressData(p=>({...p,[pid+'-'+did]:level}));try{if(level===0){await supabase.from('player_progress').delete().eq('player_id',pid).eq('drill_id',did)}else{await supabase.from('player_progress').upsert({player_id:pid,drill_id:did,level},{onConflict:'player_id,drill_id'})}}catch(e){}}

  const currentWeek=(()=>{
    if(!seasonStart)return 1
    const s=parseLocalDate(seasonStart),t=new Date()
    s.setHours(0,0,0,0);t.setHours(0,0,0,0)
    if(t<s)return 1
    let week=Math.floor((t-s)/(1000*60*60*24*7))+1
    while(true){
      const sessionDate=new Date(s); sessionDate.setDate(sessionDate.getDate()+(week-1)*7); sessionDate.setHours(0,0,0,0)
      if(t>sessionDate){week+=1}else{break}
    }
    return week
  })()

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
              <button onClick={()=>setShowUrlModal(true)} className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg transition-opacity hover:opacity-80" style={{background:N.bg}} title="Share app link">⚽</button>
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
                {[{id:'drills',label:'📋 Drills'},{id:'home-manager',label:'🏠 Home',badge:publishedCount>0?publishedCount:null},{id:'squad',label:'👥 Squad'},{id:'planner',label:'📅 Planner'}].map(tab=>(
                  <button key={tab.id} onClick={()=>setView(tab.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all relative" style={view===tab.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                    {tab.label}
                    {tab.badge&&<span className="absolute -top-1 -right-1 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center font-black" style={{background:N.bg,fontSize:'9px'}}>{tab.badge}</span>}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {[{id:'season',label:'📊 Season'},{id:'match',label:'⚽ Match'},{id:'status',label:'🔔 Status'},{id:'faw',label:'WAL FAW'}].map(tab=>(
                  <button key={tab.id} onClick={()=>setView(tab.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all" style={view===tab.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      {showUrlModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-1">🔗 Share App Link</h3>
            <p className="text-xs text-gray-400 mb-4">Copy the link below to share with coaches or parents, or add it to your home screen.</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 mb-4 border border-gray-200">
              <span className="flex-1 text-sm text-gray-700 font-mono break-all">{SITE_URL}</span>
            </div>
            <div className="space-y-2">
              <button onClick={()=>{navigator.clipboard.writeText(SITE_URL).then(()=>{setShowUrlModal(false)}).catch(()=>{})}}
                className="w-full text-white font-bold py-2.5 rounded-xl text-sm" style={{background:N.bg}}>
                📋 Copy Link
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent('Clydach Juniors coaching hub -- tap to open:\n'+SITE_URL)}`}
                target="_blank" rel="noreferrer"
                onClick={()=>setShowUrlModal(false)}
                className="w-full text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center" style={{background:'#16a34a'}}>
                📲 Share via WhatsApp
              </a>
              <button onClick={()=>setShowUrlModal(false)}
                className="w-full border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">
                Close
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">To save to home screen: tap Share in Safari then "Add to Home Screen"</p>
          </div>
        </div>
      )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {isCoach&&view==='planner'&&<TrainingPlanner drills={drills} seasonStart={seasonStart} preSeasonStart={preSeasonStart} onSeasonStartChange={saveSeasonStart} dateOverrides={dateOverrides} onDateOverride={(wk,date)=>setDateOverrides(p=>({...p,[wk]:date}))} onDateClear={(wk)=>setDateOverrides(p=>{const n={...p};delete n[wk];return n})} squad={squad} groupAssignments={groupAssignments} groupCount={groupCount}/>}
        {isCoach&&view==='home-manager'&&<HomeSessionManager drills={drills} homeSession={homeSession} onSave={saveHomeSession} matchNotes={matchNotes} currentWeek={currentWeek}/>}
        {isCoach&&view==='status'&&<SessionStatusManager sessionStatus={sessionStatus} onSave={saveSessionStatus}/>}
        {isCoach&&view==='match'&&<MatchDayNotes weekNum={matchWeek} setWeekNum={setMatchWeek} currentWeek={currentWeek} matchNotes={matchNotes} onSave={saveMatchNote} squad={squad} matchSquad={matchSquad} onSaveMatchSquad={saveMatchSquad} preferredTeamFormat={preferredTeamFormat}/>}
        {isCoach&&view==='squad'&&<SquadManager currentWeek={squadWeek} setWeekNum={setSquadWeek} currentWeekNum={currentWeek} squad={squad} attendance={attendance} onToggle={toggleAttendance} onAdd={addSquadPlayer} onRemove={removeSquadPlayer} onUpdatePos={updatePlayerPosition} playerNotes={playerNotes} onSaveNote={savePlayerNote} drills={drills} progressData={progressData} onSaveProgress={saveProgress} skillsData={skillsData} onSaveSkill={saveSkill} groupCount={groupCount} onGroupCountChange={saveGroupCount} groupAssignments={groupAssignments} onAssignGroup={assignPlayerGroup} preferredTeamFormat={preferredTeamFormat} preferredFormation={preferredFormation} onSaveFormationPref={saveFormationPref} teamCount={teamCount} onSaveTeamCount={saveTeamCount} teamAssignments={teamAssignments} onAssignTeam={assignPlayerTeam}/>}
        {isCoach&&view==='faw'&&<FAWReference/>}
        {isCoach&&view==='season'&&<SeasonOverview seasonStart={seasonStart} preSeasonStart={preSeasonStart} onSeasonStartChange={saveSeasonStart} onPreSeasonStartChange={savePreSeasonStart} matchNotes={matchNotes} currentWeek={currentWeek} onWeekSelect={(w)=>setView('planner')}/>}
        {!isCoach&&<ParentView sessionStatus={sessionStatus} matchNotes={matchNotes} drills={drills} homeSession={homeSession} seasonStart={seasonStart}/>}

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
