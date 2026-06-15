using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers;

[Authorize(Policy = "ManagerOnly")]
[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly WarehouseDbContext _db;

    public CustomerController(WarehouseDbContext db)
    {
        _db = db;
    }

    // list all customers
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Employee>>> GetCustomers()
    {
        return await _db.Employees
            .Where(e => e.Role == EmployeeRole.Customer)
            .ToListAsync();
    }

    // get specific customer with all their contracts and payments
    [HttpGet("{id}/full-details")]
    public async Task<ActionResult<CustomerDetailsDTO>> GetCustomerFullDetails(long id)
    {
        var customer = await _db.Employees.FindAsync(id);
        if (customer == null || customer.Role != EmployeeRole.Customer) return NotFound();

        var contracts = await _db.RentalContracts
            .Include(c => c.Shelves)
            .Include(c => c.Payments)
            .Where(c => c.CustomerID == id)
            .ToListAsync();

        return new CustomerDetailsDTO
        {
            Customer = customer,
            Contracts = contracts
        };
    }
}

public class CustomerDetailsDTO
{
    public required Employee Customer { get; set; }
    public List<RentalContract> Contracts { get; set; } = new();
}
