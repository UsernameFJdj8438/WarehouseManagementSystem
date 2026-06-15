using Backend.Controllers;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests;

public class RentalControllerTests
{
    private WarehouseDbContext GetInMemoryDbContext()
    {
        // Use a unique name for each test database to avoid data "leaking" between tests
        var options = new DbContextOptionsBuilder<WarehouseDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new WarehouseDbContext(options);
    }

    [Fact]
    public async Task GetAvailableShelves_ReturnsOnlyAvailableStandardShelves()
    {
        // arange, create the database
        using var db = GetInMemoryDbContext();
        
        // seed variety of data
        db.Shelves.AddRange(
            new Shelf { Label = "Available Shelf", IsAvailable = true, IsLoadingDock = false, Width = 1, Height = 1 },
            new Shelf { Label = "Occupied Shelf", IsAvailable = false, IsLoadingDock = false, Width = 1, Height = 1 },
            new Shelf { Label = "Loading Dock", IsAvailable = true, IsLoadingDock = true, Width = 1, Height = 1 }
        );
        await db.SaveChangesAsync();

        var controller = new RentalController(db);

        // act call API method
        var result = await controller.GetAvailableShelves();

        // asserts, only standard shelves avialble shelves should be returned. the rest skipped
        var actionResult = Assert.IsType<ActionResult<IEnumerable<Shelf>>>(result);
        var shelves = Assert.IsAssignableFrom<IEnumerable<Shelf>>(actionResult.Value);
        
        Assert.Single(shelves);
        Assert.Equal("Available Shelf", shelves.First().Label);
    }
}
