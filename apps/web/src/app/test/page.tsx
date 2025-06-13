export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-red-500 mb-4">Basic Tailwind Test</h1>
      <div className="bg-blue-500 text-white p-4 rounded mb-4">
        This should be a blue box with white text
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-500 p-4 text-white">Column 1</div>
        <div className="bg-yellow-500 p-4 text-black">Column 2</div>
        <div className="bg-purple-500 p-4 text-white">Column 3</div>
      </div>
    </div>
  );
}