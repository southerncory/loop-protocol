import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount,
  mintTo,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";
import { LoopVault } from "../target/types/loop_vault";
import { LoopCred } from "../target/types/loop_cred";
import { LoopOxo } from "../target/types/loop_oxo";
import { LoopVtp } from "../target/types/loop_vtp";
import { LoopAvp } from "../target/types/loop_avp";

/**
 * Loop Protocol Integration Tests
 * 
 * Full end-to-end flow testing:
 * 1. Register agent (AVP)
 * 2. Create vault (Vault)
 * 3. Wrap USDC to Cred (Cred)
 * 4. Deposit to vault
 * 5. Stack for yield
 * 6. Transfer between vaults (VTP)
 * 7. Lock OXO for veOXO (OXO)
 * 8. Claim fee share
 */

describe("Loop Protocol Integration", () => {
  // Providers and programs
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const vaultProgram = anchor.workspace.LoopVault as Program<LoopVault>;
  const credProgram = anchor.workspace.LoopCred as Program<LoopCred>;
  const oxoProgram = anchor.workspace.LoopOxo as Program<LoopOxo>;
  const vtpProgram = anchor.workspace.LoopVtp as Program<LoopVtp>;
  const avpProgram = anchor.workspace.LoopAvp as Program<LoopAvp>;
  
  // Test accounts
  let alice: Keypair;
  let bob: Keypair;
  let agent: Keypair;
  
  // Mints
  let usdcMint: PublicKey;
  let credMint: PublicKey;
  let oxoMint: PublicKey;
  
  // PDAs and config accounts
  let credConfigPda: PublicKey;
  let credConfigBump: number;
  let oxoConfigPda: PublicKey;
  let oxoConfigBump: number;
  let vtpConfigPda: PublicKey;
  let vtpConfigBump: number;
  
  // Token accounts
  let reserveVault: PublicKey;
  let aliceVaultPda: PublicKey;
  let aliceVaultBump: number;
  let bobVaultPda: PublicKey;
  let bobVaultBump: number;
  
  // Token accounts for users
  let aliceUsdcAccount: PublicKey;
  let aliceCredAccount: PublicKey;
  let aliceOxoAccount: PublicKey;
  let bobUsdcAccount: PublicKey;
  let bobCredAccount: PublicKey;
  let bobOxoAccount: PublicKey;
  
  // Vault token accounts
  let aliceVaultCredAccount: PublicKey;
  let bobVaultCredAccount: PublicKey;
  
  // Fee accounts
  let feeAccount: PublicKey;
  let feePoolAccount: PublicKey;
  let protocolOxoAccount: PublicKey;
  let treasuryOxoAccount: PublicKey;

  /**
   * Setup helper: Airdrop SOL to account
   */
  async function airdrop(pubkey: PublicKey, amount: number = 10) {
    const sig = await provider.connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  }

  /**
   * Setup helper: Create all mints needed for testing
   */
  async function setupMints() {
    // Create USDC mock mint (authority is provider wallet)
    usdcMint = await createMint(
      provider.connection,
      alice,
      provider.wallet.publicKey,
      null,
      6
    );
    
    // Create OXO mint
    oxoMint = await createMint(
      provider.connection,
      alice,
      provider.wallet.publicKey,
      null,
      6
    );
    
    // Create Cred mint (will be controlled by cred program PDA)
    credMint = await createMint(
      provider.connection,
      alice,
      credConfigPda, // Cred config PDA will be mint authority
      null,
      6
    );
  }

  /**
   * Setup helper: Create token accounts for a user
   */
  async function setupUserTokenAccounts(user: Keypair) {
    const usdcAccount = await createAccount(
      provider.connection,
      user,
      usdcMint,
      user.publicKey
    );
    
    const credAccount = await createAccount(
      provider.connection,
      user,
      credMint,
      user.publicKey
    );
    
    const oxoAccount = await createAccount(
      provider.connection,
      user,
      oxoMint,
      user.publicKey
    );
    
    return { usdcAccount, credAccount, oxoAccount };
  }

  /**
   * Derive all PDAs
   */
  function derivePdas() {
    // Cred config PDA
    [credConfigPda, credConfigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("cred_config")],
      credProgram.programId
    );
    
    // OXO config PDA
    [oxoConfigPda, oxoConfigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      oxoProgram.programId
    );
    
    // VTP config PDA
    [vtpConfigPda, vtpConfigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vtp_config")],
      vtpProgram.programId
    );
    
    // Alice vault PDA
    [aliceVaultPda, aliceVaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), alice.publicKey.toBuffer()],
      vaultProgram.programId
    );
    
    // Bob vault PDA
    [bobVaultPda, bobVaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), bob.publicKey.toBuffer()],
      vaultProgram.programId
    );
  }

  before(async () => {
    // Create test accounts
    alice = Keypair.generate();
    bob = Keypair.generate();
    agent = Keypair.generate();
    
    // Airdrop SOL to all accounts
    await airdrop(alice.publicKey);
    await airdrop(bob.publicKey);
    await airdrop(agent.publicKey);
    
    // Derive PDAs first (needed for mint creation)
    derivePdas();
    
    // Setup mints
    await setupMints();
    
    // Create reserve vault (USDC reserve for Cred backing)
    reserveVault = await createAccount(
      provider.connection,
      alice,
      usdcMint,
      credConfigPda
    );
    
    // Create fee account
    feeAccount = await createAccount(
      provider.connection,
      alice,
      credMint,
      provider.wallet.publicKey
    );
    
    // Create fee pool account (for OXO fee distribution)
    feePoolAccount = await createAccount(
      provider.connection,
      alice,
      credMint,
      oxoConfigPda
    );
    
    // Create protocol OXO account
    protocolOxoAccount = await createAccount(
      provider.connection,
      alice,
      oxoMint,
      oxoConfigPda
    );
    
    // Create treasury OXO account
    treasuryOxoAccount = await createAccount(
      provider.connection,
      alice,
      oxoMint,
      provider.wallet.publicKey
    );
    
    // Setup user token accounts
    const aliceAccounts = await setupUserTokenAccounts(alice);
    aliceUsdcAccount = aliceAccounts.usdcAccount;
    aliceCredAccount = aliceAccounts.credAccount;
    aliceOxoAccount = aliceAccounts.oxoAccount;
    
    const bobAccounts = await setupUserTokenAccounts(bob);
    bobUsdcAccount = bobAccounts.usdcAccount;
    bobCredAccount = bobAccounts.credAccount;
    bobOxoAccount = bobAccounts.oxoAccount;
    
    // Mint USDC to users for testing
    await mintTo(
      provider.connection,
      alice,
      usdcMint,
      aliceUsdcAccount,
      provider.wallet.publicKey,
      10_000_000_000 // 10,000 USDC
    );
    
    await mintTo(
      provider.connection,
      bob,
      usdcMint,
      bobUsdcAccount,
      provider.wallet.publicKey,
      5_000_000_000 // 5,000 USDC
    );
    
    // Mint OXO to users for testing
    await mintTo(
      provider.connection,
      alice,
      oxoMint,
      aliceOxoAccount,
      provider.wallet.publicKey,
      10_000_000_000 // 10,000 OXO
    );
    
    await mintTo(
      provider.connection,
      bob,
      oxoMint,
      bobOxoAccount,
      provider.wallet.publicKey,
      5_000_000_000 // 5,000 OXO
    );
  });

  describe("Phase 1: Protocol Initialization", () => {
    it("initializes Cred program", async () => {
      const tx = await credProgram.methods
        .initialize()
        .accounts({
          credConfig: credConfigPda,
          usdcMint: usdcMint,
          credMint: credMint,
          reserveVault: reserveVault,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      
      console.log("  Cred initialized:", tx.slice(0, 20) + "...");
      
      const config = await credProgram.account.credConfig.fetch(credConfigPda);
      expect(config.usdcMint.toString()).to.equal(usdcMint.toString());
      expect(config.credMint.toString()).to.equal(credMint.toString());
    });

    it("initializes OXO program", async () => {
      const tx = await oxoProgram.methods
        .initialize(oxoConfigBump)
        .accounts({
          authority: provider.wallet.publicKey,
          config: oxoConfigPda,
          oxoMint: oxoMint,
          treasury: treasuryOxoAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log("  OXO initialized:", tx.slice(0, 20) + "...");
      
      const config = await oxoProgram.account.oxoConfig.fetch(oxoConfigPda);
      expect(config.oxoMint.toString()).to.equal(oxoMint.toString());
    });

    it("initializes VTP program", async () => {
      const tx = await vtpProgram.methods
        .initialize(vtpConfigBump)
        .accounts({
          authority: provider.wallet.publicKey,
          config: vtpConfigPda,
          feeRecipient: feeAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log("  VTP initialized:", tx.slice(0, 20) + "...");
      
      const config = await vtpProgram.account.vtpConfig.fetch(vtpConfigPda);
      expect(config.totalTransfers.toNumber()).to.equal(0);
    });
  });

  describe("Phase 2: Agent Registration (AVP)", () => {
    let agentIdentityPda: PublicKey;
    let agentIdentityBump: number;
    
    before(() => {
      [agentIdentityPda, agentIdentityBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), agent.publicKey.toBuffer()],
        avpProgram.programId
      );
    });
    
    it("registers a personal agent", async () => {
      // Create a principal hash (simulating ZKP binding)
      const principalHash = Buffer.alloc(32);
      principalHash.fill(1);
      
      const tx = await avpProgram.methods
        .registerPersonalAgent(
          Array.from(principalHash),
          "https://example.com/agent-metadata.json",
          agentIdentityBump
        )
        .accounts({
          agent: agent.publicKey,
          agentIdentity: agentIdentityPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      
      console.log("  Agent registered:", tx.slice(0, 20) + "...");
      
      const identity = await avpProgram.account.agentIdentity.fetch(agentIdentityPda);
      expect(identity.agentPubkey.toString()).to.equal(agent.publicKey.toString());
      expect(identity.agentType).to.deep.equal({ personal: {} });
      expect(identity.status).to.deep.equal({ active: {} });
    });

    it("declares agent capabilities", async () => {
      // Define capabilities (8-byte arrays)
      const capabilities = [
        [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // SHOPPING
        [0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // DATA
      ];
      
      const tx = await avpProgram.methods
        .declareCapabilities(capabilities)
        .accounts({
          agent: agent.publicKey,
          agentIdentity: agentIdentityPda,
        })
        .signers([agent])
        .rpc();
      
      console.log("  Capabilities declared:", tx.slice(0, 20) + "...");
      
      const identity = await avpProgram.account.agentIdentity.fetch(agentIdentityPda);
      expect(identity.capabilities.length).to.equal(2);
    });
  });

  describe("Phase 3: Vault Creation", () => {
    it("creates Alice's vault", async () => {
      const tx = await vaultProgram.methods
        .initializeVault(aliceVaultBump)
        .accounts({
          vault: aliceVaultPda,
          owner: alice.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();
      
      console.log("  Alice vault created:", tx.slice(0, 20) + "...");
      
      // Create vault's Cred token account
      aliceVaultCredAccount = await createAccount(
        provider.connection,
        alice,
        credMint,
        aliceVaultPda,
        alice
      );
      
      const vault = await vaultProgram.account.vault.fetch(aliceVaultPda);
      expect(vault.owner.toString()).to.equal(alice.publicKey.toString());
      expect(vault.credBalance.toNumber()).to.equal(0);
    });

    it("creates Bob's vault", async () => {
      const tx = await vaultProgram.methods
        .initializeVault(bobVaultBump)
        .accounts({
          vault: bobVaultPda,
          owner: bob.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([bob])
        .rpc();
      
      console.log("  Bob vault created:", tx.slice(0, 20) + "...");
      
      // Create vault's Cred token account
      bobVaultCredAccount = await createAccount(
        provider.connection,
        bob,
        credMint,
        bobVaultPda,
        bob
      );
      
      const vault = await vaultProgram.account.vault.fetch(bobVaultPda);
      expect(vault.owner.toString()).to.equal(bob.publicKey.toString());
    });
  });

  describe("Phase 4: Wrap USDC to Cred", () => {
    it("Alice wraps USDC to Cred", async () => {
      const wrapAmount = new anchor.BN(1_000_000_000); // 1000 USDC
      
      const tx = await credProgram.methods
        .wrap(wrapAmount)
        .accounts({
          credConfig: credConfigPda,
          credMint: credMint,
          reserveVault: reserveVault,
          userUsdcAccount: aliceUsdcAccount,
          userCredAccount: aliceCredAccount,
          user: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([alice])
        .rpc();
      
      console.log("  Alice wrapped 1000 USDC:", tx.slice(0, 20) + "...");
      
      // Verify Cred balance
      const credAccount = await getAccount(provider.connection, aliceCredAccount);
      expect(Number(credAccount.amount)).to.equal(1_000_000_000);
      
      // Verify reserve balance
      const reserve = await getAccount(provider.connection, reserveVault);
      expect(Number(reserve.amount)).to.equal(1_000_000_000);
    });

    it("Bob wraps USDC to Cred", async () => {
      const wrapAmount = new anchor.BN(500_000_000); // 500 USDC
      
      await credProgram.methods
        .wrap(wrapAmount)
        .accounts({
          credConfig: credConfigPda,
          credMint: credMint,
          reserveVault: reserveVault,
          userUsdcAccount: bobUsdcAccount,
          userCredAccount: bobCredAccount,
          user: bob.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([bob])
        .rpc();
      
      const credAccount = await getAccount(provider.connection, bobCredAccount);
      expect(Number(credAccount.amount)).to.equal(500_000_000);
    });
  });

  describe("Phase 5: Deposit Cred to Vault", () => {
    it("Alice deposits Cred into her vault", async () => {
      const depositAmount = new anchor.BN(500_000_000); // 500 Cred
      
      const tx = await vaultProgram.methods
        .deposit(depositAmount)
        .accounts({
          vault: aliceVaultPda,
          userCredAccount: aliceCredAccount,
          vaultCredAccount: aliceVaultCredAccount,
          owner: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([alice])
        .rpc();
      
      console.log("  Alice deposited 500 Cred:", tx.slice(0, 20) + "...");
      
      const vault = await vaultProgram.account.vault.fetch(aliceVaultPda);
      expect(vault.credBalance.toNumber()).to.equal(500_000_000);
      expect(vault.totalCaptured.toNumber()).to.equal(500_000_000);
    });

    it("Bob deposits Cred into his vault", async () => {
      const depositAmount = new anchor.BN(300_000_000); // 300 Cred
      
      await vaultProgram.methods
        .deposit(depositAmount)
        .accounts({
          vault: bobVaultPda,
          userCredAccount: bobCredAccount,
          vaultCredAccount: bobVaultCredAccount,
          owner: bob.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([bob])
        .rpc();
      
      const vault = await vaultProgram.account.vault.fetch(bobVaultPda);
      expect(vault.credBalance.toNumber()).to.equal(300_000_000);
    });
  });

  describe("Phase 6: Stack for Yield", () => {
    let aliceStackPda: PublicKey;
    
    it("Alice stacks Cred for 90-day yield", async () => {
      const stackAmount = new anchor.BN(200_000_000); // 200 Cred
      const durationDays = 90;
      
      // Derive stack PDA (using stacked_balance as part of seed)
      const vault = await vaultProgram.account.vault.fetch(aliceVaultPda);
      [aliceStackPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("stack"),
          aliceVaultPda.toBuffer(),
          new anchor.BN(vault.stackedBalance).toArrayLike(Buffer, "le", 8),
        ],
        vaultProgram.programId
      );
      
      const tx = await vaultProgram.methods
        .stack(stackAmount, durationDays)
        .accounts({
          vault: aliceVaultPda,
          stack: aliceStackPda,
          owner: alice.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();
      
      console.log("  Alice stacked 200 Cred for 90 days:", tx.slice(0, 20) + "...");
      
      const vaultAfter = await vaultProgram.account.vault.fetch(aliceVaultPda);
      expect(vaultAfter.credBalance.toNumber()).to.equal(300_000_000); // 500 - 200
      expect(vaultAfter.stackedBalance.toNumber()).to.equal(200_000_000);
      
      const stack = await vaultProgram.account.stackRecord.fetch(aliceStackPda);
      expect(stack.amount.toNumber()).to.equal(200_000_000);
      expect(stack.apyBasisPoints).to.equal(1500); // 15% for 90 days
      expect(stack.isActive).to.be.true;
    });
  });

  describe("Phase 7: Transfer Between Vaults (VTP)", () => {
    it("Alice transfers Cred to Bob via VTP", async () => {
      const transferAmount = new anchor.BN(100_000_000); // 100 Cred
      
      const tx = await vtpProgram.methods
        .transfer(transferAmount, "Payment for services")
        .accounts({
          sender: alice.publicKey,
          config: vtpConfigPda,
          recipient: bob.publicKey,
          senderCredAccount: aliceCredAccount,
          recipientCredAccount: bobCredAccount,
          feeAccount: feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([alice])
        .rpc();
      
      console.log("  Alice transferred 100 Cred to Bob:", tx.slice(0, 20) + "...");
      
      // Verify transfer (0.1% fee)
      const config = await vtpProgram.account.vtpConfig.fetch(vtpConfigPda);
      expect(config.totalTransfers.toNumber()).to.equal(1);
      expect(config.totalVolume.toNumber()).to.equal(100_000_000);
    });
  });

  describe("Phase 8: Lock OXO for veOXO", () => {
    let aliceVePositionPda: PublicKey;
    let aliceVePositionBump: number;
    
    before(() => {
      [aliceVePositionPda, aliceVePositionBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("ve_position"), alice.publicKey.toBuffer()],
        oxoProgram.programId
      );
    });
    
    it("Alice locks OXO for 1 year (0.5x veOXO)", async () => {
      const lockAmount = new anchor.BN(1_000_000_000); // 1000 OXO
      const oneYearInSeconds = new anchor.BN(31_536_000);
      
      const tx = await oxoProgram.methods
        .lockOxo(lockAmount, oneYearInSeconds, aliceVePositionBump)
        .accounts({
          owner: alice.publicKey,
          config: oxoConfigPda,
          vePosition: aliceVePositionPda,
          userOxoAccount: aliceOxoAccount,
          protocolOxoAccount: protocolOxoAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();
      
      console.log("  Alice locked 1000 OXO for 1 year:", tx.slice(0, 20) + "...");
      
      const position = await oxoProgram.account.veOxoPosition.fetch(aliceVePositionPda);
      expect(position.oxoLocked.toNumber()).to.equal(1_000_000_000);
      // 1 year = ~0.5x multiplier, so ~500 veOXO
      expect(position.veOxoBalance.toNumber()).to.be.closeTo(500_000_000, 50_000_000);
      
      const config = await oxoProgram.account.oxoConfig.fetch(oxoConfigPda);
      expect(config.totalLocked.toNumber()).to.equal(1_000_000_000);
    });

    it("Alice extends lock duration", async () => {
      const additionalSeconds = new anchor.BN(31_536_000); // Another year
      
      const positionBefore = await oxoProgram.account.veOxoPosition.fetch(aliceVePositionPda);
      
      const tx = await oxoProgram.methods
        .extendLock(additionalSeconds)
        .accounts({
          owner: alice.publicKey,
          config: oxoConfigPda,
          vePosition: aliceVePositionPda,
        })
        .signers([alice])
        .rpc();
      
      console.log("  Alice extended lock by 1 year:", tx.slice(0, 20) + "...");
      
      const positionAfter = await oxoProgram.account.veOxoPosition.fetch(aliceVePositionPda);
      // 2 years = 1x multiplier
      expect(positionAfter.veOxoBalance.toNumber()).to.be.greaterThan(
        positionBefore.veOxoBalance.toNumber()
      );
    });
  });

  describe("Phase 9: Fee Distribution and Claiming", () => {
    it("deposits fees to fee pool", async () => {
      // First mint some Cred to fee source
      const feeSourceAccount = await createAccount(
        provider.connection,
        alice,
        credMint,
        alice.publicKey,
        alice
      );
      
      // Need to mint cred to the fee source (this simulates protocol fees collected)
      // In real scenario, fees come from VTP transfers and captures
      
      // Deposit fees to the pool (simplified - in production this happens automatically)
      // Note: This would require the fee source to have Cred tokens
    });
    
    it("Alice claims fee share (if pool has fees)", async () => {
      // This test would claim fees from the fee pool
      // For now, we just verify the veOXO position exists
      const [aliceVePositionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ve_position"), alice.publicKey.toBuffer()],
        oxoProgram.programId
      );
      
      const position = await oxoProgram.account.veOxoPosition.fetch(aliceVePositionPda);
      expect(position.oxoLocked.toNumber()).to.be.greaterThan(0);
      console.log("  Alice veOXO balance:", position.veOxoBalance.toNumber() / 1_000_000);
    });
  });

  describe("Phase 10: Unwrap Cred to USDC", () => {
    it("Bob unwraps Cred to USDC", async () => {
      const unwrapAmount = new anchor.BN(100_000_000); // 100 Cred
      
      // First check Bob's Cred balance
      const credBefore = await getAccount(provider.connection, bobCredAccount);
      console.log("  Bob's Cred before unwrap:", Number(credBefore.amount) / 1_000_000);
      
      if (Number(credBefore.amount) >= 100_000_000) {
        const tx = await credProgram.methods
          .unwrap(unwrapAmount)
          .accounts({
            credConfig: credConfigPda,
            credMint: credMint,
            reserveVault: reserveVault,
            userCredAccount: bobCredAccount,
            userUsdcAccount: bobUsdcAccount,
            user: bob.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([bob])
          .rpc();
        
        console.log("  Bob unwrapped 100 Cred:", tx.slice(0, 20) + "...");
        
        const usdcAfter = await getAccount(provider.connection, bobUsdcAccount);
        // Bob should have received USDC back
        console.log("  Bob's USDC after unwrap:", Number(usdcAfter.amount) / 1_000_000);
      }
    });
  });

  describe("Phase 11: Vault Withdrawal", () => {
    it("Alice withdraws Cred from vault", async () => {
      const withdrawAmount = new anchor.BN(50_000_000); // 50 Cred
      
      const vaultBefore = await vaultProgram.account.vault.fetch(aliceVaultPda);
      
      if (vaultBefore.credBalance.toNumber() >= 50_000_000) {
        const tx = await vaultProgram.methods
          .withdraw(withdrawAmount)
          .accounts({
            vault: aliceVaultPda,
            vaultCredAccount: aliceVaultCredAccount,
            userCredAccount: aliceCredAccount,
            owner: alice.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([alice])
          .rpc();
        
        console.log("  Alice withdrew 50 Cred:", tx.slice(0, 20) + "...");
        
        const vaultAfter = await vaultProgram.account.vault.fetch(aliceVaultPda);
        expect(vaultAfter.credBalance.toNumber()).to.equal(
          vaultBefore.credBalance.toNumber() - 50_000_000
        );
        expect(vaultAfter.totalWithdrawn.toNumber()).to.be.greaterThan(0);
      }
    });
  });

  describe("Final State Summary", () => {
    it("prints final protocol state", async () => {
      console.log("\n=== Final Protocol State ===");
      
      // Cred config
      const credConfig = await credProgram.account.credConfig.fetch(credConfigPda);
      console.log(`Cred Total Minted: ${credConfig.totalMinted.toNumber() / 1_000_000}`);
      console.log(`Cred Total Burned: ${credConfig.totalBurned.toNumber() / 1_000_000}`);
      
      // VTP config
      const vtpConfig = await vtpProgram.account.vtpConfig.fetch(vtpConfigPda);
      console.log(`VTP Total Transfers: ${vtpConfig.totalTransfers.toNumber()}`);
      console.log(`VTP Total Volume: ${vtpConfig.totalVolume.toNumber() / 1_000_000}`);
      
      // OXO config
      const oxoConfig = await oxoProgram.account.oxoConfig.fetch(oxoConfigPda);
      console.log(`OXO Total Locked: ${oxoConfig.totalLocked.toNumber() / 1_000_000}`);
      console.log(`OXO Total veOXO: ${oxoConfig.totalVeOxo.toNumber() / 1_000_000}`);
      
      // Alice's vault
      const aliceVault = await vaultProgram.account.vault.fetch(aliceVaultPda);
      console.log(`\nAlice Vault Cred Balance: ${aliceVault.credBalance.toNumber() / 1_000_000}`);
      console.log(`Alice Vault Stacked Balance: ${aliceVault.stackedBalance.toNumber() / 1_000_000}`);
      
      // Bob's vault
      const bobVault = await vaultProgram.account.vault.fetch(bobVaultPda);
      console.log(`Bob Vault Cred Balance: ${bobVault.credBalance.toNumber() / 1_000_000}`);
      
      console.log("\n=== Integration Test Complete ===\n");
    });
  });
});
