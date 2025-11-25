# syntax=docker/dockerfile:1

ARG GO_VERSION=1.22

FROM golang:${GO_VERSION}-alpine AS builder
WORKDIR /app/server

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server .
RUN CGO_ENABLED=0 GOOS=linux go build -o /tmp/server .

FROM gcr.io/distroless/static-debian12 AS runtime
WORKDIR /app

COPY --from=builder /tmp/server /usr/local/bin/server

EXPOSE 4000
ENV PORT=4000

ENTRYPOINT ["/usr/local/bin/server"]
