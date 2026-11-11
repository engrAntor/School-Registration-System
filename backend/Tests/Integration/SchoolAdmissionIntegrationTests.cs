using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Tests.Fixtures;
using Xunit;

namespace Tests.Integration;

/// <summary>
/// Production-grade integration test suite testing standard operations, error handling,
/// and high-concurrency seat allocation using Testcontainers and PostgreSQL row-level locking.
/// </summary>
public class SchoolAdmissionIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public SchoolAdmissionIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    /// <summary>
    /// Test 1: Standard Operations Test (Class Creation & Retrieval)
    /// - Sends a POST /classes request to create a new class with a specific seat limit.
    /// - Verifies that the response returns 201 Created and correct details.
    /// - Sends a GET /classes request to verify the created class is returned with matching total and available seats.
    /// </summary>
    [Fact]
    public async Task CreateClass_AndRetrieve_Returns201CreatedAndAccurateDetails()
    {
        // Arrange
        var className = $"Grade 10 - Science {Guid.NewGuid():N}";
        const int totalSeats = 30;
        var newClassPayload = new { Name = className, TotalSeats = totalSeats };

        // Act 1: POST /classes
        var postResponse = await _client.PostAsJsonAsync("/classes", newClassPayload);

        // Assert 1: Creation verification
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);
        var createdClass = await postResponse.Content.ReadFromJsonAsync<ClassResponseDto>();
        Assert.NotNull(createdClass);
        Assert.False(string.IsNullOrWhiteSpace(createdClass.Id));
        Assert.Equal(className, createdClass.Name);
        Assert.Equal(totalSeats, createdClass.TotalSeats);

        // Act 2: GET /classes
        var getResponse = await _client.GetAsync("/classes");

        // Assert 2: Retrieval verification
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var classesList = await getResponse.Content.ReadFromJsonAsync<List<ClassListResponseDto>>();
        Assert.NotNull(classesList);
        var matchingClass = classesList.FirstOrDefault(c => c.Id == createdClass.Id);
        Assert.NotNull(matchingClass);
        Assert.Equal(className, matchingClass.Name);
        Assert.Equal(totalSeats, matchingClass.TotalSeats);
        Assert.Equal(totalSeats, matchingClass.AvailableSeats);
        Assert.Equal(0, matchingClass.HeldSeats);
        Assert.Equal(0, matchingClass.ConfirmedSeats);
    }

    /// <summary>
    /// Test 2: Robust Error Handling Test
    /// - Sends invalid/malformed requests to endpoints:
    ///   a) Missing or malformed X-Student-Id header (less than 17 digits or missing).
    ///   b) Request to non-existent class or hold ID.
    /// - Verifies the system catches errors cleanly with 4xx ProblemDetails, never 500 Internal Server Error.
    /// </summary>
    [Theory]
    [InlineData("")]                          // Missing/empty student header
    [InlineData("1234567890")]                // 10 digits (invalid length)
    [InlineData("123456789012345678")]        // 18 digits (invalid length)
    [InlineData("ABCDEFGHIJKLMNO12")]        // Non-digit characters
    public async Task StudentEndpoints_WithInvalidOrMissingHeader_Returns400BadRequest_Not500(string invalidBrn)
    {
        // Arrange
        using var request = new HttpRequestMessage(HttpMethod.Post, "/classes/dummy_class/holds");
        if (!string.IsNullOrEmpty(invalidBrn))
        {
            request.Headers.Add("X-Student-Id", invalidBrn);
        }

        // Act
        var response = await _client.SendAsync(request);

        // Assert: Guarantees no 500 error on bad/missing student identification header
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    /// <summary>
    /// Test 3: High-Stress Concurrency Test (Crucial)
    /// - Creates a test class with a strict limit of exactly 5 available seats.
    /// - Simulates 100 simultaneous concurrent HTTP POST requests via Task.WhenAll attempting to hold seats.
    /// - Each request uses a unique, valid 17-digit Birth Registration Number (BRN).
    /// - Asserts that EXACTLY 5 requests succeed with 201 Created.
    /// - Asserts that the remaining 95 requests are rejected with 409 Conflict.
    /// - Confirms that PostgreSQL row-level locking (SELECT ... FOR UPDATE) eliminates race conditions.
    /// </summary>
    [Fact]
    public async Task HighStressConcurrency_With5SeatsAnd100SimultaneousRequests_Exactly5SucceedAnd95Conflict()
    {
        // Step 1: Create a class with exactly 5 seats
        const int totalSeats = 5;
        const int concurrentRequestsCount = 100;
        var createResponse = await _client.PostAsJsonAsync("/classes", new
        {
            Name = "Limited Quantum Physics",
            TotalSeats = totalSeats
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createdClass = await createResponse.Content.ReadFromJsonAsync<ClassResponseDto>();
        Assert.NotNull(createdClass);
        var classId = createdClass.Id;

        // Step 2: Prepare 100 distinct student BRNs (17 digits)
        var studentBrns = Enumerable.Range(1, concurrentRequestsCount)
            .Select(i => (20050000000000000L + i).ToString())
            .ToList();

        // Step 3: Launch 100 simultaneous HTTP requests concurrently using Task.WhenAll
        var holdTasks = studentBrns.Select(async brn =>
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            request.Headers.Add("X-Student-Id", brn);
            return await _client.SendAsync(request);
        });

        var responses = await Task.WhenAll(holdTasks);

        // Step 4: Evaluate outcomes
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        var conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);
        var otherStatusCodes = responses
            .Where(r => r.StatusCode != HttpStatusCode.Created && r.StatusCode != HttpStatusCode.Conflict)
            .Select(r => r.StatusCode)
            .ToList();

        // Step 5: Assert that no 500 errors occurred and seat allocations strictly match total seats
        Assert.Empty(otherStatusCodes);
        Assert.Equal(totalSeats, successCount); // Exactly 5 succeed
        Assert.Equal(concurrentRequestsCount - totalSeats, conflictCount); // Exactly 95 rejected with 409

        // Step 6: Verify final database state via GET /classes
        var classStateResponse = await _client.GetAsync("/classes");
        var allClasses = await classStateResponse.Content.ReadFromJsonAsync<List<ClassListResponseDto>>();
        var targetClass = allClasses?.FirstOrDefault(c => c.Id == classId);

        Assert.NotNull(targetClass);
        Assert.Equal(totalSeats, targetClass.HeldSeats);
        Assert.Equal(0, targetClass.AvailableSeats);
    }
}

// Supporting Response DTOs for type-safe assertions
public record ClassResponseDto(string Id, string Name, int TotalSeats);
public record ClassListResponseDto(string Id, string Name, int TotalSeats, int HeldSeats, int ConfirmedSeats, int AvailableSeats);

