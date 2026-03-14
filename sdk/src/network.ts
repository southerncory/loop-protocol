import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";

export type Network = "devnet" | "mainnet-beta" | "localnet";

/**
 * Devnet Program IDs (deployed 2026-03-13)
 */
export const DEVNET_PROGRAM_IDS = {
  VAULT: new PublicKey("59TcVKRtME1mzGUL4xfpjMfhstGqoCEoZTTySpAeuZXZ"),
  CRED: new PublicKey("4THszk4dzFAkrcRXB2bXhrLunc74qmc6AUbzRGsGVETH"),
  OXO: new PublicKey("AidgmTgrbV7UMTLzyDM1MhQLzkrGZMFGTdgHVd3dVC7R"),
  VTP: new PublicKey("7gyZ8f2Jxj8qoGsmscZoPnBSrV5Uc5qvvYbUU3Q4hb6J"),
  AVP: new PublicKey("HeDBNqswFHMzStd5hJnoC7aZkkS5vNucxuNNgrokuRAF"),
} as const;

/**
 * Mainnet Program IDs (not yet deployed)
 */
export const MAINNET_PROGRAM_IDS = {
  VAULT: new PublicKey("76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7"),
  CRED: new PublicKey("FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA"),
  OXO: new PublicKey("3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z"),
  VTP: new PublicKey("4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj"),
  AVP: new PublicKey("H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx"),
} as const;

export function getProgramIds(network: Network) {
  switch (network) {
    case "devnet":
      return DEVNET_PROGRAM_IDS;
    case "mainnet-beta":
      return MAINNET_PROGRAM_IDS;
    case "localnet":
      return DEVNET_PROGRAM_IDS; // Use devnet IDs for local testing
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

export function getConnection(network: Network, customRpc?: string): Connection {
  const endpoint = customRpc || clusterApiUrl(network === "localnet" ? "devnet" : network);
  return new Connection(endpoint, "confirmed");
}
