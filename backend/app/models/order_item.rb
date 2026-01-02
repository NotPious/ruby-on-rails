class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :product
  
  validates :quantity, presence: true, numericality: { 
    only_integer: true, 
    greater_than: 0 
  }
  validates :price, presence: true, numericality: { greater_than: 0 }
  
  def subtotal
    quantity * price
  end
end