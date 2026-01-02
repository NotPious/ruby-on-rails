class OrderConfirmationEmailJob
  include Sidekiq::Job
  
  sidekiq_options queue: :low, retry: 3
  
  def perform(order_id)
    order = Order.includes(order_items: :product).find(order_id)
    
    Rails.logger.info "Sending order confirmation email for order #{order_id}"
    
    # Simulate email sending
    # In production, use ActionMailer:
    # OrderMailer.confirmation_email(order).deliver_now
    
    email_content = build_email_content(order)
    
    Rails.logger.info "Email sent to #{order.user_email}:"
    Rails.logger.info email_content
    
    # Simulate email service API call
    sleep(0.5)
    
  rescue => e
    Rails.logger.error "Email sending failed for order #{order_id}: #{e.message}"
    raise # Retry the job
  end
  
  private
  
  def build_email_content(order)
    items_list = order.order_items.map do |item|
      "- #{item.product.name} x#{item.quantity} - $#{(item.price * item.quantity).round(2)}"
    end.join("\n")
    
    <<~EMAIL
      ========================================
      Order Confirmation - Order ##{order.id}
      ========================================
      
      Dear Customer,
      
      Thank you for your order! Your GLP-1 lifestyle support products are being prepared.
      
      Order Details:
      #{items_list}
      
      Total: $#{order.total_amount.round(2)}
      Status: #{order.status.titleize}
      
      We'll send you another email when your order ships.
      
      Questions? Reply to this email or visit our support center.
      
      Best regards,
      GLP-1 Lifestyle Support Team
      ========================================
    EMAIL
  end
end