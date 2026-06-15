using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RentalController : ControllerBase
{
    private readonly WarehouseDbContext _db;

    public RentalController(WarehouseDbContext db)
    {
        _db = db;
    }

    [HttpGet("available-shelves")]
    public async Task<ActionResult<IEnumerable<Shelf>>> GetAvailableShelves()
    {
        return await _db.Shelves
            .Where(s => !s.IsLoadingDock && s.IsAvailable)
            .ToListAsync();
    }

    [Authorize]
    [HttpPost("create-contract")]
    public async Task<ActionResult<RentalContract>> CreateContract([FromBody] CreateContractRequest request)
    {
        var customerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (customerIdClaim == null) return Unauthorized();
        
        long customerId = long.Parse(customerIdClaim.Value);

        var shelves = await _db.Shelves
            .Where(s => request.ShelfIDs.Contains(s.ShelfID) && s.IsAvailable)
            .ToListAsync();

        if (shelves.Count != request.ShelfIDs.Count)
        {
            return BadRequest("One or more selected shelves are no longer available.");
        }

        var contract = new RentalContract
        {
            CustomerID = customerId,
            MonthlyRate = shelves.Count * 50, // $50 per shelf
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(request.DurationMonths),
            Status = ContractStatus.Pending,
            Shelves = shelves
        };

        // generate monthly payment schedule
        for (int i = 0; i < request.DurationMonths; i++)
        {
            contract.Payments.Add(new RentalPayment
            {
                Amount = contract.MonthlyRate,
                DueDate = DateTime.UtcNow.AddMonths(i),
                Status = PaymentStatus.Pending
            });
        }

        foreach (var shelf in shelves)
        {
            shelf.IsAvailable = false;
            shelf.CustomerID = customerId;
            shelf.Contract = contract; // set contractid automatically 
        }

        _db.RentalContracts.Add(contract);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMyContracts), new { }, contract);
    }

    [Authorize]
    [HttpGet("my-contracts")]
    public async Task<ActionResult<IEnumerable<RentalContract>>> GetMyContracts()
    {
        var customerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (customerIdClaim == null) return Unauthorized();
        
        long customerId = long.Parse(customerIdClaim.Value);

        return await _db.RentalContracts
            .Where(c => c.CustomerID == customerId)
            .Include(c => c.Shelves)
            .Include(c => c.Payments)
            .ToListAsync();
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<RentalContract>> GetContract(long id)
    {
        var customerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (customerIdClaim == null) return Unauthorized();
        
        long customerId = long.Parse(customerIdClaim.Value);

        var contract = await _db.RentalContracts
            .Include(c => c.Shelves)
            .Include(c => c.Payments)
            .FirstOrDefaultAsync(c => c.ContractID == id && c.CustomerID == customerId);

        if (contract == null) return NotFound();

        return contract;
    }
}

public class CreateContractRequest
{
    public List<long> ShelfIDs { get; set; } = new List<long>();
    public int DurationMonths { get; set; }
}
