class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.string :user_email
      t.string :status
      t.decimal :total_amount
      t.string :payment_status

      t.timestamps
    end
  end
end
