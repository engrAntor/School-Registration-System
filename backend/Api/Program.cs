using Api.Middleware;
using Application.Holds;
using Application;
using Domain.Entities;
using Domain.Exceptions;
using Infrastructure;
using Infrastructure.Data;
using Mediator;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Application.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. SETUP & CONFIGURATION
// ==========================================

// Add CORS to allow frontend calls
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add Infrastructure (Database) from the connection string in env variables
builder.Services.AddInfrastructure(builder.Configuration);

// Map the Interface to the concrete DbContext so our CQRS Handlers can use it
builder.Services.AddScoped<IAdmissionDbContext, AdmissionDbContext>();// Add Mediator (Source Generated CQRS)
builder.Services.AddApplicationMediator();

// Add Global Exception Handling (Guarantees NO 500 errors on bad input)
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseCors();
app.UseExceptionHandler(); // Enable global error handler

// ==========================================
// 2. AUTO-MIGRATE DATABASE ON STARTUP
// ==========================================
// This ensures that when Docker starts, the tables are created automatically.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
    db.Database.Migrate();
}

// ==========================================
// 3. HEADER VALIDATION MIDDLEWARE
// ==========================================
// Spec: "শিক্ষার্থীর পরিচয় আসবে X-Student-Id header দিয়ে... ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর"
var admissionApi = app.MapGroup("/")
    .AddEndpointFilter(async (invocationContext, next) =>
    {
        var httpContext = invocationContext.HttpContext;

        // Skip header check for class queries/creation (admin or public actions)
        if (httpContext.Request.Path == "/classes" && (httpContext.Request.Method == "GET" || httpContext.Request.Method == "POST"))
            return await next(invocationContext);

        if (!httpContext.Request.Headers.TryGetValue("X-Student-Id", out var studentIdVal) || studentIdVal.ToString().Length != 17)
        {
            return Results.BadRequest(new ProblemDetails
            {
                Status = 400,
                Title = "Missing or Invalid Header",
                Detail = "X-Student-Id header with a 17-digit birth registration number is required."
            });
        }

        // Store it so endpoints can grab it easily
        httpContext.Items["StudentId"] = studentIdVal.ToString();
        return await next(invocationContext);
    });

// ==========================================
// 4. API ENDPOINTS
// ==========================================

// API #1: POST /classes (Create Class)
admissionApi.MapPost("/classes", async (CreateClassDto dto, AdmissionDbContext db) =>
{
    var classId = $"c_{Guid.NewGuid().ToString("N")[..3]}";
    var newClass = new SchoolClass(classId, dto.Name, dto.TotalSeats);

    db.Classes.Add(newClass);
    await db.SaveChangesAsync();

    return Results.Json(new { id = newClass.Id, name = newClass.Name, totalSeats = newClass.TotalSeats }, statusCode: 201);
});

// API #2: GET /classes (List all classes dynamically calculating available seats)
admissionApi.MapGet("/classes", async (AdmissionDbContext db) =>
{
    var now = DateTime.UtcNow;
    var classes = await db.Classes
        .Select(c => new
        {
            id = c.Id,
            name = c.Name,
            totalSeats = c.TotalSeats,
            heldSeats = c.Holds.Count(h => h.Status == HoldStatus.HELD && h.ExpiresAt > now),
            confirmedSeats = c.Holds.Count(h => h.Status == HoldStatus.CONFIRMED),
            availableSeats = c.TotalSeats - c.Holds.Count(h => h.Status == HoldStatus.CONFIRMED || (h.Status == HoldStatus.HELD && h.ExpiresAt > now))
        })
        .ToListAsync();

    return Results.Ok(classes);
});

// API #3: GET /classes/{classId}
admissionApi.MapGet("/classes/{classId}", async (string classId, AdmissionDbContext db) =>
{
    var now = DateTime.UtcNow;
    var c = await db.Classes
        .Where(x => x.Id == classId)
        .Select(x => new
        {
            id = x.Id,
            name = x.Name,
            totalSeats = x.TotalSeats,
            heldSeats = x.Holds.Count(h => h.Status == HoldStatus.HELD && h.ExpiresAt > now),
            confirmedSeats = x.Holds.Count(h => h.Status == HoldStatus.CONFIRMED),
            availableSeats = x.TotalSeats - x.Holds.Count(h => h.Status == HoldStatus.CONFIRMED || (h.Status == HoldStatus.HELD && h.ExpiresAt > now))
        })
        .FirstOrDefaultAsync();

    return c is not null ? Results.Ok(c) : Results.NotFound(new ProblemDetails { Status = 404, Detail = "Class not found" });
});

