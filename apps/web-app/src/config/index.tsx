import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
// Fix: In latest AppKit, networks are often imported from 'viem/chains' 
// or the AppKit constants helper
import { mainnet, arbitrum, type AppKitNetwork } from '@reown/appkit/networks'

export const projectId = import.meta.env.VITE_PROJECT_ID as string

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Mezo Legacy',
    description: 'Bitcoin Economic Layer',
    url: 'https://mezo.org',
    icons: []
  }
})