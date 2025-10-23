// src/pages/catalog.tsx
// Updated with backend API integration

import { useState, useEffect } from 'react';
import { listProducts, sortProducts, filterProductsByTag, type Product } from '../lib/api';
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  
  const addItem = useCartStore((state) => state.addItem);
  
  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);
  
  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, sortBy, selectedTag, selectedCategory]);
  
  async function loadProducts() {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await listProducts({
        limit: 100, // Load more products initially
      });
      
      setProducts(data);
      
      // Extract unique tags and categories
      const tags = new Set<string>();
      const categories = new Set<string>();
      
      data.forEach((p) => {
        p.tags?.forEach((t: string) => tags.add(t));
        if (p.category) categories.add(p.category);
      });
      
      setAllTags(Array.from(tags).sort());
      setAllCategories(Array.from(categories).sort());
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }
  
  function applyFilters() {
    let result = [...products];
    
    // Search filter (client-side for now)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || p.title).toLowerCase().includes(query) ||
          p.tags?.some((t) => t.toLowerCase().includes(query)) ||
          p.description?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
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
  
  function handleSearch(query: string) {
    setSearchQuery(query);
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" />
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Product Catalog</h1>
        
        <div className="space-y-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by name, tag, or description..."
          />
          
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            {allCategories.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                  Category:
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All categories</option>
                  {allCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Tag Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="tag-filter" className="text-sm font-medium text-gray-700">
                Tag:
              </label>
              <select
                id="tag-filter"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
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
          </div>
          
          {/* Results count */}
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>
      </div>
      
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product._id || product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      
      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg mb-2">No products found</p>
          <p className="text-gray-400 text-sm">
            Try adjusting your filters or search query
          </p>
          {(searchQuery || selectedTag || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('');
                setSelectedCategory('');
              }}
              className="mt-4 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}