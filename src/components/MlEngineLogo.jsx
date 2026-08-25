import { useState } from 'react'

export default function MlEngineLogo({ pulse = false, className = '', size = 32 }) {
  const [imgError, setImgError] = useState(false)

  // If image loaded successfully, show it
  if (!imgError) {
    return (
      <div
        className={`ml-logo ${className}`}
        style={{ width: size, height: size }}
        aria-label="mlearn.ing"
      >
        <img
          src="/assets/ml-logo.png"
          alt="mlearn.ing"
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // Fallback SVG logo
  return (
    <div
      className={`ml-logo ${className}`}
      style={{ width: size, height: size }}
      aria-label="mlearn.ing"
    >
      <svg viewBox="0 0 80 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-logo__svg">
        <defs>
          <radialGradient id="ml-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e65a5a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e65a5a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="44" cy="22" r="8" fill="url(#ml-glow)" />
        <circle cx="44" cy="22" r="3" fill="#e65a5a" />
        <text x="24" y="42" fill="#e65a5a" fontSize="9" fontWeight="800" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="0.08em" textAnchor="middle" opacity="0.9">M</text>
        <text x="60" y="42" fill="#e65a5a" fontSize="9" fontWeight="800" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="0.08em" textAnchor="middle" opacity="0.9">E</text>
      </svg>
    </div>
  )
}