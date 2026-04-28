using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public class WarehouseDbContext : DbContext
{
    public WarehouseDbContext(DbContextOptions<WarehouseDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Shelf> Shelves => Set<Shelf>();
    public DbSet<Bin> Bins => Set<Bin>();
    public DbSet<LPN> LPNs => Set<LPN>();
    public DbSet<LPNContent> LPNContents => Set<LPNContent>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().ToTable("Product");
        modelBuilder.Entity<Shelf>().ToTable("Shelf");
        modelBuilder.Entity<Bin>().ToTable("Bin");
        modelBuilder.Entity<LPN>().ToTable("LPN");
        modelBuilder.Entity<LPNContent>().ToTable("LPNContent");
        modelBuilder.Entity<Employee>().ToTable("Employee");
        modelBuilder.Entity<WorkOrder>().ToTable("WorkOrder");

        
        modelBuilder.Entity<LPN>()
            .HasOne(l => l.Bin)
            .WithMany(b => b.LPNs)
            .HasForeignKey(l => l.CurrentBinID);
    }
}
