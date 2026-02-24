# Apibara 🤝 MongoDB

_Mirror onchain data to a MongoDB collection._

**Use cases**

- Start collecting data quickly, without worrying about table schemas.
- Build the backend for you dapp.
- Create complex analytics queries using the Mongo Pipeline API.

**Usage**

You must set the `MONGO_CONNECTION_STRING` environment variable to the one
provided by your MongoDB provider.

## Finality (important)

The indexer supports a `DEFAULT_FINALITY` setting (see `env.example`).

- For production deployments, **do not** use `DATA_STATUS_PENDING`. Pending data can include transactions that later disappear (not accepted / dropped / reorg), which can leave **phantom records** in MongoDB (e.g. withdrawal requests that fail signer verification with “transaction hash not found”).
- Prefer an accepted/final status (for example `DATA_STATUS_ACCEPTED`) to index only stable chain data.

For developing locally, we provide a `docker-compose.mongo.yml` file that starts
MongoDB and Mongo Express. Run it with:

```
docker-compose -f docker-compose.mongo.yml up
```

Then export the following environment variable:

```
export MONGO_CONNECTION_STRING='mongodb://mongo:mongo@localhost:27017'
```
