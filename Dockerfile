FROM maxmcd/deno:slim

COPY . .

RUN deno --prefetch server.ts

EXPOSE 4500
ENV SERVE_DIR=/data
CMD ["deno", "--allow-read", "--allow-net", "--allow-env", "server.ts"]
