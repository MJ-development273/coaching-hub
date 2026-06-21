import { useState } from 'react'

export default function App() {
  const [role, setRole] = useState(null)

  if (!role) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1e3a5f'}}>
      <div style={{background:'white',borderRadius:'16px',padding:'32px',width:'300px',textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>⚽</div>
        <h1 style={{fontWeight:'900',marginBottom:'8px'}}>Clydach Juniors</h1>
        <button onClick={()=>setRole('coach')}
          style={{width:'100%',background:'#1e3a5f',color:'white',border:'none',borderRadius:'12px',padding:'12px',fontWeight:'bold',fontSize:'16px',cursor:'pointer',marginBottom:'8px'}}>
          Coach Login
        </button>
        <button onClick={()=>setRole('parent')}
          style={{width:'100%',background:'white',color:'#1e3a5f',border:'2px solid #1e3a5f',borderRadius:'12px',padding:'12px',fontWeight:'bold',fontSize:'16px',cursor:'pointer'}}>
          Parent / Player
        </button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f3f4f6',padding:'20px'}}>
      <div style={{maxWidth:'600px',margin:'0 auto',background:'white',borderRadius:'16px',padding:'24px'}}>
        <h1 style={{color:'#1e3a5f',fontWeight:'900'}}>✅ App is working!</h1>
        <p style={{color:'#6b7280'}}>Logged in as: <strong>{role}</strong></p>
        <button onClick={()=>setRole(null)}
          style={{marginTop:'16px',background:'#1e3a5f',color:'white',border:'none',borderRadius:'8px',padding:'8px 16px',cursor:'pointer'}}>
          Sign out
        </button>
      </div>
    </div>
  )
}
