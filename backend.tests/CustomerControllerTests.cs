using Backend.Controllers;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests;

public class CustomerControllerTests
{
    private WarehouseDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WarehouseDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new WarehouseDbContext(options);
    }

    [Fact]
    public async Task GetCustomers_ShouldOnlyReturnUsersWithCustomerRole()
    {
        // arrange, creating environment for test
        using var db = GetInMemoryDbContext();
        db.Employees.AddRange(
            new Employee { Name = "Cust 1", Role = EmployeeRole.Customer, Email = "c1@test.com" },
            new Employee { Name = "Manager 1", Role = EmployeeRole.Manager, Email = "m1@test.com" },
            new Employee { Name = "Worker 1", Role = EmployeeRole.Worker, Email = "w1@test.com" }
        );
        await db.SaveChangesAsync();

        var controller = new CustomerController(db);

        // performing the action for the test
        var result = await controller.GetCustomers();

        // asserts
        var actionResult = Assert.IsType<ActionResult<IEnumerable<Employee>>>(result);
        var customers = Assert.IsAssignableFrom<IEnumerable<Employee>>(actionResult.Value);
        
        Assert.Single(customers); // only 1 should be returned
        Assert.Equal(EmployeeRole.Customer, customers.First().Role);
    }

    [Fact]
    public async Task GetCustomerFullDetails_ShouldIncludeContractsAndPayments()
    {
        // arrange, creating environment for test
        using var db = GetInMemoryDbContext();
        
        var customer = new Employee { Name = "VIP Customer", Role = EmployeeRole.Customer };
        db.Employees.Add(customer);
        await db.SaveChangesAsync();

        var contract = new RentalContract { CustomerID = customer.EmployeeID, Status = ContractStatus.Active };
        db.RentalContracts.Add(contract);
        await db.SaveChangesAsync();

        db.RentalPayments.Add(new RentalPayment { ContractID = contract.ContractID, Amount = 100, Status = PaymentStatus.Paid });
        await db.SaveChangesAsync();

        var controller = new CustomerController(db);

        // performing the action for the test
        var result = await controller.GetCustomerFullDetails(customer.EmployeeID);

        // asserts
        var actionResult = Assert.IsType<ActionResult<CustomerDetailsDTO>>(result);
        var detail = Assert.IsType<CustomerDetailsDTO>(actionResult.Value);

        Assert.Equal("VIP Customer", detail.Customer.Name);
        Assert.Single(detail.Contracts);
        Assert.Single(detail.Contracts[0].Payments);
    }
}
