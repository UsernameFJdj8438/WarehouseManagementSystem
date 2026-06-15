using Backend.Controllers;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Xunit;

namespace Backend.Tests;

public class EmployeeControllerTests
{
    private WarehouseDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WarehouseDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new WarehouseDbContext(options);
    }

    [Fact]
    public async Task GetEmployeeDetail_ShouldReturnProfileAndHistory()
    {
        // arrange, creating environment for test
        using var db = GetInMemoryDbContext();
        
        // seeding an employee (worker)
        var worker = new Employee { Name = "Test Worker", Email = "test@work.com", Role = EmployeeRole.Worker };
        db.Employees.Add(worker);
        await db.SaveChangesAsync();

        // seeding 2 work orders  
        db.WorkOrders.AddRange(
            new WorkOrder { LPNID = "LPN-1", AssignedEmployeeID = worker.EmployeeID, Status = WorkOrderStatus.Completed },
            new WorkOrder { LPNID = "LPN-2", AssignedEmployeeID = worker.EmployeeID, Status = WorkOrderStatus.InProgress }
        );
        await db.SaveChangesAsync();

        var controller = new EmployeeController(db);

        // performing action (getting employee)
        var result = await controller.GetEmployeeDetail(worker.EmployeeID);

        // asserts
        var actionResult = Assert.IsType<ActionResult<EmployeeDetailDTO>>(result);
        var detail = Assert.IsType<EmployeeDetailDTO>(actionResult.Value);

        // check if the employee info is correct
        Assert.Equal("Test Worker", detail.Employee.Name);

        // check if both work orders were retrieved
        Assert.Equal(2, detail.WorkHistory.Count);

        // check if the active task was identified correctly 
        Assert.NotNull(detail.ActiveTask);
        Assert.Equal("LPN-2", detail.ActiveTask.LPNID);
    }
}
