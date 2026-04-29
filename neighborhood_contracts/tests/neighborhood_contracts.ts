import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
// @ts-ignore - Supress error for unbuilt auto-generated type structures
import { NeighborhoodContracts } from "../target/types/neighborhood_contracts";

describe("neighborhood_contracts backtest", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.NeighborhoodContracts as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  // We'll generate a fresh keypair for the mock asset state
  const assetState = anchor.web3.Keypair.generate();
  const admin = provider.wallet;

  it("Initializes the asset state", async () => {
    const totalSlices = new anchor.BN(10000);
    const pricePerSlice = new anchor.BN(100); // e.g. $1.00 in precision
    
    await program.methods
      .initializeAsset(totalSlices, pricePerSlice)
      .accounts({
        assetState: assetState.publicKey,
        admin: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([assetState])
      .rpc();

    const state = await program.account.assetState.fetch(assetState.publicKey);
    expect(state.totalSlices.toNumber()).to.equal(10000);
    expect(state.availableSlices.toNumber()).to.equal(10000);
    expect(state.pricePerSlice.toNumber()).to.equal(100);
  });

  // Note: Testing `buy_slice` requires a fully mocked SPL-Token mint and associated token accounts
  // for the USDC transfer (buyer_usdc_account and treasury_usdc_account). 
  // In this backtest layout, we validate the state initialization is correctly tracked!
});
