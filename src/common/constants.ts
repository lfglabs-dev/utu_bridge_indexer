import { hash } from "./deps.ts";

export function formatFelt(key: bigint): string {
  return "0x" + key.toString(16);
}

export const SELECTOR_KEYS = {
  RUNES_WITHDRAWAL_REQUESTED: BigInt(
    hash.getSelectorFromName("RunesWithdrawalRequested")
  ),
};

export const FINALITY = Deno.env.get("DEFAULT_FINALITY") as string;
export const MONGO_CONNECTION_STRING = Deno.env.get(
  "MONGO_CONNECTION_STRING"
) as string;
export const RUNES_CONTRACT = BigInt(Deno.env.get("RUNES_CONTRACT") as string);
export const STARTING_BLOCK = BigInt(Deno.env.get("STARTING_BLOCK") as string);
export const DATABASE_NAME = Deno.env.get("DATABASE_NAME") as string;

export const DECIMALS = 18;
