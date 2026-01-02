module Types
  class OrderType < Types::BaseObject
    field :id, ID, null: false
    field :user_email, String, null: false
    field :status, String, null: false
    field :total_amount, Float, null: false
    field :payment_status, String, null: false
    field :order_items, [Types::OrderItemType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end