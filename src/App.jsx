import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { SEED_DRILLS } from './drills'

// ─── Theme ────────────────────────────────────────────────────────────────────
// Primary navy: #1e3a5f  Hover navy: #152d4a  Light navy bg: #eef1f7
const N = { bg:'#1e3a5f', hover:'#152d4a', light:'#eef1f7', border:'#1e3a5f', text:'#1e3a5f' }

const CATEGORIES = ['Strength & Conditioning', 'Passing', 'Tackling', 'Attacking', 'Age Group Changes']
const AGE_GROUPS = ['U12', 'U13', 'U14', 'U15']
const COACH_PIN = '1234'
const SITE_URL = 'https://coaching-hub-virid.vercel.app'

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
  const P = (cx,cy,r=10,fill=accent)=><circle cx={cx} cy={cy} r={r} fill={fill} stroke="#fff" strokeWidth="1.5"/>
  const Ball = (cx,cy)=><circle cx={cx} cy={cy} r="7" fill="white" opacity="0.9"/>
  const Arr = (id,col)=><defs><marker id={id} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={col}/></marker></defs>
  const Goal = (x,y,w=48,h=22)=><rect x={x} y={y} width={w} height={h} fill="none" stroke="white" strokeWidth="2"/>
  const overlays = {
    // ── PASSING ──
    rondo: <>{[0,51,103,154,205,257,309].map((a,i)=>{const r=68,cx=100+r*Math.cos((a-90)*Math.PI/180),cy=100+r*Math.sin((a-90)*Math.PI/180);return P(cx,cy,10,accent)})} {P(83,88,10,'#ef4444')}{P(117,112,10,'#ef4444')}{Ball(100,100)}{[[100,100,32,32],[100,100,168,32],[100,100,168,168]].map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6"/>)}</>,
    wall: <><rect x="10" y="85" width="8" height="30" fill="white" opacity="0.8"/><rect x="10" y="82" width="40" height="6" fill={accent} opacity="0.6"/>{P(80,100)}{Ball(30,100)}<path d="M72,100 L38,100" stroke={accent} strokeWidth="2" strokeDasharray="4,2"/><path d="M18,100 Q18,60 80,60" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2" opacity="0.5"/></>,
    triangle: <>{[[55,155],[145,155],[100,45]].map(([x,y],i)=>P(x,y))}{P(100,105,9,'#ef4444')}{Ball(100,155)}<path d="M55,155 L145,155 L100,45 Z" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.5"/>{[[55,155],[145,155],[100,45]].map(([x,y],i)=><line key={i} x1={x} y1={y} x2={100} y2={105} stroke={accent} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.4"/>)}</>,
    gates: <>{[[35,80],[35,120],[85,65],[85,135],[135,75],[135,125]].map(([x,y],i)=><rect key={i} x={x-4} y={y-4} width="8" height="8" fill={accent} stroke="#fff" strokeWidth="1"/>)}{P(170,100)}<path d="M162,100 L140,90" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2"/><path d="M162,100 L88,68" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2" opacity="0.7"/></>,
    '4goal': <><rect x="15" y="90" width="20" height="20" fill="none" stroke="white" strokeWidth="2"/><rect x="165" y="90" width="20" height="20" fill="none" stroke="white" strokeWidth="2"/><rect x="90" y="15" width="20" height="20" fill="none" stroke="white" strokeWidth="2"/><rect x="90" y="165" width="20" height="20" fill="none" stroke="white" strokeWidth="2"/>{[[65,75],[135,75],[75,130],[130,130]].map(([x,y],i)=>P(x,y,9,i<2?accent:'#ef4444'))}{Ball(100,100)}</>,
    line: <>{[30,75,120,165].map((x,i)=>P(x,70,9,i%2===0?accent:'#ef4444'))}{[30,75,120,165].map((x,i)=>P(x,130,9,i%2===0?accent:'#ef4444'))}<path d="M30,70 L75,130" stroke="white" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.5"/><path d="M75,70 L30,70" stroke={accent} strokeWidth="2" strokeDasharray="4,2"/>{Ball(52,100)}</>,
    switch: <><path d="M20,140 L180,60" stroke={accent} strokeWidth="2.5" strokeDasharray="8,3"/>{P(20,140)}{P(100,100)}{P(180,60)}<Arr id="sw1" col={accent}/><path d="M100,100 L175,63" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#sw1)"/>{Ball(100,100)}</>,
    square: <><rect x="40" y="40" width="120" height="120" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5"/>{[[40,40],[160,40],[160,160],[40,160]].map(([x,y],i)=>P(x,y,9,i%2===0?accent:'#ef4444'))}<Arr id="sq1" col={accent}/><path d="M49,40 L151,40" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#sq1)"/>{Ball(100,100)}</>,
    blind: <>{P(40,80)}{P(40,120)}{P(130,60,10,'#ef4444')}{P(160,100)}<path d="M40,80 L40,120" stroke={accent} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.4"/><path d="M40,100 L125,63" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2"/><Arr id="bl1" col="#fff"/><path d="M130,60 Q160,70 157,92" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#bl1)"/>{Ball(80,100)}</>,
    lanes: <><line x1="73" y1="15" x2="73" y2="185" stroke={accent} strokeWidth="1" strokeDasharray="5,3" opacity="0.5"/><line x1="127" y1="15" x2="127" y2="185" stroke={accent} strokeWidth="1" strokeDasharray="5,3" opacity="0.5"/>{P(40,150)}{P(100,120)}{P(155,80)}<Goal x={76} y={15} w={48} h={20}/><path d="M40,150 L100,120" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2"/><path d="M100,120 L155,80" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2"/>{Ball(40,150)}</>,
    'give&go': <>{P(35,100)}{P(100,60)}{P(165,100)}<path d="M44,97 L91,63" stroke={accent} strokeWidth="2" strokeDasharray="4,2"/><Arr id="gg1" col={accent}/><path d="M109,63 L156,97" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#gg1)"/><path d="M35,112 Q100,160 165,112" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.5"/>{Ball(100,100)}</>,
    triangle2: <>{[[55,155],[145,155],[100,45]].map(([x,y],i)=>P(x,y))}{Ball(100,115)}<path d="M55,155 L145,155 L100,45 Z" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5"/></>,
    // ── TACKLING ──
    tackle: <>{P(68,100,12)}{P(132,100,12,'#ef4444')}{Ball(100,114)}<path d="M80,100 L120,100" stroke="white" strokeWidth="1.5" strokeDasharray="4,3"/><Arr id="ar1" col={accent}/><path d="M123,88 Q110,72 100,80" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#ar1)"/></>,
    jockey: <><rect x="55" y="30" width="90" height="140" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/>{P(100,160)}{P(100,75,10,'#ef4444')}<path d="M100,150 L100,95" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2"/><Arr id="jk1" col="white"/><path d="M92,75 Q70,60 68,100" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#jk1)"/>{Ball(100,130)}</>,
    '1v1box': <><rect x="40" y="40" width="120" height="120" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="5,3"/>{P(75,75)}{P(125,125,10,'#ef4444')}{Ball(100,100)}<Arr id="bx1" col={accent}/><path d="M75,86 Q75,100 85,108" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#bx1)"/></>,
    press: <>{[[50,50],[100,40],[150,50]].map(([x,y],i)=>P(x,y,10,'#ef4444'))}{[[65,130],[135,130]].map(([x,y],i)=>P(x,y))}{P(100,155)}<Arr id="pr1" col={accent}/>{[[50,50],[100,40],[150,50]].map(([x,y],i)=><path key={i} d={`M${x},${y+11} L${[65,100,135][i]},119`} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#pr1)"/>)}{Ball(100,90)}</>,
    channel: <><rect x="55" y="20" width="90" height="160" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/>{P(100,160)}{P(100,80,10,'#ef4444')}<Arr id="ch1" col="white"/><path d="M108,80 Q140,80 140,130 Q140,160 108,160" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#ch1)"/>{Ball(100,140)}</>,
    recovery: <>{P(50,50)}{P(150,50,10,'#ef4444')}<path d="M50,50 L150,50" stroke="white" strokeWidth="1" strokeDasharray="3,2" opacity="0.4"/><Arr id="rc1" col={accent}/><Arr id="rc2" col="#ef4444"/><path d="M50,61 L50,139" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#rc1)"/><path d="M150,61 L150,139" fill="none" stroke="#ef4444" strokeWidth="2" markerEnd="url(#rc2)"/>{P(50,145)}{P(150,145,10,'#ef4444')}{Ball(170,145)}</>,
    defshape: <><line x1="15" y1="135" x2="185" y2="135" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.5"/><line x1="15" y1="95" x2="185" y2="95" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/>{[[30,135],[77,135],[123,135],[170,135]].map(([x,y],i)=>P(x,y,9))}{[[55,95],[100,90],[145,95]].map(([x,y],i)=>P(x,y,9))}{[[55,50],[145,50]].map(([x,y],i)=>P(x,y,9,'#ef4444'))}</>,
    intercept: <>{P(40,80)}{P(40,130)}{P(160,105,10,'#ef4444')}{P(100,80)}<path d="M40,80 L40,130" stroke={accent} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.4"/><path d="M40,105 L91,105" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2"/><Arr id="ic1" col="#ef4444"/><path d="M160,105 L109,80" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#ic1)"/>{Ball(100,105)}</>,
    '2v2': <>{[[60,60],[140,60]].map(([x,y],i)=>P(x,y))}{[[60,140],[140,140]].map(([x,y],i)=>P(x,y,10,'#ef4444'))}<rect x="30" y="30" width="140" height="140" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/>{Ball(100,100)}</>,
    slide: <>{P(80,90)}{P(140,110,12,'#ef4444')}<path d="M94,97 L128,107" stroke={accent} strokeWidth="2.5"/><rect x="55" y="115" width="70" height="8" fill={accent} opacity="0.3" rx="2"/>{Ball(110,100)}</>,
    gk: <><rect x="76" y="158" width="48" height="28" fill="none" stroke="white" strokeWidth="2"/>{P(100,172,9,'#94a3b8')}<Arr id="gk1" col="white"/><Arr id="gk2" col={accent}/><path d="M100,161 L55,110" fill="none" stroke="white" strokeWidth="2" markerEnd="url(#gk1)"/><path d="M100,161 L145,110" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#gk2)"/>{P(50,105)}{P(150,105)}</>,
    // ── ATTACKING ──
    '3v2': <>{Goal(76,158,48,22)}{[[58,48],[100,38],[142,52]].map(([x,y],i)=>P(x,y))}{[[78,112],[122,112]].map(([x,y],i)=>P(x,y,10,'#ef4444'))}{P(100,172,8,'#94a3b8')}{Ball(100,62)}<path d="M58,48 Q79,55 100,62" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3"/><path d="M100,62 Q121,57 142,52" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3"/></>,
    cross: <>{Goal(76,15,48,22)}{P(175,100)}{P(85,55)}{P(115,45)}{P(100,170,8,'#94a3b8')}<Arr id="cr1" col={accent}/><path d="M168,100 Q130,60 120,45" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#cr1)"/><path d="M175,100 L175,155 L20,155 L20,100" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.3"/></>,
    dribble: <><rect x="55" y="20" width="90" height="160" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/>{P(100,155)}{P(100,65,10,'#ef4444')}<Arr id="dr1" col={accent}/><path d="M100,144 Q115,120 100,90 Q85,75 100,76" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#dr1)"/>{Ball(100,130)}</>,
    counter: <>{Goal(76,15,48,22)}{[[40,155],[80,165],[120,165],[160,155]].map(([x,y],i)=>P(x,y))}{[[75,105],[125,105]].map(([x,y],i)=>P(x,y,10,'#ef4444'))}<Arr id="ct1" col={accent}/>{[[40,155],[80,165],[120,165],[160,155]].map(([x,y],i)=><path key={i} d={`M${x},${y-11} L${x},46`} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2"/>)}{Ball(100,145)}</>,
    overlap: <>{P(40,100)}{P(100,100)}{P(160,50)}<Arr id="ov1" col={accent}/><Arr id="ov2" col="white"/><path d="M40,100 Q20,50 155,43" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5,3" markerEnd="url(#ov1)"/><path d="M100,100 L152,53" fill="none" stroke="white" strokeWidth="1.5" markerEnd="url(#ov2)"/>{Ball(100,100)}</>,
    shootpress: <>{Goal(76,15,48,22)}{P(100,120)}{P(100,165,10,'#ef4444')}<Arr id="sp1" col={accent}/><path d="M100,109 L100,46" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#sp1)"/><Arr id="sp2" col="#ef4444"/><path d="M100,154 L100,131" fill="none" stroke="#ef4444" strokeWidth="2" markerEnd="url(#sp2)"/>{Ball(100,120)}</>,
    combo: <>{Goal(76,15,48,22)}{P(35,130)}{P(100,100)}{P(165,130)}<Arr id="cb1" col={accent}/><path d="M44,127 L91,103" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#cb1)"/><Arr id="cb2" col={accent}/><path d="M109,103 L156,127" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#cb2)"/><Arr id="cb3" col="white"/><path d="M100,89 L100,46" fill="none" stroke="white" strokeWidth="2" markerEnd="url(#cb3)"/>{Ball(100,100)}</>,
    firsttouch: <>{Goal(76,15,48,22)}{P(100,130)}<Arr id="ft1" col={accent}/><path d="M100,119 L100,46" fill="none" stroke={accent} strokeWidth="2.5" markerEnd="url(#ft1)"/>{P(35,80,8,'#94a3b8')}<path d="M43,83 L92,128" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,2"/>{Ball(100,130)}</>,
    wideattack: <>{Goal(76,15,48,22)}{P(20,100)}{P(180,100)}{P(100,60)}{P(85,130)}{P(115,130)}<Arr id="wa1" col={accent}/><Arr id="wa2" col={accent}/><path d="M20,100 Q20,40 90,35" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#wa1)"/><path d="M180,100 Q180,40 110,35" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#wa2)"/></>,
    setpiece: <>{Goal(76,15,48,22)}{P(30,185)}{P(65,130)}{P(100,120)}{P(135,130)}{P(160,160)}<path d="M30,185 L65,135" stroke={accent} strokeWidth="2" strokeDasharray="5,2"/><Arr id="set1" col={accent}/><path d="M65,130 L95,125" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#set1)"/></>,
    '1v1finish': <>{Goal(76,15,48,22)}{P(100,120)}{P(100,160,10,'#ef4444')}<Arr id="1v1" col={accent}/><path d="M100,109 L100,46" fill="none" stroke={accent} strokeWidth="2.5" markerEnd="url(#1v1)"/><Arr id="1v1d" col="#ef4444"/><path d="M100,149 L100,131" fill="none" stroke="#ef4444" strokeWidth="2" markerEnd="url(#1v1d)"/>{Ball(100,120)}</>,
    thirdman: <>{P(30,160)}{P(100,120)}{P(170,70)}<Arr id="tm1" col={accent}/><Arr id="tm2" col={accent}/><Arr id="tm3" col="white"/><path d="M39,157 L91,123" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#tm1)"/><path d="M109,123 L161,73" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#tm2)"/><path d="M155,160 Q190,120 177,79" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#tm3)"/>{Ball(100,120)}</>,
    '2v1': <>{Goal(76,15,48,22)}{P(65,120)}{P(135,120)}{P(100,160,10,'#ef4444')}<Arr id="2v1a" col={accent}/><Arr id="2v1b" col={accent}/><path d="M65,109 L85,46" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#2v1a)"/><path d="M135,109 L115,46" fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#2v1b)"/>{Ball(100,140)}</>,
    // ── S&C ──
    weave: <>{[1,2,3,4,5,6].map(i=><polygon key={i} points={`${25*i+5},${i%2===0?75:125} ${25*i-3},${i%2===0?92:108} ${25*i+13},${i%2===0?92:108}`} fill={accent} stroke="#fff" strokeWidth="1"/>)}<path d="M12,155 Q37,75 62,115 Q87,155 112,75 Q137,35 162,95" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="6,3"/>{P(12,155,9)}</>,
    ladder: <>{[0,1,2,3,4].map(i=><>
      <line key={`v${i}`} x1={60+i*20} y1="30" x2={60+i*20} y2="170" stroke={accent} strokeWidth="2" opacity="0.6"/>
    </>)}{[0,1,2,3,4,5,6].map(i=><line key={`h${i}`} x1="60" y1={30+i*20} x2="140" y2={30+i*20} stroke={accent} strokeWidth="2" opacity="0.6"/>)}{P(30,170,9)}<Arr id="lad1" col="white"/><path d="M30,159 L30,40" fill="none" stroke="white" strokeWidth="2" markerEnd="url(#lad1)"/></>,
    core: <><ellipse cx="100" cy="100" rx="60" ry="25" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5"/><rect x="40" y="92" width="120" height="16" fill={accent} opacity="0.2" rx="8"/>{P(40,100,8)}{P(160,100,8)}{P(100,75,8)}{P(100,125,8)}<text x="100" y="104" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">CORE</text></>,
    warmup: <>{[[100,30],[150,65],[165,120],[130,165],[70,165],[35,120],[50,65]].map(([x,y],i)=>P(x,y,7,i===0?'white':accent))}<Arr id="wu1" col={accent}/><path d="M100,30 Q160,30 165,109" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#wu1)"/></>,
    ballmastery: <><circle cx="100" cy="120" r="18" fill="white" opacity="0.15" stroke="white" strokeWidth="1"/><circle cx="100" cy="120" r="9" fill="white" opacity="0.9"/>{[[75,95],[125,95]].map(([x,y],i)=>P(x,y,8))}<path d="M75,95 L92,113" stroke={accent} strokeWidth="1.5"/><path d="M125,95 L108,113" stroke={accent} strokeWidth="1.5"/></>,
    reaction: <>{P(100,160)}<Arr id="re1" col={accent}/><path d="M100,149 L100,70" fill="none" stroke={accent} strokeWidth="2.5" markerEnd="url(#re1)"/>{P(100,60,9,'#f59e0b')}<line x1="100" y1="45" x2="100" y2="30" stroke="#f59e0b" strokeWidth="2"/><line x1="88" y1="52" x2="78" y2="45" stroke="#f59e0b" strokeWidth="2"/><line x1="112" y1="52" x2="122" y2="45" stroke="#f59e0b" strokeWidth="2"/></>,
    plyo: <><rect x="65" y="110" width="70" height="30" fill={accent} opacity="0.4" rx="4"/><rect x="60" y="138" width="80" height="8" fill={accent} opacity="0.6" rx="2"/>{P(100,90)}<Arr id="pl1" col={accent}/><Arr id="pl2" col="white"/><path d="M100,79 L100,50" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#pl1)"/><path d="M108,90 Q130,100 130,110" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#pl2)"/></>,
    speedgates: <>{[[60,50],[140,50],[60,150],[140,150],[100,100]].map(([x,y],i)=><><rect key={`g${i}`} x={x-4} y={y-12} width="8" height="24" fill={accent} stroke="#fff" strokeWidth="1" rx="2"/></>)}<Arr id="sg1" col="white"/><path d="M30,180 L55,155 L55,55 L95,88 L145,55 L145,155 L170,180" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="5,2" markerEnd="url(#sg1)"/></>,
    shuttle: <>{[0,1,2,3].map(i=><><line key={`s${i}`} x1={35+i*45} y1="50" x2={35+i*45} y2="170" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5"/></>)}<Arr id="sh1" col={accent}/><Arr id="sh2" col="white"/><path d="M35,160 L35,55" fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#sh1)"/><path d="M80,55 L80,160" fill="none" stroke="white" strokeWidth="2" markerEnd="url(#sh2)"/>{P(35,165,8)}</>,
    // ── AGE GROUP / TACTICAL ──
    positions: <>{P(100,178,9,'#94a3b8')}{[[42,148],[80,143],[120,143],[158,148]].map(([x,y],i)=>P(x,y,9,N.bg))}{[[62,108],[100,103],[138,108]].map(([x,y],i)=>P(x,y,9,'#8b5cf6'))}{[[45,62],[100,45],[155,62]].map(([x,y],i)=>P(x,y,9,accent))}</>,
    '9v9': <>{P(100,178,9,'#94a3b8')}{[[35,148],[78,143],[122,143],[165,148]].map(([x,y],i)=>P(x,y,9,N.bg))}{[[55,108],[100,103],[145,108]].map(([x,y],i)=>P(x,y,9,'#8b5cf6'))}{P(100,58,10,accent)}<Goal x={76} y={15} w={48} h={20}/><Goal x={76} y={165} w={48} h={20}/></>,
    offside: <><line x1="100" y1="15" x2="100" y2="185" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,3"/>{P(130,80)}{P(70,80,10,'#ef4444')}{P(115,80,10,'#94a3b8')}<text x="130" y="73" fill="white" fontSize="9" textAnchor="middle">✓</text><text x="70" y="73" fill="#f59e0b" fontSize="9" textAnchor="middle">✓</text>{Ball(50,110)}<Goal x={76} y={15} w={48} h={20}/></>,
    tactical: <><line x1="15" y1="100" x2="185" y2="100" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.5"/>{[[35,60],[100,50],[165,60],[55,140],[145,140]].map(([x,y],i)=>P(x,y,9,i<3?accent:N.bg))}<path d="M35,60 L100,50 L165,60" fill="none" stroke={accent} strokeWidth="1" opacity="0.4"/><path d="M55,140 L145,140" fill="none" stroke={N.bg} strokeWidth="1" opacity="0.4"/></>,
    leadership: <>{P(100,60,12,accent)}{[[55,115],[145,115],[70,165],[130,165]].map(([x,y],i)=>P(x,y,9))}<path d="M100,72 L55,105" stroke="white" strokeWidth="1.5" opacity="0.5"/><path d="M100,72 L145,105" stroke="white" strokeWidth="1.5" opacity="0.5"/><path d="M55,126 L70,155" stroke="white" strokeWidth="1.5" opacity="0.5"/><path d="M145,126 L130,155" stroke="white" strokeWidth="1.5" opacity="0.5"/></>,
    default: <>{[[60,70],[140,70],[60,130],[140,130]].map(([x,y],i)=>P(x,y))}<circle cx="100" cy="100" r="20" fill="none" stroke={accent} strokeWidth="2" opacity="0.4"/>{Ball(100,100)}</>,
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
  const [screen, setScreen] = useState('home') // 'home' | 'coach'
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const check = () => { if (pin === COACH_PIN) { onAuth('coach') } else { setErr('Incorrect PIN. Try again.'); setPin('') } }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{background:N.bg}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{background:N.bg}}>⚽</div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Clydach Juniors</h1>
          <p className="text-sm text-gray-500">Coaching Hub</p>
        </div>

        {/* Landing — two buttons */}
        {screen === 'home' && (
          <div className="px-8 pb-8 space-y-3">
            <button onClick={()=>setScreen('coach')}
              onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}
              className="w-full text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-3 text-base"
              style={navyBtn}>
              <span className="text-xl">👨‍🏫</span> Coach Login
            </button>
            <button onClick={()=>onAuth('parent')}
              className="w-full text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-3 text-base"
              style={{background:'#2d5a8e'}}
              onMouseEnter={e=>e.currentTarget.style.background='#243f6b'}
              onMouseLeave={e=>e.currentTarget.style.background='#2d5a8e'}>
              <span className="text-xl">👪</span> Player / Parent
            </button>
          </div>
        )}

        {/* Coach PIN screen */}
        {screen === 'coach' && (
          <div className="px-8 pb-8">
            <button onClick={()=>{setScreen('home');setPin('');setErr('')}}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4 mx-auto transition-colors">
              ‹ Back
            </button>
            <p className="text-sm font-semibold text-gray-700 mb-3">Enter your coach PIN</p>
            <input type="password" value={pin} onChange={e=>setPin(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&check()}
              placeholder="••••" maxLength={6} autoFocus
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-bold focus:outline-none mb-3"
              onFocus={e=>e.target.style.borderColor=N.bg}
              onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
            {err && <p className="text-red-500 text-xs mb-3">{err}</p>}
            <button onClick={check} onMouseEnter={navyBtnHover} onMouseLeave={navyBtnLeave}
              className="w-full text-white font-bold py-3 rounded-xl transition-colors" style={navyBtn}>
              Sign In
            </button>
          </div>
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
        {isCoach && drill.progression && <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4"><h4 className="text-sm font-semibold text-purple-800 mb-1">⬆️ Progression — Make it Harder</h4><p className="text-sm text-purple-700 leading-relaxed">{drill.progression}</p></div>}
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
  const [form,setForm]=useState({title:'',category:CATEGORIES[0],age_groups:['U12'],duration:'',players:'',description:'',coach_notes:'',progression:'',home_ready:false,diagram:'default'})
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
          <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">⬆️ Progression <span className="text-gray-400 font-normal">(how to make it harder)</span></label><textarea value={form.progression||''} onChange={e=>set('progression',e.target.value)} rows={2} placeholder="e.g. Reduce space, add a defender, set a time limit..." className={`${inputCls} resize-none`} onFocus={focusNavy} onBlur={blurGray}/></div>
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
    ?`⚽ *Training Drill — ${drill.title}*\n\n📋 ${drill.category} | ${(drill.age_groups||[]).join(', ')}\n⏱ ${drill.duration} | 👥 ${drill.players}\n\n${drill.description}${drill.coach_notes?`\n\n📋 *Coach Notes:* ${drill.coach_notes}`:''}\n\n— Clydach Juniors\n🔗 ${SITE_URL}`
    :`⚽ *Home Practice — ${drill.title}*\n\nHere's a drill for your child to try at home this week!\n\n📋 ${drill.category} | ${(drill.age_groups||[]).join(', ')}\n⏱ ${drill.duration}\n\n${drill.description}\n\n💡 A garden or park works perfectly — bottles or jumpers for cones!\n\n— Coaches\n🔗 ${SITE_URL}`
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

// Normalise age_groups — Supabase may return as array OR as string "{U12,U13}"
function parseAges(age_groups) {
  if (!age_groups) return []
  if (Array.isArray(age_groups)) return age_groups
  return String(age_groups).replace(/[{}"]/g, '').split(',').map(s => s.trim()).filter(Boolean)
}

function pickDrill(drills, cat, weekNum, ageFilter) {
  const pool = drills.filter(d =>
    d.category === cat && (ageFilter === 'All' || parseAges(d.age_groups).includes(ageFilter))
  )
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
  lines.push(`— Coaches\n🔗 ${SITE_URL}`)
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

function TrainingPlanner({ drills, seasonStart, onSeasonStartChange, initialWeek, onWeekChange }) {
  // Auto-calculate current week number based on today's date and season start
  const calcCurrentWeek = (start) => {
    if (!start) return 1
    const startDate = new Date(start)
    const today = new Date()
    today.setHours(0,0,0,0)
    startDate.setHours(0,0,0,0)
    if (today < startDate) return 1
    const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / 7) + 1
  }

  // ALL useState hooks must come before any useEffect — React rules of hooks
  const [weekNum,setWeekNum]=useState(()=>initialWeek||calcCurrentWeek(seasonStart))
  const [ageFilter,setAgeFilter]=useState('U12')
  const [overrides,setOverrides]=useState({})
  const [swapTarget,setSwapTarget]=useState(null)
  const [sessionNotes,setSessionNotes]=useState('')
  const [shareOpen,setShareOpen]=useState(false)
  const [detailDrill,setDetailDrill]=useState(null)
  const [overridesLoaded,setOverridesLoaded]=useState(false)
  const [dateOverrides,setDateOverrides]=useState({})
  const [editingDate,setEditingDate]=useState(false)
  const [tempDate,setTempDate]=useState('')

  const inputCls="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
  const focusNavy=e=>e.target.style.borderColor=N.bg
  const blurGray=e=>e.target.style.borderColor='#d1d5db'

  const changeWeek = (fn) => {
    setWeekNum(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn
      if(onWeekChange) onWeekChange(next)
      return next
    })
  }

  // When season start changes, jump to correct week
  useEffect(()=>{
    if(!initialWeek) setWeekNum(calcCurrentWeek(seasonStart))
  },[seasonStart])

  // Load all session overrides from Supabase on mount
  useEffect(()=>{
    async function loadOverrides(){
      try {
        const { data, error } = await supabase.from('session_overrides').select('*')
        if (error) throw error
        if (data && data.length > 0) {
          const rebuilt = {}
          data.forEach(row => {
            const key = `${row.week_num}-${row.age_filter}`
            if (!rebuilt[key]) rebuilt[key] = {}
            rebuilt[key][row.block_key] = row.drill_id
          })
          setOverrides(rebuilt)
        }
      } catch(e) { console.error('Failed to load overrides:', e) }
      setOverridesLoaded(true)
    }
    loadOverrides()
  },[])

  // Calculate this week's date from season start + (weekNum-1) * 7 days
  const getAutoDate = (wNum) => {
    if (!seasonStart) return ''
    const d = new Date(seasonStart)
    d.setDate(d.getDate() + (wNum - 1) * 7)
    return d.toISOString().split('T')[0]
  }

  // Use manual override if set, otherwise auto-calculate
  const sessionDate = dateOverrides[weekNum] || getAutoDate(weekNum)
  const isDateOverridden = !!dateOverrides[weekNum]

  // Format date nicely for display e.g. "Tue 14 Jan 2025"
  const formatDate = (iso) => {
    if (!iso) return null
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
  }

  // Push all future weeks forward by 7 days from a given week
  const pushFutureWeeks = (fromWeek) => {
    setDateOverrides(prev => {
      const updated = {...prev}
      // Push all existing overrides from this week onwards
      for (let w = fromWeek; w <= 40; w++) {
        const base = updated[w] || getAutoDate(w)
        if (base) {
          const d = new Date(base)
          d.setDate(d.getDate() + 7)
          updated[w] = d.toISOString().split('T')[0]
        }
      }
      return updated
    })
    setEditingDate(false)
  }

  const clearDateOverride = (wNum) => {
    setDateOverrides(prev => { const u={...prev}; delete u[wNum]; return u })
    setEditingDate(false)
  }

  // Build auto session — resolve stored drill IDs back to drill objects
  const weekOverrides = overrides[`${weekNum}-${ageFilter}`] || {}
  const session = {}
  SESSION_BLOCKS.forEach(b => {
    if (b.fixed) return
    const overrideDrillId = weekOverrides[b.key]
    const overrideDrill = overrideDrillId ? drills.find(d => d.id === overrideDrillId) : null
    session[b.key] = overrideDrill || (b.cat ? pickDrill(drills, b.cat, weekNum, ageFilter) : null)
  })

  const handleSwap = async (key, drill) => {
    const okey = `${weekNum}-${ageFilter}`
    // Update local state immediately
    setOverrides(prev => ({ ...prev, [okey]: { ...(prev[okey]||{}), [key]: drill.id } }))
    setSwapTarget(null)
    // Save to Supabase
    try {
      await supabase.from('session_overrides').upsert({
        week_num: weekNum,
        age_filter: ageFilter,
        block_key: key,
        drill_id: drill.id
      }, { onConflict: 'week_num,age_filter,block_key' })
    } catch(e) { console.error('Failed to save override:', e) }
  }

  const clearOverride = async (key) => {
    const okey = `${weekNum}-${ageFilter}`
    setOverrides(prev => {
      const updated = { ...prev }
      if (updated[okey]) {
        delete updated[okey][key]
        if (Object.keys(updated[okey]).length === 0) delete updated[okey]
      }
      return updated
    })
    try {
      await supabase.from('session_overrides')
        .delete()
        .eq('week_num', weekNum)
        .eq('age_filter', ageFilter)
        .eq('block_key', key)
    } catch(e) { console.error('Failed to clear override:', e) }
  }

  const clearAllOverridesForWeek = async () => {
    const okey = `${weekNum}-${ageFilter}`
    setOverrides(prev => { const u={...prev}; delete u[okey]; return u })
    try {
      await supabase.from('session_overrides')
        .delete()
        .eq('week_num', weekNum)
        .eq('age_filter', ageFilter)
    } catch(e) { console.error('Failed to clear week overrides:', e) }
  }

  const swapBlock = SESSION_BLOCKS.find(b => b.key === swapTarget)

  // isOverridden checks if a block has been manually swapped for this week
  const isWeekOverridden = Object.keys(weekOverrides).length > 0

  return (
    <div>
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-sm">📅 1-Hour Session Planner</h2>
          <span className="text-xs font-semibold px-2 py-1 rounded-lg text-white" style={{background:N.bg}}>60 min</span>
        </div>

        {/* Week + Date + Age Group — all in one compact row */}
        <div className="grid grid-cols-2 gap-3 mb-3">

          {/* Week navigator with integrated date */}
          <div className="rounded-xl border p-2" style={{borderColor:N.bg+'33', background:N.light}}>

            {/* Week nav */}
            <div className="flex items-center gap-1 mb-2">
              <button onClick={()=>{changeWeek(w=>Math.max(1,w-1));setEditingDate(false)}}
                className="w-7 h-7 rounded-lg border border-gray-300 bg-white text-gray-600 font-bold text-sm hover:bg-gray-50 flex items-center justify-center">‹</button>
              <div className="flex-1 text-center font-bold text-gray-900 text-xs">Week {weekNum}</div>
              <button onClick={()=>{changeWeek(w=>w+1);setEditingDate(false)}}
                className="w-7 h-7 rounded-lg border border-gray-300 bg-white text-gray-600 font-bold text-sm hover:bg-gray-50 flex items-center justify-center">›</button>
            </div>

            {/* No season start yet — show picker + confirm button */}
            {!seasonStart && !editingDate && (
              <div>
                <p className="text-xs text-gray-400 text-center mb-1">Set Week 1 start date</p>
                <input type="date" value={tempDate} onChange={e=>setTempDate(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none mb-1"
                  style={{borderColor:N.bg}}/>
                <button onClick={()=>{if(tempDate){onSeasonStartChange(tempDate);setDateOverrides({});setTempDate('')}}}
                  disabled={!tempDate}
                  className="w-full text-xs py-1 rounded-lg font-semibold text-white disabled:opacity-40 transition-colors"
                  style={{background:N.bg}}>
                  ✓ Set Season Start
                </button>
              </div>
            )}

            {/* Season start set — show current week date */}
            {seasonStart && !editingDate && (
              <div>
                <div className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white font-semibold text-center mb-1"
                  style={{color:isDateOverridden?'#f59e0b':N.text}}>
                  {formatDate(sessionDate)}{isDateOverridden?' ✏️':''}
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>{setTempDate('');setEditingDate(true)}}
                    className="flex-1 text-xs py-1 rounded-lg border font-semibold"
                    style={{borderColor:N.bg+'44', color:N.text, background:'white'}}>
                    📅 Override
                  </button>
                  {isDateOverridden && (
                    <button onClick={()=>{clearDateOverride(weekNum);setTempDate('')}}
                      className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-400 hover:text-red-600"
                      title="Remove override for this week">
                      ✕
                    </button>
                  )}
                  {!isDateOverridden && (
                    <button onClick={()=>{onSeasonStartChange('');setDateOverrides({});setTempDate('')}}
                      className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-400 hover:text-red-600"
                      title="Clear all dates">
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Override mode — pick new date + push/reset */}
            {editingDate && (
              <div>
                <input type="date" value={tempDate} onChange={e=>setTempDate(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none mb-1"
                  style={{borderColor:N.bg}}/>
                <button onClick={()=>{if(tempDate){setDateOverrides(prev=>({...prev,[weekNum]:tempDate}));setEditingDate(false);setTempDate('')}}}
                  disabled={!tempDate}
                  className="w-full text-xs py-1 rounded-lg font-semibold text-white disabled:opacity-40 mb-1"
                  style={{background:N.bg}}>
                  ✓ Confirm Date
                </button>
                <div className="grid grid-cols-2 gap-1">
                  <button onClick={()=>{if(tempDate){setDateOverrides(prev=>{const u={...prev};for(let w=weekNum;w<=40;w++){const base=u[w]||getAutoDate(w);if(base){const d=new Date(base);d.setDate(d.getDate()+7);u[w]=d.toISOString().split('T')[0]}};return u});setEditingDate(false);setTempDate('')}}}
                    disabled={!tempDate}
                    className="text-xs py-1 rounded-lg font-semibold text-white disabled:opacity-40"
                    style={{background:'#f59e0b'}}>⏭️ Push +7d</button>
                  <button onClick={()=>{clearDateOverride(weekNum);setTempDate('')}}
                    className="text-xs py-1 rounded-lg font-semibold border text-red-500 border-red-200">🗑️ Reset</button>
                </div>
                <button onClick={()=>{setEditingDate(false);setTempDate('')}}
                  className="w-full text-xs py-0.5 mt-1 text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            )}

          </div>

          {/* Age group + notes stacked */}
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Age Group</label>
              <select value={ageFilter} onChange={e=>setAgeFilter(e.target.value)} className={inputCls} onFocus={focusNavy} onBlur={blurGray}>
                <option value="All">All Ages</option>
                {AGE_GROUPS.map(ag=><option key={ag}>{ag}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Notes</label>
              <input value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)} placeholder="e.g. Focus on pressing" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/>
            </div>
          </div>

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
                  {isOverridden && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{background:N.bg}}>Saved</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{timeOffset} min mark</span>
                  <span className="text-xs font-bold" style={{color:N.text}}>{block.time}</span>
                  {!block.fixed && <button onClick={()=>setSwapTarget(block.key)} className="text-xs font-semibold underline underline-offset-2 ml-1" style={{color:N.text}}>swap</button>}
                  {!block.fixed && isOverridden && <button onClick={()=>clearOverride(block.key)} className="text-xs text-red-400 hover:text-red-600 ml-1" title="Reset to auto drill">✕</button>}
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
      {isWeekOverridden && (
        <button onClick={clearAllOverridesForWeek}
          className="w-full mt-2 text-xs py-2 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 font-semibold transition-colors">
          🗑️ Reset Week {weekNum} to auto-generated drills
        </button>
      )}

      {/* Swap modal */}
      {swapTarget && swapBlock && (
        <Modal onClose={()=>setSwapTarget(null)} wide>
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{swapBlock.icon} Swap {swapBlock.label}</h2>
            <p className="text-sm text-gray-500 mb-4">Choose a different drill for this block:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {drills.filter(d => d.category === swapBlock.cat && (ageFilter==='All'||parseAges(d.age_groups).includes(ageFilter))).map(d => (
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
  const publish=async()=>{
    setSaving(true)
    await onSave({drill_ids:selected,message})
    setSaving(false)
    setSaved(true)
    setTimeout(()=>setSaved(false),3000)
  }
  const selectedDrills=drills.filter(d=>selected.includes(d.id))
  const shareText=()=>{
    const lines=[`🏠 *This Week's Home Skill Drills — Clydach Juniors*\n`]
    if(message) lines.push(`${message}\n`)
    selectedDrills.forEach((d,i)=>lines.push(`*Drill ${i+1}: ${d.title}*\n⏱ ${d.duration} | 👥 ${d.players}\n\n${d.description}`))
    lines.push(`\nGive these a go before next training! 💪\n— Coaches\n🔗 ${SITE_URL}`)
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
        <button onClick={publish} disabled={saving}
          className="flex-1 font-bold py-3 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
          style={saved?{background:N.light,color:N.text,border:`2px solid ${N.bg}44`}:navyBtn}
          onMouseEnter={e=>{if(!saved)e.currentTarget.style.background=N.hover}}
          onMouseLeave={e=>{if(!saved)e.currentTarget.style.background=N.bg}}>
          {saved?(selected.length===0?'✓ Cleared!':'✓ Published!'):saving?'Publishing…':selected.length===0?'🗑️ Clear Parent View':'🚀 Publish to Parents'}
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
          <p className="font-bold text-sm" style={{color:N.text}}>This Week's Home Skill Drills</p>
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


// ─── Session Status ───────────────────────────────────────────────────────────
function SessionStatusManager({ sessionStatus, onSave }) {
  const [form, setForm] = useState(sessionStatus)
  const [saved, setSaved] = useState(false)
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setSaved(false) }
  const save = async () => { await onSave(form); setSaved(true); setTimeout(()=>setSaved(false),2000) }
  const inputCls = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
  const whatsappText = form.status==='cancelled'
    ? `🚫 *Training CANCELLED*\n\nThis week's training session has been cancelled.\n\nWe'll be back next week — keep up the home skill drills in the meantime!\n\n— Coaches\n🔗 ${SITE_URL}`
    : `✅ *Training Reminder*\n\n📅 This week's session is ON\n${form.time?`⏰ ${form.time}\n`:''}${form.location?`📍 ${form.location}\n`:''}\nDon't forget boots, shin pads and water!\n\n— Coaches\n🔗 ${SITE_URL}`

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h2 className="font-bold text-gray-900 text-sm mb-3">🔔 Session Status</h2>
        <div className="flex gap-2 mb-4">
          {[{v:'on',label:'✅ Training ON'},{v:'cancelled',label:'🚫 Cancelled'}].map(o=>(
            <button key={o.v} onClick={()=>set('status',o.v)}
              className="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all"
              style={form.status===o.v?{background:o.v==='on'?'#16a34a':'#ef4444',color:'white',borderColor:o.v==='on'?'#16a34a':'#ef4444'}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
              {o.label}
            </button>
          ))}
        </div>
        {form.status==='on' && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Time</label>
              <input value={form.time} onChange={e=>set('time',e.target.value)} placeholder="e.g. 6:00pm" className={inputCls} onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/></div>
            <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Location</label>
              <input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g. Clydach Park" className={inputCls} onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/></div>
          </div>
        )}
        {/* Show to parents toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl mb-3"
          style={{background:form.show_parents?N.light:'#f9fafb',border:`1px solid ${form.show_parents?N.bg+'44':'#e5e7eb'}`}}>
          <div>
            <p className="text-sm font-semibold text-gray-800">Show status to parents</p>
            <p className="text-xs text-gray-400 mt-0.5">{form.show_parents?'Visible on parent view':'Hidden from parent view'}</p>
          </div>
          <button onClick={()=>set('show_parents',!form.show_parents)}
            className="w-12 h-6 rounded-full transition-all relative shrink-0 ml-3"
            style={{background:form.show_parents?N.bg:'#d1d5db'}}>
            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow"
              style={{left:form.show_parents?'26px':'2px'}}/>
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={save} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            style={{background:saved?'#16a34a':N.bg}} onMouseEnter={e=>{if(!saved)e.currentTarget.style.background=N.hover}} onMouseLeave={e=>{if(!saved)e.currentTarget.style.background=N.bg}}>
            {saved?'✓ Saved!':'💾 Save Status'}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noreferrer"
            className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm text-center transition-colors"
            style={{background:'#16a34a'}}>
            📲 Send to Parents
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Parent Session Status View ───────────────────────────────────────────────
function ParentStatusBanner({ sessionStatus }) {
  if (!sessionStatus.show_parents) return null
  if (!sessionStatus.status || sessionStatus.status === 'on') return (
    <div className="rounded-2xl p-4 mb-4 flex gap-3 items-center" style={{background:'#f0fdf4',border:'1px solid #bbf7d0'}}>
      <span className="text-2xl">✅</span>
      <div>
        <p className="font-bold text-green-800 text-sm">Training is ON this week</p>
        {(sessionStatus.time||sessionStatus.location) && (
          <p className="text-green-700 text-xs mt-0.5">{[sessionStatus.time,sessionStatus.location].filter(Boolean).join(' · ')}</p>
        )}
      </div>
    </div>
  )
  return (
    <div className="rounded-2xl p-4 mb-4 flex gap-3 items-center" style={{background:'#fef2f2',border:'1px solid #fecaca'}}>
      <span className="text-2xl">🚫</span>
      <div>
        <p className="font-bold text-red-800 text-sm">Training CANCELLED this week</p>
        <p className="text-red-700 text-xs mt-0.5">Check back soon for updates from your coaches</p>
      </div>
    </div>
  )
}

// ─── Match Day Notes ──────────────────────────────────────────────────────────
function MatchDayNotes({ weekNum, matchNotes, onSave }) {
  const empty = { result:'', scorers:'', notes:'', opponent:'', venue:'', match_time:'', show_parents:false }
  const note = matchNotes[weekNum] || empty
  const [form, setForm] = useState(note)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('fixture') // 'fixture' | 'result'
  useEffect(()=>{ setForm(matchNotes[weekNum]||empty); setSaved(false) },[weekNum,matchNotes])
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setSaved(false) }
  const save = async () => { await onSave(weekNum, form); setSaved(true); setTimeout(()=>setSaved(false),2000) }
  const inputCls = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
  const focusNavy = e=>e.target.style.borderColor=N.bg
  const blurGray = e=>e.target.style.borderColor='#d1d5db'

  const fixtureText = `⚽ *Clydach Juniors — Match Day*

${form.opponent?`🆚 vs ${form.opponent}
`:''}${form.match_time?`⏰ ${form.match_time}
`:''}${form.venue?`📍 ${form.venue}
`:''}
Don't forget boots, shin pads and water!

— Coaches
🔗 ${SITE_URL}`

  const resultText = `⚽ *Match Result — Clydach Juniors*

${form.opponent?`🆚 vs ${form.opponent}
`:''}${form.result?`📊 ${form.result}
`:''}${form.scorers?`⚽ Scorers: ${form.scorers}
`:''}
Well done to everyone who played today!

— Coaches
🔗 ${SITE_URL}`

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h3 className="font-bold text-gray-900 text-sm mb-3">⚽ Week {weekNum} — Match</h3>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {[{id:'fixture',label:'📋 Fixture'},{id:'result',label:'📊 Result'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={tab===t.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Fixture details — shown on both tabs */}
        <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Opponent</label>
          <input value={form.opponent} onChange={e=>set('opponent',e.target.value)} placeholder="e.g. Swansea City Juniors" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>

        {tab==='fixture' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Time</label>
                <input value={form.match_time} onChange={e=>set('match_time',e.target.value)} placeholder="e.g. 10:00am" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
              <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Venue</label>
                <input value={form.venue} onChange={e=>set('venue',e.target.value)} placeholder="e.g. Clydach Park" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
            </div>

            {/* Show to parents toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{background:form.show_parents?N.light:'#f9fafb',border:`1px solid ${form.show_parents?N.bg+'44':'#e5e7eb'}`}}>
              <div>
                <p className="text-sm font-semibold text-gray-800">Show fixture to parents</p>
                <p className="text-xs text-gray-400 mt-0.5">{form.show_parents?'Visible on parent view':'Hidden from parent view'}</p>
              </div>
              <button onClick={()=>set('show_parents',!form.show_parents)}
                className="w-12 h-6 rounded-full transition-all relative shrink-0 ml-3"
                style={{background:form.show_parents?N.bg:'#d1d5db'}}>
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow"
                  style={{left:form.show_parents?'26px':'2px'}}/>
              </button>
            </div>
          </>
        )}

        {tab==='result' && (
          <>
            <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Result</label>
              <input value={form.result} onChange={e=>set('result',e.target.value)} placeholder="e.g. Won 3-1" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
            <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Scorers</label>
              <input value={form.scorers} onChange={e=>set('scorers',e.target.value)} placeholder="e.g. J.Smith x2, T.Jones" className={inputCls} onFocus={focusNavy} onBlur={blurGray}/></div>
            <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Coach Notes</label>
              <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} placeholder="Key moments, areas to work on, standout performances..." className={`${inputCls} resize-none`} onFocus={focusNavy} onBlur={blurGray}/></div>
          </>
        )}

        <div className="flex gap-2">
          <button onClick={save} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            style={{background:saved?'#16a34a':N.bg}} onMouseEnter={e=>{if(!saved)e.currentTarget.style.background=N.hover}} onMouseLeave={e=>{if(!saved)e.currentTarget.style.background=N.bg}}>
            {saved?'✓ Saved!':'💾 Save'}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(tab==='fixture'?fixtureText:resultText)}`}
            target="_blank" rel="noreferrer"
            className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm text-center"
            style={{background:'#16a34a'}}>
            📲 {tab==='fixture'?'Share Fixture':'Share Result'}
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Squad & Attendance ───────────────────────────────────────────────────────
function SquadAttendance({ weekNum, squad, attendance, onToggle, onAdd, onRemove }) {
  const [newName, setNewName] = useState('')
  const [newNum, setNewNum] = useState('')
  const [adding, setAdding] = useState(false)
  const presentCount = squad.filter(p=>attendance[`${weekNum}-${p.id}`]).length
  const inputCls = "border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">👥 Week {weekNum} — Attendance</h3>
        <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{background:N.bg}}>{presentCount}/{squad.length}</span>
      </div>
      {squad.length===0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No players added yet — add your squad below</p>
      ) : (
        <div className="space-y-2 mb-3">
          {squad.map(p=>{
            const present = !!attendance[`${weekNum}-${p.id}`]
            return (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl border transition-all"
                style={{borderColor:present?'#16a34a':'#e5e7eb',background:present?'#f0fdf4':'white'}}>
                {p.squad_num && <span className="text-xs font-black w-6 text-center" style={{color:N.bg}}>{p.squad_num}</span>}
                <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                <button onClick={()=>onToggle(weekNum,p.id,present)}
                  className="w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                  style={present?{background:'#16a34a',color:'white'}:{background:'#f3f4f6',color:'#9ca3af'}}>
                  {present?'✓':'○'}
                </button>
                <button onClick={()=>onRemove(p.id)} className="text-red-300 hover:text-red-500 text-xs px-1">✕</button>
              </div>
            )
          })}
        </div>
      )}
      {!adding ? (
        <button onClick={()=>setAdding(true)} className="w-full text-xs py-2 rounded-xl border font-semibold transition-colors"
          style={{borderColor:N.bg+'44',color:N.text,background:N.light}}>+ Add Player</button>
      ) : (
        <div className="flex gap-2 mt-2">
          <input value={newNum} onChange={e=>setNewNum(e.target.value)} placeholder="#" className={`${inputCls} w-12`}/>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Player name / initials" className={`${inputCls} flex-1`}/>
          <button onClick={()=>{if(newName.trim()){onAdd(newName.trim(),newNum.trim());setNewName('');setNewNum('');setAdding(false)}}}
            className="text-white text-xs font-bold px-3 rounded-xl" style={{background:N.bg}}>Add</button>
          <button onClick={()=>setAdding(false)} className="text-gray-400 text-xs px-2">✕</button>
        </div>
      )}
    </div>
  )
}

// ─── Player Development Notes ─────────────────────────────────────────────────
function PlayerDevelopment({ squad, playerNotes, onSave }) {
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const openPlayer = (p) => { setSelected(p); setNote(playerNotes[p.id]||''); setSaved(false) }
  const save = async () => { await onSave(selected.id, note); setSaved(true); setTimeout(()=>setSaved(false),2000) }

  if (squad.length===0) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
      <p className="text-2xl mb-2">👤</p>
      <p className="text-sm font-semibold text-gray-600">No players in squad yet</p>
      <p className="text-xs text-gray-400 mt-1">Add players in the Attendance section first</p>
    </div>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h3 className="font-bold text-gray-900 text-sm mb-3">📝 Player Development Notes</h3>
      <p className="text-xs text-gray-400 mb-3">Private coaching notes — not visible to parents or players</p>
      <div className="space-y-2 mb-4">
        {squad.map(p=>{
          const hasNote = !!(playerNotes[p.id]&&playerNotes[p.id].trim())
          return (
            <button key={p.id} onClick={()=>openPlayer(p)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-gray-300"
              style={{borderColor:selected?.id===p.id?N.bg:'#e5e7eb',background:selected?.id===p.id?N.light:'white'}}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:N.bg}}>
                {p.squad_num||p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                {hasNote && <p className="text-xs text-gray-400 truncate">{playerNotes[p.id]}</p>}
              </div>
              {hasNote && <span className="text-xs text-green-500 shrink-0">●</span>}
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="border-t border-gray-100 pt-4">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Notes for {selected.name}</label>
          <textarea value={note} onChange={e=>{setNote(e.target.value);setSaved(false)}} rows={4}
            placeholder="e.g. Strong in the air but needs work on weak foot. Ready for more responsibility in midfield."
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none mb-2"
            onFocus={e=>e.target.style.borderColor=N.bg} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
          <button onClick={save} className="w-full text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            style={{background:saved?'#16a34a':N.bg}} onMouseEnter={e=>{if(!saved)e.currentTarget.style.background=N.hover}} onMouseLeave={e=>{if(!saved)e.currentTarget.style.background=N.bg}}>
            {saved?'✓ Saved!':'💾 Save Notes'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── FAW Quick Reference ──────────────────────────────────────────────────────
const FAW_RULES = [
  { icon:'⚽', title:'Format', rule:'9v9 on a 64x44 yard pitch (U12). 70 mins — 2x35 min halves. Goals 7x16ft. Ball size 4.' },
  { icon:'🚩', title:'Offside', rule:'Standard offside applies. A player is not offside from a goal kick, throw-in or corner.' },
  { icon:'↩️', title:'Retreat Line', rule:'Opposition must be 10 yards from the goalkeeper when they have the ball. Encourages build-up play.' },
  { icon:'🧤', title:'Goalkeeper', rule:'GK cannot pick up a deliberate back pass from a teammate. Can handle the ball in the penalty area only.' },
  { icon:'⏱️', title:'Playing Time', rule:'All squad members must play a minimum of 50% of total playing time. Rolling substitutes — players can re-enter.' },
  { icon:'🔴', title:'Mercy Rule', rule:'If a team leads by 8 goals, the match is declared over. Remaining time played as a friendly.' },
  { icon:'📊', title:'League Standing', rule:'Goal difference CANNOT be used in league standings at U12 or U13.' },
  { icon:'🤕', title:'Heading (U12)', rule:'Heading is LOW PRIORITY at U12. Max 10 mins per session, max 4 headers per bout, self-serve only.' },
  { icon:'🏆', title:'Competition', rule:'Season must start with non-competitive fixtures. Maximum 24 weeks of competitive football.' },
  { icon:'🏟️', title:'Buffer Zone', rule:'2-metre buffer zone required from touchlines. No spectators behind goals. Coaches stay in technical area.' },
  { icon:'🚭', title:'Match Day', rule:'Smoking and vaping banned from sideline. Coaches must not continuously shout instructions during matches.' },
  { icon:'📋', title:'Team Roster', rule:'Team roster on COMET compulsory. Maximum 18 players per match day squad.' },
  { icon:'👨‍🏫', title:'Coach Requirements', rule:'Minimum FAW Football Leaders Award required. Valid Enhanced DBS check mandatory. First Aid Award required.' },
]

function FAWReference() {
  const [open, setOpen] = useState(null)
  return (
    <div>
      <div className="rounded-2xl p-4 mb-4 flex gap-3 items-start" style={{background:N.light,border:`1px solid ${N.bg}33`}}>
        <span className="text-2xl">🏴󠁧󠁢󠁷󠁬󠁳󠁿</span>
        <div>
          <p className="font-bold text-sm" style={{color:N.text}}>FAW Quick Reference — U12 2025-26</p>
          <p className="text-xs mt-0.5" style={{color:N.text+'bb'}}>Key rules at a glance. Tap any rule for full detail.</p>
        </div>
      </div>
      <div className="space-y-2">
        {FAW_RULES.map((r,i)=>(
          <div key={i} onClick={()=>setOpen(open===i?null:i)}
            className="bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all"
            style={{borderColor:open===i?N.bg:'#e5e7eb'}}>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg shrink-0">{r.icon}</span>
              <span className="flex-1 text-sm font-semibold text-gray-900">{r.title}</span>
              <span className="text-gray-400 text-xs">{open===i?'▲':'▼'}</span>
            </div>
            {open===i && (
              <div className="px-4 pb-3 pt-0">
                <p className="text-sm text-gray-600 leading-relaxed">{r.rule}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Season Overview ──────────────────────────────────────────────────────────
function SeasonOverview({ seasonStart, matchNotes, weekNum, onWeekSelect }) {
  if (!seasonStart) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
      <p className="text-2xl mb-2">📅</p>
      <p className="text-sm font-semibold text-gray-600">No season start date set</p>
      <p className="text-xs text-gray-400 mt-1">Set a season start date in the Planner tab to see the overview</p>
    </div>
  )

  const weeks = Array.from({length:30},(_,i)=>i+1)
  const getDate = (w) => {
    const d = new Date(seasonStart)
    d.setDate(d.getDate()+(w-1)*7)
    return d
  }
  const formatShort = (d) => d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})

  return (
    <div>
      <div className="rounded-2xl p-4 mb-4 flex gap-3 items-start" style={{background:N.light,border:`1px solid ${N.bg}33`}}>
        <span className="text-2xl">📅</span>
        <div>
          <p className="font-bold text-sm" style={{color:N.text}}>Season Overview</p>
          <p className="text-xs mt-0.5" style={{color:N.text+'bb'}}>30-week season. Tap a week to jump to it in the planner.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {weeks.map(w=>{
          const d = getDate(w)
          const hasNote = !!(matchNotes[w]&&(matchNotes[w].result||matchNotes[w].notes))
          const isCurrent = w===weekNum
          const isPast = d < new Date()
          return (
            <button key={w} onClick={()=>onWeekSelect(w)}
              className="rounded-xl p-2.5 text-center border-2 transition-all"
              style={{
                borderColor:isCurrent?N.bg:hasNote?'#16a34a':'#e5e7eb',
                background:isCurrent?N.bg:hasNote?'#f0fdf4':isPast?'#f9fafb':'white',
                color:isCurrent?'white':'inherit',
                opacity:d>new Date(new Date().setDate(new Date().getDate()+84))?0.4:1
              }}>
              <div className="text-xs font-black" style={{color:isCurrent?'white':N.text}}>W{w}</div>
              <div className="text-xs mt-0.5" style={{color:isCurrent?'rgba(255,255,255,0.8)':'#9ca3af',fontSize:'9px'}}>{formatShort(d)}</div>
              {hasNote && !isCurrent && <div className="text-xs">⚽</div>}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 text-center mt-3">⚽ = match notes logged · highlighted = current week</p>
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
        <Pitch/>
        <Zone x={90} y={60} w={140} h={100}/>
        <Label x={160} y={55} text="RONDO AREA"/>
        {[0,51,103,154,205,257,309].map((a,i) => {
          const r=55, cx=160+r*Math.cos((a-90)*Math.PI/180), cy=110+r*Math.sin((a-90)*Math.PI/180)
          return <g key={i}>{P(cx,cy,accent,String(i+1))}</g>
        })}
        {P(145,95,'#ef4444','D')}{P(175,125,'#ef4444','D')}
        <circle cx="160" cy="110" r="7" fill="white" opacity="0.9"/>
        <Label x={160} y={185} text="7 attackers keep ball from 2 defenders" col="#86efac"/>
      </svg>
    ),
    wall: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {/* Wall on left */}
        <rect x="10" y="60" width="12" height="100" fill="#94a3b8" opacity="0.8"/>
        <Label x={16} y={55} text="WALL" col="#94a3b8"/>
        {P(100,110,accent,'1')}{P(200,110,accent,'2')}
        <circle cx="150" cy="110" r="7" fill="white" opacity="0.9"/>
        {Arrow(100,108,28,100,accent)}{Arrow(28,120,95,112,accent,true)}
        <Label x={160} y={185} text="Pass to wall → control rebound → repeat" col="#86efac"/>
      </svg>
    ),
    triangle: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {Zone(90,55,140,110)}
        {P(120,160,accent,'A')}{P(200,160,accent,'B')}{P(160,65,accent,'C')}
        {P(160,115,'#ef4444','D')}
        <line x1="120" y1="160" x2="200" y2="160" stroke={accent} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5"/>
        <line x1="200" y1="160" x2="160" y2="65" stroke={accent} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5"/>
        <line x1="160" y1="65" x2="120" y2="160" stroke={accent} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5"/>
        {Arrow(128,157,152,117,accent)}{Arrow(160,104,167,72,accent,true)}
        <Label x={160} y={195} text="Pass and move to a different point each time" col="#86efac"/>
      </svg>
    ),
    gates: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {[[70,80],[70,140],[120,65],[120,155],[170,75],[170,145],[230,85],[230,135]].map(([x,y],i) =>
          <rect key={i} x={x-5} y={y-5} width="10" height="10" fill="#f59e0b" stroke="white" strokeWidth="1"/>
        )}
        {P(50,110,accent,'P')}
        {Arrow(60,108,65,90,accent)}{Arrow(75,80,115,70,accent,true)}{Arrow(125,65,165,78,accent,true)}
        <Label x={160} y={195} text="Pass accurately through as many gates as possible" col="#86efac"/>
      </svg>
    ),
    '4goal': (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={10} y={92}/><Goal x={250} y={92}/>
        <rect x="140" y="10" width="16" height="60" fill="none" stroke="white" strokeWidth="2"/>
        <rect x="140" y="150" width="16" height="60" fill="none" stroke="white" strokeWidth="2"/>
        {Zone(80,55,160,110)}
        {P(110,85,accent)}{P(210,85,accent)}{P(110,135,'#ef4444')}{P(210,135,'#ef4444')}
        <circle cx="160" cy="110" r="7" fill="white" opacity="0.9"/>
        <Label x={160} y={195} text="Score by passing through any of the 4 goals" col="#86efac"/>
      </svg>
    ),
    switch: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {P(40,155,accent,'A')}{P(130,110,accent,'B')}{P(270,65,accent,'C')}
        {Arrow(50,152,120,113,accent)}{Arrow(142,108,258,68,accent)}
        <Label x={160} y={50} text="SWITCH PLAY — 3 passes or fewer"/>
        <Label x={160} y={195} text="Must switch ball across pitch before driving forward" col="#86efac"/>
      </svg>
    ),
    lanes: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <line x1="117" y1="10" x2="117" y2="210" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3"/>
        <line x1="203" y1="10" x2="203" y2="210" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3"/>
        <Goal x={130} y={10}/>
        <Label x={65} y={110} text="LANE 1"/><Label x={160} y={110} text="LANE 2"/><Label x={253} y={110} text="LANE 3"/>
        {P(50,165,accent)}{P(140,140,accent)}{P(230,100,accent)}
        {Arrow(60,163,130,143,accent)}{Arrow(152,138,222,103,accent)}
        <Label x={160} y={195} text="Must pass into each lane before shooting" col="#86efac"/>
      </svg>
    ),
    // ── TACKLING ─────────────────────────────────────────────────────────────
    tackle: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {Zone(70,70,180,80)}
        {P(110,110,accent,'A')}{P(210,110,'#ef4444','D')}
        <circle cx="165" cy="110" r="7" fill="white" opacity="0.9"/>
        {Arrow(120,110,158,110,accent)}
        <Label x={160} y={65} text="SHADOW TACKLE ZONE"/>
        <Label x={160} y={55} text="Attacker dribbles slowly, defender mirrors"/>
        <Label x={160} y={195} text="Mirror movement — correct body shape first" col="#86efac"/>
      </svg>
    ),
    jockey: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {Zone(120,30,80,160)}
        {P(160,170,accent,'A')}{P(160,55,'#ef4444','D')}
        <circle cx="160" cy="140" r="7" fill="white" opacity="0.9"/>
        {Arrow(160,160,160,80,accent,true)}
        {Arrow(160,80,160,65,'#ef4444')}
        <Label x={160} y={25} text="END LINE"/>
        <Label x={160} y={195} text="Attacker drives to end line — defender jockeys" col="#86efac"/>
      </svg>
    ),
    '1v1box': (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {Zone(80,55,160,110)}
        <Label x={160} y={50} text="8m × 8m BOX"/>
        {P(130,100,accent,'A')}{P(190,120,'#ef4444','D')}
        <circle cx="155" cy="110" r="7" fill="white" opacity="0.9"/>
        {Arrow(140,102,148,108,accent)}
        <Label x={160} y={185} text="Attacker tries to dribble out any side" col="#86efac"/>
      </svg>
    ),
    press: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={170}/>
        {P(100,55,accent,'A')}{P(160,45,accent,'A')}{P(220,55,accent,'A')}
        {P(110,130,'#ef4444','P')}{P(160,125,'#ef4444','P')}{P(210,130,'#ef4444','P')}
        <circle cx="160" cy="80" r="7" fill="white" opacity="0.9"/>
        {Arrow(113,130,105,68,'#ef4444')}{Arrow(163,123,161,57,'#ef4444')}{Arrow(207,128,217,67,'#ef4444')}
        <Label x={160} y={195} text="Press as a unit — win ball within 10 seconds" col="#86efac"/>
      </svg>
    ),
    defshape: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={175}/>
        {[[80,150],[127,145],[193,145],[240,150]].map(([x,y],i)=>P(x,y,N.bg,['LB','CB','CB','RB'][i]))}
        {[[110,105],[160,100],[210,105]].map(([x,y],i)=>P(x,y,'#8b5cf6',['CM','CM','CM'][i]))}
        {[[80,55],[160,45],[240,55]].map(([x,y],i)=>P(x,y,'#ef4444',['A','A','A'][i]))}
        <Label x={160} y={195} text="Maintain shape — shift as a unit when ball moves" col="#86efac"/>
      </svg>
    ),
    recovery: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={175}/>
        {P(80,50,accent,'A')}{P(240,50,'#ef4444','D')}
        {Arrow(80,50,240,50,'white',true)}
        <Label x={160} y={45} text="START LINE"/>
        {P(80,155,accent,'A')}{P(240,155,'#ef4444','D')}
        {Arrow(90,153,230,153,accent)}
        <Label x={160} y={195} text="Both sprint 20m — defender recovers to delay" col="#86efac"/>
      </svg>
    ),
    channel: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {Zone(110,20,100,180)}
        {P(160,170,accent,'A')}{P(160,75,'#ef4444','D')}
        <circle cx="160" cy="145" r="7" fill="white" opacity="0.9"/>
        {Arrow(160,160,160,90,accent,true)}
        {Arrow(165,75,200,100,'#ef4444')}
        <Label x={160} y={15} text="← CHANNEL →"/>
        <Label x={160} y={195} text="Defender guides attacker toward touchline" col="#86efac"/>
      </svg>
    ),
    // ── ATTACKING ────────────────────────────────────────────────────────────
    '3v2': (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/>
        <Zone x={80} y={25} w={160} h={175}/>
        {P(100,55,accent,'A')}{P(160,45,accent,'A')}{P(220,55,accent,'A')}
        {P(130,120,'#ef4444','D')}{P(190,120,'#ef4444','D')}
        <circle cx="150" cy="80" r="7" fill="white" opacity="0.9"/>
        {Arrow(108,57,143,82,accent)}{Arrow(160,55,155,72,accent,true)}{Arrow(212,57,185,118,'#ef4444',true)}
        <Label x={160} y={195} text="3 attackers vs 2 defenders — complete 3 passes first" col="#86efac"/>
      </svg>
    ),
    cross: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/>
        {/* Penalty area */}
        <rect x="100" y="10" width="120" height="65" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        {P(280,110,accent,'W')}{P(145,55,accent,'A1')}{P(185,45,accent,'A2')}
        {Arrow(272,108,190,50,accent)}{Arrow(145,66,145,30,accent,true)}{Arrow(185,56,185,30,accent,true)}
        <Label x={160} y={195} text="Wide player crosses — near & far post runs" col="#86efac"/>
      </svg>
    ),
    counter: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/>
        {P(80,170,accent)}{P(140,175,accent)}{P(180,175,accent)}{P(240,170,accent)}
        {P(130,100,'#ef4444','D')}{P(190,100,'#ef4444','D')}
        {Arrow(80,160,78,25,accent,true)}{Arrow(140,165,140,30,accent,true)}{Arrow(180,165,180,30,accent,true)}{Arrow(240,160,242,25,accent,true)}
        <Label x={160} y={195} text="4v2 counter attack — score within 10 seconds" col="#86efac"/>
      </svg>
    ),
    overlap: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/>
        {P(60,120,N.bg,'FB')}{P(60,60,accent,'W')}{P(180,80,accent,'CF')}
        {Arrow(60,110,58,72,N.bg)}{Arrow(58,70,170,82,accent,true)}
        {/* Overlap run arc */}
        <path d="M65,120 Q30,90 65,58" fill="none" stroke={N.bg} strokeWidth="2" strokeDasharray="6,3"/>
        <Label x={160} y={195} text="Full back overlaps winger — lay off into space" col="#86efac"/>
      </svg>
    ),
    shootpress: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/>
        <rect x="100" y="10" width="120" height="65" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.3"/>
        {P(160,120,accent,'A')}{P(160,175,'#ef4444','D')}
        <circle cx="160" cy="120" r="7" fill="white" opacity="0.9"/>
        {Arrow(160,111,160,35,accent)}{Arrow(160,165,160,132,'#ef4444')}
        <Label x={265} y={120} text="2 sec" col="#f59e0b"/>
        <Label x={160} y={195} text="Receive, decide: shoot/turn/lay off within 2 seconds" col="#86efac"/>
      </svg>
    ),
    setpiece: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/>
        <rect x="100" y="10" width="120" height="65" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        {P(20,175,accent,'K')}{P(130,35,accent,'NP')}{P(185,25,accent,'FP')}{P(150,80,accent,'S')}{P(210,80,'#ef4444','D')}
        {Arrow(29,172,123,42,accent)}{Arrow(130,46,148,72,accent,true)}{Arrow(185,36,185,30,accent,true)}
        <Label x={160} y={195} text="Corner: near post, far post and short options" col="#86efac"/>
      </svg>
    ),
    combo: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/>
        {P(80,165,accent,'A')}{P(160,120,accent,'B')}{P(240,165,accent,'C')}
        {Arrow(90,162,150,123,accent)}{Arrow(170,120,232,162,accent,true)}{Arrow(240,153,190,35,accent)}
        <Label x={160} y={195} text="A-B-C combination — third man finishes" col="#86efac"/>
      </svg>
    ),
    wideattack: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/>
        {P(20,120,accent,'LW')}{P(300,120,accent,'RW')}{P(160,80,accent,'ST')}{P(120,155,accent,'LM')}{P(200,155,accent,'RM')}
        {Arrow(20,110,18,35,accent,true)}{Arrow(300,110,298,35,accent,true)}
        <Label x={160} y={195} text="Wingers push high and wide — create width" col="#86efac"/>
      </svg>
    ),
    // ── S&C ──────────────────────────────────────────────────────────────────
    weave: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {[50,85,120,155,190,225,260].map((x,i) => <Cone key={i} x={x} y={i%2===0?80:140}/>)}
        {P(25,110,accent,'P')}
        <path d="M35,110 Q52,80 70,110 Q88,140 105,110 Q122,80 140,110 Q158,140 175,110 Q192,80 210,110 Q227,140 244,110 Q262,80 280,110" fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="none"/>
        <Label x={160} y={195} text="Dribble through cones — both feet, close control" col="#86efac"/>
      </svg>
    ),
    ladder: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {/* Agility ladder */}
        <line x1="120" y1="30" x2="120" y2="190" stroke={accent} strokeWidth="3" opacity="0.7"/>
        <line x1="200" y1="30" x2="200" y2="190" stroke={accent} strokeWidth="3" opacity="0.7"/>
        {[0,1,2,3,4,5,6,7].map(i=><line key={i} x1="120" y1={30+i*23} x2="200" y2={30+i*23} stroke={accent} strokeWidth="2" opacity="0.7"/>)}
        {P(80,180,accent,'P')}
        <path d="M88,178 Q100,160 110,150 Q120,140 130,128 Q140,116 150,104 Q160,92 170,80 Q180,68 190,56 Q200,44 210,32" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4,2" opacity="0.8"/>
        <Label x={160} y={210} text="Two feet in each box — precision before pace" col="#86efac"/>
      </svg>
    ),
    shuttle: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <line x1="50" y1="30" x2="50" y2="190" stroke="#f59e0b" strokeWidth="2"/>
        <line x1="120" y1="30" x2="120" y2="190" stroke="#f59e0b" strokeWidth="2"/>
        <line x1="190" y1="30" x2="190" y2="190" stroke="#f59e0b" strokeWidth="2"/>
        <line x1="260" y1="30" x2="260" y2="190" stroke="#f59e0b" strokeWidth="2"/>
        <Label x={50} y={25} text="5m" col="#f59e0b"/>
        <Label x={120} y={25} text="10m" col="#f59e0b"/>
        <Label x={190} y={25} text="15m" col="#f59e0b"/>
        {P(25,110,accent,'P')}
        {Arrow(35,108,112,95,accent)}{Arrow(112,105,38,115,accent,true)}
        <Label x={160} y={195} text="Sprint to each line and back — 6 reps" col="#86efac"/>
      </svg>
    ),
    core: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
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
        <Label x={160} y={195} text="40s on / 20s rest — 3 rounds, technique first" col="#86efac"/>
      </svg>
    ),
    speedgates: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {/* T-shape speed gates */}
        {[[160,50],[160,110],[160,170],[80,110],[240,110]].map(([x,y],i)=>(
          <g key={i}>
            <rect x={x-4} y={y-20} width="8" height="35" fill={accent} rx="2" stroke="white" strokeWidth="1"/>
          </g>
        ))}
        {P(25,110,accent,'P')}
        {Arrow(35,108,72,110,accent)}
        <Label x={160} y={195} text="Timed runs through T-shape gate combinations" col="#86efac"/>
      </svg>
    ),
    warmup: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {[['High Knees',80,60],['Heel Kicks',240,60],['Leg Swings',80,110],['Hip Circles',240,110],['Lunges',80,160],['Jog',240,160]].map(([t,x,y])=>(
          <g key={t}>
            <circle cx={x} cy={y} r="28" fill={N.bg} opacity="0.6" stroke={accent} strokeWidth="1.5"/>
            <text x={x} y={y-4} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">{t.split(' ')[0]}</text>
            <text x={x} y={y+7} fill="white" fontSize="8" textAnchor="middle">{t.split(' ')[1]||''}</text>
          </g>
        ))}
        <Label x={160} y={195} text="All dynamic — no static stretching" col="#86efac"/>
      </svg>
    ),
    // ── TACTICAL / AGE GROUP ──────────────────────────────────────────────────
    positions: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/><Goal x={130} y={194}/>
        {P(160,185,accent,'GK')}
        {[[80,150],[127,145],[193,145],[240,150]].map(([x,y],i)=>P(x,y,N.bg,['LB','CB','CB','RB'][i]))}
        {[[105,100],[160,95],[215,100]].map(([x,y],i)=>P(x,y,'#8b5cf6',['LM','CM','RM'][i]))}
        {[[80,50],[160,40],[240,50]].map(([x,y],i)=>P(x,y,accent,['LW','ST','RW'][i]))}
        <Label x={160} y={210} text="4-3-3 shape — zones of responsibility" col="#86efac"/>
      </svg>
    ),
    '9v9': (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/><Goal x={130} y={194}/>
        <rect x="95" y="10" width="130" height="60" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        <rect x="95" y="150" width="130" height="60" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        {P(160,185,accent,'GK')}
        {[[80,150],[130,145],[190,145],[240,150]].map(([x,y],i)=>P(x,y,N.bg,['LB','CB','CB','RB'][i]))}
        {[[105,100],[160,95],[215,100]].map(([x,y],i)=>P(x,y,'#8b5cf6',['M','M','M'][i]))}
        {[[120,50],[200,50]].map(([x,y],i)=>P(x,y,accent,['A','A'][i]))}
        <Label x={160} y={210} text="9v9 shape — 64x44 yard pitch" col="#86efac"/>
      </svg>
    ),
    offside: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        <Goal x={130} y={10}/>
        <rect x="100" y="10" width="120" height="70" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4"/>
        {/* Last defender line */}
        <line x1="10" y1="90" x2="310" y2="90" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8,4"/>
        <Label x={160} y={85} text="LAST DEFENDER LINE" col="#f59e0b"/>
        {P(100,70,accent,'A1')}{P(200,70,'#ef4444','A2')}{P(180,95,N.bg,'D')}
        <Label x={100} y={115} text="✓ ONSIDE" col="#4ade80"/>
        <Label x={200} y={115} text="✗ OFFSIDE" col="#ef4444"/>
        <Label x={160} y={195} text="Level with last defender = onside" col="#86efac"/>
      </svg>
    ),
    default: (
      <svg viewBox={vb} className="w-full h-full">
        <Pitch/>
        {P(80,110,accent)}{P(160,80,accent)}{P(240,110,accent)}
        {P(160,140,'#ef4444')}
        <circle cx="160" cy="110" r="7" fill="white" opacity="0.9"/>
        {Arrow(90,110,150,113,accent)}{Arrow(170,110,230,110,accent,true)}
      </svg>
    ),
  }

  return diagrams[type] || diagrams.default
}

