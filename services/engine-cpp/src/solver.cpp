#include <scheduler/solver.hpp>

#include <algorithm>
#include <exception>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include <scheduler/flow_network.hpp>
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

  std::unordered_map<std::string, int> doctor_index;
  std::unordered_map<std::string, int> period_index;
  std::unordered_map<std::string, int> day_index;

  for (int i = 0; i < static_cast<int>(input.doctors.size()); ++i) {
    doctor_index[input.doctors[i].id] = i;
  }
  for (int i = 0; i < static_cast<int>(input.periods.size()); ++i) {
    period_index[input.periods[i].id] = i;
  }
  for (int i = 0; i < static_cast<int>(input.demands.size()); ++i) {
    day_index[input.demands[i].day_id] = i;
  }

  std::vector<std::unordered_set<std::string>> period_days(input.periods.size());
  for (int i = 0; i < static_cast<int>(input.periods.size()); ++i) {
    for (const std::string& day : input.periods[i].day_ids) {
      period_days[i].insert(day);
    }
  }

  const int source = 0;
  const int doctor_offset = 1;
  const int doctor_period_offset = doctor_offset + static_cast<int>(input.doctors.size());
  const int doctor_period_count = static_cast<int>(input.doctors.size() * input.periods.size());
  const int day_offset = doctor_period_offset + doctor_period_count;
  const int sink = day_offset + static_cast<int>(input.demands.size());
  const int node_count = sink + 1;

  auto doctor_node = [&](int doctor_id) { return doctor_offset + doctor_id; };
  auto doctor_period_node = [&](int doctor_id, int period_id) {
    return doctor_period_offset + doctor_id * static_cast<int>(input.periods.size()) + period_id;
  };
  auto day_node = [&](int demand_id) { return day_offset + demand_id; };

  FlowNetwork network(node_count);

  for (int i = 0; i < static_cast<int>(input.doctors.size()); ++i) {
    network.AddEdge(source, doctor_node(i), std::max(0, input.doctors[i].max_total_days));
  }

  for (int i = 0; i < static_cast<int>(input.doctors.size()); ++i) {
    for (int k = 0; k < static_cast<int>(input.periods.size()); ++k) {
      network.AddEdge(doctor_node(i), doctor_period_node(i, k), 1);
    }
  }

  struct AssignmentEdgeRef {
    int from;
    int edge_index;
    Assignment assignment;
  };

  std::vector<AssignmentEdgeRef> assignment_edges;
  for (const Availability& available : input.availability) {
    const auto doctor_it = doctor_index.find(available.doctor_id);
    const auto period_it = period_index.find(available.period_id);
    const auto day_it = day_index.find(available.day_id);
    if (doctor_it == doctor_index.end() || period_it == period_index.end() || day_it == day_index.end()) {
      continue;
    }

    const int period_pos = period_it->second;
    if (period_days[period_pos].find(available.day_id) == period_days[period_pos].end()) {
      continue;
    }

    const int from = doctor_period_node(doctor_it->second, period_pos);
    const int to = day_node(day_it->second);
    const int edge_index = network.AddEdge(from, to, 1);

    assignment_edges.push_back(AssignmentEdgeRef{
        from,
        edge_index,
        Assignment{available.doctor_id, available.day_id, available.period_id},
    });
  }

  int total_demand = 0;
  struct DayDemandRef {
    int from;
    int edge_index;
    std::string day_id;
    int required;
  };
  std::vector<DayDemandRef> day_edges;

  for (int i = 0; i < static_cast<int>(input.demands.size()); ++i) {
    const int required = std::max(0, input.demands[i].required_doctors);
    const int from = day_node(i);
    const int edge_index = network.AddEdge(from, sink, required);
    total_demand += required;

    day_edges.push_back(DayDemandRef{from, edge_index, input.demands[i].day_id, required});
  }

  const int max_flow = network.MaxFlow(source, sink);

  SolveResult result;
  result.is_feasible = (max_flow == total_demand);
  result.contract_version = input.contract_version;

  for (const AssignmentEdgeRef& edge_ref : assignment_edges) {
    const Edge& edge = network.GetEdge(edge_ref.from, edge_ref.edge_index);
    const int flow = edge.original_capacity - edge.capacity;
    if (flow > 0) {
      result.assignments.push_back(edge_ref.assignment);
    }
  }

  result.assigned_count = static_cast<int>(result.assignments.size());

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
