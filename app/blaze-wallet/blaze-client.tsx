'use client'

import * as Ably from 'ably';
import { AblyProvider, ChannelProvider, useChannel } from "ably/react"
import { useState, useEffect } from 'react'
import { Blaze } from 'blaze-sdk'
import Logger, { LogEntry } from '../../components/logger'
import SampleHeader from '../../components/SampleHeader'

export default function BlazeClient() {
  const client = new Ably.Realtime ({ authUrl: '/token', authMethod: 'POST' });

  return (
    <AblyProvider client={ client }>
      <ChannelProvider channelName="balance-updates">
        <div className="flex flex-row justify-center">
          <div className="flex flex-col justify-start items-start gap-10">
            <SampleHeader sampleName="Blaze Wallet" sampleIcon="Authentication.svg" sampleDocsLink="https://github.com/example/blaze-sdk" />
            <div className="font-manrope text-base max-w-screen-sm text-slate-800 text-opacity-100 leading-6 font-light">
              Interact with blockchain tokens using the Blaze SDK. This demo shows how to check balances and transfer tokens with real-time updates via Ably.
            </div>
            <BlazeWallet />
          </div>
        </div>
      </ChannelProvider>
    </AblyProvider>
  )
}

function BlazeWallet() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [recipient, setRecipient] = useState<string>('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE');
  const [amount, setAmount] = useState<number>(100);
  const [balance, setBalance] = useState<string>('Loading...');
  const [wallet, setWallet] = useState<any>(null);
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Subscribe to balance updates channel
  const { channel } = useChannel("balance-updates", (message: Ably.Message) => {
    if (message.name === 'balance-changed' && message.data.address === address) {
      setBalance(message.data.balance.toLocaleString());
      addLog(`Balance updated to ${message.data.balance.toLocaleString()} via real-time channel`);
    }
  });

  // Initialize wallet
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        addLog('Initializing Blaze wallet...');
        
        // Replace with your API key in a production app
        // In a real app, you would use environment variables
        const blazeWallet = new Blaze({
          privateKey: 'e494f188c2d35887531ba474c433b1e41fadd8eb824aca983447fd4bb8b277d801',
          apiKey: 'demo-mode-api-key',
        });
        
        setWallet(blazeWallet);
        const myAddress = blazeWallet.signer.address;
        setAddress(myAddress);
        addLog(`Wallet initialized with address: ${myAddress}`);
        
        // Define token contract - replace with your actual contract
        const tokenContract = 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.token-contract';
        
        // In demo mode, we'll just set a sample balance
        setBalance('1,000,000');
        addLog('Retrieved token balance in demo mode');
      } catch (error) {
        addLog(`Error initializing wallet: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    initializeWallet();
  }, []);

  const addLog = (message: string) => {
    setLogs(prevLogs => [new LogEntry(message), ...prevLogs]);
  };

  const handleTransfer = async () => {
    if (!wallet) {
      addLog('Wallet not initialized');
      return;
    }

    setIsLoading(true);
    addLog(`Initiating transfer of ${amount} tokens to ${recipient}`);

    try {
      // In a real implementation, this would use the actual contract and make a real transfer
      // For demo purposes, we'll simulate the transfer
      const tokenContract = 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.token-contract';
      
      // Simulate a successful transfer
      setTimeout(() => {
        const txId = `tx_${Date.now()}`;
        addLog(`Transaction submitted: ${txId}`);
        
        // Update balance to simulate the transfer
        const currentBalance = parseInt(balance.replace(/,/g, ''));
        const newBalance = currentBalance - amount;
        
        // Instead of directly updating the balance, publish to the channel
        if (channel) {
          channel.publish('balance-changed', {
            address: address,
            balance: newBalance,
            txId: txId
          });
          
          // Also publish a simulated update for the recipient
          channel.publish('balance-changed', {
            address: recipient,
            balance: amount, // This would normally be added to their existing balance
            txId: txId
          });
        }
        
        setIsLoading(false);
      }, 10);
    } catch (error) {
      addLog(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <div className="font-manrope text-sm font-medium">Wallet Address</div>
        <div className="font-jetbrains-mono text-xs bg-slate-100 p-2 rounded">{address || 'Generating address...'}</div>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="font-manrope text-sm font-medium">Token Balance</div>
        <div className="font-jetbrains-mono text-lg font-medium">{balance}</div>
      </div>
      
      <div className="flex flex-col gap-4 mt-4">
        <div className="font-manrope text-sm font-medium">Transfer Tokens</div>
        
        <div className="flex flex-col gap-2">
          <label className="font-manrope text-xs">Recipient Address</label>
          <input 
            type="text" 
            value={recipient} 
            onChange={(e) => setRecipient(e.target.value)}
            className="font-jetbrains-mono text-xs p-2 border border-slate-200 rounded w-full"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-manrope text-xs">Amount</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(parseInt(e.target.value))}
            className="font-jetbrains-mono text-xs p-2 border border-slate-200 rounded w-32"
          />
        </div>
        
        <button 
          onClick={handleTransfer} 
          disabled={isLoading}
          className="bg-sky-600 text-white font-manrope font-medium py-2 px-4 rounded hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed mt-2 w-32"
        >
          {isLoading ? 'Processing...' : 'Transfer'}
        </button>
      </div>
      
      <div className="w-full mt-6">
        <Logger logEntries={logs} displayHeader={false} />
      </div>
    </div>
  );
} 