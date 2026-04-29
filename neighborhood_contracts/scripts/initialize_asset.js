/**
 * Initialize AssetState on Solana Devnet.
 * Uses raw web3.js transactions to avoid Anchor client version mismatches.
 *
 * Run from project root:
 *   export PATH="/opt/homebrew/bin:$HOME/.avm/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
 *   node neighborhood_contracts/scripts/initialize_asset.js
 */

const { Connection, PublicKey, Keypair, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PROGRAM_ID = new PublicKey("BYSranfYCar3hF6fFx87N4qx4pHrPuBaajwurGnczBSR");
const RPC_URL = "https://api.devnet.solana.com";

// Anchor 1.0 discriminator for initialize_asset: [214, 153, 49, 248, 95, 248, 208, 179]
const INITIALIZE_ASSET_DISCRIMINATOR = Buffer.from([214, 153, 49, 248, 95, 248, 208, 179]);

async function main() {
  const keyPath = path.join(os.homedir(), ".config", "solana", "id.json");
  const raw = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  const admin = Keypair.fromSecretKey(Uint8Array.from(raw));

  const connection = new Connection(RPC_URL, "confirmed");

  // Derive PDA: seeds = [b"asset", admin.publicKey]
  const [assetStatePda, bump] = await PublicKey.findProgramAddress(
    [Buffer.from("asset"), admin.publicKey.toBuffer()],
    PROGRAM_ID
  );

  // Treasury = admin's wallet (receives SOL from purchases in demo)
  const treasury = admin.publicKey;

  console.log("Admin:         ", admin.publicKey.toBase58());
  console.log("AssetState PDA:", assetStatePda.toBase58());
  console.log("Treasury:      ", treasury.toBase58());

  // Check if account already exists
  const existing = await connection.getAccountInfo(assetStatePda);
  if (existing) {
    console.log("\n✅ AssetState already initialized!");
    saveConfig(assetStatePda, treasury);
    return;
  }

  // Encode instruction data manually:
  // [8 bytes discriminator][8 bytes total_slices u64 LE][8 bytes price_per_slice u64 LE]
  const totalSlices = BigInt(100);
  const pricePerSlice = BigInt(20_000_000); // 0.02 SOL in lamports

  const data = Buffer.alloc(8 + 8 + 8);
  INITIALIZE_ASSET_DISCRIMINATOR.copy(data, 0);
  data.writeBigUInt64LE(totalSlices, 8);
  data.writeBigUInt64LE(pricePerSlice, 16);

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: assetStatePda, isSigner: false, isWritable: true },
      { pubkey: admin.publicKey, isSigner: true, isWritable: true },
      { pubkey: treasury, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });

  const tx = new Transaction().add(instruction);
  console.log("\nSending transaction...");

  const sig = await sendAndConfirmTransaction(connection, tx, [admin], {
    commitment: "confirmed",
  });

  console.log("\n✅ Asset initialized!");
  console.log("   Signature:", sig);
  console.log(`   Solscan:   https://solscan.io/tx/${sig}?cluster=devnet`);

  saveConfig(assetStatePda, treasury);
}

function saveConfig(assetStatePda, treasury) {
  const config = {
    programId: PROGRAM_ID.toBase58(),
    assetStatePda: assetStatePda.toBase58(),
    adminPubkey: treasury.toBase58(),
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
  console.error("\n❌ Error:", err.message || err);
  process.exit(1);
});
