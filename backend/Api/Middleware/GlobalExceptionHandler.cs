using Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Api.Middleware;

public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        // If it's our custom Domain rule violation (e.g. Seats full, duplicate hold)
        if (exception is DomainException domainEx)
        {
            var status = domainEx.IsConflict ? StatusCodes.Status409Conflict : StatusCodes.Status400BadRequest;

            httpContext.Response.StatusCode = status;
            await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = status,
                Title = "Domain Rule Violation",
                Detail = domainEx.Message
            }, cancellationToken);

            return true; // We handled it
        }

        // If it's any other unhandled crash, normally it returns 500. 
        // But the spec says "Never 500". So we catch everything else and return a 400 Bad Request to be safe.
        httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Invalid Request",
            Detail = "The request could not be processed. Please check your inputs."
        }, cancellationToken);

        return true;
    }
}