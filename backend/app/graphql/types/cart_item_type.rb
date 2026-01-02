module Types
  class CartItemType < Types::BaseObject
    field :id, ID, null: false
    field :product, Types::ProductType, null: false
    field :quantity, Integer, null: false
    field :subtotal, Float, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    
    def subtotal
      object.quantity * object.product.price
    end
  end
end