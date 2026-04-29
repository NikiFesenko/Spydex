import { useMemo } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import idl from '../idl/neighborhood_contracts.json';
import devnetConfig from '../config/devnet.json';

const PROGRAM_ID = new PublicKey(devnetConfig.programId);

// Anchor 1.0 discriminator for buy_slice: [41, 88, 58, 162, 184, 31, 81, 101]
const BUY_SLICE_DISCRIMINATOR = Buffer.from([41, 88, 58, 162, 184, 31, 81, 101]);

export function useSpydexProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, {
      preflightCommitment: 'confirmed',
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as any, provider);
  }, [provider]);

  /**
   * Calls the buy_slice instruction on the neighborhood_contracts program.
   * Transfers (amountOfSlices * pricePerSlice) lamports from buyer to treasury.
   * Returns the transaction signature string.
   */
  const buySlice = async (amountOfSlices: number): Promise<string> => {
    if (!wallet || !provider) throw new Error('Wallet not connected');

    const assetStatePda = new PublicKey(devnetConfig.assetStatePda);
    const treasury = new PublicKey(devnetConfig.treasury);

    // Encode the instruction manually for Anchor 1.0 compatibility
    const data = Buffer.alloc(8 + 8);
    BUY_SLICE_DISCRIMINATOR.copy(data, 0);
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(amountOfSlices), 0);
    buf.copy(data, 8);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: assetStatePda, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: treasury, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // This triggers the Phantom wallet popup
    const signed = await wallet.signTransaction(transaction);
    const rawTx = signed.serialize();
    const sig = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    await connection.confirmTransaction(sig, 'confirmed');
    return sig;
  };

  return { program, provider, buySlice, devnetConfig };
}
