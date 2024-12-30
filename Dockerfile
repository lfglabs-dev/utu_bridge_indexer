FROM quay.io/apibara/sink-mongo:0.9.3

WORKDIR /data

# Copy your project files
COPY . /data/

# Run the indexer directly without shell
CMD ["run", "--allow-env=/data/env", "/data/src/withdrawal_requests.ts", "--status-server-address=0.0.0.0:$PORT"] 