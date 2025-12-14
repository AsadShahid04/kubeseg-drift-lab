import { useState, useEffect } from "react";
import apiClient from "../api/client";

interface Scenario {
  id: string;
  title: string;
  description: string;
  lesson: string;
  steps: ScenarioStep[];
  focus: {
    type: "flow" | "policy" | "namespace";
    value: string;
  };
  estimatedTime: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface ScenarioStep {
  id: string;
  title: string;
  description: string;
  action: string;
  view: "gaps" | "drift" | "flows" | null;
  highlight?: {
    type: "flow" | "policy" | "namespace";
    identifier: string;
  };
  validation?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  codeExample?: string;
  expectedOutcome: string;
}

interface ScenarioData {
  riskyFlow?: any;
  unprotectedFlow?: any;
  policy?: any;
  namespaceSummary?: any;
}

const scenarios: Scenario[] = [
  {
    id: "risky-dev-prod-db",
    title: "Scenario 1: Risky dev→prod DB Flow",
    description:
      "A risky flow from dev namespace to production database detected. This represents a critical security gap that could allow lateral movement from non-production to production environments.",
    lesson:
      "Cross-environment database access should be strictly prohibited. Use NetworkPolicies to enforce least-privilege access and prevent lateral movement from non-production environments. This is a fundamental Zero Trust principle: never trust, always verify.",
    estimatedTime: "5-7 minutes",
    difficulty: "beginner",
    focus: {
      type: "flow",
      value: "dev/prod-db",
    },
    steps: [
      {
        id: "step1",
        title: "Identify the Risky Flow",
        description:
          "Navigate to the Gaps & Suggestions view to see risky flows. Look for flows that cross from dev to prod namespaces, especially those targeting databases.",
        action: "Go to Gaps & Suggestions tab and locate risky flows",
        view: "gaps",
        highlight: {
          type: "flow",
          identifier: "dev-to-prod-db",
        },
        expectedOutcome:
          "You should see a risky flow with a high risk score (80+) indicating cross-namespace access to a production database.",
        validation: {
          question: "What makes a flow 'risky' in this context?",
          options: [
            "Any flow between pods",
            "Cross-namespace traffic to production databases",
            "All database connections",
            "Only denied flows",
          ],
          correctAnswer: 1,
          explanation:
            "A flow is risky when it crosses namespace boundaries (especially dev→prod) and targets sensitive resources like databases. This violates Zero Trust principles.",
        },
      },
      {
        id: "step2",
        title: "Analyze the Risk Score",
        description:
          "Examine the risk score and AI-generated summary. Understand why this specific flow is dangerous and what factors contribute to its high risk.",
        action: "Review the risk score breakdown and AI summary",
        view: "gaps",
        expectedOutcome:
          "You should see a detailed risk score (80-100), risk level (CRITICAL/HIGH), and an AI-generated explanation of why this flow is dangerous.",
        validation: {
          question: "Which factor contributes MOST to a high risk score?",
          options: [
            "Port number",
            "Protocol type",
            "Cross-namespace + Production + Database access",
            "Pod name length",
          ],
          correctAnswer: 2,
          explanation:
            "The combination of cross-namespace traffic, production environment, and database access creates the highest risk. Each factor adds to the score, but together they indicate critical security risk.",
        },
      },
      {
        id: "step3",
        title: "Review Suggested Policy",
        description:
          "Examine the suggested NetworkPolicy that would block this risky flow. Understand how the policy uses pod selectors and ingress rules to restrict access.",
        action: "Click 'View Policy' on the suggested policy for this flow",
        view: "gaps",
        highlight: {
          type: "policy",
          identifier: "protect-prod-db",
        },
        codeExample: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: protect-prod-db
  namespace: prod
spec:
  podSelector:
    matchLabels:
      role: db
      env: prod
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
          env: prod
    ports:
    - protocol: TCP
      port: 5432`,
        expectedOutcome:
          "You should see a NetworkPolicy YAML that restricts database access to only authorized sources (e.g., prod API gateway), blocking dev namespace access.",
      },
      {
        id: "step4",
        title: "Understand the Impact",
        description:
          "Review the PR snippet to see how this policy would be implemented. Understand the commit message and Git diff format.",
        action: "Click 'Show PR' to see the Git-style patch",
        view: "gaps",
        expectedOutcome:
          "You should see a Git diff showing the new NetworkPolicy file and a commit message explaining the security fix.",
        validation: {
          question:
            "What is the primary purpose of the suggested NetworkPolicy?",
          options: [
            "Allow all database access",
            "Block all database access",
            "Restrict database access to authorized sources only",
            "Log all database connections",
          ],
          correctAnswer: 2,
          explanation:
            "The policy uses least-privilege principle: it blocks everything by default and only allows specific, authorized sources (like prod API gateway) to access the database.",
        },
      },
      {
        id: "step5",
        title: "Verify the Fix",
        description:
          "After implementing this policy, the risky flow would be blocked. The policy enforces that only pods matching specific labels (e.g., app=api-gateway, env=prod) can access the database.",
        action:
          "Review the lesson learned and understand the security principle",
        view: null,
        expectedOutcome:
          "You understand that NetworkPolicies enforce Zero Trust by default-deny and explicit-allow patterns, preventing unauthorized cross-environment access.",
      },
    ],
  },
  {
    id: "over-permissive-policy",
    title: "Scenario 2: Over-Permissive Policy",
    description:
      "A NetworkPolicy allows more traffic than the intent specifies, creating a security drift. This violates the principle of least privilege.",
    lesson:
      "Regularly audit NetworkPolicies against intent rules. Over-permissive policies increase attack surface and violate zero-trust principles. Use drift detection to identify and remediate policies that allow more than necessary.",
    estimatedTime: "6-8 minutes",
    difficulty: "intermediate",
    focus: {
      type: "policy",
      value: "prod-api-policy",
    },
    steps: [
      {
        id: "step1",
        title: "Navigate to Policy Drift View",
        description:
          "Go to the Policy Drift tab to see policies that don't match their intended security posture.",
        action: "Navigate to Policy Drift tab",
        view: "drift",
        expectedOutcome:
          "You should see a list of over-permissive policies that allow more traffic than intended.",
      },
      {
        id: "step2",
        title: "Identify Over-Permissive Policy",
        description:
          "Look for policies marked as 'over-permissive'. These policies have ingress rules that allow traffic not covered by any intent rule.",
        action: "Find and click on an over-permissive policy",
        view: "drift",
        highlight: {
          type: "policy",
          identifier: "over-permissive-policy",
        },
        expectedOutcome:
          "You should see a policy that allows traffic from sources not defined in any intent rule, indicating it's more permissive than necessary.",
        validation: {
          question: "What does 'over-permissive' mean in this context?",
          options: [
            "The policy is too restrictive",
            "The policy allows more traffic than the intent specifies",
            "The policy doesn't exist",
            "The policy is correctly configured",
          ],
          correctAnswer: 1,
          explanation:
            "An over-permissive policy allows traffic that isn't covered by any intent rule, meaning it grants more access than the security team intended. This increases attack surface.",
        },
      },
      {
        id: "step3",
        title: "Compare Intent vs Policy",
        description:
          "Understand the difference between what the intent rule specifies and what the actual policy allows. See the gap between desired and actual state.",
        action: "Review the intent rules and compare with the policy",
        view: "drift",
        expectedOutcome:
          "You should see that the policy allows traffic from sources not mentioned in any intent rule, creating a security drift.",
        codeExample: `# Intent Rule
src_selector: {app: api-gateway, env: prod}
dst_selector: {app: user-service, env: prod}
allowed_ports: [{port: 8080, protocol: TCP}]

# Actual Policy (Over-Permissive)
ingress:
- from:
  - podSelector: {}  # Empty = allows from ALL pods!
  ports:
  - protocol: TCP
    port: 8080`,
      },
      {
        id: "step4",
        title: "Understand the Risk",
        description:
          "An over-permissive policy with an empty podSelector (wildcard) allows traffic from ANY pod, not just the intended sources. This is a critical security issue.",
        action: "Review the suggested action for remediation",
        view: "drift",
        expectedOutcome:
          "You should understand that the policy needs to be restricted to only allow traffic from pods matching the intent rule's source selector.",
        validation: {
          question:
            "What is the security risk of an empty podSelector in an ingress rule?",
          options: [
            "No risk, it's the same as no policy",
            "It allows traffic from ALL pods, violating least privilege",
            "It blocks all traffic",
            "It only affects egress",
          ],
          correctAnswer: 1,
          explanation:
            "An empty podSelector {} is a wildcard that matches all pods. This means the policy allows traffic from any pod in any namespace, which violates Zero Trust and least-privilege principles.",
        },
      },
      {
        id: "step5",
        title: "Review Remediation",
        description:
          "The suggested fix would restrict the policy to only allow traffic from pods matching the intent rule. This aligns the policy with the intended security posture.",
        action: "Understand how to fix the over-permissive policy",
        view: "drift",
        codeExample: `# Fixed Policy (Aligned with Intent)
ingress:
- from:
  - podSelector:
      matchLabels:
        app: api-gateway
        env: prod
  ports:
  - protocol: TCP
    port: 8080`,
        expectedOutcome:
          "You understand that policies should be restricted to match intent rules exactly, using specific pod selectors rather than wildcards.",
      },
    ],
  },
  {
    id: "unprotected-namespace",
    title: "Scenario 3: Unprotected Namespace",
    description:
      "A namespace has multiple unprotected flows, leaving it vulnerable to lateral movement. These flows are allowed by default Kubernetes behavior but not protected by any NetworkPolicy.",
    lesson:
      "Every namespace should have NetworkPolicies defining allowed ingress/egress. Unprotected flows represent blind spots that attackers can exploit. Use gap analysis to identify and protect these flows with least-privilege policies.",
    estimatedTime: "7-10 minutes",
    difficulty: "intermediate",
    focus: {
      type: "namespace",
      value: "staging",
    },
    steps: [
      {
        id: "step1",
        title: "View Unprotected Flows",
        description:
          "Navigate to Gaps & Suggestions and examine the 'Unprotected Flows' section. These are flows that are currently allowed but have no NetworkPolicy protecting them.",
        action: "Go to Gaps & Suggestions and scroll to Unprotected Flows",
        view: "gaps",
        highlight: {
          type: "namespace",
          identifier: "staging",
        },
        expectedOutcome:
          "You should see a list of flows that are allowed but not protected by any NetworkPolicy, indicating security gaps.",
        validation: {
          question: "What does 'unprotected flow' mean?",
          options: [
            "A flow that is blocked",
            "A flow that is allowed but has no NetworkPolicy protecting it",
            "A flow that only works in dev",
            "A flow that uses UDP protocol",
          ],
          correctAnswer: 1,
          explanation:
            "An unprotected flow is one that Kubernetes allows by default (if no NetworkPolicy denies it), but there's no explicit NetworkPolicy protecting it. This creates a security blind spot.",
        },
      },
      {
        id: "step2",
        title: "Identify Namespace Patterns",
        description:
          "Group unprotected flows by namespace. Notice which namespaces have the most unprotected flows - these are the most vulnerable.",
        action: "Count unprotected flows per namespace",
        view: "gaps",
        expectedOutcome:
          "You should identify that certain namespaces (like staging) have multiple unprotected flows, indicating they need comprehensive NetworkPolicy coverage.",
      },
      {
        id: "step3",
        title: "Review Suggested Policies",
        description:
          "For each unprotected flow, there's a suggested NetworkPolicy. Review these suggestions to understand how to protect the namespace.",
        action:
          "Click 'View Policy' on suggested policies for unprotected flows",
        view: "gaps",
        expectedOutcome:
          "You should see NetworkPolicy suggestions that would protect the unprotected flows using least-privilege principles.",
        codeExample: `# Suggested Policy for Unprotected Flows
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: protect-staging-pods
  namespace: staging
spec:
  podSelector:
    matchLabels:
      env: staging
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 8080`,
      },
      {
        id: "step4",
        title: "Understand Default Behavior",
        description:
          "In Kubernetes, if no NetworkPolicy exists, all traffic is allowed by default. This is why unprotected flows are dangerous - they represent implicit allow rules.",
        action: "Review the lesson about default Kubernetes behavior",
        view: null,
        expectedOutcome:
          "You understand that Kubernetes allows all traffic by default, and NetworkPolicies are needed to restrict access. Unprotected flows exist because no policy explicitly controls them.",
        validation: {
          question: "What is Kubernetes' default network policy behavior?",
          options: [
            "Deny all traffic",
            "Allow all traffic (if no NetworkPolicy exists)",
            "Require explicit policies for all pods",
            "Block cross-namespace traffic automatically",
          ],
          correctAnswer: 1,
          explanation:
            "Kubernetes allows all pod-to-pod traffic by default. NetworkPolicies are opt-in restrictions. If no policy exists for a pod, all traffic to/from that pod is allowed. This is why unprotected flows are a security concern.",
        },
      },
      {
        id: "step5",
        title: "Plan Comprehensive Protection",
        description:
          "To fully protect a namespace, you need NetworkPolicies that cover all legitimate traffic patterns while blocking everything else. This requires understanding the application architecture.",
        action: "Review how to create comprehensive namespace protection",
        view: "gaps",
        expectedOutcome:
          "You understand that protecting a namespace requires identifying all legitimate communication patterns and creating policies that allow only those patterns, following the principle of least privilege.",
      },
    ],
  },
];

export default function GuidedScenarios({
  onNavigate,
}: {
  onNavigate?: (tab: string) => void;
}) {
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(
    new Set()
  );
  const [scenarioData, setScenarioData] = useState<ScenarioData>({});
  const [validationAnswers, setValidationAnswers] = useState<
    Map<string, number>
  >(new Map());
  const [showCodeExample, setShowCodeExample] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentScenario && currentStepIndex >= 0) {
      loadScenarioData();
    }
  }, [currentScenario, currentStepIndex]);

  const loadScenarioData = async () => {
    if (!currentScenario) return;

    setLoading(true);
    try {
      // Load relevant data based on scenario
      if (currentScenario.id === "risky-dev-prod-db") {
        const gapsResponse = await apiClient.get("/api/gaps");
        const riskyFlows = gapsResponse.data.risky_flows || [];
        // Find a dev→prod DB flow
        const riskyFlow = riskyFlows.find(
          (f: any) =>
            f.flow.src_ns === "dev" &&
            (f.flow.dst_labels.role === "db" ||
              f.flow.dst_labels.app?.includes("db"))
        );
        if (riskyFlow) {
          setScenarioData({ riskyFlow });
        }
      } else if (currentScenario.id === "over-permissive-policy") {
        const driftResponse = await apiClient.get("/api/drift");
        const overPermissive = driftResponse.data.over_permissive || [];
        if (overPermissive.length > 0) {
          setScenarioData({ policy: overPermissive[0] });
        }
      } else if (currentScenario.id === "unprotected-namespace") {
        const gapsResponse = await apiClient.get("/api/gaps");
        const unprotected = gapsResponse.data.unprotected_flows || [];
        const stagingFlows = unprotected.filter(
          (f: any) => f.flow.dst_ns === "staging" || f.flow.src_ns === "staging"
        );
        if (stagingFlows.length > 0) {
          setScenarioData({ unprotectedFlow: stagingFlows[0] });
        }
      }
    } catch (err) {
      console.error("Failed to load scenario data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScenario = (scenario: Scenario) => {
    setCurrentScenario(scenario);
    setCurrentStepIndex(0);
    setValidationAnswers(new Map());
    setShowCodeExample(false);
  };

  const handleNextStep = () => {
    if (
      currentScenario &&
      currentStepIndex < currentScenario.steps.length - 1
    ) {
      setCurrentStepIndex(currentStepIndex + 1);
      setShowCodeExample(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setShowCodeExample(false);
    }
  };

  const handleCompleteScenario = () => {
    if (currentScenario) {
      setCompletedScenarios(
        new Set([...completedScenarios, currentScenario.id])
      );
      setCurrentScenario(null);
      setCurrentStepIndex(0);
      setValidationAnswers(new Map());
    }
  };

  const handleValidationAnswer = (stepId: string, answerIndex: number) => {
    setValidationAnswers(new Map(validationAnswers.set(stepId, answerIndex)));
  };

  const currentStep = currentScenario?.steps[currentStepIndex] || null;
  const isLastStep =
    currentScenario && currentStepIndex === currentScenario.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Guided Scenarios
        </h2>
        <p className="text-sm text-gray-600">
          Interactive, step-by-step tutorials to learn Kubernetes network
          security and Zero Trust segmentation. Each scenario includes real
          data, validation questions, and hands-on exercises.
        </p>
      </div>

      {!currentScenario ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all hover:shadow-md ${
                completedScenarios.has(scenario.id)
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {scenario.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded border ${getDifficultyColor(
                        scenario.difficulty
                      )}`}
                    >
                      {scenario.difficulty.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {scenario.estimatedTime}
                    </span>
                  </div>
                </div>
                {completedScenarios.has(scenario.id) && (
                  <span className="text-green-600 text-sm font-semibold">
                    ✓ Completed
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4 min-h-[60px]">
                {scenario.description}
              </p>
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Steps:</div>
                <div className="flex gap-1">
                  {scenario.steps.map((_, idx) => (
                    <div
                      key={idx}
                      className="w-2 h-2 rounded-full bg-blue-200"
                    ></div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleStartScenario(scenario)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition"
              >
                Start Scenario
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Progress Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {currentScenario.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {currentScenario.description}
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentScenario(null);
                  setCurrentStepIndex(0);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>
                  Step {currentStepIndex + 1} of {currentScenario.steps.length}
                </span>
                <span>
                  {Math.round(
                    ((currentStepIndex + 1) / currentScenario.steps.length) *
                      100
                  )}
                  % Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((currentStepIndex + 1) / currentScenario.steps.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex gap-2 mt-4">
              {currentScenario.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex-1 h-1 rounded ${
                    idx <= currentStepIndex ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          {currentStep && (
            <div className="space-y-6">
              {/* Step Title and Description */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {currentStep.title}
                </h4>
                <p className="text-sm text-gray-700">
                  {currentStep.description}
                </p>
              </div>

              {/* Action Card */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {currentStepIndex + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      Your Action:
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {currentStep.action}
                    </p>
                    {currentStep.view && (
                      <button
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate(currentStep.view!);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        Go to{" "}
                        {currentStep.view === "gaps"
                          ? "Gaps & Suggestions"
                          : currentStep.view === "drift"
                          ? "Policy Drift"
                          : "Flow Visualization"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Real Data Display */}
              {loading ? (
                <div className="text-center py-4 text-gray-600">
                  Loading scenario data...
                </div>
              ) : (
                <>
                  {scenarioData.riskyFlow &&
                    currentStep.id.startsWith("step1") && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                        <div className="text-sm font-semibold text-red-900 mb-2">
                          Example Risky Flow Found:
                        </div>
                        <div className="text-xs text-gray-700 space-y-1">
                          <div>
                            <strong>Source:</strong>{" "}
                            {scenarioData.riskyFlow.flow.src_ns}/
                            {scenarioData.riskyFlow.flow.src_pod}
                          </div>
                          <div>
                            <strong>Destination:</strong>{" "}
                            {scenarioData.riskyFlow.flow.dst_ns}/
                            {scenarioData.riskyFlow.flow.dst_pod}
                          </div>
                          <div>
                            <strong>Risk Score:</strong>{" "}
                            {scenarioData.riskyFlow.risk_score}/100
                          </div>
                          <div>
                            <strong>Risk Level:</strong>{" "}
                            {scenarioData.riskyFlow.risk_level?.toUpperCase() ||
                              "HIGH"}
                          </div>
                          {scenarioData.riskyFlow.summary && (
                            <div className="mt-2 pt-2 border-t border-red-200">
                              <strong>Summary:</strong>{" "}
                              {scenarioData.riskyFlow.summary}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {scenarioData.unprotectedFlow &&
                    currentStep.id.startsWith("step1") && (
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                        <div className="text-sm font-semibold text-yellow-900 mb-2">
                          Example Unprotected Flow Found:
                        </div>
                        <div className="text-xs text-gray-700 space-y-1">
                          <div>
                            <strong>Source:</strong>{" "}
                            {scenarioData.unprotectedFlow.flow.src_ns}/
                            {scenarioData.unprotectedFlow.flow.src_pod}
                          </div>
                          <div>
                            <strong>Destination:</strong>{" "}
                            {scenarioData.unprotectedFlow.flow.dst_ns}/
                            {scenarioData.unprotectedFlow.flow.dst_pod}
                          </div>
                          <div>
                            <strong>Port:</strong>{" "}
                            {scenarioData.unprotectedFlow.flow.port}/
                            {scenarioData.unprotectedFlow.flow.protocol}
                          </div>
                          <div className="mt-2 pt-2 border-t border-yellow-200">
                            <strong>Reason:</strong>{" "}
                            {scenarioData.unprotectedFlow.reason}
                          </div>
                        </div>
                      </div>
                    )}

                  {scenarioData.policy &&
                    currentStep.id.startsWith("step2") && (
                      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                        <div className="text-sm font-semibold text-orange-900 mb-2">
                          Over-Permissive Policy Found:
                        </div>
                        <div className="text-xs text-gray-700 space-y-1">
                          <div>
                            <strong>Policy:</strong>{" "}
                            {scenarioData.policy.policy_name}
                          </div>
                          <div>
                            <strong>Namespace:</strong>{" "}
                            {scenarioData.policy.namespace}
                          </div>
                          <div className="mt-2 pt-2 border-t border-orange-200">
                            <strong>Issue:</strong>{" "}
                            {scenarioData.policy.description}
                          </div>
                          <div className="mt-2">
                            <strong>Suggested Action:</strong>{" "}
                            {scenarioData.policy.suggested_action}
                          </div>
                        </div>
                      </div>
                    )}
                </>
              )}

              {/* Code Example */}
              {currentStep.codeExample && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-semibold text-gray-300">
                      Code Example
                    </div>
                    <button
                      onClick={() => setShowCodeExample(!showCodeExample)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {showCodeExample ? "Hide" : "Show"} Code
                    </button>
                  </div>
                  {showCodeExample && (
                    <pre className="text-green-400 text-xs overflow-x-auto font-mono">
                      {currentStep.codeExample}
                    </pre>
                  )}
                </div>
              )}

              {/* Validation Question */}
              {currentStep.validation &&
                (() => {
                  const selectedAnswer = validationAnswers.get(currentStep.id);
                  const showResult = selectedAnswer !== undefined;

                  return (
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                      <div className="text-sm font-semibold text-purple-900 mb-3">
                        Check Your Understanding:
                      </div>
                      <div className="text-sm text-gray-900 mb-3">
                        {currentStep.validation.question}
                      </div>
                      <div className="space-y-2">
                        {currentStep.validation.options.map((option, idx) => {
                          const isCorrect =
                            idx === currentStep.validation!.correctAnswer;
                          const isSelected = selectedAnswer === idx;

                          return (
                            <button
                              key={idx}
                              onClick={() =>
                                handleValidationAnswer(currentStep.id, idx)
                              }
                              disabled={showResult}
                              className={`w-full text-left p-3 rounded border-2 transition ${
                                showResult
                                  ? isCorrect
                                    ? "bg-green-100 border-green-500"
                                    : isSelected
                                    ? "bg-red-100 border-red-500"
                                    : "bg-gray-50 border-gray-300"
                                  : isSelected
                                  ? "bg-blue-100 border-blue-500"
                                  : "bg-white border-gray-300 hover:border-blue-400"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-900">
                                  {String.fromCharCode(65 + idx)}. {option}
                                </span>
                                {showResult && isCorrect && (
                                  <span className="text-green-600 font-bold">
                                    ✓
                                  </span>
                                )}
                                {showResult && isSelected && !isCorrect && (
                                  <span className="text-red-600 font-bold">
                                    ✗
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {showResult && (
                        <div
                          className={`mt-3 p-3 rounded ${
                            selectedAnswer ===
                            currentStep.validation!.correctAnswer
                              ? "bg-green-100 border border-green-300"
                              : "bg-red-100 border border-red-300"
                          }`}
                        >
                          <div className="text-xs font-semibold mb-1">
                            {selectedAnswer ===
                            currentStep.validation!.correctAnswer
                              ? "Correct!"
                              : "Not quite right"}
                          </div>
                          <div className="text-xs text-gray-700">
                            {currentStep.validation!.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Expected Outcome */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
                <div className="text-sm font-semibold text-green-900 mb-2">
                  Expected Outcome:
                </div>
                <p className="text-sm text-gray-700">
                  {currentStep.expectedOutcome}
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={handlePreviousStep}
                  disabled={isFirstStep}
                  className={`px-4 py-2 rounded-md font-medium ${
                    isFirstStep
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  ← Previous
                </button>

                <div className="flex gap-2">
                  {isLastStep ? (
                    <button
                      onClick={handleCompleteScenario}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                    >
                      Complete Scenario
                    </button>
                  ) : (
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                    >
                      Next Step →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lesson Learned (shown at the end) */}
          {isLastStep && currentStep && (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 rounded-r">
              <div className="text-sm font-semibold text-blue-900 mb-2">
                Key Lesson Learned:
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                {currentScenario.lesson}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
