using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum EmployeeRole
{
    Manager,
    Worker,
    Customer
}

public class Employee
{
    [Key]
    [Column("EmployeeID")]
    public long EmployeeID { get; set; }

    [Column("Name")]
    public required string Name { get; set; }

    [Column("Email")]
    public string? Email { get; set; }

    [Column("Role")]
    public EmployeeRole Role { get; set; }
}
