module Types
  class ProductType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String, null: true
    field :price, Float, null: false
    field :category, String, null: false
    field :inventory_count, Integer, null: false
    field :glp1_stage, String, null: true
    field :educational_content, String, null: true
    field :image_url, String, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    
    def image_url
      filename = "#{object.id}_#{object.name.gsub(/[^0-9A-Za-z]/, '_')}.svg"
      "/images/products/#{filename}"
    end
  end
end