// API #4: POST /classes/{classId}/holds (Hold a seat)
admissionApi.MapPost("/classes/{classId}/holds", async (string classId, HttpContext ctx, IMediator mediator) =>
{
    var studentId = ctx.Items["StudentId"]!.ToString();

    var command = new CreateHoldCommand(classId, studentId);
    var hold = await mediator.Send(command); // This calls our ultra-safe DB Lock handler

    var response = new
    {
        holdId = hold.HoldId,
        classId = hold.ClassId,
        studentId = hold.StudentId,
        status = hold.Status.ToString(),
        expiresAt = hold.ExpiresAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
    };

    return Results.Json(response, statusCode: 201);
});

// API #5: GET /holds/{holdId}
admissionApi.MapGet("/holds/{holdId}", async (string holdId, HttpContext ctx, AdmissionDbContext db) =>
{
    var studentId = ctx.Items["StudentId"]!.ToString();
    var hold = await db.Holds.FirstOrDefaultAsync(h => h.HoldId == holdId && h.StudentId == studentId);

    if (hold == null) return Results.NotFound();

    var currentStatus = hold.Status;
    if (currentStatus == HoldStatus.HELD && hold.ExpiresAt < DateTime.UtcNow)
        currentStatus = HoldStatus.EXPIRED; // Dynamically resolve expiration

    return Results.Ok(new { holdId = hold.HoldId, classId = hold.ClassId, status = currentStatus.ToString(), expiresAt = hold.ExpiresAt.ToString("yyyy-MM-ddTHH:mm:ssZ") });
});

// API #6: POST /holds/{holdId}/confirm (Confirm admission)
admissionApi.MapPost("/holds/{holdId}/confirm", async (string holdId, HttpContext ctx, AdmissionDbContext db) =>
{
    var studentId = ctx.Items["StudentId"]!.ToString();
    var hold = await db.Holds.FirstOrDefaultAsync(h => h.HoldId == holdId && h.StudentId == studentId);

    if (hold == null)
        throw new DomainException("Hold not found.", isConflict: false);

    if (hold.Status == HoldStatus.CONFIRMED)
        return Results.Ok(new { holdId = hold.HoldId, status = "CONFIRMED" });

    if (hold.Status != HoldStatus.HELD || hold.ExpiresAt < DateTime.UtcNow)
        throw new DomainException("Hold is expired or cancelled.", isConflict: false);

    hold.Confirm();
    await db.SaveChangesAsync();

    return Results.Ok(new { holdId = hold.HoldId, status = "CONFIRMED" });
});

// API #7: DELETE /holds/{holdId} (Cancel application)
admissionApi.MapDelete("/holds/{holdId}", async (string holdId, HttpContext ctx, AdmissionDbContext db) =>
{
    var studentId = ctx.Items["StudentId"]!.ToString();
    var hold = await db.Holds.FirstOrDefaultAsync(h => h.HoldId == holdId && h.StudentId == studentId);

    if (hold == null) return Results.NotFound();

    hold.Cancel();
    await db.SaveChangesAsync();

    return Results.NoContent();
});

// API #8: GET /me/holds (List my applications)
admissionApi.MapGet("/me/holds", async (HttpContext ctx, AdmissionDbContext db) =>
{
    var studentId = ctx.Items["StudentId"]!.ToString();
    var now = DateTime.UtcNow;

    var holds = await db.Holds
        .Include(h => h.Class)
        .Where(h => h.StudentId == studentId)
        .Select(h => new
        {
            holdId = h.HoldId,
            classId = h.ClassId,
            className = h.Class.Name,
            status = (h.Status == HoldStatus.HELD && h.ExpiresAt < now) ? "EXPIRED" : h.Status.ToString(),
            expiresAt = h.ExpiresAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
        })
        .ToListAsync();

    return Results.Ok(holds);
});

app.Run();

// Make Program public for WebApplicationFactory in tests
public partial class Program { }

// DTO for Endpoint #1
public record CreateClassDto(string Name, int TotalSeats);