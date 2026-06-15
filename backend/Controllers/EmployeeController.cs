using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers;

[Authorize(Policy = "ManagerOnly")]
[ApiController]
[Route("api/[controller]")]
public class EmployeeController : ControllerBase
{
    private readonly WarehouseDbContext _db;

    public EmployeeController(WarehouseDbContext db)
    {
        _db = db;
    }

    // list all employees (managers and workers)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Employee>>> GetEmployees()
    {
        // filter out Customers from the staff management screen
        return await _db.Employees
            .Where(e => e.Role != EmployeeRole.Customer)
            .ToListAsync();
    }

    // get worker info includes active tasks and work history
    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeDetailDTO>> GetEmployeeDetail(long id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        var workOrders = await _db.WorkOrders
            .Where(w => w.AssignedEmployeeID == id)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return new EmployeeDetailDTO
        {
            Employee = employee,
            WorkHistory = workOrders,
            ActiveTask = workOrders.FirstOrDefault(w => w.Status != WorkOrderStatus.Completed && w.Status != WorkOrderStatus.Cancelled)
        };
    }

    [HttpPost]
    public async Task<ActionResult<Employee>> CreateEmployee(Employee employee)
    {
        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetEmployeeDetail), new { id = employee.EmployeeID }, employee);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEmployee(long id, Employee updatedEmployee)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        employee.Name = updatedEmployee.Name;
        employee.Email = updatedEmployee.Email;
        employee.Role = updatedEmployee.Role;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmployee(long id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        // dont delete if workers have pending work
        var hasActiveTasks = await _db.WorkOrders.AnyAsync(w => w.AssignedEmployeeID == id && w.Status != WorkOrderStatus.Completed);
        if (hasActiveTasks) return BadRequest("Cannot delete employee with active work assignments.");

        _db.Employees.Remove(employee);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class EmployeeDetailDTO
{
    public required Employee Employee { get; set; }
    public List<WorkOrder> WorkHistory { get; set; } = new();
    public WorkOrder? ActiveTask { get; set; }
}
