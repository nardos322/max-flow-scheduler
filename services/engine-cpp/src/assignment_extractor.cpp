#include <scheduler/assignment_extractor.hpp>

namespace scheduler {

ExtractionResult ExtractAssignmentsAndCoverage(
    const FlowNetwork& network,
    const std::vector<AssignmentEdgeRef>& assignment_edges,
    const std::vector<DayDemandRef>& day_edges) {
  ExtractionResult result;

  for (const AssignmentEdgeRef& edge_ref : assignment_edges) {
    const Edge& edge = network.GetEdge(edge_ref.from, edge_ref.edge_index);
    const int flow = edge.original_capacity - edge.capacity;
    if (flow > 0) {
      result.assignments.push_back(edge_ref.assignment);
    }
  }

  for (const DayDemandRef& day_ref : day_edges) {
    const Edge& edge = network.GetEdge(day_ref.from, day_ref.edge_index);
    const int covered = edge.original_capacity - edge.capacity;
    if (covered < day_ref.required) {
      result.uncovered_days.push_back(day_ref.day_id);
    }
  }

  return result;
}

}  // namespace scheduler
