using Backend.Models;
using Xunit;

namespace Backend.Tests;

public class ProductTests
{
    [Fact]
    public void IsLowStock_ShouldReturnTrue_WhenStockIsBelowMin()
    {
        // arrange, test data
        var product = new Product 
        { 
            Name = "Test Product", 
            SKU = "PRD-TEST-01", 
            TotalStock = 2, 
            MinStockLevel = 5 
        };

        // check if stock is low
        bool result = product.IsLowStock();

        // should be true
        Assert.True(result);
    }

    [Fact]
    public void IsLowStock_ShouldReturnFalse_WhenStockIsSufficient()
    {
        // arange, test data
        var product = new Product 
        { 
            Name = "Healthy Product", 
            SKU = "PRD-TEST-02", 
            TotalStock = 10, 
            MinStockLevel = 5 
        };

        // check if stock is low
        bool result = product.IsLowStock();

        // should e true
        Assert.False(result);
    }
}
