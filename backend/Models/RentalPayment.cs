using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum PaymentStatus
{
    Pending,
    Paid,
    Overdue,
    Failed
}

public class RentalPayment
{
    [Key]
    [Column("PaymentID")]
    public long PaymentID { get; set; }

    [Column("ContractID")]
    public long ContractID { get; set; }

    [ForeignKey("ContractID")]
    public RentalContract? Contract { get; set; }

    [Column("StripeInvoiceID")]
    public string? StripeInvoiceID { get; set; }

    [Column("Amount")]
    public decimal Amount { get; set; }

    [Column("DueDate")]
    public DateTime DueDate { get; set; }

    [Column("PaidDate")]
    public DateTime? PaidDate { get; set; }

    [Column("Status")]
    public PaymentStatus Status { get; set; }
}
