using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                    ?? "Host=localhost;Database=warehouse_db;Username=admin;Password=password123";

builder.Services.AddDbContext<WarehouseDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions => {
        npgsqlOptions.EnableRetryOnFailure(10, TimeSpan.FromSeconds(5), null);
    }));

builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WarehouseDbContext>();
    db.Database.EnsureCreated();

    var random = new Random();

    
    if (!db.LPNs.Any())
    {
        
        db.WorkOrders.RemoveRange(db.WorkOrders);
        db.LPNContents.RemoveRange(db.LPNContents);
        db.LPNs.RemoveRange(db.LPNs);
        db.Bins.RemoveRange(db.Bins);
        db.Shelves.RemoveRange(db.Shelves);
        db.Products.RemoveRange(db.Products);
        db.Employees.RemoveRange(db.Employees);
        db.SaveChanges();

        
        db.Employees.AddRange(
            new Employee { Name = "Alice (Manager)", Role = EmployeeRole.Manager },
            new Employee { Name = "Bob (Worker)", Role = EmployeeRole.Worker },
            new Employee { Name = "Charlie (Worker)", Role = EmployeeRole.Worker }
        );

        
        var shelves = new List<Shelf> {
            new Shelf { Label = "Dock A", X = 50, Y = 10, Width = 200, Height = 60, BinCount = 8, IsLoadingDock = true },
            new Shelf { Label = "Dock B", X = 300, Y = 10, Width = 200, Height = 60, BinCount = 8, IsLoadingDock = true }
        };

        for (int i = 1; i <= 5; i++) {
            shelves.Add(new Shelf { Label = $"A{i}", X = 50, Y = 100 + (i - 1) * 80, Width = 120, Height = 40, BinCount = 4 });
            shelves.Add(new Shelf { Label = $"B{i}", X = 250, Y = 100 + (i - 1) * 80, Width = 120, Height = 40, BinCount = 4 });
        }
        db.Shelves.AddRange(shelves);
        db.SaveChanges(); 

        
        var categories = new[] { "Equipment", "Storage", "Packaging", "Safety", "Tools" };
        var products = new List<Product>();
        for (int i = 1; i <= 20; i++) {
            products.Add(new Product { 
                SKU = $"PRD-{1000 + i}", 
                Name = $"Item {i} - {categories[random.Next(categories.Length)]}", 
                Description = "Industrial quality warehouse essential.", 
                Price = random.Next(5, 1000), 
                MinStockLevel = random.Next(5, 50),
                TotalStock = 0, 
                UnassignedStock = 0,
                Weight = Math.Round(random.NextDouble() * 50, 2)
            });
        }
        db.Products.AddRange(products);
        db.SaveChanges(); 

        
        var bins = new List<Bin>();
        foreach (var shelf in shelves) {
            for (int pos = 1; pos <= shelf.BinCount; pos++) {
                bins.Add(new Bin { ShelfID = shelf.ShelfID, Position = pos, MaxLPNs = 1 });
            }
        }
        db.Bins.AddRange(bins);
        db.SaveChanges(); 

        
        int lpnCounter = 1000;
        var storageBins = bins.Where(b => !shelves.First(s => s.ShelfID == b.ShelfID).IsLoadingDock).OrderBy(x => Guid.NewGuid()).ToList();
        var dockBins = bins.Where(b => shelves.First(s => s.ShelfID == b.ShelfID).IsLoadingDock).OrderBy(x => Guid.NewGuid()).ToList();

        int binIdx = 0;
        foreach (var product in products) {
            
            if (binIdx < storageBins.Count) {
                var bin = storageBins[binIdx++];
                var lpn = new LPN { LPNID = $"LPN-{lpnCounter++}", CurrentBinID = bin.BinID, Type = LPNType.Pallet, Weight = product.Weight * 50 };
                db.LPNs.Add(lpn);
                db.LPNContents.Add(new LPNContent { LPNID = lpn.LPNID, ProductID = product.ProductID, Quantity = 50 });
                product.TotalStock += 50;
            }

            
            var dBin = dockBins.FirstOrDefault(b => !db.LPNs.Local.Any(l => l.CurrentBinID == b.BinID));
            if (dBin != null) {
                var lpn = new LPN { LPNID = $"LPN-{lpnCounter++}", CurrentBinID = dBin.BinID, Type = LPNType.Pallet, Weight = product.Weight * 20 };
                db.LPNs.Add(lpn);
                db.LPNContents.Add(new LPNContent { LPNID = lpn.LPNID, ProductID = product.ProductID, Quantity = 20 });
                product.TotalStock += 20;
                product.UnassignedStock += 20;
            }
        }
        db.SaveChanges();
    }
}

