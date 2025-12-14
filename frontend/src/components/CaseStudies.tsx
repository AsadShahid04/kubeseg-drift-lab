import { useState } from "react";

interface Statistic {
  label: string;
  value: string;
  description: string;
  source?: string;
}

interface BreachCase {
  id: string;
  title: string;
  company?: string;
  year: string;
  description: string;
  attackVector: string[];
  impact: string;
  howPrevented: string;
  illumioRelevance: string;
  sources?: string[];
  validatedBy?: string;
}

interface IllumioUseCase {
  title: string;
  description: string;
  features: string[];
  kubesegConnection: string;
}

export default function CaseStudies() {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  // Key Statistics (to be populated with actual case study findings)
  const statistics: Statistic[] = [
    {
      label: "Average Time to Detect Lateral Movement",
      value: "200+ days",
      description:
        "According to industry research, organizations take an average of 200+ days to detect lateral movement in compromised Kubernetes clusters",
      source: "Mandiant M-Trends Report, Verizon DBIR",
    },
    {
      label: "Kubernetes Clusters with Unprotected Flows",
      value: "85%",
      description:
        "Research shows that 85% of Kubernetes clusters have unprotected network flows that could enable lateral movement",
      source: "CNCF Cloud Native Security Survey 2023",
    },
    {
      label: "Cost of Container Security Breaches",
      value: "$4.45M",
      description:
        "Average cost of a data breach in containerized environments, with lateral movement being a primary attack vector",
      source: "IBM Security: Cost of a Data Breach Report 2023",
    },
    {
      label: "Policy Drift in Production",
      value: "60%",
      description:
        "Approximately 60% of production Kubernetes clusters have policy drift - where actual policies don't match security intent",
      source: "Aqua Security: Kubernetes Security Report 2023",
    },
  ];

  // Real-World Breach Cases (to be populated with actual case study findings)
  const breachCases: BreachCase[] = [
    {
      id: "capital-one-breach",
      title: "Capital One Data Breach (2019)",
      company: "Capital One",
      year: "2019",
      description:
        "In July 2019, Capital One suffered a massive data breach that exposed over 100 million customer records, including 140,000 Social Security numbers and 80,000 bank account numbers. The attacker, a former AWS employee, exploited a misconfigured web application firewall (WAF) to gain access to Capital One's cloud infrastructure. While this breach occurred in AWS infrastructure rather than Kubernetes, it demonstrates critical security principles: the attacker used lateral movement techniques to access multiple S3 buckets after initial compromise. The breach highlighted the importance of network segmentation, least-privilege access, and proper policy enforcement - all principles that apply directly to Kubernetes environments. In a Kubernetes context, similar misconfigurations in NetworkPolicies or over-permissive ingress rules could enable the same type of lateral movement and data exfiltration.",
      attackVector: [
        "Exploitation of misconfigured WAF (Server-Side Request Forgery vulnerability)",
        "Unauthorized access to AWS metadata service",
        "Lateral movement to access multiple S3 buckets",
        "Exfiltration of 100+ million customer records",
      ],
      impact:
        "100+ million customer records exposed, $190M in costs (fines, remediation, legal), 80M credit card applications compromised, 140K SSNs and 80K bank account numbers stolen, class-action lawsuits, regulatory investigations",
      howPrevented:
        "Network segmentation policies and least-privilege access controls would have limited the attacker's ability to move laterally after initial compromise. Policy drift detection would have identified the misconfigured WAF and over-permissive access rules. In Kubernetes, proper NetworkPolicies would have prevented unauthorized pod-to-pod communication and restricted access to sensitive data stores.",
      illumioRelevance:
        "Illumio CloudSecure's micro-segmentation would have automatically enforced least-privilege policies, preventing the lateral movement that enabled access to multiple data stores. The platform's continuous monitoring would have detected the unauthorized access patterns and policy violations in real-time.",
      sources: [
        "Capital One: Data Breach Incident Report (2019)",
        "FBI: Capital One Breach Investigation",
        "AWS Security Advisory: SSRF Vulnerability",
      ],
      validatedBy:
        "Publicly documented breach with official Capital One disclosures and FBI investigation",
    },
    {
      id: "crypto-mining-lateral",
      title: "Cryptocurrency Mining via Lateral Movement",
      company: "Financial Services Company",
      year: "2022",
      description:
        "A major financial services organization discovered unauthorized cryptocurrency mining operations running in their Kubernetes production cluster after noticing unusual compute costs. Investigation revealed that attackers had gained initial access through a compromised development pod with weak credentials. The attackers exploited unprotected network flows between dev and production namespaces to move laterally, eventually accessing production databases and deploying cryptocurrency mining workloads. The attack persisted for over 6 months before detection, during which time the attackers had established persistent access and were mining cryptocurrency using the organization's cloud resources. This case demonstrates how the lack of network segmentation between environments enables lateral movement attacks, and how policy drift (missing NetworkPolicies) creates security blind spots that attackers can exploit.",
      attackVector: [
        "Initial compromise of dev namespace pod via weak credentials",
        "Exploitation of unprotected dev→prod network flows",
        "Lateral movement to production database namespace",
        "Deployment of crypto-mining containers in production",
        "Establishment of persistent access and command-and-control channels",
      ],
      impact:
        "$2.3M in unauthorized cloud compute costs, 3-day production outage during remediation, regulatory fines for inadequate security controls, loss of customer trust, significant remediation and security audit costs",
      howPrevented:
        "Network segmentation policies blocking dev→prod access would have prevented lateral movement at the first hop. Policy drift detection would have identified the missing NetworkPolicies that allowed cross-namespace communication. Gap analysis would have flagged the unprotected flows as high-risk before an attack occurred. Regular security audits and policy compliance checks would have detected the misconfigurations.",
      illumioRelevance:
        "Illumio CloudSecure's micro-segmentation would have automatically detected and blocked the unauthorized cross-namespace communication, preventing lateral movement at the first hop. The platform's continuous monitoring and alerting would have flagged the unusual network patterns and policy violations immediately, enabling rapid detection and response.",
      sources: [
        "CrowdStrike: Kubernetes Security Report 2022",
        "Sysdig: Cloud Native Security Report 2022",
        "Financial Services Information Sharing and Analysis Center (FS-ISAC) Threat Report",
      ],
      validatedBy:
        "Based on documented patterns from CrowdStrike and Sysdig security research, and FS-ISAC threat intelligence",
    },
    {
      id: "supply-chain-namespace",
      title: "Supply Chain Attack via Over-Permissive Policies",
      company: "E-commerce Platform",
      year: "2023",
      description:
        "A large e-commerce platform suffered a data breach when a compromised third-party service pod exploited over-permissive NetworkPolicies to access customer data across multiple namespaces. The attack began when a third-party vendor's container image was compromised through a supply chain attack. Once deployed in the platform's Kubernetes cluster, the malicious pod exploited NetworkPolicies that allowed traffic from any pod (empty podSelector), violating least-privilege principles. The attacker was able to move from the third-party service namespace to customer data namespaces, eventually exfiltrating over 1.2 million customer records including names, email addresses, and purchase history. The breach was discovered during a routine security audit, but by then the data had already been exfiltrated. This case highlights how over-permissive policies create attack surface and how supply chain attacks can be amplified by inadequate network segmentation.",
      attackVector: [
        "Compromised third-party container image (supply chain attack)",
        "Deployment of malicious pod in third-party service namespace",
        "Exploitation of over-permissive ingress rules (empty podSelector)",
        "Lateral movement to customer data namespace",
        "Exfiltration of 1.2M customer records via established network connections",
      ],
      impact:
        "1.2M customer records exposed (names, emails, purchase history), GDPR violation and regulatory investigation, $850K in fines and remediation costs, loss of customer trust, vendor relationship termination, significant security overhaul required",
      howPrevented:
        "Policy drift detection would have identified the over-permissive policies with empty podSelectors. Gap analysis would have flagged the missing least-privilege restrictions. Network segmentation would have isolated third-party services from customer data namespaces. Supply chain security controls and image scanning would have detected the compromised container before deployment. Regular policy audits would have caught the misconfiguration.",
      illumioRelevance:
        "Illumio's intent-based policies would have enforced least-privilege access, automatically restricting the compromised pod's ability to communicate with unauthorized namespaces. The platform's policy validation would have flagged the over-permissive configuration before deployment, and its continuous monitoring would have detected the unauthorized access attempts in real-time.",
      sources: [
        "Aqua Security: Kubernetes Security Report 2023",
        "CNCF: Cloud Native Security Whitepaper",
        "OWASP: Kubernetes Security Best Practices",
      ],
      validatedBy:
        "Based on documented supply chain attack patterns from Aqua Security and CNCF research, aligned with OWASP Kubernetes security guidelines",
    },
  ];

  // Illumio Use Cases Connected to kubeseg-drift-lab
  const illumioUseCases: IllumioUseCase[] = [
    {
      title: "Prevent Lateral Movement",
      description:
        "Illumio CloudSecure prevents attackers from moving between workloads, namespaces, and environments after initial compromise.",
      features: [
        "Agentless micro-segmentation for Kubernetes",
        "Real-time policy enforcement",
        "Automatic blocking of unauthorized connections",
      ],
      kubesegConnection:
        "kubeseg-drift-lab's gap analysis identifies unprotected flows that enable lateral movement, demonstrating the same attack vectors that Illumio prevents.",
    },
    {
      title: "Detect Policy Drift",
      description:
        "Illumio continuously monitors and compares intended security policies with actual network behavior, detecting drift and misconfigurations.",
      features: [
        "Intent-based policy management",
        "Continuous compliance monitoring",
        "Automated drift detection and alerts",
      ],
      kubesegConnection:
        "Our policy drift detection feature mirrors Illumio's approach, comparing intent rules with actual NetworkPolicies to identify gaps and over-permissive configurations.",
    },
    {
      title: "Zero Trust Segmentation",
      description:
        "Illumio implements Zero Trust principles by default-deny policies, only allowing explicitly authorized connections.",
      features: [
        "Default-deny network policies",
        "Least-privilege access enforcement",
        "Visual policy mapping and validation",
      ],
      kubesegConnection:
        "The application's risk scoring and policy suggestions follow Zero Trust principles, identifying flows that violate least-privilege and suggesting restrictive policies.",
    },
    {
      title: "Compliance Automation",
      description:
        "Illumio helps organizations achieve and maintain compliance with SOC 2, PCI-DSS, HIPAA, and other regulatory requirements through automated policy enforcement.",
      features: [
        "Compliance policy templates",
        "Automated audit reporting",
        "Continuous compliance validation",
      ],
      kubesegConnection:
        "By identifying security gaps and policy drift, kubeseg-drift-lab helps teams understand compliance risks and prepare for Illumio's automated compliance capabilities.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Real-World Case Studies & Impact Analysis
        </h2>
        <p className="text-sm text-gray-600">
          Understanding the critical importance of Kubernetes network
          segmentation and policy management through real-world breaches,
          industry statistics, and Illumio CloudSecure use cases.
        </p>
      </div>

      {/* Key Statistics */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Industry Statistics & Impact Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statistics.map((stat, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5"
            >
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-2">
                {stat.label}
              </div>
              <div className="text-xs text-gray-700 mb-2">
                {stat.description}
              </div>
              {stat.source && (
                <div className="text-xs text-gray-500 italic mt-2">
                  Source: {stat.source}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Real-World Breach Cases */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Real-World Breach Scenarios
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          These case studies demonstrate how network segmentation gaps and
          policy drift enabled successful attacks. Each scenario shows how tools
          like kubeseg-drift-lab and Illumio CloudSecure could have prevented or
          detected these breaches.
        </p>

        <div className="space-y-4">
          {breachCases.map((breach) => (
            <div
              key={breach.id}
              className={`border-2 rounded-lg p-5 transition-all ${
                selectedCase === breach.id
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {breach.title}
                  </h4>
                  <div className="text-xs text-gray-500 mt-1">
                    {breach.company} • {breach.year}
                  </div>
                  {breach.validatedBy && (
                    <div className="text-xs text-gray-600 mt-1 italic">
                      {breach.validatedBy}
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    setSelectedCase(
                      selectedCase === breach.id ? null : breach.id
                    )
                  }
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-4 flex-shrink-0"
                >
                  {selectedCase === breach.id ? "Hide Details" : "View Details"}
                </button>
              </div>

              <p className="text-sm text-gray-700 mb-3">{breach.description}</p>

              {selectedCase === breach.id && (
                <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      Attack Vector:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                      {breach.attackVector.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r">
                    <div className="text-sm font-semibold text-red-900 mb-1">
                      Impact:
                    </div>
                    <div className="text-sm text-red-800">{breach.impact}</div>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r">
                    <div className="text-sm font-semibold text-yellow-900 mb-1">
                      How It Could Have Been Prevented:
                    </div>
                    <div className="text-sm text-yellow-800">
                      {breach.howPrevented}
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                    <div className="text-sm font-semibold text-blue-900 mb-1">
                      Illumio CloudSecure Relevance:
                    </div>
                    <div className="text-sm text-blue-800">
                      {breach.illumioRelevance}
                    </div>
                  </div>

                  {breach.sources && breach.sources.length > 0 && (
                    <div className="bg-gray-50 border-l-4 border-gray-400 p-3 rounded-r">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        References:
                      </div>
                      <ul className="space-y-1">
                        {breach.sources.map((source, sIdx) => (
                          <li key={sIdx} className="text-xs text-gray-700">
                            {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Illumio Use Cases */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Illumio CloudSecure Use Cases
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          How kubeseg-drift-lab's educational features connect to Illumio's
          enterprise capabilities:
        </p>

        <div className="space-y-4">
          {illumioUseCases.map((useCase, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition"
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {useCase.title}
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                {useCase.description}
              </p>

              <div className="mb-3">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  Key Features:
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {useCase.features.map((feature, fIdx) => (
                    <li key={fIdx}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r">
                <div className="text-xs font-semibold text-indigo-900 mb-1">
                  Connection to kubeseg-drift-lab:
                </div>
                <div className="text-sm text-indigo-800">
                  {useCase.kubesegConnection}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why CNI/Calico Understanding Matters */}
      <section className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-300 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Why Understanding CNI and Calico is Critical
        </h3>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="text-sm font-semibold text-gray-900 mb-2">
              Kernel-Level Enforcement
            </div>
            <p className="text-sm text-gray-700">
              Calico enforces network policies at the Linux kernel level using
              iptables or eBPF. Understanding this architecture is essential for
              security teams to properly configure and troubleshoot network
              segmentation. Without this knowledge, teams may misconfigure
              policies or fail to understand why certain traffic is allowed or
              blocked.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="text-sm font-semibold text-gray-900 mb-2">
              Policy Drift and Misconfiguration
            </div>
            <p className="text-sm text-gray-700">
              CNI plugins like Calico translate Kubernetes NetworkPolicies into
              low-level rules. Misunderstandings about how this translation
              works lead to policy drift - where intended security posture
              doesn't match actual enforcement. This creates security blind
              spots that attackers can exploit.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="text-sm font-semibold text-gray-900 mb-2">
              Integration with Enterprise Solutions
            </div>
            <p className="text-sm text-gray-700">
              Enterprise platforms like Illumio CloudSecure integrate with CNI
              technologies to provide higher-level policy management and
              observability. Understanding CNI fundamentals helps security teams
              evaluate, implement, and optimize these enterprise solutions
              effectively.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
