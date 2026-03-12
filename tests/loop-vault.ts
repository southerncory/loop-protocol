import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount,
  mintTo,
  getAccount 
} from "@solana/spl-token";
import { expect } from "chai";
import { LoopVault } from "../target/types/loop_vault";

describe("loop-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.LoopVault as Program<LoopVault>;
  
  let credMint: PublicKey;
  let userCredAccount: PublicKey;
  let vaultCredAccount: PublicKey;
  let userKeypair: Keypair;
  let vaultPda: PublicKey;
  let vaultBump: number;
  
  before(async () => {
    userKeypair = Keypair.generate();
    
    // Airdrop SOL to user
    const airdropSig = await provider.connection.requestAirdrop(
      userKeypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
    
    // Create Cred mint (simulating the cred token)
    credMint = await createMint(
      provider.connection,
      userKeypair,
      provider.wallet.publicKey,
      null,
      6 // 6 decimals like USDC
    );
    
    // Create user's Cred token account
    userCredAccount = await createAccount(
      provider.connection,
      userKeypair,
      credMint,
      userKeypair.publicKey
    );
    
    // Mint some Cred to user
    await mintTo(
      provider.connection,
      userKeypair,
      credMint,
      userCredAccount,
      provider.wallet.publicKey,
      1_000_000_000 // 1000 Cred
    );
    
    // Derive vault PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), userKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    // Create vault's Cred token account
    vaultCredAccount = await createAccount(
      provider.connection,
      userKeypair,
      credMint,
      vaultPda,
      userKeypair // payer
    );
  });
  
  it("initializes a vault", async () => {
    const tx = await program.methods
      .initializeVault(vaultBump)
      .accounts({
        owner: userKeypair.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();
    
    console.log("Initialize vault tx:", tx);
    
    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.owner.toString()).to.equal(userKeypair.publicKey.toString());
    expect(vault.credBalance.toNumber()).to.equal(0);
    expect(vault.stackedBalance.toNumber()).to.equal(0);
  });
  
  it("deposits Cred into vault", async () => {
    const depositAmount = new anchor.BN(100_000_000); // 100 Cred
    
    const tx = await program.methods
      .deposit(depositAmount)
      .accounts({
        owner: userKeypair.publicKey,
        vault: vaultPda,
        userCredAccount: userCredAccount,
        vaultCredAccount: vaultCredAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([userKeypair])
      .rpc();
    
    console.log("Deposit tx:", tx);
    
    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.credBalance.toNumber()).to.equal(100_000_000);
    expect(vault.totalCaptured.toNumber()).to.equal(100_000_000);
    
    // Verify token account balances
    const vaultTokenAccount = await getAccount(provider.connection, vaultCredAccount);
    expect(Number(vaultTokenAccount.amount)).to.equal(100_000_000);
  });
  
  it("stacks Cred for yield", async () => {
    const stackAmount = new anchor.BN(50_000_000); // 50 Cred
    const lockDays = 90; // 90 days
    
    const tx = await program.methods
      .stack(stackAmount, lockDays)
      .accounts({
        owner: userKeypair.publicKey,
        vault: vaultPda,
      })
      .signers([userKeypair])
      .rpc();
    
    console.log("Stack tx:", tx);
    
    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.stackedBalance.toNumber()).to.equal(50_000_000);
    expect(vault.credBalance.toNumber()).to.equal(50_000_000); // Remaining unstacked
  });
  
  it("withdraws Cred from vault", async () => {
    const withdrawAmount = new anchor.BN(25_000_000); // 25 Cred
    
    const beforeUserAccount = await getAccount(provider.connection, userCredAccount);
    const beforeBalance = Number(beforeUserAccount.amount);
    
    const tx = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        owner: userKeypair.publicKey,
        vault: vaultPda,
        vaultCredAccount: vaultCredAccount,
        userCredAccount: userCredAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([userKeypair])
      .rpc();
    
    console.log("Withdraw tx:", tx);
    
    const vault = await program.account.vault.fetch(vaultPda);
    expect(vault.credBalance.toNumber()).to.equal(25_000_000); // 50 - 25
    expect(vault.totalWithdrawn.toNumber()).to.equal(25_000_000);
    
    const afterUserAccount = await getAccount(provider.connection, userCredAccount);
    expect(Number(afterUserAccount.amount)).to.equal(beforeBalance + 25_000_000);
  });
  
  it("fails to withdraw more than available", async () => {
    const withdrawAmount = new anchor.BN(100_000_000); // More than available
    
    try {
      await program.methods
        .withdraw(withdrawAmount)
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
          vaultCredAccount: vaultCredAccount,
          userCredAccount: userCredAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([userKeypair])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("InsufficientBalance");
    }
  });
  
  it("fails to withdraw stacked Cred before unlock", async () => {
    // Try to unstack before lock period
    try {
      await program.methods
        .unstack(0) // Stack ID 0
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
        })
        .signers([userKeypair])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("StillLocked");
    }
  });
});

describe("loop-vault agent permissions", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.LoopVault as Program<LoopVault>;
  
  let userKeypair: Keypair;
  let agentKeypair: Keypair;
  let vaultPda: PublicKey;
  let vaultBump: number;
  
  before(async () => {
    userKeypair = Keypair.generate();
    agentKeypair = Keypair.generate();
    
    // Airdrop SOL
    await provider.connection.requestAirdrop(
      userKeypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    
    // Derive vault PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), userKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    // Initialize vault
    await program.methods
      .initializeVault(vaultBump)
      .accounts({
        owner: userKeypair.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();
  });
  
  it("sets agent permissions", async () => {
    // Permission levels: 0=None, 1=Read, 2=Capture, 3=Guided, 4=Autonomous
    const permissionLevel = 2; // Capture
    
    const tx = await program.methods
      .setAgentPermission(agentKeypair.publicKey, permissionLevel)
      .accounts({
        owner: userKeypair.publicKey,
        vault: vaultPda,
      })
      .signers([userKeypair])
      .rpc();
    
    console.log("Set agent permission tx:", tx);
    
    // Verify permission was set (would need to fetch agent_permissions account)
  });
  
  it("fails when unauthorized agent tries to capture", async () => {
    const unauthorizedAgent = Keypair.generate();
    
    try {
      await program.methods
        .capture(
          new anchor.BN(10_000_000),
          { shopping: {} }, // CaptureType
          "test_merchant"
        )
        .accounts({
          // ... capture accounts with unauthorized agent
        })
        .signers([unauthorizedAgent])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("Unauthorized");
    }
  });
});
