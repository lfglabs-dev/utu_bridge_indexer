import { Block, EventWithTransaction, uint256 } from "./common/deps.ts";
import {
  formatFelt,
  SELECTOR_KEYS,
  RUNES_CONTRACT,
  MONGO_CONNECTION_STRING,
  DEPOSITS_STARTING_BLOCK,
  FINALITY,
  DATABASE_NAME,
} from "./common/constants.ts";

const filter = {
  header: { weak: true },
  events: [
    {
      fromAddress: formatFelt(RUNES_CONTRACT),
      keys: [formatFelt(SELECTOR_KEYS.RUNES_CLAIMED)],
      includeTransaction: true,
      includeReceipt: false,
    },
  ],
};

export const config = {
  streamUrl: Deno.env.get("STREAM_URL"),
  startingBlock: Number(DEPOSITS_STARTING_BLOCK),
  network: "starknet",
  filter,
  sinkType: "mongo",
  finality: FINALITY,
  sinkOptions: {
    connectionString: MONGO_CONNECTION_STRING,
    database: DATABASE_NAME,
    collectionName: "deposit_claim_txs",
    entityMode: true,
  },
};

export default function transform({ header, events }: Block) {
  if (!header) {
    console.log("missing header, unable to process", events.length, "events");
    return;
  }
  const output = events.flatMap(
    ({ event, transaction }: EventWithTransaction) => {
      const key = BigInt(event.keys[0]);

      switch (key) {
        case SELECTOR_KEYS.RUNES_CLAIMED: {
          const rune_id_block = event.keys[1];
          const rune_id_tx = event.keys[2];
          const rune_id =
            parseInt(rune_id_block, 16) + ":" + parseInt(rune_id_tx, 16);
          const amount = uint256.uint256ToBN({
            low: event.data[0],
            high: event.data[1],
          });
          const txid = uint256.uint256ToBN({
            low: event.data[2],
            high: event.data[3],
          });
          const vout = event.data[4];
          const caller_address = event.data[5];
          const target_address = event.data[6];

          let transaction_hash = transaction.meta.hash;
          const txid_hex = txid.toString(16).padStart(64, "0");
          const identifier = `${txid_hex}:${parseInt(vout)}`; // txid:vout

          return [
            {
              entity: { identifier },
              update: [
                {
                  $set: {
                    identifier,
                    rune_id,
                    amount: amount.toString(),
                    caller_address,
                    target_address,
                    transaction_hash,
                  },
                },
              ],
            },
          ];
        }

        default:
          return [];
      }
    }
  );

  return output;
}
