FROM mcr.microsoft.com/dotnet/sdk:7.0 AS builder
RUN apt-get update -y && apt-get install -y make nano tar
WORKDIR /app
COPY . .
RUN make linux-x64

FROM ubuntu
RUN apt-get update -y && apt-get install -y ffmpeg curl iputils-ping
WORKDIR /app
COPY --from=builder /app/bin/publish_dist/linux-x64 .
RUN chmod +x DeviceStatusCheckerService
EXPOSE 80
ENTRYPOINT [ "/app/DeviceStatusCheckerService" ]