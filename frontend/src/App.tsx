import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import GapsView from "./components/GapsView";
import DriftView from "./components/DriftView";
import FlowVisualization from "./components/FlowVisualization";
import GuidedScenarios from "./components/GuidedScenarios";
import WelcomeView from "./components/WelcomeView";
import CaseStudies from "./components/CaseStudies";

function App() {
  const [activeTab, setActiveTab] = useState<
    "welcome" | "gaps" | "drift" | "flows" | "scenarios" | "case-studies"
  >("welcome");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">kubeseg-gaps</h1>
          <p className="text-sm text-gray-600 mt-1">
            Kubernetes segmentation gap analysis and drift detection
          </p>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("welcome")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "welcome"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Introduction
            </button>
            <button
              onClick={() => setActiveTab("gaps")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "gaps"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Gaps & Suggestions
            </button>
            <button
              onClick={() => setActiveTab("drift")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "drift"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Policy Drift
            </button>
            <button
              onClick={() => setActiveTab("flows")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "flows"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Flow Visualization
            </button>
            <button
              onClick={() => setActiveTab("scenarios")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "scenarios"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Guided Scenarios
            </button>
            <button
              onClick={() => setActiveTab("case-studies")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "case-studies"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Case Studies
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          {activeTab === "welcome" ? (
            <WelcomeView
              onNavigate={(tab) => setActiveTab(tab as typeof activeTab)}
            />
          ) : activeTab === "gaps" ? (
            <GapsView />
          ) : activeTab === "drift" ? (
            <DriftView />
          ) : activeTab === "scenarios" ? (
            <GuidedScenarios
              onNavigate={(tab) => setActiveTab(tab as typeof activeTab)}
            />
          ) : activeTab === "case-studies" ? (
            <CaseStudies />
          ) : (
            <FlowVisualization />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
