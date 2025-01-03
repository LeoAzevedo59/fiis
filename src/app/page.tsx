'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from './actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    })
    setSubscription(sub)
    const serializedSub = JSON.parse(JSON.stringify(sub))
    await subscribeUser(serializedSub)
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe()
    setSubscription(null)
    await unsubscribeUser()
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotification(message)
      setMessage('')
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>
  }

  return (
    <div className='flex flex-col gap-4'>
      {subscription ? (
        <>
          <p>You are subscribed to push notifications.</p>
          <button className='bg-red-300 text-red-700 px-4 py-2' onClick={unsubscribeFromPush}>Unsubscribe</button>
          <input
            className='text-black'
            type="text"
            placeholder="Enter notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendTestNotification}>Send Test</button>
        </>
      ) : (
        <>
          <p>You are not subscribed to push notifications.</p>
          <button className='text-emerald-500' onClick={subscribeToPush}>Subscribe</button>
        </>
      )}
    </div>
  )
}

interface Window {
  MSStream?: unknown
}

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window).MSStream
    )

    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event) // Salva o evento para ser utilizado depois
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = () => {
    console.log('download...')
    
    if (deferredPrompt) {
      (deferredPrompt as any).prompt() // Exibe o prompt de instalação
      (deferredPrompt as any).userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuário aceitou a instalação do PWA.')
        } else {
          console.log('Usuário recusou a instalação do PWA.')
        }
        setDeferredPrompt(null) // Reseta o evento após o uso
      })
    }
  }

  if (isStandalone) {
    return null // Não exibe o botão de instalação se o PWA já estiver instalado
  }

  return (
    <div>
      <button
        className='bg-emerald-300 text-emerald-700 px-4 py-2'
        onClick={handleInstallClick}
      >
        Download
      </button>
      {isIOS && (
        <p>
          Para instalar este aplicativo no seu dispositivo iOS, toque no botão de compartilhamento
          <span role="img" aria-label="ícone de compartilhamento">
            {' '}
            ⎋{' '}
          </span>
          e selecione "Adicionar à Tela Inicial"
          <span role="img" aria-label="ícone de mais">
            {' '}
            ➕{' '}
          </span>.
        </p>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <div className='flex flex-col w-full h-screen items-center justify-center'>
      <PushNotificationManager />
      <InstallPrompt />
    </div>
  )
}