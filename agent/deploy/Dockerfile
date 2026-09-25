FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/jiang-os-agent .

FROM gcr.io/distroless/static-debian12
COPY --from=build /out/jiang-os-agent /usr/local/bin/jiang-os-agent
ENTRYPOINT ["/usr/local/bin/jiang-os-agent"]
CMD ["-config", "/etc/jiang-os-agent/config.yaml"]
