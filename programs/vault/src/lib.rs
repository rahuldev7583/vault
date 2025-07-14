use anchor_lang::prelude::*;

declare_id!("T53PESxvh9BB1Hoy2wTwbtFg87yr4we1qotMVpYq5Y7");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
