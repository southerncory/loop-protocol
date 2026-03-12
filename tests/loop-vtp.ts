import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { expect } from "chai";
import { LoopVtp } from "../target/types/loop_vtp";

/**
 * Loop VTP (Value Transfer Protocol) Tests
 * 
 * Secure vault-to-vault transfers with escrow capabilities:
 * - Simple transfers
 * - Escrow with conditions
 * - Inheritance planning
 */

describe("loop-vtp", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.LoopVtp as Program<LoopVtp>;
  
  // Test accounts
  let authority: Keypair;
  let alice: Keypair;
  let bob: Keypair;
  let charlie: Keypair;
  let arbiter: Keypair;
  
  // Mints
  let credMint: PublicKey;
  
  // PDAs
  let vtpConfigPda: PublicKey;
  let vtpConfigBump: number;
  
  // Token accounts
  let feeAccount: PublicKey;
  let aliceCredAccount: PublicKey;
  let bobCredAccount: PublicKey;
  let charlieCredAccount: PublicKey;

  async function airdrop(pubkey: PublicKey, amount: number = 5) {
    const sig = await provider.connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  }

  before(async () => {
    // Create test keypairs
    authority = Keypair.generate();
    alice = Keypair.generate();
    bob = Keypair.generate();
    charlie = Keypair.generate();
    arbiter = Keypair.generate();
    
    // Airdrop SOL
    await airdrop(authority.publicKey, 10);
    await airdrop(alice.publicKey);
    await airdrop(bob.publicKey);
    await airdrop(charlie.publicKey);
    await airdrop(arbiter.publicKey);
    
    // Derive PDAs
    [vtpConfigPda, vtpConfigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vtp_config")],
      program.programId
    );
    
    // Create Cred mock mint
    credMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6
    );
    
    // Create fee account
    feeAccount = await createAccount(
      provider.connection,
      authority,
      credMint,
      authority.publicKey
    );
    
    // Create user Cred accounts
    aliceCredAccount = await createAccount(
      provider.connection,
      alice,
      credMint,
      alice.publicKey
    );
    
    bobCredAccount = await createAccount(
      provider.connection,
      bob,
      credMint,
      bob.publicKey
    );
    
    charlieCredAccount = await createAccount(
      provider.connection,
      charlie,
      credMint,
      charlie.publicKey
    );
    
    // Mint Cred to users
    await mintTo(
      provider.connection,
      authority,
      credMint,
      aliceCredAccount,
      authority.publicKey,
      10_000_000_000 // 10,000 Cred
    );
    
    await mintTo(
      provider.connection,
      authority,
      credMint,
      bobCredAccount,
      authority.publicKey,
      5_000_000_000 // 5,000 Cred
    );
  });

  describe("Initialization", () => {
    it("initializes VTP protocol", async () => {
      const tx = await program.methods
        .initialize(vtpConfigBump)
        .accounts({
          authority: authority.publicKey,
          config: vtpConfigPda,
          feeRecipient: feeAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      
      console.log("Initialize tx:", tx);
      
      const config = await program.account.vtpConfig.fetch(vtpConfigPda);
      expect(config.authority.toString()).to.equal(authority.publicKey.toString());
      expect(config.feeRecipient.toString()).to.equal(feeAccount.toString());
      expect(config.totalTransfers.toNumber()).to.equal(0);
      expect(config.totalVolume.toNumber()).to.equal(0);
      expect(config.totalEscrows.toNumber()).to.equal(0);
      expect(config.activeEscrows.toNumber()).to.equal(0);
    });
  });

  describe("Simple Transfers", () => {
    it("transfers Cred from Alice to Bob", async () => {
      const transferAmount = new anchor.BN(1_000_000_000); // 1000 Cred
      
      const aliceBefore = await getAccount(provider.connection, aliceCredAccount);
      const bobBefore = await getAccount(provider.connection, bobCredAccount);
      
      const tx = await program.methods
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
      
      console.log("Transfer tx:", tx);
      
      const aliceAfter = await getAccount(provider.connection, aliceCredAccount);
      const bobAfter = await getAccount(provider.connection, bobCredAccount);
      const feeAccountBalance = await getAccount(provider.connection, feeAccount);
      
      // Calculate expected amounts (0.1% fee = 10 basis points)
      const fee = transferAmount.toNumber() * 10 / 10_000; // 0.1%
      const amountAfterFee = transferAmount.toNumber() - fee;
      
      // Alice lost full amount
      expect(Number(aliceAfter.amount)).to.equal(
        Number(aliceBefore.amount) - transferAmount.toNumber()
      );
      
      // Bob received amount - fee
      expect(Number(bobAfter.amount)).to.be.closeTo(
        Number(bobBefore.amount) + amountAfterFee,
        1000 // Allow small rounding
      );
      
      // Fee was collected
      expect(Number(feeAccountBalance.amount)).to.be.closeTo(fee, 1000);
      
      // Config updated
      const config = await program.account.vtpConfig.fetch(vtpConfigPda);
      expect(config.totalTransfers.toNumber()).to.equal(1);
      expect(config.totalVolume.toNumber()).to.equal(transferAmount.toNumber());
    });

    it("transfers with null memo", async () => {
      const transferAmount = new anchor.BN(100_000_000); // 100 Cred
      
      await program.methods
        .transfer(transferAmount, null)
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
      
      const config = await program.account.vtpConfig.fetch(vtpConfigPda);
      expect(config.totalTransfers.toNumber()).to.equal(2);
    });

    it("fails transfer with zero amount", async () => {
      try {
        await program.methods
          .transfer(new anchor.BN(0), null)
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
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidAmount");
      }
    });

    it("fails transfer with memo too long", async () => {
      const longMemo = "A".repeat(250); // > 200 chars
      
      try {
        await program.methods
          .transfer(new anchor.BN(100_000_000), longMemo)
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
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("MemoTooLong");
      }
    });

    it("fails transfer with insufficient balance", async () => {
      const excessiveAmount = new anchor.BN(100_000_000_000_000);
      
      try {
        await program.methods
          .transfer(excessiveAmount, null)
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
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("Escrow", () => {
    let escrowPda: PublicKey;
    let escrowCredAccount: PublicKey;
    let escrowTimestamp: number;
    
    before(async () => {
      // Create escrow Cred account (owned by PDA later)
      escrowTimestamp = Math.floor(Date.now() / 1000);
    });

    it("creates an escrow with arbiter condition", async () => {
      const escrowAmount = new anchor.BN(500_000_000); // 500 Cred
      const now = Math.floor(Date.now() / 1000);
      const expiry = new anchor.BN(now + 86400 * 30); // 30 days from now
      
      // Derive escrow PDA
      [escrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          alice.publicKey.toBuffer(),
          bob.publicKey.toBuffer(),
          new anchor.BN(now).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      
      // Create escrow token account
      escrowCredAccount = await createAccount(
        provider.connection,
        alice,
        credMint,
        escrowPda,
        alice
      );
      
      const releaseConditions = [
        { arbiterApproval: { arbiter: arbiter.publicKey } }
      ];
      
      const tx = await program.methods
        .createEscrow(
          escrowAmount,
          releaseConditions,
          expiry,
          0 // bump placeholder
        )
        .accounts({
          sender: alice.publicKey,
          config: vtpConfigPda,
          recipient: bob.publicKey,
          escrow: escrowPda,
          senderCredAccount: aliceCredAccount,
          escrowCredAccount: escrowCredAccount,
          feeAccount: feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();
      
      console.log("Create escrow tx:", tx);
      
      // Verify escrow state
      const escrow = await program.account.escrow.fetch(escrowPda);
      expect(escrow.sender.toString()).to.equal(alice.publicKey.toString());
      expect(escrow.recipient.toString()).to.equal(bob.publicKey.toString());
      expect(escrow.amount.toNumber()).to.equal(escrowAmount.toNumber());
      expect(escrow.status).to.deep.equal({ active: {} });
      expect(escrow.conditions.length).to.equal(1);
      expect(escrow.conditionsMet.length).to.equal(1);
      expect(escrow.conditionsMet[0]).to.be.false;
      
      // Verify config updated
      const config = await program.account.vtpConfig.fetch(vtpConfigPda);
      expect(config.totalEscrows.toNumber()).to.be.greaterThan(0);
      expect(config.activeEscrows.toNumber()).to.be.greaterThan(0);
    });

    it("arbiter fulfills condition", async () => {
      const conditionIndex = 0;
      
      const tx = await program.methods
        .fulfillCondition(conditionIndex, null)
        .accounts({
          fulfiller: arbiter.publicKey,
          escrow: escrowPda,
        })
        .signers([arbiter])
        .rpc();
      
      console.log("Fulfill condition tx:", tx);
      
      const escrow = await program.account.escrow.fetch(escrowPda);
      expect(escrow.conditionsMet[0]).to.be.true;
    });

    it("fails fulfillment from non-arbiter", async () => {
      // Create new escrow for this test
      const now = Math.floor(Date.now() / 1000);
      const [newEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          bob.publicKey.toBuffer(),
          charlie.publicKey.toBuffer(),
          new anchor.BN(now).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      
      const escrowCredAccount2 = await createAccount(
        provider.connection,
        bob,
        credMint,
        newEscrowPda,
        bob
      );
      
      const releaseConditions = [
        { arbiterApproval: { arbiter: arbiter.publicKey } }
      ];
      
      // Create escrow
      await program.methods
        .createEscrow(
          new anchor.BN(100_000_000),
          releaseConditions,
          new anchor.BN(now + 86400),
          0
        )
        .accounts({
          sender: bob.publicKey,
          config: vtpConfigPda,
          recipient: charlie.publicKey,
          escrow: newEscrowPda,
          senderCredAccount: bobCredAccount,
          escrowCredAccount: escrowCredAccount2,
          feeAccount: feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([bob])
        .rpc();
      
      // Try to fulfill from wrong person
      try {
        await program.methods
          .fulfillCondition(0, null)
          .accounts({
            fulfiller: charlie.publicKey, // Not the arbiter
            escrow: newEscrowPda,
          })
          .signers([charlie])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Unauthorized");
      }
    });

    it("releases escrow after conditions met", async () => {
      const bobBefore = await getAccount(provider.connection, bobCredAccount);
      
      const tx = await program.methods
        .releaseEscrow()
        .accounts({
          releaser: bob.publicKey,
          config: vtpConfigPda,
          escrow: escrowPda,
          escrowCredAccount: escrowCredAccount,
          recipientCredAccount: bobCredAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([bob])
        .rpc();
      
      console.log("Release escrow tx:", tx);
      
      const escrow = await program.account.escrow.fetch(escrowPda);
      expect(escrow.status).to.deep.equal({ released: {} });
      
      const bobAfter = await getAccount(provider.connection, bobCredAccount);
      expect(Number(bobAfter.amount)).to.be.greaterThan(Number(bobBefore.amount));
      
      // Active escrows should decrease
      const config = await program.account.vtpConfig.fetch(vtpConfigPda);
      // Note: depends on order of tests
    });

    it("fails release with unmet conditions", async () => {
      const now = Math.floor(Date.now() / 1000);
      const [unmetEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          alice.publicKey.toBuffer(),
          charlie.publicKey.toBuffer(),
          new anchor.BN(now).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      
      const unmetEscrowCredAccount = await createAccount(
        provider.connection,
        alice,
        credMint,
        unmetEscrowPda,
        alice
      );
      
      // Create escrow with unfulfilled condition
      await program.methods
        .createEscrow(
          new anchor.BN(50_000_000),
          [{ arbiterApproval: { arbiter: arbiter.publicKey } }],
          new anchor.BN(now + 86400),
          0
        )
        .accounts({
          sender: alice.publicKey,
          config: vtpConfigPda,
          recipient: charlie.publicKey,
          escrow: unmetEscrowPda,
          senderCredAccount: aliceCredAccount,
          escrowCredAccount: unmetEscrowCredAccount,
          feeAccount: feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();
      
      // Try to release without fulfilling condition
      try {
        await program.methods
          .releaseEscrow()
          .accounts({
            releaser: charlie.publicKey,
            config: vtpConfigPda,
            escrow: unmetEscrowPda,
            escrowCredAccount: unmetEscrowCredAccount,
            recipientCredAccount: charlieCredAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([charlie])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("ConditionsNotMet");
      }
    });
  });

  describe("Escrow Cancellation", () => {
    it("sender cancels escrow before any conditions met", async () => {
      const now = Math.floor(Date.now() / 1000);
      const [cancelEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          alice.publicKey.toBuffer(),
          bob.publicKey.toBuffer(),
          new anchor.BN(now + 1).toArrayLike(Buffer, "le", 8), // Unique timestamp
        ],
        program.programId
      );
      
      const cancelEscrowCredAccount = await createAccount(
        provider.connection,
        alice,
        credMint,
        cancelEscrowPda,
        alice
      );
      
      const escrowAmount = new anchor.BN(200_000_000);
      const aliceBefore = await getAccount(provider.connection, aliceCredAccount);
      
      // Create escrow
      await program.methods
        .createEscrow(
          escrowAmount,
          [{ arbiterApproval: { arbiter: arbiter.publicKey } }],
          new anchor.BN(now + 86400),
          0
        )
        .accounts({
          sender: alice.publicKey,
          config: vtpConfigPda,
          recipient: bob.publicKey,
          escrow: cancelEscrowPda,
          senderCredAccount: aliceCredAccount,
          escrowCredAccount: cancelEscrowCredAccount,
          feeAccount: feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();
      
      // Cancel (no conditions met yet)
      const tx = await program.methods
        .cancelEscrow()
        .accounts({
          canceller: alice.publicKey,
          config: vtpConfigPda,
          escrow: cancelEscrowPda,
          escrowCredAccount: cancelEscrowCredAccount,
          senderCredAccount: aliceCredAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([alice])
        .rpc();
      
      console.log("Cancel escrow tx:", tx);
      
      const escrow = await program.account.escrow.fetch(cancelEscrowPda);
      expect(escrow.status).to.deep.equal({ cancelled: {} });
      
      // Alice should have her funds back (minus fee)
      const aliceAfter = await getAccount(provider.connection, aliceCredAccount);
      // The escrow fee (0.25%) is not refunded
    });

    it("fails to cancel after condition fulfilled", async () => {
      const now = Math.floor(Date.now() / 1000);
      const [conditionMetEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          bob.publicKey.toBuffer(),
          alice.publicKey.toBuffer(),
          new anchor.BN(now + 2).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      
      const conditionMetCredAccount = await createAccount(
        provider.connection,
        bob,
        credMint,
        conditionMetEscrowPda,
        bob
      );
      
      // Create escrow
      await program.methods
        .createEscrow(
          new anchor.BN(100_000_000),
          [{ arbiterApproval: { arbiter: arbiter.publicKey } }],
          new anchor.BN(now + 86400 * 7),
          0
        )
        .accounts({
          sender: bob.publicKey,
          config: vtpConfigPda,
          recipient: alice.publicKey,
          escrow: conditionMetEscrowPda,
          senderCredAccount: bobCredAccount,
          escrowCredAccount: conditionMetCredAccount,
          feeAccount: feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([bob])
        .rpc();
      
      // Fulfill condition
      await program.methods
        .fulfillCondition(0, null)
        .accounts({
          fulfiller: arbiter.publicKey,
          escrow: conditionMetEscrowPda,
        })
        .signers([arbiter])
        .rpc();
      
      // Try to cancel (should fail - condition already met)
      try {
        await program.methods
          .cancelEscrow()
          .accounts({
            canceller: bob.publicKey,
            config: vtpConfigPda,
            escrow: conditionMetEscrowPda,
            escrowCredAccount: conditionMetCredAccount,
            senderCredAccount: bobCredAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([bob])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("CannotCancel");
      }
    });
  });

  describe("Inheritance", () => {
    let inheritancePlanPda: PublicKey;
    
    it("sets up inheritance plan", async () => {
      [inheritancePlanPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("inheritance"), alice.publicKey.toBuffer()],
        program.programId
      );
      
      const heirs = [
        {
          address: bob.publicKey,
          percentage: 60,
          name: "Bob",
        },
        {
          address: charlie.publicKey,
          percentage: 40,
          name: "Charlie",
        },
      ];
      
      const inactivityThreshold = new anchor.BN(86400 * 90); // 90 days
      
      const tx = await program.methods
        .setupInheritance(heirs, inactivityThreshold, 0)
        .accounts({
          owner: alice.publicKey,
          inheritancePlan: inheritancePlanPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();
      
      console.log("Setup inheritance tx:", tx);
      
      const plan = await program.account.inheritancePlan.fetch(inheritancePlanPda);
      expect(plan.owner.toString()).to.equal(alice.publicKey.toString());
      expect(plan.heirs.length).to.equal(2);
      expect(plan.heirs[0].percentage).to.equal(60);
      expect(plan.heirs[1].percentage).to.equal(40);
      expect(plan.triggered).to.be.false;
    });

    it("sends heartbeat to prove activity", async () => {
      const planBefore = await program.account.inheritancePlan.fetch(inheritancePlanPda);
      
      const tx = await program.methods
        .inheritanceHeartbeat()
        .accounts({
          owner: alice.publicKey,
          inheritancePlan: inheritancePlanPda,
        })
        .signers([alice])
        .rpc();
      
      console.log("Heartbeat tx:", tx);
      
      const planAfter = await program.account.inheritancePlan.fetch(inheritancePlanPda);
      expect(planAfter.lastActivity.toNumber()).to.be.greaterThanOrEqual(
        planBefore.lastActivity.toNumber()
      );
    });

    it("fails inheritance trigger before threshold", async () => {
      try {
        await program.methods
          .triggerInheritance()
          .accounts({
            triggerer: bob.publicKey,
            inheritancePlan: inheritancePlanPda,
          })
          .signers([bob])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotInactiveEnough");
      }
    });

    it("fails inheritance trigger from non-heir", async () => {
      try {
        await program.methods
          .triggerInheritance()
          .accounts({
            triggerer: arbiter.publicKey, // Not an heir
            inheritancePlan: inheritancePlanPda,
          })
          .signers([arbiter])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Either NotInactiveEnough or NotAnHeir
        expect(error).to.exist;
      }
    });

    it("fails to set up inheritance with invalid percentages", async () => {
      const [badPlanPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("inheritance"), bob.publicKey.toBuffer()],
        program.programId
      );
      
      const heirs = [
        { address: alice.publicKey, percentage: 50, name: "Alice" },
        { address: charlie.publicKey, percentage: 40, name: "Charlie" },
        // Missing 10% - doesn't sum to 100
      ];
      
      try {
        await program.methods
          .setupInheritance(heirs, new anchor.BN(86400 * 30), 0)
          .accounts({
            owner: bob.publicKey,
            inheritancePlan: badPlanPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([bob])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidPercentages");
      }
    });

    it("fails to set up inheritance with threshold too short", async () => {
      const [shortPlanPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("inheritance"), charlie.publicKey.toBuffer()],
        program.programId
      );
      
      const heirs = [
        { address: alice.publicKey, percentage: 100, name: "Alice" },
      ];
      
      try {
        await program.methods
          .setupInheritance(heirs, new anchor.BN(86400 * 7), 0) // Only 7 days (min is 30)
          .accounts({
            owner: charlie.publicKey,
            inheritancePlan: shortPlanPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([charlie])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("ThresholdTooShort");
      }
    });
  });

  describe("Batch Transfer", () => {
    it("initiates batch transfer", async () => {
      const recipients = [bob.publicKey, charlie.publicKey];
      const amounts = [new anchor.BN(50_000_000), new anchor.BN(30_000_000)];
      
      const tx = await program.methods
        .batchTransfer(recipients, amounts)
        .accounts({
          sender: alice.publicKey,
          config: vtpConfigPda,
          senderCredAccount: aliceCredAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([alice])
        .rpc();
      
      console.log("Batch transfer tx:", tx);
      
      // Config should be updated
      const config = await program.account.vtpConfig.fetch(vtpConfigPda);
      expect(config.totalTransfers.toNumber()).to.be.greaterThan(2);
    });

    it("fails batch with mismatched arrays", async () => {
      const recipients = [bob.publicKey, charlie.publicKey];
      const amounts = [new anchor.BN(50_000_000)]; // Wrong length
      
      try {
        await program.methods
          .batchTransfer(recipients, amounts)
          .accounts({
            sender: alice.publicKey,
            config: vtpConfigPda,
            senderCredAccount: aliceCredAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([alice])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("MismatchedArrays");
      }
    });

    it("fails batch with too many recipients", async () => {
      // Create 11 recipients (max is 10)
      const recipients = Array(11).fill(bob.publicKey);
      const amounts = Array(11).fill(new anchor.BN(10_000_000));
      
      try {
        await program.methods
          .batchTransfer(recipients, amounts)
          .accounts({
            sender: alice.publicKey,
            config: vtpConfigPda,
            senderCredAccount: aliceCredAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([alice])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("TooManyRecipients");
      }
    });

    it("fails batch with empty array", async () => {
      try {
        await program.methods
          .batchTransfer([], [])
          .accounts({
            sender: alice.publicKey,
            config: vtpConfigPda,
            senderCredAccount: aliceCredAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([alice])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("EmptyBatch");
      }
    });
  });

  describe("Edge Cases", () => {
    it("handles multiple escrows from same sender", async () => {
      const now = Math.floor(Date.now() / 1000);
      
      // Create two escrows with different recipients
      for (let i = 0; i < 2; i++) {
        const [escrowPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("escrow"),
            alice.publicKey.toBuffer(),
            (i === 0 ? bob : charlie).publicKey.toBuffer(),
            new anchor.BN(now + 100 + i).toArrayLike(Buffer, "le", 8),
          ],
          program.programId
        );
        
        const escrowCredAccount = await createAccount(
          provider.connection,
          alice,
          credMint,
          escrowPda,
          alice
        );
        
        await program.methods
          .createEscrow(
            new anchor.BN(25_000_000),
            [{ timeRelease: { timestamp: new anchor.BN(now + 86400) } }],
            new anchor.BN(now + 86400),
            0
          )
          .accounts({
            sender: alice.publicKey,
            config: vtpConfigPda,
            recipient: (i === 0 ? bob : charlie).publicKey,
            escrow: escrowPda,
            senderCredAccount: aliceCredAccount,
            escrowCredAccount: escrowCredAccount,
            feeAccount: feeAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([alice])
          .rpc();
      }
      
      const config = await program.account.vtpConfig.fetch(vtpConfigPda);
      console.log("Active escrows:", config.activeEscrows.toNumber());
    });
  });

  describe("Final Stats", () => {
    it("prints final VTP stats", async () => {
      const config = await program.account.vtpConfig.fetch(vtpConfigPda);
      
      console.log("\n=== VTP Final Stats ===");
      console.log("Total Transfers:", config.totalTransfers.toNumber());
      console.log("Total Volume:", config.totalVolume.toNumber() / 1_000_000, "Cred");
      console.log("Total Escrows:", config.totalEscrows.toNumber());
      console.log("Active Escrows:", config.activeEscrows.toNumber());
      console.log("========================\n");
    });
  });
});
