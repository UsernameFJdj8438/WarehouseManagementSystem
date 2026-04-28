using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum EmployeeRole
{
    Manager,
    Worker
}

public class Employee
{
    [Key]
    [Column("EmployeeID")]
    public long EmployeeID { get; set; }

    [Column("Name")]
    public required string Name { get; set; }

    [Column("Role")]
    public EmployeeRole Role { get; set; }
}
