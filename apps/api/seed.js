require('dotenv').config();
const { MongoClient } = require('mongodb');

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Products data (from your mock catalog - unchanged)
const products = [
  {
    name: "iPhone 15 Pro Max 256GB",
    description: "Latest iPhone with A17 Pro chip, titanium design, and advanced camera system with 5x optical zoom.",
    price: 1199.99,
    category: "smartphones",
    tags: ["smartphones", "apple", "flagship"],
    imageUrl: "https://images.unsplash.com/photo-1696446702717-baa16ae2a01f?w=400",
    stock: 24
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Premium Android flagship with S Pen, 200MP camera, and AI-powered features.",
    price: 1299.99,
    category: "smartphones",
    tags: ["smartphones", "samsung", "android"],
    imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400",
    stock: 18
  },
  {
    name: "MacBook Pro 14-inch M3",
    description: "Powerful laptop with M3 chip, Liquid Retina XDR display, and up to 22-hour battery life.",
    price: 1999.99,
    category: "laptops",
    tags: ["laptops", "apple", "professional"],
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    stock: 12
  },
  {
    name: "PlayStation 5 Console",
    description: "Next-gen gaming console with 4K 120Hz output, ultra-fast SSD, and DualSense controller.",
    price: 499.99,
    category: "gaming",
    tags: ["gaming", "consoles", "playstation"],
    imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400",
    stock: 8
  },
  {
    name: "Xbox Series X",
    description: "Most powerful Xbox ever with 4K gaming, ray tracing, and Game Pass compatibility.",
    price: 499.99,
    category: "gaming",
    tags: ["gaming", "consoles", "xbox"],
    imageUrl: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400",
    stock: 15
  },
  {
    name: "AirPods Pro 2nd Gen",
    description: "Premium wireless earbuds with adaptive audio, active noise cancellation, and USB-C charging.",
    price: 249.99,
    category: "audio",
    tags: ["audio", "apple", "wireless", "accessories"],
    imageUrl: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400",
    stock: 45
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise canceling headphones with 30-hour battery and premium sound quality.",
    price: 399.99,
    category: "audio",
    tags: ["audio", "headphones", "wireless", "sony"],
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400",
    stock: 32
  },
  {
    name: "iPad Air 11-inch M2",
    description: "Versatile tablet with M2 chip, Liquid Retina display, and Apple Pencil Pro support.",
    price: 599.99,
    category: "tablets",
    tags: ["tablets", "apple", "productivity"],
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    stock: 28
  },
  {
    name: "Logitech MX Master 3S Mouse",
    description: "Professional wireless mouse with ergonomic design, silent clicks, and 8K DPI sensor.",
    price: 99.99,
    category: "accessories",
    tags: ["accessories", "peripherals", "mouse", "productivity"],
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
    stock: 67
  },
  {
    name: "Mechanical Gaming Keyboard RGB",
    description: "Premium mechanical keyboard with Cherry MX switches, RGB lighting, and programmable keys.",
    price: 159.99,
    category: "gaming",
    tags: ["gaming", "peripherals", "keyboard", "accessories"],
    imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=400",
    stock: 41
  },
  {
    name: "Samsung Galaxy Watch 6",
    description: "Advanced smartwatch with heart rate monitoring, sleep tracking, and 40+ workout modes.",
    price: 299.99,
    category: "wearables",
    tags: ["wearables", "smartwatch", "samsung", "fitness"],
    imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400",
    stock: 36
  },
  {
    name: "Apple Watch Series 9",
    description: "Most advanced Apple Watch with double tap gesture, all-day battery, and health sensors.",
    price: 399.99,
    category: "wearables",
    tags: ["wearables", "smartwatch", "apple", "fitness"],
    imageUrl: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400",
    stock: 29
  },
  {
    name: "Nintendo Switch OLED",
    description: "Hybrid gaming console with vibrant OLED screen, 64GB storage, and enhanced audio.",
    price: 349.99,
    category: "gaming",
    tags: ["gaming", "consoles", "nintendo", "portable"],
    imageUrl: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400",
    stock: 22
  },
  {
    name: "Anker PowerBank 20000mAh",
    description: "High-capacity portable charger with 65W fast charging, USB-C PD, and dual ports.",
    price: 49.99,
    category: "accessories",
    tags: ["accessories", "charging", "portable", "power"],
    imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400",
    stock: 98
  },
  {
    name: "Dell UltraSharp 27\" 4K Monitor",
    description: "Professional 4K monitor with IPS Black technology, 99% sRGB coverage, and USB-C hub.",
    price: 649.99,
    category: "monitors",
    tags: ["monitors", "displays", "4k", "professional"],
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
    stock: 14
  },
  {
    name: "Razer DeathAdder V3 Gaming Mouse",
    description: "Lightweight wireless gaming mouse with 30K DPI sensor and 90-hour battery life.",
    price: 69.99,
    category: "gaming",
    tags: ["gaming", "peripherals", "mouse", "razer"],
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400",
    stock: 53
  },
  {
    name: "SanDisk 1TB Extreme SSD",
    description: "Rugged portable SSD with 1050MB/s read speeds, IP55 water resistance, and USB-C.",
    price: 129.99,
    category: "storage",
    tags: ["storage", "accessories", "ssd", "portable"],
    imageUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400",
    stock: 76
  },
  {
    name: "Logitech C920 HD Pro Webcam",
    description: "Full HD 1080p webcam with stereo audio, auto light correction, and tripod mount.",
    price: 79.99,
    category: "accessories",
    tags: ["accessories", "webcam", "streaming", "productivity"],
    imageUrl: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400",
    stock: 61
  },
  {
    name: "Google Pixel 8 Pro",
    description: "AI-powered smartphone with Google Tensor G3 chip, best-in-class camera, and 7 years updates.",
    price: 999.99,
    category: "smartphones",
    tags: ["smartphones", "google", "android", "camera"],
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400",
    stock: 19
  },
  {
    name: "JBL Flip 6 Bluetooth Speaker",
    description: "Portable waterproof speaker with powerful JBL sound, 12-hour battery, and PartyBoost.",
    price: 129.99,
    category: "audio",
    tags: ["audio", "speakers", "bluetooth", "portable"],
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
    stock: 84
  },
  {
    name: "ASUS ROG Gaming Laptop RTX 4060",
    description: "Powerful gaming laptop with RTX 4060, 144Hz display, and advanced cooling system.",
    price: 1499.99,
    category: "laptops",
    tags: ["laptops", "gaming", "asus", "high-performance"],
    imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400",
    stock: 9
  },
  {
    name: "Belkin 3-in-1 Wireless Charger",
    description: "Premium charging station for iPhone, Apple Watch, and AirPods with Qi2 fast charging.",
    price: 149.99,
    category: "accessories",
    tags: ["accessories", "charging", "wireless", "apple"],
    imageUrl: "https://images.unsplash.com/photo-1591290619762-c588986cf38d?w=400",
    stock: 47
  },
  {
    name: "SteelSeries Arctis Nova Pro Wireless",
    description: "Premium gaming headset with active noise cancellation, 360° spatial audio, and hot-swap battery.",
    price: 349.99,
    category: "gaming",
    tags: ["gaming", "audio", "headset", "wireless"],
    imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400",
    stock: 25
  },
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 11",
    description: "Ultra-light business laptop with Intel i7, 14\" 2.8K display, and military-grade durability.",
    price: 1799.99,
    category: "laptops",
    tags: ["laptops", "business", "lenovo", "professional"],
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
    stock: 11
  },
  {
    name: "Rode NT-USB Mini Microphone",
    description: "Professional USB microphone for podcasting, streaming, and content creation with studio quality.",
    price: 99.99,
    category: "audio",
    tags: ["audio", "accessories", "microphone", "streaming"],
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400",
    stock: 38
  },
  {
    name: "Wireless Bluetooth Headphones",
    description: "Premium wireless headphones with active noise cancellation.",
    price: 79.99,
    category: "audio",
    tags: ["audio", "wireless"],
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    stock: 45
  }
];

