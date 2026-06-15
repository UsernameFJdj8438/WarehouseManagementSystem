using Backend.Models;
using Xunit;

namespace Backend.Tests;

public class ShelfTests
{
    [Fact]
    public void GetFillLevel_ShouldReturnCorrectPercentage()
    {
        // arrange, 
        var shelf = new Shelf { Label = "Test Shelf", BinCount = 4 };
        
        // 4 bins all empty but 1
        var bin1 = new Bin { Position = 1, LPNs = new List<LPN> { new LPN { LPNID = "L1" } } };
        var bin2 = new Bin { Position = 2, LPNs = new List<LPN>() };
        var bin3 = new Bin { Position = 3, LPNs = new List<LPN>() };
        var bin4 = new Bin { Position = 4, LPNs = new List<LPN>() };
        
        shelf.Bins = new List<Bin> { bin1, bin2, bin3, bin4 };

        // calculate fill level
        double fillLevel = shelf.GetFillLevel();

        // should return 25%
        Assert.Equal(25.0, fillLevel);
    }

    [Fact]
    public void GetFillLevel_ShouldReturnZero_WhenEmpty()
    {
        // arrange
        var shelf = new Shelf { Label = "Empty Shelf" };
        shelf.Bins = new List<Bin> { new Bin(), new Bin() };

        // check fill level
        double fillLevel = shelf.GetFillLevel();

        // should be 0
        Assert.Equal(0, fillLevel);
    }
}
