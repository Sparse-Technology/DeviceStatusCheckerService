FROM mcr.microsoft.com/dotnet/sdk:7.0
RUN apt-get update && apt-get install -y curl ffmpeg make nano tar
WORKDIR "/src/"
COPY . /src/