using Application.Interfaces;
using Domain.Entities;
using Mediator;

namespace Application.Holds;

// 1. The Command (Data passed from the API)
public record CreateHoldCommand(string ClassId, string StudentId) : IRequest<Hold>;

// 2. The Handler (The business logic)
public class CreateHoldCommandHandler : IRequestHandler<CreateHoldCommand, Hold>
{
    private readonly IAdmissionDbContext _db;

    public CreateHoldCommandHandler(IAdmissionDbContext db)
    {
        _db = db;
    }

    public async ValueTask<Hold> Handle(CreateHoldCommand request, CancellationToken cancellationToken)
    {
        // Read hold duration from environment variables (Spec requirement: default 600)
        var durationStr = Environment.GetEnvironmentVariable("HOLD_DURATION_SECONDS") ?? "600";
        var duration = int.Parse(durationStr);

        // Call our ultra-safe concurrent database lock method
        var hold = await _db.HoldSeatSafelyAsync(request.ClassId, request.StudentId, duration);

        return hold;
    }
}