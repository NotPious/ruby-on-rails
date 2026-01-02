module Mutations
  class UpdateCartItem < BaseMutation
    argument :cart_item_id, ID, required: true
    argument :quantity, Integer, required: true
    
    field :cart_item, Types::CartItemType, null: true
    field :errors, [String], null: false
    
    def resolve(cart_item_id:, quantity:)
      cart_item = CartItem.find_by(id: cart_item_id)
      
      unless cart_item
        return { cart_item: nil, errors: ["Cart item not found"] }
      end
      
      # Remove item if quantity is 0 or less
      if quantity <= 0
        cart_item.destroy
        return { cart_item: nil, errors: [] }
      end
      
      # Check inventory
      if quantity > cart_item.product.inventory_count
        return { 
          cart_item: nil, 
          errors: ["Insufficient inventory. Only #{cart_item.product.inventory_count} available."] 
        }
      end
      
      # Update quantity
      if cart_item.update(quantity: quantity)
        { cart_item: cart_item, errors: [] }
      else
        { cart_item: nil, errors: cart_item.errors.full_messages }
      end
    rescue ActiveRecord::RecordNotFound
      { cart_item: nil, errors: ["Cart item not found"] }
    rescue StandardError => e
      Rails.logger.error("UpdateCartItem error: #{e.message}")
      { cart_item: nil, errors: ["An error occurred while updating cart item"] }
    end
  end
end