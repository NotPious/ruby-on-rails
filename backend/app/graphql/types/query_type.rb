module Types
  class QueryType < Types::BaseObject
    # Products
    field :products, [Types::ProductType], null: false do
      description "Get all products with optional filtering"
      argument :category, String, required: false, description: "Filter by category"
      argument :glp1_stage, String, required: false, description: "Filter by GLP-1 journey stage"
    end
    
    field :product, Types::ProductType, null: true do
      description "Get a single product by ID"
      argument :id, ID, required: true
    end
    
    # Cart
    field :cart, Types::CartType, null: true do
      description "Get cart for a session"
      argument :session_id, String, required: true
    end
    
    # Orders
    field :orders, [Types::OrderType], null: false do
      description "Get order history for a user"
      argument :user_email, String, required: true
    end
    
    field :order, Types::OrderType, null: true do
      description "Get a single order by ID"
      argument :id, ID, required: true
    end
    
    # Resolvers
    def products(category: nil, glp1_stage: nil)
      scope = Product.all
      scope = scope.where(category: category) if category.present?
      scope = scope.where(glp1_stage: glp1_stage) if glp1_stage.present?
      scope.order(created_at: :desc)
    end
    
    def product(id:)
      Product.find_by(id: id)
    end
    
    def cart(session_id:)
      Cart.includes(cart_items: :product).find_or_create_by(session_id: session_id)
    end
    
    def orders(user_email:)
      Order.includes(order_items: :product)
           .where(user_email: user_email)
           .order(created_at: :desc)
    end
    
    def order(id:)
      Order.includes(order_items: :product).find_by(id: id)
    end
  end
end