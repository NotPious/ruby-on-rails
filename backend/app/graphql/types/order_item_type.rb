module Types
  class OrderItemType < Types::BaseObject
    field :id, ID, null: false
    field :product, Types::ProductType, null: false
    field :quantity, Integer, null: false
    field :price, Float, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end