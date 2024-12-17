# Apibara 🤝 MongoDB

_Mirror onchain data to a MongoDB collection._

**Use cases**

- Start collecting data quickly, without worrying about table schemas.
- Build the backend for you dapp.
- Create complex analytics queries using the Mongo Pipeline API.

**Usage**

You must set the `MONGO_CONNECTION_STRING` environment variable to the one
provided by your MongoDB provider.

For developing locally, we provide a `docker-compose.mongo.yml` file that starts
MongoDB and Mongo Express. Run it with:

```
docker-compose -f docker-compose.mongo.yml up
```

Then export the following environment variable:

```
export MONGO_CONNECTION_STRING='mongodb://mongo:mongo@localhost:27017'
```
