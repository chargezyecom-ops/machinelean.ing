import { ArrowLeft, ArrowRight, Clock3, X } from 'lucide-react'
import { demoSteps } from '../data/demoTourSteps.js'

export default function DemoTour({ step, onStep, onClose }) {
  const item = demoSteps[step]
  const isLast = step === demoSteps.length - 1
  return <div className="demo-tour" role="dialog" aria-modal="true" aria-labelledby="demo-tour-title">
    <div className="demo-tour__top"><span><Clock3 size={13} /> GUIDED PRODUCT TOUR / ~4 MIN</span><button type="button" onClick={onClose} aria-label="Close guided tour"><X size={16} /></button></div>
    <div className="demo-tour__progress"><i style={{ width: `${((step + 1) / demoSteps.length) * 100}%` }} /></div>
    <div className="demo-tour__body">
      <span>{item.eyebrow} · {item.duration}</span>
      <h2 id="demo-tour-title">{item.title}</h2>
      <dl><div><dt>WHAT YOU SEE</dt><dd>{item.what}</dd></div><div><dt>HOW IT WORKS</dt><dd>{item.how}</dd></div><div><dt>WHY IT MATTERS</dt><dd>{item.why}</dd></div></dl>
    </div>
    <div className="demo-tour__controls"><span>{String(step + 1).padStart(2, '0')} / {String(demoSteps.length).padStart(2, '0')}</span><div><button type="button" onClick={() => onStep(step - 1)} disabled={step === 0}><ArrowLeft size={14} /> BACK</button><button className="is-primary" type="button" onClick={() => isLast ? onClose() : onStep(step + 1)}>{isLast ? 'FINISH' : 'NEXT'} {!isLast && <ArrowRight size={14} />}</button></div></div>
  </div>
}
