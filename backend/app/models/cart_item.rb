class CartItem < ApplicationRecord
  belongs_to :cart
  belongs_to :product
  
  validates :quantity, presence: true, numericality: { 
    only_integer: true, 
    greater_than: 0 
  }
  validates :product_id, uniqueness: { 
    scope: :cart_id,
    message: "already exists in cart"
  }
  
  validate :inventory_available
  
  def subtotal
    quantity * product.price
  end
  
  private
  
  def inventory_available
    if product && quantity && quantity > product.inventory_count
      errors.add(:quantity, "exceeds available inventory (#{product.inventory_count} available)")
    end
  end
end