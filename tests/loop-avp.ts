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
import { LoopAvp } from "../target/types/loop_avp";

/**
 * Loop AVP (Agent Value Protocol) Tests
 * 
 * The identity layer for Loop Protocol:
 * - Agent registration (Personal and Service)
 * - Principal binding
 * - Capability declarations
 * - Stake management
 * - Status management (suspend/reactivate)
 */

describe("loop-avp", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.LoopAvp as Program<LoopAvp>;
  
  // Test accounts
  let personalAgent: Keypair;
  let serviceAgent: Keypair;
  let serviceCreator: Keypair;
  let unauthorizedUser: Keypair;
  
  // OXO mint for staking
  let oxoMint: PublicKey;
  let creatorOxoAccount: PublicKey;
  
  // PDAs
  let personalAgentIdentityPda: PublicKey;
  let personalAgentIdentityBump: number;
  let serviceAgentIdentityPda: PublicKey;
  let serviceAgentIdentityBump: number;

  // Constants from program
  const MIN_SERVICE_AGENT_STAKE = 500_000_000; // 500 OXO

  async function airdrop(pubkey: PublicKey, amount: number = 5) {
    const sig = await provider.connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  }

  before(async () => {
    // Create test keypairs
    personalAgent = Keypair.generate();
    serviceAgent = Keypair.generate();
    serviceCreator = Keypair.generate();
    unauthorizedUser = Keypair.generate();
    
    // Airdrop SOL
    await airdrop(personalAgent.publicKey, 10);
    await airdrop(serviceAgent.publicKey, 10);
    await airdrop(serviceCreator.publicKey, 10);
    await airdrop(unauthorizedUser.publicKey);
    
    // Derive PDAs
    [personalAgentIdentityPda, personalAgentIdentityBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), personalAgent.publicKey.toBuffer()],
      program.programId
    );
    
    [serviceAgentIdentityPda, serviceAgentIdentityBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), serviceAgent.publicKey.toBuffer()],
      program.programId
    );
    
    // Create OXO mock mint
    oxoMint = await createMint(
      provider.connection,
      serviceCreator,
      serviceCreator.publicKey,
      null,
      6
    );
    
    // Create creator OXO account with stake
    creatorOxoAccount = await createAccount(
      provider.connection,
      serviceCreator,
      oxoMint,
      serviceCreator.publicKey
    );
    
    // Mint enough OXO for stake
    await mintTo(
      provider.connection,
      serviceCreator,
      oxoMint,
      creatorOxoAccount,
      serviceCreator.publicKey,
      1_000_000_000 // 1000 OXO
    );
  });

  describe("Register Personal Agent", () => {
    it("registers a personal agent with principal binding", async () => {
      // Create principal hash (simulating ZKP binding to human identity)
      const principalHash = Buffer.alloc(32);
      for (let i = 0; i < 32; i++) {
        principalHash[i] = i; // Deterministic hash for testing
      }
      
      const metadataUri = "https://loop.io/agents/personal/metadata.json";
      
      const tx = await program.methods
        .registerPersonalAgent(
          Array.from(principalHash),
          metadataUri,
          personalAgentIdentityBump
        )
        .accounts({
          agent: personalAgent.publicKey,
          agentIdentity: personalAgentIdentityPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([personalAgent])
        .rpc();
      
      console.log("Register personal agent tx:", tx);
      
      const identity = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      
      expect(identity.agentPubkey.toString()).to.equal(personalAgent.publicKey.toString());
      expect(identity.agentType).to.deep.equal({ personal: {} });
      expect(identity.status).to.deep.equal({ active: {} });
      expect(identity.principalHash).to.deep.equal(Array.from(principalHash));
      expect(identity.bindingTimestamp).to.not.be.null;
      expect(identity.creator).to.be.null;
      expect(identity.capabilities).to.be.empty;
      expect(identity.stakeAmount.toNumber()).to.equal(0);
      expect(identity.reputationScore).to.equal(5000); // Starts at 50%
      expect(identity.metadataUri).to.equal(metadataUri);
    });

    it("registers personal agent without metadata URI", async () => {
      const noMetadataAgent = Keypair.generate();
      await airdrop(noMetadataAgent.publicKey);
      
      const [identityPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), noMetadataAgent.publicKey.toBuffer()],
        program.programId
      );
      
      const principalHash = Buffer.alloc(32).fill(42);
      
      await program.methods
        .registerPersonalAgent(
          Array.from(principalHash),
          null, // No metadata
          bump
        )
        .accounts({
          agent: noMetadataAgent.publicKey,
          agentIdentity: identityPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([noMetadataAgent])
        .rpc();
      
      const identity = await program.account.agentIdentity.fetch(identityPda);
      expect(identity.metadataUri).to.be.null;
    });

    it("fails with metadata URI too long", async () => {
      const longUriAgent = Keypair.generate();
      await airdrop(longUriAgent.publicKey);
      
      const [identityPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), longUriAgent.publicKey.toBuffer()],
        program.programId
      );
      
      const principalHash = Buffer.alloc(32).fill(1);
      const longUri = "https://example.com/" + "A".repeat(200); // > 200 chars
      
      try {
        await program.methods
          .registerPersonalAgent(
            Array.from(principalHash),
            longUri,
            bump
          )
          .accounts({
            agent: longUriAgent.publicKey,
            agentIdentity: identityPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([longUriAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("MetadataTooLong");
      }
    });

    it("fails to register same agent twice", async () => {
      const principalHash = Buffer.alloc(32).fill(99);
      
      try {
        await program.methods
          .registerPersonalAgent(
            Array.from(principalHash),
            null,
            personalAgentIdentityBump
          )
          .accounts({
            agent: personalAgent.publicKey,
            agentIdentity: personalAgentIdentityPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([personalAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Account already initialized
        expect(error).to.exist;
      }
    });
  });

  describe("Register Service Agent", () => {
    it("registers a service agent with stake", async () => {
      const metadataUri = "https://loop.io/agents/service/shopping-bot.json";
      
      const tx = await program.methods
        .registerServiceAgent(metadataUri, serviceAgentIdentityBump)
        .accounts({
          creator: serviceCreator.publicKey,
          agent: serviceAgent.publicKey,
          agentIdentity: serviceAgentIdentityPda,
          creatorOxoAccount: creatorOxoAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([serviceCreator])
        .rpc();
      
      console.log("Register service agent tx:", tx);
      
      const identity = await program.account.agentIdentity.fetch(serviceAgentIdentityPda);
      
      expect(identity.agentPubkey.toString()).to.equal(serviceAgent.publicKey.toString());
      expect(identity.agentType).to.deep.equal({ service: {} });
      expect(identity.status).to.deep.equal({ active: {} });
      expect(identity.principalHash).to.be.null; // Service agents don't have principal binding
      expect(identity.creator.toString()).to.equal(serviceCreator.publicKey.toString());
      expect(identity.stakeAmount.toNumber()).to.equal(MIN_SERVICE_AGENT_STAKE);
      expect(identity.stakeLockUntil).to.be.greaterThan(0);
      expect(identity.reputationScore).to.equal(5000);
    });

    it("fails with insufficient stake", async () => {
      const poorCreator = Keypair.generate();
      const poorAgent = Keypair.generate();
      await airdrop(poorCreator.publicKey);
      
      // Create account with insufficient OXO
      const poorOxoAccount = await createAccount(
        provider.connection,
        poorCreator,
        oxoMint,
        poorCreator.publicKey
      );
      
      await mintTo(
        provider.connection,
        serviceCreator,
        oxoMint,
        poorOxoAccount,
        serviceCreator.publicKey,
        100_000_000 // Only 100 OXO (need 500)
      );
      
      const [identityPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), poorAgent.publicKey.toBuffer()],
        program.programId
      );
      
      try {
        await program.methods
          .registerServiceAgent(null, bump)
          .accounts({
            creator: poorCreator.publicKey,
            agent: poorAgent.publicKey,
            agentIdentity: identityPda,
            creatorOxoAccount: poorOxoAccount,
            systemProgram: SystemProgram.programId,
          })
          .signers([poorCreator])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InsufficientStake");
      }
    });
  });

  describe("Bind Agent", () => {
    it("updates principal binding for personal agent", async () => {
      const newPrincipalHash = Buffer.alloc(32).fill(0xAB);
      
      const identityBefore = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      
      const tx = await program.methods
        .bindAgent(Array.from(newPrincipalHash))
        .accounts({
          agent: personalAgent.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .signers([personalAgent])
        .rpc();
      
      console.log("Bind agent tx:", tx);
      
      const identityAfter = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      
      expect(identityAfter.principalHash).to.deep.equal(Array.from(newPrincipalHash));
      expect(identityAfter.bindingTimestamp.toNumber()).to.be.greaterThanOrEqual(
        identityBefore.bindingTimestamp.toNumber()
      );
    });

    it("fails to bind service agent", async () => {
      const hash = Buffer.alloc(32).fill(1);
      
      try {
        await program.methods
          .bindAgent(Array.from(hash))
          .accounts({
            agent: serviceAgent.publicKey,
            agentIdentity: serviceAgentIdentityPda,
          })
          .signers([serviceAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotPersonalAgent");
      }
    });

    it("fails to bind with wrong signer", async () => {
      const hash = Buffer.alloc(32).fill(1);
      
      try {
        await program.methods
          .bindAgent(Array.from(hash))
          .accounts({
            agent: unauthorizedUser.publicKey, // Wrong agent
            agentIdentity: personalAgentIdentityPda,
          })
          .signers([unauthorizedUser])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        // PDA seed mismatch
        expect(error).to.exist;
      }
    });
  });

  describe("Declare Capabilities", () => {
    it("declares capabilities for agent", async () => {
      // Define capabilities as 8-byte arrays
      const capabilities = [
        [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // SHOPPING
        [0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // DATA
        [0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // PRESENCE
      ];
      
      const tx = await program.methods
        .declareCapabilities(capabilities)
        .accounts({
          agent: personalAgent.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .signers([personalAgent])
        .rpc();
      
      console.log("Declare capabilities tx:", tx);
      
      const identity = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      expect(identity.capabilities.length).to.equal(3);
      expect(identity.capabilities[0]).to.deep.equal(capabilities[0]);
    });

    it("updates capabilities (replaces existing)", async () => {
      const newCapabilities = [
        [0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], // ATTENTION only
      ];
      
      await program.methods
        .declareCapabilities(newCapabilities)
        .accounts({
          agent: personalAgent.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .signers([personalAgent])
        .rpc();
      
      const identity = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      expect(identity.capabilities.length).to.equal(1);
    });

    it("fails with too many capabilities", async () => {
      // Create 21 capabilities (max is 20)
      const tooManyCapabilities = Array(21).fill([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      
      try {
        await program.methods
          .declareCapabilities(tooManyCapabilities)
          .accounts({
            agent: personalAgent.publicKey,
            agentIdentity: personalAgentIdentityPda,
          })
          .signers([personalAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("TooManyCapabilities");
      }
    });
  });

  describe("Suspend and Reactivate", () => {
    it("suspends an agent", async () => {
      const reason = "Testing suspension functionality";
      
      const tx = await program.methods
        .suspendAgent(reason)
        .accounts({
          authority: personalAgent.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .signers([personalAgent])
        .rpc();
      
      console.log("Suspend agent tx:", tx);
      
      const identity = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      expect(identity.status).to.deep.equal({ suspended: {} });
    });

    it("fails to declare capabilities when suspended", async () => {
      try {
        await program.methods
          .declareCapabilities([[0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]])
          .accounts({
            agent: personalAgent.publicKey,
            agentIdentity: personalAgentIdentityPda,
          })
          .signers([personalAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("AgentNotActive");
      }
    });

    it("fails to bind when suspended", async () => {
      const hash = Buffer.alloc(32).fill(1);
      
      try {
        await program.methods
          .bindAgent(Array.from(hash))
          .accounts({
            agent: personalAgent.publicKey,
            agentIdentity: personalAgentIdentityPda,
          })
          .signers([personalAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("AgentNotActive");
      }
    });

    it("reactivates a suspended agent", async () => {
      const tx = await program.methods
        .reactivateAgent()
        .accounts({
          authority: personalAgent.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .signers([personalAgent])
        .rpc();
      
      console.log("Reactivate agent tx:", tx);
      
      const identity = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      expect(identity.status).to.deep.equal({ active: {} });
    });

    it("fails to reactivate already active agent", async () => {
      try {
        await program.methods
          .reactivateAgent()
          .accounts({
            authority: personalAgent.publicKey,
            agentIdentity: personalAgentIdentityPda,
          })
          .signers([personalAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotSuspended");
      }
    });

    it("creator can suspend service agent", async () => {
      await program.methods
        .suspendAgent("Creator-initiated suspension")
        .accounts({
          authority: serviceCreator.publicKey,
          agentIdentity: serviceAgentIdentityPda,
        })
        .signers([serviceCreator])
        .rpc();
      
      const identity = await program.account.agentIdentity.fetch(serviceAgentIdentityPda);
      expect(identity.status).to.deep.equal({ suspended: {} });
      
      // Reactivate for further tests
      await program.methods
        .reactivateAgent()
        .accounts({
          authority: serviceCreator.publicKey,
          agentIdentity: serviceAgentIdentityPda,
        })
        .signers([serviceCreator])
        .rpc();
    });

    it("fails suspension with reason too long", async () => {
      const longReason = "A".repeat(250); // > 200 chars
      
      try {
        await program.methods
          .suspendAgent(longReason)
          .accounts({
            authority: personalAgent.publicKey,
            agentIdentity: personalAgentIdentityPda,
          })
          .signers([personalAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("ReasonTooLong");
      }
    });
  });

  describe("Revoke Agent", () => {
    let revokableAgent: Keypair;
    let revokableIdentityPda: PublicKey;
    
    before(async () => {
      revokableAgent = Keypair.generate();
      await airdrop(revokableAgent.publicKey);
      
      const [identityPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), revokableAgent.publicKey.toBuffer()],
        program.programId
      );
      revokableIdentityPda = identityPda;
      
      // Register agent to revoke
      await program.methods
        .registerPersonalAgent(
          Array.from(Buffer.alloc(32).fill(7)),
          null,
          bump
        )
        .accounts({
          agent: revokableAgent.publicKey,
          agentIdentity: identityPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([revokableAgent])
        .rpc();
    });

    it("revokes agent authority", async () => {
      const tx = await program.methods
        .revokeAgent()
        .accounts({
          agent: revokableAgent.publicKey,
          agentIdentity: revokableIdentityPda,
        })
        .signers([revokableAgent])
        .rpc();
      
      console.log("Revoke agent tx:", tx);
      
      const identity = await program.account.agentIdentity.fetch(revokableIdentityPda);
      expect(identity.status).to.deep.equal({ revoked: {} });
    });

    it("fails to revoke already revoked agent", async () => {
      try {
        await program.methods
          .revokeAgent()
          .accounts({
            agent: revokableAgent.publicKey,
            agentIdentity: revokableIdentityPda,
          })
          .signers([revokableAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("AgentNotActive");
      }
    });

    it("fails to reactivate revoked agent", async () => {
      try {
        await program.methods
          .reactivateAgent()
          .accounts({
            authority: revokableAgent.publicKey,
            agentIdentity: revokableIdentityPda,
          })
          .signers([revokableAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotSuspended");
      }
    });
  });

  describe("Add Stake", () => {
    it("adds stake to service agent", async () => {
      const additionalStake = new anchor.BN(200_000_000); // 200 OXO
      
      const identityBefore = await program.account.agentIdentity.fetch(serviceAgentIdentityPda);
      
      const tx = await program.methods
        .addStake(additionalStake)
        .accounts({
          creator: serviceCreator.publicKey,
          agentIdentity: serviceAgentIdentityPda,
        })
        .signers([serviceCreator])
        .rpc();
      
      console.log("Add stake tx:", tx);
      
      const identityAfter = await program.account.agentIdentity.fetch(serviceAgentIdentityPda);
      expect(identityAfter.stakeAmount.toNumber()).to.equal(
        identityBefore.stakeAmount.toNumber() + additionalStake.toNumber()
      );
    });

    it("fails to add stake to personal agent", async () => {
      try {
        await program.methods
          .addStake(new anchor.BN(100_000_000))
          .accounts({
            creator: personalAgent.publicKey,
            agentIdentity: personalAgentIdentityPda,
          })
          .signers([personalAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotServiceAgent");
      }
    });

    it("fails to add zero stake", async () => {
      try {
        await program.methods
          .addStake(new anchor.BN(0))
          .accounts({
            creator: serviceCreator.publicKey,
            agentIdentity: serviceAgentIdentityPda,
          })
          .signers([serviceCreator])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidAmount");
      }
    });

    it("fails to add stake from non-creator", async () => {
      try {
        await program.methods
          .addStake(new anchor.BN(100_000_000))
          .accounts({
            creator: unauthorizedUser.publicKey,
            agentIdentity: serviceAgentIdentityPda,
          })
          .signers([unauthorizedUser])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Unauthorized");
      }
    });
  });

  describe("Update Metadata", () => {
    it("updates metadata URI", async () => {
      const newUri = "https://loop.io/agents/updated-metadata.json";
      
      const tx = await program.methods
        .updateMetadata(newUri)
        .accounts({
          agent: personalAgent.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .signers([personalAgent])
        .rpc();
      
      console.log("Update metadata tx:", tx);
      
      const identity = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      expect(identity.metadataUri).to.equal(newUri);
    });

    it("fails with URI too long", async () => {
      const longUri = "https://example.com/" + "A".repeat(200);
      
      try {
        await program.methods
          .updateMetadata(longUri)
          .accounts({
            agent: personalAgent.publicKey,
            agentIdentity: personalAgentIdentityPda,
          })
          .signers([personalAgent])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("MetadataTooLong");
      }
    });
  });

  describe("Update Reputation", () => {
    it("increases reputation score", async () => {
      const positiveDelta = 500; // +5%
      
      const identityBefore = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      
      const tx = await program.methods
        .updateReputation(positiveDelta)
        .accounts({
          authority: provider.wallet.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .rpc();
      
      console.log("Update reputation tx:", tx);
      
      const identityAfter = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      expect(identityAfter.reputationScore).to.equal(
        identityBefore.reputationScore + positiveDelta
      );
    });

    it("decreases reputation score", async () => {
      const negativeDelta = -200; // -2%
      
      const identityBefore = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      
      await program.methods
        .updateReputation(negativeDelta)
        .accounts({
          authority: provider.wallet.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .rpc();
      
      const identityAfter = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      expect(identityAfter.reputationScore).to.equal(
        identityBefore.reputationScore + negativeDelta
      );
    });

    it("caps reputation at 10000", async () => {
      // First set reputation near max
      const currentIdentity = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      const toMax = 10000 - currentIdentity.reputationScore + 1000;
      
      await program.methods
        .updateReputation(toMax)
        .accounts({
          authority: provider.wallet.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .rpc();
      
      const identityAfter = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      expect(identityAfter.reputationScore).to.equal(10000);
    });

    it("floors reputation at 0", async () => {
      await program.methods
        .updateReputation(-20000) // Way below 0
        .accounts({
          authority: provider.wallet.publicKey,
          agentIdentity: personalAgentIdentityPda,
        })
        .rpc();
      
      const identity = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      expect(identity.reputationScore).to.equal(0);
    });
  });

  describe("Edge Cases and Authorization", () => {
    it("fails unauthorized suspension from random user", async () => {
      try {
        await program.methods
          .suspendAgent("Malicious suspension attempt")
          .accounts({
            authority: unauthorizedUser.publicKey,
            agentIdentity: serviceAgentIdentityPda,
          })
          .signers([unauthorizedUser])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Unauthorized");
      }
    });
  });

  describe("Final State", () => {
    it("prints final agent states", async () => {
      const personalIdentity = await program.account.agentIdentity.fetch(personalAgentIdentityPda);
      const serviceIdentity = await program.account.agentIdentity.fetch(serviceAgentIdentityPda);
      
      console.log("\n=== Personal Agent ===");
      console.log("Status:", Object.keys(personalIdentity.status)[0]);
      console.log("Reputation:", personalIdentity.reputationScore / 100, "%");
      console.log("Capabilities:", personalIdentity.capabilities.length);
      console.log("Created:", new Date(personalIdentity.createdAt.toNumber() * 1000).toISOString());
      
      console.log("\n=== Service Agent ===");
      console.log("Status:", Object.keys(serviceIdentity.status)[0]);
      console.log("Reputation:", serviceIdentity.reputationScore / 100, "%");
      console.log("Stake:", serviceIdentity.stakeAmount.toNumber() / 1_000_000, "OXO");
      console.log("Creator:", serviceIdentity.creator.toString().slice(0, 20) + "...");
      console.log("=====================\n");
    });
  });
});
