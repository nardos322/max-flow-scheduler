#pragma once
#include <vector>
#include <scheduler/flow_network.hpp>
#include <scheduler/graph_builder.hpp>
#include <scheduler/solver.hpp>

namespace scheduler {

struct ExtractionResult {
  std::vector<Assignment> assignments;
  std::vector<std::string> uncovered_days;
};

ExtractionResult ExtractAssignmentsAndCoverage(
    const FlowNetwork& network,
    const std::vector<AssignmentEdgeRef>& assignment_edges,
    const std::vector<DayDemandRef>& day_edges);

}  // namespace scheduler
