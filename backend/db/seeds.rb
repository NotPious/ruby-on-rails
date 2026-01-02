Product.destroy_all

products = [
  {
    name: "Premium Whey Protein Isolate",
    description: "High-quality protein to support muscle maintenance during weight loss. 25g protein per serving, easy to digest.",
    price: 49.99,
    category: "Supplements",
    inventory_count: 100,
    glp1_stage: "active",
    educational_content: "Protein intake is crucial during GLP-1 therapy to preserve lean muscle mass. Aim for 1.2-1.6g per kg of body weight daily."
  },
  {
    name: "Meal Prep Container Set",
    description: "BPA-free, microwave-safe containers perfect for portion control. Set of 10 with dividers.",
    price: 29.99,
    category: "Meal Prep",
    inventory_count: 150,
    glp1_stage: "starting",
    educational_content: "Portion control is essential when starting GLP-1 medication. These containers help visualize appropriate serving sizes."
  },
  {
    name: "Resistance Band Set",
    description: "5 levels of resistance for strength training at home. Includes door anchor and exercise guide.",
    price: 34.99,
    category: "Fitness",
    inventory_count: 75,
    glp1_stage: "active",
    educational_content: "Resistance training 2-3x per week helps maintain metabolism and muscle mass during weight loss."
  },
  {
    name: "Hydration Tracker Bottle",
    description: "32oz bottle with time markers to ensure adequate hydration throughout the day.",
    price: 24.99,
    category: "Wellness",
    inventory_count: 200,
    glp1_stage: "starting",
    educational_content: "Staying hydrated reduces common GLP-1 side effects like nausea and constipation. Aim for 64-80oz daily."
  },
  {
    name: "Digital Food Scale",
    description: "Accurate to 1g, helps track macronutrients and portion sizes. Rechargeable battery.",
    price: 19.99,
    category: "Meal Prep",
    inventory_count: 120,
    glp1_stage: "starting",
    educational_content: "Accurate food tracking helps you understand hunger cues and nutritional needs during medication adjustment."
  },
  {
    name: "Omega-3 Fish Oil",
    description: "High-potency EPA/DHA for cardiovascular health. 60 capsules, 2-month supply.",
    price: 39.99,
    category: "Supplements",
    inventory_count: 90,
    glp1_stage: "maintenance",
    educational_content: "Omega-3s support heart health, especially important as you optimize metabolic health during GLP-1 therapy."
  }
]

products.each { |attrs| Product.create!(attrs) }

puts "Seeded #{Product.count} products"