FROM quay.io/apibara/sink-mongo:0.9.3

WORKDIR /data

# Copy your project files
COPY . /data/

# Create an entrypoint script
RUN echo '#!/bin/sh\n\
exec run --allow-env=/data/env /data/src/withdrawal_requests.ts --status-server-address=0.0.0.0:$PORT' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Use the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]