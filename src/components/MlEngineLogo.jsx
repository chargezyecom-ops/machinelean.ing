import { useEffect, useMemo, useRef, useState } from 'react'

const NODES = [
  { id: 'm1', x: 12, y: 8, r: 3.2 },
  { id: 'm2', x: 18, y: 22, r: 2.6 },
  { id: 'm3', x: 26, y: 8, r: 2.8 },
  { id: 'm4', x: 32, y: 22, r: 3 },
  { id: 'm5', x: 38, y: 8, r: 2.5 },
  { id: 'e1', x: 54, y: 8, r: 3.2 },
  { id: 'e2', x: 54, y: 22, r: 2.6 },
  { id: 'e3', x: 54, y: 36, r: 3 },
  { id: 'e4', x: 68, y: 8, r: 2.8 },
  { id: 'e5', x: 68, y: 22, r: 2.5 },
  { id: 'e6', x: 68, y: 36, r: 3.2 },
  { id: 'hub', x: 44, y: 22, r: 2 },
]

const EDGES = [
  ['m1', 'm2'], ['m2', 'm3'], ['m3', 'm4'], ['m4', 'm5'],
  ['m3', 'hub'], ['hub', 'e2'],
  ['e1', 'e4'], ['e1', 'e2'], ['e2', 'e3'], ['e2', 'e5'], ['e3', 'e6'], ['e4', 'e5'], ['e5', 'e6'],
  ['m1', 'hub'], ['m5', 'hub'],
]

export default function MlEngineLogo({ pulse = false, className = '', size = 32 }) {
  const [hovered, setHovered] = useState(false)
  const [pulses, setPulses] = useState([])
  const idCounter = useRef(0)

  useEffect(() => {
    if (!pulse) return
    const id = idCounter.current++
    setPulses((prev) => [...prev, id])
    const timer = setTimeout(() => setPulses((prev) => prev.filter((p) => p !== id)), 1200)
    return () => clearTimeout(timer)
  }, [pulse])

  const nodeMap = useMemo(() => {
    const map = new Map()
    NODES.forEach((n) => map.set(n.id, n))
    return map
  }, [])

  return (
    <div
      className={`ml-logo ${className} ${hovered ? 'ml-logo--hover' : ''}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="machinelearn.ing"
    >
      <svg viewBox="0 0 80 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-logo__svg">
        <defs>
          <radialGradient id="ml-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--machine-red, #e65a5a)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--machine-red, #e65a5a)" stopOpacity="0" />
          </radialGradient>
          <filter id="ml-blur">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const na = nodeMap.get(a)
          const nb = nodeMap.get(b)
          if (!na || !nb) return null
          const dx = hovered ? (na.x - 44) * 0.08 : 0
          const dy = hovered ? (na.y - 22) * 0.08 : 0
          const dx2 = hovered ? (nb.x - 44) * 0.08 : 0
          const dy2 = hovered ? (nb.y - 22) * 0.08 : 0
          return (
            <line
              key={`e-${i}`}
              x1={na.x + dx} y1={na.y + dy}
              x2={nb.x + dx2} y2={nb.y + dy2}
              stroke="var(--machine-red, #e65a5a)"
              strokeOpacity={hovered ? 0.35 : 0.18}
              strokeWidth="0.6"
              className="ml-logo__edge"
              style={{ transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)', transitionDelay: `${i * 15}ms` }}
            />
          )
        })}

        {/* Pulse rings */}
        {pulses.map((id) => (
          <circle
            key={`pulse-${id}`}
            cx="44" cy="22" r="6"
            fill="none"
            stroke="var(--machine-red, #e65a5a)"
            strokeWidth="1.5"
            className="ml-logo__pulse-ring"
          />
        ))}

        {/* Nodes */}
        {NODES.map((node, i) => {
          const dx = hovered ? (node.x - 44) * 0.12 : 0
          const dy = hovered ? (node.y - 22) * 0.12 : 0
          const isHub = node.id === 'hub'
          return (
            <g key={node.id} style={{ transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)', transitionDelay: `${i * 20}ms` }}>
              {isHub && (
                <circle
                  cx={node.x + dx} cy={node.y + dy} r={node.r * 3}
                  fill="url(#ml-glow)"
                  className="ml-logo__hub-glow"
                  style={{ transition: 'all 0.4s ease' }}
                />
              )}
              <circle
                cx={node.x + dx} cy={node.y + dy} r={node.r}
                fill={isHub ? 'var(--machine-red, #e65a5a)' : '#0a0d0b'}
                stroke={isHub ? 'var(--machine-red, #e65a5a)' : pulses.length > 0 ? 'var(--machine-cyan, #8fbfc7)' : '#3a5249'}
                strokeWidth={isHub ? 0.8 : 0.6}
                className={`ml-logo__node ${pulses.length > 0 ? 'ml-logo__node--active' : ''}`}
                style={{ transition: 'all 0.35s ease' }}
              />
              <circle
                cx={node.x + dx} cy={node.y + dy} r={node.r * 2.2}
                fill={isHub ? 'rgba(183,255,60,0.12)' : pulses.length > 0 ? 'rgba(99,234,208,0.08)' : 'transparent'}
                className="ml-logo__node-halo"
                style={{ transition: 'fill 0.5s ease' }}
              />
            </g>
          )
        })}

        {/* Labels */}
        <text
          x="24" y="42"
          fill="var(--machine-red, #e65a5a)"
          fontSize="9"
          fontWeight="800"
          fontFamily="'JetBrains Mono Variable', monospace"
          letterSpacing="0.08em"
          textAnchor="middle"
          opacity="0.9"
        >M</text>
        <text
          x="60" y="42"
          fill="var(--machine-red, #e65a5a)"
          fontSize="9"
          fontWeight="800"
          fontFamily="'JetBrains Mono Variable', monospace"
          letterSpacing="0.08em"
          textAnchor="middle"
          opacity="0.9"
        >E</text>
      </svg>
    </div>
  )
}

