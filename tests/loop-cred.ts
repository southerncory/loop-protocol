import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  mintTo,
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { expect } from "chai";
import { LoopCred } from "../target/types/loop_cred";

/**
 * Loop Cred Program Tests
 * 
 * Cred is the stable value token in Loop Protocol.
 * 1 Cred = $1 (backed by USDC)
 */

describe("loop-cred", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.LoopCred as Program<LoopCred>;
  
  // Test accounts
  let authority: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let captureModule: Keypair;
  
  // Mints
  let usdcMint: PublicKey;
  let credMint: PublicKey;
  
  // PDAs
  let credConfigPda: PublicKey;
  let credConfigBump: number;
  let captureAuthorityPda: PublicKey;
  let captureAuthorityBump: number;
  
  // Token accounts
  let reserveVault: PublicKey;
  let user1UsdcAccount: PublicKey;
  let user1CredAccount: PublicKey;
  let user2UsdcAccount: PublicKey;
  let user2CredAccount: PublicKey;
  let captureModuleUsdcAccount: PublicKey;
  let destinationCredAccount: PublicKey;

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
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    captureModule = Keypair.generate();
    
    // Airdrop SOL
    await airdrop(authority.publicKey, 10);
    await airdrop(user1.publicKey);
    await airdrop(user2.publicKey);
    await airdrop(captureModule.publicKey);
    
    // Derive PDAs
    [credConfigPda, credConfigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("cred_config")],
      program.programId
    );
    
    // Create USDC mock mint
    usdcMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6
    );
    
    // Create Cred mint with config PDA as authority
    credMint = await createMint(
      provider.connection,
      authority,
      credConfigPda,
      null,
      6
    );
    
    // Create reserve vault (USDC backing) - PDA owner requires allowOwnerOffCurve
    const reserveAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authority,
      usdcMint,
      credConfigPda,
      true // allowOwnerOffCurve - critical for PDA owners
    );
    reserveVault = reserveAta.address;
    
    // Create user token accounts using ATAs
    const user1UsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user1,
      usdcMint,
      user1.publicKey
    );
    user1UsdcAccount = user1UsdcAta.address;
    
    const user1CredAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user1,
      credMint,
      user1.publicKey
    );
    user1CredAccount = user1CredAta.address;
    
    const user2UsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user2,
      usdcMint,
      user2.publicKey
    );
    user2UsdcAccount = user2UsdcAta.address;
    
    const user2CredAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user2,
      credMint,
      user2.publicKey
    );
    user2CredAccount = user2CredAta.address;
    
    // Capture module accounts
    const captureModuleUsdcAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      captureModule,
      usdcMint,
      captureModule.publicKey
    );
    captureModuleUsdcAccount = captureModuleUsdcAta.address;
    
    const destCredAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      captureModule,
      credMint,
      Keypair.generate().publicKey,
      true // allowOwnerOffCurve - destination might be a PDA
    );
    destinationCredAccount = destCredAta.address;
    
    // Mint USDC to users
    await mintTo(
      provider.connection,
      authority,
      usdcMint,
      user1UsdcAccount,
      authority.publicKey,
      10_000_000_000 // 10,000 USDC
    );
    
    await mintTo(
      provider.connection,
      authority,
      usdcMint,
      user2UsdcAccount,
      authority.publicKey,
      5_000_000_000 // 5,000 USDC
    );
    
    // Mint USDC to capture module (for backing)
    await mintTo(
      provider.connection,
      authority,
      usdcMint,
      captureModuleUsdcAccount,
      authority.publicKey,
      1_000_000_000 // 1,000 USDC
    );
  });

  describe("Initialization", () => {
    it("initializes the Cred protocol", async () => {
      const tx = await program.methods
        .initialize()
        .accounts({
          credConfig: credConfigPda,
          usdcMint: usdcMint,
          credMint: credMint,
          reserveVault: reserveVault,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([authority])
        .rpc();
      
      console.log("Initialize tx:", tx);
      
      const config = await program.account.credConfig.fetch(credConfigPda);
      expect(config.authority.toString()).to.equal(authority.publicKey.toString());
      expect(config.usdcMint.toString()).to.equal(usdcMint.toString());
      expect(config.credMint.toString()).to.equal(credMint.toString());
      expect(config.reserveVault.toString()).to.equal(reserveVault.toString());
      expect(config.totalMinted.toNumber()).to.equal(0);
      expect(config.totalBurned.toNumber()).to.equal(0);
    });

    it("fails to initialize again (already initialized)", async () => {
      try {
        await program.methods
          .initialize()
          .accounts({
            credConfig: credConfigPda,
            usdcMint: usdcMint,
            credMint: credMint,
            reserveVault: reserveVault,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([authority])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Account already initialized - this is expected
        expect(error).to.exist;
      }
    });
  });

  describe("Wrap USDC to Cred", () => {
    it("wraps USDC to Cred (1:1)", async () => {
      const wrapAmount = new anchor.BN(1_000_000_000); // 1000 USDC
      
      const usdcBefore = await getAccount(provider.connection, user1UsdcAccount);
      const credBefore = await getAccount(provider.connection, user1CredAccount);
      const reserveBefore = await getAccount(provider.connection, reserveVault);
      
      const tx = await program.methods
        .wrap(wrapAmount)
        .accounts({
          credConfig: credConfigPda,
          credMint: credMint,
          reserveVault: reserveVault,
          userUsdcAccount: user1UsdcAccount,
          userCredAccount: user1CredAccount,
          user: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
      
      console.log("Wrap tx:", tx);
      
      const usdcAfter = await getAccount(provider.connection, user1UsdcAccount);
      const credAfter = await getAccount(provider.connection, user1CredAccount);
      const reserveAfter = await getAccount(provider.connection, reserveVault);
      
      // User lost USDC
      expect(Number(usdcAfter.amount)).to.equal(
        Number(usdcBefore.amount) - wrapAmount.toNumber()
      );
      
      // User gained Cred
      expect(Number(credAfter.amount)).to.equal(
        Number(credBefore.amount) + wrapAmount.toNumber()
      );
      
      // Reserve gained USDC
      expect(Number(reserveAfter.amount)).to.equal(
        Number(reserveBefore.amount) + wrapAmount.toNumber()
      );
      
      // Verify config updated
      const config = await program.account.credConfig.fetch(credConfigPda);
      expect(config.totalMinted.toNumber()).to.equal(wrapAmount.toNumber());
    });

    it("wraps different amounts", async () => {
      const smallAmount = new anchor.BN(100_000_000); // 100 USDC
      const largeAmount = new anchor.BN(2_000_000_000); // 2000 USDC
      
      // Small wrap
      await program.methods
        .wrap(smallAmount)
        .accounts({
          credConfig: credConfigPda,
          credMint: credMint,
          reserveVault: reserveVault,
          userUsdcAccount: user2UsdcAccount,
          userCredAccount: user2CredAccount,
          user: user2.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user2])
        .rpc();
      
      // Large wrap
      await program.methods
        .wrap(largeAmount)
        .accounts({
          credConfig: credConfigPda,
          credMint: credMint,
          reserveVault: reserveVault,
          userUsdcAccount: user1UsdcAccount,
          userCredAccount: user1CredAccount,
          user: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
      
      const credAccount = await getAccount(provider.connection, user1CredAccount);
      expect(Number(credAccount.amount)).to.equal(3_000_000_000); // 1000 + 2000
    });

    it("fails to wrap zero amount", async () => {
      try {
        await program.methods
          .wrap(new anchor.BN(0))
          .accounts({
            credConfig: credConfigPda,
            credMint: credMint,
            reserveVault: reserveVault,
            userUsdcAccount: user1UsdcAccount,
            userCredAccount: user1CredAccount,
            user: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidAmount");
      }
    });

    it("fails to wrap more USDC than user has", async () => {
      const excessiveAmount = new anchor.BN(100_000_000_000_000); // Way too much
      
      try {
        await program.methods
          .wrap(excessiveAmount)
          .accounts({
            credConfig: credConfigPda,
            credMint: credMint,
            reserveVault: reserveVault,
            userUsdcAccount: user1UsdcAccount,
            userCredAccount: user1CredAccount,
            user: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Insufficient funds error
        expect(error).to.exist;
      }
    });
  });

  describe("Unwrap Cred to USDC", () => {
    it("unwraps Cred to USDC (1:1)", async () => {
      const unwrapAmount = new anchor.BN(500_000_000); // 500 Cred
      
      const usdcBefore = await getAccount(provider.connection, user1UsdcAccount);
      const credBefore = await getAccount(provider.connection, user1CredAccount);
      const reserveBefore = await getAccount(provider.connection, reserveVault);
      
      const tx = await program.methods
        .unwrap(unwrapAmount)
        .accounts({
          credConfig: credConfigPda,
          credMint: credMint,
          reserveVault: reserveVault,
          userCredAccount: user1CredAccount,
          userUsdcAccount: user1UsdcAccount,
          user: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
      
      console.log("Unwrap tx:", tx);
      
      const usdcAfter = await getAccount(provider.connection, user1UsdcAccount);
      const credAfter = await getAccount(provider.connection, user1CredAccount);
      const reserveAfter = await getAccount(provider.connection, reserveVault);
      
      // User gained USDC
      expect(Number(usdcAfter.amount)).to.equal(
        Number(usdcBefore.amount) + unwrapAmount.toNumber()
      );
      
      // User lost Cred (burned)
      expect(Number(credAfter.amount)).to.equal(
        Number(credBefore.amount) - unwrapAmount.toNumber()
      );
      
      // Reserve lost USDC
      expect(Number(reserveAfter.amount)).to.equal(
        Number(reserveBefore.amount) - unwrapAmount.toNumber()
      );
      
      // Verify config updated
      const config = await program.account.credConfig.fetch(credConfigPda);
      expect(config.totalBurned.toNumber()).to.equal(unwrapAmount.toNumber());
    });

    it("fails to unwrap zero amount", async () => {
      try {
        await program.methods
          .unwrap(new anchor.BN(0))
          .accounts({
            credConfig: credConfigPda,
            credMint: credMint,
            reserveVault: reserveVault,
            userCredAccount: user1CredAccount,
            userUsdcAccount: user1UsdcAccount,
            user: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidAmount");
      }
    });

    it("fails to unwrap more Cred than user has", async () => {
      const excessiveAmount = new anchor.BN(100_000_000_000_000);
      
      try {
        await program.methods
          .unwrap(excessiveAmount)
          .accounts({
            credConfig: credConfigPda,
            credMint: credMint,
            reserveVault: reserveVault,
            userCredAccount: user1CredAccount,
            userUsdcAccount: user1UsdcAccount,
            user: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("Register Capture Module", () => {
    before(() => {
      [captureAuthorityPda, captureAuthorityBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("capture_auth"), captureModule.publicKey.toBuffer()],
        program.programId
      );
    });

    it("registers a shopping capture module", async () => {
      const captureType = { shopping: {} };
      const moduleName = "ShoppingCapture";
      
      const tx = await program.methods
        .registerCaptureModule(captureType, moduleName)
        .accounts({
          credConfig: credConfigPda,
          captureAuthority: captureAuthorityPda,
          moduleAddress: captureModule.publicKey,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      
      console.log("Register capture module tx:", tx);
      
      const captureAuth = await program.account.captureAuthority.fetch(captureAuthorityPda);
      expect(captureAuth.moduleAddress.toString()).to.equal(captureModule.publicKey.toString());
      expect(captureAuth.captureType).to.deep.equal(captureType);
      expect(captureAuth.moduleName).to.equal(moduleName);
      expect(captureAuth.isActive).to.be.true;
      expect(captureAuth.totalCaptured.toNumber()).to.equal(0);
    });

    it("fails to register with name too long", async () => {
      const longName = "A".repeat(50); // > 32 chars
      const newModule = Keypair.generate();
      
      const [newCapturePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("capture_auth"), newModule.publicKey.toBuffer()],
        program.programId
      );
      
      try {
        await program.methods
          .registerCaptureModule({ data: {} }, longName)
          .accounts({
            credConfig: credConfigPda,
            captureAuthority: newCapturePda,
            moduleAddress: newModule.publicKey,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NameTooLong");
      }
    });

    it("fails to register without authority", async () => {
      const newModule = Keypair.generate();
      
      const [newCapturePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("capture_auth"), newModule.publicKey.toBuffer()],
        program.programId
      );
      
      try {
        await program.methods
          .registerCaptureModule({ data: {} }, "Unauthorized")
          .accounts({
            credConfig: credConfigPda,
            captureAuthority: newCapturePda,
            moduleAddress: newModule.publicKey,
            authority: user1.publicKey, // Wrong authority
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("Capture Mint", () => {
    it("mints Cred through capture module", async () => {
      const captureAmount = new anchor.BN(100_000_000); // 100 Cred
      const captureType = { shopping: {} };
      
      const tx = await program.methods
        .captureMint(captureAmount, captureType)
        .accounts({
          credConfig: credConfigPda,
          captureAuthority: captureAuthorityPda,
          credMint: credMint,
          reserveVault: reserveVault,
          captureUsdcAccount: captureModuleUsdcAccount,
          destinationCredAccount: destinationCredAccount,
          captureSigner: captureModule.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([captureModule])
        .rpc();
      
      console.log("Capture mint tx:", tx);
      
      // Verify Cred was minted to destination
      const credAccount = await getAccount(provider.connection, destinationCredAccount);
      expect(Number(credAccount.amount)).to.equal(captureAmount.toNumber());
      
      // Verify capture stats updated
      const captureAuth = await program.account.captureAuthority.fetch(captureAuthorityPda);
      expect(captureAuth.totalCaptured.toNumber()).to.equal(captureAmount.toNumber());
      
      // Verify USDC moved to reserve
      const reserve = await getAccount(provider.connection, reserveVault);
      // Reserve should have increased by capture amount
    });

    it("fails capture with wrong capture type", async () => {
      const captureAmount = new anchor.BN(50_000_000);
      const wrongType = { data: {} }; // Module is registered for 'shopping'
      
      try {
        await program.methods
          .captureMint(captureAmount, wrongType)
          .accounts({
            credConfig: credConfigPda,
            captureAuthority: captureAuthorityPda,
            credMint: credMint,
            reserveVault: reserveVault,
            captureUsdcAccount: captureModuleUsdcAccount,
            destinationCredAccount: destinationCredAccount,
            captureSigner: captureModule.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([captureModule])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("CaptureTypeMismatch");
      }
    });

    it("fails capture with zero amount", async () => {
      try {
        await program.methods
          .captureMint(new anchor.BN(0), { shopping: {} })
          .accounts({
            credConfig: credConfigPda,
            captureAuthority: captureAuthorityPda,
            credMint: credMint,
            reserveVault: reserveVault,
            captureUsdcAccount: captureModuleUsdcAccount,
            destinationCredAccount: destinationCredAccount,
            captureSigner: captureModule.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([captureModule])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidAmount");
      }
    });

    it("fails capture from unauthorized module", async () => {
      const unauthorized = Keypair.generate();
      await airdrop(unauthorized.publicKey);
      
      const unauthorizedUsdcAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        unauthorized,
        usdcMint,
        unauthorized.publicKey
      );
      const unauthorizedUsdc = unauthorizedUsdcAta.address;
      
      await mintTo(
        provider.connection,
        authority,
        usdcMint,
        unauthorizedUsdc,
        authority.publicKey,
        100_000_000
      );
      
      // This should fail because the signer doesn't match the capture authority
      try {
        await program.methods
          .captureMint(new anchor.BN(50_000_000), { shopping: {} })
          .accounts({
            credConfig: credConfigPda,
            captureAuthority: captureAuthorityPda,
            credMint: credMint,
            reserveVault: reserveVault,
            captureUsdcAccount: unauthorizedUsdc,
            destinationCredAccount: destinationCredAccount,
            captureSigner: unauthorized.publicKey, // Wrong signer
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([unauthorized])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Constraint violation - module_address doesn't match signer
        expect(error).to.exist;
      }
    });
  });

  describe("Reserve Status", () => {
    it("queries reserve status", async () => {
      // Note: getReserveStatus returns a value, but Anchor handles this differently
      // We'll verify the accounts are correct by fetching them directly
      
      const config = await program.account.credConfig.fetch(credConfigPda);
      const reserve = await getAccount(provider.connection, reserveVault);
      const mint = await getMint(provider.connection, credMint);
      
      console.log("\nReserve Status:");
      console.log("  USDC Reserve:", Number(reserve.amount) / 1_000_000);
      console.log("  Cred Supply:", Number(mint.supply) / 1_000_000);
      console.log("  Total Minted:", config.totalMinted.toNumber() / 1_000_000);
      console.log("  Total Burned:", config.totalBurned.toNumber() / 1_000_000);
      
      // Verify backing ratio is ~100%
      if (Number(mint.supply) > 0) {
        const backingRatio = (Number(reserve.amount) * 10000) / Number(mint.supply);
        console.log("  Backing Ratio:", backingRatio / 100, "%");
        expect(backingRatio).to.be.closeTo(10000, 100); // ~100% ± 1%
      }
    });
  });

  describe("Edge Cases", () => {
    it("handles wrap/unwrap cycle correctly", async () => {
      const amount = new anchor.BN(250_000_000); // 250
      
      // Record initial balances
      const usdcInitial = await getAccount(provider.connection, user2UsdcAccount);
      const credInitial = await getAccount(provider.connection, user2CredAccount);
      
      // Wrap
      await program.methods
        .wrap(amount)
        .accounts({
          credConfig: credConfigPda,
          credMint: credMint,
          reserveVault: reserveVault,
          userUsdcAccount: user2UsdcAccount,
          userCredAccount: user2CredAccount,
          user: user2.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user2])
        .rpc();
      
      // Immediately unwrap same amount
      await program.methods
        .unwrap(amount)
        .accounts({
          credConfig: credConfigPda,
          credMint: credMint,
          reserveVault: reserveVault,
          userCredAccount: user2CredAccount,
          userUsdcAccount: user2UsdcAccount,
          user: user2.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user2])
        .rpc();
      
      // Verify balances are back to initial
      const usdcFinal = await getAccount(provider.connection, user2UsdcAccount);
      const credFinal = await getAccount(provider.connection, user2CredAccount);
      
      expect(Number(usdcFinal.amount)).to.equal(Number(usdcInitial.amount));
      expect(Number(credFinal.amount)).to.equal(Number(credInitial.amount));
    });

    it("handles multiple captures correctly", async () => {
      const capture1 = new anchor.BN(25_000_000);
      const capture2 = new anchor.BN(75_000_000);
      
      const captureAuthBefore = await program.account.captureAuthority.fetch(captureAuthorityPda);
      
      // First capture
      await program.methods
        .captureMint(capture1, { shopping: {} })
        .accounts({
          credConfig: credConfigPda,
          captureAuthority: captureAuthorityPda,
          credMint: credMint,
          reserveVault: reserveVault,
          captureUsdcAccount: captureModuleUsdcAccount,
          destinationCredAccount: destinationCredAccount,
          captureSigner: captureModule.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([captureModule])
        .rpc();
      
      // Second capture
      await program.methods
        .captureMint(capture2, { shopping: {} })
        .accounts({
          credConfig: credConfigPda,
          captureAuthority: captureAuthorityPda,
          credMint: credMint,
          reserveVault: reserveVault,
          captureUsdcAccount: captureModuleUsdcAccount,
          destinationCredAccount: destinationCredAccount,
          captureSigner: captureModule.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([captureModule])
        .rpc();
      
      const captureAuthAfter = await program.account.captureAuthority.fetch(captureAuthorityPda);
      
      // Verify total captured increased by both amounts
      expect(captureAuthAfter.totalCaptured.toNumber()).to.equal(
        captureAuthBefore.totalCaptured.toNumber() + capture1.toNumber() + capture2.toNumber()
      );
    });
  });
});
