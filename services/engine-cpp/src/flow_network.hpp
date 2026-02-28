#pragma once

#include <vector>

namespace scheduler {

struct Edge {
  int to;
  int rev;
  int capacity;
  int original_capacity;
};

class FlowNetwork {
 public:
  explicit FlowNetwork(int node_count);

  int AddEdge(int from, int to, int capacity);
  int MaxFlow(int source, int sink);

  const Edge& GetEdge(int from, int edge_index) const;

 private:
  std::vector<std::vector<Edge>> adjacency_;
};

}  // namespace scheduler
