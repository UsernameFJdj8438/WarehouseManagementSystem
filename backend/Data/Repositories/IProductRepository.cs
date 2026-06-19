using System.Collections.Generic;
using Backend.Models;

namespace Backend.Data.Repositories
{
    public interface IProductRepository
    {
        IEnumerable<Product> GetAllProducts();
        Product? GetProductById(int id);
    }
}