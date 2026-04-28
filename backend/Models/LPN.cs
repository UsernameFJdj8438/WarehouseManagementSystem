using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum LPNType
{
    Pallet,
    Tote,
    Box
}

public class LPN
{
    [Key]
    [Column("LPNID")]
    public required string LPNID { get; set; } 

    [ForeignKey("Bin")]
    [Column("CurrentBinID")]
    public long? CurrentBinID { get; set; } 
    public Bin? Bin { get; set; }

    [Column("Type")]
    public LPNType Type { get; set; }

    [Column("Weight")]
    public double Weight { get; set; }

    public ICollection<LPNContent> Contents { get; set; } = new List<LPNContent>();
}
