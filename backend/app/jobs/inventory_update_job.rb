class InventoryUpdateJob
  include Sidekiq::Job
  
  sidekiq_options queue: :default, retry: 5
  
  def perform(order_id)
    order = Order.find(order_id)
    
    Rails.logger.info "Updating inventory for order #{order_id}"
    
    ActiveRecord::Base.transaction do
      order.order_items.each do |item|
        product = item.product
        new_inventory = product.inventory_count - item.quantity
        
        if new_inventory < 0
          raise "Insufficient inventory for product #{product.id}"
        end
        
        product.update!(inventory_count: new_inventory)
        Rails.logger.info "Updated product #{product.id} inventory: #{product.inventory_count}"
      end
    end
    
    Rails.logger.info "Inventory updated successfully for order #{order_id}"
  rescue => e
    Rails.logger.error "Inventory update failed for order #{order_id}: #{e.message}"
    raise # Retry the job
  end
end