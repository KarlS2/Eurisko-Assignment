import { useState, FormEvent } from 'react';
import Input from '../atoms/Input';
import Button from '../atoms/Button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Search products...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        fullWidth
        aria-label="Search products"
      />
      <Button type="submit" variant="primary" aria-label="Submit search">
        Search
      </Button>
    </form>
  );

}
