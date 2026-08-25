import { useEffect, useState } from 'react'

const steps = [
  { view: 'market', target: '#live-terminal', title: 'LIVE MARKETS', description: 'The main intelligence terminal showing real-time Pump.fun market data, liquidity rotation and narrative clustering.' },
  { view: 'market', target: '.war-topbar', title: 'mlearn.ing STATUS', description: 'The status bar shows the mlearn.ing brand, live feed status, event channel health and current time.' },
  { view: 'market', target: '.launch-rail', title: 'PUMP.FUN LIVE', description: 'Real-time stream of new token creation events from the Pump.fun program on Solana.' },
  { view: 'market', target: '#signal-nexus', title: 'TRENCH SIGNAL RADAR', description: 'Interactive bubblemap showing token positions by narrative cluster. Hover for details, click to select.' },
  { view: 'market', target: '#token-watchlist', title: 'HOT MARKET WATCHLIST', description: 'The top tokens ranked by volume, hype score and trending position.' },
  { view: 'market', target: '#entity-analysis', title: 'SELECTED MARKET', description: 'Detailed view of the currently selected token with price, volume, liquidity and metadata.' },
  { view: 'market', target: '#narrative-map', title: 'REAL-TIME NARRATIVE MAP', description: 'Tokens clustered by metadata similarity. The engine groups tokens by name, description and symbol patterns.' },
  { view: 'history', target: '#history-lab', title: 'SESSION MEMORY', description: 'Everything the engine has observed during this session — no simulated data, only real on-chain observations.' },
  { view: 'modules', target: '.feature-suite', title: 'RESEARCH MODULES', description: 'The twenty-module research workbench with wallet profiling, lineage, embeddings and more.' },
]

export default function DemoTour({ step: currentStep, onStep, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const current = steps[currentStep]
  if (!current) return null

  return (
    <div className={`machine-tour ${visible ? 'is-visible' : ''}`} role="dialog" aria-label="Guided tour">
      <div className="machine-tour__card">
        <div className="machine-tour__head">
          <span><i /> mlearn.ing / GUIDED TOUR</span>
          <span>STEP {currentStep + 1} / {steps.length}</span>
        </div>
        <div className="machine-tour__body">
          <h3>{current.title}</h3>
          <p>{current.description}</p>
        </div>
        <div className="machine-tour__actions">
          <button type="button" onClick={onClose} className="machine-tour__skip">SKIP TOUR</button>
          <div>
            {currentStep > 0 && <button type="button" onClick={() => onStep(currentStep - 1)} className="machine-tour__prev">PREVIOUS</button>}
            {currentStep < steps.length - 1 ? (
              <button type="button" onClick={() => onStep(currentStep + 1)} className="machine-tour__next">NEXT STEP</button>
            ) : (
              <button type="button" onClick={onClose} className="machine-tour__next">FINISH</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
