#include <scheduler/graph_builder.hpp>

#include <algorithm>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace scheduler {

GraphBuildResult BuildFlowGraph(const ProblemInput& input) {
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

  GraphBuildResult build_result{
      FlowNetwork(node_count),
      source,
      sink,
      0,
      {},
      {},
  };

  for (int i = 0; i < static_cast<int>(input.doctors.size()); ++i) {
    build_result.network.AddEdge(source, doctor_node(i), std::max(0, input.doctors[i].max_total_days));
  }

  for (int i = 0; i < static_cast<int>(input.doctors.size()); ++i) {
    for (int k = 0; k < static_cast<int>(input.periods.size()); ++k) {
      build_result.network.AddEdge(doctor_node(i), doctor_period_node(i, k), 1);
    }
  }

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
    const int edge_index = build_result.network.AddEdge(from, to, 1);

    build_result.assignment_edges.push_back(AssignmentEdgeRef{
        from,
        edge_index,
        Assignment{available.doctor_id, available.day_id, available.period_id},
    });
  }

  for (int i = 0; i < static_cast<int>(input.demands.size()); ++i) {
    const int required = std::max(0, input.demands[i].required_doctors);
    const int from = day_node(i);
    const int edge_index = build_result.network.AddEdge(from, sink, required);
    build_result.total_demand += required;

    build_result.day_edges.push_back(DayDemandRef{from, edge_index, input.demands[i].day_id, required});
  }

  return build_result;
}

}  // namespace scheduler
