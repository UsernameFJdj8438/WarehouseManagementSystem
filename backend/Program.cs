using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<IStripeService, StripeService>();
builder.Services.AddScoped<IRabbitMQService, RabbitMQService>();
builder.Services.AddHostedService<NotificationWorker>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "super_secret_key_123_dont_use_in_production"))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ManagerOnly", policy => policy.RequireClaim(ClaimTypes.Role, EmployeeRole.Manager.ToString()));
    options.AddPolicy("WorkerOnly", policy => policy.RequireClaim(ClaimTypes.Role, EmployeeRole.Worker.ToString()));
    options.AddPolicy("CustomerOnly", policy => policy.RequireClaim(ClaimTypes.Role, EmployeeRole.Customer.ToString()));
});

builder.Services.AddControllers().AddJsonOptions(options => {
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                    ?? "Host=db;Database=warehouse_db;Username=admin;Password=password123";

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
    // does not update existing tables if they have different columns.
    // clean database start
    db.Database.EnsureCreated();

    var random = new Random();

    if (!db.Shelves.Any())
    {
        db.Employees.AddRange(
            new Employee { Name = "Alice (Manager)", Role = EmployeeRole.Manager, Email = "alice@example.com" },
            new Employee { Name = "Bob (Worker)", Role = EmployeeRole.Worker, Email = "bob@example.com" },
            new Employee { Name = "Charlie (Worker)", Role = EmployeeRole.Worker, Email = "charlie@example.com" }
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
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// auth endpoints
app.MapPost("/auth/google-login", async ([Microsoft.AspNetCore.Mvc.FromBody] GoogleLoginRequest request, IGoogleAuthService authService, IRabbitMQService rabbitService, IConfiguration config) => {
    var user = await authService.AuthenticateAsync(request.IdToken);
    if (user == null) return Results.Unauthorized();

    // async notification (simulate welcome email)
    _ = rabbitService.PublishMessageAsync("notifications", new NotificationMessage 
    {
        Email = user.Email ?? "user@example.com",
        Subject = "Welcome to WMS Control Center",
        Body = $"Hello {user.Name}, your account is ready. You are logged in as a {user.Role}."
    });

    var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
    var key = Encoding.UTF8.GetBytes(config["Jwt:Key"] ?? "super_secret_key_123_dont_use_in_production");
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.EmployeeID.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        }),
        Expires = DateTime.UtcNow.AddDays(7),
        Issuer = config["Jwt:Issuer"],
        Audience = config["Jwt:Audience"],
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    var token = tokenHandler.CreateToken(tokenDescriptor);
    var tokenString = tokenHandler.WriteToken(token);

    return Results.Ok(new { Token = tokenString, User = user });
});

app.MapPost("/auth/demo-login", async ([Microsoft.AspNetCore.Mvc.FromBody] long employeeId, WarehouseDbContext db, IConfiguration config) => {
    var user = await db.Employees.FindAsync(employeeId);
    if (user == null) return Results.NotFound();

    var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
    var key = Encoding.UTF8.GetBytes(config["Jwt:Key"] ?? "super_secret_key_123_dont_use_in_production");
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.EmployeeID.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        }),
        Expires = DateTime.UtcNow.AddDays(7),
        Issuer = config["Jwt:Issuer"],
        Audience = config["Jwt:Audience"],
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new { Token = tokenHandler.WriteToken(token), User = user });
});

// inventory and employee endpoints  
app.MapGet("/inventory", async (WarehouseDbContext db) => await db.Products.ToListAsync());

app.MapPost("/inventory", async ([Microsoft.AspNetCore.Mvc.FromBody] Product product, WarehouseDbContext db) => {
    db.Products.Add(product);
    await db.SaveChangesAsync();
    return Results.Created($"/inventory/{product.ProductID}", product);
});

app.MapGet("/employees", async (WarehouseDbContext db) => await db.Employees.ToListAsync());
app.MapGet("/lpns", async (WarehouseDbContext db) => 
    await db.LPNs.Include(l => l.Contents).ThenInclude(c => c.Product).ToListAsync());

app.MapGet("/shelves", async (WarehouseDbContext db) => 
    await db.Shelves
            .Include(s => s.Bins)
                .ThenInclude(b => b.LPNs)
                    .ThenInclude(l => l.Contents)
                        .ThenInclude(c => c.Product)
            .AsNoTracking() 
            .ToListAsync());

app.MapPost("/shelves", async (Shelf shelf, WarehouseDbContext db) => {
    db.Shelves.Add(shelf);
    await db.SaveChangesAsync();
    return Results.Created($"/shelves/{shelf.ShelfID}", shelf);
});

app.MapPut("/shelves/{id}", async (long id, Shelf updatedShelf, WarehouseDbContext db) => {
    var shelf = await db.Shelves.FindAsync(id);
    if (shelf == null) return Results.NotFound();

    shelf.Label = updatedShelf.Label;
    shelf.X = updatedShelf.X;
    shelf.Y = updatedShelf.Y;
    shelf.Width = updatedShelf.Width;
    shelf.Height = updatedShelf.Height;
    shelf.BinCount = updatedShelf.BinCount;
    shelf.IsLoadingDock = updatedShelf.IsLoadingDock;
    shelf.IsAvailable = updatedShelf.IsAvailable;
    shelf.CustomerID = updatedShelf.CustomerID;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

// work orders (moved to seperate WorkOrderController.cs)


// seed data reset
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

app.Run();

public class GoogleLoginRequest
{
    public string IdToken { get; set; } = string.Empty;
}

public class NotificationMessage
{
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}
