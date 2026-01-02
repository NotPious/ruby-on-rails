class OrderProcessingJob
  include Sidekiq::Job
  
  sidekiq_options queue: :critical, retry: 3
  
  def perform(order_id, payment_method_id)
    order = Order.find(order_id)
    
    Rails.logger.info "Processing order #{order_id} with payment method #{payment_method_id}"
    
    # Simulate payment processing
    payment_result = process_payment(order, payment_method_id)
    
    if payment_result[:success]
      order.update!(
        status: 'confirmed',
        payment_status: 'paid'
      )
      
      Rails.logger.info "Order #{order_id} confirmed successfully"
      
      # Queue follow-up jobs
      InventoryUpdateJob.perform_async(order_id)
      OrderConfirmationEmailJob.perform_async(order_id)
    else
      order.update!(
        status: 'failed',
        payment_status: 'failed'
      )
      
      Rails.logger.error "Order #{order_id} payment failed: #{payment_result[:error]}"
    end
  end
  
  private
  
  def process_payment(order, payment_method_id)
    # Simulate Stripe payment processing
    # In production, use actual Stripe API:
    # Stripe::PaymentIntent.create(
    #   amount: (order.total_amount * 100).to_i,
    #   currency: 'usd',
    #   payment_method: payment_method_id,
    #   confirm: true
    # )
    
    sleep(1) # Simulate API call delay
    
    # Simulate success (90% success rate for demo)
    if rand < 0.9
      {
        success: true,
        transaction_id: "txn_#{SecureRandom.hex(8)}"
      }
    else
      {
        success: false,
        error: "Payment declined"
      }
    end
  rescue => e
    Rails.logger.error "Payment processing error: #{e.message}"
    { success: false, error: e.message }
  end
end