using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkOrderController : ControllerBase
{
    private readonly WarehouseDbContext _db;
    private readonly ILogger<WorkOrderController> _logger;

    public WorkOrderController(WarehouseDbContext db, ILogger<WorkOrderController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkOrder>>> GetWorkOrders()
    {
        return await _db.WorkOrders
            .Include(w => w.LPN)
            .Include(w => w.AssignedEmployee)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<WorkOrder>> CreateWorkOrder(WorkOrder wo)
    {
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetWorkOrders), new { id = wo.WorkOrderID }, wo);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] WorkOrderStatus status)
    {
        try
        {
            var wo = await _db.WorkOrders
                .Include(w => w.LPN).ThenInclude(l => l!.Contents)
                .Include(w => w.FromBin).ThenInclude(b => b!.Shelf)
                .Include(w => w.ToBin).ThenInclude(b => b!.Shelf)
                .FirstOrDefaultAsync(w => w.WorkOrderID == id);

            if (wo == null) return NotFound();
            wo.Status = status;

            if (status == WorkOrderStatus.InProgress)
            {
                if (wo.LPN != null) wo.LPN.CurrentBinID = null;
            }
            else if (status == WorkOrderStatus.Completed)
            {
                if (wo.LPN != null)
                {
                    wo.LPN.CurrentBinID = wo.ToBinID;
                    bool fromDock = wo.FromBin?.Shelf?.IsLoadingDock ?? false;
                    bool toDock = wo.ToBin?.Shelf?.IsLoadingDock ?? false;

                    if (fromDock && !toDock)
                    {
                        foreach (var content in wo.LPN.Contents)
                        {
                            var product = await _db.Products.FindAsync(content.ProductID);
                            if (product != null) product.UnassignedStock -= content.Quantity;
                        }
                    }
                    else if (!fromDock && toDock)
                    {
                        foreach (var content in wo.LPN.Contents)
                        {
                            var product = await _db.Products.FindAsync(content.ProductID);
                            if (product != null) product.UnassignedStock += content.Quantity;
                        }
                    }
                }
                wo.CompletedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating work order status");
            return StatusCode(500, "Internal server error during work order update");
        }
    }
}
