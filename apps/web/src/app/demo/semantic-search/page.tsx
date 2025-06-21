import { Metadata } from 'next';
import { Suspense } from 'react';
import { SemanticPropertySearch } from '@/components/SemanticPropertySearch';
import { Sparkles, Brain, Zap, Target, Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Búsqueda Semántica con IA | Propiedades MX',
  description: 'Encuentra propiedades usando lenguaje natural y búsqueda semántica potenciada por IA',
};

export default function SemanticSearchDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <Brain className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Búsqueda Semántica con IA
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Encuentra tu propiedad ideal usando lenguaje natural. Nuestra IA entiende 
              exactamente lo que buscas y te muestra los mejores resultados.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-6 h-6 text-blue-500" />
                <h3 className="font-semibold">Lenguaje Natural</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Busca como hablas: "casa con jardín cerca de escuelas"
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-blue-500" />
                <h3 className="font-semibold">Re-ranking con IA</h3>
              </div>
              <p className="text-gray-600 text-sm">
                GPT-4 analiza y ordena los resultados por relevancia
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-6 h-6 text-blue-500" />
                <h3 className="font-semibold">Búsqueda Vectorial</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Encuentra propiedades similares usando embeddings
              </p>
            </div>
          </div>

          {/* Example Queries */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold mb-4">Ejemplos de búsquedas:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ExampleQuery text="Casa moderna con alberca en zona residencial" />
              <ExampleQuery text="Departamento pet-friendly cerca del metro" />
              <ExampleQuery text="Casa en zona tranquila con 3 recámaras" />
              <ExampleQuery text="Oficina con estacionamiento en Polanco" />
              <ExampleQuery text="Loft minimalista con buena iluminación" />
              <ExampleQuery text="Casa familiar cerca de escuelas privadas" />
            </div>
          </div>

          {/* Search Component */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <Suspense fallback={
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            }>
              <SemanticPropertySearch 
                showResults={true}
                className="max-w-none"
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExampleQuery({ text }: { text: string }) {
  return (
    <button
      onClick={() => {
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) {
          input.value = text;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }}
      className="text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
    >
      "{text}"
    </button>
  );
}