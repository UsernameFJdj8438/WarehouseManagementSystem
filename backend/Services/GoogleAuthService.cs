using Google.Apis.Auth;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface IGoogleAuthService
{
    Task<Employee?> AuthenticateAsync(string idToken);
}

public class GoogleAuthService : IGoogleAuthService
{
    private readonly WarehouseDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(WarehouseDbContext db, IConfiguration config, ILogger<GoogleAuthService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<Employee?> AuthenticateAsync(string idToken)
    {
        try
        {
            var clientId = _config["Google:ClientId"];
            _logger.LogInformation("Validating Google Token with ClientId: {ClientId}", clientId);

            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new[] { clientId }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            _logger.LogInformation("Google Token validated for email: {Email}", payload.Email);

            var user = await _db.Employees.FirstOrDefaultAsync(e => e.Email == payload.Email);

            // if user dosn't exist
            if (user == null)
            {
                _logger.LogInformation("Creating new Customer record for: {Email}", payload.Email);
                user = new Employee
                {
                    Email = payload.Email,
                    Name = payload.Name,
                    Role = EmployeeRole.Customer 
                };
                _db.Employees.Add(user);
                await _db.SaveChangesAsync();
            }

            return user;
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogError(ex, "Invalid Google JWT Token");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google Authentication");
            return null;
        }
    }
}
