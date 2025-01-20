import {
  Block,
  EventWithTransaction,
  uint256,
  byteArray,
} from "./common/deps.ts";
import {
  formatFelt,
  SELECTOR_KEYS,
  RUNES_CONTRACT,
  MONGO_CONNECTION_STRING,
  WITHDRAWALS_STARTING_BLOCK,
  FINALITY,
  DATABASE_NAME,
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
    ({ event, transaction }: EventWithTransaction) => {
      const key = BigInt(event.keys[0]);

      switch (key) {
        case SELECTOR_KEYS.RUNES_WITHDRAWAL_REQUESTED: {
          const rune_id = event.keys[1];
          const amount = uint256.uint256ToBN({
            low: event.data[0],
            high: event.data[1],
          });
          const caller_address = event.data[7];

          // Retrieve target_bitcoin_address
          const data_len = Number(event.data[2]);
          const data = event.data.slice(3, 3 + data_len);
          const myByteArray = {
            data: data,
            pending_word: Number(event.data[3 + data_len]),
            pending_word_len: Number(event.data[3 + data_len + 1]),
          };
          const target_bitcoin_address =
            byteArray.stringFromByteArray(myByteArray);

          let transaction_hash = transaction.meta.hash;
          const identifier = `${transaction_hash}:${event.keys[0]}`; // txid:eventid

          return [
            {
              entity: { identifier },
              update: [
                {
                  $set: {
                    identifier,
                    rune_id,
                    amount: "0x" + amount.toString(16),
                    target_bitcoin_address,
                    caller_address,
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
