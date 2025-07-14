import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { assert } from "chai";

describe("vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;
  const user = provider.wallet;

  let vaultStatePda: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;
  let vaultBump: number;
  let stateBump: number;

  it("Initialize", async () => {
    [vaultStatePda, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("state"), user.publicKey.toBuffer()],
      program.programId
    );

    [vaultPda, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("vault"), vaultStatePda.toBuffer()],
      program.programId
    );

    await program.methods
      .initialize()
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const vaultState = await program.account.vaultState.fetch(vaultStatePda);
    assert.equal(vaultState.vaultBump, vaultBump);
    assert.equal(vaultState.stateBump, stateBump);
  });

  it("Deposit", async () => {
    const depositAmount = anchor.web3.LAMPORTS_PER_SOL / 100; 

    const vaultBefore = await provider.connection.getBalance(vaultPda);
    const userBefore = await provider.connection.getBalance(user.publicKey);

    await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        vaultState: vaultStatePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const vaultAfter = await provider.connection.getBalance(vaultPda);
    const userAfter = await provider.connection.getBalance(user.publicKey);

    assert.equal(vaultAfter, vaultBefore + depositAmount);
    assert.isBelow(userAfter, userBefore); 
  });

  it("Withdraw", async () => {
    const withdrawAmount = anchor.web3.LAMPORTS_PER_SOL / 200; 

    const vaultBefore = await provider.connection.getBalance(vaultPda);
    const userBefore = await provider.connection.getBalance(user.publicKey);

    await program.methods
      .withdraw(new anchor.BN(withdrawAmount))
      .accounts({
        user: user.publicKey,
        vault: vaultPda,
        vaultState: vaultStatePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const vaultAfter = await provider.connection.getBalance(vaultPda);
    const userAfter = await provider.connection.getBalance(user.publicKey);

    assert.equal(vaultAfter, vaultBefore - withdrawAmount);
    assert.isAbove(userAfter, userBefore); 
  });

  it("Close", async () => {
    await program.methods
      .close()
      .accounts({
        user: user.publicKey,
        vaultState: vaultStatePda,
      })
      .rpc();

    try {
      await program.account.vaultState.fetch(vaultStatePda);
      assert.fail("Vault state should have been closed");
    } catch (err) {
      assert.ok(err.message.includes("Account does not exist"));
    }
  });
});
