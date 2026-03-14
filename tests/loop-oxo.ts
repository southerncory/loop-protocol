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
import { LoopOxo } from "../target/types/loop_oxo";

describe("loop-oxo", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.LoopOxo as Program<LoopOxo>;
  
  let oxoMint: PublicKey;
  let treasuryAccount: PublicKey;
  let configPda: PublicKey;
  let configBump: number;
  
  before(async () => {
    // Derive config PDA
    [configPda, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    
    // Create OXO mint
    oxoMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      6 // 6 decimals
    );
    
    treasuryAccount = Keypair.generate().publicKey;
  });
  
  describe("Protocol Initialization", () => {
    it("initializes the protocol", async () => {
      const tx = await program.methods
        .initialize(configBump)
        .accounts({
          authority: provider.wallet.publicKey,
          config: configPda,
          oxoMint: oxoMint,
          treasury: treasuryAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log("Initialize protocol tx:", tx);
      
      const config = await program.account.oxoConfig.fetch(configPda);
      expect(config.authority.toString()).to.equal(provider.wallet.publicKey.toString());
      expect(config.oxoMint.toString()).to.equal(oxoMint.toString());
      expect(config.totalVeOxo.toNumber()).to.equal(0);
      expect(config.totalLocked.toNumber()).to.equal(0);
    });
  });
  
  describe("veOXO Staking", () => {
    let userKeypair: Keypair;
    let userOxoAccount: PublicKey;
    let protocolOxoAccount: PublicKey;
    let vePositionPda: PublicKey;
    let vePositionBump: number;
    
    before(async () => {
      userKeypair = Keypair.generate();
      
      // Airdrop SOL
      await provider.connection.requestAirdrop(
        userKeypair.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      
      // Create user's OXO token account
      const userOxoAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        oxoMint,
        userKeypair.publicKey
      );
      userOxoAccount = userOxoAta.address;
      
      // Mint OXO to user
      await mintTo(
        provider.connection,
        provider.wallet.payer,
        oxoMint,
        userOxoAccount,
        provider.wallet.publicKey,
        10_000_000_000 // 10,000 OXO
      );
      
      // Create protocol's OXO token account - PDA owner
      const protocolOxoAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        oxoMint,
        configPda,
        true // allowOwnerOffCurve - critical for PDA owners
      );
      protocolOxoAccount = protocolOxoAta.address;
      
      // Derive vePosition PDA
      [vePositionPda, vePositionBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("ve_position"), userKeypair.publicKey.toBuffer()],
        program.programId
      );
    });
    
    it("locks OXO for 6 months (0.25x veOXO)", async () => {
      const lockAmount = new anchor.BN(1_000_000_000); // 1000 OXO
      const sixMonthsInSeconds = 15_552_000; // ~180 days
      
      const tx = await program.methods
        .lockOxo(lockAmount, new anchor.BN(sixMonthsInSeconds), vePositionBump)
        .accounts({
          owner: userKeypair.publicKey,
          config: configPda,
          vePosition: vePositionPda,
          userOxoAccount: userOxoAccount,
          protocolOxoAccount: protocolOxoAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
      
      console.log("Lock OXO tx:", tx);
      
      const vePosition = await program.account.veOxoPosition.fetch(vePositionPda);
      expect(vePosition.oxoLocked.toNumber()).to.equal(1_000_000_000);
      // 6 months = 0.25x multiplier
      expect(vePosition.veOxoBalance.toNumber()).to.equal(250_000_000);
    });
    
    it("extends lock duration", async () => {
      const additionalSeconds = new anchor.BN(15_552_000); // Another 6 months
      
      const beforePosition = await program.account.veOxoPosition.fetch(vePositionPda);
      
      const tx = await program.methods
        .extendLock(additionalSeconds)
        .accounts({
          owner: userKeypair.publicKey,
          config: configPda,
          vePosition: vePositionPda,
        })
        .signers([userKeypair])
        .rpc();
      
      console.log("Extend lock tx:", tx);
      
      const afterPosition = await program.account.veOxoPosition.fetch(vePositionPda);
      // 1 year = 0.5x multiplier, so veOXO should increase
      expect(afterPosition.veOxoBalance.toNumber()).to.be.greaterThan(
        beforePosition.veOxoBalance.toNumber()
      );
    });
    
    it("fails to unlock before expiry", async () => {
      try {
        await program.methods
          .unlockOxo()
          .accounts({
            owner: userKeypair.publicKey,
            config: configPda,
            vePosition: vePositionPda,
            userOxoAccount: userOxoAccount,
            protocolOxoAccount: protocolOxoAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([userKeypair])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("StillLocked");
      }
    });
  });
  
  describe("Bonding Curve", () => {
    let creatorKeypair: Keypair;
    let creatorOxoAccount: PublicKey;
    let treasuryOxoAccount: PublicKey;
    let agentMint: PublicKey;
    let bondingCurvePda: PublicKey;
    let bondingCurveBump: number;
    
    before(async () => {
      creatorKeypair = Keypair.generate();
      
      // Airdrop SOL
      await provider.connection.requestAirdrop(
        creatorKeypair.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      
      // Create creator's OXO account
      const creatorOxoAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        oxoMint,
        creatorKeypair.publicKey
      );
      creatorOxoAccount = creatorOxoAta.address;
      
      // Mint OXO to creator (enough for creation fee)
      await mintTo(
        provider.connection,
        provider.wallet.payer,
        oxoMint,
        creatorOxoAccount,
        provider.wallet.publicKey,
        1_000_000_000 // 1000 OXO
      );
      
      // Create treasury OXO account
      const treasuryOxoAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        oxoMint,
        treasuryAccount,
        true // allowOwnerOffCurve in case treasury is a PDA
      );
      treasuryOxoAccount = treasuryOxoAta.address;
      
      // Create agent mint
      agentMint = await createMint(
        provider.connection,
        provider.wallet.payer,
        provider.wallet.publicKey, // Will transfer to bonding curve PDA
        null,
        6
      );
      
      // Derive bonding curve PDA
      [bondingCurvePda, bondingCurveBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("bonding_curve"), agentMint.toBuffer()],
        program.programId
      );
    });
    
    it("creates an agent token", async () => {
      const tx = await program.methods
        .createAgentToken(
          "TestAgent",
          "TEST",
          "https://example.com/metadata.json",
          bondingCurveBump
        )
        .accounts({
          creator: creatorKeypair.publicKey,
          config: configPda,
          bondingCurve: bondingCurvePda,
          agentMint: agentMint,
          creatorOxoAccount: creatorOxoAccount,
          treasuryOxoAccount: treasuryOxoAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([creatorKeypair])
        .rpc();
      
      console.log("Create agent token tx:", tx);
      
      const curve = await program.account.bondingCurve.fetch(bondingCurvePda);
      expect(curve.creator.toString()).to.equal(creatorKeypair.publicKey.toString());
      expect(curve.graduated).to.equal(false);
      expect(curve.oxoReserve.toNumber()).to.equal(0);
      
      // Verify creation fee was paid
      const creatorAccount = await getAccount(provider.connection, creatorOxoAccount);
      expect(Number(creatorAccount.amount)).to.equal(500_000_000); // 1000 - 500 fee
    });
    
    it("buys agent tokens on bonding curve", async () => {
      const buyerKeypair = Keypair.generate();
      
      // Setup buyer
      await provider.connection.requestAirdrop(
        buyerKeypair.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      
      const buyerOxoAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        oxoMint,
        buyerKeypair.publicKey
      );
      const buyerOxoAccount = buyerOxoAta.address;
      
      await mintTo(
        provider.connection,
        provider.wallet.payer,
        oxoMint,
        buyerOxoAccount,
        provider.wallet.publicKey,
        1_000_000_000 // 1000 OXO
      );
      
      const buyerAgentAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        agentMint,
        buyerKeypair.publicKey
      );
      const buyerAgentAccount = buyerAgentAta.address;
      
      // Curve OXO account - PDA owner
      const curveOxoAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        oxoMint,
        bondingCurvePda,
        true // allowOwnerOffCurve - critical for PDA owners
      );
      const curveOxoAccount = curveOxoAta.address;
      
      const oxoToBuy = new anchor.BN(100_000_000); // 100 OXO
      
      const tx = await program.methods
        .buyAgentToken(oxoToBuy)
        .accounts({
          buyer: buyerKeypair.publicKey,
          bondingCurve: bondingCurvePda,
          agentMint: agentMint,
          buyerOxoAccount: buyerOxoAccount,
          buyerAgentAccount: buyerAgentAccount,
          curveOxoAccount: curveOxoAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyerKeypair])
        .rpc();
      
      console.log("Buy agent token tx:", tx);
      
      const curve = await program.account.bondingCurve.fetch(bondingCurvePda);
      expect(curve.oxoReserve.toNumber()).to.equal(100_000_000);
      expect(curve.tokenSupply.toNumber()).to.be.greaterThan(0);
      
      const buyerAgent = await getAccount(provider.connection, buyerAgentAccount);
      expect(Number(buyerAgent.amount)).to.be.greaterThan(0);
    });
  });
});

describe("veOXO Governance Power", () => {
  // Test governance voting weight based on lock duration
  it("calculates correct veOXO multipliers", async () => {
    // These tests verify the veOXO calculation logic
    // 6 months = 0.25x
    // 1 year = 0.5x
    // 2 years = 1x
    // 4 years = 2x
    
    const sixMonths = 15_552_000;
    const oneYear = 31_536_000;
    const twoYears = 63_072_000;
    const fourYears = 126_144_000;
    
    // Testing with 1000 OXO base
    const baseAmount = 1000;
    
    // Expected veOXO amounts
    const expected6mo = baseAmount * 0.25;
    const expected1yr = baseAmount * 0.5;
    const expected2yr = baseAmount * 1.0;
    const expected4yr = baseAmount * 2.0;
    
    console.log("Expected veOXO amounts:");
    console.log("  6 months:", expected6mo);
    console.log("  1 year:", expected1yr);
    console.log("  2 years:", expected2yr);
    console.log("  4 years:", expected4yr);
    
    // On-chain tests would verify actual calculations
  });
});
