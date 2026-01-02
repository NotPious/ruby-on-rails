class CreateProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.string :name
      t.text :description
      t.decimal :price
      t.string :category
      t.integer :inventory_count
      t.string :glp1_stage
      t.text :educational_content

      t.timestamps
    end
  end
end
