import { useState, useEffect } from "react";

interface WelcomeViewProps {
  onNavigate?: (tab: string) => void;
}

export default function WelcomeView({ onNavigate }: WelcomeViewProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Show welcome message on every page load
    setShowWelcomeModal(true);
  }, []);

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <>
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to kubeseg-drift-lab
              </h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
            </div>

            <div className="space-y-4 text-gray-700 mb-6">
              <p className="text-lg leading-relaxed">
                Hello! I'm{" "}
                <a
                  href="http://linkedin.com/in/asadshahid04"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  Asad Shahid
                </a>
                , and I'm excited to share this application with you.
              </p>
              <p className="leading-relaxed">
                I'm learning more about{" "}
                <strong className="text-gray-900">Illumio CloudSecure</strong>{" "}
                and creating applications that mimic CloudSecure's capabilities.
                This project,{" "}
                <strong className="text-gray-900">kubeseg-drift-lab</strong>,
                helps me understand:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-left">
                <li>How network policies work in Kubernetes environments</li>
                <li>Zero Trust segmentation principles and implementation</li>
                <li>
                  Integration patterns with Calico for network policy
                  enforcement
                </li>
                <li>Security gap analysis and policy drift detection</li>
              </ul>
              <p className="leading-relaxed">
                This application integrates with{" "}
                <strong className="text-gray-900">Calico</strong> to provide
                real-time network security insights, serving as a foundation for
                understanding how enterprise security platforms like Illumio
                CloudSecure operate.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleWelcomeClose}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                Okay, thank you
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to kubeseg-drift-lab
          </h1>
          <p className="text-lg text-gray-600">
            A Zero Trust segmentation analysis platform for Kubernetes network
            security
          </p>
          <div className="flex items-center text-sm text-gray-500 space-x-4 mt-4">
            <span>
              Author:{" "}
              <a
                href="http://linkedin.com/in/asadshahid04"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Asad Shahid
              </a>
            </span>
            <span>•</span>
            <span>Kubernetes, Network Security, Zero Trust, Calico</span>
          </div>
        </div>

        {/* Application Overview */}
        <section className="mb-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-8 rounded-r-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            About This Application
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4 text-lg">
            <strong>kubeseg-drift-lab</strong> is a comprehensive Zero Trust
            segmentation analysis platform designed to help security teams
            understand, analyze, and improve network security policies in
            Kubernetes environments. The application provides real-time insights
            into network traffic patterns, policy gaps, and security risks.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg">
            Currently operating on mock data, the platform demonstrates core
            security concepts including gap analysis, policy drift detection,
            attack path visualization, and automated policy recommendations. The
            architecture is designed to integrate with <strong>Calico</strong>{" "}
            for production-grade network policy enforcement and observability.
          </p>
        </section>

        {/* Key Features */}
        <section className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Gap Analysis & Suggestions
              </h3>
              <p className="text-sm text-gray-700">
                Identify unprotected network flows and receive automated
                NetworkPolicy suggestions with comprehensive risk scoring and
                AI-generated summaries.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Policy Drift Detection
              </h3>
              <p className="text-sm text-gray-700">
                Compare intended security policies with actual NetworkPolicy
                implementations, detecting missing policies and over-permissive
                configurations.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Flow Visualization
              </h3>
              <p className="text-sm text-gray-700">
                Interactive network graph showing pod-to-pod communications with
                fullscreen capability, risk-based coloring, and detailed flow
                analysis.
              </p>
            </div>
          </div>
        </section>

        {/* Calico Integration Section */}
        <section className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            Calico Integration: Enabling Real-Time Network Security Analysis
          </h2>

          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Why Calico Integration Matters
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To transition from prototype to production-grade solution,
              integration with <strong>Calico</strong>—a leading Kubernetes
              Container Network Interface (CNI) platform—is essential. This
              integration enables real-time analysis of network policies and
              traffic flows, providing actionable security insights for
              enterprise Kubernetes environments.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This Calico integration serves as the foundational architecture
              for future integration with Illumio CloudSecure, validating the
              technical approach and demonstrating real-world applicability
              before enterprise-scale deployment.
            </p>
          </div>

          {/* In-Depth Calico Education */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Understanding Calico: Technical Deep Dive
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Calico is an open-source networking and network security solution
              designed specifically for Kubernetes, cloud-native applications,
              and containerized workloads. Developed by Tigera, Calico provides
              both networking (CNI) and network policy enforcement capabilities,
              making it one of the most widely adopted solutions in enterprise
              Kubernetes deployments.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              Core Components
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-2">Calico CNI</h5>
                <p className="text-sm text-gray-700">
                  Provides Layer 3/4 networking using BGP (Border Gateway
                  Protocol) for routing, eliminating the need for overlay
                  networks and reducing latency.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Network Policy Engine
                </h5>
                <p className="text-sm text-gray-700">
                  Enforces Kubernetes NetworkPolicy resources at the Linux
                  kernel level using iptables or eBPF, providing
                  high-performance policy enforcement.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Flow Logs (Enterprise)
                </h5>
                <p className="text-sm text-gray-700">
                  Captures and analyzes network traffic flows between pods,
                  providing visibility into allowed and denied connections for
                  security analysis.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Global Network Policies
                </h5>
                <p className="text-sm text-gray-700">
                  Extends Kubernetes NetworkPolicy with cluster-wide policies,
                  namespace selectors, and advanced policy features for
                  enterprise requirements.
                </p>
              </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              How Calico Enforces Network Policies
            </h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              Calico implements Kubernetes NetworkPolicy resources by
              translating them into Linux kernel-level rules. When a
              NetworkPolicy is created in Kubernetes, Calico's policy
              controller:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4 ml-4">
              <li>
                Intercepts the NetworkPolicy resource through the Kubernetes API
              </li>
              <li>Validates the policy syntax and selectors</li>
              <li>
                Converts the policy into iptables rules (or eBPF programs in
                newer versions)
              </li>
              <li>
                Distributes these rules to all relevant nodes in the cluster
              </li>
              <li>
                Enforces the rules at the kernel level, providing
                high-performance filtering
              </li>
              <li>
                Logs policy decisions for audit and analysis (in Enterprise
                versions)
              </li>
            </ol>

            <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              Calico Flow Logs Architecture
            </h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              Calico Enterprise and Calico Cloud provide flow log capabilities
              that capture network traffic metadata. Flow logs include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
              <li>
                Source and destination pod information (namespace, pod name,
                labels)
              </li>
              <li>Network protocol and port information</li>
              <li>
                Policy decision (allow/deny) and which policy rule applied
              </li>
              <li>Timestamp and duration of the connection</li>
              <li>Bytes transferred and packet counts</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              This flow data is essential for kubeseg-drift-lab to perform
              real-time gap analysis, attack path visualization, and policy
              drift detection.
            </p>
          </div>
        </section>

        {/* How Kubernetes CNI Works */}
        <section className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            How Kubernetes CNI Works
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Input Side */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Input: Pod Creation
                </h3>
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3 border border-blue-200">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        1. Pod Scheduled
                      </div>
                      <div className="text-xs text-gray-600">
                        Kubernetes scheduler assigns pod to node
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="text-2xl text-blue-600">↓</div>
                    </div>
                    <div className="bg-white rounded p-3 border border-blue-200">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        2. CNI Plugin Invoked
                      </div>
                      <div className="text-xs text-gray-600">
                        kubelet calls CNI plugin (Calico)
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="text-2xl text-blue-600">↓</div>
                    </div>
                    <div className="bg-white rounded p-3 border border-blue-200">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        3. Network Configuration
                      </div>
                      <div className="text-xs text-gray-600">
                        IP address assigned, routes configured
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Output Side */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Output: Network Ready
                </h3>
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3 border border-green-200">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        1. Network Interface Created
                      </div>
                      <div className="text-xs text-gray-600">
                        veth pair or network interface configured
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="text-2xl text-green-600">↓</div>
                    </div>
                    <div className="bg-white rounded p-3 border border-green-200">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        2. Routing Established
                      </div>
                      <div className="text-xs text-gray-600">
                        BGP routes or overlay network configured
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="text-2xl text-green-600">↓</div>
                    </div>
                    <div className="bg-white rounded p-3 border border-green-200">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        3. Pod Can Communicate
                      </div>
                      <div className="text-xs text-gray-600">
                        Pod has network connectivity
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Calico Policy Enforcement Works */}
        <section className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            How Calico Policy Enforcement Works
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    NetworkPolicy Created
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Administrator creates Kubernetes NetworkPolicy resource via
                    kubectl or API
                  </p>
                  <div className="bg-white rounded p-3 border border-blue-200 font-mono text-xs">
                    <div>apiVersion: networking.k8s.io/v1</div>
                    <div>kind: NetworkPolicy</div>
                    <div>spec:</div>
                    <div className="ml-4">
                      podSelector: matchLabels: app: api
                    </div>
                    <div className="ml-4">
                      ingress: - from: podSelector: ...
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gray-400"></div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1 bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Calico Controller Intercepts
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Calico's policy controller watches Kubernetes API and
                    detects new NetworkPolicy
                  </p>
                  <div className="bg-white rounded p-3 border border-green-200">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• Validates policy syntax</div>
                      <div>• Checks selector compatibility</div>
                      <div>• Determines affected pods</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gray-400"></div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1 bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Policy Translation
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Calico converts NetworkPolicy into Linux kernel rules
                    (iptables or eBPF)
                  </p>
                  <div className="bg-white rounded p-3 border border-purple-200 font-mono text-xs">
                    <div>
                      iptables -A cali-fo-INPUT -p tcp --dport 8080 -j ACCEPT
                    </div>
                    <div>iptables -A cali-fo-INPUT -s 10.0.1.0/24 -j DROP</div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gray-400"></div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div className="flex-1 bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Rule Distribution
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Rules distributed to all relevant nodes in the cluster
                  </p>
                  <div className="bg-white rounded p-3 border border-orange-200">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• Rules sent to node agents</div>
                      <div>• Applied to kernel on each node</div>
                      <div>• Synchronized across cluster</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gray-400"></div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  5
                </div>
                <div className="flex-1 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Kernel-Level Enforcement
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Linux kernel enforces rules for all network traffic to/from
                    pods
                  </p>
                  <div className="bg-white rounded p-3 border border-red-200">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• Traffic filtered at kernel level</div>
                      <div>• High-performance, low-latency</div>
                      <div>• Policy decisions logged (Enterprise)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Flow Diagram */}
        <section className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            Data Flow Architecture
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="space-y-6">
              {/* Flow Row 1: Policies */}
              <div className="flex items-center space-x-4">
                <div className="w-48 bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Kubernetes API
                  </div>
                  <div className="text-xs text-gray-600">
                    NetworkPolicy Resources
                  </div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-0.5 bg-blue-400"></div>
                  <div className="mx-2">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 h-0.5 bg-blue-400"></div>
                </div>
                <div className="w-48 bg-green-100 border-2 border-green-400 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Backend API Client
                  </div>
                  <div className="text-xs text-gray-600">Python K8s Client</div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-0.5 bg-green-400"></div>
                  <div className="mx-2">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 h-0.5 bg-green-400"></div>
                </div>
                <div className="w-48 bg-purple-100 border-2 border-purple-400 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Frontend
                  </div>
                  <div className="text-xs text-gray-600">
                    Policy Analysis View
                  </div>
                </div>
              </div>

              {/* Flow Row 2: Flow Logs */}
              <div className="flex items-center space-x-4">
                <div className="w-48 bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Calico Flow Logs
                  </div>
                  <div className="text-xs text-gray-600">Traffic Metadata</div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-0.5 bg-blue-400"></div>
                  <div className="mx-2">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 h-0.5 bg-blue-400"></div>
                </div>
                <div className="w-48 bg-green-100 border-2 border-green-400 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Backend API Client
                  </div>
                  <div className="text-xs text-gray-600">Calico API Client</div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-0.5 bg-green-400"></div>
                  <div className="mx-2">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 h-0.5 bg-green-400"></div>
                </div>
                <div className="w-48 bg-purple-100 border-2 border-purple-400 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Frontend
                  </div>
                  <div className="text-xs text-gray-600">
                    Flow Visualization
                  </div>
                </div>
              </div>

              {/* Flow Row 3: Analysis Results */}
              <div className="flex items-center space-x-4">
                <div className="w-48 bg-green-100 border-2 border-green-400 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Analysis Engine
                  </div>
                  <div className="text-xs text-gray-600">
                    Gap & Drift Detection
                  </div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-0.5 bg-green-400"></div>
                  <div className="mx-2">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 h-0.5 bg-green-400"></div>
                </div>
                <div className="w-48 bg-green-100 border-2 border-green-400 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    REST API
                  </div>
                  <div className="text-xs text-gray-600">
                    /api/gaps, /api/drift, /api/flows
                  </div>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-0.5 bg-purple-400"></div>
                  <div className="mx-2">
                    <svg
                      className="w-6 h-6 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 h-0.5 bg-purple-400"></div>
                </div>
                <div className="w-48 bg-purple-100 border-2 border-purple-400 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Frontend
                  </div>
                  <div className="text-xs text-gray-600">Dashboard Views</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Strategic Advantages */}
        <section className="mb-10">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            Strategic Advantages of Calico Integration
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Technical Advantages
                </h3>
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Standard Kubernetes API Compatibility
                  </h4>
                  <p className="text-sm text-gray-700">
                    Calico enforces standard Kubernetes NetworkPolicy resources,
                    ensuring compatibility with any tool or platform that works
                    with K8s NetworkPolicies.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    High-Performance Policy Enforcement
                  </h4>
                  <p className="text-sm text-gray-700">
                    Kernel-level enforcement (iptables/eBPF) provides
                    low-latency policy decisions without impacting application
                    performance.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Comprehensive Flow Visibility
                  </h4>
                  <p className="text-sm text-gray-700">
                    Calico Enterprise/Cloud flow logs provide detailed network
                    traffic metadata for accurate gap analysis and attack path
                    calculation.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Business Advantages
                </h3>
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Reduced Integration Risk
                  </h4>
                  <p className="text-sm text-gray-700">
                    Validating architecture with Calico first reduces technical
                    risk before connecting to Illumio CloudSecure.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Faster Time to Value
                  </h4>
                  <p className="text-sm text-gray-700">
                    Quick implementation using standard Kubernetes APIs allows
                    stakeholders to see working prototypes and validate business
                    value.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Vendor-Agnostic Foundation
                  </h4>
                  <p className="text-sm text-gray-700">
                    Architecture works with any CNI supporting Kubernetes
                    NetworkPolicies, providing flexibility while maintaining a
                    path to Illumio CloudSecure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Explore the Application
          </h2>
          <p className="mb-6 text-blue-100 text-lg">
            Navigate through the tabs above to explore gap analysis, policy
            drift detection, flow visualization, and real-world case studies.
          </p>
          <div className="flex justify-center space-x-4 flex-wrap gap-3">
            <button
              onClick={() => onNavigate && onNavigate("gaps")}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              View Gap Analysis
            </button>
            <button
              onClick={() => onNavigate && onNavigate("flows")}
              className="px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition shadow-lg"
            >
              Explore Flow Visualization
            </button>
            <button
              onClick={() => onNavigate && onNavigate("case-studies")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
            >
              View Case Studies
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>
            Document prepared by{" "}
            <a
              href="http://linkedin.com/in/asadshahid04"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Asad Shahid
            </a>{" "}
            | kubeseg-drift-lab
          </p>
        </div>
      </div>
    </>
  );
}
