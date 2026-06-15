using Backend.Controllers;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Xunit;

namespace Backend.Tests;

public class RentalContractTests
{
    private WarehouseDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WarehouseDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new WarehouseDbContext(options);
    }

    [Fact]
    public async Task CreateContract_ShouldGeneratePaymentsAndMarkShelvesOccupied()
    {
        // arrange, setup environment
        using var db = GetInMemoryDbContext();
        
        // addd 2 available shelves to the DB
        var shelf1 = new Shelf { Label = "A1", IsAvailable = true, Width = 1, Height = 1 };
        var shelf2 = new Shelf { Label = "A2", IsAvailable = true, Width = 1, Height = 1 };
        db.Shelves.AddRange(shelf1, shelf2);
        await db.SaveChangesAsync();

        var controller = new RentalController(db);

        // use mock user identity
        var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[] {
            new Claim(ClaimTypes.NameIdentifier, "1"),
        }, "mock"));

        controller.ControllerContext = new ControllerContext() {
            HttpContext = new DefaultHttpContext() { User = user }
        };

        var request = new CreateContractRequest {
            ShelfIDs = new List<long> { shelf1.ShelfID, shelf2.ShelfID },
            DurationMonths = 3
        };

        // create a contract
        var result = await controller.CreateContract(request);

        // asserts
        var actionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var contract = Assert.IsType<RentalContract>(actionResult.Value);

        // contract payment should calculate to 100 USD
        Assert.Equal(100, contract.MonthlyRate);

        // check if all 3 installments were generated 
        Assert.Equal(3, contract.Payments.Count);

        // check if shelves are occupied now
        var updatedShelf1 = await db.Shelves.FindAsync(shelf1.ShelfID);
        Assert.False(updatedShelf1!.IsAvailable);
        Assert.Equal(1, updatedShelf1.CustomerID);
    }
}
