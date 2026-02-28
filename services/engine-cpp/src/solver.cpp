#include <scheduler/solver.hpp>

#include <exception>
#include <string>

#include <scheduler/assignment_extractor.hpp>
#include <scheduler/graph_builder.hpp>
#include <scheduler/problem_input.hpp>

namespace scheduler {

SolveResult Solve(const std::string& input_json) {
  SolveResult fallback{false, 0, {}, {}, "1.0"};

  ProblemInput input;
  try {
    input = ParseProblemInput(input_json);
  } catch (const std::exception&) {
    return fallback;
  }

  fallback.contract_version = input.contract_version;

  if (input.demands.empty() || input.doctors.empty()) {
    return fallback;
  }

  GraphBuildResult graph = BuildFlowGraph(input);
  const int max_flow = graph.network.MaxFlow(graph.source, graph.sink);

  const ExtractionResult extraction =
      ExtractAssignmentsAndCoverage(graph.network, graph.assignment_edges, graph.day_edges);

  SolveResult result;
  result.is_feasible = (max_flow == graph.total_demand);
  result.contract_version = input.contract_version;
  result.assignments = extraction.assignments;
  result.uncovered_days = extraction.uncovered_days;
  result.assigned_count = static_cast<int>(result.assignments.size());

  return result;
}

}  // namespace scheduler
