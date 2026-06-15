using Backend.Controllers;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests;

public class PaymentControllerTests
{
    private WarehouseDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WarehouseDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new WarehouseDbContext(options);
    }

    [Fact]
    public async Task ApproveOffline_ShouldMarkAsPaidAndActivateContract()
    {
        // arrange, creating environment for test
        using var db = GetInMemoryDbContext();
        
        // seeding a contract with the pending status
        var contract = new RentalContract 
        { 
            CustomerID = 1, 
            Status = ContractStatus.Pending, 
            StartDate = DateTime.UtcNow, 
            EndDate = DateTime.UtcNow.AddMonths(6) 
        };
        db.RentalContracts.Add(contract);
        await db.SaveChangesAsync();

        // seeding rental payment for contract, also with pending status
        var payment = new RentalPayment 
        { 
            ContractID = contract.ContractID, 
            Amount = 150, 
            Status = PaymentStatus.Pending,
            DueDate = DateTime.UtcNow
        };
        db.RentalPayments.Add(payment);
        await db.SaveChangesAsync();

        var controller = new PaymentController(db, null!, null!); // probably dont need this for this test

        // approve pending contract
        var result = await controller.ApproveOffline(payment.PaymentID);

        // result should be positive
        Assert.IsType<OkObjectResult>(result);

        // verify the payment status in the database
        var updatedPayment = await db.RentalPayments.FindAsync(payment.PaymentID);
        Assert.Equal(PaymentStatus.Paid, updatedPayment!.Status);
        Assert.NotNull(updatedPayment.PaidDate);

        // verify the contract was automatically activated
        var updatedContract = await db.RentalContracts.FindAsync(contract.ContractID);
        Assert.Equal(ContractStatus.Active, updatedContract!.Status);
    }
}
