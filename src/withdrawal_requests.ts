import {
  Block,
  EventWithTransaction,
  uint256,
  byteArray,
  num,
} from "./common/deps.ts";
import {
  formatFelt,
  SELECTOR_KEYS,
  RUNES_CONTRACT,
  MONGO_CONNECTION_STRING,
  WITHDRAWALS_STARTING_BLOCK,
  FINALITY,
  DATABASE_NAME,
  STARKNET_BASE_ASSET_CONTRACT,
} from "./common/constants.ts";

const filter = {
  header: { weak: true },
  events: [
    {
      fromAddress: formatFelt(RUNES_CONTRACT),
      keys: [formatFelt(SELECTOR_KEYS.RUNES_WITHDRAWAL_REQUESTED)],
      includeTransaction: true,
      includeReceipt: false,
    },
    {
      fromAddress: formatFelt(STARKNET_BASE_ASSET_CONTRACT),
      keys: [formatFelt(SELECTOR_KEYS.BASE_ASSET_LOCKED)],
      includeTransaction: true,
      includeReceipt: false,
    },
  ],
};

export const config = {
  streamUrl: Deno.env.get("STREAM_URL"),
  startingBlock: Number(WITHDRAWALS_STARTING_BLOCK),
  network: "starknet",
  filter,
  sinkType: "mongo",
  finality: FINALITY,
  sinkOptions: {
    connectionString: MONGO_CONNECTION_STRING,
    database: DATABASE_NAME,
    collectionName: "withdrawal_requests",
    entityMode: true,
  },
};

export default function transform({ header, events }: Block) {
  if (!header) {
    console.log("missing header, unable to process", events.length, "events");
    return;
  }
  const timestamp = Math.floor(new Date(header.timestamp).getTime() / 1000);
  const output = events.flatMap(
    ({ event, transaction }: EventWithTransaction, index: number) => {
      const key = BigInt(event.keys[0]);

      let transaction_hash = transaction.meta.hash;
      let identifier = `${transaction_hash}:${index}`; // txid:event_index

      switch (key) {
        case SELECTOR_KEYS.RUNES_WITHDRAWAL_REQUESTED: {
          const rune_id_block = event.keys[1];
          const rune_id_tx = event.keys[2];
          const rune_id =
            parseInt(rune_id_block, 16) + ":" + parseInt(rune_id_tx, 16);
          const amount = uint256.uint256ToBN({
            low: event.data[0],
            high: event.data[1],
          });
          const caller_address = event.data[event.data.length - 1];

          // Retrieve target_bitcoin_address
          const data_len = Number(event.data[2]);
          const data = event.data.slice(3, 3 + data_len);
          const myByteArray = {
            data: data,
            pending_word: event.data[3 + data_len],
            pending_word_len: Number(event.data[3 + data_len + 1]),
          };
          const target_bitcoin_address =
            byteArray.stringFromByteArray(myByteArray);

          return [
            {
              entity: { identifier },
              update: [
                {
                  $set: {
                    identifier,
                    rune_id,
                    amount: amount.toString(),
                    target_bitcoin_address,
                    caller_address,
                    transaction_hash,
                  },
                },
              ],
            },
          ];
        }
        case SELECTOR_KEYS.BASE_ASSET_LOCKED: {
          const proxied_caller_address = event.keys[1];

          // Retrieve target_bitcoin_address
          const data_len = Number(event.data[0]);
          const data = event.data.slice(1, 1 + data_len);
          const myByteArray = {
            data: data,
            pending_word: event.data[1 + data_len],
            pending_word_len: Number(event.data[1 + data_len + 1]),
          };
          const target_bitcoin_address =
            byteArray.stringFromByteArray(myByteArray);

          const rune_id_block = event.data[1 + data_len + 2];
          const rune_id_tx = event.data[1 + data_len + 3];
          const rune_id =
            parseInt(rune_id_block, 16) + ":" + parseInt(rune_id_tx, 16);
          const amount = uint256.uint256ToBN({
            low: event.data[1 + data_len + 4],
            high: event.data[1 + data_len + 5],
          });

          // we set the right caller_address to that entity
          return [
            {
              entity: {
                transaction_hash,
                amount: amount.toString(),
                target_bitcoin_address,
                rune_id,
                caller_address: num.toHex64(STARKNET_BASE_ASSET_CONTRACT),
              },
              update: [
                {
                  $set: {
                    proxied_caller_address,
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
