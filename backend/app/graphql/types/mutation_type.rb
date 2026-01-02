module Types
  class MutationType < Types::BaseObject
    field :add_to_cart, mutation: Mutations::AddToCart
    field :update_cart_item, mutation: Mutations::UpdateCartItem
    field :create_order, mutation: Mutations::CreateOrder
  end
end