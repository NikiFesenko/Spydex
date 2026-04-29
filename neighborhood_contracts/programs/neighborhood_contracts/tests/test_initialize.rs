use {
    anchor_lang::{
        solana_program::{instruction::Instruction, system_program},
        InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

#[test]
fn test_initialize_asset() {
    let program_id = neighborhood_contracts::id();
    let admin = Keypair::new();
    let treasury = Keypair::new();
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/neighborhood_contracts.so");
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&admin.pubkey(), 5_000_000_000).unwrap();

    // Derive the PDA for asset_state
    let (asset_state_pda, _bump) = anchor_lang::solana_program::pubkey::Pubkey::find_program_address(
        &[b"asset", admin.pubkey().as_ref()],
        &program_id,
    );

    let instruction = Instruction::new_with_bytes(
        program_id,
        &neighborhood_contracts::instruction::InitializeAsset {
            total_slices: 100,
            price_per_slice: 50_000_000, // 0.05 SOL in lamports
        }
        .data(),
        neighborhood_contracts::accounts::InitializeAsset {
            asset_state: asset_state_pda,
            admin: admin.pubkey(),
            treasury: treasury.pubkey(),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[instruction], Some(&admin.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[admin]).unwrap();

    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "initialize_asset failed: {:?}", res.err());
}
