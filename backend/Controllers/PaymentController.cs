using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Stripe;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly WarehouseDbContext _db;
    private readonly IStripeService _stripeService;
    private readonly IConfiguration _config;

    public PaymentController(WarehouseDbContext db, IStripeService stripeService, IConfiguration config)
    {
        _db = db;
        _stripeService = stripeService;
        _config = config;
    }

    [Authorize]
    [HttpPost("create-intent/{paymentId}")]
    public async Task<IActionResult> CreatePaymentIntent(long paymentId)
    {
        var customerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (customerIdClaim == null) return Unauthorized();
        long customerId = long.Parse(customerIdClaim.Value);

        var payment = await _db.RentalPayments
            .Include(p => p.Contract)
            .FirstOrDefaultAsync(p => p.PaymentID == paymentId && p.Contract!.CustomerID == customerId);

        if (payment == null) return NotFound("Payment record not found or access denied.");
        if (payment.Status == PaymentStatus.Paid) return BadRequest("This installment is already paid.");

        var intent = await _stripeService.CreatePaymentIntentAsync(payment);

        return Ok(new { ClientSecret = intent.ClientSecret });
    }

    [Authorize]
    [HttpPost("confirm/{paymentId}")]
    public async Task<IActionResult> ConfirmPayment(long paymentId)
    {
        var customerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (customerIdClaim == null) return Unauthorized();
        long customerId = long.Parse(customerIdClaim.Value);

        var payment = await _db.RentalPayments
            .Include(p => p.Contract)
            .FirstOrDefaultAsync(p => p.PaymentID == paymentId && p.Contract!.CustomerID == customerId);

        if (payment == null) return NotFound();
        if (payment.Status == PaymentStatus.Paid) return Ok("Already paid.");

        payment.Status = PaymentStatus.Paid;
        payment.PaidDate = DateTime.UtcNow;

        var contract = await _db.RentalContracts.FindAsync(payment.ContractID);
        if (contract != null && contract.Status == ContractStatus.Pending)
        {
            contract.Status = ContractStatus.Active;
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Policy = "ManagerOnly")]
    [HttpPost("approve-offline/{paymentId}")]
    public async Task<IActionResult> ApproveOffline(long paymentId)
    {
        var payment = await _db.RentalPayments
            .Include(p => p.Contract)
            .FirstOrDefaultAsync(p => p.PaymentID == paymentId);

        if (payment == null) return NotFound();
        if (payment.Status == PaymentStatus.Paid) return BadRequest("Payment already completed.");

        // manually mark as paid
        payment.Status = PaymentStatus.Paid;
        payment.PaidDate = DateTime.UtcNow;

        // if this was the first payment, activate the contract
        var contract = await _db.RentalContracts.FindAsync(payment.ContractID);
        if (contract != null && contract.Status == ContractStatus.Pending)
        {
            contract.Status = ContractStatus.Active;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Payment approved manually by manager." });
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                json,
                Request.Headers["Stripe-Signature"],
                _config["Stripe:WebhookSecret"]
            );

            if (stripeEvent.Type == EventTypes.PaymentIntentSucceeded)
            {
                var intent = stripeEvent.Data.Object as PaymentIntent;
                if (intent != null && intent.Metadata.ContainsKey("PaymentID"))
                {
                    var paymentId = long.Parse(intent.Metadata["PaymentID"]);

                    var payment = await _db.RentalPayments.FindAsync(paymentId);
                    if (payment != null && payment.Status != PaymentStatus.Paid)
                    {
                        payment.Status = PaymentStatus.Paid;
                        payment.PaidDate = DateTime.UtcNow;
                        payment.StripeInvoiceID = intent.Id;
                        
                        // also update contract status if this is the first payment
                        var contract = await _db.RentalContracts.FindAsync(payment.ContractID);
                        if (contract != null && contract.Status == ContractStatus.Pending)
                        {
                            contract.Status = ContractStatus.Active;
                        }

                        await _db.SaveChangesAsync();
                    }
                }
            }

            return Ok();
        }
        catch (StripeException)
        {
            return BadRequest();
        }
        catch (Exception)
        {
            return StatusCode(500);
        }
    }
}
