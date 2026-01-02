class Cart < ApplicationRecord
  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items
  
  validates :session_id, presence: true, uniqueness: true
  
  def total
    cart_items.includes(:product).sum { |item| item.quantity * item.product.price }
  end
  
  def item_count
    cart_items.sum(:quantity)
  end
  
  def empty?
    cart_items.empty?
  end
end