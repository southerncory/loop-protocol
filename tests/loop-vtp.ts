import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  mintTo,
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { expect } from "chai";
import { LoopVtp } from "../target/types/loop_vtp";
import * as crypto from "crypto";

/**
 * Loop VTP (Value Transfer Protocol) Tests
 * 
 * Secure vault-to-vault transfers with escrow capabilities:
 * - Simple transfers
 * - Escrow with conditions
 * - Inheritance planning
 */

// Generate unique escrow ID to avoid PDA collisions
function generateEscrowId(): Buffer {
  return crypto.randomBytes(8);
}

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
    
    // Create fee account using ATA
    const feeAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authority,
      credMint,
      authority.publicKey
    );
    feeAccount = feeAta.address;
    
    // Create user Cred accounts using ATAs
    const aliceAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      alice,
      credMint,
      alice.publicKey
    );
    aliceCredAccount = aliceAta.address;
    
    const bobAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      bob,
      credMint,
      bob.publicKey
    );
    bobCredAccount = bobAta.address;
    
    const charlieAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      charlie,
      credMint,
      charlie.publicKey
    );
    charlieCredAccount = charlieAta.address;
    
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
    let escrowId: Buffer;
    
    it("creates an escrow with arbiter condition", async () => {
      const escrowAmount = new anchor.BN(500_000_000); // 500 Cred
      const expiry = new anchor.BN(Math.floor(Date.now() / 1000) + 86400 * 30); // 30 days
      
      // Use unique escrow ID to avoid PDA collision
      escrowId = generateEscrowId();
      
      // Derive escrow PDA with unique ID
      [escrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          alice.publicKey.toBuffer(),
          bob.publicKey.toBuffer(),
          escrowId,
        ],
        program.programId
      );
      
      // Create escrow token account - PDA owner requires allowOwnerOffCurve
      const escrowAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        alice,
        credMint,
        escrowPda,
        true // allowOwnerOffCurve - critical for PDA owners
      );
      escrowCredAccount = escrowAta.address;
      
      const releaseConditions = [
        { arbiterApproval: { arbiter: arbiter.publicKey } }
      ];
      
      const tx = await program.methods
        .createEscrow(
          escrowAmount,
          releaseConditions,
          expiry,
          Array.from(escrowId)
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
      const newEscrowId = generateEscrowId();
      const [newEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          bob.publicKey.toBuffer(),
          charlie.publicKey.toBuffer(),
          newEscrowId,
        ],
        program.programId
      );
      
      const escrowAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        bob,
        credMint,
        newEscrowPda,
        true // allowOwnerOffCurve
      );
      
      const releaseConditions = [
        { arbiterApproval: { arbiter: arbiter.publicKey } }
      ];
      
      // Create escrow
      await program.methods
        .createEscrow(
          new anchor.BN(100_000_000),
          releaseConditions,
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          Array.from(newEscrowId)
        )
        .accounts({
          sender: bob.publicKey,
          config: vtpConfigPda,
          recipient: charlie.publicKey,
          escrow: newEscrowPda,
          senderCredAccount: bobCredAccount,
          escrowCredAccount: escrowAta.address,
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
    });

    it("fails release with unmet conditions", async () => {
      const unmetEscrowId = generateEscrowId();
      const [unmetEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          alice.publicKey.toBuffer(),
          charlie.publicKey.toBuffer(),
          unmetEscrowId,
        ],
        program.programId
      );
      
      const unmetEscrowAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        alice,
        credMint,
        unmetEscrowPda,
        true // allowOwnerOffCurve
      );
      
      // Create escrow with unfulfilled condition
      await program.methods
        .createEscrow(
          new anchor.BN(50_000_000),
          [{ arbiterApproval: { arbiter: arbiter.publicKey } }],
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          Array.from(unmetEscrowId)
        )
        .accounts({
          sender: alice.publicKey,
          config: vtpConfigPda,
          recipient: charlie.publicKey,
          escrow: unmetEscrowPda,
          senderCredAccount: aliceCredAccount,
          escrowCredAccount: unmetEscrowAta.address,
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
            escrowCredAccount: unmetEscrowAta.address,
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
      const cancelEscrowId = generateEscrowId();
      const [cancelEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          alice.publicKey.toBuffer(),
          bob.publicKey.toBuffer(),
          cancelEscrowId,
        ],
        program.programId
      );
      
      const cancelEscrowAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        alice,
        credMint,
        cancelEscrowPda,
        true // allowOwnerOffCurve
      );
      
      const escrowAmount = new anchor.BN(200_000_000);
      const aliceBefore = await getAccount(provider.connection, aliceCredAccount);
      
      // Create escrow
      await program.methods
        .createEscrow(
          escrowAmount,
          [{ arbiterApproval: { arbiter: arbiter.publicKey } }],
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          Array.from(cancelEscrowId)
        )
        .accounts({
          sender: alice.publicKey,
          config: vtpConfigPda,
          recipient: bob.publicKey,
          escrow: cancelEscrowPda,
          senderCredAccount: aliceCredAccount,
          escrowCredAccount: cancelEscrowAta.address,
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
          escrowCredAccount: cancelEscrowAta.address,
          senderCredAccount: aliceCredAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([alice])
        .rpc();
      
      console.log("Cancel escrow tx:", tx);
      
      const escrow = await program.account.escrow.fetch(cancelEscrowPda);
      expect(escrow.status).to.deep.equal({ cancelled: {} });
    });

    it("fails to cancel after condition fulfilled", async () => {
      const conditionMetId = generateEscrowId();
      const [conditionMetEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          bob.publicKey.toBuffer(),
          alice.publicKey.toBuffer(),
          conditionMetId,
        ],
        program.programId
      );
      
      const conditionMetAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        bob,
        credMint,
        conditionMetEscrowPda,
        true // allowOwnerOffCurve
      );
      
      // Create escrow
      await program.methods
        .createEscrow(
          new anchor.BN(100_000_000),
          [{ arbiterApproval: { arbiter: arbiter.publicKey } }],
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400 * 7),
          Array.from(conditionMetId)
        )
        .accounts({
          sender: bob.publicKey,
          config: vtpConfigPda,
          recipient: alice.publicKey,
          escrow: conditionMetEscrowPda,
          senderCredAccount: bobCredAccount,
          escrowCredAccount: conditionMetAta.address,
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
            escrowCredAccount: conditionMetAta.address,
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
    let inheritancePda: PublicKey;
    let inheritanceCredAccount: PublicKey;
    let inheritanceId: Buffer;
    
    it("creates inheritance escrow with inactivity condition", async () => {
      inheritanceId = generateEscrowId();
      const [inhPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("inheritance"),
          alice.publicKey.toBuffer(),
          charlie.publicKey.toBuffer(),
          inheritanceId,
        ],
        program.programId
      );
      inheritancePda = inhPda;
      
      const inheritanceAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        alice,
        credMint,
        inheritancePda,
        true // allowOwnerOffCurve
      );
      inheritanceCredAccount = inheritanceAta.address;
      
      const amount = new anchor.BN(1_000_000_000); // 1000 Cred
      const inactivityPeriod = 365 * 24 * 60 * 60; // 1 year in seconds
      
      const tx = await program.methods
        .createInheritance(
          amount,
          new anchor.BN(inactivityPeriod),
          Array.from(inheritanceId)
        )
        .accounts({
          grantor: alice.publicKey,
          config: vtpConfigPda,
          beneficiary: charlie.publicKey,
          inheritance: inheritancePda,
          grantorCredAccount: aliceCredAccount,
          inheritanceCredAccount: inheritanceCredAccount,
          feeAccount: feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();
      
      console.log("Create inheritance tx:", tx);
      
      // Verify inheritance state
      const inheritance = await program.account.inheritance.fetch(inheritancePda);
      expect(inheritance.grantor.toString()).to.equal(alice.publicKey.toString());
      expect(inheritance.beneficiary.toString()).to.equal(charlie.publicKey.toString());
      expect(inheritance.amount.toNumber()).to.equal(amount.toNumber());
      expect(inheritance.inactivityThreshold.toNumber()).to.equal(inactivityPeriod);
    });

    it("grantor sends heartbeat to reset inactivity timer", async () => {
      const tx = await program.methods
        .heartbeat()
        .accounts({
          grantor: alice.publicKey,
          inheritance: inheritancePda,
        })
        .signers([alice])
        .rpc();
      
      console.log("Heartbeat tx:", tx);
      
      const inheritance = await program.account.inheritance.fetch(inheritancePda);
      // Last activity should be updated (roughly now)
      const now = Math.floor(Date.now() / 1000);
      expect(inheritance.lastActivity.toNumber()).to.be.closeTo(now, 5);
    });

    it("fails claim before inactivity period expires", async () => {
      try {
        await program.methods
          .claimInheritance()
          .accounts({
            beneficiary: charlie.publicKey,
            config: vtpConfigPda,
            inheritance: inheritancePda,
            inheritanceCredAccount: inheritanceCredAccount,
            beneficiaryCredAccount: charlieCredAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([charlie])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InactivityPeriodNotMet");
      }
    });

    it("grantor revokes inheritance", async () => {
      const aliceBefore = await getAccount(provider.connection, aliceCredAccount);
      
      const tx = await program.methods
        .revokeInheritance()
        .accounts({
          grantor: alice.publicKey,
          config: vtpConfigPda,
          inheritance: inheritancePda,
          inheritanceCredAccount: inheritanceCredAccount,
          grantorCredAccount: aliceCredAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([alice])
        .rpc();
      
      console.log("Revoke inheritance tx:", tx);
      
      const inheritance = await program.account.inheritance.fetch(inheritancePda);
      expect(inheritance.status).to.deep.equal({ revoked: {} });
      
      // Alice should have her funds back
      const aliceAfter = await getAccount(provider.connection, aliceCredAccount);
      expect(Number(aliceAfter.amount)).to.be.greaterThan(Number(aliceBefore.amount));
    });
  });

  describe("Multi-condition Escrow", () => {
    it("creates escrow with multiple conditions (AND logic)", async () => {
      const multiConditionId = generateEscrowId();
      const [multiEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          alice.publicKey.toBuffer(),
          bob.publicKey.toBuffer(),
          multiConditionId,
        ],
        program.programId
      );
      
      const multiEscrowAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        alice,
        credMint,
        multiEscrowPda,
        true // allowOwnerOffCurve
      );
      
      const amount = new anchor.BN(300_000_000);
      const futureTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
      
      const conditions = [
        { arbiterApproval: { arbiter: arbiter.publicKey } },
        { timelock: { releaseTime: new anchor.BN(futureTime) } },
      ];
      
      const tx = await program.methods
        .createEscrow(
          amount,
          conditions,
          new anchor.BN(futureTime + 86400), // Expires after timelock
          Array.from(multiConditionId)
        )
        .accounts({
          sender: alice.publicKey,
          config: vtpConfigPda,
          recipient: bob.publicKey,
          escrow: multiEscrowPda,
          senderCredAccount: aliceCredAccount,
          escrowCredAccount: multiEscrowAta.address,
          feeAccount: feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();
      
      console.log("Create multi-condition escrow tx:", tx);
      
      const escrow = await program.account.escrow.fetch(multiEscrowPda);
      expect(escrow.conditions.length).to.equal(2);
      expect(escrow.conditionsMet).to.deep.equal([false, false]);
    });
  });
});
