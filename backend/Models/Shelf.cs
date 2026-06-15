using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class Shelf
{
    [Key]
    [Column("ShelfID")]
    public long ShelfID { get; set; }

    [Column("Label")]
    public required string Label { get; set; }

    [Column("X")]
    public double X { get; set; }

    [Column("Y")]
    public double Y { get; set; }

    [Column("Width")]
    public double Width { get; set; }

    [Column("Height")]
    public double Height { get; set; }

    [Column("BinCount")]
    public int BinCount { get; set; }

    [Column("IsLoadingDock")]
    public bool IsLoadingDock { get; set; }

    [Column("CustomerID")]
    public long? CustomerID { get; set; }

    [ForeignKey("CustomerID")]
    public Employee? Customer { get; set; }

    [Column("ContractID")]
    public long? ContractID { get; set; }

    [ForeignKey("ContractID")]
    [JsonIgnore]
    public RentalContract? Contract { get; set; }

    [Column("IsAvailable")]
    public bool IsAvailable { get; set; } = true;

    public ICollection<Bin> Bins { get; set; } = new List<Bin>();

    // calculates the % of bins that have at least one LPN
    public double GetFillLevel()
    {
        if (Bins.Count == 0) return 0;
        
        int occupiedBins = Bins.Count(b => b.LPNs != null && b.LPNs.Any());
        return Math.Round(((double)occupiedBins / Bins.Count) * 100, 2);
    }
}
