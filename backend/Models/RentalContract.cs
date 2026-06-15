using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum ContractStatus
{
    Pending,
    Active,
    Expired,
    Cancelled
}

public class RentalContract
{
    [Key]
    [Column("ContractID")]
    public long ContractID { get; set; }

    [Column("CustomerID")]
    public long CustomerID { get; set; }

    [ForeignKey("CustomerID")]
    public Employee? Customer { get; set; }

    [Column("MonthlyRate")]
    public decimal MonthlyRate { get; set; }

    [Column("StartDate")]
    public DateTime StartDate { get; set; }

    [Column("EndDate")]
    public DateTime EndDate { get; set; }

    [Column("Status")]
    public ContractStatus Status { get; set; }

    public ICollection<RentalPayment> Payments { get; set; } = new List<RentalPayment>();
    public ICollection<Shelf> Shelves { get; set; } = new List<Shelf>();
}
