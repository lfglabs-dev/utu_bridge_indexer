FROM quay.io/apibara/sink-mongo:0.9.3

WORKDIR /data

# Copy your project files
COPY . /data/

# The entrypoint from the base image will be used
# Environment variables will be passed from compose.yml
CMD ["sh", "-c", "run --allow-env=/data/env /data/src/withdrawal_requests.ts --status-server-address=0.0.0.0:$PORT"] 