app.UseCors("AllowAll");


app.MapGet("/inventory", async (WarehouseDbContext db) => await db.Products.ToListAsync());


app.MapGet("/employees", async (WarehouseDbContext db) => await db.Employees.ToListAsync());


app.MapGet("/shelves", async (WarehouseDbContext db) => 
    await db.Shelves
            .Include(s => s.Bins)
                .ThenInclude(b => b.LPNs)
                    .ThenInclude(l => l.Contents)
                        .ThenInclude(c => c.Product)
            .AsNoTracking() 
            .ToListAsync());


app.MapPost("/seed/reset", async (WarehouseDbContext db) => {
    db.WorkOrders.RemoveRange(db.WorkOrders);
    db.LPNContents.RemoveRange(db.LPNContents);
    db.LPNs.RemoveRange(db.LPNs);
    db.Bins.RemoveRange(db.Bins);
    db.Shelves.RemoveRange(db.Shelves);
    db.Products.RemoveRange(db.Products);
    db.Employees.RemoveRange(db.Employees);
    await db.SaveChangesAsync();
    return Results.Ok("Database cleared. Restart backend to re-seed.");
});


app.MapGet("/work-orders", async (WarehouseDbContext db) => 
    await db.WorkOrders.Include(w => w.LPN).Include(w => w.AssignedEmployee).ToListAsync());

app.MapPost("/work-orders", async (WorkOrder wo, WarehouseDbContext db) => {
    db.WorkOrders.Add(wo);
    await db.SaveChangesAsync();
    return Results.Created($"/work-orders/{wo.WorkOrderID}", wo);
});

app.MapPut("/work-orders/{id}/status", async (long id, [Microsoft.AspNetCore.Mvc.FromBody] WorkOrderStatus status, WarehouseDbContext db, ILogger<Program> logger) => {
    try {
        var wo = await db.WorkOrders
            .Include(w => w.LPN).ThenInclude(l => l!.Contents)
            .Include(w => w.FromBin).ThenInclude(b => b!.Shelf)
            .Include(w => w.ToBin).ThenInclude(b => b!.Shelf)
            .FirstOrDefaultAsync(w => w.WorkOrderID == id);

        if (wo == null) return Results.NotFound();
        
        wo.Status = status;
        
        if (status == WorkOrderStatus.InProgress) {
            if (wo.LPN != null) wo.LPN.CurrentBinID = null;
        } else if (status == WorkOrderStatus.Completed) {
            if (wo.LPN != null) {
                wo.LPN.CurrentBinID = wo.ToBinID;

                bool fromDock = wo.FromBin?.Shelf?.IsLoadingDock ?? false;
                bool toDock = wo.ToBin?.Shelf?.IsLoadingDock ?? false;

                if (fromDock && !toDock) {
                    foreach (var content in wo.LPN.Contents) {
                        var product = await db.Products.FindAsync(content.ProductID);
                        if (product != null) product.UnassignedStock -= content.Quantity;
                    }
                } else if (!fromDock && toDock) {
                    foreach (var content in wo.LPN.Contents) {
                        var product = await db.Products.FindAsync(content.ProductID);
                        if (product != null) product.UnassignedStock += content.Quantity;
                    }
                }
            }
            wo.CompletedAt = DateTime.UtcNow;
        }
        
        await db.SaveChangesAsync();
        return Results.NoContent();
    } catch (Exception ex) {
        logger.LogError(ex, "Error updating work order status");
        return Results.Problem("Internal server error during work order update");
    }
});

app.MapPost("/shelves", async (Shelf shelf, WarehouseDbContext db) => {
    db.Shelves.Add(shelf);
    await db.SaveChangesAsync(); 

    
    for (int i = 1; i <= shelf.BinCount; i++) {
        db.Bins.Add(new Bin { 
            ShelfID = shelf.ShelfID, 
            Position = i, 
            MaxLPNs = 1 
        });
    }
    await db.SaveChangesAsync();
    return Results.Created($"/shelves/{shelf.ShelfID}", shelf);
});

app.MapPut("/shelves/{id}", async (long id, Shelf input, WarehouseDbContext db) => {
    var shelf = await db.Shelves.FindAsync(id);
    if (shelf == null) return Results.NotFound();

    shelf.Label = input.Label;
    shelf.X = input.X;
    shelf.Y = input.Y;
    shelf.Width = input.Width;
    shelf.Height = input.Height;
    shelf.BinCount = input.BinCount;
    shelf.IsLoadingDock = input.IsLoadingDock;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/lpns", async (WarehouseDbContext db) => 
    await db.LPNs.Include(l => l.Contents).ThenInclude(c => c.Product).ToListAsync());

app.Run();
