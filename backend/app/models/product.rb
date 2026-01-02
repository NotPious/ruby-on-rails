class Product < ApplicationRecord
  has_many :order_items, dependent: :restrict_with_error
  has_many :cart_items, dependent: :destroy
  has_many :orders, through: :order_items
  has_many :carts, through: :cart_items

  validates :name, presence: true, length: { minimum: 3, maximum: 200 }
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :inventory_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :category, presence: true, inclusion: { 
    in: %w[Supplements Meal\ Prep Fitness Wellness],
    message: "%{value} is not a valid category"
  }
  validates :glp1_stage, inclusion: { 
    in: %w[starting active maintenance],
    allow_nil: true,
    message: "%{value} is not a valid GLP-1 stage"
  }

  # Scopes
  scope :in_stock, -> { where('inventory_count > ?', 0) }
  scope :by_category, ->(category) { where(category: category) }
  scope :by_glp1_stage, ->(stage) { where(glp1_stage: stage) }

  # Inventory helpers
  def in_stock?
    inventory_count > 0
  end

  def low_stock?
    inventory_count > 0 && inventory_count <= 10
  end

  # Returns the product's SVG image URL if it exists, otherwise a placeholder
  def image_url
    # Build expected filename: "id_Name_With_Underscores.svg"
    filename = "#{id}_#{name.gsub(' ', '_')}.svg"
    svg_path = Rails.root.join('public', 'images', 'products', filename)

    if File.exist?(svg_path)
      "/images/products/#{filename}"  # URL for Rails to serve
    else
      # Fallback placeholder
      "https://placehold.co/300x300?text=#{URI.encode_www_form_component(name)}"
    end
  end
end
