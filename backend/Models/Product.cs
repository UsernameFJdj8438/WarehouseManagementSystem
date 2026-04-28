using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class Product
{
    [Key]
    [Column("ProductID")]
    public long ProductID { get; set; }
    
    [Column("SKU")]
    public required string SKU { get; set; }
    
    [Column("Name")]
    public required string Name { get; set; }
    
    [Column("Description")]
    public string? Description { get; set; }
    
    [Column("Price")]
    public long Price { get; set; }
    
    [Column("MinStockLevel")]
    public int MinStockLevel { get; set; }
    
    [Column("TotalStock")]
    public int TotalStock { get; set; }
    
    [Column("UnassignedStock")]
    public int UnassignedStock { get; set; }
    
    [Column("Weight")]
    public double Weight { get; set; }
}
