namespace Domain.Entities;

public enum HoldStatus
{
    HELD,
    CONFIRMED,
    EXPIRED,
    CANCELLED
}

public class Hold
{
    public string HoldId { get; private set; }
    public string ClassId { get; private set; }
    public string StudentId { get; private set; }
    public HoldStatus Status { get; private set; }
    public DateTime ExpiresAt { get; private set; }

    // Navigation property
    public SchoolClass Class { get; private set; }

    // Required by EF Core
    private Hold() { HoldId = null!; ClassId = null!; StudentId = null!; Class = null!; }

    public Hold(string classId, string studentId, DateTime expiresAt)
    {
        // Spec states: Example ID format "h_789"
        HoldId = $"h_{Guid.NewGuid().ToString("N")[..6]}";
        ClassId = classId;
        StudentId = studentId;
        Status = HoldStatus.HELD;
        ExpiresAt = expiresAt;
    }

    public void Confirm() => Status = HoldStatus.CONFIRMED;
    public void Cancel() => Status = HoldStatus.CANCELLED;
}