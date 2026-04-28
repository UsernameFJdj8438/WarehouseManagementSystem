using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class LPNContent
{
    [Key]
    [Column("LPNContentID")]
    public long LPNContentID { get; set; }

    [ForeignKey("LPN")]
    [Column("LPNID")]
    public required string LPNID { get; set; }
    public LPN? LPN { get; set; }

    [ForeignKey("Product")]
    [Column("ProductID")]
    public long ProductID { get; set; }
    public Product? Product { get; set; }

    [Column("Quantity")]
    public int Quantity { get; set; }
}
