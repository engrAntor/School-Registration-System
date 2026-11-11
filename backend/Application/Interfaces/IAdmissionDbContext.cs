using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace Application.Interfaces;

public interface IAdmissionDbContext
{
    DbSet<SchoolClass> Classes { get; }
    DbSet<Hold> Holds { get; }

    // The senior concurrency lock method we wrote earlier
    Task<Hold> HoldSeatSafelyAsync(string classId, string studentId, int durationSeconds);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}