using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Add PostgreSQL DbContext
        services.AddDbContext<AdmissionDbContext>(options =>
        {
            // The Spec says we must use connection environment variable.
            // In Docker, this will be passed automatically.
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                                   ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

            options.UseNpgsql(connectionString);
        });

        return services;
    }
}