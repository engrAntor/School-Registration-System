using Mediator;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationMediator(this IServiceCollection services)
    {
        return services.AddMediator(options =>
        {
            options.ServiceLifetime = ServiceLifetime.Scoped;
        });
    }
}
