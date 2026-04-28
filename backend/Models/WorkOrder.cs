using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum WorkOrderStatus
{
    Pending,
    InProgress,
    Completed,
    Cancelled
}

public class WorkOrder
{
    [Key]
    [Column("WorkOrderID")]
    public long WorkOrderID { get; set; }

    [ForeignKey("LPN")]
    [Column("LPNID")]
    public required string LPNID { get; set; }
    public LPN? LPN { get; set; }

    [ForeignKey("FromBin")]
    [Column("FromBinID")]
    public long FromBinID { get; set; }
    public Bin? FromBin { get; set; }

    [ForeignKey("ToBin")]
    [Column("ToBinID")]
    public long ToBinID { get; set; }
    public Bin? ToBin { get; set; }

    [ForeignKey("AssignedEmployee")]
    [Column("AssignedEmployeeID")]
    public long? AssignedEmployeeID { get; set; }
    public Employee? AssignedEmployee { get; set; }

    [Column("Status")]
    public WorkOrderStatus Status { get; set; }

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("CompletedAt")]
    public DateTime? CompletedAt { get; set; }
}
