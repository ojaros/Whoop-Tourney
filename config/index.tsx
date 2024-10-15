import { cookieStorage, createStorage, http } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { mainnet, base, solana, baseSepolia } from '@reown/appkit/networks';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

export const projectId = '4a0211c8f65794ed7bb0046c061e99a9'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [base, baseSepolia];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

// export const solanaWeb3JsAdapter = new SolanaAdapter({
//   wallets: [
//     new PhantomWalletAdapter(),
//     new SolflareWalletAdapter()],
// });

export const config = {
  wagmiConfig: wagmiAdapter.wagmiConfig,
  // solanaConfig: solanaWeb3JsAdapter,
};