import { useState, useEffect } from 'react';
import { listProducts, sortProducts, filterProductsByTag, Product } from '../lib/api';
import { useCartStore } from '../lib/store';
import ProductCard from '../component/molecules/ProductCard';
import SearchBar from '../component/molecules/SearchBar';
import Spinner from '../component/atoms/Spinner';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc'>('price-asc');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  
  const addItem = useCartStore((state) => state.addItem);
  
  useEffect(() => {
    loadProducts();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, sortBy, selectedTag]);
  
  async function loadProducts() {
    setIsLoading(true);
    const data = await listProducts();
    setProducts(data);
    
    // Extract unique tags
    const tags = new Set<string>();
    data.forEach(p => p.tags.forEach(t => tags.add(t)));
    setAllTags(Array.from(tags).sort());
    
    setIsLoading(false);
  }
  
  function applyFilters() {
    let result = [...products];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query)) ||
        p.description.toLowerCase().includes(query)
      );
    }
    
    // Tag filter
    if (selectedTag) {
      result = filterProductsByTag(result, selectedTag);
    }
    
    // Sort
    result = sortProducts(result, sortBy);
    
    setFilteredProducts(result);
  }
  
  function handleAddToCart(product: Product) {
    addItem(product);
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Product Catalog</h1>
        
        <div className="space-y-4">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search by name, tag, or description..."
          />
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price-asc' | 'price-desc')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="tag-filter" className="text-sm font-medium text-gray-700">
                Filter by tag:
              </label>
              <select
                id="tag-filter"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}