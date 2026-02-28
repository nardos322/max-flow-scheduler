#pragma once

#include <string>
#include <vector>

#include <scheduler/flow_network.hpp>
#include <scheduler/problem_input.hpp>
#include <scheduler/solver.hpp>

namespace scheduler {

struct AssignmentEdgeRef {
  int from;
  int edge_index;
  Assignment assignment;
};

struct DayDemandRef {
  int from;
  int edge_index;
  std::string day_id;
  int required;
};

struct GraphBuildResult {
  FlowNetwork network;
  int source;
  int sink;
  int total_demand;
  std::vector<AssignmentEdgeRef> assignment_edges;
  std::vector<DayDemandRef> day_edges;
};

GraphBuildResult BuildFlowGraph(const ProblemInput& input);

}  // namespace scheduler
