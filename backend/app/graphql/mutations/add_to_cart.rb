module Mutations
  class AddToCart < BaseMutation
    argument :session_id, String, required: true
    argument :product_id, ID, required: true
    argument :quantity, Integer, required: true
    
    field :cart, Types::CartType, null: true
    field :errors, [String], null: false
    
    def resolve(session_id:, product_id:, quantity:)
      # Validate quantity
      if quantity <= 0
        return { cart: nil, errors: ["Quantity must be greater than 0"] }
      end
      
      # Find or create cart
      cart = Cart.find_or_create_by(session_id: session_id)
      
      # Find product
      product = Product.find_by(id: product_id)
      unless product
        return { cart: nil, errors: ["Product not found"] }
      end
      
      # Check inventory
      cart_item = cart.cart_items.find_by(product: product)
      current_quantity = cart_item&.quantity || 0
      new_total_quantity = current_quantity + quantity
      
      if new_total_quantity > product.inventory_count
        return { 
          cart: nil, 
          errors: ["Insufficient inventory. Only #{product.inventory_count} available."] 
        }
      end
      
      # Add to cart
      cart_item = cart.cart_items.find_or_initialize_by(product: product)
      cart_item.quantity = new_total_quantity
      
      if cart_item.save
        { cart: cart.reload, errors: [] }
      else
        { cart: nil, errors: cart_item.errors.full_messages }
      end
    rescue ActiveRecord::RecordNotFound => e
      { cart: nil, errors: ["Product not found"] }
    rescue StandardError => e
      Rails.logger.error("AddToCart error: #{e.message}")
      { cart: nil, errors: ["An error occurred while adding to cart"] }
    end
  end
end