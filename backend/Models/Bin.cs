using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class Bin
{
    [Key]
    [Column("BinID")]
    public long BinID { get; set; }
    
    [ForeignKey("Shelf")]
    [Column("ShelfID")]
    public long ShelfID { get; set; }
    public Shelf? Shelf { get; set; }

    [Column("Position")]
    public int Position { get; set; }

    [Column("MaxLPNs")]
    public int MaxLPNs { get; set; } = 1; 

    public ICollection<LPN> LPNs { get; set; } = new List<LPN>();
}
