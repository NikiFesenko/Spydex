use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

// Program deployed on Solana Devnet
declare_id!("BYSranfYCar3hF6fFx87N4qx4pHrPuBaajwurGnczBSR");

#[program]
pub mod neighborhood_contracts {
    use super::*;

    /// Initialize a new tokenized real-world asset.
    /// Also initialises the treasury PDA owned by this program
    /// so it can pay sellers back autonomously (AMM model).
    pub fn initialize_asset(
        ctx: Context<InitializeAsset>,
        total_slices: u64,
        price_per_slice: u64,
    ) -> Result<()> {
        let asset = &mut ctx.accounts.asset_state;
        asset.admin = ctx.accounts.admin.key();
        asset.total_slices = total_slices;
        asset.available_slices = total_slices;
        asset.price_per_slice = price_per_slice;
        asset.total_yield_distributed = 0;
        asset.bump = ctx.bumps.asset_state;
        asset.treasury_bump = ctx.bumps.treasury_pda;
        Ok(())
    }

    /// Purchase one or more slices.
    /// Transfers SOL from buyer → treasury PDA.
    /// Creates or updates the buyer's UserPosition account.
    pub fn buy_slice(ctx: Context<BuySlice>, amount_of_slices: u64) -> Result<()> {
        let asset = &mut ctx.accounts.asset_state;
        require!(
            asset.available_slices >= amount_of_slices,
            CustomError::NotEnoughSlices
        );

        let total_cost = amount_of_slices
            .checked_mul(asset.price_per_slice)
            .ok_or(CustomError::ArithmeticOverflow)?;

        // Transfer SOL: buyer → treasury PDA
        let transfer_accounts = Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.treasury_pda.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_accounts,
        );
        system_program::transfer(cpi_ctx, total_cost)?;

        // Update global state
        asset.available_slices -= amount_of_slices;

        // Update / init user position
        let position = &mut ctx.accounts.user_position;
        position.owner = ctx.accounts.buyer.key();
        position.asset = ctx.accounts.asset_state.key();
        position.owned_slices = position
            .owned_slices
            .checked_add(amount_of_slices)
            .ok_or(CustomError::ArithmeticOverflow)?;
        position.bump = ctx.bumps.user_position;

        Ok(())
    }

    /// Sell one or more slices back to the AMM pool.
    /// The oracle price equals the current price_per_slice stored in AssetState.
    /// Transfers SOL: treasury PDA → seller, using PDA signing.
    pub fn sell_slice(ctx: Context<SellSlice>, amount_of_slices: u64) -> Result<()> {
        let position = &mut ctx.accounts.user_position;
        require!(
            position.owned_slices >= amount_of_slices,
            CustomError::NotEnoughOwnedSlices
        );

        let asset = &mut ctx.accounts.asset_state;
        let refund = amount_of_slices
            .checked_mul(asset.price_per_slice)
            .ok_or(CustomError::ArithmeticOverflow)?;

        // Ensure treasury PDA has enough lamports
        let treasury_balance = ctx.accounts.treasury_pda.lamports();
        require!(
            treasury_balance >= refund,
            CustomError::TreasuryInsufficient
        );

        // Treasury PDA signs via seeds
        let admin_key = asset.admin;
        let seeds: &[&[u8]] = &[
            b"treasury",
            admin_key.as_ref(),
            &[asset.treasury_bump],
        ];
        let signer_seeds = &[seeds];

        let transfer_accounts = Transfer {
            from: ctx.accounts.treasury_pda.to_account_info(),
            to: ctx.accounts.seller.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            transfer_accounts,
            signer_seeds,
        );
        system_program::transfer(cpi_ctx, refund)?;

        // Update state
        position.owned_slices -= amount_of_slices;
        asset.available_slices = asset
            .available_slices
            .checked_add(amount_of_slices)
            .ok_or(CustomError::ArithmeticOverflow)?;

        Ok(())
    }
}

// ─── Account structs ──────────────────────────────────────────────────────────

#[account]
pub struct AssetState {
    pub admin: Pubkey,
    pub total_slices: u64,
    pub available_slices: u64,
    pub price_per_slice: u64, // in lamports (oracle price)
    pub total_yield_distributed: u64,
    pub bump: u8,
    pub treasury_bump: u8,
}

impl AssetState {
    // 8 disc + 32 admin + 8*4 u64s + 1 bump + 1 treasury_bump
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct UserPosition {
    pub owner: Pubkey,
    pub asset: Pubkey,
    pub owned_slices: u64,
    pub bump: u8,
}

impl UserPosition {
    // 8 disc + 32 owner + 32 asset + 8 slices + 1 bump
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1;
}

// ─── Instruction contexts ─────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeAsset<'info> {
    #[account(
        init,
        payer = admin,
        space = AssetState::LEN,
        seeds = [b"asset", admin.key().as_ref()],
        bump
    )]
    pub asset_state: Account<'info, AssetState>,

    /// Program-owned treasury PDA — receives purchase SOL and pays out sellers.
    #[account(
        init,
        payer = admin,
        space = 8,
        seeds = [b"treasury", admin.key().as_ref()],
        bump
    )]
    pub treasury_pda: Account<'info, TreasuryPlaceholder>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuySlice<'info> {
    #[account(
        mut,
        seeds = [b"asset", asset_state.admin.as_ref()],
        bump = asset_state.bump
    )]
    pub asset_state: Account<'info, AssetState>,

    /// Treasury PDA receives the SOL payment.
    /// CHECK: Validated by seeds — this is the program-owned treasury.
    #[account(
        mut,
        seeds = [b"treasury", asset_state.admin.as_ref()],
        bump = asset_state.treasury_bump
    )]
    pub treasury_pda: UncheckedAccount<'info>,

    /// Buyer's position account — init if it doesn't exist yet.
    #[account(
        init_if_needed,
        payer = buyer,
        space = UserPosition::LEN,
        seeds = [b"user", asset_state.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellSlice<'info> {
    #[account(
        mut,
        seeds = [b"asset", asset_state.admin.as_ref()],
        bump = asset_state.bump
    )]
    pub asset_state: Account<'info, AssetState>,

    /// Treasury PDA pays the seller.
    /// CHECK: Validated by seeds — program-owned treasury.
    #[account(
        mut,
        seeds = [b"treasury", asset_state.admin.as_ref()],
        bump = asset_state.treasury_bump
    )]
    pub treasury_pda: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"user", asset_state.key().as_ref(), seller.key().as_ref()],
        bump = user_position.bump,
        has_one = owner @ CustomError::Unauthorized
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub seller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Minimal placeholder so the treasury PDA is an Anchor-managed account
#[account]
pub struct TreasuryPlaceholder {}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum CustomError {
    #[msg("Not enough slices available in the pool.")]
    NotEnoughSlices,
    #[msg("You don't own enough slices to sell.")]
    NotEnoughOwnedSlices,
    #[msg("Treasury does not have enough SOL to refund.")]
    TreasuryInsufficient,
    #[msg("Arithmetic overflow.")]
    ArithmeticOverflow,
    #[msg("Unauthorized: signer is not the position owner.")]
    Unauthorized,
}