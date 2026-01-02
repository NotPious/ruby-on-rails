module Mutations
  class CreateOrder < BaseMutation
    argument :session_id, String, required: true
    argument :user_email, String, required: true
    argument :payment_method_id, String, required: true
    
    field :order, Types::OrderType, null: true
    field :errors, [String], null: false
    
    def resolve(session_id:, user_email:, payment_method_id:)
      # Validate email format
      unless user_email.match?(URI::MailTo::EMAIL_REGEXP)
        return { order: nil, errors: ["Invalid email address"] }
      end
      
      # Find cart
      cart = Cart.find_by(session_id: session_id)
      
      unless cart&.cart_items&.any?
        return { order: nil, errors: ["Cart not found or empty"] }
      end
      
      # Check inventory for all items
      insufficient_items = []
      cart.cart_items.includes(:product).each do |item|
        if item.quantity > item.product.inventory_count
          insufficient_items << "#{item.product.name} (only #{item.product.inventory_count} available)"
        end
      end
      
      if insufficient_items.any?
        return { 
          order: nil, 
          errors: ["Insufficient inventory for: #{insufficient_items.join(', ')}"] 
        }
      end
      
      # Calculate total
      total_amount = cart.cart_items.sum { |item| item.quantity * item.product.price }
      
      # Create order
      order = Order.new(
        user_email: user_email,
        status: 'pending',
        payment_status: 'pending',
        total_amount: total_amount
      )
      
      ActiveRecord::Base.transaction do
        # Save order
        unless order.save
          raise ActiveRecord::Rollback
        end
        
        # Create order items
        cart.cart_items.each do |cart_item|
          order_item = order.order_items.build(
            product: cart_item.product,
            quantity: cart_item.quantity,
            price: cart_item.product.price # Snapshot price at order time
          )
          
          unless order_item.save
            raise ActiveRecord::Rollback
          end
        end
        
        # Queue background job for processing
        OrderProcessingJob.perform_async(order.id, payment_method_id)
        
        # Clear cart
        cart.cart_items.destroy_all
        
        { order: order, errors: [] }
      end
      
    rescue ActiveRecord::Rollback
      { order: nil, errors: ["Failed to create order"] }
    rescue StandardError => e
      Rails.logger.error("CreateOrder error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      { order: nil, errors: ["An error occurred while creating order"] }
    end
  end
end