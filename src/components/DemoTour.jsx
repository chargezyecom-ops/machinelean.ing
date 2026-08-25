import { ArrowLeft, ArrowRight, Clock3, X } from 'lucide-react'
import { demoSteps } from '../data/demoTourSteps.js'

export default function DemoTour({ step, onStep, onClose }) {
  const item = demoSteps[step]
  const isLast = step === demoSteps.length - 1
  return <div className="demo-tour" role="dialog" aria-modal="true" aria-labelledby="demo-tour-title">
    <div className="demo-tour__top"><span><Clock3 size={13} /> PARCOURS GUIDÉ / ~4 MIN</span><button type="button" onClick={onClose} aria-label="Fermer le parcours"><X size={16} /></button></div>
    <div className="demo-tour__progress"><i style={{ width: `${((step + 1) / demoSteps.length) * 100}%` }} /></div>
    <div className="demo-tour__body">
      <span>{item.eyebrow} · {item.duration}</span>
      <h2 id="demo-tour-title">{item.title}</h2>
      <dl><div><dt>CE QUE ÇA MONTRE</dt><dd>{item.what}</dd></div><div><dt>COMMENT ÇA MARCHE</dt><dd>{item.how}</dd></div><div><dt>POURQUOI C’EST UTILE</dt><dd>{item.why}</dd></div></dl>
    </div>
    <div className="demo-tour__controls"><span>{String(step + 1).padStart(2, '0')} / {String(demoSteps.length).padStart(2, '0')}</span><div><button type="button" onClick={() => onStep(step - 1)} disabled={step === 0}><ArrowLeft size={14} /> RETOUR</button><button className="is-primary" type="button" onClick={() => isLast ? onClose() : onStep(step + 1)}>{isLast ? 'TERMINER' : 'SUIVANT'} {!isLast && <ArrowRight size={14} />}</button></div></div>
  </div>
}