// Customers data (3 ADMINS + regular users)
const customers = [
  // =========================================================================
  // ADMINS (3 users with role: "admin")
  // =========================================================================
  {
    name: "Gandalf the Grey",
    email: "gandalf@shoplite.com",
    phone: "+1-555-MAGIC",
    role: "admin", // ADMIN
    address: "The Shire, Middle Earth",
    createdAt: new Date("2024-01-01T00:00:00Z")
  },
  {
    name: "Darth Vader",
    email: "darth.vader@shoplite.com",
    phone: "+1-555-FORCE",
    role: "admin", // ADMIN
    address: "Death Star, Outer Rim",
    createdAt: new Date("2024-01-01T00:00:00Z")
  },
  {
    name: "Karl Sassine",
    email: "karl.sassine@shoplite.com",
    phone: "+961-555-0001",
    role: "admin", // ADMIN
    address: "Jounieh, Mont-Liban, Lebanon",
    createdAt: new Date("2024-01-01T00:00:00Z")
  },
  
  // =========================================================================
  // REGULAR USERS (role: "user" - default)
  // =========================================================================
  {
    name: "Sarah Mitchell",
    email: "demo@example.com", // TEST USER - documented in README
    phone: "+1-555-0101",
    role: "user",
    address: "123 Tech Street, San Francisco, CA 94105",
    createdAt: new Date("2024-03-15T10:30:00Z")
  },
  {
    name: "James Rodriguez",
    email: "james.rodriguez@email.com",
    phone: "+1-555-0102",
    role: "user",
    address: "456 Gaming Ave, Austin, TX 78701",
    createdAt: new Date("2024-05-20T14:22:00Z")
  },
  {
    name: "Emily Chen",
    email: "emily.chen@techmail.com",
    phone: "+1-555-0103",
    role: "user",
    address: "789 Innovation Blvd, Seattle, WA 98101",
    createdAt: new Date("2024-06-10T09:15:00Z")
  },
  {
    name: "Michael Thompson",
    email: "m.thompson@business.com",
    phone: "+1-555-0104",
    role: "user",
    address: "321 Corporate Dr, New York, NY 10001",
    createdAt: new Date("2024-07-05T16:45:00Z")
  },
  {
    name: "Aisha Patel",
    email: "aisha.patel@email.com",
    phone: "+1-555-0105",
    role: "user",
    address: "654 Creative Lane, Los Angeles, CA 90028",
    createdAt: new Date("2024-08-12T11:30:00Z")
  },
  {
    name: "David Kim",
    email: "david.kim@devmail.com",
    phone: "+1-555-0106",
    role: "user",
    address: "987 Developer St, Portland, OR 97204",
    createdAt: new Date("2024-08-25T13:20:00Z")
  },
  {
    name: "Maria Garcia",
    email: "maria.garcia@email.com",
    phone: "+1-555-0107",
    role: "user",
    address: "147 Market Pl, Miami, FL 33131",
    createdAt: new Date("2024-09-01T10:00:00Z")
  },
  {
    name: "Robert Johnson",
    email: "rob.johnson@corp.com",
    phone: "+1-555-0108",
    role: "user",
    address: "258 Executive Way, Chicago, IL 60601",
    createdAt: new Date("2024-09-10T15:30:00Z")
  },
  {
    name: "Lisa Anderson",
    email: "lisa.anderson@email.com",
    phone: "+1-555-0109",
    role: "user",
    address: "369 Design Ave, Boston, MA 02108",
    createdAt: new Date("2024-09-18T12:45:00Z")
  },
  {
    name: "Kevin Zhang",
    email: "kevin.zhang@techie.com",
    phone: "+1-555-0110",
    role: "user",
    address: "741 Innovation Rd, Denver, CO 80202",
    createdAt: new Date("2024-09-25T09:30:00Z")
  },
  {
    name: "Sophia Martinez",
    email: "sophia.m@creative.com",
    phone: "+1-555-0111",
    role: "user",
    address: "852 Content St, Nashville, TN 37201",
    createdAt: new Date("2024-10-01T14:15:00Z")
  },
  {
    name: "Alex Brown",
    email: "alex.brown@email.com",
    phone: "+1-555-0112",
    role: "user",
    address: "963 Startup Blvd, San Diego, CA 92101",
    createdAt: new Date("2024-10-05T11:00:00Z")
  },
  {
    name: "Nina Williams",
    email: "nina.w@business.net",
    phone: "+1-555-0113",
    role: "user",
    address: "159 Commerce Dr, Atlanta, GA 30303",
    createdAt: new Date("2024-10-08T16:20:00Z")
  }
];

