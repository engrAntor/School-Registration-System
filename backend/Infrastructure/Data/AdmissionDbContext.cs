using Domain.Entities;
using Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using System.Data.Common;
using static System.Net.Mime.MediaTypeNames;
using Application.Interfaces;
namespace Infrastructure.Data;

public class AdmissionDbContext : DbContext, IAdmissionDbContext
{
    public AdmissionDbContext(DbContextOptions<AdmissionDbContext> options) : base(options) { }

    public DbSet<SchoolClass> Classes => Set<SchoolClass>();
    public DbSet<Hold> Holds => Set<Hold>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // The Spec says "A student can only have 1 active hold/confirmed seat at a time"
        // Instead of checking this in C#, we enforce it at the Database level using a Partial Unique Index.
        // This guarantees 100% data integrity even if two requests come in at the exact same millisecond.
        modelBuilder.Entity<Hold>()
            .HasIndex(h => new { h.StudentId, h.ClassId })
            .IsUnique()
            .HasFilter("\"Status\" IN (0, 1)"); // 0 = HELD, 1 = CONFIRMED
    }

    // Handling thousands of concurrent requests (The Bonus Requirement)
    // We use a PostgreSQL Row-Level Lock (FOR UPDATE). This locks the Class row.
    // If Backend Container A and Backend Container B try to book a seat at the exact same time,
    // PostgreSQL forces one to wait for the other to finish.
    public async Task<Hold> HoldSeatSafelyAsync(string classId, string studentId, int durationSeconds)
    {
        using var transaction = await Database.BeginTransactionAsync();

        try
        {
            // 1. Lock the specific class row in the database
            var schoolClass = await Classes
                .FromSqlInterpolated($"SELECT * FROM \"Classes\" WHERE \"Id\" = {classId} FOR UPDATE")
                .SingleOrDefaultAsync();

            if (schoolClass == null)
                throw new DomainException("Class not found", isConflict: false); // 400 Bad Request

            var now = DateTime.UtcNow;

            // 2. Count active holds dynamically (Ignores naturally expired holds)
            var activeHoldsCount = await Holds.CountAsync(h =>
                h.ClassId == classId &&
                (h.Status == HoldStatus.CONFIRMED || (h.Status == HoldStatus.HELD && h.ExpiresAt > now)));

            if (activeHoldsCount >= schoolClass.TotalSeats)
                throw new DomainException("Seat না থাকলে 409", isConflict: true); // 409 Conflict

            // 3. Create and Save the Hold
            var hold = new Hold(classId, studentId, now.AddSeconds(durationSeconds));
            Holds.Add(hold);

            await SaveChangesAsync();
            await transaction.CommitAsync();

            return hold;
        }
        catch (DbUpdateException ex)
        {
            await transaction.RollbackAsync();
            // If the DB throws a unique constraint error, it means the student already has an active hold
            if (ex.InnerException?.Message.Contains("IX_Holds_StudentId_ClassId") == true)
            {
                throw new DomainException("Student already has an active hold for this class.", isConflict: true);
            }
            throw;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}