using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    public ICollection<Bin> Bins { get; set; } = new List<Bin>();
}
