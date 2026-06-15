using Backend.Controllers;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests;

public class WorkOrderTests
{
    private WarehouseDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WarehouseDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new WarehouseDbContext(options);
    }

    [Fact]
    public async Task CompleteWorkOrder_FromDockToStorage_ShouldReduceUnassignedStock()
    {
        // arrange, mock work order
        using var db = GetInMemoryDbContext();
        var loggerMock = new Mock<ILogger<WorkOrderController>>();

        // create product with 50 unassigned stock
        var product = new Product 
        { 
            Name = "Pallet Jack", 
            SKU = "P-1", 
            UnassignedStock = 50,
            TotalStock = 100 
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // setup shelves to test movement of product
        var dockShelf = new Shelf { Label = "Dock A", IsLoadingDock = true };
        var storageShelf = new Shelf { Label = "Shelf B", IsLoadingDock = false };
        db.Shelves.AddRange(dockShelf, storageShelf);
        await db.SaveChangesAsync();

        // setup bins inside those shelves
        var dockBin = new Bin { ShelfID = dockShelf.ShelfID, Position = 1 };
        var storageBin = new Bin { ShelfID = storageShelf.ShelfID, Position = 1 };
        db.Bins.AddRange(dockBin, storageBin);
        await db.SaveChangesAsync();

        // setup  lpns inside those bins
        var lpn = new LPN { LPNID = "LPN-TEST-100", CurrentBinID = dockBin.BinID };
        db.LPNs.Add(lpn);
        db.LPNContents.Add(new LPNContent { LPNID = lpn.LPNID, ProductID = product.ProductID, Quantity = 10 });
        await db.SaveChangesAsync();

        // setup work order
        var wo = new WorkOrder 
        { 
            LPNID = lpn.LPNID, 
            FromBinID = dockBin.BinID, 
            ToBinID = storageBin.BinID, 
            Status = WorkOrderStatus.InProgress 
        };
        db.WorkOrders.Add(wo);
        await db.SaveChangesAsync();

        var controller = new WorkOrderController(db, loggerMock.Object);

        // action, complete the work order
        await controller.UpdateStatus(wo.WorkOrderID, WorkOrderStatus.Completed);

        // assert, product count should change after completion of work order
        var updatedProduct = await db.Products.FindAsync(product.ProductID);
        Assert.Equal(40, updatedProduct!.UnassignedStock);

        // assert, lpn should now have moved position to correct bin
        var updatedLPN = await db.LPNs.FindAsync(lpn.LPNID);
        Assert.Equal(storageBin.BinID, updatedLPN!.CurrentBinID);
    }
}
