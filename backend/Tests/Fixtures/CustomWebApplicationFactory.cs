using Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

namespace Tests.Fixtures;

/// <summary>
/// Custom WebApplicationFactory that spins up a real, ephemeral PostgreSQL container using Testcontainers.NET.
/// All schema migrations are executed automatically against the test container on startup.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("test_school_admission")
        .WithUsername("test_user")
        .WithPassword("test_password")
        .Build();

    public async Task InitializeAsync()
    {
        // Start the PostgreSQL test container asynchronously
        await _dbContainer.StartAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AdmissionDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Register AdmissionDbContext using the container connection string
            services.AddDbContext<AdmissionDbContext>(options =>
            {
                options.UseNpgsql(_dbContainer.GetConnectionString());
            });
        });

        // Set hold duration environment variable for tests if needed
        builder.UseSetting("HOLD_DURATION_SECONDS", "600");
    }

    public new async Task DisposeAsync()
    {
        await _dbContainer.StopAsync();
        await _dbContainer.DisposeAsync();
        await base.DisposeAsync();
    }
}
