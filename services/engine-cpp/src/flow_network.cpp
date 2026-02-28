#include <scheduler/flow_network.hpp>
#include <algorithm>
#include <limits>
#include <queue>
#include <vector>

namespace scheduler {

FlowNetwork::FlowNetwork(int node_count) : adjacency_(node_count) {}

int FlowNetwork::AddEdge(int from, int to, int capacity) {
  Edge forward{to, static_cast<int>(adjacency_[to].size()), capacity, capacity};
  Edge backward{from, static_cast<int>(adjacency_[from].size()), 0, 0};
  adjacency_[from].push_back(forward);
  adjacency_[to].push_back(backward);
  return static_cast<int>(adjacency_[from].size()) - 1;
}

int FlowNetwork::MaxFlow(int source, int sink) {
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

const Edge& FlowNetwork::GetEdge(int from, int edge_index) const { return adjacency_[from][edge_index]; }

}  // namespace scheduler
