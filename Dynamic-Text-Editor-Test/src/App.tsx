import AsComponent from "./components/use-case/AsComponent";
import AsHook from "./components/use-case/AsHook";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-7xl w-full mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Dynamic Text Editor Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-2xl p-8 transition-shadow hover:shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">As Component</h2>
            <AsComponent />
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-8 transition-shadow hover:shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">As Hook</h2>
            <AsHook />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
