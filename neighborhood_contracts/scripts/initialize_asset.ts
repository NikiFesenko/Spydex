/**
 * Initialize AssetState on devnet.
 * Run: npx ts-node scripts/initialize_asset.ts
 *
 * This script:
 * 1. Reads the local Solana keypair as admin
 * 2. Derives a PDA for AssetState using [b"asset", admin.publicKey]
 * 3. Calls initialize_asset(100 slices, 0.02 SOL per slice)
 * 4. Saves the assetStatePda and treasury to src/config/devnet.json
 */

import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import os from "os";

const PROGRAM_ID = new PublicKey("BYSranfYCar3hF6fFx87N4qx4pHrPuBaajwurGnczBSR");
const RPC_URL = "https://api.devnet.solana.com";

async function main() {
  // Load admin keypair from local Solana config
  const keyPath = path.join(os.homedir(), ".config", "solana", "id.json");
  const raw = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  const admin = Keypair.fromSecretKey(Uint8Array.from(raw));

  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new anchor.Wallet(admin);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load the IDL
  const idlPath = path.join(__dirname, "../../src/idl/neighborhood_contracts.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new anchor.Program(idl, provider);

  // Derive the PDA for assetState
  const [assetStatePda, _bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("asset"), admin.publicKey.toBuffer()],
    PROGRAM_ID
  );

  // Treasury = admin wallet for demo (receives the SOL from purchases)
  const treasury = admin.publicKey;

  // Check if already initialized
  const existing = await connection.getAccountInfo(assetStatePda);
  if (existing) {
    console.log("✅ AssetState already initialized at:", assetStatePda.toBase58());
    saveConfig(assetStatePda, treasury);
    return;
  }

  console.log("Admin:", admin.publicKey.toBase58());
  console.log("AssetState PDA:", assetStatePda.toBase58());
  console.log("Treasury:", treasury.toBase58());
  console.log("\nInitializing 100 slices at 0.02 SOL per slice...");

  const totalSlices = new anchor.BN(100);
  const pricePerSlice = new anchor.BN(20_000_000); // 0.02 SOL in lamports

  const tx = await program.methods
    .initializeAsset(totalSlices, pricePerSlice)
    .accounts({
      assetState: assetStatePda,
      admin: admin.publicKey,
      treasury: treasury,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("\n✅ Asset initialized! Transaction:", tx);
  console.log(`   Solscan: https://solscan.io/tx/${tx}?cluster=devnet`);

  saveConfig(assetStatePda, treasury);
}

function saveConfig(assetStatePda: PublicKey, treasury: PublicKey) {
  const config = {
    programId: PROGRAM_ID.toBase58(),
    assetStatePda: assetStatePda.toBase58(),
    treasury: treasury.toBase58(),
    cluster: "devnet",
    totalSlices: 100,
    pricePerSliceLamports: 20_000_000,
    pricePerSliceSol: 0.02,
  };

  const outPath = path.join(__dirname, "../../src/config/devnet.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(config, null, 2));
  console.log("\n✅ Config saved to src/config/devnet.json");
  console.log(JSON.stringify(config, null, 2));
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
