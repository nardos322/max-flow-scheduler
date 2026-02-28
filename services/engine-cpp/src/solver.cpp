#include "solver.hpp"
#include <algorithm>
#include <limits>
#include <queue>
#include <string>
#include <unordered_map>
#include <unordered_set>

#include <vector>

#include <nlohmann/json.hpp>

namespace scheduler {
namespace {

using nlohmann::json;

struct Doctor {
  std::string id;
  int max_total_days = 0;
};

struct Period {
  std::string id;
  std::vector<std::string> day_ids;
};

struct Demand {
  std::string day_id;
  int required_doctors = 0;
};

struct Availability {
  std::string doctor_id;
  std::string period_id;
  std::string day_id;
};

struct ProblemInput {
  std::string contract_version = "1.0";
  std::vector<Doctor> doctors;
  std::vector<Period> periods;
  std::vector<Demand> demands;
  std::vector<Availability> availability;
};

ProblemInput DecodeInput(const std::string& input_json) {
  const json root = json::parse(input_json);
  ProblemInput problem;

  if (root.contains("contractVersion") && root["contractVersion"].is_string()) {
    problem.contract_version = root["contractVersion"].get<std::string>();
  }

  const json& doctors = root.at("doctors");
  for (const auto& doctor : doctors) {
    problem.doctors.push_back(Doctor{
        doctor.at("id").get<std::string>(),
        doctor.at("maxTotalDays").get<int>(),
    });
  }

  const json& periods = root.at("periods");
  for (const auto& period : periods) {
    problem.periods.push_back(Period{
        period.at("id").get<std::string>(),
        period.at("dayIds").get<std::vector<std::string>>(),
    });
  }

  const json& demands = root.at("demands");
  for (const auto& demand : demands) {
    problem.demands.push_back(Demand{
        demand.at("dayId").get<std::string>(),
        demand.at("requiredDoctors").get<int>(),
    });
  }

  const json& availability = root.at("availability");
  for (const auto& item : availability) {
    problem.availability.push_back(Availability{
        item.at("doctorId").get<std::string>(),
        item.at("periodId").get<std::string>(),
        item.at("dayId").get<std::string>(),
    });
  }

  return problem;
}

struct Edge {
  int to;
  int rev;
  int capacity;
  int original_capacity;
};

class FlowNetwork {
 public:
  explicit FlowNetwork(int node_count) : adjacency_(node_count) {}

  int AddEdge(int from, int to, int capacity) {
    Edge forward{to, static_cast<int>(adjacency_[to].size()), capacity, capacity};
    Edge backward{from, static_cast<int>(adjacency_[from].size()), 0, 0};
    adjacency_[from].push_back(forward);
    adjacency_[to].push_back(backward);
    return static_cast<int>(adjacency_[from].size()) - 1;
  }

  int MaxFlow(int source, int sink) {
    int total_flow = 0;

    while (true) {
      std::vector<int> parent_node(adjacency_.size(), -1);
      std::vector<int> parent_edge(adjacency_.size(), -1);
      std::queue<int> bfs_queue;

      parent_node[source] = source;
      bfs_queue.push(source);

      while (!bfs_queue.empty() && parent_node[sink] == -1) {
        int current = bfs_queue.front();
        bfs_queue.pop();

        for (int edge_index = 0; edge_index < static_cast<int>(adjacency_[current].size()); ++edge_index) {
          const Edge& edge = adjacency_[current][edge_index];
          if (parent_node[edge.to] != -1 || edge.capacity <= 0) {
            continue;
          }

          parent_node[edge.to] = current;
          parent_edge[edge.to] = edge_index;
          bfs_queue.push(edge.to);

          if (edge.to == sink) {
            break;
          }
        }
      }

      if (parent_node[sink] == -1) {
        break;
      }

      int path_flow = std::numeric_limits<int>::max();
      for (int node = sink; node != source; node = parent_node[node]) {
        const int prev = parent_node[node];
        const int edge_index = parent_edge[node];
        path_flow = std::min(path_flow, adjacency_[prev][edge_index].capacity);
      }

      for (int node = sink; node != source; node = parent_node[node]) {
        const int prev = parent_node[node];
        const int edge_index = parent_edge[node];
        Edge& forward = adjacency_[prev][edge_index];
        Edge& backward = adjacency_[node][forward.rev];
        forward.capacity -= path_flow;
        backward.capacity += path_flow;
      }

      total_flow += path_flow;
    }

    return total_flow;
  }

  const Edge& GetEdge(int from, int edge_index) const { return adjacency_[from][edge_index]; }

 private:
  std::vector<std::vector<Edge>> adjacency_;
};

}  // namespace

SolveResult Solve(const std::string& input_json) {
  SolveResult fallback{false, 0, {}, {}, "1.0"};

  ProblemInput input;
  try {
    input = DecodeInput(input_json);
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
