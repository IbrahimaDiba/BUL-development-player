import { useState, useCallback, useEffect } from 'react'
import './index.css'
import Hero from './pages/Hero'
import Step1Info from './pages/Step1Info'
import Step2Stats from './pages/Step2Stats'
import Step3Target from './pages/Step3Target'
import LoadingPage from './pages/LoadingPage'
import Results from './pages/Results'
import Reevaluation from './pages/Reevaluation'
import ChatPage from './pages/ChatPage'
import { analyzePlayer, reevaluatePlayer, calculateDerivedStats } from './api'

const INIT_STATS = {
  gs:0.5,mp_per_game:25,pts_per_game:10,ast_per_game:3,trb_per_game:4,
  orb_per_game:1,drb_per_game:3,fg_per_game:4,fga_per_game:10,fg_percent:0.4,
  x3p_per_game:1,x3pa_per_game:3,x3p_percent:0.33,x2p_per_game:3,x2pa_per_game:7,
  x2p_percent:0.43,e_fg_percent:0.45,ft_per_game:2,fta_per_game:2.5,ft_percent:0.75,
  stl_per_game:0.8,blk_per_game:0.3,tov_per_game:1.5,pf_per_game:2,
  pts_per_48_min:0,ast_per_48_min:0,trb_per_48_min:0,true_shooting_percentage:0
}

export default function App() {
  const [page, setPage] = useState('hero')
  const [playerInfo, setPlayerInfo] = useState({name:'',age:22,position:'SG',height_cm:196,weight_kg:90,level:'semi-pro'})
  const [playerStats, setPlayerStats] = useState(INIT_STATS)
  const [target, setTarget] = useState(null)
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type='info') => {
    setToast({msg,type})
    setTimeout(()=>setToast(null),3500)
  },[])

  useEffect(()=>{ window.scrollTo(0,0) },[page])

  const handleAnalyze = useCallback(async()=>{
    setPage('loading')
    try {
      const stats = calculateDerivedStats(playerStats)
      const res = await analyzePlayer({player_info:playerInfo,stats,target_player_id:target?.player_id||null})
      setResult(res)
      setPage('results')
    } catch(e){
      showToast('Erreur lors de l\'analyse. Vérifiez le serveur.','error')
      setPage('step3')
    }
  },[playerInfo,playerStats,target,showToast])

  const handleReeval = useCallback(async(newStats)=>{
    setPage('loading')
    try {
      const orig = calculateDerivedStats(playerStats)
      const upd  = calculateDerivedStats(newStats)
      const res = await reevaluatePlayer({player_info:playerInfo,original_stats:orig,new_stats:upd,target_player_id:target?.player_id||null})
      setPlayerStats(newStats)
      setResult(res)
      setPage('results')
      showToast('Progression calculée !','success')
    } catch(e){
      showToast('Erreur lors de la réévaluation.','error')
      setPage('results')
    }
  },[playerInfo,playerStats,target,showToast])

  return (
    <>
      {toast&&(
        <div className="toast-wrap">
          <div className="toast" style={{borderLeft:`3px solid ${toast.type==='error'?'#dc2626':toast.type==='success'?'#16a34a':'#0a0a0a'}`}}>
            {toast.msg}
          </div>
        </div>
      )}
      {page==='hero'    && <Hero onStart={()=>setPage('step1')} />}
      {page==='step1'   && <Step1Info info={playerInfo} onChange={setPlayerInfo} onNext={()=>setPage('step2')} onBack={()=>setPage('hero')} />}
      {page==='step2'   && <Step2Stats stats={playerStats} onChange={setPlayerStats} onNext={()=>setPage('step3')} onBack={()=>setPage('step1')} />}
      {page==='step3'   && <Step3Target target={target} onSelect={setTarget} onAnalyze={handleAnalyze} onBack={()=>setPage('step2')} />}
      {page==='loading' && <LoadingPage />}
      {page==='results' && <Results data={result} playerInfo={playerInfo} target={target} onReeval={()=>setPage('reeval')} onRestart={()=>setPage('hero')} onGoToChat={()=>setPage('chat')} />}
      {page==='reeval'  && <Reevaluation current={playerStats} onSubmit={handleReeval} onBack={()=>setPage('results')} />}
      {page==='chat'    && <ChatPage data={result} playerInfo={playerInfo} onBack={()=>setPage('results')} />}
    </>
  )
}
