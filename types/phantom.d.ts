/**
 * Phantom Wallet Type Definitions for SUI
 * Based on https://docs.phantom.com/sui
 */

export interface PhantomSuiAccount {
  address: string;
  publicKey: Uint8Array;
}

export interface PhantomSuiProvider {
  isPhantom: boolean;
  
  /**
   * Request account access from the user
   * @returns Promise resolving to the user's account information
   */
  requestAccount(): Promise<PhantomSuiAccount>;
  
  /**
   * Sign a transaction (which also sends it to the network)
   * @param params - Transaction parameters
   * @returns Promise resolving to the signature
   */
  signTransaction(params: {
    transaction: string; // JSON string from tx.toJSON()
    address: string;
    networkID: string; // e.g., 'sui:testnet' or 'sui:mainnet'
  }): Promise<{
    signature: string;
    transactionBlockBytes: string;
  }>;
  
  /**
   * Sign a message
   * @param message - The message to sign (as Uint8Array)
   * @returns Promise resolving to the signature
   */
  signMessage(params: {
    message: Uint8Array;
  }): Promise<{
    messageBytes: string;
    signature: string;
  }>;
  
  /**
   * Disconnect from the wallet
   */
  disconnect(): Promise<void>;
  
  /**
   * Event listeners
   */
  on(event: 'connect', handler: (publicKey: string) => void): void;
  on(event: 'disconnect', handler: () => void): void;
  on(event: 'accountChanged', handler: (publicKey: string | null) => void): void;
  
  removeListener(event: string, handler: (...args: any[]) => void): void;
}

export interface PhantomWindow extends Window {
  phantom?: {
    sui?: PhantomSuiProvider;
  };
}

declare global {
  interface Window {
    phantom?: {
      sui?: PhantomSuiProvider;
    };
  }
}