// ─── Squad Positions ──────────────────────────────────────────────────────────
const POSITIONS = ['GK','RB','CB','LB','RM','CM','LM','RW','ST','LW','CAM','CDM']

function SquadPositions({ squad, onUpdatePlayer }) {
  const [editPlayer, setEditPlayer] = useState(null)
  const [form, setForm] = useState({preferred:'',secondary:''})

  const open = (p) => { setEditPlayer(p); setForm({preferred:p.preferred||'',secondary:p.secondary||''}) }
  const save = async () => {
    await onUpdatePlayer(editPlayer.id, form)
    setEditPlayer(null)
  }

  if (squad.length===0) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
      <p className="text-2xl mb-2">🎽</p>
      <p className="text-sm font-semibold text-gray-600">No players added yet</p>
      <p className="text-xs text-gray-400 mt-1">Add players in the Attendance section first</p>
    </div>
  )

  // Group players by preferred position
  const grouped = {}
  squad.forEach(p => {
    const pos = p.preferred || 'Unassigned'
    if (!grouped[pos]) grouped[pos] = []
    grouped[pos].push(p)
  })

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h3 className="font-bold text-gray-900 text-sm mb-1">🎽 Squad Positions</h3>
      <p className="text-xs text-gray-400 mb-4">Tap a player to set their preferred and secondary positions</p>

      {/* Visual pitch with positions */}
      <div className="rounded-xl overflow-hidden mb-4" style={{background:'#166534',aspectRatio:'4/3'}}>
        <svg viewBox="0 0 320 240" className="w-full h-full">
          <rect width="320" height="240" fill="#166534"/>
          <rect x="10" y="10" width="300" height="220" fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.5"/>
          <line x1="10" y1="120" x2="310" y2="120" stroke="#4ade80" strokeWidth="1" opacity="0.3"/>
          <circle cx="160" cy="120" r="30" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.3"/>
          <rect x="115" y="10" width="90" height="50" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.3"/>
          <rect x="115" y="180" width="90" height="50" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.3"/>
          <rect x="135" y="10" width="50" height="18" fill="none" stroke="white" strokeWidth="2"/>
          <rect x="135" y="212" width="50" height="18" fill="none" stroke="white" strokeWidth="2"/>
          {/* Position zones */}
          {[
            ['GK',160,222],['RB',270,190],['CB',190,190],['LB',50,190],
            ['CB',130,185],['CDM',160,155],['RM',285,120],['CM',200,120],
            ['LM',35,120],['CM',120,120],['CAM',160,90],
            ['RW',270,55],['ST',160,45],['LW',50,55]
          ].map(([pos,x,y]) => {
            const players = squad.filter(p=>p.preferred===pos)
            return (
              <g key={`${pos}${x}${y}`}>
                <circle cx={x} cy={y} r="18" fill={players.length?N.bg:'rgba(255,255,255,0.1)'} stroke={players.length?"white":"rgba(255,255,255,0.3)"} strokeWidth="1"/>
                <text x={x} y={y-4} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" opacity="0.9">{pos}</text>
                {players.length>0 && <text x={x} y={y+7} textAnchor="middle" fill="white" fontSize="7">{players[0].name.split(' ')[0].substring(0,6)}</text>}
                {players.length>1 && <text x={x} y={y+7} textAnchor="middle" fill="#fde68a" fontSize="6">+{players.length-1}</text>}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Player list */}
      <div className="space-y-2">
        {squad.map(p => (
          <button key={p.id} onClick={()=>open(p)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
            style={{borderColor:editPlayer?.id===p.id?N.bg:'#e5e7eb',background:editPlayer?.id===p.id?N.light:'white'}}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:N.bg}}>
              {p.squad_num||p.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-400">{p.preferred||'No position set'}{p.secondary?` / ${p.secondary}`:''}</p>
            </div>
            <span className="text-gray-300 text-xs">›</span>
          </button>
        ))}
      </div>

      {/* Edit modal */}
      {editPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">🎽 {editPlayer.name} — Positions</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Preferred Position</label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map(pos=>(
                    <button key={pos} onClick={()=>setForm(f=>({...f,preferred:pos}))}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                      style={form.preferred===pos?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Secondary Position</label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map(pos=>(
                    <button key={pos} onClick={()=>setForm(f=>({...f,secondary:f.secondary===pos?'':pos}))}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                      style={form.secondary===pos?{background:'#8b5cf6',color:'white',borderColor:'#8b5cf6'}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm" style={{background:N.bg}}>Save</button>
              <button onClick={()=>setEditPlayer(null)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Player Progression Tracker ───────────────────────────────────────────────
function PlayerProgressTracker({ squad, drills, onSave, progressData }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [filter, setFilter] = useState('All')

  const getDrillProgress = (playerId, drillId) => {
    return progressData[`${playerId}-${drillId}`] || 0 // 0=not done, 1=introduced, 2=developing, 3=confident
  }

  const LEVELS = [
    {v:0, label:'Not started', color:'#e5e7eb'},
    {v:1, label:'Introduced', color:'#f59e0b'},
    {v:2, label:'Developing', color:'#3b82f6'},
    {v:3, label:'Confident', color:'#16a34a'},
  ]

  const filteredDrills = drills.filter(d =>
    filter==='All' || d.category===filter
  ).filter(d => d.category !== 'Age Group Changes' && d.category !== 'Strength & Conditioning')

  if (squad.length===0) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
      <p className="text-2xl mb-2">📈</p>
      <p className="text-sm font-semibold text-gray-600">No players in squad yet</p>
      <p className="text-xs text-gray-400 mt-1">Add players in the Attendance section first</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Player selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-3">📈 Player Progression Tracker</h3>
        <p className="text-xs text-gray-400 mb-3">Track which drills each player has been coached on</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {squad.map(p=>(
            <button key={p.id} onClick={()=>setSelectedPlayer(selectedPlayer?.id===p.id?null:p)}
              className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
              style={selectedPlayer?.id===p.id?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
              {p.squad_num?`#${p.squad_num} `:''}{p.name.split(' ')[0]}
            </button>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-3 flex-wrap">
          {LEVELS.map(l=>(
            <div key={l.v} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{background:l.color}}/>
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedPlayer && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{background:N.bg}}>
              {selectedPlayer.squad_num||selectedPlayer.name[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{selectedPlayer.name}</p>
              <p className="text-xs text-gray-400">{selectedPlayer.preferred||'No position'}</p>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {['All','Passing','Tackling','Attacking'].map(cat=>(
              <button key={cat} onClick={()=>setFilter(cat)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                style={filter===cat?{background:N.bg,color:'white',borderColor:N.bg}:{background:'white',color:'#4b5563',borderColor:'#e5e7eb'}}>
                {cat}
              </button>
            ))}
          </div>

          {/* Drills grid */}
          <div className="space-y-2">
            {filteredDrills.map(drill => {
              const level = getDrillProgress(selectedPlayer.id, drill.id)
              return (
                <div key={drill.id} className="flex items-center gap-2 p-2 rounded-xl border" style={{borderColor:'#f3f4f6'}}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{drill.title}</p>
                    <p className="text-xs text-gray-400">{drill.category}</p>
                  </div>
                  <div className="flex gap-1">
                    {LEVELS.map(l=>(
                      <button key={l.v} onClick={()=>onSave(selectedPlayer.id, drill.id, l.v)}
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          background:level===l.v?l.color:'white',
                          borderColor:level===l.v?l.color:'#e5e7eb',
                        }}
                        title={l.label}/>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {LEVELS.slice(1).map(l=>{
              const count = filteredDrills.filter(d=>getDrillProgress(selectedPlayer.id,d.id)===l.v).length
              return (
                <div key={l.v} className="text-center p-2 rounded-xl" style={{background:l.color+'22'}}>
                  <div className="text-lg font-black" style={{color:l.color}}>{count}</div>
                  <div className="text-xs text-gray-500">{l.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role,setRole]=useState(null)
  const [view,setView]=useState('drills')
  const [drills,setDrills]=useState([])
  const [homeSession,setHomeSession]=useState({drill_ids:[],message:''})
  const [seasonStart,setSeasonStartState]=useState('')
  const [sessionStatus,setSessionStatusState]=useState({status:'on',location:'',time:''})
  const [squad,setSquad]=useState([])
  const [matchNotes,setMatchNotes]=useState({}) // { weekNum: { result, scorers, notes } }
  const [playerNotes,setPlayerNotes]=useState({}) // { playerId: note }
  const [progressData,setProgressData]=useState({}) // { 'playerId-drillId': level }
  const [attendance,setAttendance]=useState({}) // { 'weekNum-playerId': bool }
  const [filterCat,setFilterCat]=useState('All')
  const [filterAge,setFilterAge]=useState('All')
  const [search,setSearch]=useState('')
  const [selected,setSelected]=useState(null)
  const [showAdd,setShowAdd]=useState(false)
  const [shareTarget,setShareTarget]=useState(null)
  const [loading,setLoading]=useState(true)
  const [dbError,setDbError]=useState(false)
  const [matchWeek,setMatchWeek]=useState(1)
  const [squadWeek,setSquadWeek]=useState(1)
  const [plannerWeek,setPlannerWeek]=useState(1)

  // Save season start to Supabase and update local state
  const saveSeasonStart = async (dateStr) => {
    setSeasonStartState(dateStr)
    try {
      await supabase.from('season_settings').upsert({ id:1, season_start: dateStr||null })
    } catch(e) { console.error(e) }
  }

  const saveSessionStatus = async (s) => {
    setSessionStatusState(s)
    try { await supabase.from('season_settings').upsert({ id:1, session_status:s.status, session_location:s.location, session_time:s.time, show_status_to_parents:s.show_parents||false }) } catch(e){console.error(e)}
  }
  const saveMatchNote = async (weekNum, note) => {
    setMatchNotes(prev=>({...prev,[weekNum]:note}))
    try { await supabase.from('match_notes').upsert({week_num:weekNum,...note}) } catch(e){console.error(e)}
  }
  const savePlayerNote = async (playerId, note) => {
    setPlayerNotes(prev=>({...prev,[playerId]:note}))
    try { await supabase.from('player_notes').upsert({player_id:playerId,note}) } catch(e){console.error(e)}
  }
  const addSquadPlayer = async (name, num) => {
    try {
      const{data}=await supabase.from('squad').insert({name,squad_num:num}).select().single()
      if(data) setSquad(prev=>[...prev,data])
    } catch(e){console.error(e)}
  }
  const removeSquadPlayer = async (id) => {
    setSquad(prev=>prev.filter(p=>p.id!==id))
    try { await supabase.from('squad').delete().eq('id',id) } catch(e){console.error(e)}
  }
  const updatePlayerPosition = async (playerId, form) => {
    setSquad(prev=>prev.map(p=>p.id===playerId?{...p,...form}:p))
    try { await supabase.from('squad').update(form).eq('id',playerId) } catch(e){console.error(e)}
  }
  const saveProgress = async (playerId, drillId, level) => {
    const key = `${playerId}-${drillId}`
    setProgressData(prev=>({...prev,[key]:level}))
    try {
      if(level===0) {
        await supabase.from('player_progress').delete().eq('player_id',playerId).eq('drill_id',drillId)
      } else {
        await supabase.from('player_progress').upsert({player_id:playerId,drill_id:drillId,level},{onConflict:'player_id,drill_id'})
      }
    } catch(e){console.error(e)}
  }
  const toggleAttendance = async (weekNum, playerId, current) => {
    const key = `${weekNum}-${playerId}`
    setAttendance(prev=>({...prev,[key]:!current}))
    try { await supabase.from('attendance').upsert({week_num:weekNum,player_name:String(playerId),present:!current},{onConflict:'week_num,player_name'}) } catch(e){console.error(e)}
  }

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
        const{data:ss}=await supabase.from('season_settings').select('*').eq('id',1).single()
        if(ss&&ss.season_start) setSeasonStartState(ss.season_start)
        if(ss) setSessionStatusState({status:ss.session_status||'on',location:ss.session_location||'',time:ss.session_time||'',show_parents:ss.show_status_to_parents||false})
        const{data:sq}=await supabase.from('squad').select('*').order('name')
        if(sq) setSquad(sq)
        const{data:mn}=await supabase.from('match_notes').select('*')
        if(mn){const obj={};mn.forEach(r=>{obj[r.week_num]={result:r.result||'',scorers:r.scorers||'',notes:r.notes||'',opponent:r.opponent||'',venue:r.venue||'',match_time:r.match_time||'',show_parents:r.show_parents||false}});setMatchNotes(obj)}
        const{data:pn}=await supabase.from('player_notes').select('*')
        if(pn){const obj={};pn.forEach(r=>{obj[r.player_id]=r.note||''});setPlayerNotes(obj)}
        const{data:att}=await supabase.from('attendance').select('*')
        if(att){const obj={};att.forEach(r=>{obj[`${r.week_num}-${r.player_name}`]=r.present});setAttendance(obj)}
        const{data:pp}=await supabase.from('player_progress').select('*')
        if(pp){const obj={};pp.forEach(r=>{obj[`${r.player_id}-${r.drill_id}`]=r.level});setProgressData(obj)}
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

  if(!role) return <AuthScreen onAuth={r=>{setRole(r);if(r==='parent')setView('home');else setView('drills')}}/>
  if(loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3"><div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl animate-pulse" style={{background:N.bg}}>⚽</div><p className="text-sm font-semibold" style={{color:N.text}}>Loading…</p></div>

  const filtered=drills.filter(d=>{
    if(filterCat!=='All'&&d.category!==filterCat) return false
    if(filterAge!=='All'&&!parseAges(d.age_groups).includes(filterAge)) return false
    if(search&&!d.title.toLowerCase().includes(search.toLowerCase())&&!d.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const catCounts=CATEGORIES.reduce((acc,c)=>{acc[c]=drills.filter(d=>d.category===c).length;return acc},{})
  const publishedCount=(homeSession.drill_ids||[]).length
  // Calculate current week for use across tabs
  const calcWeek = (start) => {
    if(!start) return 1
    const d=new Date(start); const t=new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0)
    if(t<d) return 1
    return Math.floor((t-d)/(1000*60*60*24*7))+1
  }
  const currentWeek = calcWeek(seasonStart)
  useEffect(()=>{ setMatchWeek(currentWeek); setSquadWeek(currentWeek); setPlannerWeek(currentWeek) },[currentWeek])

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
            <>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-1">
                {[
                  {id:'drills',   label:'📋 Drills'},
                  {id:'planner',  label:'📅 Planner'},
                  {id:'home-manager', label:'🏠 Home', badge: publishedCount > 0 ? publishedCount : null},
                  {id:'status',   label:'🔔 Status'},
                ].map(tab=>(
                  <button key={tab.id} onClick={()=>setView(tab.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all relative"
                    style={view===tab.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                    {tab.label}
                    {tab.badge&&<span className="absolute -top-1 -right-1 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center font-black" style={{background:N.bg,fontSize:'9px'}}>{tab.badge}</span>}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {[
                  {id:'match',    label:'⚽ Match'},
                  {id:'squad',    label:'👥 Squad'},
                  {id:'faw',      label:'🏴󠁧󠁢󠁷󠁬󠁳󠁿 FAW'},
                  {id:'season',   label:'📊 Season'},
                ].map(tab=>(
                  <button key={tab.id} onClick={()=>setView(tab.id)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={view===tab.id?{background:'white',color:N.text,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}:{color:'#6b7280'}}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </>
          )}


        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {isCoach&&view==='planner'&&<TrainingPlanner drills={drills} seasonStart={seasonStart} onSeasonStartChange={saveSeasonStart} initialWeek={plannerWeek} onWeekChange={setPlannerWeek}/>}
        {isCoach&&view==='home-manager'&&<HomeSessionManager drills={drills} homeSession={homeSession} onSave={saveHomeSession}/>}
        {isCoach&&view==='status'&&<SessionStatusManager sessionStatus={sessionStatus} onSave={saveSessionStatus}/>}
        {isCoach&&view==='match'&&(
          <div className="space-y-4">
            {/* Week navigator */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2">
              <button onClick={()=>setMatchWeek(w=>Math.max(1,w-1))}
                className="w-9 h-9 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center">‹</button>
              <div className="flex-1 text-center">
                <p className="font-bold text-gray-900 text-sm">Week {matchWeek}</p>
                {matchNotes[matchWeek]?.opponent && <p className="text-xs text-gray-400">vs {matchNotes[matchWeek].opponent}</p>}
              </div>
              <button onClick={()=>setMatchWeek(w=>w+1)}
                className="w-9 h-9 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center">›</button>
              <button onClick={()=>setMatchWeek(currentWeek)}
                className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{background:N.light, color:N.text}}>Today</button>
            </div>
            <MatchDayNotes weekNum={matchWeek} matchNotes={matchNotes} onSave={saveMatchNote}/>
          </div>
        )}
        {isCoach&&view==='squad'&&(
          <div className="space-y-4">
            {/* Week navigator for attendance */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2">
              <button onClick={()=>setSquadWeek(w=>Math.max(1,w-1))}
                className="w-9 h-9 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center">‹</button>
              <div className="flex-1 text-center">
                <p className="font-bold text-gray-900 text-sm">Week {squadWeek} — Attendance</p>
              </div>
              <button onClick={()=>setSquadWeek(w=>w+1)}
                className="w-9 h-9 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center">›</button>
              <button onClick={()=>setSquadWeek(currentWeek)}
                className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{background:N.light, color:N.text}}>Today</button>
            </div>
            <SquadAttendance weekNum={squadWeek} squad={squad} attendance={attendance} onToggle={toggleAttendance} onAdd={addSquadPlayer} onRemove={removeSquadPlayer}/>
            <SquadPositions squad={squad} onUpdatePlayer={updatePlayerPosition}/>
            <PlayerDevelopment squad={squad} playerNotes={playerNotes} onSave={savePlayerNote}/>
            <PlayerProgressTracker squad={squad} drills={drills} progressData={progressData} onSave={saveProgress}/>
          </div>
        )}
        {isCoach&&view==='faw'&&<FAWReference/>}
        {isCoach&&view==='season'&&<SeasonOverview seasonStart={seasonStart} matchNotes={matchNotes} weekNum={currentWeek} onWeekSelect={(w)=>{setPlannerWeek(w);setView('planner')}}/>}
        {!isCoach&&(
          <div>
            <ParentStatusBanner sessionStatus={sessionStatus}/>
            {/* Show upcoming fixture if set and enabled */}
            {(()=>{
              const upcomingWeek = Object.keys(matchNotes).find(w=>matchNotes[w]?.show_parents&&matchNotes[w]?.opponent)
              const fixture = upcomingWeek ? matchNotes[upcomingWeek] : null
              if(!fixture) return null
              return (
                <div className="rounded-2xl p-4 mb-4" style={{background:'#eff6ff',border:'1px solid #bfdbfe'}}>
                  <p className="font-bold text-blue-800 text-sm mb-2">⚽ Upcoming Match</p>
                  <p className="text-blue-900 font-semibold text-sm">vs {fixture.opponent}</p>
                  <div className="flex gap-3 mt-1">
                    {fixture.match_time&&<p className="text-blue-700 text-xs">⏰ {fixture.match_time}</p>}
                    {fixture.venue&&<p className="text-blue-700 text-xs">📍 {fixture.venue}</p>}
                  </div>
                </div>
              )
            })()}
            <ParentHomeView drills={drills} homeSession={homeSession}/>
          </div>
        )}

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
