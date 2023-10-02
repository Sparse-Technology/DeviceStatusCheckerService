FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
RUN apt-get update && apt-get install -y curl ffmpeg
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["DeviceStatusCheckerService.csproj", "."]
RUN dotnet restore "./DeviceStatusCheckerService.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "DeviceStatusCheckerService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "DeviceStatusCheckerService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DeviceStatusCheckerService.dll"]