// Function to create realistic orders (unchanged)
function generateOrders(customerIds, productIds) {
  const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const carriers = ['FedEx', 'UPS', 'DHL', 'USPS'];
  
  const orders = [];
  
  // Helper to get random item from array
  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  // Helper to get random number of products (1-4 items per order)
  const getRandomProducts = () => {
    const numItems = Math.floor(Math.random() * 4) + 1;
    const selectedProducts = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numItems; i++) {
      let idx;
      do {
        idx = Math.floor(Math.random() * productIds.length);
      } while (usedIndices.has(idx));
      
      usedIndices.add(idx);
      const product = products[idx];
      const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
      
      selectedProducts.push({
        productId: productIds[idx],
        name: product.name,
        price: product.price,
        quantity: quantity
      });
    }
    
    return selectedProducts;
  };
  
  // Generate dates from last 30 days
  const generateDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };
  
  // Find test user ID (demo@example.com - 4th customer after 3 admins)
  const testCustomerId = customerIds[3];
  
  // Test user order 1 - Recent, DELIVERED
  orders.push({
    customerId: testCustomerId,
    items: getRandomProducts(),
    status: 'DELIVERED',
    carrier: random(carriers),
    estimatedDelivery: generateDate(2),
    createdAt: generateDate(10),
    updatedAt: generateDate(2)
  });
  
  // Test user order 2 - In transit, SHIPPED
  orders.push({
    customerId: testCustomerId,
    items: getRandomProducts(),
    status: 'SHIPPED',
    carrier: random(carriers),
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: generateDate(3),
    updatedAt: generateDate(1)
  });
  
  // Test user order 3 - Just placed, PROCESSING
  orders.push({
    customerId: testCustomerId,
    items: getRandomProducts(),
    status: 'PROCESSING',
    carrier: random(carriers),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    createdAt: generateDate(1),
    updatedAt: generateDate(1)
  });
  
  // Generate 15-17 more orders for other users (skip admins - indices 0,1,2)
  const numAdditionalOrders = 15 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numAdditionalOrders; i++) {
    // Skip first 3 customers (admins) and get random user
    const customerId = customerIds[Math.floor(Math.random() * (customerIds.length - 3)) + 3];
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const status = random(statuses);
    
    let estimatedDelivery;
    let updatedAt;
    
    if (status === 'DELIVERED') {
      estimatedDelivery = generateDate(Math.floor(Math.random() * 15) + 5);
      updatedAt = generateDate(Math.floor(Math.random() * 10) + 1);
    } else if (status === 'SHIPPED') {
      estimatedDelivery = new Date(Date.now() + (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000);
      updatedAt = generateDate(Math.floor(Math.random() * 3) + 1);
    } else {
      estimatedDelivery = new Date(Date.now() + (Math.floor(Math.random() * 7) + 3) * 24 * 60 * 60 * 1000);
      updatedAt = generateDate(Math.floor(Math.random() * 2) + 1);
    }
    
    orders.push({
      customerId: customerId,
      items: getRandomProducts(),
      status: status,
      carrier: random(carriers),
      estimatedDelivery: estimatedDelivery,
      createdAt: generateDate(daysAgo),
      updatedAt: updatedAt
    });
  }
  
  // Calculate totals for each order
  return orders.map(order => ({
    ...order,
    total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }));
}

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('ecommerce'); // Change database name if needed
    
    // Optional: Clear existing data (comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await db.collection('products').deleteMany({});
    await db.collection('customers').deleteMany({});
    await db.collection('orders').deleteMany({});
    console.log('✅ Existing data cleared');
    
    // Insert products
    console.log('📦 Inserting products...');
    const productResult = await db.collection('products').insertMany(products);
    const productIds = Object.values(productResult.insertedIds);
    console.log(`✅ Inserted ${productIds.length} products`);
    
    // Insert customers
    console.log('👥 Inserting customers...');
    const customerResult = await db.collection('customers').insertMany(customers);
    const customerIds = Object.values(customerResult.insertedIds);
    console.log(`✅ Inserted ${customerIds.length} customers`);
    
    // Generate and insert orders
    console.log('🛒 Generating orders...');
    const orders = generateOrders(customerIds, productIds);
    const orderResult = await db.collection('orders').insertMany(orders);
    console.log(`✅ Inserted ${orders.length} orders`);
    
    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`   Products: ${productIds.length}`);
    console.log(`   Customers: ${customerIds.length}`);
    console.log(`     - Admins: 3`);
    console.log(`     - Users: ${customerIds.length - 3}`);
    console.log(`   Orders: ${orders.length}`);
    
    console.log('\n🔑 ADMIN CREDENTIALS (for dashboard access):');
    console.log('   1. gandalf@shoplite.com (Gandalf the Grey)');
    console.log('   2. darth.vader@shoplite.com (Darth Vader)');
    console.log('   3. karl.sassine@shoplite.com (Karl Sassine)');
    
    console.log('\n👤 TEST USER (for demos):');
    console.log('   Email: demo@example.com (Sarah Mitchell)');
    console.log(`   Orders: ${orders.filter(o => o.customerId.equals(customerIds[3])).length}`);
    console.log('   Statuses: DELIVERED, SHIPPED, PROCESSING');
    
    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n💡 To access dashboard, use one of the admin emails above');
    console.log('   Example: curl -H "x-user-email: gandalf@shoplite.com" http://localhost:3000/api/dashboard/overview');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
seedDatabase();
