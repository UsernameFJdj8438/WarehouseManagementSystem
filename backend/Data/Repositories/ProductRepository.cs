using System.Collections.Generic;
using System.Linq;
using Backend.Models;
namespace Backend.Data.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly WarehouseDbContext _context;

        public ProductRepository(WarehouseDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Product> GetAllProducts() => _context.Products.ToList();
       public Product? GetProductById(int id) => _context.Products.Find(id);
    }
}
