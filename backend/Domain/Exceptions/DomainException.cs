namespace Domain.Exceptions;

public class DomainException : Exception
{
    // If IsConflict is true, the API will return 409 Conflict. Otherwise, 400 Bad Request.
    public bool IsConflict { get; }

    public DomainException(string message, bool isConflict = false) : base(message)
    {
        IsConflict = isConflict;
    }
}