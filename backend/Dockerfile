# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy Directory props and solution/project files
COPY Directory.Packages.props ./
COPY Api/Api.csproj Api/
COPY Application/Application.csproj Application/
COPY Domain/Domain.csproj Domain/
COPY Infrastructure/Infrastructure.csproj Infrastructure/

# Restore dependencies
RUN dotnet restore Api/Api.csproj

# Copy the rest of the source code
COPY . .

# Publish release build
WORKDIR /src/Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Api.dll"]

