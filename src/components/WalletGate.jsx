import { useCallback, useEffect, useState } from 'react'
import { LogOut, Shield, Wallet } from 'lucide-react'

const STORAGE_KEY = 'ml-engine:wallet'

function shortAddr(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

function getSolanaProvider() {
  if (window.solana?.isPhantom) return window.solana
  if (window.solflare) return window.solflare
  return null
}

export default function WalletGate({ children, requireWallet = false }) {
  const [wallet, setWallet] = useState(() => {
    try { const s = sessionStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  

  const connect = useCallback(async () => {
    const provider = getSolanaProvider()
    if (!provider) {
      setError('Aucun wallet Solana détecté. Installe Phantom ou Solflare.')
      return
    }
    setConnecting(true)
    setError('')
    try {
      const resp = await provider.connect()
      const addr = resp.publicKey.toString()
      const name = window.solana?.isPhantom ? 'Phantom' : 'Solflare'
      const data = { address: addr, wallet: name, connectedAt: new Date().toISOString() }
      setWallet(data)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      // modal closed
    } catch (err) {
      setError(err.message || 'Connexion refusée')
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    try { getSolanaProvider()?.disconnect?.() } catch { /* ignore */ }
    setWallet(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    const provider = getSolanaProvider()
    if (provider?.on) {
      const handler = () => { setWallet(null); sessionStorage.removeItem(STORAGE_KEY) }
      provider.on('disconnect', handler)
      return () => provider.off('disconnect', handler)
    }
  }, [])

  // Check if wallet is installed
  const hasWallet = typeof window !== 'undefined' && getSolanaProvider() !== null

  return (
    <>
      {wallet && (
        <div className="wallet-badge">
          <Shield size={11} />
          <span>{shortAddr(wallet.address)}</span>
          <button type="button" onClick={disconnect} aria-label="Déconnecter"><LogOut size={10} /></button>
        </div>
      )}
      {!wallet && !requireWallet && (
        <button type="button" className="wallet-connect-btn" onClick={connect} disabled={connecting}>
          <Wallet size={12} />
          {connecting ? '...' : 'CONNECT'}
        </button>
      )}
      {!wallet && requireWallet && (
        <div className="wallet-gate-overlay">
          <div className="wallet-gate-card">
            <Wallet size={40} />
            <h2>CONNEXION REQUISE</h2>
            <p>Connecte ton wallet Solana pour accéder à cette section.</p>
            {error && <div className="wallet-gate-error">{error}</div>}
            {!hasWallet && <div className="wallet-gate-error">Aucun wallet détecté. Installe Phantom ou Solflare.</div>}
            <button type="button" onClick={connect} disabled={connecting || !hasWallet}>
              <Wallet size={14} />
              {connecting ? 'CONNEXION...' : 'CONNECTER WALLET'}
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  )
}


