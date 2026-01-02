module Types
  class CartType < Types::BaseObject
    field :id, ID, null: false
    field :session_id, String, null: false
    field :cart_items, [Types::CartItemType], null: false
    field :total, Float, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    
    def total
      object.cart_items.includes(:product).sum { |item| item.quantity * item.product.price }
    end
  end
end