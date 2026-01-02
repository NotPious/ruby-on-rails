class Order < ApplicationRecord
  has_many :order_items, dependent: :destroy
  has_many :products, through: :order_items
  
  validates :user_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :status, presence: true, inclusion: { 
    in: %w[pending confirmed failed shipped delivered cancelled],
    message: "%{value} is not a valid status"
  }
  validates :payment_status, presence: true, inclusion: { 
    in: %w[pending paid failed refunded],
    message: "%{value} is not a valid payment status"
  }
  validates :total_amount, presence: true, numericality: { greater_than: 0 }
  
  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :pending, -> { where(status: 'pending') }
  scope :confirmed, -> { where(status: 'confirmed') }
  
  def item_count
    order_items.sum(:quantity)
  end
end