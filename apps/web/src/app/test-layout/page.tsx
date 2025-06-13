export default function TestLayout() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gradient">Layout Test</h1>
      
      <div className="container mx-auto">
        <h2 className="text-2xl font-semibold mb-4">3 Column Grid Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass p-6 rounded-xl hover-lift">
              <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-4" />
              <h3 className="text-xl font-semibold mb-2">Card {i}</h3>
              <p className="text-muted-foreground">This is a test card to verify the grid layout is working properly.</p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-semibold mb-4">4 Column Grid Test</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-primary mb-2">{i}</div>
              <p>Column {i}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}