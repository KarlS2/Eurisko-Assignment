import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getRelatedProducts, Product } from '../lib/api';
import { useCartStore } from '../lib/store';
import { formatCurrency } from '../lib/format';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import Spinner from '../components/atoms/Spinner';
import ProductCard from '../components/molecules/ProductCard';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const addItem = useCartStore((state) => state.addItem);
  
  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);
  
  async function loadProduct(productId: string) {
    setIsLoading(true);
    const data = await getProduct(productId);
    setProduct(data);
    
    if (data) {
      const related = await getRelatedProducts(productId);
      setRelatedProducts(related);
    }
    
    setIsLoading(false);
  }
  
  function handleAddToCart() {
    if (product) {
      addItem(product, quantity);
      setQuantity(1);
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <Link to="/" className="text-primary-600 hover:underline">
          Return to catalog
        </Link>
      </div>
    );
  }
  
  const isLowStock = product.stockQty < 10;
  const isOutOfStock = product.stockQty === 0;
  
  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link to="/" className="hover:text-primary-600">
              Catalog
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">{product.title}</li>
        </ol>
      </nav>
      
      {/* Product Details */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {product.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {product.tags.map(tag => (
                <Badge key={tag} variant="info" size="md">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="text-4xl font-bold text-gray-900">
            {formatCurrency(product.price)}
          </div>
          
          <div className="space-y-2">
            <p className="text-base text-gray-700">{product.description}</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Stock:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900">{product.stockQty} available</span>
                {isLowStock && !isOutOfStock && (
                  <Badge variant="warning" size="sm">
                    Low stock
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge variant="danger" size="sm">
                    Out of stock
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Quantity:
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stockQty, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                  min="1"
                  max={product.stockQty}
                  aria-label="Quantity"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stockQty, quantity + 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  aria-label="Increase quantity"
                  disabled={quantity >= product.stockQty}
                >
                  +
                </button>
              </div>
            </div>
            
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={`Add ${quantity} ${product.title} to cart`}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map(relatedProduct => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                onAddToCart={(p) => addItem(p)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

}
