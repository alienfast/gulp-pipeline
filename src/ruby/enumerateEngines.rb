
# rails runner <script>

results = {}

engines = ::Rails::Engine.subclasses.map(&:instance)
engines.each do |engine|
  Dir.chdir(engine.root) do # Loader has no concept for base dir, must chdir so that it can find files
    results[engine.engine_name] = engine.root.to_s
  end
end

puts results.to_json
