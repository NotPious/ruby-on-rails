require 'sidekiq/web'

Rails.application.routes.draw do
  # Sidekiq monitoring dashboard (development only)
  mount Sidekiq::Web => '/sidekiq' if Rails.env.development?
  
  # GraphQL endpoint
  post "/graphql", to: "graphql#execute"
  
  # GraphiQL IDE (development only)
  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql"
  end
  
  # Health check endpoint
  get '/health', to: proc { [200, {}, ['OK']] }
end