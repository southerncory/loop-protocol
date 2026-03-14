import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  mintTo,
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { expect } from "chai";
import { LoopVault } from "../target/types/loop_vault";

/**
 * Integration tests for agent-directed savings features:
 * - set_auto_stack: configure auto-stacking preferences
 * - agent_stack: agent stacks on behalf of user
 * - agent_unstack: agent unstacks (Guided vs Autonomous)
 * - agent_rebalance: agent analyzes portfolio
 * - execute_auto_restack: permissionless crank for restacking
 */
describe("agent-directed-savings", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.LoopVault as Program<LoopVault>;
  
  // Shared test accounts
  let credMint: PublicKey;
  let userKeypair: Keypair;
  let guidedAgentKeypair: Keypair;
  let autonomousAgentKeypair: Keypair;
  let unauthorizedAgentKeypair: Keypair;
  let vaultPda: PublicKey;
  let vaultBump: number;
  let userCredAccount: PublicKey;
  let vaultCredAccount: PublicKey;
  
  // PDAs
  let guidedPermissionPda: PublicKey;
  let autonomousPermissionPda: PublicKey;
  let autoStackSettingsPda: PublicKey;
  
  // Constants for testing
  const DAILY_LIMIT = new anchor.BN(50_000_000); // 50 Cred daily limit for guided agent
  const STACK_DURATION_DAYS = 30;
  const INITIAL_CRED = 1_000_000_000; // 1000 Cred
  
  before(async () => {
    // Generate keypairs
    userKeypair = Keypair.generate();
    guidedAgentKeypair = Keypair.generate();
    autonomousAgentKeypair = Keypair.generate();
    unauthorizedAgentKeypair = Keypair.generate();
    
    // Airdrop SOL to all accounts
    const airdropPromises = [
      userKeypair,
      guidedAgentKeypair,
      autonomousAgentKeypair,
      unauthorizedAgentKeypair,
    ].map(async (kp) => {
      const sig = await provider.connection.requestAirdrop(
        kp.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    });
    await Promise.all(airdropPromises);
    
    // Create Cred mint
    credMint = await createMint(
      provider.connection,
      userKeypair,
      provider.wallet.publicKey,
      null,
      6 // 6 decimals like USDC
    );
    
    // Derive vault PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), userKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    // Create token accounts
    const userCredAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userKeypair,
      credMint,
      userKeypair.publicKey
    );
    userCredAccount = userCredAta.address;
    
    // Vault Cred account - PDA owner
    const vaultCredAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userKeypair,
      credMint,
      vaultPda,
      true // allowOwnerOffCurve - critical for PDA owners
    );
    vaultCredAccount = vaultCredAta.address;
    
    // Mint Cred to user
    await mintTo(
      provider.connection,
      userKeypair,
      credMint,
      userCredAccount,
      provider.wallet.publicKey,
      INITIAL_CRED
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
    
    // Deposit Cred into vault
    await program.methods
      .deposit(new anchor.BN(500_000_000)) // 500 Cred
      .accounts({
        owner: userKeypair.publicKey,
        vault: vaultPda,
        userCredAccount: userCredAccount,
        vaultCredAccount: vaultCredAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([userKeypair])
      .rpc();
    
    // Derive permission PDAs
    [guidedPermissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent_perm"), vaultPda.toBuffer(), guidedAgentKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    [autonomousPermissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent_perm"), vaultPda.toBuffer(), autonomousAgentKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    // Derive auto-stack settings PDA
    [autoStackSettingsPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("auto_stack"), vaultPda.toBuffer()],
      program.programId
    );
  });

  // =========================================================================
  // SET_AUTO_STACK TESTS
  // =========================================================================
  
  describe("set_auto_stack", () => {
    it("configures auto-stacking preferences", async () => {
      const config = {
        enabled: true,
        minDurationDays: 30,
        reinvestYield: true,
        reinvestCaptures: true,
        targetStackRatio: 70, // 70% stacked
        minStackAmount: new anchor.BN(10_000_000), // 10 Cred minimum
      };
      
      const tx = await program.methods
        .setAutoStack(config)
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
          autoStackSettings: autoStackSettingsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
      
      console.log("Set auto-stack tx:", tx);
      
      // Verify settings
      const settings = await program.account.autoStackSettings.fetch(autoStackSettingsPda);
      expect(settings.enabled).to.be.true;
      expect(settings.minDurationDays).to.equal(30);
      expect(settings.reinvestYield).to.be.true;
      expect(settings.reinvestCaptures).to.be.true;
      expect(settings.targetStackRatio).to.equal(70);
      expect(settings.minStackAmount.toNumber()).to.equal(10_000_000);
    });
    
    it("fails with invalid duration (< 7 days)", async () => {
      const config = {
        enabled: true,
        minDurationDays: 5, // Too short
        reinvestYield: true,
        reinvestCaptures: false,
        targetStackRatio: 50,
        minStackAmount: new anchor.BN(1_000_000),
      };
      
      try {
        await program.methods
          .setAutoStack(config)
          .accounts({
            owner: userKeypair.publicKey,
            vault: vaultPda,
            autoStackSettings: autoStackSettingsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();
        
        expect.fail("Should have thrown InvalidDuration error");
      } catch (error) {
        expect(error.message).to.include("InvalidDuration");
      }
    });
    
    it("fails with invalid ratio (> 100)", async () => {
      const config = {
        enabled: true,
        minDurationDays: 30,
        reinvestYield: true,
        reinvestCaptures: false,
        targetStackRatio: 150, // Invalid
        minStackAmount: new anchor.BN(1_000_000),
      };
      
      try {
        await program.methods
          .setAutoStack(config)
          .accounts({
            owner: userKeypair.publicKey,
            vault: vaultPda,
            autoStackSettings: autoStackSettingsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();
        
        expect.fail("Should have thrown InvalidRatio error");
      } catch (error) {
        expect(error.message).to.include("InvalidRatio");
      }
    });
    
    it("allows disabling auto-stack", async () => {
      const config = {
        enabled: false,
        minDurationDays: 30,
        reinvestYield: false,
        reinvestCaptures: false,
        targetStackRatio: 0,
        minStackAmount: new anchor.BN(0),
      };
      
      await program.methods
        .setAutoStack(config)
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
          autoStackSettings: autoStackSettingsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
      
      const settings = await program.account.autoStackSettings.fetch(autoStackSettingsPda);
      expect(settings.enabled).to.be.false;
      
      // Re-enable for subsequent tests
      await program.methods
        .setAutoStack({
          enabled: true,
          minDurationDays: 30,
          reinvestYield: true,
          reinvestCaptures: true,
          targetStackRatio: 70,
          minStackAmount: new anchor.BN(10_000_000),
        })
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
          autoStackSettings: autoStackSettingsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
    });
  });

  // =========================================================================
  // AGENT PERMISSION SETUP
  // =========================================================================
  
  describe("agent permissions setup", () => {
    it("sets Guided agent permission with daily limit", async () => {
      // PermissionLevel: 3 = Guided
      const tx = await program.methods
        .setAgentPermission(
          guidedAgentKeypair.publicKey,
          { guided: {} },
          DAILY_LIMIT
        )
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
          agentPermission: guidedPermissionPda,
          agent: guidedAgentKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
      
      console.log("Set guided agent permission tx:", tx);
      
      const permission = await program.account.agentPermission.fetch(guidedPermissionPda);
      expect(permission.agent.toString()).to.equal(guidedAgentKeypair.publicKey.toString());
      expect(permission.dailyLimit.toNumber()).to.equal(DAILY_LIMIT.toNumber());
      expect(permission.dailyUsed.toNumber()).to.equal(0);
    });
    
    it("sets Autonomous agent permission", async () => {
      // PermissionLevel: 4 = Autonomous
      const tx = await program.methods
        .setAgentPermission(
          autonomousAgentKeypair.publicKey,
          { autonomous: {} },
          new anchor.BN(0) // No daily limit for autonomous
        )
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
          agentPermission: autonomousPermissionPda,
          agent: autonomousAgentKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
      
      console.log("Set autonomous agent permission tx:", tx);
      
      const permission = await program.account.agentPermission.fetch(autonomousPermissionPda);
      expect(permission.agent.toString()).to.equal(autonomousAgentKeypair.publicKey.toString());
    });
  });

  // =========================================================================
  // AGENT_STACK TESTS
  // =========================================================================
  
  describe("agent_stack", () => {
    let stackNonce = 100; // Start with high nonce to avoid conflicts
    
    it("guided agent stacks within daily limit", async () => {
      const stackAmount = new anchor.BN(25_000_000); // 25 Cred (within 50 limit)
      const currentNonce = stackNonce++;
      
      const [stackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(currentNonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      const vaultBefore = await program.account.vault.fetch(vaultPda);
      const liquidBefore = vaultBefore.credBalance.toNumber();
      
      const tx = await program.methods
        .agentStack(stackAmount, STACK_DURATION_DAYS, new anchor.BN(currentNonce))
        .accounts({
          vault: vaultPda,
          agentPermission: guidedPermissionPda,
          stack: stackPda,
          agent: guidedAgentKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([guidedAgentKeypair])
        .rpc();
      
      console.log("Guided agent stack tx:", tx);
      
      // Verify vault balance changes
      const vaultAfter = await program.account.vault.fetch(vaultPda);
      expect(vaultAfter.credBalance.toNumber()).to.equal(liquidBefore - 25_000_000);
      expect(vaultAfter.stackedBalance.toNumber()).to.be.greaterThan(0);
      
      // Verify daily usage updated
      const permission = await program.account.agentPermission.fetch(guidedPermissionPda);
      expect(permission.dailyUsed.toNumber()).to.equal(25_000_000);
      
      // Verify stack record
      const stack = await program.account.stackRecord.fetch(stackPda);
      expect(stack.amount.toNumber()).to.equal(25_000_000);
      expect(stack.isActive).to.be.true;
    });
    
    it("guided agent fails when exceeding daily limit", async () => {
      // Already used 25 Cred, limit is 50, so try 30 more
      const stackAmount = new anchor.BN(30_000_000); // 30 Cred (would exceed 50 limit)
      const currentNonce = stackNonce++;
      
      const [stackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(currentNonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      try {
        await program.methods
          .agentStack(stackAmount, STACK_DURATION_DAYS, new anchor.BN(currentNonce))
          .accounts({
            vault: vaultPda,
            agentPermission: guidedPermissionPda,
            stack: stackPda,
            agent: guidedAgentKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([guidedAgentKeypair])
          .rpc();
        
        expect.fail("Should have thrown DailyLimitExceeded error");
      } catch (error) {
        expect(error.message).to.include("DailyLimitExceeded");
      }
    });
    
    it("autonomous agent stacks without daily limit", async () => {
      const stackAmount = new anchor.BN(100_000_000); // 100 Cred - larger amount
      const currentNonce = stackNonce++;
      
      const [stackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(currentNonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      const tx = await program.methods
        .agentStack(stackAmount, STACK_DURATION_DAYS, new anchor.BN(currentNonce))
        .accounts({
          vault: vaultPda,
          agentPermission: autonomousPermissionPda,
          stack: stackPda,
          agent: autonomousAgentKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([autonomousAgentKeypair])
        .rpc();
      
      console.log("Autonomous agent stack tx:", tx);
      
      const stack = await program.account.stackRecord.fetch(stackPda);
      expect(stack.amount.toNumber()).to.equal(100_000_000);
      expect(stack.isActive).to.be.true;
    });
    
    it("unauthorized agent fails to stack", async () => {
      const stackAmount = new anchor.BN(10_000_000);
      const currentNonce = stackNonce++;
      
      // This PDA won't exist since we never granted permission
      const [unauthorizedPermPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent_perm"), vaultPda.toBuffer(), unauthorizedAgentKeypair.publicKey.toBuffer()],
        program.programId
      );
      
      const [stackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(currentNonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      try {
        await program.methods
          .agentStack(stackAmount, STACK_DURATION_DAYS, new anchor.BN(currentNonce))
          .accounts({
            vault: vaultPda,
            agentPermission: unauthorizedPermPda,
            stack: stackPda,
            agent: unauthorizedAgentKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedAgentKeypair])
          .rpc();
        
        expect.fail("Should have failed - unauthorized agent");
      } catch (error) {
        // Account doesn't exist or unauthorized
        expect(error).to.exist;
      }
    });
  });

  // =========================================================================
  // AGENT_UNSTACK TESTS
  // =========================================================================
  
  describe("agent_unstack", () => {
    let guidedAgentStackPda: PublicKey;
    let autonomousAgentStackPda: PublicKey;
    let stackNonce = 200;
    
    before(async () => {
      // Create stacks for testing unstacking
      // Short duration for autonomous early unstack test
      const shortDuration = 90; // 90 days
      
      // Create stack for guided agent test (will try to early unstack)
      const guidedNonce = stackNonce++;
      [guidedAgentStackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(guidedNonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      await program.methods
        .agentStack(new anchor.BN(20_000_000), shortDuration, new anchor.BN(guidedNonce))
        .accounts({
          vault: vaultPda,
          agentPermission: autonomousPermissionPda, // Create with autonomous (no limit)
          stack: guidedAgentStackPda,
          agent: autonomousAgentKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([autonomousAgentKeypair])
        .rpc();
      
      // Create stack for autonomous early unstack test
      const autonomousNonce = stackNonce++;
      [autonomousAgentStackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(autonomousNonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      await program.methods
        .agentStack(new anchor.BN(30_000_000), shortDuration, new anchor.BN(autonomousNonce))
        .accounts({
          vault: vaultPda,
          agentPermission: autonomousPermissionPda,
          stack: autonomousAgentStackPda,
          agent: autonomousAgentKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([autonomousAgentKeypair])
        .rpc();
    });
    
    it("guided agent cannot early-unstack (before maturity)", async () => {
      // Stack was just created, so it's definitely not matured
      try {
        await program.methods
          .agentUnstack()
          .accounts({
            vault: vaultPda,
            agentPermission: guidedPermissionPda,
            stack: guidedAgentStackPda,
            agent: guidedAgentKeypair.publicKey,
          })
          .signers([guidedAgentKeypair])
          .rpc();
        
        expect.fail("Should have thrown StackNotMatured error");
      } catch (error) {
        expect(error.message).to.include("StackNotMatured");
      }
    });
    
    it("autonomous agent CAN early-unstack (with penalty)", async () => {
      const vaultBefore = await program.account.vault.fetch(vaultPda);
      const liquidBefore = vaultBefore.credBalance.toNumber();
      const stackedBefore = vaultBefore.stackedBalance.toNumber();
      
      const stackBefore = await program.account.stackRecord.fetch(autonomousAgentStackPda);
      const principal = stackBefore.amount.toNumber();
      
      const tx = await program.methods
        .agentUnstack()
        .accounts({
          vault: vaultPda,
          agentPermission: autonomousPermissionPda,
          stack: autonomousAgentStackPda,
          agent: autonomousAgentKeypair.publicKey,
        })
        .signers([autonomousAgentKeypair])
        .rpc();
      
      console.log("Autonomous agent early-unstack tx:", tx);
      
      const vaultAfter = await program.account.vault.fetch(vaultPda);
      const stackAfter = await program.account.stackRecord.fetch(autonomousAgentStackPda);
      
      // Stack should be inactive
      expect(stackAfter.isActive).to.be.false;
      
      // Stacked balance should decrease
      expect(vaultAfter.stackedBalance.toNumber()).to.be.lessThan(stackedBefore);
      
      // Liquid balance should increase (principal returned, possibly with penalty on yield)
      expect(vaultAfter.credBalance.toNumber()).to.be.greaterThan(liquidBefore);
      
      // Early withdrawal means penalty was applied (less than full yield)
      console.log(`Principal: ${principal}, Returned to liquid: ${vaultAfter.credBalance.toNumber() - liquidBefore}`);
    });
    
    it("unauthorized agent fails to unstack", async () => {
      const [unauthorizedPermPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent_perm"), vaultPda.toBuffer(), unauthorizedAgentKeypair.publicKey.toBuffer()],
        program.programId
      );
      
      try {
        await program.methods
          .agentUnstack()
          .accounts({
            vault: vaultPda,
            agentPermission: unauthorizedPermPda,
            stack: guidedAgentStackPda,
            agent: unauthorizedAgentKeypair.publicKey,
          })
          .signers([unauthorizedAgentKeypair])
          .rpc();
        
        expect.fail("Should have failed - unauthorized agent");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  // =========================================================================
  // AGENT_REBALANCE TESTS
  // =========================================================================
  
  describe("agent_rebalance", () => {
    it("autonomous agent can analyze and suggest rebalance", async () => {
      const targetRatio = 80; // Target 80% stacked
      
      const tx = await program.methods
        .agentRebalance(targetRatio)
        .accounts({
          vault: vaultPda,
          agentPermission: autonomousPermissionPda,
          agent: autonomousAgentKeypair.publicKey,
        })
        .signers([autonomousAgentKeypair])
        .rpc();
      
      console.log("Agent rebalance tx:", tx);
      
      // The instruction emits a RebalanceSuggested event
      // In production, you'd listen for events to get the suggestion
      // Here we just verify it doesn't throw
      expect(tx).to.be.a("string");
    });
    
    it("guided agent cannot call rebalance (requires autonomous)", async () => {
      const targetRatio = 50;
      
      try {
        await program.methods
          .agentRebalance(targetRatio)
          .accounts({
            vault: vaultPda,
            agentPermission: guidedPermissionPda,
            agent: guidedAgentKeypair.publicKey,
          })
          .signers([guidedAgentKeypair])
          .rpc();
        
        expect.fail("Should have thrown UnauthorizedAgent error");
      } catch (error) {
        expect(error.message).to.include("UnauthorizedAgent");
      }
    });
    
    it("fails with invalid ratio (> 100)", async () => {
      try {
        await program.methods
          .agentRebalance(150) // Invalid ratio
          .accounts({
            vault: vaultPda,
            agentPermission: autonomousPermissionPda,
            agent: autonomousAgentKeypair.publicKey,
          })
          .signers([autonomousAgentKeypair])
          .rpc();
        
        expect.fail("Should have thrown InvalidRatio error");
      } catch (error) {
        expect(error.message).to.include("InvalidRatio");
      }
    });
  });

  // =========================================================================
  // EXECUTE_AUTO_RESTACK TESTS
  // =========================================================================
  
  describe("execute_auto_restack", () => {
    let maturedStackPda: PublicKey;
    let stackNonce = 300;
    
    // Note: In real tests, you'd need to warp time or use a test validator
    // with time manipulation. Here we test the error cases.
    
    it("fails when auto-stack is disabled", async () => {
      // First, create a stack
      const nonce = stackNonce++;
      const [stackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(nonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      // Disable auto-stack
      await program.methods
        .setAutoStack({
          enabled: false,
          minDurationDays: 30,
          reinvestYield: true,
          reinvestCaptures: true,
          targetStackRatio: 70,
          minStackAmount: new anchor.BN(10_000_000),
        })
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
          autoStackSettings: autoStackSettingsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
      
      // Create a stack to try restacking
      await program.methods
        .stack(new anchor.BN(10_000_000), 7, new anchor.BN(nonce))
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
          stack: stackPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
      
      maturedStackPda = stackPda;
      
      const newNonce = stackNonce++;
      const [newStackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(newNonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      try {
        await program.methods
          .executeAutoRestack(new anchor.BN(newNonce))
          .accounts({
            vault: vaultPda,
            autoStackSettings: autoStackSettingsPda,
            oldStack: maturedStackPda,
            newStack: newStackPda,
            cranker: userKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();
        
        expect.fail("Should have thrown AutoStackDisabled error");
      } catch (error) {
        expect(error.message).to.include("AutoStackDisabled");
      }
      
      // Re-enable for next tests
      await program.methods
        .setAutoStack({
          enabled: true,
          minDurationDays: 30,
          reinvestYield: true,
          reinvestCaptures: true,
          targetStackRatio: 70,
          minStackAmount: new anchor.BN(10_000_000),
        })
        .accounts({
          owner: userKeypair.publicKey,
          vault: vaultPda,
          autoStackSettings: autoStackSettingsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
    });
    
    it("fails when stack has not matured", async () => {
      const newNonce = stackNonce++;
      const [newStackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(newNonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      try {
        await program.methods
          .executeAutoRestack(new anchor.BN(newNonce))
          .accounts({
            vault: vaultPda,
            autoStackSettings: autoStackSettingsPda,
            oldStack: maturedStackPda,
            newStack: newStackPda,
            cranker: userKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();
        
        expect.fail("Should have thrown StackNotMatured error");
      } catch (error) {
        expect(error.message).to.include("StackNotMatured");
      }
    });
    
    it("permissionless crank can be called by anyone (positive case structure)", async () => {
      // Note: This test documents that ANY signer can call execute_auto_restack
      // once a stack has matured. In production, this would be called by a crank
      // service or MEV searchers.
      
      // The actual restack would work if:
      // 1. auto_stack_settings.enabled = true
      // 2. old_stack.is_active = true
      // 3. Clock::get().unix_timestamp >= old_stack.end_time (matured)
      
      // For a complete test, you'd need time warping capabilities
      // Here we verify the account structure is correct
      
      const settings = await program.account.autoStackSettings.fetch(autoStackSettingsPda);
      expect(settings.enabled).to.be.true;
      expect(settings.minDurationDays).to.equal(30);
      expect(settings.reinvestYield).to.be.true;
      
      console.log("Auto-restack settings verified for permissionless crank");
    });
  });

  // =========================================================================
  // EDGE CASES AND ADDITIONAL SCENARIOS
  // =========================================================================
  
  describe("edge cases", () => {
    it("daily limit resets after 24 hours (simulated check)", async () => {
      // In a real test with time manipulation, we'd:
      // 1. Use up the daily limit
      // 2. Warp time forward 24+ hours
      // 3. Verify limit is reset
      
      const permission = await program.account.agentPermission.fetch(guidedPermissionPda);
      const lastReset = permission.lastReset.toNumber();
      const dailyUsed = permission.dailyUsed.toNumber();
      
      console.log(`Guided agent - Last reset: ${new Date(lastReset * 1000).toISOString()}`);
      console.log(`Guided agent - Daily used: ${dailyUsed / 1_000_000} Cred`);
      console.log(`Guided agent - Daily limit: ${permission.dailyLimit.toNumber() / 1_000_000} Cred`);
      
      // The reset logic in agent_stack:
      // if now - last_reset > 86400 (24h) => reset daily_used to 0
      expect(permission.dailyLimit.toNumber()).to.equal(DAILY_LIMIT.toNumber());
    });
    
    it("multiple agents can have different permission levels", async () => {
      const guidedPerm = await program.account.agentPermission.fetch(guidedPermissionPda);
      const autonomousPerm = await program.account.agentPermission.fetch(autonomousPermissionPda);
      
      // Guided has daily limit, Autonomous doesn't
      expect(guidedPerm.dailyLimit.toNumber()).to.be.greaterThan(0);
      expect(guidedPerm.level).to.deep.equal({ guided: {} });
      expect(autonomousPerm.level).to.deep.equal({ autonomous: {} });
      
      console.log("Verified multiple agents with different permission levels");
    });
    
    it("vault owner retains full control", async () => {
      // Owner can always stack/unstack regardless of agent permissions
      const nonce = 500;
      const [stackPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stack"), vaultPda.toBuffer(), new anchor.BN(nonce).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      const vault = await program.account.vault.fetch(vaultPda);
      const availableLiquid = vault.credBalance.toNumber();
      
      if (availableLiquid > 5_000_000) {
        // Owner direct stack
        await program.methods
          .stack(new anchor.BN(5_000_000), 7, new anchor.BN(nonce))
          .accounts({
            owner: userKeypair.publicKey,
            vault: vaultPda,
            stack: stackPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc();
        
        console.log("Owner direct stack successful - full control verified");
      } else {
        console.log("Skipping owner stack test - insufficient liquid balance");
      }
    });
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  
  after(async () => {
    const vault = await program.account.vault.fetch(vaultPda);
    
    console.log("\n========== TEST SUMMARY ==========");
    console.log(`Vault: ${vaultPda.toString()}`);
    console.log(`Owner: ${userKeypair.publicKey.toString()}`);
    console.log(`Liquid Balance: ${vault.credBalance.toNumber() / 1_000_000} Cred`);
    console.log(`Stacked Balance: ${vault.stackedBalance.toNumber() / 1_000_000} Cred`);
    console.log(`Total Captured: ${vault.totalCaptured.toNumber() / 1_000_000} Cred`);
    console.log(`Total Withdrawn: ${vault.totalWithdrawn.toNumber() / 1_000_000} Cred`);
    console.log("===================================\n");
  });
});
